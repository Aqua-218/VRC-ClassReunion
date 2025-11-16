# VRC同期会Discord Bot - プロジェクト全体概要

## エグゼクティブサマリー

VRC同期会Discord Botは、約400名規模のVRChatコミュニティ向けに設計された、イベント管理とコミュニティサポートを自動化する統合型Discord Botです。主要機能として「お誘い募集システム」と「チケットシステム」を実装し、メンバー間のVRChatイベント企画・参加プロセスを効率化し、スタッフのサポート業務負荷を大幅に軽減します。

### 主要価値提案

| ステークホルダー | 提供価値 |
|----------------|---------|
| **一般メンバー** | イベント募集・参加が直感的なUIで完結、リアルタイム参加状況確認、自動リマインダー |
| **イベント主催者** | フォーラム形式の募集管理、参加者自動集計、編集・キャンセル機能 |
| **スタッフ** | グループインスタンス管理の効率化、プライベートサポート対応の簡素化 |
| **サーバー管理者** | スケーラブルな運用設計、包括的なログ・監視、環境変数による柔軟な設定 |

### 解決する課題

1. **イベント情報の分散**: 従来はテキストチャンネルに情報が流れ、過去の募集を追跡困難
2. **参加管理の煩雑さ**: リアクションベースの参加管理は編集・可視化が難しい
3. **スタッフ負荷**: グループインスタンス建て対応が属人化、チケット対応が非効率
4. **情報の非構造化**: ワールドリンク、開催日時などが非構造化データとして散在

---

## ビジョンとミッション

### ビジョン
「VRChatコミュニティの全メンバーが、技術的障壁なくイベントを企画・参加でき、スタッフが本質的なコミュニティ育成に集中できるエコシステムを構築する」

### ミッション
- **自動化**: 手動オペレーションを最小限に、ワンクリックで完結するUX
- **透明性**: 全ての情報が構造化され、検索可能・追跡可能
- **拡張性**: コミュニティ成長に応じてスケール、新機能追加が容易な設計
- **信頼性**: 24/7稼働、99.9%のアップタイム目標、包括的なエラーハンドリング

---

## 主要機能概要

### 1. お誘い募集システム

**コアバリュー**: フォーラムチャンネルを活用した構造化イベント管理

#### 主要機能
- **ワンクリック募集作成**: モーダルUIで11項目の構造化入力
- **リアルタイム参加管理**: `✅参加`/`❓興味あり`ボタンによる参加表明
- **自動ステータス管理**: 定員到達、開催済み、中止の自動検出・タグ更新
- **スタッフ連携**: グループインスタンス必要な募集を自動検出、スタッフチャンネルへ通知
- **編集・キャンセル**: 主催者による募集内容の更新、緊急キャンセル対応

#### 技術的ハイライト
- Discord Forum Channelのタグシステム活用
- Prisma ORMによるトランザクション管理
- イベント駆動アーキテクチャ（ButtonInteraction → DB更新 → Embed更新）

### 2. チケットシステム

**コアバリュー**: プライベートサポート対応の自動化

#### 主要機能
- **プライベートチャンネル自動生成**: ユーザーとスタッフのみアクセス可能
- **カテゴリ分類**: 質問/トラブル報告/その他
- **簡易クローズ**: ワンクリックでチャンネル削除またはアーカイブ

#### 技術的ハイライト
- Discord Channel Permissions APIの動的制御
- チケットライフサイクル管理（作成→対応→クローズ）

---

## ステークホルダーマップ

```
┌─────────────────────────────────────────────────────────────┐
│                      VRC同期会コミュニティ                    │
│                         (~400名)                             │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼───────┐    ┌────────▼────────┐   ┌───────▼────────┐
│ 一般メンバー    │    │ イベント主催者  │   │   スタッフ     │
│ (参加者)       │    │ (募集作成者)    │   │ (サポート担当) │
└───────┬───────┘    └────────┬────────┘   └───────┬────────┘
        │                     │                     │
        │  ✅参加/❓興味あり   │  📝募集作成/✏️編集   │  🙋担当割当
        │  🎫チケット作成     │  ❌キャンセル       │  🔗インスタンス管理
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ VRC同期会Discord Bot│
                    │  (本システム)       │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼───────┐    ┌────────▼────────┐   ┌───────▼────────┐
│ Discord API    │    │ データベース    │   │ 外部サービス   │
│ (Gateway/REST) │    │ (PostgreSQL)    │   │ (VRChat API等) │
└────────────────┘    └─────────────────┘   └────────────────┘
```

### 主要ステークホルダー

| ステークホルダー | 役割 | 主な関心事 |
|----------------|------|-----------|
| **一般メンバー** | イベント参加者 | 使いやすさ、通知の適切さ、情報の見つけやすさ |
| **イベント主催者** | 募集作成・管理 | 募集作成の簡便さ、参加者管理の効率性、柔軟な編集機能 |
| **スタッフ** | インスタンス管理、サポート対応 | 作業の効率化、担当の明確化、負荷分散 |
| **サーバー管理者** | Bot運用・保守 | 稼働率、セキュリティ、コスト、拡張性 |
| **開発者** | 機能開発・改善 | コードの保守性、テスト容易性、ドキュメント |

---

## 成功指標（KPI/OKR）

### Objective 1: イベント参加率の向上
| Key Result | 目標値 | 測定方法 |
|-----------|--------|---------|
| 平均イベント参加者数 | 8名/イベント | DB集計 |
| 募集からイベント開催までのリードタイム | 平均3日以上 | 開始日時 - 作成日時 |
| イベントキャンセル率 | 10%未満 | (中止数 / 総募集数) × 100 |

### Objective 2: スタッフ業務効率化
| Key Result | 目標値 | 測定方法 |
|-----------|--------|---------|
| インスタンス管理対応時間 | 平均5分以内 | 担当割当〜インスタンス情報入力 |
| チケット解決時間 | 平均24時間以内 | チケット作成〜クローズ |
| スタッフ1人あたり月間対応チケット数 | 均等化（偏差20%以内） | スタッフ別集計 |

### Objective 3: システム信頼性
| Key Result | 目標値 | 測定方法 |
|-----------|--------|---------|
| アップタイム | 99.9% | 稼働監視ツール |
| 平均応答時間（インタラクション処理） | 500ms未満 | メトリクス収集 |
| 月間エラー率 | 0.1%未満 | エラーログ集計 |

### Objective 4: ユーザー満足度
| Key Result | 目標値 | 測定方法 |
|-----------|--------|---------|
| Bot利用満足度 | 4.5/5.0以上 | 四半期ごとアンケート |
| 機能要望への対応率 | 80%以上 | GitHub Issues追跡 |
| 新規メンバーのBot利用開始率 | 90%以上 | 初回インタラクション追跡 |

---

## プロジェクト構造

### ディレクトリ構造
```
Class Reunion/
├── docs/                          # 📚 本ドキュメント群
│   ├── README.md                  # プロジェクト概要（本ファイル）
│   ├── requirements.md            # 要件定義
│   ├── architecture/              # アーキテクチャ設計
│   │   ├── overview.md
│   │   ├── detailed-design.md
│   │   ├── data-flow.md
│   │   └── integration.md
│   ├── tech-stack.md              # 技術選定
│   ├── api/                       # API仕様
│   │   └── discord-interactions.md
│   ├── database/                  # データベース設計
│   │   └── schema.md
│   ├── ui/                        # Discord UI設計
│   │   ├── interaction-design.md
│   │   ├── user-flows.md
│   │   └── message-templates.md
│   ├── security/                  # セキュリティ
│   │   ├── threat-model.md
│   │   ├── authentication.md
│   │   └── data-protection.md
│   ├── performance/               # パフォーマンス
│   │   └── requirements.md
│   ├── testing/                   # テスト戦略
│   │   ├── strategy.md
│   │   └── test-cases.md
│   ├── deployment/                # デプロイメント
│   │   ├── infrastructure.md
│   │   └── cicd.md
│   ├── operations/                # 運用
│   │   ├── monitoring.md
│   │   ├── maintenance.md
│   │   └── incident-response.md
│   ├── roadmap.md                 # ロードマップ
│   └── decisions/                 # ADR（アーキテクチャ決定記録）
│       ├── 0001-typescript-selection.md
│       ├── 0002-prisma-orm.md
│       └── 0003-forum-channel-design.md
├── src/                           # 🔧 ソースコード
│   ├── index.ts                   # エントリポイント
│   ├── config/                    # 設定管理
│   │   ├── env.ts                 # 環境変数バリデーション
│   │   └── constants.ts           # 定数定義
│   ├── commands/                  # スラッシュコマンド
│   │   ├── setup.ts
│   │   └── admin.ts
│   ├── events/                    # イベントハンドラ
│   │   ├── ready.ts
│   │   ├── interactionCreate.ts
│   │   └── threadCreate.ts
│   ├── interactions/              # インタラクション処理
│   │   ├── buttons/
│   │   │   ├── invitationButtons.ts
│   │   │   └── ticketButtons.ts
│   │   └── modals/
│   │       ├── createInvitation.ts
│   │       └── createTicket.ts
│   ├── services/                  # ビジネスロジック
│   │   ├── invitationService.ts
│   │   ├── participantService.ts
│   │   ├── ticketService.ts
│   │   └── staffService.ts
│   ├── utils/                     # ユーティリティ
│   │   ├── embedBuilder.ts
│   │   ├── validator.ts
│   │   └── logger.ts
│   ├── jobs/                      # 定期実行ジョブ
│   │   ├── autoCloseInvitations.ts
│   │   └── reminderNotifications.ts
│   └── types/                     # 型定義
│       └── index.ts
├── prisma/                        # 📊 Prismaスキーマ
│   ├── schema.prisma
│   └── migrations/
├── tests/                         # 🧪 テストコード
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example                   # 環境変数テンプレート
├── .env                           # 環境変数（Git除外）
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
└── README.md                      # 開発者向けREADME
```

---

## ドキュメント索引

### コアドキュメント
- [要件定義](./requirements.md) - ビジネス要件、ユーザーストーリー、非機能要件
- [アーキテクチャ概要](./architecture/overview.md) - システム全体像、設計原則
- [詳細設計](./architecture/detailed-design.md) - コンポーネント仕様、データモデル
- [データフロー](./architecture/data-flow.md) - シーケンス図、イベントフロー
- [統合設計](./architecture/integration.md) - Discord API統合、外部連携

### 技術ドキュメント
- [技術スタック](./tech-stack.md) - 技術選定理由、代替案比較
- [Discord Interactions API仕様](./api/discord-interactions.md) - 全インタラクション詳細
- [データベーススキーマ](./database/schema.md) - テーブル定義、インデックス戦略

### UI/UXドキュメント
- [Discord UI設計](./ui/interaction-design.md) - ボタン、モーダル、埋め込み仕様
- [ユーザーフロー](./ui/user-flows.md) - 主要ユースケースのフロー図
- [メッセージテンプレート](./ui/message-templates.md) - 全メッセージの定型文

### セキュリティドキュメント
- [脅威モデリング](./security/threat-model.md) - 想定される脅威と対策
- [認証・認可](./security/authentication.md) - Discord OAuth、権限管理
- [データ保護](./security/data-protection.md) - 暗号化、PII処理

### 運用ドキュメント
- [インフラ設計](./deployment/infrastructure.md) - ホスティング、環境構成
- [CI/CDパイプライン](./deployment/cicd.md) - デプロイ自動化
- [監視戦略](./operations/monitoring.md) - メトリクス、ログ、アラート
- [運用保守](./operations/maintenance.md) - バックアップ、定期メンテナンス
- [インシデント対応](./operations/incident-response.md) - 障害対応手順

### プロジェクト管理
- [ロードマップ](./roadmap.md) - フェーズ分け、マイルストーン
- [アーキテクチャ決定記録 (ADR)](./decisions/) - 主要な技術選定の記録

---

## クイックスタート

### 開発環境セットアップ
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
```bash
# Botをサーバーに招待後、以下のコマンドを実行
/setup invite    # お誘いシステム初期化
/setup ticket    # チケットシステム初期化
/setup staff-channel  # スタッフチャンネル設定
```

詳細は [デプロイメントガイド](./deployment/infrastructure.md) を参照。

---

## ライセンス

MIT License

Copyright (c) 2025 VRC同期会

---

## サポート・問い合わせ

- **技術的な質問**: GitHub Issues
- **バグ報告**: GitHub Issues（テンプレート使用）
- **機能要望**: GitHub Discussions
- **緊急連絡**: Discord サーバー内 `#bot-サポート` チャンネル

---

## 貢献ガイドライン

本プロジェクトへの貢献を歓迎します。詳細は [CONTRIBUTING.md](../CONTRIBUTING.md) を参照。

---

**最終更新**: 2025年11月16日  
**ドキュメントバージョン**: 1.0.0  
**対応Botバージョン**: v1.0.0-alpha
