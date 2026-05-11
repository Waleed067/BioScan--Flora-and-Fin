import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Check, X, Crop as CropIcon, Maximize2 } from "lucide-react";

async function getCroppedDataUrl(src: string, area: Area, max = 1280, quality = 0.9): Promise<string> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
  const scale = Math.min(1, max / Math.max(area.width, area.height));
  const w = Math.round(area.width * scale);
  const h = Math.round(area.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

export function ImageCropper({
  src,
  onConfirm,
  onCancel,
}: {
  src: string;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  const confirm = async () => {
    if (!area) return onConfirm(src);
    setBusy(true);
    try {
      const out = await getCroppedDataUrl(src, area);
      onConfirm(out);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CropIcon className="w-4 h-4 text-primary" />
          Crop to focus the scan
        </div>
        <span className="text-xs text-muted-foreground">Pinch / drag to frame the subject</span>
      </div>
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden glass bg-black/40">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onComplete}
          objectFit="contain"
          showGrid
        />
      </div>
      <div className="flex items-center gap-3">
        <Maximize2 className="w-4 h-4 text-muted-foreground shrink-0" />
        <Slider value={[zoom]} min={1} max={4} step={0.05} onValueChange={(v) => setZoom(v[0])} className="flex-1" />
      </div>
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={onCancel} className="glass" disabled={busy}>
          <X className="w-4 h-4" /> Cancel
        </Button>
        <Button onClick={confirm} disabled={busy} className="bg-gradient-hero text-primary-foreground shadow-glow">
          <Check className="w-4 h-4" /> Use this crop
        </Button>
      </div>
    </div>
  );
}
