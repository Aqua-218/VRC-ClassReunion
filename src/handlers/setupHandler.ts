import { ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from 'discord.js';
import { logger } from '../utils/logger';
import { createSetupInviteButton, createSetupTicketButton } from '../utils/embed';

/**
 * Handle /setup invite command
 * Posts persistent "Create Invitation" button in specified channel
 *
 * @param interaction - Command interaction
 */
export async function handleSetupInvite(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    // Check permissions
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '❌ この操作には管理者権限が必要です',
        ephemeral: true,
      });
      return;
    }

    const channel = interaction.options.getChannel('channel', true);

    if (!(channel instanceof TextChannel)) {
      await interaction.reply({
        content: '❌ テキストチャンネルを指定してください',
        ephemeral: true,
      });
      return;
    }

    // Create invitation button
    const button = createSetupInviteButton();

    // Post message with button
    const message = await channel.send({
      content: '**募集を作成**\n\n以下のボタンをクリックして、VRChatイベントの募集を作成できます。',
      components: [button],
    });

    await interaction.reply({
      content: `✅ 募集作成ボタンを${channel}に設置しました`,
      ephemeral: true,
    });

    logger.info('Setup invite button posted', {
      channelId: channel.id,
      messageId: message.id,
      userId: interaction.user.id,
    });
  } catch (error) {
    logger.error('Failed to setup invite button', {
      error: error instanceof Error ? error.message : String(error),
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: '❌ エラーが発生しました',
      ephemeral: true,
    });
  }
}

/**
 * Handle /setup ticket command
 * Posts persistent "Create Ticket" button in specified channel
 *
 * @param interaction - Command interaction
 */
export async function handleSetupTicket(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    // Check permissions
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '❌ この操作には管理者権限が必要です',
        ephemeral: true,
      });
      return;
    }

    const channel = interaction.options.getChannel('channel', true);

    if (!(channel instanceof TextChannel)) {
      await interaction.reply({
        content: '❌ テキストチャンネルを指定してください',
        ephemeral: true,
      });
      return;
    }

    // Create ticket button
    const button = createSetupTicketButton();

    // Post message with button
    const message = await channel.send({
      content:
        '**サポートチケット作成**\n\n質問やトラブルがある場合は、以下のボタンをクリックしてチケットを作成してください。',
      components: [button],
    });

    await interaction.reply({
      content: `✅ チケット作成ボタンを${channel}に設置しました`,
      ephemeral: true,
    });

    logger.info('Setup ticket button posted', {
      channelId: channel.id,
      messageId: message.id,
      userId: interaction.user.id,
    });
  } catch (error) {
    logger.error('Failed to setup ticket button', {
      error: error instanceof Error ? error.message : String(error),
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: '❌ エラーが発生しました',
      ephemeral: true,
    });
  }
}
