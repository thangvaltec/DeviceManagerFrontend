
import React, { useEffect, useState } from 'react';
import { Device, AuthMode } from '../types';
import { api } from '../services/apiClient';
import { ArrowLeft, Save, Loader2, ScanFace, Fingerprint, ShieldCheck } from 'lucide-react';

interface DeviceEditProps {
  serialNo: string | null; // null = create mode
  onBack: () => void;
  onSaved: () => void;
}

// デバイスの作成・編集フォームを司るコンポーネント。
export const DeviceEdit: React.FC<DeviceEditProps> = ({ serialNo, onBack, onSaved }) => {
  const [formData, setFormData] = useState<Partial<Device>>({
    serialNo: '',
    deviceName: '',
    authMode: AuthMode.Face,
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const isEdit = !!serialNo;

  // 編集時は既存データを取得してフォームへ反映する。
  useEffect(() => {
    if (isEdit && serialNo) {
      setInitializing(true);
      api.getDevice(serialNo).then(d => {
        if (d) setFormData(d);
        setInitializing(false);
      });
    }
  }, [serialNo, isEdit]);

  // 入力値を検証し、作成か更新のAPIを呼び出す。
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serialNo || !formData.deviceName) return;
    
    setLoading(true);
    try {
      if (isEdit && serialNo) {
        await api.updateDevice(serialNo, formData);
      } else {
        await api.createDevice(formData as Device);
      }
      onSaved();
    } catch (error: any) {
      alert(error.message || "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ArrowLeft size={18} className="mr-1" />
        戻る
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">
            {isEdit ? 'デバイス設定の編集' : '新規デバイス登録'}
          </h2>
          {isEdit && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">編集モード</span>}
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Serial No / Device ID */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                シリアル番号
              </label>
              <input
                type="text"
                required
                disabled={isEdit}
                className={`w-full px-4 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  isEdit ? 'bg-slate-100 text-slate-500 border-slate-200' : 'border-slate-300'
                }`}
                value={formData.serialNo}
                onChange={e => setFormData({...formData, serialNo: e.target.value})}
                placeholder="例: 222222 または KF5KW..."
              />
              <p className="text-[10px] text-slate-400 mt-1">
                * 手入力ID、またはシリアル番号を入力してください。
              </p>
            </div>

            {/* Device Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                デバイス名 (利用者)
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={formData.deviceName}
                onChange={e => setFormData({...formData, deviceName: e.target.value})}
                placeholder="Bodycamera_01"
              />
            </div>
          </div>

          {/* Auth Mode - Card Selection Style */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              認証モード設定
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { val: AuthMode.Face, label: '顔認証', sub: 'Face Recog.', icon: ScanFace },
                { val: AuthMode.Vein, label: '静脈認証', sub: 'Palm Vein', icon: Fingerprint },
                { val: AuthMode.FaceAndVein, label: '顔＋静脈', sub: 'Dual Auth', icon: ShieldCheck },
              ].map((opt) => {
                const isSelected = formData.authMode === opt.val;
                const Icon = opt.icon;
                return (
                  <label 
                    key={opt.val}
                    className={`relative flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all h-32 ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
                        : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="authMode"
                      className="sr-only"
                      checked={isSelected}
                      onChange={() => setFormData({...formData, authMode: opt.val})}
                    />
                    <Icon size={32} className={`mb-3 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className={`text-sm font-bold ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>{opt.label}</span>
                    <span className={`text-xs ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>{opt.sub}</span>
                  </label>
                )
              })}
            </div>
            
            {/* Note Footer - Dynamic Text based on selection */}
            <p className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded text-xs text-slate-500 italic">
              {formData.authMode === AuthMode.Face && "* セキュリティ低。利便性・速度優先。"}
              {formData.authMode === AuthMode.Vein && "* セキュリティ高。専用ハードウェア必要。"}
              {formData.authMode === AuthMode.FaceAndVein && "* 最高セキュリティ。顔と静脈の二要素認証。"}
            </p>
          </div>

          {/* Is Active */}
          <div className="pt-2">
            <div className="flex items-center">
              <input
                id="isActive"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                checked={formData.isActive}
                onChange={e => setFormData({...formData, isActive: e.target.checked})}
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-slate-900">
                このデバイスを有効にする (稼働中)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md shadow-blue-500/20 text-sm font-bold transition-all transform hover:scale-[1.02]"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              <span>設定を保存</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
