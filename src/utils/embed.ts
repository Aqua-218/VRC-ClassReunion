import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Invitation, Participant } from '@prisma/client';
import { format } from 'date-fns';
import ja from 'date-fns/locale/ja';

/**
 * Tag to emoji mapping for visual representation
 */
const TAG_EMOJI: Record<string, string> = {
  観光: '🗺️',
  ゲーム: '🎮',
  まったり: '☕',
  撮影会: '📸',
  イベント: '🎉',
  その他: '📝',
};

/**
 * Instance type to display name mapping
 */
const INSTANCE_TYPE_DISPLAY: Record<string, string> = {
  group: 'Group',
  friend: 'Friend',
  friendplus: 'Friend+',
  public: 'Public',
};

/**
 * Status to emoji mapping
 */
const STATUS_EMOJI: Record<string, string> = {
  recruiting: '🟢',
  full: '🔴',
  completed: '⚫',
  cancelled: '❌',
};

/**
 * Status to display name mapping
 */
const STATUS_DISPLAY: Record<string, string> = {
  recruiting: '募集中',
  full: '満員',
  completed: '終了',
  cancelled: 'キャンセル',
};

/**
 * Create invitation embed
 * Generates a rich embed message displaying invitation details
 *
 * @param invitation - Invitation record
 * @param participants - Array of participant records
 * @returns EmbedBuilder instance
 */
export function createInvitationEmbed(
  invitation: Invitation,
  participants: Participant[]
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`${TAG_EMOJI[invitation.tag] ?? '📝'} ${invitation.eventName}`)
    .setDescription(invitation.description)
    .setColor(getEmbedColor(invitation.status));

  // Event time information
  const startTimeFormatted = format(invitation.startTime, 'M月d日(E) HH:mm', { locale: ja });
  const endTimeFormatted = format(invitation.endTime, 'HH:mm', { locale: ja });

  embed.addFields({
    name: '⏰ 開催日時',
    value: `${startTimeFormatted} ~ ${endTimeFormatted}`,
    inline: false,
  });

  // World information
  const worldValue = invitation.worldLink
    ? `[${invitation.worldName}](${invitation.worldLink})`
    : invitation.worldName;

  embed.addFields({
    name: '🌍 ワールド',
    value: worldValue,
    inline: false,
  });

  // Instance type
  embed.addFields({
    name: '🔒 インスタンスタイプ',
    value: INSTANCE_TYPE_DISPLAY[invitation.instanceType] ?? invitation.instanceType,
    inline: true,
  });

  // Participant count
  const joinedParticipants = participants.filter((p) => p.status === 'joined');
  const interestedParticipants = participants.filter((p) => p.status === 'interested');

  embed.addFields({
    name: '👥 参加者',
    value: `${joinedParticipants.length}/${invitation.maxParticipants}`,
    inline: true,
  });

  // Status
  const statusEmoji = STATUS_EMOJI[invitation.status] ?? '⚪';
  const statusDisplay = STATUS_DISPLAY[invitation.status] ?? invitation.status;

  embed.addFields({
    name: '📊 ステータス',
    value: `${statusEmoji} ${statusDisplay}`,
    inline: true,
  });

  // Joined participants list
  if (joinedParticipants.length > 0) {
    const joinedList = joinedParticipants.map((p) => `• ${p.userName}`).join('\n');
    embed.addFields({
      name: '✅ 参加確定',
      value: joinedList.length > 1024 ? joinedList.substring(0, 1021) + '...' : joinedList,
      inline: false,
    });
  }

  // Interested participants list
  if (interestedParticipants.length > 0) {
    const interestedList = interestedParticipants.map((p) => `• ${p.userName}`).join('\n');
    embed.addFields({
      name: '💭 興味あり',
      value:
        interestedList.length > 1024 ? interestedList.substring(0, 1021) + '...' : interestedList,
      inline: false,
    });
  }

  // Staff assignment (for group instances)
  if (invitation.instanceType === 'group' && invitation.staffName) {
    embed.addFields({
      name: '👤 担当スタッフ',
      value: invitation.staffName,
      inline: false,
    });
  }

  // Instance link (if available)
  if (invitation.instanceLink) {
    embed.addFields({
      name: '🔗 インスタンスリンク',
      value: `[クリックして参加](${invitation.instanceLink})`,
      inline: false,
    });
  }

  // Host information
  embed.setFooter({
    text: `主催: ${invitation.hostName}`,
  });

  // Timestamp
  embed.setTimestamp(invitation.createdAt);

  return embed;
}

/**
 * Create action buttons for invitation
 * Generates button row with Join, Interested, and Cancel actions
 *
 * @param invitationId - Invitation ID
 * @param status - Current invitation status
 * @param isFull - Whether invitation is at max capacity
 * @returns ActionRowBuilder with buttons
 */
export function createInvitationButtons(
  invitationId: string,
  status: string,
  isFull: boolean
): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();

  // Determine if buttons should be disabled
  const isDisabled = status === 'completed' || status === 'cancelled';

  // Join button
  const joinButton = new ButtonBuilder()
    .setCustomId(`invite_join_${invitationId}`)
    .setLabel('参加する')
    .setStyle(ButtonStyle.Success)
    .setEmoji('✅')
    .setDisabled(isDisabled || isFull);

  // Interested button
  const interestedButton = new ButtonBuilder()
    .setCustomId(`invite_interested_${invitationId}`)
    .setLabel('興味あり')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('💭')
    .setDisabled(isDisabled);

  // Cancel participation button
  const cancelButton = new ButtonBuilder()
    .setCustomId(`invite_cancel_${invitationId}`)
    .setLabel('キャンセル')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('❌')
    .setDisabled(isDisabled);

  row.addComponents(joinButton, interestedButton, cancelButton);

  return row;
}

/**
 * Create host action buttons
 * Generates button row with Edit and Cancel Invitation actions (host only)
 *
 * @param invitationId - Invitation ID
 * @param status - Current invitation status
 * @returns ActionRowBuilder with buttons
 */
export function createHostButtons(
  invitationId: string,
  status: string
): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();

  const isDisabled = status === 'completed' || status === 'cancelled';

  // Edit button
  const editButton = new ButtonBuilder()
    .setCustomId(`invite_edit_${invitationId}`)
    .setLabel('編集')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('✏️')
    .setDisabled(isDisabled);

  // Cancel invitation button
  const cancelInviteButton = new ButtonBuilder()
    .setCustomId(`invite_cancel_event_${invitationId}`)
    .setLabel('募集をキャンセル')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('🗑️')
    .setDisabled(isDisabled);

  row.addComponents(editButton, cancelInviteButton);

  return row;
}

/**
 * Get embed color based on status
 *
 * @param status - Invitation status
 * @returns Color code
 */
function getEmbedColor(status: string): number {
  switch (status) {
    case 'recruiting':
      return 0x5865f2; // Blurple
    case 'full':
      return 0xed4245; // Red
    case 'completed':
      return 0x57f287; // Green
    case 'cancelled':
      return 0x747f8d; // Gray
    default:
      return 0x5865f2; // Default blurple
  }
}

/**
 * Create staff notification embed
 * Used to notify staff about group instance invitations
 *
 * @param invitation - Invitation record
 * @returns EmbedBuilder instance
 */
export function createStaffNotificationEmbed(invitation: Invitation): EmbedBuilder {
  const startTimeFormatted = format(invitation.startTime, 'M月d日(E) HH:mm', { locale: ja });

  const embed = new EmbedBuilder()
    .setTitle('🔔 Groupインスタンス募集')
    .setDescription(
      `新しいGroupインスタンスの募集が作成されました。\n担当スタッフを割り当ててください。`
    )
    .setColor(0xfee75c) // Yellow
    .addFields(
      {
        name: 'イベント名',
        value: invitation.eventName,
        inline: false,
      },
      {
        name: '開催日時',
        value: startTimeFormatted,
        inline: true,
      },
      {
        name: 'ワールド',
        value: invitation.worldName,
        inline: true,
      },
      {
        name: '主催者',
        value: invitation.hostName,
        inline: true,
      }
    )
    .setTimestamp();

  return embed;
}

/**
 * Create staff assignment button
 *
 * @param invitationId - Invitation ID
 * @param isAssigned - Whether staff is already assigned
 * @returns ActionRowBuilder with button
 */
export function createStaffAssignButton(
  invitationId: string,
  isAssigned: boolean
): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();

  const button = new ButtonBuilder()
    .setCustomId(`staff_assign_${invitationId}`)
    .setLabel(isAssigned ? '担当済み' : '担当する')
    .setStyle(isAssigned ? ButtonStyle.Secondary : ButtonStyle.Primary)
    .setEmoji('👤')
    .setDisabled(isAssigned);

  row.addComponents(button);

  return row;
}

/**
 * Create setup invitation button
 * Button for /setup invite command
 *
 * @returns ActionRowBuilder with button
 */
export function createSetupInviteButton(): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();

  const button = new ButtonBuilder()
    .setCustomId('invitation_create')
    .setLabel('募集を作成')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('📝');

  row.addComponents(button);

  return row;
}

/**
 * Create setup ticket button
 * Button for /setup ticket command
 *
 * @returns ActionRowBuilder with button
 */
export function createSetupTicketButton(): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();

  const button = new ButtonBuilder()
    .setCustomId('ticket_create')
    .setLabel('チケットを作成')
    .setStyle(ButtonStyle.Success)
    .setEmoji('🎫');

  row.addComponents(button);

  return row;
}
