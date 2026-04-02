-- Tighten RLS policies for images and storage to avoid spoofed user_id

ALTER TABLE images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public images are viewable by everyone" ON images;
DROP POLICY IF EXISTS "Anyone can insert public images" ON images;
DROP POLICY IF EXISTS "Users can manage their own images" ON images;

CREATE POLICY "Public images are viewable by everyone" ON images
  FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own images" ON images
  FOR INSERT
  WITH CHECK (
    (
      auth.uid() IS NULL
      AND user_id IS NULL
      AND folder_id IS NULL
    )
    OR
    (
      auth.uid() IS NOT NULL
      AND user_id = auth.uid()
      AND (
        folder_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM folders f
          WHERE f.id = folder_id
            AND f.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update their own images" ON images
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images" ON images
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read access for images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;

CREATE POLICY "Public read access for images bucket" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Scoped upload to images bucket" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'images'
    AND (
      (auth.uid() IS NULL AND name LIKE 'guest/%')
      OR (auth.uid() IS NOT NULL AND name LIKE (auth.uid()::text || '/%'))
    )
  );

CREATE POLICY "Users can update their own uploads" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'images' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own uploads" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'images' AND auth.uid() = owner);

