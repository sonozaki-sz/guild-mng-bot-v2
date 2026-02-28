# ayasono - TODO

> プロジェクト全体のタスク管理と残件リスト

最終更新: 2026年2月28日

---

## 📊 全体進捗サマリー

### 残タスク統計

- 残タスク合計: **54件**
- bot優先対象（1～3）: **31件**
- デプロイ・運用（4）: **11件**
- Web UI実装（5 / 凍結中）: **12件**

### 優先カテゴリ別進捗

| No. | 内容               | 残件 | 状態 |
| --- | ------------------ | ---- | ---- |
| 1   | 主要機能実装       | 19   | 🚧   |
| 2   | 基本コマンド追加   | 6    | 📋   |
| 3   | テスト・品質向上   | 6    | 🚧   |
| 4   | デプロイ・運用     | 11   | 🚧   |
| 5   | Web UI実装（凍結） | 12   | ⏸️   |

**凡例**: 🚧 進行中 | 📋 未着手 | ⏸️ 凍結中

---

## 📋 残タスク一覧

> 運用方針（2026-02-21）: Web系（5系統）は一旦凍結し、bot層（1〜3）を優先。bot層が安定したら4（デプロイ・運用）へ進み、5（Web UI実装）を再開する。

### 1. 主要機能実装 - 残19件

#### 1.1 VC自動作成機能（VAC） - 残1件

- [x] テスト実装（コマンド/イベント/パネル操作）
- [ ] VAC挙動のE2E検証（複数カテゴリ・再起動クリーンアップ）

**仕様書**: [docs/specs/VAC_SPEC.md](docs/specs/VAC_SPEC.md)

#### 1.2 メッセージ固定機能 - ✅ 完了

- [x] `/sticky-message` コマンド実装（set、remove、update、view）
- [x] messageCreateイベントでの自動再送信ロジック（`StickyMessageResendService`）
- [x] Prisma Schema更新（StickyMessage テーブル、`updatedBy` フィールド含む）
- [x] `updatedBy` フィールド: 設定・更新時の操作ユーザー ID を保存し view で `<@userId>` 表示
- [x] DB アクセスを shared/features ・ configService 経由に統一（commit `1c197d4`）
- [x] テスト実装

**仕様書**: [docs/specs/STICKY_MESSAGE_SPEC.md](docs/specs/STICKY_MESSAGE_SPEC.md)

#### 1.3 メンバーログ機能 - 残5件

- [ ] guildMemberAdd、guildMemberRemoveイベントハンドラ作成
- [ ] Embed形式の通知メッセージ実装
- [ ] `/member-log-config` コマンド実装（set-channel、enable、disable、show）
- [ ] Prisma Schema更新（MemberLogConfig）
- [ ] テスト実装

**仕様書**: [docs/specs/MEMBER_LOG_SPEC.md](docs/specs/MEMBER_LOG_SPEC.md)

#### 1.4 メッセージ削除機能 - 残7件

- [ ] `/message-delete` コマンド実装（user / keyword / count / days / after / before / channel オプション）
- [ ] サーバー全チャンネル横断削除（channel 未指定時）
- [ ] 実行確認ダイアログ（`/message-delete-config confirm` でスキップ設定）
- [ ] ユーザー設定の永続化（`skipConfirm` を DB に保存）
- [ ] 削除結果詳細表示（ページネイション＋フィルター）
- [ ] 権限チェック（MANAGE_MESSAGES / VIEW_CHANNEL）・削除実行ログ
- [ ] テスト実装

**仕様書**: [docs/specs/MESSAGE_DELETE_SPEC.md](docs/specs/MESSAGE_DELETE_SPEC.md)

#### 1.5 VC募集機能 - 残6件

- [ ] `/vc-recruit-config` コマンド実装（setup / teardown / add-role / remove-role / view）
- [ ] パネルチャンネル・投稿チャンネルの自動作成・権限設定
- [ ] ボタン→モーダル→セレクトメニューの2ステップ募集フロー
- [ ] 新規VC作成・設定パネル送信・全員退出時の自動削除
- [ ] Prisma Schema 更新（`GuildConfig.vcRecruitConfig`）
- [ ] テスト実装

**仕様書**: [docs/specs/VC_RECRUIT_SPEC.md](docs/specs/VC_RECRUIT_SPEC.md)

### 2. 基本コマンド追加 - 残6件

- [ ] `/help` - ヘルプコマンド（全コマンド一覧）
- [ ] `/server-info` - サーバー情報表示
- [ ] `/user-info` - ユーザー情報表示
- [ ] `/config-locale` - ギルド言語設定
- [ ] `/config-view` - 現在の設定表示
- [ ] `/config-reset` - 設定リセット

---

### 3. テスト・品質向上 - 残6件

**状況**: ユニットテスト＋インテグレーションテストで987テスト実装済み（206 suites, 全件PASS）。単体テストは statements/functions/lines 100%、branches 99.19%（v8 async内部ブランチのみ未到達）を達成。

#### 3.1 テストカバレッジ向上 - 残1件

- [x] カバレッジ目標100%達成（statements/functions/lines: 100%, branches: 99.19%）
- [x] sticky-message 全機能のユニットテスト追加（17ファイル新規作成）
- [x] エッジケーステスト（null合体演算子・エラーハンドラ・タイムアウトcallback等）
- [ ] E2Eテスト追加（Discordモック利用）

#### 3.2 ドキュメント整備 - 残1件

- [ ] API仕様書（OpenAPI/Swagger）
- [x] デプロイガイド（[XSERVER_VPS_SETUP.md](docs/guides/XSERVER_VPS_SETUP.md)追加済み）

#### 3.3 ソースコメント整備 - ✅ 完了

- [x] `src/` 全ファイル: コメント規約通りのコメントが記載されているか確認・補完（JSDoc / インラインコメントの欠落がないか）
- [x] `tests/` 全ファイル: テスト観点（何を・なぜ・どの条件で検証するか）がコメントに記載されているか確認・補完

#### 3.4 パフォーマンス最適化 - 残4件

- [ ] データベースクエリ最適化
- [ ] メモリ使用量プロファイリング
- [ ] ログローテーション設定
- [ ] 機能ログのメッセージフォーマット統一（`機能名: xxx機能 メッセージ GuildId: xxx 変数名: 値...` 形式に統一）

---

---

### 4. デプロイ・運用 - 残11件

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

#### 4.3 監視・ログ - 残2件

- [x] **Botエラー時の Discord 通知**: Winston にカスタムトランスポートを追加し、`logger.error()` 呼び出し時に Discord Webhook へ自動通知（`processErrorHandler.ts` が既存のため、プロセスエラーも含め追加実装不要）
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

1. **主要機能実装** - 19件
2. **基本コマンド追加** - 6件
3. **テスト・品質向上** - 6件
4. **デプロイ・運用** - 11件
5. **Web UI実装（凍結中）** - 12件

---

## 🔧 技術的改善タスク


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
- [docs/guides/DISCORD_BOT_SETUP.md](docs/guides/DISCORD_BOT_SETUP.md) - Discord Bot セットアップガイド
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

## �🚀 次のアクション

### 直近の推奨作業順序

1. ~~**ソースコメント整備**（セクション 3.3）~~ ✅ **完了**

2. ~~**Botエラー時の Discord 通知実装**（セクション 4.3）~~ ✅ **完了**

3. **主要機能実装**（セクション 1）
   - メンバーログ機能（`guildMemberAdd` / `guildMemberRemove` + `/member-log-config`）
   - メッセージ削除機能（`/message-delete`）
   - VAC E2E検証

4. **E2Eフェーズ実装の着手**
   - `docs/guides/TESTING_GUIDELINES.md` の計画に沿って `tests/e2e` の初期シナリオを追加
   - Bumpリマインダー基本フローを最初の対象として実装・回帰確認

5. **残課題の順次解消**
   - コード品質（未使用コード削減・エラーメッセージ統一）
   - アーキテクチャ（サービス層整理・DI運用の明文化）
   - セキュリティ（依存脆弱性・入力検証・レート制限）

---

**最終更新**: 2026年2月28日
**次のマイルストーン**: 主要機能実装（メンバーログ・メッセージ削除）→ E2E テスト着手
