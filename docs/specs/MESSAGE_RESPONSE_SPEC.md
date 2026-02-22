# Botメッセージレスポンス - 仕様書

> Botが送信するメッセージの統一フォーマット仕様

最終更新: 2026年2月19日

---

## 📋 概要

### 目的

Botが送信するすべてのメッセージ（コマンド応答、エラー通知など）を**Embed形式**で統一し、視認性と一貫性を向上させ、メンテナンス性を高めます。

### 主な用途

1. **コマンドレスポンスの統一**: すべてのコマンドが同じフォーマットでメッセージを返信
2. **エラーメッセージの視認性向上**: エラーの種類を色で即座に判別可能
3. **保守性の向上**: メッセージ生成ロジックを一箇所に集約し、変更を容易に
4. **ユーザーエクスペリエンスの向上**: 統一されたUIで混乱を軽減

### 特徴

- **カラーコーディング**: メッセージの重要度をカラーで表現（Success/Info/Warning/Error）
- **統一されたフォーマット**: すべてのメッセージがEmbed形式で一貫性を保持
- **ヘルパー関数**: `createStatusEmbed()`で簡単にメッセージを生成
- **多言語対応**: i18nextキーを使用してローカライゼーション可能

---

## 🎨 メッセージステータスと色

### ステータスの種類

| ステータス          | 説明             | カラーコード | Discord色 | 用途                                             |
| ------------------- | ---------------- | ------------ | --------- | ------------------------------------------------ |
| **Success（成功）** | 操作が正常に完了 | `0x57F287`   | Green     | 設定完了、機能有効化、登録成功など               |
| **Info（情報）**    | 一般的な情報表示 | `0x3498DB`   | Blue      | 設定状態表示、ヘルプメッセージなど               |
| **Warning（注意）** | 注意が必要な状態 | `0xFEE75C`   | Yellow    | 既に設定済み、制限事項の通知など                 |
| **Error（エラー）** | エラーが発生     | `0xED4245`   | Red       | コマンド失敗、権限不足、バリデーションエラーなど |

### 色の視覚イメージ

```
🟢 Success (Green)   - 0x57F287
🔵 Info (Blue)       - 0x3498DB
🟡 Warning (Yellow)  - 0xFEE75C
🔴 Error (Red)       - 0xED4245
```

---

## 🏗️ Embedメッセージの構造

### 基本構造

```typescript
const embed = new EmbedBuilder()
  .setColor(statusColor) // ステータスに応じた色
  .setTitle(statusEmoji + " " + title) // ステータス絵文字 + タイトル
  .setDescription(description) // メッセージ本文
  .setTimestamp(); // タイムスタンプ（オプション）
```

### ステータス絵文字

| ステータス | 絵文字 | 代替絵文字 |
| ---------- | ------ | ---------- |
| Success    | `✅`   | `✓`        |
| Info       | `ℹ️`   | `ℹ`        |
| Warning    | `⚠️`   | `⚠`        |
| Error      | `❌`   | `✗`        |

### タイトル形式

```
[絵文字] [ステータス名（日本語）]
または
[絵文字] [カスタムタイトル]
```

**例:**

- `✅ 設定完了`
- `ℹ️ Bumpリマインダー機能`
- `⚠️ 既に設定されています`
- `❌ エラーが発生しました`

---

## 📝 実装ガイド

### ヘルパー関数の作成

**ファイル:** `src/shared/utils/messageResponse.ts` (新規作成)

```typescript
import { EmbedBuilder } from "discord.js";

/**
 * メッセージステータスの種類
 */
export type MessageStatus = "success" | "info" | "warning" | "error";

/**
 * ステータスに応じたカラーコード
 */
const STATUS_COLORS: Record<MessageStatus, number> = {
  success: 0x57f287, // Green
  info: 0x5865f2, // Blurple
  warning: 0xfee75c, // Yellow
  error: 0xed4245, // Red
};

/**
 * ステータスに応じた絵文字
 */
const STATUS_EMOJIS: Record<MessageStatus, string> = {
  success: "✅",
  info: "ℹ️",
  warning: "⚠️",
  error: "❌",
};

/**
 * ステータス付きEmbedメッセージを作成
 *
 * @param status メッセージステータス
 * @param title タイトル（絵文字は自動付与）
 * @param description メッセージ本文
 * @param options 追加オプション
 * @returns EmbedBuilder
 */
export function createStatusEmbed(
  status: MessageStatus,
  title: string,
  description: string,
  options?: {
    timestamp?: boolean; // タイムスタンプを付与するか（デフォルト: false）
    fields?: { name: string; value: string; inline?: boolean }[];
  },
): EmbedBuilder {
  const emoji = STATUS_EMOJIS[status];
  const color = STATUS_COLORS[status];

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${emoji} ${title}`)
    .setDescription(description);

  if (options?.timestamp) {
    embed.setTimestamp();
  }

  if (options?.fields) {
    embed.addFields(options.fields);
  }

  return embed;
}

/**
 * 成功メッセージを作成
 */
export function createSuccessEmbed(title: string, description: string) {
  return createStatusEmbed("success", title, description);
}

/**
 * 情報メッセージを作成
 */
export function createInfoEmbed(title: string, description: string) {
  return createStatusEmbed("info", title, description);
}

/**
 * 警告メッセージを作成
 */
export function createWarningEmbed(title: string, description: string) {
  return createStatusEmbed("warning", title, description);
}

/**
 * エラーメッセージを作成
 */
export function createErrorEmbed(title: string, description: string) {
  return createStatusEmbed("error", title, description);
}
```

### 使用例

#### 成功メッセージ

```typescript
// Before (プレーンテキスト)
await interaction.reply({
  content: "✅ Bumpリマインダー機能を有効化しました",
  flags: MessageFlags.Ephemeral,
});

// After (Embed)
const embed = createSuccessEmbed(
  "設定完了",
  "Bumpリマインダー機能を有効化しました",
);
await interaction.reply({
  embeds: [embed],
  flags: MessageFlags.Ephemeral,
});
```

#### 情報メッセージ（フィールド付き）

```typescript
const embed = createStatusEmbed(
  "info",
  "Bumpリマインダー機能",
  "現在の設定状態",
  {
    fields: [
      { name: "状態", value: "有効", inline: true },
      { name: "メンションロール", value: "@BumpRole", inline: true },
      { name: "メンションユーザー", value: "@User1, @User2", inline: false },
    ],
  },
);
await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
```

#### エラーメッセージ

```typescript
const embed = createErrorEmbed(
  "権限不足",
  "このコマンドを実行するには管理者権限が必要です",
);
await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
```

---

## 🎯 適用範囲

### 対象

以下のすべてのBotレスポンスをEmbed形式に統一します：

#### コマンドレスポンス

- [x] `/bump-reminder-config` の各サブコマンド
  - `enable` → Success
  - `disable` → Success
  - `set-mention` → Success
  - `remove-mention` → Success
  - `view` → Info
- [x] `/afk-config` の各サブコマンド
  - `set-ch` → Success
  - `view` → Info
- [x] `/afk` コマンド
  - AFK設定 → Success
  - AFK解除 → Success
- [x] `/ping` コマンド
  - レスポンス → Info

#### エラーメッセージ

- [x] 権限不足エラー → Error
- [x] バリデーションエラー → Error
- [x] コマンド実行エラー → Error
- [x] 機能無効化時のエラー → Warning

#### 情報メッセージ

- [x] 設定状態の表示 → Info
- [x] ヘルプメッセージ → Info
- [x] 既に設定済みの通知 → Warning

### 例外（Embedを使用しない）

以下のケースではプレーンテキストまたは既存の形式を維持します：

#### 自動通知・リマインダー

- **Bumpリマインダー**: メンション + メッセージ（シンプルなテキスト形式）

  ```
  @BumpRole
  ⏰ /bump が出来るようになったよ！
  ```

  - 理由: メンションとリマインダーメッセージを簡潔に表示するため

#### インタラクティブUI

- **Bumpパネル**: Embed + Buttons（既存の形式を維持）

  ```
  [Embed: 通知時刻表示]
  [Button: メンションする] [Button: メンションしない]
  ```

  - 理由: 既にEmbed形式であり、ボタンUIとの組み合わせが機能的

#### ログメッセージ

- **Join/Leaveログ**: カスタムEmbed（既存の形式を維持）
- **削除ログ**: カスタムEmbed（既存の形式を維持）

---

## 🔄 移行戦略

### フェーズ1: インフラ整備（優先度: 高）

1. **ヘルパー関数の実装**
   - `src/shared/utils/messageResponse.ts` を作成
   - `createStatusEmbed()` とショートカット関数を実装
   - ユニットテストを作成

2. **ローカライゼーション対応**
   - タイトルとメッセージをi18nキーで管理
   - `src/shared/locale/locales/ja/commands.ts` にキーを追加

- 例: `"bump-reminder.enable.success.title": "設定完了"`

### フェーズ2: コマンド移行（優先度: 中）

優先度順にコマンドを移行：

1. **Bumpリマインダーコマンド**
   - `/bump-reminder-config` の全サブコマンド
   - エラーメッセージも含む

2. **AFKコマンド**
   - `/afk-config` の全サブコマンド
   - `/afk` コマンド

3. **その他のコマンド**
   - `/ping`
   - 今後追加されるコマンド

### フェーズ3: エラーハンドリング統一（優先度: 中）

- `ErrorHandler` を更新してEmbed形式でエラーを返す
- カスタムエラークラスにステータス情報を追加

### フェーズ4: 検証とリファクタリング（優先度: 低）

- すべてのメッセージがEmbed形式になったか確認
- 不要なプレーンテキストレスポンスを削除
- UIの一貫性をユーザーテストで検証

---

## 📊 ローカライゼーション

### メッセージキーの構造

```typescript
// commands.ts
export default {
  // 各コマンドのメッセージ
  "bump-reminder": {
    enable: {
      success: {
        title: "設定完了",
        description: "Bumpリマインダー機能を有効化しました",
      },
    },
    disable: {
      success: {
        title: "設定完了",
        description: "Bumpリマインダー機能を無効化しました",
      },
    },
    // ...
  },

  // 共通エラーメッセージ
  errors: {
    permission: {
      title: "権限不足",
      admin_required: "このコマンドを実行するには管理者権限が必要です",
    },
    validation: {
      title: "入力エラー",
      // ...
    },
  },
};
```

---

## 🧪 テストケース

最新の件数とカバレッジは [TEST_PROGRESS.md](../progress/TEST_PROGRESS.md) を参照。

### ユニットテスト

**ファイル:** `tests/unit/utils/messageResponse.test.ts` (新規作成)

- [x] `createStatusEmbed()`: 各ステータスで正しいカラーと絵文字を使用
- [x] `createSuccessEmbed()`: 成功メッセージの生成
- [x] `createInfoEmbed()`: 情報メッセージの生成
- [x] `createWarningEmbed()`: 警告メッセージの生成
- [x] `createErrorEmbed()`: エラーメッセージの生成
- [x] タイムスタンプオプションの動作確認
- [x] フィールド追加の動作確認

### インテグレーションテスト

- [x] コマンド実行時にEmbedが返される
- [x] エラー発生時に適切なステータスのEmbedが返される
- [x] ローカライゼーションが正しく適用される

---

## 📝 実装チェックリスト

### インフラ

- [ ] `src/shared/utils/messageResponse.ts` 作成
- [ ] ヘルパー関数の実装
- [ ] ユニットテスト作成
- [ ] ローカライゼーションキーの追加

### コマンド移行

- [ ] `/bump-reminder-config enable`
- [ ] `/bump-reminder-config disable`
- [ ] `/bump-reminder-config set-mention`
- [ ] `/bump-reminder-config remove-mention`
- [ ] `/bump-reminder-config view`
- [ ] `/afk-config set-ch`
- [ ] `/afk-config view`
- [ ] `/afk` コマンド
- [ ] `/ping` コマンド

### エラーハンドリング

- [ ] `ErrorHandler` の更新
- [ ] カスタムエラークラスの更新
- [ ] 権限エラーのEmbed化
- [ ] バリデーションエラーのEmbed化

---

## � エラーハンドリング

### 想定されるエラー

1. **ヘルパー関数でのバリデーションエラー**
   - タイトルが256文字を超える場合は自動切り詰め
   - DescriptionやFieldが制限を超える場合も同様

2. **Embed送信失敗**
   - Bot権限不足: エラーログを記録し、プレーンテキストにフォールバック
   - Embedサイズ超過: フィールドを削減または分割

3. **多言語対応キーの欠落**
   - キーが存在しない場合は英語（デフォルト）にフォールバック
   - ログに警告を記録

---

## 🔗 関連ドキュメント

- [Discord.js - EmbedBuilder](https://discord.js.org/#/docs/discord.js/main/class/EmbedBuilder)
- [Discord - Embed Colors](https://discord.com/developers/docs/resources/channel#embed-object)
- [Discord UI Kit - Colors](https://discord.com/branding)
