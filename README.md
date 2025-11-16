# VRC同期会Discord Bot

VRChat同期会コミュニティ向けのDiscord Botです。イベント管理（お誘い募集システム）とサポート対応（チケットシステム）を自動化します。

## 主要機能

- **お誘い募集システム**: VRChatイベントの募集・参加管理をフォーラムチャンネルで実現
- **グループインスタンス管理**: スタッフによるインスタンス建て対応を効率化
- **チケットシステム**: プライベートサポートチャンネルの自動生成

## クイックスタート

### 必要要件

- Node.js v18以降
- npm v9以降
- PostgreSQL v14以降（本番）または SQLite（開発）

### インストール

```bash
# 1. リポジトリクローン
git clone https://github.com/your-org/vrc-reunion-bot.git
cd vrc-reunion-bot

# 2. 依存関係インストール
npm install

# 3. 環境変数設定
cp .env.example .env
# .envファイルを編集してDiscord TokenやDatabase URLを設定

# 4. データベースセットアップ
npx prisma migrate dev
npx prisma generate

# 5. 開発サーバー起動
npm run dev
```

### 初回セットアップ（Discord側）

Botをサーバーに招待後、以下のコマンドを実行:

```
/setup invite         # お誘いシステム初期化
/setup ticket         # チケットシステム初期化
/setup staff-channel  # スタッフチャンネル設定
```

## スクリプト

```bash
npm run dev           # 開発モード（ホットリロード）
npm run build         # TypeScriptビルド
npm start             # 本番起動

npm run lint          # ESLintチェック
npm run lint:fix      # ESLint自動修正
npm run format        # Prettierフォーマット
npm run typecheck     # TypeScript型チェック

npm test              # テスト実行
npm run test:watch    # テスト監視モード
npm run test:coverage # カバレッジレポート

npm run db:generate   # Prisma Client生成
npm run db:migrate    # マイグレーション適用
npm run db:studio     # Prisma Studio起動
```

## プロジェクト構造

```
Class Reunion/
├── docs/              # ドキュメント
├── src/               # ソースコード
│   ├── index.ts       # エントリポイント
│   ├── config/        # 設定管理
│   ├── events/        # イベントハンドラ
│   ├── commands/      # スラッシュコマンド
│   ├── interactions/  # ボタン・モーダル処理
│   ├── services/      # ビジネスロジック
│   ├── utils/         # ユーティリティ
│   ├── jobs/          # 定期実行ジョブ
│   └── types/         # 型定義
├── prisma/            # Prismaスキーマ
├── tests/             # テストコード
└── .env               # 環境変数（Git除外）
```

## 環境変数

詳細は [環境変数設定ガイド](./docs/deployment/environment-variables.md) を参照。

主要な環境変数:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
GUILD_ID=your_guild_id
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

## ドキュメント

包括的なドキュメントは [docs/README.md](./docs/README.md) を参照:

- [要件定義](./docs/requirements.md)
- [アーキテクチャ概要](./docs/architecture/overview.md)
- [データベーススキーマ](./docs/database/schema.md)
- [環境変数設定](./docs/deployment/environment-variables.md)
- [ロードマップ](./docs/roadmap.md)

## 貢献

プルリクエストを歓迎します。詳細は [CONTRIBUTING.md](./CONTRIBUTING.md) を参照。

## ライセンス

MIT License - 詳細は [LICENSE](./LICENSE) を参照

## サポート

- **バグ報告**: GitHub Issues
- **機能要望**: GitHub Discussions
- **緊急連絡**: Discord `#bot-サポート` チャンネル

---

**開発者**: VRC同期会コミュニティ  
**バージョン**: 1.0.0  
**最終更新**: 2025年11月16日
