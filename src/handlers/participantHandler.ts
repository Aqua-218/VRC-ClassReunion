import { ButtonInteraction } from 'discord.js';
import { logger } from '../utils/logger';
import { invitationService } from '../services/invitationService';
import { createInvitationEmbed, createInvitationButtons, createHostButtons } from '../utils/embed';

/**
 * Handle join button click
 * Adds user as confirmed participant
 *
 * @param interaction - Button interaction
 * @param invitationId - Invitation ID
 */
export async function handleJoinButton(
  interaction: ButtonInteraction,
  invitationId: string
): Promise<void> {
  try {
    await interaction.deferReply({ ephemeral: true });

    // Get invitation
    const invitation = await invitationService.getInvitationById(invitationId);

    if (!invitation) {
      await interaction.editReply({
        content: '❌ 募集が見つかりません',
      });
      return;
    }

    // Check if invitation is still accepting participants
    if (invitation.status !== 'recruiting') {
      await interaction.editReply({
        content: '❌ この募集は現在参加を受け付けていません',
      });
      return;
    }

    // Check if user is already a participant
    const existingParticipant = await invitationService.getParticipant(
      invitationId,
      interaction.user.id
    );

    if (existingParticipant) {
      if (existingParticipant.status === 'joined') {
        await interaction.editReply({
          content: '✅ すでに参加登録済みです',
        });
        return;
      }

      // Update from interested to joined
      await invitationService.removeParticipant(invitationId, interaction.user.id);
    }

    // Get current participant count
    const count = await invitationService.getParticipantCount(invitationId);

    // Check if invitation is full
    if (count.joined >= invitation.maxParticipants) {
      await interaction.editReply({
        content: '❌ 定員に達しています',
      });
      return;
    }

    // Add participant
    await invitationService.addParticipant({
      invitationId,
      userId: interaction.user.id,
      userName: interaction.user.displayName,
      status: 'joined',
    });

    // Check if now full
    const newCount = await invitationService.getParticipantCount(invitationId);
    const isFull = newCount.joined >= invitation.maxParticipants;

    if (isFull) {
      await invitationService.updateInvitationStatus(invitationId, 'full');
    }

    // Update embed
    await updateInvitationMessage(interaction, invitationId);

    await interaction.editReply({
      content: '✅ 参加登録しました!',
    });

    logger.info('User joined invitation', {
      invitationId,
      userId: interaction.user.id,
      isFull,
    });
  } catch (error) {
    logger.error('Failed to handle join button', {
      error: error instanceof Error ? error.message : String(error),
      invitationId,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: '❌ エラーが発生しました',
    });
  }
}

/**
 * Handle interested button click
 * Adds user as interested participant
 *
 * @param interaction - Button interaction
 * @param invitationId - Invitation ID
 */
export async function handleInterestedButton(
  interaction: ButtonInteraction,
  invitationId: string
): Promise<void> {
  try {
    await interaction.deferReply({ ephemeral: true });

    // Get invitation
    const invitation = await invitationService.getInvitationById(invitationId);

    if (!invitation) {
      await interaction.editReply({
        content: '❌ 募集が見つかりません',
      });
      return;
    }

    // Check if invitation is still active
    if (invitation.status !== 'recruiting' && invitation.status !== 'full') {
      await interaction.editReply({
        content: '❌ この募集は終了しています',
      });
      return;
    }

    // Check if user is already a participant
    const existingParticipant = await invitationService.getParticipant(
      invitationId,
      interaction.user.id
    );

    if (existingParticipant) {
      if (existingParticipant.status === 'interested') {
        await interaction.editReply({
          content: '💭 すでに興味ありとして登録済みです',
        });
        return;
      } else {
        await interaction.editReply({
          content: '✅ すでに参加登録済みです',
        });
        return;
      }
    }

    // Add participant as interested
    await invitationService.addParticipant({
      invitationId,
      userId: interaction.user.id,
      userName: interaction.user.displayName,
      status: 'interested',
    });

    // Update embed
    await updateInvitationMessage(interaction, invitationId);

    await interaction.editReply({
      content: '💭 興味ありとして登録しました!',
    });

    logger.info('User marked as interested', {
      invitationId,
      userId: interaction.user.id,
    });
  } catch (error) {
    logger.error('Failed to handle interested button', {
      error: error instanceof Error ? error.message : String(error),
      invitationId,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: '❌ エラーが発生しました',
    });
  }
}

/**
 * Handle cancel participation button click
 * Removes user from participants list
 *
 * @param interaction - Button interaction
 * @param invitationId - Invitation ID
 */
export async function handleCancelButton(
  interaction: ButtonInteraction,
  invitationId: string
): Promise<void> {
  try {
    await interaction.deferReply({ ephemeral: true });

    // Check if user is a participant
    const existingParticipant = await invitationService.getParticipant(
      invitationId,
      interaction.user.id
    );

    if (!existingParticipant) {
      await interaction.editReply({
        content: '❌ 参加登録されていません',
      });
      return;
    }

    // Remove participant
    await invitationService.removeParticipant(invitationId, interaction.user.id);

    // Get invitation to check if it was full
    const invitation = await invitationService.getInvitationById(invitationId);

    if (invitation && invitation.status === 'full') {
      // Check current count
      const count = await invitationService.getParticipantCount(invitationId);
      if (count.joined < invitation.maxParticipants) {
        // Change status back to recruiting
        await invitationService.updateInvitationStatus(invitationId, 'recruiting');
      }
    }

    // Update embed
    await updateInvitationMessage(interaction, invitationId);

    await interaction.editReply({
      content: '✅ 参加をキャンセルしました',
    });

    logger.info('User cancelled participation', {
      invitationId,
      userId: interaction.user.id,
    });
  } catch (error) {
    logger.error('Failed to handle cancel button', {
      error: error instanceof Error ? error.message : String(error),
      invitationId,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: '❌ エラーが発生しました',
    });
  }
}

/**
 * Update invitation message with current data
 * Fetches fresh data and updates embed and buttons
 *
 * @param interaction - Button interaction
 * @param invitationId - Invitation ID
 */
async function updateInvitationMessage(
  interaction: ButtonInteraction,
  invitationId: string
): Promise<void> {
  try {
    // Fetch fresh data
    const invitation = await invitationService.getInvitationById(invitationId);
    const participants = await invitationService.getParticipants(invitationId);

    if (!invitation) {
      logger.error('Invitation not found for update', { invitationId });
      return;
    }

    // Get participant count
    const count = await invitationService.getParticipantCount(invitationId);
    const isFull = count.joined >= invitation.maxParticipants;

    // Create updated embed
    const embed = createInvitationEmbed(invitation, participants);

    // Create updated buttons
    const participantButtons = createInvitationButtons(invitationId, invitation.status, isFull);
    const hostButtons = createHostButtons(invitationId, invitation.status);

    // Update message
    await interaction.message.edit({
      embeds: [embed],
      components: [participantButtons, hostButtons],
    });

    logger.debug('Invitation message updated', {
      invitationId,
      participantCount: participants.length,
      isFull,
    });
  } catch (error) {
    logger.error('Failed to update invitation message', {
      error: error instanceof Error ? error.message : String(error),
      invitationId,
    });
  }
}
