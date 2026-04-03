import { supabase } from '../supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  id: string;
  url: string;
}

export const uploadImage = async (
  file: File,
  userId: string | undefined,
  folderId?: string | null,
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

    const basePayload = {
      user_id: userId || null,
      folder_id: userId ? (folderId ?? null) : null,
      original_name: file.name,
      file_name: fileName,
      file_path: filePath,
      file_url: publicUrl,
      file_size: file.size,
      mime_type: file.type,
      is_public: isPublic,
      expires_at: expiresAt,
    };

    const payloadWithExtras = {
      ...basePayload,
      display_name: file.name,
      sort_index: Date.now(),
    };

    let dbData: { id: string; file_url: string } | null = null;
    let dbError: unknown = null;

    {
      const res = await supabase.from('images').insert(payloadWithExtras).select('id, file_url').single();
      dbData = res.data;
      dbError = res.error;
    }

    if (dbError && typeof dbError === 'object' && dbError && 'message' in dbError) {
      const msg = String((dbError as { message?: unknown }).message || '');
      if (msg.includes('display_name') || msg.includes('sort_index')) {
        const res = await supabase.from('images').insert(basePayload).select('id, file_url').single();
        dbData = res.data;
        dbError = res.error;
      }
    }

    if (dbError) throw dbError;
    if (!dbData) throw new Error('Failed to save image record');

    return {
      id: dbData.id,
      url: dbData.file_url,
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};
