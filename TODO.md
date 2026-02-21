# Guild Management Bot v2 - TODO

> プロジェクト全体のタスク管理と残件リスト

最終更新: 2026年2月21日

---

## 📊 全体進捗サマリー

### 残タスク統計

- 残タスク合計: **54件**
- bot優先対象（1〜3）: **30件**
- デプロイ・運用（4）: **12件**
- Web UI実装（5 / 凍結中）: **12件**

### 優先カテゴリ別進捗

| No. | 内容               | 残件 | 状態 |
| --- | ------------------ | ---- | ---- |
| 1   | 主要機能実装       | 15   | 🚧   |
| 2   | 基本コマンド追加   | 6    | 📋   |
| 3   | テスト・品質向上   | 9    | 🚧   |
| 4   | デプロイ・運用     | 12   | 📋   |
| 5   | Web UI実装（凍結） | 12   | ⏸️   |

**凡例**: 🚧 進行中 | 📋 未着手 | ⏸️ 凍結中

---

## 📋 残タスク一覧

> 運用方針（2026-02-21）: Web系（5系統）は一旦凍結し、bot層（1〜3）を優先。bot層が安定したら4（デプロイ・運用）へ進み、5（Web UI実装）を再開する。

### 1. 主要機能実装 - 残15件

#### 1.1 VC自動作成機能（VAC） - 残2件

- [ ] テスト実装（コマンド/イベント/パネル操作）
- [ ] VAC挙動のE2E検証（複数カテゴリ・再起動クリーンアップ）

**仕様書**: [docs/specs/VAC_SPEC.md](docs/specs/VAC_SPEC.md)

#### 1.2 メッセージ固定機能 - 残4件

- [ ] `/sticky-message` コマンド実装（set、remove、list）
- [ ] messageCreateイベントでの自動再送信ロジック
- [ ] Prisma Schema更新（StickyMessage）
- [ ] テスト実装

**仕様書**: [docs/specs/STICKY_MESSAGE_SPEC.md](docs/specs/STICKY_MESSAGE_SPEC.md)

#### 1.3 メンバーログ機能 - 残5件

- [ ] guildMemberAdd、guildMemberRemoveイベントハンドラ作成
- [ ] Embed形式の通知メッセージ実装
- [ ] `/member-log-config` コマンド実装（set-channel、enable、disable、show）
- [ ] Prisma Schema更新（MemberLogConfig）
- [ ] テスト実装

**仕様書**: [docs/specs/MEMBER_LOG_SPEC.md](docs/specs/MEMBER_LOG_SPEC.md)

#### 1.4 メッセージ削除機能 - 残4件

- [ ] `/message-delete` コマンド実装（user、count、channelオプション）
- [ ] 権限チェック（MANAGE_MESSAGES）
- [ ] 削除実行ログと通知
- [ ] テスト実装

**仕様書**: [docs/specs/MESSAGE_DELETE_SPEC.md](docs/specs/MESSAGE_DELETE_SPEC.md)

### 2. 基本コマンド追加 - 残6件

- [ ] `/help` - ヘルプコマンド（全コマンド一覧）
- [ ] `/server-info` - サーバー情報表示
- [ ] `/user-info` - ユーザー情報表示
- [ ] `/config-locale` - ギルド言語設定
- [ ] `/config-view` - 現在の設定表示
- [ ] `/config-reset` - 設定リセット

---

### 3. テスト・品質向上 - 残9件

**状況**: ユニットテスト＋インテグレーションテストで455テスト実装済み（39 suites, 全件PASS）。

#### 3.1 テストカバレッジ向上 - 残4件

- [ ] E2Eテスト追加（Discordモック利用）
- [ ] カバレッジ目標70%達成
- [ ] エッジケーステスト
- [ ] 新機能のテスト（VAC、メッセージ固定等）

#### 3.2 ドキュメント整備 - 残2件

- [ ] API仕様書（OpenAPI/Swagger）
- [ ] デプロイガイド

#### 3.3 パフォーマンス最適化 - 残3件

- [ ] データベースクエリ最適化
- [ ] メモリ使用量プロファイリング
- [ ] ログローテーション設定

---

### 4. デプロイ・運用 - 残12件

#### 4.1 Docker化 - 残5件

- [ ] 本番用Dockerfile最適化
- [ ] docker-compose.yml改善
- [ ] マルチステージビルド
- [ ] ヘルスチェック設定
- [ ] Prismaマイグレーション自動実行

#### 4.2 CI/CD - 残3件

- [ ] GitHub Actions ワークフロー（リント・テスト）
- [ ] Dockerイメージビルド・プッシュ
- [ ] 自動デプロイ設定

#### 4.3 監視・ログ - 残3件

- [ ] エラー通知（Discord Webhook）
- [ ] メトリクス収集
- [ ] アラート設定

#### 4.4 バックアップ - 残1件

- [ ] データベース自動バックアップ・復旧手順

---

### 5. Web UI実装（凍結中） - 残12件

**状況**: Fastifyサーバー基盤、ヘルスチェックAPI、/api/index.tsは実装済み。
**運用**: 新規実装は凍結。緊急バグ修正のみ対応。

#### 5.1 認証システム - 残4件

- [ ] Discord OAuth2統合
- [ ] JWT認証実装
- [ ] セッション管理
- [ ] 権限チェックミドルウェア

#### 5.2 管理API - 残5件

- [ ] `/api/guilds` - ギルド一覧取得
- [ ] `/api/guilds/:id` - ギルド詳細取得
- [ ] `/api/guilds/:id/config` - 設定取得・更新
- [ ] `/api/guilds/:id/stats` - 統計情報取得
- [ ] バリデーション・エラーハンドリング

#### 5.3 フロントエンド - 残3件

- [ ] ダッシュボードUI
- [ ] ギルド設定画面
- [ ] 統計表示画面

---

## 🎯 優先度別タスク

1. **主要機能実装** - 15件
2. **基本コマンド追加** - 6件
3. **テスト・品質向上** - 9件
4. **デプロイ・運用** - 12件
5. **Web UI実装（凍結中）** - 12件

---

## 🔧 技術的改善タスク

### src整備スプリント（再定義 / コミット単位）

> 目的: `src/` の責務分離・依存境界・公開面・命名を再固定し、薄い入口 + ユースケース分離 + 明示DIを徹底する。

#### 実施ポリシー（厳守）

- [ ] **SP-1: 1コミット1関心**（目安: 3〜8ファイル）
- [ ] **SP-2: 各コミットで `pnpm run typecheck` を通す**
- [ ] **SP-3: src整備中はテスト実行しない**（`test` / `test:watch` / `test:coverage` は禁止）
- [ ] **SP-4: 挙動変更を避ける**（原則リファクタのみ。仕様追加・仕様変更は別コミット）
- [ ] **SP-5: 互換レイヤー先行で段階移行**（resolver/adapter追加 → 呼び出し側移行 → 旧経路縮退）
- [ ] **SP-6: 公開面は最小化**（`index.ts` は外部公開シンボルのみ）

#### 分析サマリー（現状）

- [ ] **AS-1** 大型ファイルが残存（`300行級`: `guildConfigRepository.ts`, `bumpReminderService.ts`, `bumpReminderConfigService.ts`, `bumpReminderRepository.ts`, `vacConfigCommand.execute.ts`）
- [ ] **AS-2** `commands` 層の一部にユースケース実装が同居（例: `vacConfigCommand.execute.ts`）
- [x] **AS-3** 命名の一貫性に揺れ（`stick` と `sticky` の語彙混在）
- [ ] **AS-4** `shared/database/index.ts` にグローバルアクセサ依存（`requirePrismaClient`）が残存
- [x] **AS-5** `index.ts` の公開境界ルールが feature 間で不均一

#### コミット単位タスク（src整備本体）

- [x] **SRC-001** ディレクトリ・命名規約の基準を固定（`stick` / `sticky` など語彙統一方針を確定）
  - 完了条件: `src` 用の命名ルールを TODO 上で明文化し、対象ファイル一覧を確定
  - 命名ルール（確定）:
    - 新規命名・公開APIは **sticky** 系語彙へ統一（feature名、型名、service/store名、関数名）
    - 既存DBカラム `stickMessages` は **互換維持のため当面据え置き**（移行タスクで adapter/serializer 側吸収）
    - 一括置換は不可。`SRC-004` と `SRC-006` で互換レイヤーを先に作り、段階移行する
  - 改名対象ファイル一覧（第1弾）:
    - `src/shared/database/stores/guildStickMessageStore.ts`
    - `src/shared/database/types.ts`（`StickMessage` / `IStickMessageRepository`）
    - `src/shared/database/repositories/guildConfigRepository.ts`（`stickMessageStore` 参照群）
    - `src/shared/database/repositories/persistence/guildConfigReadPersistence.ts`（`findStickMessagesJson`）
    - `src/shared/database/repositories/serializers/guildConfigSerializer.ts`（型名・変換ヘルパー）
  - 改名対象シンボル一覧（第1弾）:
    - `GuildStickMessageStore` → `GuildStickyMessageStore`
    - `StickMessage` → `StickyMessage`
    - `IStickMessageRepository` → `IStickyMessageRepository`
    - `getStickMessages` / `updateStickMessages` → `getStickyMessages` / `updateStickyMessages`
    - `findStickMessagesJson` → `findStickyMessagesJson`
  - コミット例: `docs: src命名規約と改名対象を確定`

- [x] **SRC-002** `vacConfigCommand.execute.ts` をルーター + サブコマンド usecase へ分割
  - 完了条件: execute は分岐委譲のみ、create/remove/show は別モジュールへ移動
  - コミット例: `refactor: vac-config execute を usecase 分割`

- [x] **SRC-003** `bumpReminderService.ts` を orchestrator + usecase/helper へ分割
  - 完了条件: manager本体は schedule/cancel/restore の調停のみを担当
  - コミット例: `refactor: bump reminder manager を責務分離`

- [x] **SRC-004** `guildConfigRepository.ts` を facade 化し、機能別委譲を徹底
  - 完了条件: repository本体からJSON変換・機能別更新責務を分離し、委譲中心へ
  - コミット例: `refactor: guild config repository を facade 化`

- [x] **SRC-005** `bumpReminderRepository.ts` を query/usecase 単位に再分割
  - 完了条件: pending取得/状態更新/クリーンアップ/ログ整形を独立モジュール化
  - コミット例: `refactor: bump reminder repository を query 単位で分離`

- [x] **SRC-006** `shared/database/index.ts` の暗黙DIを縮退し明示注入へ寄せる
  - 完了条件: 新規呼び出しで `requirePrismaClient` 非依存、段階移行の互換経路を用意
  - コミット例: `refactor: shared database を明示DI優先へ移行`

- [x] **SRC-007** feature公開境界を統一（`index.ts` の export を明示限定）
  - 完了条件: `export *` を段階削除し、外部利用シンボルのみ公開
  - コミット例: `refactor: feature公開APIを明示exportへ統一`

- [ ] **SRC-008** command/event/handler の入口責務を再点検し、過剰処理を feature へ移譲
  - 完了条件: 入口層は「入力解釈・委譲・共通エラー処理」に限定
  - コミット例: `refactor: 入口層の責務を委譲中心に整理`

- [ ] **SRC-009** import方向を固定（`bot|web -> shared` のみ）し逆流を検査
  - 完了条件: 逆依存パターンを検出・解消、例外が必要なら理由を明文化
  - コミット例: `refactor: import依存方向を固定`

- [ ] **SRC-010** 未使用コード・到達不能分岐・重複ヘルパーを削減してスリム化
  - 完了条件: dead code を削除し、既存挙動を維持したままファイル/関数を縮約
  - コミット例: `refactor: src の未使用コードを削除`

#### src整備完了後タスク（ここからテスト修正へ移行）

- [ ] **POST-001** テスト修正フェーズへ移行（このフェーズで初めて `pnpm test` を再開）
  - 完了条件: import/モック破綻を新境界へ追随、主要回帰（VAC/Bump）を優先修正
  - コミット例: `test: src整備後の境界に合わせてテストを修正`

- [ ] **POST-002** コメント規約を `src/` 全体へ反映
  - 完了条件: ファイル先頭コメント・関数 `@param/@returns`・意図コメントを実装ガイド準拠で適用
  - コミット例: `docs(code): src へコメント規約を適用`

- [ ] **POST-003** 実装実態をアーキテクチャガイドへ反映
  - 完了条件: `docs/guides/ARCHITECTURE.md` の構成図・依存方向・責務説明を更新
  - コミット例: `docs: architecture guide を現行実装に同期`

- [ ] **POST-004** 実装実態を実装ガイドラインへ反映
  - 完了条件: `docs/guides/IMPLEMENTATION_GUIDELINES.md` の分割方針・命名規約・運用手順を更新
  - コミット例: `docs: implementation guidelines を現行実装に同期`

### コード品質

- [ ] ESLintルール厳格化
- [ ] コードコメント充実
- [ ] 未使用コード・デッドコード削除
- [ ] 一貫性のあるエラーメッセージ

### アーキテクチャ

- [ ] リポジトリパターン完全実装
- [ ] 依存性注入の導入検討（現状はモジュールレベルのDI + ガード関数）
- [ ] サービス層の整理

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

## 🚀 次のアクション

### 直近の推奨作業順序

1. **src整備スプリント（SRC-001〜SRC-010）を順次実施**

- `src` 整備中は `typecheck` のみ実施（テスト実行は不可）
- 大型ファイル分割・明示DI化・公開境界最小化・命名統一を優先

2. **src整備完了後にテスト修正フェーズ（POST-001）へ移行**

- 既存ユニットテストの import/モックを新境界へ追随
- VAC/Bump の回帰テストを優先
- `typecheck` + `test` を通して基準化

3. **コメント規約反映（POST-002）→ ガイド更新（POST-003/004）**

- `src/` にコメント規約を適用
- アーキテクチャガイド / 実装ガイドラインを現行実装に同期

4. **主要機能実装へ復帰（1.2 / 1.3 / 1.4）**
   - メッセージ固定
   - メンバーログ
   - メッセージ削除

5. **デプロイ準備の着手条件確認（bot層完了後）**
   - 1〜3の未完了タスクを解消
   - E2Eテスト（主要機能）を通過
   - カバレッジ目標を達成

---

**最終更新**: 2026年2月21日
**全体進捗**: 残54件（bot優先30件 / デプロイ12件 / Web凍結12件）
**次のマイルストーン**: src整備スプリント実行（SRC-001〜SRC-010）
