# XServer VPS セットアップガイド

> XServer VPS に Docker + Portainer CE を導入し、ayasono を稼働させるための初回セットアップ手順

最終更新: 2026年2月28日（SSH デプロイ方式に移行）

---

## 📋 概要

このドキュメントでは、XServer VPS の初期設定から Docker・Portainer のインストール、スタックの初回登録までの手順を説明します。
**一度セットアップが完了すれば、以降のデプロイはすべて GitHub Actions が自動で行います。**

### 完成後の構成

```
XServer VPS (Ubuntu 24.04)
├── Docker Compose (Infra スタック: infra)       ← /opt/infra/ で管理
│   └── portainer コンテナ                       ← コンテナ管理 UI
└── Docker Compose (ayasono)                     ← /opt/ayasono/ で管理
    └── bot コンテナ  (ayasono-bot)              ← Discord Bot 本体
```

> Portainer 自体は `/opt/infra/docker-compose.infra.yml` で管理する **Infra スタック**として起動します。
> bot は `/opt/ayasono/` の compose ファイルで管理し、**GitHub Actions が SSH 経由でデプロイ**します。
> Portainer はコンテナの監視・管理 UI として使用します（デプロイには使用しません）。

### 必要なもの

| 項目              | 内容                               |
| ----------------- | ---------------------------------- |
| XServer VPS       | 2GB プラン推奨（Ubuntu 24.04 LTS） |
| GitHub リポジトリ | リポジトリへの管理者権限           |
| Discord Bot       | トークン + アプリケーション ID     |

---

## 🖥️ 1. VPS の初期設定

### 1-1. サーバーの申し込み

[XServer VPS](https://vps.xserver.ne.jp/) のサービスページからサーバーを申し込む。

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
ssh-keygen -t ed25519 -C "ayasono-deploy"
ssh-copy-id deploy@<サーバーのIPアドレス>

# キーで接続できることを確認
ssh deploy@<サーバーのIPアドレス>
```

以降の作業はすべて `deploy` ユーザーで行う。

### 1-4. ファイアウォール設定

```bash
sudo ufw allow OpenSSH
sudo ufw allow 9000/tcp   # Portainer UI + API
sudo ufw allow 9443/tcp   # Portainer HTTPS
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
      - "9443:9443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    logging:
      driver: json-file
      options:
        max-size: "5m"
        max-file: "3"

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

## 📦 5. ayasono のファイル配置（初回のみ）

### 5-1. ディレクトリとファイルの配置

```bash
sudo mkdir -p /opt/ayasono/logs
sudo chown deploy:deploy /opt/ayasono
```

ローカルマシンから `docker-compose.prod.yml` をサーバーにコピーする:

```bash
# ローカル PC から scp でコピー
scp docker-compose.prod.yml deploy@<サーバーのIPアドレス>:/opt/ayasono/
```

### 5-2. .env ファイルの作成

VPS 上で直接 `.env` を作成し、権限を制限する。

```bash
cat > /opt/ayasono/.env << 'EOF'
DISCORD_TOKEN=<Discord Developer Portal で取得>
DISCORD_APP_ID=<Discord Developer Portal で取得>
DISCORD_GUILD_ID=
NODE_ENV=production
DATABASE_URL=file:/storage/db.sqlite
LOCALE=ja
LOG_LEVEL=info
DISCORD_ERROR_WEBHOOK_URL=<Discord Webhook URL>
EOF
chmod 600 /opt/ayasono/.env
```

> ⚠️ `.env` はトークン等の機密情報を含むため、権限は必ず `600` にすること。
> 環境変数を追加・変更する場合は `.env` を編集するだけでよい（compose ファイルの変更は不要）。

### 5-3. GitHub Actions 用 SSH 鍵の設定

GitHub Actions が SSH でデプロイできるよう、専用の鍵ペアを生成して登録する。

```bash
# VPS 上で鍵ペアを生成
ssh-keygen -t ed25519 -C "github-actions-ayasono" -f ~/.ssh/ayasono_deploy -N ""

# 公開鍵を authorized_keys に追加
cat ~/.ssh/ayasono_deploy.pub >> ~/.ssh/authorized_keys

# 秘密鍵の中身を表示 → GitHub Secrets に登録する
cat ~/.ssh/ayasono_deploy
```

### 5-4. 起動確認

初回は手動で起動して動作を確認する。

```bash
cd /opt/ayasono
docker compose -f docker-compose.prod.yml up -d
docker logs ayasono-bot --tail 50
```

---

## 🔑 6. GitHub Secrets の登録

GitHub リポジトリ → **Settings → Secrets and variables → Actions → New repository secret** から以下を登録する。

| Secret 名               | 内容                                    | 取得方法                              |
| ----------------------- | --------------------------------------- | ------------------------------------- |
| `SSH_HOST`              | VPS の IP アドレス                      | コントロールパネルで確認              |
| `SSH_USER`              | SSH ユーザー名（例: `deploy`）          | 固定値                                |
| `SSH_PRIVATE_KEY`       | デプロイ用 SSH 秘密鍵                   | セクション 5-3 で生成した秘密鍵の中身 |
| `PORTAINER_HOST`        | VPS の IP アドレス                      | コントロールパネルで確認（通知用）    |
| `PORTAINER_STACK_ID`    | Portainer スタック ID                   | セクション 6-1 参照（通知用）         |
| `PORTAINER_ENDPOINT_ID` | Portainer エンドポイント ID（通常 `3`） | セクション 4-3 参照（通知用）         |
| `DISCORD_WEBHOOK_URL`   | Discord の Webhook URL                  | Discord チャンネル設定から取得        |

> `PORTAINER_*` の3つはデプロイには使用しない。Discord 通知の Portainer 管理リンク生成のみに使用する。

### 6-1. Portainer スタック ID の取得（通知リンク用）

1. Portainer 左メニュー → **Stacks** → `ayasono` をクリック（スタックが存在しない場合は不要）
2. ブラウザの URL から ID を確認する

```
http://220.158.17.101:9000/#!/3/docker/stacks/ayasono?id=1&type=2
                                                              ^
                                                 Stack ID = 1
```

この `id` の値を `PORTAINER_STACK_ID` に登録する。

---

## ✅ 7. 動作確認

すべての Secrets を登録したら、`main` ブランチに適当な修正を push して GitHub Actions が正常に動作するかを確認する。

```
GitHub Actions の確認手順:
1. GitHub リポジトリ → Actions タブ
2. 「CI / Deploy」ワークフローを選択
3. Test → Deploy to VPS → Discord通知（成功）の順でグリーンになることを確認
```

デプロイ後、登録した Discord チャンネルに成功通知が届き、Portainer でコンテナが `running` 状態になっていることを確認する。

---

## 🔄 8. 手動再起動・デバッグ

通常は GitHub Actions でデプロイされるが、緊急時は以下で対応する。

```bash
# コンテナの再起動
docker restart ayasono-bot

# ログ確認（リアルタイム）
docker logs ayasono-bot -f

# コンテナ内でコマンド実行
docker exec -it ayasono-bot sh
```

Portainer の **Containers → ayasono-bot** からも同じ操作が UI で行える。

---

## 📖 関連ドキュメント

- [DEPLOYMENT.md](DEPLOYMENT.md) — GitHub Actions によるデプロイフローの詳細
- [ARCHITECTURE.md](ARCHITECTURE.md) — システム構成・アーキテクチャ解説
- [docker-compose.prod.yml](../../docker-compose.prod.yml) — 本番用 Compose 定義（bot スタック）
- [docker-compose.infra.yml](../../docker-compose.infra.yml) — Infra スタック定義（Portainer 用）
- [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml) — CI/CD ワークフロー定義
