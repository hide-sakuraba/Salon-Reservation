import React from 'react';
import { User, SalonInfo } from '../types';

interface HomePageProps {
  onGoToCalendar: () => void;
  onGoToAccess: () => void;
  onGoToBookingConfirm: () => void;
  onGoToProfile: () => void;
  onNavigateToBooking: () => void;
  onNavigateToAccess: () => void;
  onNavigateToGuide: () => void;
  onSelectDesignBooking?: (category: 'hand' | 'foot' | 'care', designTitle: string) => void;
  currentUser: User | null;
  salonInfo: SalonInfo;
  onOpenLoginModal: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateToBooking,
  currentUser,
  onOpenLoginModal,
}) => {
  return (
    <div className="w-100">
      {/* Hero Section */}
      <div 
        className="position-relative overflow-hidden p-3 p-md-5 m-md-3 text-center bg-light rounded-4 shadow-sm" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?w=1600&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div 
          className="col-md-8 col-lg-6 p-4 p-lg-5 mx-auto my-5 rounded-4 shadow-lg" 
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.90)', backdropFilter: 'blur(8px)' }}
        >
          <span className="badge px-3 py-2 rounded-pill mb-3" style={{ color: '#be123c', backgroundColor: '#ffe4e6', border: '1px solid #fecdd3' }}>完全予約制・1日限定3枠</span>
          <h1 className="display-5 fw-bold mb-3" style={{ color: '#881337' }}>あなただけの<br />特別なネイル時間を。</h1>
          <p className="lead fw-normal text-muted mb-4 fs-6 fs-md-5">
              自爪を傷めない「フィルイン」対応のプライベートサロン。<br className="d-none d-md-block" />
              丁寧なケアと美しいフォルムで、長持ちする美爪へ導きます。
          </p>
          <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
              <button 
                onClick={onNavigateToBooking} 
                className="btn btn-lg rounded-pill px-4 px-md-5 shadow-sm fw-bold d-flex align-items-center justify-content-center gap-2"
                style={{ backgroundColor: '#e11d48', color: '#ffffff' }}
              >
                  <i className="bi bi-calendar-heart-fill" style={{ color: '#ffffff' }}></i> 空き枠を確認して予約
              </button>
              {!currentUser && (
                <button onClick={onOpenLoginModal} className="btn btn-outline-secondary btn-lg rounded-pill px-4 px-md-5 fw-bold mt-2 mt-sm-0">
                    ログイン・新規登録
                </button>
              )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container px-4 py-5" id="features">
        <div className="text-center mb-5">
            <h2 className="fw-bold text-dark mb-2">Our Concept</h2>
            <p className="text-muted">Claireが選ばれる3つの理由</p>
        </div>
        <div className="row g-4 py-3 row-cols-1 row-cols-md-3">
            <div className="col">
                <div className="card h-100 border-0 shadow-sm rounded-4 bg-white p-4 text-center" style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
                    <div className="d-inline-flex align-items-center justify-content-center fs-2 mb-4 mx-auto rounded-circle" style={{ width: '70px', height: '70px', backgroundColor: '#fae8ff', color: '#9333ea' }}>
                        <i className="bi bi-stars"></i>
                    </div>
                    <h3 className="fs-5 fw-bold mb-3">自爪に優しいフィルイン</h3>
                    <p className="text-muted small mb-0 text-start">
                        アセトンを使用せず、ベースジェルを一層残すフィルイン技術を導入。爪への負担を最小限に抑え、長くネイルを楽しみたい方に最適です。
                    </p>
                </div>
            </div>
            <div className="col">
                <div className="card h-100 border-0 shadow-sm rounded-4 bg-white p-4 text-center">
                    <div className="d-inline-flex align-items-center justify-content-center fs-2 mb-4 mx-auto rounded-circle" style={{ width: '70px', height: '70px', backgroundColor: '#fce7f3', color: '#be185d' }}>
                        <i className="bi bi-cup-hot"></i>
                    </div>
                    <h3 className="fs-5 fw-bold mb-3">完全プライベート空間</h3>
                    <p className="text-muted small mb-0 text-start">
                        1日3枠限定、完全予約制。他のお客様の目を気にすることなく、お好きな映画や音楽を楽しみながらリラックスした時間をお過ごしいただけます。
                    </p>
                </div>
            </div>
            <div className="col">
                <div className="card h-100 border-0 shadow-sm rounded-4 bg-white p-4 text-center">
                    <div className="d-inline-flex align-items-center justify-content-center fs-2 mb-4 mx-auto rounded-circle" style={{ width: '70px', height: '70px', backgroundColor: '#ecfdf5', color: '#047857' }}>
                        <i className="bi bi-palette"></i>
                    </div>
                    <h3 className="fs-5 fw-bold mb-3">パーソナルカラー提案</h3>
                    <p className="text-muted small mb-0 text-start">
                        お客様の肌色やライフスタイルに合わせた、指先が一番美しく見えるオリジナルカラーをご提案。丁寧なカウンセリングで理想を叶えます。
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* Process Section */}
      <div className="py-5" style={{ backgroundColor: '#f8fafc' }}>
        <div className="container px-4">
            <div className="text-center mb-5">
                <h2 className="fw-bold text-dark mb-2">Treatment Process</h2>
                <p className="text-muted">ご来店からお帰りまでの流れ</p>
            </div>
            <div className="row g-4">
                <div className="col-md-3 col-6">
                    <div className="bg-white p-4 rounded-4 shadow-sm h-100 border border-light position-relative">
                        <div className="position-absolute top-0 start-0 translate-middle-y ms-4 badge bg-rose-600 text-white rounded-pill px-2.5 py-1 text-xs font-bold font-mono shadow-xs">STEP 1</div>
                        <div className="text-center mt-3 mb-3">
                            <i className="bi bi-chat-heart text-muted fs-1"></i>
                        </div>
                        <h4 className="fs-6 fw-bold mb-2 text-center text-dark">カウンセリング</h4>
                        <p className="text-muted small mb-0">ご希望のデザインやお爪の悩み、ライフスタイルを丁寧にお伺いします。</p>
                    </div>
                </div>
                <div className="col-md-3 col-6">
                    <div className="bg-white p-4 rounded-4 shadow-sm h-100 border border-light position-relative">
                        <div className="position-absolute top-0 start-0 translate-middle-y ms-4 badge bg-rose-600 text-white rounded-pill px-2.5 py-1 text-xs font-bold font-mono shadow-xs">STEP 2</div>
                        <div className="text-center mt-3 mb-3">
                            <i className="bi bi-scissors text-muted fs-1"></i>
                        </div>
                        <h4 className="fs-6 fw-bold mb-2 text-center text-dark">ケア・ベース作り</h4>
                        <p className="text-muted small mb-0">丁寧な甘皮処理と、持ちを良くするための美しいベースフォルムを作ります。</p>
                    </div>
                </div>
                <div className="col-md-3 col-6">
                    <div className="bg-white p-4 rounded-4 shadow-sm h-100 border border-light position-relative">
                        <div className="position-absolute top-0 start-0 translate-middle-y ms-4 badge bg-rose-600 text-white rounded-pill px-2.5 py-1 text-xs font-bold font-mono shadow-xs">STEP 3</div>
                        <div className="text-center mt-3 mb-3">
                            <i className="bi bi-brush text-muted fs-1"></i>
                        </div>
                        <h4 className="fs-6 fw-bold mb-2 text-center text-dark">ジェル塗布</h4>
                        <p className="text-muted small mb-0">厳選したカラーやデザインを施し、つるんとした美しいフォルムに仕上げます。</p>
                    </div>
                </div>
                <div className="col-md-3 col-6">
                    <div className="bg-white p-4 rounded-4 shadow-sm h-100 border border-light position-relative">
                        <div className="position-absolute top-0 start-0 translate-middle-y ms-4 badge bg-rose-600 text-white rounded-pill px-2.5 py-1 text-xs font-bold font-mono shadow-xs">STEP 4</div>
                        <div className="text-center mt-3 mb-3">
                            <i className="bi bi-droplet text-muted fs-1"></i>
                        </div>
                        <h4 className="fs-6 fw-bold mb-2 text-center text-dark">保湿・お仕上げ</h4>
                        <p className="text-muted small mb-0">専用の高品質オイルでしっかりと保湿し、写真撮影を行って完成となります。</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container px-4 py-5 my-5 text-center">
        <div className="p-4 p-md-5 bg-white border rounded-4 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
            <h2 className="fw-bold mb-3 text-dark">ご予約をお待ちしております</h2>
            <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '600px' }}>
                当サロンは完全予約制です。Webから24時間いつでも空き状況のご確認とご予約が可能です。<br />
                初めての方も、どうぞお気軽にお越しください。
            </p>
            <button 
              onClick={onNavigateToBooking} 
              className="btn btn-lg rounded-pill px-4 px-md-5 py-3 fw-bold shadow-sm d-inline-flex align-items-center gap-2"
              style={{
                backgroundColor: '#e11d48',
                color: '#ffffff',
                borderColor: '#ffffff',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            >
                <i className="bi bi-calendar-check" style={{ color: '#ffffff' }}></i> Webで即時予約する
            </button>
        </div>
      </div>
    </div>
  );
};
