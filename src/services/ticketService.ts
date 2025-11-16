import { Ticket } from '@prisma/client';
import { db } from '../utils/database';
import { logger } from '../utils/logger';

/**
 * Ticket service
 * Handles all database operations related to tickets
 */
export class TicketService {
  /**
   * Create a new ticket
   *
   * @param channelId - Discord channel ID (used as primary key)
   * @param userId - Ticket creator Discord user ID
   * @param userName - Ticket creator display name
   * @param category - Ticket category
   * @param description - Ticket description
   * @returns Created ticket record
   */
  async createTicket(
    channelId: string,
    userId: string,
    userName: string,
    category: string,
    description: string
  ): Promise<Ticket> {
    try {
      const ticket = await db.ticket.create({
        data: {
          id: channelId,
          userId,
          userName,
          category,
          description,
          status: 'open',
        },
      });

      logger.info('Ticket created in database', {
        ticketId: ticket.id,
        channelId,
        userId,
      });

      return ticket;
    } catch (error) {
      logger.error('Failed to create ticket in database', {
        error: error instanceof Error ? error.message : String(error),
        channelId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get ticket by channel ID
   *
   * @param channelId - Discord channel ID
   * @returns Ticket record or null
   */
  async getTicketByChannelId(channelId: string): Promise<Ticket | null> {
    try {
      return await db.ticket.findUnique({
        where: { id: channelId },
      });
    } catch (error) {
      logger.error('Failed to get ticket', {
        error: error instanceof Error ? error.message : String(error),
        channelId,
      });
      throw error;
    }
  }

  /**
   * Close ticket
   *
   * @param channelId - Discord channel ID
   * @returns Updated ticket record
   */
  async closeTicket(channelId: string): Promise<Ticket> {
    try {
      const ticket = await db.ticket.update({
        where: { id: channelId },
        data: {
          status: 'closed',
          closedAt: new Date(),
        },
      });

      logger.info('Ticket closed', {
        ticketId: ticket.id,
        channelId,
      });

      return ticket;
    } catch (error) {
      logger.error('Failed to close ticket', {
        error: error instanceof Error ? error.message : String(error),
        channelId,
      });
      throw error;
    }
  }

  /**
   * Get all open tickets
   *
   * @returns Array of open tickets
   */
  async getOpenTickets(): Promise<Ticket[]> {
    try {
      return await db.ticket.findMany({
        where: {
          status: 'open',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      logger.error('Failed to get open tickets', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get tickets by user ID
   *
   * @param userId - Discord user ID
   * @returns Array of tickets
   */
  async getTicketsByUser(userId: string): Promise<Ticket[]> {
    try {
      return await db.ticket.findMany({
        where: { userId },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      logger.error('Failed to get tickets by user', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }
}

/**
 * Export singleton instance
 */
export const ticketService = new TicketService();
