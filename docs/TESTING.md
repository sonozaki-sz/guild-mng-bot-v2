# テストコードドキュメント

## 概要

このプロジェクトでは、Jestとts-jestを使用してTypeScriptコードのテストを行っています。

## テストの実行方法

```bash
# すべてのテストを実行
pnpm test

# ウォッチモードでテストを実行
pnpm test:watch

# カバレッジレポート付きでテストを実行
pnpm test:coverage
```

## テストの構成

```
tests/
├── setup.ts                    # Jest グローバル設定
├── helpers/
│   └── testHelpers.ts         # テスト用ヘルパー関数
├── unit/                      # ユニットテスト
│   ├── services/
│   │   └── CooldownManager.test.ts
│   ├── errors/
│   │   ├── CustomErrors.test.ts
│   │   └── ErrorHandler.test.ts
│   ├── utils/
│   │   └── logger.test.ts
│   └── config/
│       └── env.test.ts
└── integration/               # 統合テスト
    └── database/
        └── GuildConfigRepository.test.ts
```

## 実装済みテスト

### ユニットテスト

#### 1. CooldownManager (88.37% カバレッジ)

- クールダウンのチェックと設定
- ユーザー別・コマンド別の独立管理
- リセット、クリア機能
- 自動クリーンアップ機能
- メモリリーク防止

#### 2. CustomErrors (100% カバレッジ)

- BaseError の基本機能
- 各カスタムエラークラス（ValidationError, DatabaseError, etc.）
- エラーの継承関係
- 運用エラーとプログラミングエラーの区別

#### 3. ErrorHandler (50.79% カバレッジ)

- エラーログ出力
- ユーザー向けメッセージ生成
- コマンドエラーハンドリング
- インタラクションエラーハンドリング

#### 4. Logger (58.62% カバレッジ)

- 各ログレベルのメソッド（info, error, warn, debug）
- 複雑なメッセージのハンドリング
- エラースタックトレースの記録
- i18n統合

#### 5. Environment Configuration (53.84% カバレッジ)

- 必須フィールドのバリデーション
- デフォルト値の設定
- 型変換（WEB_PORT）
- Enum バリデーション

### 統合テスト

#### 1. GuildConfigRepository (63.38% カバレッジ)

- 設定の取得、保存、更新、削除
- 存在確認
- ロケール管理
- 機能別設定（AFK, BumpReminder）

## テストヘルパー

`tests/helpers/testHelpers.ts` には以下のヘルパー関数が用意されています：

- `createMockUser()` - Discord ユーザーのモック作成
- `createMockGuild()` - Discord ギルドのモック作成
- `createMockMember()` - Discord メンバーのモック作成
- `createMockTextChannel()` - テキストチャンネルのモック作成
- `createMockInteraction()` - インタラクションのモック作成
- `wait()` - 非同期処理の待機
- `generateSnowflake()` - Discord ID生成
- `createTestGuildConfig()` - テスト用ギルド設定作成
- `expectError()` - エラーアサーション

## カバレッジ目標

- Statements: 70%
- Branches: 70%
- Functions: 70%
- Lines: 70%

## 今後のテスト拡張

以下の領域は今後テストを追加する予定です：

1. **Commands** - Discord コマンドのテスト
2. **Events** - Discord イベントハンドラーのテスト
3. **Locale** - 多言語対応のテスト
4. **Scheduler** - ジョブスケジューラーのテスト
5. **Web Routes** - Web API のテスト

## テスト実行時の注意事項

- テストは Node.js 24以上が必要です
- データベースはメモリ上で実行されます（`file::memory:?cache=shared`）
- 環境変数は `tests/setup.ts` で設定されます
- ログ出力はテスト中は抑制されています（エラーログのみ表示）

## モックとスタブ

主要な外部依存関係はモック化されています：

- **Winston (Logger)** - ログ出力をモック
- **Prisma Client** - データベース操作をモック
- **i18next** - 翻訳機能をモック
- **Discord.js** - Discord API呼び出しをモック

## トラブルシューティング

### タイムアウトエラー

デフォルトのタイムアウトは10秒に設定されています。必要に応じて調整してください。

### Worker process warning

CooldownManagerの定期クリーンアップによる警告です。テストは正常に動作しています。

### モジュール解決エラー

`jest.config.ts` の `moduleNameMapper` を確認してください。
