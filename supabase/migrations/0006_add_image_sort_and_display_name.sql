DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'images' AND column_name = 'display_name'
    ) THEN
        ALTER TABLE images ADD COLUMN display_name VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'images' AND column_name = 'sort_index'
    ) THEN
        ALTER TABLE images ADD COLUMN sort_index BIGINT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_images_user_folder_sort ON images(user_id, folder_id, sort_index);

