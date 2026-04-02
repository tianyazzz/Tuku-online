import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Check, Copy, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { uploadImage } from '../lib/upload';
import toast from 'react-hot-toast';
import { createFolder, listFolders, Folder } from '../lib/folders';
import { toErrorMessage } from '../lib/utils';

interface UploadedImage {
  id: string;
  url: string;
  originalName: string;
  uploadedAt: Date;
}

export const Home = () => {
  const { user } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [recentUploads, setRecentUploads] = useState<UploadedImage[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');

  // Load from local storage for guests, or we could just show session uploads
  useEffect(() => {
    const saved = localStorage.getItem('guest_recent_uploads');
    if (saved && !user) {
      try {
        const parsed: unknown = JSON.parse(saved);
        if (!Array.isArray(parsed)) return;
        const mapped: UploadedImage[] = parsed
          .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const obj = item as Record<string, unknown>;
            if (typeof obj.id !== 'string') return null;
            if (typeof obj.url !== 'string') return null;
            if (typeof obj.originalName !== 'string') return null;
            const raw = obj.uploadedAt;
            const date = typeof raw === 'string' || typeof raw === 'number' ? new Date(raw) : new Date();
            return {
              id: obj.id,
              url: obj.url,
              originalName: obj.originalName,
              uploadedAt: date,
            };
          })
          .filter((v): v is UploadedImage => Boolean(v));
        setRecentUploads(mapped);
      } catch {
        setRecentUploads([]);
      }
    }
  }, [user]);

  useEffect(() => {
    const run = async () => {
      if (!user) {
        setFolders([]);
        setSelectedFolderId('');
        return;
      }

      try {
        const data = await listFolders();
        setFolders(data);
      } catch (e: unknown) {
        toast.error(toErrorMessage(e) || '加载文件夹失败');
      }
    };

    run();
  }, [user]);

  const handleCreateFolder = async () => {
    const name = window.prompt('请输入文件夹名称');
    if (!name) return;
    try {
      if (!user) return;
      const created = await createFolder(name, user.id);
      const next = [...folders, created].sort((a, b) => a.name.localeCompare(b.name));
      setFolders(next);
      setSelectedFolderId(created.id);
      toast.success('文件夹已创建');
    } catch (e: unknown) {
      toast.error(toErrorMessage(e) || '创建文件夹失败');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    if (!user && acceptedFiles.length > 1) {
      toast.error('访客用户每次只能上传单张图片');
      return;
    }

    setUploading(true);
    let successCount = 0;
    const newUploads: UploadedImage[] = [];

    for (const file of acceptedFiles) {
      try {
        const result = await uploadImage(file, user?.id, selectedFolderId || null);
        newUploads.push({
          id: result.id,
          url: result.url,
          originalName: file.name,
          uploadedAt: new Date(),
        });
        successCount++;
      } catch (error: unknown) {
        toast.error(`上传 ${file.name} 失败: ${toErrorMessage(error)}`);
      }
    }

    setUploading(false);
    if (successCount > 0) {
      toast.success(`成功上传 ${successCount} 张图片`);
      setRecentUploads((prev) => {
        const updatedUploads = [...newUploads, ...prev].slice(0, 10);
        if (!user) {
          localStorage.setItem('guest_recent_uploads', JSON.stringify(updatedUploads));
        }
        return updatedUploads;
      });
    }
  }, [selectedFolderId, user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('链接已复制到剪贴板');
  };

  return (
    <div className="space-y-12">
      {/* Hero & Upload Section */}
      <section className="text-center max-w-3xl mx-auto mt-8">
        <h1 className="text-4xl font-extrabold text-zinc-900 mb-4 tracking-tight">
          极简、快速的图片托管服务
        </h1>
        <p className="text-lg text-zinc-600 mb-8">
          无需登录即可上传图片。注册用户专享永久存储、批量管理等多项高级功能。
        </p>

        {user && (
          <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1">
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">未分组</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleCreateFolder}
              className="px-4 py-2 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
            >
              新建文件夹
            </button>
          </div>
        )}

        <div 
          {...getRootProps()} 
          className={`
            border-2 border-dashed rounded-xl p-12 cursor-pointer transition-all duration-200
            flex flex-col items-center justify-center min-h-[300px]
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-zinc-300 hover:border-blue-400 hover:bg-zinc-50 bg-white'}
          `}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex flex-col items-center text-blue-500">
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <p className="text-lg font-medium">正在上传中，请稍候...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-zinc-500">
              <div className="bg-blue-100 p-4 rounded-full mb-4 text-blue-500">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="text-xl font-medium text-zinc-700 mb-2">
                {isDragActive ? '松开鼠标即可上传' : '点击或拖拽图片到此处上传'}
              </p>
              <p className="text-sm">
                支持 JPG, PNG, GIF, WEBP 格式。最大 10MB
              </p>
              {!user && (
                <p className="text-xs text-amber-600 mt-4 bg-amber-50 px-3 py-1 rounded-full">
                  访客上传的图片仅保留 24 小时
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Recent Uploads Section */}
      {recentUploads.length > 0 && (
        <section className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-zinc-800 mb-6">本次上传记录</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recentUploads.map((image) => (
              <div key={image.id} className="bg-white rounded-lg shadow-sm border border-zinc-200 overflow-hidden group">
                <div className="aspect-square bg-zinc-100 relative overflow-hidden">
                  <img 
                    src={image.url} 
                    alt={image.originalName} 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button 
                      onClick={() => copyToClipboard(image.url)}
                      className="bg-white p-2 rounded-full text-zinc-700 hover:text-blue-500 hover:bg-blue-50 transition-colors shadow-sm"
                      title="复制链接"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-zinc-700 truncate" title={image.originalName}>
                    {image.originalName}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-zinc-500">
                      {image.uploadedAt.toLocaleTimeString()}
                    </p>
                    <button 
                      onClick={() => copyToClipboard(image.url)}
                      className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      复制
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="max-w-5xl mx-auto py-12 border-t border-zinc-200 mt-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">极速上传</h3>
            <p className="text-zinc-600 text-sm">支持多文件拖拽上传，采用全球 CDN 加速，让您的图片秒级触达用户。</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">多种格式</h3>
            <p className="text-zinc-600 text-sm">一键生成直链、Markdown、HTML、BBCode 等多种格式的分享链接。</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
              <Copy className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">永久存储</h3>
            <p className="text-zinc-600 text-sm">注册账号即可享受安全的云端存储，方便您随时随地管理个人图库。</p>
          </div>
        </div>
      </section>
    </div>
  );
};
