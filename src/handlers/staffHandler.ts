import {
  Client,
  TextChannel,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from 'discord.js';
import { logger } from '../utils/logger';
import { invitationService } from '../services/invitationService';
import { createInvitationEmbed } from '../utils/embed';

/**
 * Post staff notification for group instance invitations
 * Called after invitation is created with instanceType === 'group'
 *
 * @param client - Discord client
 * @param invitationId - Invitation ID
 */
export async function postStaffNotification(client: Client, invitationId: string): Promise<void> {
  try {
    const invitation = await invitationService.getInvitationById(invitationId);

    if (!invitation) {
      logger.error('Invitation not found for staff notification', { invitationId });
      return;
    }

    // Only for group instances
    if (invitation.instanceType !== 'group') {
      return;
    }

    // Get staff notification channel
    const staffChannelId = process.env['STAFF_CHANNEL_ID'];
    if (!staffChannelId) {
      logger.warn('STAFF_CHANNEL_ID not configured, skipping staff notification');
      return;
    }

    const staffChannel = await client.channels.fetch(staffChannelId);

    if (!staffChannel || !staffChannel.isTextBased()) {
      logger.error('Staff channel not found or not text-based', { staffChannelId });
      return;
    }

    // Create staff notification embed
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('🔔 新しいグループインスタンス募集')
      .setDescription(`${invitation.eventName}のスタッフアサインが必要です`)
      .addFields(
        { name: 'イベント名', value: invitation.eventName, inline: true },
        {
          name: '開始時刻',
          value: `<t:${Math.floor(invitation.startTime.getTime() / 1000)}:F>`,
          inline: true,
        },
        { name: '定員', value: `${invitation.maxParticipants}名`, inline: true },
        { name: '主催者', value: `<@${invitation.hostId}>`, inline: true },
        { name: 'ステータス', value: '未アサイン', inline: true }
      )
      .setFooter({ text: `募集ID: ${invitationId}` })
      .setTimestamp();

    // Create assign button
    const assignButton = new ButtonBuilder()
      .setCustomId(`staff_assign_${invitationId}`)
      .setLabel('担当する')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('✋');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(assignButton);

    // Post message
    const staffMessage = await (staffChannel as TextChannel).send({
      content: '@here グループインスタンスのスタッフアサインをお願いします',
      embeds: [embed],
      components: [row],
    });

    // Update invitation with staff message ID
    await invitationService.updateInvitation(invitationId, {
      staffMessageId: staffMessage.id,
    });

    logger.info('Staff notification posted', {
      invitationId,
      staffMessageId: staffMessage.id,
      staffChannelId,
    });
  } catch (error) {
    logger.error('Failed to post staff notification', {
      error: error instanceof Error ? error.message : String(error),
      invitationId,
    });
  }
}

/**
 * Update staff notification message
 * Called when staff is assigned or instance link is added
 *
 * @param client - Discord client
 * @param invitationId - Invitation ID
 */
export async function updateStaffNotification(client: Client, invitationId: string): Promise<void> {
  try {
    const invitation = await invitationService.getInvitationById(invitationId);

    if (!invitation || !invitation.staffMessageId) {
      return;
    }

    const staffChannelId = process.env['STAFF_CHANNEL_ID'];
    if (!staffChannelId) {
      return;
    }

    const staffChannel = await client.channels.fetch(staffChannelId);
    if (!staffChannel || !staffChannel.isTextBased()) {
      return;
    }

    const staffMessage = await (staffChannel as TextChannel).messages.fetch(
      invitation.staffMessageId
    );

    // Create updated embed
    const statusText = invitation.staffId
      ? invitation.instanceLink
        ? '✅ アサイン済み・リンク設定済み'
        : '⏳ アサイン済み・リンク待ち'
      : '❌ 未アサイン';

    const embed = new EmbedBuilder()
      .setColor(invitation.staffId ? 0x00ff00 : 0xff9900)
      .setTitle('🔔 グループインスタンス募集')
      .setDescription(`${invitation.eventName}のスタッフアサイン`)
      .addFields(
        { name: 'イベント名', value: invitation.eventName, inline: true },
        {
          name: '開始時刻',
          value: `<t:${Math.floor(invitation.startTime.getTime() / 1000)}:F>`,
          inline: true,
        },
        { name: '定員', value: `${invitation.maxParticipants}名`, inline: true },
        { name: '主催者', value: `<@${invitation.hostId}>`, inline: true },
        { name: 'ステータス', value: statusText, inline: true }
      )
      .setFooter({ text: `募集ID: ${invitationId}` })
      .setTimestamp();

    if (invitation.staffId) {
      embed.addFields({ name: '担当スタッフ', value: `<@${invitation.staffId}>`, inline: true });
    }

    if (invitation.instanceLink) {
      embed.addFields({
        name: 'インスタンスリンク',
        value: invitation.instanceLink,
        inline: false,
      });
    }

    // Update buttons based on state
    const components: ActionRowBuilder<ButtonBuilder>[] = [];

    if (!invitation.staffId) {
      // Still available for assignment
      const assignButton = new ButtonBuilder()
        .setCustomId(`staff_assign_${invitationId}`)
        .setLabel('担当する')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✋');

      components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(assignButton));
    } else if (!invitation.instanceLink) {
      // Assigned but no link yet - show add link button
      const addLinkButton = new ButtonBuilder()
        .setCustomId(`staff_add_link_${invitationId}`)
        .setLabel('インスタンスリンクを追加')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🔗');

      components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(addLinkButton));
    }

    await staffMessage.edit({
      embeds: [embed],
      components,
    });

    logger.info('Staff notification updated', {
      invitationId,
      assignedStaffId: invitation.staffId,
      hasInstanceLink: !!invitation.instanceLink,
    });
  } catch (error) {
    logger.error('Failed to update staff notification', {
      error: error instanceof Error ? error.message : String(error),
      invitationId,
    });
  }
}

/**
 * Update invitation message in forum thread
 *
 * @param client - Discord client
 * @param invitationId - Invitation ID
 */
export async function updateInvitationThreadMessage(
  client: Client,
  invitationId: string
): Promise<void> {
  try {
    const invitation = await invitationService.getInvitationById(invitationId);
    const participants = await invitationService.getParticipants(invitationId);

    if (!invitation) {
      return;
    }

    // Get the thread
    const thread = await client.channels.fetch(invitation.threadId);
    if (!thread || !thread.isThread()) {
      logger.error('Thread not found', { invitationId, threadId: invitation.threadId });
      return;
    }

    // Get the starter message
    const starterMessage = await thread.fetchStarterMessage();
    if (!starterMessage) {
      logger.error('Starter message not found', { invitationId, threadId: invitation.threadId });
      return;
    }

    // Update the embed
    const updatedEmbed = createInvitationEmbed(invitation, participants);

    await starterMessage.edit({
      embeds: [updatedEmbed],
    });

    logger.info('Invitation thread message updated', {
      invitationId,
      threadId: invitation.threadId,
    });
  } catch (error) {
    logger.error('Failed to update invitation thread message', {
      error: error instanceof Error ? error.message : String(error),
      invitationId,
    });
  }
}
