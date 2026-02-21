# ドキュメント構成

> Guild Management Bot v2 のドキュメント一覧

最終更新: 2026年2月22日

---

## 📂 ディレクトリ構成

```
docs/
├── guides/          # 開発者向けガイド
├── specs/           # 機能仕様書
├── progress/        # 進捗管理
└── README.md        # このファイル
```

---

## 📖 ガイド (guides/)

開発者向けの実用的なガイドです。

### [ARCHITECTURE.md](guides/ARCHITECTURE.md)

システム全体の設計方針とアーキテクチャ概要。

**内容:**

- Bot / Web の2プロセス構成図
- ディレクトリ構成とモジュール境界の設計原則
- 依存方向と責務境界（bot / web / shared）
- Discord Gateway Intents の設定と理由
- Repository / Factory / DI パターンの解説
- スケジューラー設計（cron + setTimeout の使い分け）
- Web API エンドポイント一覧（/health, /ready, /api）と認証仕様
- エラーハンドリング設計（isOperational フラグ、各エラークラスの使い分け）
- TEST_MODE フラグの動作

**対象:** 開発者（特に新規参加者）

---

### [COMMANDS.md](guides/COMMANDS.md)

全スラッシュコマンドの完全なリファレンス。

**内容:**

- コマンド一覧
- 各コマンドの使用法、オプション、権限
- 実行例とエラーケース
- 多言語対応の詳細

**対象:** ユーザー、開発者、管理者

---

### [DEVELOPMENT_SETUP.md](guides/DEVELOPMENT_SETUP.md)

開発環境の構築とプロジェクト設定の詳細ガイド。

**内容:**

- 必要環境（Node.js、pnpm等）
- セットアップ手順
- Discord Bot作成方法
- 環境変数設定
- tsconfig.json、jest.config.ts の詳細解説
- VSCode設定の説明
- トラブルシューティング

**対象:** 新規開発者、環境構築担当者

---

### [DEPLOYMENT_XSERVER.md](guides/DEPLOYMENT_XSERVER.md)

XServer VPS へのデプロイ手順。

**内容:**

- XServer VPS 初期セットアップ（OS・SSH・UFW設定）
- Docker / Docker Compose によるコンテナ構成
- Dockerfile と docker-compose.prod.yml の設定
- DBマイグレーションと初回起動
- systemd による自動起動設定
- アップデート手順と運用コマンド
- Turso Cloud への移行手順（任意）
- k3s（Kubernetes）への発展構成（学習用）
- セキュリティチェックリストとトラブルシューティング

**対象:** 運用担当者、デプロイ担当者

---

### [TESTING_GUIDELINES.md](guides/TESTING_GUIDELINES.md)

テストの方針とガイドライン。

**内容:**

- テスト哲学（AAA パターン）
- テスト戦略（ユニット、インテグレーション、E2E）
- テストフォルダ構成
- Jestの使い方
- カバレッジ目標（70%）
- ベストプラクティス
- テストコメント規約（関数単位・処理ブロック単位）
- 時刻依存/環境変数依存テストの安定化パターン（fake timers・キー単位復元）

**対象:** 開発者、テスト担当者

---

### [IMPLEMENTATION_GUIDELINES.md](guides/IMPLEMENTATION_GUIDELINES.md)

実装時の詳細方針とコーディング規約。

**内容:**

- レイヤ責務（commands / features / shared）の分離ルール
- featureディレクトリ標準テンプレートと直接import運用ルール
- 実装時の基本方針（小さく安全な変更、型安全維持）
- コメント規約（ファイル先頭、関数、共用定数、処理ブロック）
- リファクタリング手順（定数切り出し、ルーター化、処理分割）
- 実装チェックリスト

**対象:** 開発者、レビュー担当者

---

### [I18N_GUIDE.md](guides/I18N_GUIDE.md)

多言語対応（国際化）の実装ガイド。

**内容:**

- i18nextの使用方法
- 言語リソースの追加方法
- コマンドローカライゼーションの自動生成
- 翻訳キーの命名規則
- 新しい言語の追加手順

**対象:** 開発者、翻訳担当者

---

## 📋 機能仕様書 (specs/)

各機能の詳細設計と実装仕様を記載したドキュメントです。

---

#### [BUMP_REMINDER_SPEC.md](specs/BUMP_REMINDER_SPEC.md)

Disboard/ディス速のBump検知と自動リマインダー機能。

**主要機能:**

- Bumpメッセージ検知
- 2時間後の自動通知
- メンション設定（ロール/ユーザー）
- `/bump-reminder-config` コマンド

---

#### [AFK_SPEC.md](specs/AFK_SPEC.md)

VCの非アクティブユーザーを手動でAFKチャンネルに移動する機能。

**主要機能:**

- `/afk` コマンドでユーザー移動
- `/afk-config` コマンドで設定管理
- AFKチャンネル設定

---

#### [VAC_SPEC.md](specs/VAC_SPEC.md)

VC自動作成機能 - トリガーチャンネル参加時に専用VCを自動作成・管理。

**主要機能:**

- トリガーチャンネル監視
- 専用VC自動作成・削除
- 操作パネル（AFK移動、設定変更）
- `/vac-config` コマンド

---

#### [STICKY_MESSAGE_SPEC.md](specs/STICKY_MESSAGE_SPEC.md)

メッセージ固定機能 - 指定メッセージをチャンネル最下部に自動再送信。

**主要機能:**

- `/sticky-message` コマンド（set、remove、list）
- 新規メッセージ投稿時の自動再送信
- チャンネル別管理

---

#### [MEMBER_LOG_SPEC.md](specs/MEMBER_LOG_SPEC.md)

メンバーログ機能 - メンバーの参加・脱退を記録。

**主要機能:**

- 参加・脱退時のEmbed通知
- メンバー情報表示（アカウント作成日、アバター等）
- `/member-log-config` コマンド

---

#### [MESSAGE_DELETE_SPEC.md](specs/MESSAGE_DELETE_SPEC.md)

メッセージ削除機能 - モデレーター向けメッセージ一括削除。

**主要機能:**

- `/message-delete` コマンド
- ユーザー指定、件数指定、チャンネル指定
- 権限チェック（MANAGE_MESSAGES）
- 削除ログ

---

#### [MESSAGE_RESPONSE_SPEC.md](specs/MESSAGE_RESPONSE_SPEC.md)

Embed形式の統一メッセージレスポンスシステム。

**主要機能:**

- 統一Embed生成関数（Success、Info、Warning、Error）
- 既存コマンドのメッセージ統一
- ErrorHandlerの統一

---

## 📊 進捗管理 (progress/)

プロジェクトの実装とテストの進捗状況を管理します。

### [IMPLEMENTATION_PROGRESS.md](progress/IMPLEMENTATION_PROGRESS.md)

機能実装の詳細な進捗状況。

**内容:**

- 実装状況サマリー（カテゴリ別、機能別）
- 実装完了項目の詳細
  - 環境構築・インフラ
  - コア機能
  - 実装済みコマンド・イベント・サービス
  - データベーススキーマ
- 未実装機能の概要
- 実装統計（ファイル数、コンポーネント数）

**対象:** プロジェクトマネージャー、開発者

---

### [TEST_PROGRESS.md](progress/TEST_PROGRESS.md)

テスト実装の詳細な進捗状況。

**内容:**

- テスト統計（総テスト数、カバレッジ）
- モジュール別カバレッジ詳細
- 実装済みテストの詳細
- 未実装テストの計画
- 今後のテストロードマップ

**対象:** QA担当者、開発者

---

## 🔗 関連ドキュメント

### プロジェクトルート

- [README.md](../README.md) - プロジェクト概要とクイックスタート
- [TODO.md](../TODO.md) - タスク管理・残件リスト

---

## 📝 ドキュメント作成・更新ガイドライン

### ガイド (guides/)

- **目的**: 実用的な手順、ベストプラクティス、How-to
- **対象読者**: 開発者、新規参加者
- **形式**: ステップバイステップ、コード例、スクリーンショット
- **更新頻度**: 機能追加時、開発フロー変更時

### 仕様書 (specs/)

- **目的**: 機能の詳細設計、実装仕様
- **対象読者**: 開発者、アーキテクト
- **形式**:
  - 📋 概要
  - 🎯 主要機能
  - 💾 データベース設計
  - 🏗️ 実装詳細
  - 🌐 多言語対応
  - 🚨 エラーハンドリング
  - ✅ テストケース
  - 📊 実装状況
  - 🔗 関連ドキュメント
- **更新頻度**: 機能実装前（仕様策定）、実装完了時

### 進捗管理 (progress/)

- **目的**: プロジェクトの現状把握、マイルストーン管理
- **対象読者**: プロジェクトマネージャー、チームメンバー
- **形式**: サマリーテーブル、詳細リスト、統計情報
- **更新頻度**: 週次、マイルストーン達成時

---

## 🎯 ドキュメント命名規則

- **ガイド**: `大文字_GUIDE.md` または `大文字.md` （例: `I18N_GUIDE.md`, `COMMANDS.md`）
- **仕様書**: `機能名_SPEC.md` （例: `VAC_SPEC.md`, `BUMP_REMINDER_SPEC.md`）
- **進捗管理**: `内容_PROGRESS.md` （例: `IMPLEMENTATION_PROGRESS.md`, `TEST_PROGRESS.md`）

---

**最終更新**: 2026年2月19日
