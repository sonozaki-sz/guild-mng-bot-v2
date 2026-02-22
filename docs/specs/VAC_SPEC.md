# VC自動作成機能 (VAC) - 仕様書

> トリガーチャンネル参加時に専用ボイスチャンネルを自動作成・管理する機能

最終更新: 2026年2月20日

---

## 📋 概要

ユーザーがトリガーチャンネル（CreateVC）に参加すると、自動的にそのユーザー専用のボイスチャンネルを作成する機能です。作成されたVCは参加者が全員退出すると自動的に削除されます。

### 主な用途

- ユーザーが自由に使えるプライベートVC空間の提供
- VC作成の手間を省く自動化
- 使用されていないVCの自動クリーンアップ

### 特徴

- **自動作成**: トリガーチャンネル参加で即座にVC作成
- **操作パネル**: VCのチャットに設置されたパネルでVC参加中のユーザーが名前・人数制限を変更可能
- **管理権限付与**: 作成者にのみチャンネルスコープの `ManageChannels` 権限を付与（Discord標準UI経由での詳細設定用。なおサーバーレベルで `ManageChannels` / `Administrator` を持つユーザーは元来全チャンネルを操作可能）
- **自動削除**: VCが空になると自動削除

---

## 🎯 主要機能

### 1. 自動チャンネル作成

**トリガー**: `voiceStateUpdate` イベント - 指定されたトリガーチャンネルへの参加

**作成されるチャンネル:**

- **ボイスチャンネル**: `{ユーザー名}'s Room`
- **権限**: 作成者に `ManageChannels` 権限を付与
- **デフォルト設定**: 人数制限 99、トリガーチャンネルと同じカテゴリ

**処理フロー:**

```
1. ユーザーがトリガーチャンネル（CreateVC）に参加
   ↓
2. voiceStateUpdateイベントで検知
   ↓
3. 新しいVCを作成
   - 名前: {ユーザー名}'s Room
   - カテゴリ: トリガーチャンネルと同じ
   - 人数制限: 99（デフォルト）
   - 作成者にManageChannels権限を付与
   ↓
4. VCのチャットチャンネルに操作パネルを設置
   ↓
5. ユーザーを新しいVCに自動移動
   ↓
6. データベースに作成したVCのIDを保存
```

### 2. 操作パネル

**配置場所**: 作成されたボイスチャンネルのチャット

**パネルUI:**

```
┌──────────────────────────────────┐
│ 🎤 ボイスチャンネル操作パネル    │
├──────────────────────────────────┤
│ このパネルからVCの設定を変更で   │
│ きます。                         │
│                                  │
│ [✏️ VC名を変更]                  │
│ [👥 人数制限を変更]              │
│ [🔇 メンバーをAFKに移動]         │
│ [🔄 パネルを最下部に移動]        │
└──────────────────────────────────┘
```

**ボタン機能:**

| ボタン                  | 機能             | 実行権限               | 説明                                       |
| ----------------------- | ---------------- | ---------------------- | ------------------------------------------ |
| ✏️ VC名を変更           | Modal表示        | VC参加中のユーザーのみ | テキスト入力でVC名を変更                   |
| 👥 人数制限を変更       | Modal表示        | VC参加中のユーザーのみ | 0-99の数値入力で人数制限を変更（0=無制限） |
| 🔇 メンバーをAFKに移動  | User Select Menu | VC参加中のユーザーのみ | 複数メンバーを選択してAFKチャンネルに移動  |
| 🔄 パネルを最下部に移動 | パネル再送信     | VC参加中のユーザーのみ | チャットが流れた際にパネルを最下部に移動   |

**パネル操作時の応答例:**

```
✏️ VC名を変更
✅ VC名を みんなのたまり場 に変更しました

👥 人数制限を変更
✅ 人数制限を 5 に設定しました
✅ 人数制限を 無制限 に設定しました

🔇 メンバーをAFKに移動
✅ 2人を AFK に移動しました

🔄 パネルを最下部に移動
✅ パネルを最下部に移動しました

エラー（VC未参加）
❌ このVCに参加しているユーザーのみ操作できます
```

> **権限設計の方針**: パネルボタン経由の操作はBotが代理実行するため、ユーザー側に `ManageChannels` 権限は不要です。ボタンハンドラーでは**VC参加チェック**を行い、そのVCに現在参加しているユーザーのみ実行できます。

**Discord標準設定:**

Discord標準UIからの操作権限は以下の通りです：

| ユーザー種別                                                                | Discord UI での操作範囲                                                                  |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **作成者**                                                                  | チャンネルスコープの `ManageChannels` 付与により、そのVCの編集・削除が可能               |
| **サーバーレベルで `ManageChannels` または `Administrator` を持つユーザー** | Discordの仕様上、全チャンネルの編集・削除が可能（VAC管理チャンネルも含む）               |
| **一般ユーザー**                                                            | Discord UIからは操作不可。パネル・コマンド経由（VC参加中のみ）で名前・人数制限のみ変更可 |

> **セキュリティ上の注意**: `@everyone` への `ManageChannels` 付与は行いません。この権限にはチャンネル削除・権限上書きも含まれるためです。名前変更・人数制限変更はパネルボタン経由（Bot代理実行）でVC参加中のユーザーが行えます。

### 3. 自動削除機能

**削除条件**: VCが完全に空になったとき

**処理フロー:**

```
1. voiceStateUpdateイベントで退出を検知
   ↓
2. VCが空かチェック
   ↓
3. 空の場合
   - VCを削除
   - データベースから削除
```

### 4. VC操作コマンド

**コマンド**: `/vac`

**実行権限**: そのVCに参加中のユーザーのみ（Bot側でVC参加チェックを実施）

#### サブコマンド: `vc-rename`

参加中のVCの名前を変更します。

**引数:**

| 引数名 | 型     | 必須 | 説明       |
| ------ | ------ | ---- | ---------- |
| name   | String | ✅   | 新しいVC名 |

**動作:**

1. コマンド実行者が自動作成VCに参加中か確認
2. 参加中のVCが自動作成VCか確認（VAC管理下か）
3. VCの名前を変更
4. 成功メッセージを返す

**実行例:**

```
/vac vc-rename name:みんなのたまり場
```

**成功時の応答:**

```
✅ VC名を みんなのたまり場 に変更しました
```

**エラー時の応答:**

- VCに参加していない場合：`❌ このコマンドはVC参加中にのみ使用できます`
- 参加中のVCがVAC管理外の場合：`❌ このVCは自動作成チャンネルではありません`

#### サブコマンド: `vc-limit`

参加中のVCの人数制限を変更します。

**引数:**

| 引数名 | 型      | 必須 | 説明                         |
| ------ | ------- | ---- | ---------------------------- |
| limit  | Integer | ✅   | 人数制限（0=無制限、最大99） |

**動作:**

1. コマンド実行者が自動作成VCに参加中か確認
2. 参加中のVCが自動作成VCか確認（VAC管理下か）
3. `limit` の値が 0〜99 の範囲か検証
4. VCの人数制限を変更（0 は無制限）
5. 成功メッセージを返す

**実行例:**

```
/vac vc-limit limit:5
/vac vc-limit limit:0
```

**成功時の応答:**

```
✅ 人数制限を 5 に設定しました
✅ 人数制限を 無制限 に設定しました
```

**エラー時の応答:**

- VCに参加していない場合：`❌ このコマンドはVC参加中にのみ使用できます`
- 参加中のVCがVAC管理外の場合：`❌ このVCは自動作成チャンネルではありません`
- 範囲外の値の場合：`❌ 人数制限は0〜99の範囲で指定してください`

---

### 5. 設定コマンド

**コマンド**: `/vac-config`

**実行権限**: サーバー管理権限（`ManageGuild`）

#### サブコマンド: `create-trigger-vc`

トリガーチャンネルを自動作成します。

**引数:**

| 引数名   | 型     | 必須 | 説明                                                                                              |
| -------- | ------ | ---- | ------------------------------------------------------------------------------------------------- |
| category | String | ❌   | 作成先カテゴリ（`TOP` またはカテゴリ）。未指定時はコマンド実行チャンネルのカテゴリ（なければTOP） |

**動作:**

1. `category` が指定されていれば、その対象（`TOP` またはカテゴリ）に「CreateVC」を作成
2. `category` が未指定なら、コマンド実行チャンネルのカテゴリーを作成先にする（カテゴリなしならTOP）
3. 同一カテゴリー内に既存トリガーチャンネルがある場合は作成しない
4. 別カテゴリーなら複数トリガーチャンネルを作成可能
5. 作成したチャンネルを自動的にトリガーチャンネルとして登録
6. データベースに保存

> **トリガー作成制約**: トリガーチャンネルは「カテゴリーごとに1個まで」。
>
> - カテゴリーAに1個、カテゴリーBに1個、トップレベル（カテゴリーなし）に1個、のように併存可能
> - 同一カテゴリーに2個目は作成不可

**実行例:**

```
/vac-config create-trigger-vc category:TOP
/vac-config create-trigger-vc category:カテゴリA
/vac-config create-trigger-vc
```

**成功時の応答:**

```
✅ トリガーチャンネル #CreateVC を作成しました
```

#### サブコマンド: `remove-trigger-vc`

トリガーチャンネルを削除します。

**引数:**

| 引数名   | 型     | 必須 | 説明                                                     |
| -------- | ------ | ---- | -------------------------------------------------------- |
| category | String | ❌   | 削除対象（`TOP` またはカテゴリ）。未指定時は実行カテゴリ |

**動作:**

1. `category` が指定されていれば、その対象を選択（`TOP`=カテゴリーなし、またはカテゴリ）
2. `category` が未指定なら、コマンド実行チャンネルのカテゴリを対象にする（カテゴリなしならTOP）
3. 指定カテゴリ（またはTOP）に紐づくトリガーチャンネルを特定
4. チャンネルを削除
5. データベースから登録解除

**実行例:**

```
/vac-config remove-trigger-vc category:TOP
/vac-config remove-trigger-vc category:カテゴリA
/vac-config remove-trigger-vc
```

**成功時の応答:**

```
✅ トリガーチャンネル #CreateVC を削除しました
```

#### サブコマンド: `view`

現在のVC自動作成機能の設定を表示します。

**引数:** なし

**動作:**

1. 現在のVC自動作成機能の設定を取得
2. トリガーチャンネル一覧と作成されたVC一覧を表示

**実行例:**

```
/vac-config view
```

**応答例:**

```
【ℹ️ VC自動作成機能】
トリガーチャンネル
- #CreateVC (TOP)
- #CreateVC (カテゴリA)
作成されたVC
- #しゅん's Room(@shun)
- #作業VC(@alice)
```

未作成時:

```
【ℹ️ VC自動作成機能】
トリガーチャンネル
未設定
作成されたVC
なし
```

---

## 💾 データベース設計

### GuildConfig.vacConfig

VC自動作成機能の設定は`GuildConfig`テーブルの`vacConfig`フィールドにJSON形式で保存されます。

**型定義:**

```typescript
interface VacConfig {
  enabled: boolean; // 機能の有効/無効
  triggerChannelIds: string[]; // トリガーチャンネルIDリスト
  createdChannels: VacChannelPair[]; // 作成されたチャンネル一覧
}

interface VacChannelPair {
  voiceChannelId: string; // ボイスチャンネルID
  ownerId: string; // 作成者（所有者）のユーザーID
  createdAt: number; // 作成日時（Unix timestamp）
}
```

**保存例:**

```json
{
  "enabled": true,
  "triggerChannelIds": ["123456789012345678"],
  "createdChannels": [
    {
      "voiceChannelId": "987654321098765432",
      "ownerId": "111222333444555666",
      "createdAt": 1708329600000
    }
  ]
}
```

**初期値:**

```json
{
  "enabled": false,
  "triggerChannelIds": [],
  "createdChannels": []
}
```

---

## 🏗️ 実装詳細

### イベントハンドラー

#### voiceStateUpdate - VC作成・削除

**ファイル**: `src/bot/events/voiceStateUpdate.ts`

**VC作成処理フロー:**

```typescript
async function handleVacCreate(newState: VoiceState): Promise<void> {
  const member = newState.member;
  const newChannel = newState.channel;
  if (!member || !newChannel || newChannel.type !== ChannelType.GuildVoice) {
    return;
  }

  const config = await getVacConfigOrDefault(member.guild.id);
  if (!config.enabled || !config.triggerChannelIds.includes(newChannel.id)) {
    return;
  }

  const existingOwnedChannel = config.createdChannels.find(
    (channel) => channel.ownerId === member.id,
  );
  if (existingOwnedChannel) {
    const ownedChannel = await member.guild.channels
      .fetch(existingOwnedChannel.voiceChannelId)
      .catch(() => null);
    if (ownedChannel?.type === ChannelType.GuildVoice) {
      await member.voice.setChannel(ownedChannel);
      return;
    }
    await removeCreatedVacChannel(
      member.guild.id,
      existingOwnedChannel.voiceChannelId,
    );
  }

  const parentCategory =
    newChannel.parent?.type === ChannelType.GuildCategory
      ? newChannel.parent
      : null;

  if (parentCategory && parentCategory.children.cache.size >= 50) {
    return;
  }

  const voiceChannel = await member.guild.channels.create({
    name: buildUniqueChannelName(member, member.guild.channels.cache),
    type: ChannelType.GuildVoice,
    parent: parentCategory?.id ?? null,
    userLimit: 99,
    permissionOverwrites: [
      {
        id: member.id,
        allow: [PermissionFlagsBits.ManageChannels],
      },
    ],
  });

  if (voiceChannel.type !== ChannelType.GuildVoice) {
    return;
  }

  await sendVacControlPanel(voiceChannel);
  await member.voice.setChannel(voiceChannel);

  await addCreatedVacChannel(member.guild.id, {
    voiceChannelId: voiceChannel.id,
    ownerId: member.id,
    createdAt: Date.now(),
  });
}
```

**VC削除処理フロー:**

```typescript
async function handleVacDelete(oldState: VoiceState): Promise<void> {
  const oldChannel = oldState.channel;
  if (!oldChannel || oldChannel.type !== ChannelType.GuildVoice) {
    return;
  }

  const config = await getVacConfigOrDefault(oldChannel.guild.id);
  const isManaged = config.createdChannels.some(
    (channel) => channel.voiceChannelId === oldChannel.id,
  );

  if (!isManaged || oldChannel.members.size > 0) {
    return;
  }

  await oldChannel.delete().catch(() => null);
  await removeCreatedVacChannel(oldChannel.guild.id, oldChannel.id);
}
```

#### channelDelete - トリガーチャンネル削除検知

**ファイル**: `src/bot/events/channelDelete.ts`

```typescript
async function handleChannelDelete(channel: GuildChannel): Promise<void> {
  if (channel.isDMBased()) return;
  if (channel.type !== ChannelType.GuildVoice) return;

  const config = await getVacConfigOrDefault(channel.guildId);

  if (config.triggerChannelIds.includes(channel.id)) {
    await removeTriggerChannel(channel.guildId, channel.id);
  }

  const isManagedChannel = config.createdChannels.some(
    (item) => item.voiceChannelId === channel.id,
  );
  if (isManagedChannel) {
    await removeCreatedVacChannel(channel.guildId, channel.id);
  }
}
```

### コマンド実装

#### `/vac-config` コマンド

**ファイル**: `src/bot/commands/vac-config.ts`

**権限チェック:**

- `PermissionFlagsBits.ManageGuild` を要求

**サブコマンド処理:**

各サブコマンド（create-trigger-vc, remove-trigger-vc, view）の実装詳細は主要機能セクションを参照。

### `/vac` コマンド

**ファイル**: `src/bot/commands/vac.ts`

**権限チェック（共通）:**

```typescript
async function getManagedVoiceChannel(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<{ id: string }> {
  const member = await interaction.guild?.members.fetch(interaction.user.id);
  const voiceChannel = member?.voice.channel;

  if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.not_in_any_vc"),
    );
  }

  const isManaged = await isManagedVacChannel(guildId, voiceChannel.id);
  if (!isManaged) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.not_vac_channel"),
    );
  }

  return { id: voiceChannel.id };
}
```

### 操作パネル

**ファイル**: `src/bot/services/VacControlPanel.ts`

**パネル送信:**

```typescript
async function sendVacControlPanel(voiceChannel: VoiceChannel) {
  if (!voiceChannel.isTextBased() || !voiceChannel.isSendable()) return;

  const guildId = voiceChannel.guild.id;
  const title = await tGuild(guildId, "commands:vac.panel.title");
  const description = await tGuild(guildId, "commands:vac.panel.description");

  const renameLabel = await tGuild(guildId, "commands:vac.panel.rename_button");
  const limitLabel = await tGuild(guildId, "commands:vac.panel.limit_button");
  const afkLabel = await tGuild(guildId, "commands:vac.panel.afk_button");
  const refreshLabel = await tGuild(
    guildId,
    "commands:vac.panel.refresh_button",
  );

  const embed = createInfoEmbed(description, { title });

  const renameRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`vac:rename:${voiceChannel.id}`)
      .setLabel(renameLabel)
      .setEmoji("✏️")
      .setStyle(ButtonStyle.Primary),
  );

  const limitRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`vac:limit:${voiceChannel.id}`)
      .setLabel(limitLabel)
      .setEmoji("👥")
      .setStyle(ButtonStyle.Primary),
  );

  const afkRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`vac:afk:${voiceChannel.id}`)
      .setLabel(afkLabel)
      .setEmoji("🔇")
      .setStyle(ButtonStyle.Primary),
  );

  const refreshRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`vac:refresh:${voiceChannel.id}`)
      .setLabel(refreshLabel)
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Primary),
  );

  await voiceChannel.send({
    embeds: [embed],
    components: [renameRow, limitRow, afkRow, refreshRow],
  });
}
```

**ボタンインタラクション:**

各ボタンの処理詳細（Modal表示、User Select Menuなど）は主要機能セクションを参照。

**権限チェック:**

パネルの全ボタンハンドラーでは、インタラクションを発行したユーザーが**そのVCに現在参加しているか**を確認します。参加していない場合はエラーを返します。Botが `voiceChannel.edit()` を直接呼び出すため、ユーザー側の `ManageChannels` 権限は不要です。

```typescript
// VC名変更ボタンのハンドラー例（VC参加チェックあり）
async function handleVacRename(interaction: ButtonInteraction) {
  const channelId = getVacPanelChannelId(interaction.customId, "vac:rename:");
  const voiceChannel = await interaction.guild?.channels.fetch(channelId);
  if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
    await safeReply(interaction, {
      embeds: [
        createErrorEmbed(await tGuild(guildId, "errors:vac.not_vac_channel")),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // VC参加チェック: インタラクションを発行したユーザーがVCにいるか確認
  const member = interaction.member as GuildMember;
  if (member.voice.channelId !== voiceChannel.id) {
    await safeReply(interaction, {
      embeds: [createErrorEmbed(await tGuild(guildId, "errors:vac.not_in_vc"))],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(`vac:rename-modal:${voiceChannel.id}`)
    .setTitle("VC名を変更");
  // ...
  await interaction.showModal(modal);
}
```

---

## 🌐 多言語対応（i18next）

### 翻訳キー

#### コマンド説明

```json
{
  "vac-config": {
    "description": "VC自動作成機能の設定",
    "create-trigger-vc": {
      "description": "トリガーチャンネルを作成",
      "category": {
        "description": "作成先カテゴリ（TOP またはカテゴリ。未指定時は実行カテゴリ）"
      }
    },
    "remove-trigger-vc": {
      "description": "トリガーチャンネルを削除",
      "category": {
        "description": "削除対象（未指定時は実行カテゴリ）",
        "top": "TOP（カテゴリなし）"
      }
    },
    "view": {
      "description": "現在のVC自動作成機能の設定を表示"
    }
  }
}
```

#### コマンド説明（`/vac`）

```json
{
  "vac": {
    "description": "自動作成VCの設定を変更",
    "vc-rename": {
      "description": "参加中のVC名を変更",
      "name": {
        "description": "新しいVC名"
      }
    },
    "vc-limit": {
      "description": "参加中のVCの人数制限を変更",
      "limit": {
        "description": "人数制限（0=無制限、最大99）"
      }
    }
  }
}
```

#### コマンド応答

```json
{
  "commands": {
    "vac-config": {
      "embed": {
        "title": "VC自動作成機能",
        "field": {
          "trigger_channels": "トリガーチャンネル",
          "created_vc_details": "作成されたVC"
        },
        "not_configured": "未設定",
        "no_created_vcs": "なし"
      }
    },
    "vac": {
      "renamed": "VC名を {{name}} に変更しました",
      "limit_changed": "人数制限を {{limit}} に設定しました",
      "members_moved": "{{count}}人を AFK に移動しました",
      "panel_refreshed": "パネルを最下部に移動しました"
    }
  }
}
```

#### パネルUI

```json
{
  "vac": {
    "panel": {
      "title": "ボイスチャンネル操作パネル",
      "description": "このパネルからVCの設定を変更できます。",
      "rename_button": "VC名を変更",
      "limit_button": "人数制限を変更",
      "afk_button": "メンバーをAFKに移動",
      "refresh_button": "パネルを最下部に移動"
    }
  }
}
```

#### エラーメッセージ

```json
{
  "errors": {
    "vac": {
      "not_configured": "VC自動作成機能が設定されていません",
      "trigger_not_found": "トリガーチャンネルが見つかりません",
      "already_exists": "トリガーチャンネルが既に存在します",
      "category_full": "カテゴリがチャンネル数の上限に達しています",
      "no_permission": "チャンネルを作成する権限がありません",
      "not_in_vc": "このVCに参加しているユーザーのみ操作できます",
      "not_in_any_vc": "このコマンドはVC参加中にのみ使用できます",
      "not_vac_channel": "このVCは自動作成チャンネルではありません",
      "limit_out_of_range": "人数制限は0〜99の範囲で指定してください"
    }
  }
}
```

---

## 🚨 エラーハンドリング

### 想定されるエラー

**1. 権限不足**

```typescript
function ensureManageGuildPermission(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): void {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    throw new ValidationError(
      tDefault("errors:permission.manage_guild_required", { guildId }),
    );
  }
}
```

**2. カテゴリが満杯**

```typescript
if (category && category.children.cache.size >= 50) {
  throw new ValidationError(await tGuild(guildId, "errors:vac.category_full"));
}
```

**3. 名前の重複**

```typescript
function buildUniqueChannelName(
  member: GuildMember,
  channels: GuildChannelsCache,
): string {
  const baseName = `${member.displayName}'s Room`;
  let channelName = baseName;
  let counter = 2;

  while (channels.find((channel) => channel.name === channelName)) {
    channelName = `${baseName} (${counter})`;
    counter += 1;
  }

  return channelName;
}
```

**4. Bot再起動時のクリーンアップ**

```typescript
for (const [, guild] of client.guilds.cache) {
  const vacConfig = await getVacConfigOrDefault(guild.id);

  for (const triggerChannelId of vacConfig.triggerChannelIds) {
    const triggerChannel = await guild.channels
      .fetch(triggerChannelId)
      .catch(() => null);

    if (!triggerChannel || triggerChannel.type !== ChannelType.GuildVoice) {
      await removeTriggerChannel(guild.id, triggerChannelId);
    }
  }

  for (const channelInfo of vacConfig.createdChannels) {
    const channel = await guild.channels
      .fetch(channelInfo.voiceChannelId)
      .catch(() => null);

    if (!channel) {
      await removeCreatedVacChannel(guild.id, channelInfo.voiceChannelId);
      continue;
    }

    if (channel.isDMBased() || channel.type !== ChannelType.GuildVoice) {
      await removeCreatedVacChannel(guild.id, channelInfo.voiceChannelId);
      continue;
    }

    if (channel.members.size === 0) {
      await channel.delete().catch(() => null);
      await removeCreatedVacChannel(guild.id, channelInfo.voiceChannelId);
    }
  }
}
```

**5. トリガーチャンネル削除検知**

`channelDelete` イベントで自動的にデータベースから削除（実装詳細セクション参照）。

---

## ✅ テストケース

最新の件数とカバレッジは [TEST_PROGRESS.md](../progress/TEST_PROGRESS.md) を参照。

### `/vac-config create-trigger-vc` コマンド

#### 正常系

- [ ] **トリガーチャンネル作成**: コマンド実行チャンネルと同じカテゴリに「CreateVC」が作成される
- [ ] **カテゴリ指定作成**: `category` 指定時に指定カテゴリへトリガーチャンネルが作成される
- [ ] **TOP指定作成**: `category:TOP` 指定時にカテゴリなし（TOP）へトリガーチャンネルが作成される
- [ ] **カテゴリ未指定作成**: `category` 未指定時にコマンド実行チャンネルのカテゴリ（なければTOP）へ作成される
- [ ] **カテゴリ単位制約**: 同一カテゴリに2個目のトリガーチャンネルは作成できない
- [ ] **複数カテゴリ許可**: 別カテゴリにはそれぞれトリガーチャンネルを作成できる
- [ ] **自動登録**: 作成されたチャンネルが自動的にトリガーチャンネルとして登録される
- [ ] **成功メッセージ**: 作成成功時に適切なメッセージが表示される

#### 異常系

- [ ] **サーバー管理権限なし**: 権限不足で実行した場合、エラーメッセージが表示される
- [ ] **同一カテゴリ重複作成**: 同一カテゴリに既存トリガーがある場合、エラーメッセージが表示される
- [ ] **カテゴリ満杯**: カテゴリのチャンネル数が上限の場合、エラーメッセージが表示される

### `/vac-config remove-trigger-vc` コマンド

#### 正常系

- [ ] **カテゴリ指定削除**: 指定カテゴリのトリガーチャンネルが削除される
- [ ] **TOP指定削除**: `TOP` 選択でカテゴリなしトリガーチャンネルが削除される
- [ ] **カテゴリ未指定削除**: `category` 未指定時にコマンド実行チャンネルのカテゴリ（なければTOP）が対象になる
- [ ] **登録解除**: データベースからトリガーチャンネル登録が解除される
- [ ] **成功メッセージ**: 削除成功時に適切なメッセージが表示される

#### 異常系

- [ ] **サーバー管理権限なし**: 権限不足で実行した場合、エラーメッセージが表示される
- [ ] **対象不在**: 指定カテゴリ（またはTOP）にトリガーチャンネルがない場合、適切に処理される

### `/vac-config view` コマンド

#### 正常系

- [ ] **設定表示**: 現在のトリガーチャンネルと作成されたVC一覧が表示される
- [ ] **未設定表示**: VAC設定がない場合、未設定メッセージが表示される

#### 異常系

- [ ] **サーバー管理権限なし**: 権限不足で実行した場合、エラーメッセージが表示される

### VC自動作成

#### 正常系

- [ ] **トリガー検知**: トリガーチャンネルへの参加を正しく検知
- [ ] **VC作成**: ユーザー名を含む適切な名前でVCが作成される
- [ ] **権限付与**: 作成者にManageChannels権限が付与される
- [ ] **操作パネル設置**: VCのチャットに操作パネルが送信される
- [ ] **自動移動**: ユーザーが作成されたVCに自動移動される
- [ ] **DB保存**: 作成されたVCの情報がデータベースに保存される

#### 異常系

- [ ] **権限不足**: Botにチャンネル作成権限がない場合、適切なエラーが表示される
- [ ] **名前重複**: 同名のチャンネルが存在する場合、数字サフィックスが追加される
- [ ] **カテゴリ満杯**: カテゴリが満杯の場合、エラーメッセージが表示される

### VC自動削除

#### 正常系

- [ ] **空室検知**: VCが完全に空になったことを正しく検知
- [ ] **VC削除**: 空になったVCが自動的に削除される
- [ ] **DB削除**: データベースから該当VCの情報が削除される

#### 異常系

- [ ] **削除失敗**: VCの削除に失敗した場合、適切にログ記録される

### `/vac vc-rename` コマンド

#### 正常系

- [ ] **名前変更**: 参加中の自動作成VCの名前が変更される
- [ ] **成功通知**: 変更成功時に確認メッセージが表示される（MessageFlags.Ephemeral）

#### 異常系

- [ ] **VC未参加**: VCに参加していない状態でコマンドを実行するとエラーメッセージが表示される（MessageFlags.Ephemeral）
- [ ] **VAC管理外VC**: 自動作成VC以外のVCに参加中にコマンドを実行するとエラーメッセージが表示される（MessageFlags.Ephemeral）

### `/vac vc-limit` コマンド

#### 正常系

- [ ] **制限変更**: 参加中の自動作成VCの人数制限が変更される
- [ ] **無制限設定**: 0を指定すると無制限に設定される
- [ ] **成功通知**: 変更成功時に確認メッセージが表示される（MessageFlags.Ephemeral）

#### 異常系

- [ ] **VC未参加**: VCに参加していない状態でコマンドを実行するとエラーメッセージが表示される（MessageFlags.Ephemeral）
- [ ] **VAC管理外VC**: 自動作成VC以外のVCに参加中にコマンドを実行するとエラーメッセージが表示される（MessageFlags.Ephemeral）
- [ ] **バリデーション**: 0-99の範囲外の値を指定するとエラーメッセージが表示される（MessageFlags.Ephemeral）

### 操作パネル

#### VC名変更

- [ ] **Modal表示**: ボタンクリックでModalが表示される
- [ ] **名前変更**: 入力された名前でVCの名前が変更される
- [ ] **成功通知**: 変更成功時に確認メッセージが表示される
- [ ] **VC参加者のみ**: そのVCに参加中のユーザーのみボタンから名前変更できる
- [ ] **非参加者拒否**: VCに参加していないユーザーが操作するとエラーメッセージが表示される（MessageFlags.Ephemeral）
- [ ] **既存チャンネル非対象**: VAC管理外の通常チャンネルでは動作しない

#### 人数制限変更

- [ ] **Modal表示**: ボタンクリックでModalが表示される
- [ ] **バリデーション**: 0-99の範囲外の値が入力された場合、エラーが表示される
- [ ] **制限変更**: 入力された数値でVCの人数制限が変更される
- [ ] **無制限設定**: 0を入力すると無制限に設定される
- [ ] **VC参加者のみ**: そのVCに参加中のユーザーのみボタンから人数制限を変更できる
- [ ] **非参加者拒否**: VCに参加していないユーザーが操作するとエラーメッセージが表示される（MessageFlags.Ephemeral）
- [ ] **既存チャンネル非対象**: VAC管理外の通常チャンネルでは動作しない

#### AFK移動

- [ ] **User Select表示**: ボタンクリックでUser Select Menuが表示される
- [ ] **メンバー移動**: 選択されたメンバーがAFKチャンネルに移動される
- [ ] **複数選択**: 複数メンバーを選択して一括移動できる

#### パネル再送信

- [ ] **既存削除**: 既存のパネルメッセージが削除される
- [ ] **新規送信**: 新しいパネルが最下部に送信される

### channelDeleteイベント

#### 正常系

- [ ] **トリガー削除検知**: トリガーチャンネルの削除を正しく検知
- [ ] **自動登録解除**: データベースから削除されたトリガーチャンネルのIDが除去される
- [ ] **ログ記録**: 削除イベントが適切にログ記録される

### Bot再起動時のクリーンアップ

- [ ] **空VC検知**: Bot再起動時に空のVCを検出
- [ ] **クリーンアップ**: 空のVCが削除される
- [ ] **DB同期**: データベースと実際のチャンネル状態が同期される
- [ ] **トリガー同期**: Bot停止中に削除されたトリガーチャンネルIDが起動時に除去される

---

## 関連ドキュメント

- [TODO.md](../TODO.md) - 開発タスクと進捗
- [AFK_SPEC.md](AFK_SPEC.md) - AFK機能仕様（AFK移動機能で使用）
- [I18N_GUIDE.md](I18N_GUIDE.md) - 多言語対応ガイド
- [TESTING_GUIDELINES.md](TESTING_GUIDELINES.md) - テスト方針とガイドライン
