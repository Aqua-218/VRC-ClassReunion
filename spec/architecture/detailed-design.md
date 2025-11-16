# アーキテクチャ詳細設計

## 1. コンポーネント仕様

### 1.1 プレゼンテーション層

#### Discord Interactions Manager
```typescript
/**
 * Discord Interactionの統一ハンドラー
 */
export class InteractionManager {
  private handlers: Map<string, InteractionHandler>;
  
  constructor(private client: Client) {
    this.handlers = new Map();
  }
  
  /**
   * インタラクションハンドラーの登録
   */
  register(handler: InteractionHandler): void {
    this.handlers.set(handler.customId, handler);
  }
  
  /**
   * インタラクション処理の委譲
   */
  async handle(interaction: Interaction): Promise<void> {
    const customId = this.extractCustomId(interaction);
    const handler = this.handlers.get(customId);
    
    if (!handler) {
      throw new NotFoundError(`Handler not found: ${customId}`);
    }
    
    await handler.execute(interaction);
  }
}
```

#### Command Handlers
- `/invite create` - お誘い募集作成モーダル表示
- `/invite staff-notify` - スタッフ通知送信
- `/ticket create` - チケット作成モーダル表示

#### Button Handlers
- `invite_join_{invitationId}` - 参加ボタン
- `invite_interested_{invitationId}` - 気になる!ボタン
- `invite_cancel_{invitationId}` - キャンセルボタン
- `ticket_close_{ticketId}` - チケットクローズボタン

#### Modal Handlers
- `invite_modal` - お誘い募集作成フォーム
- `staff_notify_modal` - スタッフ通知フォーム
- `ticket_modal` - チケット作成フォーム

---

### 1.2 アプリケーション層

#### Invitation Service
```typescript
export class InvitationService {
  constructor(
    private invitationRepo: InvitationRepository,
    private participantRepo: ParticipantRepository,
    private eventBus: EventBus
  ) {}
  
  /**
   * お誘い募集の作成
   */
  async create(dto: CreateInvitationDto): Promise<Invitation> {
    // バリデーション
    InvitationValidator.validate(dto);
    
    // ビジネスロジック実行
    const invitation = InvitationFactory.create(dto);
    await this.invitationRepo.save(invitation);
    
    // イベント発行
    this.eventBus.publish(new InvitationCreatedEvent(invitation));
    
    return invitation;
  }
  
  /**
   * 参加処理
   */
  async join(invitationId: string, userId: string): Promise<void> {
    const invitation = await this.invitationRepo.findById(invitationId);
    if (!invitation) throw new NotFoundError('Invitation not found');
    
    // 定員チェック
    invitation.checkCapacity();
    
    // 参加者追加
    const participant = new Participant({
      invitationId,
      userId,
      status: 'joined',
    });
    await this.participantRepo.save(participant);
    
    // ステータス更新
    if (invitation.isFull()) {
      invitation.markAsFull();
      await this.invitationRepo.save(invitation);
      this.eventBus.publish(new InvitationFullEvent(invitation));
    }
  }
}
```

#### Ticket Service
```typescript
export class TicketService {
  constructor(
    private ticketRepo: TicketRepository,
    private discordService: DiscordService,
    private eventBus: EventBus
  ) {}
  
  /**
   * チケット作成
   */
  async create(dto: CreateTicketDto): Promise<Ticket> {
    // チケット作成
    const ticket = TicketFactory.create(dto);
    await this.ticketRepo.save(ticket);
    
    // Discordチャンネル作成
    const channel = await this.discordService.createTicketChannel(ticket);
    ticket.id = channel.id;
    await this.ticketRepo.save(ticket);
    
    this.eventBus.publish(new TicketCreatedEvent(ticket));
    return ticket;
  }
  
  /**
   * チケットクローズ
   */
  async close(ticketId: string): Promise<void> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket not found');
    
    ticket.close();
    await this.ticketRepo.save(ticket);
    await this.discordService.archiveChannel(ticketId);
    
    this.eventBus.publish(new TicketClosedEvent(ticket));
  }
}
```

---

### 1.3 ビジネスロジック層

#### Invitation Entity
```typescript
export class Invitation {
  readonly id: string;
  readonly threadId: string;
  readonly hostId: string;
  readonly eventName: string;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly maxParticipants: number;
  private _status: InvitationStatus;
  private _participants: Participant[];
  
  constructor(data: InvitationData) {
    this.id = data.id;
    // ... その他プロパティ初期化
    this._status = data.status || 'recruiting';
    this._participants = data.participants || [];
  }
  
  /**
   * 定員チェック
   */
  checkCapacity(): void {
    if (this.isFull()) {
      throw new BusinessRuleViolationError('募集は既に定員に達しています');
    }
  }
  
  /**
   * 定員判定
   */
  isFull(): boolean {
    const joinedCount = this._participants.filter(p => p.status === 'joined').length;
    return joinedCount >= this.maxParticipants;
  }
  
  /**
   * 定員到達としてマーク
   */
  markAsFull(): void {
    this._status = 'full';
  }
  
  /**
   * 開催済みとしてマーク
   */
  markAsCompleted(): void {
    this._status = 'completed';
  }
  
  /**
   * 開催時刻を過ぎているか
   */
  isPastEvent(): boolean {
    return this.endTime < new Date();
  }
}
```

#### Validation Rules
```typescript
export class InvitationValidator {
  static validate(dto: CreateInvitationDto): void {
    // イベント名検証
    if (!dto.eventName || dto.eventName.length > 200) {
      throw new ValidationError('イベント名は1〜200文字で入力してください');
    }
    
    // 時刻検証
    const now = new Date();
    if (dto.startTime <= now) {
      throw new ValidationError('開始時刻は未来の日時を指定してください');
    }
    if (dto.endTime <= dto.startTime) {
      throw new ValidationError('終了時刻は開始時刻より後に設定してください');
    }
    
    // 定員検証
    if (dto.maxParticipants < 1 || dto.maxParticipants > 100) {
      throw new ValidationError('定員は1〜100人の範囲で指定してください');
    }
  }
}
```

---

### 1.4 データアクセス層

#### Invitation Repository
```typescript
export class InvitationRepository {
  constructor(private prisma: PrismaClient) {}
  
  async save(invitation: Invitation): Promise<void> {
    await this.prisma.invitation.upsert({
      where: { id: invitation.id },
      create: invitation.toPrismaData(),
      update: invitation.toPrismaData(),
    });
  }
  
  async findById(id: string): Promise<Invitation | null> {
    const data = await this.prisma.invitation.findUnique({
      where: { id },
      include: { participants: true },
    });
    return data ? Invitation.fromPrisma(data) : null;
  }
  
  async findByStatus(status: InvitationStatus): Promise<Invitation[]> {
    const data = await this.prisma.invitation.findMany({
      where: { status },
      include: { participants: true },
    });
    return data.map(Invitation.fromPrisma);
  }
  
  async findPastEvents(threshold: Date): Promise<Invitation[]> {
    const data = await this.prisma.invitation.findMany({
      where: {
        endTime: { lt: threshold },
        status: { not: 'completed' },
      },
      include: { participants: true },
    });
    return data.map(Invitation.fromPrisma);
  }
}
```

---

## 2. データモデル

### 2.1 DTO (Data Transfer Objects)

```typescript
/**
 * お誘い募集作成DTO
 */
export interface CreateInvitationDto {
  hostId: string;
  hostName: string;
  eventName: string;
  startTime: Date;
  endTime: Date;
  worldName: string;
  worldLink?: string;
  tag: string;
  description: string;
  instanceType: 'group' | 'friend' | 'friendplus' | 'public';
  vrchatProfile?: string;
  maxParticipants: number;
}

/**
 * スタッフ通知DTO
 */
export interface StaffNotifyDto {
  invitationId: string;
  instanceLink: string;
}

/**
 * チケット作成DTO
 */
export interface CreateTicketDto {
  userId: string;
  userName: string;
  category: 'question' | 'trouble' | 'other';
}
```

### 2.2 Value Objects

```typescript
/**
 * タイムスタンプ値オブジェクト
 */
export class EventTimeRange {
  constructor(
    public readonly startTime: Date,
    public readonly endTime: Date
  ) {
    if (endTime <= startTime) {
      throw new ValidationError('終了時刻は開始時刻より後に設定してください');
    }
  }
  
  isPast(): boolean {
    return this.endTime < new Date();
  }
  
  getDurationHours(): number {
    return (this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60 * 60);
  }
}

/**
 * インスタンスタイプ値オブジェクト
 */
export class InstanceType {
  private static readonly VALID_TYPES = ['group', 'friend', 'friendplus', 'public'] as const;
  
  constructor(public readonly value: typeof InstanceType.VALID_TYPES[number]) {
    if (!InstanceType.VALID_TYPES.includes(value)) {
      throw new ValidationError(`無効なインスタンスタイプ: ${value}`);
    }
  }
  
  get displayName(): string {
    const names = {
      group: 'Group',
      friend: 'Friends',
      friendplus: 'Friends+',
      public: 'Public',
    };
    return names[this.value];
  }
}
```

---

## 3. ビジネスロジック

### 3.1 募集管理フロー

```
[ユーザー] --(/invite create)--> [InteractionManager]
                                         |
                                         v
                                  [InvitationService.create]
                                         |
                                         v
                                  [InvitationValidator]
                                         |
                                         v
                                  [InvitationFactory]
                                         |
                                         v
                                  [InvitationRepository.save]
                                         |
                                         v
                                  [EventBus.publish(InvitationCreatedEvent)]
                                         |
                                         v
                                  [DiscordService.createForumThread]
```

### 3.2 参加処理フロー

```
[ユーザー] --(invite_join_XXX)--> [InteractionManager]
                                         |
                                         v
                                  [InvitationService.join]
                                         |
                                         v
                                  [Invitation.checkCapacity]
                                         |
                                         v
                                  [ParticipantRepository.save]
                                         |
                                         v
                                  [Invitation.isFull?]
                                    /           \
                                   /             \
                                 Yes              No
                                  |                |
                                  v                v
                    [markAsFull + publish]    [終了]
                                  |
                                  v
                    [DiscordService.updateThreadTags]
```

### 3.3 自動クローズロジック

```
[Cron Scheduler] --(毎時)--> [AutoCloseJob.execute]
                                         |
                                         v
                            [InvitationRepo.findPastEvents]
                                         |
                                         v
                            [forEach invitation]
                                         |
                                         v
                            [invitation.markAsCompleted]
                                         |
                                         v
                            [InvitationRepo.save]
                                         |
                                         v
                            [DiscordService.updateThreadTags]
                                         |
                                         v
                            [DiscordService.archiveThread]
```

---

## 4. 状態管理

### 4.1 Invitationステート遷移

```
[recruiting] --定員到達--> [full]
     |                        |
     +----開催終了----+       |
                      v       v
                  [completed]
                      
[recruiting] --ホスト操作--> [cancelled]
```

### 4.2 Ticketステート遷移

```
[open] --スタッフクローズ--> [closed]
```

---

## 5. エラーハンドリング

### 5.1 エラー階層

```typescript
export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
  }
}

export class BusinessRuleViolationError extends ApplicationError {
  constructor(message: string) {
    super(message, 'BUSINESS_RULE_VIOLATION', 422);
  }
}
```

### 5.2 エラーハンドリング戦略

```typescript
export class InteractionErrorHandler {
  async handle(interaction: Interaction, error: Error): Promise<void> {
    if (error instanceof ValidationError) {
      await interaction.reply({
        content: `⚠️ 入力エラー: ${error.message}`,
        ephemeral: true,
      });
    } else if (error instanceof BusinessRuleViolationError) {
      await interaction.reply({
        content: `❌ ${error.message}`,
        ephemeral: true,
      });
    } else if (error instanceof NotFoundError) {
      await interaction.reply({
        content: `🔍 ${error.message}`,
        ephemeral: true,
      });
    } else {
      logger.error('予期しないエラー', { error });
      await interaction.reply({
        content: '⚠️ エラーが発生しました。管理者にお問い合わせください。',
        ephemeral: true,
      });
    }
  }
}
```

---

## 6. トランザクション管理

### 6.1 Prismaトランザクション

```typescript
export class InvitationService {
  async joinWithTransaction(invitationId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. 招待情報取得（行ロック）
      const invitation = await tx.invitation.findUnique({
        where: { id: invitationId },
        include: { participants: true },
      });
      
      if (!invitation) throw new NotFoundError('Invitation not found');
      
      // 2. 定員チェック
      const joinedCount = invitation.participants.filter(p => p.status === 'joined').length;
      if (joinedCount >= invitation.maxParticipants) {
        throw new BusinessRuleViolationError('募集は既に定員に達しています');
      }
      
      // 3. 参加者追加
      await tx.participant.create({
        data: {
          invitationId,
          userId,
          userName: 'ユーザー名', // 実際はDiscordから取得
          status: 'joined',
        },
      });
      
      // 4. 定員到達時のステータス更新
      if (joinedCount + 1 >= invitation.maxParticipants) {
        await tx.invitation.update({
          where: { id: invitationId },
          data: { status: 'full' },
        });
      }
    });
  }
}
```

---

## 7. 並行制御

### 7.1 楽観的ロック（将来的な実装）

```prisma
model Invitation {
  // ...
  version Int @default(1) // バージョン番号
}
```

```typescript
async updateWithOptimisticLock(invitation: Invitation): Promise<void> {
  const result = await this.prisma.invitation.updateMany({
    where: {
      id: invitation.id,
      version: invitation.version,
    },
    data: {
      ...invitation.toPrismaData(),
      version: { increment: 1 },
    },
  });
  
  if (result.count === 0) {
    throw new ConflictError('データが他のユーザーによって更新されています');
  }
}
```

---

## 8. パフォーマンス最適化

### 8.1 N+1問題の回避

```typescript
// 悪い例: N+1クエリ
async getBadInvitations(): Promise<Invitation[]> {
  const invitations = await prisma.invitation.findMany();
  for (const inv of invitations) {
    inv.participants = await prisma.participant.findMany({
      where: { invitationId: inv.id },
    });
  }
  return invitations;
}

// 良い例: includeで一括取得
async getGoodInvitations(): Promise<Invitation[]> {
  return await prisma.invitation.findMany({
    include: { participants: true },
  });
}
```

### 8.2 キャッシング戦略（将来的な実装）

```typescript
export class CachedInvitationRepository {
  private cache: Map<string, Invitation> = new Map();
  private readonly TTL = 60 * 1000; // 60秒
  
  async findById(id: string): Promise<Invitation | null> {
    // キャッシュチェック
    const cached = this.cache.get(id);
    if (cached && !this.isExpired(cached)) {
      return cached;
    }
    
    // DBから取得
    const invitation = await this.repo.findById(id);
    if (invitation) {
      this.cache.set(id, invitation);
    }
    return invitation;
  }
}
```

---

## 9. セキュリティ考慮事項

### 9.1 権限チェック

```typescript
export class PermissionChecker {
  static canCancelInvitation(invitation: Invitation, userId: string, roles: string[]): boolean {
    // ホスト本人
    if (invitation.hostId === userId) return true;
    
    // スタッフロール
    if (roles.includes(env.STAFF_ROLE_ID)) return true;
    
    return false;
  }
  
  static canCloseTicket(ticket: Ticket, userId: string, roles: string[]): boolean {
    // スタッフロールのみ
    return roles.includes(env.STAFF_ROLE_ID);
  }
}
```

### 9.2 入力サニタイゼーション

```typescript
export class InputSanitizer {
  static sanitizeText(input: string): string {
    // Discord Markdownインジェクション対策
    return input
      .replace(/[`*_~|]/g, '\\$&') // エスケープ
      .substring(0, 2000); // 最大長制限
  }
  
  static validateUrl(url: string): string {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new ValidationError('URLはhttp/httpsである必要があります');
      }
      return url;
    } catch {
      throw new ValidationError('無効なURL形式です');
    }
  }
}
```

---

**最終更新**: 2025年11月16日  
**関連ドキュメント**: [architecture/overview.md](./overview.md), [database/schema.md](../database/schema.md)
