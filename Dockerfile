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
RUN apt-get update && apt-get upgrade -y --no-install-recommends \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# corepack キャッシュを /app 以下に設定（app ユーザーが書き込み可能にするため）
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
