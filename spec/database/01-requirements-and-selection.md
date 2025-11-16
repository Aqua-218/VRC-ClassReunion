# Phase 1: 要件分析とDB選定

## 1. データ要件分析

### 1.1 エンティティとデータ量予測

| エンティティ | 現在 | 1年後 | 3年後 | 成長率 |
|------------|------|-------|-------|--------|
| **Invitation** | 360件/年 (30件/月) | 600件/年 | 1,200件/年 | 100%/年 |
| **Participant** | 2,160件/年 (6人/イベント) | 4,800件/年 (8人/イベント) | 12,000件/年 (10人/イベント) | 185%/年 |
| **Ticket** | 120件/年 (10件/月) | 180件/年 | 300件/年 | 50%/年 |
| **合計レコード** | 2,640件/年 | 5,580件/年 | 13,500件/年 | 170%/年 |

**3年後の累積データ量**:
- Invitation: 2,160件
- Participant: 18,960件
- Ticket: 600件
- **総レコード数**: 21,720件（中規模、単一DBで十分対応可能）

### 1.2 データ特性

#### Invitation（お誘い募集）
- **属性数**: 21カラム
- **平均サイズ**: 1.5KB/レコード（description含む）
- **削除方針**: 論理削除（status='cancelled'）、物理削除は3年後アーカイブ
- **更新頻度**: 作成時、参加者変動時、ステータス変更時（平均5回/レコード）
- **参照頻度**: 高（募集一覧、詳細、検索）
- **整合性要件**: 強（startTime < endTime、定員管理）

#### Participant（参加者）
- **属性数**: 6カラム
- **平均サイズ**: 0.3KB/レコード
- **削除方針**: Invitation削除時にCASCADE DELETE
- **更新頻度**: status変更のみ（joined ⇄ interested）
- **参照頻度**: 高（参加者一覧、ユーザー参加履歴）
- **整合性要件**: 強（invitationId + userId UNIQUE制約）

#### Ticket（チケット）
- **属性数**: 7カラム
- **平均サイズ**: 0.4KB/レコード
- **削除方針**: クローズ後6ヶ月保持、その後アーカイブ
- **更新頻度**: 作成時、クローズ時（2回/レコード）
- **参照頻度**: 中（オープンチケット一覧、ユーザー履歴）
- **整合性要件**: 中（status管理のみ）

---

## 2. アクセスパターン分析

### 2.1 読み書き比率

| ワークロード | 比率 | 備考 |
|------------|------|------|
| **Read（読み取り）** | 70% | 募集一覧、詳細、検索、参加者リスト |
| **Write（書き込み）** | 30% | 募集作成、参加表明、ステータス更新 |

**結論**: **Read-Heavy** ワークロード → Read Replica、キャッシュ戦略が有効

---

### 2.2 主要クエリパターン

#### Q1: 募集一覧取得（カテゴリ・ステータスフィルター）
```sql
-- 頻度: 高（毎分100回）
-- レイテンシ要件: p95 < 50ms
SELECT id, eventName, startTime, tag, status, maxParticipants
FROM invitations
WHERE status = 'recruiting' AND tag = '観光'
ORDER BY startTime ASC
LIMIT 20;
```
**最適化**: `(status, tag, startTime)` 複合インデックス、部分インデックス

---

#### Q2: 募集詳細取得（参加者リスト含む）
```sql
-- 頻度: 高（毎分50回）
-- レイテンシ要件: p95 < 100ms
SELECT i.*, 
       json_agg(json_build_object('userId', p.userId, 'userName', p.userName, 'status', p.status)) as participants
FROM invitations i
LEFT JOIN participants p ON i.id = p.invitationId
WHERE i.id = $1
GROUP BY i.id;
```
**最適化**: `participants(invitationId)` インデックス、JSON集約

---

#### Q3: ユーザーの参加イベント一覧
```sql
-- 頻度: 中（毎分20回）
-- レイテンシ要件: p95 < 100ms
SELECT i.id, i.eventName, i.startTime, p.status
FROM participants p
JOIN invitations i ON p.invitationId = i.id
WHERE p.userId = $1 AND i.status != 'cancelled'
ORDER BY i.startTime DESC
LIMIT 20;
```
**最適化**: `participants(userId)` インデックス、`invitations(startTime DESC)` インデックス

---

#### Q4: 自動クローズ対象の募集検索
```sql
-- 頻度: 低（1時間に1回、Cron）
-- レイテンシ要件: p95 < 500ms
SELECT id, eventName, endTime
FROM invitations
WHERE endTime < NOW() - INTERVAL '24 hours'
  AND status IN ('recruiting', 'full')
LIMIT 100;
```
**最適化**: `(status, endTime)` 複合インデックス

---

#### Q5: 参加者の重複チェック（UPSERT）
```sql
-- 頻度: 中（毎分30回）
-- レイテンシ要件: p95 < 50ms
INSERT INTO participants (invitationId, userId, userName, status)
VALUES ($1, $2, $3, 'joined')
ON CONFLICT (invitationId, userId) 
DO UPDATE SET status = 'joined', createdAt = NOW();
```
**最適化**: `(invitationId, userId)` UNIQUE制約がインデックスとして機能

---

### 2.3 トランザクション要件

| 操作 | ACID要件 | 理由 |
|------|---------|------|
| **募集作成** | 必須 | Invitation + Discord API呼び出しの整合性 |
| **参加表明** | 必須 | 定員オーバー防止（楽観的ロック） |
| **ステータス更新** | 必須 | 競合状態防止 |
| **チケット作成** | 必須 | Ticket + Discord Channel作成の整合性 |
| **一覧取得** | 不要 | Read Committed で十分 |

**結論**: **ACID保証必須** → RDBMSが最適

---

### 2.4 整合性要件

| データ | 整合性 | 許容ラグ |
|--------|--------|---------|
| **募集情報** | 強整合性 | リアルタイム必須 |
| **参加者数** | 強整合性 | 定員管理のため即座に反映 |
| **検索インデックス** | 結果整合性 | 数秒のラグは許容 |
| **統計情報** | 結果整合性 | 数分のラグ許容 |

**結論**: **強整合性が必要** → PostgreSQLのACID保証が適合

---

### 2.5 レイテンシ要件

| クエリタイプ | p50 | p95 | p99 |
|------------|-----|-----|-----|
| **単純SELECT（PK）** | < 5ms | < 10ms | < 20ms |
| **一覧取得（フィルター）** | < 20ms | < 50ms | < 100ms |
| **JOIN（1:N）** | < 30ms | < 100ms | < 200ms |
| **集計クエリ** | < 100ms | < 500ms | < 1s |
| **バッチ処理** | - | < 5s | < 10s |

**結論**: 十分高速 → 適切なインデックス設計で達成可能

---

## 3. DB技術選定

### 3.1 候補技術の比較

#### 候補1: PostgreSQL（選定）

**適用理由**:
- ✅ ACID保証で強整合性を実現
- ✅ 複雑なJOIN・集計クエリに対応
- ✅ JSON/JSONB型で柔軟なデータ構造（将来的な拡張）
- ✅ 豊富なインデックス種類（B-Tree、GIN、GiST、部分インデックス）
- ✅ トリガー・制約で複雑なビジネスロジック実装可能
- ✅ Prisma ORMの完全対応
- ✅ 開発・本番で同一DB（SQLiteは開発のみ）

**トレードオフ**:
- ❌ 水平スケールが困難（シャーディング複雑）
  - **緩和策**: 3年後21,720レコードは単一DBで十分。Read Replicaで読み取りスケール可能。
- ❌ セットアップがSQLiteより複雑
  - **緩和策**: Docker Composeで開発環境統一、Prisma Migrateで自動化。

---

#### 候補2: MongoDB（不採用）

**不採用理由**:
- ❌ 複雑なJOINが非効率（Participant ⇄ Invitation）
- ❌ トランザクション機能が弱い（4.0以降改善も、RDBMSに劣る）
- ❌ スキーマレスが仇（型安全性低下、バリデーション必要）
- ❌ Prismaサポートが実験的（production非推奨）

**利点は活かせず**:
- 柔軟スキーマ → 本プロジェクトは構造化データ中心
- 水平スケール → 現時点で不要

---

#### 候補3: SQLite（開発環境のみ使用）

**開発環境での利用**:
- ✅ セットアップ不要（ファイルベース）
- ✅ CI/CDでの高速テスト
- ✅ ローカル開発の簡便性

**本番環境で不採用の理由**:
- ❌ 並行書き込みに弱い（ファイルロック）
- ❌ ネットワークアクセス不可（単一サーバー限定）
- ❌ バックアップ戦略が限定的

**結論**: **開発/テスト環境のみSQLite、本番PostgreSQL**

---

#### 候補4: Redis（補助DB）

**用途**: キャッシュ・セッション管理
- ✅ 超高速（メモリベース）
- ✅ TTL機能で自動期限切れ
- ✅ Pub/Subで通知機能

**利用例**:
```typescript
// 募集一覧のキャッシュ（TTL: 60秒）
const cacheKey = `invitations:list:${tag}:${status}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const data = await prisma.invitation.findMany({ ... });
await redis.setex(cacheKey, 60, JSON.stringify(data));
return data;
```

**結論**: **Phase 2以降でRedisキャッシュ導入検討**

---

### 3.2 ポリグロットパーシステンス戦略

| データ種類 | DB | 理由 |
|----------|----|----|
| **トランザクションデータ** | PostgreSQL | ACID、リレーション、整合性 |
| **キャッシュ** | Redis（Phase 2） | 高速読み取り、TTL |
| **全文検索** | Elasticsearch（Phase 3） | 募集内容の高度な検索 |
| **監査ログ** | PostgreSQL（別テーブル） | 永続化、クエリ分析 |

---

## 4. 選定結果サマリー

### 4.1 Primary DB: PostgreSQL 14+

**選定根拠**:
1. **整合性**: ACID保証で定員管理・重複防止を確実に実現
2. **パフォーマンス**: 適切なインデックスで全クエリp95 < 100ms達成可能
3. **スケーラビリティ**: 3年後21,720レコードは単一DBで十分、Read Replicaで拡張可能
4. **開発者体験**: Prisma完全対応、豊富なドキュメント
5. **運用実績**: 世界中で実績、安定性高い

### 4.2 データ量予測（3年累積）

| メトリック | 値 |
|----------|-----|
| 総レコード数 | 21,720件 |
| 総データサイズ | 約30MB（インデックス除く） |
| インデックスサイズ | 約15MB |
| 合計DBサイズ | **約50MB**（余裕で単一DBで管理可能） |

### 4.3 スケーラビリティ見通し

**現在〜1年（Phase 1）**:
- 単一PostgreSQLインスタンス
- 垂直スケール（CPU/Memory増強）

**1年〜3年（Phase 2）**:
- Read Replica 2台追加（読み取り分散）
- Redis キャッシュ導入
- Connection Pooling（PgBouncer）

**3年以降（Phase 3）**:
- Elasticsearch 全文検索
- 時系列データのパーティショニング（年ごと）
- 古いデータのアーカイブ（S3等）

---

## 5. Definition of Done

- [x] データ要件の定量分析完了（3年後まで予測）
- [x] アクセスパターンの特定（5つの主要クエリ）
- [x] 読み書き比率の算出（Read 70% / Write 30%）
- [x] ACID要件の明確化
- [x] PostgreSQL選定の根拠明示（4候補比較）
- [x] スケーラビリティ戦略策定（3フェーズ）
- [x] ポリグロットパーシステンス戦略

---

**次フェーズ**: [Phase 2: 論理データモデル設計](./02-logical-data-model.md)
