# XServer VPS デプロイガイド

> XServer VPS へ guild-mng-bot-v2 を Docker Compose でデプロイする手順

最終更新: 2026年2月23日

---

## 📋 概要

### 構成

```
XServer VPS (2GB RAM / 3vCPU / NVMe SSD 50GB)
└── Docker Compose
    ├── bot コンテナ   (Node.js 24 / pnpm start:bot)
    ├── web コンテナ   (Node.js 24 / pnpm start:web)
    └── volume        (SQLite 永続化 / storage/db.sqlite)
```

### 前提

- XServer VPS のアカウントおよびサーバー（2GB プラン推奨）を契約済み
- GitHub にリポジトリが push 済み
- Discord Bot アプリを作成済みでトークンを取得済み（[DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md) 参照）

---

## 🖥️ 1. XServer VPS の初期セットアップ

### 1-1. VPS の申し込みとOS選択

XServer VPS コントロールパネル（https://secure.xserver.ne.jp/xapanel/login/xvps/）にログインし、以下の設定でサーバーを申し込む。

| 項目           | 推奨設定                                                            |
| -------------- | ------------------------------------------------------------------- |
| プラン         | 2GB（月額 990円）                                                   |
| OS             | Ubuntu 24.04 LTS                                                    |
| アプリイメージ | **Docker**（専用イメージを選択するとDocker/Compose が初めから入る） |

> **Tip**: アプリイメージで「Docker」を選択すると、Docker と Docker Compose が初期インストール済みの状態で起動する。

### 1-2. SSH 接続

コントロールパネルで確認した IP アドレスに接続する。

```bash
# 初回は root で接続（パスワードはコントロールパネルで確認）
ssh root@<サーバーのIPアドレス>
```

### 1-3. 一般ユーザーの作成と SSH キー設定

`root` での運用はセキュリティリスクがあるため、専用ユーザーを作成する。

```bash
# ユーザー作成（例: deploy）
adduser deploy

# sudo 権限を付与
usermod -aG sudo deploy
usermod -aG docker deploy   # Docker をsudoなしで使えるようにする

# ユーザーを切り替えて確認
su - deploy
```

**ローカルPCで** SSH キーを生成し、サーバーへ登録する。

```bash
# ローカルPCで実行
ssh-keygen -t ed25519 -C "guild-mng-bot-deploy"

# 公開鍵をサーバーへコピー
ssh-copy-id deploy@<サーバーのIPアドレス>

# キーで接続できることを確認
ssh deploy@<サーバーのIPアドレス>
```

### 1-4. ファイアウォール設定

```bash
# UFW を有効化
sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp   # Web プロセスのポート（必要な場合のみ）
sudo ufw enable

# 確認
sudo ufw status
```

> **Note**: Bot プロセスは Discord のアウトバウンド接続のみ使用するため、特別なポート開放は不要。Web プロセスにブラウザからアクセスしない場合は 3000 番の開放も不要。

### 1-5. タイムゾーンを日本時間に設定

```bash
sudo timedatectl set-timezone Asia/Tokyo
timedatectl   # 確認
```

---

## 🐳 2. Docker / Docker Compose の確認

アプリイメージ「Docker」を選択した場合は既にインストール済み。確認だけ行う。

```bash
docker --version
docker compose version
```

手動でインストールが必要な場合（Ubuntu 24.04）:

```bash
# Docker 公式リポジトリを追加してインストール
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# deploy ユーザーを docker グループに追加（再ログインで有効化）
sudo usermod -aG docker deploy
```

---

## 📁 3. アプリケーションのデプロイ

### 3-1. リポジトリのクローン

```bash
# デプロイ先ディレクトリを作成
sudo mkdir -p /opt/guild-mng-bot
sudo chown deploy:deploy /opt/guild-mng-bot

# リポジトリをクローン
cd /opt/guild-mng-bot
git clone https://github.com/<あなたのユーザー名>/guild-mng-bot-v2.git .
```

### 3-2. 環境変数ファイルの作成

> **Note**: [セクション 8](#-8-github-actions-による自動デプロイcd) の GitHub Actions 自動デプロイ + Portainer 構成では、環境変数は **Portainer Stacks の Env タブ** で管理する。`.env` ファイルをサーバーに置く必要はない。
> 配置が必要なキーの一覧は [PORTAINER_SETUP.md セクション 5-2](PORTAINER_SETUP.md#5-2-環境変数を-env-タブで設定する) を参照すること。

**手動起動やローカルテスト用に .env が必要な場合:**

```bash
cp .env.example .env
nano .env
```

本番環境での `.env` の設定例（Portainer Env タブに入力する値と同じ）:

```dotenv
# 実行環境
NODE_ENV="production"

# Discord Bot 設定（必須）
DISCORD_TOKEN="YOUR_BOT_TOKEN_HERE"
DISCORD_APP_ID="YOUR_APPLICATION_ID_HERE"

# ロケール
LOCALE="ja"

# データベース（コンテナ内のパス）
DATABASE_URL="file:./storage/db.sqlite"

# Web サーバー
WEB_PORT=3000
WEB_HOST="0.0.0.0"

# JWT（Web API 認証用 / 本番環境では必須）
JWT_SECRET="ランダムな長い文字列をここに入れる"

# CORS（Web UI を外部公開する場合のみ設定）
# CORS_ORIGIN="https://your-domain.com"

# ログレベル
LOG_LEVEL="info"
```

**JWT_SECRET の生成方法:**

```bash
# ランダムな秘密鍵を生成する（Linuxで実行）
openssl rand -hex 32
```

> ⚠️ `.env` ファイルは絶対に Git に commit しないこと。`.gitignore` に含まれていることを確認する。

---

## 🐋 4. Dockerfile の確認

`Dockerfile` はリポジトリルートに含まれている。主な構成：

```dockerfile
# syntax=docker/dockerfile:1

# ─── ベースイメージ ───
FROM node:24-slim AS base
WORKDIR /app

# OS パッケージを最新化してセキュリティ脆弱性を修正
RUN apt-get update && apt-get upgrade -y --no-install-recommends && rm -rf /var/lib/apt/lists/*

# pnpm のインストール（package.json の packageManager に合わせてバージョン固定）
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# ─── 依存関係インストール ───
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ─── ビルド ───
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# prisma generate は tsc --build より前に実行すること（@prisma/client の型が必要なため）
RUN pnpm prisma generate
RUN pnpm run build

# ─── 本番イメージ ───
FROM node:24-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get upgrade -y --no-install-recommends && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# corepack キャッシュを /app 以下に設定（非root の app ユーザーが書き込み可能にするため）
ENV COREPACK_HOME=/app/.cache/corepack

# 本番依存のみインストール
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ビルド成果物・Prisma クライアントをコピー
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma
COPY prisma.config.ts ./

# ストレージ・ログ・corepack キャッシュディレクトリを作成
RUN mkdir -p /app/storage /app/logs /app/.cache/corepack

# セキュリティ: root 以外のユーザーで実行
RUN groupadd --system app && useradd --system --gid app app
RUN chown -R app:app /app
USER app

EXPOSE 3000
```

> **Note**: pnpm のバージョンは `package.json` の `packageManager` フィールドと一致させること。`pnpm@latest` と指定すると実行時バージョン不一致で `EACCES` エラーが発生する。

---

## 🐋 5. Docker Compose ファイルの確認

`docker-compose.prod.yml` はリポジトリルートに含まれている。

```yaml
services:
  bot:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    container_name: guild-mng-bot
    # 起動時に自動でDBマイグレーションを実行してからbotを起動する
    command: sh -c "pnpm prisma migrate deploy && node dist/bot/main.js"
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      DISCORD_TOKEN: ${DISCORD_TOKEN}
      DISCORD_APP_ID: ${DISCORD_APP_ID}
      DISCORD_GUILD_ID: ${DISCORD_GUILD_ID:-}
      LOCALE: ${LOCALE:-ja}
      DATABASE_URL: ${DATABASE_URL:-file:./storage/db.sqlite}
      LOG_LEVEL: ${LOG_LEVEL:-info}
    volumes:
      - sqlite_data:/app/storage
      - ./logs:/app/logs
    networks:
      - internal
    healthcheck:
      test: ["CMD", "node", "-e", "process.exit(0)"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

  web:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    container_name: guild-mng-web
    command: node dist/web/server.js
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      DATABASE_URL: ${DATABASE_URL:-file:./storage/db.sqlite}
      WEB_PORT: ${WEB_PORT:-3000}
      WEB_HOST: ${WEB_HOST:-0.0.0.0}
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: ${CORS_ORIGIN:-}
      LOG_LEVEL: ${LOG_LEVEL:-info}
    volumes:
      - sqlite_data:/app/storage
      - ./logs:/app/logs
    ports:
      - "127.0.0.1:3000:3000"
    networks:
      - internal
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

  portainer:
    image: portainer/portainer-ce:latest
    container_name: portainer
    restart: unless-stopped
    ports:
      - "9000:9000"
      - "9443:9443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    networks:
      - internal

volumes:
  sqlite_data:
    driver: local
  portainer_data:
    driver: local

networks:
  internal:
    driver: bridge
```

> **Note**: `bot` の `command` に `prisma migrate deploy` が含まれているため、コンテナ起動のたびにマイグレーションが自動実行される。GitHub Actions 側で別途マイグレーションを実行する必要はない。

---

## 🚀 6. 初回起動

### 6-1. Portainer の起動（初回のみ）

```bash
cd /opt/guild-mng-bot
docker compose -f docker-compose.prod.yml up portainer -d

# 起動確認
docker compose -f docker-compose.prod.yml ps portainer
```

ブラウザで `http://<サーバーのIPアドレス>:9000` にアクセスし、Portainer の初期設定を行う。
詳細な手順は **[PORTAINER_SETUP.md](PORTAINER_SETUP.md)** を参照。

### 6-2. Portainer Stack の作成

Portainer の初期設定後、**Stacks** から `docker-compose.prod.yml` を使って Stack を作成する。
環境変数（`DISCORD_TOKEN` 等）は Stack の **Env タブ** で設定する。

詳細は **[PORTAINER_SETUP.md セクション 3〜5](PORTAINER_SETUP.md#️-3-stack-の作成と環境変数管理)** を参照。

### 6-3. ログ確認

```bash
# 全サービスのログ（リアルタイム）
docker compose -f docker-compose.prod.yml logs -f

# Bot のみ
docker compose -f docker-compose.prod.yml logs -f bot
```

または Portainer の **Containers → guild-mng-bot → Logs** タブで確認できる。

---

## 🔄 7. アップデート手順（手動）

> **Note**: `main` への push で GitHub Actions が自動でコード取得・イメージビルド・デプロイを実行する。緊急時およびデバッグ用に手動手順を示す。

```bash
cd /opt/guild-mng-bot

# 最新コードを取得
git pull origin main

# イメージを再ビルド
docker compose -f docker-compose.prod.yml build bot

# コンテナを再起動（起動時に migrate が自動実行される）
docker compose -f docker-compose.prod.yml up -d bot

# 古いイメージを削除
docker image prune -f
```

---

## 🤖 8. GitHub Actions による自動デプロイ（CD）

`main` ブランチに push されると自動でテストを実行し、成功した場合のみサーバーへデプロイするパイプラインを構築する。
ワークフローファイル（`.github/workflows/deploy.yml`）はリポジトリルートに既に用意されている。

### 8-1. 仕組み

```
push to main
  └── CI: 型チェック・テスト（pnpm typecheck && pnpm test）
        └── CD:
              ├── SSH でVPSに接続
              │     ├── git pull origin main            ← 最新コードを取得
              │     └── docker compose build bot        ← イメージを再ビルド
              └── Portainer Webhook を POST
                    └── Portainer が docker compose up -d を実行
                          └── bot 起動時に prisma migrate deploy が自動実行
```

PR へのpushは CI のみ実行し、デプロイは行わない。

### 8-2. GitHub Secrets の設定

GitHub リポジトリ → **Settings → Secrets and variables → Actions** を開き、以下の **Repository Secrets** を登録する。

| Secret 名               | 内容                         | 例                                                           |
| ----------------------- | ---------------------------- | ------------------------------------------------------------ |
| `VPS_HOST`              | サーバーの IP アドレス       | `203.0.113.10`                                               |
| `VPS_USER`              | SSH ユーザー名               | `deploy`                                                     |
| `VPS_SSH_KEY`           | SSH 秘密鍵（ed25519 の全文） | `-----BEGIN OPENSSH...`                                      |
| `VPS_PORT`              | SSH ポート番号               | `22`                                                         |
| `PORTAINER_WEBHOOK_URL` | Portainer Stack Webhook URL  | `https://portainer.your-domain.com/api/stacks/webhooks/xxxx` |

**SSH 秘密鍵の確認方法（ローカルPCで実行）:**

```bash
cat ~/.ssh/id_ed25519
```

`-----BEGIN OPENSSH PRIVATE KEY-----` から `-----END OPENSSH PRIVATE KEY-----` までの全文を `VPS_SSH_KEY` に貼り付ける。

> **Note**: 秘密鍵はローカルPCからサーバーに接続できているキー（[1-3](#1-3-一般ユーザーの作成と-ssh-キー設定) で生成したもの）を使用する。

**PORTAINER_WEBHOOK_URL の取得方法:**

[PORTAINER_SETUP.md](PORTAINER_SETUP.md) のセクション **5-4. Webhook を取得して GitHub Secrets に登録する** の手順を参照する。

> **初回デプロイの順序**: Portainer Stack の作成（[PORTAINER_SETUP.md セクション 5](PORTAINER_SETUP.md#%EF%B8%8F-5-stack-の作成と環境変数管理)）→ Webhook URLを取得して `PORTAINER_WEBHOOK_URL` を登録 → `VPS_HOST`/`VPS_USER`/`VPS_SSH_KEY`/`VPS_PORT` を登録。この順序で設定すること。

### 8-3. デプロイ対象ブランチの確認

`.github/workflows/deploy.yml` のデフォルト設定：

```yaml
on:
  push:
    branches:
      - main # main への push で CI + CD を実行
  pull_request:
    branches:
      - main # main への PR で CI のみ実行
```

デプロイブランチを変更したい場合はこの部分を編集する。

### 8-4. 初回動作確認

1. `main` に push して GitHub Actions を起動する
2. GitHub リポジトリ → **Actions** タブで進捗を確認する
3. `Test` ジョブ → `Deploy to XServer VPS` ジョブの順に実行される
4. `Deploy to XServer VPS` がグリーンになればデプロイ完了

### 8-5. 失敗時のデバッグ

```bash
# サーバー上でログを確認
docker compose -f docker-compose.prod.yml logs --tail=50 bot
docker compose -f docker-compose.prod.yml logs --tail=50 web
```

GitHub Actions のログは **Actions タブ → 対象の実行 → 各ステップを展開** で確認できる。

> **Tips**:
>
> - テストが失敗すると Deploy ジョブは自動的にスキップされる。安全なデプロイのためテストを常にグリーンに保つこと。
> - SSH 接続エラーは VPS の UFW 設定（ポート 22 の許可）と `VPS_SSH_KEY` の内容を確認する。
> - `git pull` の際に認証が必要な場合はリポジトリを **Public** にするか、Deploy Key を追加する（後述）。

### 8-6. プライベートリポジトリの場合（Deploy Key）

リポジトリが **Private** の場合、サーバーからの `git pull` に追加設定が必要。

```bash
# サーバー上で DeployKey 用の ed25519 キーを生成
ssh-keygen -t ed25519 -C "guild-mng-bot-deploy-key" -f ~/.ssh/deploy_key -N ""

# 公開鍵を表示 → GitHub に登録する
cat ~/.ssh/deploy_key.pub
```

GitHub リポジトリ → **Settings → Deploy keys → Add deploy key** に公開鍵を追加し（Read access のみで可）、サーバーの `~/.ssh/config` に以下を追加する：

```
Host github.com
  IdentityFile ~/.ssh/deploy_key
  IdentitiesOnly yes
```

---

## ⚙️ 9. systemd による自動起動設定

サーバー再起動時に Docker Compose が自動で立ち上がるよう設定する。

```bash
sudo nano /etc/systemd/system/guild-mng-bot.service
```

```ini
[Unit]
Description=guild-mng-bot-v2
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/guild-mng-bot
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=0
User=deploy

[Install]
WantedBy=multi-user.target
```

```bash
# サービスを有効化
sudo systemctl daemon-reload
sudo systemctl enable guild-mng-bot
sudo systemctl start guild-mng-bot

# 状態確認
sudo systemctl status guild-mng-bot
```

---

## 📊 10. 運用コマンド早見表

```bash
# 起動
docker compose -f docker-compose.prod.yml up -d

# 停止
docker compose -f docker-compose.prod.yml down

# 再起動（片方だけ）
docker compose -f docker-compose.prod.yml restart bot
docker compose -f docker-compose.prod.yml restart web

# ログ確認（直近100行）
docker compose -f docker-compose.prod.yml logs --tail=100 bot

# コンテナ内でコマンド実行
docker compose -f docker-compose.prod.yml exec bot sh

# リソース使用状況
docker stats

# ディスク使用量
docker system df
```

---

## 🗄️ 11. （任意）Turso Cloud への移行

`bot` と `web` は同じ SQLite ファイルに同時アクセスするため、書き込みが競合する可能性がある。完全に解決したい場合は **Turso Cloud**（無料枠あり）を使う。

### Turso のセットアップ

```bash
# Turso CLI のインストール（ローカルPCで実行）
curl -sSfL https://get.tur.so/install.sh | bash

# ログイン
turso auth login

# DBを作成（東京リージョン）
turso db create guild-mng-bot --location nrt

# 接続URLとトークンを確認
turso db show guild-mng-bot
turso db tokens create guild-mng-bot
```

### `.env` の変更

```dotenv
# file: から libsql: に変更するだけ
DATABASE_URL="libsql://<db-name>-<org-name>.turso.io"
TURSO_AUTH_TOKEN="your-token-here"
```

> `@libsql/client` と `@prisma/adapter-libsql` は既にインストール済みのため、コード変更は不要。

---

## 📚 12. （発展）k3s による Kubernetes 構成

Docker Compose に慣れたら、同じ VPS 上で k3s（軽量 Kubernetes）を試すことができる。

### k3s のインストール

```bash
curl -sfL https://get.k3s.io | sh -

# 確認
sudo kubectl get nodes
```

### kubectl を deploy ユーザーで使えるようにする

```bash
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown deploy:deploy ~/.kube/config
```

### 基本的なリソース構成イメージ

```yaml
# deployment.yaml（概念例）
apiVersion: apps/v1
kind: Deployment
metadata:
  name: guild-mng-bot
spec:
  replicas: 1
  selector:
    matchLabels:
      app: guild-mng-bot
  template:
    spec:
      containers:
        - name: bot
          image: guild-mng-bot:latest
          command: ["node", "dist/bot/main.js"]
          envFrom:
            - secretRef:
                name: guild-mng-bot-secrets
```

> k3s は RAM 2 GB で動作するが、Bot + Web + k3s を同居させると余裕がなくなる場合がある。最初は Docker Compose で運用し、必要に応じて k3s へ移行することを推奨。

---

## 🔒 13. セキュリティチェックリスト

- [ ] SSH はパスワード認証を無効化し、キー認証のみにする
  ```bash
  sudo nano /etc/ssh/sshd_config
  # PasswordAuthentication no
  sudo systemctl restart sshd
  ```
- [ ] `.env` の `JWT_SECRET` を本番用のランダム値に設定済み
- [ ] `.env` を Git に commit していない（`.gitignore` 確認）
- [ ] UFW で不要なポートを閉じている
- [ ] `docker-compose.prod.yml` の `web` ポートを `127.0.0.1:3000` にバインドしている

---

## 🆘 トラブルシューティング

### Bot が起動しない

```bash
# ログでエラー内容を確認
docker compose -f docker-compose.prod.yml logs bot

# 環境変数が正しく読まれているか確認
docker compose -f docker-compose.prod.yml exec bot env | grep DISCORD
```

### `prisma migrate deploy` が失敗する

```bash
# storage ディレクトリの権限を確認
docker compose -f docker-compose.prod.yml exec bot ls -la /app/storage

# ボリュームを確認
docker volume ls
docker volume inspect guild-mng-bot_sqlite_data
```

### メモリ不足の兆候

```bash
# リアルタイムでリソースを確認
docker stats

# スワップを確認
free -h

# スワップを追加する場合（1GB）
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 📖 関連ドキュメント

- [DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md) — ローカル開発環境のセットアップ
- [ARCHITECTURE.md](ARCHITECTURE.md) — システム構成・アーキテクチャ解説
- [PORTAINER_SETUP.md](PORTAINER_SETUP.md) — Portainer で Docker コンテナを Web UI 管理する手順
- [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml) — CI/CD ワークフロー定義
