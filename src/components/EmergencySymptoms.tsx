import { Card } from "@/components/ui/card";
import { AlertTriangle, Droplets, Bug, Leaf, Fish, Sun, Wind, Thermometer, Sprout } from "lucide-react";

export type SymptomItem = {
  id: string;
  kind: "plant" | "fish";
  label: string;
  hint: string;
  Icon: any;
  prompt: string;
};

export const SYMPTOMS: SymptomItem[] = [
  // Fish
  { id: "ich", kind: "fish", label: "White Spots (Ich)", hint: "Ichthyophthirius",
    Icon: Fish,
    prompt: "My fish has tiny white spots all over its body and fins (looks like grains of salt). What is this, how serious is it, and exactly how do I treat it step-by-step? Include water parameters, temperature changes, and recommended medications." },
  { id: "fin-rot", kind: "fish", label: "Fin Rot", hint: "Frayed/decaying fins",
    Icon: Fish,
    prompt: "My fish has frayed, blackened or decaying fin edges. Walk me through fin rot diagnosis, root causes (water quality, bacteria, fungus), full treatment plan and prevention." },
  { id: "swim-bladder", kind: "fish", label: "Swim Bladder", hint: "Floating / sinking",
    Icon: Fish,
    prompt: "My fish keeps floating sideways or sinking and can't swim normally. Diagnose swim bladder disease — causes, immediate care, fasting protocol, pea treatment, and water conditions." },
  { id: "rapid-breathing", kind: "fish", label: "Rapid Breathing", hint: "Gasping at surface",
    Icon: Wind,
    prompt: "My fish is breathing very rapidly and gasping at the surface. What are the most likely causes (oxygen, ammonia, gill parasites) and what should I do right now?" },
  { id: "algae", kind: "fish", label: "Algae Bloom", hint: "Green/brown water",
    Icon: Droplets,
    prompt: "My aquarium water is turning green / brown with heavy algae growth. Explain the type, the root cause and a complete cleanup + prevention plan." },
  // Plant
  { id: "yellow", kind: "plant", label: "Yellow Leaves", hint: "Chlorosis",
    Icon: Leaf,
    prompt: "My plant's leaves are turning yellow. Walk me through diagnosing whether it's overwatering, nutrient deficiency, light or pests, and exactly how to fix it." },
  { id: "root-rot", kind: "plant", label: "Root Rot", hint: "Mushy roots, wilting",
    Icon: Sprout,
    prompt: "I think my plant has root rot — wilting despite wet soil, mushy dark roots, bad smell. Give me an emergency rescue plan including repotting, root pruning and drying schedule." },
  { id: "pests", kind: "plant", label: "Pests", hint: "Aphids, mites, scale",
    Icon: Bug,
    prompt: "My plant has small bugs / webbing / sticky residue on the leaves. Help me identify common pests (aphids, spider mites, mealybugs, scale) and give an organic and chemical treatment plan." },
  { id: "sunburn", kind: "plant", label: "Sun / Light Burn", hint: "Crispy patches",
    Icon: Sun,
    prompt: "My plant has crispy brown or bleached patches on the leaves that look like sunburn. Explain how to confirm it, recover the plant, and adjust light placement." },
  { id: "fungus", kind: "plant", label: "Fungal Spots", hint: "Powdery mildew / spots",
    Icon: Leaf,
    prompt: "My plant has white powdery patches or dark fungal spots on the leaves. Identify the most likely fungal disease and give a full treatment + airflow + watering plan." },
];

export function EmergencySymptoms({ onAsk }: { onAsk: (s: SymptomItem) => void }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl glass flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-[oklch(0.82_0.17_75)]" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Emergency Symptoms</h2>
          <p className="text-xs text-muted-foreground">Tap a symptom — get an instant AI rescue plan</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {SYMPTOMS.map((s) => (
          <button
            key={s.id}
            onClick={() => onAsk(s)}
            className="text-left"
          >
            <Card className="glass p-4 h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow active:scale-95">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  s.kind === "fish"
                    ? "bg-[oklch(0.78_0.14_215)]/15 text-[oklch(0.78_0.14_215)]"
                    : "bg-primary/15 text-primary"
                }`}>
                  <s.Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.kind}</span>
              </div>
              <div className="mt-2 font-semibold text-sm leading-tight">{s.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{s.hint}</div>
            </Card>
          </button>
        ))}
      </div>
    </section>
  );
}