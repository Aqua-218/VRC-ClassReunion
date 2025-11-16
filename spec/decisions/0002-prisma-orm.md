# ADR 0002: Prisma ORM採用

## ステータス
承認済み

## コンテキスト

データベースアクセスレイヤーの技術選定を行う。TypeScriptとの統合、マイグレーション管理、型安全性を重視する。

### 要求事項
- TypeScriptとの完全統合
- 宣言的なスキーマ定義
- マイグレーション管理の容易性
- PostgreSQL/SQLiteのサポート

## 検討した選択肢

### 1. Prisma
- **メリット**:
  - スキーマからTypeScript型を自動生成、完全な型安全性
  - 宣言的なスキーマ定義（`schema.prisma`）
  - 自動マイグレーションファイル生成
  - Prisma Studio（GUI）で開発体験向上
  - 優れたドキュメント、活発なコミュニティ

- **デメリット**:
  - Prisma Clientのバンドルサイズが大（~10MB）
  - 複雑なクエリは生SQLに頼る場面あり

### 2. TypeORM
- **メリット**:
  - デコレータベースのエンティティ定義
  - 複雑なクエリにも対応
  - Active RecordとData Mapperパターン両対応

- **デメリット**:
  - 型推論がPrismaより劣る
  - マイグレーション自動生成の精度が低い
  - ドキュメントがPrismaより古い

### 3. Sequelize
- **メリット**:
  - 長い実績、大規模プロジェクトでの採用例多数
  - 多様なデータベースサポート

- **デメリット**:
  - TypeScript対応が後付け、型安全性が弱い
  - 最新のTypeScript機能に未対応

### 4. Drizzle ORM
- **メリット**:
  - 軽量、高パフォーマンス
  - 型安全性が高い

- **デメリット**:
  - 新しい技術、コミュニティが小さい
  - マイグレーション機能が未成熟

## 決定内容

**Prisma ORM を採用**

### 理由
1. **型安全性**: スキーマから自動生成される型により、コンパイル時エラー検出
2. **開発者体験**: Prisma Studioによる可視化、優れたクエリAPI
3. **マイグレーション**: 宣言的スキーマから自動生成、履歴管理が容易
4. **学習曲線**: ドキュメントが充実、チュートリアルが豊富

### トレードオフ
- バンドルサイズ増加（~10MB） → 許容範囲、Node.js環境では問題なし
- 複雑なクエリの制約 → 生SQL機能で対応可能

## 影響範囲

- データベース操作: Prisma Clientを全箇所で使用
- マイグレーション: `prisma migrate dev` で管理
- スキーマ定義: `prisma/schema.prisma` に一元化
- 型定義: Prisma Clientから自動生成

## 実装詳細

### Prisma設定例

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Invitation {
  id        String   @id
  eventName String
  createdAt DateTime @default(now())
  // ...
}
```

### マイグレーション例

```bash
# 開発環境: スキーマ変更を検出、マイグレーション自動生成
npx prisma migrate dev --name add_instance_link

# 本番環境: マイグレーション適用
npx prisma migrate deploy
```

## 代替案と撤退条件

**撤退条件**:
- Prisma Clientのバンドルサイズが致命的な問題となる場合
  - 対策: 現状のNode.js環境では問題なし、サーバーレス環境では検討
- 複雑なクエリが大量に必要となり、Prismaで対応困難な場合
  - 対策: 生SQLとの併用で対応

**代替案**:
- Drizzle ORMへの移行（将来的に検討）
- TypeORMへの移行（実績重視の場合）

## 参考資料

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma vs TypeORM](https://www.prisma.io/docs/concepts/more/comparisons/prisma-and-typeorm)

---

**決定日**: 2025年11月16日  
**決定者**: プロジェクトチーム  
**レビュー予定**: 2025年5月（Phase 2終了時）
