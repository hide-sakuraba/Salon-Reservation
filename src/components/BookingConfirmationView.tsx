import React, { useState } from 'react';
import { Reservation, User, SalonInfo } from '../types';

interface BookingConfirmationViewProps {
  reservations: Reservation[];
  currentUser: User | null;
  onCancelReservation: (id: string) => void;
  onGoToCalendar: () => void;
  salonInfo: SalonInfo;
}

export const BookingConfirmationView: React.FC<BookingConfirmationViewProps> = ({
  reservations,
  currentUser,
  onCancelReservation,
  onGoToCalendar,
}) => {
  // 現在日時を基準に「今後の予約」と「過去の履歴」に分ける（モックのため単純化）
  const upcomingReservations = reservations.filter(r => r.status === 'confirmed');
  const pastReservations = reservations.filter(r => r.status === 'cancelled' || r.status === 'attended');

  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);

  if (!currentUser) return null;

  return (
    <div className="container py-5">
      <div className="row mb-4 align-items-center">
          <div className="col-md-8">
              <h2 className="fw-bold text-dark mb-1">
                  <i className="bi bi-calendar-check text-indigo-600 me-2" style={{ color: '#4f46e5' }}></i>ご予約状況
              </h2>
              <p className="text-muted small mb-0">現在のご予約や過去の履歴を確認できます。</p>
          </div>
          <div className="col-md-4 text-md-end mt-3 mt-md-0">
              <button onClick={onGoToCalendar} className="btn rounded-pill px-4 text-white shadow-sm fw-bold" style={{ backgroundColor: '#4f46e5' }}>
                  <i className="bi bi-plus-lg me-1"></i> 新しく予約する
              </button>
          </div>
      </div>

      {/* 今後のご予約 */}
      <div className="card border-0 shadow-sm rounded-4 mb-5">
          <div className="card-header bg-white border-bottom-0 pt-4 pb-0 px-4">
              <h3 className="h5 fw-bold text-dark"><i className="bi bi-clock-history me-2 text-primary"></i>今後のご予約</h3>
          </div>
          <div className="card-body p-4">
              {upcomingReservations.length > 0 ? (
                  <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                          <thead className="table-light text-muted small">
                              <tr>
                                  <th scope="col" className="fw-normal rounded-start">予約日時</th>
                                  <th scope="col" className="fw-normal">メニュー/コース</th>
                                  <th scope="col" className="fw-normal">ステータス</th>
                                  <th scope="col" className="fw-normal text-end rounded-end">操作</th>
                              </tr>
                          </thead>
                          <tbody className="border-top-0">
                              {upcomingReservations.map(res => (
                              <tr key={res.id}>
                                  <td className="py-3">
                                      <div className="fw-bold text-dark">{res.date}</div>
                                      <div className="text-muted small">{res.startTime} - {res.endTime}</div>
                                  </td>
                                  <td className="py-3">
                                      <span className="inline-block bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-0.5 rounded text-xs font-bold me-1">{res.category.toUpperCase()}</span>
                                      <div className="fw-bold text-dark mt-1">{res.slotTitle}</div>
                                  </td>
                                  <td className="py-3">
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 text-xs font-bold"><i className="bi bi-check-circle me-1"></i>予約確定</span>
                                  </td>
                                  <td className="py-3 text-end">
                                      <button type="button" className="btn btn-sm btn-outline-danger rounded-3" onClick={() => setCancelTarget(res)}>
                                          キャンセル
                                      </button>
                                  </td>
                              </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              ) : (
                  <div className="text-center py-5">
                      <div className="mb-3 text-muted">
                          <i className="bi bi-calendar-x" style={{ fontSize: '3rem' }}></i>
                      </div>
                      <p className="text-muted fw-bold">現在、今後のご予約はありません。</p>
                  </div>
              )}
          </div>
      </div>

      {/* 過去の履歴 */}
      <div className="card border-0 shadow-sm rounded-4">
          <div className="card-header bg-white border-bottom-0 pt-4 pb-0 px-4">
              <h3 className="h6 fw-bold text-muted mb-0"><i className="bi bi-archive me-2"></i>過去の履歴</h3>
          </div>
          <div className="card-body p-4">
              {pastReservations.length > 0 ? (
                  <div className="table-responsive">
                      <table className="table align-middle mb-0 text-muted">
                          <tbody className="border-top-0">
                              {pastReservations.map(res => (
                              <tr key={res.id}>
                                  <td className="py-2" style={{ width: '200px' }}>
                                      <div className="small">{res.date}</div>
                                  </td>
                                  <td className="py-2">
                                      <div className="small">{res.slotTitle}</div>
                                  </td>
                                  <td className="py-2 text-end">
                                      {res.status === 'cancelled' ? (
                                        <span className="badge bg-light text-secondary border px-2 py-1">キャンセル</span>
                                      ) : (
                                        <span className="badge bg-light text-secondary border px-2 py-1">来店済</span>
                                      )}
                                  </td>
                              </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              ) : (
                  <p className="text-muted small text-center my-4">過去の履歴はありません。</p>
              )}
          </div>
      </div>

      {/* キャンセル確認モーダル */}
      {cancelTarget && (
          <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content rounded-4 border-0 shadow">
                      <div className="modal-header border-bottom-0 pb-0 text-start">
                          <h5 className="modal-title fw-bold text-danger">ご予約のキャンセル</h5>
                          <button type="button" className="btn-close" onClick={() => setCancelTarget(null)}></button>
                      </div>
                      <div className="modal-body text-start">
                          <p className="text-muted mb-4">以下のご予約をキャンセルします。よろしいですか？</p>
                          <div className="bg-light p-3 rounded-3 mb-4">
                              <div className="fw-bold text-dark">{cancelTarget.date} {cancelTarget.startTime}</div>
                              <div className="text-muted small mt-1">{cancelTarget.slotTitle}</div>
                          </div>
                          <div className="d-grid gap-2">
                              <button 
                                  type="button" 
                                  className="btn btn-danger py-2 rounded-3 fw-bold"
                                  onClick={() => {
                                      onCancelReservation(cancelTarget.id);
                                      setCancelTarget(null);
                                  }}
                              >
                                  キャンセルを確定する
                              </button>
                              <button type="button" className="btn btn-light py-2 rounded-3 fw-bold mt-1" onClick={() => setCancelTarget(null)}>閉じる</button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
