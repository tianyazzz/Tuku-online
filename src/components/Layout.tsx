import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, User as UserIcon } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export const Layout: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-center" />
      <header className="bg-white border-b border-[color:var(--arco-border)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-[color:var(--arco-primary-6)] hover:text-[color:var(--arco-primary-7)] transition-colors">
            <img src="/logo.svg" alt="天琊的图床工具" className="w-8 h-8" />
            <span className="font-semibold text-lg tracking-tight text-[color:var(--arco-text-1)]">天琊的图床工具</span>
          </Link>
          
          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-sm font-medium text-[color:var(--arco-text-2)] hover:text-[color:var(--arco-primary-6)] transition-colors"
                >
                  图片管理
                </Link>
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-[color:var(--arco-border)]">
                  <div className="flex items-center gap-2 text-sm text-[color:var(--arco-text-2)]">
                    <UserIcon className="w-4 h-4" />
                    <span className="max-w-[120px] truncate">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-[color:var(--arco-text-3)] hover:text-[color:var(--arco-danger-6)] hover:bg-[color:var(--arco-fill-1)] rounded-md transition-colors"
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
                  className="text-sm font-medium text-[color:var(--arco-text-2)] hover:text-[color:var(--arco-primary-6)] transition-colors"
                >
                  登录
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn-primary"
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
      
      <footer className="bg-white border-t border-[color:var(--arco-border)] py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-[color:var(--arco-text-3)]">
          <p>© {new Date().getFullYear()} 天琊的图床工具. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
