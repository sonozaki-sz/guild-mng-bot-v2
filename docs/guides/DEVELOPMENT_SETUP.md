# 開発環境セットアップ - ガイド

> Development Environment Setup Guide - 環境構築とプロジェクト設定の詳細ガイド

最終更新: 2026年2月22日（CI/CD セクションを追加）

---

## 📋 概要

### 目的

このドキュメントは、guild-mng-bot-v2プロジェクトの開発環境をセットアップするための詳細な手順と、各種設定ファイルの説明を提供します。Node.js、TypeScript、Prisma、VSCodeなどの設定方法を網羅しています。

### 対象読者

- プロジェクトに新しく参加する開発者
- 開発環境を再構築する必要がある開発者
- 設定内容の詳細を理解したい開発者

---

## 🎯 前提条件

### 必須環境

以下のツールがインストールされている必要があります：

| ツール      | バージョン | 確認コマンド     |
| ----------- | ---------- | ---------------- |
| **Node.js** | 24以上     | `node --version` |
| **pnpm**    | 10以上     | `pnpm --version` |
| **Git**     | 2.0以上    | `git --version`  |

### 推奨環境

- **OS**: Linux / macOS / Windows (WSL2推奨)
- **エディター**: Visual Studio Code
- **シェル**: bash / zsh

### Node.jsのインストール

Node.js 24以上をインストールしてください。推奨方法：

```bash
# nvm (Node Version Manager) を使用する場合
nvm install 24
nvm use 24

# または直接ダウンロード
# https://nodejs.org/
```

### pnpmのインストール

```bash
# npmを使用してインストール
npm install -g pnpm

# またはcorepackを使用（Node.js 16.13以降）
corepack enable
corepack prepare pnpm@latest --activate
```

---

## 🚀 セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/sonozaki-sz/guild-mng-bot-v2.git
cd guild-mng-bot-v2
```

### 2. 依存関係のインストール

```bash
pnpm install
```

このコマンドで以下がインストールされます：

- ランタイム依存関係 (discord.js, prisma, fastify など)
- 開発依存関係 (typescript, jest, eslint など)

### 3. 環境変数の設定

`.env.example` をコピーして `.env` を作成します：

```bash
cp .env.example .env
```

`.env` ファイルを編集してDiscordトークンなどを設定します：

```dotenv
# Discord Bot設定
DISCORD_TOKEN="YOUR_BOT_TOKEN_HERE"
DISCORD_APP_ID="YOUR_APPLICATION_ID_HERE"

# 開発用：テストサーバーのIDを設定するとコマンドが即座に反映されます
DISCORD_GUILD_ID="YOUR_TEST_GUILD_ID"

# ロケール設定（日本語: ja / 英語: en）
LOCALE="ja"

# データベース
DATABASE_URL="file:./storage/db.sqlite"

# JWT（Web UI認証用）本番環境では必須
# JWT_SECRET="your-jwt-secret-key-here"

# CORS許可オリジン（本番環境用、カンマ区切りで複数指定可）
# CORS_ORIGIN="https://your-domain.com"

# テストモード（機能のテスト用動作を有効化）オプション
# TEST_MODE="true"
```

#### 環境変数の詳細

| 変数名             | 必須 | 説明                                                   | 例                              |
| ------------------ | ---- | ------------------------------------------------------ | ------------------------------- |
| `DISCORD_TOKEN`    | ✅   | Discord BotのToken                                     | `MTIzNDU2Nzg5MDEyMzQ1Njc4OQ...` |
| `DISCORD_APP_ID`   | ✅   | Discord ApplicationのID                                | `1234567890123456789`           |
| `DISCORD_GUILD_ID` | ❌   | 開発用テストサーバーID（設定すると即座にコマンド反映） | `1234567890123456789`           |
| `LOCALE`           | ❌   | デフォルトロケール（ja/en）                            | `ja`                            |
| `DATABASE_URL`     | ✅   | データベース接続URL（libSQL形式）                      | `file:./storage/db.sqlite`      |
| `JWT_SECRET`       | ⭐   | JWT秘密鍵（本番環境では**必須**）                      | `your-secret-key`               |
| `CORS_ORIGIN`      | ❌   | 本番環境のCORS許可オリジン（カンマ区切り）             | `https://your-domain.com`       |
| `TEST_MODE`        | ❌   | テストモード有効化（開発用）                           | `true`                          |

> ⭐ `JWT_SECRET` は `NODE_ENV=production` の場合に必須です。未設定の場合起動時にエラーになります。

#### Discord Botの作成手順

1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. 「New Application」をクリックしてアプリケーションを作成
3. 「Bot」タブから「Add Bot」をクリック
4. 「TOKEN」をコピーして `DISCORD_TOKEN` に設定
5. 「General Information」タブの「APPLICATION ID」をコピーして `DISCORD_APP_ID` に設定
6. 「Bot」タブで以下の権限を有効化：
   - `Presence Intent`
   - `Server Members Intent`
   - `Message Content Intent`
7. 「OAuth2」→「URL Generator」から以下を選択してBotをサーバーに招待：
   - **Scopes**: `bot`, `applications.commands`
   - **Bot Permissions**: `Administrator`（または必要な権限のみ選択）

### 4. データベースのセットアップ

Prismaを使用してデータベースをセットアップします：

```bash
# Prisma Clientを生成
pnpm db:generate

# マイグレーションを実行（データベースを初期化）
pnpm db:migrate
```

#### データベースコマンド

| コマンド           | 説明                   | 使用タイミング                                               |
| ------------------ | ---------------------- | ------------------------------------------------------------ |
| `pnpm db:generate` | Prisma Clientを生成    | 初回セットアップ、schema変更後、**パッケージアップデート後** |
| `pnpm db:migrate`  | マイグレーションを実行 | 初回セットアップ、本番環境での適用                           |
| `pnpm db:push`     | スキーマをDBに直接反映 | 開発中のスキーマ試行                                         |
| `pnpm db:studio`   | Prisma Studioを起動    | データベースのGUI管理                                        |

### 5. ビルドとテスト

プロジェクトが正しくセットアップされているか確認します：

```bash
# TypeScriptの型チェック
pnpm typecheck

# ビルド
pnpm build

# テスト実行
pnpm test
```

すべてが成功すれば、セットアップ完了です！

### 6. 開発サーバーの起動

```bash
# Botのみ起動
pnpm dev:bot

# Webサーバーのみ起動
pnpm dev:web

# Bot + Webを同時起動
pnpm dev
```

---

## ⚙️ TypeScript設定

### tsconfig.json の詳細

プロジェクトのTypeScript設定は `tsconfig.json` で管理されています。

#### 主要な設定項目

```jsonc
{
  "compilerOptions": {
    // === コンパイルターゲット ===
    "target": "ES2024", // Node.js 24完全サポート
    "module": "ESNext", // 最新モジュール機能
    "moduleResolution": "bundler", // 最新の解決方式
    "lib": ["ES2024"], // 最新の標準化済みAPI

    // === 出力設定 ===
    "outDir": "./dist", // ビルド出力先
    "rootDir": "./src", // ソースコードのルート
    "declaration": true, // .d.tsファイル生成
    "sourceMap": true, // デバッグ用ソースマップ

    // === 厳格性 ===
    "strict": true, // 全ての厳格チェック有効
    "noImplicitAny": true, // 暗黙的any禁止
    "strictNullChecks": true, // null/undefined厳格チェック
    "noUnusedLocals": true, // 未使用ローカル変数検出
    "noUnusedParameters": true, // 未使用パラメータ検出

    // === モジュール互換性 ===
    "esModuleInterop": true, // CommonJS互換性
    "resolveJsonModule": true, // JSONインポート許可

    // === その他 ===
    "types": ["node"], // グローバル型定義
    "skipLibCheck": true, // 型定義ファイルのチェックスキップ
  },
}
```

#### 設定の意図

- **target: ES2024**: Node.js 24の最新機能を活用
- **strict: true**: 型安全性を最大限に確保
- **noUnusedLocals/Parameters**: デッドコードを検出
- **esModuleInterop**: CommonJSとESModuleの相互運用性

### テスト用TypeScript設定

テスト環境では専用の `tests/tsconfig.json` を使用します：

```jsonc
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "types": ["node", "jest"],
    "esModuleInterop": true,
  },
  "include": ["**/*.ts", "../src/**/*.ts"],
}
```

---

## 🧪 Jest設定

### jest.config.ts の詳細

テストフレームワークの設定は `jest.config.ts` で管理されています。

#### 主要な設定項目

```typescript
{
  preset: "ts-jest",              // TypeScriptサポート
  testEnvironment: "node",        // Node.js環境

  // テストファイルの検出
  testMatch: [
    "**/__tests__/**/*.ts",
    "**/*.test.ts",
    "**/*.spec.ts"
  ],

  // カバレッジ設定
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/*.test.ts",
    "!src/**/main.ts",
    "!src/**/server.ts"
  ],

  // カバレッジしきい値（70%）
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // パスエイリアス
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },

  // タイムアウト
  testTimeout: 10000
}
```

#### カバレッジ除外

以下のファイルはカバレッジ計測から除外されます：

- 型定義ファイル (`.d.ts`)
- テストファイル (`.test.ts`, `.spec.ts`)
- エントリーポイント (`main.ts`, `server.ts`)

---

## 🎨 VSCode設定

### 推奨拡張機能

プロジェクトには `.vscode/extensions.json` で推奨拡張機能が定義されています：

- **ESLint** - コード品質チェック
- **Prettier** - コードフォーマット
- **Prisma** - Prismaスキーマサポート
- **Error Lens** - エラー表示強化
- **GitLens** - Git統合強化

### エディター設定

`.vscode/settings.json` の主要設定：

```jsonc
{
  // パッケージマネージャー
  "npm.packageManager": "pnpm",

  // 保存時の自動処理
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit",
  },

  // エディター設定
  "editor.tabSize": 2,
  "editor.rulers": [100],
  "files.autoSave": "onFocusChange",
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,

  // TypeScript設定
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.updateImportsOnFileMove.enabled": "always",
}
```

#### 設定の意図

- **formatOnSave**: 保存時に自動フォーマット
- **fixAll.eslint**: 保存時にESLint自動修正
- **organizeImports**: import文の自動整理
- **tabSize: 2**: インデント幅を2スペースに統一
- **rulers: [100]**: 100文字で視覚的なガイドライン

#### ESLint 追加ルール（import境界）

- `src/shared/**/*.ts` では `../locale` / `../utils` / `../errors` / `../database` などの **barrel import を禁止**
- `shared` 内部は `../locale/localeManager` のように **直接モジュール import** を使う
- `src/bot/features/**/*.ts` でも `shared/locale` / `shared/utils` / `shared/errors` / `shared/database` の barrel import を禁止
- `bot/features` 内部では `shared/*/*` の直接モジュール参照を使う（例: `shared/locale/localeManager`）
- 目的: 依存境界を明確化し、`index.ts` 再エクスポート由来の Functions カバレッジノイズを抑制する

---

## 📝 開発スクリプト

### Bot関連

| コマンド         | 説明                                  | 使用タイミング |
| ---------------- | ------------------------------------- | -------------- |
| `pnpm dev:bot`   | Bot開発サーバー起動（ホットリロード） | Bot機能開発中  |
| `pnpm start:bot` | Botを本番モードで起動                 | 本番環境       |

### Web関連

| コマンド         | 説明                              | 使用タイミング |
| ---------------- | --------------------------------- | -------------- |
| `pnpm dev:web`   | Webサーバー起動（ホットリロード） | Web UI開発中   |
| `pnpm start:web` | Webサーバーを本番モードで起動     | 本番環境       |

### ビルド関連

| コマンド         | 説明                         | 使用タイミング     |
| ---------------- | ---------------------------- | ------------------ |
| `pnpm build`     | TypeScriptビルド             | デプロイ前         |
| `pnpm tsc-watch` | ビルド監視モード             | 開発中の型チェック |
| `pnpm typecheck` | 型チェックのみ（ビルドなし） | CI/CD              |

### テスト関連

| コマンド             | 説明                   | 使用タイミング    |
| -------------------- | ---------------------- | ----------------- |
| `pnpm test`          | 全テスト実行           | コミット前、CI/CD |
| `pnpm test:watch`    | テスト監視モード       | TDD開発中         |
| `pnpm test:coverage` | カバレッジレポート生成 | 品質確認          |

### コード品質関連

| コマンド            | 説明                 | 使用タイミング |
| ------------------- | -------------------- | -------------- |
| `pnpm lint`         | ESLintチェック       | コミット前     |
| `pnpm lint:fix`     | ESLint自動修正       | コード整形     |
| `pnpm format`       | Prettier実行         | コード整形     |
| `pnpm format:check` | Prettierチェックのみ | CI/CD          |

---

## 🤖 CI/CD（GitHub Actions）

`main` ブランチへの push で自動デプロイが行われます。ワークフローファイルは [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml) です。

### ワークフローの概要

| ジョブ                    | 実行タイミング                    | 内容                         |
| ------------------------- | --------------------------------- | ---------------------------- |
| **Test**                  | main への push / main 向け PR     | 型チェック・テスト           |
| **Deploy to XServer VPS** | main への push（Test 成功後のみ） | SSH 経由でサーバーへデプロイ |

### 開発者として知っておくこと

- **PR を作成するだけで CI が走ります**。型エラーやテスト失敗はマージ前に検出されます。
- **main にマージすれば自動デプロイが実行されます**。手動での SSH / デプロイ作業は不要です。
- テストが失敗するとデプロイはスキップされます。常にテストをグリーンに保ってください。

### 初回セットアップ（管理者のみ）

初回だけ GitHub リポジトリに以下の **Repository Secrets** を追加する必要があります（後から参加したメンバーは不要）。

| Secret 名     | 内容                       |
| ------------- | -------------------------- |
| `VPS_HOST`    | サーバーのIPアドレス       |
| `VPS_USER`    | SSH ユーザー名             |
| `VPS_SSH_KEY` | SSH 秘密鍵（ed25519 全文） |
| `VPS_PORT`    | SSH ポート番号（例: `22`） |

設定方法や本番環境のセットアップ詳細は [DEPLOYMENT_XSERVER.md](DEPLOYMENT_XSERVER.md) の「8. GitHub Actions による自動デプロイ」を参照してください。

---

## 🛠️ データベース詳細

### Prismaスキーマ

データベーススキーマは `prisma/schema.prisma` で定義されています。

#### 主要なモデル

```prisma
// ギルド設定
model GuildConfig {
  guildId              String   @id
  locale               String   @default("ja")
  afkConfig            String?  // AFK設定（JSON）
  bumpReminderConfig   String?  // Bumpリマインダー設定（JSON）
  vacConfig            String?  // VC自動作成設定（JSON）
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

// Bumpリマインダー
model BumpReminder {
  id           String   @id @default(cuid())
  guildId      String
  channelId    String
  messageId    String
  serviceName  String   // "Disboard" | "Dissoku"
  scheduledAt  DateTime
  status       String   // "pending" | "sent" | "cancelled"
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### マイグレーション管理

```bash
# 新しいマイグレーションを作成
pnpm db:migrate

# マイグレーション履歴確認
ls prisma/migrations/

# データベースをリセット（開発用）
pnpm prisma migrate reset
```

### Prisma Studio

ブラウザベースのデータベース管理ツール：

```bash
pnpm db:studio
```

`http://localhost:5555` でアクセス可能。データの閲覧・編集ができます。

---

## 🔍 トラブルシューティング

### よくある問題と解決方法

#### 0. パッケージアップデート後に `PrismaClient` の型エラーが発生する

**症状**: `pnpm typecheck` で `Module '"@prisma/client"' has no exported member 'PrismaClient'` などの型エラーが発生

**原因**: `pnpm install` / `pnpm update` はパッケージファイルを更新しますが、Prisma Clientの生成ファイルは更新されません。`prisma generate` を別途実行する必要があります。

**解決方法**:

```bash
pnpm db:generate
```

> **注意**: `@prisma/client` や `prisma` のバージョンを更新した際は、必ず `pnpm db:generate` を実行してください。

---

#### 1. `pnpm install` が失敗する

**症状**: 依存関係のインストールに失敗

**解決方法**:

```bash
# キャッシュをクリア
pnpm store prune

# 再インストール
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### 2. TypeScriptのビルドエラー

**症状**: `tsc` コマンドで型エラーが発生

**解決方法**:

```bash
# Prisma Clientを再生成
pnpm db:generate

# node_modulesの型定義を確認
rm -rf node_modules/.prisma
pnpm install
```

#### 3. Discord Botが起動しない

**症状**: `DISCORD_TOKEN` に関するエラー

**解決方法**:

1. `.env` ファイルが存在するか確認
2. `DISCORD_TOKEN` が正しく設定されているか確認
3. Tokenが有効か確認（Developer Portalで再生成可能）

#### 4. データベースマイグレーションエラー

**症状**: `prisma migrate` が失敗

**解決方法**:

```bash
# データベースをリセット（開発環境のみ）
pnpm prisma migrate reset

# スキーマを直接反映（開発用）
pnpm db:push
```

#### 5. テストが失敗する

**症状**: Jestのテストが実行できない

**解決方法**:

```bash
# テストキャッシュをクリア
pnpm jest --clearCache

# Prisma Clientを再生成
pnpm db:generate

# テストを再実行
pnpm test
```

#### 6. VSCodeでインポートエラー

**症状**: モジュール解決エラー、型定義が見つからない

**解決方法**:

1. VSCodeを再起動
2. TypeScript Language Serverを再起動
   - Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
3. Prisma Clientを再生成: `pnpm db:generate`

#### 7. ポートが既に使用されている

**症状**: `EADDRINUSE` エラー

**解決方法**:

```bash
# ポート使用状況を確認（Linux/macOS）
lsof -i :3000

# プロセスを終了
kill -9 <PID>

# または別のポートを使用
# .envファイルにPORT変数を追加
```

---

## 📚 参考リソース

### 公式ドキュメント

- [Node.js Documentation](https://nodejs.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Discord.js Guide](https://discordjs.guide/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [pnpm Documentation](https://pnpm.io/)

### プロジェクト内ドキュメント

- [README.md](../README.md) - プロジェクト概要
- [TODO.md](../TODO.md) - 開発タスク一覧
- [TESTING_GUIDELINES.md](TESTING_GUIDELINES.md) - テストガイドライン
- [I18N_GUIDE.md](I18N_GUIDE.md) - 多言語対応ガイド

---

## 🔗 関連ドキュメント

- [README.md](../README.md) - プロジェクト概要・クイックスタート
- [TESTING_GUIDELINES.md](TESTING_GUIDELINES.md) - テスト方針・ガイドライン
- [I18N_GUIDE.md](I18N_GUIDE.md) - 多言語対応ガイド
- [TODO.md](../TODO.md) - 開発タスク一覧
