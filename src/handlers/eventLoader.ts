import { readdirSync } from 'fs';
import { join } from 'path';
import { BotClient, BotEvent } from '../types/discord';
import { logger } from '../utils/logger';

/**
 * Load and register all event handlers
 * Scans the events directory and registers each event with the Discord client
 *
 * @param client - Discord bot client instance
 * @returns Promise that resolves when all events are loaded
 */
export async function loadEvents(client: BotClient): Promise<void> {
  const eventsPath = join(__dirname, '../events');
  const eventFiles = readdirSync(eventsPath).filter(
    (file) => file.endsWith('.ts') || file.endsWith('.js')
  );

  logger.info(`Loading ${eventFiles.length} event handlers`);

  for (const file of eventFiles) {
    try {
      // Dynamic import for TypeScript compatibility
      const eventModule = await import(join(eventsPath, file));
      const event: BotEvent | undefined = Object.values(eventModule).find(
        (exp): exp is BotEvent =>
          typeof exp === 'object' && exp !== null && 'name' in exp && 'execute' in exp
      );

      if (!event) {
        logger.warn(`Event file ${file} does not export a valid BotEvent`);
        continue;
      }

      // Register event with Discord client
      if (event.once) {
        client.once(event.name, (...args) => {
          // Execute event handler with error catching
          Promise.resolve(event.execute(...args)).catch((error: Error) => {
            logger.error(`Error executing event ${event.name}`, {
              error: error.message,
              stack: error.stack,
            });
          });
        });
      } else {
        client.on(event.name, (...args) => {
          // Execute event handler with error catching
          Promise.resolve(event.execute(...args)).catch((error: Error) => {
            logger.error(`Error executing event ${event.name}`, {
              error: error.message,
              stack: error.stack,
            });
          });
        });
      }

      logger.debug(`Loaded event: ${event.name} (once: ${event.once ?? false})`);
    } catch (error) {
      logger.error(`Failed to load event file ${file}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info('All event handlers loaded successfully');
}
