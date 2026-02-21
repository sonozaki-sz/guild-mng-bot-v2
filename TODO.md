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

**状況**: ユニットテスト＋インテグレーションテストで496テスト実装済み（56 suites, 全件PASS）。

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

### src再監査スプリント（0ベース再確認 / コミット単位）✅ クローズ

> 目的: src整備結果を 0 ベースで再監査し、問題がないことを担保した上でコメント規約・ガイド同期・テスト修正へ進む。

**クローズ方針（2026-02-21）**:

- src整備（監査・コメント反映・ガイド同期・TODO同期）は完了としてクローズ
- テスト修正は **別セッションへ移管** し、このスプリントからは切り離す

**完了担保（記録）**:

- src再監査結果を `docs/guides/ARCHITECTURE.md` / `docs/guides/IMPLEMENTATION_GUIDELINES.md` / `TODO.md` に同期済み
- src整備フェーズで扱う修正範囲は完了として凍結し、以後のテスト修正は別セッションで管理
- 2026-02-21 時点で `pnpm run typecheck` を再実行し、`tsc --noEmit` 成功（`TYPECHECK_OK`）を確認
- 2026-02-21 時点で `pnpm test --runInBand` を再実行し、`39 suites / 431 tests` 全件PASSを確認

### テスト再編スプリント（src対称化 / コミット単位）✅ 完了

**合意方針（2026-02-21）**:

- テスト配置は `tests/unit` / `tests/integration` を維持しつつ、各配下で `src` と同じパス構造へ寄せる
- ファイル名は **camelCase固定にしない**。`src` 側のベース名に一致（`kebab-case` を含む）
- 今回フェーズは `unit` / `integration`。`e2e` は次フェーズで実施

**コミット単位タスク**:

- [x] **TST-REORG-001**: `tests/unit` の `src` 対称化（移動・改名のみ）
  - 完了条件: 旧パスから新パスへ移動し、命名を `src` ベース名へ統一
- [x] **TST-REORG-002**: import / mock 参照の追随修正
  - 完了条件: `tests/unit` で `src` 参照を `@/` へ統一し、`tests/tsconfig.json` に `paths` を追加
- [x] **TST-REORG-003**: 回帰確認（テスト実行）
  - 完了条件: `pnpm test` が全件PASS（`431 passed / 0 failed`）
- [x] **TST-REORG-004**: `tests/integration` の `src` 対称化マッピング作成
  - 完了条件: 既存 `integration` ファイルの移動先を `src` 対称で確定
- [x] **TST-REORG-005**: `tests/integration` 移動・改名 + 参照追随
  - 完了条件: `integration` を移行し、`pnpm test` 全件PASS（`39 suites / 431 tests`）
- [x] **TST-REORG-006**: テストガイド更新（再編後の正式構成反映）
  - 完了条件: `docs/guides/TESTING_GUIDELINES.md` の構成図と命名ルールを更新

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

1. **残課題の順次解消**

- コード品質（未使用コード削減・エラーメッセージ統一）
- アーキテクチャ（サービス層整理・DI運用の明文化）
- セキュリティ（依存脆弱性・入力検証・レート制限）

2. **E2Eフェーズ実装の着手**

- `docs/guides/TESTING_GUIDELINES.md` の計画に沿って `tests/e2e` の初期シナリオを追加
- Bumpリマインダー基本フローを最初の対象として実装・回帰確認

---

**最終更新**: 2026年2月21日
**全体進捗**: src再監査完了、テスト再編（unit/integrationフェーズ）完了
**次のマイルストーン**: E2E初期シナリオ（Bump）追加
