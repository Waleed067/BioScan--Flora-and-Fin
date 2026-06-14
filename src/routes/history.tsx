import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Loader2, Search, Trash2, ArrowLeft, Sparkles, Leaf, Fish } from "lucide-react";
import { resolveScanImageUrls } from "@/lib/scanImage";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "Scan History — BioScan AI" }] }),
  component: HistoryPage,
});

type ScanRow = {
  id: string;
  scan_type: string;
  title: string | null;
  image_url: string | null;
  health_score: number | null;
  created_at: string;
  diagnosis: any;
  resolved_url?: string | null;
};

function HistoryPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<ScanRow[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav({ to: "/login" });
      return;
    }
    supabase
      .from("scans")
      .select("id,scan_type,title,image_url,health_score,created_at,diagnosis")
      .order("created_at", { ascending: false })
      .then(async ({ data, error }) => {
        if (error) toast.error(error.message);
        else setRows((await resolveScanImageUrls((data as ScanRow[]) ?? [])) as ScanRow[]);
      });
  }, [user, loading, nav]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("scans").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r?.filter((x) => x.id !== id) ?? null);
    toast.success("Scan deleted");
  };

  const filtered = rows?.filter((r) =>
    !q ? true : (r.title ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="min-h-screen container mx-auto px-4 py-8 max-w-3xl">
      <Toaster theme="dark" position="top-center" />
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-semibold">Your Scan History</span>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name…" className="pl-9 glass" />
      </div>

      {!rows && (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      )}

      {rows && filtered?.length === 0 && (
        <Card className="glass p-10 text-center text-muted-foreground">
          No scans yet. Take your first scan from the home page.
        </Card>
      )}

      <div className="grid gap-3">
        {filtered?.map((r) => (
          <Card key={r.id} className="glass p-3 flex items-center gap-3 hover:shadow-glow transition">
            <Link to="/scan/$id" params={{ id: r.id }} className="flex items-center gap-3 flex-1 min-w-0">
              {r.resolved_url ? (
                <img src={r.resolved_url} alt={r.title ?? "scan"} className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                  {r.scan_type === "fish" ? <Fish className="w-6 h-6" /> : <Leaf className="w-6 h-6" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{r.title ?? "Untitled"}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()} · {r.scan_type}
                  {r.health_score != null && ` · Health ${r.health_score}/100`}
                </div>
              </div>
            </Link>
            <Button size="icon" variant="ghost" onClick={() => remove(r.id)} aria-label="Delete">
              <Trash2 className="w-4 h-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}