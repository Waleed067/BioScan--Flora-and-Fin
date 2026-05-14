import { Home, ScanLine, Stethoscope, MessageCircle, History } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "home" | "scan" | "symptoms" | "chat" | "history";

export function MobileBottomNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  const items: { id: Tab; label: string; Icon: any }[] = [
    { id: "home", label: "Home", Icon: Home },
    { id: "symptoms", label: "Symptoms", Icon: Stethoscope },
    { id: "scan", label: "Scan", Icon: ScanLine },
    { id: "history", label: "History", Icon: History },
    { id: "chat", label: "AI", Icon: MessageCircle },
  ];
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-border/60"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="grid grid-cols-5">
        {items.map(({ id, label, Icon }) => {
          const isActive = id === active;
          const isCenter = id === "scan";
          return (
            <li key={id} className="flex justify-center">
              <button
                onClick={() => onChange(id)}
                aria-label={label}
                className="flex-1 flex flex-col items-center gap-0.5 py-2.5 w-full"
              >
                <span
                  className={cn(
                    "flex items-center justify-center transition-all",
                    isCenter
                      ? "w-11 h-11 rounded-2xl -mt-5 shadow-glow bg-gradient-hero text-primary-foreground"
                      : "w-9 h-9 rounded-xl",
                    !isCenter && isActive && "text-primary",
                    !isCenter && !isActive && "text-muted-foreground"
                  )}
                >
                  <Icon className={isCenter ? "w-5 h-5" : "w-5 h-5"} />
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}