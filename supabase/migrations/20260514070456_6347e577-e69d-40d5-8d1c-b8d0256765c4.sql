
-- Restrict scan-images SELECT to owner's folder; keep public READ via signed/public URLs only via direct paths
DROP POLICY IF EXISTS "Scan images publicly readable" ON storage.objects;
CREATE POLICY "Users list own scan images" ON storage.objects FOR SELECT
  USING (bucket_id = 'scan-images' AND (auth.uid()::text = (storage.foldername(name))[1]));

-- Revoke EXECUTE on handle_new_user from public roles (only auth trigger needs it)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
