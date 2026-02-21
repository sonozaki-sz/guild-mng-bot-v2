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

### src整備スプリント（最優先 / コミット単位）

> 目的: 責務分離・依存境界・ディレクトリ構成を固定し、既存実装をテストしやすい構造へ収束させる。

#### 実施ポリシー

- [ ] **P-1: 1コミット1関心**（目安: 3〜8ファイル）
- [ ] **P-2: 各コミットで `pnpm run typecheck` を通す**
- [ ] **P-3: 互換レイヤー先行**（resolver追加 → 呼び出し側移行 → 旧fallback縮退）
- [ ] **P-4: 挙動変更を避ける**（原則リファクタのみ。仕様変更は別コミット）
- [ ] **P-5: テスト修正はsrc安定後に集中実施**

#### コミット単位タスク

- [x] **SR-001** bump-reminder の bot層依存リゾルバ追加
  - 完了条件: manager/config-service/repository 参照を bot service resolver で解決可能
  - コミット例: `refactor: bump-reminder 依存解決を bot リゾルバ経由に追加`

- [x] **SR-002** bump-reminder handlers を resolver 経由へ移行
  - 完了条件: startup/detected/panel 系で direct `getBumpReminder*` 呼び出しを解消
  - コミット例: `refactor: bump-reminder handlers の依存取得を統一`

- [x] **SR-003** bump-reminder commands を resolver 経由へ移行
  - 完了条件: config command 系の依存取得を bot service resolver へ統一
  - コミット例: `refactor: bump-reminder commands の依存境界を統一`

- [ ] **SR-004** bump-reminder service の fallback 経路を縮退
  - 完了条件: `requirePrismaClient` 依存の暗黙解決を段階的に排除（互換を維持しつつ縮小）
  - コミット例: `refactor: bump-reminder service の暗黙依存を縮退`

- [ ] **SR-005** 大型ファイル分割（usecase単位）
  - 対象: `bumpReminderHandler.ts`（detect / schedule / send / panel）
  - 完了条件: 入口関数は薄いオーケストレーションのみ
  - コミット例: `refactor: bump-reminder handler を用途別に分割`

- [ ] **SR-006** エクスポート境界の整理（過剰 re-export 抑制）
  - 対象: `bot/features/*/index.ts` の公開面
  - 完了条件: 呼び出し側が必要最小の公開APIのみ参照
  - コミット例: `refactor: feature index の公開境界を最小化`

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

1. **src整備スプリントの実施（SR-001〜SR-006）**
   - 依存解決を bot層 resolver へ統一
   - bump-reminder の暗黙依存を段階縮退
   - 大型ファイル分割と公開境界の最小化

2. **既存実装のテスト修正（src安定後）**
   - 既存ユニットテストの import/モックを新境界へ追随
   - VAC/Bump の回帰テストを優先
   - `typecheck` + `test` を通して基準化

3. **主要機能実装へ復帰（1.2 / 1.3 / 1.4）**
   - メッセージ固定
   - メンバーログ
   - メッセージ削除

4. **デプロイ準備の着手条件確認（bot層完了後）**
   - 1〜3の未完了タスクを解消
   - E2Eテスト（主要機能）を通過
   - カバレッジ目標を達成

---

**最終更新**: 2026年2月21日
**全体進捗**: 残54件（bot優先30件 / デプロイ12件 / Web凍結12件）
**次のマイルストーン**: src整備スプリント完了（SR-001〜SR-006）
