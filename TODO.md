# Guild Management Bot v2 - TODO

> プロジェクト全体のタスク管理と残件リスト

最終更新: 2026年2月20日

---

## 📊 全体進捗サマリー

### タスク統計

| カテゴリ     | 完了   | 進行中 | 未着手 | 合計    | 進捗率  |
| ------------ | ------ | ------ | ------ | ------- | ------- |
| 実装タスク   | 51     | 0      | 36     | 87      | 59%     |
| テストタスク | 10     | 0      | 10     | 20      | 50%     |
| ドキュメント | 18     | 0      | 2      | 20      | 90%     |
| **合計**     | **79** | **0**  | **48** | **127** | **62%** |

### Phase別進捗

| Phase | 内容                   | 完了 | 残件 | 状態 |
| ----- | ---------------------- | ---- | ---- | ---- |
| 0     | 環境構築・インフラ     | 13   | 0    | ✅   |
| 1     | メッセージシステム統一 | 10   | 0    | ✅   |
| 2     | 主要機能実装           | 2    | 30   | 🚧   |
| 3     | 基本コマンド追加       | 0    | 6    | 📋   |
| 4     | Web UI実装             | 3    | 12   | 🚧   |
| 5     | テスト・品質向上       | 10   | 13   | 🚧   |
| 6     | デプロイ・運用         | 0    | 12   | 📋   |

**凡例**: ✅ 完了 | 🚧 進行中 | 📋 未着手

---

## 📋 残タスク一覧

### 🔴 Phase 1: メッセージシステム統一（優先度：高） - 残0件

**状況**: MESSAGE_RESPONSE_SPEC.mdにて仕様策定済み。✅ 実装完了。

#### 実装タスク

- [x] メッセージレスポンスユーティリティの作成
  - [x] `createSuccessEmbed()` - 成功メッセージ（緑色）
  - [x] `createInfoEmbed()` - 情報メッセージ（青色）
  - [x] `createWarningEmbed()` - 警告メッセージ（黄色）
  - [x] `createErrorEmbed()` - エラーメッセージ（赤色）
  - [x] タイムスタンプ、フッターの自動付与
- [x] 既存コマンドのメッセージ修正（4コマンド）
  - [x] `/ping` コマンド
  - [x] `/afk` コマンド
  - [x] `/afk-config` コマンド
  - [x] `/bump-reminder-config` コマンド
- [x] ErrorHandlerでのEmbed形式対応
- [x] ローカライゼーションキーの追加（日本語・英語）
- [x] テスト実装（14テストケース）

**仕様書**: [docs/specs/MESSAGE_RESPONSE_SPEC.md](docs/specs/MESSAGE_RESPONSE_SPEC.md)

---

### 🟡 Phase 2: 主要機能実装 - 残24件

#### 2.1 VC自動作成機能（VAC） - 残2件

- [x] voiceStateUpdateイベントハンドラ作成
- [x] トリガーチャンネル監視とVC自動作成・削除
- [x] 操作パネル実装（AFKチャンネル移動、VC設定変更）
- [x] `/vac-config` コマンド実装（create-trigger-vc、remove-trigger-vc、show）
- [ ] テスト実装（コマンド/イベント/パネル操作）
- [ ] VAC挙動のE2E検証（複数カテゴリ・再起動クリーンアップ）

**仕様書**: [docs/specs/VAC_SPEC.md](docs/specs/VAC_SPEC.md)

#### 2.2 メッセージ固定機能 - 残4件

- [ ] `/sticky-message` コマンド実装（set、remove、list）
- [ ] messageCreateイベントでの自動再送信ロジック
- [ ] Prisma Schema更新（StickyMessage）
- [ ] テスト実装

**仕様書**: [docs/specs/STICKY_MESSAGE_SPEC.md](docs/specs/STICKY_MESSAGE_SPEC.md)

#### 2.3 メンバーログ機能 - 残7件

- [ ] guildMemberAdd、guildMemberRemoveイベントハンドラ作成
- [ ] Embed形式の通知メッセージ実装
- [ ] `/member-log-config` コマンド実装（set-channel、enable、disable、show）
- [ ] Prisma Schema更新（MemberLogConfig）
- [ ] テスト実装

**仕様書**: [docs/specs/MEMBER_LOG_SPEC.md](docs/specs/MEMBER_LOG_SPEC.md)

#### 2.4 メッセージ削除機能 - 残4件

- [ ] `/message-delete` コマンド実装（user、count、channelオプション）
- [ ] 権限チェック（MANAGE_MESSAGES）
- [ ] 削除実行ログと通知
- [ ] テスト実装

**仕様書**: [docs/specs/MESSAGE_DELETE_SPEC.md](docs/specs/MESSAGE_DELETE_SPEC.md)

#### 2.5 プロフィールチャンネル - 残5件

- [ ] messageCreateイベントでプロフィールメッセージ検知
- [ ] メッセージフォーマット検証
- [ ] `/prof-channel-config` コマンド実装
- [ ] Prisma Schema更新
- [ ] テスト実装

---

### 🟢 Phase 3: 基本コマンド追加 - 残6件

- [ ] `/help` - ヘルプコマンド（全コマンド一覧）
- [ ] `/server-info` - サーバー情報表示
- [ ] `/user-info` - ユーザー情報表示
- [ ] `/config-locale` - ギルド言語設定
- [ ] `/config-view` - 現在の設定表示
- [ ] `/config-reset` - 設定リセット

---

### 🟢 Phase 4: Web UI実装 - 残12件

**状況**: Fastifyサーバー基盤、ヘルスチェックAPI、/api/index.tsは実装済み。

#### 4.1 認証システム - 残4件

- [ ] Discord OAuth2統合
- [ ] JWT認証実装
- [ ] セッション管理
- [ ] 権限チェックミドルウェア

#### 4.2 管理API - 残5件

- [ ] `/api/guilds` - ギルド一覧取得
- [ ] `/api/guilds/:id` - ギルド詳細取得
- [ ] `/api/guilds/:id/config` - 設定取得・更新
- [ ] `/api/guilds/:id/stats` - 統計情報取得
- [ ] バリデーション・エラーハンドリング

#### 4.3 フロントエンド - 残3件

- [ ] ダッシュボードUI
- [ ] ギルド設定画面
- [ ] 統計表示画面

---

### 🟢 Phase 5: テスト・品質向上 - 残13件

**状況**: ユニットテスト＋インテグレーションテストで455テスト実装済み（39 suites, 全件PASS）。

#### 5.1 テストカバレッジ向上 - 残6件

- [x] コマンドのユニットテスト追加
- [x] イベントハンドラーのテスト追加
- [ ] E2Eテスト追加（Discordモック利用）
- [ ] カバレッジ目標70%達成
- [ ] エッジケーステスト
- [ ] 新機能のテスト（VAC、メッセージ固定等）

**スプリント連携ID（`docs/progress/TEST_PROGRESS.md` と同期）**

- [x] `TS-001` [P1] `/ping` コマンドテスト
- [x] `TS-002` [P1] `/afk` + `/afk-config` テスト
- [x] `TS-003` [P1] `/vac-config` + `/vac` テスト
- [x] `TS-004` [P1] `/bump-reminder-config` テスト
- [x] `TS-005` [P1] `interactionCreate` イベントテスト
- [x] `TS-006` [P1] `messageCreate`（Bump検知）テスト
- [x] `TS-007` [P2] VACイベント/ハンドラテスト
- [x] `TS-008` [P2] `JobScheduler` テスト

**詳細**: [docs/progress/TEST_PROGRESS.md](docs/progress/TEST_PROGRESS.md)

#### 5.2 ドキュメント整備 - 残2件

- [ ] API仕様書（OpenAPI/Swagger）
- [ ] デプロイガイド

#### 5.3 パフォーマンス最適化 - 残3件

- [ ] データベースクエリ最適化
- [ ] メモリ使用量プロファイリング
- [ ] ログローテーション設定

---

### 🟢 Phase 6: デプロイ・運用 - 残12件

#### 6.1 Docker化 - 残5件

- [ ] 本番用Dockerfile最適化
- [ ] docker-compose.yml改善
- [ ] マルチステージビルド
- [ ] ヘルスチェック設定
- [ ] Prismaマイグレーション自動実行

#### 6.2 CI/CD - 残3件

- [ ] GitHub Actions ワークフロー（リント・テスト）
- [ ] Dockerイメージビルド・プッシュ
- [ ] 自動デプロイ設定

#### 6.3 監視・ログ - 残3件

- [ ] エラー通知（Discord Webhook）
- [ ] メトリクス収集
- [ ] アラート設定

#### 6.4 バックアップ - 残1件

- [ ] データベース自動バックアップ・復旧手順

---

## 🎯 優先度別タスク

### 🔴 高優先度（次の1-2週間）

1. ~~**メッセージシステムの統一化**~~ - ✅ 完了
2. **VC自動作成機能の検証・テスト拡充** - 2件
3. **メッセージ固定機能の実装** - 4件

### 🟡 中優先度（1ヶ月以内）

4. **メンバー参加・脱退ログ機能** - 7件
5. **メッセージ削除機能** - 4件
6. **基本コマンド追加** - 6件
7. **Web API拡充** - 5件
8. **テストカバレッジ向上** - 8件

### 🟢 低優先度（将来的に）

9. **Web UI フロントエンド** - 3件
10. **プロフィールチャンネル** - 5件
11. **認証システム** - 4件
12. **デプロイ・運用** - 12件

---

## 🔧 技術的改善タスク

### src整理ロードマップ（効果優先）

- [x] **P1: `shared-access` 依存の段階削減（第一弾）**
  - [x] `VAC` repository の `shared-access` 依存を `shared/features/vac` 直接参照へ変更
  - [x] Bot 基盤（`clientReady` / `client` / `botEventRegistration`）の `tDefault` 参照を `shared/locale` 直参照へ変更
- [x] **P2: `shared-access` を機能別境界に分解（locale/errors/features）**
  - [x] locale参照の直接import置換を開始（commands/VAC/Bump service）
  - [x] errors参照の直接import置換を開始（Bump repository）
  - [x] `shared-access` 利用箇所をカテゴリ単位で置換
  - [x] `shared-access/index.ts` を廃止（wrapperディレクトリ削除）
- [x] **P3: `commands` 層の薄型化（入口責務へ限定）**
  - [x] `commands` から業務ロジックを `features/services` へ移送
    - [x] `afk` / `afk-config` の実行ロジックを `features/afk/commands` へ移送
    - [x] `vac` / `vac-config` / `bump-reminder-config` は `features` 委譲のみを維持
    - [x] `ping` の実行ロジックを `features/ping/commands` へ移送
  - [x] 権限・入力検証・応答のみ `commands` に残す
- [x] **P4: `shared/database` 巨大ファイル分割**
  - [x] CAS更新ロジックを共通ヘルパー化
    - [x] `GuildBumpReminderConfigStore` のCAS処理を `stores/helpers/bumpReminderConfigCas.ts` へ抽出
    - [x] AFK CAS処理を `stores/helpers/afkConfigCas.ts` へ抽出
  - [x] `stores/repositories` の責務を serializer / persistence に再分離
    - [x] `PrismaGuildConfigRepository` の JSON serializer/deserializer を `repositories/serializers/guildConfigSerializer.ts` へ抽出
    - [x] AFK処理（`getAfkConfig` / `setAfkChannel` / `updateAfkConfig`）を `stores/guildAfkConfigStore.ts` へ分離
    - [x] read系クエリ（config/exists/locale/afk/stick/member-log）を `repositories/persistence/guildConfigReadPersistence.ts` へ抽出
    - [x] write系クエリ（save/update/delete）を `repositories/persistence/guildConfigWritePersistence.ts` へ抽出
- [x] **P5: singleton依存を明示DIへ段階移行**
  - [x] `vac` / `bump-reminder` から factory + 注入経路を整備
- [ ] **P6: src整備方針（責務分離/構成整理/スリム化）**
  - [ ] **依存解決の統一（最優先）**
    - [ ] `getXxx` 依存を段階的に `createXxx` + 明示注入へ寄せる
    - [ ] Composition Root を `bot/main.ts` 起点で明確化（生成責務の分散を抑制）
  - [x] **高凝集ファイルの分解（効果優先）**
    - [x] `bump-reminder`（service/repository/handler）を「ユースケース」「永続化」「スケジューリング」へ分離
    - [x] `vac`（service/command）を「入力解決」「設定更新」「表示整形」へ分離
    - [x] `guildConfigRepository` を機能別ファサード化して責務面積を縮小
  - [ ] **ディレクトリ境界の明確化**
    - [ ] `bot/features/*` は Botユースケース層に限定し、shared 直参照の境界ルールを固定
    - [ ] `shared/database/*` は設定種別（afk/bump/vac/member-log/sticky）単位の独立性を強化
  - [x] **実施ポリシー**
    - [x] 当面は `src` 整備を優先し、テスト拡充・修正は構成安定後に再開する

#### P6 実行チェックリスト（コミット単位）

- [x] **C1: bump-reminder の依存解決を明示DI化（入口整備）**
  - 対象: `bump-reminder` の `repository/manager/index` 公開API
  - 目標: `createXxx` 追加 + 既存 `getXxx` は互換維持
  - コミット例: `refactor: bump-reminder の依存解決を明示DI経路へ整理`
- [x] **C2: vac の既定依存解決を service注入経路へ統一**
  - 対象: `vacRepository` / `vacService`
  - 目標: default 経路を factory ベースへ寄せ、生成責務を統一
  - コミット例: `refactor: vac の依存解決を service factory 経由へ統一`
- [x] **C3: vac-config command の薄型化（1）入力解決の抽出**
  - 対象: `vacConfigCommand.execute.ts` + `commands/helpers/*`
  - 目標: category解決/trigger探索を helper へ分離
  - コミット例: `refactor: vac-config の入力解決処理を helper に抽出`
- [x] **C4: vac-config command の薄型化（2）表示整形の抽出**
  - 対象: `vacConfigCommand.execute.ts` + `commands/presenters/*`
  - 目標: show用の整形/Embed生成前段を presenter 化
  - コミット例: `refactor: vac-config 表示整形を presenter に分離`
- [x] **C5: bump-reminder service の分割（ユースケース/スケジュール）**
  - 対象: `bumpReminderService.ts` + `services/*`
  - 目標: 復元/登録/取消ロジックの関心分離
  - コミット例: `refactor: bump-reminder service を用途別に分割`
- [x] **C6: guildConfigRepository のファサード薄化（機能別集約）**
  - 対象: `shared/database/repositories/*`
  - 目標: 機能別エントリへ分割し、集約層は委譲のみへ縮小
  - コミット例: `refactor: guildConfigRepository を機能別ファサードへ再編`

#### コミット運用ルール（P6期間）

- [x] 1コミット1関心（最大 3〜6 ファイル目安）
- [x] 各コミットで `pnpm run typecheck` を通す
- [x] 互換レイヤーを先に入れてから呼び出し側を移行する
- [x] テスト修正は後段（構成安定後）にまとめて実施する

### コード品質

- [x] 型安全性の向上（`any`型の削減）
  - [x] `AllParseKeys` 型導入により `t()` / `tDefault()` の引数を型安全化
  - [x] `keySeparator: false` でフラットキー形式に統一
  - [x] `setPrismaClient()`導入（`global.prisma`をモジュールレベル変数に変更）
  - [x] `error as Error` キャストを撤廃（`unknown` 型対応）
  - [x] `handleCommandError` / `handleInteractionError` を `unknown` 型対応に変更
  - [x] `@ts-expect-error` をイベント登録の `as never` キャストに変更
- [x] グレースフルシャットダウンの完全実装（SIGTERM / SIGINT ハンドラー + Prisma切断）
- [x] ボタンインタラクションのエラーハンドリング追加
- [x] クールダウンメッセージの多言語対応（ギルド設定言語を使用）
- [x] DIガード追加（`setRepository()` 未呼び出し時に明示的エラー）
- [x] `exists()` のエラー隠蔽修正（DB例外を再スロー）
- [ ] ESLintルール厳格化
- [ ] コードコメント充実
- [ ] 未使用コード・デッドコード削除
- [ ] 一貫性のあるエラーメッセージ

### アーキテクチャ

- [x] 機能モジュール分離（`src/shared/features/`）
  - [x] Bumpリマインダー機能を `features/bump-reminder/` へ集約
- [x] インタラクションハンドラーレジストリ方式の導入
  - [x] `buttonHandlers` / `modalHandlers` レジストリ
- [x] データベース型定義の集約（`database/types.ts`）
- [ ] リポジトリパターン完全実装
- [ ] 依存性注入の導入検討（現状はモジュールレベルのDI + ガード関数）
- [ ] サービス層の整理
- [x] エラーハンドリング統一（Embed形式、ErrorHandler）
- [x] グローバルエラーハンドラー統一（`setupGlobalErrorHandlers` / `setupGracefulShutdown`）

### セキュリティ

- [ ] 依存関係の脆弱性スキャン
- [ ] 入力バリデーション強化
- [ ] レート制限実装
- [ ] セキュリティヘッダー設定

---

## 📝 メモ・検討事項

### 技術スタック改善検討

- **キャッシュ**: Redis導入の検討
- **ロガー**: Winston → Pino 移行検討
- **テスト**: Jest → Vitest 移行検討

### 機能拡張アイデア

- 自動翻訳機能（DeepL API等）
- 投票システム（リアクション投票）
- ウェルカムメッセージ（カスタマイズ可能）
- ロール管理（自動ロール付与）
- 音楽Bot機能（検討中）

---

## 🔗 関連ドキュメント

### プロジェクト管理

- [README.md](README.md) - プロジェクト概要
- [docs/progress/IMPLEMENTATION_PROGRESS.md](docs/progress/IMPLEMENTATION_PROGRESS.md) - 実装進捗の詳細
- [docs/progress/TEST_PROGRESS.md](docs/progress/TEST_PROGRESS.md) - テスト進捗の詳細

### 開発ガイド

- [docs/guides/COMMANDS.md](docs/guides/COMMANDS.md) - コマンドリファレンス
- [docs/guides/DEVELOPMENT_SETUP.md](docs/guides/DEVELOPMENT_SETUP.md) - 環境構築ガイド
- [docs/guides/TESTING_GUIDELINES.md](docs/guides/TESTING_GUIDELINES.md) - テスト方針
- [docs/guides/I18N_GUIDE.md](docs/guides/I18N_GUIDE.md) - 多言語対応ガイド

### 機能仕様書

- [docs/specs/BUMP_REMINDER_SPEC.md](docs/specs/BUMP_REMINDER_SPEC.md) - Bumpリマインダー機能
- [docs/specs/AFK_SPEC.md](docs/specs/AFK_SPEC.md) - AFK機能
- [docs/specs/VAC_SPEC.md](docs/specs/VAC_SPEC.md) - VC自動作成機能
- [docs/specs/STICKY_MESSAGE_SPEC.md](docs/specs/STICKY_MESSAGE_SPEC.md) - メッセージ固定機能
- [docs/specs/MEMBER_LOG_SPEC.md](docs/specs/MEMBER_LOG_SPEC.md) - メンバーログ
- [docs/specs/MESSAGE_DELETE_SPEC.md](docs/specs/MESSAGE_DELETE_SPEC.md) - メッセージ削除
- [docs/specs/MESSAGE_RESPONSE_SPEC.md](docs/specs/MESSAGE_RESPONSE_SPEC.md) - メッセージレスポンス

---

## ✅ 最近の完了項目 (2026年2月19日)

### メッセージシステム統一 (Phase 1完了)

- [x] `src/shared/utils/messageResponse.ts` 作成
  - Embed生成ヘルパー関数実装
  - 4種類のステータス（Success/Info/Warning/Error）
  - カラーコーディングと絵文字の自動付与
  - タイムスタンプ・フィールド対応
- [x] 既存コマンドのEmbed形式への移行
  - `/ping` - 成功Embed
  - `/afk` - 成功Embed
  - `/afk-config` - 成功/情報Embed
  - `/bump-reminder-config` - 全サブコマンドEmbed対応
- [x] ErrorHandlerのEmbed対応
  - `handleCommandError()` - エラーEmbed形式
  - `handleInteractionError()` - エラーEmbed形式
- [x] ローカライゼーション拡充
  - 日本語キー追加（60+項目）
  - 英語キー追加（60+項目）
- [x] ユニットテスト作成（14テストケース）
  - 全テスト134個パス
  - 型チェック完全通過

### Bumpリマインダー機能モジュール分離

- [x] `src/shared/features/bump-reminder/` 作成
  - `repository.ts` - BumpReminderRepository
  - `manager.ts` - BumpReminderManager
  - `handler.ts` - handleBumpDetected / sendBumpReminder / sendBumpPanel
  - `constants.ts` - BUMP_CONSTANTS
  - `index.ts` - 公開API
- [x] `interactionCreate.ts` をハンドラーレジストリ方式に刷新
  - `src/bot/handlers/buttons/` - ボタンハンドラー
  - `src/bot/handlers/modals/` - モーダルハンドラー
- [x] `messageCreate.ts` の重複コードを `features/bump-reminder/handler.ts` へ移動
- [x] `src/shared/database/types.ts` に型定義を集約
  - GuildConfigRepository から型定義を分離・re-export
- [x] `src/shared/database/index.ts` に `getGuildConfigRepository()` 追加

### i18n型安全化

- [x] `AllParseKeys` 型を導入し `t()` / `tDefault()` の引数を型安全化
- [x] `keySeparator: false` でフラットキー形式に統一
- [x] `system:` ネームスペースにログキーを集約（`events:` から移動）
  - ready._, interaction._, afk.\*\_log, bump-reminder.detected など
- [x] `GuildTFunction` 型導入（`helpers.ts`）

### ドキュメント整理

- [x] docs配下のディレクトリ構造整理
  - guides/ (開発者向けガイド: 4ファイル)
  - specs/ (機能仕様書: 7ファイル)
  - progress/ (進捗管理: 2ファイル)
- [x] docs/README.md作成（ドキュメント構成説明）
- [x] 全ドキュメントのリンク更新
  - README.md
  - TODO.md
  - IMPLEMENTATION_PROGRESS.md
  - TEST_PROGRESS.md

### 仕様書と実装の検証

- [x] AFK機能の仕様書と実装の整合性確認
  - コマンド実装: ✅ 完全一致
  - データ構造: ✅ 完全一致
  - エラーハンドリング: ✅ 完全一致
  - 多言語対応: ✅ 完全一致
- [x] Bumpリマインダー機能の仕様書と実装の整合性確認
  - Bump検知: ✅ 完全一致
  - タイマー管理: ✅ 完全一致
  - データベース設計: ✅ 完全一致
  - コマンド実装: ✅ 完全一致
  - 設定管理: ✅ 完全一致
- [x] VAC機能の仕様書と実装の整合性確認
  - コマンド実装（`/vac-config`, `/vac`）: ✅ 一致
  - イベント実装（`voiceStateUpdate`, `channelDelete`, `clientReady` cleanup）: ✅ 一致
  - 操作パネル（ボタン/モーダル/セレクト）: ✅ 一致
  - パネルUI（縦一列・Primary統一）: ✅ 反映済み
- [x] `ephemeral` 非推奨対応の横展開
  - `flags: MessageFlags.Ephemeral` へ統一
  - AFK/Bump/VAC/共通エラーハンドラ/interaction まで適用
  - docs/specs の表記も同期
- [x] 全テスト実行・検証
  - 152テスト全てパス（9スイート）
  - カバレッジ: コアモジュール 55-100%

---

## 🚀 次のアクション

### 直近の推奨作業順序

1. ~~**メッセージシステムの統一化**~~ ✅ 完了
   - ~~`src/shared/utils/messageResponse.ts` 作成~~
   - ~~Embed生成関数実装~~
   - ~~既存コマンドのレスポンス修正~~
   - ~~ErrorHandlerでのEmbed対応~~
   - ~~テスト作成~~

2. **VC自動作成機能のテスト拡充**

- `/vac-config` / `/vac` コマンドのユニットテスト作成
- `voiceStateUpdate` / `channelDelete` イベントテスト作成
- パネル（button/modal/select）ハンドラのテスト作成

3. **メッセージ固定機能の実装**
   - Prisma SchemaにStickyMessage追加
   - `/sticky-message` コマンド実装
   - messageCreateイベント再送信ロジック
   - テスト作成

---

**最終更新**: 2026年2月20日
**全体進捗**: 58% (68/118タスク完了) ＋ アーキテクチャ改善完了
**次のマイルストーン**: Phase 2継続（メッセージ固定機能 + VACテスト拡充）
