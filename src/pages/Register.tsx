import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import toast from 'react-hot-toast';
import { toErrorMessage } from '../lib/utils';

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success('注册成功！');
      navigate('/dashboard');
    } catch (error: unknown) {
      toast.error(toErrorMessage(error) || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 card p-8">
      <h2 className="text-xl font-semibold text-center text-[color:var(--arco-text-1)] mb-6">创建新账号</h2>
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[color:var(--arco-text-2)] mb-1">邮箱地址</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[color:var(--arco-text-2)] mb-1">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="input"
            placeholder="至少 6 位字符"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full btn btn-primary"
        >
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-[color:var(--arco-text-2)]">
        已有账号？{' '}
        <Link to="/login" className="text-[color:var(--arco-primary-6)] hover:text-[color:var(--arco-primary-7)]">
          直接登录
        </Link>
      </p>
    </div>
  );
};
