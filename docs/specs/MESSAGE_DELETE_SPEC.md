# メッセージ削除機能 - 仕様書

> Message Delete Function - メッセージ削除機能

最終更新: 2026年2月19日

---

## 📋 概要

### 目的

モデレーター権限を持つユーザーが、特定ユーザーのメッセージや指定件数のメッセージを一括削除できる機能を提供し、スパムや不適切なメッセージの迅速な対応を可能にします。

### 主な用途

1. **スパム対策**: 大量のスパムメッセージを一括削除
2. **不適切なコンテンツの削除**: 特定ユーザーの違反メッセージを一括削除
3. **チャンネルクリーンアップ**: テストメッセージや古いメッセージの整理
4. **モデレーション効率化**: 手動削除の手間を大幅に削減

### 特徴

- **柔軟な削除条件**: 件数指定、ユーザー指定、チャンネル指定を自由に組み合わせ
- **14日以上前のメッセージにも対応**: 古いメッセージも個別削除で対応
- **安全性重視**: すべてのオプション未指定時は実行を拒否
- **進捗表示**: 大量削除時にリアルタイムで進捗を表示
- **Cooldown機能**: 連続実行を防止し、誤操作を軽減

---

## 🎯 主要機能

### `/message-delete` コマンド

チャンネル内のメッセージを一括削除

---

## ⚙️ コマンド仕様

### オプション

**1. `count` (オプション)**

- 削除するメッセージ数
- 範囲: 1以上（上限なし）
- 未指定の場合: 対象メッセージをすべて削除
- 注: 大量削除は時間がかかる場合があります

**2. `user` (オプション)**

- 削除対象のユーザーを指定
- 指定した場合、そのユーザーのメッセージのみ削除
- 未指定の場合、すべてのメッセージが対象

**3. `channel` (オプション)**

- 削除を実行するチャンネル
- 未指定の場合、コマンド実行チャンネルで実行

---

## 💡 使用例

### ⚠️ 注意: すべてのオプション未指定は禁止

```
/message-delete
```

- **エラー**: すべてのオプションが未指定の場合は警告を表示して削除を中止
- チャンネル全削除と同じ効果になるため、安全のため禁止
- 少なくとも`count`、`user`、`channel`のいずれか1つを指定する必要があります

### 例1: 最新50件のみ削除

```
/message-delete count:50
```

- コマンド実行チャンネルの最新50件を削除

### 例2: 大量削除（例：1000件）

```
/message-delete count:1000
```

- コマンド実行チャンネルの最新1000件を削除
- 100件ずつ複数回に分けて削除処理を実行
- 14日以上前のメッセージは個別削除（時間がかかります）

### 例3: 古いプロフィールメッセージを削除

```
/message-delete count:5 user:@User channel:#profile
```

- #profileチャンネルの@Userのメッセージを5件削除
- 3ヶ月前のメッセージでも削除可能（個別削除で対応）

### 例4: 特定ユーザーのメッセージをすべて削除

```
/message-delete user:@BadUser
```

- @BadUserのメッセージをすべて削除
- チャンネル内の該当ユーザーのメッセージを全て検索して削除

### 例5: 特定ユーザーのメッセージを件数指定で削除

```
/message-delete count:10 user:@BadUser
```

- @BadUserのメッセージを最大10件削除

### 例6: 別チャンネルのメッセージを削除

```
/message-delete count:20 channel:#spam-channel
```

- #spam-channelの最新20件を削除

---

## 🔒 権限チェック

### 実行者の必要権限

- `MANAGE_MESSAGES` (メッセージ管理)
- または、`ADMINISTRATOR` (管理者)

### Botの必要権限

- `MANAGE_MESSAGES` (メッセージ管理)
- `READ_MESSAGE_HISTORY` (メッセージ履歴の閲覧)

**権限不足の場合:**

- エラーメッセージを表示
- ログに記録

### Cooldown（クールダウン）

- **待機時間**: 5秒
- **目的**: 同じユーザーによる連続実行を防止
- **注意**: 大量削除中は処理が完了するまで時間がかかるため、完了前に再実行しても cooldown で制限される

### 同時実行時の挙動

**同じユーザーが連続実行:**

- Cooldown (5秒) により制限される
- 前回のコマンド実行から5秒経過していないと実行できない

**異なるユーザーが同じチャンネルで実行:**

- 同時実行可能（制限なし）
- 両方の削除処理が並行して実行される
- 注意点:
  - 同じメッセージを削除しようとするとエラーが発生する可能性
  - エラーは無視して処理を継続（後述のエラーハンドリング参照）
  - レート制限に引っかかりやすくなる

**推奨事項:**

- 同じチャンネルで複数のモデレーターが同時に削除コマンドを実行しないようコミュニケーションを取る
- 大量削除中は他のモデレーターに通知する

---

## 🔄 処理フロー

```
1. コマンド実行
   ↓
2. オプション検証
   - すべてのオプションが未指定の場合は警告を出して中止
   ↓
3. 権限チェック
   - 実行者の権限確認
   - Botの権限確認
   ↓
4. 対象チャンネル取得
   ↓
5. メッセージ取得（ループ）
   - 100件ずつフェッチ（指定件数に達するまで繰り返し）
   - ユーザー指定がある場合はフィルタリング
   - すべてのメッセージを収集（14日制限なし）
   ↓
6. メッセージを14日以内/以降に分類
   - 14日以内: bulkDelete対象
   - 14日以降: 個別削除対象
   ↓
7. メッセージ削除（ループ）
   - 14日以内: 100件ずつbulkDeleteで高速削除
   - 14日以降: 1件ずつ個別削除（レート制限考慮）
   - 削除進捗を更新（大量削除時）
   ↓
8. 結果通知
   - 削除件数を表示（一括削除/個別削除の内訳も表示）
   - 一時メッセージ（10秒後に自動削除）
   ↓
9. ログ記録
   - 実行者
   - 削除件数
   - 対象ユーザー（指定されている場合）
```

---

## 📊 実装例

### TypeScript実装

```typescript
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";

export const msgDelCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("message-delete")
    .setDescription("メッセージを一括削除します")
    .addIntegerOption((option) =>
      option
        .setName("count")
        .setDescription("削除するメッセージ数（未指定で全件削除）")
        .setRequired(false)
        .setMinValue(1),
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("特定ユーザーのメッセージのみ削除")
        .setRequired(false),
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("削除を実行するチャンネル")
        .setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction: ChatInputCommandInteraction) {
    // Deferレスポンス（MessageFlags.Ephemeral）
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const countOption = interaction.options.getInteger("count");
    const targetUser = interaction.options.getUser("user", false);
    const channelOption = interaction.options.getChannel("channel", false);

    // すべてのオプションが未指定の場合は警告
    if (!countOption && !targetUser && !channelOption) {
      await interaction.editReply(
        "⚠️ 警告: この操作はすべてのオプションが未指定のため実行できません。\n" +
          "チャンネル内のすべてのメッセージを削除する場合は、チャンネルを削除することをお勧めします。\n" +
          "少なくとも `count`、`user`、`channel` のいずれか1つを指定してください。",
      );
      return;
    }

    const count = countOption ?? Infinity;
    const targetChannel = channelOption || interaction.channel;

    // チャンネルがテキストチャンネルか確認
    if (!targetChannel?.isTextBased()) {
      await interaction.editReply("テキストチャンネルを指定してください。");
      return;
    }

    try {
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const allMessages = [];
      let lastId = undefined;

      // メッセージを複数回フェッチ（指定件数に達するまで）
      while (allMessages.length < count) {
        const fetchLimit = Math.min(100, count - allMessages.length);
        const batch = await targetChannel.messages.fetch({
          limit: fetchLimit,
          before: lastId,
        });

        if (batch.size === 0) break;

        // ユーザーフィルター
        const filtered = targetUser
          ? batch.filter((msg) => msg.author.id === targetUser.id)
          : batch;

        allMessages.push(...filtered.values());
        lastId = batch.last()?.id;

        if (batch.size < 100) break;
      }

      // 必要な件数だけ切り出し
      const messagesToDelete = allMessages.slice(0, count);

      if (messagesToDelete.length === 0) {
        await interaction.editReply(
          "削除可能なメッセージが見つかりませんでした。",
        );
        return;
      }

      // 14日以内/以降で分類
      const newMessages = messagesToDelete.filter(
        (msg) => msg.createdTimestamp > twoWeeksAgo,
      );
      const oldMessages = messagesToDelete.filter(
        (msg) => msg.createdTimestamp <= twoWeeksAgo,
      );

      let deletedCount = 0;

      // 14日以内のメッセージを一括削除（bulkDelete）
      if (newMessages.length > 0) {
        for (let i = 0; i < newMessages.length; i += 100) {
          const chunk = newMessages.slice(i, i + 100);
          await targetChannel.bulkDelete(chunk, true);
          deletedCount += chunk.length;

          // 進捗更新
          if (messagesToDelete.length > 100) {
            await interaction.editReply(
              `削除中... ${deletedCount}/${messagesToDelete.length}件 (一括削除)`,
            );
          }

          // レート制限回避
          if (i + 100 < newMessages.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      // 14日以降のメッセージを個別削除
      if (oldMessages.length > 0) {
        await interaction.editReply(
          `削除中... ${deletedCount}/${messagesToDelete.length}件 (14日以上前のメッセージを個別削除中...)`,
        );

        for (const msg of oldMessages) {
          try {
            await msg.delete();
            deletedCount++;

            // 10件ごとに進捗更新
            if (
              deletedCount % 10 === 0 ||
              deletedCount === messagesToDelete.length
            ) {
              await interaction.editReply(
                `削除中... ${deletedCount}/${messagesToDelete.length}件`,
              );
            }

            // レート制限回避（個別削除は遅いので待機）
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (error) {
            logger.warn(`[MsgDel] Failed to delete message ${msg.id}:`, error);
            // 既に削除されている場合などのエラーは無視して継続
          }
        }
      }

      // 結果通知
      let resultMessage = targetUser
        ? `${targetUser.tag}のメッセージを${deletedCount}件削除しました。`
        : `${deletedCount}件のメッセージを削除しました。`;

      // 削除内訳を追加
      if (newMessages.length > 0 && oldMessages.length > 0) {
        resultMessage += `\n(一括削除: ${newMessages.length}件、個別削除: ${oldMessages.length}件)`;
      } else if (oldMessages.length > 0) {
        resultMessage += `\n(すべて個別削除)`;
      }

      await interaction.editReply(resultMessage);

      // ログ記録
      logger.info(
        `[MsgDel] ${interaction.user.tag} deleted ${deletedCount} messages in ${targetChannel.name}${
          targetUser ? ` from ${targetUser.tag}` : ""
        }`,
      );
    } catch (error) {
      logger.error("[MsgDel] Error:", error);
      await interaction.editReply("メッセージの削除中にエラーが発生しました。");
    }
  },

  cooldown: 5,
};
```

**Cooldownの実装詳細:**

- 各ユーザーごとに最後のコマンド実行時刻を記録
- 同じユーザーが5秒以内に再実行しようとするとエラーメッセージを表示
- 異なるユーザーは個別にcooldownが管理される

---

## ⚠️ Discord API制限

### 14日制限（bulkDelete）

Discordの`bulkDelete`メソッドは、**14日以上前のメッセージを削除できません**。

**対応:**

- **14日以内**: `bulkDelete()`で高速一括削除（100件ずつ）
- **14日以降**: `message.delete()`で個別削除（1件ずつ、時間がかかる）
- 削除対象のメッセージを自動的に分類して適切な方法で削除

**パフォーマンス:**

- 一括削除: 100件を数秒で削除
- 個別削除: 1件あたり約0.5秒（レート制限考慮）
  - 例: 100件の個別削除 → 約50秒
  - 例: 500件の個別削除 → 約250秒（約4分）

### レート制限

- 一度に削除できるメッセージ数: 最大100件（bulkDelete制限）
- メッセージフェッチ: 100件ずつ
- レート制限: 適切な間隔を空ける必要あり

**対応:**

- 100件ずつに分割してフェッチ・削除
- 削除バッチ間に1秒の待機時間を挿入
- 大量削除時は進捗を表示

---

## 🛡️ エラーハンドリング

### 想定されるエラー

1. **すべてのオプション未指定**

   ```
   ⚠️ 警告: この操作はすべてのオプションが未指定のため実行できません。
   チャンネル内のすべてのメッセージを削除する場合は、チャンネルを削除することをお勧めします。
   少なくとも `count`、`user`、`channel` のいずれか1つを指定してください。
   ```

2. **権限不足**

   ```
   ❌ この操作を実行する権限がありません。
   必要な権限: メッセージ管理
   ```

3. **Bot権限不足**

   ```
   ❌ Botにメッセージ削除権限がありません。
   ```

4. **古いメッセージの個別削除（時間がかかる）**

   ```
   ⚠️ 14日以上前のメッセージは個別削除します。時間がかかる場合があります。
   削除中... 50/200件
   ```

5. **メッセージが見つからない**

   ```
   ℹ️ 削除可能なメッセージが見つかりませんでした。
   ```

6. **メッセージが既に削除されている（同時実行時）**
   - 他のユーザーが同時に削除コマンドを実行した場合
   - メッセージが既に削除されているエラーは無視して処理を継続
   - ログに警告を記録（削除失敗件数は含めない）

---

## 📝 ログ記録

### ログフォーマット

```
[MsgDel] <実行者> deleted <削除件数> messages in <チャンネル名> [from <対象ユーザー>]
```

### 例

```
[MsgDel] Admin#1234 deleted 50 messages in #general from Spammer#5678
[MsgDel] Moderator#4321 deleted 100 messages in #spam-channel
```

---

## 🧪 テストケース

最新の件数とカバレッジは [TEST_PROGRESS.md](../progress/TEST_PROGRESS.md) を参照。

### ユニットテスト

- [ ] 権限チェック
- [ ] メッセージフィルタリング
- [ ] 14日制限フィルター
- [ ] 件数制限
- [ ] count未指定時の全件削除ロジック
- [ ] すべてのオプション未指定時のバリデーション

### インテグレーションテスト

- [ ] 通常削除（14日以内のメッセージ）
- [ ] 14日以上前のメッセージの個別削除
- [ ] 混在メッセージ（14日以内 + 14日以降）の削除
- [ ] ユーザー指定削除（すべてのメッセージ）
- [ ] ユーザー指定 + count指定削除
- [ ] チャンネル指定削除
- [ ] すべてのオプション未指定時のエラー処理
- [ ] 権限不足エラー
- [ ] Cooldown機能
- [ ] 同時実行時のエラーハンドリング（メッセージ削除競合）
- [ ] 大量削除時の進捗表示

---

## 🌐 多言語対応（i18next）

### ローカライゼーションキー

```typescript
// commands.json
export default {
  msgDel: {
    errors: {
      allOptionsEmpty: {
        title: "警告",
        description:
          "この操作はすべてのオプションが未指定のため実行できません。\n" +
          "チャンネル内のすべてのメッセージを削除する場合は、チャンネルを削除することをお勧めします。\n" +
          "少なくとも `count`、`user`、`channel` のいずれか1つを指定してください。",
      },
      invalidChannel: "テキストチャンネルを指定してください。",
      noMessages: "削除可能なメッセージが見つかりませんでした。",
      permissionDenied: "この操作を実行する権限がありません。",
      botPermissionDenied: "Botにメッセージ削除権限がありません。",
      failed: "メッセージの削除中にエラーが発生しました。",
    },
    progress: {
      deleting: "削除中... {{current}}/{{total}}件",
      bulk: "削除中... {{current}}/{{total}}件 (一括削除)",
      individual:
        "削除中... {{current}}/{{total}}件 (14日以上前のメッセージを個別削除中...)",
    },
    success: {
      completed: "{{count}}件のメッセージを削除しました。",
      completedWithUser: "{{user}}のメッセージを{{count}}件削除しました。",
      breakdown: "(一括削除: {{bulk}}件、個別削除: {{individual}}件)",
      allIndividual: "(すべて個別削除)",
    },
  },
};
```

---

## 関連ドキュメント

- [Discord.js - TextChannel.bulkDelete](https://discord.js.org/#/docs/discord.js/main/class/TextChannel?scrollTo=bulkDelete)
- [Discord.js - Message.fetch](https://discord.js.org/#/docs/discord.js/main/class/MessageManager?scrollTo=fetch)
- [Discord API - Bulk Delete Messages](https://discord.com/developers/docs/resources/channel#bulk-delete-messages)
