import React from 'react';
import { User } from '../types';

export type ActiveTabType =
  | 'home'
  | 'guide'
  | 'calendar'
  | 'booking_confirm'
  | 'access'
  | 'profile'
  | 'host_admin';

interface NavbarProps {
  currentUser: User;
  onSwitchUser: (userId: string) => void;
  users: User[];
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  reservationCount: number;
  onSimulateConcurrentBooking: () => void;
  isSimulating: boolean;
  onOpenLoginModal: () => void;
  onOpenLogoutModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchUser,
  users,
  activeTab,
  setActiveTab,
  reservationCount,
  onSimulateConcurrentBooking,
  isSimulating,
  onOpenLoginModal,
  onOpenLogoutModal,
}) => {
  return (
    <header className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-3 px-lg-5 py-2.5 transition-colors">
      <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between p-0 max-w-7xl mx-auto">
        {/* Brand & Logo */}
        <div
          className="d-flex align-items-center gap-2.5 cursor-pointer mb-2 mb-md-0 text-decoration-none"
          onClick={() => setActiveTab('home')}
          style={{ cursor: 'pointer' }}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-xs">
            <i className="bi bi-gem text-white text-base"></i>
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                Claire
              </span>
              <span className="inline-flex items-center bg-rose-50 text-rose-700 border border-rose-200 text-[10px] px-2 py-0.5 rounded-full font-bold leading-none tracking-wide">
                Nail Salon
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mb-0 leading-tight">
              自由が丘 完全個室プライベートサロン
            </p>
          </div>
        </div>

        {/* Navigation Tabs - Refined, Clean & Subtle Glass style */}
        <nav className="d-flex align-items-center mx-auto my-2 my-lg-0 order-3 order-lg-2 overflow-x-auto py-1">
          <ul className="nav gap-1 md:gap-1.5 flex-nowrap items-center">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-1.5 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'home'
                    ? 'bg-rose-50 text-rose-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
                onClick={() => setActiveTab('home')}
              >
                <i className="bi bi-house-door me-1"></i>トップ
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-1.5 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'guide'
                    ? 'bg-rose-50 text-rose-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
                onClick={() => setActiveTab('guide')}
              >
                <i className="bi bi-info-circle me-1"></i>初めての方へ
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-1.5 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'calendar'
                    ? 'bg-rose-50 text-rose-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
                onClick={() => setActiveTab('calendar')}
              >
                <i className="bi bi-calendar-heart me-1"></i>施術予約
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-1.5 px-3 rounded-lg text-xs font-semibold transition-all position-relative whitespace-nowrap ${
                  activeTab === 'booking_confirm'
                    ? 'bg-rose-50 text-rose-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
                onClick={() => setActiveTab('booking_confirm')}
              >
                <i className="bi bi-ticket-detailed me-1"></i>予約確認
                {reservationCount > 0 && (
                  <span className="badge rounded-pill bg-rose-500 text-white ms-1 py-0.5 px-1.5 font-mono text-[9px]">
                    {reservationCount}
                  </span>
                )}
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-1.5 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'access'
                    ? 'bg-rose-50 text-rose-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
                onClick={() => setActiveTab('access')}
              >
                <i className="bi bi-pin-map me-1"></i>店舗案内・アクセス
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-1.5 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'bg-rose-50 text-rose-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
                onClick={() => setActiveTab('profile')}
              >
                <i className="bi bi-person-badge me-1"></i>会員情報・カルテ
              </button>
            </li>
            <li className="nav-item ms-lg-2">
              <button
                type="button"
                className={`nav-link py-1.5 px-3 rounded-lg text-xs border border-amber-300/80 font-bold transition-all whitespace-nowrap shadow-2xs d-flex align-items-center gap-1.5 ${
                  activeTab === 'host_admin'
                    ? 'bg-amber-100/90 text-amber-900 shadow-xs'
                    : 'bg-amber-50/70 text-amber-800 hover:bg-amber-100'
                }`}
                onClick={() => setActiveTab('host_admin')}
                title="サロンオーナー専用の予約管理画面デモ"
              >
                <i className="bi bi-person-workspace text-amber-600"></i>店舗オーナー向けデモを体験
              </button>
            </li>
          </ul>
        </nav>

        {/* Right side: Simulation & Profile / Auth */}
        <div className="d-flex align-items-center gap-2 order-2 order-lg-3">
          {/* Multi-user simulation trigger button */}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary border-slate-200 bg-white text-slate-700 hover:bg-slate-50 d-none d-md-inline-flex align-items-center gap-1.5 py-1.5 px-2.5 rounded-xl text-[11px] font-semibold shadow-2xs"
            onClick={onSimulateConcurrentBooking}
            disabled={isSimulating}
            title="他客による同時予約をシミュレートし、即時枠埋まりを同期します"
          >
            {isSimulating ? (
              <>
                <span className="spinner-border spinner-border-sm text-rose-600" style={{ width: 10, height: 10 }} role="status"></span>
                <span className="text-slate-500">同期中...</span>
              </>
            ) : (
              <>
                <i className="bi bi-lightning-charge-fill text-amber-500"></i>
                <span>同時予約テスト</span>
              </>
            )}
          </button>

          {/* User profile dropdown & login action */}
          <div className="dropdown border-start border-slate-200 ps-2 ms-1">
            <button
              className="btn btn-link text-decoration-none p-0 d-flex align-items-center gap-2 border-0 text-start"
              type="button"
              id="userMenuButton"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div className="text-end d-none d-xl-block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {currentUser.role === 'host' ? 'サロンオーナー' : currentUser.tier === 'vip' ? 'VIP会員' : '一般会員'}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-rose-200 shadow-2xs overflow-hidden">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-100 h-100 object-fit-cover"
                />
              </div>
            </button>

            <ul className="dropdown-menu dropdown-menu-end shadow-xl border border-slate-200 rounded-2xl p-2 mt-2" aria-labelledby="userMenuButton" style={{ minWidth: 240 }}>
              <li className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                アカウント情報
              </li>
              <li className="px-3 py-1.5 text-xs text-slate-800">
                <div className="font-bold">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{currentUser.email}</div>
              </li>
              <li><hr className="dropdown-divider border-slate-100 my-1" /></li>
              <li>
                <button
                  type="button"
                  className="dropdown-item py-1.5 px-3 rounded-xl text-xs d-flex align-items-center gap-2"
                  onClick={() => setActiveTab('guide')}
                >
                  <i className="bi bi-info-circle text-rose-600"></i>
                  <span>初めての方へ・注意事項</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="dropdown-item py-1.5 px-3 rounded-xl text-xs d-flex align-items-center gap-2"
                  onClick={() => setActiveTab('profile')}
                >
                  <i className="bi bi-person-lines-fill text-rose-600"></i>
                  <span>会員情報の確認・カルテ編集</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="dropdown-item py-1.5 px-3 rounded-xl text-xs d-flex align-items-center gap-2"
                  onClick={() => setActiveTab('booking_confirm')}
                >
                  <i className="bi bi-calendar-check text-rose-600"></i>
                  <span>確定中の予約・領収書</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="dropdown-item py-1.5 px-3 rounded-xl text-xs d-flex align-items-center gap-2"
                  onClick={onOpenLoginModal}
                >
                  <i className="bi bi-arrow-repeat text-indigo-600"></i>
                  <span>アカウント切替・ログイン</span>
                </button>
              </li>
              <li><hr className="dropdown-divider border-slate-100 my-1" /></li>
              <li>
                <button
                  type="button"
                  className="dropdown-item py-1.5 px-3 rounded-xl text-xs text-rose-600 hover:bg-rose-50 d-flex align-items-center gap-2"
                  onClick={onOpenLogoutModal}
                >
                  <i className="bi bi-box-arrow-right"></i>
                  <span>ログアウト</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
};
