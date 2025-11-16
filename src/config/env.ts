import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * 環境変数のバリデーションスキーマ
 * 起動時に全環境変数を検証し、不正な値がある場合は即座にエラーを投げる
 */
const envSchema = z.object({
  // ==========================================
  // 必須: Discord設定
  // ==========================================
  DISCORD_BOT_TOKEN: z.string().min(1, 'DISCORD_BOT_TOKENは必須です'),
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_IDは必須です'),
  DISCORD_GUILD_ID: z.string().min(1, 'DISCORD_GUILD_IDは必須です'),

  // ==========================================
  // 必須: チャンネルID
  // ==========================================
  INVITATION_FORUM_CHANNEL_ID: z.string().min(1, 'INVITATION_FORUM_CHANNEL_IDは必須です'),
  TICKET_CATEGORY_ID: z.string().min(1, 'TICKET_CATEGORY_IDは必須です'),

  // ==========================================
  // 必須: ロールID
  // ==========================================
  STAFF_ROLE_ID: z.string().min(1, 'STAFF_ROLE_IDは必須です'),
  MEMBER_ROLE_ID: z.string().min(1, 'MEMBER_ROLE_IDは必須です'),

  // ==========================================
  // 必須: データベース
  // ==========================================
  DATABASE_URL: z.string().url('DATABASE_URLは有効なURLである必要があります'),

  // ==========================================
  // 必須: アプリケーション設定
  // ==========================================
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ==========================================
  // オプション: 機能フラグ
  // ==========================================
  FEATURE_INVITATION_ENABLED: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val === 'true'),

  FEATURE_TICKET_ENABLED: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val === 'true'),

  FEATURE_AUTO_CLOSE_ENABLED: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val === 'true'),

  FEATURE_REMINDER_ENABLED: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val === 'true'),

  FEATURE_STAFF_NOTIFICATION_ENABLED: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val === 'true'),

  // ==========================================
  // オプション: タイミング設定
  // ==========================================
  CRON_AUTO_CLOSE_SCHEDULE: z.string().optional().default('0 * * * *'),
  CRON_REMINDER_SCHEDULE: z.string().optional().default('0 9 * * *'),
  INVITATION_AUTO_CLOSE_HOURS: z
    .string()
    .optional()
    .default('24')
    .transform((val) => parseInt(val, 10)),

  REMINDER_HOURS_BEFORE: z
    .string()
    .optional()
    .default('24')
    .transform((val) => parseInt(val, 10)),

  // ==========================================
  // オプション: レート制限
  // ==========================================
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .optional()
    .default('60000')
    .transform((val) => parseInt(val, 10)),

  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10)),

  // ==========================================
  // オプション: ロギング
  // ==========================================
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug'])
    .optional()
    .default('info'),
  LOG_FILE_PATH: z.string().optional().default('./logs/app.log'),
  LOG_MAX_SIZE: z.string().optional().default('10m'),
  LOG_MAX_FILES: z
    .string()
    .optional()
    .default('14')
    .transform((val) => parseInt(val, 10)),

  // ==========================================
  // オプション: Discord詳細設定
  // ==========================================
  DISCORD_STAFF_CHANNEL_ID: z.string().optional(),
  DISCORD_LOG_CHANNEL_ID: z.string().optional(),

  // ==========================================
  // オプション: フォーラムタグ
  // ==========================================
  FORUM_TAG_CATEGORY_TOURISM: z.string().optional(),
  FORUM_TAG_CATEGORY_GAME: z.string().optional(),
  FORUM_TAG_CATEGORY_RELAX: z.string().optional(),
  FORUM_TAG_CATEGORY_PHOTOSHOOT: z.string().optional(),
  FORUM_TAG_CATEGORY_EVENT: z.string().optional(),
  FORUM_TAG_CATEGORY_OTHER: z.string().optional(),

  FORUM_TAG_STATUS_RECRUITING: z.string().optional(),
  FORUM_TAG_STATUS_FULL: z.string().optional(),
  FORUM_TAG_STATUS_COMPLETED: z.string().optional(),
  FORUM_TAG_STATUS_CANCELLED: z.string().optional(),

  // ==========================================
  // オプション: バリデーション
  // ==========================================
  VALIDATION_EVENT_NAME_MAX_LENGTH: z
    .string()
    .optional()
    .default('200')
    .transform((val) => parseInt(val, 10)),

  VALIDATION_WORLD_NAME_MAX_LENGTH: z
    .string()
    .optional()
    .default('200')
    .transform((val) => parseInt(val, 10)),

  VALIDATION_DESCRIPTION_MAX_LENGTH: z
    .string()
    .optional()
    .default('2000')
    .transform((val) => parseInt(val, 10)),

  // ==========================================
  // オプション: パフォーマンス
  // ==========================================
  DATABASE_POOL_MIN: z
    .string()
    .optional()
    .default('2')
    .transform((val) => parseInt(val, 10)),

  DATABASE_POOL_MAX: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10)),

  DATABASE_CONNECTION_TIMEOUT: z
    .string()
    .optional()
    .default('30000')
    .transform((val) => parseInt(val, 10)),

  // ==========================================
  // オプション: 開発環境
  // ==========================================
  DEBUG_MODE: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true'),

  ENABLE_STACK_TRACE: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val === 'true'),
});

/**
 * バリデーション済み環境変数の型
 */
export type Env = z.infer<typeof envSchema>;

/**
 * 環境変数をバリデーションし、型安全なオブジェクトとして返す
 * @throws {Error} バリデーションエラー時
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
      throw new Error(`環境変数のバリデーションに失敗しました:\n${issues}`);
    }
    throw error;
  }
}

/**
 * グローバルな環境変数オブジェクト
 * アプリケーション起動時に一度だけバリデーションされる
 */
export const env = validateEnv();
