import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Leaf, Fish, Sparkles, ScanLine, Stethoscope, ShieldCheck, RotateCcw, Layers, History, LogOut, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { ScanReport, type Report } from "@/components/ScanReport";
import { ChatBot } from "@/components/ChatBot";
import { ImageCropper } from "@/components/ImageCropper";
import { ScanHub } from "@/components/ScanHub";
import { EmergencySymptoms, type SymptomItem } from "@/components/EmergencySymptoms";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuth, signOut } from "@/hooks/useAuth";
import { saveScan } from "@/lib/saveScan";
import heroImage from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BioScan AI — Identify & Diagnose Plants and Fish Instantly" },
      { name: "description", content: "Premium AI-powered scanner that identifies plants and fish, diagnoses diseases, and gives expert care guides from a single photo." },
      { property: "og:title", content: "BioScan AI — Identify & Diagnose Plants and Fish" },
      { property: "og:description", content: "Snap a photo. Get instant species ID, disease diagnosis, and care guidance powered by AI." },
    ],
    links: [{ rel: "manifest", href: "/manifest.webmanifest" }],
  }),
  component: Index,
});

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function compressDataUrl(dataUrl: string, max = 1600, quality = 0.88): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("canvas error"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [rawImage, setRawImage] = useState<string | null>(null); // before crop
  const [image, setImage] = useState<string | null>(null);       // analyzed crop
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Report[] | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [chatOpenSignal, setChatOpenSignal] = useState(0);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [tab, setTab] = useState<"home" | "scan" | "symptoms" | "chat" | "history">("home");

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setSubjects(null);
    setImage(null);
    try {
      const raw = await readFileAsDataURL(file);
      const sized = await compressDataUrl(raw, 1920, 0.92);
      setRawImage(sized);
    } catch (e) {
      console.error(e);
      toast.error("Could not read image");
    }
  }, []);

  const runAnalysis = useCallback(async (cropped: string) => {
    setRawImage(null);
    setLoading(true);
    setImage(cropped);
    try {
      const { data, error } = await supabase.functions.invoke("analyze", {
        body: { image: cropped },
      });
      if (error) {
        const status = (error as any)?.context?.status;
        const msg = status === 429
          ? "Too many requests. Please wait a moment."
          : status === 402
          ? "AI credits exhausted. Add credits in your workspace."
          : "Analysis failed. Please try again.";
        toast.error(msg);
        return;
      }
      const list: Report[] = data?.subjects?.length ? data.subjects : (data?.report ? [data.report] : []);
      if (list.length) {
        setSubjects(list);
        setActiveIdx(0);
        toast.success(list.length > 1 ? `Found ${list.length} subjects` : "Analysis complete");
        setTimeout(() => document.getElementById("report")?.scrollIntoView({ behavior: "smooth" }), 100);
        if (user) {
          saveScan({ userId: user.id, imageDataUrl: cropped, subjects: list })
            .then(() => toast.success("Saved to your history"))
            .catch((e) => console.error("saveScan failed", e));
        }
      } else if (data?.error) {
        toast.error(data.error);
      } else {
        toast.error("Couldn't identify anything in this image.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const reset = () => { setImage(null); setSubjects(null); setRawImage(null); };

  const chatContext = useMemo(() => {
    if (!subjects?.length) return null;
    return subjects.map((s, i) => {
      const diseases = s.diseases?.map(d => `${d.name} (${d.severity})`).join(", ") || "none detected";
      return `Subject ${i + 1}: ${s.commonName} (${s.scientificName}) — ${s.kind}. Health: ${s.healthScore}/100. Issues: ${diseases}.`;
    }).join("\n");
  }, [subjects]);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleNav = (t: "home" | "scan" | "symptoms" | "chat" | "history") => {
    setTab(t);
    if (t === "home") window.scrollTo({ top: 0, behavior: "smooth" });
    if (t === "scan") scrollTo("scan-hub");
    if (t === "symptoms") scrollTo("symptoms");
    if (t === "chat") setChatOpenSignal((n) => n + 1);
    if (t === "history") navigate({ to: user ? "/history" : "/login" });
  };

  const askSymptom = (s: SymptomItem) => {
    setPendingPrompt(s.prompt);
    toast.success(`Asking AI about: ${s.label}`);
  };

  return (
    <div className="min-h-screen pb-safe-nav md:pb-0">
      <Toaster theme="dark" position="top-center" />

      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">BioScan<span className="text-gradient">AI</span></span>
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/history" className="glass px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 hover:shadow-glow transition">
                <History className="w-3.5 h-3.5 text-primary" /> History
              </Link>
              <button onClick={() => signOut()} className="glass px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5" aria-label="Sign out">
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="glass px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 hover:shadow-glow transition">
              <UserIcon className="w-3.5 h-3.5 text-primary" /> Sign in
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-8 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 text-primary" />
              Powered by advanced AI vision
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
              Snap a photo.<br />
              <span className="text-gradient">Diagnose anything</span><br />
              that grows or swims.
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Identify thousands of plants and fish in seconds. Get expert disease diagnosis, treatment plans and care guides from a single image — even when several subjects share the frame.
            </p>
            <div id="scan-hub" className="pt-1">
              <ScanHub
                onCamera={() => cameraRef.current?.click()}
                onUpload={() => fileRef.current?.click()}
              />
            </div>
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5 text-primary" /> 10,000+ species</span>
              <span className="flex items-center gap-1.5"><Fish className="w-3.5 h-3.5 text-[oklch(0.78_0.14_215)]" /> Freshwater & saltwater</span>
              <span className="flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5 text-[oklch(0.7_0.18_290)]" /> Disease diagnosis</span>
              <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-primary" /> Multi-subject</span>
            </div>
          </div>

          <div className="relative animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="absolute -inset-8 bg-gradient-hero opacity-20 blur-3xl rounded-full" />
            <div className="relative glass rounded-3xl overflow-hidden shadow-glow animate-float">
              <img src={heroImage} alt="Plant and fish AI scan" width={1536} height={1024} className="w-full h-auto" />
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent shadow-glow animate-scan" />
              </div>
              <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5">
                <ScanLine className="w-3 h-3 text-primary" /> Scanning…
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scan area */}
      <section className="container mx-auto px-4 pb-20">
        <Card
          className="glass p-6 md:p-10 relative overflow-hidden"
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
        >
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

          {!rawImage && !image && !loading && (
            <div className="text-center py-10 space-y-4">
              <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-glow animate-pulse-glow">
                <ScanLine className="w-10 h-10 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Drop a photo to scan</h2>
                <p className="text-muted-foreground text-sm mt-1">Camera opens to the rear lens. You can crop before scanning.</p>
              </div>
            </div>
          )}

          {rawImage && !loading && (
            <ImageCropper
              src={rawImage}
              onCancel={reset}
              onConfirm={(cropped) => runAnalysis(cropped)}
            />
          )}

          {(image || loading) && !rawImage && (
            <div className="space-y-6">
              <div className="relative mx-auto max-w-md aspect-square rounded-2xl overflow-hidden glass">
                {image && <img src={image} alt="Subject" className="w-full h-full object-cover" />}
                {loading && (
                  <>
                    <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-glow animate-scan" />
                    {/* Radar sweep */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-8 rounded-full border border-primary/30" />
                      <div className="absolute inset-16 rounded-full border border-primary/20" />
                      <div className="absolute inset-24 rounded-full border border-primary/10" />
                      <div className="absolute inset-0 animate-radar">
                        <div
                          className="absolute top-1/2 left-1/2 w-1/2 h-1 origin-left"
                          style={{ background: "linear-gradient(90deg, oklch(0.78 0.18 165 / 0.7), transparent)" }}
                        />
                      </div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-glow">
                        <span className="absolute inset-0 rounded-full bg-primary animate-ring" />
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-1">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> AI Vision Analyzing…
                      </div>
                      <div className="text-[11px] text-muted-foreground">Identifying species · Checking health · Building care plan</div>
                    </div>
                  </>
                )}
              </div>
              {!loading && (
                <div className="flex justify-center gap-3">
                  <Button variant="outline" onClick={reset} className="glass"><RotateCcw className="w-4 h-4" /> New scan</Button>
                </div>
              )}
            </div>
          )}
        </Card>

        {subjects && subjects.length > 0 && image && (
          <div id="report" className="mt-10 space-y-6">
            {subjects.length > 1 && (
              <Card className="glass p-4">
                <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                  <Layers className="w-4 h-4 text-primary" />
                  {subjects.length} subjects detected — tap to view each
                </div>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIdx(i)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition ${
                        i === activeIdx
                          ? "bg-gradient-hero text-primary-foreground border-transparent shadow-glow"
                          : "glass border-primary/20 hover:border-primary/40"
                      }`}
                    >
                      <span className="font-semibold">#{i + 1}</span> · {s.commonName}
                    </button>
                  ))}
                </div>
              </Card>
            )}
            <ScanReport report={subjects[activeIdx]} image={image} />
          </div>
        )}

        {/* Emergency Symptoms — always available */}
        <div id="symptoms" className="mt-12">
          <EmergencySymptoms onAsk={askSymptom} />
        </div>

        {/* Features */}
        {!subjects && (
          <div className="grid md:grid-cols-3 gap-4 mt-12">
            <Feature icon={Leaf} title="Plant identification" desc="Houseplants, garden plants, trees, flowers, herbs, succulents and more." color="text-primary" />
            <Feature icon={Fish} title="Fish identification" desc="Freshwater, saltwater, aquarium and pond species across the globe." color="text-[oklch(0.78_0.14_215)]" />
            <Feature icon={Stethoscope} title="Disease diagnosis" desc="Pinpoint pests, infections, deficiencies — with treatment plans." color="text-[oklch(0.7_0.18_290)]" />
            <Feature icon={Layers} title="Multi-subject scans" desc="Several plants or fish in one frame? Each one gets its own report." color="text-primary" />
            <Feature icon={ShieldCheck} title="Care plans" desc="Tailored watering, light, feeding and tank parameters per species." color="text-[oklch(0.78_0.14_215)]" />
            <Feature icon={Sparkles} title="AI assistant" desc="Ask follow-up questions — your scan image is auto-attached." color="text-[oklch(0.7_0.18_290)]" />
          </div>
        )}
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        BioScan AI · Identifications are for guidance — consult an expert for critical decisions.
      </footer>
      <ChatBot
        image={image}
        context={chatContext}
        openSignal={chatOpenSignal}
        pendingPrompt={pendingPrompt}
        onPromptConsumed={() => setPendingPrompt(null)}
      />
      <MobileBottomNav active={tab} onChange={handleNav} />
    </div>
  );
}

function Feature({ icon: Icon, title, desc, color }: { icon: any; title: string; desc: string; color: string }) {
  return (
    <Card className="glass p-5 space-y-2 hover:shadow-glow transition-shadow">
      <Icon className={`w-6 h-6 ${color}`} />
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </Card>
  );
}
