import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Image as ImageIcon, LogOut, User as UserIcon } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export const Layout: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Toaster position="top-center" />
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors">
            <ImageIcon className="w-8 h-8" />
            <span className="font-bold text-xl tracking-tight text-zinc-900">KuCun 图床</span>
          </Link>
          
          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-sm font-medium text-zinc-600 hover:text-blue-500 transition-colors"
                >
                  图片管理
                </Link>
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-zinc-200">
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <UserIcon className="w-4 h-4" />
                    <span className="max-w-[120px] truncate">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="退出登录"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-sm font-medium text-zinc-600 hover:text-blue-500 transition-colors"
                >
                  登录
                </Link>
                <Link 
                  to="/register" 
                  className="text-sm font-medium bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  注册
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      
      <footer className="bg-white border-t border-zinc-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} KuCun 图床工具. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
