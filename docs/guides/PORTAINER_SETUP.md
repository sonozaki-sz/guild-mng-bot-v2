# Portainer セットアップガイド

> XServer VPS 上の Docker コンテナを Web UI で管理するための Portainer 導入手順

最終更新: 2026年2月22日

---

## 📋 概要

**Portainer CE**（Community Edition）は、Docker コンテナを Web ブラウザから GUI 操作できる管理ツール。
コンテナの起動・停止・再起動・ログ確認・環境変数の確認などが SSH なしで行える。

### 完成後の構成

```
XServer VPS
└── Docker Compose
    ├── bot コンテナ
    ├── web コンテナ
    ├── portainer コンテナ  ← 追加（管理 UI）
    └── portainer_data ボリューム（設定永続化）
```

### 前提

- [DEPLOYMENT_XSERVER.md](DEPLOYMENT_XSERVER.md) の手順でVPS・Docker・Docker Compose が設定済み
- `deploy` ユーザーが `docker` グループに属している
- SSH でサーバーに接続できる状態

---

## 🛡️ 1. ファイアウォールの設定

Portainer の Web UI はデフォルトでポート `9000`（HTTP）または `9443`（HTTPS）を使用する。
外部から直接アクセスする場合はポートを開放する。

```bash
# Portainer UI ポートを開放（HTTP）
sudo ufw allow 9000/tcp

# HTTPS を使う場合はこちらも追加
sudo ufw allow 9443/tcp

# 確認
sudo ufw status
```

> **セキュリティTips**:
>
> - `9000` を全公開するのではなく、自分のIPアドレスのみ許可する方が安全。
>   ```bash
>   sudo ufw allow from <自分のIPアドレス> to any port 9000
>   ```
> - VPN や SSH トンネル越しにアクセスする場合はポート開放不要（後述の [SSH トンネル経由でのアクセス](#オプション-ssh-トンネル経由でのアクセス) を参照）。

---

## 🐳 2. Portainer のインストール

### 方法A: 既存の docker-compose.prod.yml に追加する（推奨）

`docker-compose.prod.yml` に Portainer サービスを追加する。

```yaml
services:
  bot:
    # ... 既存の設定 ...

  web:
    # ... 既存の設定 ...

  portainer:
    image: portainer/portainer-ce:latest
    container_name: portainer
    restart: unless-stopped
    ports:
      - "9000:9000"
      - "9443:9443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock # Docker デーモンへのアクセス
      - portainer_data:/data # 設定・認証情報の永続化
    networks:
      - internal

volumes:
  sqlite_data:
    driver: local
  portainer_data: # ← 追加
    driver: local

networks:
  internal:
    driver: bridge
```

```bash
# 変更を反映して起動
cd /opt/guild-mng-bot
docker compose -f docker-compose.prod.yml up -d portainer

# 起動確認
docker compose -f docker-compose.prod.yml ps
```

### 方法B: 単独コンテナとして起動する

Docker Compose を使わず、コマンド一発でインストールする方法。

```bash
# Portainer データ用ボリューム作成
docker volume create portainer_data

# Portainer コンテナを起動
docker run -d \
  --name portainer \
  --restart=always \
  -p 9000:9000 \
  -p 9443:9443 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest

# 起動確認
docker ps | grep portainer
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

「Get Started」画面で **local** を選択する。これにより、同じサーバー上の Docker デーモンを管理できる。

---

## 🖥️ 4. Portainer の基本操作

### コンテナの管理

左メニュー → **Containers** でコンテナ一覧が表示される。

| 操作                     | 方法                                        |
| ------------------------ | ------------------------------------------- |
| コンテナを停止           | 対象コンテナにチェック → **Stop** ボタン    |
| コンテナを起動           | 対象コンテナにチェック → **Start** ボタン   |
| コンテナを再起動         | 対象コンテナにチェック → **Restart** ボタン |
| ログ確認                 | コンテナ名をクリック → **Logs** タブ        |
| コンテナ内でコマンド実行 | コンテナ名をクリック → **Console** タブ     |

### Stack（Docker Compose）の管理

左メニュー → **Stacks** で Docker Compose 単位での管理ができる。

| 操作                      | 方法                                      |
| ------------------------- | ----------------------------------------- |
| Stack を停止              | Stack 名をクリック → **Stop this stack**  |
| Stack を起動              | Stack 名をクリック → **Start this stack** |
| docker-compose.yml を編集 | Stack 名をクリック → **Editor** タブ      |
| 環境変数の確認            | Stack 名をクリック → **Env** タブ         |

> **Note**: 環境変数の管理は [セクション 5](#️-5-stack-の作成と環境変数管理) の手順で Portainer Stacks の Env タブから行う。GitHub Actions が Portainer Webhook を呼び出してデプロイし、コンテナの手動操作・ログ確認はこの Containers/Stacks ビューを使う。

---

## �️ 5. Stack の作成と環境変数管理

Portainer の **Stacks** 機能を使うと、`DISCORD_TOKEN` などの機密値を Portainer UI だけで管理できる。`.env` ファイルをサーバーに置く必要がなく、変数を変えたいときも SSH 不要で Portainer から更新できる。

### 仕組み

```
docker-compose.prod.yml の environment: に ${VAR} を記述
  └── Portainer Stack の Env タブに実際の値を登録
        └── デプロイ時に Portainer が ${VAR} を展開してコンテナへ注入
```

### 5-1. Stack を Git リポジトリから作成する（初回のみ）

> ⚠️ **前提**: Portainer の初期セットアップ（[セクション 3](#-3-初期設定ブラウザ)）が完了していること。

1. Portainer 左メニュー → **Stacks** → **Add stack**
2. 以下の項目を設定する:

| 項目                 | 設定値                                             |
| -------------------- | -------------------------------------------------- |
| Name                 | `guild-mng-bot`                                    |
| Build method         | **Git Repository**                                 |
| Repository URL       | `https://github.com/<ユーザー名>/guild-mng-bot-v2` |
| Repository reference | `refs/heads/main`                                  |
| Compose path         | `docker-compose.prod.yml`                          |
| Authentication       | プライベートリポジトリの場合のみ設定（後述）       |

> **プライベートリポジトリの場合**: GitHub の **Settings → Developer settings → Personal access tokens (classic)** で `repo` スコープのトークンを発行し、Username と Password（トークン）を入力する。

### 5-2. 環境変数を Env タブで設定する

**Add stack** 画面下部の **Environment variables** セクション（または既存 Stack の **Env** タブ）に以下のキーと値を入力する。

| キー             | 値の例                              | 必須 |
| ---------------- | ----------------------------------- | ---- |
| `DISCORD_TOKEN`  | `Bot_xxxxxxxxxxxx`                  | ✅   |
| `DISCORD_APP_ID` | `123456789012345678`                | ✅   |
| `LOCALE`         | `ja`                                | ✅   |
| `DATABASE_URL`   | `file:./storage/db.sqlite`          | ✅   |
| `NODE_ENV`       | `production`                        | ✅   |
| `JWT_SECRET`     | `openssl rand -hex 32 で生成した値` | ✅   |
| `WEB_PORT`       | `3000`                              | —    |
| `WEB_HOST`       | `0.0.0.0`                           | —    |
| `LOG_LEVEL`      | `info`                              | —    |
| `CORS_ORIGIN`    | `https://your-domain.com`           | —    |

入力後 **Deploy the stack** をクリックしてデプロイする。

> ⚠️ **セキュリティ**: Portainer の環境変数は `portainer_data` ボリューム内に保存される。Portainer 自体のアクセス制御（強力なパスワード・HTTPS 必須）を徹底すること。

### 5-3. 環境変数を後から変更する

1. 左メニュー → **Stacks** → `guild-mng-bot`
2. **Env** タブを開く
3. 変更したい変数の値を編集
4. 下部の **Update the stack** をクリック → コンテナが自動的に再起動される

### 5-4. Webhook を取得して GitHub Secrets に登録する

Portainer Webhook を使うと GitHub Actions がデプロイを Portainer に委譲できる（CLI から直接 `docker compose up` を叩く必要がなくなる）。

1. 左メニュー → **Stacks** → `guild-mng-bot`
2. **Deployment** タブ → **Webhook** トグルを **有効化**
3. 表示された URL をコピーする（例: `https://portainer.your-domain.com/api/stacks/webhooks/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）
4. GitHub リポジトリ → **Settings → Secrets and variables → Actions → New repository secret** に以下を登録する

| Secret 名               | 内容                         |
| ----------------------- | ---------------------------- |
| `PORTAINER_WEBHOOK_URL` | 上記でコピーした Webhook URL |

---

## 🚀 6. GitHub Actions との自動デプロイ連携

`main` ブランチへのマージ（push）で GitHub Actions が自動でテスト＆デプロイし、Portainer からリアルタイムに状態を確認できる。

### 全体フロー

```
PR マージ → main に push
  └── GitHub Actions（deploy.yml）
        ├── [Test] 型チェック・テスト実行
        └── [Deploy] テスト成功時のみ
              ├── SSH で VPS に接続
              │     ├── git pull origin main        ← 最新コードを取得
              │     └── prisma migrate deploy       ← DB マイグレーション
              └── Portainer Webhook を POST
                    └── Portainer が docker compose up -d --build を実行
                          └── Env タブの環境変数がコンテナへ注入される
```

### 前提: GitHub Secrets の設定

[DEPLOYMENT_XSERVER.md](DEPLOYMENT_XSERVER.md#8-2-github-secrets-の設定) の手順で以下の Secrets を登録済みであること。

| Secret 名               | 内容                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| `VPS_HOST`              | サーバーの IP アドレス                                                                       |
| `VPS_USER`              | SSH ユーザー名（例: deploy）                                                                 |
| `VPS_SSH_KEY`           | SSH 秘密鍵（ed25519 全文）                                                                   |
| `VPS_PORT`              | SSH ポート番号（例: 22）                                                                     |
| `PORTAINER_WEBHOOK_URL` | Portainer Stack Webhook URL（[5-4](#5-4-webhook-を取得して-github-secrets-に登録する) 参照） |

### Portainer での確認方法

デプロイ後、Portainer の **Containers** ページで以下を確認できる。

| 確認項目       | 場所                                       |
| -------------- | ------------------------------------------ |
| 起動時刻       | Containers → `guild-mng-bot` の Created 列 |
| ヘルスチェック | Containers → Status 列（`healthy` と表示） |
| 最新ログ       | コンテナ名クリック → Logs タブ             |

---

## 🔁 7. プロセス自動再起動（クラッシュ対応）

`docker-compose.prod.yml` に `restart: unless-stopped` を設定することで、プロセスがクラッシュ（異常終了）した際に Docker が自動的に再起動する。

| ポリシー         | 動作                                                |
| ---------------- | --------------------------------------------------- |
| `no`             | 再起動しない（デフォルト）                          |
| `always`         | 常に再起動（手動停止後も再起動する）                |
| `unless-stopped` | クラッシュ時のみ再起動（手動停止は維持） **← 採用** |
| `on-failure`     | 終了コードが非ゼロの場合のみ再起動                  |

`unless-stopped` を選ぶ理由は、Portainer から手動で `Stop` したときに再起動しないため。メンテナンス作業がしやすい。

```bash
# 現在の再起動ポリシーを確認
docker inspect guild-mng-bot | grep -A 3 'RestartPolicy'

# 再起動回数を確認（増え続けている場合はクラッシュループを疑う）
docker inspect guild-mng-bot | grep RestartCount
```

### Portainer でクラッシュループを検知する

左メニュー → **Containers** → `guild-mng-bot` の行で以下が確認できる。

- **Status** に `Restarting` が表示 → 再起動ループ中
- **Created** の時刻が更新され続けている → クラッシュを繰り返している

クラッシュの原因は **Logs** タブから確認する。

### ボリュームの管理

左メニュー → **Volumes** で SQLite データが入っているボリュームを確認できる。

| ボリューム名                | 内容                                |
| --------------------------- | ----------------------------------- |
| `guild-mng-bot_sqlite_data` | Bot・Web 共有の SQLite データベース |
| `portainer_data`            | Portainer 自身の設定・認証情報      |

### イメージの管理

左メニュー → **Images** で不要なイメージを削除できる（ディスク容量の節約）。

---

## 🔒 8. セキュリティ設定

### ドメイン vs IPアドレス

XServer VPS の固定 IPアドレスは基本的に変わらないが、プランの変更・サーバーの再契約・引っ越し時に変わることがある。
ドメインを使えば DNS の向き先を変えるだけで済むため、ドメイン運用を推奨する。

| 方法          | メリット                             | デメリット                                                             |
| ------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| IP 直アドレス | 設定不要                             | IP 変更時に全URLを変更する必要あり。Let's Encrypt 証明書が取得できない |
| 独自ドメイン  | 覚えやすい。HTTPS 証明書が取得できる | 年間数百円〜のドメイン費用                                             |

---

### 8-1. ドメインの取得と DNS 設定（XServer ドメイン）

**XServer ドメイン**（https://www.xdomain.ne.jp/）は XServer グループのドメイン登録サービス。XServer VPS と同じアカウントで管理でき、DNS 設定が同一コントロールパネルで完結するため連携がしやすい。

#### ドメインを取得する

1. [https://www.xdomain.ne.jp/](https://www.xdomain.ne.jp/) にアクセスし、希望のドメイン名を検索・申し込む
   - `.com` / `.net` / `.jp` 等が取得可能
   - XServer VPS と同じ XServer アカウントでログインすると管理が一元化される

#### DNS の A レコードを設定する

1. [XServer アカウント](https://secure.xserver.ne.jp/xapanel/login/xvps/) にログインする
2. **ドメイン** → 該当ドメインの **DNS 設定** を開く
3. **DNS レコード設定** で以下の A レコードを追加する

| レコード種別 | ホスト名（左側） | 内容（右側）        |
| ------------ | ---------------- | ------------------- |
| A            | `portainer`      | `<VPSのIPアドレス>` |
| A            | `@`（ルート）    | `<VPSのIPアドレス>` |

> **Note**: ホスト名に `portainer` を入力すると `portainer.your-domain.com` が作成される。`@` はドメイン自体（`your-domain.com`）を指す。

```bash
# DNS が正しく引けるか確認（反映まで最大 1〜24 時間）
dig portainer.your-domain.com
nslookup portainer.your-domain.com
```

---

### 8-2. Nginx のインストール

Portainer はデフォルトでポート `9000`（HTTP）を使用する。
Nginx をリバースプロキシとして前段に置き、`443`（HTTPS）でアクセスできるようにする。

```
ブラウザ
  └── HTTPS（443） → Nginx → HTTP（9000） → Portainer コンテナ
```

```bash
# Nginx のインストール
sudo apt-get update
sudo apt-get install -y nginx

# 起動・自動起動を有効化
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl status nginx
```

ファイアウォールに HTTP/HTTPS を追加する（80 は Let's Encrypt の認証に必要）。

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

---

### 8-3. Let's Encrypt SSL 証明書の取得（Certbot）

```bash
# Certbot のインストール
sudo apt-get install -y certbot python3-certbot-nginx

# 証明書を取得（ドメインを実際のものに変える）
sudo certbot --nginx -d portainer.your-domain.com

# 自動更新の確認（90日ごとに自動更新される）
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

> **Note**: 証明書を取得するには DNS が正しく引けている必要がある（`dig portainer.your-domain.com` で VPS の IP が返ること）。

---

### 8-4. Nginx リバースプロキシの設定

```bash
# Portainer 用の Nginx 設定ファイルを作成
sudo nano /etc/nginx/sites-available/portainer
```

以下の内容を貼り付ける（`portainer.your-domain.com` を実際のドメインに変更）。

```nginx
server {
    listen 80;
    server_name portainer.your-domain.com;
    # HTTP → HTTPS にリダイレクト
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name portainer.your-domain.com;

    # Let's Encrypt の証明書（certbot が自動で追記する場合は不要）
    ssl_certificate     /etc/letsencrypt/live/portainer.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/portainer.your-domain.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # セキュリティヘッダー
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;

    location / {
        proxy_pass         http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";  # WebSocket 対応
        proxy_read_timeout 90;
    }
}
```

```bash
# 設定を有効化
sudo ln -s /etc/nginx/sites-available/portainer /etc/nginx/sites-enabled/

# 設定の構文チェック
sudo nginx -t

# Nginx をリロード
sudo systemctl reload nginx
```

ブラウザで `https://portainer.your-domain.com` にアクセスして Portainer が表示されることを確認する。

#### HTTPS 化後のポート整理

Nginx が 443 でアクセスを受け付けるため、ポート `9000` は外部に公開しなくてよい。

```bash
# 9000 番ポートの公開を閉じる
sudo ufw delete allow 9000/tcp
sudo ufw delete allow 9443/tcp

# 確認（80, 443, 22 のみ残っていればOK）
sudo ufw status
```

`docker-compose.prod.yml` の Portainer ポートバインドもループバックに変更しておく。

```yaml
portainer:
  ports:
    - "127.0.0.1:9000:9000" # localhost からのみアクセス可（Nginx 経由）
```

```bash
cd /opt/guild-mng-bot
docker compose -f docker-compose.prod.yml up -d portainer
```

---

### 8-5. （オプション）SSH トンネル経由でのアクセス

ドメインを取得しない場合や、公開したくない場合は SSH トンネルでアクセスする方法もある。

```bash
# ローカルPCで実行
# ローカルの 9000 番ポート → サーバーの 9000 番ポートへトンネルを張る
ssh -L 9000:localhost:9000 deploy@<サーバーのIPアドレス> -N
```

上記コマンドを実行した状態で、ローカルブラウザから `http://localhost:9000` にアクセスすると Portainer が使える。

この場合 UFW での `9000` 番の開放は不要。

---

## 🔄 9. アップデート手順

Portainer 自体のアップデートは以下の手順で行う。

```bash
# 最新イメージを取得
docker pull portainer/portainer-ce:latest

# 方法A（docker-compose.prod.yml に追加している場合）
cd /opt/guild-mng-bot
docker compose -f docker-compose.prod.yml up -d --pull always portainer

# 方法B（単独コンテナの場合）
docker stop portainer
docker rm portainer
docker run -d \
  --name portainer \
  --restart=always \
  -p 9000:9000 \
  -p 9443:9443 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

> **Note**: `portainer_data` ボリュームを削除しない限り、設定・認証情報は引き継がれる。

---

## 📊 10. 運用コマンド早見表

```bash
# Portainer の起動確認
docker ps | grep portainer

# Portainer のログ確認
docker logs portainer

# Portainer の停止
docker stop portainer

# Portainer の起動
docker start portainer

# Portainer の再起動
docker restart portainer
```

---

## 🆘 トラブルシューティング

### ブラウザからアクセスできない

```bash
# コンテナが起動しているか確認
docker ps | grep portainer

# ポートが正しくバインドされているか確認
docker inspect portainer | grep -A 10 "Ports"

# UFW でポートが開いているか確認
sudo ufw status | grep 9000
```

### 「初回セットアップのタイムアウト」が発生した

```bash
# コンテナを再起動する
docker restart portainer
# または
docker compose -f docker-compose.prod.yml restart portainer
```

ブラウザのキャッシュをクリアして再度アクセスする。

### `/var/run/docker.sock` のパーミッションエラー

```bash
# docker グループに portainer コンテナからのアクセスを許可
sudo chmod 666 /var/run/docker.sock

# または deploy ユーザーが docker グループに属しているか確認
id deploy
groups deploy
```

---

## 📖 関連ドキュメント

- [DEPLOYMENT_XSERVER.md](DEPLOYMENT_XSERVER.md) — XServer VPS デプロイガイド（基本構成）
- [ARCHITECTURE.md](ARCHITECTURE.md) — システム構成・アーキテクチャ解説
