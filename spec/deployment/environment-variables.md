# 環境変数設定ガイド

## 概要

VRC同期会Discord Botは、環境変数を通じて柔軟な設定管理を実現しています。このドキュメントでは、全ての環境変数の詳細、デフォルト値、設定例を説明します。

---

## 環境変数一覧

### 必須項目（REQUIRED）

| 変数名 | 説明 | 型 | 例 |
|--------|------|-----|-----|
| `DISCORD_TOKEN` | Discord Bot トークン | string | `MTIzNDU2Nzg5MDEyMzQ1Njc4OTAuAbCdEf.GhIjKlMnOpQrStUvWxYz` |
| `DISCORD_CLIENT_ID` | Discord Application ID | string | `1234567890123456789` |
| `DATABASE_URL` | データベース接続URL | string | `postgresql://user:pass@localhost:5432/db` |

### Discord設定（REQUIRED）

| 変数名 | 説明 | 型 | デフォルト | 例 |
|--------|------|-----|----------|-----|
| `GUILD_ID` | 対象DiscordサーバーのID | string | - | `987654321098765432` |
| `INVITATION_FORUM_ID` | お誘い募集フォーラムのチャンネルID | string | - | `111222333444555666` |
| `INVITATION_CREATE_CHANNEL_ID` | 募集作成ボタン配置チャンネルID | string | - | `111222333444555667` |
| `STAFF_CHANNEL_ID` | スタッフ用インスタンス管理チャンネルID | string | - | `111222333444555668` |
| `TICKET_CATEGORY_ID` | チケットチャンネルのカテゴリID | string | - | `111222333444555669` |
| `TICKET_CREATE_CHANNEL_ID` | チケット作成ボタン配置チャンネルID | string | - | `111222333444555670` |
| `STAFF_ROLE_ID` | スタッフロールのID | string | - | `222333444555666777` |

### 機能制御（OPTIONAL）

| 変数名 | 説明 | 型 | デフォルト | 例 |
|--------|------|-----|----------|-----|
| `ENABLE_AUTO_CLOSE` | 自動クローズ機能の有効化 | boolean | `true` | `true` / `false` |
| `ENABLE_REMINDER` | リマインダー通知の有効化 | boolean | `true` | `true` / `false` |
| `ENABLE_PARTICIPANT_DM` | 参加者へのDM通知 | boolean | `true` | `true` / `false` |
| `ENABLE_EDIT_NOTIFICATION` | 編集時の参加者通知 | boolean | `false` | `true` / `false` |
| `ENABLE_CANCEL_DM` | キャンセル時のDM通知 | boolean | `true` | `true` / `false` |

### タイミング設定（OPTIONAL）

| 変数名 | 説明 | 型 | デフォルト | 例 |
|--------|------|-----|----------|-----|
| `AUTO_CLOSE_CRON` | 自動クローズ実行間隔（cron形式） | string | `0 * * * *` | `0 */2 * * *`（2時間ごと） |
| `REMINDER_MINUTES_BEFORE` | リマインダー送信時刻（開始何分前） | number | `60` | `30`（30分前） |
| `REMINDER_CHECK_CRON` | リマインダーチェック間隔（cron形式） | string | `*/5 * * * *` | `*/10 * * * *`（10分ごと） |

### レート制限（OPTIONAL）

| 変数名 | 説明 | 型 | デフォルト | 例 |
|--------|------|-----|----------|-----|
| `INVITATION_CREATION_COOLDOWN` | 募集作成のクールダウン（秒） | number | `300` | `600`（10分） |
| `BUTTON_CLICK_COOLDOWN` | ボタンクリックのクールダウン（秒） | number | `1` | `2` |
| `MAX_INVITATIONS_PER_USER_PER_DAY` | 1ユーザーあたりの1日の募集作成上限 | number | `5` | `10` |

### ログ設定（OPTIONAL）

| 変数名 | 説明 | 型 | デフォルト | 例 |
|--------|------|-----|----------|-----|
| `LOG_LEVEL` | ログレベル | string | `info` | `debug` / `warn` / `error` |
| `LOG_FORMAT` | ログ出力形式 | string | `json` | `simple` / `json` |
| `LOG_FILE_PATH` | ログファイル保存先 | string | `./logs/app.log` | `/var/log/vrc-bot.log` |
| `ENABLE_CONSOLE_LOG` | コンソールログ出力 | boolean | `true` | `true` / `false` |
| `ENABLE_FILE_LOG` | ファイルログ出力 | boolean | `true` | `true` / `false` |

### Discord詳細設定（OPTIONAL）

| 変数名 | 説明 | 型 | デフォルト | 例 |
|--------|------|-----|----------|-----|
| `DISCORD_INTENTS` | Discord Gateway Intents | string | `guilds,guildMessages,messageContent,guildMembers` | カスタマイズ可 |
| `DISCORD_CACHE_STRATEGY` | キャッシュ戦略 | string | `limited` | `full` / `minimal` |
| `DISCORD_REST_TIMEOUT` | REST API タイムアウト（ms） | number | `15000` | `30000` |
| `DISCORD_GATEWAY_TIMEOUT` | Gateway タイムアウト（ms） | number | `30000` | `60000` |

### フォーラムタグ設定（OPTIONAL）

| 変数名 | 説明 | 型 | デフォルト | 例 |
|--------|------|-----|----------|-----|
| `FORUM_TAG_TOURISM` | 観光タグの名前 | string | `観光` | `🗺️観光` |
| `FORUM_TAG_GAME` | ゲームタグの名前 | string | `ゲーム` | `🎮ゲーム` |
| `FORUM_TAG_RELAX` | まったりタグの名前 | string | `まったり` | `☕まったり` |
| `FORUM_TAG_PHOTO` | 撮影会タグの名前 | string | `撮影会` | `📷撮影会` |
| `FORUM_TAG_EVENT` | イベントタグの名前 | string | `イベント` | `🎉イベント` |
| `FORUM_TAG_OTHER` | その他タグの名前 | string | `その他` | `📌その他` |

### バリデーション設定（OPTIONAL）

| 変数名 | 説明 | 型 | デフォルト | 例 |
|--------|------|-----|----------|-----|
| `MIN_PARTICIPANTS` | 最小参加人数 | number | `2` | `1` |
| `MAX_PARTICIPANTS` | 最大参加人数 | number | `80` | `100` |
| `MIN_EVENT_NAME_LENGTH` | イベント名最小文字数 | number | `1` | `5` |
| `MAX_EVENT_NAME_LENGTH` | イベント名最大文字数 | number | `200` | `100` |
| `MAX_DESCRIPTION_LENGTH` | 説明文最大文字数 | number | `2000` | `1000` |
| `MIN_EVENT_DURATION_MINUTES` | 最小イベント時間（分） | number | `30` | `60` |
| `MAX_EVENT_DURATION_HOURS` | 最大イベント時間（時間） | number | `24` | `12` |

### パフォーマンス設定（OPTIONAL）

| 変数名 | 説明 | 型 | デフォルト | 例 |
|--------|------|-----|----------|-----|
| `DATABASE_POOL_MIN` | DB接続プール最小数 | number | `2` | `5` |
| `DATABASE_POOL_MAX` | DB接続プール最大数 | number | `10` | `20` |
| `DATABASE_TIMEOUT` | DBクエリタイムアウト（ms） | number | `10000` | `5000` |

### 開発・デバッグ（OPTIONAL）

| 変数名 | 説明 | 型 | デフォルト | 例 |
|--------|------|-----|----------|-----|
| `NODE_ENV` | 実行環境 | string | `development` | `production` / `test` |
| `DEBUG_MODE` | デバッグモード | boolean | `false` | `true` |
| `ENABLE_STACK_TRACE` | スタックトレース出力 | boolean | `true` | `false` |

---

## 設定例

### 本番環境（.env.production）

```env
# ==========================================
# Discord 必須設定
# ==========================================
DISCORD_TOKEN=MTIzNDU2Nzg5MDEyMzQ1Njc4OTAuAbCdEf.GhIjKlMnOpQrStUvWxYz
DISCORD_CLIENT_ID=1234567890123456789
GUILD_ID=987654321098765432

# チャンネルID
INVITATION_FORUM_ID=111222333444555666
INVITATION_CREATE_CHANNEL_ID=111222333444555667
STAFF_CHANNEL_ID=111222333444555668
TICKET_CATEGORY_ID=111222333444555669
TICKET_CREATE_CHANNEL_ID=111222333444555670

# ロールID
STAFF_ROLE_ID=222333444555666777

# ==========================================
# データベース
# ==========================================
DATABASE_URL=postgresql://vrc_user:secure_password@db.example.com:5432/vrc_reunion_bot?connection_limit=20

# ==========================================
# 機能制御
# ==========================================
ENABLE_AUTO_CLOSE=true
ENABLE_REMINDER=true
ENABLE_PARTICIPANT_DM=true
ENABLE_EDIT_NOTIFICATION=false
ENABLE_CANCEL_DM=true

# ==========================================
# タイミング設定
# ==========================================
AUTO_CLOSE_CRON=0 * * * *
REMINDER_MINUTES_BEFORE=60
REMINDER_CHECK_CRON=*/5 * * * *

# ==========================================
# レート制限
# ==========================================
INVITATION_CREATION_COOLDOWN=300
BUTTON_CLICK_COOLDOWN=1
MAX_INVITATIONS_PER_USER_PER_DAY=5

# ==========================================
# ログ設定
# ==========================================
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_PATH=/var/log/vrc-bot/app.log
ENABLE_CONSOLE_LOG=true
ENABLE_FILE_LOG=true

# ==========================================
# パフォーマンス
# ==========================================
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
DATABASE_TIMEOUT=10000

# ==========================================
# 環境
# ==========================================
NODE_ENV=production
DEBUG_MODE=false
ENABLE_STACK_TRACE=false
```

### 開発環境（.env.development）

```env
# ==========================================
# Discord 必須設定
# ==========================================
DISCORD_TOKEN=開発用トークン
DISCORD_CLIENT_ID=開発用クライアントID
GUILD_ID=開発用サーバーID

# チャンネルID（開発サーバー）
INVITATION_FORUM_ID=開発用フォーラムID
INVITATION_CREATE_CHANNEL_ID=開発用作成チャンネルID
STAFF_CHANNEL_ID=開発用スタッフチャンネルID
TICKET_CATEGORY_ID=開発用チケットカテゴリID
TICKET_CREATE_CHANNEL_ID=開発用チケット作成チャンネルID

# ロールID（開発サーバー）
STAFF_ROLE_ID=開発用スタッフロールID

# ==========================================
# データベース（SQLite）
# ==========================================
DATABASE_URL=file:./dev.db

# ==========================================
# 機能制御（開発用）
# ==========================================
ENABLE_AUTO_CLOSE=false
ENABLE_REMINDER=false
ENABLE_PARTICIPANT_DM=false
ENABLE_EDIT_NOTIFICATION=true
ENABLE_CANCEL_DM=false

# ==========================================
# タイミング設定（開発用）
# ==========================================
AUTO_CLOSE_CRON=*/10 * * * *
REMINDER_MINUTES_BEFORE=5
REMINDER_CHECK_CRON=*/1 * * * *

# ==========================================
# レート制限（開発用：緩い設定）
# ==========================================
INVITATION_CREATION_COOLDOWN=10
BUTTON_CLICK_COOLDOWN=0
MAX_INVITATIONS_PER_USER_PER_DAY=100

# ==========================================
# ログ設定（開発用：詳細出力）
# ==========================================
LOG_LEVEL=debug
LOG_FORMAT=simple
LOG_FILE_PATH=./logs/dev.log
ENABLE_CONSOLE_LOG=true
ENABLE_FILE_LOG=true

# ==========================================
# パフォーマンス
# ==========================================
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=5
DATABASE_TIMEOUT=5000

# ==========================================
# 環境
# ==========================================
NODE_ENV=development
DEBUG_MODE=true
ENABLE_STACK_TRACE=true
```

### テスト環境（.env.test）

```env
# ==========================================
# Discord モック設定
# ==========================================
DISCORD_TOKEN=test_token
DISCORD_CLIENT_ID=1234567890
GUILD_ID=9876543210

# ==========================================
# データベース（メモリ内SQLite）
# ==========================================
DATABASE_URL=file::memory:?cache=shared

# ==========================================
# 機能制御（テスト用：全て無効化）
# ==========================================
ENABLE_AUTO_CLOSE=false
ENABLE_REMINDER=false
ENABLE_PARTICIPANT_DM=false
ENABLE_EDIT_NOTIFICATION=false
ENABLE_CANCEL_DM=false

# ==========================================
# ログ設定（テスト用：最小限）
# ==========================================
LOG_LEVEL=error
LOG_FORMAT=simple
ENABLE_CONSOLE_LOG=false
ENABLE_FILE_LOG=false

# ==========================================
# 環境
# ==========================================
NODE_ENV=test
DEBUG_MODE=false
ENABLE_STACK_TRACE=true
```

---

## 環境変数のバリデーション

### TypeScript型定義（src/config/env.ts）

```typescript
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Discord必須設定
  DISCORD_TOKEN: z.string().min(1, 'Discord Tokenは必須です'),
  DISCORD_CLIENT_ID: z.string().min(1, 'Discord Client IDは必須です'),
  GUILD_ID: z.string().min(1, 'Guild IDは必須です'),
  INVITATION_FORUM_ID: z.string().min(1),
  INVITATION_CREATE_CHANNEL_ID: z.string().min(1),
  STAFF_CHANNEL_ID: z.string().min(1),
  TICKET_CATEGORY_ID: z.string().min(1),
  TICKET_CREATE_CHANNEL_ID: z.string().min(1),
  STAFF_ROLE_ID: z.string().min(1),
  
  // データベース
  DATABASE_URL: z.string().url('DATABASE_URLは有効なURLでなければなりません'),
  
  // 機能制御（オプション）
  ENABLE_AUTO_CLOSE: z.string().transform(val => val === 'true').pipe(z.boolean()).default('true'),
  ENABLE_REMINDER: z.string().transform(val => val === 'true').pipe(z.boolean()).default('true'),
  ENABLE_PARTICIPANT_DM: z.string().transform(val => val === 'true').pipe(z.boolean()).default('true'),
  ENABLE_EDIT_NOTIFICATION: z.string().transform(val => val === 'true').pipe(z.boolean()).default('false'),
  ENABLE_CANCEL_DM: z.string().transform(val => val === 'true').pipe(z.boolean()).default('true'),
  
  // タイミング設定
  AUTO_CLOSE_CRON: z.string().default('0 * * * *'),
  REMINDER_MINUTES_BEFORE: z.string().transform(Number).pipe(z.number().int().min(1)).default('60'),
  REMINDER_CHECK_CRON: z.string().default('*/5 * * * *'),
  
  // レート制限
  INVITATION_CREATION_COOLDOWN: z.string().transform(Number).pipe(z.number().int().min(0)).default('300'),
  BUTTON_CLICK_COOLDOWN: z.string().transform(Number).pipe(z.number().int().min(0)).default('1'),
  MAX_INVITATIONS_PER_USER_PER_DAY: z.string().transform(Number).pipe(z.number().int().min(1)).default('5'),
  
  // ログ設定
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_FORMAT: z.enum(['simple', 'json']).default('json'),
  LOG_FILE_PATH: z.string().default('./logs/app.log'),
  ENABLE_CONSOLE_LOG: z.string().transform(val => val === 'true').pipe(z.boolean()).default('true'),
  ENABLE_FILE_LOG: z.string().transform(val => val === 'true').pipe(z.boolean()).default('true'),
  
  // パフォーマンス
  DATABASE_POOL_MIN: z.string().transform(Number).pipe(z.number().int().min(1)).default('2'),
  DATABASE_POOL_MAX: z.string().transform(Number).pipe(z.number().int().min(1)).default('10'),
  DATABASE_TIMEOUT: z.string().transform(Number).pipe(z.number().int().min(1000)).default('10000'),
  
  // 環境
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEBUG_MODE: z.string().transform(val => val === 'true').pipe(z.boolean()).default('false'),
  ENABLE_STACK_TRACE: z.string().transform(val => val === 'true').pipe(z.boolean()).default('true'),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
```

### エラーハンドリング

起動時に環境変数が不正な場合、詳細なエラーメッセージを表示して終了:

```typescript
try {
  const env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ 環境変数の検証に失敗しました:');
    error.errors.forEach(err => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
}
```

---

## セキュリティ考慮事項

### 機密情報の管理

1. **`.env` ファイルは Git に含めない**
   ```gitignore
   .env
   .env.local
   .env.production
   ```

2. **`.env.example` で構造を共有**
   ```env
   # .env.example
   DISCORD_TOKEN=your_discord_token_here
   DATABASE_URL=postgresql://user:password@localhost:5432/dbname
   ```

3. **本番環境では環境変数を直接設定**
   - サーバーの環境変数
   - Docker Secrets
   - クラウドの環境変数管理（AWS Secrets Manager等）

---

## トラブルシューティング

### よくあるエラー

#### 1. `DISCORD_TOKEN is required`
**原因**: `.env` ファイルが読み込まれていない  
**解決策**: `.env` ファイルがプロジェクトルートに存在するか確認

#### 2. `DATABASE_URL must be a valid URL`
**原因**: PostgreSQLのURL形式が不正  
**解決策**: 形式を確認 `postgresql://user:pass@host:port/database`

#### 3. `Channel ID not found`
**原因**: チャンネルIDが未設定または誤っている  
**解決策**: Discord開発者モードでIDをコピー、再設定

---

## 関連ドキュメント

- [デプロイメントガイド](./deployment/infrastructure.md)
- [アーキテクチャ概要](./architecture/overview.md)
- [セキュリティ設計](./security/data-protection.md)

---

**最終更新**: 2025年11月16日  
**ドキュメントバージョン**: 1.0.0
