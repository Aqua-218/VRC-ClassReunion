import { ModalSubmitInteraction, ChannelType, PermissionFlagsBits } from 'discord.js';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { ticketService } from '../services/ticketService';
import { createTicketCloseButton } from '../utils/embed';

/**
 * Handle ticket creation modal submission
 * Creates private channel and stores ticket in database
 *
 * @param interaction - Modal submit interaction
 */
export async function handleTicketCreate(interaction: ModalSubmitInteraction): Promise<void> {
  try {
    await interaction.deferReply({ ephemeral: true });

    // Extract form data
    const category = interaction.fields.getTextInputValue('category');
    const description = interaction.fields.getTextInputValue('description');

    // Validate category
    const validCategories = ['question', 'trouble', 'other'];
    const normalizedCategory = category.toLowerCase();

    if (!validCategories.includes(normalizedCategory)) {
      await interaction.editReply({
        content: '❌ 無効なカテゴリです。question/trouble/other のいずれかを指定してください。',
      });
      return;
    }

    // Get ticket category channel
    const categoryChannelId = env.TICKET_CATEGORY_ID;
    const categoryChannel = await interaction.client.channels.fetch(categoryChannelId);

    if (!categoryChannel || categoryChannel.type !== ChannelType.GuildCategory) {
      await interaction.editReply({
        content: '❌ チケットカテゴリが見つかりません。管理者に連絡してください。',
      });
      logger.error('Ticket category not found or invalid type', {
        categoryChannelId,
      });
      return;
    }

    // Get staff role
    const staffRoleId = env.STAFF_ROLE_ID;

    // Create private text channel
    const ticketNumber = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const channelName = `ticket-${normalizedCategory}-${ticketNumber}`;

    const ticketChannel = await interaction.guild?.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: categoryChannel.id,
      permissionOverwrites: [
        {
          // Deny everyone
          id: interaction.guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          // Allow ticket creator
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
          ],
        },
        {
          // Allow staff role
          id: staffRoleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ManageChannels,
          ],
        },
      ],
    });

    if (!ticketChannel) {
      await interaction.editReply({
        content: '❌ チケットチャンネルの作成に失敗しました。',
      });
      return;
    }

    // Create ticket in database
    const ticket = await ticketService.createTicket(
      ticketChannel.id,
      interaction.user.id,
      interaction.user.displayName,
      normalizedCategory,
      description
    );

    // Send initial message with close button
    const closeButton = createTicketCloseButton(ticketChannel.id);

    const categoryLabel =
      normalizedCategory === 'question'
        ? '質問'
        : normalizedCategory === 'trouble'
          ? 'トラブル'
          : 'その他';

    await ticketChannel.send({
      content: `**チケット作成者**: ${interaction.user}\n**カテゴリ**: ${categoryLabel}\n**内容**:\n${description}\n\nスタッフが対応するまでお待ちください。`,
      components: [closeButton],
    });

    await interaction.editReply({
      content: `✅ チケットを作成しました: ${ticketChannel}`,
    });

    logger.info('Ticket created', {
      ticketId: ticket.id,
      channelId: ticketChannel.id,
      userId: interaction.user.id,
      category: normalizedCategory,
    });
  } catch (error) {
    logger.error('Failed to create ticket', {
      error: error instanceof Error ? error.message : String(error),
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: '❌ エラーが発生しました',
    });
  }
}

/**
 * Handle ticket close button click
 * Closes ticket and deletes channel
 *
 * @param interaction - Button interaction
 * @param channelId - Ticket channel ID
 */
export async function handleTicketClose(interaction: any, channelId: string): Promise<void> {
  try {
    await interaction.deferReply({ ephemeral: true });

    // Check if user has permission (staff role or ticket creator)
    const ticket = await ticketService.getTicketByChannelId(channelId);

    if (!ticket) {
      await interaction.editReply({
        content: '❌ チケットが見つかりません',
      });
      return;
    }

    const staffRoleId = env.STAFF_ROLE_ID;
    const isStaff = interaction.member?.roles?.cache?.has(staffRoleId);
    const isCreator = ticket.userId === interaction.user.id;

    if (!isStaff && !isCreator) {
      await interaction.editReply({
        content: '❌ チケットをクローズする権限がありません',
      });
      return;
    }

    // Update ticket status to closed
    await ticketService.closeTicket(channelId);

    await interaction.editReply({
      content: '✅ チケットをクローズします。このチャンネルは5秒後に削除されます。',
    });

    // Delete channel after delay
    setTimeout(async () => {
      try {
        const channel = await interaction.client.channels.fetch(channelId);
        if (channel && 'delete' in channel) {
          await channel.delete();

          logger.info('Ticket channel deleted', {
            ticketId: ticket.id,
            channelId,
            closedBy: interaction.user.id,
          });
        }
      } catch (error) {
        logger.error('Failed to delete ticket channel', {
          error: error instanceof Error ? error.message : String(error),
          channelId,
        });
      }
    }, 5000);
  } catch (error) {
    logger.error('Failed to close ticket', {
      error: error instanceof Error ? error.message : String(error),
      channelId,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: '❌ エラーが発生しました',
    });
  }
}
