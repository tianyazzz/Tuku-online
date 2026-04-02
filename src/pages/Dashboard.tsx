import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { useAuthStore } from '../store/authStore';
import { Trash2, Copy, ExternalLink, Search, Image as ImageIcon, FolderPlus, FolderX } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { createFolder, deleteFolder, listFolders, Folder } from '../lib/folders';
import { toErrorMessage } from '../lib/utils';

interface ImageRecord {
  id: string;
  original_name: string;
  file_url: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

export const Dashboard = () => {
  const { user } = useAuthStore();
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderId, setFolderId] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

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
        .select('id, original_name, file_url, file_path, file_size, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('original_name', `%${searchTerm}%`);
      }

      if (folderId === '__none__') {
        query = query.is('folder_id', null);
      } else if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setImages(data || []);
    } catch (error: unknown) {
      toast.error('加载图片失败: ' + toErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [folderId, searchTerm, user]);

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
        <h1 className="text-2xl font-bold text-zinc-900">我的图库</h1>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className="w-full sm:w-56 px-3 py-2 border border-zinc-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部文件夹</option>
            <option value="__none__">未分组</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="搜索图片..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-5 h-5 text-zinc-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          文件夹
          <span className="text-xs text-zinc-500">({folders.length})</span>
        </div>
        <div className="flex-1 flex flex-wrap gap-2">
          {folders.length === 0 ? (
            <span className="text-sm text-zinc-500">暂无文件夹，可先创建一个用于分组管理</span>
          ) : (
            folders.map((f) => (
              <div key={f.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 bg-zinc-50">
                <button
                  type="button"
                  onClick={() => setFolderId(f.id)}
                  className="text-sm text-zinc-700 hover:text-blue-600"
                  title="按此文件夹筛选"
                >
                  {f.name}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteFolder(f.id, f.name)}
                  className="text-zinc-400 hover:text-red-500"
                  title="删除文件夹"
                >
                  <FolderX className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
        {!isCreatingFolder ? (
          <button
            type="button"
            onClick={openCreateFolder}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
          >
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
              className="w-40 sm:w-48 px-3 py-2 border border-zinc-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="button"
              onClick={submitCreateFolder}
              disabled={creatingFolder}
              className="inline-flex items-center justify-center px-3 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {creatingFolder ? '创建中' : '创建'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingFolder(false);
                setNewFolderName('');
              }}
              className="inline-flex items-center justify-center px-3 py-2 rounded-md bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
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
                <h4 className="font-medium text-zinc-800 truncate mb-1" title={image.original_name}>
                  {image.original_name}
                </h4>
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
                  <span>{formatSize(image.file_size)}</span>
                  <span>{format(new Date(image.created_at), 'yyyy-MM-dd')}</span>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                  <button 
                    onClick={() => copyUrl(image.file_url)}
                    className="flex items-center gap-1 text-sm text-zinc-600 hover:text-blue-500 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    复制
                  </button>
                  <div className="flex items-center gap-2">
                    <Link 
                      to={`/image/${image.id}`}
                      className="p-1.5 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                      title="详情"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => handleDelete(image.id, image.file_path)}
                      className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
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
