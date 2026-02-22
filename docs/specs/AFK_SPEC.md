# AFK機能 - 仕様書

> ボイスチャンネルの非アクティブユーザーを手動でAFKチャンネルに移動する機能

最終更新: 2026年2月19日

---

## 📋 概要

`/afk` コマンドを使用して、ボイスチャンネルに参加中のメンバーを専用のAFKチャンネルに移動させる機能です。全メンバーが使用可能で、自分自身または他のユーザーを移動できます。

### 主な用途

- 自分が一時離席する際にAFKチャンネルへ移動
- ボイスチャンネルで長時間応答がないメンバーの整理
- モデレーション業務の効率化
- ボイスチャンネルの整理整頓

### 特徴

- **手動実行**: 自動的な移動は行わず、コマンド実行による手動移動
- **権限管理**: サーバー管理権限でAFKチャンネルを設定
- **対象指定**: 自分自身または他のユーザーを指定可能

---

## 🎯 主要機能

### 1. ユーザー移動コマンド

**コマンド**: `/afk [user]`

**実行権限**: 全メンバー（AFK設定が有効な場合）

**引数:**

| 引数名 | 型   | 必須 | 説明                                     |
| ------ | ---- | ---- | ---------------------------------------- |
| user   | User | ❌   | 移動対象のユーザー（省略時は実行者自身） |

**動作:**

1. AFK機能が有効か確認
2. 対象ユーザーがボイスチャンネルに参加しているか確認
3. 設定されたAFKチャンネルに移動
4. 移動完了をチャンネルに通知

**実行例:**

```
# 自分をAFKチャンネルに移動
/afk

# 特定ユーザーをAFKチャンネルに移動
/afk user:@ユーザー名
```

**成功時の応答:**

```
✅ @ユーザー名 を #AFK に移動しました
```

---

### 2. AFK設定コマンド

**コマンド**: `/afk-config`

**実行権限**: 管理者のみ

#### サブコマンド: `set-ch`

AFKチャンネルを設定します。

**引数:**

| 引数名  | 型           | 必須 | 説明                                        |
| ------- | ------------ | ---- | ------------------------------------------- |
| channel | VoiceChannel | ✅   | AFKチャンネルとして使用するボイスチャンネル |

**動作:**

1. 指定されたチャンネルがボイスチャンネルか確認
2. GuildConfigのafkConfigを更新（enabled: true）
3. 設定完了を通知

**実行例:**

```
/afk-config set-ch channel:#AFK
```

**成功時の応答:**

```
✅ AFKチャンネルを #AFK に設定しました
```

#### サブコマンド: `view`

現在のAFK設定を表示します。

**引数:** なし

**動作:**

1. 現在のAFK設定を取得
2. 設定内容を表示（MessageFlags.Ephemeral）

**実行例:**

```
/afk-config view
```

**応答例:**

```
【AFK設定】
チャンネル: #AFK
```

**未設定時の応答:**

```
ℹ️ AFK機能が設定されていません
```

---

## 💾 データベース設計

### GuildConfig.afkConfig

AFK設定は`GuildConfig`テーブルの`afkConfig`フィールドにJSON形式で保存されます。

**型定義:**

```typescript
interface AfkConfig {
  enabled: boolean; // 機能の有効/無効
  channelId: string; // AFKチャンネルのID
}
```

**保存例:**

```json
{
  "enabled": true,
  "channelId": "123456789012345678"
}
```

**初期値:**

```json
{
  "enabled": false,
  "channelId": null
}
```

---

## 🏗️ 実装詳細

### コマンドファイル

#### `/afk` コマンド

**ファイル**: `src/bot/commands/afk.ts`

**処理フロー:**

```typescript
1. Guild IDの取得・検証
   ↓
2. AFK設定の確認
   - enabled が true か
   - channelId が設定されているか
   ↓
3. 対象ユーザーの取得
   - user引数が指定されていればそのユーザー
   - 未指定なら実行者自身
   ↓
4. ボイスチャンネル参加状態の確認
   - member.voice.channel の存在確認
   ↓
5. AFKチャンネルの取得・検証
   - チャンネルが存在するか
   - ボイスチャンネルタイプか
   ↓
6. ユーザーを移動
   - member.voice.setChannel(afkChannel)
   ↓
7. 成功メッセージを送信
   ↓
8. ログ記録
```

**エラーケース:**

| エラー                 | 条件                                | メッセージ                     |
| ---------------------- | ----------------------------------- | ------------------------------ |
| AFK未設定              | enabled=false または channelId=null | `errors:afk.not_configured`    |
| メンバーが見つからない | Guild内にメンバーが存在しない       | `errors:afk.member_not_found`  |
| VC未参加               | ボイスチャンネルに参加していない    | `errors:afk.user_not_in_voice` |
| チャンネルが無効       | AFKチャンネルが存在しない/削除済み  | `errors:afk.channel_not_found` |

#### `/afk-config` コマンド

**ファイル**: `src/bot/commands/afk-config.ts`

**権限チェック:**

- `PermissionFlagsBits.Administrator` を要求
- SlashCommandBuilderで `setDefaultMemberPermissions()` も設定

**サブコマンド: `set-ch`**

```typescript
1. サーバー管理権限の確認
   ↓
2. 指定されたチャンネルの取得
   ↓
3. ボイスチャンネルタイプの確認
   - ChannelType.GuildVoice であることを確認
   ↓
4. Repositoryを通じてafkConfigを更新
   - enabled: true
   - channelId: channel.id
   ↓
5. 成功メッセージを送信（MessageFlags.Ephemeral）
   ↓
6. ログ記録
```

**サブコマンド: `view`**

```typescript
1. サーバー管理権限の確認
   ↓
2. 現在のAFK設定を取得
   ↓
3. 設定が存在すればチャンネル情報を表示
   設定がなければ未設定メッセージを表示
   ↓
4. MessageFlags.Ephemeralで応答
```

---

## 🚨 エラーハンドリング

### バリデーションエラー

**ValidationError** を使用して、ユーザーフレンドリーなエラーメッセージを返します。

**共通エラー:**

```typescript
// Guild外での実行
throw new ValidationError(tDefault("errors:validation.guild_only"));

// 権限不足
throw new ValidationError(
  await tGuild(guildId, "errors:permission.manage_guild_required"),
);
```

**AFK固有エラー:**

```typescript
// AFK機能未設定
throw new ValidationError(await tGuild(guildId, "errors:afk.not_configured"));

// 対象ユーザーがボイスチャンネル未参加
throw new ValidationError(
  await tGuild(guildId, "errors:afk.user_not_in_voice"),
);

// AFKチャンネルが見つからない
throw new ValidationError(
  await tGuild(guildId, "errors:afk.channel_not_found"),
);

// 無効なチャンネルタイプ
throw new ValidationError(
  await tGuild(guildId, "errors:afk.invalid_channel_type"),
);
```

### エラーレスポンス

全てのエラーは `handleCommandError()` で統一的に処理され、適切なメッセージがユーザーに返されます。

---

## 🌐 多言語対応（i18next）

### 翻訳キー

#### コマンド説明

```json
{
  "afk": {
    "description": "ユーザーをAFKチャンネルに移動",
    "user": {
      "description": "移動するユーザー（省略時は自分）"
    }
  },
  "afk-config": {
    "description": "AFK機能の設定",
    "set-ch": {
      "description": "AFKチャンネルを設定",
      "channel": {
        "description": "AFKチャンネル"
      }
    },
    "show": {
      "description": "現在のAFK設定を表示"
    }
  }
}
```

#### コマンド応答

```json
{
  "commands": {
    "afk": {
      "moved": "{{user}} を {{channel}} に移動しました",
      "configured": "AFKチャンネルを {{channel}} に設定しました",
      "not_configured": "AFK機能が設定されていません",
      "settings_title": "【AFK設定】",
      "moved_log": "User {{userId}} moved to AFK channel {{channelId}} in guild {{guildId}}",
      "configured_log": "AFK channel configured to {{channelId}} in guild {{guildId}}"
    }
  }
}
```

#### エラーメッセージ

```json
{
  "errors": {
    "afk": {
      "not_configured": "AFK機能が設定されていません。管理者に連絡してください。",
      "member_not_found": "指定されたメンバーが見つかりません",
      "user_not_in_voice": "対象ユーザーはボイスチャンネルに参加していません",
      "channel_not_found": "AFKチャンネルが見つかりません。設定を確認してください。",
      "invalid_channel_type": "ボイスチャンネルを指定してください"
    }
  }
}
```

---

## ✅ テストケース

最新の件数とカバレッジは [TEST_PROGRESS.md](../progress/TEST_PROGRESS.md) を参照。

### `/afk` コマンド

#### 正常系

- [ ] **自分を移動**: 引数なしで実行し、実行者がAFKチャンネルに移動される
- [ ] **他ユーザーを移動**: user引数を指定し、対象ユーザーがAFKチャンネルに移動される
- [ ] **成功メッセージ**: 移動成功時に適切なメッセージが表示される

#### 異常系

- [ ] **AFK未設定**: AFK機能が設定されていない場合、エラーメッセージが表示される
- [ ] **VC未参加**: 対象ユーザーがボイスチャンネルに参加していない場合、エラーメッセージが表示される
- [ ] **メンバー不在**: 指定されたユーザーがサーバーに存在しない場合、エラーメッセージが表示される
- [ ] **チャンネル削除済み**: AFKチャンネルが削除されている場合、エラーメッセージが表示される
- [ ] **権限不足**: Botに移動権限がない場合、適切なエラーが表示される

### `/afk-config set-ch` コマンド

#### 正常系

- [ ] **チャンネル設定**: ボイスチャンネルを指定し、AFK設定が保存される
- [ ] **既存設定上書き**: 既にAFK設定がある場合、新しいチャンネルで上書きされる
- [ ] **成功メッセージ**: 設定成功時にMessageFlags.Ephemeralで通知される

#### 異常系

- [ ] **サーバー管理権限なし**: サーバー管理権限以外が実行した場合、エラーメッセージが表示される
- [ ] **無効なチャンネル**: テキストチャンネルなど、ボイスチャンネル以外を指定した場合、エラーメッセージが表示される

### `/afk-config view` コマンド

#### 正常系

- [ ] **設定表示**: AFK設定が存在する場合、チャンネル情報が表示される
- [ ] **未設定表示**: AFK設定がない場合、未設定メッセージが表示される

#### 異常系

- [ ] **サーバー管理権限なし**: サーバー管理権限以外が実行した場合、エラーメッセージが表示される

---

## 関連ドキュメント

- [TODO.md](../TODO.md) - 開発タスクと進捗
- [I18N_GUIDE.md](I18N_GUIDE.md) - 多言語対応ガイド
- [TESTING_GUIDELINES.md](TESTING_GUIDELINES.md) - テスト方針とガイドライン
