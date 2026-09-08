import React from 'react';

interface SalonGuideViewProps {
  onNavigateToBooking: () => void;
  onNavigateToAccess: () => void;
}

export const SalonGuideView: React.FC<SalonGuideViewProps> = ({
  onNavigateToBooking,
  onNavigateToAccess,
}) => {
  return (
    <div className="container max-w-5xl mx-auto px-3 px-md-4 py-5">
      {/* Page Heading */}
      <div className="text-center max-w-2xl mx-auto mb-5">
        <span className="badge bg-rose-50 text-rose-700 border border-rose-200 text-xs px-3 py-1 rounded-full font-bold mb-2">
          First Visit Guide
        </span>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2 mb-2">
          初めてClaireをご利用いただくお客様へ
        </h1>
        <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
          安心してリラックスした時間をお過ごしいただけるよう、施術方針、事前オフの注意点、キャンセル規定をご案内いたします。
        </p>
      </div>

      <div className="row g-4 mb-5">
        {/* 1. 自爪を削らないパラジェル施術方針 */}
        <div className="col-md-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 p-md-5 h-100 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 d-flex align-items-center justify-content-center text-xl mb-3">
              <i className="bi bi-shield-heart"></i>
            </div>
            <h2 className="text-base md:text-lg font-bold text-slate-900 mb-2">
              1. 自爪を削らない「パラジェル」施術
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              当店では自爪表面を削るサンディング（やすり掛け）を一切行わない最高峰ジェル「パラジェル」のみを使用しています。爪が薄い方、他店で傷んでしまった方も安心して継続いただけます。
            </p>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
              <div className="font-bold text-slate-800 d-flex align-items-center gap-1.5">
                <i className="bi bi-check2-circle text-rose-600"></i>Claireの施術方針
              </div>
              <div>✓ ベース一層残し（フィルイン技術）でアセトン乾燥を最小限に抑制</div>
              <div>✓ 爪の凹凸を補正する美フォルム形成で、どこから見ても綺麗なアーチ</div>
              <div>✓ 丁寧な甘皮ウォーターケア込み（全コース基本施術）</div>
            </div>
          </div>
        </div>

        {/* 2. ジェルオフ・スカルプオフの見分け方 */}
        <div className="col-md-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 p-md-5 h-100 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 d-flex align-items-center justify-content-center text-xl mb-3">
              <i className="bi bi-clock-history"></i>
            </div>
            <h2 className="text-base md:text-lg font-bold text-slate-900 mb-2">
              2. ジェルオフに関する事前のお願い
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              前回のジェルが残っている場合、施術時間にオフ時間が加算されます。当日のスムーズなご案内のため、予約時にオフの有無をお知らせください。
            </p>
            <div className="space-y-2 text-[11px]">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <div className="font-bold mb-0.5">【ご新規様】他店ソフトジェルオフ無料</div>
                <div className="text-[10px] text-emerald-800">
                  お爪を傷めないよう丁寧にお爪をいたわりながらオフします（施術時間に+約30分）。
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
                <div className="font-bold mb-0.5">【ハードジェル・アクリルスカルプオフ】</div>
                <div className="text-[10px] text-amber-800">
                  専用マシーンによる入念な除去が必要となるため（+約45分 / 1本¥330〜）、事前に公式LINEにてお知らせください。
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 爪の健康・グリーンネイルに関するお願い */}
        <div className="col-md-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 p-md-5 h-100 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200 d-flex align-items-center justify-content-center text-xl mb-3">
              <i className="bi bi-bandaid"></i>
            </div>
            <h2 className="text-base md:text-lg font-bold text-slate-900 mb-2">
              3. 爪の衛生・トラブル時の対応
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              お客様の安全と衛生管理を第一に考えております。以下のお爪の状態の場合、皮膚科での治療を最優先としていただくため施術をお断りまたは該当指を保護させていただく場合がございます。
            </p>
            <ul className="text-[11px] text-slate-600 space-y-1 ps-3 mb-0">
              <li>爪が緑色に変色している（グリーンネイル / 緑膿菌感染の疑い）</li>
              <li>爪周囲の皮膚に出血、化膿、激しい炎症がある場合</li>
              <li>爪甲剥離症（爪が皮膚から大きく浮き上がっている状態）</li>
            </ul>
          </div>
        </div>

        {/* 4. キャンセル規定 & 返金ポリシー */}
        <div className="col-md-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 p-md-5 h-100 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 d-flex align-items-center justify-content-center text-xl mb-3">
              <i className="bi bi-credit-card-2-front"></i>
            </div>
            <h2 className="text-base md:text-lg font-bold text-slate-900 mb-2">
              4. 変更・キャンセル規定とStripe返金
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              1席のみの完全個室サロンのため、他のお客様をお断りしてお枠を確保しております。ご理解とご協力をお願い申し上げます。
            </p>
            <div className="table-responsive">
              <table className="table table-bordered table-sm text-[11px] mb-2 border-slate-200">
                <thead className="table-light">
                  <tr>
                    <th>キャンセル時期</th>
                    <th>キャンセル料</th>
                    <th>Stripe決済の対応</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold">ご予約前日 18:00まで</td>
                    <td className="text-emerald-600 font-bold">無料 (0%)</td>
                    <td className="text-emerald-700">自動でクレジットカードへ全額即時返金</td>
                  </tr>
                  <tr>
                    <td className="text-slate-600">前日18:00〜当日開始前</td>
                    <td className="text-amber-600 font-bold">施術料の50%</td>
                    <td>50%分をStripe上で自動返金処理</td>
                  </tr>
                  <tr>
                    <td className="text-slate-600">無断キャンセル・施術後</td>
                    <td className="text-rose-600 font-bold">施術料の100%</td>
                    <td>返金なし（キャンセルチャージ）</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 mb-0">※体調不良や急なご事情の際も、まずは公式LINEにてお早めにご相談ください。</p>
          </div>
        </div>
      </div>

      {/* Consultation CTA Card */}
      <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-4 p-md-5 text-center">
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          事前にデザインやお爪の写真を相談したい方へ
        </h3>
        <p className="text-slate-600 text-xs max-w-xl mx-auto mb-4">
          「この画像のニュアンスアートはできる？」「爪が折れて短いけど長さだしは必要？」など、公式LINEからお気軽にお写真をお送りいただけます。
        </p>
        <div className="d-flex flex-wrap justify-content-center gap-3">
          <a
            href="https://line.me"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-success px-4 py-2.5 rounded-xl font-bold text-xs d-inline-flex align-items-center gap-2"
          >
            <i className="bi bi-line text-base"></i>
            <span>Claire 公式LINEで画像事前相談</span>
          </a>
          <button
            type="button"
            onClick={onNavigateToBooking}
            className="btn btn-primary px-4 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 border-0 shadow-md shadow-rose-200 d-inline-flex align-items-center gap-2"
          >
            <i className="bi bi-calendar-check-fill"></i>
            <span>空き枠カレンダーから予約へ進む</span>
          </button>
        </div>
      </div>
    </div>
  );
};
