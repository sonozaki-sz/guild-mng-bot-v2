# デプロイガイド

> SSH + GitHub Actions による ayasono のデプロイフロー詳細

最終更新: 2026年2月28日（Portainer API → SSH デプロイに移行）

---

## 📋 概要

このドキュメントでは、GitHub Actions が main ブランチへの push を検知してから Discord 通知を送信するまでの自動デプロイフロー全体を説明します。

初回セットアップ（VPS の初期設定・Portainer のインストール・ファイル配置）は **[XSERVER_VPS_SETUP.md](XSERVER_VPS_SETUP.md)** を参照してください。

### デプロイフロー全体図

```
main へ push / PR マージ
  └── [Test] 型チェック・vitest によるテスト
        └── [Deploy to VPS] テスト成功時のみ
              ├── Docker イメージをビルドして GHCR にプッシュ
              ├── SSH で VPS に接続 → docker compose pull && up -d
              ├── [Discord通知（成功）] デプロイ成功時
              └── [Discord通知（失敗）] test または deploy 失敗時
```

---

## 🤖 1. GitHub Actions ワークフロー

ワークフロー定義は [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml)。

### トリガー条件

| イベント                                  | 実行されるジョブ                         |
| ----------------------------------------- | ---------------------------------------- |
| `main` / `develop` へ直接 push            | Test + Deploy（main のみ）+ Discord 通知 |
| `main` / `develop` への PR オープン・更新 | Test のみ                                |
| `main` への PR がマージ完了               | Test + Deploy + Discord 通知             |

### ジョブ構成

| ジョブ           | 条件                         | 内容                               |
| ---------------- | ---------------------------- | ---------------------------------- |
| `test`           | push/PR すべて（close 除く） | pnpm typecheck + pnpm test         |
| `deploy`         | main への push のみ          | GHCR イメージビルド + SSH デプロイ |
| `notify-success` | deploy 成功時                | Discord に成功 Embed を送信        |
| `notify-failure` | test または deploy 失敗時    | Discord に失敗 Embed を送信        |

---

## 🔑 2. 必要な GitHub Secrets

| Secret 名               | 内容                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `SSH_HOST`              | VPS の IP アドレス（例: `220.158.17.101`）                                               |
| `SSH_USER`              | SSH ユーザー名（例: `deploy`）                                                           |
| `SSH_PRIVATE_KEY`       | デプロイ用 SSH 秘密鍵（`-----BEGIN OPENSSH PRIVATE KEY-----` から末尾まで）              |
| `PORTAINER_HOST`        | VPS の IP アドレス（Discord 通知の Portainer リンク用）                                  |
| `PORTAINER_STACK_ID`    | Portainer スタック ID（Discord 通知のリンク用）                                          |
| `PORTAINER_ENDPOINT_ID` | Portainer エンドポイント ID（Discord 通知のリンク用）                                    |
| `DISCORD_WEBHOOK_URL`   | Discord の Webhook URL                                                                   |

> `PORTAINER_*` の3つはデプロイには使用しない。Discord 通知の Portainer 管理リンク生成のみに使用する。

---

## 🚀 3. デプロイステップ詳細

### 3-1. Docker イメージのビルドと GHCR プッシュ

`docker/build-push-action` を使って `Dockerfile` の `runner` ステージをビルドし、以下のタグで GHCR にプッシュする。

| タグ                                 | 用途               |
| ------------------------------------ | ------------------ |
| `ghcr.io/sonozaki-sz/ayasono:latest` | VPS が参照するタグ |
| `ghcr.io/sonozaki-sz/ayasono:<SHA>`  | ロールバック用     |

GitHub Actions のキャッシュ（`cache-from/cache-to: type=gha`）によりビルド時間を短縮している。

### 3-2. SSH によるデプロイ

`appleboy/ssh-action` を使って VPS に SSH 接続し、以下を実行する。

```bash
cd /opt/ayasono
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
docker compose -f docker-compose.prod.yml pull   # GHCR から :latest をプル
docker compose -f docker-compose.prod.yml up -d --remove-orphans
docker logout ghcr.io
```

### 3-3. VPS 上のファイル構成

```
/opt/ayasono/
├── docker-compose.prod.yml   ← compose 定義（リポジトリから手動配置）
├── .env                      ← 環境変数（VPS 上で直接管理、権限 600）
└── logs/                     ← ログ出力先（bot コンテナがマウント）
```

**環境変数の追加・変更は `/opt/ayasono/.env` を編集するだけでよい。** compose ファイルの変更は不要。

```bash
# VPS 上での .env 編集
vim /opt/ayasono/.env
# 変更後はコンテナを再起動
docker compose -f /opt/ayasono/docker-compose.prod.yml up -d
```

### 3-4. Discord 通知の Portainer リンク

Discord の成功/失敗 Embed には Portainer のスタック管理ページへのリンクが付く。

```
http://<PORTAINER_HOST>:9000/#!/<PORTAINER_ENDPOINT_ID>/docker/stacks/ayasono?id=<PORTAINER_STACK_ID>&type=2
```

デプロイ自体は SSH 経由で行うが、コンテナ管理 UI として Portainer は引き続き利用できる。

---

## 🔄 4. ロールバック手順

### 4-1. SSH でのロールバック

```bash
ssh deploy@220.158.17.101
cd /opt/ayasono

# docker-compose.prod.yml のイメージタグを一時的に変更
sed -i 's|:latest|:<旧SHA>|' docker-compose.prod.yml
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# ロールバック後、latest に戻す
sed -i 's|:<旧SHA>|:latest|' docker-compose.prod.yml
```

### 4-2. Portainer UI でのロールバック

1. Portainer → **Containers** → `ayasono-bot` → **Duplicate/Edit**
2. イメージタグを `:<SHA>` に変更して再デプロイ

---

## 🆘 5. トラブルシューティング

### デプロイジョブが失敗する

**SSH 接続に失敗している場合:**

- `SSH_HOST` / `SSH_USER` / `SSH_PRIVATE_KEY` が正しく登録されているか確認
- VPS で `deploy` ユーザーの `~/.ssh/authorized_keys` に GitHub Actions 用公開鍵が登録されているか確認

```bash
ssh deploy@220.158.17.101 "cat ~/.ssh/authorized_keys"
```

**GHCR へのプッシュ・プルに失敗している場合:**

- リポジトリの **Settings → Actions → General** で「Allow GitHub Actions to create and approve pull requests」が有効か確認
- `GITHUB_TOKEN` の `packages: write` 権限が有効か確認（deploy ジョブの `permissions:` で設定済み）

### bot コンテナの起動後すぐクラッシュする

```bash
docker logs ayasono-bot --tail 50
```

- `/opt/ayasono/.env` の各変数が正しく設定されているか確認
- `sqlite_data` ボリュームの権限エラーがないか確認

### Discord 通知の Portainer リンクが機能しない

- `PORTAINER_HOST` / `PORTAINER_ENDPOINT_ID` / `PORTAINER_STACK_ID` が正しく設定されているか確認

---

## 📖 関連ドキュメント

- [XSERVER_VPS_SETUP.md](XSERVER_VPS_SETUP.md) — VPS・Portainer の初回セットアップ手順
- [ARCHITECTURE.md](ARCHITECTURE.md) — システム構成・アーキテクチャ解説
- [docker-compose.prod.yml](../../docker-compose.prod.yml) — 本番用 Compose 定義
- [docker-compose.infra.yml](../../docker-compose.infra.yml) — Infra スタック定義（Portainer 用）
- [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml) — CI/CD ワークフロー定義
