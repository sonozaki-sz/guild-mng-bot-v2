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

### src再監査スプリント（0ベース再確認 / コミット単位）

> 目的: src整備結果を 0 ベースで再監査し、問題がないことを担保した上でコメント規約・ガイド同期・テスト修正へ進む。

#### 実施ポリシー（厳守）

- [x] **NP-1: 1コミット1関心**（監査/修正/文書同期を混在させない）
- [x] **NP-2: 監査・修正コミットごとに `pnpm run typecheck` を通す**
- [x] **NP-3: ガイド/TODO同期完了まで `pnpm test` は実行しない**
- [x] **NP-4: 監査結果は根拠付きで記録**（対象ファイル・検索結果・観測値）

#### コミット単位タスク（新規）

- [x] **AUD-001** TODO再編（旧src整備タスクを廃止し、再監査タスクへ置換）
  - 完了条件: 旧 `SRC-*` / `POST-*` 群を撤去し、本スプリントへ差し替え
  - コミット例: `docs(todo): src再監査スプリントへ更新`

- [x] **AUD-002** 責務分離の再監査（commands/events/handlers の入口責務）
  - 完了条件: 入口層が「入力解釈・委譲・共通エラー処理」中心であることを確認し、逸脱を修正
  - コミット例: `refactor(audit): 入口責務の逸脱を是正`

- [x] **AUD-003** アーキテクチャ/設計パターン/ディレクトリ構成の再監査
  - 完了条件: 依存方向・feature構成・公開境界の重大逸脱なし、必要なら修正
  - コミット例: `refactor(audit): 構成逸脱を修正`

- [x] **AUD-004** ディレクトリ名・ファイル名の妥当性監査
  - 完了条件: 命名揺れ・用途不一致を洗い出し、許容/修正方針を明確化
  - コミット例: `docs(audit): 命名妥当性の監査結果を記録`

- [x] **AUD-005** コードスリム化再点検（未使用/重複/到達不能）
  - 完了条件: 安全に削減可能な重複・未使用コードを削除
  - コミット例: `refactor(audit): 重複と未使用コードを削減`

- [x] **AUD-006** テスト容易性の再監査（DI境界・モック容易性・テスト入口）
  - 完了条件: テスト困難要因を抽出し、最小の改善または課題化を実施
  - コミット例: `refactor(testability): テスト容易性を改善`

- [x] **CMT-001** コメント規約の全量チェック（src全体）
  - 完了条件: ファイル先頭コメント・関数 `@param/@returns`・意図コメントの不足を機械検出
  - コミット例: `chore(comment): コメント不足を全量検出`

- [x] **CMT-002** コメント規約の不足反映（src全体）
  - 完了条件: CMT-001 で検出した不足を `src/` 全体へ反映
  - コミット例: `docs(code): コメント規約をsrc全体へ適用`

- [x] **DOC-001** アーキテクチャガイド同期
  - 完了条件: `docs/guides/ARCHITECTURE.md` を再監査結果に同期
  - コミット例: `docs: architecture guide を再監査結果に同期`

- [x] **DOC-002** 実装ガイドライン同期
  - 完了条件: `docs/guides/IMPLEMENTATION_GUIDELINES.md` を再監査結果に同期
  - コミット例: `docs: implementation guidelines を再監査結果に同期`

- [x] **DOC-003** TODO同期（監査結果・次フェーズ反映）
  - 完了条件: 監査結果/残課題を TODO に反映し、テスト修正の開始条件を明記
  - コミット例: `docs(todo): 再監査結果を反映`

- [ ] **TST-001** テスト修正フェーズ開始（ここで `pnpm test` 再開）
  - 完了条件: 主要失敗テストの修正方針を確定し、最初の回帰修正を実施
  - コミット例: `test: 再監査後の境界に合わせてテスト修正を開始`

### コード品質

- [ ] ESLintルール厳格化
- [x] コードコメント充実
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

1. **TST-001: テスト修正フェーズ開始**

- 失敗テストを import/モック追随から優先修正
- 主要回帰（VAC/Bump）を先に復旧

2. **残課題の順次解消**

- コード品質（未使用コード削減・エラーメッセージ統一）
- アーキテクチャ（サービス層整理・DI運用の明文化）
- セキュリティ（依存脆弱性・入力検証・レート制限）

---

**最終更新**: 2026年2月21日
**全体進捗**: src再監査フェーズ完了、次はテスト修正フェーズ
**次のマイルストーン**: TST-001 テスト修正開始
