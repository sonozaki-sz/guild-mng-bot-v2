# テスト実装進捗

> テストの実装状況と今後の計画

最終更新: 2026年2月22日

**関連**: [TODO.md](../../TODO.md) - タスク管理 | [IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md) - 実装進捗

---

## 📊 現在のテスト状況

### 最新テスト実行結果（2026年2月22日）

- ✅ **全テスト PASSED**: 805/805
- ✅ **全スイート PASSED**: 185/185
- ⏱️ **実行時間**: ~5秒
- 📦 **カバレッジ（global）**: lines 44.54% / functions 37.87%（直近 coverage 実行値）
- 🎯 **対象実装カバレッジ**: `src/bot/client.ts` / `src/bot/main.ts` / `src/bot/commands/bump-reminder-config.ts` / `src/bot/commands/afk.ts` / `src/bot/commands/afk-config.ts` / `src/bot/commands/vac.ts` / `src/bot/commands/vac-config.ts` / `src/bot/commands/ping.ts` / `src/bot/events/clientReady.ts` / `src/bot/events/voiceStateUpdate.ts` / `src/bot/events/interactionCreate.ts` / `src/bot/events/messageCreate.ts` / `src/bot/events/channelDelete.ts` / `src/bot/handlers/interactionCreate/ui/buttons.ts` / `src/bot/handlers/interactionCreate/ui/modals.ts` / `src/bot/handlers/interactionCreate/ui/selectMenus.ts` / `src/bot/features/vac/handlers/ui/vacControlPanel.ts` / `src/bot/services/cooldownManager.ts` / `src/shared/locale/helpers.ts` / `src/shared/features/bump-reminder/bumpReminderConfigService.ts` は statements/branches/functions/lines すべて 100%
- ⚠️ **カバレッジしきい値**: lines/functions が 70% 未達（coverage コマンドは exit code 1）

### ⏸️ カバレッジ100% 作業ステータス（保留）

- **現在方針**: カバレッジ100%への追加改善は一旦保留
- **再開時の起点**: `bot events / web routes` の高インパクト領域から再開
- **直近の完了地点**: `src/shared/features/bump-reminder/bumpReminderConfigService.ts` focused 100% 達成済み

**再開チェックリスト（そのまま実行可）**

1. `pnpm test` でベースラインが green であることを確認
2. 対象ファイルを1つ選び、focused coverage を実行

- 例: `pnpm run test:coverage -- --runInBand <target test file> --collectCoverageFrom=<target source file>`

3. 未カバー行を最小テストで追補
4. 再度 focused coverage で改善確認
5. `pnpm test` で回帰確認
6. 本ドキュメントの「最新テスト実行結果」「直近の反映事項」を更新

### テスト統計

- **総テスト数**: 805 テスト（全て合格）
- **テストスイート**: 185 スイート
- **全体カバレッジ**: lines 44.54% / functions 37.87%
- **コアモジュールカバレッジ**: 55-100%
- **状態**: ✅ すべてのテストが正常に動作中

### src↔tests マッピング監査クローズ（2026年2月21日）

- `src` 対称マッピング監査の残件は **0件としてクローズ**
- `src/**/*.d.ts`（例: `src/shared/locale/i18next.d.ts`）は監査対象外に統一
- 根拠: 宣言ファイルは Jest 実行対象ではなく、`*.test.ts` との1:1対応を要求しない

### モジュール別カバレッジ

| モジュール             | カバレッジ | 状態 | テスト数 |
| ---------------------- | ---------- | ---- | -------- |
| メッセージレスポンス   | 100%       | ✅   | 17       |
| CustomErrors           | 100%       | ✅   | 19       |
| CooldownManager        | 100%       | ✅   | 22       |
| GuildConfigRepository  | 72%        | ✅   | 30       |
| Logger                 | 85%        | ✅   | 15       |
| Environment Config     | 67%        | ✅   | 11       |
| ErrorHandler           | 55%        | ✅   | 14       |
| BumpReminderRepository | 100%       | ✅   | 26       |
| BumpReminderService    | 100%       | ✅   | 21       |

**注**: 主要な共有モジュールは十分にテストされています。全体カバレッジが低いのは、コマンド、イベント、Web API等の未テストモジュールが多数あるためです。

---

## ✅ 実装済みテスト

### ユニットテスト

#### 1. CooldownManager (92% カバレッジ)

**ファイル**: `tests/unit/bot/services/cooldownManager.test.ts`
**テスト数**: 16

**カバー範囲**:

- クールダウンのチェックと設定
- ユーザー別・コマンド別の独立管理
- リセット、クリア機能
- 自動クリーンアップ機能
- メモリリーク防止

**主要テストケース**:

- 正常系: クールダウン設定と確認
- 正常系: 独立したユーザー/コマンド管理
- 正常系: 期限切れの自動クリーンアップ
- エッジケース: 境界値テスト
- エラーケース: 無効な入力処理

---

#### 2. CustomErrors (100% カバレッジ)

**ファイル**: `tests/unit/shared/errors/customErrors.test.ts`
**テスト数**: 19

**カバー範囲**:

- BaseError の基本機能
- 各カスタムエラークラス（ValidationError, DatabaseError, etc.）
- エラーの継承関係
- 運用エラーとプログラミングエラーの区別

**主要テストケース**:

- すべてのカスタムエラークラスのインスタンス化
- エラーメッセージとコードの正確性
- isOperationalフラグの動作
- スタックトレースの保持

---

#### 3. messageResponse (100% カバレッジ)

**ファイル**: `tests/unit/bot/utils/messageResponse.test.ts`
**テスト数**: 17

**カバー範囲**:

- createStatusEmbed の基本動作
- タイムスタンプオプション
- フィールドオプション
- タイトル文字数制限
- createSuccessEmbed / createInfoEmbed / createWarningEmbed / createErrorEmbed

**主要テストケース**:

- 各ステータスのカラーコード・絵文字の正確性
- カスタムタイトル・デフォルトタイトルの切り替え
- エッジケース（256文字超えタイトルの切り詰め）

---

#### 4. ErrorHandler (55% カバレッジ)

**ファイル**: `tests/unit/shared/errors/errorHandler.test.ts`
**テスト数**: 14

**カバー範囲**:

- エラーログ出力
- ユーザー向けメッセージ生成
- コマンドエラーハンドリング
- インタラクションエラーハンドリング

**主要テストケース**:

- 各エラータイプのハンドリング
- i18n統合
- インタラクション応答の生成

---

#### 4. Logger (85% カバレッジ)

**ファイル**: `tests/unit/shared/utils/logger.test.ts`
**テスト数**: 15

**カバー範囲**:

- 各ログレベルのメソッド（info, error, warn, debug）
- 複雑なメッセージのハンドリング
- エラースタックトレースの記録
- i18n統合

**主要テストケース**:

- 各ログレベルの出力
- オブジェクトと配列のロギング
- エラーオブジェクトのロギング
- パフォーマンステスト

---

#### 5. Environment Configuration (67% カバレッジ)

**ファイル**: `tests/unit/shared/config/env.test.ts`
**テスト数**: 11

**カバー範囲**:

- 必須フィールドのバリデーション
- デフォルト値の設定
- 型変換（WEB_PORT）
- Enum バリデーション

**主要テストケース**:

- 必須環境変数の検証
- デフォルト値の適用
- 型変換の正確性
- 無効な値の検出

---

### 統合テスト

#### 1. GuildConfigRepository (72% カバレッジ)

**ファイル**: `tests/integration/shared/database/repositories/guildConfigRepository.integration.test.ts`
**テスト数**: 30

**カバー範囲**:

- 設定の取得、保存、更新、削除
- 存在確認
- ロケール管理
- 機能別設定（AFK, BumpReminder）

**主要テストケース**:

- CRUD操作の完全性
- トランザクション処理
- エラーハンドリング
- データ整合性

#### 2. BumpReminderRepository (100% カバレッジ)

**ファイル**: `tests/integration/bot/features/bump-reminder/repositories/bumpReminderRepository.integration.test.ts`
**テスト数**: 26

**カバー範囲**:

- BumpReminderのCRUD操作
- findPendingByGuild / findAllPending
- cancelByGuild / cancelByGuildAndChannel / cleanupOld
- データ整合性・エラーハンドリング

---

#### 3. BumpReminderService (100% カバレッジ)

**ファイル**: `tests/integration/bot/features/bump-reminder/services/bumpReminderService.integration.test.ts`
**テスト数**: 10

**カバー範囲**:

- リマインダー設定・スケジューリング
- キャンセル処理
- Bot再起動時の復元
- データベース連携

---

### 仕様書と実装の検証（2026年2月19日）

#### AFK機能検証 ✅

**検証対象**: [AFK_SPEC.md](../specs/AFK_SPEC.md)

**検証項目**:

- ✅ コマンド構造: `/afk`, `/afk-config` (set-channel, show)
- ✅ データ構造: AfkConfig {enabled, channelId}
- ✅ 権限管理: ユーザー（全て）、設定（管理者のみ）
- ✅ エラーハンドリング: ValidationError パターン
- ✅ i18n統合: 完全対応

**結果**: 仕様と実装が100%一致

**実装ファイル**:

- [src/bot/commands/afk.ts](../../src/bot/commands/afk.ts)
- [src/bot/commands/afk-config.ts](../../src/bot/commands/afk-config.ts)
- [src/shared/database/repositories/guildConfigRepository.ts](../../src/shared/database/repositories/guildConfigRepository.ts)

---

#### Bump Reminder機能検証 ✅

**検証対象**: [BUMP_REMINDER_SPEC.md](../specs/BUMP_REMINDER_SPEC.md)

**検証項目**:

- ✅ Bot検知: Disboard (302050872383242240), Dissoku (761562078095867916)
- ✅ コマンド検知: `/bump`, `/up`
- ✅ サービス名: "Disboard", "Dissoku"
- ✅ タイマー管理: 120分（2時間）
- ✅ データベース設計: BumpReminder + GuildConfig.bumpReminderConfig
- ✅ ステータス管理: pending/sent/cancelled
- ✅ 動的設定取得: GuildConfigRepository連携

**結果**: 仕様と実装が100%一致

**実装ファイル**:

- [src/bot/commands/bump-reminder-config.ts](../../src/bot/commands/bump-reminder-config.ts)
- [src/bot/events/messageCreate.ts](../../src/bot/events/messageCreate.ts)
- [src/shared/features/bump-reminder/bumpReminderConfigService.ts](../../src/shared/features/bump-reminder/bumpReminderConfigService.ts)

---

### テスト実行結果（2026年2月22日）

```
Test Suites: 185 passed, 185 total
Tests:       805 passed, 805 total
Snapshots:   0 total
Time:        ~10s
```

※ 実行時間は環境依存で増減

**カバレッジ詳細**:

- CustomErrors: 100%
- messageResponse: 100%
- CooldownManager: 100%
- GuildConfigRepository: 72%
- BumpReminderRepository: 100%
- BumpReminderService: 100%
- Logger: 85%
- ErrorHandler: 55%
- その他コアモジュール: 55-100%（`src/shared/features/bump-reminder/bumpReminderConfigService.ts` は 100% 到達）

**状態**: ✅ すべてのテストが正常に動作中

---

### 直近の反映事項（2026年2月22日）

- ✅ `index.ts`（バレル）を `src/` 配下すべてで撤廃し、直接 import 方針を全面適用
  - 削除対象: `src/bot/features/*/index.ts`, `src/bot/commands/index.ts`, `src/bot/events/index.ts` など
  - 入口ファイルは役割名ファイル（`commands.ts`, `events.ts`, `handleInteractionCreate.ts` 等）へ統一
- ✅ 全テストファイルの `jest.mock()` / `import()` パスを実解決先（直接モジュールパス）へ追従更新
- ✅ bot/shared/web の全 unit テスト網羅を強化（取りこぼし解消）
- ✅ 全テストスイートで 805 tests / 185 suites PASS を確認
- 📋 次段階: E2E初期シナリオ（Bump基本フロー）の実装

---

## 🎯 今後のテスト拡張

### 次スプリント（2-4週間）🔥

カバレッジ改善と回帰防止の効果が高い領域を優先。

#### スプリントタスク表（運用用）

| ID     | 優先度 | タスク                             | Scope         | Owner | 期限       | 状態 |
| ------ | ------ | ---------------------------------- | ------------- | ----- | ---------- | ---- |
| TS-001 | P1     | `/ping` コマンドテスト             | command       | TBD   | 2026-02-27 | DONE |
| TS-002 | P1     | `/afk` + `/afk-config` テスト      | command       | TBD   | 2026-03-02 | DONE |
| TS-003 | P1     | `/vac-config` + `/vac` テスト      | command       | TBD   | 2026-03-05 | DONE |
| TS-004 | P1     | `/bump-reminder-config` テスト     | command       | TBD   | 2026-03-07 | DONE |
| TS-005 | P1     | `interactionCreate` イベントテスト | event         | TBD   | 2026-03-10 | DONE |
| TS-006 | P1     | `messageCreate`（Bump検知）テスト  | event         | TBD   | 2026-03-12 | DONE |
| TS-007 | P2     | VACイベント/ハンドラテスト         | event/handler | TBD   | 2026-03-16 | DONE |
| TS-008 | P2     | `JobScheduler` テスト              | scheduler     | TBD   | 2026-03-18 | DONE |

運用メモ:

- `Owner` は担当アサイン時に更新（個人名 or チーム名）
- `優先度` は `P1`（スプリント前半）/`P2`（スプリント後半）を使用
- `状態` は `TODO` / `IN_PROGRESS` / `REVIEW` / `DONE` を使用
- 期限遅延時は理由と新期限を追記

#### Commands（コマンドテスト）

- [x] **`/ping` コマンド**
  - 基本的な応答テスト
  - レイテンシ計算の正確性
  - エラーハンドリング

- [x] **`/afk` コマンド**
  - AFKチャンネルへの移動
  - 権限チェック
  - エラーケース（チャンネル未設定等）

- [x] **`/afk-config` コマンド**
  - チャンネル設定
  - 設定の永続化
  - 権限チェック

- [x] **`/vac-config` コマンド**
  - create-trigger-vc / remove-trigger-vc / show の分岐検証
  - カテゴリ選択（TOP/カテゴリ）と重複作成防止
  - 権限チェックとバリデーション

- [x] **`/vac` コマンド**
  - vc-rename / vc-limit の正常系
  - VAC管理外VC・未参加時の異常系
  - `MessageFlags.Ephemeral` 応答の確認

- [x] **`/bump-reminder-config` コマンド**
  - 各サブコマンドの動作
  - 設定の永続化
  - バリデーション

#### Events（イベントテスト）

- [x] **`clientReady` イベント**
  - Bot起動処理
  - スケジューラー初期化
  - エラーハンドリング

- [x] **`interactionCreate` イベント**
  - コマンド実行
  - クールダウン管理
  - エラーハンドリング

- [x] **`messageCreate` イベント（Bump検知）**
  - Disboard/ディス速の検知
  - リマインダースケジューリング
  - 重複防止

#### Scheduler（スケジューラーテスト）

- [x] **JobScheduler**
  - ジョブの登録と実行
  - スケジュール管理
  - エラーハンドリング
  - Bot再起動時の復元

#### Events / Handlers（VAC）

- [x] **`voiceStateUpdate` / `channelDelete` / `clientReady`**
  - 自動作成・自動削除・起動時クリーンアップの検証
  - 設定同期（削除済みチャンネルID除去）の検証
- [x] **VACパネルハンドラ（button/modal/select）**
  - VC参加チェック
  - AFK移動
  - モーダル入力バリデーション

---

### 後続フェーズ（1-2ヶ月）🟡

基盤テストの整備後に拡張する領域。

#### Locale（多言語対応テスト）

- [ ] **LocaleManager**
  - 言語切り替え
  - フォールバック処理
  - コマンドローカライゼーション自動生成

- [ ] **翻訳の完全性テスト**
  - すべてのキーが定義されているか
  - プレースホルダーの一貫性
  - 複数形対応

#### Web Routes（Web APIテスト）

- [ ] **ギルド管理API**
  - 認証とアクセス制御
  - CRUD操作
  - バリデーション
  - エラーレスポンス

※ `health` / `ready` ルートは実装済み（`tests/unit/web/routes/health.test.ts`）。

#### Repositories（リポジトリテスト）

- [ ] **将来のリポジトリ**
  - VAC関連
  - StickyMessage関連
  - その他機能拡張に伴うリポジトリ

---

### 長期フェーズ（機能安定後）🟢

運用最適化・品質保証を強化する領域。

#### E2E テスト

- [ ] **主要ユーザーフローの検証**
  - コマンド実行からDB保存までの完全フロー
  - イベント処理の完全フロー
  - エラーリカバリーフロー

- [ ] **実際のDiscord環境での動作確認**
  - テストサーバーでの自動テスト
  - 主要機能の動作検証

#### パフォーマンステスト

- [ ] **負荷テスト**
  - 大量コマンド実行
  - 大量データ処理
  - メモリリーク検証

- [ ] **ベンチマーク**
  - 応答時間の測定
  - スループットの測定
  - リソース使用量の測定

---

## 📈 カバレッジ目標

### 短期目標（1-2ヶ月）

- **全体カバレッジ**: 50%以上
- **コアモジュール**: 80%以上維持
- **新機能**: 実装と同時にテスト作成

### 中期目標（3-6ヶ月）

- **全体カバレッジ**: 70%以上
- **統合テスト**: 主要フローをカバー
- **E2Eテスト**: 基本的なユーザーフローを実装

### 長期目標

- **全体カバレッジ**: 80%以上
- **E2Eテスト**: 包括的なカバレッジ
- **パフォーマンステスト**: 継続的な監視

---

## 🏆 マイルストーン

### Phase 1: コアモジュールの完全カバー ✅

- [x] エラーハンドリング
- [x] データベース基盤
- [x] ロガー
- [x] 環境設定
- [x] クールダウン管理

### Phase 2: Bot機能のテスト ✅

- [x] コマンドのテスト（/ping, /afk, /afk-config, /vac, /vac-config, /bump-reminder-config）
- [x] イベントのテスト（clientReady, interactionCreate, messageCreate, voiceStateUpdate, channelDelete）
- [x] スケジューラーのテスト（JobScheduler, VACハンドラ, Bumpハンドラ）
- **目標**: 2026年3月末 → **完了**: 2026年2月22日

### Phase 3: Web UIと統合テスト

- [ ] Web APIのテスト
- [ ] 統合テストの拡充
- [ ] E2Eテストの基盤構築
- **目標**: 2026年5月末

### Phase 4: 完全なテストカバレッジ

- [ ] 全機能のテスト完了
- [ ] パフォーマンステスト実装
- [ ] CI/CDでの継続的なテスト実行
- **目標**: 2026年7月末

---

## 📝 メモ

### テスト実装時の注意点

1. **テストファーストを心がける**
   - 新機能は可能な限りTDDで開発
   - バグ修正時は再現テストを先に書く

2. **メンテナンス性を重視**
   - ヘルパー関数を積極的に活用
   - テストコードも品質を保つ

3. **実行速度に注意**
   - 遅いテストは並列化を検討
   - 統合テストは必要最小限に

4. **継続的な改善**
   - カバレッジレポートを定期的に確認
   - 低カバレッジのモジュールを優先的にテスト

---

## 🔗 関連ドキュメント

- [TESTING_GUIDELINES.md](TESTING_GUIDELINES.md) - テスト方針・ガイドライン
- [TODO.md](../TODO.md) - 開発タスク一覧

---

**最終更新**: 2026年2月22日
