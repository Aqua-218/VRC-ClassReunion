# セキュリティ設計

## 1. 脅威モデル

### 1.1 STRIDE分析

| 脅威カテゴリ | シナリオ | 影響度 | 対策 |
|------------|---------|-------|------|
| **Spoofing（なりすまし）** | 他人になりすましてお誘い募集を作成 | 高 | Discord OAuth認証、ユーザーID検証 |
| **Tampering（改ざん）** | データベース直接操作で募集情報を改変 | 高 | アプリケーション層での権限チェック、監査ログ |
| **Repudiation（否認）** | 不適切な募集を投稿後に「自分ではない」と主張 | 中 | 全操作の監査ログ記録 |
| **Information Disclosure（情報漏洩）** | VRChatプロフィールURL等の個人情報流出 | 高 | TLS暗号化、アクセス制御、データ暗号化 |
| **Denial of Service（DoS）** | 大量の募集作成でBotを停止させる | 中 | レート制限、リソース制限 |
| **Elevation of Privilege（権限昇格）** | 一般ユーザーがスタッフ権限を取得 | 高 | ロールベースアクセス制御（RBAC）、権限検証 |

---

## 2. 認証・認可

### 2.1 Discord OAuth 2.0フロー

```
[ユーザー] --> [Discord Client] --> [Bot Application]
                    |
                    v
            [Discord API]
                    |
                    v
        [アクセストークン検証]
                    |
                    v
            [ユーザー情報取得]
            (ID, username, roles)
                    |
                    v
            [アプリケーション]
```

### 2.2 トークン管理

```typescript
export class TokenManager {
  /**
   * Botトークンの安全な管理
   */
  static getBotToken(): string {
    const token = env.DISCORD_BOT_TOKEN;
    
    // トークンの形式検証
    if (!token || !token.startsWith('Bot ') && !token.match(/^[A-Za-z0-9._-]+$/)) {
      throw new SecurityError('Invalid bot token format');
    }
    
    return token;
  }
  
  /**
   * トークンのログ出力時のマスキング
   */
  static maskToken(token: string): string {
    if (token.length < 10) return '***';
    return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
  }
}
```

**セキュリティルール**:
- ✅ `.env`ファイルに保存、`.gitignore`で除外
- ✅ ログ出力時は必ずマスキング
- ✅ 環境変数の検証（起動時）
- ✅ トークン漏洩時は即座に再生成

---

### 2.3 ロールベースアクセス制御（RBAC）

```typescript
export enum Permission {
  CREATE_INVITATION = 'create_invitation',
  CANCEL_INVITATION = 'cancel_invitation',
  STAFF_NOTIFY = 'staff_notify',
  CREATE_TICKET = 'create_ticket',
  CLOSE_TICKET = 'close_ticket',
  VIEW_ADMIN_PANEL = 'view_admin_panel',
}

export class PermissionService {
  private static rolePermissions: Record<string, Permission[]> = {
    [env.MEMBER_ROLE_ID]: [
      Permission.CREATE_INVITATION,
      Permission.CREATE_TICKET,
    ],
    [env.STAFF_ROLE_ID]: [
      Permission.CREATE_INVITATION,
      Permission.CANCEL_INVITATION,
      Permission.STAFF_NOTIFY,
      Permission.CREATE_TICKET,
      Permission.CLOSE_TICKET,
      Permission.VIEW_ADMIN_PANEL,
    ],
  };
  
  /**
   * ユーザーが権限を持つか検証
   */
  static hasPermission(userId: string, roles: string[], permission: Permission): boolean {
    // ロールの権限を集約
    const userPermissions = roles.flatMap(roleId => 
      this.rolePermissions[roleId] || []
    );
    
    return userPermissions.includes(permission);
  }
  
  /**
   * 権限チェック（例外スロー版）
   */
  static requirePermission(userId: string, roles: string[], permission: Permission): void {
    if (!this.hasPermission(userId, roles, permission)) {
      throw new ForbiddenError(`権限がありません: ${permission}`);
    }
  }
}
```

**権限マトリクス**:

| 操作 | 一般メンバー | スタッフ |
|-----|------------|---------|
| お誘い募集作成 | ✅ | ✅ |
| お誘い募集キャンセル（自分） | ✅ | ✅ |
| お誘い募集キャンセル（他人） | ❌ | ✅ |
| スタッフ通知 | ❌ | ✅ |
| チケット作成 | ✅ | ✅ |
| チケットクローズ | ❌ | ✅ |

---

## 3. データ保護

### 3.1 保存データの暗号化

```typescript
import crypto from 'crypto';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY = crypto.scryptSync(
    env.ENCRYPTION_KEY || 'default-key-please-change',
    'salt',
    32
  );
  
  /**
   * VRChatプロフィールURL等の機密情報を暗号化
   */
  static encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.KEY, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // IV + AuthTag + 暗号文を結合
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
  
  /**
   * 復号化
   */
  static decrypt(ciphertext: string): string {
    const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(this.ALGORITHM, this.KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

**暗号化対象データ**:
- VRChatプロフィールURL（`vrchatProfile`）
- インスタンスリンク（`instanceLink`）
- 将来的: ユーザーのメールアドレス（通知機能実装時）

---

### 3.2 個人情報（PII）の取り扱い

```typescript
export class PiiHandler {
  /**
   * ログ出力時のPIIマスキング
   */
  static maskPii(data: any): any {
    const piiFields = ['vrchatProfile', 'instanceLink', 'email'];
    
    const masked = { ...data };
    for (const field of piiFields) {
      if (masked[field]) {
        masked[field] = '***MASKED***';
      }
    }
    return masked;
  }
  
  /**
   * GDPR対応: ユーザーデータのエクスポート
   */
  static async exportUserData(userId: string): Promise<UserDataExport> {
    const invitations = await prisma.invitation.findMany({
      where: { hostId: userId },
    });
    
    const participants = await prisma.participant.findMany({
      where: { userId },
    });
    
    const tickets = await prisma.ticket.findMany({
      where: { userId },
    });
    
    return {
      userId,
      invitations,
      participants,
      tickets,
      exportedAt: new Date().toISOString(),
    };
  }
  
  /**
   * GDPR対応: ユーザーデータの削除
   */
  static async deleteUserData(userId: string): Promise<void> {
    await prisma.$transaction([
      prisma.participant.deleteMany({ where: { userId } }),
      prisma.ticket.deleteMany({ where: { userId } }),
      prisma.invitation.deleteMany({ where: { hostId: userId } }),
    ]);
  }
}
```

---

### 3.3 通信の暗号化

```typescript
export class SecureHttpClient {
  private static readonly TIMEOUT = 10000; // 10秒
  
  /**
   * Discord APIへの安全なリクエスト
   */
  static async request(url: string, options: RequestOptions): Promise<Response> {
    // HTTPSのみ許可
    if (!url.startsWith('https://')) {
      throw new SecurityError('HTTP通信は許可されていません');
    }
    
    // タイムアウト設定
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.TIMEOUT);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          'User-Agent': 'VRCDiscordBot/1.0',
        },
      });
      
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }
}
```

**通信セキュリティルール**:
- ✅ 全API通信はTLS 1.2以上（HTTPSのみ）
- ✅ Discord API通信にBotトークンヘッダー付与
- ✅ タイムアウト設定（10秒）
- ✅ User-Agent設定

---

## 4. 入力検証

### 4.1 Zodによるスキーマバリデーション

```typescript
import { z } from 'zod';

/**
 * お誘い募集作成のバリデーションスキーマ
 */
export const createInvitationSchema = z.object({
  eventName: z.string()
    .min(1, 'イベント名は必須です')
    .max(200, 'イベント名は200文字以内です')
    .regex(/^[^\n]+$/, 'イベント名に改行は含められません'),
  
  worldName: z.string()
    .min(1, 'ワールド名は必須です')
    .max(200, 'ワールド名は200文字以内です'),
  
  worldLink: z.string()
    .url('有効なURLを入力してください')
    .regex(/^https:\/\//, 'HTTPSのURLを指定してください')
    .optional(),
  
  description: z.string()
    .max(2000, '説明は2000文字以内です')
    .optional(),
  
  maxParticipants: z.number()
    .int('整数で指定してください')
    .min(1, '定員は1人以上です')
    .max(100, '定員は100人以下です'),
  
  instanceType: z.enum(['group', 'friend', 'friendplus', 'public']),
  
  startTime: z.date()
    .refine(date => date > new Date(), '開始時刻は未来の日時を指定してください'),
  
  endTime: z.date(),
}).refine(
  data => data.endTime > data.startTime,
  { message: '終了時刻は開始時刻より後に設定してください', path: ['endTime'] }
);
```

### 4.2 SQLインジェクション対策

Prismaを使用することで自動的に対策:

```typescript
// ✅ 安全（Prismaがパラメータ化）
await prisma.invitation.findMany({
  where: { eventName: { contains: userInput } },
});

// ❌ 危険（生SQL使用時は注意）
await prisma.$queryRaw`SELECT * FROM invitations WHERE eventName LIKE '%${userInput}%'`;
// → XSS/SQLインジェクションのリスク

// ✅ 生SQLを使う場合はプレースホルダー使用
await prisma.$queryRaw`SELECT * FROM invitations WHERE eventName LIKE ${'%' + userInput + '%'}`;
```

---

### 4.3 XSS（クロスサイトスクリプティング）対策

```typescript
export class XssProtection {
  /**
   * Discord Markdown用のエスケープ
   */
  static escapeMarkdown(text: string): string {
    return text.replace(/[*_~`|\\]/g, '\\$&');
  }
  
  /**
   * URLの検証（オープンリダイレクト対策）
   */
  static validateUrl(url: string): string {
    try {
      const parsed = new URL(url);
      
      // 許可プロトコル
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new ValidationError('URLはHTTP/HTTPSのみ許可されています');
      }
      
      // VRChatドメインのみ許可（worldLink用）
      if (url.startsWith('https://vrchat.com/') || url.startsWith('https://www.vrchat.com/')) {
        return url;
      }
      
      throw new ValidationError('VRChatのURLのみ許可されています');
    } catch (error) {
      throw new ValidationError('無効なURL形式です');
    }
  }
}
```

---

## 5. レート制限

### 5.1 ユーザー単位のレート制限

```typescript
export class RateLimiter {
  private static limits: Map<string, { count: number; resetAt: number }> = new Map();
  
  /**
   * レート制限チェック
   * @param userId - ユーザーID
   * @param action - アクション名（例: 'create_invitation'）
   * @param maxRequests - 制限回数
   * @param windowMs - 制限期間（ミリ秒）
   */
  static async check(
    userId: string,
    action: string,
    maxRequests: number = env.RATE_LIMIT_MAX_REQUESTS,
    windowMs: number = env.RATE_LIMIT_WINDOW_MS
  ): Promise<void> {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const limit = this.limits.get(key);
    
    // リセット時刻を過ぎている場合
    if (!limit || now > limit.resetAt) {
      this.limits.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }
    
    // 制限超過
    if (limit.count >= maxRequests) {
      const resetInSeconds = Math.ceil((limit.resetAt - now) / 1000);
      throw new RateLimitError(
        `レート制限に達しました。${resetInSeconds}秒後に再試行してください。`
      );
    }
    
    // カウント増加
    limit.count++;
  }
}
```

**レート制限設定**:
- お誘い募集作成: 10回/分
- チケット作成: 5回/分
- スタッフ通知: 3回/分

---

### 5.2 Discord APIレート制限対応

```typescript
export class DiscordRateLimitHandler {
  /**
   * Discord APIレート制限のリトライ処理
   */
  static async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        // 429 Too Many Requests
        if (error.code === 429) {
          const retryAfter = error.retryAfter || 1000;
          logger.warn(`Discord APIレート制限: ${retryAfter}ms後に再試行`, { attempt: i + 1 });
          await this.sleep(retryAfter);
          continue;
        }
        throw error;
      }
    }
    throw new Error('最大リトライ回数に達しました');
  }
  
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 6. 監査ログ

### 6.1 監査ログの記録

```typescript
export class AuditLogger {
  /**
   * 監査ログの記録
   */
  static async log(event: AuditEvent): Promise<void> {
    logger.info('AUDIT', {
      timestamp: new Date().toISOString(),
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      result: event.result,
      metadata: event.metadata,
    });
    
    // 将来的にはデータベースに保存
    // await prisma.auditLog.create({ data: event });
  }
}

interface AuditEvent {
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  resource: 'INVITATION' | 'TICKET' | 'PARTICIPANT';
  resourceId: string;
  result: 'SUCCESS' | 'FAILURE';
  metadata?: Record<string, any>;
}
```

**監査対象操作**:
- お誘い募集の作成/更新/削除
- チケットの作成/クローズ
- スタッフ通知の送信
- 権限エラー（不正アクセス試行）

---

## 7. セキュリティチェックリスト

### 7.1 開発時

- [ ] `.env`ファイルを`.gitignore`に追加
- [ ] 全環境変数にバリデーションスキーマ設定
- [ ] 入力値検証（Zod）の実装
- [ ] 権限チェックの実装
- [ ] ログ出力時のPIIマスキング

### 7.2 デプロイ前

- [ ] Botトークンの安全な管理（環境変数）
- [ ] データベース接続文字列の暗号化
- [ ] TLS証明書の有効期限確認
- [ ] レート制限の設定
- [ ] 監査ログの有効化

### 7.3 本番運用

- [ ] 定期的なセキュリティパッチ適用
- [ ] 依存関係の脆弱性スキャン（`npm audit`）
- [ ] 監査ログの定期的なレビュー
- [ ] インシデント対応手順の整備

---

## 8. 参考資料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Discord Developer Portal - Security](https://discord.com/developers/docs/topics/security)
- [GDPR Compliance](https://gdpr.eu/)

---

**最終更新**: 2025年11月16日  
**関連ドキュメント**: [architecture/overview.md](../architecture/overview.md), [deployment/environment-variables.md](../deployment/environment-variables.md)
