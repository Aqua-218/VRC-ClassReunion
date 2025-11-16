import { Invitation, Participant } from '@prisma/client';
import { db } from '../utils/database';
import { logger } from '../utils/logger';
import {
  InvitationCreateInput,
  InvitationUpdateInput,
  ParticipantCreateInput,
  InvitationStatus,
} from '../types/validation';

/**
 * Invitation service
 * Handles all database operations related to invitations
 */
export class InvitationService {
  /**
   * Create a new invitation
   *
   * @param messageId - Discord message ID (used as primary key)
   * @param threadId - Discord thread ID
   * @param hostId - Host user Discord ID
   * @param hostName - Host user display name
   * @param data - Invitation creation data
   * @returns Created invitation record
   */
  async createInvitation(
    messageId: string,
    threadId: string,
    hostId: string,
    hostName: string,
    data: InvitationCreateInput
  ): Promise<Invitation> {
    try {
      const invitation = await db.invitation.create({
        data: {
          id: messageId,
          threadId,
          hostId,
          hostName,
          eventName: data.eventName,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          worldName: data.worldName,
          worldLink: data.worldLink || null,
          tag: data.tag,
          description: data.description,
          instanceType: data.instanceType,
          vrchatProfile: data.vrchatProfile || null,
          maxParticipants: data.maxParticipants,
          status: 'recruiting',
        },
      });

      logger.info('Invitation created', {
        invitationId: invitation.id,
        eventName: invitation.eventName,
        hostId: invitation.hostId,
      });

      return invitation;
    } catch (error) {
      logger.error('Failed to create invitation', {
        error: error instanceof Error ? error.message : String(error),
        messageId,
        hostId,
      });
      throw error;
    }
  }

  /**
   * Get invitation by ID
   *
   * @param invitationId - Invitation ID (Discord message ID)
   * @returns Invitation record or null
   */
  async getInvitationById(invitationId: string): Promise<Invitation | null> {
    try {
      return await db.invitation.findUnique({
        where: { id: invitationId },
      });
    } catch (error) {
      logger.error('Failed to get invitation', {
        error: error instanceof Error ? error.message : String(error),
        invitationId,
      });
      throw error;
    }
  }

  /**
   * Get invitation by thread ID
   *
   * @param threadId - Discord thread ID
   * @returns Invitation record or null
   */
  async getInvitationByThreadId(threadId: string): Promise<Invitation | null> {
    try {
      return await db.invitation.findUnique({
        where: { threadId },
      });
    } catch (error) {
      logger.error('Failed to get invitation by thread', {
        error: error instanceof Error ? error.message : String(error),
        threadId,
      });
      throw error;
    }
  }

  /**
   * Update invitation
   *
   * @param invitationId - Invitation ID
   * @param data - Update data
   * @returns Updated invitation record
   */
  async updateInvitation(invitationId: string, data: InvitationUpdateInput): Promise<Invitation> {
    try {
      const updateData: Record<string, unknown> = {};

      if (data.eventName) updateData['eventName'] = data.eventName;
      if (data.startTime) updateData['startTime'] = new Date(data.startTime);
      if (data.endTime) updateData['endTime'] = new Date(data.endTime);
      if (data.worldName) updateData['worldName'] = data.worldName;
      if (data.worldLink !== undefined) updateData['worldLink'] = data.worldLink || null;
      if (data.tag) updateData['tag'] = data.tag;
      if (data.description) updateData['description'] = data.description;
      if (data.instanceType) updateData['instanceType'] = data.instanceType;
      if (data.vrchatProfile !== undefined)
        updateData['vrchatProfile'] = data.vrchatProfile || null;
      if (data.maxParticipants) updateData['maxParticipants'] = data.maxParticipants;

      const invitation = await db.invitation.update({
        where: { id: invitationId },
        data: updateData,
      });

      logger.info('Invitation updated', {
        invitationId: invitation.id,
        updatedFields: Object.keys(updateData),
      });

      return invitation;
    } catch (error) {
      logger.error('Failed to update invitation', {
        error: error instanceof Error ? error.message : String(error),
        invitationId,
      });
      throw error;
    }
  }

  /**
   * Update invitation status
   *
   * @param invitationId - Invitation ID
   * @param status - New status
   * @returns Updated invitation record
   */
  async updateInvitationStatus(
    invitationId: string,
    status: InvitationStatus
  ): Promise<Invitation> {
    try {
      const invitation = await db.invitation.update({
        where: { id: invitationId },
        data: { status },
      });

      logger.info('Invitation status updated', {
        invitationId: invitation.id,
        newStatus: status,
      });

      return invitation;
    } catch (error) {
      logger.error('Failed to update invitation status', {
        error: error instanceof Error ? error.message : String(error),
        invitationId,
        status,
      });
      throw error;
    }
  }

  /**
   * Assign staff to invitation
   *
   * @param invitationId - Invitation ID
   * @param staffId - Staff user Discord ID
   * @param staffName - Staff user display name
   * @param staffMessageId - Staff notification message ID
   * @returns Updated invitation record
   */
  async assignStaff(
    invitationId: string,
    staffId: string,
    staffName: string,
    staffMessageId?: string
  ): Promise<Invitation> {
    try {
      const invitation = await db.invitation.update({
        where: { id: invitationId },
        data: {
          staffId,
          staffName,
          ...(staffMessageId && { staffMessageId }),
        },
      });

      logger.info('Staff assigned to invitation', {
        invitationId: invitation.id,
        staffId,
        staffName,
      });

      return invitation;
    } catch (error) {
      logger.error('Failed to assign staff', {
        error: error instanceof Error ? error.message : String(error),
        invitationId,
        staffId,
      });
      throw error;
    }
  }

  /**
   * Set instance link for invitation
   *
   * @param invitationId - Invitation ID
   * @param instanceLink - VRChat instance invite link
   * @returns Updated invitation record
   */
  async setInstanceLink(invitationId: string, instanceLink: string): Promise<Invitation> {
    try {
      const invitation = await db.invitation.update({
        where: { id: invitationId },
        data: { instanceLink },
      });

      logger.info('Instance link set for invitation', {
        invitationId: invitation.id,
      });

      return invitation;
    } catch (error) {
      logger.error('Failed to set instance link', {
        error: error instanceof Error ? error.message : String(error),
        invitationId,
      });
      throw error;
    }
  }

  /**
   * Get all participants for an invitation
   *
   * @param invitationId - Invitation ID
   * @returns Array of participant records
   */
  async getParticipants(invitationId: string): Promise<Participant[]> {
    try {
      return await db.participant.findMany({
        where: { invitationId },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      logger.error('Failed to get participants', {
        error: error instanceof Error ? error.message : String(error),
        invitationId,
      });
      throw error;
    }
  }

  /**
   * Add participant to invitation
   *
   * @param data - Participant data
   * @returns Created participant record
   */
  async addParticipant(data: ParticipantCreateInput): Promise<Participant> {
    try {
      const participant = await db.participant.create({
        data,
      });

      logger.info('Participant added', {
        invitationId: data.invitationId,
        userId: data.userId,
        status: data.status,
      });

      return participant;
    } catch (error) {
      logger.error('Failed to add participant', {
        error: error instanceof Error ? error.message : String(error),
        invitationId: data.invitationId,
        userId: data.userId,
      });
      throw error;
    }
  }

  /**
   * Remove participant from invitation
   *
   * @param invitationId - Invitation ID
   * @param userId - User Discord ID
   * @returns Deleted participant record
   */
  async removeParticipant(invitationId: string, userId: string): Promise<Participant> {
    try {
      const participant = await db.participant.delete({
        where: {
          unique_participant: {
            invitationId,
            userId,
          },
        },
      });

      logger.info('Participant removed', {
        invitationId,
        userId,
      });

      return participant;
    } catch (error) {
      logger.error('Failed to remove participant', {
        error: error instanceof Error ? error.message : String(error),
        invitationId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Check if user is participant
   *
   * @param invitationId - Invitation ID
   * @param userId - User Discord ID
   * @returns Participant record or null
   */
  async getParticipant(invitationId: string, userId: string): Promise<Participant | null> {
    try {
      return await db.participant.findUnique({
        where: {
          unique_participant: {
            invitationId,
            userId,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to get participant', {
        error: error instanceof Error ? error.message : String(error),
        invitationId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get participant count by status
   *
   * @param invitationId - Invitation ID
   * @returns Object with joined and interested counts
   */
  async getParticipantCount(
    invitationId: string
  ): Promise<{ joined: number; interested: number; total: number }> {
    try {
      const participants = await db.participant.groupBy({
        by: ['status'],
        where: { invitationId },
        _count: true,
      });

      const joined = participants.find((p) => p.status === 'joined')?._count ?? 0;
      const interested = participants.find((p) => p.status === 'interested')?._count ?? 0;

      return {
        joined,
        interested,
        total: joined + interested,
      };
    } catch (error) {
      logger.error('Failed to get participant count', {
        error: error instanceof Error ? error.message : String(error),
        invitationId,
      });
      throw error;
    }
  }
}

/**
 * Export singleton instance
 */
export const invitationService = new InvitationService();
