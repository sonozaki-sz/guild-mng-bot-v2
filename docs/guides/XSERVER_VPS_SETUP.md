# XServer VPS セットアップガイド

> XServer VPS に Docker + Portainer CE を導入し、guild-mng-bot-v2 を稼働させるための初回セットアップ手順

最終更新: 2026年2月26日

---

## 📋 概要

このドキュメントでは、XServer VPS の初期設定から Docker・Portainer のインストール、スタックの初回登録までの手順を説明します。
**一度セットアップが完了すれば、以降のデプロイはすべて GitHub Actions が自動で行います。**

### 完成後の構成

```
XServer VPS (Ubuntu 24.04)
├── Docker Compose (Infra スタック: infra)       ← /opt/infra/ で管理
│   └── portainer コンテナ                       ← 管理 UI + GitHub Actions CD の受け口
└── Docker Compose (Portainer スタック: guild-mng)
    └── bot コンテナ  (guild-mng-bot-v2)         ← Discord Bot 本体
```

> Portainer 自体は `/opt/infra/docker-compose.infra.yml` で管理する **Infra スタック**として起動します。
> bot スタック (`guild-mng`) は Portainer UI から管理します。

### 必要なもの

| 項目              | 内容                               |
| ----------------- | ---------------------------------- |
| XServer VPS       | 2GB プラン推奨（Ubuntu 24.04 LTS） |
| GitHub リポジトリ | リポジトリへの管理者権限           |
| Discord Bot       | トークン + アプリケーション ID     |

---

## 🖥️ 1. VPS の初期設定

### 1-1. サーバーの申し込み

[XServer VPS コントロールパネル](https://secure.xserver.ne.jp/xapanel/login/xvps/) からサーバーを申し込む。

| 項目           | 推奨設定                                              |
| -------------- | ----------------------------------------------------- |
| プラン         | 2GB（月額 990円）                                     |
| OS             | Ubuntu 24.04 LTS                                      |
| アプリイメージ | **Docker**（Docker + Compose が初期インストール済み） |

> アプリイメージで「Docker」を選択すると Docker / Docker Compose が最初から使える状態で起動する。

### 1-2. SSH 接続

コントロールパネルで確認した IP アドレスにログインする。

```bash
ssh root@<サーバーのIPアドレス>
```

### 1-3. 一般ユーザーの作成

`root` での常時運用はセキュリティリスクがあるため、専用ユーザーを作成する。

```bash
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy   # sudo なしで docker コマンドを使えるようにする
```

**ローカル PC** で SSH キーを生成してサーバーに登録する。

```bash
# ローカル PC で実行
ssh-keygen -t ed25519 -C "guild-mng-bot-deploy"
ssh-copy-id deploy@<サーバーのIPアドレス>

# キーで接続できることを確認
ssh deploy@<サーバーのIPアドレス>
```

以降の作業はすべて `deploy` ユーザーで行う。

### 1-4. ファイアウォール設定

```bash
sudo ufw allow OpenSSH
sudo ufw allow 9000/tcp   # Portainer UI + API
sudo ufw enable
sudo ufw status
```

> Bot はアウトバウンド接続のみ使用するため、追加のポート開放は不要。

### 1-5. タイムゾーン設定

```bash
sudo timedatectl set-timezone Asia/Tokyo
timedatectl
```

---

## 🐳 2. Docker のインストール確認

アプリイメージ「Docker」を選択した場合は既にインストール済みのため、確認だけ行う。

```bash
docker --version
docker compose version
```

手動インストールが必要な場合（Ubuntu 24.04）:

```bash
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
sudo usermod -aG docker deploy
```

---

## 🌐 3. Portainer CE の起動（Infra スタック）

Portainer は bot スタックとは独立した **Infra スタック** として管理する。
リポジトリに含まれる `docker-compose.infra.yml` を `/opt/infra/` に配置して起動する。

### 3-1. ディレクトリとファイルの配置

```bash
sudo mkdir -p /opt/infra
sudo chown deploy:deploy /opt/infra
```

ローカルマシンまたはリポジトリから `docker-compose.infra.yml` をサーバーにコピーする:

```bash
# ローカル PC から scp でコピー
scp docker-compose.infra.yml deploy@<サーバーのIPアドレス>:/opt/infra/
```

`docker-compose.infra.yml` の内容（リポジトリルートに同梱）:

```yaml
services:
  portainer:
    image: portainer/portainer-ce:latest
    container_name: portainer
    restart: unless-stopped
    ports:
      - "9000:9000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data

volumes:
  portainer_data:
```

### 3-2. Portainer の起動

```bash
docker compose -f /opt/infra/docker-compose.infra.yml -p infra up -d
```

起動確認:

```bash
docker ps | grep portainer
docker compose -f /opt/infra/docker-compose.infra.yml -p infra ps
```

---

## ⚙️ 4. Portainer の初期設定

ブラウザで `http://<サーバーのIPアドレス>:9000` にアクセスする。

> ⚠️ 初回アクセスは起動後 **5分以内** に完了させること。タイムアウトするとコンテナを再起動する必要がある。

### 4-1. 管理者アカウントの作成

| 項目     | 設定                         |
| -------- | ---------------------------- |
| Username | `admin`（任意）              |
| Password | 12文字以上の強力なパスワード |

### 4-2. 環境の追加

「Get Started」→ **local** を選択する。これで同一サーバー上の Docker を管理できる。

### 4-3. 環境 ID の確認

左メニュー → **Environments** → `local` をクリックし、ブラウザの URL から ID を確認する。

```
http://220.158.17.101:9000/#!/3/docker/dashboard
                                  ^
                              Endpoint ID = 3
```

この値を後で GitHub Secrets `PORTAINER_ENDPOINT_ID` に登録する。

---

## 📦 5. スタックの作成（初回のみ）

Portainer の **Stacks** 機能を使って bot を登録する。

### 5-1. ログ保存ディレクトリの作成

bot コンテナがホスト側にログを書き出すためのディレクトリを作成する。

```bash
sudo mkdir -p /opt/guild-mng-bot/logs
sudo chown deploy:deploy /opt/guild-mng-bot/logs
```

### 5-2. スタックを作成する

1. Portainer 左メニュー → **Stacks** → **Add stack**
2. **Name** に `guild-mng` を入力する
3. **Build method** は **Web editor** を選択する
4. 以下の内容を Web editor に貼り付ける:

```yaml
# guild-mng Portainer スタック用 compose ファイル
services:
  bot:
    image: ghcr.io/sonozaki-sz/guild-mng-bot-v2:latest
    container_name: guild-mng-bot-v2
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
      - /opt/guild-mng-bot/logs:/app/logs
    healthcheck:
      test: ["CMD", "node", "-e", "process.exit(0)"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"

volumes:
  sqlite_data:
```

5. **Environment variables** セクションに以下を入力する:

| キー               | 必須 | 値の例                          |
| ------------------ | ---- | ------------------------------- |
| `DISCORD_TOKEN`    | ✅   | Discord Developer Portal で取得 |
| `DISCORD_APP_ID`   | ✅   | Discord Developer Portal で取得 |
| `DISCORD_GUILD_ID` | —    | 空欄でグローバル登録            |
| `NODE_ENV`         | ✅   | `production`                    |
| `LOCALE`           | ✅   | `ja`                            |
| `DATABASE_URL`     | ✅   | `file:./storage/db.sqlite`      |
| `LOG_LEVEL`        | —    | `info`                          |

6. **Deploy the stack** をクリック

### 5-3. 起動確認

Portainer 左メニュー → **Containers** で `guild-mng-bot-v2` が `running` になっていることを確認する。

ログの確認:

```bash
docker logs guild-mng-bot-v2 --tail 50
```

---

## 🔑 6. GitHub Secrets の登録

GitHub リポジトリ → **Settings → Secrets and variables → Actions → New repository secret** から以下を登録する。

| Secret 名               | 内容                          | 取得方法                       |
| ----------------------- | ----------------------------- | ------------------------------ |
| `PORTAINER_HOST`        | VPS の IP アドレス            | コントロールパネルで確認       |
| `PORTAINER_TOKEN`       | Portainer API キー            | セクション 6-1 参照            |
| `PORTAINER_STACK_ID`    | スタックの ID                 | セクション 6-2 参照            |
| `PORTAINER_ENDPOINT_ID` | エンドポイント ID（通常 `3`） | セクション 4-3 参照            |
| `DISCORD_WEBHOOK_URL`   | Discord の Webhook URL        | Discord チャンネル設定から取得 |

### 6-1. Portainer API キーの取得

1. Portainer 右上のユーザーアイコン → **My account**
2. **Access tokens** → **Add access token**
3. Token 名を入力（例: `github-actions`）して作成
4. 表示されたトークンをコピーして `PORTAINER_TOKEN` に登録

> ⚠️ トークンはこの画面を閉じると再表示されない。必ずコピーしてから閉じること。

### 6-2. スタック ID の取得

1. Portainer 左メニュー → **Stacks** → `guild-mng` をクリック
2. ブラウザの URL から ID を確認する

```
http://220.158.17.101:9000/#!/3/docker/stacks/guild-mng?id=1&type=2
                                                              ^   ^
                                                 Stack ID = 1   type=2 は Compose スタック固定値
```

> `type` パラメータはスタック種別を表す固定値（`1`=Swarm / `2`=Compose / `3`=Kubernetes）。docker-compose を使う限り常に `2`。

この `id` の値を `PORTAINER_STACK_ID` に登録する。

---

## ✅ 7. 動作確認

すべての Secrets を登録したら、`main` ブランチに適当な修正を push して GitHub Actions が正常に動作するかを確認する。

```
GitHub Actions の確認手順:
1. GitHub リポジトリ → Actions タブ
2. 「CI / Deploy」ワークフローを選択
3. Test → Deploy to Portainer → Discord通知（成功）の順でグリーンになることを確認
```

デプロイ後、登録した Discord チャンネルに成功通知が届き、Portainer のスタックリンクが正しく機能することを確認する。

---

## 🔄 8. 手動再起動・デバッグ

通常は GitHub Actions でデプロイされるが、緊急時は以下で対応する。

```bash
# コンテナの再起動
docker restart guild-mng-bot-v2

# ログ確認（リアルタイム）
docker logs guild-mng-bot-v2 -f

# コンテナ内でコマンド実行
docker exec -it guild-mng-bot-v2 sh
```

Portainer の **Containers → guild-mng-bot-v2** からも同じ操作が UI で行える。

---

## 📖 関連ドキュメント

- [PORTAINER_DEPLOYMENT.md](PORTAINER_DEPLOYMENT.md) — GitHub Actions によるデプロイフローの詳細
- [ARCHITECTURE.md](ARCHITECTURE.md) — システム構成・アーキテクチャ解説
- [docker-compose.prod.yml](../../docker-compose.prod.yml) — 本番用 Compose 定義（bot スタック）
- [docker-compose.infra.yml](../../docker-compose.infra.yml) — Infra スタック定義（Portainer 用）
- [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml) — CI/CD ワークフロー定義
