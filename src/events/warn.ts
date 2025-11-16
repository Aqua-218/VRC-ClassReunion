import { BotEvent } from '../types/discord';
import { logger } from '../utils/logger';

/**
 * Warning event handler
 * Handles Discord client warnings
 */
export const warnEvent: BotEvent<'warn'> = {
  name: 'warn',
  execute: (info) => {
    logger.warn('Discord client warning', { info });
  },
};
