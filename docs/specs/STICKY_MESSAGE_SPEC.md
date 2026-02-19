# メッセージ固定機能 - 仕様書

> Sticky Message - 常に最下部に表示されるメッセージ固定機能

最終更新: 2026年2月19日

---

## 📋 概要

### 目的

指定したチャンネルに「スティッキーメッセージ（固定メッセージ）」を設定し、新しいメッセージが投稿されるたびに自動的に最下部に再送信する機能を提供します。Discordの「ピン留め」機能は上部に固定されるため見逃されやすいですが、スティッキーメッセージは常に最下部に表示されるため、重要な情報を確実に目に留めることができます。

### 主な用途

1. **サーバールールの告知**: チャンネルごとのルールを常に表示
2. **注意事項の表示**: 禁止事項や推奨事項を見逃されないように固定
3. **アナウンスの継続表示**: イベント告知や重要なお知らせを常に表示
4. **チャンネルの使い方**: 特定チャンネルの使用方法を明示
5. **テンプレートメッセージの表示**: テンプレートメッセージを常に表示

### 特徴

- **自動再送信**: 新しいメッセージが投稿されるたびに最下部に再送信
- **Embed対応**: テキストメッセージだけでなく、視認性の高いEmbed形式も対応
- **チャンネルごとの設定**: 各チャンネルで独立して1つのスティッキーメッセージを設定可能
- **簡単な管理**: コマンドで設定・更新・削除が可能

---

## 🎯 主要機能

### 1. スティッキーメッセージ設定

**設定対象**: チャンネルごとに1つのスティッキーメッセージを設定可能

**メッセージ形式:**

- テキストメッセージ（最大2000文字）
- Embed形式も対応（タイトル、説明、カラー、フィールド等）
- 画像・リンク対応

**処理フロー:**

```
1. `/sticky-message set` コマンドを実行
   ↓
2. Modalでメッセージ内容を入力
   - テキストメッセージ
   - Embedタイトル（オプション）
   - Embed説明（オプション）
   - カラーコード（オプション）
   ↓
3. 指定チャンネルにメッセージを送信
   ↓
4. データベースに保存
   - guild_id
   - channel_id
   - message_content
   - embed_data (JSON)
   - last_message_id
   ↓
5. 今後、このチャンネルで新しいメッセージが投稿されるたびに再送信
```

---

## 🎛️ コマンド仕様

### `/sticky-message set`

**説明**: スティッキーメッセージを設定

**オプション:**

| オプション名 | 型             | 必須 | 説明                                               |
| ------------ | -------------- | ---- | -------------------------------------------------- |
| `channel`    | Channel (TEXT) | ✅   | スティッキーメッセージを設定するチャンネル         |
| `message`    | String         | ❌   | メッセージ内容（簡易設定用）                       |
| `use-embed`  | Boolean        | ❌   | Embed形式で設定する場合はtrue（デフォルト: false） |

**権限**: `MANAGE_CHANNELS`
**実行例:**

```
/sticky-message set channel:#rules message:このチャンネルではルールを守ってください
```

**Embed形式の場合:**

```
/sticky-message set channel:#rules use-embed:true
→ Modalが表示され、タイトル・説明・カラーを入力
```

**処理:**

1. 権限チェック（`MANAGE_CHANNELS`）
2. チャンネルに既存のスティッキーメッセージがある場合は警告
3. メッセージを送信
4. データベースに保存
5. 設定完了メッセージを返信（MessageFlags.Ephemeral付きメッセージ）

**エラーケース:**

- 権限不足: `MANAGE_CHANNELS`権限が必要です
- 既に設定済み: 既にスティッキーメッセージが設定されています。削除してから再度設定してください。
- メッセージが空: メッセージ内容を入力してください

---

### `/sticky-message remove`

**説明**: スティッキーメッセージを削除

**オプション:**

| オプション名 | 型             | 必須 | 説明                                       |
| ------------ | -------------- | ---- | ------------------------------------------ |
| `channel`    | Channel (TEXT) | ✅   | スティッキーメッセージを削除するチャンネル |

**権限**: `MANAGE_CHANNELS`

**実行例:**

```
/sticky-message remove channel:#rules
```

**処理:**

1. 権限チェック（`MANAGE_CHANNELS`）
2. データベースから該当チャンネルのスティッキーメッセージを検索
3. 存在する場合は削除
   - データベースレコード削除
   - チャンネル内の最後のスティッキーメッセージも削除
4. 削除完了メッセージを返信（MessageFlags.Ephemeral付きメッセージ）

**エラーケース:**

- 権限不足: `MANAGE_CHANNELS`権限が必要です
- 設定なし: このチャンネルにはスティッキーメッセージが設定されていません

---

### `/sticky-message list`

**説明**: 現在設定されているスティッキーメッセージ一覧を表示

**オプション**: なし

**権限**: `MANAGE_CHANNELS`

**実行例:**

```
/sticky-message list
```

**処理:**

1. 権限チェック（`MANAGE_CHANNELS`）
2. データベースから現在のギルドのすべてのスティッキーメッセージを取得
3. Embed形式で一覧表示
   - チャンネル名
   - メッセージプレビュー（最初の50文字）
   - 設定日時
4. 一覧をMessageFlags.Ephemeral付きメッセージで返信

**表示例:**

```markdown
📌 スティッキーメッセージ一覧

#rules - "このチャンネルではルールを守ってください..."
設定日時: 2026年2月19日 10:30

#announcements - "重要なお知らせをここに投稿します..."
設定日時: 2026年2月18日 15:00
```

**エラーケース:**

- 権限不足: `MANAGE_CHANNELS`権限が必要です
- 設定なし: スティッキーメッセージは設定されていません

---

## 🔄 自動再送信ロジック

### messageCreateイベントでの処理

**トリガー**: ユーザーがメッセージを送信

**処理フロー:**

```
1. メッセージ送信イベント検知
   ↓
2. Bot自身のメッセージは無視
   ↓
3. データベースから該当チャンネルのスティッキーメッセージ設定を取得
   ↓
4. スティッキーメッセージが設定されている場合
   ↓
5. 前回のスティッキーメッセージを削除（last_message_idを使用）
   ↓
6. 新しいスティッキーメッセージを送信
   ↓
7. データベースのlast_message_idを更新
```

**最適化:**

- **頻度制限**: 5秒以内に複数のメッセージが投稿された場合、最後のメッセージ送信から5秒後に再送信（連続投稿対策）
- **削除失敗時の対応**: 前回のメッセージが既に削除されている場合はエラーを無視して新しいメッセージを送信
- **権限不足時の対応**: メッセージ送信権限がない場合はエラーログを記録し、次回の送信を待機

**疑似コード:**

```typescript
async function handleMessageCreate(message: Message) {
  // Bot自身のメッセージは無視
  if (message.author.bot) return;

  // スティッキーメッセージ設定を取得
  const stickyMessage = await getStickyMessage(
    message.guild.id,
    message.channel.id,
  );

  if (!stickyMessage) return;

  // 頻度制限チェック
  if (await isRateLimited(message.channel.id)) {
    // 5秒後に再送信をスケジュール
    scheduleResend(message.channel.id, 5000);
    return;
  }

  // 前回のスティッキーメッセージを削除
  try {
    if (stickyMessage.lastMessageId) {
      await message.channel.messages.delete(stickyMessage.lastMessageId);
    }
  } catch (error) {
    // 既に削除されている場合は無視
    logger.warn("Failed to delete previous sticky message", error);
  }

  // 新しいスティッキーメッセージを送信
  try {
    const newMessage = await message.channel.send(stickyMessage.content);

    // データベースを更新
    await updateStickyMessageLastId(stickyMessage.id, newMessage.id);
  } catch (error) {
    logger.error("Failed to send sticky message", error);
  }
}
```

---

## 📊 データベース設計

### StickyMessageテーブル

| カラム名          | 型       | 説明                               | 制約             |
| ----------------- | -------- | ---------------------------------- | ---------------- |
| `id`              | String   | プライマリキー（UUID）             | PRIMARY KEY      |
| `guild_id`        | String   | ギルドID                           | NOT NULL         |
| `channel_id`      | String   | チャンネルID                       | NOT NULL, UNIQUE |
| `content`         | String   | メッセージ内容（プレーンテキスト） | NOT NULL         |
| `embed_data`      | Json?    | Embedデータ（JSON形式）            | NULLABLE         |
| `last_message_id` | String?  | 最後に送信したメッセージID         | NULLABLE         |
| `created_at`      | DateTime | 作成日時                           | DEFAULT NOW()    |
| `updated_at`      | DateTime | 更新日時                           | DEFAULT NOW()    |

**インデックス:**

- `guild_id` - ギルドIDでの高速検索
- `channel_id` - チャンネルIDでの一意制約＋高速検索

**Prisma Schema例:**

```prisma
model StickyMessage {
  id              String    @id @default(uuid())
  guildId         String    @map("guild_id")
  channelId       String    @unique @map("channel_id")
  content         String
  embedData       Json?     @map("embed_data")
  lastMessageId   String?   @map("last_message_id")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  @@index([guildId])
  @@map("sticky_messages")
}
```

---

## 🎨 メッセージフォーマット

### プレーンテキスト形式

```
📌 このチャンネルではルールを守ってください
```

### Embed形式

```markdown
┌──────────────────────────────────┐
│ 📌 サーバールール │
├──────────────────────────────────┤
│ 1. 暴言・誹謗中傷は禁止です │
│ 2. スパム行為は禁止です │
│ 3. 他人のプライバシーを尊重して │
│ ください │
│ │
│ 違反した場合は警告・BANの対象と │
│ なります。 │
└──────────────────────────────────┘
```

**カラー:**

- デフォルト: `0x5865F2` (Discord Blurple)
- カスタム: ユーザーが指定可能（`0xRRGGBB`形式）

---

## 🛡️ セキュリティ・権限管理

### 必要な権限

**コマンド実行者:**

- `MANAGE_CHANNELS` または `ADMINISTRATOR`

**Bot:**

- `SEND_MESSAGES` - メッセージ送信
- `MANAGE_MESSAGES` - 以前のスティッキーメッセージ削除
- `EMBED_LINKS` - Embed形式のメッセージ送信（オプション）

### 権限チェック

```typescript
function hasPermission(member: GuildMember): boolean {
  return (
    member.permissions.has(PermissionFlagsBits.ManageChannels) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
}
```

---

## 🌐 多言語対応（i18next）

### ローカライゼーションキー

```typescript
// commands.json
export default {
  stickyMessage: {
    set: {
      success: {
        title: "設定完了",
        description: "スティッキーメッセージを設定しました。",
      },
      alreadyExists: {
        title: "警告",
        description:
          "既にスティッキーメッセージが設定されています。削除してから再度設定してください。",
      },
    },
    remove: {
      success: {
        title: "削除完了",
        description: "スティッキーメッセージを削除しました。",
      },
      notFound: {
        title: "エラー",
        description: "スティッキーメッセージが設定されていません。",
      },
    },
    list: {
      title: "スティッキーメッセージ一覧",
      empty: "スティッキーメッセージが設定されていません。",
    },
    errors: {
      permissionDenied: "この操作を実行する権限がありません。",
      botPermissionDenied: "Botにメッセージ送信権限がありません。",
      emptyMessage: "メッセージ内容を入力してください。",
      failed: "スティッキーメッセージの設定中にエラーが発生しました。",
    },
  },
};
```

---

## 🚨 エラーハンドリング

### 想定されるエラー

1. **権限不足**

   ```
   ❌ この操作を実行する権限がありません。
   必要な権限: チャンネル管理
   ```

2. **Bot権限不足**

   ```
   ❌ Botにメッセージ送信権限がありません。
   ```

3. **メッセージが空**

   ```
   ⚠️ メッセージ内容を入力してください。
   ```

4. **スティッキーメッセージが既に設定済み**

   ```
   ⚠️ 既にスティッキーメッセージが設定されています。
   削除してから再度設定してください。
   ```

5. **スティッキーメッセージが未設定**

   ```
   ℹ️ スティッキーメッセージが設定されていません。
   ```

6. **チャンネルが削除された**
   - スティッキーメッセージの再送信をスキップ
   - ログに記録
   - データベースから自動削除（オプション）

---

## ✅ テストケース

最新の件数とカバレッジは [TEST_PROGRESS.md](../progress/TEST_PROGRESS.md) を参照。

### ユニットテスト

1. **コマンド実行テスト**
   - 正常系: スティッキーメッセージ設定成功
   - 異常系: 権限不足でエラー
   - 異常系: 既に設定済みで警告

2. **自動再送信テスト**
   - 正常系: メッセージ送信後に再送信される
   - 正常系: 前回のメッセージが削除される
   - 異常系: 前回のメッセージが既に削除されている場合
   - 異常系: 権限不足で送信失敗

3. **削除テスト**
   - 正常系: スティッキーメッセージ削除成功
   - 異常系: 設定が存在しない場合

4. **一覧表示テスト**
   - 正常系: 複数の設定が表示される
   - 正常系: 設定がない場合のメッセージ

### インテグレーションテスト

1. **データベース連携テスト**
   - スティッキーメッセージの保存・取得・削除
   - last_message_idの更新

2. **messageCreateイベントテスト**
   - 実際のメッセージ送信で再送信が動作するか

---

## 関連ドキュメント

- [MESSAGE_RESPONSE_SPEC.md](MESSAGE_RESPONSE_SPEC.md): メッセージレスポンス統一仕様
- [VAC_SPEC.md](VAC_SPEC.md): VC自動作成機能仕様
- [MESSAGE_DELETE_SPEC.md](MESSAGE_DELETE_SPEC.md): メッセージ削除機能仕様
- [Discord.js - TextChannel](https://discord.js.org/#/docs/discord.js/main/class/TextChannel)
- [Discord.js - EmbedBuilder](https://discord.js.org/#/docs/discord.js/main/class/EmbedBuilder)
