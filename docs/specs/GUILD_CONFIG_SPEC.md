# ギルド設定機能 - 仕様書

> Guild Config - ギルド全体の共通設定管理機能

最終更新: 2026年3月1日

---

## 📋 概要

### 目的

サーバー（ギルド）全体に適用される共通設定を管理するコマンドです。現状は言語（ロケール）設定を中心に、ギルド設定の確認・リセットを提供します。

### 主な用途

1. **言語設定**: Bot の応答言語をサーバー単位で日本語 / 英語に切り替え
2. **設定確認**: 現在のギルド設定（言語・各機能の有効状態＋詳細）をページ形式で確認
3. **設定リセット**: 確認ダイアログ付きでギルド設定を初期状態に戻す

### 権限

全サブコマンド: `ManageGuild`（サーバー管理権限）

---

## 🎯 主要機能

### `/guild-config` コマンド一覧

| サブコマンド | 説明                                     |
| ------------ | ---------------------------------------- |
| `set-locale` | Bot の応答言語をギルド単位で設定         |
| `view`       | 現在のギルド設定をページ形式で表示       |
| `reset`      | 確認ダイアログ付きでギルド設定をリセット |

---

## ⚙️ 設定コマンド

### `/guild-config`

#### サブコマンド

**1. `set-locale` - 言語設定**

```
/guild-config set-locale locale:ja
/guild-config set-locale locale:en
```

**オプション:**

| オプション名 | 型      | 必須 | 説明               |
| ------------ | ------- | ---- | ------------------ |
| `locale`     | choices | ✅   | 設定する言語を選択 |

**choices:**

- `ja` - 日本語
- `en` - English

**処理内容:**

1. `repository.updateLocale(guildId, locale)` で DB 更新
2. `localeManager.invalidateLocaleCache(guildId)` でキャッシュを即時無効化
3. 変更完了メッセージを返信

**成功メッセージ例（ja に設定した場合）:**

```
✅ サーバーの言語を「日本語」に設定しました。
```

---

**2. `view` - 現在の設定表示**

```
/guild-config view
```

**処理内容:**

- `repository.getConfig(guildId)` でギルド設定全体を取得
- 概要ページ（ページ 1）を Embed で表示
- ページ送りボタン（前へ / 次へ）＋ページ選択セレクトメニューを付与

---

#### ページ構成

各ページは Embed 1枚 + コンポーネント行（ボタン＋セレクトメニュー）で構成される。

**ページ一覧:**

| ページ番号 | タイトル            | 内容                             |
| ---------- | ------------------- | -------------------------------- |
| 1          | 🔧 ギルド設定 概要  | 言語 + 全機能の有効/無効一覧     |
| 2          | 👋 メンバーログ     | メンバーログの詳細設定           |
| 3          | 🔔 Bumpリマインダー | Bumpリマインダーの詳細設定       |
| 4          | 📌 メッセージ固定   | スティッキーメッセージの詳細設定 |
| 5          | ⚙️ VAC              | VAC の詳細設定                   |
| 6          | 🎤 VC募集           | VC募集の詳細設定                 |
| 7          | 😴 AFK              | AFK の詳細設定                   |
| 8          | 🗑️ メッセージ削除   | メッセージ削除の詳細設定         |

> ページ数は実装済み機能数に応じて増減する。

---

#### ページ 1: 概要

```
┌──────────────────────────────────────────┐
│ 🔧 ギルド設定 概要                        │
├──────────────────────────────────────────┤
│ 言語          日本語 (ja)                │
│                                          │
│ 機能状態                                 │
│ 👋 メンバーログ     ❌ 無効             │
│ 🔔 Bumpリマインダー ✅ 有効             │
│ 📌 メッセージ固定   ✅ 有効（3件）      │
│ ⚙️ VAC              ✅ 有効             │
│ 🎤 VC募集           ❌ 無効             │
│ 😴 AFK              ❌ 無効             │
│ 🗑️ メッセージ削除   ─（常時利用可）     │
├──────────────────────────────────────────┤
│ 🔧 ギルド設定 概要 • 1 / 8              │
└──────────────────────────────────────────┘
[ ◀ 前へ ]  [ 次へ ▶ ]   [ページを選択... ▼]
```

#### ページ 2〜8: 各機能の詳細

各機能の詳細ページは、対応する `*-config view` コマンドが生成する Embed をそのまま再利用する。

- 各機能の `buildViewEmbed(config, t)` 相当の関数を直接呼び出して Embed を取得
- ページ番号は Embed の **footer** に追記（例: `⚙️ VAC • 5 / 8`）
- コンポーネント行（ボタン＋セレクトメニュー）は概要ページと同じものを常に付与
- 各機能の view ロジックが変更されれば自動的にこちらにも反映される

**イメージ（VAC の場合）:**

```
[ /vac-config view と同じ Embed の内容 ]
─────────────────────────────────────
  ⚙️ VAC • 5 / 8
[ ◀ 前へ ]  [ 次へ ▶ ]   [ページを選択... ▼]
```

> 機能が未設定の場合は各機能の view と同様「未設定」表示を返す。

---

#### コンポーネント行

**行 1: ページ操作ボタン**

| ボタン | custom_id                | 状態制御                |
| ------ | ------------------------ | ----------------------- |
| ◀ 前へ | `guild_config_view_prev` | 1ページ目は `disabled`  |
| 次へ ▶ | `guild_config_view_next` | 最終ページは `disabled` |

**行 2: ページ選択セレクトメニュー**

- `custom_id`: `guild_config_view_select`
- `placeholder`: 「ページを選択...」
- 選択肢（ページ番号付きタイトルをそのままラベルに使用）:

| ラベル              | value        | emoji |
| ------------------- | ------------ | ----- |
| 1. ギルド設定 概要  | `overview`   | 🔧    |
| 2. メンバーログ     | `member_log` | 👋    |
| 3. Bumpリマインダー | `bump`       | 🔔    |
| 4. メッセージ固定   | `sticky`     | 📌    |
| 5. VAC              | `vac`        | ⚙️    |
| 6. VC募集           | `vc_recruit` | 🎤    |
| 7. AFK              | `afk`        | 😴    |
| 8. メッセージ削除   | `msg_delete` | 🗑️    |

---

#### インタラクションの処理

- ボタン・セレクトメニューのインタラクション発火元は `/guild-config view` を実行したユーザーのみ応答する（他ユーザーには ephemeral でエラー返却）
- 応答は `interaction.update()` で既存メッセージを書き換える
- タイムアウト（5分）後はコンポーネントを `disabled` に更新する

---

**3. `reset` - 設定リセット**

```
/guild-config reset
```

**処理内容:**

1. 確認ダイアログ（ボタン付き Embed）を ephemeral で送信
2. ユーザーが「確認」ボタンを押した場合のみ `repository.deleteConfig(guildId)` を実行
3. 完了メッセージに更新（「キャンセル」ボタン押下または60秒タイムアウトでキャンセル扱い）

**確認ダイアログ表示例:**

```
┌──────────────────────────────────────────────────┐
│ ⚠️ ギルド設定をリセットしますか？                 │
├──────────────────────────────────────────────────┤
│ 以下の設定がすべて削除されます。この操作は元に   │
│ 戻せません。                                     │
│                                                  │
│ • 言語設定                                       │
│ • VAC 設定                                       │
│ • VC募集設定                                     │
│ • メッセージ固定設定（全チャンネル）             │
│ • メンバーログ設定                               │
│ • Bumpリマインダー設定                           │
│ • AFK 設定                                       │
└──────────────────────────────────────────────────┘
[ ✅ リセットする ]  [ ❌ キャンセル ]
```

---

## 💾 データベーススキーマ

### GuildConfig（既存）

```prisma
model GuildConfig {
  guildId   String   @id
  locale    String   @default("ja") // 設定対象フィールド
  // ...機能別JSONフィールド
}
```

`locale` フィールドは Prisma スキーマ・`IBaseGuildRepository` インターフェース・`LocaleManager` のいずれも既に実装済み。本機能は **コマンド層のみ新規実装**となる。

---

## 🔄 処理フロー

### set-locale フロー

```
1. /guild-config set-locale 実行
   ↓
2. ManageGuild 権限チェック
   ↓
3. repository.updateLocale(guildId, locale)
   ↓
4. localeManager.invalidateLocaleCache(guildId)
   （次回 translate/getGuildT 呼び出し時に DB から再取得される）
   ↓
5. 完了メッセージを返信（ephemeral）
```

### view フロー

```
1. /guild-config view 実行
   ↓
2. ManageGuild 権限チェック
   ↓
3. repository.getConfig(guildId)
   （レコードが存在しない場合はデフォルト設定として表示）
   ↓
4. 各機能フィールドをパースして各ページ用データを生成
   ↓
5. ページ 1（概要）の Embed + ボタン + セレクトメニューを ephemeral で返信
   ↓
6. ボタン / セレクトメニューのインタラクション受信
   ↓
7. 対応ページの Embed に interaction.update() で書き換え
   ↓
8. 5分タイムアウト後にコンポーネントを disabled 化
```

### reset フロー

```
1. /guild-config reset 実行
   ↓
2. ManageGuild 権限チェック
   ↓
3. 確認ダイアログ Embed + ボタンを ephemeral で送信
   ↓
4a. 「リセットする」ボタン押下
    → repository.deleteConfig(guildId)
    → 完了メッセージに update()
4b. 「キャンセル」ボタン押下 / 60秒タイムアウト
    → キャンセルメッセージに update()
```

---

## 🌐 多言語対応（i18next）

### サポート言語

| locale | 言語    |
| ------ | ------- |
| `ja`   | 日本語  |
| `en`   | English |

### ローカライゼーションキー（`commands` ネームスペース）

```ts
// コマンド説明
"guild-config.description";
"guild-config.set-locale.description";
"guild-config.set-locale.locale.description";
"guild-config.view.description";
"guild-config.reset.description";

// set-locale レスポンス
"guild-config.set-locale.success"; // サーバーの言語を「{{locale}}」に設定しました。

// view Embed
"guild-config.view.title"; // ギルド設定 概要
"guild-config.view.field.locale"; // 言語
"guild-config.view.field.features"; // 機能状態
"guild-config.view.footer"; // {{current}} / {{total}}
"guild-config.view.button.prev"; // ◀ 前へ
"guild-config.view.button.next"; // 次へ ▶
"guild-config.view.select.placeholder"; // ページを選択...
"guild-config.view.page.vac"; // VAC（VC自動作成）
"guild-config.view.page.vc_recruit"; // VC募集
"guild-config.view.page.sticky"; // メッセージ固定
"guild-config.view.page.member_log"; // メンバーログ
"guild-config.view.page.msg_delete"; // メッセージ削除
"guild-config.view.page.bump"; // Bumpリマインダー
"guild-config.view.page.afk"; // AFK
"guild-config.view.other_user_error"; // このパネルを操作できるのは実行者のみです。

// reset レスポンス
"guild-config.reset.confirm.title"; // ギルド設定をリセットしますか？
"guild-config.reset.confirm.description"; // 以下の設定がすべて削除されます...
"guild-config.reset.button.confirm"; // ✅ リセットする
"guild-config.reset.button.cancel"; // ❌ キャンセル
"guild-config.reset.success"; // ギルド設定をリセットしました。
"guild-config.reset.cancelled"; // リセットをキャンセルしました。
```

---

## ✅ 実装チェックリスト

### コマンド実装

- [ ] `src/bot/commands/guild-config.ts`（`/guild-config` コマンド定義）
  - [ ] `set-locale` サブコマンド
  - [ ] `view` サブコマンド
  - [ ] `reset` サブコマンド
- [ ] `src/bot/handlers/` または `features/guild-config/` にインタラクションハンドラ
  - [ ] ページ送りボタン（`guild_config_view_prev` / `guild_config_view_next`）
  - [ ] ページ選択セレクトメニュー（`guild_config_view_select`）
  - [ ] リセット確認ボタン（`guild_config_reset_confirm` / `guild_config_reset_cancel`）

### ロケールリソース更新

- [ ] `src/shared/locale/locales/ja/commands.ts`（`guild-config.*` キー追加）
- [ ] `src/shared/locale/locales/en/commands.ts`（`guild-config.*` キー追加）

### テスト

- [ ] `tests/unit/bot/commands/guild-config.test.ts`
  - [ ] `set-locale`: 正常系・権限エラー・無効ロケール
  - [ ] `view`: 概要ページ生成・各機能詳細ページ生成・設定なし（デフォルト表示）
  - [ ] `view` インタラクション: ページ送り・セレクト選択・他ユーザー操作エラー・タイムアウト
  - [ ] `reset`: 確認ダイアログ表示・確認実行・キャンセル・タイムアウト

---

## 📝 設計メモ

### `view` のページ管理

各ページの内容は `buildPage(pageIndex, config)` のような純粋関数で生成し、インタラクション受信時に再生成する（メモリ保持不要）。ページ番号は `custom_id` のサフィックスや `interaction.message` の既存 Embed footer から復元する。

### `view` の詳細ページ実装方針

ページ 2 以降は各機能の `*-config view` が使っている Embed 生成ロジック（`buildViewEmbed` 相当の関数）をそのまま呼び出して再利用する。表示ロジックの二重管理を避けるため、`guild-config view` 側では Embed のフッターにページ番号を追記するだけにとどめる。

### `reset` の後処理

`deleteConfig` 後は `localeManager.invalidateLocaleCache(guildId)` を呼び出してキャッシュを即時クリアする。

### キャッシュ無効化

`set-locale` 実行後は `localeManager.invalidateLocaleCache(guildId)` を必ず呼ぶ。呼ばない場合、TTL（5分）が切れるまで古いロケールが使われ続ける。
