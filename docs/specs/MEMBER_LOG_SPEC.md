# メンバーログ機能 - 仕様書

> Member Log - メンバー参加・脱退時のログ機能

最終更新: 2026年3月1日

---

## 📋 概要

### 目的

サーバーにメンバーが参加・退出した際に、指定されたチャンネルに通知メッセージとメンバー情報パネルを表示し、メンバーの出入りを把握できるようにする機能です。

### 主な用途

1. **新規メンバーの歓迎**: メンバー参加時に自動で歓迎メッセージを表示
2. **メンバー管理**: 参加・退出を記録し、メンバー数の変動を追跡
3. **セキュリティ対策**: 大量参加・退出など異常な動きを監視
4. **統計情報**: アカウント作成日時・経過年齢・滞在期間などの情報を自動表示

### 特徴

- **カスタマイズ可能な通知メッセージ**: 参加・退出メッセージをカスタマイズ可能
- **詳細なメンバー情報**: アカウント作成日時・経過年齢・滞在期間などを自動表示
- **Embed形式の通知**: 視認性の高いEmbedメッセージで通知
- **柔軟な設定**: チャンネル指定、有効/無効の切り替えが可能

---

## 🎯 主要機能

### 1. メンバー参加通知

**トリガー**: `guildMemberAdd` イベント

**Embed形式:**

- **色**: ビリジアン（`#008969`）
- **サムネイル**: ユーザーアイコン画像（`displayAvatarURL` で取得）
- **フィールド**:
  | フィールド名 | 内容 |
  |---|---|
  | ユーザー | メンションリンク（`<@userId>`）|
  | アカウント作成日時 | `2020年12月23日 21:36(5年3ヶ月7日)` 形式。日時は Discord の `:f` フォーマット、括弧内は `date-fns` で計算した経過年齢 |
  | サーバー参加日時 | Discord の `:f` フォーマット（取得可能な場合のみ表示）|
  | メンバー数 | 参加後の現在メンバー数 |
- **フッター**: `ようこそ！ • Member #<メンバー番号>` + タイムスタンプ

### 2. メンバー退出通知

**トリガー**: `guildMemberRemove` イベント

**Embed形式:**

- **色**: 茜色（`#b7282d`）
- **サムネイル**: ユーザーアイコン画像（取得可能な場合のみ）
- **フィールド**:
  | フィールド名 | 内容 |
  |---|---|
  | ユーザー | メンションリンク（`<@userId>`）|
  | アカウント作成日時 | `2020年12月23日 21:36(5年3ヶ月7日)` 形式（ユーザー情報取得可能な場合のみ）|
  | サーバー参加日時 | Discord の `:f` フォーマット（取得可能な場合のみ）|
  | サーバー退出日時 | Discord の `:f` フォーマット |
  | 滞在期間 | `x日` 形式（参加日時取得不可の場合は「不明」）|
  | メンバー数 | 退出後の現在メンバー数 |
- **フッター**: `またね！ • Member #<退出したメンバー番号>` + タイムスタンプ
  - メンバー番号は `guild.memberCount + 1`（退出後のカウントに +1）

> **注意**: `guildMemberRemove` 発火時点では Discord から `PartialGuildMember` が渡される場合があり、ユーザー情報（アイコン・アカウント作成日時など）が `null` になることがある。その場合は該当フィールドを省略する。

---

## ⚙️ 設定コマンド

### `/member-log-config`

#### サブコマンド

**1. `set-channel` - 通知チャンネル設定**

```
/member-log-config set-channel channel:#welcome-log
```

- 参加・退出通知を送信するチャンネルを指定
- Bot権限チェック: `ViewChannel`, `SendMessages`, `EmbedLinks`

**2. `enable` - 機能有効化**

```
/member-log-config enable
```

- 通知機能を有効化
- チャンネルが未設定の場合はエラー

**3. `disable` - 機能無効化**

```
/member-log-config disable
```

- 通知機能を無効化

**4. `set-join-message` - カスタム参加メッセージ設定**

```
/member-log-config set-join-message message:ようこそ {user}さん！
```

- `{user}`: ユーザーメンション
- `{username}`: ユーザー名
- `{count}`: メンバー数

**5. `set-leave-message` - カスタム退出メッセージ設定**

```
/member-log-config set-leave-message message:{user}さんが退出しました
```

**6. `view` - 現在の設定表示**

```
/member-log-config view
```

**表示内容:**

```
┌─────────────────────────────────────┐
│ メンバーログ                          │
├─────────────────────────────────────┤
│ 状態: 有効                           │
│ 通知チャンネル: #welcome-log          │
│ カスタム参加メッセージ: <メッセージ内容>  │
│ カスタム退出メッセージ: <メッセージ内容>  │
└─────────────────────────────────────┘
```

---

## 💾 データベーススキーマ

### GuildConfig

```prisma
model GuildConfig {
  // ...
  memberLogConfig String? // JSON: MemberLogConfig
}
```

### MemberLogConfig 型定義

```typescript
interface MemberLogConfig {
  channelId?: string; // 通知チャンネルID
}
```

---

## 🔄 処理フロー

### 参加通知フロー

```
1. guildMemberAddイベント発火
   ↓
2. 機能が有効かチェック
   ↓
3. 通知チャンネルを取得
   ↓
4. メンバー情報を収集
   - ユーザー名・ID
   - アイコン画像（`member.user.displayAvatarURL({ size: 256 })` で取得）
   - アカウント作成日
   - 現在のメンバー数
   ↓
5. Embedを生成
   ↓
6. 通知チャンネルに送信
   ↓
7. ログに記録
```

### 退出通知フロー

```
1. guildMemberRemoveイベント発火
   ↓
2. 機能が有効かチェック
   ↓
3. 通知チャンネルを取得
   ↓
4. メンバー情報を収集
   - ユーザー名・ID
   - アイコン画像（`member.user.displayAvatarURL({ size: 256 })` で取得）
   - アカウント作成日
   - サーバー参加日（取得可能な場合）
   - 滞在期間計算
   - 現在のメンバー数
   ↓
5. Embedを生成
   ↓
6. 通知チャンネルに送信
   ↓
7. ログに記録
```

---

## 🎨 Embed生成の詳細

### アカウント作成日時の表示形式

`date-fns` の `intervalToDuration` を使用してアカウント作成日からの経過期間を年・月・日単位で正確に算出する（うるう年考慮）。

```
2020年12月23日 21:36(5年3ヶ月7日)
```

- 日時部分: Discord タイムスタンプ `:f`（曜日なし日時形式）
- 括弧内: 経過年齢（0の単位は省略、例: `3ヶ月5日`）
- 経過期間計算ロジック: `src/bot/features/member-log/handlers/accountAge.ts` の `calcDuration()`

### 滞在期間の表示形式

退出時のみ表示。参加日時が取得できない場合は「不明」と表示する。

```
72日
```

- `Math.floor((Date.now() - joinedTimestamp) / (1000 * 60 * 60 * 24))` で計算

---

## 🛡️ エラーハンドリング

### 想定されるエラー

1. **チャンネルが削除された**
   - 通知をスキップ
   - ログに記録
   - 設定を無効化（オプション）

2. **Bot権限不足**
   - メッセージ送信失敗
   - ログに記録
   - 管理者に通知（可能なら）

3. **メンバー情報取得失敗**
   - 基本情報のみで通知
   - エラーログ記録

4. **レート制限**
   - 大量の参加/退出が発生した場合
   - キュー処理で順次送信

---

## 🧪 テストケース

最新の件数とカバレッジは [TEST_PROGRESS.md](../progress/TEST_PROGRESS.md) を参照。

### ユニットテスト

- [ ] Embed生成
- [ ] メッセージフォーマット
- [ ] 滞在期間計算
- [ ] 設定コマンド各種

### インテグレーションテスト

- [ ] guildMemberAddイベント処理
- [ ] guildMemberRemoveイベント処理
- [ ] チャンネル権限チェック
- [ ] カスタムメッセージ展開

---

## 🌐 多言語対応（i18next）

### ローカライゼーションキー（`events` ネームスペース）

```typescript
// 参加通知フィールド
"member-log.join.title"; // 👋 新しいメンバーが参加しました！
"member-log.join.fields.username"; // ユーザー
"member-log.join.fields.accountCreated"; // アカウント作成日時
"member-log.join.fields.serverJoined"; // サーバー参加日時
"member-log.join.fields.memberCount"; // メンバー数
"member-log.join.footer"; // ようこそ！

// 退出通知フィールド
"member-log.leave.title"; // 👋 メンバーが退出しました
"member-log.leave.fields.username"; // ユーザー
"member-log.leave.fields.accountCreated"; // アカウント作成日時
"member-log.leave.fields.serverJoined"; // サーバー参加日時
"member-log.leave.fields.serverLeft"; // サーバー退出日時
"member-log.leave.fields.stayDuration"; // 滞在期間
"member-log.leave.fields.memberCount"; // メンバー数
"member-log.leave.footer"; // またね！

// 共通
"member-log.days"; // {{count}}日
"member-log.unknown"; // 不明
"member-log.age.years"; // {{count}}年
"member-log.age.months"; // {{count}}ヶ月
"member-log.age.days"; // {{count}}日
"member-log.age.separator"; // ""（ja） / " "（en）
```

---

## 関連ドキュメント

- [Discord.js - GuildMemberAdd](https://discord.js.org/#/docs/discord.js/main/class/Client?scrollTo=e-guildMemberAdd)
- [Discord.js - GuildMemberRemove](https://discord.js.org/#/docs/discord.js/main/class/Client?scrollTo=e-guildMemberRemove)
- [Discord.js - EmbedBuilder](https://discord.js.org/#/docs/discord.js/main/class/EmbedBuilder)
