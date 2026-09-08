import React from 'react';
import { User } from '../types';

interface HeaderProps {
  currentUser: User;
  onOpenLoginModal: () => void;
  onOpenLogoutModal: () => void;
  onNavigateToProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenLoginModal,
  onOpenLogoutModal,
  onNavigateToProfile,
}) => {
  return (
    <header className="salon-top-header bg-slate-900 text-slate-200 border-b border-slate-800 text-xs py-1.5 px-3 px-md-4">
      <div className="container-fluid max-w-7xl mx-auto d-flex flex-wrap align-items-center justify-content-between gap-2 p-0">
        {/* Left: Location & Hours */}
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-1.5 text-rose-400 font-semibold text-[11px] md:text-xs">
            <i className="bi bi-geo-alt-fill text-rose-400"></i>
            <span>自由が丘駅 正面口 徒歩3分</span>
          </div>
          <span className="text-slate-700 d-none d-sm-inline">|</span>
          <div className="d-none d-sm-flex align-items-center gap-1.5 text-slate-300 text-[11px] md:text-xs">
            <i className="bi bi-clock text-slate-400"></i>
            <span>営業時間 10:00〜20:00（完全予約制 / 個室ブース）</span>
          </div>
        </div>

        {/* Center: Info Ticker Banner */}
        <div className="d-none d-lg-flex align-items-center gap-2 bg-slate-800/80 px-3 py-0.5 rounded-full border border-slate-700/60">
          <span className="badge bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">INFO</span>
          <span className="text-slate-300 text-[11px]">
            削らないパラジェル自爪育成＆春の新作アート予約受付中（VIP優待全施術¥1,000割引）
          </span>
        </div>

        {/* Right: Tel / Auth Quick Actions */}
        <div className="d-flex align-items-center gap-3 ms-auto ms-sm-0 text-[11px] md:text-xs">
          <a
            href="tel:0364215678"
            className="text-slate-300 hover:text-white text-decoration-none d-none d-md-flex align-items-center gap-1"
          >
            <i className="bi bi-telephone-fill text-rose-400"></i>
            <span className="font-mono font-medium">03-6421-5678</span>
          </a>

          <div className="d-flex align-items-center gap-2">
            <span className="text-slate-400 d-none d-sm-inline">ログイン中:</span>
            <button
              type="button"
              onClick={onNavigateToProfile}
              className="btn btn-link p-0 text-rose-400 hover:text-rose-300 font-bold text-decoration-none text-[11px] md:text-xs border-0"
            >
              {currentUser.name} 様
            </button>
            {currentUser.tier === 'vip' && (
              <span className="badge bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] px-1.5 py-0.5 rounded-full">
                👑 VIP
              </span>
            )}
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="btn btn-link text-slate-400 hover:text-white p-0 text-[11px] text-decoration-none border-0 ms-1"
              title="アカウント切替"
            >
              <i className="bi bi-arrow-repeat"></i> 切替
            </button>
            <button
              type="button"
              onClick={onOpenLogoutModal}
              className="btn btn-link text-slate-400 hover:text-rose-400 p-0 text-[11px] text-decoration-none border-0 ms-1"
              title="ログアウト"
            >
              <i className="bi bi-box-arrow-right"></i> ログアウト
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
