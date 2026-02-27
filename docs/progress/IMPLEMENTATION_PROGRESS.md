# 実装進捗

> 機能実装の詳細な進捗状況

最終更新: 2026年2月28日（ログのi18n化・DB操作ログ整備）

---

## 📊 実装状況サマリー

### 全体進捗

| カテゴリ             | 実装済み | 未実装 | 進捗率 |
| -------------------- | -------- | ------ | ------ |
| コア機能             | 13       | 0      | 100%   |
| コマンド             | 8        | 4      | 67%    |
| イベント             | 5        | 2      | 71%    |
| サービス             | 5        | 2      | 71%    |
| 主要機能             | 4        | 3      | 57%    |
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
| 参加・脱退ログ       | 📋   | 0%     | 仕様書のみ                         |
| メッセージ削除       | 📋   | 0%     | 仕様書のみ                         |
| VC募集               | 📋   | 0%     | 仕様書のみ                         |
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

- ✅ Jestセットアップ
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
  - Discord設定（TOKEN、CLIENT_ID、GUILD_ID）
  - データベース設定（DATABASE_URL）
  - Web設定（PORT、HOST）
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
  - サブコマンド: enable, disable, set-mention, remove-mention, show
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
  - サブコマンド: set-channel, show
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

### 📚 ドキュメント（90%完了）

**状態**: ✅ ほぼ完了

#### プロジェクト管理

- ✅ README.md - プロジェクト概要とクイックスタート
- ✅ TODO.md - タスク管理・残件リスト
- ✅ docs/README.md - ドキュメント構成説明
- ✅ docs/progress/IMPLEMENTATION_PROGRESS.md - 実装進捗の詳細
- ✅ docs/progress/TEST_PROGRESS.md - テスト進捗の詳細

#### 開発ガイド (docs/guides/)

- ✅ ARCHITECTURE.md - アーキテクチャ・設計概要
- ✅ COMMANDS.md - コマンドリファレンス（全コマンドの詳細）
- ✅ XSERVER_VPS_SETUP.md - VPS セットアップガイド
- ✅ DEPLOYMENT.md - GitHub Actions デプロイガイド
- ✅ TESTING_GUIDELINES.md - テスト方針とガイドライン
- ✅ I18N_GUIDE.md - 多言語対応ガイド

#### 機能仕様書 (docs/specs/)

**実装済み機能:**

- ✅ AFK_SPEC.md - AFK機能仕様
  - **検証完了**: 仕様書と実装が100%一致
  - コマンド、データ構造、エラーハンドリング、多言語対応
- ✅ BUMP_REMINDER_SPEC.md - Bumpリマインダー機能仕様 - **検証完了**: 仕様書と実装が100%一致
  - Bump検知、タイマー管理、データベース設計、コマンド実装

**未実装機能（仕様書のみ）:**

- ✅ VAC_SPEC.md - VC自動作成機能仕様
- ✅ STICKY_MESSAGE_SPEC.md - メッセージ固定機能仕様
- ✅ MEMBER_LOG_SPEC.md - メンバーログ仕様
- ✅ MESSAGE_DELETE_SPEC.md - メッセージ削除仕様
- ✅ MESSAGE_RESPONSE_SPEC.md - メッセージレスポンス仕様

#### ドキュメント整理（2026年2月19日完了）

- ✅ docs配下のディレクトリ構造整理
  - guides/ (開発者向けガイド: 5ファイル)
  - specs/ (機能仕様書: 7ファイル)
  - progress/ (進捗管理: 2ファイル)
- ✅ 全ドキュメントのリンク更新
  - README.md、TODO.md、IMPLEMENTATION_PROGRESS.md、TEST_PROGRESS.md
- ✅ 仕様書と実装の整合性検証
  - AFK機能: 完全一致 (コマンド、データ構造、エラーハンドリング、多言語対応)
  - Bumpリマインダー機能: 完全一致 (Bump検知、タイマー管理、DB設計、コマンド、設定管理)
  - 全120テストパス確認

---

### 🎮 実装済みコマンド

| コマンド                 | 説明                                         | 状態 | 備考     |
| ------------------------ | -------------------------------------------- | ---- | -------- |
| `/ping`                  | 疎通確認                                     | ✅   | 完全実装 |
| `/afk`                   | AFKチャンネルへ移動                          | ✅   | 完全実装 |
| `/afk-config`            | AFK機能設定                                  | ✅   | 完全実装 |
| `/bump-reminder-config`  | Bumpリマインダー機能設定                     | ✅   | 完全実装 |
| `/vac-config`            | VAC設定（作成/削除/表示）                    | ✅   | 完全実装 |
| `/vac`                   | VAC VC操作（名前/人数）                      | ✅   | 完全実装 |
| `/sticky-message set`    | スティッキーメッセージ設定                   | ✅   | 完全実装 |
| `/sticky-message remove` | スティッキーメッセージ削除                   | ✅   | 完全実装 |
| `/sticky-message update` | スティッキーメッセージ更新                   | ✅   | 完全実装 |
| `/sticky-message view`   | スティッキーメッセージ一覧表示（SelectMenu） | ✅   | 完全実装 |

**関連ファイル**:

- `src/bot/commands/ping.ts`
- `src/bot/commands/afk.ts`
- `src/bot/commands/afk-config.ts`
- `src/bot/commands/bump-reminder-config.ts`
- `src/bot/commands/vac-config.ts`
- `src/bot/commands/vac.ts`
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

**関連ファイル**:

- `src/bot/events/clientReady.ts`
- `src/bot/events/interactionCreate.ts`
- `src/bot/events/messageCreate.ts`
- `src/bot/events/voiceStateUpdate.ts`
- `src/bot/events/channelDelete.ts`
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

**関連ファイル**:

- `src/bot/services/cooldownManager.ts`
- `src/bot/services/botEventRegistration.ts`
- `src/bot/services/botCompositionRoot.ts`
- `src/bot/features/vac/handlers/ui/vacControlPanel.ts`
- `src/shared/features/bump-reminder/bumpReminderConfigService.ts`
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

### 🎤 VC自動作成機能（VAC）

**状態**: ✅ 実装完了

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

### 📌 メッセージ固定機能

**状態**: ✅ 実装完了

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

**関連ファイル**:

- `src/bot/commands/sticky-message.ts`
- `src/bot/features/sticky-message/commands/stickyMessageCommand.execute.ts`
- `src/bot/features/sticky-message/commands/usecases/stickyMessageSet.ts`
- `src/bot/features/sticky-message/commands/usecases/stickyMessageRemove.ts`
- `src/bot/features/sticky-message/commands/usecases/stickyMessageUpdate.ts`
- `src/bot/features/sticky-message/commands/usecases/stickyMessageView.ts`
- `src/bot/features/sticky-message/handlers/ui/stickyMessageViewSelectHandler.ts`
- `src/bot/features/sticky-message/services/stickyMessageResendService.ts`
- `src/bot/features/sticky-message/services/stickyMessagePayloadBuilder.ts`
- `src/bot/features/sticky-message/repositories/stickyMessageRepository.ts`
- `src/bot/features/sticky-message/handlers/stickyMessageCreateHandler.ts`

**テスト**:

- ✅ ユニットテスト・インテグレーションテスト実装済み（987 tests / 206 suites）

---

### 👥 メンバーログ機能（仕様書のみ）

**状態**: 📋 仕様書作成済み、実装待ち

**仕様書**: [docs/specs/MEMBER_LOG_SPEC.md](../specs/MEMBER_LOG_SPEC.md)

**実装予定内容**:

- guildMemberAdd、guildMemberRemoveイベントハンドラ
- Embed形式の通知メッセージ
- `/member-log-config` コマンド
- データベーススキーマ追加

---

### 🗑️ メッセージ削除機能（仕様書のみ）

**状態**: 📋 仕様書作成済み、実装待ち

**仕様書**: [docs/specs/MESSAGE_DELETE_SPEC.md](../specs/MESSAGE_DELETE_SPEC.md)

**実装予定内容**:

- `/message-delete [count] [user] [keyword] [days] [after] [before] [channel]` コマンド
  - `count`: 削除件数（デフォルト10件）
  - `user`: 特定ユーザーのメッセージのみ対象
  - `keyword`: キーワードを含むメッセージのみ対象
  - `days`/`after`/`before`: 相対・絶対日時による絞り込み
  - `channel`: 全チャンネル横断削除（省略時は現在チャンネル）
- 確認ダイアログ（削除前のプレビュー表示）
- ページネーション付き削除結果表示
- 権限チェック（MANAGE_MESSAGES）
- `/message-delete-config` コマンド（ギルド別デフォルト設定）
- 削除ログ

---

### 📢 VC募集機能（仕様書のみ）

**状態**: 📋 仕様書作成済み、実装待ち

**仕様書**: [docs/specs/VC_RECRUIT_SPEC.md](../specs/VC_RECRUIT_SPEC.md)

**実装予定内容**:

- `/vc-recruit-config setup` — 募集機能の有効化・チャンネル設定
- `/vc-recruit-config teardown` — 募集機能の無効化
- `/vc-recruit-config add-role` — 参加可能ロール追加
- `/vc-recruit-config remove-role` — 参加可能ロール削除
- `/vc-recruit-config view` — 設定内容確認
- 2ステップモーダルフロー（募集画面作成）
- VC作成・削除の自動管理
- Prismaスキーマ追加（`VcRecruitConfig`・`VcRecruitSession` テーブル）

---

## 📊 実装統計

### コードベース統計

- **総ファイル数**: ~120+
- **TypeScriptファイル**: ~100+（index.ts 撤廃によりバレルファイルを削減済み）
- **テストファイル**: 206
- **テスト数**: 987
- **総行数**: ~10000+ 行

### コンポーネント統計

| コンポーネント | 実装済み | 未実装 | 合計 |
| -------------- | -------- | ------ | ---- |
| コマンド       | 8        | 4      | 12   |
| イベント       | 5        | 2      | 7    |
| サービス       | 5        | 2      | 7    |
| リポジトリ     | 3        | 4      | 7    |
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

---

**最終更新**: 2026年2月28日

---

## ✅ 最近の完了項目 (2026年2月22日 追記分 — sticky-message)

### 📌 メッセージ固定機能（sticky-message）

- ✅ `prisma/schema.prisma` に `StickyMessage` モデル追加・マイグレーション適用
- ✅ `src/bot/features/sticky-message/repositories/stickyMessageRepository.ts` 実装
  - `create` / `findByChannel` / `findAllByGuild` / `updateContent` / `updateLastMessageId` / `delete`
- ✅ `stickyMessagePayloadBuilder.ts` 実装（プレーン/Embed 送信ペイロード生成）
- ✅ `StickyMessageResendService` 実装（デバウンス5秒、前メッセージ削除・再送信）
- ✅ `src/bot/features/sticky-message/handlers/stickyMessageCreateHandler.ts` 実装
- ✅ `/sticky-message` コマンド4サブコマンド全実装（set / remove / update / view）
- ✅ `view` サブコマンドを StringSelectMenu 方式に刷新
- ✅ StringSelectMenu ルーティング基盤新設（`StringSelectHandler` インターフェース・`handleStringSelectMenu` 関数）
- ✅ `stickyMessageViewSelectHandler.ts` 実装（選択チャンネルの詳細を Embed 返信）
- ✅ 全レスポンスを `tGuild` によるギルド別言語対応に統一
- ✅ コメント規約対応（全関数 JSDoc `@param`/`@returns` 追加・処理ブロックコメント整備）
- ✅ テスト追加（987 tests / 206 suites、全件 PASS）

### `index.ts`撤廃スプリント（直接import化）

- ✅ `src/bot/commands/index.ts` 削除 → `commands.ts`（コマンドレジストリ）に統一
- ✅ `src/bot/events/index.ts` 削除 → `events.ts` に統一
- ✅ `src/bot/features/afk/index.ts`, `commands/index.ts` 削除
- ✅ `src/bot/features/ping/index.ts`, `commands/index.ts` 削除
- ✅ `src/bot/features/vac/index.ts`, `commands/index.ts`, `handlers/index.ts`, `handlers/ui/index.ts`, `repositories/index.ts`, `services/index.ts` 削除
- ✅ `src/bot/features/bump-reminder/` 配下全 `index.ts` 削除（commands, constants, handlers, handlers/ui, repositories, services）
- ✅ 全ソースまたはテストの `jest.mock()` / `import` を実解決先（直接モジュールパス）へ全面追従
- ✅ 全テスト（805 tests / 185 suites）の回帰確認完了

---

## ✅ 最近の完了項目 (2026年2月28日 追記分 — ログのi18n化・DB操作ログ整備)

### 🌐 ログメッセージの全面i18n化

- ✅ 全 `logger.*()` 呼び出しを `tDefault("system:...")` 経由に統一
  - 生文字列を logger に直接渡すことを廃止
  - `src/shared/locale/locales/ja/system.ts` / `en/system.ts` にすべての system ロケールキーを定義
- ✅ system名前空間のキー構造を feature プレフィックスで整理
  - `log.bump_reminder_*` → `bump-reminder.config_*`
  - `error.cleanup_*` → `shutdown.cleanup_*`
  - `afk.*_log` → `afk.*`（`_log` サフィックス廃止）
  - `scheduler.cancel_bump_reminder` → `scheduler.bump_reminder_cancelling`
- ✅ StickyMessage系ハンドラー・サービス・リポジトリを system 名前空間に対応

### 🗄️ VAC・AFK のDB操作ログ追加

- ✅ `VacConfigService` の4メソッドに `executeWithDatabaseError` + `logger.debug` を適用
  - `addTriggerChannel` / `removeTriggerChannel` / `addCreatedVacChannel` / `removeCreatedVacChannel`
- ✅ `AfkConfigService` の2メソッドに同パターンを適用
  - `setAfkChannel` / `saveAfkConfig`
- ✅ DB操作ログキー12件追加（VAC 8件・AFK 4件）
  - `system:database.vac_trigger_added/failed` 等

### 📊 テスト

- ✅ 全テスト成功（206 suites / 987 tests）
- ✅ カバレッジ: statements 100% / functions 100% / lines 100% / branches 99.19%

---

## ✅ 最近の完了項目 (2026年2月19日 追記分)

### Phase 2: VAC機能実装

- ✅ `src/bot/events/voiceStateUpdate.ts` 実装（自動作成・自動削除）
- ✅ `src/bot/events/channelDelete.ts` 実装（削除同期）
- ✅ `src/bot/commands/vac-config.ts` 実装（create/remove/show）
- ✅ `src/bot/commands/vac.ts` 実装（vc-rename/vc-limit）
- ✅ `src/bot/features/vac/handlers/ui/vacControlPanel.ts` 実装（操作パネル生成）
- ✅ `src/bot/features/vac/handlers/ui/vacPanelUserSelect.ts` 追加（AFK移動）
- ✅ `src/bot/events/clientReady.ts` 起動時VACクリーンアップを追加

### deprecation対応（Interaction response）

- ✅ `ephemeral` を `flags: MessageFlags.Ephemeral` へ置換
- ✅ AFK/Bump/VAC/共通ErrorHandler/interactionCreate に横展開
- ✅ docs/specs の表記も `MessageFlags.Ephemeral` に統一

### Phase 1: メッセージシステム統一

- ✅ `src/shared/utils/messageResponse.ts` 実装（4種類Embedヘルパー）
- ✅ 全コマンドレスポンスのEmbed化（/ping, /afk, /afk-config, /bump-reminder-config）
- ✅ ErrorHandlerのEmbed形式対応
- ✅ ローカライゼーション拡充（日英各 60+項目、Embed UI向キー團設計）
- ✅ ユニットテスト 14ケース追加（全134テストパス）

### Bumpリマインダー機能のモジュール分離

- ✅ `src/shared/features/bump-reminder/bumpReminderConfigService.ts` へ集約
- ✅ buttonHandlers/modalHandlers レジストリ方式に移行
- ✅ `src/shared/database/types.ts` 型定義集約
- ✅ `getGuildConfigRepository()` 工場関数追加

### i18n 型安全化

- ✅ `AllParseKeys` 型で `tGuild()` / `tDefault()` 引数を型安全化
- ✅ `keySeparator: false` でフラットキー形式に統一
- ✅ ログキーを `events:` から `system:` ネームスペースへ移動
- ✅ `GuildTFunction` 型導入

### ドキュメントとソースコードの整合修正

- ✅ docs/guides/ARCHITECTURE.md 新規作成（アーキテクチャ・設計概要）
- ✅ bump-reminder-config サブコマンド名修正: `start/stop` → `enable/disable`
- ✅ afk-config サブコマンド名修正: `set-channel` → `set-ch` → `set-channel` (統一)
- ✅ AFK データベース保存フィールド修正: `afkChannelId` → `afkConfig (JSON)`
- ✅ `GuildBumpReminderConfigStore.ts` をデータベースセクションへ追記
- ✅ Bumpリマインダー定数の説明更新（`getReminderDelayMinutes()` / `toScheduledAt()` 等）
- ✅ データベーススキーマの記述を実際のスキーマ（cuid, JSON統合, @@map）に更新
- ✅ TEST_PROGRESS.md のテスト数・スイート数を実績値に更新（805テスト / 185スイート）
- ✅ BumpReminderRepository / BumpReminderService テストを「実装済み」に移動
