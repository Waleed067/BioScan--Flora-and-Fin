import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Fish, Leaf, ScanLine } from "lucide-react";

type Props = {
  onCamera: () => void;
  onUpload: () => void;
};

export function ScanHub({ onCamera, onUpload }: Props) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <ScanCard
        kind="plant"
        title="Scan Plant"
        subtitle="Identify · Diagnose · Care"
        Icon={Leaf}
        accent="oklch(0.78 0.18 165)"
        onCamera={onCamera}
        onUpload={onUpload}
      />
      <ScanCard
        kind="fish"
        title="Scan Fish"
        subtitle="Identify · Diagnose · Aquarium"
        Icon={Fish}
        accent="oklch(0.78 0.14 215)"
        onCamera={onCamera}
        onUpload={onUpload}
      />
    </div>
  );
}

function ScanCard({
  title,
  subtitle,
  Icon,
  accent,
  onCamera,
  onUpload,
}: {
  kind: string;
  title: string;
  subtitle: string;
  Icon: any;
  accent: string;
  onCamera: () => void;
  onUpload: () => void;
}) {
  return (
    <Card
      className="glass relative overflow-hidden p-5 group transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
      style={{ borderColor: `${accent.replace(")", " / 0.25)")}` }}
    >
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity"
        style={{ background: accent }}
      />
      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-glow"
            style={{ background: `linear-gradient(135deg, ${accent}, oklch(0.7 0.18 290))` }}
          >
            <Icon className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            <ScanLine className="w-3 h-3" /> AI ready
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onCamera}
            className="flex-1 bg-gradient-hero text-primary-foreground hover:opacity-90"
          >
            <Camera className="w-4 h-4" /> Camera
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onUpload}
            className="flex-1 glass border-primary/20"
          >
            <Upload className="w-4 h-4" /> Upload
          </Button>
        </div>
      </div>
    </Card>
  );
}