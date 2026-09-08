import React from 'react';
import { ActiveTabType } from './Navbar';

interface FooterProps {
  onNavigate: (tab: ActiveTabType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="salon-footer bg-white border-t border-slate-200 mt-auto pt-5 pb-4 text-xs text-slate-600">
      <div className="container-fluid max-w-7xl mx-auto px-3 px-md-4">
        <div className="row g-4 mb-4">
          {/* Salon Brand Column */}
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white shadow-xs">
                <i className="bi bi-gem text-sm"></i>
              </div>
              <span className="text-base font-extrabold text-slate-900 tracking-tight">Private Nail Salon Claire</span>
            </div>
            <p className="text-slate-500 leading-relaxed mb-3 text-[11px]">
              自由が丘駅徒歩3分の完全個室プライベートネイルサロン。<br />
              削らないパラジェル自爪育成と、大人の女性の手元を美しく魅せる洗練されたニュアンスアートをご提供いたします。
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] space-y-1">
              <div className="d-flex align-items-center gap-2 text-slate-700 font-semibold">
                <i className="bi bi-geo-alt-fill text-rose-500"></i>
                <span>〒152-0035 東京都目黒区自由が丘2-11-XX クレア自由が丘201</span>
              </div>
              <div className="d-flex align-items-center gap-2 text-slate-600">
                <i className="bi bi-telephone-fill text-rose-500"></i>
                <span>TEL: 03-6421-5678（施術中はお電話に出られない場合がございます）</span>
              </div>
              <div className="d-flex align-items-center gap-2 text-slate-600">
                <i className="bi bi-clock-fill text-rose-500"></i>
                <span>営業時間: 10:00〜20:00（完全予約制 / 不定休）</span>
              </div>
            </div>
          </div>

          {/* Quick Navigation Column */}
          <div className="col-lg-2 col-md-3 col-6">
            <h6 className="font-bold text-slate-900 text-xs mb-3 uppercase tracking-wider">ご案内メニュー</h6>
            <ul className="list-unstyled space-y-2 text-[11px]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="btn btn-link p-0 text-slate-500 hover:text-rose-600 text-decoration-none text-[11px] border-0"
                >
                  トップページ
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('guide')}
                  className="btn btn-link p-0 text-rose-600 hover:text-rose-700 font-semibold text-decoration-none text-[11px] border-0"
                >
                  初めての方へ・注意事項
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('calendar')}
                  className="btn btn-link p-0 text-slate-500 hover:text-rose-600 text-decoration-none text-[11px] border-0"
                >
                  施術メニュー・即時予約
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('booking_confirm')}
                  className="btn btn-link p-0 text-slate-500 hover:text-rose-600 text-decoration-none text-[11px] border-0"
                >
                  予約確認・領収書
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('access')}
                  className="btn btn-link p-0 text-slate-500 hover:text-rose-600 text-decoration-none text-[11px] border-0"
                >
                  店舗案内・アクセス
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('profile')}
                  className="btn btn-link p-0 text-slate-500 hover:text-rose-600 text-decoration-none text-[11px] border-0"
                >
                  会員情報・ネイルカルテ
                </button>
              </li>
            </ul>
          </div>

          {/* Salon Policy & Safety Column */}
          <div className="col-lg-3 col-md-3 col-6">
            <h6 className="font-bold text-slate-900 text-xs mb-3 uppercase tracking-wider">安心とこだわり</h6>
            <ul className="list-unstyled space-y-2 text-[11px] text-slate-500">
              <li className="d-flex align-items-center gap-1.5">
                <i className="bi bi-check2 text-emerald-600 font-bold"></i>
                <span>削らないパラジェル登録サロン</span>
              </li>
              <li className="d-flex align-items-center gap-1.5">
                <i className="bi bi-check2 text-emerald-600 font-bold"></i>
                <span>器具の紫外線・医療用高圧滅菌</span>
              </li>
              <li className="d-flex align-items-center gap-1.5">
                <i className="bi bi-check2 text-emerald-600 font-bold"></i>
                <span>周りを気にしない完全個室空間</span>
              </li>
              <li className="d-flex align-items-center gap-1.5">
                <i className="bi bi-check2 text-emerald-600 font-bold"></i>
                <span>Stripe 256-bit SSL事前暗号化決済</span>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('profile')}
                  className="btn btn-link p-0 text-rose-500 hover:text-rose-700 text-decoration-none text-[11px] border-0"
                >
                  退会手続き（会員削除）
                </button>
              </li>
            </ul>
          </div>

          {/* SNS & Booking Inquiries Column */}
          <div className="col-lg-3 col-md-12">
            <h6 className="font-bold text-slate-900 text-xs mb-3 uppercase tracking-wider">公式LINE・お問い合わせ</h6>
            <p className="text-[11px] text-slate-500 mb-2.5">
              施術デザインのご相談や爪のお悩み、当日の道案内は公式LINEからも24時間受付しております。
            </p>
            <div className="d-flex flex-column gap-2">
              <a
                href="https://line.me"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-success btn-sm rounded-xl text-xs d-inline-flex align-items-center justify-content-center gap-2 py-2 border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-decoration-none"
              >
                <i className="bi bi-line text-base"></i>
                <span>Claire 公式LINEとお友だち追加</span>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-secondary btn-sm rounded-xl text-xs d-inline-flex align-items-center justify-content-center gap-2 py-1.5 border-slate-200 text-slate-600 hover:bg-slate-50 text-decoration-none"
              >
                <i className="bi bi-instagram text-rose-500"></i>
                <span>Instagram @claire_nail_jiyugaoka</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom System Architecture & Copyright */}
        <div className="pt-3 border-top border-slate-200 d-flex flex-wrap justify-content-between align-items-center gap-2 text-[10px] text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} Private Nail Salon Claire. All Rights Reserved.
          </div>
          <div className="d-flex flex-wrap align-items-center gap-3">
            <span>※本サイトは個人店舗向け予約システム導入のデモサイトです</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
