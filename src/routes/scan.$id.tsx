import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Download, Camera, History as HistoryIcon } from "lucide-react";
import { ScanReport, type Report } from "@/components/ScanReport";
import { BeforeAfter } from "@/components/BeforeAfter";
import { exportReportPdf } from "@/lib/exportPdf";

export const Route = createFileRoute("/scan/$id")({
  head: () => ({ meta: [{ title: "Scan Detail — BioScan AI" }] }),
  component: ScanDetailPage,
});

type ScanRow = {
  id: string;
  user_id: string;
  scan_type: string;
  title: string | null;
  image_url: string | null;
  health_score: number | null;
  created_at: string;
  diagnosis: any;
  parent_scan_id?: string | null;
};

function ScanDetailPage() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [row, setRow] = useState<ScanRow | null>(null);
  const [original, setOriginal] = useState<ScanRow | null>(null);
  const [followUps, setFollowUps] = useState<ScanRow[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/login" }); return; }
    (async () => {
      const { data, error } = await supabase.from("scans").select("*").eq("id", id).maybeSingle();
      if (error || !data) { toast.error("Scan not found"); return; }
      setRow(data as ScanRow);
      const r = data as ScanRow;
      if (r.parent_scan_id) {
        const { data: parent } = await supabase.from("scans").select("*").eq("id", r.parent_scan_id).maybeSingle();
        if (parent) setOriginal(parent as ScanRow);
      }
      const rootId = r.parent_scan_id ?? r.id;
      const { data: kids } = await supabase.from("scans").select("*").eq("parent_scan_id", rootId).order("created_at");
      setFollowUps((kids as ScanRow[]) ?? []);
    })();
  }, [id, user, loading, nav]);

  if (!row) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const subjects: Report[] = (row.diagnosis?.subjects as Report[]) ?? [];
  const primary = subjects[0];

  const downloadPdf = async () => {
    if (!primary) return toast.error("No report data");
    setBusy(true);
    try { await exportReportPdf(primary, row.image_url); toast.success("PDF downloaded"); }
    catch (e) { console.error(e); toast.error("PDF export failed"); }
    finally { setBusy(false); }
  };

  const trackRecovery = () => {
    const root = row.parent_scan_id ?? row.id;
    nav({ to: "/", search: { followUp: root } as any });
  };

  const compareTarget = original ?? (followUps[0] && followUps[0].id !== row.id ? followUps[0] : null);

  return (
    <div className="min-h-screen container mx-auto px-4 py-6 max-w-4xl">
      <Toaster theme="dark" position="top-center" />
      <div className="flex items-center justify-between mb-6">
        <Link to="/history" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> History
        </Link>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="glass" onClick={downloadPdf} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF
          </Button>
          <Button size="sm" className="bg-gradient-hero text-primary-foreground" onClick={trackRecovery}>
            <Camera className="w-4 h-4" /> Track Recovery
          </Button>
        </div>
      </div>

      {row.image_url && compareTarget?.image_url && (
        <Card className="glass p-4 mb-6">
          <div className="text-sm font-semibold mb-2 flex items-center gap-2"><HistoryIcon className="w-4 h-4 text-primary" /> Recovery comparison</div>
          <BeforeAfter
            before={(original ?? compareTarget).image_url!}
            after={original ? row.image_url : compareTarget.image_url!}
            beforeLabel={`Before · ${new Date((original ?? compareTarget).created_at).toLocaleDateString()}`}
            afterLabel={`After · ${new Date((original ? row : compareTarget).created_at).toLocaleDateString()}`}
          />
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            <div className="glass rounded-lg p-2 text-center">Then: <strong>{(original ?? compareTarget).health_score ?? "—"}/100</strong></div>
            <div className="glass rounded-lg p-2 text-center">Now: <strong className="text-primary">{(original ? row : compareTarget).health_score ?? "—"}/100</strong></div>
          </div>
        </Card>
      )}

      {followUps.length > 0 && (
        <Card className="glass p-4 mb-6">
          <div className="text-sm font-semibold mb-3">Recovery timeline ({followUps.length + 1} scans)</div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[original ?? row, ...followUps.filter((f) => f.id !== (original ?? row).id)].map((s) => (
              <Link key={s.id} to="/scan/$id" params={{ id: s.id }} className={`shrink-0 ${s.id === row.id ? "ring-2 ring-primary rounded-xl" : ""}`}>
                {s.image_url && <img src={s.image_url} alt="" className="w-20 h-20 rounded-xl object-cover" />}
                <div className="text-[10px] text-center mt-1">{new Date(s.created_at).toLocaleDateString()}</div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {primary && row.image_url && <ScanReport report={primary} image={row.image_url} />}
    </div>
  );
}