import { Interaction } from 'discord.js';
import { BotEvent } from '../types/discord';
import { logger } from '../utils/logger';
import { createInvitationModal } from '../utils/modals';
import { handleInvitationCreate } from '../handlers/invitationHandler';

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
    // TODO: Implement join handler
    await interaction.reply({
      content: '参加機能は開発中です',
      ephemeral: true,
    });
  } else if (customId.startsWith('invite_interested_')) {
    // Handle interested button
    // TODO: Implement interested handler
    await interaction.reply({
      content: '興味あり機能は開発中です',
      ephemeral: true,
    });
  } else if (customId.startsWith('invite_cancel_')) {
    // Handle cancel participation button
    // TODO: Implement cancel participation handler
    await interaction.reply({
      content: 'キャンセル機能は開発中です',
      ephemeral: true,
    });
  } else if (customId.startsWith('invite_edit_')) {
    // Handle edit invitation button
    // TODO: Implement edit handler
    await interaction.reply({
      content: '編集機能は開発中です',
      ephemeral: true,
    });
  } else if (customId.startsWith('invite_cancel_event_')) {
    // Handle cancel invitation button
    // TODO: Implement cancel event handler
    await interaction.reply({
      content: 'イベントキャンセル機能は開発中です',
      ephemeral: true,
    });
  } else if (customId.startsWith('staff_assign_')) {
    // Handle staff assignment button
    // TODO: Implement staff assignment handler
    await interaction.reply({
      content: 'スタッフ割り当て機能は開発中です',
      ephemeral: true,
    });
  } else if (customId === 'invitation_create') {
    // Handle create invitation button - show modal
    const modal = createInvitationModal();
    await interaction.showModal(modal);
    logger.debug('Displayed invitation creation modal', {
      userId: interaction.user.id,
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
    // TODO: Implement invitation edit logic
    await interaction.reply({
      content: '募集編集処理は開発中です',
      ephemeral: true,
    });
  } else if (customId.startsWith('instance_link_modal_')) {
    // Handle instance link modal
    // TODO: Implement instance link submission logic
    await interaction.reply({
      content: 'インスタンスリンク登録処理は開発中です',
      ephemeral: true,
    });
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

  // TODO: Implement command handlers
  await interaction.reply({
    content: 'コマンド機能は開発中です',
    ephemeral: true,
  });
}
