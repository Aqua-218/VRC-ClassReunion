# データベーススキーマ設計

## 1. 論理データモデル

### 1.1 エンティティ関連図（ER図）

```
┌─────────────────────────────────────────────────────────────┐
│                         Invitation                          │
│                      (お誘い募集マスタ)                       │
├─────────────────────────────────────────────────────────────┤
│ PK: id VARCHAR(20)              ← Discord Message ID        │
│     threadId VARCHAR(20) UNIQUE ← Discord Thread ID         │
│     hostId VARCHAR(20) NOT NULL ← Discord User ID           │
│     hostName VARCHAR(100)       ← 主催者表示名               │
│     eventName VARCHAR(200)      ← イベント名                 │
│     startTime TIMESTAMP         ← 開始日時                   │
│     endTime TIMESTAMP           ← 終了日時                   │
│     worldName VARCHAR(200)      ← ワールド名                 │
│     worldLink VARCHAR(500)      ← ワールドURL                │
│     tag VARCHAR(50)             ← カテゴリタグ               │
│     description TEXT            ← 説明文                     │
│     instanceType VARCHAR(20)    ← インスタンスタイプ         │
│     vrchatProfile VARCHAR(500)  ← VRChatプロフィールURL      │
│     maxParticipants INT         ← 参加人数上限               │
│     status VARCHAR(20)          ← 募集ステータス             │
│     staffId VARCHAR(20)         ← 担当スタッフID             │
│     staffName VARCHAR(100)      ← 担当スタッフ名             │
│     instanceLink VARCHAR(500)   ← インスタンスリンク         │
│     staffMessageId VARCHAR(20)  ← スタッフチャンネルMsg ID   │
│     createdAt TIMESTAMP         ← 作成日時                   │
│     updatedAt TIMESTAMP         ← 更新日時                   │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ 1 : N
               │
┌──────────────▼──────────────────────────────────────────────┐
│                        Participant                          │
│                        (参加者情報)                          │
├─────────────────────────────────────────────────────────────┤
│ PK: id INT AUTO_INCREMENT                                   │
│ FK: invitationId VARCHAR(20) → Invitation.id                │
│     userId VARCHAR(20) NOT NULL ← Discord User ID           │
│     userName VARCHAR(100)       ← 参加者表示名               │
│     status VARCHAR(20)          ← 参加ステータス             │
│     createdAt TIMESTAMP         ← 参加日時                   │
│                                                              │
│ UNIQUE (invitationId, userId)  ← 複合ユニーク制約           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                           Ticket                            │
│                      (チケット情報)                          │
├─────────────────────────────────────────────────────────────┤
│ PK: id VARCHAR(20)              ← Discord Channel ID        │
│     userId VARCHAR(20) NOT NULL ← 作成者User ID              │
│     userName VARCHAR(100)       ← 作成者表示名               │
│     category VARCHAR(50)        ← カテゴリ                   │
│     status VARCHAR(20)          ← チケットステータス         │
│     createdAt TIMESTAMP         ← 作成日時                   │
│     closedAt TIMESTAMP          ← クローズ日時               │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 エンティティ詳細

#### Invitation（お誘い募集）

**概要**: VRChatイベント募集の全情報を保持するマスターエンティティ

**主要属性**:
- `id`: Discord埋め込みメッセージのID（主キー）
- `threadId`: フォーラムスレッドID（ユニーク）
- `status`: 募集状態（recruiting/full/completed/cancelled）

**ビジネスルール**:
- `startTime` < `endTime` 必須
- `instanceType` が "friend" または "friendplus" の場合、`vrchatProfile` 必須
- `status` が "cancelled" または "completed" の場合、編集不可

#### Participant（参加者）

**概要**: 各募集への参加者を管理するエンティティ

**主要属性**:
- `invitationId` + `userId`: 複合ユニークキー（同じユーザーが同じ募集に重複登録不可）
- `status`: 参加状態（joined/interested）

**ビジネスルール**:
- 1ユーザーは1募集に対して1レコードのみ（ステータス変更は UPDATE）
- `invitationId` 削除時、関連 Participant も自動削除（CASCADE DELETE）

#### Ticket（チケット）

**概要**: サポートチケットの管理エンティティ

**主要属性**:
- `id`: Discord チャンネルID（主キー）
- `status`: チケット状態（open/closed）

**ビジネスルール**:
- `closedAt` が NULL の場合は `status = 'open'`
- クローズ後は再オープン不可（新規チケット作成を推奨）

---

## 2. 物理データモデル

### 2.1 Prisma スキーマ定義

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // 本番環境
  // provider = "sqlite"  // 開発環境（コメントアウト切り替え）
  url      = env("DATABASE_URL")
}

// ==========================================
// お誘い募集マスタ
// ==========================================
model Invitation {
  id              String        @id @db.VarChar(20) // Discord Message ID
  threadId        String        @unique @db.VarChar(20)
  hostId          String        @db.VarChar(20)
  hostName        String        @db.VarChar(100)
  eventName       String        @db.VarChar(200)
  startTime       DateTime      @db.Timestamp(3)
  endTime         DateTime      @db.Timestamp(3)
  worldName       String        @db.VarChar(200)
  worldLink       String?       @db.VarChar(500)
  tag             String        @db.VarChar(50)
  description     String        @db.Text
  instanceType    String        @db.VarChar(20) // group, friend, friendplus, public
  vrchatProfile   String?       @db.VarChar(500)
  maxParticipants Int           @db.Integer
  status          String        @default("recruiting") @db.VarChar(20) // recruiting, full, completed, cancelled
  staffId         String?       @db.VarChar(20)
  staffName       String?       @db.VarChar(100)
  instanceLink    String?       @db.VarChar(500)
  staffMessageId  String?       @db.VarChar(20)
  createdAt       DateTime      @default(now()) @db.Timestamp(3)
  updatedAt       DateTime      @updatedAt @db.Timestamp(3)

  // リレーション
  participants    Participant[]

  @@index([threadId], name: "idx_invitation_threadId")
  @@index([hostId], name: "idx_invitation_hostId")
  @@index([status], name: "idx_invitation_status")
  @@index([startTime], name: "idx_invitation_startTime")
  @@map("invitations")
}

// ==========================================
// 参加者情報
// ==========================================
model Participant {
  id           Int        @id @default(autoincrement())
  invitationId String     @db.VarChar(20)
  userId       String     @db.VarChar(20)
  userName     String     @db.VarChar(100)
  status       String     @db.VarChar(20) // joined, interested
  createdAt    DateTime   @default(now()) @db.Timestamp(3)

  // リレーション
  invitation   Invitation @relation(fields: [invitationId], references: [id], onDelete: Cascade)

  @@unique([invitationId, userId], name: "unique_participant")
  @@index([userId], name: "idx_participant_userId")
  @@index([invitationId], name: "idx_participant_invitationId")
  @@map("participants")
}

// ==========================================
// チケット情報
// ==========================================
model Ticket {
  id        String    @id @db.VarChar(20) // Discord Channel ID
  userId    String    @db.VarChar(20)
  userName  String    @db.VarChar(100)
  category  String    @db.VarChar(50) // question, trouble, other
  status    String    @default("open") @db.VarChar(20) // open, closed
  createdAt DateTime  @default(now()) @db.Timestamp(3)
  closedAt  DateTime? @db.Timestamp(3)

  @@index([userId], name: "idx_ticket_userId")
  @@index([status], name: "idx_ticket_status")
  @@map("tickets")
}
```

### 2.2 テーブル定義詳細

#### invitations テーブル

| カラム名 | 型 | NULL | デフォルト | 制約 | 説明 |
|---------|-----|------|----------|------|------|
| id | VARCHAR(20) | NO | - | PK | Discord Message ID（埋め込みメッセージ） |
| threadId | VARCHAR(20) | NO | - | UNIQUE | Discord Thread ID |
| hostId | VARCHAR(20) | NO | - | INDEX | 主催者のDiscord User ID |
| hostName | VARCHAR(100) | NO | - | - | 主催者表示名 |
| eventName | VARCHAR(200) | NO | - | - | イベント名（募集タイトル） |
| startTime | TIMESTAMP | NO | - | INDEX | 開始日時（ISO 8601形式） |
| endTime | TIMESTAMP | NO | - | - | 終了日時 |
| worldName | VARCHAR(200) | NO | - | - | VRChatワールド名 |
| worldLink | VARCHAR(500) | YES | NULL | - | ワールドURL（任意） |
| tag | VARCHAR(50) | NO | - | - | カテゴリタグ（観光/ゲーム等） |
| description | TEXT | NO | - | - | イベント説明文 |
| instanceType | VARCHAR(20) | NO | - | - | group/friend/friendplus/public |
| vrchatProfile | VARCHAR(500) | YES | NULL | - | VRChatプロフィールURL（friend系の場合必須） |
| maxParticipants | INTEGER | NO | - | - | 参加人数上限（2-80） |
| status | VARCHAR(20) | NO | 'recruiting' | INDEX | recruiting/full/completed/cancelled |
| staffId | VARCHAR(20) | YES | NULL | - | 担当スタッフのUser ID |
| staffName | VARCHAR(100) | YES | NULL | - | 担当スタッフ表示名 |
| instanceLink | VARCHAR(500) | YES | NULL | - | グループインスタンスリンク |
| staffMessageId | VARCHAR(20) | YES | NULL | - | スタッフチャンネルのメッセージID |
| createdAt | TIMESTAMP | NO | now() | - | 作成日時 |
| updatedAt | TIMESTAMP | NO | now() | - | 更新日時（自動更新） |

**インデックス**:
- PRIMARY KEY: `id`
- UNIQUE: `threadId`
- INDEX: `hostId`, `status`, `startTime`

**外部キー制約**: なし

---

#### participants テーブル

| カラム名 | 型 | NULL | デフォルト | 制約 | 説明 |
|---------|-----|------|----------|------|------|
| id | INTEGER | NO | AUTO_INCREMENT | PK | 内部連番ID |
| invitationId | VARCHAR(20) | NO | - | FK, INDEX | Invitation.id |
| userId | VARCHAR(20) | NO | - | INDEX | 参加者のDiscord User ID |
| userName | VARCHAR(100) | NO | - | - | 参加者表示名 |
| status | VARCHAR(20) | NO | - | - | joined/interested |
| createdAt | TIMESTAMP | NO | now() | - | 参加日時 |

**インデックス**:
- PRIMARY KEY: `id`
- UNIQUE: `(invitationId, userId)` ← 重複参加防止
- INDEX: `userId`, `invitationId`

**外部キー制約**:
- `invitationId` REFERENCES `invitations(id)` ON DELETE CASCADE

---

#### tickets テーブル

| カラム名 | 型 | NULL | デフォルト | 制約 | 説明 |
|---------|-----|------|----------|------|------|
| id | VARCHAR(20) | NO | - | PK | Discord Channel ID |
| userId | VARCHAR(20) | NO | - | INDEX | 作成者のDiscord User ID |
| userName | VARCHAR(100) | NO | - | - | 作成者表示名 |
| category | VARCHAR(50) | NO | - | - | question/trouble/other |
| status | VARCHAR(20) | NO | 'open' | INDEX | open/closed |
| createdAt | TIMESTAMP | NO | now() | - | 作成日時 |
| closedAt | TIMESTAMP | YES | NULL | - | クローズ日時 |

**インデックス**:
- PRIMARY KEY: `id`
- INDEX: `userId`, `status`

**外部キー制約**: なし

---

## 3. インデックス戦略

### 3.1 インデックス設計の原則

1. **頻繁にWHERE句で使用されるカラム**: `threadId`, `userId`, `status`, `startTime`
2. **JOIN条件のカラム**: `invitationId`（Participantテーブル）
3. **ユニーク制約が必要**: `threadId`, `(invitationId, userId)`

### 3.2 インデックス効果の見積もり

| クエリパターン | インデックス | 効果 |
|-------------|------------|------|
| `WHERE threadId = ?` | idx_invitation_threadId | フルスキャン回避、O(log n) |
| `WHERE status = 'recruiting'` | idx_invitation_status | 募集中のみ高速取得 |
| `WHERE startTime BETWEEN ? AND ?` | idx_invitation_startTime | 日時範囲検索高速化 |
| `WHERE invitationId = ? AND userId = ?` | unique_participant | 重複チェック高速化 |

### 3.3 インデックス保守

- **再構築**: PostgreSQLの自動VACUUM機能に依存
- **監視**: スロークエリログで非効率クエリを検出
- **追加**: 本番運用後、実際のクエリパターンを分析して追加検討

---

## 4. パーティショニング

### 4.1 現状

Phase 1ではパーティショニングなし（データ量が少ない）

### 4.2 将来の拡張計画

**データ量推定**:
- 月間イベント: 50件
- 年間イベント: 600件
- 5年間: 3,000件

**パーティショニング検討開始**: 10,000件以上

**パーティショニング戦略（案）**:
- Invitationテーブルを `createdAt` でレンジパーティション（年単位）
- 古いパーティションは読み取り専用化

---

## 5. 正規化レベルと理由

### 5.1 正規化分析

#### Invitation テーブル

**現状**: 第3正規形（3NF）準拠

**非正規化箇所**:
- `hostName`, `staffName`: Discordユーザー情報の複製（意図的な非正規化）
  - **理由**: Discordユーザー名変更時も履歴保持、JOINなしで表示可能

**正規化した場合との比較**:

| 項目 | 正規化（UserテーブルでJOIN） | 非正規化（現状） |
|------|----------------------------|-----------------|
| クエリ速度 | 遅い（JOIN必要） | 速い（単一SELECT） |
| データ整合性 | 高い | 中（ユーザー名変更時は不整合） |
| ストレージ | 少 | 多（重複あり） |

**決定**: 非正規化を採用（パフォーマンス重視、ユーザー名は履歴として保持）

#### Participant テーブル

**現状**: 第3正規形（3NF）準拠

**非正規化箇所**:
- `userName`: 同上の理由で意図的に非正規化

---

## 6. データ整合性制約

### 6.1 CHECK制約（アプリケーション層で実装）

Prismaは現状CHECK制約をサポートしないため、バリデーションで実装:

```typescript
// utils/validator.ts
import { z } from 'zod';

export const InvitationSchema = z.object({
  eventName: z.string().min(1).max(200),
  startTime: z.date(),
  endTime: z.date(),
  maxParticipants: z.number().int().min(2).max(80),
  instanceType: z.enum(['group', 'friend', 'friendplus', 'public']),
  vrchatProfile: z.string().url().optional(),
  // ... 他のフィールド
}).refine((data) => data.startTime < data.endTime, {
  message: "終了日時は開始日時より後でなければなりません",
  path: ["endTime"],
}).refine((data) => {
  // friend系の場合、vrchatProfileが必須
  if (['friend', 'friendplus'].includes(data.instanceType)) {
    return !!data.vrchatProfile;
  }
  return true;
}, {
  message: "フレンド系インスタンスの場合、VRChatプロフィールは必須です",
  path: ["vrchatProfile"],
});
```

### 6.2 外部キー制約

| 親テーブル | 子テーブル | 外部キー | ON DELETE |
|----------|----------|---------|----------|
| invitations | participants | invitationId | CASCADE |

**CASCADE DELETE の理由**:
- 募集削除時、関連する参加者情報も不要になるため自動削除
- データの孤立を防止

---

## 7. トリガー・ストアドプロシージャ

### 7.1 現状

Phase 1ではトリガー・ストアドプロシージャは使用しない。

**理由**:
- ビジネスロジックはアプリケーション層で実装（TypeScript）
- データベース依存を最小化、移行時の負担軽減
- デバッグ・テスト容易性

### 7.2 将来検討

**候補**:
- 自動クローズ処理をDBトリガーで実装（startTimeベース）
- 統計情報のマテリアライズドビュー

---

## 8. データマイグレーション戦略

### 8.1 Prisma Migrate の活用

#### 開発環境

```bash
# スキーマ変更を検出し、マイグレーションファイル生成
npx prisma migrate dev --name add_instance_link_column

# 自動でマイグレーション適用 + Prisma Client再生成
```

#### 本番環境

```bash
# マイグレーション適用（ダウンタイムなし）
npx prisma migrate deploy
```

### 8.2 マイグレーション履歴管理

```
prisma/migrations/
├── 20250101000000_init/
│   └── migration.sql
├── 20250115000000_add_instance_link/
│   └── migration.sql
└── migration_lock.toml
```

**ロールバック**:
- Prisma はネイティブロールバック未サポート
- 手動で逆操作のマイグレーションファイルを作成

### 8.3 データ移行手順（スキーマ変更時）

1. **カラム追加**（非互換なし）:
   - マイグレーション生成 → 適用 → デプロイ

2. **カラム削除**（互換性破壊）:
   - ステップ1: カラムを `NULL` 許容に変更
   - ステップ2: アプリケーションコードから参照を削除
   - ステップ3: カラムを物理削除

3. **テーブル名変更**:
   - Prisma は `@@map()` で論理名を維持可能

---

## 9. バックアップ・リストア

### 9.1 バックアップ戦略

| バックアップ種別 | 頻度 | 保持期間 | 方法 |
|---------------|------|---------|------|
| フルバックアップ | 毎日 03:00 JST | 7日分 | pg_dump（PostgreSQL） |
| 差分バックアップ | なし（データ量小） | - | - |
| WALアーカイブ | リアルタイム | 7日分 | PostgreSQLの継続的アーカイブ |

### 9.2 リストア手順

```bash
# PostgreSQL フルリストア
pg_restore -U username -d vrc_reunion_bot backup_20250116.sql

# 特定テーブルのみリストア
pg_restore -U username -d vrc_reunion_bot -t invitations backup_20250116.sql
```

### 9.3 バックアップ自動化

```bash
# cron設定例（毎日3時にバックアップ）
0 3 * * * pg_dump -U username vrc_reunion_bot > /backups/backup_$(date +\%Y\%m\%d).sql
```

---

## 10. パフォーマンスチューニング

### 10.1 スロークエリの特定

```sql
-- PostgreSQLのスロークエリログ有効化
ALTER DATABASE vrc_reunion_bot SET log_min_duration_statement = 500; -- 500ms以上をログ
```

### 10.2 クエリ最適化例

#### 参加者一覧取得（N+1問題の回避）

**❌ 非効率（N+1クエリ）**:
```typescript
const invitations = await prisma.invitation.findMany();
for (const inv of invitations) {
  const participants = await prisma.participant.findMany({
    where: { invitationId: inv.id }
  });
}
```

**✅ 最適化（1クエリでEager Loading）**:
```typescript
const invitations = await prisma.invitation.findMany({
  include: {
    participants: true
  }
});
```

### 10.3 コネクションプール設定

```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/vrc_reunion_bot?connection_limit=10"
```

**推奨設定**:
- 開発環境: `connection_limit=5`
- 本番環境: `connection_limit=20`（同時アクセス数に応じて調整）

---

## 関連ドキュメント

- [アーキテクチャ概要](../architecture/overview.md)
- [詳細設計](../architecture/detailed-design.md)
- [技術スタック](../tech-stack.md)
- [運用保守](../operations/maintenance.md)

---

**最終更新**: 2025年11月16日  
**ドキュメントバージョン**: 1.0.0  
**レビュアー**: -
