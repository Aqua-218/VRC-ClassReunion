import { Client, ClientEvents } from 'discord.js';

/**
 * Discord bot event handler interface
 * All event handlers must implement this interface for type safety
 */
export interface BotEvent<K extends keyof ClientEvents = keyof ClientEvents> {
  /** Event name from Discord.js ClientEvents */
  name: K;
  /** Whether this event should only fire once */
  once?: boolean;
  /** Event handler function */
  execute: (...args: ClientEvents[K]) => Promise<void> | void;
}

/**
 * Extended Discord Client with custom properties
 */
export interface BotClient extends Client {
  /** Collection of loaded event handlers */
  events?: Map<string, BotEvent>;
}
