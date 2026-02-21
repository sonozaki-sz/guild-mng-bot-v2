# i18next 使用ガイド

## 📖 概要

このプロジェクトでは、多言語対応に **i18next** を使用しています。

## 🚀 基本的な使い方

### 1. 初期化

botの起動時に自動的に初期化されます。

```typescript
import { localeManager } from "@/shared/locale/localeManager";

// Bot起動時
await localeManager.initialize();
```

### 2. 翻訳の取得

#### Guild別の翻訳

```typescript
import { tGuild } from "@/shared/locale";

// Guild IDを指定して翻訳
const message = await tGuild(guildId, "common:success");
// → "成功"

// パラメータを渡す
const cooldownMsg = await tGuild(guildId, "commands:cooldown.message", {
  seconds: 10,
});
// → "このコマンドは 10 秒後に再度使用できます。"
```

#### デフォルト言語での翻訳

```typescript
import { tDefault } from "@/shared/locale";

// デフォルト言語（日本語）で翻訳
const message = tDefault("common:error");
// → "エラー"
```

#### 固定言語の翻訳関数を取得

```typescript
import { localeManager } from "@/shared/locale";

// 日本語の翻訳関数を取得
const fixedT = localeManager.getFixedT("ja");
const message = fixedT("common:success");
// → "成功"

// Guild別の翻訳関数を取得
const guildT = await localeManager.getGuildT(guildId);
const message = guildT("commands:example.success");
```

## 📁 翻訳ファイルの構造

```
src/shared/locale/
├── i18n.ts                    # i18next設定
├── i18next.d.ts              # 型定義
├── localeManager.ts          # ロケール管理
├── helpers.ts                # ギルド翻訳ヘルパー
└── locales/
  ├── resources.ts          # リソースまとめ
    ├── ja/                   # 日本語
  │   ├── resources.ts
    │   ├── common.ts         # 共通
    │   ├── commands.ts       # コマンド
    │   ├── errors.ts         # エラー
    │   └── events.ts         # イベント
    └── en/                   # 英語
    ├── resources.ts
        ├── common.ts
        ├── commands.ts
        ├── errors.ts
        └── events.ts
```

## ✍️ 翻訳の追加方法

### 1. 翻訳キーの追加

各名前空間のファイルにキーと翻訳を追加：

```typescript
// src/shared/locale/locales/ja/commands.ts
export const commands = {
  // ...既存のキー

  // 新しいキーを追加
  "newCommand.description": "新しいコマンドの説明",
  "newCommand.success": "コマンドが成功しました！",
} as const;
```

### 2. 英語版も追加

```typescript
// src/shared/locale/locales/en/commands.ts
export const commands = {
  // ...existing keys

  // Add new keys
  "newCommand.description": "Description of new command",
  "newCommand.success": "Command succeeded!",
} as const;
```

### 3. 使用する

```typescript
const message = await tGuild(guildId, "commands:newCommand.success");
```

## 🔧 名前空間

| 名前空間   | 用途                 | 例                             |
| ---------- | -------------------- | ------------------------------ |
| `common`   | 共通の単語・フレーズ | `common:success`               |
| `commands` | コマンド関連         | `commands:example.description` |
| `errors`   | エラーメッセージ     | `errors:not_found`             |
| `events`   | イベントメッセージ   | `events:ready.logged_in`       |

## 💡 型安全性

i18nextは完全に型安全です：

```typescript
// ✅ 正しいキー
const msg = tDefault("common:success");

// ❌ 存在しないキーはTypeScriptエラー
const msg = tDefault("common:nonexistent");
//                    ~~~~~~~~~~~~~~~~~~
// エラー: 型に存在しません
```

## 🌐 サポート言語の追加

新しい言語を追加する場合：

1. `src/shared/locale/i18n.ts` の `SUPPORTED_LOCALES` に追加
2. `src/shared/locale/locales/{lang}/` ディレクトリを作成
3. 各名前空間ファイルを作成
4. `src/shared/locale/locales/resources.ts` に追加

## 📝 補間（パラメータ）の使い方

```typescript
// 定義
export const events = {
  "ready.logged_in": "{{username}} としてログインしました",
} as const;

// 使用
const msg = await tGuild(guildId, "events:ready.logged_in", {
  username: "BotName#1234",
});
// → "BotName#1234 としてログインしました"
```

## 🔄 動的な言語切り替え

```typescript
import { localeManager } from "@/shared/locale/localeManager";

// 言語を英語に切り替え
await localeManager.changeLanguage("en");
```

## 📌 ベストプラクティス

1. **キーは階層的に**: `category.subcategory.key` の形式
2. **名前空間を活用**: 関連する翻訳をグループ化
3. **補間を使う**: 動的な値は `{{variable}}` で
4. **型安全性を活用**: TypeScriptの補完とエラー検出を利用
5. **全言語で同じキー**: すべての言語で同じキー構造を維持

## 🐛 トラブルシューティング

### 翻訳が表示されない

```typescript
// 初期化されているか確認
if (!localeManager["initialized"]) {
  await localeManager.initialize();
}
```

### キーがそのまま表示される

- キーのタイポを確認
- 名前空間プレフィックス（`common:`等）を確認
- 翻訳ファイルにキーが存在するか確認
