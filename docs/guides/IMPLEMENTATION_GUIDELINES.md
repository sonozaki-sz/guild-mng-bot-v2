# 実装ガイドライン

> Implementation Guidelines - 実装方針とコーディング規約

最終更新: 2026年2月28日

---

## 📋 概要

### 目的

このドキュメントは、ayasono における実装時の設計方針、責務分離ルール、コメント規約、リファクタリング手順を定義します。機能追加・改修時に「どこへ何を書くか」を明確化し、レビューコストと将来の保守コストを下げることを目的とします。

### 対象読者

- プロジェクトの開発者
- コードレビュー担当者
- 新規参加者

### このドキュメントのスコープ

- 扱う内容: 実装時の分割方針、ファイル配置、命名/コメント規約、実装手順
- 扱わない内容: システム全体図、プロセス間関係、レイヤ境界の背景説明
- 全体設計は [ARCHITECTURE.md](ARCHITECTURE.md) を参照

### ドキュメント整合ルール

- `ARCHITECTURE.md` は「構成と責務境界」を記述する
- 本ガイドは「実装手順と実装規約」を記述する
- 同じテーマが重なる場合は、方針は `ARCHITECTURE.md`、実装詳細は本ガイドに寄せる

---

## 🎯 実装方針

### 基本方針

1. **責務分離を優先する**
   - `commands` はコマンド定義と入口処理に限定
   - 業務ロジックは `features` に配置
   - 共通ロジックは `shared` に配置

2. **既存仕様を壊さない**
   - 権限仕様、翻訳キー、レスポンス仕様は原則維持
   - リファクタでは挙動変更を含めない

3. **小さく安全に変更する**
   - 1PR 1目的を原則とする
   - 巨大ファイルは段階分割（定数→ルーター→サブ機能）で進める

4. **型安全を維持する**
   - `any` の導入は避ける
   - `pnpm run typecheck` を必ず通す

5. **ユーザー向けの応答文字列をすべて i18n 化する**
   - `editReply` / `followUp` / `reply` の `content`、ボタンラベル、セレクトメニューラベル・プレースホルダー、モーダルのラベル・プレースホルダー、Embedタイトル・説明文など、Discordユーザーの目に触れる文字列はすべて `tDefault("commands:...")` 経由にする
   - キーは `src/shared/locale/locales/ja/commands.ts` / `en/commands.ts` に定義し、両言語同時に追加する
   - 生文字列をハードコードすることを **禁止** する（英語圏ユーザー対応・将来の文言変更を容易にするため）

6. **ログメッセージを i18n 化する**
   - `logger.*()` の引数には生文字列を渡さず、`tDefault("system:...")` を使う
   - キーは `src/shared/locale/locales/ja/system.ts` / `en/system.ts` に定義する
   - DB操作は `executeWithDatabaseError` でラップし、成功時は `logger.debug`、失敗時はキー付きエラーメッセージを渡す

---

## 🏗️ レイヤ構成ルール

### `src/bot/commands`

- 許可:
  - SlashCommandBuilder の定義
  - options の受け取り
  - feature 層への委譲
  - 最終的な `execute` 入口
- 非推奨:
  - DB更新
  - 複雑な分岐ロジック
  - コンポーネント collector 制御
  - 長い業務処理

### `src/bot/features`

- 許可:
  - ユースケース実装
  - ルール判定
  - 状態更新
  - UI操作（必要な場合）
- 推奨構成:
  - `commands/`（コマンド別の実行処理）
  - `handlers/`（イベント境界）
  - `handlers/ui/`（Button/Select/Modal などUI境界）
  - `services/`（機能サービス）
  - `repositories/`（永続化アクセス）
  - `constants/`（定数・型ガード・変換ヘルパー）

### `src/shared`

- Bot/Web 両方で再利用する実装のみ配置
- `shared` から `bot` / `web` へ逆依存しない

### shared/features 経由の DB アクセス（2026-02-22 追加）

Bot 層のハンドラー・ユースケースが DB へアクセスする際は、必ず `src/shared/features/<feature>/` の `configService` 経由で行う。
リポジトリ実装を Bot 層のハンドラーから直接取得・呼び出すことを **禁止** する。

**正しいアクセス経路:**

```
src/bot/features/<feature>/handlers/**
  └─ getBotXxxConfigService()       ← botXxxDependencyResolver
       └─ XxxConfigService          ← src/shared/features/xxx/xxxConfigService.ts
            └─ IXxxRepository       ← src/shared/database/types.ts（インターフェース定義）
                 └─ XxxRepository   ← src/bot/features/xxx/repositories/xxxRepository.ts（実装）
```

**新機能追加時の必須手順:**

1. `src/shared/database/types.ts` に `XxxEntity` インターフェースと `IXxxRepository` インターフェースを定義
2. `src/shared/features/xxx/xxxConfigService.ts` を新規作成し `XxxConfigService` クラスと `createXxxConfigService` / `setXxxConfigService` / `getXxxConfigService` をエクスポート
3. `src/bot/features/xxx/repositories/xxxRepository.ts` で `IXxxRepository` を実装
4. `src/bot/services/botXxxDependencyResolver.ts` に `setBotXxxConfigService` / `getBotXxxConfigService` を追加
5. `src/bot/services/botCompositionRoot.ts` で `createXxxConfigService(repository)` を呼び出して登録
6. ハンドラーは `getBotXxxConfigService()` 経由のみでサービスを取得する

**違反例（禁止）:**

```typescript
// ❌ リポジトリを直接取得して操作
import { getBotXxxRepository } from "@/bot/services/botXxxDependencyResolver";
const repo = getBotXxxRepository();
await repo.findByChannel(channelId);
```

**正例:**

```typescript
// ✅ configService 経由でアクセス
import { getBotXxxConfigService } from "@/bot/services/botXxxDependencyResolver";
const service = getBotXxxConfigService();
await service.findByChannel(channelId);
```

> **背景**: sticky-message 機能の初期実装でハンドラーがリポジトリを直接参照していたため、後からリファクタリングが必要になった事例（2026-02-22 修正: commit `1c197d4`）。再発防止のためルール化した。

### feature ディレクトリ標準テンプレート

```text
src/bot/features/<feature-name>/
├── commands/       # 例: `*.execute.ts`, `*.constants.ts`, `*.autocomplete.ts`
├── handlers/
│   └── ui/
├── services/
├── repositories/
└── constants/
```

### `index.ts`（バレル）禁止ルール

- `src` 配下では `index.ts` を作成しない
- import は常に実体モジュールを直接参照する
  - 例: `../locale/localeManager`, `../utils/logger`, `../../database/types`
- 入口ファイルは `index.ts` ではなく役割名ファイルを使う
  - 例: `commands.ts`, `events.ts`, `apiRoutes.ts`, `handleInteractionCreate.ts`, `resources.ts`
- 参照先を変更した場合は、関連テストの `vi.mock()` / `import()` パスも実解決先へ追従する

### import / モック追従ルール（2026-02-22 追加）

- 実装で import 先を `index.ts` から直接モジュールへ変更した場合、関連テストの `vi.mock()` 対象も同じ実解決先へ更新する
- `vi.mock()` / `import()` は常に実体モジュールパスへ合わせる
- `src/bot/features/**` でも同方針を段階適用する
  - `../../../../shared/locale` のような shared barrel import は使わず、`.../shared/locale/localeManager` など直接モジュールを参照する
- `src/bot/features/**` では featureローカルの barrel import（`..`, `../..`, `../index` など）も禁止する
  - feature内部の実装同士は `constants/*` や `services/*` を直接参照する
- `src/bot/**` 全体でも shared barrel import（`../shared/locale`, `../../shared/utils` など）を禁止する
  - 例: `shared/locale/localeManager`, `shared/locale/commandLocalizations`, `shared/utils/logger`, `shared/utils/prisma`, `shared/database/types` を直接参照する
- 例外は設けず、テストコードでも `index.ts` 参照を使わない
- 変更時は以下を最小セットで確認する
  1.  `pnpm run typecheck`
  2.  `pnpm run lint`
  3.  影響テストの個別実行
  4.  必要に応じて `pnpm test:coverage`

---

## � Discord レスポンスパターン

### 必須ルール: ステータス通知は必ず Embed で返す

コマンドの実行結果として**エラー・警告・情報・成功**をユーザーに通知する際は、`editReply(string)` や `followUp({ content: string })` のようなプレーンテキスト返しを **禁止** し、必ず `src/bot/utils/messageResponse.ts` の Embed ユーティリティを使う。

```typescript
// ❌ 禁止: プレーンテキストでステータスを返す
await interaction.editReply(tDefault("commands:foo.errors.bar"));
await interaction.followUp({ content: tDefault("commands:foo.errors.bar") });

// ✅ 正しい: Embed ユーティリティを使う
await interaction.editReply({
  embeds: [createWarningEmbed(tDefault("commands:foo.errors.bar"))],
});
await interaction.followUp({
  embeds: [createWarningEmbed(tDefault("commands:foo.errors.bar"))],
  ephemeral: true,
});
```

> **背景**: message-delete 機能の初期実装でエラー返答にプレーンテキストを使用しており、後から Embed 化が必要になった（2026-02-28 修正）。再発防止のためルール化した。

### Embed ユーティリティ（messageResponse.ts）

ステータス通知（エラー・警告・情報・成功）には、`src/bot/utils/messageResponse.ts` のユーティリティ関数を使う。

| 関数                                            | ステータス | タイトル自動付与                   | カラー     |
| ----------------------------------------------- | ---------- | ---------------------------------- | ---------- |
| `createSuccessEmbed(description)`               | success    | `✅ 成功`                          | 緑         |
| `createInfoEmbed(description)`                  | info       | `ℹ️ 情報`                          | 青         |
| `createWarningEmbed(description)`               | warning    | `⚠️ 警告`                          | 黄         |
| `createErrorEmbed(description)`                 | error      | `❌ エラー`                        | 赤         |
| `createStatusEmbed(status, title, description)` | 任意       | 任意（絵文字は自動プレフィックス） | status依存 |

#### ⚠️ 絵文字の二重付加に注意

`create*Embed` 系は内部で `${emoji} ${title}` としてタイトルに絵文字を自動プレフィックスする。
そのため **description（本文）に渡すロケール文字列には絵文字を含めてはならない。**

```typescript
// ❌ NG: ロケール文字列に絵文字が含まれている → タイトルと二重になる
// ja/commands.ts: "foo.errors.bar": "⚠️ 条件が不正です"
await interaction.editReply({
  embeds: [createWarningEmbed(tDefault("commands:foo.errors.bar"))],
  // 結果: タイトル "⚠️ 警告"  + description "⚠️ 条件が不正です"  ← 二重
});

// ✅ OK: ロケール文字列に絵文字を含めない
// ja/commands.ts: "foo.errors.bar": "条件が不正です"
await interaction.editReply({
  embeds: [createWarningEmbed(tDefault("commands:foo.errors.bar"))],
  // 結果: タイトル "⚠️ 警告"  + description "条件が不正です"  ← 正常
});
```

#### 使い分け

| 用途                                                          | 手段                            | 必須/任意 |
| ------------------------------------------------------------- | ------------------------------- | --------- |
| バリデーションエラー・権限エラー等のフィードバック            | `create*Embed` ユーティリティ   | **必須**  |
| 情報・成功通知                                                | `create*Embed` ユーティリティ   | **必須**  |
| カスタムレイアウトが必要なドメイン固有Embed（削除サマリー等） | `new EmbedBuilder()` を直接使用 | 任意      |
| ダイアログ本文・確認メッセージ等（Embed でなくてよい）        | `content:` に文字列             | 任意      |

`new EmbedBuilder().setTitle(tDefault("..."))` の場合はユーティリティを経由しないため、ロケール文字列中に絵文字を含めても二重にはならない。

```typescript
// ✅ OK: setTitle に直渡し → ユーティリティの自動プレフィックスなし
// ja/commands.ts: "foo.embed.summary_title": "✅ 削除完了"
new EmbedBuilder().setTitle(tDefault("commands:foo.embed.summary_title"));
// 結果: "✅ 削除完了"（絵文字は1つ）
```

---

## �📂 命名規則

### ファイル名

| 対象                    | 規則       | 例                                      |
| ----------------------- | ---------- | --------------------------------------- |
| ソースファイル（基本）  | camelCase  | `guildConfig.ts`, `memberLogService.ts` |
| SlashCommand 系ファイル | kebab-case | `afk-config.ts`, `bump-reminder.ts`     |

- SlashCommand 系とは `src/bot/commands/` 配下のコマンドエントリファイルを指す
- それ以外の `features/`, `services/`, `handlers/`, `shared/` 等は camelCase を使う

### ディレクトリ名

- すべてのディレクトリ名は **kebab-case** を使う
  - 例: `bump-reminder/`, `member-log/`, `sticky-message/`

---

## 📝 コメント規約

実装コードの可読性とレビュー効率を揃えるため、以下を必須とします。

### 1. ファイル先頭コメント

- 必須: ファイル先頭で「何のファイルか」を明記する
- 例:

```ts
// src/bot/features/foo/fooService.ts
// Foo機能の業務ロジックを担当するサービス
```

### 2. 関数コメント

- 必須: 関数宣言（`function` / `export function` / `async function`）の先頭に「何をする関数か」を記載
- 必須: 引数がある場合は `@param`、戻り値を持つ場合は `@returns` を記載
- **必須: クラスの public メソッドにも同等の JSDoc を付与する**（`private` は推奨）
- アロー関数にも同等の意図コメントを付与することを推奨する
- **説明文だけの JSDoc ブロックは不完全とみなす。`@param`/`@returns` を必ずセットで記載すること**

```ts
// ❌ NG: 説明文のみで @param / @returns が抜けている
/**
 * ギルド設定を取得する
 */
async function getGuildConfig(guildId: string): Promise<GuildConfig | null> { ... }

// ✅ OK: @param / @returns をセットで記載
/**
 * ギルド設定を取得する
 * @param guildId 取得対象のギルドID
 * @returns ギルド設定（未設定時は null）
 */
async function getGuildConfig(guildId: string): Promise<GuildConfig | null> { ... }
```

> **背景**: message-delete 機能の実装時（2026-02-28）に、JSDoc の説明文は存在するが `@param`/`@returns` が抜けている関数が複数あり後から一括追加が必要になった事例。再発防止のためルール明示した。

### 3. 変数・定数コメント

- ローカル変数/ローカル定数: 原則コメント不要
- ファイル内/外で共用する変数・定数: 何の値かを記載
  - 例: コマンド名定数、CustomId接頭辞、制限値

### 4. 処理ブロックコメント

- 必須: 分岐・副作用・外部連携の手前に「処理の意図」を記載
- 推奨: 1〜2行で簡潔に書く
- 禁止: 逐語的で自明な説明

---

## 🔁 リファクタリング手順（推奨）

1. **定数切り出し**
   - コマンド名・選択値・共用IDを `*.constants.ts` に集約

2. **ルーター化**
   - `*.execute.ts` を入口専用にし、サブコマンドで分岐のみ行う

3. **処理分割**
   - サブコマンドごとに `*.enable.ts` / `*.disable.ts` のように分割

4. **共通ガード抽出**
   - 権限チェック等を `*.guard.ts` に集約

5. **検証**
   - `pnpm run typecheck`
   - 必要に応じて `pnpm test`

### 0ベース再監査チェック結果（2026-02-21）

- 責務分離の確認:
  - `commands` 入口の肥大化は大幅に縮小
  - 一部大型コマンド（例: bump-reminder remove-mention）は次回分割候補
- ディレクトリ/設計パターンの確認:
  - `bot|web -> shared` の依存方向を維持
  - feature内の公開境界は明示export方針を維持
- 命名の確認:
  - `stick`/`sticky` 混在は互換移行中として管理
- スリム化の確認:
  - 300行超のファイルは限定的（3ファイル）
- テスト容易性の確認:
  - DI経路は確保済み、テストの主課題は import/モック追随

### コメント規約の全量確認結果（2026-02-21）

- 対象: `src/**/*.ts`（175ファイル）
- ファイル先頭コメント不足: 0
- 関数コメント不足（関数宣言ベース）: 0
- コメント不足検出分は反映済みとして、以後は同手順で差分監査する
- **注意: 「説明文のみの JSDoc(`@param`/`@returns` なし)」も不備としてカウントする（2026-02-28 ルール改訂により追記）**

### src整備フェーズ運用順序

src整備スプリントでは、次の順序を固定する。

1. **再分析**
   - `typecheck` / `lint` を通し、責務境界・依存方向・公開面の逸脱がないことを確認する
2. **コメント規約反映**
   - `src/` 全体へファイル先頭コメント・関数コメント・意図コメントを適用する
3. **ドキュメント同期**
   - `ARCHITECTURE.md` と `IMPLEMENTATION_GUIDELINES.md` を実装実態へ合わせる
4. **TODO同期**
   - 完了条件と次フェーズの順序を TODO へ反映する
5. **テスト修正フェーズ移行**
   - 上記 1〜4 の完了後にのみ `pnpm test` 系を再開する

---

## ✅ 実装チェックリスト

- [ ] 変更責務は適切なレイヤに配置されている
- [ ] `commands` に業務ロジックが残っていない
- [ ] DB アクセスは `getBotXxxConfigService()` 経由（ハンドラーからリポジトリを直接呼ぶな）
- [ ] 新機能の `ConfigService` / `IXxxRepository` が `src/shared/` に定義されている
- [ ] ファイル名は命名規則に従っている（基本 camelCase / SlashCommand 系は kebab-case）
- [ ] ディレクトリ名は kebab-case になっている
- [ ] ファイル先頭コメントがある
- [ ] 関数宣言に JSDoc がある（説明文のみは不可。`@param` / `@returns` をセットで記載）
- [ ] クラスの public メソッドにも JSDoc（`@param` / `@returns` 含む）がある
- [ ] 共用定数に説明コメントがある
- [ ] 処理ブロックの意図コメントがある
- [ ] テストの全 `it()` ブロックの直前に `//` コメントがある
- [ ] `typecheck` が通る
- [ ] ユーザー向け応答文字列（`editReply` / `followUp` / `reply` の `content`・ボタンラベル・Embedタイトル/説明文等）に生文字列をハードコードしていない
- [ ] エラー・警告・情報・成功のステータス通知を `create*Embed` ユーティリティ（`createErrorEmbed` 等）で返しており、`editReply(string)` のようなプレーンテキスト返しを使っていない
- [ ] ロケールキーを ja/commands.ts と en/commands.ts の両方に追加している
- [ ] ログメッセージは `tDefault("system:...")` 経由になっている（生文字列を logger に渡していない）
- [ ] `create*Embed` ユーティリティに渡すロケール文字列に絵文字を含めていない（絵文字はタイトルに自動付与されるため二重になる）
- [ ] （src整備時）再分析 → コメント反映 → ドキュメント同期 → TODO同期の順序を守っている
- [ ] **Dockerfile / docker-compose / deploy.yml を変更した場合は `docker build --target runner .` でローカルビルドが通ることを確認している**（[詳細](DEPLOYMENT.md#️⃣-6-dockerデプロイ関連ファイルの変更ルール)）

---

## 🔗 関連ドキュメント

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [XSERVER_VPS_SETUP.md](XSERVER_VPS_SETUP.md)
- [DEPLOYMENT.md](DEPLOYMENT.md)
- [TESTING_GUIDELINES.md](TESTING_GUIDELINES.md)
