import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// image_url may be either a legacy public URL (http...) or a storage path (e.g. "<uid>/<ts>.jpg").
// For storage paths we mint a short-lived signed URL since the bucket is private.
export async function resolveScanImageUrl(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const { data, error } = await supabase.storage.from("scan-images").createSignedUrl(value, 60 * 60);
  if (error || !data) return null;
  return data.signedUrl;
}

export function useScanImageUrl(value: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(value && /^https?:\/\//i.test(value) ? value : null);
  useEffect(() => {
    let active = true;
    resolveScanImageUrl(value).then((u) => { if (active) setUrl(u); });
    return () => { active = false; };
  }, [value]);
  return url;
}

export async function resolveScanImageUrls<T extends { image_url: string | null }>(rows: T[]): Promise<(T & { resolved_url: string | null })[]> {
  return Promise.all(rows.map(async (r) => ({ ...r, resolved_url: await resolveScanImageUrl(r.image_url) })));
}