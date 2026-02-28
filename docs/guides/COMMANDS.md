# コマンドリファレンス

> Bot Commands Reference - スラッシュコマンドの完全リファレンス

最終更新: 2026年2月27日（message-delete 仕様拡張・VC募集機能追加）

---

## 📋 概要

### 目的

ayasonoで使用可能なすべてのスラッシュコマンドの詳細リファレンスです。各コマンドの構文、オプション、使用例、必要な権限を記載しています。

### コマンド一覧

| コマンド                 | 説明                                   | 権限           | 状態        |
| ------------------------ | -------------------------------------- | -------------- | ----------- |
| `/ping`                  | Bot疎通確認                            | なし           | ✅ 実装済み |
| `/afk`                   | ユーザーをAFKチャンネルに移動          | なし           | ✅ 実装済み |
| `/afk-config`            | AFK機能の設定管理                      | サーバー管理   | ✅ 実装済み |
| `/bump-reminder-config`  | Bumpリマインダー機能の設定管理         | サーバー管理   | ✅ 実装済み |
| `/vac-config`            | VC自動作成機能の設定管理               | サーバー管理   | ✅ 実装済み |
| `/vac`                   | 作成済みVCの名前・人数制限を変更       | なし           | ✅ 実装済み |
| `/sticky-message`        | メッセージ固定機能の管理               | チャンネル管理 | ✅ 実装済み |
| `/member-log-config`     | メンバーログ設定                       | サーバー管理   | 📋 未実装   |
| `/message-delete`        | メッセージ一括削除（全チャンネル対応） | メッセージ管理 | 📋 未実装   |
| `/message-delete-config` | メッセージ削除の挙動設定               | なし           | 📋 未実装   |
| `/vc-recruit-config`     | VC募集機能の設定管理                   | サーバー管理   | 📋 未実装   |

---

## 🔧 基本コマンド

### `/ping`

Bot疎通確認コマンド。BotのレイテンシとAPIレスポンス時間を表示します。

**構文:**

```
/ping
```

**権限:** なし（全員使用可能）

**使用例:**

```
/ping
```

**レスポンス:**

```
🏓 Pong!
Botレイテンシ: 45ms
APIレイテンシ: 120ms
```

**関連ドキュメント:** なし

---

## 🎤 AFK機能

### `/afk`

指定したユーザー（または自分自身）をAFKチャンネルに移動します。

**構文:**

```
/afk [user]
```

**オプション:**

- `user` (オプション): 移動対象のユーザー
  - 未指定の場合は自分自身を移動

**権限:** なし（全員使用可能、AFK設定が有効な場合）

**使用例:**

```
# 自分をAFKチャンネルに移動
/afk

# 他のユーザーをAFKチャンネルに移動
/afk user:@Username
```

**エラーケース:**

- AFK機能が無効化されている
- AFKチャンネルが設定されていない
- 対象ユーザーがVCに参加していない
- AFKチャンネルが削除されている

**関連ドキュメント:** [AFK_SPEC.md](../specs/AFK_SPEC.md)

---

### `/afk-config`

AFK機能の設定を管理します。

**構文:**

```
/afk-config <サブコマンド> [オプション]
```

**サブコマンド:**

#### `set-channel`

AFKチャンネルを設定します。

```
/afk-config set-channel channel:<チャンネル>
```

**オプション:**

- `channel` (必須): AFKチャンネルとして設定するボイスチャンネル

**権限:** サーバー管理（`MANAGE_GUILD`）

**使用例:**

```
/afk-config set-channel channel:#AFK
```

---

#### `view`

現在のAFK設定を表示します。

```
/afk-config view
```

**権限:** サーバー管理（`MANAGE_GUILD`）

**表示内容:**

- 機能の有効/無効状態
- 設定されているAFKチャンネル

**関連ドキュメント:** [AFK_SPEC.md](../specs/AFK_SPEC.md)

---

## ⏰ Bumpリマインダー機能

### `/bump-reminder-config`

Disboard/ディス速のBump後の自動リマインダー機能を管理します。

**構文:**

```
/bump-reminder-config <サブコマンド> [オプション]
```

**サブコマンド:**

#### `enable`

Bumpリマインダー機能を有効化します。

```
/bump-reminder-config enable
```

**権限:** サーバー管理（`MANAGE_GUILD`）

**注意:** デフォルトで有効なため、通常は実行不要です。

---

#### `disable`

Bumpリマインダー機能を無効化します。

```
/bump-reminder-config disable
```

**権限:** サーバー管理（`MANAGE_GUILD`）

---

#### `set-mention`

Bumpリマインダー時にメンションするロールまたはユーザーを設定します。

```
/bump-reminder-config set-mention role:<ロール>
/bump-reminder-config set-mention user:<ユーザー>
```

**オプション:**

- `role` (いずれか必須): メンションするロール
- `user` (いずれか必須): メンションするユーザー

**権限:** サーバー管理（`MANAGE_GUILD`）

**使用例:**

```
# ロールをメンション
/bump-reminder-config set-mention role:@BumpRole

# ユーザーをメンション
/bump-reminder-config set-mention user:@Username
```

---

#### `remove-mention`

設定されているメンションを削除します。

```
/bump-reminder-config remove-mention target:<role|user|users|all>
```

**オプション:**

- `target` (必須): 削除対象
  - `role`: ロール設定のみ削除
  - `user`: 登録済みユーザーを選択して削除
  - `users`: 登録済みユーザーを全削除
  - `all`: ロール + ユーザーを全削除

**権限:** サーバー管理（`MANAGE_GUILD`）

---

#### `view`

現在のBumpリマインダー設定を表示します。

```
/bump-reminder-config view
```

**権限:** サーバー管理（`MANAGE_GUILD`）

**表示内容:**

- 機能の有効/無効状態
- 設定されているメンション（ロール/ユーザー）

**関連ドキュメント:** [BUMP_REMINDER_SPEC.md](../specs/BUMP_REMINDER_SPEC.md)

---

## 🎤 VC自動作成機能

### `/vac-config`

VC自動作成機能（VAC）の設定を管理します。トリガーVCの追加・削除と現在の設定表示が可能です。

**構文:**

```
/vac-config <サブコマンド> [オプション]
```

**サブコマンド:**

#### `create-trigger-vc`

トリガーチャンネル（CreateVC）を新規作成します。このチャンネルに参加すると専用VCが自動作成されます。

```
/vac-config create-trigger-vc [category:<カテゴリ名>]
```

**オプション:**

- `category` (省略可): 作成先カテゴリ名（オートコンプリート対応）。省略時はカテゴリなしで作成

**権限:** サーバー管理（`MANAGE_GUILD`）

**使用例:**

```
# カテゴリを指定して作成
/vac-config create-trigger-vc category:TOP
/vac-config create-trigger-vc category:カテゴリA

# カテゴリなしで作成
/vac-config create-trigger-vc
```

---

#### `remove-trigger-vc`

既存のトリガーチャンネルを削除します。

```
/vac-config remove-trigger-vc [category:<カテゴリ名>]
```

**オプション:**

- `category` (省略可): 削除対象のカテゴリ名（オートコンプリート対応）。省略時はトップレベルのトリガーVCを削除

**権限:** サーバー管理（`MANAGE_GUILD`）

**使用例:**

```
/vac-config remove-trigger-vc category:TOP
/vac-config remove-trigger-vc category:カテゴリA
/vac-config remove-trigger-vc
```

---

#### `view`

現在のVC自動作成機能の設定（有効化状態・トリガーチャンネル一覧）を表示します。

```
/vac-config view
```

**権限:** サーバー管理（`MANAGE_GUILD`）

**関連ドキュメント:** [VAC_SPEC.md](../specs/VAC_SPEC.md)

---

### `/vac`

自分が参加している自動作成VCの設定を変更します。

**構文:**

```
/vac <サブコマンド> [オプション]
```

**権限:** なし（VC参加中のユーザーのみ実行可能）

**サブコマンド:**

#### `vc-rename`

自分のVCの名前を変更します。

```
/vac vc-rename name:<新しい名前>
```

**オプション:**

- `name` (必須): 新しいVC名（最大100文字）

**使用例:**

```
/vac vc-rename name:みんなのたまり場
```

---

#### `vc-limit`

自分のVCの人数制限を変更します。

```
/vac vc-limit limit:<人数>
```

**オプション:**

- `limit` (必須): 人数制限（0=無制限、1〜99）

**使用例:**

```
# 5人制限に設定
/vac vc-limit limit:5

# 無制限に設定
/vac vc-limit limit:0
```

**関連ドキュメント:** [VAC_SPEC.md](../specs/VAC_SPEC.md)

---

## 📌 メッセージ固定機能

### `/sticky-message`

チャンネル最下部に常に表示されるメッセージを設定・削除・更新・確認するコマンドです。プレーンテキスト・ Embed 両形式対応。

**構文:**

```
/sticky-message <サブコマンド> [オプション]
```

**サブコマンド:**

#### `set`

スティッキーメッセージを設定します。

```
/sticky-message set channel:<チャンネル> [message:<メッセージ>] [use-embed:<true/false>] ...
```

**主なオプション:**

- `channel` (必須): スティッキーメッセージを設定するテキストチャンネル
- `message` (任意): メッセージ内容（プレーンテキスト）
- `use-embed` (任意): Embed 形式で表示する場合 true
- `embed-title` (任意): Embed タイトル
- `embed-description` (任意): Embed 説明文
- `embed-color` (任意): Embed カラーコード（例: `#008969`）

> `message` / `embed-description` / `embed-title` のいずれか1つ以上の指定が必要。

**権限:** チャンネル管理（`MANAGE_CHANNELS`）

**使用例:**

```
# プレーンテキスト
/sticky-message set channel:#rules message:サーバールールを守ってください

# Embed形式
/sticky-message set channel:#rules use-embed:true embed-title:サーバールール embed-description:ルールを守ってください embed-color:#008969
```

---

#### `remove`

スティッキーメッセージを削除します。Discord 上のメッセージも同時に削除されます。

```
/sticky-message remove channel:<チャンネル>
```

**オプション:**

- `channel` (必須): メッセージ固定を解除するチャンネル

**権限:** チャンネル管理（`MANAGE_CHANNELS`）

---

#### `update`

既存のスティッキーメッセージの内容を上書き更新します。旧メッセージを削除し新しい内容で即時再送信します。

```
/sticky-message update channel:<チャンネル> [各オプション]
```

**権限:** チャンネル管理（`MANAGE_CHANNELS`）

**使用例:**

```
# テキスト内容だけ変更
/sticky-message update channel:#rules message:新しいルールになりました

# Embedタイトルだけ変更
/sticky-message update channel:#rules embed-title:【重要】サーバールール
```

---

#### `view`

このサーバーで設定中のスティッキーメッセージを確認します。セレクトメニューでチャンネルを選ぶとその設定詳細が Embed で表示されます。

```
/sticky-message view
```

**権限:** チャンネル管理（`MANAGE_CHANNELS`）

**関連ドキュメント:** [STICKY_MESSAGE_SPEC.md](../specs/STICKY_MESSAGE_SPEC.md)

---

## 👥 メンバーログ機能

> ⚠️ **このコマンドは未実装です。** 仕様書のみ作成済みで、実装待ちの機能です。

### `/member-log-config`

メンバーの参加・脱退を指定チャンネルに記録する機能を管理します。

**構文:**

```
/member-log-config <サブコマンド> [オプション]
```

**サブコマンド:**

#### `enable`

メンバーログ機能を有効化します。

```
/member-log-config enable
```

**権限:** サーバー管理（`MANAGE_GUILD`）

---

#### `disable`

メンバーログ機能を無効化します。

```
/member-log-config disable
```

**権限:** サーバー管理（`MANAGE_GUILD`）

---

#### `set-channel`

ログを送信するチャンネルを設定します。

```
/member-log-config set-channel channel:<チャンネル>
```

**オプション:**

- `channel` (必須): ログを送信するテキストチャンネル

**権限:** サーバー管理（`MANAGE_GUILD`）

**使用例:**

```
/member-log-config set-channel channel:#welcome-log
```

---

#### `view`

現在の設定を表示します。

```
/member-log-config view
```

**権限:** サーバー管理（`MANAGE_GUILD`）

**関連ドキュメント:** [MEMBER_LOG_SPEC.md](../specs/MEMBER_LOG_SPEC.md)

---

## 🗑️ メッセージ削除機能

> ⚠️ **このコマンドは未実装です。** 仕様書のみ作成済みで、実装待ちの機能です。

### `/message-delete`

チャンネル内のメッセージを一括削除します。

**構文:**

```
/message-delete [count] [user] [keyword] [days] [after] [before] [channel]
```

**オプション:**

- `count` (オプション): 削除するメッセージ数（1以上）。未指定時は条件に合うすべてのメッセージを削除
- `user` (オプション): 特定ユーザーのメッセージのみ対象
- `keyword` (オプション): 指定キーワードを本文に含むメッセージのみ対象（大文字小文字を区別しない）
- `days` (オプション): 過去N日以内のメッセージのみ対象。`after` / `before` との同時指定不可
- `after` (オプション): この日時以降のメッセージのみ対象（形式: `YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS`）
- `before` (オプション): この日時以前のメッセージのみ対象（形式: `YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS`）
- `channel` (オプション): 削除を実行するチャンネル（省略時はサーバー全チャンネルを横断）

**権限:** メッセージ管理

**使用例:**

```
# 最新50件を削除
/message-delete count:50

# 特定ユーザーのメッセージを10件削除
/message-delete count:10 user:@Spammer

# 別チャンネルのメッセージを削除
/message-delete count:20 channel:#spam-channel

# 特定ユーザーのメッセージをすべて削除
/message-delete user:@BadUser
```

**注意事項:**

- すべてのオプションを未指定にすることはできません（安全のため）
- 14日以上前のメッセージは個別削除となり時間がかかります
- Cooldown: 5秒（連続実行防止）

**エラーケース:**

- すべてのオプションが未指定
- 権限不足
- Bot権限不足
- 削除可能なメッセージが見つからない

**関連ドキュメント:** [MESSAGE_DELETE_SPEC.md](../specs/MESSAGE_DELETE_SPEC.md)

---

### `/message-delete-config`

`/message-delete` の挙動設定を変更します。設定はユーザーごとに DB に永続保存されます。

**構文:**

```
/message-delete-config confirm:<true|false>
```

**オプション:**

- `confirm` (必須): `true`（デフォルト）：削除前に確認ダイアログを表示。`false`：確認をスキップ。

**権限:** なし（全員使用可能）

**使用例:**

```
# 確認ダイアログを無効化
/message-delete-config confirm:false

# 確認ダイアログを再度有効化
/message-delete-config confirm:true
```

> 実行確認ダイアログの「次回から確認しない」トグルを ON にして削除を承認することでも同等の効果があります。

**関連ドキュメント:** [MESSAGE_DELETE_SPEC.md](../specs/MESSAGE_DELETE_SPEC.md)

---

## 🎵 VC募集機能

> ⚠️ **このコマンドは未実装です。** 仕様書のみ作成済みで、実装待ちの機能です。

### `/vc-recruit-config`

VC募集機能の設定を管理します。

**構文:**

```
/vc-recruit-config <サブコマンド> [オプション]
```

**サブコマンド:**

#### `setup`

指定カテゴリー（または TOP レベル）にパネルチャンネル・投稿チャンネルの2セットを自動作成します。

```
/vc-recruit-config setup [category:<カテゴリー名>] [thread-archive:<1h|24h|3d|1w>]
```

**オプション:**

- `category` (省略可): 作成先カテゴリー名（`TOP` またはカテゴリー名、省略時は実行チャンネルのカテゴリー）
- `thread-archive` (省略可): 募集スレッドの自動アーカイブ時間。`1h` / `24h` / `3d` / `1w`（デフォルト: `24h`）

**権限:** サーバー管理（`MANAGE_GUILD`）

**使用例:**

```
/vc-recruit-config setup category:TOP
/vc-recruit-config setup category:ゲームカテゴリー
/vc-recruit-config setup
```

---

#### `teardown`

指定カテゴリーのVC募集チャンネルセットを削除します。

```
/vc-recruit-config teardown [category:<カテゴリー名>]
```

**権限:** サーバー管理（`MANAGE_GUILD`）

---

#### `add-role`

募集投稿モーダルのメンション候補にロールを追加します。

```
/vc-recruit-config add-role role:<ロール>
```

**権限:** サーバー管理（`MANAGE_GUILD`）

**使用例:**

```
/vc-recruit-config add-role role:@ゲーマー募集
```

---

#### `remove-role`

メンション候補からロールを削除します。

```
/vc-recruit-config remove-role role:<ロール>
```

**権限:** サーバー管理（`MANAGE_GUILD`）

---

#### `view`

現在のVC募集設定を表示します。セットアップ済みカテゴリーおよびメンション候補ロール一覧が表示されます。

```
/vc-recruit-config view
```

**権限:** サーバー管理（`MANAGE_GUILD`）

**関連ドキュメント:** [VC_RECRUIT_SPEC.md](../specs/VC_RECRUIT_SPEC.md)

---

## 🔒 権限について

### 権限レベル

| 権限               | 説明                     | 必要なDiscord権限 |
| ------------------ | ------------------------ | ----------------- |
| **なし**           | 全メンバーが使用可能     | -                 |
| **チャンネル管理** | チャンネル管理権限が必要 | `MANAGE_CHANNELS` |
| **メッセージ管理** | メッセージ管理権限が必要 | `MANAGE_MESSAGES` |
| **サーバー管理**   | サーバー管理権限が必要   | `MANAGE_GUILD`    |

### Bot権限

Botが正常に動作するために必要な権限：

- `ViewChannel` - チャンネルの閲覧
- `SendMessages` - メッセージの送信
- `EmbedLinks` - Embedメッセージの送信
- `ManageMessages` - メッセージの削除（一括削除機能）
- `ManageChannels` - チャンネルの作成・削除（VC自動作成機能）
- `MoveMembers` - メンバーの移動（AFK機能）
- `ReadMessageHistory` - メッセージ履歴の閲覧

---

## 🌐 多言語対応

すべてのコマンドは多言語対応しており、サーバーごとに日本語または英語を設定可能です。

**ロケール設定:**

- デフォルト: 日本語（ja）
- サポート言語: 日本語（ja）、英語（en）

詳細は [I18N_GUIDE.md](I18N_GUIDE.md) を参照してください。

---

## 🔗 関連ドキュメント

### 仕様書

- [AFK_SPEC.md](../specs/AFK_SPEC.md) - AFK機能仕様
- [BUMP_REMINDER_SPEC.md](../specs/BUMP_REMINDER_SPEC.md) - Bumpリマインダー機能仕様
- [VAC_SPEC.md](../specs/VAC_SPEC.md) - VC自動作成機能仕様
- [STICKY_MESSAGE_SPEC.md](../specs/STICKY_MESSAGE_SPEC.md) - メッセージ固定機能仕様
- [MEMBER_LOG_SPEC.md](../specs/MEMBER_LOG_SPEC.md) - メンバー参加・脱退ログ機能仕様
- [MESSAGE_DELETE_SPEC.md](../specs/MESSAGE_DELETE_SPEC.md) - メッセージ削除コマンド仕様
- [VC_RECRUIT_SPEC.md](../specs/VC_RECRUIT_SPEC.md) - VC募集機能仕様

### ガイド

- [README.md](../README.md) - プロジェクト概要
- [TODO.md](../TODO.md) - 開発タスク一覧
- [I18N_GUIDE.md](I18N_GUIDE.md) - 多言語対応ガイド
