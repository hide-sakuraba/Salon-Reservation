import React, { useState } from 'react';
import { User, MemberProfileDetails } from '../types';

interface MemberProfileViewProps {
  currentUser: User | null;
  onUpdateProfile: (updates: Partial<User> & { profile: Partial<MemberProfileDetails> }) => void;
  onDeleteAccount: () => void;
  onOpenLoginModal: () => void;
}

export const MemberProfileView: React.FC<MemberProfileViewProps> = ({
  currentUser,
  onUpdateProfile,
  onDeleteAccount,
  onOpenLoginModal,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [successMsg, setSuccessMsg] = useState('');

  if (!currentUser) {
    return (
      <div className="container py-5 text-center">
        <h2 className="fw-bold mb-4 text-dark">ログインが必要です</h2>
        <button onClick={onOpenLoginModal} className="btn btn-primary rounded-pill px-4" style={{ backgroundColor: '#e11d48' }}>
          ログイン・新規登録
        </button>
      </div>
    );
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ name, email, profile: {} });
    setSuccessMsg('プロフィール情報を更新しました。');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
          <div className="col-lg-8">
              <h2 className="fw-bold text-dark mb-4">
                  <i className="bi bi-person-gear text-rose-600 me-2" style={{ color: '#e11d48' }}></i>アカウント設定
              </h2>

              <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-5">
                  <div className="card-header bg-white border-bottom-0 pt-4 pb-0 px-4">
                      <h3 className="h5 fw-bold text-dark">ご登録情報の変更</h3>
                  </div>
                  <div className="card-body p-4 p-md-5">
                      
                      {successMsg && (
                          <div className="alert alert-success border-0 small rounded-3 mb-4">
                              <i className="bi bi-check-circle me-1"></i>{successMsg}
                          </div>
                      )}

                      <form onSubmit={handleUpdate}>
                          <div className="row g-4 mb-4">
                              {/* ユーザー名 */}
                              <div className="col-md-6">
                                  <label className="form-label text-muted small fw-bold">お名前 (ユーザー名)</label>
                                  <input type="text" 
                                         className="form-control form-control-lg bg-light border-0" 
                                         value={name} onChange={e => setName(e.target.value)} required />
                                  <div className="form-text small mt-1">ご来店時の確認に使用します。</div>
                              </div>
                              
                              {/* メールアドレス */}
                              <div className="col-md-6">
                                  <label className="form-label text-muted small fw-bold">メールアドレス</label>
                                  <input type="email" 
                                         className="form-control form-control-lg bg-light border-0" 
                                         value={email} onChange={e => setEmail(e.target.value)} required />
                              </div>
                          </div>

                          <div className="d-flex align-items-center gap-3">
                              <button type="submit" className="btn btn-lg rounded-3 fw-bold text-white shadow-sm px-5" style={{ backgroundColor: '#e11d48' }}>
                                  変更を保存する
                              </button>
                              <span className="text-slate-500 small">
                                  ※パスワード再設定はログイン画面の「お忘れの方はこちら」から行えます
                              </span>
                          </div>
                      </form>
                  </div>
              </div>

              {/* Danger Zone */}
              <div className="card border border-danger border-opacity-25 shadow-sm rounded-4">
                  <div className="card-body p-4 p-md-5">
                      <h3 className="h5 fw-bold text-danger mb-3">
                          <i className="bi bi-exclamation-octagon me-2"></i>アカウントの削除
                      </h3>
                      <p className="text-muted small mb-4">
                          アカウントを削除すると、これまでのご予約履歴などの全てのデータが完全に消去され、復元することはできません。<br />
                          ※今後のご予約（確定済み）がある場合は、キャンセル処理を行ってから削除してください。
                      </p>
                      
                      <button type="button" className="btn btn-outline-danger fw-bold rounded-3" onClick={() => setShowDeleteModal(true)}>
                          アカウントを削除する
                      </button>
                  </div>
              </div>

              {/* Delete Account Modal */}
              {showDeleteModal && (
                  <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <div className="modal-dialog modal-dialog-centered">
                          <div className="modal-content rounded-4 border-0 shadow">
                              <div className="modal-header border-bottom-0 pb-0 text-start">
                                  <h5 className="modal-title fw-bold text-danger">本当に削除しますか？</h5>
                                  <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
                              </div>
                              <div className="modal-body text-start">
                                  <p className="text-muted mb-4">この操作は取り消せません。全てのご予約情報とアカウント情報が永久に削除されます。</p>
                                  <div className="d-grid gap-2">
                                      <button type="button" className="btn btn-danger py-2 rounded-3 fw-bold" onClick={onDeleteAccount}>削除を確定する</button>
                                      <button type="button" className="btn btn-light py-2 rounded-3 fw-bold mt-1" onClick={() => setShowDeleteModal(false)}>キャンセル</button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
              
          </div>
      </div>
    </div>
  );
};
