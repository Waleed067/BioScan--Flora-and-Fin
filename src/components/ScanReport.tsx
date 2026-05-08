import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Leaf,
  Fish,
  Heart,
  Droplets,
  Sun,
  Thermometer,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Utensils,
  Wind,
  LucideIcon,
} from "lucide-react";

export type Report = {
  kind: "plant" | "fish" | "unknown";
  confidence: number;
  commonName: string;
  scientificName: string;
  category?: string;
  summary: string;
  healthScore: number;
  healthStatus: "healthy" | "minor_issues" | "diseased" | "critical" | "unknown";
  diseases: Array<{
    name: string;
    severity: "low" | "moderate" | "high" | "severe";
    symptoms: string;
    causes: string;
    treatment: string;
    prevention: string;
    recoveryDays?: string;
  }>;
  care: {
    light?: string;
    water?: string;
    temperature?: string;
    food?: string;
    environment?: string;
    extras?: string[];
  };
  funFacts?: string[];
};

const severityColor: Record<string, string> = {
  low: "bg-primary/15 text-primary border-primary/30",
  moderate:
    "bg-[oklch(0.82_0.17_75)]/15 text-[oklch(0.82_0.17_75)] border-[oklch(0.82_0.17_75)]/30",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  severe: "bg-destructive/15 text-destructive border-destructive/30",
};

const statusLabel: Record<string, string> = {
  healthy: "Healthy",
  minor_issues: "Minor Issues",
  diseased: "Needs Attention",
  critical: "Critical",
  unknown: "Unclear",
};

export function ScanReport({ report, image }: { report: Report; image: string }) {
  const Icon = report.kind === "fish" ? Fish : Leaf;
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="glass overflow-hidden p-0">
        <div className="grid md:grid-cols-[280px_1fr] gap-0">
          <div className="relative aspect-square md:aspect-auto bg-black/30">
            <img
              src={image}
              alt={report.commonName}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3">
              <Badge className="glass border-primary/40 text-primary">
                <Icon className="w-3 h-3 mr-1" />
                {report.kind === "unknown" ? "Unknown" : report.kind}
              </Badge>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                {report.category}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mt-1">{report.commonName}</h2>
              <p className="italic text-muted-foreground">{report.scientificName}</p>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{report.summary}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm">
                  Confidence{" "}
                  <strong className="text-primary">{Math.round(report.confidence)}%</strong>
                </span>
              </div>
              <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-[oklch(0.78_0.14_215)]" />
                <span className="text-sm">
                  Health{" "}
                  <strong className="text-[oklch(0.78_0.14_215)]">
                    {statusLabel[report.healthStatus]}
                  </strong>
                </span>
              </div>
            </div>
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Health Score</span>
                <span>{report.healthScore}/100</span>
              </div>
              <Progress value={report.healthScore} className="h-2" />
            </div>
          </div>
        </div>
      </Card>

      {report.diseases.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[oklch(0.82_0.17_75)]" /> Diagnosis
          </h3>
          {report.diseases.map((d, i) => (
            <Card key={i} className="glass p-5 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <h4 className="font-semibold text-base">{d.name}</h4>
                <Badge variant="outline" className={severityColor[d.severity]}>
                  {d.severity} severity
                </Badge>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <Field label="Symptoms" value={d.symptoms} />
                <Field label="Causes" value={d.causes} />
                <Field label="Treatment" value={d.treatment} highlight />
                <Field label="Prevention" value={d.prevention} />
              </div>
              {d.recoveryDays && (
                <div className="text-xs text-muted-foreground pt-1">
                  Estimated recovery: <span className="text-primary">{d.recoveryDays}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" /> Care Guide
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {report.care.light && <CareCard icon={Sun} label="Light" value={report.care.light} />}
          {report.care.water && (
            <CareCard icon={Droplets} label="Water" value={report.care.water} />
          )}
          {report.care.temperature && (
            <CareCard icon={Thermometer} label="Temperature" value={report.care.temperature} />
          )}
          {report.care.food && (
            <CareCard
              icon={Utensils}
              label={report.kind === "fish" ? "Feeding" : "Fertilizer"}
              value={report.care.food}
            />
          )}
          {report.care.environment && (
            <CareCard icon={Wind} label="Environment" value={report.care.environment} />
          )}
        </div>
        {report.care.extras && report.care.extras.length > 0 && (
          <Card className="glass p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Extra Tips
            </div>
            <ul className="space-y-1.5 text-sm">
              {report.care.extras.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary">•</span>
                  {t}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {report.funFacts && report.funFacts.length > 0 && (
        <Card className="glass p-5">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[oklch(0.7_0.18_290)]" /> Did you know?
          </h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {report.funFacts.map((f, i) => (
              <li key={i}>— {f}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <p className={highlight ? "text-foreground" : "text-foreground/80"}>{value}</p>
    </div>
  );
}

function CareCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <Card className="glass p-4 space-y-2">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="w-4 h-4" />
        <span className="text-xs uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-sm text-foreground/90">{value}</p>
    </Card>
  );
}
