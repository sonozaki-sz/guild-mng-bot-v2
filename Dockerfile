# syntax=docker/dockerfile:1

# ─── ベースイメージ ───
FROM node:24-slim AS base
WORKDIR /app

# OS パッケージを最新化してセキュリティ脆弱性を修正 + OpenSSL（Prisma が必要）
RUN apt-get update && apt-get upgrade -y --no-install-recommends \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# pnpm のインストール
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# ─── 依存関係インストール ───
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ─── ビルド ───
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm run build

# ─── 本番イメージ ───
FROM node:24-slim AS runner
WORKDIR /app

# OS パッケージを最新化してセキュリティ脆弱性を修正 + OpenSSL（Prisma が必要）
# gosu: entrypoint で root → node への安全な権限降格に使用
RUN apt-get update && apt-get upgrade -y --no-install-recommends \
    && apt-get install -y --no-install-recommends openssl gosu \
    && rm -rf /var/lib/apt/lists/*

# corepack キャッシュを /app 以下に設定（app ユーザーが書き込み可能にするため）
# ※ corepack prepare より前に設定しないと pnpm がデフォルト場所にキャッシュされ、
#   その後 COREPACK_HOME が変わると pnpm install 時に見つからず失敗する
ENV COREPACK_HOME=/app/.cache/corepack
RUN mkdir -p /app/.cache/corepack

RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# 本番依存のみインストール
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ビルド成果物・Prisma クライアントをコピー
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma
COPY prisma.config.ts ./

# 起動時権限修正スクリプトをコピー
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# ストレージ・ログディレクトリを作成（corepack キャッシュは上で作成済み）
RUN mkdir -p /app/storage /app/logs

# アプリファイルの所有権を node ユーザーに設定
# (マウントされるボリューム /app/storage、/app/logs は entrypoint で起動時に修正)
RUN chown -R node:node /app

# entrypoint が root → node へ権限降格するため USER は設定しない
# (gosu node で実行するため実質 node ユーザーで動作する)

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
