import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { useAuthStore } from '../store/authStore';
import { Trash2, Copy, ExternalLink, Search, Image as ImageIcon, FolderPlus, FolderX, ArrowUp, ArrowDown, Pencil, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { createFolder, deleteFolder, listFolders, Folder } from '../lib/folders';
import { toErrorMessage } from '../lib/utils';
import { Select } from '../components/Select';

interface ImageRecord {
  id: string;
  original_name: string;
  display_name: string | null;
  file_url: string;
  file_path: string;
  file_size: number;
  created_at: string;
  updated_at?: string;
  sort_index: number | null;
  folder_id?: string | null;
}

export const Dashboard = () => {
  const { user } = useAuthStore();
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderId, setFolderId] = useState<string>('');
  const [sortMode, setSortMode] = useState<string>('uploaded_desc');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [renamingId, setRenamingId] = useState<string>('');
  const [renameValue, setRenameValue] = useState<string>('');
  const [renaming, setRenaming] = useState(false);
  const [reorderingId, setReorderingId] = useState<string>('');

  const fetchFolders = useCallback(async () => {
    if (!user) return;
    try {
      const data = await listFolders();
      setFolders(data);
    } catch (e: unknown) {
      toast.error(toErrorMessage(e) || '加载文件夹失败');
    }
  }, [user]);

  const fetchImages = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('images')
        .select('id, original_name, display_name, file_url, file_path, file_size, created_at, updated_at, sort_index, folder_id')
        .eq('user_id', user.id);

      if (searchTerm) {
        const term = searchTerm.split(',').join(' ');
        query = query.or(`original_name.ilike.%${term}%,display_name.ilike.%${term}%`);
      }

      if (folderId === '__none__') {
        query = query.is('folder_id', null);
      } else if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      if (sortMode === 'custom_desc') {
        query = query
          .order('sort_index', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false });
      } else if (sortMode === 'uploaded_asc') {
        query = query.order('created_at', { ascending: true });
      } else if (sortMode === 'uploaded_desc') {
        query = query.order('created_at', { ascending: false });
      } else if (sortMode === 'name_asc') {
        query = query
          .order('display_name', { ascending: true, nullsFirst: false })
          .order('original_name', { ascending: true })
          .order('created_at', { ascending: false });
      } else if (sortMode === 'name_desc') {
        query = query
          .order('display_name', { ascending: false, nullsFirst: false })
          .order('original_name', { ascending: false })
          .order('created_at', { ascending: false });
      } else if (sortMode === 'modified_asc') {
        query = query
          .order('updated_at', { ascending: true })
          .order('created_at', { ascending: true });
      } else if (sortMode === 'modified_desc') {
        query = query
          .order('updated_at', { ascending: false })
          .order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      setImages(data || []);
    } catch (error: unknown) {
      toast.error('加载图片失败: ' + toErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [folderId, searchTerm, sortMode, user]);

  const getImageName = (img: ImageRecord) => (img.display_name && img.display_name.trim() ? img.display_name : img.original_name);

  const handleBatchCopy = async () => {
    if (!folderId) {
      toast.error('请先选择一个文件夹（或选择“未分组”）再批量复制');
      return;
    }
    if (images.length === 0) {
      toast.error('当前文件夹下没有图片');
      return;
    }
    const text = images.map((img) => img.file_url).join('\n');
    await navigator.clipboard.writeText(text);
    toast.success(`已复制 ${images.length} 条链接`);
  };

  const bootstrapSortIndexIfNeeded = async () => {
    if (!user) return;
    if (sortMode !== 'custom_desc') return;
    if (!folderId || folderId === '__none__') return;
    if (images.every((img) => typeof img.sort_index === 'number')) return;

    const now = Date.now();
    const updates = images.map((img, idx) => ({
      id: img.id,
      sort_index: now - idx,
    }));

    const { error } = await supabase.from('images').upsert(updates, { onConflict: 'id' });
    if (error) throw error;
  };

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    if (!user) return;
    if (sortMode !== 'custom_desc') return;
    if (!folderId || folderId === '__none__') return;
    if (reorderingId) return;

    setReorderingId(id);
    try {
      await bootstrapSortIndexIfNeeded();

      const idx = images.findIndex((img) => img.id === id);
      if (idx < 0) return;
      const swapWith = direction === 'up' ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= images.length) return;

      const a = images[idx];
      const b = images[swapWith];
      const aSort = typeof a.sort_index === 'number' ? a.sort_index : Date.now();
      const bSort = typeof b.sort_index === 'number' ? b.sort_index : Date.now() - 1;

      const { error } = await supabase
        .from('images')
        .upsert(
          [
            { id: a.id, sort_index: bSort },
            { id: b.id, sort_index: aSort },
          ],
          { onConflict: 'id' }
        );
      if (error) throw error;

      const next = [...images];
      next[idx] = { ...a, sort_index: bSort };
      next[swapWith] = { ...b, sort_index: aSort };
      const swapped = next[swapWith];
      next[swapWith] = next[idx];
      next[idx] = swapped;
      setImages(next);
    } catch (e: unknown) {
      toast.error(toErrorMessage(e) || '排序失败');
      fetchImages();
    } finally {
      setReorderingId('');
    }
  };

  const startRename = (img: ImageRecord) => {
    setRenamingId(img.id);
    setRenameValue(getImageName(img));
  };

  const cancelRename = () => {
    setRenamingId('');
    setRenameValue('');
  };

  const submitRename = async () => {
    if (!user) return;
    if (!renamingId) return;
    if (renaming) return;

    const value = renameValue.trim();
    if (!value) {
      toast.error('名称不能为空');
      return;
    }

    setRenaming(true);
    try {
      const { error } = await supabase
        .from('images')
        .update({ display_name: value })
        .eq('id', renamingId);
      if (error) throw error;

      setImages((prev) => prev.map((img) => (img.id === renamingId ? { ...img, display_name: value } : img)));
      toast.success('已重命名');
      cancelRename();
    } catch (e: unknown) {
      toast.error(toErrorMessage(e) || '重命名失败');
    } finally {
      setRenaming(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleCreateFolder = async () => {
    try {
      if (!user) return;
      const created = await createFolder(newFolderName, user.id);
      setFolders([...folders, created].sort((a, b) => a.name.localeCompare(b.name)));
      setFolderId(created.id);
      setIsCreatingFolder(false);
      setNewFolderName('');
      toast.success('文件夹已创建');
    } catch (e: unknown) {
      toast.error(toErrorMessage(e) || '创建文件夹失败');
    } finally {
      setCreatingFolder(false);
    }
  };

  const openCreateFolder = () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }
    setIsCreatingFolder(true);
    setNewFolderName('');
  };

  const submitCreateFolder = async () => {
    if (creatingFolder) return;
    setCreatingFolder(true);
    await handleCreateFolder();
  };

  const handleDeleteFolder = async (id: string, name: string) => {
    if (!confirm(`确定要删除文件夹「${name}」吗？文件夹内图片将变为未分组。`)) return;
    try {
      await deleteFolder(id);
      setFolders(folders.filter((f) => f.id !== id));
      if (folderId === id) setFolderId('');
      toast.success('文件夹已删除');
    } catch (e: unknown) {
      toast.error(toErrorMessage(e) || '删除文件夹失败');
    }
  };

  const handleDelete = async (id: string, filePath: string) => {
    if (!confirm('确定要删除这张图片吗？此操作不可恢复。')) return;

    try {
      // 1. Delete from storage
      const { error: storageError } = await supabase.storage
        .from('images')
        .remove([filePath]);
        
      if (storageError) throw storageError;

      // 2. Delete from DB
      const { error: dbError } = await supabase
        .from('images')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      toast.success('图片已删除');
      setImages(images.filter(img => img.id !== id));
    } catch (error: unknown) {
      toast.error('删除失败: ' + toErrorMessage(error));
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('链接已复制');
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-[color:var(--arco-text-1)]">我的图库</h1>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select
            className="sm:w-56"
            value={folderId}
            onChange={setFolderId}
            options={[
              { value: '', label: '全部文件夹' },
              { value: '__none__', label: '未分组' },
              ...folders.map((f) => ({ value: f.id, label: f.name })),
            ]}
          />
          <Select
            className="sm:w-52"
            value={sortMode}
            onChange={setSortMode}
            options={[
              { value: 'uploaded_desc', label: '上传时间：新 → 旧' },
              { value: 'uploaded_asc', label: '上传时间：旧 → 新' },
              { value: 'name_asc', label: '名称：A → Z' },
              { value: 'name_desc', label: '名称：Z → A' },
              { value: 'modified_desc', label: '修改时间：新 → 旧' },
              { value: 'modified_asc', label: '修改时间：旧 → 新' },
              { value: 'custom_desc', label: '手动排序' },
            ]}
          />
          <button
            type="button"
            onClick={handleBatchCopy}
            className="w-full sm:w-auto btn btn-secondary"
            title="按当前排序批量复制当前分组下的图片链接"
          >
            <Copy className="w-4 h-4" />
            批量复制
          </button>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="搜索图片..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
            <Search className="w-5 h-5 text-zinc-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--arco-text-2)]">
          文件夹
          <span className="text-xs text-[color:var(--arco-text-3)]">({folders.length})</span>
        </div>
        <div className="flex-1 flex flex-wrap gap-2">
          {folders.length === 0 ? (
            <span className="text-sm text-[color:var(--arco-text-3)]">暂无文件夹，可先创建一个用于分组管理</span>
          ) : (
            folders.map((f) => (
              <div key={f.id} className="tag">
                <button
                  type="button"
                  onClick={() => setFolderId(f.id)}
                  className="text-sm text-[color:var(--arco-text-2)] hover:text-[color:var(--arco-primary-6)]"
                  title="按此文件夹筛选"
                >
                  {f.name}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteFolder(f.id, f.name)}
                  className="text-[color:var(--arco-text-3)] hover:text-[color:var(--arco-danger-6)]"
                  title="删除文件夹"
                >
                  <FolderX className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
        {!isCreatingFolder ? (
          <button type="button" onClick={openCreateFolder} className="btn btn-primary">
            <FolderPlus className="w-4 h-4" />
            新建文件夹
          </button>
        ) : (
          <div className="flex items-stretch gap-2">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitCreateFolder();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }
              }}
              placeholder="文件夹名称"
              className="input w-40 sm:w-48"
              autoFocus
            />
            <button
              type="button"
              onClick={submitCreateFolder}
              disabled={creatingFolder}
              className="btn btn-primary px-3"
            >
              {creatingFolder ? '创建中' : '创建'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingFolder(false);
                setNewFolderName('');
              }}
              className="btn btn-secondary px-3"
            >
              取消
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-zinc-500">
          加载中...
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-zinc-200">
          <ImageIcon className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 mb-2">暂无图片</h3>
          <p className="text-zinc-500 mb-6">您还没有上传任何图片，或者没有找到匹配的图片。</p>
          <Link to="/" className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors">
            去上传
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((image) => (
            <div key={image.id} className="bg-white rounded-lg border border-zinc-200 overflow-hidden group hover:shadow-md transition-shadow">
              <Link to={`/image/${image.id}`} className="block aspect-square bg-zinc-100 relative overflow-hidden">
                <img 
                  src={image.file_url} 
                  alt={image.original_name} 
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </Link>
              
              <div className="p-4">
                {renamingId === image.id ? (
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          submitRename();
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          cancelRename();
                        }
                      }}
                      className="flex-1 min-w-0 px-2 py-1 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={submitRename}
                      disabled={renaming}
                      className="px-2 py-1 rounded bg-blue-500 text-white text-sm transition duration-150 ease-out transform-gpu active:scale-[0.99] disabled:opacity-50"
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={cancelRename}
                      className="icon-btn p-1 text-zinc-500 hover:bg-zinc-100"
                      title="取消"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-medium text-zinc-800 truncate" title={getImageName(image)}>
                      {getImageName(image)}
                    </h4>
                    <button
                      type="button"
                      onClick={() => startRename(image)}
                      className="icon-btn text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                      title="重命名"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
                  <span>{formatSize(image.file_size)}</span>
                  <span>{format(new Date(image.created_at), 'yyyy-MM-dd')}</span>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                  <button 
                    onClick={() => copyUrl(image.file_url)}
                    className="flex items-center gap-1 text-sm text-zinc-600 hover:text-blue-500 transition duration-150 ease-out transform-gpu active:scale-[0.99]"
                  >
                    <Copy className="w-4 h-4" />
                    复制
                  </button>
                  <div className="flex items-center gap-2">
                    {sortMode === 'custom_desc' && folderId && folderId !== '__none__' && images.length > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMove(image.id, 'up')}
                          disabled={reorderingId === image.id}
                          className="icon-btn text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                          title="上移"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(image.id, 'down')}
                          disabled={reorderingId === image.id}
                          className="icon-btn text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                          title="下移"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <Link 
                      to={`/image/${image.id}`}
                      className="icon-btn text-zinc-400 hover:text-blue-500 hover:bg-blue-50"
                      title="详情"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => handleDelete(image.id, image.file_path)}
                      className="icon-btn text-zinc-400 hover:text-red-500 hover:bg-red-50"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
