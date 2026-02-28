# テストガイドライン

> Testing Guidelines - テスト設計とベストプラクティス

最終更新: 2026年2月28日

---

## 📋 概要

このドキュメントは、ayasono におけるテスト設計方針・命名規則・実行方法を定義します。Vitest を前提に、回帰を素早く検知できるテスト運用を目的とします。

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
   - statements / functions / lines: **100%**
   - branches: **99%以上**（v8 async内部ブランチのアーティファクトにより 100% 初期は達成不可）

> 最新のテスト統計・カバレッジは [TEST_PROGRESS.md](../progress/TEST_PROGRESS.md) を参照

### import方針とテスト追従

- 実装方針は「`index.ts` を使わず、常に直接 import」
- そのためテストでは、**対象実装が実際に import しているパス**を `vi.mock()` する
  - 例: 実装が `@/shared/utils/logger` を参照しているなら、テストも同パスをモックする
- テストコードでも `index.ts` パスは参照せず、実体モジュールへ直接 import する
- 直接 import 化に追従していないモックは、回帰の主因になるため優先修正対象とする
- `bot/features` 内部実装のテストでは、featureローカル `..` / `index` を前提にしたモックを置かず、直接モジュールパスへ追従する

### カバレッジ運用メモ

- `index.ts` を撤廃することで、再エクスポート専用ファイル由来の `Functions` ノイズを削減できる
- 実体モジュールのテストに集約し、公開面の検証も同じ実体パスで行う
- **v8 async ブランチのアーティファクトに注意**: async 関数内の `|| null` / `??` 演算子を v8 がgeneratorに変換する際、実際には到達不可能な内部ブランチが生成される。テキストレポートでは "uncovered" と表示されるが LCOV では影響なし（実コードは 100% カバー済み）。vitest.config.ts の `thresholds.branches` は `99` に設定して吸収する
- **型専用ファイルの除外**: 実行可能なコードを持たない型定義・再エクスポートのみのファイルは `coverage.exclude` に追加する（v8 による誤検知回避）

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

### tDefault のモック（systemログアサーション）

`tDefault("system:xxx")` を呼び出す実装をテストする場合、`localeManager` モックにキーをそのまま返す実装を指定する：

```typescript
vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string, options?: Record<string, unknown>) =>
    options?.signal ? `${key}:${options.signal}` : key
  ),
  tGuild: tGuildMock,
}));

// アサーション例
expect(loggerMock.error).toHaveBeenCalledWith(
  "system:bump-reminder.panel_handle_failed",
  expect.any(Error),
);
```

キーがそのまま返るため、アサーションで `"system:xxx.yyy"` 形式の文字列を期待値として指定すればよい。

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

### src↔tests マッピング監査ルール（2026-02-21）

- 監査対象は **実行対象の TypeScript モジュール**（`src/**/*.ts`）とする
- 次は監査対象外とする
  - 宣言ファイル: `src/**/*.d.ts`
  - ビルド生成物・補助ファイル
- 理由: `.d.ts` は型宣言専用で Vitest 実行対象ではなく、`*.test.ts` と 1:1 対応を強制しないため
- 具体例: `src/shared/locale/i18next.d.ts` はマッピング残件として扱わない

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

## 🧭 E2Eフェーズ計画（2026-02-21）

### 優先シナリオ（上から実装）

1. **Bumpリマインダー基本フロー**

- `/bump-reminder-config` 設定
- 対象チャンネル投稿
- 予定時刻で通知送信

2. **AFK基本フロー**

- `/afk` 設定
- 対象イベントでAFK状態反映
- 解除条件で状態復帰

3. **VAC基本フロー**

- パネル操作でVC作成
- 退出後のクリーンアップ

### Discordモック方針

- Discord APIは E2E でもモックを使う
- DB はテスト専用ストレージ（隔離済み）を使い、ケースごとに初期化する
- 時刻依存は fake timers を使い、実時間待機を避ける

### 実行手順（最小）

1. `tests/e2e` に機能単位のシナリオファイルを追加
2. 1シナリオずつ `pnpm test` で回帰確認
3. 安定後に `pnpm test:coverage` でカバレッジ影響を確認

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

### `vitest.config.ts` の主な設定

- プロバイダ: `v8`（カバレッジ）
- テスト環境: `node`
- グローバル API: `globals: true`（`describe` / `it` / `expect` / `vi` が import 不要）
- セットアップファイル: `tests/setup.ts`
- タイムアウト: 10秒（デフォルト）
- `@/` エイリアス: `src/` に解決
- **カバレッジしきい値**: `{ branches: 99, functions: 100, lines: 100, statements: 100 }`

### モジュール解決エラー時の確認

```typescript
// vitest.config.ts
resolve: {
  alias: {
    "@": resolve(__dirname, "src"),
  },
}
```

---

## 📝 テストコメント規約

### 1. ファイル先頭コメント

**必須**: 全テストファイルの先頭 1 行目に `// tests/path/to/file.test.ts` 形式でファイルパスを記載する。

```typescript
// tests/unit/bot/features/foo/fooHandler.test.ts
```

### 2. describe ブロック前のコメント

**必須**: `describe` の直前に、そのグループが検証する内容（何を・どの観点で）を 1 行で記載する。

```typescript
// fooHandler の正常フロー・早期リターン・エラー委譲を検証
describe("bot/features/foo/fooHandler", () => {
```

ネストした `describe` には、サブグループの観点を同様に付与する。

```typescript
// 入力バリデーション系のケース
describe("validation", () => {
```

### 3. beforeEach / afterEach 前のコメント

**必須**: なぜそのセットアップ・後処理が必要かを記述する。

```typescript
// 各ケースでモック呼び出し記録をリセットし、テスト間の副作用を排除する
beforeEach(() => {
  vi.clearAllMocks();
});

// 偽タイマーを実タイマーに戻して後続テストへの影響を防ぐ
afterEach(() => {
  vi.useRealTimers();
});
```

### 4. it ブロック前のコメント（必須）

**必須**: `it` の直前に、そのテストが何を検証しているかを 1 行で記載する。
`it` 文字列と重複していてもよいが、**テスト対象の条件・制約・前提**を補足する形が望ましい。

```typescript
// Discord の embed フィールドは 1024 文字上限のため切り詰めを確認
it("truncates content over 1024 chars", () => { ... });

// panelMessageId が null の場合は finally での削除処理をスキップする
it("skips panel deletion when panelMessageId is null", () => { ... });

// getUserSetting: DB にレコードが存在する場合はその値を返すことを検証
it("returns saved value when record exists", () => { ... });
```

> **背景**: message-delete テスト追加時（2026-02-28）にコメントなしの `it()` ブロックが多数含まれており、一括修正が必要になった事例。再発防止のため全 `it()` でのコメントを必須にした。

### 5. 動的インポート / モジュールキャッシュ起因のセットアップ

`vi.resetModules()` + `vi.doMock()` を使う場合は、その理由を明記する。

```typescript
// シングルトンキャッシュをテスト間でリセットするため動的インポートを使用
async function loadModule() {
  vi.resetModules();
  vi.doMock("@/shared/config/env", () => ({ env: { ... } }));
  return import("@/bot/features/foo/fooService");
}
```

### コメントの書き方まとめ

| 場所 | 必須/推奨 | 内容 |
| --- | --- | --- |
| ファイル先頭 | 必須 | `// tests/path/to/file.test.ts` |
| `describe` 直前 | 必須 | 検証グループの目的（1行） |
| `beforeEach` / `afterEach` 直前 | 必須 | セットアップ・後処理の理由（1行） |
| `it` 直前 | **必須** | 検証内容・条件・制約の補足（1行） |
| 動的インポート関数 | 必須 | モジュールキャッシュリセットの理由（1行） |

---

## 🔗 関連ドキュメント

- [../progress/TEST_PROGRESS.md](../progress/TEST_PROGRESS.md): テスト実装進捗
- [../../TODO.md](../../TODO.md): 開発タスク一覧
- [../../README.md](../../README.md): プロジェクト概要
