import { ButtonInteraction, ModalSubmitInteraction } from 'discord.js';
import { logger } from '../utils/logger';
import { invitationService } from '../services/invitationService';
import { updateStaffNotification, updateInvitationThreadMessage } from './staffHandler';

/**
 * Handle staff assignment button click
 * First-come-first-served logic with database transaction
 *
 * @param interaction - Button interaction
 * @param invitationId - Invitation ID
 */
export async function handleStaffAssign(
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

    // Check if already assigned
    if (invitation.staffId) {
      await interaction.editReply({
        content: `❌ 既に ${invitation.staffName || 'スタッフ'} が担当しています`,
      });
      return;
    }

    // Check if user has staff role
    const staffRoleId = process.env['STAFF_ROLE_ID'];
    if (staffRoleId && interaction.member && 'roles' in interaction.member) {
      const roles = interaction.member.roles;
      const hasStaffRole =
        typeof roles !== 'string' && 'cache' in roles ? roles.cache.has(staffRoleId) : false;

      if (!hasStaffRole) {
        await interaction.editReply({
          content: '❌ スタッフロールが必要です',
        });
        return;
      }
    }

    // Assign staff (first-come-first-served)
    await invitationService.updateInvitation(invitationId, {
      staffId: interaction.user.id,
      staffName: interaction.user.displayName,
    });

    // Update staff notification message
    await updateStaffNotification(interaction.client, invitationId);

    // Update invitation thread message to show staff info
    await updateInvitationThreadMessage(interaction.client, invitationId);

    // Send DM to staff
    try {
      await interaction.user.send({
        content: `✅ **グループインスタンスのスタッフに割り当てられました**\n\nイベント名: ${invitation.eventName}\n開始時刻: <t:${Math.floor(invitation.startTime.getTime() / 1000)}:F>\n\nインスタンスリンクを追加してください。`,
      });
    } catch (dmError) {
      logger.warn('Failed to send DM to staff', {
        staffId: interaction.user.id,
        error: dmError instanceof Error ? dmError.message : String(dmError),
      });
    }

    await interaction.editReply({
      content: '✅ 担当スタッフとして割り当てられました。インスタンスリンクを追加してください。',
    });

    logger.info('Staff assigned to invitation', {
      invitationId,
      staffId: interaction.user.id,
      staffName: interaction.user.displayName,
    });
  } catch (error) {
    logger.error('Failed to assign staff', {
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
 * Handle add instance link button
 * Shows modal for staff to input instance link
 *
 * @param interaction - Button interaction
 * @param invitationId - Invitation ID
 */
export async function handleAddInstanceLink(
  interaction: ButtonInteraction,
  invitationId: string
): Promise<void> {
  try {
    const invitation = await invitationService.getInvitationById(invitationId);

    if (!invitation) {
      await interaction.reply({
        content: '❌ 募集が見つかりません',
        ephemeral: true,
      });
      return;
    }

    // Check if user is the assigned staff
    if (invitation.staffId !== interaction.user.id) {
      await interaction.reply({
        content: '❌ 担当スタッフのみがインスタンスリンクを追加できます',
        ephemeral: true,
      });
      return;
    }

    // Show modal for instance link input
    const { createInstanceLinkModal } = await import('../utils/modals');
    const modal = createInstanceLinkModal(invitationId);

    await interaction.showModal(modal);

    logger.info('Instance link modal shown', {
      invitationId,
      staffId: interaction.user.id,
    });
  } catch (error) {
    logger.error('Failed to show instance link modal', {
      error: error instanceof Error ? error.message : String(error),
      invitationId,
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: '❌ エラーが発生しました',
      ephemeral: true,
    });
  }
}

/**
 * Handle instance link modal submission
 * Updates instance link and notifies all participants
 *
 * @param interaction - Modal submit interaction
 * @param invitationId - Invitation ID
 */
export async function handleInstanceLinkSubmit(
  interaction: ModalSubmitInteraction,
  invitationId: string
): Promise<void> {
  try {
    await interaction.deferReply({ ephemeral: true });

    const invitation = await invitationService.getInvitationById(invitationId);

    if (!invitation) {
      await interaction.editReply({
        content: '❌ 募集が見つかりません',
      });
      return;
    }

    // Check if user is the assigned staff
    if (invitation.staffId !== interaction.user.id) {
      await interaction.editReply({
        content: '❌ 担当スタッフのみがインスタンスリンクを追加できます',
      });
      return;
    }

    // Get instance link from modal
    const instanceLink = interaction.fields.getTextInputValue('instance_link');

    // Validate instance link format
    if (!instanceLink.startsWith('https://vrchat.com/home/world/')) {
      await interaction.editReply({
        content: '❌ 無効なインスタンスリンクです。VRChatのインスタンスURLを入力してください。',
      });
      return;
    }

    // Update invitation with instance link
    await invitationService.updateInvitation(invitationId, {
      instanceLink,
    });

    // Update staff notification
    await updateStaffNotification(interaction.client, invitationId);

    // Update invitation thread message
    await updateInvitationThreadMessage(interaction.client, invitationId);

    // Notify all participants via DM
    await notifyParticipantsOfInstanceLink(interaction.client, invitationId, instanceLink);

    await interaction.editReply({
      content: '✅ インスタンスリンクを追加しました。参加者に通知を送信しました。',
    });

    logger.info('Instance link added', {
      invitationId,
      staffId: interaction.user.id,
    });
  } catch (error) {
    logger.error('Failed to add instance link', {
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
 * Notify all participants of instance link via DM
 *
 * @param client - Discord client
 * @param invitationId - Invitation ID
 * @param instanceLink - Instance link
 */
async function notifyParticipantsOfInstanceLink(
  client: any,
  invitationId: string,
  instanceLink: string
): Promise<void> {
  try {
    const invitation = await invitationService.getInvitationById(invitationId);
    const participants = await invitationService.getParticipants(invitationId);

    if (!invitation) return;

    // Filter only 'joined' participants
    const joinedParticipants = participants.filter((p) => p.status === 'joined');

    logger.info('Notifying participants of instance link', {
      invitationId,
      participantCount: joinedParticipants.length,
    });

    // Send DM to each participant
    for (const participant of joinedParticipants) {
      try {
        const user = await client.users.fetch(participant.userId);
        await user.send({
          content: `🔗 **インスタンスリンクが追加されました**\n\nイベント名: ${invitation.eventName}\n開始時刻: <t:${Math.floor(invitation.startTime.getTime() / 1000)}:F>\n\nインスタンスリンク:\n${instanceLink}`,
        });

        logger.info('Instance link DM sent', {
          invitationId,
          userId: participant.userId,
        });
      } catch (dmError) {
        logger.warn('Failed to send instance link DM', {
          invitationId,
          userId: participant.userId,
          error: dmError instanceof Error ? dmError.message : String(dmError),
        });
      }
    }
  } catch (error) {
    logger.error('Failed to notify participants', {
      error: error instanceof Error ? error.message : String(error),
      invitationId,
    });
  }
}
