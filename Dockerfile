# syntax=docker/dockerfile:1

# ─── ベースイメージ ───
FROM node:24-slim AS base
WORKDIR /app

# pnpm のインストール
RUN corepack enable && corepack prepare pnpm@latest --activate

# ─── 依存関係インストール ───
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ─── ビルド ───
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build
RUN pnpm prisma generate

# ─── 本番イメージ ───
FROM node:24-slim AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# 本番依存のみインストール
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ビルド成果物・Prisma クライアントをコピー
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
COPY prisma.config.ts ./

# ストレージ・ログディレクトリを作成
RUN mkdir -p /app/storage /app/logs

# セキュリティ: root 以外のユーザーで実行
RUN groupadd --system app && useradd --system --gid app app
RUN chown -R app:app /app
USER app

EXPOSE 3000
