# 実装進捗

> 機能実装の詳細な進捗状況

最終更新: 2026年3月1日（メンバーログ・メッセージ削除機能実装完了）

---

## 📊 実装状況サマリー

### 全体進捗

| カテゴリ             | 実装済み | 未実装 | 進捗率 |
| -------------------- | -------- | ------ | ------ |
| コア機能             | 13       | 0      | 100%   |
| コマンド             | 11       | 5      | 69%    |
| イベント             | 7        | 0      | 100%   |
| サービス             | 7        | 0      | 100%   |
| 主要機能             | 6        | 1      | 86%    |
| データベーステーブル | 4        | 4      | 50%    |

### 機能別実装状況

| 機能                 | 状態 | 実装率 | 備考                               |
| -------------------- | ---- | ------ | ---------------------------------- |
| Bumpリマインダー     | ✅   | 100%   | 完全実装                           |
| AFK                  | ✅   | 100%   | 完全実装                           |
| 多言語対応           | ✅   | 100%   | i18next + コマンドローカライズ     |
| メッセージレスポンス | ✅   | 100%   | 完全実装                           |
| VAC                  | ✅   | 100%   | 自動作成・操作パネルまで実装完了   |
| メッセージ固定       | ✅   | 100%   | 完全実装（set/remove/update/view） |
| 参加・脱退ログ       | ✅   | 100%   | 完全実装                           |
| メッセージ削除       | ✅   | 100%   | 完全実装                           |
| VC募集               | 📋   | 0%     | 仕様書のみ                         |
| ギルド設定           | 📋   | 0%     | 仕様書のみ（データ層は実装済み）   |
| 基本コマンド         | 🚧   | 25%    | `/ping` のみ実装済み               |
| Web UI               | 🚧   | 10%    | 基盤のみ                           |

**凡例**: ✅ 完了 | 🚧 実装中 | 📋 仕様書作成済み

---

## ✅ 実装完了項目

### 🏗️ 環境構築・インフラ

#### 開発環境

- ✅ プロジェクトセットアップ（pnpm、TypeScript、ESLint、Prettier）
- ✅ VSCode開発環境設定（settings.json、launch.json、tasks.json）
- ✅ Git設定（.gitignore、.gitattributes）

#### データベース

- ✅ Prismaセットアップとスキーマ定義
- ✅ libSQL（SQLite）構成
- ✅ マイグレーションシステム

#### テスト環境

- ✅ Vitestセットアップ
- ✅ ユニット/インテグレーションテスト構造
- ✅ カバレッジ設定（lcov、html）
- ✅ テストヘルパー（testHelpers.ts）

#### 多言語対応

- ✅ i18nextセットアップ
- ✅ 言語リソース（ja/en）
- ✅ コマンドローカライゼーション自動生成機能（LocaleManager）
- ✅ commandLocalizations.tsによる自動生成

---

### ⚙️ コア機能

#### Bot基盤

- ✅ Discord Bot基盤（client.ts）
  - Client初期化
  - イベントローダー
  - コマンドローダー
  - グレースフルシャットダウン（SIGTERM / SIGINT + Prisma切断）
- ✅ 環境変数管理（env.ts + Zod validation）
  - Discord設定（TOKEN、APP_ID、GUILD_ID、ERROR_WEBHOOK_URL）
  - データベース設定（DATABASE_URL）
  - Web設定（WEB_PORT、WEB_HOST）
  - ログ設定（LOG_LEVEL）

#### エラーハンドリング

- ✅ CustomErrorsクラス群
  - BaseError
  - ValidationError
  - DatabaseError
  - DiscordAPIError
  - ConfigurationError
  - NotFoundError
- ✅ ErrorHandlerサービス
  - エラーログ出力
  - ユーザー向けメッセージ生成
  - コマンドエラーハンドリング（`unknown` 型対応）
  - インタラクションエラーハンドリング（`unknown` 型対応）
  - `toError()` ヘルパー（`unknown` → `Error | BaseError` 変換）
  - `setupGlobalErrorHandlers()`（unhandledRejection / uncaughtException / warning）
  - `setupGracefulShutdown()`（SIGTERM / SIGINT + クリーンアップ処理）
  - i18n統合

#### データベース

- ✅ Prisma Client接続管理
- ✅ GuildConfigRepositoryパターン実装
  - findByGuildId
  - upsert
  - update
  - トランザクション対応
- ✅ BumpReminderRepositoryパターン実装（`src/bot/features/bump-reminder/repositories/bumpReminderRepository.ts`）
  - findPendingByGuild
  - findAllPending
  - create / findById / delete
  - cancelByGuild / cleanupOld
- ✅ GuildBumpReminderConfigStore実装（`src/shared/database/repositories/guildBumpReminderConfigStore.ts`）
  - getBumpReminderConfig / setBumpReminderConfig
  - mentionRoleの設定・解除
  - mentionUserの追加・削除・全削除
- ✅ 型定義集約（`src/shared/database/types.ts`）
  - GuildConfig, AfkConfig, BumpReminderConfig, VacConfig など
  - IGuildConfigRepository インターフェース

#### スケジューラー

- ✅ JobScheduler基盤（node-cron）
  - ジョブ登録・削除
  - Cron式サポート
  - エラーハンドリング
- ✅ BumpReminderService（`src/bot/features/bump-reminder/services/bumpReminderService.ts`）
  - Bumpリマインダースケジュール管理
  - 2時間後自動通知
  - Bot再起動時のスケジュール復元
  - データベース連携

#### サービス

- ✅ CooldownManager
  - コマンドクールダウン管理
  - ユーザー別・コマンド別管理
  - 自動クリーンアップ
  - メモリリーク防止

#### ユーティリティ

- ✅ 共有ヘルパー（helpers.ts）
  - formatTimestamp
  - sleep
  - isProduction
- ✅ Interactionヘルパー（interaction.ts）
  - safeReply
  - safeFollowUp
  - safeUpdate
  - safeDeferReply
- ✅ Prismaヘルパー（prisma.ts）
  - getPrismaClient / requirePrismaClient
  - `setPrismaClient()`（モジュールレベルでPrisma Clientを登録。global変数不使用）
- ✅ メッセージレスポンス（messageResponse.ts）
  - createSuccessEmbed / createInfoEmbed / createWarningEmbed / createErrorEmbed
  - カラーコード・絵文字の自動付与
  - タイムスタンプ・フィールド対応

#### 定数管理

- ✅ BUMP_CONSTANTS（`src/bot/features/bump-reminder/constants/bumpReminderConstants.ts`）
  - サービス名（DISBOARD、ディス速）
  - BotID、カスタムID接頭辞、ジョブID接頭辞
  - `getReminderDelayMinutes()`（通常120分・TESTモード1分）
  - `toScheduledAt()`（実行予定時刻生成）
  - `BUMP_DETECTION_RULES`（Bot ID + コマンド名の検知ルール）

#### ロガー

- ✅ Winston設定
  - コンソール出力（開発環境）
  - ファイル出力（logs/）
  - ログレベル管理
  - タイムスタンプ、色付け

---

### 🎯 実装済み機能

#### ⏰ Bumpリマインダー機能（100%完了）

**状態**: ✅ 完全実装・テスト済み

**実装済みコンポーネント**:

- ✅ messageCreateイベントでのBump検知とパネル送信
  - Disboard/ディス速のBotメッセージ検知
  - Embed検証・サービス名判定
  - Bump検知時のロール/ユーザー登録パネル送信
- ✅ 2時間後の自動リマインダー通知
  - BumpReminderServiceによるスケジュール管理
  - メンション付き通知（ロール/ユーザー）
- ✅ Bot再起動時のスケジュール復元
  - データベースから未完了タスク取得・スケジュール再登録
- ✅ データベース保存
  - BumpReminderテーブル
  - guildId、channelId、serviceName など保存
  - status（pending/sent/cancelled）管理
- ✅ `/bump-reminder-config` コマンド（Embed形式対応済）
  - サブコマンド: enable, disable, set-mention, remove-mention, view
  - インタラクティブUI（Button、Select Menu）
  - 権限チェック（サーバー管理権限のみ）・多言語対応

**関連ファイル**:

- `src/bot/events/messageCreate.ts`
- `src/bot/commands/bump-reminder-config.ts`
- `src/shared/features/bump-reminder/bumpReminderConfigService.ts`
- `prisma/schema.prisma` (BumpReminder、GuildConfig)

**テスト**:

- ✅ BumpReminderRepositoryインテグレーションテスト
- ✅ BumpReminderServiceインテグレーションテスト

**仕様書**: [docs/specs/BUMP_REMINDER_SPEC.md](../specs/BUMP_REMINDER_SPEC.md)

---

#### 🎤 AFK機能（100%完了）

**状態**: ✅ 完全実装

**実装済みコンポーネント**:

- ✅ `/afk` コマンド
  - ユーザーをAFKチャンネルへ移動
  - user オプション（対象ユーザー指定）
  - 権限チェック（MOVE_MEMBERS）
  - エラーハンドリング
  - 多言語対応
- ✅ `/afk-config` コマンド
  - サブコマンド: set-channel, view
  - AFKチャンネル設定
  - 現在の設定表示
  - Select Menuによるチャンネル選択UI
  - 権限チェック（管理者のみ）
  - 多言語対応
- ✅ データベース保存
  - GuildConfigテーブルのafkConfigフィールド（JSON形式）

**関連ファイル**:

- `src/bot/commands/afk.ts`
- `src/bot/commands/afk-config.ts`
- `src/shared/database/repositories/guildConfigRepository.ts`

**テスト**:

- ✅ GuildConfigRepositoryインテグレーションテスト

**仕様書**: [docs/specs/AFK_SPEC.md](../specs/AFK_SPEC.md)

---

#### 🌐 多言語対応（100%完了）

**状態**: ✅ 完全実装

**実装済みコンポーネント**:

- ✅ i18nextセットアップ
  - バックエンド: i18next-fs-backend
  - 言語: ja（日本語）、en（英語）
  - フォールバック: ja
- ✅ 言語リソース
  - `src/shared/locale/locales/ja/resources.ts`
  - `src/shared/locale/locales/en/resources.ts`
  - コマンド、エラー、メッセージの翻訳
- ✅ LocaleManager
  - getGuildLocale: ギルドの言語取得
  - t: 翻訳関数（ギルドIDベース）
  - コマンドローカライゼーション自動生成
- ✅ commandLocalizations.ts
  - buildLocalizedCommands: 全コマンドの多言語データ生成
  - name、descriptionの自動翻訳
  - optionsの多言語対応
- ✅ コマンド統合
  - 全コマンドで多言語対応済み
  - エラーメッセージの多言語対応

**関連ファイル**:

- `src/shared/locale/i18n.ts`
- `src/shared/locale/localeManager.ts`
- `src/shared/locale/commandLocalizations.ts`
- `src/shared/locale/locales/resources.ts`
- `src/shared/locale/locales/ja/resources.ts`
- `src/shared/locale/locales/en/resources.ts`

**テスト**:

- ✅ LocaleManager、commandLocalizationsのテスト実装済み

**ガイド**: [docs/guides/I18N_GUIDE.md](../guides/I18N_GUIDE.md)

---

### 🎤 VC自動作成機能（VAC）（100%完了）

**状態**: ✅ 完全実装・テスト済み

**仕様書**: [docs/specs/VAC_SPEC.md](../specs/VAC_SPEC.md)

**実装内容**:

- `voiceStateUpdate` でトリガー参加時に専用VCを自動作成
- 作成済みVCの空室検知による自動削除
- `channelDelete`/`clientReady` で設定と実体の同期クリーンアップ
- `/vac-config`（`create-trigger-vc` / `remove-trigger-vc` / `view`）
- `/vac`（`vc-rename` / `vc-limit`）
- 操作パネル（button/modal/user select）
- パネルUIを縦一列化し、全ボタン `ButtonStyle.Primary` に統一
- 応答APIを `flags: MessageFlags.Ephemeral` へ統一

---

### 📌 メッセージ固定機能（100%完了）

**状態**: ✅ 完全実装・テスト済み

**仕様書**: [docs/specs/STICKY_MESSAGE_SPEC.md](../specs/STICKY_MESSAGE_SPEC.md)

**実装内容**:

- `/sticky-message set` — チャンネルへスティッキーメッセージ設定（プレーン/Embed両対応）
- `/sticky-message remove` — スティッキーメッセージ削除（Discord上のメッセージも削除）
- `/sticky-message update` — 内容上書き更新と即時再送信
- `/sticky-message view` — ギルド内設定一覧を StringSelectMenu で提示、詳細を Embed 表示
- `messageCreate` イベントでデバウンス（5秒）再送信（`StickyMessageResendService`）
- `StickyMessage` テーブル追加（`channelId UNIQUE`、`embedData` JSON、`lastMessageId`）
- 各応答はギルド別言語設定（`tGuild`）に対応
- StringSelectMenu ルーティング基盤（`StringSelectHandler` / `handleStringSelectMenu`）新設

**テスト**:

- ✅ ユニットテスト・インテグレーションテスト実装済み（1264 tests / 232 suites）

---

### 👥 メンバーログ機能（100%完了）

**状態**: ✅ 完全実装・テスト済み

**仕様書**: [docs/specs/MEMBER_LOG_SPEC.md](../specs/MEMBER_LOG_SPEC.md)

**実装内容**:

- `guildMemberAdd` / `guildMemberRemove` イベントハンドラ
- Embed形式の参加・退出通知（ビリジアン・茶色カラー）
- アカウント年齢計算（`date-fns` 利用 / `accountAge.ts`）
- カスタムメッセージ（`{user}` / `{username}` / `{count}` プレースホルダー対応）
- `/member-log-config` コマンド（set-channel / enable / disable / set-join-message / set-leave-message / view）
- `GuildConfig.memberLogConfig`（JSON）への設定永続化
- `botMemberLogDependencyResolver.ts` による DI 解決

**関連ファイル**:

- `src/bot/events/guildMemberAdd.ts`
- `src/bot/events/guildMemberRemove.ts`
- `src/bot/commands/member-log-config.ts`
- `src/bot/features/member-log/handlers/guildMemberAddHandler.ts`
- `src/bot/features/member-log/handlers/guildMemberRemoveHandler.ts`
- `src/bot/features/member-log/handlers/accountAge.ts`
- `src/bot/features/member-log/commands/memberLogConfigCommand.execute.ts`
- `src/shared/features/member-log/memberLogConfigService.ts`

**テスト**:

- ✅ 13テストファイル ・ statements/functions/lines 100% ・ branches 100%

---

### 🗑️ メッセージ削除機能（100%完了）

**状態**: ✅ 完全実装・テスト済み

**仕様書**: [docs/specs/MESSAGE_DELETE_SPEC.md](../specs/MESSAGE_DELETE_SPEC.md)

**実装内容**:

- `/message-delete [count] [user] [bot] [keyword] [days] [after] [before] [channel]` コマンド
  - `count`: 削除件数（デフォルト10件）
  - `user`: 特定ユーザーのメッセージのみ対象
  - `bot`: Botメッセージのみ対象
  - `keyword`: キーワードを含むメッセージのみ対象
  - `days`/`after`/`before`: 相対・絶対日時による絞り込み
  - `channel`: 指定チャンネルのみ対象（省略時は現在チャンネル）
- 確認ダイアログ（削除前のプレビュー表示）
- Embed形式の削除結果表示（`messageDeleteEmbedBuilder.ts`）
- 権限チェック（MANAGE_MESSAGES）
- `/message-delete-config confirm:<boolean>` コマンド（確認ダイアログスキップ機能）
- `MessageDeleteUserSettingRepository` / `MessageDeleteUserSettingService`（設定永続化）

**関連ファイル**:

- `src/bot/commands/message-delete.ts`
- `src/bot/commands/message-delete-config.ts`
- `src/bot/features/message-delete/commands/messageDeleteCommand.execute.ts`
- `src/bot/features/message-delete/commands/messageDeleteConfigCommand.execute.ts`
- `src/bot/features/message-delete/commands/messageDeleteEmbedBuilder.ts`
- `src/bot/features/message-delete/services/messageDeleteService.ts`
- `src/bot/features/message-delete/repositories/messageDeleteUserSettingRepository.ts`
- `src/shared/features/message-delete/messageDeleteUserSettingService.ts`

**テスト**:

- ✅ 9テストファイル ・ statements/functions/lines 100% ・ branches 100%

---

### 💻 Web UI基盤（10%完了）

**状態**: 🚧 基盤のみ実装

**実装済みコンポーネント**:

- ✅ Fastifyサーバー基本構造
  - server.ts
  - Fastify初期化
  - グレースフルシャットダウン
- ✅ ヘルスチェックAPI
  - `GET /health`
  - サーバー稼働状態確認
- ✅ Web API基盤
  - `/api/apiRoutes.ts`
  - APIルーティング基盤
- ✅ 静的ファイル配信
  - `src/web/public/` ディレクトリ

**未実装**:

- ❌ 認証システム（Discord OAuth2、JWT）
- ❌ 管理API（/api/guilds/\*）
- ❌ フロントエンドUI
- ❌ ダッシュボード

**関連ファイル**:

- `src/web/server.ts`
- `src/web/routes/api/apiRoutes.ts`
- `src/web/routes/health.ts`

---

> ドキュメント一覧は [docs/README.md](../README.md) を参照

---

### 🎮 実装済みコマンド

| コマンド                 | 説明                                         | 状態 | 備考     |
| ------------------------ | -------------------------------------------- | ---- | -------- |
| `/ping`                  | 疎通確認                                         | ✅   | 完全実装 |
| `/afk`                   | AFKチャンネルへ移動                              | ✅   | 完全実装 |
| `/afk-config`            | AFK機能設定                                      | ✅   | 完全実装 |
| `/bump-reminder-config`  | Bumpリマインダー機能設定                         | ✅   | 完全実装 |
| `/vac-config`            | VAC設定（作成/削除/表示）                        | ✅   | 完全実装 |
| `/vac`                   | VAC VC操作（名前/人数）                          | ✅   | 完全実装 |
| `/sticky-message set`    | スティッキーメッセージ設定                       | ✅   | 完全実装 |
| `/sticky-message remove` | スティッキーメッセージ削除                       | ✅   | 完全実装 |
| `/sticky-message update` | スティッキーメッセージ更新                       | ✅   | 完全実装 |
| `/sticky-message view`   | スティッキーメッセージ一覧表示（SelectMenu）     | ✅   | 完全実装 |
| `/member-log-config`     | メンバーログ機能設定                             | ✅   | 完全実装 |
| `/message-delete`        | メッセージ一括削除                               | ✅   | 完全実装 |
| `/message-delete-config` | メッセージ削除内容設定                           | ✅   | 完全実装 |

**関連ファイル**:

- `src/bot/commands/ping.ts`
- `src/bot/commands/afk.ts`
- `src/bot/commands/afk-config.ts`
- `src/bot/commands/bump-reminder-config.ts`
- `src/bot/commands/vac-config.ts`
- `src/bot/commands/vac.ts`
- `src/bot/commands/sticky-message.ts`
- `src/bot/commands/member-log-config.ts`
- `src/bot/commands/message-delete.ts`
- `src/bot/commands/message-delete-config.ts`
- `src/bot/commands/commands.ts`
- `src/shared/utils/messageResponse.ts`

---

### 🎪 実装済みイベント

| イベント            | 説明                                     | 状態 | 備考     |
| ------------------- | ---------------------------------------- | ---- | -------- |
| `clientReady`       | Bot起動処理                              | ✅   | 完全実装 |
| `interactionCreate` | インタラクション処理                     | ✅   | 完全実装 |
| `messageCreate`     | メッセージ作成（Bump検知・sticky再送信） | ✅   | 完全実装 |
| `voiceStateUpdate`  | VAC自動作成・自動削除                    | ✅   | 完全実装 |
| `channelDelete`     | VAC設定同期                              | ✅   | 完全実装 |
| `guildMemberAdd`    | メンバー参加通知（メンバーログ）           | ✅   | 完全実装 |
| `guildMemberRemove` | メンバー退出通知（メンバーログ）           | ✅   | 完全実装 |

**関連ファイル**:

- `src/bot/events/clientReady.ts`
- `src/bot/events/interactionCreate.ts`
- `src/bot/events/messageCreate.ts`
- `src/bot/events/voiceStateUpdate.ts`
- `src/bot/events/channelDelete.ts`
- `src/bot/events/guildMemberAdd.ts`
- `src/bot/events/guildMemberRemove.ts`
- `src/bot/events/events.ts`
- `src/bot/handlers/interactionCreate/ui/buttons.ts`
- `src/bot/handlers/interactionCreate/ui/modals.ts`
- `src/bot/handlers/interactionCreate/ui/selectMenus.ts`

---

### 🔧 実装済みサービス

| サービス                   | 説明                                       | 状態 | 備考     |
| -------------------------- | ------------------------------------------ | ---- | -------- |
| CooldownManager            | コマンドクールダウン管理                   | ✅   | 完全実装 |
| BumpReminderService        | Bumpリマインダースケジューラー管理         | ✅   | 完全実装 |
| messageResponse            | Embedメッセージユーティリティ              | ✅   | 完全実装 |
| VacControlPanel            | VAC操作パネル送信ユーティリティ            | ✅   | 完全実装 |
| StickyMessageResendService | スティッキーメッセージ再送信（デバウンス） | ✅   | 完全実装 |
| MemberLogConfigService     | メンバーログ設定管理                         | ✅   | 完全実装 |
| MessageDeleteService       | メッセージ削除実行ロジック                   | ✅   | 完全実装 |

**関連ファイル**:

- `src/bot/services/cooldownManager.ts`
- `src/bot/services/botEventRegistration.ts`
- `src/bot/services/botCompositionRoot.ts`
- `src/bot/features/vac/handlers/ui/vacControlPanel.ts`
- `src/shared/features/bump-reminder/bumpReminderConfigService.ts`
- `src/shared/features/member-log/memberLogConfigService.ts`
- `src/bot/features/message-delete/services/messageDeleteService.ts`
- `src/shared/utils/messageResponse.ts`

---

### 🗄️ データベーススキーマ

#### 実装済みテーブル

**GuildConfig**

```prisma
model GuildConfig {
  id        String   @id @default(cuid())
  guildId   String   @unique
  locale    String   @default("ja")

  // 詳細設定（JSON形式で保存）
  afkConfig              String? // JSON: AfkConfig
  vacConfig              String? // JSON: VacConfig
  bumpReminderConfig     String? // JSON: BumpReminderConfig
  stickMessages          String? // JSON: StickMessage[]
  memberLogConfig        String? // JSON: MemberLogConfig

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("guild_configs")
}
```

**StickyMessage**

```prisma
model StickyMessage {
  id            String   @id @default(cuid())
  guildId       String
  channelId     String   @unique
  content       String
  embedData     String?  // JSON: StickyEmbedData
  lastMessageId String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([guildId])
  @@map("sticky_messages")
}
```

**BumpReminder**

```prisma
model BumpReminder {
  id             String    @id @default(cuid())
  guildId        String
  channelId      String    // 通知を送信するチャンネル
  messageId      String?   // 元のBumpメッセージID (返信用)
  panelMessageId String?   // Bumpパネルメッセージ ID (リマインダー送信後に削除)
  serviceName    String?   // サービス名 (Disboard, Dissoku)
  scheduledAt    DateTime  // 通知予定時刻
  status         String    @default("pending") // pending, sent, cancelled

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([guildId])
  @@index([status, scheduledAt])
  @@map("bump_reminders")
}
```

---

## 📋 未実装機能

以下は仕様書が作成済みで、実装待ちの機能です。

### 📢 VC募集機能

**状態**: 📋 仕様書作成済み、実装待ち

**仕様書**: [docs/specs/VC_RECRUIT_SPEC.md](../specs/VC_RECRUIT_SPEC.md)

**実装予定内容**:

- `/vc-recruit-config setup` / `teardown` / `add-role` / `remove-role` / `view`
- 2ステップモーダルフロー（募集画面作成）
- VC作成・削除の自動管理
- Prismaスキーマ追加（`VcRecruitConfig`・`VcRecruitSession` テーブル）

---

### ⚙️ ギルド設定機能

**状態**: 📋 仕様書作成済み、実装待ち

**仕様書**: [docs/specs/GUILD_CONFIG_SPEC.md](../specs/GUILD_CONFIG_SPEC.md)

**注記**: データ層（`IBaseGuildRepository.updateLocale` / `getLocale` / `LocaleManager.invalidateLocaleCache`）は実装済み。コマンド層のみ未実装。

**実装予定内容**:

- `/guild-config set-locale` — サーバーのロケール設定（`ja` / `en`）
- `/guild-config view` — 8ページパネル（概要＋各機能設定）、ページネーションボタン＋セレクトメニュー
- `/guild-config reset` — 全設定をリセット（確認ダイアログ付き）
- インタラクションハンドラー（ボタン / セレクトメニュー / リセット確認）

---

### 🔧 基本コマンド

**状態**: 🚧 一部実装済み（`/ping` のみ）

**仕様書**: [docs/specs/BASIC_COMMANDS_SPEC.md](../specs/BASIC_COMMANDS_SPEC.md)

**実装済み**:

- `/ping` ✅ — APIレイテンシ・WSping表示（クールダウン 5秒）

**実装予定内容**:

- `/help` — カテゴリ別コマンド一覧 Embed ＋ユーザーマニュアルリンク（ephemeral）
- `/server-info` — サーバー情報 Embed（名前・ID・オーナー・メンバー数・作成日・認証レベル・Boostなど）
- `/user-info` — ユーザー情報 Embed（対象ユーザー省略可、username・ID・作成日・参加日・ロール一覧など）

---

## 📊 実装統計

### コードベース統計

- **総ファイル数**: ~120+
- **TypeScriptファイル**: ~100+（index.ts 撤廃によりバレルファイルを削減済み）
- **総行数**: ~10000+ 行

### コンポーネント統計

| コンポーネント | 実装済み | 未実装 | 合計 |
| -------------- | -------- | ------ | ---- |
| コマンド       | 11       | 5      | 16   |
| イベント       | 7        | 0      | 7    |
| サービス       | 7        | 0      | 7    |
| リポジトリ     | 4        | 3      | 7    |
| ユーティリティ | 9        | 1      | 10   |

---

## 🔗 関連ドキュメント

- [README.md](../../README.md) - プロジェクト概要
- [TODO.md](../../TODO.md) - タスク管理・残件リスト
- [TEST_PROGRESS.md](TEST_PROGRESS.md) - テスト実装進捗
- [TESTING_GUIDELINES.md](../guides/TESTING_GUIDELINES.md) - テスト方針
- [ARCHITECTURE.md](../guides/ARCHITECTURE.md) - アーキテクチャ・設計概要
- [XSERVER_VPS_SETUP.md](../guides/XSERVER_VPS_SETUP.md) - VPS セットアップ
- [DEPLOYMENT.md](../guides/DEPLOYMENT.md) - GitHub Actions デプロイフロー
- [I18N_GUIDE.md](../guides/I18N_GUIDE.md) - 多言語対応ガイド
- [COMMANDS.md](../guides/COMMANDS.md) - コマンドリファレンス

### 機能仕様書

- [BUMP_REMINDER_SPEC.md](../specs/BUMP_REMINDER_SPEC.md) - Bumpリマインダー機能
- [AFK_SPEC.md](../specs/AFK_SPEC.md) - AFK機能
- [VAC_SPEC.md](../specs/VAC_SPEC.md) - VC自動作成機能
- [STICKY_MESSAGE_SPEC.md](../specs/STICKY_MESSAGE_SPEC.md) - メッセージ固定機能
- [MEMBER_LOG_SPEC.md](../specs/MEMBER_LOG_SPEC.md) - メンバーログ
- [MESSAGE_DELETE_SPEC.md](../specs/MESSAGE_DELETE_SPEC.md) - メッセージ削除
- [MESSAGE_RESPONSE_SPEC.md](../specs/MESSAGE_RESPONSE_SPEC.md) - メッセージレスポンス
- [VC_RECRUIT_SPEC.md](../specs/VC_RECRUIT_SPEC.md) - VC募集機能
