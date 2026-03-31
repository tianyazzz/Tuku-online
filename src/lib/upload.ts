import { supabase } from '../supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  id: string;
  url: string;
}

export const uploadImage = async (
  file: File,
  userId: string | undefined,
  isPublic: boolean = true
): Promise<UploadResult> => {
  try {
    // 1. Upload to Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = userId ? `${userId}/${fileName}` : `guest/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    // 3. Save to Database
    const expiresAt = !userId 
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Guest: 24h
      : null;

    const { data: dbData, error: dbError } = await supabase
      .from('images')
      .insert({
        user_id: userId || null,
        original_name: file.name,
        file_name: fileName,
        file_path: filePath,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        is_public: isPublic,
        expires_at: expiresAt,
      })
      .select('id, file_url')
      .single();

    if (dbError) throw dbError;

    return {
      id: dbData.id,
      url: dbData.file_url,
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};
