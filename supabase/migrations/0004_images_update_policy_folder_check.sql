-- Ensure images update respects folder ownership

DROP POLICY IF EXISTS "Users can update their own images" ON images;

CREATE POLICY "Users can update their own images" ON images
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      folder_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM folders f
        WHERE f.id = folder_id
          AND f.user_id = auth.uid()
      )
    )
  );

