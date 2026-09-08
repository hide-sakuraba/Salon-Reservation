import React, { useState } from 'react';
import { SalonSlot, SlotCategory, User, Reservation } from '../types';

interface HostManagementViewProps {
  slots: SalonSlot[];
  reservations: Reservation[];
  currentUser: User;
  onCreateSlot: (newSlot: Omit<SalonSlot, 'id' | 'bookedCount' | 'bookedUserIds'>) => void;
  onToggleSlotStatus: (slotId: string) => void;
  onDeleteSlot: (slotId: string) => void;
}

export const HostManagementView: React.FC<HostManagementViewProps> = ({
  slots,
  reservations,
  currentUser,
  onCreateSlot,
  onToggleSlotStatus,
  onDeleteSlot,
}) => {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [viewingSlotRoster, setViewingSlotRoster] = useState<SalonSlot | null>(null);

  // New slot form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'gel_art' as SlotCategory,
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:30',
    price: 8800,
    vipPrice: 7800,
    capacity: 1,
    status: 'available' as const,
    meetingUrl: 'プライベートサロン 個室ブースA（自由が丘店）',
  });

  // Calculate stats
  const totalBookings = reservations.filter((r) => r.status === 'confirmed').length;
  const totalRevenue = reservations
    .filter((r) => r.status === 'confirmed')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const activeSlotsCount = slots.filter((s) => s.status === 'available').length;
  const fullSlotsCount = slots.filter((s) => s.status === 'full' || s.bookedCount >= s.capacity).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    onCreateSlot({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      hostName: currentUser.name,
      hostAvatar: currentUser.avatar,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      price: Number(formData.price),
      vipPrice: Number(formData.vipPrice),
      capacity: Number(formData.capacity),
      status: 'available',
      meetingUrl: formData.meetingUrl,
    });

    setShowCreateModal(false);
    // Reset form
    setFormData({
      title: '',
      description: '',
      category: 'gel_art',
      date: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '11:30',
      price: 8800,
      vipPrice: 7800,
      capacity: 1,
      status: 'available',
      meetingUrl: 'プライベートサロン 個室ブースA（自由が丘店）',
    });
  };

  return (
    <div className="container-fluid px-3 px-lg-4 py-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom border-slate-200">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 mb-0 tracking-tight">
              <i className="bi bi-speedometer2 text-indigo-600 me-2"></i>Claire ネイリスト予約管理ダッシュボード
            </h2>
            <span className="badge bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2.5 py-0.5 text-xs font-semibold">
              ホスト権限
            </span>
          </div>
          <p className="text-slate-500 text-xs mb-0">
            サロン主宰者として予約スロットの登録・定員設定・Stripe売上集計・顧客管理を行います。
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm px-3.5 py-2 rounded-xl shadow-md shadow-indigo-100 d-flex align-items-center gap-2 mt-3 mt-md-0 text-xs font-semibold"
          onClick={() => setShowCreateModal(true)}
        >
          <i className="bi bi-plus-circle-fill"></i>
          <span>新規予約枠を作成</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="text-slate-400 text-xs mb-1.5 d-flex align-items-center">
              <i className="bi bi-cash-stack text-emerald-600 me-1.5"></i>Stripe 確定売上
            </div>
            <div className="text-2xl font-bold text-slate-900">¥{totalRevenue.toLocaleString()}</div>
            <div className="text-emerald-700 text-xs font-medium mt-1">決済完了済み</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="text-slate-400 text-xs mb-1.5 d-flex align-items-center">
              <i className="bi bi-ticket-detailed text-indigo-600 me-1.5"></i>確定予約数
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalBookings} 件</div>
            <div className="text-slate-500 text-xs mt-1">メンバー参加枠</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="text-slate-400 text-xs mb-1.5 d-flex align-items-center">
              <i className="bi bi-calendar-check text-indigo-500 me-1.5"></i>受付中スロット
            </div>
            <div className="text-2xl font-bold text-slate-900">{activeSlotsCount} 枠</div>
            <div className="text-indigo-600 text-xs font-medium mt-1">空き枠あり</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="text-slate-400 text-xs mb-1.5 d-flex align-items-center">
              <i className="bi bi-fire text-rose-500 me-1.5"></i>満席スロット
            </div>
            <div className="text-2xl font-bold text-slate-900">{fullSlotsCount} 枠</div>
            <div className="text-rose-600 text-xs font-medium mt-1">定員上限到達</div>
          </div>
        </div>
      </div>

      {/* Slots Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden mb-4">
        <div className="bg-slate-50/70 border-bottom border-slate-200 py-3.5 px-4 d-flex justify-content-between align-items-center">
          <h5 className="text-sm font-bold mb-0 text-slate-900">
            <i className="bi bi-list-columns-reverse me-2 text-indigo-600"></i>登録済み予約枠一覧 ({slots.length}件)
          </h5>
          <span className="badge bg-white text-slate-600 border border-slate-200 font-mono text-[11px]">PostgreSQL ReservationSlot</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 text-xs">
            <thead className="bg-slate-50 text-slate-500 border-bottom border-slate-200">
              <tr>
                <th className="py-3 px-3">メニュー名 / カテゴリ</th>
                <th className="py-3 px-3">開催日時</th>
                <th className="py-3 px-3">参加費 (一般/VIP)</th>
                <th className="py-3 px-3">予約状況 (残/定員)</th>
                <th className="py-3 px-3">ステータス</th>
                <th className="py-3 px-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slots.map((slot) => {
                const isFull = slot.bookedCount >= slot.capacity;
                const remaining = Math.max(0, slot.capacity - slot.bookedCount);

                return (
                  <tr key={slot.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 mb-0.5">{slot.title}</div>
                      <div className="text-slate-400 d-flex align-items-center gap-1.5">
                        <span className="badge bg-slate-100 text-slate-600 border border-slate-200 font-normal text-[10px]">
                          {slot.category === 'gel_art'
                            ? 'アート'
                            : slot.category === 'gel_simple'
                            ? 'シンプル'
                            : slot.category === 'paragel_care'
                            ? 'パラジェル'
                            : slot.category === 'foot_nail'
                            ? 'フット'
                            : slot.category === 'special_custom'
                            ? '持ち込み'
                            : 'ケア・オフ'}
                        </span>
                        <span className="text-truncate" style={{ maxWidth: 220 }}>
                          {slot.description}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{slot.date}</div>
                      <div className="text-slate-400 text-[11px]">{slot.startTime}〜{slot.endTime}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">¥{slot.price.toLocaleString()}</div>
                      <div className="text-emerald-600 text-[11px]">VIP: ¥{slot.vipPrice.toLocaleString()}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full overflow-hidden" style={{ height: 6 }}>
                          <div
                            className={`h-full ${isFull ? 'bg-rose-500' : 'bg-indigo-600'}`}
                            style={{ width: `${Math.min(100, (slot.bookedCount / slot.capacity) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-nowrap font-bold text-slate-700">
                          {slot.bookedCount} / {slot.capacity}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {slot.status === 'closed' ? (
                        <span className="badge bg-slate-100 text-slate-500 border border-slate-200 rounded-full px-2 py-0.5">受付停止中</span>
                      ) : isFull ? (
                        <span className="badge bg-rose-50 text-rose-700 border border-rose-200 rounded-full px-2 py-0.5">満席</span>
                      ) : (
                        <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">受付中 (残{remaining})</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary border-slate-200 text-slate-700 hover:bg-slate-50 text-xs px-2.5 py-1"
                          onClick={() => setViewingSlotRoster(slot)}
                          title="予約参加者一覧"
                        >
                          <i className="bi bi-people me-1 text-indigo-600"></i>参加者 ({slot.bookedCount})
                        </button>
                        <button
                          type="button"
                          className={`btn ${slot.status === 'closed' ? 'btn-outline-success border-emerald-200 text-emerald-700' : 'btn-outline-warning border-amber-200 text-amber-800'} text-xs px-2.5 py-1`}
                          onClick={() => onToggleSlotStatus(slot.id)}
                          title={slot.status === 'closed' ? '受付を再開' : '受付を一時停止'}
                        >
                          {slot.status === 'closed' ? '再開' : '停止'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger border-rose-200 text-rose-600 hover:bg-rose-50 text-xs px-2.5 py-1"
                          onClick={() => {
                            if (window.confirm(`「${slot.title}」を削除しますか？`)) {
                              onDeleteSlot(slot.id);
                            }
                          }}
                          title="削除"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Slot (SessionCreateView) */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border border-slate-200 rounded-2xl shadow-2xl overflow-hidden bg-white">
              <div className="modal-header bg-slate-900 text-white py-3.5 px-4 border-b border-slate-800">
                <h5 className="modal-title text-sm font-bold mb-0 text-white">
                  <i className="bi bi-calendar-plus me-2 text-indigo-400"></i>新規サロン予約枠の登録
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCreateModal(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3 text-xs">
                    <div className="col-md-8">
                      <label className="form-label font-semibold text-slate-700 mb-1">メニュータイトル *</label>
                      <input
                        type="text"
                        className="form-control border-slate-200 text-sm"
                        placeholder="例: 【人気No.1】定額マンスリートレンドニュアンスアート"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label font-semibold text-slate-700 mb-1">カテゴリ *</label>
                      <select
                        className="form-select border-slate-200 text-sm"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as SlotCategory })}
                      >
                        <option value="gel_art">定額アート (90分)</option>
                        <option value="gel_simple">シンプル (60分)</option>
                        <option value="paragel_care">パラジェルケア (75分)</option>
                        <option value="foot_nail">フットネイル (90分)</option>
                        <option value="special_custom">持ち込みデザイン (120分)</option>
                        <option value="care_off">ケア・オフのみ (45分)</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label font-semibold text-slate-700 mb-1">メニュー詳細説明</label>
                      <textarea
                        className="form-control border-slate-200 text-sm"
                        rows={3}
                        placeholder="施術内容、所要時間、注意事項などを記載してください。"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label font-semibold text-slate-700 mb-1">開催日 *</label>
                      <input
                        type="date"
                        className="form-control border-slate-200 text-sm"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label font-semibold text-slate-700 mb-1">開始時刻 *</label>
                      <input
                        type="time"
                        className="form-control border-slate-200 text-sm"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label font-semibold text-slate-700 mb-1">終了時刻 *</label>
                      <input
                        type="time"
                        className="form-control border-slate-200 text-sm"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label font-semibold text-slate-700 mb-1">一般参加費 (円)</label>
                      <input
                        type="number"
                        className="form-control border-slate-200 text-sm"
                        min="0"
                        step="500"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label font-semibold text-slate-700 mb-1">VIP会員優待価格 (円)</label>
                      <input
                        type="number"
                        className="form-control border-slate-200 text-sm"
                        min="0"
                        step="500"
                        value={formData.vipPrice}
                        onChange={(e) => setFormData({ ...formData, vipPrice: Number(e.target.value) })}
                        required
                      />
                      <div className="text-slate-400 text-[10px] mt-0.5">0円でVIP完全無料</div>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label font-semibold text-slate-700 mb-1">募集定員 (人数)</label>
                      <input
                        type="number"
                        className="form-control border-slate-200 text-sm"
                        min="1"
                        max="100"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label font-semibold text-slate-700 mb-1">施術場所（個室ブースなど）</label>
                      <input
                        type="text"
                        className="form-control border-slate-200 text-sm font-mono"
                        placeholder="例: プライベートサロン 個室ブースA"
                        value={formData.meetingUrl}
                        onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-slate-50 border-t border-slate-200 py-2.5 px-4">
                  <button type="button" className="btn btn-outline-secondary border-slate-200 text-slate-700 btn-sm rounded-lg text-xs" onClick={() => setShowCreateModal(false)}>
                    キャンセル
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4 rounded-lg text-xs font-semibold shadow-md shadow-indigo-100">
                    <i className="bi bi-check-lg me-1"></i>スロットを公開登録
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Viewing Roster */}
      {viewingSlotRoster && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border border-slate-200 rounded-2xl shadow-2xl overflow-hidden bg-white">
              <div className="modal-header bg-slate-50 border-b border-slate-200 py-3.5 px-4">
                <div>
                  <h5 className="modal-title text-sm font-bold text-slate-900 mb-0">参加者リスト</h5>
                  <div className="text-xs text-slate-500">{viewingSlotRoster.title}</div>
                </div>
                <button type="button" className="btn-close" onClick={() => setViewingSlotRoster(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <span>予約者数: <strong className="text-slate-900">{viewingSlotRoster.bookedCount} / {viewingSlotRoster.capacity} 名</strong></span>
                  <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">Stripe 決済済</span>
                </div>

                {viewingSlotRoster.bookedCount === 0 ? (
                  <p className="text-slate-400 text-center py-4 text-xs">現在まだ予約者はいません。</p>
                ) : (
                  <ul className="divide-y divide-slate-100 list-unstyled mb-0">
                    {/* Render actual bookings matching this slot */}
                    {reservations
                      .filter((r) => r.slotId === viewingSlotRoster.id && r.status === 'confirmed')
                      .map((r) => (
                        <li key={r.id} className="d-flex justify-content-between align-items-center py-2.5 text-xs">
                          <div>
                            <div className="font-semibold text-slate-800">{r.userName}</div>
                            <div className="text-slate-400 text-[11px]">{r.userEmail}</div>
                          </div>
                          <div className="text-end">
                            <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">¥{r.amount.toLocaleString()} 決済済</span>
                            <div className="text-slate-400 text-[10px] font-mono mt-0.5">ID: {r.id}</div>
                          </div>
                        </li>
                      ))}
                    {/* Simulated attendees if count exceeds matched */}
                    {Array.from({
                      length: Math.max(
                        0,
                        viewingSlotRoster.bookedCount -
                          reservations.filter((r) => r.slotId === viewingSlotRoster.id && r.status === 'confirmed').length
                      ),
                    }).map((_, i) => (
                      <li key={i} className="d-flex justify-content-between align-items-center py-2.5 text-xs">
                        <div>
                          <div className="font-semibold text-slate-800">サロン会員 #{i + 101}</div>
                          <div className="text-slate-400 text-[11px]">member_{i + 101}@salon.jp</div>
                        </div>
                        <div className="text-end">
                          <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">Stripe決済完了</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="modal-footer bg-slate-50 border-t border-slate-200 py-2.5 px-4">
                <button type="button" className="btn btn-outline-secondary border-slate-200 text-slate-700 btn-sm rounded-lg text-xs" onClick={() => setViewingSlotRoster(null)}>
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
