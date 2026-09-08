import React from 'react';
import { SalonInfo } from '../types';

interface SalonAccessViewProps {
  salonInfo: SalonInfo;
  onNavigateToBooking: () => void;
}

export const SalonAccessView: React.FC<SalonAccessViewProps> = ({
  salonInfo,
  onNavigateToBooking,
}) => {
  return (
    <div className="container max-w-7xl mx-auto px-3 px-md-4 py-4 py-lg-5">
      {/* Page Header */}
      <div className="mb-4 pb-3 border-bottom border-slate-200">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-rose-50 text-rose-700 border border-rose-200 font-mono text-xs px-2.5 py-0.5 rounded-full">
                Salon Info & Access
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-1">
              店舗案内・アクセス
            </h1>
            <p className="text-slate-500 text-xs md:text-sm mb-0">
              自由が丘駅 正面口より徒歩3分。静かで落ち着いた完全個室のプライベートネイルサロンです。
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToBooking}
            className="btn btn-primary px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 border-0 shadow-md shadow-rose-200 d-flex align-items-center gap-2"
          >
            <i className="bi bi-calendar-check-fill"></i>
            <span>このサロンで予約する</span>
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Salon Specs & Overview */}
        <div className="col-lg-6">
          {/* Main Info Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 p-md-5 shadow-xs mb-4">
            <h2 className="text-lg font-bold text-slate-900 mb-3 pb-2 border-bottom border-slate-100 d-flex align-items-center gap-2">
              <i className="bi bi-shop-window text-rose-600"></i>
              <span>サロン基本情報</span>
            </h2>

            <dl className="divide-y divide-slate-100 mb-0 text-xs">
              <div className="py-2.5 row">
                <dt className="col-4 font-semibold text-slate-500">サロン名</dt>
                <dd className="col-8 text-slate-900 font-bold mb-0">{salonInfo.name}</dd>
              </div>

              <div className="py-2.5 row">
                <dt className="col-4 font-semibold text-slate-500">所在地</dt>
                <dd className="col-8 text-slate-900 mb-0">
                  <div>{salonInfo.postalCode}</div>
                  <div className="font-medium">{salonInfo.address}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">※オートロックは「402」を押してお呼び出しください</div>
                </dd>
              </div>

              <div className="py-2.5 row">
                <dt className="col-4 font-semibold text-slate-500">最寄り駅</dt>
                <dd className="col-8 text-slate-900 font-medium mb-0">
                  <span className="inline-block bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded text-xs font-semibold me-1">東急線</span>
                  {salonInfo.station}
                </dd>
              </div>

              <div className="py-2.5 row">
                <dt className="col-4 font-semibold text-slate-500">営業時間</dt>
                <dd className="col-8 text-slate-900 font-semibold mb-0">
                  {salonInfo.businessHours}
                </dd>
              </div>

              <div className="py-2.5 row">
                <dt className="col-4 font-semibold text-slate-500">定休日</dt>
                <dd className="col-8 text-slate-900 mb-0">
                  {salonInfo.holidays}
                </dd>
              </div>

              <div className="py-2.5 row">
                <dt className="col-4 font-semibold text-slate-500">電話番号</dt>
                <dd className="col-8 text-slate-900 font-mono mb-0">
                  {salonInfo.phone}
                  <div className="text-[10px] text-slate-400">※施術中は出られない場合がございます。LINEが確実です。</div>
                </dd>
              </div>

              <div className="py-2.5 row">
                <dt className="col-4 font-semibold text-slate-500">公式SNS / 連絡先</dt>
                <dd className="col-8 text-slate-900 mb-0 d-flex flex-column gap-1">
                  <span className="d-flex align-items-center gap-1.5 text-emerald-600 font-medium">
                    <i className="bi bi-line text-base"></i> LINE: {salonInfo.lineId}
                  </span>
                  <span className="d-flex align-items-center gap-1.5 text-pink-600 font-medium">
                    <i className="bi bi-instagram text-base"></i> Instagram: {salonInfo.instagram}
                  </span>
                </dd>
              </div>

              <div className="py-2.5 row">
                <dt className="col-4 font-semibold text-slate-500">決済方法</dt>
                <dd className="col-8 text-slate-800 mb-0">
                  <ul className="list-unstyled mb-0 d-flex flex-column gap-1">
                    {salonInfo.paymentMethods.map((p, i) => (
                      <li key={i} className="d-flex align-items-center gap-1 text-[11px]">
                        <i className="bi bi-check text-rose-500"></i>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
          </div>

          {/* Salon Facility & Comfort */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-cup-hot-fill text-rose-500"></i>
              <span>プライベート空間の設備・アメニティ</span>
            </h2>

            <div className="row g-2 text-xs">
              <div className="col-6">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl h-100">
                  <div className="font-bold text-slate-900 mb-1 d-flex align-items-center gap-1">
                    <i className="bi bi-armchair text-rose-600"></i>電動リクライニング
                  </div>
                  <div className="text-[11px] text-slate-500">長時間の施術でも腰や首が疲れないふかふかの特注チェア。</div>
                </div>
              </div>
              <div className="col-6">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl h-100">
                  <div className="font-bold text-slate-900 mb-1 d-flex align-items-center gap-1">
                    <i className="bi bi-wifi text-indigo-600"></i>高速Wi-Fi & タブレット
                  </div>
                  <div className="text-[11px] text-slate-500">Netflix、YouTube、dマガジン（雑誌読み放題）を視聴可能。</div>
                </div>
              </div>
              <div className="col-6">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl h-100">
                  <div className="font-bold text-slate-900 mb-1 d-flex align-items-center gap-1">
                    <i className="bi bi-cup-straw text-amber-600"></i>季節のカフェドリンク
                  </div>
                  <div className="text-[11px] text-slate-500">オーガニックハーブティー、カフェインレスコーヒーなど無料提供。</div>
                </div>
              </div>
              <div className="col-6">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl h-100">
                  <div className="font-bold text-slate-900 mb-1 d-flex align-items-center gap-1">
                    <i className="bi bi-shield-check text-emerald-600"></i>医療グレード衛生管理
                  </div>
                  <div className="text-[11px] text-slate-500">紫外線器具消毒器、使い捨てエメリーボード、オゾン空気清浄機。</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Map & Step-by-Step Route */}
        <div className="col-lg-6">
          {/* Simulated Map Visual */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs mb-4">
            <div className="p-3 bg-slate-50 border-bottom border-slate-200 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-map-fill text-rose-600"></i>
                <span className="font-bold text-xs text-slate-900">サロン所在地マップ（自由が丘駅 徒歩3分）</span>
              </div>
              <a
                href="https://maps.google.com/?q=東京都目黒区自由が丘1-28-8"
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline-secondary btn-sm py-1 px-2.5 text-[11px] rounded-lg border-slate-300 text-slate-700 bg-white"
              >
                <i className="bi bi-box-arrow-up-right me-1"></i>Googleマップで開く
              </a>
            </div>

            {/* Stylized Map Canvas Container */}
            <div className="relative bg-slate-100 p-4" style={{ height: 260 }}>
              {/* Map Illustration Elements */}
              <div className="w-100 h-100 rounded-xl bg-[#eef2f6] relative overflow-hidden border border-slate-300/80 d-flex align-items-center justify-content-center">
                {/* Roads / Landmarks */}
                <div className="absolute w-full h-8 bg-white top-1/2 -translate-y-1/2 border-y border-slate-300 rotate-12"></div>
                <div className="absolute h-full w-8 bg-white left-1/3 -translate-x-1/2 border-x border-slate-300"></div>

                {/* Station Landmark */}
                <div className="absolute top-6 left-8 bg-slate-800 text-white rounded-lg p-2 text-center shadow-md">
                  <i className="bi bi-train-front text-lg"></i>
                  <div className="text-[10px] font-bold">自由が丘駅</div>
                  <div className="text-[8px] text-slate-300">正面口改札</div>
                </div>

                {/* Salon Pin */}
                <div className="absolute top-12 right-12 text-center animate-bounce">
                  <div className="w-10 h-10 rounded-full bg-rose-600 text-white shadow-lg d-flex align-items-center justify-content-center mx-auto border-2 border-white">
                    <i className="bi bi-geo-alt-fill text-xl"></i>
                  </div>
                  <div className="badge bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md mt-1">
                    Claire (402)
                  </div>
                </div>

                {/* Walking Route Dotted Line */}
                <div className="absolute inset-0 pointer-events-none d-flex align-items-center justify-content-center">
                  <span className="text-[11px] font-bold text-slate-500 bg-white/90 px-3 py-1 rounded-full shadow-xs border border-slate-200">
                    正面口から直進徒歩3分（自由が丘デパート沿い）
                  </span>
                </div>
              </div>
            </div>

            {/* Station Guide Quick Note */}
            <div className="p-3 bg-white text-xs text-slate-600 border-t border-slate-100">
              <div className="font-semibold text-slate-800 mb-1">
                <i className="bi bi-info-circle text-rose-500 me-1"></i>乗り入れ路線：
              </div>
              <p className="mb-0 text-[11px]">
                東急東横線（渋谷駅から特急8分・中目黒駅から特急5分・横浜駅から特急17分）<br />
                東急大井町線（二子玉川駅から急行5分・大井町駅から急行10分）
              </p>
            </div>
          </div>

          {/* Step-by-Step Walking Route Guide */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-signpost-2-fill text-rose-600"></i>
              <span>駅からの写真付き道案内ガイド</span>
            </h2>

            <div className="d-flex flex-column gap-3">
              {salonInfo.accessGuide.map((step, idx) => (
                <div key={idx} className="d-flex gap-3 text-xs">
                  <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 font-bold font-mono d-flex align-items-center justify-content-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="text-slate-700 leading-relaxed">
                    {step}
                  </div>
                </div>
              ))}
            </div>

            {/* Notice for First-time Customers */}
            <div className="mt-4 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs">
              <div className="font-bold mb-1 d-flex align-items-center gap-1">
                <i className="bi bi-exclamation-triangle-fill text-amber-600"></i>
                <span>ご来店時のお願い</span>
              </div>
              <ul className="mb-0 ps-3 space-y-1 text-[11px] text-amber-800">
                <li>完全プライベートサロンのため、他のお客様と重ならないよう<strong>【ご予約時間の5分前〜ジャスト】</strong>にお越しください。</li>
                <li>ご来店前のハンドクリームやネイルオイルの塗布は、ジェルの密着を妨げるためお控えください。</li>
                <li>道に迷われた際はお気軽に公式LINEまたはお電話にてご連絡ください。</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
