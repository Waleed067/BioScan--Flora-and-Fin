import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, Loader2, Leaf, Fish, Sparkles, ScanLine, Stethoscope, ShieldCheck, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { ScanReport, type Report } from "@/components/ScanReport";
import { ChatBot } from "@/components/ChatBot";
import heroImage from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BioScan AI — Identify & Diagnose Plants and Fish Instantly" },
      { name: "description", content: "Premium AI-powered scanner that identifies plants and fish, diagnoses diseases, and gives expert care guides from a single photo." },
      { property: "og:title", content: "BioScan AI — Identify & Diagnose Plants and Fish" },
      { property: "og:description", content: "Snap a photo. Get instant species ID, disease diagnosis, and care guidance powered by AI." },
    ],
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

async function compressImage(file: File, max = 1280, quality = 0.85): Promise<string> {
  const dataUrl = await readFileAsDataURL(file);
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
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setReport(null);
    setLoading(true);
    try {
      const compressed = await compressImage(file);
      setImage(compressed);
      const { data, error } = await supabase.functions.invoke("analyze", {
        body: { image: compressed },
      });
      if (error) {
        const msg = (error as any)?.context?.status === 429
          ? "Too many requests. Please wait a moment."
          : (error as any)?.context?.status === 402
          ? "AI credits exhausted. Add credits in your workspace."
          : "Analysis failed. Please try again.";
        toast.error(msg);
        return;
      }
      if (data?.report) {
        setReport(data.report);
        toast.success("Analysis complete");
        setTimeout(() => document.getElementById("report")?.scrollIntoView({ behavior: "smooth" }), 100);
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = () => { setImage(null); setReport(null); };

  return (
    <div className="min-h-screen">
      <Toaster theme="dark" position="top-center" />

      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">BioScan<span className="text-gradient">AI</span></span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground glass px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          AI vision online
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
              Identify thousands of plants and fish in seconds. Get expert disease diagnosis, treatment plans and care guides from a single image.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => cameraRef.current?.click()}
                className="bg-gradient-hero text-primary-foreground hover:opacity-90 shadow-glow font-semibold"
              >
                <Camera className="w-5 h-5" />
                Open Camera
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                className="glass border-primary/30 hover:bg-primary/10"
              >
                <Upload className="w-5 h-5" />
                Upload Photo
              </Button>
            </div>
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5 text-primary" /> 10,000+ species</span>
              <span className="flex items-center gap-1.5"><Fish className="w-3.5 h-3.5 text-[oklch(0.78_0.14_215)]" /> Freshwater & saltwater</span>
              <span className="flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5 text-[oklch(0.7_0.18_290)]" /> Disease diagnosis</span>
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

          {!image && !loading && (
            <div className="text-center py-10 space-y-4">
              <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-glow animate-pulse-glow">
                <ScanLine className="w-10 h-10 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Drop a photo to scan</h2>
                <p className="text-muted-foreground text-sm mt-1">Or use the camera and upload buttons above</p>
              </div>
            </div>
          )}

          {(image || loading) && (
            <div className="space-y-6">
              <div className="relative mx-auto max-w-md aspect-square rounded-2xl overflow-hidden glass">
                {image && <img src={image} alt="Subject" className="w-full h-full object-cover" />}
                {loading && (
                  <>
                    <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-glow animate-scan" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <div className="text-sm font-medium">Analyzing image…</div>
                      <div className="text-xs text-muted-foreground">Identifying species & checking health</div>
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

        {report && image && (
          <div id="report" className="mt-10">
            <ScanReport report={report} image={image} />
          </div>
        )}

        {/* Features */}
        {!report && (
          <div className="grid md:grid-cols-3 gap-4 mt-12">
            <Feature icon={Leaf} title="Plant identification" desc="Houseplants, garden plants, trees, flowers, herbs, succulents and more." color="text-primary" />
            <Feature icon={Fish} title="Fish identification" desc="Freshwater, saltwater, aquarium and pond species across the globe." color="text-[oklch(0.78_0.14_215)]" />
            <Feature icon={Stethoscope} title="Disease diagnosis" desc="Pinpoint pests, infections, deficiencies — with treatment plans." color="text-[oklch(0.7_0.18_290)]" />
            <Feature icon={ShieldCheck} title="Care plans" desc="Tailored watering, light, feeding and tank parameters per species." color="text-primary" />
            <Feature icon={Sparkles} title="Health score" desc="Instant 0–100 health rating with severity-graded findings." color="text-[oklch(0.78_0.14_215)]" />
            <Feature icon={ScanLine} title="Works on any photo" desc="Camera capture, gallery upload, even drag-and-drop on desktop." color="text-[oklch(0.7_0.18_290)]" />
          </div>
        )}
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        BioScan AI · Identifications are for guidance — consult an expert for critical decisions.
      </footer>
      <ChatBot />
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
