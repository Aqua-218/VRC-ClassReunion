# ADR 0001: TypeScript選定

## ステータス
承認済み

## コンテキスト

VRC同期会Discord Botの開発言語を選定する必要がある。候補としてTypeScript、JavaScript、Python（discord.py）が挙げられる。

### 要求事項
- Discord API（v10）との統合
- 型安全性による保守性の向上
- 開発者のオンボーディング容易性
- パフォーマンス

## 検討した選択肢

### 1. TypeScript
- **メリット**:
  - コンパイル時の型チェックでバグを早期発見
  - discord.js v14が完全TypeScript対応、優れた型推論
  - IDEの自動補完・リファクタリング支援
  - Node.jsエコシステムの豊富なライブラリ
  - 大規模プロジェクトでの保守性が高い

- **デメリット**:
  - 学習曲線がJavaScriptより高い
  - ビルドステップが必要

### 2. JavaScript
- **メリット**:
  - 学習曲線が低い
  - ビルド不要、即座に実行可能
  - discord.jsが完全対応

- **デメリット**:
  - 型安全性がない、ランタイムエラーのリスク
  - 大規模化時の保守性が低下
  - リファクタリングが困難

### 3. Python（discord.py）
- **メリット**:
  - Pythonの簡潔な文法
  - データ処理が得意

- **デメリット**:
  - discord.pyはdiscord.jsより機能が遅れる傾向
  - Node.jsより起動時間が遅い
  - Discord公式の推奨はJavaScript/TypeScript

## 決定内容

**TypeScript（厳格モード）を採用**

### 理由
1. **型安全性**: コンパイル時エラー検出により、本番環境での予期しないエラーを削減
2. **discord.js統合**: v14が完全TypeScript対応、型推論が優秀
3. **保守性**: 大規模化時のリファクタリング・機能追加が容易
4. **開発者体験**: IDEの強力なサポート、学習リソースが豊富

### トレードオフ
- 学習コスト増加 → ドキュメント充実、段階的な型定義で軽減
- ビルド時間 → esbuild等の高速ビルドツールで軽減

## 影響範囲

- 開発環境: Node.js v18以降必須、TypeScriptツールチェーン
- ビルドプロセス: `tsc` によるコンパイル
- CI/CD: ビルドステップの追加
- 開発者: TypeScriptの学習が必要

## 代替案と撤退条件

**撤退条件**:
- TypeScriptのビルド時間が開発体験を著しく損なう場合
  - 対策: esbuildやswc等の高速ビルダーに切り替え

**代替案**:
- JavaScriptへの移行は理論的に可能（型注釈を削除）
- ただし、型安全性が失われるため非推奨

## 参考資料

- [discord.js Guide - TypeScript Support](https://discordjs.guide/additional-info/using-typescript.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

**決定日**: 2025年11月16日  
**決定者**: プロジェクトチーム  
**レビュー予定**: 2025年5月（Phase 2終了時）
