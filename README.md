# Guild Management Bot v2

> Discord ギルド管理用Bot - 新規プロジェクト

## 📋 概要

guild-mng-bot-v2は、Discordサーバー（ギルド）の管理を支援する多機能Botです。
旧プロジェクト（guild-mng-bot）から完全に独立した新規開発として、モダンな技術スタックとクリーンなアーキテクチャで構築されています。

### 基本方針

- ✅ **新規開発**: 旧コードの流用は行わない
- ✅ **モダンな技術**: 最新のベストプラクティスを採用
- ✅ **段階的実装**: MVP → 段階的機能追加
- ✅ **品質重視**: テスト・型安全性・保守性を優先

## ✨ 主要機能

### ⏰ Bumpリマインダー機能

Disboard/ディス速のBumpコマンド実行を検知し、2時間後にリマインドメッセージを送信します。

- Bump検知と自動タイマー設定
- メンション付き通知（ロール/ユーザー指定可能）
- 通知登録のインタラクティブUI
- `/bump-reminder-config` コマンドで設定管理

[📖 詳細仕様](docs/specs/BUMP_REMINDER_SPEC.md)

### 🎤 AFK機能

VCの非アクティブユーザーをAFKチャンネルに移動する機能です。

- `/afk [user]` コマンドでユーザーを移動
- `/afk-config` コマンドで機能設定
- 管理者による柔軟な設定管理

[📖 詳細仕様](docs/specs/AFK_SPEC.md)

### 🎤 VC自動作成機能（VAC）

トリガーVC参加時、専用ボイスチャンネルを自動作成・削除する機能です。

- トリガーチャンネル参加で専用VCを自動作成
- 全員退出時に自動削除
- コントロールパネルでVC設定変更
- `/vac-config`／`/vac` コマンドで設定・操作

[📖 詳細仕様](docs/specs/VAC_SPEC.md)

### 📌 メッセージ固定機能

重要メッセージをチャンネル最下部に自動的に再送信して固定表示する機能です。

- 指定メッセージを常にチャンネル最下部に表示
- 新規メッセージ投稿時に自動再送信
- `/sticky-message` コマンドで管理

> 📋 **機能は仕様書作成済みで、現在実装中です**

[📖 詳細仕様](docs/specs/STICKY_MESSAGE_SPEC.md)

### 👥 メンバーログ機能

メンバーの参加・脱退を指定チャンネルに記録する機能です。

- 参加・脱退時に詳細情報をEmbed形式で通知
- カスタムメッセージ設定
- `/member-log-config` コマンドで設定

> 📋 **機能は仕様書作成済みで、現在実装中です**

[📖 詳細仕様](docs/specs/MEMBER_LOG_SPEC.md)

### 🗑️ メッセージ削除機能

モデレーター向けのメッセージ一括削除機能です。

- `/message-delete` コマンドで一括削除
- ユーザー指定、件数指定、チャンネル指定
- 14日以上前のメッセージにも対応

> 📋 **機能は仕様書作成済みで、現在実装中です**

[📖 詳細仕様](docs/specs/MESSAGE_DELETE_SPEC.md)

### 🌐 多言語対応

サーバーごとに日本語/英語の言語設定が可能です。

- i18nextによる多言語システム
- コマンド、メッセージ、エラー全てを翻訳
- サーバー単位でのロケール設定

[📖 多言語対応ガイド](docs/guides/I18N_GUIDE.md)

### 🖥️ Web UI

ブラウザからBot設定を管理するWebインターフェースを提供します。

- ギルド設定の管理
- 統計情報の表示
- 管理者向けダッシュボード

---

**📌 コマンド一覧:** 全スラッシュコマンドの詳細は [コマンドリファレンス](docs/guides/COMMANDS.md) を参照してください。

**🧭 実装方針:** 実装時の責務分離・コメント規約は [実装ガイド](docs/guides/IMPLEMENTATION_GUIDELINES.md) を参照してください。

**📋 実装状況:** 開発タスクと進捗は [TODO.md](TODO.md) を参照してください。

## 🛠 技術スタック

### コア技術

- **Runtime**: Node.js 24以上
- **Language**: TypeScript 5.x - 厳格な型チェックで品質向上
- **Framework**: Discord.js 14.x - Discord Bot開発フレームワーク
- **Package Manager**: pnpm - 高速で効率的なパッケージ管理

### データベース

- **Prisma** - タイプセーフなORMとスキーマ管理
- **libSQL** - SQLite互換のデータベース（ローカル/リモート対応）

### Web・API

- **Fastify** - 高速Webフレームワーク
- **Zod** - 実行時バリデーションとスキーマ定義

### ロガー・ユーティリティ

- **Winston** - ログ管理（ローテーション、レベル制御）
- **i18next** - 多言語対応システム
- **node-cron** - タイマー・スケジューリング処理

### 開発ツール

- **Jest** - テストフレームワーク
- **ESLint + Prettier** - コード品質とフォーマット
- **tsx** - TypeScript高速実行
- **tsc-watch** - ファイル監視ビルド

## 🎯 開発原則

### アーキテクチャ

- **レイヤー分離**: Bot / Web / Shared の明確な責務分離
- **依存性注入**: テスト可能な設計
- **型安全性**: TypeScript厳格モード + Zodバリデーション
- **エラーハンドリング**: 統一されたエラー処理機構

### コード品質

- **自動フォーマット**: ESLint + Prettierによる一貫性
- **テストカバレッジ**: 重要ロジックは必ずテスト
- **ドキュメント**: コード内コメント + Markdownドキュメント
- **レビュー**: 重要な変更はセルフレビュー必須

### 開発フロー

- **ブランチ戦略**: main（安定版）、feature/xxx（開発）
- **コミット規約**: Conventional Commits（feat/fix/chore など）
- **バージョニング**: セマンティックバージョニング

## 🚀 クイックスタート

### 必要環境

- Node.js 24以上
- pnpm 10以上

### セットアップ

```bash
# 依存関係インストール
pnpm install

# 環境変数設定
cp .env.example .env
# .envを編集してDiscordトークンなどを設定

# 開発モード起動
pnpm dev:bot
```

### スクリプト

```bash
# 開発
pnpm dev:bot          # Bot開発サーバー起動
pnpm dev:web          # Webサーバー起動
pnpm dev              # Bot + Web同時起動

# ビルド
pnpm build            # TypeScriptビルド
pnpm tsc-watch        # ビルド監視モード
pnpm typecheck        # 型チェックのみ

# テスト
pnpm test             # テスト実行
pnpm test:watch       # テスト監視モード
pnpm test:coverage    # カバレッジレポート

# データベース
pnpm db:migrate       # Prisma マイグレーション実行
pnpm db:generate      # Prisma Client生成
pnpm db:studio        # Prisma Studio起動
pnpm db:push          # スキーマをDBに反映（開発用）

# コード品質
pnpm lint             # ESLintチェック
pnpm lint:fix         # ESLint自動修正
pnpm format           # Prettier実行
pnpm format:check     # Prettierチェックのみ
```

## 📁 プロジェクト構造

```
guild-mng-bot-v2/
├── src/
│   ├── bot/                  # Discord Bot
│   │   ├── main.ts
│   │   ├── client.ts
│   │   ├── commands/         # スラッシュコマンド定義
│   │   ├── events/           # イベントハンドラ
│   │   ├── features/         # 機能モジュール（afk / vac / bump-reminder / ping）
│   │   ├── handlers/         # インタラクション処理フロー
│   │   ├── services/         # Bot起動・依存解決
│   │   ├── errors/           # エラーハンドラ
│   │   ├── types/            # discord.js 型拡張
│   │   └── utils/            # Bot共通ユーティリティ
│   ├── web/                  # Web UI（凍結中）
│   │   ├── server.ts
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── schemas/
│   │   └── public/
│   └── shared/               # 共有コード
│       ├── config/           # 環境変数定義
│       ├── database/         # Repository・Store・型定義
│       ├── features/         # 共有サービス（vac / bump-reminder）
│       ├── locale/           # i18n（i18next）
│       ├── scheduler/        # ジョブスケジューラ
│       ├── errors/           # カスタムエラー・エラーハンドラ
│       └── utils/            # 共通ユーティリティ
├── tests/                    # テスト（unit / integration / e2e）
├── prisma/                   # スキーマ・マイグレーション
├── docs/                     # ドキュメント
├── storage/                  # データ保存（SQLite）
└── logs/                     # ログファイル
```

## 📖 ドキュメント

### ガイド

- [TODO](TODO.md) - タスク管理・残件リスト
- [実装進捗](docs/progress/IMPLEMENTATION_PROGRESS.md) - 機能実装の詳細進捗
- [テスト進捗](docs/progress/TEST_PROGRESS.md) - テスト実装の詳細進捗
- [アーキテクチャガイド](docs/guides/ARCHITECTURE.md) - 全体設計方針・依存方向・責務境界
- [コマンドリファレンス](docs/guides/COMMANDS.md) - 全スラッシュコマンドの詳細
- [開発環境セットアップ](docs/guides/DEVELOPMENT_SETUP.md) - 環境構築とプロジェクト設定の詳細ガイド
- [Git ワークフロー](docs/guides/GIT_WORKFLOW.md) - ブランチ戦略・コミット規約・PR運用ルール
- [テストガイド](docs/guides/TESTING_GUIDELINES.md) - テスト方針・コメント規約・安定化ガイドライン
- [実装ガイド](docs/guides/IMPLEMENTATION_GUIDELINES.md) - 実装細則・分割手順・直接import運用
- [国際化ガイド](docs/guides/I18N_GUIDE.md) - 多言語対応ガイド

### 機能仕様書

各機能の詳細設計と実装仕様を記載したドキュメントです。

- [AFK機能](docs/specs/AFK_SPEC.md) - VCの非アクティブユーザーを手動でAFKチャンネルに移動
- [Bumpリマインダー機能](docs/specs/BUMP_REMINDER_SPEC.md) - Disboard/ディス速のBump後、次回Bump時刻に自動通知
- [VC自動作成機能](docs/specs/VAC_SPEC.md) - トリガーチャンネル参加時に専用VCを作成・管理
- [メッセージ固定機能](docs/specs/STICKY_MESSAGE_SPEC.md) - 指定メッセージをチャンネル最下部に固定表示
- [メッセージレスポンス](docs/specs/MESSAGE_RESPONSE_SPEC.md) - Embed形式の統一メッセージシステム
- [メンバーログ機能](docs/specs/MEMBER_LOG_SPEC.md) - メンバーの参加・脱退を指定チャンネルに記録
- [メッセージ削除](docs/specs/MESSAGE_DELETE_SPEC.md) - モデレーター向けメッセージ一括削除コマンド

## 🔧 開発環境

### VSCode設定

プロジェクトには充実したVSCode開発環境が設定済みです。

#### 推奨拡張機能

プロジェクトを開くと、以下の拡張機能のインストールが推奨されます：

**必須**

- **ESLint** - コード品質チェック
- **Prettier** - 自動フォーマット
- **TypeScript拡張** - 型補完・エラー表示
- **Error Lens** - リアルタイムエラー表示

**推奨**

- **GitLens** - Git履歴可視化
- **Git Graph** - ブランチグラフ表示
- **REST Client** - API テスト
- **Todo Tree** - TODOコメント管理
- **Path IntelliSense** - パス自動補完
- **Docker** - コンテナ管理

詳細は [.vscode/README.md](.vscode/README.md) を参照してください。

#### コードスニペット

プロジェクト専用スニペットが利用可能です：

```typescript
// "discord-command" と入力してTab
discord - command; // Discordコマンドテンプレート
fastify - route; // APIルートテンプレート
logger; // ロガーインスタンス
```

#### デバッグ設定

VSCodeデバッグ機能が設定済み：

- **F5** でBot/Webサーバーをデバッグモード起動
- ブレークポイント、変数監視、ステップ実行が利用可能
- 複数の起動設定（Bot単体、Web単体、同時起動）

#### タスク

便利なタスクが利用可能：

- **Ctrl+Shift+B** - TypeScriptビルド
- `Tasks: Run Task` から選択:
  - Build: Watch - ビルド監視モード
  - Dev: Start Bot/Web - 開発サーバー起動
  - Lint: Check/Fix - ESLint実行
  - Format: Check/Write - Prettier実行

### REST Client

`api-tests.http` ファイルでAPIテストが可能です：

```http
### Health Check
GET http://localhost:3000/health

### Get Guild Config
GET http://localhost:3000/api/guilds/{{guildId}}/config
```

REST Client拡張機能で「Send Request」をクリックするだけでテストできます。

## 📊 プロジェクト状況

**現在のフェーズ**: Phase 2 - 主要機能実装中 🚧

- ✅ Phase 0: 環境構築完了
- ✅ Phase 1: 基盤実装完了（ロガー、Bot基盤、データベース、i18n、テスト）
- ✅ Bump Reminder機能実装完了
- ✅ VAC（VC自動作成）機能実装完了
- 🚧 Phase 2: メッセージ固定機能、メンバーログ機能、メッセージ削除機能

詳細は [TODO.md](TODO.md) を参照してください。

## 📝 コミット規約

Conventional Commits を使用：

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント変更
style: コードスタイル変更（動作に影響なし）
refactor: リファクタリング
test: テスト追加・修正
chore: ビルド・補助ツール変更
```

## 📄 ライセンス

Apache License 2.0 - 詳細は [LICENSE](LICENSE) を参照

## 🔗 リンク

- **旧プロジェクト**: [guild-mng-bot](https://github.com/sonozaki-sz/guild-mng-bot)（参考のみ、コード流用なし）

---

**開発開始**: 2026年2月
**最終更新**: 2026年2月22日
