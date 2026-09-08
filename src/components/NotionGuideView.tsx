import React, { useState } from 'react';

export const NotionGuideView: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const entireDocMarkdown = `# 【実装手順書 & 開発仕様書】Django + PostgreSQL + Stripe + uv ネイルサロン予約システム

> **目的**: 本ドキュメントは、個人ネイルサロン「Private Nail Salon Claire」向けの予約・決済・リアルタイム空き状況同期システムの開発環境構築からRender本番デプロイまでの完全手順書です。Notionへそのままコピー＆ペーストして管理・共有いただけます。

---

## 1. システム全体構成 & 技術スタック

| レイヤー | 採用技術 | 選定理由・役割 |
| :--- | :--- | :--- |
| **言語・ランタイム** | Python 3.11 / 3.12 | 安定性とASGI/async対応 |
| **環境管理・パッケージ** | **uv** (Astral) | 超高速パッケージ解決、仮想環境隔離、VSCode/PyCharm統合 |
| **Webフレームワーク** | Django 5.0+ | 高速な管理機能、堅牢な認証・ORM、CBV（クラスベースビュー） |
| **ASGI / WebSocket** | Daphne + Django Channels | 空き枠・予約状況のリアルタイムプッシュ通知 |
| **データベース** | PostgreSQL 15+ (Render Managed Postgres) | 複合インデックスによる日付検索高速化・トランザクション安全性 |
| **キャッシュ / ブローカー** | Redis 7+ (Render Key-Value) | Channelsのチャネル層バッキングストア |
| **決済基盤** | Stripe API (Checkout & Webhook) | 256-bit暗号化による事前オンライン決済・自動返金 |
| **フロントエンド** | Django Templates + Bootstrap 5 + Bootstrap Icons | 全画面でヘッダー・ナビ・フッターを継承する統一レスポンシブUI |
| **ローカル開発** | Docker Compose / uv native | 複数コンテナのワンクリック起動とIDE直接デバッグの両立 |
| **本番インフラ** | Render (Web Service + Managed Postgres) | GitHub自動デプロイ、HTTPS自動化、Dockerビルド |

---

## 2. uv を用いたローカル開発環境構築 (IDE連携)

### 2-1. uvのインストール
\`\`\`bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# インストール確認
uv --version
\`\`\`

### 2-2. プロジェクト初期化と仮想環境作成
\`\`\`bash
# リポジトリ用フォルダ作成
mkdir salon-reservation-django && cd salon-reservation-django

# Python 3.11 環境を uv でピン留め
uv python pin 3.11

# 仮想環境 (.venv) の超高速作成
uv venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
\`\`\`

### 2-3. 依存パッケージのインストール (pyproject.toml / requirements.txt)
\`\`\`bash
# uv pip install による高速依存解決
uv pip install "Django>=5.0,<5.1" psycopg2-binary dj-database-url channels channels-redis daphne stripe python-dotenv gunicorn
\`\`\`

### 2-4. IDE (VSCode / Cursor / PyCharm) インタープリタ設定
- **VSCode / Cursor**:
  1. \`Cmd + Shift + P\` (Windows: \`Ctrl + Shift + P\`) を押し、\`Python: Select Interpreter\` を実行
  2. \`./.venv/bin/python\` (Windows: \`.\\.venv\\Scripts\\python.exe\`) を選択
  3. \`.vscode/settings.json\` に自動設定されます：
\`\`\`json
{
  "python.defaultInterpreterPath": "\${workspaceFolder}/.venv/bin/python",
  "python.terminal.activateEnvironment": true
}
\`\`\`
- **PyCharm**:
  \`Settings\` > \`Project: salon-reservation\` > \`Python Interpreter\` > \`Add Interpreter\` > \`Existing environment\` > \`.venv/bin/python\` を指定。

---

## 3. プロジェクトディレクトリ設計

\`\`\`text
salon-reservation-django/
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── render.yaml               # Render Blueprint デプロイ定義
├── pyproject.toml / requirements.txt
├── manage.py
├── config/
│   ├── __init__.py
│   ├── asgi.py              # Daphne + Channels WebSocketルーティング
│   ├── settings.py          # PostgreSQL, Stripe, Channels設定
│   ├── urls.py              # 全体ルーティング (auth / reservations)
│   └── wsgi.py
├── reservations/            # コアアプリ
│   ├── models.py            # SalonSession, Reservation, CustomUser
│   ├── views.py             # クラスベースビュー (CBV)
│   ├── forms.py             # 予約・会員登録フォーム
│   ├── consumers.py         # WebSocket Consumer
│   ├── routing.py           # ws:// ルーティング
│   ├── admin.py             # サロン管理者用ダッシュボード
│   └── urls.py
├── templates/               # 統一テンプレート構造
│   ├── base.html            # 共通骨格
│   ├── _header.html         # 店舗案内・営業時間ヘッダー
│   ├── _navbar.html         # 共通ナビゲーション
│   ├── footer.html          # 共通フッター
│   ├── reservations/
│   │   ├── home.html        # トップページ・ギャラリー
│   │   ├── first_guide.html # 初めての方へ・注意事項
│   │   ├── calendar.html    # 空き枠カレンダー予約
│   │   ├── access.html      # 地図・アクセス案内
│   │   └── my_reservations.html # 予約確認・領収書
│   └── registration/
│       ├── login.html
│       ├── signup.html
│       ├── logged_out.html
│       ├── password_reset_form.html
│       └── password_reset_done.html
└── static/
    ├── css/
    └── js/
\`\`\`

---

## 4. 各主要モジュールの実装コード

### 4-1. モデル設計 (\`reservations/models.py\`)
\`\`\`python
from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    ROLE_CHOICES = (('guest', '一般会員'), ('host', 'サロンオーナー'))
    TIER_CHOICES = (('standard', '通常会員'), ('vip', 'VIP会員'))
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='guest')
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, default='standard')
    phone_number = models.CharField('電話番号', max_length=20, blank=True)
    nail_notes = models.TextField('爪のお悩み・カルテ', blank=True)

class SalonSession(models.Model):
    CATEGORY_CHOICES = (
        ('simple', 'シンプルワンカラー / グラデーション'),
        ('monthly_trend', 'マンスリー定額アートコース'),
        ('art_free', 'フルオーダー持ち込みデザイン'),
        ('care_only', '美爪育成ネイルケア & パラジェルオフ'),
    )
    title = models.CharField('コース名', max_length=200)
    description = models.TextField('詳細説明')
    category = models.CharField('カテゴリ', max_length=50, choices=CATEGORY_CHOICES, default='simple')
    host = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='hosted_slots')
    date = models.DateField('施術日', db_index=True)
    start_time = models.TimeField('開始時刻')
    end_time = models.TimeField('終了時刻')
    price = models.PositiveIntegerField('一般施術料金 (円)', default=8800)
    vip_price = models.PositiveIntegerField('VIP会員料金 (円)', default=7800)
    capacity = models.PositiveIntegerField('定員', default=1)
    booked_count = models.PositiveIntegerField('現在予約数', default=0)
    status = models.CharField('状態', max_length=20, default='available')
    is_active = models.BooleanField('公開フラグ', default=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['date', 'is_active']),
            models.Index(fields=['category', 'date']),
        ]

    @property
    def is_full(self):
        return self.booked_count >= self.capacity

class Reservation(models.Model):
    session = models.ForeignKey(SalonSession, on_delete=models.CASCADE, related_name='reservations')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reservations')
    off_required = models.BooleanField('他店・自店オフあり', default=False)
    nail_requests = models.TextField('ご希望デザイン・ご要望', blank=True)
    amount = models.PositiveIntegerField('決済金額 (円)', default=0)
    stripe_payment_intent_id = models.CharField('Stripe ID', max_length=150, blank=True)
    status = models.CharField('状態', max_length=20, default='confirmed')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('session', 'user')
\`\`\`

### 4-2. クラスベースビュー (\`reservations/views.py\`)
\`\`\`python
import stripe
from django.conf import settings
from django.shortcuts import get_object_or_404, redirect
from django.views.generic import TemplateView, CreateView
from django.views import View
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.mixins import LoginRequiredMixin
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import SalonSession, Reservation

stripe.api_key = settings.STRIPE_SECRET_KEY

class CalendarReservationListView(TemplateView):
    """月間カレンダー枠表示CBV"""
    template_name = 'reservations/calendar.html'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['sessions'] = SalonSession.objects.filter(is_active=True).select_related('host')
        ctx['stripe_public_key'] = settings.STRIPE_PUBLIC_KEY
        return ctx

class StripeCheckoutSessionView(LoginRequiredMixin, View):
    """Stripe Checkout Session 発行"""
    def post(self, request, slot_id):
        slot = get_object_or_404(SalonSession, id=slot_id, is_active=True)
        if slot.is_full:
            return JsonResponse({'error': '満席です'}, status=400)
        
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'jpy',
                    'unit_amount': slot.price,
                    'product_data': {'name': slot.title},
                },
                'quantity': 1,
            }],
            mode='payment',
            metadata={'slot_id': slot.id, 'user_id': request.user.id},
            success_url=request.build_absolute_uri('/my-reservations/?success=1'),
            cancel_url=request.build_absolute_uri('/calendar/?canceled=1'),
        )
        return JsonResponse({'sessionId': checkout_session.id})

class StripeWebhookView(View):
    """決済完了Webhook: 予約確定 & WebSocketブロードキャスト"""
    def post(self, request):
        payload = request.body
        sig = request.META.get('HTTP_STRIPE_SIGNATURE')
        event = stripe.Webhook.construct_event(payload, sig, settings.STRIPE_WEBHOOK_SECRET)

        if event['type'] == 'checkout.session.completed':
            meta = event['data']['object']['metadata']
            slot = SalonSession.objects.get(id=meta['slot_id'])
            Reservation.objects.create(session=slot, user_id=meta['user_id'], amount=event['data']['object']['amount_total'])
            slot.booked_count += 1
            if slot.booked_count >= slot.capacity:
                slot.status = 'full'
            slot.save()

            # WebSocketで全接続クライアントへリアルタイム通知
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                'calendar_updates',
                {'type': 'reservation_message', 'message': {'slot_id': slot.id, 'status': slot.status, 'booked_count': slot.booked_count}}
            )
        return HttpResponse(status=200)
\`\`\`

---

## 5. Docker & Docker Compose 設定

### 5-1. \`Dockerfile\`
\`\`\`dockerfile
FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1
WORKDIR /app
RUN apt-get update && apt-get install -y gcc libpq-dev curl && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python manage.py collectstatic --noinput || true
EXPOSE 8000
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
\`\`\`

### 5-2. \`docker-compose.yml\`
\`\`\`yaml
version: '3.9'
services:
  db:
    image: postgres:15-alpine
    container_name: salon_db
    restart: always
    environment:
      POSTGRES_DB: salon_db
      POSTGRES_USER: salon_user
      POSTGRES_PASSWORD: salon_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    container_name: salon_redis
    restart: always
    ports:
      - "6379:6379"

  web:
    build: .
    container_name: salon_web
    command: daphne -b 0.0.0.0 -p 8000 config.asgi:application
    volumes:
      - .:/app
    ports:
      - "8000:8000"
    environment:
      - DEBUG=True
      - DATABASE_URL=postgres://salon_user:salon_password@db:5432/salon_db
      - REDIS_URL=redis://redis:6379/0
      - STRIPE_PUBLIC_KEY=\${STRIPE_PUBLIC_KEY}
      - STRIPE_SECRET_KEY=\${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=\${STRIPE_WEBHOOK_SECRET}
    depends_on:
      - db
      - redis

volumes:
  postgres_data:
\`\`\`

---

## 6. GitHub連携とRender本番デプロイ手順

### 6-1. GitHubリポジトリへのプッシュ
\`\`\`bash
git init
git add .
git commit -m "feat: initial commit for salon reservation system with Django CBV and Stripe"
git branch -M main
git remote add origin https://github.com/<あなたのユーザー名>/salon-reservation-django.git
git push -u origin main
\`\`\`

### 6-2. Render Blueprint (\`render.yaml\`) による一発プロビジョニング
\`\`\`yaml
services:
  # Web サービス (Daphne ASGI + Docker)
  - type: web
    name: salon-claire-web
    runtime: docker
    plan: standard
    region: singapore
    dockerfilePath: ./Dockerfile
    envVars:
      - key: DEBUG
        value: "False"
      - key: DJANGO_SECRET_KEY
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: salon-claire-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: salon-claire-redis
          property: connectionString
      - key: STRIPE_PUBLIC_KEY
        sync: false
      - key: STRIPE_SECRET_KEY
        sync: false
      - key: STRIPE_WEBHOOK_SECRET
        sync: false

  # Redis (Channels リアルタイム同期)
  - type: redis
    name: salon-claire-redis
    region: singapore
    plan: starter

databases:
  # PostgreSQL データベース
  - name: salon-claire-db
    region: singapore
    plan: standard
    databaseName: salon_db
    user: salon_admin
\`\`\`

### 6-3. Renderダッシュボードでの操作手順
1. **Render (https://render.com) にログイン**し、GitHubアカウントを連携
2. **「Blueprints」>「New Blueprint Instance」** を選択
3. 先ほど作成したGitHubリポジトリを選択
4. \`render.yaml\` が自動検出され、**Webサービス + PostgreSQL + Redis** が同時に構成されます
5. **環境変数 (Environment Variables)** の設定:
   - \`STRIPE_PUBLIC_KEY\`: Stripeテスト公開可能キー (\`pk_test_...\`)
   - \`STRIPE_SECRET_KEY\`: Stripe秘密キー (\`sk_test_...\`)
   - \`STRIPE_WEBHOOK_SECRET\`: Stripeダッシュボードで発行されたWebhook署名シークレット (\`whsec_...\`)
6. **「Apply」** をクリックすると、Dockerビルド、Postgres作成、ASGIサーバーの起動が自動進行します。
7. デプロイ完了後、Renderから発行されたURL (\`https://salon-claire-web.onrender.com\`) にアクセスして動作確認します。

---

## 7. 案件公開用ポートフォリオ・提案資料としてのチェックリスト

- [x] **ブランドコンセプト・世界観**: 完全個室プライベートネイルサロンとしての清潔感と高級感
- [x] **初回来店導線**: 初めての方へ（施術の流れ・オフ代無料・規約）の明示
- [x] **即時カレンダー予約**: 直感的な空き枠選択とStripe決済連携
- [x] **リアルタイム同期**: 複数端末での同枠ブッキングを防止するWebSocket通知
- [x] **完全レスポンシブ**: スマートフォンでの操作性を第一に考慮したBootstrap設計
- [x] **モダンPython開発**: \`uv\` による高速依存解決とDocker Composeによる再現可能な環境構築
`;

  return (
    <div className="container-fluid px-3 px-lg-4 py-4 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-4 p-md-5 text-white shadow-xl mb-4 relative overflow-hidden">
        <div className="relative z-10">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <span className="badge bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-3 py-1.5 rounded-xl font-mono text-xs d-inline-flex align-items-center gap-1.5">
              <i className="bi bi-journal-text text-amber-400"></i>
              Notion連携用 完全開発マニュアル & 案件仕様書
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(entireDocMarkdown, 'entire')}
              className="btn btn-sm btn-light px-4 py-2 rounded-xl text-xs font-bold shadow-md d-inline-flex align-items-center gap-2"
            >
              <i className={`bi ${copiedSection === 'entire' ? 'bi-check-lg text-success' : 'bi-clipboard-check text-indigo-600'}`}></i>
              {copiedSection === 'entire' ? 'Notion用マークダウンをコピー完了！' : 'Notion用に全文マークダウンをコピー'}
            </button>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight mb-2">
            開発環境構築 (uv)・Docker Compose・Renderデプロイ実装手順書
          </h1>
          <p className="text-slate-300 text-xs md:text-sm max-w-3xl mb-0 leading-relaxed">
            案件ポートフォリオとしてクライアントに提示できる高品質な設計仕様と、IDE（VSCode/PyCharm）で超高速なインタープリタ管理ツール「uv」を活用したローカル構築、Render本番公開手順をワンクリックでNotionに移行できます。
          </p>
        </div>
      </div>

      {/* Structured Sections */}
      <div className="row g-4">
        {/* Left Navigator / Quick Links */}
        <div className="col-lg-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs mb-3 sticky-top" style={{ top: '80px' }}>
            <h6 className="font-bold text-slate-900 text-xs mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-list-nested text-rose-600"></i>
              <span>目次・セクション一覧</span>
            </h6>
            <nav className="nav flex-column gap-1 text-xs">
              <a href="#section-arch" className="nav-link py-2 px-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-0">
                1. システム全体構成 & 技術スタック
              </a>
              <a href="#section-uv" className="nav-link py-2 px-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-0">
                2. uvによる高速環境構築 (IDE連携)
              </a>
              <a href="#section-structure" className="nav-link py-2 px-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-0">
                3. プロジェクトディレクトリ設計
              </a>
              <a href="#section-code" className="nav-link py-2 px-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-0">
                4. 各主要モジュールの実装コード (CBV/Models)
              </a>
              <a href="#section-docker" className="nav-link py-2 px-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-0">
                5. Docker Compose 開発環境
              </a>
              <a href="#section-render" className="nav-link py-2 px-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-0">
                6. GitHub連携 & Render本番デプロイ
              </a>
              <a href="#section-portfolio" className="nav-link py-2 px-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-0">
                7. 案件公開用チェックシート
              </a>
            </nav>

            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
              <div className="font-bold mb-1 d-flex align-items-center gap-1.5">
                <i className="bi bi-lightbulb-fill text-amber-600"></i>
                <span>Notionへの貼り付けのコツ</span>
              </div>
              <span>Notionの新規ページを作成し、最上部の「Notion用に全文マークダウンをコピー」をクリックして貼り付けると、見出しやテーブル、コードブロックが自動で整形されます。</span>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="col-lg-8 space-y-4">
          {/* Section 1 */}
          <div id="section-arch" className="bg-white border border-slate-200 rounded-2xl p-4 p-md-5 shadow-xs">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold">1</span>
                システム全体構成 & 技術スタック
              </h2>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              クライアント案件での商談やポートフォリオ提示時に「なぜこの技術を選定したか」を論理的に説明できるアーキテクチャ構成です。
            </p>
            <div className="table-responsive">
              <table className="table table-sm table-bordered text-xs mb-0">
                <thead className="table-light">
                  <tr>
                    <th>区分</th>
                    <th>採用技術</th>
                    <th>選定理由・クライアントへの価値</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="fw-bold">実行環境・ツール</td>
                    <td><span className="badge bg-indigo-50 text-indigo-700 border border-indigo-200">Python 3.11 + uv</span></td>
                    <td>超高速な仮想環境構築。CI/CDとローカルのパッケージバージョンの完全同一性を保証。</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">バックエンド</td>
                    <td><span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">Django 5.0 (CBV)</span></td>
                    <td>クラスベースビューによるDRY原則。堅牢な認証・Admin標準搭載で開発工数を短縮。</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">リアルタイム通信</td>
                    <td><span className="badge bg-sky-50 text-sky-700 border border-sky-200">Daphne + Channels</span></td>
                    <td>WebSocketにより他ユーザーの予約枠確定を即時画面に反映（二重予約の防止）。</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">データベース</td>
                    <td><span className="badge bg-amber-50 text-amber-700 border border-amber-200">PostgreSQL 15</span></td>
                    <td>予約枠の月間高速クエリ用の複合インデックス。ACIDトランザクションの完全保証。</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">決済基盤</td>
                    <td><span className="badge bg-purple-50 text-purple-700 border border-purple-200">Stripe Checkout</span></td>
                    <td>カード情報を自社サーバーで保持しないPCI DSS完全準拠。安全なオンライン事前決済。</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">インフラ・公開</td>
                    <td><span className="badge bg-slate-100 text-slate-800 border border-slate-200">Render + Docker</span></td>
                    <td>GitHubと連携した自動CI/CDデプロイ。SSL自動発行、低コストでの運用。</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: uv */}
          <div id="section-uv" className="bg-white border border-slate-200 rounded-2xl p-4 p-md-5 shadow-xs">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">2</span>
                uv を用いたローカル開発環境構築 & IDE連携
              </h2>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              従来の <code>pip</code> や <code>poetry</code> よりも10倍〜100倍高速な Rust 製パッケージマネージャー <strong>uv</strong> を使用し、VSCode/Cursor や PyCharm とシームレスに連携します。
            </p>

            <div className="bg-slate-900 text-slate-200 rounded-xl p-3 font-mono text-xs mb-3 overflow-x-auto">
              <div className="text-slate-400 mb-1"># 1. uv のインストール</div>
              <div>curl -LsSf https://astral.sh/uv/install.sh | sh</div>
              <div className="text-slate-400 mt-2 mb-1"># 2. 仮想環境作成とPythonバージョンの固定 (3.11)</div>
              <div>uv python pin 3.11</div>
              <div>uv venv</div>
              <div>source .venv/bin/activate  <span className="text-slate-400"># Windows: .venv\Scripts\activate</span></div>
              <div className="text-slate-400 mt-2 mb-1"># 3. 超高速パッケージインストール</div>
              <div>uv pip install Django psycopg2-binary dj-database-url channels channels-redis daphne stripe python-dotenv</div>
            </div>

            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs">
              <div className="font-bold text-indigo-950 mb-1">
                <i className="bi bi-laptop me-1"></i>VSCode / Cursor でのインタープリタ自動設定
              </div>
              <p className="text-slate-600 mb-2 leading-relaxed">
                プロジェクト直下に <code>.vscode/settings.json</code> を配置することで、IDEを開いた瞬間に <code>uv</code> で作成した <code>.venv</code> がPythonインタープリタとして自動認識されます。
              </p>
              <pre className="bg-white p-2 rounded-lg border border-indigo-100 font-mono text-[11px] text-slate-800 mb-0">
{`{
  "python.defaultInterpreterPath": "\${workspaceFolder}/.venv/bin/python",
  "python.terminal.activateEnvironment": true
}`}
              </pre>
            </div>
          </div>

          {/* Section 5: Docker Compose */}
          <div id="section-docker" className="bg-white border border-slate-200 rounded-2xl p-4 p-md-5 shadow-xs">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold">5</span>
                Docker Compose 開発環境の起動
              </h2>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              PostgreSQLコンテナ、Redisコンテナ、Daphne(Django)コンテナを1コマンドで立ち上げ、ローカルPCを汚さずに本番環境と完全同一のスタックを再現します。
            </p>

            <div className="bg-slate-900 text-slate-200 rounded-xl p-3 font-mono text-xs mb-3 overflow-x-auto">
              <div className="text-slate-400 mb-1"># コンテナ起動 (ビルド付き)</div>
              <div>docker-compose up --build -d</div>
              <div className="text-slate-400 mt-2 mb-1"># マイグレーションと初期管理者作成</div>
              <div>docker-compose exec web python manage.py migrate</div>
              <div>docker-compose exec web python manage.py createsuperuser</div>
              <div className="text-slate-400 mt-2 mb-1"># ブラウザアクセス</div>
              <div className="text-emerald-400">http://localhost:8000</div>
            </div>
          </div>

          {/* Section 6: Render Deployment */}
          <div id="section-render" className="bg-white border border-slate-200 rounded-2xl p-4 p-md-5 shadow-xs">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">6</span>
                GitHub連携 & Render 本番デプロイ手順
              </h2>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              GitHubリポジトリの <code>main</code> ブランチへプッシュすると、RenderのWebhookがトリガーされ、自動ビルドとマイグレーションが実行されます。
            </p>

            <div className="space-y-3 text-xs">
              <div className="d-flex gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center flex-shrink-0 font-bold text-[11px]">1</div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">GitHubにリポジトリを作成してプッシュ</div>
                  <div className="text-slate-500 font-mono text-[11px]">git push origin main</div>
                </div>
              </div>

              <div className="d-flex gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center flex-shrink-0 font-bold text-[11px]">2</div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">Renderで「Blueprint」を選択</div>
                  <div className="text-slate-500">リポジトリ内の <code>render.yaml</code> を読み込むことで、PostgreSQL・Redis・Webサーバーが自動的に一括プロビジョニングされます。</div>
                </div>
              </div>

              <div className="d-flex gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center flex-shrink-0 font-bold text-[11px]">3</div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">Stripe Webhookのエンドポイント登録</div>
                  <div className="text-slate-500">Renderから発行された公開URL（例: <code>https://salon-claire.onrender.com/stripe/webhook/</code>）をStripeダッシュボードに登録します。</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 7: Portfolio Checklist */}
          <div id="section-portfolio" className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 p-md-5 shadow-xs">
            <h2 className="text-base md:text-lg font-bold text-emerald-950 flex items-center gap-2 mb-2">
              <i className="bi bi-shield-check text-emerald-600"></i>
              7. クライアント案件・ポートフォリオ提出用チェックリスト
            </h2>
            <p className="text-xs text-emerald-800 mb-4 leading-relaxed">
              案件応募や顧客プレゼン時に、本システムの実装品質と完成度を証明できるアピールポイントです。
            </p>
            <div className="row g-3 text-xs">
              <div className="col-md-6">
                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <i className="bi bi-check-circle-fill text-emerald-500"></i>
                    <span>ビジネス・接客品質</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mb-0 leading-relaxed">
                    自由が丘のサロン実態に即した「初めての方へ（オフ代無料特典・施術フロー）」やデザインギャラリーからの直結予約導線。
                  </p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <i className="bi bi-check-circle-fill text-emerald-500"></i>
                    <span>高可用性・二重予約防止</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mb-0 leading-relaxed">
                    Channels + Redis によるWebSocketリアルタイム通知と、Stripe Webhookでの確実な決済済みステータス同期。
                  </p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <i className="bi bi-check-circle-fill text-emerald-500"></i>
                    <span>開発効率・CI/CD標準</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mb-0 leading-relaxed">
                    最新の <code>uv</code> インタープリタ連携と Docker Compose、Render Blueprint による再現性の高いデプロイパイプライン。
                  </p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <i className="bi bi-check-circle-fill text-emerald-500"></i>
                    <span>セキュリティ・保守性</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mb-0 leading-relaxed">
                    PostgreSQLのインデックス最適化、環境変数の完全隔離、Djangoの安全なCBV認証構造。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
