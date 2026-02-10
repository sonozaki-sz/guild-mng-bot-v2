# Guild Management Bot v2

> Discord ギルド管理用Bot - 新規プロジェクト

## 📋 概要

guild-mng-bot-v2は、Discordサーバー（ギルド）の管理を支援する多機能Botです。
旧プロジェクト（guild-mng-bot）から完全に独立した新規開発として、モダンな技術スタックとクリーンなアーキテクチャで構築されています。

## ✨ 主要機能（予定）

- 🔇 **AFK機能**: 非アクティブユーザーの自動チャンネル移動
- ⏰ **Bump通知**: サーバー宣伝リマインダー
- 📌 **メッセージ固定機能**: 重要メッセージの自動固定・再送信
- 🎤 **VC自動作成機能**: ボイスチャンネル自動作成
- 🌐 **多言語対応**: Guild別言語設定
- 🖥️ **Web UI**: ブラウザからの設定管理

## 🛠 技術スタック

- **Runtime**: Node.js 22+
- **Language**: TypeScript 5.x
- **Framework**: Discord.js 14.x
- **Database**: Keyv + SQLite
- **Web**: Fastify
- **Logger**: Winston
- **Validation**: Zod
- **Package Manager**: pnpm

## 🚀 クイックスタート

### 必要環境

- Node.js 22以上
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
│   ├── bot/              # Discord Bot
│   │   ├── main.ts
│   │   ├── client.ts
│   │   ├── commands/     # スラッシュコマンド
│   │   ├── events/       # イベントハンドラ
│   │   └── services/
│   ├── web/              # Web UI
│   │   ├── server.ts
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── public/
│   └── shared/           # 共有コード
│       ├── config/
│       ├── database/
│       ├── types/
│       ├── utils/
│       └── locale/
├── tests/                # テスト
├── docs/                 # ドキュメント
├── storage/              # データ保存
└── logs/                 # ログファイル
```

## 📖 ドキュメント

- [TODO](TODO.md) - 残タスク一覧
- [開発ロードマップ](docs/DEVELOPMENT_ROADMAP.md) - 開発方針と作業計画
- [テストガイド](docs/TESTING.md) - テスト方針とガイドライン
- [国際化ガイド](docs/I18N_GUIDE.md) - 多言語対応ガイド

### 機能仕様書

- [Bump通知機能](docs/BUMP_REMINDER_SPEC.md) - Disboard/ディス速のBump通知
- [VAC機能](docs/VAC_SPEC.md) - ボイスチャンネル自動作成と操作パネル
- [メンバー通知](docs/JOIN_LEAVE_LOG_SPEC.md) - メンバー加入・脱退通知
- [メッセージ削除](docs/MSG_DEL_COMMAND_SPEC.md) - モデレーション機能

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

**現在のフェーズ**: Phase 2 - コマンド実装（MVP） 🚧

- ✅ Phase 0: 環境構築完了
- ✅ Phase 1: 基盤実装完了（ロガー、Bot基盤、データベース、i18n、テスト）
- 🚧 Phase 2: 基本コマンド実装中

詳細は [開発ロードマップ](docs/DEVELOPMENT_ROADMAP.md) および [TODO](TODO.md) を参照してください。

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
**最終更新**: 2026年2月11日
