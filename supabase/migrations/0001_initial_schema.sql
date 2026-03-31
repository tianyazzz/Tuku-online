-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create images table
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    width INTEGER,
    height INTEGER,
    is_public BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_created_at ON images(created_at DESC);
CREATE INDEX idx_images_expires_at ON images(expires_at);

-- Grant permissions
GRANT SELECT ON images TO anon;
GRANT ALL PRIVILEGES ON images TO authenticated;

-- Enable Row Level Security
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for images table
CREATE POLICY "Public images are viewable by everyone" ON images
    FOR SELECT USING (is_public = true);

CREATE POLICY "Anyone can insert public images" ON images
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage their own images" ON images
    FOR ALL USING (auth.uid() = user_id);

-- Storage bucket setup
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'images', 
    'images', 
    true, 
    10485760, 
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Storage bucket policies
-- Allow public read access to images bucket
CREATE POLICY "Public read access for images bucket" ON storage.objects
    FOR SELECT USING (bucket_id = 'images');

-- Allow anyone to upload to images bucket
CREATE POLICY "Anyone can upload to images bucket" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'images');

-- Allow users to update and delete their own uploads
CREATE POLICY "Users can update their own uploads" ON storage.objects
    FOR UPDATE USING (bucket_id = 'images' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own uploads" ON storage.objects
    FOR DELETE USING (bucket_id = 'images' AND auth.uid() = owner);
