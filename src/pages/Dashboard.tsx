import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { useAuthStore } from '../store/authStore';
import { Trash2, Copy, ExternalLink, Search, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

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

  const fetchImages = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      let query = supabase
        .from('images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('original_name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setImages(data || []);
    } catch (error: any) {
      toast.error('加载图片失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [user, searchTerm]);

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
    } catch (error: any) {
      toast.error('删除失败: ' + error.message);
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
