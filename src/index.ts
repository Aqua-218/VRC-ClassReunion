import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { env } from './config/env';
import { logger } from './utils/logger';
import { connectDatabase, disconnectDatabase } from './utils/database';
import { loadEvents } from './handlers/eventLoader';
import { BotClient } from './types/discord';

/**
 * Discord Client initialization
 * Configure intents and partials required for bot functionality
 */
const client: BotClient = new Client({
  intents: [
    GatewayIntentBits.Guilds, // Access to guild information
    GatewayIntentBits.GuildMessages, // Receive guild messages
    GatewayIntentBits.MessageContent, // Read message content
    GatewayIntentBits.GuildMembers, // Access to member information
  ],
  partials: [
    Partials.Channel, // Partial channel data for DMs
    Partials.Message, // Partial message data
    Partials.ThreadMember, // Thread member data
  ],
});

/**
 * Bot startup sequence
 * 1. Connect to database
 * 2. Load event handlers
 * 3. Login to Discord
 */
async function main() {
  try {
    logger.info('VRC Class Reunion Discord Bot starting...', {
      nodeEnv: env.NODE_ENV,
      invitationEnabled: env.FEATURE_INVITATION_ENABLED,
      ticketEnabled: env.FEATURE_TICKET_ENABLED,
    });

    // Connect to database
    await connectDatabase();
    logger.info('Database connection established');

    // Load event handlers
    await loadEvents(client);
    logger.info('Event handlers registered');

    // Login to Discord
    await client.login(env.DISCORD_BOT_TOKEN);
    logger.info('Discord login successful');
  } catch (error) {
    logger.error('Bot startup failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    await cleanup();
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 * Ensures proper cleanup of resources before exit
 */
async function cleanup() {
  logger.info('Initiating graceful shutdown...');

  try {
    // Disconnect Discord client
    if (client.isReady()) {
      client.destroy();
      logger.info('Discord client destroyed');
    }

    // Disconnect database
    await disconnectDatabase();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error during cleanup', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Error handling for unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: String(promise),
  });
});

/**
 * Error handling for uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  cleanup()
    .then(() => process.exit(1))
    .catch(() => process.exit(1));
});

/**
 * Handle process termination signals
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  cleanup()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
});

process.on('SIGINT', () => {
  logger.info('SIGINT received');
  cleanup()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
});

/**
 * Start the bot
 */
main().catch((error) => {
  logger.error('Fatal error during startup', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

// Execute main function
void main();
