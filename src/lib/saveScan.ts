import { supabase } from "@/integrations/supabase/client";
import type { Report } from "@/components/ScanReport";

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);/)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function saveScan(opts: {
  userId: string;
  imageDataUrl: string;
  subjects: Report[];
}) {
  const { userId, imageDataUrl, subjects } = opts;
  const primary = subjects[0];
  const blob = dataUrlToBlob(imageDataUrl);
  const path = `${userId}/${Date.now()}.jpg`;
  const { error: upErr } = await supabase.storage
    .from("scan-images")
    .upload(path, blob, { contentType: blob.type, upsert: false });
  if (upErr) throw upErr;
  const { data: pub } = supabase.storage.from("scan-images").getPublicUrl(path);
  const { error: insErr } = await supabase.from("scans").insert({
    user_id: userId,
    scan_type: primary?.kind ?? "unknown",
    title: primary?.commonName ?? "Scan",
    image_url: pub.publicUrl,
    diagnosis: { subjects } as any,
    health_score: primary?.healthScore ?? null,
  });
  if (insErr) throw insErr;
}