
import React, { useEffect, useState } from 'react';
import { Device, AuthMode } from '../types';
import { getAllDevices, deleteDevice } from '../services/apiClient';
import { Plus, Edit, FileText, Trash2, Search, Monitor, RefreshCw, ScanFace, Fingerprint, ShieldCheck } from 'lucide-react';

interface DeviceListProps {
  onEdit: (serialNo: string) => void;
  onCreate: () => void;
  onViewLogs: (serialNo: string) => void;
}

// デバイス一覧と基本操作（作成・編集・削除）を提供する。
export const DeviceList: React.FC<DeviceListProps> = ({ onEdit, onCreate, onViewLogs }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // バックエンドから最新のデバイス一覧を取得し、状態に反映する。
  const loadDevices = async () => {
    setLoading(true);
    try {
      const data = await getAllDevices();
      setDevices(data);
    } catch (e) {
      console.error('getAllDevices error:', e);
      alert("デバイスの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 初回マウント時に一覧をロードする。
  useEffect(() => {
    loadDevices();
  }, []);

  // 削除確認を挟み、完了後に一覧をリロードする。
  const handleDelete = async (serialNo: string) => {
    if (window.confirm(`${serialNo} を削除してもよろしいですか？`)) {
      await deleteDevice(serialNo);
      loadDevices();
    }
  };

  // 認証モードごとの表示バッジを生成し、視認性を高める。
  const getAuthModeLabel = (mode: AuthMode) => {
    switch (mode) {
      case AuthMode.Face: 
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 min-w-[120px]">
            <ScanFace size={16} className="mr-2 flex-shrink-0" />
            <div className="flex flex-col text-left leading-none">
                <span className="font-bold text-[11px] mb-0.5">顔認証</span>
                <span className="text-[9px] opacity-80 font-normal">Face Recog.</span>
            </div>
          </span>
        );
      case AuthMode.Vein: 
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 min-w-[120px]">
            <Fingerprint size={16} className="mr-2 flex-shrink-0" />
            <div className="flex flex-col text-left leading-none">
                <span className="font-bold text-[11px] mb-0.5">静脈認証</span>
                <span className="text-[9px] opacity-80 font-normal">Palm Vein</span>
            </div>
          </span>
        );
      case AuthMode.FaceAndVein: 
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 min-w-[120px]">
            <ShieldCheck size={16} className="mr-2 flex-shrink-0" />
            <div className="flex flex-col text-left leading-none">
                <span className="font-bold text-[11px] mb-0.5">顔＋静脈</span>
                <span className="text-[9px] opacity-80 font-normal">Dual Auth</span>
            </div>
          </span>
        );
      default: return <span>不明</span>;
    }
  };

  const filteredDevices = devices.filter(d => 
    d.deviceName.includes(searchTerm) || d.serialNo.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">デバイス一覧</h2>
          <p className="text-slate-500 text-sm mt-1">登録済み認証デバイスの管理を行います。</p>
        </div>
        <button 
          onClick={onCreate}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          <span>新規登録</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-center h-32">
          <h3 className="text-slate-500 text-sm font-medium mb-1">登録デバイス総数</h3>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-slate-900">{devices.length}</span>
            <span className="text-slate-400 text-sm">台</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-center h-32 opacity-60">
          <h3 className="text-slate-500 text-sm font-medium mb-1">稼働中</h3>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-green-600">{devices.filter(d => d.isActive).length}</span>
            <span className="text-slate-400 text-sm">台</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="シリアル番号　/ 端末名 で検索..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={loadDevices} className="flex items-center justify-center space-x-2 px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 text-slate-600 text-sm">
          <RefreshCw size={16} />
          <span>再読み込み</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            読み込み中...
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            デバイスが見つかりません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">シリアル番号</th>
                  <th className="px-6 py-4">端末名</th>
                  <th className="px-6 py-4">認証モード</th>
                  <th className="px-6 py-4">状態</th>
                  <th className="px-6 py-4">最終更新</th>
                  <th className="px-6 py-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDevices.map((device) => (
                  <tr key={device.serialNo} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-900 font-medium">{device.serialNo}</td>
                    <td className="px-6 py-4 flex items-center space-x-2">
                      <Monitor size={16} className="text-slate-400" />
                      <span>{device.deviceName}</span>
                    </td>
                    <td className="px-6 py-4">{getAuthModeLabel(device.authMode)}</td>
                    <td className="px-6 py-4">
                      {device.isActive ? (
                        <span className="flex items-center text-green-600 text-xs font-medium">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          稼働中
                        </span>
                      ) : (
                        <span className="flex items-center text-slate-400 text-xs font-medium">
                          <span className="w-2 h-2 bg-slate-300 rounded-full mr-2"></span>
                          停止
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(device.lastUpdated).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => onViewLogs(device.serialNo)}
                          title="履歴"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <FileText size={16} />
                        </button>
                        <button 
                          onClick={() => onEdit(device.serialNo)}
                          title="編集"
                          className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(device.serialNo)}
                          title="削除"
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

