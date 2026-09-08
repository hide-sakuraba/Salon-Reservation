import React from 'react';
import { RealtimeNotification } from '../types';

interface RealtimeToastProps {
  notifications: RealtimeNotification[];
  onDismiss: (id: string) => void;
}

export const RealtimeToast: React.FC<RealtimeToastProps> = ({ notifications, onDismiss }) => {
  if (notifications.length === 0) return null;

  return (
    <div
      className="position-fixed bottom-0 end-0 p-3.5 d-flex flex-column gap-2"
      style={{ zIndex: 1080, maxWidth: 380 }}
    >
      {notifications.map((n) => (
        <div
          key={n.id}
          className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-xl p-3.5 transition-all animate-fade-in"
          role="alert"
        >
          <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-b border-slate-800">
            <div className="d-flex align-items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  n.type === 'booking'
                    ? 'bg-amber-400'
                    : n.type === 'cancellation'
                    ? 'bg-rose-400'
                    : 'bg-indigo-400'
                }`}
              ></span>
              <span className="text-xs font-bold tracking-tight text-white">
                {n.type === 'booking' ? '⚡ リアルタイム予約同期' : n.type === 'cancellation' ? '🔄 枠空き同期' : 'システム通知'}
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono">
                {n.timestamp}
              </span>
              <button
                type="button"
                className="btn-close btn-close-white text-xs p-0 m-0 opacity-60 hover:opacity-100"
                aria-label="Close"
                onClick={() => onDismiss(n.id)}
              ></button>
            </div>
          </div>
          <div className="text-xs text-slate-200 leading-snug d-flex align-items-start justify-content-between gap-2">
            <span>{n.message}</span>
            <span className="badge bg-slate-800 text-slate-400 border border-slate-700 font-mono text-[9px] shrink-0">
              WS Channel
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

