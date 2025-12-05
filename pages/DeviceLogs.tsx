import React, { useEffect, useState } from 'react';
import { DeviceLog } from '../types';
import { api } from '../services/apiClient';
import { ArrowLeft, History, Clock } from 'lucide-react';

interface DeviceLogsProps {
  serialNo: string;
  onBack: () => void;
}

export const DeviceLogs: React.FC<DeviceLogsProps> = ({ serialNo, onBack }) => {
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getLogs(serialNo).then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, [serialNo]);

  const getChangeTypeBadge = (type: string) => {
    switch(type) {
      case 'CREATE': return <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded font-mono">CREATE</span>;
      case 'UPDATE': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-mono">UPDATE</span>;
      case 'DELETE': return <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded font-mono">DELETE</span>;
      default: return <span className="bg-slate-100 text-slate-800 text-xs px-2 py-0.5 rounded font-mono">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={18} className="mr-1" />
          一覧に戻る
        </button>
        <div className="text-right">
          <h2 className="text-xl font-bold text-slate-800 flex items-center justify-end gap-2">
            <History className="text-slate-400" />
            操作履歴
          </h2>
          <p className="text-slate-500 text-sm font-mono">{serialNo}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">読み込み中...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">履歴はありません</div>
        ) : (
          <div className="relative">
             {/* Timeline Line */}
             <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-200"></div>
             
             <ul className="divide-y divide-slate-100">
               {logs.map((log) => (
                 <li key={log.id} className="relative p-6 pl-20 hover:bg-slate-50 transition-colors">
                   {/* Timeline Dot */}
                   <div className="absolute left-6 top-9 w-4 h-4 rounded-full bg-white border-2 border-blue-400 z-10"></div>

                   <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                     <div>
                       <div className="flex items-center space-x-3 mb-1">
                         {getChangeTypeBadge(log.changeType)}
                         <span className="text-sm font-semibold text-slate-800">{log.adminUser}</span>
                       </div>
                       <p className="text-slate-600 text-sm mt-1 bg-slate-50 p-2 rounded border border-slate-100 font-mono text-xs">
                         {log.changeDetails}
                       </p>
                     </div>
                     <div className="flex items-center text-slate-400 text-xs whitespace-nowrap mt-1 sm:mt-0">
                       <Clock size={14} className="mr-1" />
                       {new Date(log.timestamp).toLocaleString('ja-JP')}
                     </div>
                   </div>
                 </li>
               ))}
             </ul>
          </div>
        )}
      </div>
    </div>
  );
};