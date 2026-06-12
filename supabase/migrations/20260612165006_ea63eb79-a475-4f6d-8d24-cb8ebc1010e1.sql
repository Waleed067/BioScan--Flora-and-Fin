ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS parent_scan_id uuid REFERENCES public.scans(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_scans_parent ON public.scans(parent_scan_id);
CREATE INDEX IF NOT EXISTS idx_scans_user_created ON public.scans(user_id, created_at DESC);