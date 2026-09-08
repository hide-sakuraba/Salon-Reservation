import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { SalonSlot, User, StripePaymentData } from '../types';

interface StripeCheckoutModalProps {
  slot: SalonSlot;
  amount: number;
  currentUser: User;
  onClose: () => void;
  onPaymentSuccess: (paymentIntentId: string) => void;
}

export const StripeCheckoutModal: React.FC<StripeCheckoutModalProps> = ({
  slot,
  amount,
  currentUser,
  onClose,
  onPaymentSuccess,
}) => {
  const [formData, setFormData] = useState<StripePaymentData>({
    cardNumber: '4242 4242 4242 4242',
    expMonth: '12',
    expYear: '28',
    cvc: '123',
    nameOnCard: currentUser.name,
    postalCode: '100-0001',
  });

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Auto-fill test card details
  const handleAutoFillTestCard = () => {
    setFormData({
      cardNumber: '4242 4242 4242 4242',
      expMonth: '12',
      expYear: '28',
      cvc: '424',
      nameOnCard: currentUser.name || 'TAROH TANAKA',
      postalCode: '100-0001',
    });
    setErrorMessage('');
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Quick validation
    const cleanNumber = formData.cardNumber.replace(/\s+/g, '');
    if (cleanNumber.length < 15) {
      setErrorMessage('有効なクレジットカード番号を入力してください');
      return;
    }

    setIsProcessing(true);
    setProcessingStep('Stripe Token & PaymentMethod 作成中...');

    try {
      // Step 1: Simulated Stripe Tokenization
      await new Promise((r) => setTimeout(r, 600));
      setProcessingStep('Django バックエンド (Stripe Webhook) に通信中...');

      // Step 2: Simulated Server-side PaymentIntent & Webhook
      await new Promise((r) => setTimeout(r, 800));
      setProcessingStep('決済完了・予約レコードを作成中...');

      await new Promise((r) => setTimeout(r, 600));

      const generatedId = `pi_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
      setPaymentIntentId(generatedId);
      setIsProcessing(false);
      setIsSuccess(true);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Notify parent after brief viewing of confirmation
      setTimeout(() => {
        onPaymentSuccess(generatedId);
      }, 1500);
    } catch (err) {
      setIsProcessing(false);
      setErrorMessage('決済処理中にエラーが発生しました。もう一度お試しください。');
    }
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 520 }}>
        <div className="modal-content border border-slate-200 rounded-2xl shadow-2xl overflow-hidden bg-white">
          {/* Header */}
          <div className="modal-header bg-slate-900 text-white py-3.5 px-4 border-b border-slate-800">
            <div className="d-flex align-items-center gap-2.5">
              <div className="bg-indigo-600 text-white rounded px-2 py-0.5 font-bold font-mono text-xs tracking-wider">
                stripe
              </div>
              <h5 className="modal-title text-sm font-bold mb-0 text-white">
                Stripe 安全決済チェックアウト
              </h5>
            </div>
            {!isProcessing && !isSuccess && (
              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label="Close"
                onClick={onClose}
              ></button>
            )}
          </div>

          {/* Body */}
          <div className="modal-body p-4 p-md-5">
            {isSuccess ? (
              <div className="text-center py-4">
                <div className="d-inline-flex align-items-center justify-content-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-3 fs-2">
                  <i className="bi bi-check-lg"></i>
                </div>
                <h4 className="font-bold text-slate-900 mb-1 tracking-tight">決済が正常に完了しました！</h4>
                <p className="text-slate-500 text-xs mb-4">
                  Stripe決済が確定し、サロン予約がリアルタイムで同期されました。
                </p>
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl mb-4 text-start text-xs font-mono">
                  <div className="d-flex justify-content-between mb-1.5">
                    <span className="text-slate-400">Payment Intent:</span>
                    <span className="font-bold text-slate-800">{paymentIntentId}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1.5">
                    <span className="text-slate-400">お支払い金額:</span>
                    <span className="font-bold text-slate-900">¥{amount.toLocaleString()} (JPY)</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-slate-400">ステータス:</span>
                    <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">succeeded</span>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-center gap-2 text-slate-500 text-xs">
                  <div className="spinner-border spinner-border-sm text-indigo-600" role="status"></div>
                  <span>予約管理画面へ自動遷移しています...</span>
                </div>
              </div>
            ) : isProcessing ? (
              <div className="text-center py-5">
                <div className="spinner-border text-indigo-600 mb-3" style={{ width: '2.75rem', height: '2.75rem' }} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h5 className="font-bold text-slate-900 mb-1 text-base">Stripe 決済処理中</h5>
                <p className="text-slate-500 text-xs">{processingStep}</p>
                <div className="w-100 bg-slate-100 rounded-full overflow-hidden mt-4" style={{ height: 6 }}>
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: '85%' }}
                  ></div>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePay}>
                {/* Order summary box */}
                <div className="bg-slate-50 p-3.5 rounded-xl mb-4 border border-slate-200">
                  <div className="d-flex justify-content-between align-items-center mb-1.5">
                    <span className="font-bold text-slate-900 text-sm text-truncate" style={{ maxWidth: '300px' }}>
                      {slot.title}
                    </span>
                    <span className="fs-5 font-bold text-indigo-600">¥{amount.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-slate-500 d-flex gap-3">
                    <span>
                      <i className="bi bi-calendar-event me-1 text-slate-400"></i>{slot.date}
                    </span>
                    <span>
                      <i className="bi bi-clock me-1 text-slate-400"></i>{slot.startTime}〜{slot.endTime}
                    </span>
                  </div>
                </div>

                {/* Quick Auto-fill button */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-xs font-semibold text-slate-700">
                    <i className="bi bi-credit-card me-1.5 text-slate-400"></i>クレジットカード情報
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary border-indigo-200 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 py-0.5 px-2.5 rounded-lg text-xs font-medium"
                    onClick={handleAutoFillTestCard}
                  >
                    テストカード自動入力 (4242...)
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl mb-3">
                    <i className="bi bi-exclamation-triangle-fill me-1.5"></i>
                    {errorMessage}
                  </div>
                )}

                {/* Card input field */}
                <div className="mb-3">
                  <label className="form-label text-xs text-slate-600 font-medium mb-1">カード番号</label>
                  <div className="input-group">
                    <span className="input-group-text bg-slate-50 border-slate-200 text-slate-400">
                      <i className="bi bi-credit-card-2-front"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-slate-200 text-sm font-mono"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                      required
                    />
                    <span className="input-group-text bg-slate-50 border-slate-200">
                      <span className="badge bg-indigo-100 text-indigo-700 text-[10px] font-semibold">VISA</span>
                    </span>
                  </div>
                </div>

                {/* Expiry and CVC */}
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label text-xs text-slate-600 font-medium mb-1">有効期限 (MM/YY)</label>
                    <div className="d-flex gap-1.5">
                      <input
                        type="text"
                        className="form-control border-slate-200 text-center text-sm font-mono"
                        placeholder="MM"
                        maxLength={2}
                        value={formData.expMonth}
                        onChange={(e) => setFormData({ ...formData, expMonth: e.target.value })}
                        required
                      />
                      <span className="align-self-center text-slate-400">/</span>
                      <input
                        type="text"
                        className="form-control border-slate-200 text-center text-sm font-mono"
                        placeholder="YY"
                        maxLength={2}
                        value={formData.expYear}
                        onChange={(e) => setFormData({ ...formData, expYear: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <label className="form-label text-xs text-slate-600 font-medium mb-1">セキュリティコード (CVC)</label>
                    <div className="input-group">
                      <input
                        type="password"
                        className="form-control border-slate-200 text-sm font-mono"
                        placeholder="123"
                        maxLength={4}
                        value={formData.cvc}
                        onChange={(e) => setFormData({ ...formData, cvc: e.target.value })}
                        required
                      />
                      <span className="input-group-text bg-slate-50 border-slate-200 text-slate-400">
                        <i className="bi bi-lock-fill"></i>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cardholder Name & Postal Code */}
                <div className="row g-2 mb-4">
                  <div className="col-7">
                    <label className="form-label text-xs text-slate-600 font-medium mb-1">カード名義人</label>
                    <input
                      type="text"
                      className="form-control border-slate-200 text-sm text-uppercase"
                      placeholder="TARO TANAKA"
                      value={formData.nameOnCard}
                      onChange={(e) => setFormData({ ...formData, nameOnCard: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-5">
                    <label className="form-label text-xs text-slate-600 font-medium mb-1">郵便番号</label>
                    <input
                      type="text"
                      className="form-control border-slate-200 text-sm"
                      placeholder="100-0001"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2.5 font-bold rounded-xl d-flex align-items-center justify-content-center gap-2 shadow-md shadow-indigo-100"
                >
                  <i className="bi bi-lock-fill"></i>
                  <span>¥{amount.toLocaleString()} を支払って予約を確定</span>
                </button>

                <div className="d-flex justify-content-center align-items-center gap-3 mt-3 text-[11px] text-slate-400">
                  <span><i className="bi bi-shield-check text-emerald-600 me-1"></i>256-bit 暗号化通信</span>
                  <span><i className="bi bi-arrow-repeat text-indigo-600 me-1"></i>Stripe リアルタイムWebhook同期</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
