export interface DjangoFile {
  filename: string;
  path: string;
  language: 'python' | 'html' | 'yaml' | 'text';
  description: string;
  content: string;
}

export const DJANGO_FILES: DjangoFile[] = [
  {
    filename: 'views.py',
    path: 'reservations/views.py',
    language: 'python',
    description: 'Djangoのクラスベースビュー（CBV）による認証、カレンダー表示、予約作成、Stripe決済処理',
    content: `"""
オンラインサロン予約サービス - クラスベースビュー (Class-Based Views)
Django 5.0+, PostgreSQL, Stripe API, Channels 連携
"""
import json
import stripe
from django.conf import settings
from django.contrib.auth import login
from django.contrib.auth.views import LoginView, LogoutView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.core.exceptions import ValidationError
from django.http import JsonResponse, HttpResponse
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse_lazy, reverse
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import TemplateView, DetailView, CreateView, ListView, UpdateView

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import SalonSession, Reservation, PaymentTransaction, CustomUser
from .forms import SignUpForm, ReservationForm, SessionCreateForm

stripe.api_key = settings.STRIPE_SECRET_KEY


class UserSignUpView(CreateView):
    """ユーザー新規登録（クラスベースビュー）"""
    model = CustomUser
    form_class = SignUpForm
    template_name = 'registration/signup.html'
    success_url = reverse_lazy('reservations:calendar')

    def form_valid(self, form):
        user = form.save()
        login(self.request, user)
        return redirect(self.success_url)


class CustomLoginView(LoginView):
    """ユーザー認証ログインビュー"""
    template_name = 'registration/login.html'
    redirect_authenticated_user = True

    def get_success_url(self):
        return reverse_lazy('reservations:calendar')


class CalendarReservationListView(TemplateView):
    """
    カレンダー形式の予約管理画面（CBV）
    月間・週間のサロン予約枠一覧および自分の予約状況をカレンダー表示
    """
    template_name = 'reservations/calendar.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # 現在日またはクエリパラメータから該当年月を取得
        now = timezone.now()
        year = int(self.request.GET.get('year', now.year))
        month = int(self.request.GET.get('month', now.month))

        # サロンセッション枠の取得（公開中または予約可能なもの）
        sessions = SalonSession.objects.filter(
            date__year=year,
            date__month=month,
            is_active=True
        ).select_related('host').prefetch_related('reservations')

        # ログインユーザーの予約履歴を取得
        user_reservations = []
        if self.request.user.is_authenticated:
            user_reservations = Reservation.objects.filter(
                user=self.request.user,
                session__date__year=year,
                session__date__month=month
            ).select_related('session')

        context.update({
            'year': year,
            'month': month,
            'sessions': sessions,
            'user_reservations': user_reservations,
            'stripe_public_key': settings.STRIPE_PUBLIC_KEY,
            'ws_url': f"/ws/reservations/{year}/{month}/",
        })
        return context


class SessionDetailView(DetailView):
    """セッション詳細ビュー"""
    model = SalonSession
    template_name = 'reservations/session_detail.html'
    context_object_name = 'session'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        context['is_already_booked'] = False
        if user.is_authenticated:
            context['is_already_booked'] = Reservation.objects.filter(
                session=self.object, user=user, status='confirmed'
            ).exists()
            context['effective_price'] = self.object.get_price_for_user(user)
        return context


class StripeCheckoutSessionView(LoginRequiredMixin, View):
    """
    Stripe Checkout Session 生成ビュー (CBV)
    予約枠に応じたCheckoutセッションを作成し、決済URLを返却
    """
    def post(self, request, *args, **kwargs):
        session_id = kwargs.get('session_id')
        salon_session = get_object_or_404(SalonSession, id=session_id, is_active=True)

        if salon_session.is_full:
            return JsonResponse({'error': 'この枠は満席となりました。'}, status=400)

        # 既予約チェック
        if Reservation.objects.filter(session=salon_session, user=request.user, status='confirmed').exists():
            return JsonResponse({'error': 'すでに予約済みです。'}, status=400)

        user = request.user
        effective_price = salon_session.get_price_for_user(user)

        # 無料枠またはVIP無料の場合は直接予約確定
        if effective_price == 0:
            reservation = Reservation.objects.create(
                session=salon_session,
                user=user,
                amount=0,
                status='confirmed'
            )
            salon_session.update_booked_count()
            self.broadcast_realtime_update(salon_session, 'booked')
            return JsonResponse({
                'success': True,
                'redirect_url': reverse('reservations:booking_success', kwargs={'pk': reservation.pk})
            })

        try:
            domain_url = request.build_absolute_uri('/')[:-1]
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'jpy',
                        'unit_amount': int(effective_price),
                        'product_data': {
                            'name': f"【サロン予約】{salon_session.title}",
                            'description': f"日時: {salon_session.date} {salon_session.start_time}〜{salon_session.end_time}",
                        },
                    },
                    'quantity': 1,
                }],
                mode='payment',
                customer_email=user.email,
                client_reference_id=str(user.id),
                metadata={
                    'session_id': str(salon_session.id),
                    'user_id': str(user.id),
                },
                success_url=domain_url + reverse('reservations:booking_success_stripe') + '?session_id={CHECKOUT_SESSION_ID}',
                cancel_url=domain_url + reverse('reservations:calendar'),
            )
            return JsonResponse({'id': checkout_session.id, 'url': checkout_session.url})

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    def broadcast_realtime_update(self, salon_session, action):
        """Django Channelsを用いて全クライアントへリアルタイム更新通知を送信"""
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "reservations_updates",
            {
                "type": "reservation_message",
                "message": {
                    "action": action,
                    "slot_id": salon_session.id,
                    "booked_count": salon_session.booked_count,
                    "capacity": salon_session.capacity,
                    "is_full": salon_session.is_full,
                }
            }
        )


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(View):
    """
    Stripe Webhook 受信ビュー (CBV)
    決済成功 (checkout.session.completed) 時に予約確定およびトランザクション記録、リアルタイム同期通知
    """
    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError:
            return HttpResponse(status=400)

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            metadata = session.get('metadata', {})
            session_id = metadata.get('session_id')
            user_id = metadata.get('user_id')

            if session_id and user_id:
                salon_session = SalonSession.objects.filter(id=session_id).first()
                user = CustomUser.objects.filter(id=user_id).first()

                if salon_session and user:
                    reservation, created = Reservation.objects.get_or_create(
                        session=salon_session,
                        user=user,
                        defaults={
                            'amount': session['amount_total'],
                            'stripe_payment_intent_id': session.get('payment_intent', ''),
                            'status': 'confirmed'
                        }
                    )
                    # トランザクション記録
                    PaymentTransaction.objects.create(
                        user=user,
                        reservation=reservation,
                        stripe_charge_id=session.get('payment_intent', ''),
                        amount=session['amount_total'],
                        status='succeeded'
                    )
                    salon_session.update_booked_count()

                    # Django Channelsでリアルタイム同期配信
                    channel_layer = get_channel_layer()
                    async_to_sync(channel_layer.group_send)(
                        "reservations_updates",
                        {
                            "type": "reservation_message",
                            "message": {
                                "action": "booked",
                                "slot_id": salon_session.id,
                                "booked_count": salon_session.booked_count,
                                "capacity": salon_session.capacity,
                                "is_full": salon_session.is_full,
                                "title": salon_session.title
                            }
                        }
                    )

        return HttpResponse(status=200)


class ReservationCancelView(LoginRequiredMixin, View):
    """予約キャンセルビュー（CBV）"""
    def post(self, request, pk, *args, **kwargs):
        reservation = get_object_or_404(Reservation, pk=pk, user=request.user, status='confirmed')
        salon_session = reservation.session

        # 決済済みかつ有料枠の場合はStripe返金処理
        if reservation.stripe_payment_intent_id and reservation.amount > 0:
            try:
                stripe.Refund.create(payment_intent=reservation.stripe_payment_intent_id)
            except Exception as e:
                return JsonResponse({'error': f'返金エラー: {str(e)}'}, status=500)

        reservation.status = 'cancelled'
        reservation.save()
        salon_session.update_booked_count()

        # リアルタイム空き状況をWebSocketで同報送信
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "reservations_updates",
            {
                "type": "reservation_message",
                "message": {
                    "action": "cancelled",
                    "slot_id": salon_session.id,
                    "booked_count": salon_session.booked_count,
                    "capacity": salon_session.capacity,
                    "is_full": salon_session.is_full,
                }
            }
        )

        return redirect('reservations:my_reservations')
`
  },
  {
    filename: 'models.py',
    path: 'reservations/models.py',
    language: 'python',
    description: 'PostgreSQL最適化 Djangoモデル定義（カスタムユーザー、サロン予約枠、予約、Stripe決済履歴）',
    content: `"""
オンラインサロン予約モデル定義
PostgreSQL 用インデックスとリレーション設計
"""
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class CustomUser(AbstractUser):
    """サロン会員・ホスト管理カスタムユーザー"""
    ROLE_CHOICES = (
        ('member', '一般サロンメンバー'),
        ('host', 'サロン主宰 / 講師'),
        ('admin', '管理者'),
    )
    TIER_CHOICES = (
        ('free', '無料会員'),
        ('standard', 'スタンダード会員'),
        ('vip', 'VIPプレミアム会員'),
    )
    role = models.CharField('権限ロール', max_length=20, choices=ROLE_CHOICES, default='member')
    tier = models.CharField('会員ランク', max_length=20, choices=TIER_CHOICES, default='standard')
    stripe_customer_id = models.CharField('Stripe顧客ID', max_length=100, blank=True, null=True)
    avatar_url = models.URLField('アバター画像URL', blank=True, null=True)

    class Meta:
        verbose_name = 'サロンユーザー'
        verbose_name_plural = 'サロンユーザー一覧'


class SalonSession(models.Model):
    """カレンダー予約スロット（サロン開催セッション）"""
    CATEGORY_CHOICES = (
        ('gel_art', '定額アート'),
        ('gel_simple', 'シンプル'),
        ('paragel_care', 'パラジェル'),
        ('foot_nail', 'フットネイル'),
        ('special_custom', '持ち込みデザイン'),
        ('care_off', 'ケア・オフ'),
    )
    STATUS_CHOICES = (
        ('available', '予約受付中'),
        ('booked', '予約済み'),
        ('full', '満席'),
        ('closed', '受付終了'),
    )

    title = models.CharField('セッション名', max_length=200)
    description = models.TextField('詳細説明')
    category = models.CharField('カテゴリ', max_length=50, choices=CATEGORY_CHOICES, default='one_on_one')
    host = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='hosted_sessions', verbose_name='担当ホスト')
    
    date = models.DateField('開催日', db_index=True)
    start_time = models.TimeField('開始時刻')
    end_time = models.TimeField('終了時刻')
    
    price = models.PositiveIntegerField('一般参加費 (円)', default=3000)
    vip_price = models.PositiveIntegerField('VIP会員参加費 (円)', default=0)
    capacity = models.PositiveIntegerField('定員人数', default=1)
    booked_count = models.PositiveIntegerField('現在の予約数', default=0)
    status = models.CharField('ステータス', max_length=20, choices=STATUS_CHOICES, default='available')
    
    meeting_url = models.URLField('オンライン会議URL (Zoom/Meet)', blank=True, default='')
    is_active = models.BooleanField('公開フラグ', default=True, db_index=True)
    created_at = models.DateTimeField('作成日時', auto_now_add=True)
    updated_at = models.DateTimeField('更新日時', auto_now=True)

    class Meta:
        verbose_name = 'サロン予約スロット'
        verbose_name_plural = 'サロン予約スロット一覧'
        ordering = ['date', 'start_time']
        indexes = [
            models.Index(fields=['date', 'is_active']),
            models.Index(fields=['category', 'date']),
        ]

    def __str__(self):
        return f"{self.date} {self.start_time} - {self.title} ({self.booked_count}/{self.capacity})"

    @property
    def is_full(self):
        return self.booked_count >= self.capacity

    def get_price_for_user(self, user):
        if getattr(user, 'tier', None) == 'vip':
            return self.vip_price
        return self.price

    def update_booked_count(self):
        """予約数を同期してステータスを更新"""
        count = self.reservations.filter(status='confirmed').count()
        self.booked_count = count
        if count >= self.capacity:
            self.status = 'full'
        else:
            self.status = 'available'
        self.save(update_fields=['booked_count', 'status', 'updated_at'])


class Reservation(models.Model):
    """予約レコード"""
    STATUS_CHOICES = (
        ('confirmed', '予約確定・決済完了'),
        ('cancelled', 'キャンセル済'),
        ('attended', '受講済'),
    )

    session = models.ForeignKey(SalonSession, on_delete=models.CASCADE, related_name='reservations', verbose_name='予約枠')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reservations', verbose_name='予約者')
    amount = models.PositiveIntegerField('決済金額 (円)', default=0)
    stripe_payment_intent_id = models.CharField('Stripe決済ID', max_length=150, blank=True, null=True)
    status = models.CharField('予約状態', max_length=20, choices=STATUS_CHOICES, default='confirmed')
    created_at = models.DateTimeField('予約日時', auto_now_add=True)

    class Meta:
        verbose_name = '予約履歴'
        verbose_name_plural = '予約履歴一覧'
        unique_together = ('session', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.session.title} ({self.status})"


class PaymentTransaction(models.Model):
    """Stripe決済ログ"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='payments')
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='payments')
    stripe_charge_id = models.CharField('Stripe Charge ID', max_length=100)
    amount = models.PositiveIntegerField('支払金額')
    currency = models.CharField('通貨', max_length=10, default='jpy')
    status = models.CharField('決済状態', max_length=30, default='succeeded')
    created_at = models.DateTimeField('決済日時', auto_now_add=True)

    class Meta:
        verbose_name = '決済ログ'
        verbose_name_plural = '決済ログ一覧'
`
  },
  {
    filename: 'consumers.py',
    path: 'reservations/consumers.py',
    language: 'python',
    description: 'Django Channelsによる予約枠のリアルタイム同期WebSocketコンシューマー',
    content: `"""
Django Channels リアルタイムWebSocket通信コンシューマー
カレンダー予約枠の空き状況（残数・満席・キャンセル）を接続中の全クライアントへ即時ブロードキャスト
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer


class ReservationSyncConsumer(AsyncWebsocketConsumer):
    """リアルタイム予約同期コンシューマー"""

    async def connect(self):
        self.room_group_name = "reservations_updates"

        # チャンネルグループに参加
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # クライアントへ接続完了イベントを送信
        await self.send(text_data=json.dumps({
            "type": "connection_established",
            "message": "Connected to Salon Real-time Reservation Sync Channel"
        }))

    async def disconnect(self, close_code):
        # チャンネルグループから離脱
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """クライアントからの ping/同期リクエスト処理"""
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'ping':
            await self.send(text_data=json.dumps({"type": "pong"}))

    async def reservation_message(self, event):
        """グループからの更新通知を各WebSocket接続先クライアントへプッシュ送信"""
        message = event['message']
        await self.send(text_data=json.dumps({
            "type": "slot_updated",
            "data": message
        }))
`
  },
  {
    filename: 'settings.py',
    path: 'config/settings.py',
    language: 'python',
    description: 'Djangoプロジェクト設定（PostgreSQL DB, Stripe, Channels, Bootstrap設定）',
    content: `"""
Django 設定ファイル - PostgreSQL & Channels & Stripe 最適化
"""
import os
from pathlib import Path
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-salon-reservation-key-99882')
DEBUG = os.environ.get('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'daphne',  # ASGIサーバー
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # リアルタイム通信
    'channels',
    
    # 自作アプリ
    'reservations',
]

AUTH_USER_MODEL = 'reservations.CustomUser'

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ASGI / WSGI
WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# PostgreSQL データベース接続設定 (DATABASE_URL環境変数対応)
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL', 'postgres://salon_user:salon_password@db:5432/salon_db'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Django Channels Redisバックエンド
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [os.environ.get('REDIS_URL', 'redis://redis:6379/0')],
        },
    },
}

# Stripe 決済設定
STRIPE_PUBLIC_KEY = os.environ.get('STRIPE_PUBLIC_KEY', 'pk_test_51MockSalonStripeKey12345')
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', 'sk_test_51MockSalonSecretKey67890')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', 'whsec_test_salon_webhook')

# 国際化
LANGUAGE_CODE = 'ja'
TIME_ZONE = 'Asia/Tokyo'
USE_I18N = True
USE_TZ = True

# 静的ファイル
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

LOGIN_URL = 'reservations:login'
LOGIN_REDIRECT_URL = 'reservations:calendar'
LOGOUT_REDIRECT_URL = 'reservations:calendar'
`
  },
  {
    filename: 'urls.py',
    path: 'reservations/urls.py',
    language: 'python',
    description: 'クラスベースビューのルーティング設定',
    content: `"""
予約アプリ URLディスパッチャ (クラスベースビュー .as_view() を使用)
"""
from django.urls import path
from .views import (
    CalendarReservationListView,
    SessionDetailView,
    StripeCheckoutSessionView,
    StripeWebhookView,
    ReservationCancelView,
    CustomLoginView,
    UserSignUpView,
)

app_name = 'reservations'

urlpatterns = [
    # 認証
    path('signup/', UserSignUpView.as_view(), name='signup'),
    path('login/', CustomLoginView.as_view(), name='login'),
    
    # カレンダー予約画面
    path('', CalendarReservationListView.as_view(), name='calendar'),
    path('session/<int:pk>/', SessionDetailView.as_view(), name='session_detail'),
    
    # Stripe決済連携
    path('session/<int:session_id>/checkout/', StripeCheckoutSessionView.as_view(), name='create_checkout_session'),
    path('stripe/webhook/', StripeWebhookView.as_view(), name='stripe_webhook'),
    
    # 予約キャンセル
    path('reservation/<int:pk>/cancel/', ReservationCancelView.as_view(), name='cancel_reservation'),
]
`
  },
  {
    filename: 'docker-compose.yml',
    path: 'docker-compose.yml',
    language: 'yaml',
    description: 'PostgreSQL 15, Redis, Django WebサービスのDocker構成',
    content: `version: '3.9'

services:
  db:
    image: postgres:15-alpine
    container_name: salon_postgres
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
    container_name: salon_django
    command: daphne -b 0.0.0.0 -p 8000 config.asgi:application
    volumes:
      - .:/app
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgres://salon_user:salon_password@db:5432/salon_db
      - REDIS_URL=redis://redis:6379/0
      - STRIPE_PUBLIC_KEY=pk_test_sample
      - STRIPE_SECRET_KEY=sk_test_sample
      - STRIPE_WEBHOOK_SECRET=whsec_sample
    depends_on:
      - db
      - redis

volumes:
  postgres_data:
`
  },
  {
    filename: 'render.yaml',
    path: 'render.yaml',
    language: 'yaml',
    description: 'Render Blueprint デプロイ定義（Web Service, Managed Postgres, Redis の一括プロビジョニング）',
    content: `services:
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

  # Redis サービス (Channels リアルタイム受信用)
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
`
  },
  {
    filename: 'pyproject.toml',
    path: 'pyproject.toml',
    language: 'text',
    description: 'uv / PEP 621 準拠のプロジェクト依存関係・Python仮想環境設定ファイル',
    content: `[project]
name = "salon-reservation-django"
version = "0.1.0"
description = "Private Nail Salon Claire - Online Booking & Stripe System"
readme = "README.md"
requires-python = ">=3.11"
dependencies = [
    "django>=5.0,<5.1",
    "psycopg2-binary>=2.9.9",
    "dj-database-url>=2.1.0",
    "channels>=4.0.0",
    "channels-redis>=4.2.0",
    "daphne>=4.1.0",
    "stripe>=8.0.0",
    "python-dotenv>=1.0.0",
    "gunicorn>=21.2.0",
]

[tool.uv]
dev-dependencies = [
    "pytest>=8.0.0",
    "black>=24.0.0",
    "flake8>=7.0.0",
]
`
  },
  {
    filename: 'requirements.txt',
    path: 'requirements.txt',
    language: 'text',
    description: 'Python依存ライブラリ一覧（Django 5, PostgreSQLドライバー, Channels, Stripe）',
    content: `Django>=5.0,<5.1
psycopg2-binary>=2.9.9
dj-database-url>=2.1.0
channels>=4.0.0
channels-redis>=4.2.0
daphne>=4.1.0
stripe>=8.0.0
python-dotenv>=1.0.0
`
  },
  {
    filename: 'calendar.html',
    path: 'templates/reservations/calendar.html',
    language: 'html',
    description: 'Bootstrap 5 レスポンシブ カレンダー予約画面テンプレート',
    content: `{% extends 'base.html' %}
{% load static %}

{% block content %}
<div class="container-fluid py-4">
  <!-- ヘッダーと月選択ナビゲーション -->
  <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
    <div>
      <h2 class="h3 fw-bold text-dark mb-1">
        <i class="bi bi-calendar-week text-primary me-2"></i>サロン予約カレンダー
      </h2>
      <p class="text-secondary small mb-0">1on1面談や限定勉強会の日程を選択し、Stripeで安全に決済予約ができます。</p>
    </div>
    
    <div class="d-flex align-items-center gap-2 mt-3 mt-md-0">
      <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2">
        <i class="bi bi-broadcast me-1"></i>リアルタイム同期稼働中
      </span>
      <div class="btn-group">
        <a href="?year={{ prev_year }}&month={{ prev_month }}" class="btn btn-outline-secondary btn-sm">
          <i class="bi bi-chevron-left"></i> 前月
        </a>
        <button class="btn btn-outline-secondary btn-sm fw-bold disabled text-dark">
          {{ year }}年 {{ month }}月
        </button>
        <a href="?year={{ next_year }}&month={{ next_month }}" class="btn btn-outline-secondary btn-sm">
          翌月 <i class="bi bi-chevron-right"></i>
        </a>
      </div>
    </div>
  </div>

  <!-- カレンダーグリッド -->
  <div class="row g-3">
    {% for session in sessions %}
    <div class="col-12 col-md-6 col-lg-4" id="slot-card-{{ session.id }}">
      <div class="card h-100 shadow-sm border-0 border-top border-4 {% if session.is_full %}border-secondary{% else %}border-primary{% endif %}">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="badge bg-primary-subtle text-primary">{{ session.get_category_display }}</span>
            <span class="badge {% if session.is_full %}bg-danger{% else %}bg-success{% endif %} status-badge">
              {% if session.is_full %}満席{% else %}残り {{ session.capacity|add:"-"|add:session.booked_count }}席{% endif %}
            </span>
          </div>

          <h5 class="card-title fw-bold text-truncate">{{ session.title }}</h5>
          <p class="card-text text-muted small mb-3">{{ session.description|truncatechars:70 }}</p>

          <div class="bg-light p-2 rounded mb-3 small">
            <div class="d-flex align-items-center mb-1">
              <i class="bi bi-calendar3 text-muted me-2"></i>
              <strong>{{ session.date|date:"Y/m/d (D)" }}</strong>
            </div>
            <div class="d-flex align-items-center">
              <i class="bi bi-clock text-muted me-2"></i>
              <span>{{ session.start_time|time:"H:i" }} 〜 {{ session.end_time|time:"H:i" }}</span>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center mt-auto">
            <div>
              <span class="fs-5 fw-bold text-dark">¥{{ session.price|floatformat:0 }}</span>
              <span class="text-secondary small">/ 枠</span>
            </div>
            {% if session.is_full %}
              <button class="btn btn-secondary btn-sm disabled">受付終了</button>
            {% else %}
              <button class="btn btn-primary btn-sm px-3 book-btn" data-session-id="{{ session.id }}">
                <i class="bi bi-credit-card me-1"></i>予約へ進む
              </button>
            {% endif %}
          </div>
        </div>
      </div>
    </div>
    {% empty %}
    <div class="col-12 text-center py-5">
      <p class="text-muted">当月に予定されているサロンセッション枠はありません。</p>
    </div>
    {% endfor %}
  </div>
</div>

<!-- WebSocket リアルタイム同期スクリプト -->
<script>
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const socket = new WebSocket(\`\${wsProtocol}//\${window.location.host}/ws/reservations/\`);

  socket.onmessage = function(e) {
    const payload = JSON.parse(e.data);
    if (payload.type === 'slot_updated') {
      const data = payload.data;
      const card = document.getElementById(\`slot-card-\${data.slot_id}\`);
      if (card) {
        const badge = card.querySelector('.status-badge');
        const remaining = data.capacity - data.booked_count;
        if (data.is_full || remaining <= 0) {
          badge.className = 'badge bg-danger status-badge';
          badge.innerText = '満席';
          const btn = card.querySelector('.book-btn');
          if (btn) {
            btn.className = 'btn btn-secondary btn-sm disabled';
            btn.innerText = '受付終了';
          }
        } else {
          badge.className = 'badge bg-success status-badge';
          badge.innerText = \`残り \${remaining}席\`;
        }
      }
    }
  };
</script>
{% endblock %}
`
  },
  {
    filename: 'base.html',
    path: 'templates/base.html',
    language: 'html',
    description: '基本テンプレート。ヘッダー(_header.html)、ナビゲーション(_navbar.html)、メイン領域({% block content %})、フッター(footer.html)を常に全ページで共通表示するベースレイアウト',
    content: `<!-- templates/base.html -->
{% load static %}
<!DOCTYPE html>
<html lang="ja" class="h-100">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{% block title %}Private Nail Salon Claire | 自由が丘 完全個室プライベートサロン{% endblock %}</title>
  <meta name="description" content="{% block meta_description %}自由が丘駅徒歩3分。削らないパラジェル自爪育成と上品なニュアンスアート。Django CBV＆Stripe即時決済対応{% endblock %}" />

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />

  <!-- Bootstrap 5 & Icons -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
  
  <style>
    body { font-family: 'Plus Jakarta Sans', 'Noto Sans JP', sans-serif; background-color: #f8fafc; }
  </style>
  {% block extra_head %}{% endblock %}
</head>
<body class="d-flex flex-column h-100 bg-slate-50 text-slate-800 antialiased min-h-screen">

  <!-- 1. トップヘッダー（営業時間・電話・アクセス・お知らせ・VIP案内） -->
  {% include '_header.html' %}

  <!-- 2. ナビゲーションバー（ロゴ・主要メニュー・アカウント・ログイン） -->
  {% include '_navbar.html' %}

  <!-- 3. Django メッセージフレームワーク -->
  {% if messages %}
    <div class="container-fluid max-w-7xl mx-auto px-3 px-md-4 mt-3">
      {% for message in messages %}
        <div class="alert alert-{{ message.tags|default:'info' }} alert-dismissible fade show rounded-2xl shadow-xs border text-xs" role="alert">
          {{ message }}
          <button type="button" class="btn-close text-xs" data-bs-dismiss="alert"></button>
        </div>
      {% endfor %}
    </div>
  {% endif %}

  <!-- 4. メインコンテンツ領域 -->
  <main class="flex-grow-1 pb-5">
    {% block content %}
    <!-- 各子テンプレートがここに差し込まれます -->
    {% endblock %}
  </main>

  <!-- 5. フッター（サロン詳細・クイックリンク・ポリシー・クレジット） -->
  {% include 'footer.html' %}

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  {% block extra_js %}{% endblock %}
</body>
</html>`
  },
  {
    filename: '_header.html',
    path: 'templates/_header.html',
    language: 'html',
    description: '上部ヘッダーバー。自由が丘駅アクセス情報、営業時間、お知らせチッカー、電話予約番号、会員ログインステータスを常時表示',
    content: `<!-- templates/_header.html -->
{% load static %}
<header class="salon-top-header bg-slate-900 text-slate-200 border-b border-slate-800 text-xs py-1.5 px-3 px-md-4">
  <div class="container-fluid max-w-7xl mx-auto d-flex flex-wrap align-items-center justify-content-between gap-2">
    <!-- 店舗アクセス・営業時間 -->
    <div class="d-flex align-items-center gap-3">
      <div class="d-flex align-items-center gap-1.5 text-rose-400 font-semibold">
        <i class="bi bi-geo-alt-fill text-xs"></i>
        <span>自由が丘駅 正面口 徒歩3分</span>
      </div>
      <span class="text-slate-600 d-none d-sm-inline">|</span>
      <div class="d-none d-sm-flex align-items-center gap-1.5 text-slate-300">
        <i class="bi bi-clock-fill text-slate-400 text-xs"></i>
        <span>営業時間 10:00〜20:00（完全予約制 / 個室ブース）</span>
      </div>
    </div>

    <!-- お知らせチッカー -->
    <div class="d-none d-lg-flex align-items-center gap-2 bg-slate-800/80 px-3 py-0.5 rounded-full border border-slate-700/60">
      <span class="badge bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">INFO</span>
      <span class="text-slate-300 text-xs">
        削らないパラジェル自爪育成＆春の新作ニュアンスアート受付中（VIP会員全施術¥1,000割引）
      </span>
    </div>

    <!-- 電話・認証リンク -->
    <div class="d-flex align-items-center gap-3 ms-auto ms-sm-0">
      <a href="tel:0364215678" class="text-slate-300 hover:text-white text-decoration-none d-none d-md-flex align-items-center gap-1">
        <i class="bi bi-telephone-fill text-rose-400 text-xs"></i>
        <span class="font-mono">03-6421-5678</span>
      </a>

      {% if user.is_authenticated %}
        <div class="d-flex align-items-center gap-2">
          <span class="text-slate-400 text-xs">ログイン中:</span>
          <a href="{% url 'reservations:member_profile' %}" class="text-rose-400 hover:text-rose-300 font-bold text-decoration-none">
            {{ user.get_full_name|default:user.username }} 様
          </a>
          <form method="post" action="{% url 'logout' %}" class="d-inline ms-1">
            {% csrf_token %}
            <button type="submit" class="btn btn-link text-slate-400 hover:text-white p-0 text-xs text-decoration-none border-0">
              <i class="bi bi-box-arrow-right"></i> ログアウト
            </button>
          </form>
        </div>
      {% else %}
        <div class="d-flex align-items-center gap-2">
          <a href="{% url 'login' %}" class="btn btn-outline-light btn-xs px-2.5 py-0.5 rounded-lg text-xs">
            <i class="bi bi-box-arrow-in-right me-1"></i>ログイン
          </a>
          <a href="{% url 'signup' %}" class="btn btn-rose btn-xs px-2.5 py-0.5 rounded-lg text-xs bg-rose-600 text-white hover:bg-rose-500 text-decoration-none">
            <i class="bi bi-person-plus me-1"></i>新規登録
          </a>
        </div>
      {% endif %}
    </div>
  </div>
</header>`
  },
  {
    filename: '_navbar.html',
    path: 'templates/_navbar.html',
    language: 'html',
    description: '共通ナビゲーションバー。ブランドロゴ、トップ、施術予約、予約確認、店舗案内、会員情報・退会、サロン管理、ユーザーアカウントメニューを表示',
    content: `<!-- templates/_navbar.html -->
{% load static %}
<nav class="salon-navbar navbar navbar-expand-lg bg-white border-b border-slate-200 sticky-top shadow-xs px-3 px-lg-4 py-2">
  <div class="container-fluid max-w-7xl mx-auto p-0">
    <!-- ブランドロゴ -->
    <a class="navbar-brand d-flex align-items-center gap-2.5 text-decoration-none" href="{% url 'reservations:home' %}">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-xs text-white">
        <i class="bi bi-gem text-base"></i>
      </div>
      <div>
        <div class="d-flex align-items-center gap-2">
          <span class="text-base font-extrabold text-slate-900 tracking-tight leading-none">Claire</span>
          <span class="badge bg-rose-50 text-rose-700 border border-rose-200 text-[10px] px-1.5 py-0.5 rounded-full font-medium">Nail Salon</span>
        </div>
        <p class="text-[10px] text-slate-400 mb-0 leading-tight">自由が丘 完全個室プライベートサロン</p>
      </div>
    </a>

    <!-- メニューリンク -->
    <div class="collapse navbar-collapse" id="salonNavMenu">
      <ul class="navbar-nav mx-auto nav-pills gap-1 p-1 bg-slate-50 border border-slate-200 rounded-2xl">
        <li class="nav-item">
          <a class="nav-link py-1.5 px-3 rounded-xl text-xs font-bold {% if request.resolver_match.url_name == 'home' %}active bg-rose-600 text-white{% else %}text-slate-600{% endif %}" href="{% url 'reservations:home' %}">
            <i class="bi bi-house-door me-1"></i>トップ
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link py-1.5 px-3 rounded-xl text-xs font-bold {% if request.resolver_match.url_name == 'calendar' %}active bg-rose-600 text-white{% else %}text-slate-600{% endif %}" href="{% url 'reservations:calendar' %}">
            <i class="bi bi-calendar-heart me-1"></i>施術予約
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link py-1.5 px-3 rounded-xl text-xs font-bold {% if request.resolver_match.url_name == 'booking_confirm' %}active bg-rose-600 text-white{% else %}text-slate-600{% endif %}" href="{% url 'reservations:booking_confirm' %}">
            <i class="bi bi-ticket-detailed me-1"></i>予約確認
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link py-1.5 px-3 rounded-xl text-xs font-bold {% if request.resolver_match.url_name == 'access' %}active bg-rose-600 text-white{% else %}text-slate-600{% endif %}" href="{% url 'reservations:access' %}">
            <i class="bi bi-pin-map me-1"></i>店舗案内・アクセス
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link py-1.5 px-3 rounded-xl text-xs font-bold {% if request.resolver_match.url_name == 'member_profile' %}active bg-rose-600 text-white{% else %}text-slate-600{% endif %}" href="{% url 'reservations:member_profile' %}">
            <i class="bi bi-person-badge me-1"></i>会員情報・退会
          </a>
        </li>
      </ul>

      <!-- アカウントドロップダウン / ログインボタン -->
      <div class="d-flex align-items-center gap-2">
        {% if user.is_authenticated %}
          <span class="text-xs font-bold text-slate-800">{{ user.get_full_name|default:user.username }} 様</span>
        {% else %}
          <a href="{% url 'login' %}" class="btn btn-outline-secondary btn-sm rounded-xl text-xs">ログイン</a>
          <a href="{% url 'signup' %}" class="btn btn-rose btn-sm rounded-xl text-xs bg-rose-600 text-white">新規登録</a>
        {% endif %}
      </div>
    </div>
  </div>
</nav>`
  },
  {
    filename: 'footer.html',
    path: 'templates/footer.html',
    language: 'html',
    description: '共通フッター。サロン所在地、営業時間、予約電話番号、衛生安全ポリシー、LINE/Instagram公式リンク、Django & PostgreSQL & Stripe システム表記',
    content: `<!-- templates/footer.html -->
{% load static %}
<footer class="salon-footer bg-white border-t border-slate-200 mt-auto pt-5 pb-4 text-xs text-slate-600">
  <div class="container-fluid max-w-7xl mx-auto px-3 px-md-4">
    <div class="row g-4 mb-4">
      <div class="col-lg-4 col-md-6">
        <h6 class="font-extrabold text-slate-900 mb-2">Private Nail Salon Claire</h6>
        <p class="text-slate-500 text-[11px]">自由が丘駅徒歩3分の完全個室プライベートサロン。削らないパラジェル自爪育成と上品なニュアンスアート。</p>
        <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] space-y-1">
          <div><i class="bi bi-geo-alt-fill text-rose-500 me-1"></i>東京都目黒区自由が丘2-11-XX</div>
          <div><i class="bi bi-telephone-fill text-rose-500 me-1"></i>03-6421-5678 (10:00〜20:00)</div>
        </div>
      </div>
      <div class="col-lg-2 col-md-3 col-6">
        <h6 class="font-bold text-slate-900 mb-2">メニュー</h6>
        <ul class="list-unstyled space-y-1 text-[11px]">
          <li><a href="{% url 'reservations:home' %}" class="text-slate-500 hover:text-rose-600">トップ</a></li>
          <li><a href="{% url 'reservations:calendar' %}" class="text-slate-500 hover:text-rose-600">施術予約</a></li>
          <li><a href="{% url 'reservations:booking_confirm' %}" class="text-slate-500 hover:text-rose-600">予約確認</a></li>
          <li><a href="{% url 'reservations:access' %}" class="text-slate-500 hover:text-rose-600">店舗アクセス</a></li>
        </ul>
      </div>
      <div class="col-lg-3 col-md-3 col-6">
        <h6 class="font-bold text-slate-900 mb-2">安心の約束</h6>
        <ul class="list-unstyled space-y-1 text-[11px] text-slate-500">
          <li>✓ 削らないパラジェル登録サロン</li>
          <li>✓ 器具の医療用滅菌消毒・衛生徹底</li>
          <li>✓ Stripe暗号化による安全な事前決済</li>
        </ul>
      </div>
      <div class="col-lg-3 col-md-12">
        <h6 class="font-bold text-slate-900 mb-2">公式LINE</h6>
        <p class="text-[11px] text-slate-500">LINEからのお問い合わせ・道案内も24時間受付中です。</p>
      </div>
    </div>
    <div class="pt-3 border-top border-slate-200 d-flex justify-content-between text-[10px] text-slate-400">
      <div>&copy; {% now "Y" %} Private Nail Salon Claire.</div>
      <div class="font-mono">Django 5.0+ CBV / PostgreSQL / Stripe / Channels</div>
    </div>
  </div>
</footer>`
  },
  {
    filename: 'login.html',
    path: 'templates/registration/login.html',
    language: 'html',
    description: 'Django標準のLoginView用テンプレート。base.htmlを継承し、常時ナビゲーション・ヘッダー・フッターに囲まれた清潔感のある認証画面',
    content: `<!-- templates/registration/login.html -->
{% extends 'base.html' %}

{% block title %}会員ログイン | Private Nail Salon Claire{% endblock %}

{% block content %}
<div class="container max-w-md mx-auto px-3 px-md-4 py-5">
  <div class="bg-white border border-slate-200 rounded-3xl p-4 p-md-5 shadow-sm">
    <div class="text-center mb-4">
      <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-3 text-xl">
        <i class="bi bi-person-lock"></i>
      </div>
      <h1 class="text-xl font-bold text-slate-900 mb-1">会員ログイン</h1>
      <p class="text-slate-500 text-xs mb-0">登録済みのメールアドレスとパスワードを入力してください</p>
    </div>

    <form method="post" action="{% url 'login' %}">
      {% csrf_token %}
      {% if form.errors %}
        <div class="alert alert-danger text-xs rounded-xl p-2.5 mb-3">メールアドレスまたはパスワードが正しくありません。</div>
      {% endif %}

      <div class="mb-3">
        <label class="form-label text-xs font-bold text-slate-700">メールアドレス</label>
        <input type="email" name="username" class="form-control text-xs py-2 rounded-xl" required autofocus />
      </div>

      <div class="mb-4">
        <label class="form-label text-xs font-bold text-slate-700">パスワード</label>
        <input type="password" name="password" class="form-control text-xs py-2 rounded-xl" required />
      </div>

      <button type="submit" class="btn btn-rose w-100 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-md shadow-rose-200">
        ログインして予約を続ける
      </button>

      <div class="text-center pt-3 border-top border-slate-100 text-xs text-slate-500 mt-3">
        初めてご利用の方は <a href="{% url 'signup' %}" class="text-rose-600 font-bold">新規会員登録（無料）</a>
      </div>
    </form>
  </div>
</div>
{% endblock %}`
  },
  {
    filename: 'signup.html',
    path: 'templates/registration/signup.html',
    language: 'html',
    description: 'DjangoのUserSignUpView用テンプレート。base.htmlを継承し、お名前・メール・電話番号・パスワードを入力して会員登録',
    content: `<!-- templates/registration/signup.html -->
{% extends 'base.html' %}

{% block title %}新規会員登録 | Private Nail Salon Claire{% endblock %}

{% block content %}
<div class="container max-w-lg mx-auto px-3 px-md-4 py-5">
  <div class="bg-white border border-slate-200 rounded-3xl p-4 p-md-5 shadow-sm">
    <div class="text-center mb-4">
      <span class="badge bg-rose-50 text-rose-700 border border-rose-200 text-xs px-2.5 py-0.5 rounded-full mb-2">Member Registration</span>
      <h1 class="text-xl font-bold text-slate-900 mb-1">新規サロン会員登録</h1>
      <p class="text-slate-500 text-xs mb-0">会員登録により24時間即時予約とお爪カルテの共有が可能になります</p>
    </div>

    <form method="post" action="{% url 'signup' %}">
      {% csrf_token %}
      <!-- 姓・名 -->
      <div class="row g-3 mb-3">
        <div class="col-6">
          <label class="form-label text-xs font-bold text-slate-700">姓</label>
          <input type="text" name="last_name" class="form-control text-xs py-2 rounded-xl" required />
        </div>
        <div class="col-6">
          <label class="form-label text-xs font-bold text-slate-700">名</label>
          <input type="text" name="first_name" class="form-control text-xs py-2 rounded-xl" required />
        </div>
      </div>

      <!-- メールアドレス -->
      <div class="mb-3">
        <label class="form-label text-xs font-bold text-slate-700">メールアドレス</label>
        <input type="email" name="email" class="form-control text-xs py-2 rounded-xl font-mono" required />
      </div>

      <!-- パスワード -->
      <div class="mb-4">
        <label class="form-label text-xs font-bold text-slate-700">パスワード（8文字以上）</label>
        <input type="password" name="password1" class="form-control text-xs py-2 rounded-xl" required />
      </div>

      <button type="submit" class="btn btn-rose w-100 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-md shadow-rose-200">
        利用規約に同意して登録する
      </button>

      <div class="text-center pt-3 border-top border-slate-100 text-xs text-slate-500 mt-3">
        すでに会員の方は <a href="{% url 'login' %}" class="text-rose-600 font-bold">ログインはこちら</a>
      </div>
    </form>
  </div>
</div>
{% endblock %}`
  },
  {
    filename: 'logged_out.html',
    path: 'templates/registration/logged_out.html',
    language: 'html',
    description: 'Django標準のLogoutView用完了画面。セッション終了の旨と、再ログイン・トップページ復帰リンクを提供',
    content: `<!-- templates/registration/logged_out.html -->
{% extends 'base.html' %}

{% block title %}ログアウト完了 | Private Nail Salon Claire{% endblock %}

{% block content %}
<div class="container max-w-md mx-auto px-3 px-md-4 py-5 text-center">
  <div class="bg-white border border-slate-200 rounded-3xl p-4 p-md-5 shadow-sm">
    <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-3 text-2xl shadow-xs">
      <i class="bi bi-check-circle-fill"></i>
    </div>
    <h1 class="text-xl font-bold text-slate-900 mb-2">ログアウトしました</h1>
    <p class="text-slate-500 text-xs mb-4">セッションを安全に終了しました。またのご来店・ご予約を心よりお待ち申し上げております。</p>
    <div class="d-flex flex-column gap-2">
      <a href="{% url 'login' %}" class="btn btn-primary py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 border-0 shadow-md shadow-rose-200 text-decoration-none">再度ログインする</a>
      <a href="{% url 'reservations:home' %}" class="btn btn-outline-secondary py-2 rounded-xl text-xs text-decoration-none">トップページへ戻る</a>
    </div>
  </div>
</div>
{% endblock %}`
  },
  {
    filename: 'manage.py',
    path: 'manage.py',
    language: 'python',
    description: 'Djangoコマンドラインユーティリティ',
    content: `#!/usr/bin/env python
\"\"\"Django's command-line utility for administrative tasks.\"\"\"
import os
import sys

def main():
    \"\"\"Run administrative tasks.\"\"\"
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
`
  },
  {
    filename: 'urls.py',
    path: 'config/urls.py',
    language: 'python',
    description: 'プロジェクト全体のURLルーティング',
    content: `from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('reservations/', include('reservations.urls')),
    path('', RedirectView.as_view(url='/reservations/calendar/', permanent=False)),
]
`
  },
  {
    filename: 'asgi.py',
    path: 'config/asgi.py',
    language: 'python',
    description: 'ASGIエントリーポイント (WebSocket対応)',
    content: `import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import reservations.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            reservations.routing.websocket_urlpatterns
        )
    ),
})
`
  },
  {
    filename: 'routing.py',
    path: 'reservations/routing.py',
    language: 'python',
    description: 'WebSocketルーティング定義',
    content: `from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/calendar/$', consumers.CalendarConsumer.as_asgi()),
]
`
  },
  {
    filename: '__init__.py',
    path: 'config/__init__.py',
    language: 'python',
    description: 'パッケージ初期化',
    content: ``
  },
  {
    filename: '__init__.py',
    path: 'reservations/__init__.py',
    language: 'python',
    description: 'パッケージ初期化',
    content: ``
  },
  {
    filename: 'admin.py',
    path: 'reservations/admin.py',
    language: 'python',
    description: '管理画面設定',
    content: `from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, SalonSession, Reservation

admin.site.register(CustomUser, UserAdmin)

@admin.register(SalonSession)
class SalonSessionAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'start_time', 'category', 'status', 'is_active')
    list_filter = ('date', 'category', 'status', 'is_active')
    search_fields = ('title', 'description')

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('user', 'session', 'status', 'amount', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'session__title')
`
  },
  {
    filename: 'apps.py',
    path: 'reservations/apps.py',
    language: 'python',
    description: 'アプリケーション設定',
    content: `from django.apps import AppConfig

class ReservationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'reservations'
`
  },
  {
    filename: 'wsgi.py',
    path: 'config/wsgi.py',
    language: 'python',
    description: 'WSGIエントリーポイント (同期サーバー用)',
    content: `import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()
`
  },
  {
    filename: 'password_reset_form.html',
    path: 'templates/registration/password_reset_form.html',
    language: 'html',
    description: 'パスワードリセット要求画面',
    content: `{% extends "base.html" %}

{% block title %}パスワードリセット - Private Nail Salon Claire{% endblock %}

{% block content %}
<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
            <div class="card shadow-sm border-0 rounded-4">
                <div class="card-body p-4 p-md-5">
                    <h2 class="text-center mb-4 text-indigo-600 fw-bold">
                        <i class="bi bi-shield-lock me-2"></i>パスワード再設定
                    </h2>
                    
                    <p class="text-muted small mb-4 text-center">
                        ご登録のメールアドレスを入力してください。<br>
                        パスワード再設定用のリンクを送信します。
                    </p>

                    <form method="post" novalidate>
                        {% csrf_token %}
                        
                        {% if form.errors %}
                            <div class="alert alert-danger small rounded-3">
                                メールアドレスが正しくないか、登録されていません。
                            </div>
                        {% endif %}

                        <div class="mb-4">
                            <label for="{{ form.email.id_for_label }}" class="form-label text-muted small fw-bold">メールアドレス</label>
                            <input type="email" name="{{ form.email.html_name }}" id="{{ form.email.id_for_label }}" 
                                   class="form-control form-control-lg bg-light border-0" 
                                   placeholder="mail@example.com" required>
                            {% if form.email.errors %}
                                <div class="text-danger small mt-1">{{ form.email.errors.0 }}</div>
                            {% endif %}
                        </div>

                        <div class="d-grid gap-2">
                            <button type="submit" class="btn btn-lg rounded-3 fw-bold text-white shadow-sm" style="background-color: #4f46e5;">
                                再設定メールを送信
                            </button>
                        </div>
                    </form>

                    <div class="text-center mt-4 pt-3 border-top">
                        <p class="mb-0 text-muted small">
                            <a href="{% url 'login' %}" class="text-indigo-600 text-decoration-none fw-bold">
                                <i class="bi bi-arrow-left me-1"></i>ログイン画面へ戻る
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
{% endblock %}
`
  },
  {
    filename: 'password_reset_done.html',
    path: 'templates/registration/password_reset_done.html',
    language: 'html',
    description: 'パスワードリセットメール送信完了画面',
    content: `{% extends "base.html" %}

{% block title %}メール送信完了 - Private Nail Salon Claire{% endblock %}

{% block content %}
<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
            <div class="card shadow-sm border-0 rounded-4">
                <div class="card-body p-4 p-md-5 text-center">
                    <div class="mb-4" style="color: #4f46e5;">
                        <i class="bi bi-envelope-check" style="font-size: 3.5rem;"></i>
                    </div>
                    <h2 class="h4 mb-3 fw-bold text-dark">
                        再設定メールを送信しました
                    </h2>
                    
                    <p class="text-muted small mb-4 text-start">
                        ご入力いただいたメールアドレスに、パスワード再設定用のURLを送信しました。<br><br>
                        メールに記載されているリンクをクリックして、新しいパスワードを設定してください。
                    </p>
                    
                    <div class="alert alert-light border small text-start mb-4 text-muted rounded-3">
                        <i class="bi bi-info-circle me-1"></i>
                        数分待ってもメールが届かない場合は、迷惑メールフォルダをご確認いただくか、ご登録のメールアドレスが間違っていないか再度ご確認ください。
                    </div>

                    <div class="d-grid gap-2">
                        <a href="{% url 'login' %}" class="btn btn-outline-secondary btn-lg rounded-3 fw-bold">
                            ログイン画面へ戻る
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
{% endblock %}
`
  },
  {
    filename: 'password_reset_confirm.html',
    path: 'templates/registration/password_reset_confirm.html',
    language: 'html',
    description: 'パスワード再設定（新パスワード入力）画面',
    content: `{% extends "base.html" %}

{% block title %}新しいパスワードの設定 - Private Nail Salon Claire{% endblock %}

{% block content %}
<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
            <div class="card shadow-sm border-0 rounded-4">
                <div class="card-body p-4 p-md-5">
                    <h2 class="text-center mb-4 text-indigo-600 fw-bold">
                        <i class="bi bi-key me-2"></i>新しいパスワードの設定
                    </h2>

                    {% if validlink %}
                        <p class="text-muted small mb-4 text-center">
                            新しいパスワードを2回入力してください。
                        </p>

                        <form method="post" novalidate>
                            {% csrf_token %}

                            {% if form.non_field_errors %}
                                <div class="alert alert-danger small rounded-3">
                                    {{ form.non_field_errors.0 }}
                                </div>
                            {% endif %}

                            {% for field in form %}
                                <div class="mb-4">
                                    <label for="{{ field.id_for_label }}" class="form-label text-muted small fw-bold">{{ field.label }}</label>
                                    <input type="{{ field.field.widget.input_type|default:'password' }}" name="{{ field.html_name }}" id="{{ field.id_for_label }}" 
                                           class="form-control form-control-lg bg-light border-0" required>
                                    {% if field.help_text %}
                                        <div class="form-text small mt-2">{{ field.help_text|safe }}</div>
                                    {% endif %}
                                    {% if field.errors %}
                                        <div class="text-danger small mt-1">{{ field.errors.0 }}</div>
                                    {% endif %}
                                </div>
                            {% endfor %}

                            <div class="d-grid gap-2 mt-2">
                                <button type="submit" class="btn btn-lg rounded-3 fw-bold text-white shadow-sm" style="background-color: #4f46e5;">
                                    パスワードを変更する
                                </button>
                            </div>
                        </form>
                    {% else %}
                        <div class="text-center">
                            <div class="mb-4 text-danger">
                                <i class="bi bi-exclamation-triangle" style="font-size: 3.5rem;"></i>
                            </div>
                            <h3 class="h5 fw-bold mb-3">無効なリンクです</h3>
                            <p class="text-muted small mb-4">
                                パスワード再設定のリンクが無効か、すでに使用されています。<br>
                                セキュリティのため、リンクの有効期限が切れている場合もあります。
                            </p>
                            <a href="{% url 'password_reset' %}" class="btn btn-outline-secondary btn-lg rounded-3 fw-bold w-100">
                                もう一度再設定をリクエストする
                            </a>
                        </div>
                    {% endif %}
                </div>
            </div>
        </div>
    </div>
</div>
{% endblock %}
`
  },
  {
    filename: 'password_reset_complete.html',
    path: 'templates/registration/password_reset_complete.html',
    language: 'html',
    description: 'パスワード再設定完了画面',
    content: `{% extends "base.html" %}

{% block title %}パスワード変更完了 - Private Nail Salon Claire{% endblock %}

{% block content %}
<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
            <div class="card shadow-sm border-0 rounded-4">
                <div class="card-body p-4 p-md-5 text-center">
                    <div class="mb-4 text-success">
                        <i class="bi bi-check-circle" style="font-size: 4rem;"></i>
                    </div>
                    <h2 class="h4 mb-3 fw-bold text-dark">
                        パスワードの変更が完了しました
                    </h2>
                    
                    <p class="text-muted small mb-4">
                        新しいパスワードが正しく設定されました。<br>
                        新しいパスワードを使用して、ログインを行ってください。
                    </p>

                    <div class="d-grid gap-2">
                        <a href="{% url 'login' %}" class="btn btn-lg rounded-3 fw-bold text-white shadow-sm" style="background-color: #4f46e5;">
                            ログイン画面へ進む
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
{% endblock %}
`
  },
  {
    filename: 'password_reset_subject.txt',
    path: 'templates/registration/password_reset_subject.txt',
    language: 'text',
    description: 'パスワードリセットメールの件名',
    content: `[Private Nail Salon Claire] パスワード再設定のご案内`
  },
  {
    filename: 'password_reset_email.html',
    path: 'templates/registration/password_reset_email.html',
    language: 'html',
    description: 'パスワードリセットメールの本文 (HTML)',
    content: `{% autoescape off %}
{{ user.get_username }} 様

日頃より Private Nail Salon Claire をご利用いただき、誠にありがとうございます。

お客様のアカウントのパスワード再設定リクエストを受け付けました。
以下のリンクをクリックして、新しいパスワードを設定してください。

{{ protocol }}://{{ domain }}{% url 'password_reset_confirm' uidb64=uid token=token %}

※このリンクの有効期限は短時間で切れる設定となっております。
※もしご自身でこのリクエストをされた覚えがない場合は、このメールを破棄していただいて問題ございません。

--------------------------------------------------
Private Nail Salon Claire
https://{{ domain }}
--------------------------------------------------
{% endautoescape %}
`
  },
  {
    filename: 'forms.py',
    path: 'reservations/forms.py',
    language: 'python',
    description: 'フォーム定義 (ユーザー登録・予約用)',
    content: `from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import CustomUser

class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = ('username', 'email')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs['class'] = 'form-control bg-light border-0'
`
  },
  {
    filename: 'home.html',
    path: 'templates/reservations/home.html',
    language: 'html',
    description: 'ランディングページ（トップ画面）',
    content: `{% extends "base.html" %}

{% block title %}Private Nail Salon Claire - トップページ{% endblock %}

{% block content %}
<!-- Hero Section -->
<div class="position-relative overflow-hidden p-3 p-md-5 m-md-3 text-center bg-light rounded-4 shadow-sm" style="background-image: url('https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?w=1600&auto=format&fit=crop'); background-size: cover; background-position: center;">
    <div class="col-md-8 col-lg-6 p-4 p-lg-5 mx-auto my-5 rounded-4 shadow-lg" style="background-color: rgba(255, 255, 255, 0.90); backdrop-filter: blur(8px);">
        <span class="badge bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-2 rounded-pill mb-3" style="color: #4f46e5; background-color: #e0e7ff;">完全予約制・1日限定3枠</span>
        <h1 class="display-5 fw-bold mb-3" style="color: #312e81;">あなただけの<br>特別なネイル時間を。</h1>
        <p class="lead fw-normal text-muted mb-4 fs-6 fs-md-5">
            自爪を傷めない「フィルイン」対応のプライベートサロン。<br class="d-none d-md-block">
            丁寧なケアと美しいフォルムで、長持ちする美爪へ導きます。
        </p>
        <div class="d-grid gap-2 d-sm-flex justify-content-sm-center">
            <a class="btn btn-lg text-white rounded-pill px-4 px-md-5 shadow-sm fw-bold d-flex align-items-center justify-content-center gap-2" href="{% url 'reservations:calendar' %}" style="background-color: #4f46e5;">
                <i class="bi bi-calendar-heart-fill"></i> 空き枠を確認して予約
            </a>
            {% if not user.is_authenticated %}
            <a class="btn btn-outline-secondary btn-lg rounded-pill px-4 px-md-5 fw-bold mt-2 mt-sm-0" href="{% url 'login' %}">
                ログイン・新規登録
            </a>
            {% endif %}
        </div>
    </div>
</div>

<!-- Features Section -->
<div class="container px-4 py-5" id="features">
    <div class="text-center mb-5">
        <h2 class="fw-bold text-dark mb-2">Our Concept</h2>
        <p class="text-muted">Claireが選ばれる3つの理由</p>
    </div>
    <div class="row g-4 py-3 row-cols-1 row-cols-md-3">
        <div class="col">
            <div class="card h-100 border-0 shadow-sm rounded-4 bg-white p-4 text-center hover-lift">
                <div class="d-inline-flex align-items-center justify-content-center fs-2 mb-4 mx-auto rounded-circle" style="width: 70px; height: 70px; background-color: #e0e7ff; color: #4f46e5;">
                    <i class="bi bi-stars"></i>
                </div>
                <h3 class="fs-5 fw-bold mb-3">自爪に優しいフィルイン</h3>
                <p class="text-muted small mb-0 text-start">
                    アセトンを使用せず、ベースジェルを一層残すフィルイン技術を導入。爪への負担を最小限に抑え、長くネイルを楽しみたい方に最適です。
                </p>
            </div>
        </div>
        <div class="col">
            <div class="card h-100 border-0 shadow-sm rounded-4 bg-white p-4 text-center hover-lift">
                <div class="d-inline-flex align-items-center justify-content-center fs-2 mb-4 mx-auto rounded-circle" style="width: 70px; height: 70px; background-color: #fce7f3; color: #be185d;">
                    <i class="bi bi-cup-hot"></i>
                </div>
                <h3 class="fs-5 fw-bold mb-3">完全プライベート空間</h3>
                <p class="text-muted small mb-0 text-start">
                    1日3枠限定、完全予約制。他のお客様の目を気にすることなく、お好きな映画や音楽を楽しみながらリラックスした時間をお過ごしいただけます。
                </p>
            </div>
        </div>
        <div class="col">
            <div class="card h-100 border-0 shadow-sm rounded-4 bg-white p-4 text-center hover-lift">
                <div class="d-inline-flex align-items-center justify-content-center fs-2 mb-4 mx-auto rounded-circle" style="width: 70px; height: 70px; background-color: #ecfdf5; color: #047857;">
                    <i class="bi bi-palette"></i>
                </div>
                <h3 class="fs-5 fw-bold mb-3">パーソナルカラー提案</h3>
                <p class="text-muted small mb-0 text-start">
                    お客様の肌色やライフスタイルに合わせた、指先が一番美しく見えるオリジナルカラーをご提案。丁寧なカウンセリングで理想を叶えます。
                </p>
            </div>
        </div>
    </div>
</div>

<!-- Process Section -->
<div class="py-5" style="background-color: #f8fafc;">
    <div class="container px-4">
        <div class="text-center mb-5">
            <h2 class="fw-bold text-dark mb-2">Treatment Process</h2>
            <p class="text-muted">ご来店からお帰りまでの流れ</p>
        </div>
        <div class="row g-4">
            <div class="col-md-3 col-6">
                <div class="bg-white p-4 rounded-4 shadow-sm h-100 border border-light position-relative">
                    <div class="position-absolute top-0 start-0 translate-middle-y ms-4 badge rounded-pill" style="background-color: #4f46e5; font-family: monospace;">STEP 1</div>
                    <div class="text-center mt-3 mb-3">
                        <i class="bi bi-chat-heart text-muted fs-1"></i>
                    </div>
                    <h4 class="fs-6 fw-bold mb-2 text-center text-dark">カウンセリング</h4>
                    <p class="text-muted small mb-0">ご希望のデザインやお爪の悩み、ライフスタイルを丁寧にお伺いします。</p>
                </div>
            </div>
            <div class="col-md-3 col-6">
                <div class="bg-white p-4 rounded-4 shadow-sm h-100 border border-light position-relative">
                    <div class="position-absolute top-0 start-0 translate-middle-y ms-4 badge rounded-pill" style="background-color: #4f46e5; font-family: monospace;">STEP 2</div>
                    <div class="text-center mt-3 mb-3">
                        <i class="bi bi-scissors text-muted fs-1"></i>
                    </div>
                    <h4 class="fs-6 fw-bold mb-2 text-center text-dark">ケア・ベース作り</h4>
                    <p class="text-muted small mb-0">丁寧な甘皮処理と、持ちを良くするための美しいベースフォルムを作ります。</p>
                </div>
            </div>
            <div class="col-md-3 col-6">
                <div class="bg-white p-4 rounded-4 shadow-sm h-100 border border-light position-relative">
                    <div class="position-absolute top-0 start-0 translate-middle-y ms-4 badge rounded-pill" style="background-color: #4f46e5; font-family: monospace;">STEP 3</div>
                    <div class="text-center mt-3 mb-3">
                        <i class="bi bi-brush text-muted fs-1"></i>
                    </div>
                    <h4 class="fs-6 fw-bold mb-2 text-center text-dark">ジェル塗布</h4>
                    <p class="text-muted small mb-0">厳選したカラーやデザインを施し、つるんとした美しいフォルムに仕上げます。</p>
                </div>
            </div>
            <div class="col-md-3 col-6">
                <div class="bg-white p-4 rounded-4 shadow-sm h-100 border border-light position-relative">
                    <div class="position-absolute top-0 start-0 translate-middle-y ms-4 badge rounded-pill" style="background-color: #4f46e5; font-family: monospace;">STEP 4</div>
                    <div class="text-center mt-3 mb-3">
                        <i class="bi bi-droplet text-muted fs-1"></i>
                    </div>
                    <h4 class="fs-6 fw-bold mb-2 text-center text-dark">保湿・お仕上げ</h4>
                    <p class="text-muted small mb-0">専用の高品質オイルでしっかりと保湿し、写真撮影を行って完成となります。</p>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- CTA Section -->
<div class="container px-4 py-5 my-5 text-center">
    <div class="p-4 p-md-5 bg-white border rounded-4 shadow-sm" style="border-color: #e2e8f0 !important;">
        <h2 class="fw-bold mb-3 text-dark">ご予約をお待ちしております</h2>
        <p class="text-muted mb-4 max-w-2xl mx-auto">
            当サロンは完全予約制です。Webから24時間いつでも空き状況のご確認とご予約が可能です。<br>
            初めての方も、どうぞお気軽にお越しください。
        </p>
        <a href="{% url 'reservations:calendar' %}" class="btn btn-lg text-white rounded-pill px-4 px-md-5 py-3 fw-bold shadow-sm d-inline-flex align-items-center gap-2" style="background-color: #4f46e5; transition: transform 0.2s;">
            <i class="bi bi-calendar-check"></i> Webで即時予約する
        </a>
    </div>
</div>

<style>
    .hover-lift {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .hover-lift:hover {
        transform: translateY(-5px);
        box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
    }
</style>
{% endblock %}
`
  },
  {
    filename: 'my_reservations.html',
    path: 'templates/reservations/my_reservations.html',
    language: 'html',
    description: 'マイ予約一覧画面',
    content: `{% extends "base.html" %}

{% block title %}ご予約状況 - Private Nail Salon Claire{% endblock %}

{% block content %}
<div class="container py-5">
    <div class="row mb-4 align-items-center">
        <div class="col-md-8">
            <h2 class="fw-bold text-dark mb-1">
                <i class="bi bi-calendar-check text-indigo-600 me-2" style="color: #4f46e5;"></i>ご予約状況
            </h2>
            <p class="text-muted small mb-0">現在のご予約や過去の履歴を確認できます。</p>
        </div>
        <div class="col-md-4 text-md-end mt-3 mt-md-0">
            <a href="{% url 'reservations:calendar' %}" class="btn rounded-pill px-4 text-white shadow-sm fw-bold" style="background-color: #4f46e5;">
                <i class="bi bi-plus-lg me-1"></i> 新しく予約する
            </a>
        </div>
    </div>

    <!-- 今後のご予約 -->
    <div class="card border-0 shadow-sm rounded-4 mb-5">
        <div class="card-header bg-white border-bottom-0 pt-4 pb-0 px-4">
            <h3 class="h5 fw-bold text-dark"><i class="bi bi-clock-history me-2 text-primary"></i>今後のご予約</h3>
        </div>
        <div class="card-body p-4">
            {% if upcoming_reservations %}
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light text-muted small">
                            <tr>
                                <th scope="col" class="fw-normal rounded-start">予約日時</th>
                                <th scope="col" class="fw-normal">メニュー/コース</th>
                                <th scope="col" class="fw-normal">ステータス</th>
                                <th scope="col" class="fw-normal text-end rounded-end">操作</th>
                            </tr>
                        </thead>
                        <tbody class="border-top-0">
                            {% for res in upcoming_reservations %}
                            <tr>
                                <td class="py-3">
                                    <div class="fw-bold text-dark">{{ res.slot.start_time|date:"Y年n月j日 (D)" }}</div>
                                    <div class="text-muted small">{{ res.slot.start_time|time:"H:i" }} - {{ res.slot.end_time|time:"H:i" }}</div>
                                </td>
                                <td class="py-3">
                                    <span class="badge bg-light text-dark border me-1">{{ res.slot.get_category_display }}</span>
                                    <div class="fw-bold text-dark mt-1">{{ res.slot.title }}</div>
                                </td>
                                <td class="py-3">
                                    {% if res.status == 'confirmed' %}
                                        <span class="badge rounded-pill bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2"><i class="bi bi-check-circle me-1"></i>予約確定</span>
                                    {% elif res.status == 'cancelled' %}
                                        <span class="badge rounded-pill bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-3 py-2">キャンセル済</span>
                                    {% endif %}
                                </td>
                                <td class="py-3 text-end">
                                    {% if res.status == 'confirmed' %}
                                        <!-- キャンセルボタン (モーダルトリガー) -->
                                        <button type="button" class="btn btn-sm btn-outline-danger rounded-3" data-bs-toggle="modal" data-bs-target="#cancelModal{{ res.id }}">
                                            キャンセル
                                        </button>

                                        <!-- キャンセル確認モーダル -->
                                        <div class="modal fade" id="cancelModal{{ res.id }}" tabindex="-1" aria-hidden="true">
                                            <div class="modal-dialog modal-dialog-centered">
                                                <div class="modal-content rounded-4 border-0 shadow">
                                                    <div class="modal-header border-bottom-0 pb-0 text-start">
                                                        <h5 class="modal-title fw-bold text-dark">ご予約のキャンセル</h5>
                                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                                    </div>
                                                    <div class="modal-body text-start">
                                                        <p class="text-muted mb-4">以下のご予約をキャンセルします。よろしいですか？</p>
                                                        <div class="bg-light p-3 rounded-3 mb-4">
                                                            <div class="fw-bold text-dark">{{ res.slot.start_time|date:"Y年n月j日 (D) H:i" }}</div>
                                                            <div class="text-muted small mt-1">{{ res.slot.title }}</div>
                                                        </div>
                                                        <form action="{% url 'reservations:cancel_reservation' res.id %}" method="post" class="d-grid gap-2">
                                                            {% csrf_token %}
                                                            <button type="submit" class="btn btn-danger py-2 rounded-3 fw-bold">キャンセルを確定する</button>
                                                            <button type="button" class="btn btn-light py-2 rounded-3 fw-bold mt-1" data-bs-dismiss="modal">閉じる</button>
                                                        </form>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    {% endif %}
                                </td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
            {% else %}
                <div class="text-center py-5">
                    <div class="mb-3 text-muted">
                        <i class="bi bi-calendar-x" style="font-size: 3rem;"></i>
                    </div>
                    <p class="text-muted fw-bold">現在、今後のご予約はありません。</p>
                </div>
            {% endif %}
        </div>
    </div>

    <!-- 過去の履歴 -->
    <div class="card border-0 shadow-sm rounded-4">
        <div class="card-header bg-white border-bottom-0 pt-4 pb-0 px-4">
            <h3 class="h6 fw-bold text-muted mb-0"><i class="bi bi-archive me-2"></i>過去の履歴</h3>
        </div>
        <div class="card-body p-4">
            {% if past_reservations %}
                <div class="table-responsive">
                    <table class="table align-middle mb-0 text-muted">
                        <tbody class="border-top-0">
                            {% for res in past_reservations %}
                            <tr>
                                <td class="py-2" style="width: 200px;">
                                    <div class="small">{{ res.slot.start_time|date:"Y年n月j日" }}</div>
                                </td>
                                <td class="py-2">
                                    <div class="small">{{ res.slot.title }}</div>
                                </td>
                                <td class="py-2 text-end">
                                    {% if res.status == 'confirmed' %}
                                        <span class="badge bg-light text-secondary border px-2 py-1">来店済</span>
                                    {% elif res.status == 'cancelled' %}
                                        <span class="badge bg-light text-secondary border px-2 py-1">キャンセル</span>
                                    {% endif %}
                                </td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
            {% else %}
                <p class="text-muted small text-center my-4">過去の履歴はありません。</p>
            {% endif %}
        </div>
    </div>
</div>
{% endblock %}
`
  },
  {
    filename: 'booking_confirm.html',
    path: 'templates/reservations/booking_confirm.html',
    language: 'html',
    description: '予約確定確認画面',
    content: `{% extends "base.html" %}

{% block title %}ご予約内容の確認 - Private Nail Salon Claire{% endblock %}

{% block content %}
<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-lg-8">
            <div class="text-center mb-4">
                <span class="badge bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-2 rounded-pill mb-2" style="color: #4f46e5; background-color: #e0e7ff;">最終確認</span>
                <h2 class="fw-bold text-dark mb-1">
                    ご予約内容の確認
                </h2>
                <p class="text-muted small">以下の内容でご予約を確定してよろしいですか？</p>
            </div>

            <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                <div class="card-body p-0">
                    <div class="row g-0">
                        <!-- Left: Information -->
                        <div class="col-md-7 p-4 p-md-5">
                            <h4 class="fw-bold text-dark mb-4 fs-5 border-bottom pb-2">選択した施術枠</h4>
                            
                            <dl class="row mb-0">
                                <dt class="col-sm-4 text-muted small fw-normal mb-2 mb-sm-3">ご予約日時</dt>
                                <dd class="col-sm-8 fw-bold text-dark mb-3">
                                    {{ slot.start_time|date:"Y年n月j日 (D)" }}<br>
                                    <span class="fs-5 text-indigo-600" style="color: #4f46e5;">{{ slot.start_time|time:"H:i" }} - {{ slot.end_time|time:"H:i" }}</span>
                                </dd>

                                <dt class="col-sm-4 text-muted small fw-normal mb-2 mb-sm-3">メニュー</dt>
                                <dd class="col-sm-8 mb-3">
                                    <span class="badge bg-light text-dark border mb-1">{{ slot.get_category_display }}</span>
                                    <div class="fw-bold text-dark">{{ slot.title }}</div>
                                </dd>

                                <dt class="col-sm-4 text-muted small fw-normal mb-2 mb-sm-0">お客様情報</dt>
                                <dd class="col-sm-8 fw-bold text-dark mb-0">
                                    {{ user.username }} 様<br>
                                    <span class="text-muted small fw-normal">{{ user.email }}</span>
                                </dd>
                            </dl>
                        </div>
                        
                        <!-- Right: Action / Notice -->
                        <div class="col-md-5 bg-light p-4 p-md-5 border-start">
                            <div class="alert alert-warning border-warning bg-warning bg-opacity-10 rounded-3 small text-dark mb-4">
                                <i class="bi bi-exclamation-triangle-fill text-warning me-1"></i>
                                <strong>キャンセルポリシー</strong><br>
                                当日の無断キャンセルはご遠慮ください。変更がある場合は前日までにお願いいたします。
                            </div>

                            <form method="post" class="d-grid gap-3">
                                {% csrf_token %}
                                
                                <button type="submit" class="btn btn-lg rounded-3 fw-bold text-white shadow-sm" style="background-color: #4f46e5;">
                                    この内容で予約を確定する
                                </button>
                                
                                <a href="{% url 'reservations:calendar' %}" class="btn btn-outline-secondary rounded-3 fw-bold">
                                    カレンダーへ戻る
                                </a>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Notes Section -->
            <div class="card border-0 bg-slate-50 rounded-4">
                <div class="card-body p-4 text-muted small">
                    <h5 class="fw-bold fs-6 mb-3"><i class="bi bi-info-circle me-2"></i>ご来店にあたってのお願い</h5>
                    <ul class="mb-0 ps-3">
                        <li class="mb-1">ご予約時間の5分前を目安にご来店ください。</li>
                        <li class="mb-1">15分以上遅刻された場合は、施術内容の変更またはキャンセルとさせていただく場合がございます。</li>
                        <li>ハンドクリームやオイルのご使用は、ジェルの浮きの原因となるため当日はお控えください。</li>
                    </ul>
                </div>
            </div>
            
        </div>
    </div>
</div>
{% endblock %}
`
  },
  {
    filename: 'profile.html',
    path: 'templates/registration/profile.html',
    language: 'html',
    description: 'プロフィール（ユーザー情報変更・退会）画面',
    content: `{% extends "base.html" %}

{% block title %}アカウント設定 - Private Nail Salon Claire{% endblock %}

{% block content %}
<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-lg-8">
            <h2 class="fw-bold text-dark mb-4">
                <i class="bi bi-person-gear text-indigo-600 me-2" style="color: #4f46e5;"></i>アカウント設定
            </h2>

            <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-5">
                <div class="card-header bg-white border-bottom-0 pt-4 pb-0 px-4">
                    <h3 class="h5 fw-bold text-dark">ご登録情報の変更</h3>
                </div>
                <div class="card-body p-4 p-md-5">
                    
                    {% if messages %}
                        {% for message in messages %}
                            <div class="alert alert-success border-0 small rounded-3 mb-4">
                                <i class="bi bi-check-circle me-1"></i>{{ message }}
                            </div>
                        {% endfor %}
                    {% endif %}

                    <form method="post" novalidate>
                        {% csrf_token %}
                        
                        {% if form.non_field_errors %}
                            <div class="alert alert-danger small rounded-3">
                                {{ form.non_field_errors.0 }}
                            </div>
                        {% endif %}

                        <div class="row g-4 mb-4">
                            <!-- ユーザー名 -->
                            <div class="col-md-6">
                                <label for="{{ form.username.id_for_label }}" class="form-label text-muted small fw-bold">お名前 (ユーザー名)</label>
                                <input type="text" name="{{ form.username.html_name }}" id="{{ form.username.id_for_label }}" 
                                       class="form-control form-control-lg bg-light border-0" 
                                       value="{{ form.username.value|default_if_none:'' }}" required>
                                {% if form.username.errors %}
                                    <div class="text-danger small mt-1">{{ form.username.errors.0 }}</div>
                                {% endif %}
                                <div class="form-text small mt-1">ご来店時の確認に使用します。</div>
                            </div>
                            
                            <!-- メールアドレス -->
                            <div class="col-md-6">
                                <label for="{{ form.email.id_for_label }}" class="form-label text-muted small fw-bold">メールアドレス</label>
                                <input type="email" name="{{ form.email.html_name }}" id="{{ form.email.id_for_label }}" 
                                       class="form-control form-control-lg bg-light border-0" 
                                       value="{{ form.email.value|default_if_none:'' }}" required>
                                {% if form.email.errors %}
                                    <div class="text-danger small mt-1">{{ form.email.errors.0 }}</div>
                                {% endif %}
                            </div>
                        </div>

                        <div class="d-flex align-items-center gap-3">
                            <button type="submit" name="update_profile" class="btn btn-lg rounded-3 fw-bold text-white shadow-sm px-5" style="background-color: #4f46e5;">
                                変更を保存する
                            </button>
                            <a href="{% url 'password_change' %}" class="text-indigo-600 text-decoration-none fw-bold small" style="color: #4f46e5;">
                                パスワードの変更はこちら
                            </a>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Danger Zone -->
            <div class="card border border-danger border-opacity-25 shadow-sm rounded-4">
                <div class="card-body p-4 p-md-5">
                    <h3 class="h5 fw-bold text-danger mb-3">
                        <i class="bi bi-exclamation-octagon me-2"></i>アカウントの削除
                    </h3>
                    <p class="text-muted small mb-4">
                        アカウントを削除すると、これまでのご予約履歴などの全てのデータが完全に消去され、復元することはできません。<br>
                        ※今後のご予約（確定済み）がある場合は、キャンセル処理を行ってから削除してください。
                    </p>
                    
                    <button type="button" class="btn btn-outline-danger fw-bold rounded-3" data-bs-toggle="modal" data-bs-target="#deleteAccountModal">
                        アカウントを削除する
                    </button>
                </div>
            </div>

            <!-- Delete Account Modal -->
            <div class="modal fade" id="deleteAccountModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content rounded-4 border-0 shadow">
                        <div class="modal-header border-bottom-0 pb-0 text-start">
                            <h5 class="modal-title fw-bold text-danger">本当に削除しますか？</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body text-start">
                            <p class="text-muted mb-4">この操作は取り消せません。全てのご予約情報とアカウント情報が永久に削除されます。</p>
                            
                            <form method="post" action="{% url 'profile_delete' %}" class="d-grid gap-2">
                                {% csrf_token %}
                                <button type="submit" name="delete_account" class="btn btn-danger py-2 rounded-3 fw-bold">削除を確定する</button>
                                <button type="button" class="btn btn-light py-2 rounded-3 fw-bold mt-1" data-bs-dismiss="modal">キャンセル</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    </div>
</div>
{% endblock %}
`
  },
];
