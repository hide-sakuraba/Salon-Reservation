import React, { useState } from 'react';
import JSZip from 'jszip';
import { DJANGO_FILES, DjangoFile } from '../data/djangoProjectCode';

export const DjangoCodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<DjangoFile>(DJANGO_FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'templates' | 'backend'>('all');

  const filteredFiles = DJANGO_FILES.filter((file) => {
    if (categoryFilter === 'templates') return file.path.startsWith('templates/');
    if (categoryFilter === 'backend') return !file.path.startsWith('templates/');
    return true;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Add all project files into zip
      DJANGO_FILES.forEach((file) => {
        zip.file(file.path, file.content);
      });

      // Add additional configuration files
      zip.file(
        'Dockerfile',
        `FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1
WORKDIR /app
RUN apt-get update && apt-get install -y gcc libpq-dev curl && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python manage.py collectstatic --noinput || true
EXPOSE 8000
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
`
      );

      zip.file(
        '.vscode/settings.json',
        `{
  "python.defaultInterpreterPath": "\${workspaceFolder}/.venv/bin/python",
  "python.terminal.activateEnvironment": true
}
`
      );

      zip.file(
        '.env.example',
        `DEBUG=True
DJANGO_SECRET_KEY=your-secret-key-here
DATABASE_URL=postgres://salon_user:salon_password@db:5432/salon_db
REDIS_URL=redis://redis:6379/0
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
`
      );

      zip.file(
        'README.md',
        `# オンラインサロン予約システム (Django + PostgreSQL + Stripe + Channels + uv)

## 特徴
- **クラスベースビュー (CBV)**: 認証、カレンダー一覧、Stripe決済連携をCBVで構築
- **uv 仮想環境**: 高速なパッケージ依存解決とIDE連携 (.venv)
- **PostgreSQL**: \`select_related\` による高速インデックス最適化
- **Stripe**: Checkout Session と Webhook (\`checkout.session.completed\`) による決済＆自動返金
- **Django Channels**: WebSocketによる予約枠のリアルタイム同期
- **Render / Docker**: \`render.yaml\` による一括本番公開

## 起動方法 (Docker Compose)
\`\`\`bash
docker-compose up --build -d
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser
\`\`\`
ブラウザで http://localhost:8000 にアクセスしてください。

## uv でのローカル起動
\`\`\`bash
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
python manage.py runserver
\`\`\`
`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'django_salon_reservation_project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('ZIP download error:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="container-fluid px-3 px-lg-4 py-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs mb-4 p-4 p-md-5">
        <div className="row align-items-center">
          <div className="col-lg-8">
            <span className="badge bg-amber-50 text-amber-800 border border-amber-200 font-mono text-xs px-2.5 py-1 rounded-lg mb-2.5">
              <i className="bi bi-filetype-py me-1"></i>Python / Django 5.0+ アーキテクチャ設計
            </span>
            <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">
              Djangoクラスベースビュー & PostgreSQL 構成ファイル
            </h2>
            <p className="text-slate-500 text-xs mb-0 leading-relaxed max-w-3xl">
              ご要望の「Python/Django」「クラスベースビュー (CBV)」「PostgreSQL」「Stripe決済」「WebSocketリアルタイム同期」「Bootstrap」を満たす本番対応の完全なバックエンド・DB設計コードです。ワンクリックで一括ZIPダウンロードできます。
            </p>
          </div>
          <div className="col-lg-4 mt-3 mt-lg-0 text-lg-end">
            <button
              type="button"
              className="btn btn-primary px-4 py-2.5 rounded-xl shadow-md shadow-indigo-100 d-inline-flex align-items-center gap-2 text-xs font-semibold"
              onClick={handleDownloadZip}
              disabled={isZipping}
            >
              {isZipping ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>ZIP生成中...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-file-earmark-zip-fill fs-5"></i>
                  <span>プロジェクト一括ZIPダウンロード</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Code View Container */}
      <div className="row g-4">
        {/* File Navigator List */}
        <div className="col-lg-3">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden mb-3">
            <div className="bg-slate-50 border-bottom border-slate-200 py-2 px-3 font-bold text-xs text-slate-800 d-flex align-items-center justify-content-between">
              <span>
                <i className="bi bi-folder2-open me-1.5 text-indigo-600"></i>プロジェクト構成
              </span>
              <span className="badge bg-slate-100 text-slate-500 border border-slate-200 text-[10px]">
                {filteredFiles.length} ファイル
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="p-1.5 bg-slate-100/70 border-bottom border-slate-200 d-flex gap-1">
              <button
                type="button"
                className={`btn btn-xs flex-fill py-1 rounded-lg text-[10px] font-bold border-0 ${
                  categoryFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                onClick={() => setCategoryFilter('all')}
              >
                すべて
              </button>
              <button
                type="button"
                className={`btn btn-xs flex-fill py-1 rounded-lg text-[10px] font-bold border-0 ${
                  categoryFilter === 'templates' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-500 hover:text-rose-600'
                }`}
                onClick={() => setCategoryFilter('templates')}
              >
                Templates ({DJANGO_FILES.filter(f => f.path.startsWith('templates/')).length})
              </button>
              <button
                type="button"
                className={`btn btn-xs flex-fill py-1 rounded-lg text-[10px] font-bold border-0 ${
                  categoryFilter === 'backend' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                onClick={() => setCategoryFilter('backend')}
              >
                Python/DB
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {filteredFiles.map((file) => {
                const isSelected = file.filename === selectedFile.filename;
                return (
                  <button
                    key={file.path}
                    type="button"
                    className={`w-100 text-start py-2.5 px-3 border-0 d-flex align-items-center gap-2 transition-colors ${
                      isSelected ? 'bg-rose-50 text-rose-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedFile(file)}
                  >
                    <i
                      className={`bi ${
                        file.language === 'python'
                          ? 'bi-filetype-py text-amber-500'
                          : file.language === 'html'
                          ? 'bi-filetype-html text-rose-500'
                          : file.language === 'yaml'
                          ? 'bi-file-earmark-code text-indigo-500'
                          : 'bi-file-text text-slate-400'
                      }`}
                    ></i>
                    <div className="text-truncate flex-grow-1">
                      <div className="text-xs">{file.filename}</div>
                      <div className={`text-[10px] font-mono text-truncate ${isSelected ? 'text-rose-500' : 'text-slate-400'}`}>
                        {file.path}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Template Layout Structure Diagram Card */}
          <div className="bg-rose-50/50 border border-rose-200/80 rounded-2xl p-3.5 shadow-xs mb-3 text-xs">
            <div className="d-flex align-items-center gap-1.5 font-bold text-slate-900 mb-2">
              <i className="bi bi-layers-fill text-rose-600"></i>
              <span>Django テンプレート継承構造</span>
            </div>
            <div className="space-y-1.5 text-[11px] font-mono bg-white p-2.5 rounded-xl border border-rose-100">
              <div className="text-slate-700 font-bold">templates/base.html</div>
              <div className="ps-3 text-slate-500">├── &#123;% include '_header.html' %&#125;</div>
              <div className="ps-3 text-slate-500">├── &#123;% include '_navbar.html' %&#125;</div>
              <div className="ps-3 text-rose-600 font-bold">├── &#123;% block content %&#125;</div>
              <div className="ps-6 text-slate-500">│   ├── registration/login.html</div>
              <div className="ps-6 text-slate-500">│   ├── registration/signup.html</div>
              <div className="ps-6 text-slate-500">│   └── registration/logged_out.html</div>
              <div className="ps-3 text-slate-500">└── &#123;% include 'footer.html' %&#125;</div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 mb-0">
              すべてのページでヘッダー・ナビゲーション・フッターが常に表示される構成です。
            </p>
          </div>

          {/* Architecture Highlights Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs mt-3">
            <h6 className="font-bold text-slate-900 mb-2.5 text-xs">
              <i className="bi bi-diagram-3-fill text-indigo-600 me-1.5"></i>技術設計の要点
            </h6>
            <ul className="list-unstyled mb-0 d-flex flex-column gap-2 text-slate-600 text-[11px]">
              <li className="d-flex gap-2">
                <i className="bi bi-check2-circle text-emerald-600 mt-0.5"></i>
                <span><strong>クラスベースビュー (CBV):</strong> <code>CreateView</code>, <code>TemplateView</code>, <code>LoginView</code> を継承した明快な責務分離</span>
              </li>
              <li className="d-flex gap-2">
                <i className="bi bi-check2-circle text-emerald-600 mt-0.5"></i>
                <span><strong>PostgreSQL:</strong> 日付・公開フラグに対する複合インデックスで高速な月間検索</span>
              </li>
              <li className="d-flex gap-2">
                <i className="bi bi-check2-circle text-emerald-600 mt-0.5"></i>
                <span><strong>Stripe Webhook:</strong> 二重予約・決済未完了を防ぐセキュアな確定ロジック</span>
              </li>
              <li className="d-flex gap-2">
                <i className="bi bi-check2-circle text-emerald-600 mt-0.5"></i>
                <span><strong>Channels & Redis:</strong> 予約枠の空き状況を全端末へリアルタイム配信</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Code Content Display */}
        <div className="col-lg-9">
          <div className="border border-slate-800 rounded-2xl shadow-xl bg-slate-900 text-slate-100 overflow-hidden">
            {/* Code Header Bar */}
            <div className="bg-slate-950/80 py-2.5 px-4 d-flex flex-wrap align-items-center justify-content-between border-b border-slate-800">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700">
                  {selectedFile.path}
                </span>
                <span className="text-xs text-slate-400 d-none d-md-inline">
                  {selectedFile.description}
                </span>
              </div>

              <div className="d-flex align-items-center gap-2 mt-2 mt-sm-0">
                <button
                  type="button"
                  className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-secondary text-slate-300 border-slate-700 hover:bg-slate-800'} px-3 py-1 font-mono text-xs rounded-lg`}
                  onClick={handleCopy}
                >
                  <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'} me-1`}></i>
                  {copied ? 'コピー完了！' : 'コードをコピー'}
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="p-4" style={{ maxHeight: '680px', overflowY: 'auto' }}>
              <pre className="mb-0 text-slate-200 font-mono" style={{ fontSize: '0.82rem', lineHeight: '1.6' }}>
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
