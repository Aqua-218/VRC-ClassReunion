import { BotEvent } from '../types/discord';
import { logger } from '../utils/logger';

/**
 * Ready event handler
 * Fires once when the bot successfully connects to Discord
 */
export const readyEvent: BotEvent<'ready'> = {
  name: 'ready',
  once: true,
  execute: (client) => {
    logger.info('Discord bot is ready', {
      tag: client.user.tag,
      id: client.user.id,
      guildCount: client.guilds.cache.size,
      userCount: client.users.cache.size,
    });

    // Set bot activity status
    client.user.setPresence({
      activities: [
        {
          name: 'VRChat同期会イベント',
          type: 3, // Watching
        },
      ],
      status: 'online',
    });

    logger.info('Bot presence updated');
  },
};
