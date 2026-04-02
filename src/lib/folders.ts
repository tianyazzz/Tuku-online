import { supabase } from '../supabase/client';

export interface Folder {
  id: string;
  name: string;
  created_at: string;
}

export const listFolders = async (): Promise<Folder[]> => {
  const { data, error } = await supabase
    .from('folders')
    .select('id, name, created_at')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const createFolder = async (name: string, userId: string): Promise<Folder> => {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('文件夹名称不能为空');
  if (!userId) throw new Error('未登录');

  const { data, error } = await supabase
    .from('folders')
    .insert({ name: trimmed, user_id: userId })
    .select('id, name, created_at')
    .single();

  if (error) throw error;
  return data;
};

export const deleteFolder = async (id: string): Promise<void> => {
  const { error } = await supabase.from('folders').delete().eq('id', id);
  if (error) throw error;
};
