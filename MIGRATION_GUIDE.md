# Guild Management Bot v2 - 移行ガイド

> 現行プロジェクトから新しいプライベートリポジトリへの移行手順

## 📋 前提条件

- Node.js 22以上
- pnpm 10以上
- VSCode
- Git

---

## 🆕 新リポジトリのセットアップ

### 1. GitHubで新しいプライベートリポジトリ作成

```bash
# リポジトリ名の例: guild-mng-bot-v2
# プライベート設定を有効にする
# README, .gitignore (Node), LICENSE (Apache-2.0) を追加
```

### 2. ローカルにクローン

```bash
cd ~/dev
git clone git@github.com:YOUR_USERNAME/guild-mng-bot-v2.git
cd guild-mng-bot-v2
```

### 3. 基本セットアップ

```bash
# pnpmの初期化
pnpm init

# TypeScript環境構築
pnpm add -D typescript @types/node ts-node tsx nodemon
pnpm add -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -D prettier eslint eslint-config-prettier eslint-plugin-prettier

# Discord.js とコア依存関係
pnpm add discord.js dotenv

# ロガー（REFACTORING_PLAN.md Phase 2準拠: Winston移行）
pnpm add winston winston-daily-rotate-file

# バリデーション（Phase 2準拠）
pnpm add zod

# スケジューラー（Phase 2準拠: node-cron）
pnpm add node-cron
pnpm add -D @types/node-cron

# テスト環境
pnpm add -D jest @types/jest ts-jest
# OR より高速な Vitest
pnpm add -D vitest @vitest/ui

# データベース（Phase 3準拠: Keyv + Repositoryパターン）
pnpm add keyv @keyv/sqlite
# OR Prisma（将来的に移行する場合）
pnpm add -D prisma @prisma/client
pnpm dlx prisma init --datasource-provider sqlite

# Web UI (Fastify推奨)
pnpm add fastify @fastify/static @fastify/cors @fastify/jwt

# 多言語対応（Phase 3.3準拠: Guild別言語対応）
pnpm add @hi18n/core
pnpm add -D @hi18n/cli

# ユーティリティ
pnpm add lodash date-fns
pnpm add -D @types/lodash

# 開発ツール
pnpm add -D concurrently tsc-watch
```

### 4. package.json スクリプト設定

```json
{
  "name": "guild-mng-bot-v2",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev:bot": "tsx watch src/bot/main.ts",
    "dev:web": "tsx watch src/web/server.ts",
    "dev": "concurrently \"pnpm dev:bot\" \"pnpm dev:web\"",
    
    "build": "tsc --build",
    "start:bot": "node dist/bot/main.js",
    "start:web": "node dist/web/server.js",
    "start": "concurrently \"pnpm start:bot\" \"pnpm start:web\"",
    
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\"",
    
    "typecheck": "tsc --noEmit",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "engines": {
    "node": ">=22"
  }
}
```

---

## 📁 推奨ディレクトリ構造

```
guild-mng-bot-v2/
├── .vscode/
│   ├── settings.json
│   ├── launch.json
│   ├── tasks.json
│   └── extensions.json
│
├── src/
│   ├── bot/                      # Discord Bot
│   │   ├── main.ts               # Bot エントリーポイント
│   │   ├── client.ts             # Discord Client初期化
│   │   ├── commands/             # スラッシュコマンド
│   │   │   ├── index.ts
│   │   │   ├── afk.ts
│   │   │   ├── userInfo.ts
│   │   │   └── ...
│   │   ├── events/               # イベントハンドラ
│   │   │   ├── index.ts
│   │   │   ├── ready.ts
│   │   │   ├── interactionCreate.ts
│   │   │   └── ...
│   │   └── services/             # Bot専用サービス
│   │       ├── commandRegistry.ts
│   │       └── eventRegistry.ts
│   │
│   ├── web/                      # Web UI
│   │   ├── server.ts             # Fastifyサーバー
│   │   ├── routes/               # APIルート
│   │   │   ├── index.ts
│   │   │   ├── api/
│   │   │   │   ├── guilds.ts
│   │   │   │   ├── config.ts
│   │   │   │   └── stats.ts
│   │   │   └── health.ts
│   │   ├── middleware/           # ミドルウェア
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── cors.ts
│   │   ├── schemas/              # Zodスキーマ
│   │   │   └── config.schema.ts
│   │   └── public/               # 静的ファイル
│   │       ├── index.html
│   │       ├── css/
│   │       └── js/
│   │
│   ├── shared/                   # Bot/Web共有
│   │   ├── config/
│   │   │   ├── index.ts
│   │   │   └── env.ts
│   │   ├── database/
│   │   │   ├── client.ts
│   │   │   └── repositories/
│   │   ├── types/
│   │   │   ├── discord.ts
│   │   │   ├── database.ts
│   │   │   └── api.ts
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   ├── helpers.ts
│   │   │   └── validators.ts
│   │   └── locale/
│   │       ├── index.ts
│   │       └── ja.ts
│   │
│   └── index.ts                  # 全体エントリーポイント（オプション）
│
├── tests/
│   ├── unit/
│   │   ├── utils/
│   │   └── services/
│   ├── integration/
│   │   ├── commands/
│   │   └── api/
│   └── e2e/
│       └── bot-workflow.test.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── storage/                      # 実行時データ
│   └── .gitkeep
│
├── logs/                         # ログファイル
│   └── .gitkeep
│
├── docs/                         # ドキュメント
│   ├── API.md
│   ├── COMMANDS.md
│   └── DEPLOYMENT.md
│
├── .env.example
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── tsconfig.json
├── jest.config.js
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

## 🔄 現行プロジェクトから移行する資産

### 即座にコピーできるファイル

```bash
# 現行プロジェクトのディレクトリで実行
OLD_DIR="/home/shun/dev/guild-mng-bot"
NEW_DIR="/home/shun/dev/guild-mng-bot-v2"

# 環境変数テンプレート
cp $OLD_DIR/.env.example $NEW_DIR/

# ライセンス
cp $OLD_DIR/LICENSE $NEW_DIR/

# 多言語対応（そのまま流用）
mkdir -p $NEW_DIR/src/shared/locale
cp -r $OLD_DIR/src/locale/* $NEW_DIR/src/shared/locale/

# 参考用テストコード
mkdir -p $NEW_DIR/tests/unit/utils
cp -r $OLD_DIR/src/services/__tests__/* $NEW_DIR/tests/unit/utils/
```

### リファクタリングして移行するロジック

#### 1. **型定義 (src/shared/types/discord.ts)**

```typescript
// 現行: src/services/discord.ts から移行
import { 
  ChatInputCommandInteraction, 
  AutocompleteInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  SharedSlashCommand,
  Client,
  Collection
} from 'discord.js';

export interface Command {
  data: SharedSlashCommand;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  cooldown?: number; // seconds
}

export interface Modal {
  modal: ModalBuilder;
  data?: any;
  execute: (interaction: ModalSubmitInteraction) => Promise<void>;
}

export interface BotEvent {
  name: string;
  once?: boolean;
  execute: (...args: any[]) => Promise<void>;
}

// Discord.js型拡張
declare module 'discord.js' {
  interface Client {
    commands: Collection<string, Command>;
    cooldowns: Collection<string, number>;
    modals: Collection<string, Modal>;
  }
}
```

#### 2. **Logger (src/shared/utils/logger.ts) - Winston版**

**REFACTORING_PLAN.md Phase 2準拠**: log4js → Winston移行

```typescript
// 現行: src/services/logger.ts を Winston で改善
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from '../config/env';

// テンプレートファイル: migration-templates/src-templates/shared-logger.ts
// 機能:
// - stdout + file 出力（docker logs 対応）
// - 日次ログローテーション
// - エラーログ分離
// - 開発/本番環境対応
// - Graceful shutdown
```

**主な改善点**:
- ✅ Docker環境でログ確認可能（stdout出力）
- ✅ 日次ローテーション（ディスク容量管理）
- ✅ 構造化ログ（JSON形式も対応）
- ✅ スタックトレース自動出力

#### 3. **Config (src/shared/config/env.ts)**

```typescript
// 現行: src/services/config.ts を型安全に改善
import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Discord
  DISCORD_TOKEN: z.string().min(50),
  DISCORD_APP_ID: z.string().min(10),
  
  // Locale
  LOCALE: z.string().default('ja'),
  
  // Database
  DATABASE_URL: z.string().default('file:./storage/db.sqlite'),
  
  // Web Server
  WEB_PORT: z.coerce.number().default(3000),
  WEB_HOST: z.string().default('0.0.0.0'),
  
  // JWT (Web認証用)
  JWT_SECRET: z.string().optional(),
  
  // Logger
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ 環境変数の検証に失敗しました:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
```

#### 4. **Discord Client (src/bot/client.ts)**

```typescript
// 現行: src/services/discordBot.ts をリファクタリング
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import type { Command, Modal } from '../shared/types/discord';
import { logger } from '../shared/utils/logger';

export class BotClient extends Client {
  public commands: Collection<string, Command>;
  public modals: Collection<string, Modal>;
  public cooldowns: Collection<string, number>;

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
      ]
    });

    this.commands = new Collection();
    this.modals = new Collection();
    this.cooldowns = new Collection();
  }
}

export const createBotClient = () => {
  const client = new BotClient();
  
  logger.info('Discord Botクライアントを初期化しました');
  
  return client;
};
```

#### 5. **コマンド例 (src/bot/commands/echo.ts)**

```typescript
// 現行: src/commands/echo.ts を参考に
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../shared/types/discord';
import { logger } from '../../shared/utils/logger';

export const echoCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('echo')
    .setDescription('メッセージをエコーします')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('エコーするメッセージ')
        .setRequired(true)
    ),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const message = interaction.options.getString('message', true);
    
    await interaction.reply({
      content: message,
      ephemeral: false
    });
    
    logger.info(`Echo command executed by ${interaction.user.tag}`);
  },
  
  cooldown: 3
};

export default echoCommand;
```

---

## 🔧 設定ファイルテンプレート

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    
    "outDir": "./dist",
    "rootDir": "./src",
    
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    
    "types": ["node", "jest"],
    
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@bot/*": ["src/bot/*"],
      "@web/*": ["src/web/*"],
      "@shared/*": ["src/shared/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### .eslintrc.js

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier'
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error'
  },
  env: {
    node: true,
    es2022: true
  }
};
```

### .prettierrc

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### .env.example

```env
# Node環境
NODE_ENV=development

# Discord Bot
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_APP_ID=your_discord_app_id_here

# ロケール
LOCALE=ja

# データベース
DATABASE_URL=file:./storage/db.sqlite

# Webサーバー
WEB_PORT=3000
WEB_HOST=0.0.0.0

# JWT認証 (Web UI用)
JWT_SECRET=your_jwt_secret_here

# ログレベル
LOG_LEVEL=debug
```

### .gitignore

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build
dist/
.build/
*.tsbuildinfo

# Environment
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*

# Database
storage/*.sqlite
storage/*.db
!storage/.gitkeep

# Testing
coverage/
.nyc_output/

# IDE
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Temporary
tmp/
temp/
```

---

## ✅ 移行チェックリスト

### Phase 1: 環境構築
- [ ] GitHubで新しいプライベートリポジトリ作成
- [ ] ローカルにクローン
- [ ] `pnpm init` で初期化
- [ ] 必要なパッケージをインストール
- [ ] TypeScript設定 (tsconfig.json)
- [ ] ESLint/Prettier設定
- [ ] `.env.example` 作成

### Phase 2: VSCode設定
- [ ] `.vscode/settings.json` 作成
- [ ] `.vscode/launch.json` 作成（デバッグ設定）
- [ ] `.vscode/tasks.json` 作成
- [ ] `.vscode/extensions.json` 作成（推奨拡張機能）

### Phase 3: コア機能移行
- [ ] ディレクトリ構造作成
- [ ] 型定義移行 (`src/shared/types/`)
- [ ] Logger移行・改善 (`src/shared/utils/logger.ts`)
- [ ] Config移行・改善 (`src/shared/config/`)
- [ ] 多言語対応移行 (`src/shared/locale/`)

### Phase 4: Bot機能移行
- [ ] Discord Client初期化 (`src/bot/client.ts`)
- [ ] コマンド登録システム (`src/bot/services/commandRegistry.ts`)
- [ ] イベント登録システム (`src/bot/services/eventRegistry.ts`)
- [ ] 各コマンド移行 (`src/bot/commands/`)
- [ ] 各イベント移行 (`src/bot/events/`)
- [ ] Bot起動ファイル (`src/bot/main.ts`)

### Phase 5: Web UI実装
- [ ] Fastifyサーバー作成 (`src/web/server.ts`)
- [ ] ヘルスチェックエンドポイント
- [ ] Bot設定API (`src/web/routes/api/config.ts`)
- [ ] ギルド情報API (`src/web/routes/api/guilds.ts`)
- [ ] 認証ミドルウェア (`src/web/middleware/auth.ts`)
- [ ] フロントエンド (静的HTML/CSS/JS)

### Phase 6: データベース
- [ ] Prismaセットアップ
- [ ] スキーマ定義 (`prisma/schema.prisma`)
- [ ] マイグレーション実行
- [ ] リポジトリパターン実装

### Phase 7: テスト
- [ ] Jestセットアップ
- [ ] ユニットテスト作成
- [ ] 統合テスト作成
- [ ] テストカバレッジ確認

### Phase 8: デプロイ準備
- [ ] Dockerfile作成
- [ ] docker-compose.yml作成
- [ ] デプロイスクリプト
- [ ] CI/CD設定 (GitHub Actions)

---

## 🎯 次のステップ

1. **新リポジトリ作成**: GitHubでプライベートリポジトリを作成
2. **このガイドを新リポジトリにコピー**: 移行作業の参考に
3. **段階的に移行**: Phase 1から順番に進める
4. **テスト**: 各フェーズでテストを実行して動作確認

---

## 📚 参考リソース

- [Discord.js Guide](https://discordjs.guide/)
- [Fastify Documentation](https://www.fastify.io/docs/latest/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
