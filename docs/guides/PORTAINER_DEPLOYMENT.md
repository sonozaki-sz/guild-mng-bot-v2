# Portainer デプロイガイド

> Portainer + GitHub Actions による guild-mng-bot-v2 のデプロイフロー詳細

最終更新: 2026年2月26日

---

## 📋 概要

このドキュメントでは、GitHub Actions が main ブランチへの push を検知してから Discord 通知を送信するまでの自動デプロイフロー全体を説明します。

初回セットアップ（VPS の初期設定・Portainer のインストール・スタックの作成）は **[XSERVER_VPS_SETUP.md](XSERVER_VPS_SETUP.md)** を参照してください。

### デプロイフロー全体図

```
main へ push / PR マージ
  └── [Test] 型チェック・vitest によるテスト
        └── [Deploy to Portainer] テスト成功時のみ
              ├── Docker イメージをビルドして GHCR にプッシュ
              ├── Portainer API で bot スタックを再デプロイ（最新イメージをプル）
              └── デプロイ後のコンテナ ID を取得（最大 30 秒待機）
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

| ジョブ           | 条件                         | 内容                                       |
| ---------------- | ---------------------------- | ------------------------------------------ |
| `test`           | push/PR すべて（close 除く） | pnpm typecheck + pnpm test                 |
| `deploy`         | main への push のみ          | GHCR イメージビルド + Portainer 再デプロイ |
| `notify-success` | deploy 成功時                | Discord に成功 Embed を送信                |
| `notify-failure` | test または deploy 失敗時    | Discord に失敗 Embed を送信                |

---

## 🔑 2. 必要な GitHub Secrets

| Secret 名                      | 内容                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `PORTAINER_HOST`               | VPS の IP アドレス（例: `220.158.17.101`）                                                                 |
| `PORTAINER_TOKEN`              | Portainer API キー（[XSERVER_VPS_SETUP.md § 6-1](XSERVER_VPS_SETUP.md#6-1-portainer-api-キーの取得) 参照） |
| `PORTAINER_STACK_ID`           | スタック ID（[XSERVER_VPS_SETUP.md § 6-2](XSERVER_VPS_SETUP.md#6-2-スタック-id-の取得) 参照）              |
| `PORTAINER_ENDPOINT_ID`        | エンドポイント ID（通常 `3`）                                                                              |
| `PORTAINER_CONTAINER_BASE_URL` | `http://220.158.17.101:9000/#!/3/docker/containers/`（末尾スラッシュあり）                                 |
| `DISCORD_WEBHOOK_URL`          | Discord の Webhook URL                                                                                     |

---

## 🚀 3. デプロイステップ詳細

### 3-1. Docker イメージのビルドと GHCR プッシュ

`docker/build-push-action` を使って `Dockerfile` の `runner` ステージをビルドし、以下のタグで GHCR にプッシュする。

| タグ                                          | 用途                             |
| --------------------------------------------- | -------------------------------- |
| `ghcr.io/sonozaki-sz/guild-mng-bot-v2:latest` | Portainer スタックが参照するタグ |
| `ghcr.io/sonozaki-sz/guild-mng-bot-v2:<SHA>`  | ロールバック用                   |

GitHub Actions のキャッシュ（`cache-from/cache-to: type=gha`）によりビルド時間を短縮している。

### 3-2. Portainer API によるスタック更新

1. Portainer API `GET /stacks/{id}/file` で現在の Compose ファイルを取得
2. Portainer API `GET /stacks/{id}` で現在の環境変数を取得
3. Portainer API `PUT /stacks/{id}?endpointId={id}` に `pullImage: true` を付けて PUT → GHCR の `:latest` をプルして bot を再起動

この仕組みにより **VPS への SSH 接続は不要**。Portainer API のポート（9000）のみ開放されていればデプロイできる。

### 3-3. コンテナ ID の取得（Discord 通知用リンク生成）

デプロイ後すぐには新しいコンテナが起動していない場合があるため、最大 30 秒（5 秒 × 6 回）の起動待ちループを実行する。

```bash
for i in $(seq 1 6); do
  CONTAINER_ID=$(curl -fsSL -G \
    -H "X-API-Key: ${PORTAINER_TOKEN}" \
    --data-urlencode 'filters={"label":["com.docker.compose.project=guild-mng","com.docker.compose.service=bot"]}' \
    "http://${PORTAINER_HOST}:9000/api/endpoints/${PORTAINER_ENDPOINT_ID}/docker/containers/json" \
    || true | jq -r '.[0].Id // empty')
  if [ -n "$CONTAINER_ID" ]; then break; fi
  sleep 5
done
echo "container_id=${CONTAINER_ID}" >> "$GITHUB_OUTPUT"
```

Docker Compose が自動付与する `com.docker.compose.project=guild-mng` と `com.docker.compose.service=bot` ラベルでコンテナを特定する。
コンテナ名検索と異なり、ラベルフィルターは Docker Proxy API エンドポイントで確実に動作する。

取得したコンテナ ID は `notify-success` / `notify-failure` ジョブに渡される。

### 3-4. Discord 通知の Portainer リンク

Discord の成功/失敗 Embed には以下の形式で Portainer コンテナ詳細ページへのリンクが付く。

```
PORTAINER_CONTAINER_BASE_URL + container_id
= http://220.158.17.101:9000/#!/3/docker/containers/<コンテナID>
```

---

## 🔄 4. ロールバック手順

デプロイ後に問題が発生した場合、Portainer から前のコンテナイメージに戻す。

### 4-1. Portainer UI でのロールバック

1. Portainer → **Stacks** → `guild-mng` → **Editor** タブ
2. イメージタグを `latest` から `<SHA>` に変更する
   ```yaml
   image: ghcr.io/sonozaki-sz/guild-mng-bot-v2:<前のSHA>
   ```
3. **Update the stack** をクリック

### 4-2. CLI でのロールバック

```bash
# GHCR からロールバック先イメージをプル
docker pull ghcr.io/sonozaki-sz/guild-mng-bot-v2:<SHA>

# Portainer スタックを再デプロイ（旧イメージでも展開可能）
# Portainer UI の Stacks → guild-mng → Editor でイメージタグを変更するのが簡単。
# CLI が必要な場合:
docker compose -f /opt/infra/docker-compose.infra.yml -p infra pull  # インフラ更新は不要
docker pull ghcr.io/sonozaki-sz/guild-mng-bot-v2:<SHA>
```

通常は Portainer UI の方が手軽。

---

## 🆘 5. トラブルシューティング

### デプロイジョブが失敗する

**Portainer API 呼び出しに失敗している場合:**

```bash
# サーバーから Portainer API の疎通確認
curl -H "X-API-Key: <YOUR_TOKEN>" http://220.158.17.101:9000/api/stacks
```

- ポート 9000 が UFW で開放されていることを確認（`sudo ufw status`）
- `PORTAINER_TOKEN` が有効かを Portainer UI → My account → Access tokens で確認

**GHCR への push に失敗している場合:**

- リポジトリの **Settings → Actions → General** で「Allow GitHub Actions to create and approve pull requests」が有効になっているか確認
- `GITHUB_TOKEN` の `packages: write` 権限が有効か確認（deploy ジョブの `permissions:` で設定済み）

### bot コンテナの起動後すぐクラッシュする

```bash
docker logs guild-mng-bot-v2 --tail 50
```

- `DISCORD_TOKEN` / `DISCORD_APP_ID` が Portainer スタックの Env タブに設定されているか確認
- `sqlite_data` ボリュームの権限エラーがないか確認

### Discord 通知の Portainer リンクが壊れている

- `PORTAINER_CONTAINER_BASE_URL` の末尾スラッシュを確認（`/containers/` で終わること）
- コンテナが 30 秒以内に起動しなかった場合、コンテナ ID が空になる → deploy ステップのログで起動待ちの状況を確認

---

## 📖 関連ドキュメント

- [XSERVER_VPS_SETUP.md](XSERVER_VPS_SETUP.md) — VPS・Portainer の初回セットアップ手順
- [ARCHITECTURE.md](ARCHITECTURE.md) — システム構成・アーキテクチャ解説
- [docker-compose.prod.yml](../../docker-compose.prod.yml) — 本番用 Compose 定義（bot スタック）
- [docker-compose.infra.yml](../../docker-compose.infra.yml) — Infra スタック定義（Portainer 用）
- [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml) — CI/CD ワークフロー定義
