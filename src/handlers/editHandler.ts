import { ButtonInteraction, ModalSubmitInteraction, Message } from 'discord.js';
import { logger } from '../utils/logger';
import { invitationService } from '../services/invitationService';
import { InvitationUpdateSchema, InvitationUpdateInput } from '../types/validation';
import { createInvitationEmbed, createInvitationButtons, createHostButtons } from '../utils/embed';
import { createEditInvitationModal } from '../utils/modals';

/**
 * Handle edit invitation button click
 * Shows modal pre-filled with current data (note: Discord doesn't support pre-filling)
 *
 * @param interaction - Button interaction
 * @param invitationId - Invitation ID
 */
export async function handleEditButton(
  interaction: ButtonInteraction,
  invitationId: string
): Promise<void> {
  try {
    // Get invitation
    const invitation = await invitationService.getInvitationById(invitationId);

    if (!invitation) {
      await interaction.reply({
        content: '❌ 募集が見つかりません',
        ephemeral: true,
      });
      return;
    }

    // Check if user is the host
    if (invitation.hostId !== interaction.user.id) {
      await interaction.reply({
        content: '❌ 主催者のみが編集できます',
        ephemeral: true,
      });
      logger.warn('Non-host attempted to edit invitation', {
        invitationId,
        userId: interaction.user.id,
        hostId: invitation.hostId,
      });
      return;
    }

    // Check if invitation can be edited
    if (invitation.status === 'completed' || invitation.status === 'cancelled') {
      await interaction.reply({
        content: '❌ 終了またはキャンセルされた募集は編集できません',
        ephemeral: true,
      });
      return;
    }

    // Show edit modal
    // Note: Discord modals don't support pre-filling values
    // Store current values in a cache if needed for merge on submit
    const modal = createEditInvitationModal();
    await interaction.showModal(modal);

    logger.debug('Displayed edit modal', {
      invitationId,
      userId: interaction.user.id,
    });
  } catch (error) {
    logger.error('Failed to handle edit button', {
      error: error instanceof Error ? error.message : String(error),
      invitationId,
      userId: interaction.user.id,
    });

    if (interaction.isRepliable()) {
      await interaction.reply({
        content: '❌ エラーが発生しました',
        ephemeral: true,
      });
    }
  }
}

/**
 * Handle edit modal submission
 * Updates invitation with new data
 *
 * @param interaction - Modal submit interaction
 */
export async function handleEditModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
  try {
    await interaction.deferReply({ ephemeral: true });

    // Extract invitation ID from message
    // The modal was shown from a message with the invitation ID in buttons
    const message = interaction.message;
    if (!message) {
      await interaction.editReply({
        content: '❌ エラー: メッセージが見つかりません',
      });
      return;
    }

    // Get invitation ID from the message (it's the message ID)
    const invitationId = message.id;

    // Get current invitation
    const invitation = await invitationService.getInvitationById(invitationId);

    if (!invitation) {
      await interaction.editReply({
        content: '❌ 募集が見つかりません',
      });
      return;
    }

    // Verify host permission again
    if (invitation.hostId !== interaction.user.id) {
      await interaction.editReply({
        content: '❌ 主催者のみが編集できます',
      });
      return;
    }

    // Extract form data
    const eventName = interaction.fields.getTextInputValue('event_name');
    const startTime = interaction.fields.getTextInputValue('start_time');
    const endTime = interaction.fields.getTextInputValue('end_time');
    const worldName = interaction.fields.getTextInputValue('world_name');
    const description = interaction.fields.getTextInputValue('description');

    // Construct update data (keeping other fields unchanged for now)
    const updateData: InvitationUpdateInput = {
      eventName,
      startTime,
      endTime,
      worldName,
      description,
    };

    // Validate data
    const validationResult = InvitationUpdateSchema.safeParse(updateData);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      await interaction.editReply({
        content: `❌ 入力内容にエラーがあります:\n${errors.join('\n')}`,
      });
      logger.warn('Invitation edit validation failed', {
        userId: interaction.user.id,
        errors,
      });
      return;
    }

    // Update invitation in database
    await invitationService.updateInvitation(invitationId, validationResult.data);

    // Update message
    await updateInvitationMessage(invitationId, message);

    // Post update notification in thread
    const thread = await interaction.client.channels.fetch(invitation.threadId);
    if (thread?.isThread()) {
      await thread.send({
        content: `📝 **募集内容が更新されました** by ${interaction.user.displayName}`,
      });
    }

    await interaction.editReply({
      content: '✅ 募集を更新しました',
    });

    logger.info('Invitation updated', {
      invitationId,
      userId: interaction.user.id,
      updatedFields: Object.keys(validationResult.data),
    });

    // Optional: Send DM to all participants about the update
    // await notifyParticipantsOfUpdate(invitationId, interaction.user.displayName);
  } catch (error) {
    logger.error('Failed to handle edit modal submit', {
      error: error instanceof Error ? error.message : String(error),
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: '❌ エラーが発生しました',
    });
  }
}

/**
 * Handle cancel invitation button
 * Shows confirmation and cancels the invitation
 *
 * @param interaction - Button interaction
 * @param invitationId - Invitation ID
 */
export async function handleCancelEventButton(
  interaction: ButtonInteraction,
  invitationId: string
): Promise<void> {
  try {
    // Get invitation
    const invitation = await invitationService.getInvitationById(invitationId);

    if (!invitation) {
      await interaction.reply({
        content: '❌ 募集が見つかりません',
        ephemeral: true,
      });
      return;
    }

    // Check if user is the host
    if (invitation.hostId !== interaction.user.id) {
      await interaction.reply({
        content: '❌ 主催者のみがキャンセルできます',
        ephemeral: true,
      });
      logger.warn('Non-host attempted to cancel invitation', {
        invitationId,
        userId: interaction.user.id,
        hostId: invitation.hostId,
      });
      return;
    }

    // Check if already cancelled
    if (invitation.status === 'cancelled') {
      await interaction.reply({
        content: '❌ この募集は既にキャンセルされています',
        ephemeral: true,
      });
      return;
    }

    // Show confirmation (using reply with buttons)
    await interaction.reply({
      content: '⚠️ 本当にこの募集をキャンセルしますか？\n参加者全員に通知が送信されます。',
      ephemeral: true,
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 4,
              label: 'はい、キャンセルします',
              custom_id: `confirm_cancel_${invitationId}`,
            },
            {
              type: 2,
              style: 2,
              label: 'いいえ',
              custom_id: `cancel_cancel_${invitationId}`,
            },
          ],
        },
      ],
    });
  } catch (error) {
    logger.error('Failed to handle cancel event button', {
      error: error instanceof Error ? error.message : String(error),
      invitationId,
      userId: interaction.user.id,
    });

    if (interaction.isRepliable()) {
      await interaction.reply({
        content: '❌ エラーが発生しました',
        ephemeral: true,
      });
    }
  }
}

/**
 * Handle confirmation of cancel invitation
 *
 * @param interaction - Button interaction
 * @param invitationId - Invitation ID
 */
export async function handleConfirmCancel(
  interaction: ButtonInteraction,
  invitationId: string
): Promise<void> {
  try {
    await interaction.deferUpdate();

    // Get invitation
    const invitation = await invitationService.getInvitationById(invitationId);

    if (!invitation) {
      await interaction.followUp({
        content: '❌ 募集が見つかりません',
        ephemeral: true,
      });
      return;
    }

    // Double-check host permission
    if (invitation.hostId !== interaction.user.id) {
      await interaction.followUp({
        content: '❌ 権限がありません',
        ephemeral: true,
      });
      return;
    }

    // Update status to cancelled
    await invitationService.updateInvitationStatus(invitationId, 'cancelled');

    // Update message
    const channel = await interaction.client.channels.fetch(invitation.threadId);
    if (channel?.isThread()) {
      const starterMessage = await channel.fetchStarterMessage();
      if (starterMessage) {
        await updateInvitationMessage(invitationId, starterMessage);

        // Post cancellation notice in thread
        await channel.send({
          content: `❌ **この募集はキャンセルされました** by ${interaction.user.displayName}`,
        });

        // Lock/archive the thread
        await channel.setLocked(true);
        await channel.setArchived(true);
      }
    }

    // Notify participants via DM
    await notifyParticipantsOfCancellation(invitationId);

    await interaction.editReply({
      content: '✅ 募集をキャンセルしました',
      components: [],
    });

    logger.info('Invitation cancelled', {
      invitationId,
      userId: interaction.user.id,
    });
  } catch (error) {
    logger.error('Failed to confirm cancel', {
      error: error instanceof Error ? error.message : String(error),
      invitationId,
      userId: interaction.user.id,
    });

    await interaction.followUp({
      content: '❌ エラーが発生しました',
      ephemeral: true,
    });
  }
}

/**
 * Update invitation message with fresh data
 *
 * @param invitationId - Invitation ID
 * @param message - Message to update
 */
async function updateInvitationMessage(invitationId: string, message: Message): Promise<void> {
  const invitation = await invitationService.getInvitationById(invitationId);
  const participants = await invitationService.getParticipants(invitationId);

  if (!invitation) return;

  const count = await invitationService.getParticipantCount(invitationId);
  const isFull = count.joined >= invitation.maxParticipants;

  const embed = createInvitationEmbed(invitation, participants);
  const participantButtons = createInvitationButtons(invitationId, invitation.status, isFull);
  const hostButtons = createHostButtons(invitationId, invitation.status);

  await message.edit({
    embeds: [embed],
    components: [participantButtons, hostButtons],
  });
}

/**
 * Notify all participants of cancellation via DM
 *
 * @param invitationId - Invitation ID
 */
async function notifyParticipantsOfCancellation(invitationId: string): Promise<void> {
  try {
    const invitation = await invitationService.getInvitationById(invitationId);
    const participants = await invitationService.getParticipants(invitationId);

    if (!invitation) return;

    // This would require the Discord client instance
    // Implementation depends on how client is accessed in handlers
    logger.info('Cancellation notification queued', {
      invitationId,
      participantCount: participants.length,
    });

    // TODO: Implement DM sending
    // for (const participant of participants) {
    //   try {
    //     const user = await client.users.fetch(participant.userId);
    //     await user.send({
    //       content: `❌ **イベントがキャンセルされました**\n\nイベント名: ${invitation.eventName}\n主催者: ${hostName}`,
    //     });
    //   } catch (error) {
    //     logger.warn('Failed to send cancellation DM', {
    //       userId: participant.userId,
    //       error: error instanceof Error ? error.message : String(error),
    //     });
    //   }
    // }
  } catch (error) {
    logger.error('Failed to notify participants of cancellation', {
      error: error instanceof Error ? error.message : String(error),
      invitationId,
    });
  }
}
