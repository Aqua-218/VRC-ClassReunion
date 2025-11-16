import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { env } from './config/env';
import { logger } from './utils/logger';

/**
 * Discord Clientの初期化
 */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.ThreadMember],
});

/**
 * Botの起動処理
 */
async function main() {
  try {
    logger.info('VRC同期会Discord Bot 起動中...', {
      nodeEnv: env.NODE_ENV,
      invitationEnabled: env.FEATURE_INVITATION_ENABLED,
      ticketEnabled: env.FEATURE_TICKET_ENABLED,
    });

    // Discord Clientのイベントハンドラー登録
    client.once('ready', () => {
      logger.info(`Bot準備完了: ${client.user?.tag}`, {
        guildCount: client.guilds.cache.size,
      });
    });

    // Botログイン
    await client.login(env.DISCORD_BOT_TOKEN);
  } catch (error) {
    logger.error('Bot起動エラー', { error });
    process.exit(1);
  }
}

/**
 * エラーハンドリング
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

// Execute main function
void main();
