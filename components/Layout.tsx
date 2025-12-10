
import React from 'react';
import { LogOut, Server, Menu, X, UserCircle, Users } from 'lucide-react';
import { api } from '../services/apiClient';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

// 画面全体のレイアウトとナビゲーションを統括するコンポーネント。
export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const currentUser = api.getCurrentUser();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // サイドバーの各リンクを描画し、クリックでナビゲーションを実行する。
  const NavItem = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
    <button
      onClick={() => { onNavigate(id); setMobileMenuOpen(false); }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
        activePage === id 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-800 text-white shadow-xl z-20">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold tracking-tight">管理システム</h1>
          <p className="text-xs text-slate-400 mt-1">Valtec System</p>
        </div>
        
        {currentUser && (
          <div className="px-6 py-4 bg-slate-700/50 border-b border-slate-700">
            <div className="flex items-center space-x-2 text-slate-300 mb-1">
              <UserCircle size={14} />
              <div className="flex flex-col">
                  <span className="text-xs font-medium uppercase tracking-wider">User</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
                <p className="font-bold text-sm truncate">{currentUser.username}</p>
                {isSuperAdmin && <span className="text-[10px] bg-red-600 px-1.5 py-0.5 rounded text-white">ADMIN</span>}
            </div>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="mb-4">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
            <NavItem id="dashboard" label="デバイス一覧" icon={Server} />
            {isSuperAdmin && (
               <NavItem id="users" label="ユーザー管理" icon={Users} />
            )}
          </div>

        </nav>
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors w-full px-4 py-2"
          >
            <LogOut size={18} />
            <span>ログアウト</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-800 text-white flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 flex justify-between items-center border-b border-slate-700">
              <span className="font-bold text-lg">メニュー</span>
              <button onClick={() => setMobileMenuOpen(false)}><X size={24} /></button>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
              <NavItem id="dashboard" label="デバイス一覧" icon={Server} />
              {isSuperAdmin && (
                <NavItem id="users" label="ユーザー管理" icon={Users} />
              )}
            </nav>
            <div className="p-4 border-t border-slate-700">
              <button onClick={onLogout} className="flex items-center space-x-2 text-slate-400">
                <LogOut size={18} /><span>ログアウト</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white shadow-sm p-4 flex items-center justify-between z-10">
          <div>
            <span className="font-bold text-slate-800 block">デバイス制御ー管理システム</span>
          </div>
          <button onClick={() => setMobileMenuOpen(true)} className="text-slate-600">
            <Menu size={24} />
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
