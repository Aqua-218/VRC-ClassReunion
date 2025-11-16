import { BotEvent } from '../types/discord';
import { logger } from '../utils/logger';

/**
 * Error event handler
 * Handles Discord client errors
 */
export const errorEvent: BotEvent<'error'> = {
  name: 'error',
  execute: (error) => {
    logger.error('Discord client error', {
      error: error.message,
      stack: error.stack,
    });
  },
};
