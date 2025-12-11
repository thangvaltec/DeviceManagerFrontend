
import React, { useState } from 'react';
import { api } from '../services/apiClient';
import { Lock, User, Loader2 } from 'lucide-react';

// 管理画面へのログインフォームを提供するコンポーネント。
export const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 認証APIへ投げてセッションを開始し、成功時に親へ通知する。
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.login(username, password);
      onLogin();
    } catch (err: any) {
      setError(err?.message || 'ログイン処理中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-slate-800 px-8 py-6 text-center">
          <h1 className="text-white text-xl font-bold">デバイス管理システム</h1>
          <p className="text-blue-200 text-sm mt-2 font-bold tracking-widest"> Valtec </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">ユーザー名</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">パスワード</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'ログイン'}
          </button>
          
          <div className="bg-slate-50 p-3 rounded text-xs text-slate-500 mt-4 space-y-1 border border-slate-200">
             <div className="flex justify-between">
              <span>テスト用アカウント</span>
            </div>

            <div className="flex justify-between">
              <span>Super Admin:</span>
              <span className="font-mono">admin / valtec</span>
            </div>
           
          </div>
        </form>
      </div>
    </div>
  );
};
