import React, { useState } from 'react';
import { User, MembershipTier } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  users?: User[];
  availableUsers?: User[];
  onLogin: (user: User) => void;
  onLogout: () => void;
  onRegister: (newUser: User) => void;
  defaultMode?: 'login' | 'register' | 'logout' | 'password_reset';
  mode?: 'login' | 'register' | 'logout' | 'password_reset';
  onSwitchMode?: (mode: 'login' | 'register' | 'logout' | 'password_reset') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users = [],
  availableUsers = [],
  onLogin,
  onLogout,
  onRegister,
  defaultMode = 'login',
  mode: propMode,
  onSwitchMode,
}) => {
  const activeUserList = users.length > 0 ? users : availableUsers;
  const [internalMode, setInternalMode] = useState<'login' | 'register' | 'logout' | 'password_reset'>(
    propMode || defaultMode
  );

  React.useEffect(() => {
    if (propMode) {
      setInternalMode(propMode);
    }
  }, [propMode]);

  const mode = propMode || internalMode;
  const setMode = (newMode: 'login' | 'register' | 'logout' | 'password_reset') => {
    setInternalMode(newMode);
    if (onSwitchMode) {
      onSwitchMode(newMode);
    }
  };

  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerKana, setRegisterKana] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerTier, setRegisterTier] = useState<MembershipTier>('standard');
  const [registerNailConcern, setRegisterNailConcern] = useState<string[]>(['二枚爪・割れやすい']);
  const [registerError, setRegisterError] = useState('');

  if (!isOpen) return null;

  // Handle standard user login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail) {
      setLoginError('メールアドレスを入力してください');
      return;
    }

    const matchedUser = activeUserList.find((u) => u.email.toLowerCase() === loginEmail.toLowerCase());
    if (matchedUser) {
      onLogin(matchedUser);
      onClose();
    } else {
      // Allow fallback / mock login for testing
      const guestUser: User = {
        id: `user_${Date.now()}`,
        name: loginEmail.split('@')[0],
        email: loginEmail,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'member',
        tier: 'standard',
        profile: {
          phone: '090-0000-0000',
          notifyByEmail: true,
          registeredAt: new Date().toISOString().split('T')[0],
        },
      };
      onLogin(guestUser);
      onClose();
    }
  };

  // Quick Demo Account Click
  const handleQuickDemoLogin = (user: User) => {
    onLogin(user);
    onClose();
  };

  // Handle register new account
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (!registerName.trim() || !registerEmail.trim() || !registerPassword.trim()) {
      setRegisterError('お名前、メールアドレス、パスワードは必須項目です。');
      return;
    }

    const newUser: User = {
      id: `user_new_${Date.now()}`,
      name: registerName.trim(),
      email: registerEmail.trim(),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'member',
      tier: registerTier,
      stripeCustomerId: `cus_${Math.random().toString(36).substring(2, 9)}`,
      profile: {
        phone: registerPhone.trim(),
        kanaName: registerKana.trim(),
        nailConcerns: registerNailConcern,
        preferredStyle: 'オフィス上品・シンプル',
        hasAllergy: false,
        notifyByEmail: true,
        notifyByLine: true,
        registeredAt: new Date().toISOString().split('T')[0],
      },
    };

    onRegister(newUser);
    onClose();
  };

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-md">
        <div className="modal-content border border-slate-200 rounded-3xl shadow-2xl overflow-hidden bg-white">
          {/* Modal Header */}
          <div className="bg-slate-900 text-white py-3.5 px-4 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <h2 className="text-sm font-bold text-white mb-0">
                {mode === 'login'
                  ? '会員ログイン (Django LoginView)'
                  : mode === 'register'
                  ? '新規サロン会員登録 (UserCreationForm)'
                  : mode === 'password_reset'
                  ? 'パスワード再設定 (PasswordResetView)'
                  : 'ログアウトの確認'}
              </h2>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white text-xs opacity-80 hover:opacity-100"
              onClick={onClose}
            ></button>
          </div>

          {/* Mode Switcher Tabs (Only if not in logout confirmation) */}
          {mode !== 'logout' && (
            <div className="d-flex border-bottom border-slate-200 bg-slate-50 text-xs">
              <button
                type="button"
                className={`flex-1 py-3 text-center font-bold border-0 bg-transparent transition-colors ${
                  mode === 'login'
                    ? 'text-rose-600 border-bottom border-2 border-rose-600 bg-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                onClick={() => setMode('login')}
              >
                <i className="bi bi-box-arrow-in-right me-1"></i>ログイン
              </button>
              <button
                type="button"
                className={`flex-1 py-3 text-center font-bold border-0 bg-transparent transition-colors ${
                  mode === 'register'
                    ? 'text-rose-600 border-bottom border-2 border-rose-600 bg-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                onClick={() => setMode('register')}
              >
                <i className="bi bi-person-plus me-1"></i>新規会員登録
              </button>
            </div>
          )}

          {/* Body */}
          <div className="p-4">
            {/* LOGIN MODE */}
            {mode === 'login' && (
              <div>
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  {loginError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      <i className="bi bi-exclamation-circle me-1"></i>
                      {loginError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1">
                      メールアドレス <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control text-xs py-2 px-3 rounded-xl border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      placeholder="tanaka.yoko@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label text-xs font-bold text-slate-700 mb-0">
                        パスワード <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">※デモ環境につき任意英数字でOK</span>
                    </div>
                    <input
                      type="password"
                      className="form-control text-xs py-2 px-3 rounded-xl border-slate-200"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                    <div className="text-end mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('password_reset');
                          setResetSent(false);
                        }}
                        className="btn btn-link p-0 text-[11px] text-rose-600 hover:text-rose-700 text-decoration-none border-0"
                      >
                        パスワードをお忘れですか？
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 border-0 shadow-md shadow-rose-200"
                  >
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    サロンにログインする
                  </button>
                </form>

                {/* Quick Demo Switcher */}
                <div className="mt-4 pt-3 border-top border-slate-100">
                  <div className="text-xs font-bold text-slate-700 mb-2 d-flex align-items-center justify-content-between">
                    <span>
                      <i className="bi bi-lightning-charge-fill text-amber-500 me-1"></i>
                      ワンクリックお試しデモログイン
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ロール切替</span>
                  </div>

                  <div className="d-flex flex-column gap-2">
                    {activeUserList.map((u) => {
                      const isHost = u.role === 'host';
                      const isVip = u.tier === 'vip';

                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleQuickDemoLogin(u)}
                          className="w-100 p-2 text-start rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50/50 hover:border-rose-200 transition-all d-flex align-items-center justify-content-between text-xs"
                        >
                          <div className="d-flex align-items-center gap-2">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{u.name}</div>
                              <div className="text-[10px] text-slate-400">{u.email}</div>
                            </div>
                          </div>
                          <div>
                            {isHost ? (
                              <span className="inline-block bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5 text-[10px] font-bold">
                                オーナー
                              </span>
                            ) : isVip ? (
                              <span className="inline-block bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2 py-0.5 text-[10px] font-bold">
                                VIP会員
                              </span>
                            ) : (
                              <span className="inline-block bg-slate-100 text-slate-700 border border-slate-200 rounded-full px-2 py-0.5 text-[10px] font-bold">
                                一般会員
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* REGISTER MODE */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                {registerError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    {registerError}
                  </div>
                )}

                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1">
                      お名前 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control text-xs py-2 px-3 rounded-xl border-slate-200"
                      placeholder="例: 佐藤 花子"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1">
                      フリガナ
                    </label>
                    <input
                      type="text"
                      className="form-control text-xs py-2 px-3 rounded-xl border-slate-200"
                      placeholder="例: サトウ ハナコ"
                      value={registerKana}
                      onChange={(e) => setRegisterKana(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label text-xs font-bold text-slate-700 mb-1">
                    メールアドレス <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control text-xs py-2 px-3 rounded-xl border-slate-200"
                    placeholder="hanako@example.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1">
                      電話番号
                    </label>
                    <input
                      type="tel"
                      className="form-control text-xs py-2 px-3 rounded-xl border-slate-200"
                      placeholder="090-0000-0000"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1">
                      パスワード <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      className="form-control text-xs py-2 px-3 rounded-xl border-slate-200"
                      placeholder="8文字以上"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-xs font-bold text-slate-700 mb-1">
                    会員プランの選択
                  </label>
                  <div className="d-flex gap-2">
                    <label
                      className={`flex-1 p-2.5 rounded-xl border text-xs cursor-pointer ${
                        registerTier === 'standard'
                          ? 'border-rose-500 bg-rose-50/50 text-rose-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tier"
                        value="standard"
                        checked={registerTier === 'standard'}
                        onChange={() => setRegisterTier('standard')}
                        className="me-1"
                      />
                      一般スタンダード
                      <div className="text-[10px] text-slate-500 font-normal">通常予約・全メニュー対象</div>
                    </label>

                    <label
                      className={`flex-1 p-2.5 rounded-xl border text-xs cursor-pointer ${
                        registerTier === 'vip'
                          ? 'border-purple-500 bg-purple-50/50 text-purple-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tier"
                        value="vip"
                        checked={registerTier === 'vip'}
                        onChange={() => setRegisterTier('vip')}
                        className="me-1"
                      />
                      VIPサロン会員
                      <div className="text-[10px] text-purple-600 font-normal">全コース¥1,000割引優待</div>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 border-0 shadow-md shadow-rose-200"
                >
                  <i className="bi bi-check2-circle me-1"></i>
                  会員登録を完了してログイン
                </button>
              </form>
            )}

            {/* PASSWORD RESET MODE (Django PasswordResetView) */}
            {mode === 'password_reset' && (
              <div className="py-2">
                {resetSent ? (
                  <div className="text-center py-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-3 text-xl">
                      <i className="bi bi-envelope-check-fill"></i>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      パスワード再設定メールを送信しました
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      <strong>{resetEmail}</strong> 宛に再設定用リンクをお送りしました。メールの案内に従って新しいパスワードを設定してください。
                    </p>
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="btn btn-primary btn-sm px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 border-0"
                    >
                      ログイン画面へ戻る
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (resetEmail.trim()) {
                        setResetSent(true);
                      }
                    }}
                    className="space-y-3"
                  >
                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                      ご登録時のメールアドレスを入力してください。パスワード再設定リンク（Django標準 `PasswordResetView`）をお送りします。
                    </p>
                    <div className="mb-3">
                      <label className="form-label text-xs font-bold text-slate-700 mb-1">
                        メールアドレス <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control text-xs py-2 px-3 rounded-xl border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                        placeholder="hanako@example.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 border-0 shadow-md shadow-rose-200"
                    >
                      <i className="bi bi-send-fill me-1"></i>
                      再設定メールを送信
                    </button>
                    <div className="text-center mt-3">
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="btn btn-link p-0 text-xs text-slate-500 hover:text-slate-800 text-decoration-none border-0"
                      >
                        <i className="bi bi-arrow-left me-1"></i>ログイン画面へ戻る
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* LOGOUT CONFIRMATION MODE */}
            {mode === 'logout' && (
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 d-flex align-items-center justify-content-center text-2xl mx-auto mb-3">
                  <i className="bi bi-box-arrow-right"></i>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  ログアウトの確認
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  現在 <strong>{currentUser?.name}</strong>（{currentUser?.email}）としてログインしています。ログアウトしますか？
                </p>

                <div className="d-flex gap-2 justify-content-center">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-outline-secondary btn-sm px-4 py-2 rounded-xl text-xs"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    className="btn btn-danger btn-sm px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 border-0"
                  >
                    ログアウトする
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
