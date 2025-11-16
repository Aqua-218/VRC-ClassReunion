import { Interaction } from 'discord.js';
import { BotEvent } from '../types/discord';
import { logger } from '../utils/logger';
import { createInvitationModal } from '../utils/modals';
import { handleInvitationCreate } from '../handlers/invitationHandler';
import {
  handleJoinButton,
  handleInterestedButton,
  handleCancelButton,
} from '../handlers/participantHandler';
import {
  handleEditButton,
  handleEditModalSubmit,
  handleCancelEventButton,
  handleConfirmCancel,
} from '../handlers/editHandler';
import {
  handleStaffAssign,
  handleAddInstanceLink,
  handleInstanceLinkSubmit,
} from '../handlers/staffAssignmentHandler';
import { handleSetupInvite, handleSetupTicket } from '../handlers/setupHandler';

/**
 * Interaction create event handler
 * Routes all interactions (buttons, modals, commands) to appropriate handlers
 */
export const interactionCreateEvent: BotEvent<'interactionCreate'> = {
  name: 'interactionCreate',
  execute: async (interaction: Interaction) => {
    try {
      // Button interactions
      if (interaction.isButton()) {
        await handleButtonInteraction(interaction);
        return;
      }

      // Modal submit interactions
      if (interaction.isModalSubmit()) {
        await handleModalSubmit(interaction);
        return;
      }

      // String select menu interactions
      if (interaction.isStringSelectMenu()) {
        await handleSelectMenu(interaction);
        return;
      }

      // Slash command interactions
      if (interaction.isChatInputCommand()) {
        await handleCommand(interaction);
        return;
      }
    } catch (error) {
      logger.error('Error handling interaction', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        interactionType: interaction.type,
        customId: 'customId' in interaction ? interaction.customId : undefined,
        userId: interaction.user.id,
      });

      // Send error response to user if possible
      const errorMessage = 'エラーが発生しました。もう一度お試しください。';

      if (interaction.isRepliable()) {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: errorMessage,
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: errorMessage,
            ephemeral: true,
          });
        }
      }
    }
  },
};

/**
 * Handle button interactions
 */
async function handleButtonInteraction(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const { customId } = interaction;

  logger.debug('Button interaction', {
    customId,
    userId: interaction.user.id,
    guildId: interaction.guildId,
  });

  // Route to specific button handler based on customId prefix
  if (customId.startsWith('invite_join_')) {
    // Handle join button
    const invitationId = customId.replace('invite_join_', '');
    await handleJoinButton(interaction, invitationId);
  } else if (customId.startsWith('invite_interested_')) {
    // Handle interested button
    const invitationId = customId.replace('invite_interested_', '');
    await handleInterestedButton(interaction, invitationId);
  } else if (customId.startsWith('invite_cancel_')) {
    // Handle cancel participation button
    const invitationId = customId.replace('invite_cancel_', '');
    await handleCancelButton(interaction, invitationId);
  } else if (customId.startsWith('invite_edit_')) {
    // Handle edit invitation button
    const invitationId = customId.replace('invite_edit_', '');
    await handleEditButton(interaction, invitationId);
  } else if (customId.startsWith('invite_cancel_event_')) {
    // Handle cancel invitation button
    const invitationId = customId.replace('invite_cancel_event_', '');
    await handleCancelEventButton(interaction, invitationId);
  } else if (customId.startsWith('staff_assign_')) {
    // Handle staff assignment button
    const invitationId = customId.replace('staff_assign_', '');
    await handleStaffAssign(interaction, invitationId);
  } else if (customId.startsWith('staff_add_link_')) {
    // Handle add instance link button
    const invitationId = customId.replace('staff_add_link_', '');
    await handleAddInstanceLink(interaction, invitationId);
  } else if (customId === 'invitation_create') {
    // Handle create invitation button - show modal
    const modal = createInvitationModal();
    await interaction.showModal(modal);
    logger.debug('Displayed invitation creation modal', {
      userId: interaction.user.id,
    });
  } else if (customId.startsWith('confirm_cancel_')) {
    // Handle cancel confirmation
    const invitationId = customId.replace('confirm_cancel_', '');
    await handleConfirmCancel(interaction, invitationId);
  } else if (customId.startsWith('cancel_cancel_')) {
    // Handle cancel cancellation (dismiss)
    await interaction.update({
      content: 'キャンセルを取り消しました',
      components: [],
    });
  } else if (customId === 'ticket_create') {
    // Handle create ticket button
    // TODO: Implement ticket creation modal display
    await interaction.reply({
      content: 'チケット作成機能は開発中です',
      ephemeral: true,
    });
  } else {
    logger.warn('Unknown button interaction', { customId });
    await interaction.reply({
      content: '不明なボタンです',
      ephemeral: true,
    });
  }
}

/**
 * Handle modal submit interactions
 */
async function handleModalSubmit(interaction: Interaction) {
  if (!interaction.isModalSubmit()) return;

  const { customId } = interaction;

  logger.debug('Modal submit', {
    customId,
    userId: interaction.user.id,
    guildId: interaction.guildId,
  });

  // Route to specific modal handler
  if (customId === 'invitation_create_modal') {
    // Handle invitation creation modal
    await handleInvitationCreate(interaction);
  } else if (customId === 'invitation_edit_modal') {
    // Handle invitation edit modal
    await handleEditModalSubmit(interaction);
  } else if (customId.startsWith('instance_link_modal_')) {
    // Handle instance link modal
    const invitationId = customId.replace('instance_link_modal_', '');
    await handleInstanceLinkSubmit(interaction, invitationId);
  } else if (customId === 'ticket_create_modal') {
    // Handle ticket creation modal
    // TODO: Implement ticket creation logic
    await interaction.reply({
      content: 'チケット作成処理は開発中です',
      ephemeral: true,
    });
  } else {
    logger.warn('Unknown modal submit', { customId });
    await interaction.reply({
      content: '不明なモーダルです',
      ephemeral: true,
    });
  }
}

/**
 * Handle select menu interactions
 */
async function handleSelectMenu(interaction: Interaction) {
  if (!interaction.isStringSelectMenu()) return;

  const { customId, values } = interaction;

  logger.debug('Select menu interaction', {
    customId,
    values,
    userId: interaction.user.id,
    guildId: interaction.guildId,
  });

  // TODO: Implement select menu handlers as needed
  await interaction.reply({
    content: '選択メニュー機能は開発中です',
    ephemeral: true,
  });
}

/**
 * Handle slash command interactions
 */
async function handleCommand(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  logger.debug('Slash command', {
    commandName,
    userId: interaction.user.id,
    guildId: interaction.guildId,
  });

  // Route to command handlers
  if (commandName === 'setup') {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'invite') {
      await handleSetupInvite(interaction);
    } else if (subcommand === 'ticket') {
      await handleSetupTicket(interaction);
    } else {
      await interaction.reply({
        content: '不明なサブコマンドです',
        ephemeral: true,
      });
    }
  } else {
    await interaction.reply({
      content: '不明なコマンドです',
      ephemeral: true,
    });
  }
}
