
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { DeviceList } from './pages/DeviceList';
import { DeviceEdit } from './pages/DeviceEdit';
import { DeviceLogs } from './pages/DeviceLogs';
import { UserList } from './pages/UserList';

type View = 
  | { type: 'LOGIN' }
  | { type: 'LIST' }
  | { type: 'EDIT', serialNo: string | null }
  | { type: 'LOGS', serialNo: string }
  | { type: 'USER_LIST' };

// 画面遷移のルートコンポーネント。ログイン状態に応じて各ページを切り替える。
export default function App() {
  const [view, setView] = useState<View>({ type: 'LOGIN' });

  // ログイン成功時にデバイス一覧へ遷移する。
  const handleLogin = () => setView({ type: 'LIST' });
  // 明示的なログアウトでログイン画面へ戻す。
  const handleLogout = () => setView({ type: 'LOGIN' });

  // 現在のビュー種別に応じてページコンポーネントを選択する。
  const renderContent = () => {
    switch (view.type) {
      case 'LIST':
        return (
          <DeviceList 
            onEdit={(id) => setView({ type: 'EDIT', serialNo: id })}
            onCreate={() => setView({ type: 'EDIT', serialNo: null })}
            onViewLogs={(id) => setView({ type: 'LOGS', serialNo: id })}
          />
        );
      case 'EDIT':
        return (
          <DeviceEdit 
            serialNo={view.serialNo}
            onBack={() => setView({ type: 'LIST' })}
            onSaved={() => setView({ type: 'LIST' })}
          />
        );
      case 'LOGS':
        return (
          <DeviceLogs 
            serialNo={view.serialNo}
            onBack={() => setView({ type: 'LIST' })}
          />
        );
      case 'USER_LIST':
        return <UserList />;
      default:
        return null;
    }
  };

  if (view.type === 'LOGIN') {
    return <Login onLogin={handleLogin} />;
  }

  // Determine active page ID for Layout highlighting
  let activePageId = 'dashboard';
  if (view.type === 'USER_LIST') activePageId = 'users';
  // DeploymentGuide / CodeViewer đã bỏ

  return (
    <Layout 
      activePage={activePageId}
      onNavigate={(page) => {
        if (page === 'users') setView({ type: 'USER_LIST' });
        else setView({ type: 'LIST' });
      }}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
}
