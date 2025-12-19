import React, { useEffect, useState, useRef } from 'react';
import { AuthLog, AuthMode } from '../types';
import { api } from '../services/apiClient';
import {
  RefreshCw,
  Search,
  ScanFace,
  Fingerprint,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Calendar as CalendarIcon,
  User as UserIcon,
  Camera,
  X,
  ChevronRight,
  ChevronLeft,
  Download,
  History,
  Filter,
  ChevronsLeft,
  ChevronsRight,
  ListOrdered,
  Settings2,
} from 'lucide-react';

// --- ヘルパー関数 ---

/**
 * 日付文字列を日本語形式に変換する関数
 * @param dateStr - YYYY-MM-DD形式の日付文字列、またはISO形式の文字列
 * @returns 日本語形式の日付（例: 2025年12月18日）、空文字列の場合は「日付指定なし (All)」
 */
const formatDate = (dateStr: string) => {
  if (!dateStr) return '日付指定なし (All)';
  if (dateStr.includes('-') && !dateStr.includes('T')) {
    const [y, m, d] = dateStr.split('-');
    return `${y}年${m}月${d}日`;
  }
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
};

/**
 * ISO形式の日時文字列から時刻部分を抽出
 * @param isoString - ISO 8601形式の日時文字列
 * @returns 24時間表記の時刻（例: 14:30:45）
 */
const formatTime = (isoString: string) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString('ja-JP', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

/**
 * 日付と時刻を結合して表示用の文字列を作成
 * @param isoString - ISO 8601形式の日時文字列
 * @returns 日本語形式の日時（例: 2025年12月18日 14:30:45）
 */
const formatDateTime = (isoString: string) => {
  return `${formatDate(isoString)} ${formatTime(isoString)}`;
};

// --- カスタムコンポーネント ---

/**
 * カスタム日付ピッカーコンポーネント
 * ネイティブのinput[type="date"]の代わりに使用し、以下の機能を提供：
 * - 日本語のカレンダー表示（曜日: 日月火水木金土）
 * - 月の切り替え（前月/次月ボタン）
 * - 「今日」ボタンで現在日付へジャンプ
 * - クリアボタン（X）で日付選択を解除
 * - 外側クリックで自動クローズ
 */
const CustomDatePicker = ({ value, onChange }: { value: string; onChange: (date: string) => void }) => {
  // カレンダーの開閉状態
  const [isOpen, setIsOpen] = useState(false);
  // カレンダー表示中の年月（選択中の日付とは異なる場合がある）
  const [viewDate, setViewDate] = useState(() => (value ? new Date(value) : new Date()));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 前月へ移動
  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  // 次月へ移動
  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // カレンダーから日付を選択
  const handleSelectDate = (day: number) => {
    const year = viewDate.getFullYear();
    const month = String(viewDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    onChange(`${year}-${month}-${dayStr}`);
    setIsOpen(false);
  };

  // 「今日」ボタン - 現在日付を選択して今月のカレンダーを表示
  const handleToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const dayStr = String(today.getDate()).padStart(2, '0');

    onChange(`${year}-${month}-${dayStr}`);
    setViewDate(today); // カレンダー表示を今月にリセット
    setIsOpen(false);
  };

  // クリアボタン（X）- 日付選択を解除して全件表示モードへ
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation(); // 親要素のクリックイベントを防止
    onChange(''); // 日付をクリア
    setIsOpen(false);
  };

  // カレンダーグリッドの生成
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay(); // 0 = 日曜日

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const currentDateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isSelected = value === currentDateStr;
    days.push(
      <button
        key={d}
        onClick={() => handleSelectDate(d)}
        className={`h-8 w-8 rounded-full flex items-center justify-center text-sm transition-colors ${isSelected ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-100 text-slate-700'
          }`}
      >
        {d}
      </button>,
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between space-x-2 bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors min-w-[200px] cursor-pointer"
      >
        <div className="flex items-center space-x-2">
          <CalendarIcon size={16} className="text-slate-500" />
          <span className={`font-mono ${!value ? 'text-slate-400' : 'text-slate-700'}`}>
            {formatDate(value)}
          </span>
        </div>
        {value && (
          <button onClick={handleClear} className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400">
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-200 p-4 z-50 w-64 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex justify-between items-center mb-4">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500">
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-slate-700">
              {viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月
            </span>
            <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
              <span
                key={day}
                className={`text-xs font-bold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-400'
                  }`}
              >
                {day}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">{days}</div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex justify-center">
            <button
              onClick={handleToday}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold py-1 px-3 rounded hover:bg-blue-50 transition-colors"
            >
              今日
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 認証ログ詳細モーダルコンポーネント
 * テーブル行をクリックした際に認証ログの詳細情報を表示
 * - カメラスナップショット風のビジュアル
 * - 認証結果（成功/失敗）のステータス表示
 * - ユーザー情報、デバイス情報、認証方式などの詳細
 */
const AuthDetailModal = ({ log, onClose }: { log: AuthLog; onClose: () => void }) => {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200 max-h-[90vh]">
        {/* Left: Simulated Camera Snapshot */}
        <div className="w-full md:w-5/12 bg-slate-900 flex flex-col items-center justify-center p-6 relative min-h-[250px]">
          <div className="absolute top-4 left-4 bg-red-600/90 text-white text-[10px] px-2 py-0.5 rounded font-bold flex items-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse"></div> REC
          </div>

          <div className="w-full aspect-square bg-slate-800 rounded-lg border border-slate-700 flex flex-col items-center justify-center text-slate-500 relative overflow-hidden group">
            {/* Abstract Face Visualization */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-40 transition-opacity">
              <ScanFace size={80} />
            </div>

            {/* Target Overlay */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-green-500/50"></div>
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-green-500/50"></div>
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-green-500/50"></div>
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-green-500/50"></div>

            <Camera size={32} className="mb-2 z-10 text-slate-400" />
            <span className="text-xs z-10">画像</span>
          </div>

          <div className="mt-4 w-full">
            <div className="flex justify-between text-xs text-slate-400 font-mono border-t border-slate-700 pt-2">
              <span>時間</span>
              <span>{formatTime(log.timestamp)}</span>
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div className="w-full md:w-7/12 p-6 flex flex-col bg-white">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">認証ログ詳細</h3>
                <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-mono">
                  #ID{log.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">データ取得</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {/* Status Banner */}
            <div
              className={`p-4 rounded-lg border flex items-center ${log.isSuccess ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                }`}
            >
              <div
                className={`mr-3 p-2 rounded-full ${log.isSuccess ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
                  }`}
              >
                {log.isSuccess ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              </div>
              <div>
                <p className={`font-bold ${log.isSuccess ? 'text-green-800' : 'text-red-800'}`}>
                  {log.isSuccess ? '認証成功 ' : '認証失敗 '}
                </p>
                {!log.isSuccess && log.errorMessage && (
                  <p className="text-xs text-red-600 mt-0.5">{log.errorMessage}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-xs text-slate-400 block mb-1">ユーザーID（必須）</span>
                <p className="font-mono font-bold text-slate-700">{log.userId}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-xs text-slate-400 block mb-1">ユーザー名（任意）</span>
                {/* @ts-ignore */}
                {log.userName ? (
                  <p className="font-bold text-slate-700 truncate">{log.userName}</p>
                ) : (
                  <p className="text-slate-400 italic text-xs">-</p>
                )}
              </div>
              <div className="col-span-2 p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-xs text-slate-400 block mb-1">認証方式</span>
                <div className="flex items-center text-slate-700 font-medium">
                  {log.authMode === AuthMode.Face && (
                    <>
                      <ScanFace size={14} className="mr-1" /> 顔認証
                    </>
                  )}
                  {log.authMode === AuthMode.Vein && (
                    <>
                      <Fingerprint size={14} className="mr-1" /> 静脈認証
                    </>
                  )}
                  {log.authMode === AuthMode.FaceAndVein && (
                    <>
                      <ShieldCheck size={14} className="mr-1" /> 顔＋静脈認証
                    </>
                  )}
                </div>
              </div>
              <div className="col-span-2 p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-xs text-slate-400 block mb-1">デバイスシリアル番号</span>
                <p className="font-medium text-slate-700">{log.deviceName}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{log.serialNo}</p>
              </div>
              <div className="col-span-2 p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-xs text-slate-400 block mb-1">日時</span>
                <p className="font-mono text-slate-700">{formatDateTime(log.timestamp)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors text-sm shadow-sm"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 認証履歴メインコンポーネント
 * 機能:
 * - 認証ログの一覧表示（日時降順）
 * - 日付フィルター（カスタムカレンダー）
 * - 認証モードフィルター（顔/静脈/顔＋静脈）
 * - テキスト検索（ユーザーID、ユーザー名、デバイス名）
 * - CSV出力
 * - 詳細モーダル表示
 */
export const AuthHistory: React.FC = () => {
  // 認証ログデータ
  const [logs, setLogs] = useState<AuthLog[]>([]);
  // ローディング状態
  const [loading, setLoading] = useState(true);
  // 検索キーワード
  const [searchTerm, setSearchTerm] = useState('');
  // 詳細モーダル表示用の選択されたログ
  const [selectedLog, setSelectedLog] = useState<AuthLog | null>(null);

  // --- 分割表示用のステート (Pagination State) ---
  const [currentPage, setCurrentPage] = useState(1); // 現在のページ
  const [pageSize, setPageSize] = useState(10);    // 1ページあたりの表示数

  // 選択中の日付（初期値: 今日）- タイムゾーンを考慮してYYYY-MM-DD形式で保持
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split('T')[0];
  });

  // 認証モードフィルター（ALL / Face / Vein / FaceAndVein）
  const [filterAuthMode, setFilterAuthMode] = useState<string>('ALL');

  // フィルター条件が変わった際にページを1に戻す (Reset to page 1 on filter change)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDate, filterAuthMode, pageSize]);

  /**
   * 認証ログをAPIから取得し、日時降順でソート
   * selectedDateが指定されている場合はその日のログのみ取得
   */
  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuthLogs(selectedDate);
      // 新しいログが上に来るように降順ソート
      const sorted = [...data].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setLogs(sorted);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // 日付が変更されたらログを再取得
  useEffect(() => {
    loadLogs();
  }, [selectedDate]);

  /**
   * 現在フィルター適用中のログをCSV形式でダウンロード
   * BOM付きUTF-8エンコーディングでExcelとの互換性を確保
   */
  const downloadCSV = () => {
    const headers = ['ID', 'Time', 'UserID', 'UserName', /*'DeviceName',*/ 'DeviceSerialNo', 'AuthMode', 'Result', 'Message'];
    const rows = filteredLogs.map((log) => {
      // @ts-ignore
      const userName = log.userName || '';
      return [
        log.id,
        formatDateTime(log.timestamp),
        log.userId,
        userName,
        //log.deviceName,
        log.serialNo,
        log.authMode === AuthMode.Face ? 'Face' : log.authMode === AuthMode.Vein ? 'Vein' : 'Dual',
        log.isSuccess ? 'Success' : 'Failed',
        log.errorMessage || '',
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((row) => row.map((item) => `"${item}"`).join(','))].join(
      '\n',
    );

    // Add BOM for Excel compatibility with Japanese text
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `auth_logs_${selectedDate || 'all'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * ログのフィルタリング処理
   */
  const filteredLogs = logs.filter((log) => {
    // 1. 日付フィルター
    if (selectedDate && !log.timestamp.startsWith(selectedDate)) return false;

    // 2. 認証モードフィルター
    if (filterAuthMode !== 'ALL') {
      const mode = parseInt(filterAuthMode);
      if (log.authMode !== mode) return false;
    }

    // 3. キーワード検索フィルター (ユーザーID、氏名、シリアル番号)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      // @ts-ignore
      const uName = log.userName ? log.userName.toLowerCase() : '';
      return (
        log.userId.toLowerCase().includes(term) ||
        uName.includes(term) ||
        // log.deviceName.toLowerCase().includes(term) || // 以前の要望によりDeviceNameは検索対象外
        log.serialNo.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // --- 分割表示ロジック (Pagination Logic) ---
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-slate-800">
          <History size={20} className="text-slate-500" />
          <h2 className="text-2xl font-bold">認証履歴</h2>
        </div>
        <p className="text-slate-500 text-sm mt-1">入退室およびデバイス認証のログを確認します。</p>
        <button
          onClick={downloadCSV}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors text-sm font-medium"
        >
          <Download size={18} />
          <span>CSV出力</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        {/* Date Filter */}
        <div className="w-full md:w-auto z-10">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">日付フィルター</label>
          <CustomDatePicker value={selectedDate} onChange={setSelectedDate} />
        </div>

        {/* Auth Mode Filter */}
        <div className="w-full md:w-auto min-w-[180px]">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">認証モードフィルター</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <select
              value={filterAuthMode}
              onChange={(e) => setFilterAuthMode(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm appearance-none bg-white cursor-pointer"
            >
              <option value="ALL">全て (All Modes)</option>
              <option value={AuthMode.Face}>顔認証 (Face)</option>
              <option value={AuthMode.Vein}>静脈認証 (Vein)</option>
              <option value={AuthMode.FaceAndVein}>顔＋静脈認証 (Dual)</option>
            </select>
            {/* Custom Arrow for select */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 w-full relative">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">検索</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="ユーザーID、ユーザー名、デバイスシリアル番号で検索..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Records Per Page Filter */}
        <div className="w-full md:w-auto min-w-[120px]">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">表示数</label>
          <div className="relative">
            <ListOrdered className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value))}
              className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm appearance-none bg-white cursor-pointer font-bold"
            >
              <option value={5}>5件</option>
              <option value={10}>10件</option>
              <option value={25}>25件</option>
              <option value={50}>50件</option>
              <option value={100}>100件</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <Settings2 size={14} />
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="w-full md:w-auto self-end">
          <button
            onClick={loadLogs}
            className="w-full md:w-auto flex items-center justify-center space-x-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 text-sm h-[38px]"
          >
            <RefreshCw size={16} />
            <span>更新</span>
          </button>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            読み込み中...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-slate-500 bg-slate-50">
            <div className="mx-auto w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mb-3">
              <Search className="text-slate-400" />
            </div>
            <p className="font-medium">該当するログが見つかりません</p>
            <p className="text-xs mt-1">日付フィルターや認証モードフィルター設定を見直してください。</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 whitespace-nowrap">
                  <tr>
                    <th className="px-6 py-3">日時</th>
                    <th className="px-6 py-3">ユーザーID</th>
                    <th className="px-6 py-3 flex items-center gap-1">
                      ユーザー名
                      <span className="text-[10px] text-slate-400 font-normal border border-slate-300 rounded px-1">
                        任意
                      </span>
                    </th>
                    <th className="px-6 py-3">デバイスシリアル番号</th>
                    <th className="px-6 py-3">認証モード</th>
                    <th className="px-6 py-3">認証結果</th>
                    <th className="px-6 py-3 text-right">認証履歴詳細</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-6 py-4 text-xs whitespace-nowrap font-medium text-slate-700">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 text-slate-500 shrink-0">
                            <UserIcon size={14} />
                          </div>
                          <span className="font-mono text-slate-800">{log.userId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {/* @ts-ignore */}
                        {log.userName ? (
                          <span className="font-bold text-slate-700">{log.userName}</span>
                        ) : (
                          <span className="text-slate-400 italic text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          {/* log.deviceNameは現在Backendから取得できないため非表示にしています */}
                          {/* <span className="text-slate-900 font-medium">{log.deviceName}</span> */}
                          <span className="text-xs text-slate-400 font-mono">{log.serialNo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-xs">
                          {log.authMode === AuthMode.Face && (
                            <span className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                              <ScanFace size={14} className="mr-1" /> 顔認証
                            </span>
                          )}
                          {log.authMode === AuthMode.Vein && (
                            <span className="flex items-center text-purple-600 bg-purple-50 px-2 py-1 rounded-full border border-purple-100">
                              <Fingerprint size={14} className="mr-1" /> 静脈認証
                            </span>
                          )}
                          {log.authMode === AuthMode.FaceAndVein && (
                            <span className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                              <ShieldCheck size={14} className="mr-1" /> 顔＋静脈認証
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {log.isSuccess ? (
                          <div className="flex items-center text-green-600 text-xs font-bold">
                            <CheckCircle2 size={16} className="mr-1.5" />
                            <span>成功</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600 text-xs font-bold">
                            <ShieldAlert size={16} className="mr-1.5" />
                            <span>失敗</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight
                          size={16}
                          className="text-slate-300 ml-auto group-hover:text-blue-500 transition-colors"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-slate-500 font-medium flex items-center gap-2">
                <span>
                  全 <span className="text-slate-900 font-bold">{totalItems}</span> 件中
                  <span className="text-blue-600 font-bold mx-1">
                    {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
                    {Math.min(currentPage * pageSize, totalItems)}
                  </span>{' '}
                  件を表示
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
                  title="最初へ"
                >
                  <ChevronsLeft size={18} />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-all text-xs font-bold"
                >
                  <ChevronLeft size={18} /> 前ページ
                </button>

                <div className="flex items-center px-3 text-sm font-bold text-slate-700">
                  {currentPage} / {totalPages || 1}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || totalPages === 0}
                  className="flex items-center gap-1 px-3 py-1 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-all text-xs font-bold"
                >
                  次ページ <ChevronRight size={18} />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages || totalPages === 0}
                  className="p-2 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
                  title="最後へ"
                >
                  <ChevronsRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && <AuthDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
};
