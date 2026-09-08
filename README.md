# Nail Salon Claire - Online Booking System

ReactとTypeScriptで構築された、個人経営ネイルサロン「Claire」向けのオンライン予約システム（フロントエンドモックアップ）です。

## 特徴
- **モダンなUI/UX**: React + Tailwind CSSによる、レスポンシブで使いやすいインターフェース。
- **予約フロー体験**: 空き枠の確認から予約確定、Stripe決済（モック）までの一連の流れをシームレスに体験可能。
- **ステータス管理**: ゲスト予約、会員ログイン、管理者（ホスト）ビューの切り替えに対応。

## 開発・実行方法

このプロジェクトはViteを使用しています。

### インストール
\`\`\`bash
npm install
\`\`\`

### 開発サーバー起動
\`\`\`bash
npm run dev
\`\`\`

### 本番用ビルド
\`\`\`bash
npm run build
\`\`\`
ビルドされたファイルは \`dist\` フォルダに出力されます。

## デプロイ設定
本アプリケーションはSPA (Single Page Application) として構成されています。
静的ホスティングサービス（Vercel, Netlify, GitHub Pages, Firebase Hostingなど）にそのままデプロイ可能です。

- **ビルドコマンド**: \`npm run build\`
- **公開ディレクトリ**: \`dist\`

## 今後の展開
このモックアップは、Python/Djangoをバックエンドとして連携することを想定した構成になっています。バックエンドAPIとの連携を行う場合は、各コンポーネント内のモックデータ (\`mockData.ts\`) の呼び出しを \`fetch\` や \`axios\` などに置き換えてください。

