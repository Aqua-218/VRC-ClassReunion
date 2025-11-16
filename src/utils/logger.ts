import winston from 'winston';
import { env } from '../config/env';

/**
 * Winstonロガーの設定
 */
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: env.ENABLE_STACK_TRACE }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'vrc-discord-bot' },
  transports: [
    // コンソール出力
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr =
            Object.keys(meta).length > 0
              ? ` ${JSON.stringify(meta as Record<string, unknown>)}`
              : '';
          return `${String(timestamp)} [${String(level)}]: ${String(message)}${metaStr}`;
        })
      ),
    }),

    // ファイル出力
    new winston.transports.File({
      filename: env.LOG_FILE_PATH,
      maxsize: parseSize(env.LOG_MAX_SIZE),
      maxFiles: env.LOG_MAX_FILES,
    }),

    // エラーログ専用ファイル
    new winston.transports.File({
      filename: env.LOG_FILE_PATH.replace('.log', '-error.log'),
      level: 'error',
      maxsize: parseSize(env.LOG_MAX_SIZE),
      maxFiles: env.LOG_MAX_FILES,
    }),
  ],
});

/**
 * サイズ文字列をバイト数に変換
 * @param sizeStr - "10m", "100k", "1g" など
 */
function parseSize(sizeStr: string): number {
  const match = sizeStr.match(/^(\d+)([kmg]?)$/i);
  if (!match || !match[1]) return 10 * 1024 * 1024; // デフォルト: 10MB

  const value = parseInt(match[1], 10);
  const unit = match[2]?.toLowerCase();

  switch (unit) {
    case 'k':
      return value * 1024;
    case 'm':
      return value * 1024 * 1024;
    case 'g':
      return value * 1024 * 1024 * 1024;
    default:
      return value;
  }
}
