import { useRef, useState } from "react";

export function BeforeAfter({ before, after, beforeLabel = "Before", afterLabel = "After" }: { before: string; after: string; beforeLabel?: string; afterLabel?: string }) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
    setPos(p);
  };

  return (
    <div
      ref={ref}
      className="relative w-full aspect-square rounded-2xl overflow-hidden glass select-none touch-none"
      onMouseMove={(e) => e.buttons === 1 && onMove(e.clientX)}
      onMouseDown={(e) => onMove(e.clientX)}
      onTouchMove={(e) => onMove(e.touches[0].clientX)}
    >
      <img src={after} alt={afterLabel} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={before} alt={beforeLabel} className="absolute inset-0 h-full w-auto max-w-none object-cover" style={{ width: `${(100 / pos) * 100}%` }} />
      </div>
      <div className="absolute inset-y-0 w-0.5 bg-primary shadow-glow" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-glow text-xs font-bold">⇆</div>
      </div>
      <div className="absolute top-2 left-2 glass text-[10px] px-2 py-1 rounded-full">{beforeLabel}</div>
      <div className="absolute top-2 right-2 glass text-[10px] px-2 py-1 rounded-full">{afterLabel}</div>
    </div>
  );
}