import { z } from 'zod';

/**
 * Instance type enum for VRChat
 * Represents the access level of a VRChat instance
 */
export const InstanceType = z.enum(['group', 'friend', 'friendplus', 'public']);
export type InstanceType = z.infer<typeof InstanceType>;

/**
 * Event category/tag enum
 * Categories for classifying events
 */
export const EventTag = z.enum(['観光', 'ゲーム', 'まったり', '撮影会', 'イベント', 'その他']);
export type EventTag = z.infer<typeof EventTag>;

/**
 * Invitation status enum
 */
export const InvitationStatus = z.enum(['recruiting', 'full', 'completed', 'cancelled']);
export type InvitationStatus = z.infer<typeof InvitationStatus>;

/**
 * Participant status enum
 */
export const ParticipantStatus = z.enum(['joined', 'interested']);
export type ParticipantStatus = z.infer<typeof ParticipantStatus>;

/**
 * VRChat world URL validation
 * Must match VRChat world URL pattern
 */
const vrchatWorldUrl = z
  .string()
  .url('有効なURLを入力してください')
  .regex(
    /^https:\/\/vrchat\.com\/home\/world\/wrld_[a-zA-Z0-9-]+$/,
    'VRChatのワールドURLを入力してください (例: https://vrchat.com/home/world/wrld_xxxxx)'
  )
  .optional()
  .or(z.literal(''));

/**
 * VRChat profile URL validation
 * Must match VRChat user profile URL pattern
 */
const vrchatProfileUrl = z
  .string()
  .url('有効なURLを入力してください')
  .regex(
    /^https:\/\/vrchat\.com\/home\/user\/usr_[a-zA-Z0-9-]+$/,
    'VRChatのプロフィールURLを入力してください (例: https://vrchat.com/home/user/usr_xxxxx)'
  )
  .min(1, 'VRChatプロフィールURLは必須です');

/**
 * DateTime validation
 * Must be a valid ISO 8601 datetime string
 */
const dateTimeString = z
  .string()
  .min(1, '日時を入力してください')
  .refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: '有効な日時を入力してください (例: 2024-01-01T12:00)' }
  );

/**
 * Invitation creation validation schema
 * Validates all required fields for creating a new invitation
 */
export const InvitationCreateSchema = z
  .object({
    // Event details
    eventName: z
      .string()
      .min(1, 'イベント名は必須です')
      .max(200, 'イベント名は200文字以内で入力してください')
      .regex(/^[^\n\r]+$/, 'イベント名に改行を含めることはできません'),

    startTime: dateTimeString,

    endTime: dateTimeString,

    worldName: z
      .string()
      .min(1, 'ワールド名は必須です')
      .max(200, 'ワールド名は200文字以内で入力してください'),

    worldLink: vrchatWorldUrl,

    tag: EventTag,

    description: z
      .string()
      .min(1, '説明は必須です')
      .max(2000, '説明は2000文字以内で入力してください'),

    // VRChat instance settings
    instanceType: InstanceType,

    vrchatProfile: z.string().optional(), // Conditional validation applied below

    maxParticipants: z
      .number()
      .int('整数を入力してください')
      .min(1, '最大参加者数は1以上である必要があります')
      .max(100, '最大参加者数は100以下である必要があります'),
  })
  .superRefine((data, ctx) => {
    // Validate startTime < endTime
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (start >= end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '終了時刻は開始時刻より後である必要があります',
        path: ['endTime'],
      });
    }

    // Validate vrchatProfile is required for friend/friendplus instances
    if (
      (data.instanceType === 'friend' || data.instanceType === 'friendplus') &&
      !data.vrchatProfile
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Friend/Friend+インスタンスの場合、VRChatプロフィールURLは必須です',
        path: ['vrchatProfile'],
      });
    }

    // Validate vrchatProfile format if provided
    if (data.vrchatProfile) {
      const result = vrchatProfileUrl.safeParse(data.vrchatProfile);
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.error.errors[0]?.message ?? 'VRChatプロフィールURLが無効です',
          path: ['vrchatProfile'],
        });
      }
    }
  });

export type InvitationCreateInput = z.infer<typeof InvitationCreateSchema>;

/**
 * Invitation update validation schema
 * Similar to create but allows partial updates
 */
export const InvitationUpdateSchema = z
  .object({
    eventName: z
      .string()
      .min(1, 'イベント名は必須です')
      .max(200, 'イベント名は200文字以内で入力してください')
      .regex(/^[^\n\r]+$/, 'イベント名に改行を含めることはできません')
      .optional(),

    startTime: dateTimeString.optional(),

    endTime: dateTimeString.optional(),

    worldName: z
      .string()
      .min(1, 'ワールド名は必須です')
      .max(200, 'ワールド名は200文字以内で入力してください')
      .optional(),

    worldLink: vrchatWorldUrl.optional(),

    tag: EventTag.optional(),

    description: z
      .string()
      .min(1, '説明は必須です')
      .max(2000, '説明は2000文字以内で入力してください')
      .optional(),

    instanceType: InstanceType.optional(),

    vrchatProfile: z.string().optional(),

    maxParticipants: z
      .number()
      .int('整数を入力してください')
      .min(1, '最大参加者数は1以上である必要があります')
      .max(100, '最大参加者数は100以下である必要があります')
      .optional(),

    staffMessageId: z.string().optional(),
    instanceLink: z.string().optional(),
    staffId: z.string().optional(),
    staffName: z.string().optional(),
    status: InvitationStatus.optional(),
  })
  .refine(
    (data) => {
      // If both times are provided, validate startTime < endTime
      if (data.startTime && data.endTime) {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        return start < end;
      }
      return true;
    },
    {
      message: '終了時刻は開始時刻より後である必要があります',
      path: ['endTime'],
    }
  );

export type InvitationUpdateInput = z.infer<typeof InvitationUpdateSchema>;

/**
 * Participant creation validation schema
 */
export const ParticipantCreateSchema = z.object({
  invitationId: z.string().min(1),
  userId: z.string().min(1),
  userName: z.string().min(1).max(100),
  status: ParticipantStatus,
});

export type ParticipantCreateInput = z.infer<typeof ParticipantCreateSchema>;
