import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

/**
 * Create invitation modal
 * Modal for collecting all invitation details from the host
 *
 * @returns ModalBuilder instance
 */
export function createInvitationModal(): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId('invitation_create_modal')
    .setTitle('新規イベント募集を作成');

  // Event name input
  const eventNameInput = new TextInputBuilder()
    .setCustomId('event_name')
    .setLabel('イベント名')
    .setPlaceholder('例: みんなでワールド巡り')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(200);

  // Start time input
  const startTimeInput = new TextInputBuilder()
    .setCustomId('start_time')
    .setLabel('開始時刻')
    .setPlaceholder('例: 2024-01-01T20:00 (YYYY-MM-DDTHH:MM形式)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  // End time input
  const endTimeInput = new TextInputBuilder()
    .setCustomId('end_time')
    .setLabel('終了時刻')
    .setPlaceholder('例: 2024-01-01T23:00 (YYYY-MM-DDTHH:MM形式)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  // World name input
  const worldNameInput = new TextInputBuilder()
    .setCustomId('world_name')
    .setLabel('ワールド名')
    .setPlaceholder('例: The Great Pug')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(200);

  // Description input
  const descriptionInput = new TextInputBuilder()
    .setCustomId('description')
    .setLabel('説明')
    .setPlaceholder('イベントの詳細を記入してください')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(2000);

  // Add inputs to action rows
  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(eventNameInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(startTimeInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(endTimeInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(worldNameInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput)
  );

  return modal;
}

/**
 * Create invitation details modal (page 2)
 * Second modal for collecting additional details
 *
 * @returns ModalBuilder instance
 */
export function createInvitationDetailsModal(): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId('invitation_details_modal')
    .setTitle('イベント詳細設定');

  // World link input (optional)
  const worldLinkInput = new TextInputBuilder()
    .setCustomId('world_link')
    .setLabel('ワールドリンク (任意)')
    .setPlaceholder('https://vrchat.com/home/world/wrld_xxxxx')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(500);

  // Tag input
  const tagInput = new TextInputBuilder()
    .setCustomId('tag')
    .setLabel('カテゴリ')
    .setPlaceholder('観光/ゲーム/まったり/撮影会/イベント/その他')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(50);

  // Instance type input
  const instanceTypeInput = new TextInputBuilder()
    .setCustomId('instance_type')
    .setLabel('インスタンスタイプ')
    .setPlaceholder('group/friend/friendplus/public')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(20);

  // VRChat profile input (conditional)
  const vrchatProfileInput = new TextInputBuilder()
    .setCustomId('vrchat_profile')
    .setLabel('VRChatプロフィールURL (friend/friendplus用)')
    .setPlaceholder('https://vrchat.com/home/user/usr_xxxxx')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(500);

  // Max participants input
  const maxParticipantsInput = new TextInputBuilder()
    .setCustomId('max_participants')
    .setLabel('最大参加人数')
    .setPlaceholder('例: 20 (1-100)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(3);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(worldLinkInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(tagInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(instanceTypeInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(vrchatProfileInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(maxParticipantsInput)
  );

  return modal;
}

/**
 * Create edit invitation modal
 * Pre-filled modal for editing existing invitation
 * Note: Discord modals don't support pre-filling values
 * Current values should be stored in cache and merged on submit
 *
 * @returns ModalBuilder instance
 */
export function createEditInvitationModal(): ModalBuilder {
  const modal = createInvitationModal();
  modal.setCustomId('invitation_edit_modal');
  modal.setTitle('イベント募集を編集');

  return modal;
}

/**
 * Create instance link modal
 * Modal for staff to input instance link
 *
 * @param invitationId - Invitation ID
 * @returns ModalBuilder instance
 */
export function createInstanceLinkModal(invitationId: string): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId(`instance_link_modal_${invitationId}`)
    .setTitle('インスタンスリンクを入力');

  const instanceLinkInput = new TextInputBuilder()
    .setCustomId('instance_link')
    .setLabel('インスタンスリンク')
    .setPlaceholder('VRChatのインスタンスリンクを貼り付けてください')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(500);

  const notesInput = new TextInputBuilder()
    .setCustomId('notes')
    .setLabel('補足 (任意)')
    .setPlaceholder('参加者への追加メッセージがあれば記入してください')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setMaxLength(1000);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(instanceLinkInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(notesInput)
  );

  return modal;
}

/**
 * Create ticket modal
 * Modal for creating a support ticket
 *
 * @returns ModalBuilder instance
 */
export function createTicketModal(): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId('ticket_create_modal')
    .setTitle('サポートチケット作成');

  const categoryInput = new TextInputBuilder()
    .setCustomId('category')
    .setLabel('カテゴリ')
    .setPlaceholder('question/trouble/other')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(50);

  const descriptionInput = new TextInputBuilder()
    .setCustomId('description')
    .setLabel('内容')
    .setPlaceholder('問題や質問の詳細を記入してください')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(2000);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(categoryInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput)
  );

  return modal;
}
