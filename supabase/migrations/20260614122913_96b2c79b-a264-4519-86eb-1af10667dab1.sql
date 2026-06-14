
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users list own scan images" ON storage.objects;
CREATE POLICY "Users list own scan images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'scan-images' AND auth.uid()::text = (storage.foldername(name))[1]);
