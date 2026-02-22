# Portainer セットアップガイド

> XServer VPS 上の Docker コンテナを Web UI で管理するための Portainer 導入手順

最終更新: 2026年2月23日

---

## 📋 概要

**Portainer CE**（Community Edition）は、Docker コンテナをブラウザから GUI 操作できる管理ツール。  
このプロジェクトでは **GitHub Actions の CD webhook の受け口** として使用する。

### 完成後の構成

```
XServer VPS
└── Docker Compose (docker-compose.prod.yml)
    ├── bot コンテナ        ← Discordボット本体
    ├── web コンテナ        ← Web API
    └── portainer コンテナ  ← 管理UI・CDのWebhook受信
```

### 前提

- [DEPLOYMENT_XSERVER.md](DEPLOYMENT_XSERVER.md) の手順でVPSのセットアップが完了している
- `/opt/guild-mng-bot` にリポジトリがクローン済み
- `/opt/guild-mng-bot/.env` が作成済み

---

## 🛡️ 1. ファイアウォールの設定

Portainer の Web UI にアクセスするためにポートを開放する。

```bash
# Portainer UI ポートを開放
sudo ufw allow 9000/tcp   # HTTP
sudo ufw allow 9443/tcp   # HTTPS

# 確認
sudo ufw status
```

> **セキュリティTips**: 自分のIPアドレスのみ許可する方が安全。
> ```bash
> sudo ufw allow from <自分のIPアドレス> to any port 9000
> ```

---

## 🐳 2. Portainer の起動

`docker-compose.prod.yml` に Portainer サービスが含まれているため、以下で起動できる。

```bash
cd /opt/guild-mng-bot

# Portainerのみ起動
docker compose -f docker-compose.prod.yml up portainer -d

# 起動確認
docker compose -f docker-compose.prod.yml ps portainer
```

---

## 🌐 3. 初期設定（ブラウザ）

### 3-1. 管理者アカウントの作成

ブラウザで以下にアクセスする。

```
http://<サーバーのIPアドレス>:9000
```

初回アクセス時に管理者パスワードの設定画面が表示される。

| 項目     | 内容                               |
| -------- | ---------------------------------- |
| Username | `admin`（変更可）                  |
| Password | 12文字以上の強力なパスワードを設定 |

> ⚠️ **重要**: 初回セットアップは起動後 **5分以内** に完了させること。タイムアウトするとコンテナの再起動が必要になる。

### 3-2. 環境の選択

「Get Started」画面で **local** を選択する。これにより同じサーバー上の Docker デーモンを管理できる。

---

## ⚙️ 4. Stack の作成と Webhook の取得

Portainer の **Stacks** 機能を使うと、GitHub Actions から Webhook 経由でコンテナを再起動させられる。

### 4-1. Stack を作成する

1. Portainer 左メニュー → **Stacks** → **Add stack**
2. 以下の項目を設定する：

| 項目                 | 設定値                                                          |
| -------------------- | --------------------------------------------------------------- |
| Name                 | `guild-mng-bot`                                                 |
| Build method         | **Repository**                                                  |
| Repository URL       | `https://github.com/sonozaki-sz/guild-mng-bot-v2`               |
| Repository reference | `refs/heads/main`                                               |
| Compose path         | `docker-compose.prod.yml`                                       |

> **プライベートリポジトリの場合**: **Authentication** にチェックを入れ、GitHubのPersonal Access Token（`repo` スコープ）を入力する。

3. **Environment variables** セクションに以下を入力する（`.env` ファイルと同じ内容）:

| キー               | 必須 | 例                                  |
| ------------------ | ---- | ----------------------------------- |
| `DISCORD_TOKEN`    | ✅   | `Bot_xxxxxxxxxxxx`                  |
| `DISCORD_APP_ID`   | ✅   | `123456789012345678`                |
| `DISCORD_GUILD_ID` | —    | （テストサーバーID / 空欄でグローバル） |
| `NODE_ENV`         | ✅   | `production`                        |
| `LOCALE`           | ✅   | `ja`                                |
| `DATABASE_URL`     | ✅   | `file:./storage/db.sqlite`          |
| `JWT_SECRET`       | ✅   | `openssl rand -hex 32` で生成した値 |
| `LOG_LEVEL`        | —    | `info`                              |

> **JWT_SECRET の生成**:
> ```bash
> openssl rand -hex 32
> ```

4. **Deploy the stack** をクリック → bot・web・portainer が起動する

### 4-2. Webhook を有効化して URL を取得する

1. 左メニュー → **Stacks** → `guild-mng-bot` をクリック
2. **Deployment** タブ → **Webhook** のトグルを **ON** にする
3. 表示された URL をコピーする

例: `http://220.158.17.101:9000/api/stacks/webhooks/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### 4-3. GitHub Secrets に登録する

GitHub リポジトリ → **Settings → Secrets and variables → Actions → New repository secret**

| Secret 名               | 値                           |
| ----------------------- | ---------------------------- |
| `PORTAINER_WEBHOOK_URL` | 4-2 でコピーした Webhook URL |

---

## 🤖 5. GitHub Actions との自動デプロイ連携

全 Secrets が揃った状態で `main` へのマージが起きると以下のフローで自動デプロイされる。

```
PR マージ → main に push
  └── GitHub Actions (deploy.yml)
        ├── [Test] 型チェック・vitest によるテスト実行
        └── [Deploy] テスト成功時のみ
              ├── SSH で VPS に接続
              │     ├── git pull origin main           ← 最新コードを取得
              │     └── docker compose build bot       ← イメージを再ビルド
              └── Portainer Webhook を POST
                    └── docker compose up -d を実行
                          └── bot起動時に prisma migrate deploy が自動実行
```

### 必要な GitHub Secrets 一覧

| Secret 名               | 内容                                                              |
| ----------------------- | ----------------------------------------------------------------- |
| `VPS_HOST`              | サーバーのIPアドレス（例: `220.158.17.101`）                      |
| `VPS_USER`              | SSHユーザー名（例: `deploy`）                                     |
| `VPS_SSH_KEY`           | SSH秘密鍵の全文（`-----BEGIN OPENSSH PRIVATE KEY-----` から末尾まで） |
| `VPS_PORT`              | SSHポート番号（例: `22`）                                         |
| `PORTAINER_WEBHOOK_URL` | セクション 4-2 で取得した Webhook URL                             |

---

## 🖥️ 6. Portainer の基本操作

### コンテナの管理

左メニュー → **Containers** でコンテナ一覧が表示される。

| 操作                     | 方法                                    |
| ------------------------ | --------------------------------------- |
| コンテナを停止           | 対象コンテナにチェック → **Stop**       |
| コンテナを起動           | 対象コンテナにチェック → **Start**      |
| コンテナを再起動         | 対象コンテナにチェック → **Restart**    |
| ログ確認                 | コンテナ名をクリック → **Logs** タブ    |
| コンテナ内でコマンド実行 | コンテナ名をクリック → **Console** タブ |

### Stack の管理

左メニュー → **Stacks** → `guild-mng-bot`

| 操作           | 方法                                        |
| -------------- | ------------------------------------------- |
| Stack を停止   | **Stop this stack**                         |
| Stack を起動   | **Start this stack**                        |
| 環境変数を変更 | **Env** タブ → 値を編集 → **Update the stack** |

---

## 🔒 7. （オプション）HTTPS化

IP直アドレスアクセスのままでも Webhook は動作するが、ドメインを持っている場合は HTTPS 化を推奨する。

### Nginx + Let's Encrypt での設定手順

```bash
# Nginx と Certbot のインストール
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

# ファイアウォールに HTTP/HTTPS を追加
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 証明書を取得（ドメインを実際のものに変える）
sudo certbot --nginx -d portainer.your-domain.com
```

Nginx の設定ファイル（`/etc/nginx/sites-available/portainer`）:

```nginx
server {
    listen 80;
    server_name portainer.your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name portainer.your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/portainer.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/portainer.your-domain.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass         http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/portainer /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

HTTPS化後は外部向けの 9000/9443 ポートを閉じられる：

```bash
sudo ufw delete allow 9000/tcp
sudo ufw delete allow 9443/tcp
```

---

## 🆘 トラブルシューティング

### ブラウザからアクセスできない

```bash
docker ps | grep portainer
sudo ufw status | grep 9000
```

### 初回セットアップのタイムアウト

```bash
docker compose -f docker-compose.prod.yml restart portainer
```

ブラウザのキャッシュをクリアして再アクセスする。

### Portainer Webhook が 404 を返す

Stack の **Deployment** タブで Webhook が有効になっているか確認する。
一度無効にして再度有効にすると URL が再生成される。

---

## 📖 関連ドキュメント

- [DEPLOYMENT_XSERVER.md](DEPLOYMENT_XSERVER.md) — XServer VPS デプロイガイド
- [ARCHITECTURE.md](ARCHITECTURE.md) — システム構成・アーキテクチャ解説
