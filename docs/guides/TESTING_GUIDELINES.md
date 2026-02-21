# テストガイドライン

> Testing Guidelines - テスト設計とベストプラクティス

最終更新: 2026年2月21日

---

## 📋 概要

このドキュメントは、guild-mng-bot-v2 におけるテスト設計方針・命名規則・実行方法を定義します。Jest + ts-jest を前提に、回帰を素早く検知できるテスト運用を目的とします。

---

## 🎯 テスト方針

### 基本方針

1. **重要度に基づくテスト**
   - コアロジック（DB操作・スケジューラー・エラーハンドリング）を優先
   - UIレイヤー（コマンド・イベント）は主要フローを優先
2. **テストピラミッド**
   - ユニットテスト 70%
   - 統合テスト 25%
   - E2Eテスト 5%（次フェーズ）
3. **カバレッジ目標**
   - 全体 70%以上（Statements / Branches / Functions / Lines）

### 現状（2026-02-21）

- テストは全件成功（39 suites / 431 tests）
- `unit` / `integration` の配置を `src` 対称へ再編済み
- `e2e` は次フェーズで実施

---

## 🏗️ テスト設計

### AAA パターン

```typescript
test("should do something", () => {
  // Arrange
  const input = "test";

  // Act
  const result = functionUnderTest(input);

  // Assert
  expect(result).toBe("expected");
});
```

### モック戦略

- 外部依存（Discord API / DB / 外部サービス）はモック化
- 時刻依存は fake timers を優先
- ログ出力はモックし、テスト出力を安定化

### テスト命名規則

```typescript
describe("ClassName/FunctionName", () => {
  describe("methodName", () => {
    it("should [期待する動作] when [条件]", () => {
      // test
    });
  });
});
```

### 配置・ファイル名ルール（src対称化）

- テスト配置は `tests/unit` / `tests/integration` を維持する
- 各配下のディレクトリは `src` の構成に対称化する
- ファイル名は **camelCase固定にしない**。`src` 側のベース名に一致させる（`kebab-case` を含む）
- 単体テストは `*.test.ts`、統合テストは `*.integration.test.ts` を使う
- `src` 参照は原則 `@/` エイリアスを使う

---

## ▶️ テストの実行方法

```bash
# すべてのテスト
pnpm test

# ウォッチ実行
pnpm test:watch

# カバレッジ付き実行
pnpm test:coverage
```

実装状況は [../progress/TEST_PROGRESS.md](../progress/TEST_PROGRESS.md) を参照してください。

---

## 📁 テスト構成（再編後）

```text
tests/
├── setup.ts
├── tsconfig.json
├── helpers/
│   └── testHelpers.ts
├── unit/                               # src対称（unit）
│   ├── bot/
│   │   ├── commands/
│   │   ├── events/
│   │   ├── errors/
│   │   ├── features/
│   │   ├── handlers/
│   │   ├── services/
│   │   └── utils/
│   ├── shared/
│   │   ├── config/
│   │   ├── errors/
│   │   ├── features/
│   │   ├── locale/
│   │   ├── scheduler/
│   │   └── utils/
│   └── web/
│       ├── middleware/
│       └── routes/
├── integration/                        # src対称（integration）
│   ├── bot/
│   │   ├── events/
│   │   │   ├── interactionCreate.command.integration.test.ts
│   │   │   └── interactionCreate.routing.integration.test.ts
│   │   └── features/
│   │       └── bump-reminder/
│   │           ├── repositories/bumpReminderRepository.integration.test.ts
│   │           └── services/bumpReminderService.integration.test.ts
│   └── shared/
│       └── database/
│           └── repositories/guildConfigRepository.integration.test.ts
└── e2e/                                # 次フェーズ
```

---

## 🛠️ テストヘルパー

`tests/helpers/testHelpers.ts` の主要ヘルパー:

- `createMockUser()`
- `createMockGuild()`
- `createMockMember()`
- `createMockTextChannel()`
- `createMockInteraction()`
- `wait()`
- `generateSnowflake()`
- `createTestGuildConfig()`
- `expectError()`

---

## ⚙️ テスト設定

### `jest.config.ts` の主な設定

- プリセット: `ts-jest`
- テスト環境: `node`
- セットアップファイル: `tests/setup.ts`
- タイムアウト: 10秒（デフォルト）
- `moduleNameMapper` に `@/` エイリアスを設定

### モジュール解決エラー時の確認

```typescript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

---

## 📝 テストコメント規約

- `describe` 単位で「何を検証するか」を短く記述
- `beforeEach` / `afterEach` / 分岐前に「なぜ必要か」を記述
- 日本語で 1〜2 行、意図・前提・期待結果を中心に書く

---

## 🔗 関連ドキュメント

- [../progress/TEST_PROGRESS.md](../progress/TEST_PROGRESS.md): テスト実装進捗
- [../../TODO.md](../../TODO.md): 開発タスク一覧
- [../../README.md](../../README.md): プロジェクト概要
