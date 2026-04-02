-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint for user and folder name
CREATE UNIQUE INDEX IF NOT EXISTS idx_folders_user_id_name ON folders(user_id, name);

-- Grant permissions
GRANT SELECT ON folders TO anon;
GRANT ALL PRIVILEGES ON folders TO authenticated;

-- Enable RLS for folders
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for folders table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'folders' AND policyname = 'Users can manage their own folders'
    ) THEN
        CREATE POLICY "Users can manage their own folders" ON folders
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Add folder_id to images table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'images' AND column_name = 'folder_id'
    ) THEN
        ALTER TABLE images ADD COLUMN folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for folder_id
CREATE INDEX IF NOT EXISTS idx_images_folder_id ON images(folder_id);
