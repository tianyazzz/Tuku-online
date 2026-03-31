import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, Copy, Trash2, Calendar, FileType, HardDrive } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface ImageDetail {
  id: string;
  user_id: string;
  original_name: string;
  file_url: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export const ImageDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [image, setImage] = useState<ImageDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const { data, error } = await supabase
          .from('images')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setImage(data);
      } catch (error: any) {
        toast.error('获取图片详情失败: ' + error.message);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchImage();
    }
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!image || !confirm('确定要删除这张图片吗？此操作不可恢复。')) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('images')
        .remove([image.file_path]);
        
      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('images')
        .delete()
        .eq('id', image.id);

      if (dbError) throw dbError;

      toast.success('图片已删除');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error('删除失败: ' + error.message);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type}已复制`);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="flex justify-center py-20 text-zinc-500">加载中...</div>;
  }

  if (!image) {
    return <div className="text-center py-20 text-zinc-500">未找到该图片</div>;
  }

  const isOwner = user && user.id === image.user_id;

  const links = {
    direct: image.file_url,
    markdown: `![${image.original_name}](${image.file_url})`,
    html: `<img src="${image.file_url}" alt="${image.original_name}" />`,
    bbcode: `[img]${image.file_url}[/img]`,
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-600 hover:text-blue-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        {isOwner && (
          <button 
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors bg-red-50 px-3 py-1.5 rounded-md"
          >
            <Trash2 className="w-4 h-4" />
            删除图片
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Preview Area */}
        <div className="md:col-span-2 bg-zinc-100 rounded-xl flex items-center justify-center min-h-[400px] border border-zinc-200 overflow-hidden relative group">
          <img 
            src={image.file_url} 
            alt={image.original_name} 
            className="max-w-full max-h-[800px] object-contain"
          />
        </div>

        {/* Info & Links Area */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 mb-4 truncate" title={image.original_name}>
              {image.original_name}
            </h2>
            
            <div className="space-y-3 text-sm text-zinc-600">
              <div className="flex items-center gap-3">
                <HardDrive className="w-4 h-4 text-zinc-400" />
                <span>{formatSize(image.file_size)}</span>
              </div>
              <div className="flex items-center gap-3">
                <FileType className="w-4 h-4 text-zinc-400" />
                <span>{image.mime_type}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-zinc-400" />
                <span>{format(new Date(image.created_at), 'yyyy-MM-dd HH:mm:ss')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-4">
            <h3 className="font-semibold text-zinc-900 mb-2">分享链接</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">直链</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={links.direct}
                    className="flex-1 text-sm bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 focus:outline-none"
                  />
                  <button 
                    onClick={() => copyToClipboard(links.direct, '直链')}
                    className="p-1.5 bg-zinc-100 text-zinc-600 rounded hover:bg-zinc-200 transition-colors"
                    title="复制直链"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Markdown</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={links.markdown}
                    className="flex-1 text-sm bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 focus:outline-none"
                  />
                  <button 
                    onClick={() => copyToClipboard(links.markdown, 'Markdown代码')}
                    className="p-1.5 bg-zinc-100 text-zinc-600 rounded hover:bg-zinc-200 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">HTML</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={links.html}
                    className="flex-1 text-sm bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 focus:outline-none"
                  />
                  <button 
                    onClick={() => copyToClipboard(links.html, 'HTML代码')}
                    className="p-1.5 bg-zinc-100 text-zinc-600 rounded hover:bg-zinc-200 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">BBCode</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={links.bbcode}
                    className="flex-1 text-sm bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 focus:outline-none"
                  />
                  <button 
                    onClick={() => copyToClipboard(links.bbcode, 'BBCode代码')}
                    className="p-1.5 bg-zinc-100 text-zinc-600 rounded hover:bg-zinc-200 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
