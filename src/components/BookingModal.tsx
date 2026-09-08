import React, { useState } from 'react';
import { SalonSlot, User, Reservation } from '../types';

interface BookingModalProps {
  slot: SalonSlot | null;
  currentUser: User;
  onClose: () => void;
  onProceedToStripe: (slot: SalonSlot, effectivePrice: number, details?: { offRequired: boolean; nailRequests?: string }) => void;
  existingReservation?: Reservation;
  onCancelReservation: (reservationId: string) => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  gel_art: '定額デザインアート',
  gel_simple: 'ワンカラー・グラデーション',
  paragel_care: 'パラジェル自爪育成ケア',
  foot_nail: 'フットケア＆ジェル',
  special_custom: '持ち込みオーダーデザイン',
  care_off: '自爪美爪ケア＆パック',
  one_on_one: '個別カウンセリング',
  group_study: 'ワークショップ',
  consultation: '相談・チェック',
  special_live: '特別イベント',
};

export const BookingModal: React.FC<BookingModalProps> = ({
  slot,
  currentUser,
  onClose,
  onProceedToStripe,
  existingReservation,
  onCancelReservation,
}) => {
  const [offRequired, setOffRequired] = useState(false);
  const [nailRequests, setNailRequests] = useState('');

  if (!slot) return null;

  const isBookedByMe = !!existingReservation && existingReservation.status === 'confirmed';
  const isFull = slot.bookedCount >= slot.capacity;
  const remaining = Math.max(0, slot.capacity - slot.bookedCount);
  const basePrice = currentUser.tier === 'vip' ? slot.vipPrice : slot.price;
  const offFee = offRequired ? 1100 : 0;
  const effectivePrice = basePrice + offFee;
  const discountAmount = slot.price - (currentUser.tier === 'vip' ? slot.vipPrice : slot.price);

  const categoryLabel = CATEGORY_NAMES[slot.category] || slot.category;

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border border-slate-200 rounded-2xl shadow-xl overflow-hidden bg-white">
          {/* Header */}
          <div className="modal-header bg-slate-50 border-bottom border-slate-200 px-4 py-3.5">
            <div className="d-flex align-items-center gap-2.5">
              <span className="inline-block bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg text-xs font-bold">
                {categoryLabel}
              </span>
              <h5 className="modal-title font-bold text-slate-900 mb-0 text-base">
                施術枠・予約内容の確認
              </h5>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4 p-md-5">
            <div className="row g-4">
              {/* Left Column: Details & Nail Options */}
              <div className="col-md-7 border-end-md">
                <h4 className="font-bold text-slate-900 mb-2 tracking-tight">{slot.title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed mb-4">
                  {slot.description}
                </p>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                  <div className="row g-3 text-xs">
                    <div className="col-6">
                      <span className="text-slate-400 d-block mb-1">
                        <i className="bi bi-calendar-heart me-1 text-rose-500"></i>施術日
                      </span>
                      <strong className="text-slate-900 fs-6">{slot.date}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-slate-400 d-block mb-1">
                        <i className="bi bi-clock me-1 text-rose-500"></i>施術時間
                      </span>
                      <strong className="text-slate-900 fs-6">{slot.startTime} 〜 {slot.endTime}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-slate-400 d-block mb-1">
                        <i className="bi bi-person-badge me-1 text-rose-500"></i>担当ネイリスト
                      </span>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <img
                          src={slot.hostAvatar}
                          alt={slot.hostName}
                          className="rounded-full object-fit-cover border border-rose-200"
                          style={{ width: 22, height: 22 }}
                        />
                        <span className="text-slate-800 font-semibold">{slot.hostName}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <span className="text-slate-400 d-block mb-1">
                        <i className="bi bi-door-open me-1 text-rose-500"></i>空き枠状況
                      </span>
                      <div className="d-flex align-items-center gap-1.5 mt-1">
                        <span className={`badge ${isFull ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'} rounded-full px-2 py-0.5 font-medium`}>
                          {isFull ? '満席（受付終了）' : `ご案内可能`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nail Customization Options */}
                {!isBookedByMe && !isFull && (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl mb-3 text-xs">
                    <div className="font-bold text-slate-800 mb-2 d-flex align-items-center gap-1.5">
                      <i className="bi bi-sliders text-rose-600"></i>
                      <span>事前カウンセリング・追加オプション</span>
                    </div>

                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="offCheck"
                        checked={offRequired}
                        onChange={(e) => setOffRequired(e.target.checked)}
                      />
                      <label className="form-check-label text-slate-700" htmlFor="offCheck">
                        <strong>他店・自店ジェルの付け替えオフあり</strong> (+¥1,100 / 所要時間+30分)
                      </label>
                    </div>

                    <div>
                      <label className="form-label text-slate-600 mb-1 text-[11px]">
                        希望のカラー・デザインの雰囲気・自爪のお悩み（任意）
                      </label>
                      <input
                        type="text"
                        className="form-control text-xs py-1.5 px-2.5 rounded-lg border-slate-200"
                        placeholder="例: ピンクベージュ系で上品に、自爪が割れやすいので補強希望など"
                        value={nailRequests}
                        onChange={(e) => setNailRequests(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {isBookedByMe && existingReservation && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl d-flex align-items-start gap-3 mb-0">
                    <i className="bi bi-check-circle-fill fs-4 text-emerald-600 mt-0.5"></i>
                    <div className="w-100">
                      <div className="font-bold text-emerald-950 text-sm">この日時はご予約済みです</div>
                      <div className="text-xs text-emerald-800 mb-2 font-mono">
                        予約番号: {existingReservation.id}
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm rounded-lg text-xs"
                          onClick={() => {
                            if (window.confirm('この予約をキャンセルしますか？Stripe事前決済分は全額自動返金処理が行われます。')) {
                              onCancelReservation(existingReservation.id);
                              onClose();
                            }
                          }}
                        >
                          <i className="bi bi-x-circle me-1"></i>予約をキャンセル (全額返金)
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Pricing & Checkout Summary */}
              <div className="col-md-5">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 h-100 d-flex flex-column">
                  <h6 className="font-bold text-slate-800 border-bottom border-slate-200 pb-2 mb-3 text-sm">
                    <i className="bi bi-receipt me-1.5 text-rose-600"></i>お支払い内容の確認
                  </h6>

                  <div className="text-xs mb-3 space-y-1">
                    <div className="d-flex justify-content-between text-slate-500 mb-1">
                      <span>ご予約者名:</span>
                      <strong className="text-slate-900">{currentUser.name} 様</strong>
                    </div>
                    <div className="d-flex justify-content-between text-slate-500 mb-1">
                      <span>会員ステータス:</span>
                      <span className={`badge ${currentUser.tier === 'vip' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-200 text-slate-700'}`}>
                        {currentUser.tier === 'vip' ? '👑 VIPサロン会員' : '一般会員'}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between text-slate-500">
                      <span>施術基本料金:</span>
                      <span>¥{slot.price.toLocaleString()}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="d-flex justify-content-between text-emerald-700 font-semibold">
                        <span>VIP優待割引:</span>
                        <span>-¥{discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {offRequired && (
                      <div className="d-flex justify-content-between text-slate-700 font-semibold">
                        <span>ジェル付替オフ:</span>
                        <span>+¥1,100</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center my-auto shadow-xs">
                    <div className="text-slate-400 text-xs mb-1">お支払い合計（税込）</div>
                    <div className="text-3xl font-extrabold text-rose-600">
                      ¥{effectivePrice.toLocaleString()}
                    </div>
                    {currentUser.tier === 'vip' && (
                      <span className="badge bg-purple-50 text-purple-700 border border-purple-200 text-[10px] mt-1">
                        VIP会員限定 ¥1,000 OFF適用中
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    {isBookedByMe ? (
                      <div className="text-center text-emerald-700 text-xs font-semibold py-2">
                        <i className="bi bi-check-all fs-5 me-1"></i>予約・事前決済完了済み
                      </div>
                    ) : isFull ? (
                      <div className="bg-slate-100 text-slate-500 text-center text-xs py-2.5 rounded-lg border border-slate-200">
                        定員に達したため現在新規予約を停止しています
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary w-100 py-2.5 rounded-xl d-flex align-items-center justify-content-center gap-2 text-xs font-bold shadow-md shadow-rose-200 bg-rose-600 hover:bg-rose-700 border-0"
                        onClick={() => onProceedToStripe(slot, effectivePrice, { offRequired, nailRequests })}
                      >
                        <i className="bi bi-credit-card-2-front"></i>
                        <span>Stripe決済画面へ進む</span>
                      </button>
                    )}

                    <div className="text-center mt-2.5 text-[11px] text-slate-400">
                      <i className="bi bi-shield-lock me-1 text-emerald-600"></i>
                      Stripe 256-bit SSL 暗号化決済
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer bg-slate-50 border-top border-slate-200 py-2.5 px-4">
            <span className="text-slate-400 text-xs me-auto font-mono">
              Django CBV <code>BookingCreateView</code> / <code>StripeCheckoutView</code> 連携
            </span>
            <button type="button" className="btn btn-outline-secondary border-slate-200 text-slate-700 hover:bg-slate-100 btn-sm rounded-lg text-xs" onClick={onClose}>
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
