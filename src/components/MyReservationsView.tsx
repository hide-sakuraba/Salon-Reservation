import React, { useState } from 'react';
import { Reservation, User } from '../types';

interface MyReservationsViewProps {
  reservations: Reservation[];
  currentUser: User;
  onCancelReservation: (reservationId: string) => void;
  onGoToCalendar: () => void;
}

export const MyReservationsView: React.FC<MyReservationsViewProps> = ({
  reservations,
  currentUser,
  onCancelReservation,
  onGoToCalendar,
}) => {
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'attended' | 'cancelled'>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Reservation | null>(null);

  const filtered = reservations.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <div className="container-fluid px-3 px-lg-4 py-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">
            <i className="bi bi-ticket-perforated text-indigo-600 me-2"></i>マイ予約・参加管理
          </h2>
          <p className="text-slate-500 text-xs mb-0">
            {currentUser.name} 様が申し込んだサロンセッションの確認・オンラインミーティング参加・Stripe決済履歴です。
          </p>
        </div>

        <div className="bg-slate-100 p-1 rounded-xl d-inline-flex gap-1 mt-3 mt-md-0 border border-slate-200">
          <button
            type="button"
            className={`btn btn-sm text-xs rounded-lg font-medium px-3 ${filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setFilter('all')}
          >
            すべて ({reservations.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm text-xs rounded-lg font-medium px-3 ${filter === 'confirmed' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setFilter('confirmed')}
          >
            予約確定 ({reservations.filter((r) => r.status === 'confirmed').length})
          </button>
          <button
            type="button"
            className={`btn btn-sm text-xs rounded-lg font-medium px-3 ${filter === 'attended' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setFilter('attended')}
          >
            受講済 ({reservations.filter((r) => r.status === 'attended').length})
          </button>
        </div>
      </div>

      {/* Reservation cards */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs text-center py-5 px-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 d-inline-flex align-items-center justify-content-center mb-3 fs-3">
            <i className="bi bi-calendar-x"></i>
          </div>
          <h5 className="font-bold text-slate-900 text-base mb-1">該当する予約はありません</h5>
          <p className="text-slate-500 text-xs mb-4 max-w-md mx-auto">
            カレンダー画面から気になるセッションや1on1メンタリングの枠を予約してみましょう。
          </p>
          <button type="button" className="btn btn-primary px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-indigo-100" onClick={onGoToCalendar}>
            <i className="bi bi-calendar3 me-2"></i>カレンダーを見る
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {filtered.map((res) => {
            const isConfirmed = res.status === 'confirmed';
            const isCancelled = res.status === 'cancelled';

            return (
              <div key={res.id} className="col-12 col-lg-6">
                <div className={`bg-white border ${isConfirmed ? 'border-indigo-100 hover:border-indigo-300' : isCancelled ? 'border-slate-200 opacity-70' : 'border-slate-200'} rounded-2xl p-4 shadow-xs h-100 d-flex flex-column transition-all`}>
                  {/* Status badge & booking ID */}
                  <div className="d-flex justify-content-between align-items-center mb-2.5">
                    <span className="font-mono text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      ID: {res.id}
                    </span>
                    {isConfirmed ? (
                      <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-1 text-[11px] font-semibold">
                        <i className="bi bi-check-circle me-1"></i>予約確定・決済済
                      </span>
                    ) : isCancelled ? (
                      <span className="badge bg-slate-100 text-slate-500 border border-slate-200 rounded-full px-2.5 py-1 text-[11px]">
                        キャンセル済 (全額返金)
                      </span>
                    ) : (
                      <span className="badge bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-1 text-[11px]">
                        受講完了
                      </span>
                    )}
                  </div>

                  <h5 className="font-bold text-slate-900 mb-2.5 text-base tracking-tight">{res.slotTitle}</h5>

                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl mb-3 text-xs">
                    <div className="row g-2">
                      <div className="col-6">
                        <span className="text-slate-400 d-block mb-0.5">開催日</span>
                        <strong className="text-slate-800">
                          <i className="bi bi-calendar3 me-1 text-indigo-500"></i>{res.date}
                        </strong>
                      </div>
                      <div className="col-6">
                        <span className="text-slate-400 d-block mb-0.5">時間</span>
                        <strong className="text-slate-800">
                          <i className="bi bi-clock me-1 text-indigo-500"></i>{res.startTime} 〜 {res.endTime}
                        </strong>
                      </div>
                      <div className="col-6 mt-2">
                        <span className="text-slate-400 d-block mb-0.5">決済金額 (Stripe)</span>
                        <span className="font-bold text-slate-900">
                          {res.amount === 0 ? '¥0 (VIP特典無料)' : `¥${res.amount.toLocaleString()}`}
                        </span>
                      </div>
                      <div className="col-6 mt-2">
                        <span className="text-slate-400 d-block mb-0.5">予約完了時刻</span>
                        <span className="text-slate-500 font-mono text-[11px]">{res.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-auto pt-2.5 border-top border-slate-100">
                    <div className="d-flex gap-2">
                      {isConfirmed && (
                        <a
                          href={res.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-primary rounded-lg text-xs font-semibold px-3 py-1.5 shadow-sm"
                          style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                        >
                          <i className="bi bi-camera-video-fill me-1"></i>ミーティングに参加
                        </a>
                      )}
                      <button
                        type="button"
                        className="btn btn-outline-secondary border-slate-200 text-slate-700 hover:bg-slate-50 btn-sm rounded-lg text-xs"
                        onClick={() => setSelectedReceipt(res)}
                      >
                        <i className="bi bi-receipt me-1"></i>領収書・決済詳細
                      </button>
                    </div>

                    {isConfirmed && (
                      <button
                        type="button"
                        className="btn btn-outline-danger border-rose-200 text-rose-600 hover:bg-rose-50 btn-sm rounded-lg text-xs"
                        onClick={() => {
                          if (window.confirm('本当にこの予約をキャンセルしますか？\nStripe経由での自動返金とカレンダー空き枠への再同期が実行されます。')) {
                            onCancelReservation(res.id);
                          }
                        }}
                      >
                        <i className="bi bi-x-circle me-1"></i>キャンセル
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stripe Receipt Modal */}
      {selectedReceipt && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border border-slate-200 rounded-2xl shadow-2xl overflow-hidden bg-white">
              <div className="modal-header bg-slate-50 border-b border-slate-200 py-3.5 px-4">
                <h5 className="modal-title text-sm font-bold text-slate-900 mb-0">
                  <i className="bi bi-receipt-cutoff me-2 text-indigo-600"></i>Stripe 決済受領証
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedReceipt(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="text-center pb-3 border-bottom border-slate-200 mb-3">
                  <div className="badge bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 mb-2 font-mono text-xs">
                    SalonSync Payment Receipt
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1 text-2xl">
                    {selectedReceipt.amount === 0 ? '¥0' : `¥${selectedReceipt.amount.toLocaleString()}`}
                  </h4>
                  <div className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
                    決済完了 (Succeeded)
                  </div>
                </div>

                <div className="text-xs font-mono">
                  <div className="d-flex justify-content-between py-1.5 border-bottom border-slate-100">
                    <span className="text-slate-400">セッション名:</span>
                    <span className="font-bold text-slate-800 text-end text-truncate" style={{ maxWidth: 220 }}>
                      {selectedReceipt.slotTitle}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between py-1.5 border-bottom border-slate-100">
                    <span className="text-slate-400">予約者:</span>
                    <span className="text-slate-800">{selectedReceipt.userName}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1.5 border-bottom border-slate-100">
                    <span className="text-slate-400">開催日・時間:</span>
                    <span className="text-slate-800">{selectedReceipt.date} {selectedReceipt.startTime}〜{selectedReceipt.endTime}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1.5 border-bottom border-slate-100">
                    <span className="text-slate-400">Stripe Payment Intent:</span>
                    <span className="text-truncate text-indigo-600 font-bold" style={{ maxWidth: 200 }}>
                      {selectedReceipt.stripePaymentIntentId || 'pi_test_manual'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between py-1.5 border-bottom border-slate-100">
                    <span className="text-slate-400">決済ステータス:</span>
                    <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">PAID via STRIPE</span>
                  </div>
                  <div className="d-flex justify-content-between py-1.5">
                    <span className="text-slate-400">発行日時:</span>
                    <span className="text-slate-500">{selectedReceipt.createdAt}</span>
                  </div>
                </div>

                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-[11px] text-indigo-900 mt-3 mb-0">
                  <i className="bi bi-info-circle me-1 text-indigo-600"></i>
                  Django Webhookにより自動同期されたPostgreSQLの<code>PaymentTransaction</code>レコード情報です。
                </div>
              </div>
              <div className="modal-footer bg-slate-50 border-t border-slate-200 py-2.5 px-4">
                <button type="button" className="btn btn-outline-secondary border-slate-200 text-slate-700 btn-sm rounded-lg text-xs" onClick={() => setSelectedReceipt(null)}>
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
