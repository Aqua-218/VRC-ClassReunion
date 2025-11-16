import { ModalSubmitInteraction, ForumChannel, ThreadChannel } from 'discord.js';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { invitationService } from '../services/invitationService';
import {
  InvitationCreateSchema,
  InvitationCreateInput,
  EventTag,
  InstanceType,
} from '../types/validation';
import { createInvitationEmbed, createInvitationButtons, createHostButtons } from '../utils/embed';

/**
 * Handle invitation creation modal submission
 * Validates input, creates forum thread, saves to database
 *
 * @param interaction - Modal submit interaction
 */
export async function handleInvitationCreate(interaction: ModalSubmitInteraction): Promise<void> {
  try {
    // Defer reply to prevent timeout
    await interaction.deferReply({ ephemeral: true });

    // Extract form data from modal
    const eventName = interaction.fields.getTextInputValue('event_name');
    const startTime = interaction.fields.getTextInputValue('start_time');
    const endTime = interaction.fields.getTextInputValue('end_time');
    const worldName = interaction.fields.getTextInputValue('world_name');
    const description = interaction.fields.getTextInputValue('description');

    // For simplicity, collect additional details in follow-up (or use a second modal)
    // For now, use default values
    const worldLink = ''; // Optional
    const tag: EventTag = 'その他'; // Default, should be from select menu
    const instanceType: InstanceType = 'public'; // Default, should be from select menu
    const vrchatProfile = ''; // Optional, required for friend/friendplus
    const maxParticipants = 20; // Default, should be from input

    // Construct invitation data
    const invitationData: InvitationCreateInput = {
      eventName,
      startTime,
      endTime,
      worldName,
      worldLink: worldLink || undefined,
      tag,
      description,
      instanceType,
      vrchatProfile: vrchatProfile || undefined,
      maxParticipants,
    };

    // Validate data
    const validationResult = InvitationCreateSchema.safeParse(invitationData);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      await interaction.editReply({
        content: `❌ 入力内容にエラーがあります:\n${errors.join('\n')}`,
      });
      logger.warn('Invitation validation failed', {
        userId: interaction.user.id,
        errors,
      });
      return;
    }

    // Get forum channel
    const forumChannel = await interaction.client.channels.fetch(env.INVITATION_FORUM_CHANNEL_ID);

    if (!forumChannel || !(forumChannel instanceof ForumChannel)) {
      await interaction.editReply({
        content: '❌ フォーラムチャンネルが見つかりません。管理者に連絡してください。',
      });
      logger.error('Forum channel not found or invalid type', {
        channelId: env.INVITATION_FORUM_CHANNEL_ID,
      });
      return;
    }

    // Create forum thread
    const thread = await createForumThread(
      forumChannel,
      validationResult.data,
      interaction.user.id,
      interaction.user.displayName
    );

    if (!thread) {
      await interaction.editReply({
        content: '❌ スレッドの作成に失敗しました。もう一度お試しください。',
      });
      return;
    }

    // Success response
    await interaction.editReply({
      content: `✅ 募集を作成しました!\n${thread.url}`,
    });

    logger.info('Invitation created successfully', {
      invitationId: thread.id,
      eventName: validationResult.data.eventName,
      hostId: interaction.user.id,
      threadUrl: thread.url,
    });
  } catch (error) {
    logger.error('Failed to create invitation', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: '❌ エラーが発生しました。もう一度お試しください。',
    });
  }
}

/**
 * Create forum thread for invitation
 *
 * @param forumChannel - Forum channel to create thread in
 * @param data - Validated invitation data
 * @param hostId - Host user ID
 * @param hostName - Host user display name
 * @returns Created thread or null on failure
 */
async function createForumThread(
  forumChannel: ForumChannel,
  data: InvitationCreateInput,
  hostId: string,
  hostName: string
): Promise<ThreadChannel | null> {
  try {
    // Find or create appropriate tag
    const tagId = findForumTag(forumChannel, data.tag);

    // Create initial embed (without participants)
    const embed = createInvitationEmbed(
      {
        id: 'temp', // Will be replaced with actual message ID
        threadId: 'temp',
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
        staffId: null,
        staffName: null,
        instanceLink: null,
        staffMessageId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      []
    );

    // Create buttons
    const participantButtons = createInvitationButtons('temp', 'recruiting', false);
    const hostButtons = createHostButtons('temp', 'recruiting');

    // Create thread with initial message
    const thread = await forumChannel.threads.create({
      name: data.eventName,
      message: {
        embeds: [embed],
        components: [participantButtons, hostButtons],
      },
      appliedTags: tagId ? [tagId] : [],
      reason: `Event invitation created by ${hostName}`,
    });

    // Get the initial message (starter message)
    const starterMessage = await thread.fetchStarterMessage();

    if (!starterMessage) {
      logger.error('Failed to fetch starter message', { threadId: thread.id });
      await thread.delete('Failed to initialize invitation');
      return null;
    }

    // Update buttons with actual message ID
    const updatedParticipantButtons = createInvitationButtons(
      starterMessage.id,
      'recruiting',
      false
    );
    const updatedHostButtons = createHostButtons(starterMessage.id, 'recruiting');

    await starterMessage.edit({
      components: [updatedParticipantButtons, updatedHostButtons],
    });

    // Save to database
    await invitationService.createInvitation(starterMessage.id, thread.id, hostId, hostName, data);

    logger.info('Forum thread created', {
      threadId: thread.id,
      messageId: starterMessage.id,
      eventName: data.eventName,
    });

    return thread;
  } catch (error) {
    logger.error('Failed to create forum thread', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
}

/**
 * Find forum tag ID by name
 *
 * @param forumChannel - Forum channel
 * @param tagName - Tag name to find
 * @returns Tag ID or null if not found
 */
function findForumTag(forumChannel: ForumChannel, tagName: string): string | null {
  const tag = forumChannel.availableTags.find(
    (t) => t.name.toLowerCase() === tagName.toLowerCase()
  );
  return tag?.id ?? null;
}
