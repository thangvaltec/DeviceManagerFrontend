
import React, { useEffect, useState } from 'react';
import { AdminUser, UserRole } from '../types';
import { api } from '../services/mockBackend';
import { Plus, Trash2, UserPlus, Shield, User, Edit2, X, Lock, Save, AlertCircle } from 'lucide-react';

export const UserList: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  // Form State
  const [editId, setEditId] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [formError, setFormError] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (e) {
      alert("権限がありません、またはデータの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateModal = () => {
      setModalMode('create');
      setEditId(null);
      setUsername('');
      setRole('admin');
      setPassword('');
      setConfirmPassword('');
      setFormError('');
      setIsModalOpen(true);
  };

  const openEditModal = (user: AdminUser) => {
      setModalMode('edit');
      setEditId(user.id);
      setUsername(user.username);
      setRole(user.role);
      setPassword(''); // Blank means no change
      setConfirmPassword('');
      setFormError('');
      setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleDelete = async (id: number, username: string) => {
    if (window.confirm(`ユーザー「${username}」を削除してもよろしいですか？\nこの操作は取り消せません。`)) {
      try {
        await api.deleteUser(id);
        loadUsers();
      } catch (e: any) {
        alert(e.message || "削除に失敗しました");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (modalMode === 'create' && !password) {
        setFormError("パスワードは必須です");
        return;
    }
    if (password && password !== confirmPassword) {
        setFormError("パスワードが一致しません");
        return;
    }
    if (password && password.length < 4) {
        setFormError("パスワードは4文字以上で設定してください");
        return;
    }

    try {
      if (modalMode === 'create') {
        await api.createUser(username, role, password);
      } else {
        if (!editId) return;
        // Only send password if it was entered
        const updateData: any = { role };
        if (password) updateData.password = password;
        
        await api.updateUser(editId, updateData);
      }
      closeModal();
      loadUsers();
    } catch (e: any) {
      setFormError(e.message || "保存に失敗しました");
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ユーザー管理</h2>
          <p className="text-slate-500 text-sm mt-1">
            管理者アカウントの作成・編集・削除を行います。
          </p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors text-sm font-medium"
        >
          <UserPlus size={18} />
          <span>新規ユーザー作成</span>
        </button>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">ユーザー名</th>
              <th className="px-6 py-4">権限 (Role)</th>
              <th className="px-6 py-4">作成日</th>
              <th className="px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 rounded-full">
                    <User size={16} className="text-slate-500" />
                  </div>
                  {user.username}
                </td>
                <td className="px-6 py-4">
                  {user.role === 'super_admin' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                      <Shield size={12} className="mr-1" />
                      Super Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      Admin
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex justify-end gap-2">
                     <button 
                        onClick={() => openEditModal(user)}
                        className="text-slate-400 hover:text-blue-600 p-2 rounded hover:bg-blue-50 transition-colors"
                        title="編集"
                      >
                        <Edit2 size={16} />
                      </button>
                     {user.username !== 'admin' && ( // Prevent deleting main admin
                        <button 
                          onClick={() => handleDelete(user.id, user.username)}
                          className="text-slate-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition-colors"
                          title="削除"
                        >
                          <Trash2 size={16} />
                        </button>
                     )}
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !loading && (
          <div className="p-8 text-center text-slate-500">ユーザーがいません</div>
        )}
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center">
                        {modalMode === 'create' ? <UserPlus size={18} className="mr-2 text-blue-600"/> : <Edit2 size={18} className="mr-2 text-blue-600"/>}
                        {modalMode === 'create' ? '新規ユーザー作成' : 'ユーザー編集'}
                    </h3>
                    <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {formError && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded flex items-start">
                            <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0"/>
                            {formError}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">ユーザー名</label>
                        <input 
                            type="text" 
                            disabled={modalMode === 'edit'}
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className={`w-full px-3 py-2 border rounded outline-none focus:ring-2 focus:ring-blue-500 ${modalMode === 'edit' ? 'bg-slate-100 text-slate-500' : 'border-slate-300'}`}
                            placeholder="例: staff_01"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">権限 (Role)</label>
                        <select 
                            value={role}
                            onChange={e => setRole(e.target.value as UserRole)}
                            className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="admin">一般管理者 (Admin)</option>
                            <option value="super_admin">特権管理者 (Super Admin)</option>
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1">
                            * Super Adminはユーザー管理機能にアクセスできます。
                        </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center">
                            <Lock size={12} className="mr-1"/> 
                            {modalMode === 'edit' ? 'パスワード変更 (空白の場合は変更なし)' : 'パスワード'}
                        </label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                            placeholder="パスワードを入力"
                        />
                        <input 
                            type="password" 
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="パスワードを再入力"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium border border-slate-200">
                            キャンセル
                        </button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold shadow-sm flex justify-center items-center">
                            <Save size={16} className="mr-2"/> 保存する
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
