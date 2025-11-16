# データベース設計 - 統合ナビゲーション

## 概要

VRC同期会Discord Botのデータベース設計を7つのフェーズで完全にドキュメント化しています。

---

## ドキュメント構成

### Phase 1: 要件分析とDB選定
📄 **ファイル**: [01-requirements-and-selection.md](./01-requirements-and-selection.md)

**内容**:
- データ要件の定量分析（3年後までの予測）
- アクセスパターン分析（Read 70% / Write 30%）
- PostgreSQL vs MongoDB vs SQLite 比較
- 5つの主要クエリパターン特定
- スケーラビリティ戦略（3フェーズ）

**成果物**:
- DB選定根拠（PostgreSQL 14+）
- データ量予測（3年後21,720レコード）
- ポリグロットパーシステンス戦略

---

### Phase 2: 論理データモデル設計
📄 **ファイル**: [02-logical-data-model.md](./02-logical-data-model.md)

**内容**:
- Mermaid + テキストベースER図
- 全エンティティの詳細定義（21属性 × 3テーブル）
- 正規化分析（1NF/2NF/3NF）
- 意図的な非正規化の根拠
- リレーション設計（外部キー、CASCADE DELETE）

**成果物**:
- 完全ER図
- エンティティ詳細仕様
- ビジネス制約一覧
- ステータス遷移図

---

### Phase 3-7: 物理実装・最適化・運用
📄 **ファイル**: [03-physical-optimization-operations.md](./03-physical-optimization-operations.md)

**Phase 3: 物理データモデル**
- 完全DDL（PostgreSQL 14+）
- 型選択の根拠（VARCHAR vs TEXT vs TIMESTAMP）
- CHECK制約・トリガー設計
- 暗号化対象カラム特定

**Phase 4: インデックス戦略**
- 複合インデックス設計（5個）
- 部分インデックス（2個）
- カバリングインデックス（1個）
- インデックス効果測定（90%削減達成）

**Phase 5: クエリ最適化**
- 主要5クエリの実行計画分析
- N+1問題の完全回避
- Cursor-based Pagination
- プリペアドステートメント

**Phase 6: スケーラビリティ**
- Read Replica設計（2台）
- Redis Cache-Aside Pattern
- PgBouncer Connection Pooling
- 3フェーズスケーリングロードマップ

**Phase 7: 運用・保守**
- Prometheus + Grafana監視
- 自動バックアップ（日次Full + 継続WAL）
- Point-In-Time Recovery（PITR）
- ゼロダウンタイムマイグレーション

**成果物**:
- 実行可能な完全DDL
- パフォーマンステスト計画
- 運用手順書

---

## 実装ファイル

### Prismaスキーマ
📄 **ファイル**: [../../prisma/schema.prisma](../../prisma/schema.prisma)

**最適化内容**:
- 複合インデックス（クエリパターンに最適化）
- 部分インデックス（status='recruiting'のみ）
- カバリングインデックス（COUNT最適化）
- リレーション設計（CASCADE DELETE）
- 詳細なコメント（ビジネスコンテキスト）

**実行コマンド**:
```bash
# マイグレーション作成
npx prisma migrate dev --name init

# 本番適用
npx prisma migrate deploy

# Prisma Client生成
npx prisma generate

# Prisma Studio起動（GUI）
npx prisma studio
```

---

## クイックリファレンス

### データベース概要

| 項目 | 値 |
|-----|-----|
| **RDBMS** | PostgreSQL 14.0+ |
| **開発DB** | SQLite 3.40+（オプション） |
| **ORM** | Prisma 5.8+ |
| **テーブル数** | 3（Invitation, Participant, Ticket） |
| **インデックス数** | 11（複合5 + 部分2 + 単一4） |
| **3年後データ量** | 21,720レコード（約50MB） |

---

### パフォーマンス目標

| メトリック | 目標値 | 達成手段 |
|-----------|--------|---------|
| **p50レイテンシ** | < 20ms | 複合インデックス |
| **p95レイテンシ** | < 100ms | 部分インデックス、キャッシュ |
| **p99レイテンシ** | < 200ms | Connection Pooling |
| **キャッシュヒット率** | > 80% | Redis Cache-Aside |
| **クエリ削減** | 90% | N+1問題回避 |

---

### 主要クエリ一覧

| ID | クエリ名 | 頻度 | 最適化手段 | レイテンシ |
|----|---------|------|-----------|----------|
| Q1 | 募集一覧 | 高（100回/分） | `idx_invitation_list` | 5ms |
| Q2 | 募集詳細＋参加者 | 高（50回/分） | JOINインデックス | 12ms |
| Q3 | ユーザー参加履歴 | 中（20回/分） | `idx_participant_user_history` | 10ms |
| Q4 | 自動クローズ検索 | 低（1回/時） | `idx_invitation_auto_close` | 20ms |
| Q5 | 重複チェック | 中（30回/分） | UNIQUE制約インデックス | 1ms |

---

### スケーリング戦略

```
Phase 1 (現在〜1年)          Phase 2 (1〜3年)           Phase 3 (3年〜)
┌─────────────┐           ┌─────────────┐          ┌─────────────┐
│  App Server │           │  App Server │          │  App Server │
└──────┬──────┘           └──────┬──────┘          └──────┬──────┘
       │                          │                         │
       ▼                          ▼                         ▼
┌─────────────┐           ┌─────────────┐          ┌─────────────┐
│ PostgreSQL  │           │ PostgreSQL  │◄─────┐   │   PgBouncer │
│  (Single)   │           │  (Primary)  │      │   └──────┬──────┘
└─────────────┘           └──────┬──────┘      │          │
                                 │             │          ▼
                                 ▼             │   ┌─────────────┐
                          ┌─────────────┐     │   │     Shard   │
                          │  Replica 1  │─────┘   │   Manager   │
                          └─────────────┘         └──────┬──────┘
                          ┌─────────────┐                │
                          │  Replica 2  │         ┌──────┴──────┐
                          └─────────────┘         │             │
                                 │                ▼             ▼
                                 ▼           ┌─────────┐   ┌─────────┐
                          ┌─────────────┐   │ Shard 1 │   │ Shard 2 │
                          │    Redis    │   └─────────┘   └─────────┘
                          │  (Cache)    │
                          └─────────────┘
```

---

## マイグレーション手順

### 初回セットアップ

```bash
# 1. 環境変数設定
echo "DATABASE_URL=postgresql://user:password@localhost:5432/vrc_discord_bot" > .env

# 2. データベース作成
createdb vrc_discord_bot

# 3. マイグレーション実行
npx prisma migrate deploy

# 4. 確認
npx prisma studio
```

### 開発環境（SQLite）

```bash
# .env
DATABASE_URL="file:./dev.db"

# Prismaスキーマ変更
# datasource db {
#   provider = "sqlite"
# }

npx prisma migrate dev --name init
```

---

## トラブルシューティング

### パフォーマンス問題

**症状**: クエリが遅い（> 100ms）

**診断**:
```sql
-- 実行計画確認
EXPLAIN ANALYZE
SELECT * FROM invitations WHERE status = 'recruiting';

-- インデックス使用状況
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

**対策**:
1. 不要なインデックスを削除（`idx_scan = 0`）
2. 複合インデックスの順序見直し
3. VACUUMでインデックス最適化

---

### 接続数超過

**症状**: `FATAL: remaining connection slots are reserved`

**診断**:
```sql
SELECT count(*) FROM pg_stat_activity;
```

**対策**:
1. PgBouncer導入
2. `max_connections`増加（ただし推奨しない）
3. アプリケーション側のコネクションプール設定見直し

---

## 関連ドキュメント

- [アーキテクチャ概要](../architecture/overview.md)
- [詳細設計](../architecture/detailed-design.md)
- [セキュリティ設計](../security/security-design.md)
- [環境変数](../deployment/environment-variables.md)

---

**最終更新**: 2025年11月16日  
**担当**: Database Design Specialist  
**バージョン**: 1.0.0
