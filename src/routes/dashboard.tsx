import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { Loader2, ArrowLeft, Sparkles, Activity, Heart, Flame, Layers, Leaf, Fish, TrendingUp } from "lucide-react";
import { resolveScanImageUrls } from "@/lib/scanImage";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — BioScan AI" }] }),
  component: DashboardPage,
});

type Row = { id: string; scan_type: string; title: string | null; image_url: string | null; health_score: number | null; created_at: string; resolved_url?: string | null };

function computeStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const days = new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10)));
  let streak = 0;
  const cur = new Date();
  for (;;) {
    const key = cur.toISOString().slice(0, 10);
    if (days.has(key)) { streak++; cur.setDate(cur.getDate() - 1); }
    else break;
  }
  return streak;
}

function DashboardPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/login" }); return; }
    supabase.from("scans").select("id,scan_type,title,image_url,health_score,created_at")
      .order("created_at", { ascending: false })
      .then(async ({ data }) => setRows((await resolveScanImageUrls((data as Row[]) ?? [])) as Row[]));
  }, [user, loading, nav]);

  if (!rows) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const total = rows.length;
  const plants = rows.filter((r) => r.scan_type === "plant").length;
  const fish = rows.filter((r) => r.scan_type === "fish").length;
  const healthy = rows.filter((r) => (r.health_score ?? 0) >= 75).length;
  const avgHealth = total ? Math.round(rows.reduce((a, r) => a + (r.health_score ?? 0), 0) / total) : 0;
  const streak = computeStreak(rows.map((r) => r.created_at));
  const recent = rows.slice(0, 6);

  return (
    <div className="min-h-screen container mx-auto px-4 py-6 max-w-4xl">
      <Toaster theme="dark" position="top-center" />
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /><span className="font-semibold">Dashboard</span></div>
      </div>

      <h1 className="text-3xl font-bold mb-2">Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}</h1>
      <p className="text-muted-foreground mb-6">Track every scan, monitor health, build your streak.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat icon={Activity} label="Total scans" value={total} color="text-primary" />
        <Stat icon={Heart} label="Avg health" value={`${avgHealth}/100`} color="text-[oklch(0.78_0.14_215)]" />
        <Stat icon={Flame} label="Day streak" value={streak} color="text-orange-400" />
        <Stat icon={TrendingUp} label="Healthy" value={`${healthy}/${total || 1}`} color="text-emerald-400" />
      </div>

      <div className="grid md:grid-cols-2 gap-3 mb-6">
        <Card className="glass p-5 flex items-center gap-4">
          <Leaf className="w-8 h-8 text-primary" />
          <div><div className="text-2xl font-bold">{plants}</div><div className="text-xs text-muted-foreground">Plants scanned</div></div>
        </Card>
        <Card className="glass p-5 flex items-center gap-4">
          <Fish className="w-8 h-8 text-[oklch(0.78_0.14_215)]" />
          <div><div className="text-2xl font-bold">{fish}</div><div className="text-xs text-muted-foreground">Fish scanned</div></div>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Layers className="w-4 h-4 text-primary" /> Recent scans</h2>
        <Link to="/history" className="text-xs text-primary hover:underline">View all →</Link>
      </div>
      {recent.length === 0 ? (
        <Card className="glass p-10 text-center text-muted-foreground">No scans yet. Take your first one!</Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recent.map((r) => (
            <Link key={r.id} to="/scan/$id" params={{ id: r.id }} className="block">
              <Card className="glass overflow-hidden hover:shadow-glow transition group">
                {r.resolved_url && <img src={r.resolved_url} alt={r.title ?? ""} className="w-full aspect-video object-cover group-hover:scale-105 transition" />}
                <div className="p-3">
                  <div className="font-semibold truncate text-sm">{r.title ?? "Untitled"}</div>
                  <div className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()} · Health {r.health_score ?? "—"}/100</div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <Card className="glass p-4">
      <Icon className={`w-5 h-5 ${color} mb-2`} />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}