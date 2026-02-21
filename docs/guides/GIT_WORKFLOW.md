# Git ワークフロー・コミット運用ガイド

> Git Workflow & Commit Convention Guide

最終更新: 2026年2月22日

---

## 📋 概要

このドキュメントは、guild-mng-bot-v2 における Git ブランチ戦略とコミットメッセージ規約を定義します。

---

## 🌿 ブランチ戦略

### ブランチ構成

```
main          ← 本番環境（常にデプロイ可能な状態）
  ↑ PR only
develop       ← 開発統合ブランチ（次リリース向けの集約点）
  ↑ PR only
feature/xxx   ← 機能開発
fix/xxx       ← バグ修正
hotfix/xxx    ← 本番障害の緊急修正（main から直接分岐）
docs/xxx      ← ドキュメントのみの変更
refactor/xxx  ← リファクタリング
```

### 各ブランチの役割

| ブランチ     | 説明                                            | 直接push | マージ先           |
| ------------ | ----------------------------------------------- | -------- | ------------------ |
| `main`       | 本番デプロイ済みコード。CI/CDが自動デプロイする | ❌       | -                  |
| `develop`    | 開発中の統合ブランチ                            | ❌       | `main`             |
| `feature/*`  | 新機能の開発                                    | ✅       | `develop`          |
| `fix/*`      | バグ修正                                        | ✅       | `develop`          |
| `hotfix/*`   | 本番障害の緊急修正                              | ✅       | `main` + `develop` |
| `docs/*`     | ドキュメントのみの変更                          | ✅       | `develop`          |
| `refactor/*` | リファクタリング                                | ✅       | `develop`          |

---

## 🔄 通常の開発フロー

### 1. 作業ブランチの作成

**常に `develop` から分岐すること。**

```bash
# developを最新化
git checkout develop
git pull origin develop

# 作業ブランチを作成
git checkout -b feature/bump-reminder-mention-role
# または
git checkout -b fix/afk-status-not-cleared
```

### 2. 開発・コミット

```bash
# 変更をステージング
git add src/bot/features/bump-reminder/

# コミット（後述のConventional Commits形式で）
git commit -m "feat(bump-reminder): メンションロール設定機能を追加"
```

### 3. リモートへのpush

```bash
git push origin feature/bump-reminder-mention-role
```

### 4. Pull Request の作成

GitHub上で **`develop` をベースブランチ** として PR を作成する。

- PRテンプレートに従って概要・変更内容・動作確認を記載
- CI（型チェック・テスト・commitlint）がすべて通ることを確認
- マージは **Squash and merge** を推奨（コミット履歴をすっきりさせる）

### 5. developからmainへのリリース

機能がまとまったタイミングで `develop → main` の PR を作成してリリースする。

```bash
# developを最新化してPRを作成（GitHub UIから）
# PR名: "release: vX.Y.Z" の形式を推奨
```

---

## 🚨 ホットフィックスフロー（本番障害時）

本番環境で緊急対応が必要な場合のみ使用する。

```bash
# main から直接分岐
git checkout main
git pull origin main
git checkout -b hotfix/fix-crash-on-empty-guild

# 修正後、main と develop 両方に PR を作成
# 1. hotfix/* → main （緊急マージ）
# 2. hotfix/* → develop（乖離防止）
```

---

## ✍️ コミットメッセージ規約（Conventional Commits）

### フォーマット

```
<type>(<scope>): <subject>

[body]

[footer]
```

### type 一覧

| type       | 用途                                       | 例                                              |
| ---------- | ------------------------------------------ | ----------------------------------------------- |
| `feat`     | 新機能の追加                               | `feat(afk): 自動解除機能を追加`                 |
| `fix`      | バグ修正                                   | `fix(bump-reminder): 二重送信を修正`            |
| `docs`     | ドキュメントのみの変更                     | `docs: GIT_WORKFLOWを追加`                      |
| `style`    | フォーマット・セミコロン等（動作に無影響） | `style: prettierによる整形`                     |
| `refactor` | 機能変更・バグ修正を伴わないコード変更     | `refactor(scheduler): 責務を分離`               |
| `perf`     | パフォーマンス改善                         | `perf(db): クエリにインデックスを追加`          |
| `test`     | テストの追加・修正                         | `test(afk): エッジケースのユニットテストを追加` |
| `chore`    | ビルド・補助ツールの変更                   | `chore: pnpmをアップデート`                     |
| `ci`       | CI設定の変更                               | `ci: commitlintワークフローを追加`              |
| `build`    | ビルドシステム・外部依存の変更             | `build: tsconfig.jsonのtargetをES2022に変更`    |
| `revert`   | 過去のコミットを revert                    | `revert: feat(afk): 自動解除機能を追加`         |

### scope（省略可）

主要な scope の例：

| scope            | 対象                           |
| ---------------- | ------------------------------ |
| `afk`            | AFK機能                        |
| `bump-reminder`  | Bumpリマインダー               |
| `member-log`     | 入退室ログ                     |
| `sticky-message` | スティッキーメッセージ         |
| `vac`            | VAC（VC自動作成機能）          |
| `scheduler`      | スケジューラー                 |
| `db`             | データベース・マイグレーション |
| `web`            | Webサーバー・API               |
| `ci`             | CI/CD設定                      |

### subject のルール

- **動詞で始める**（「〜を追加」「〜を修正」の形）
- **日本語OK**（このプロジェクトは日本語ファーストで記述）
- **100文字以内**
- 末尾にピリオドをつけない

### コミットメッセージの例

```bash
# ✅ 良い例
feat(afk): メッセージ送信時にAFK状態を自動解除する機能を追加
fix(bump-reminder): コマンド登録時に二重登録されるバグを修正
test(scheduler): scheduleJobのエッジケーステストを追加
docs: コミット運用ガイドを追加
ci: developブランチのブランチ保護ルールを追加
refactor(db): guildConfigRepositoryの責務をusecase/persistenceに分割

# ❌ 悪い例
update                         # type がない
feat: fix bug                  # type と実際の変更内容が矛盾
FEAT: 機能追加                 # type は小文字
feat: 〜を追加しました。       # 末尾にピリオド / 敬語不要
feat(afk)(scheduler): ...      # scope は1つ
```

### 複数の変更をまとめるとき

1コミットに異なる type の変更を混在させない。分割してコミットすること。

```bash
# ❌ 悪い例（1コミットに feat + test を混在）
git commit -m "feat(afk): 追加 + テストも書いた"

# ✅ 良い例（分割する）
git commit -m "feat(afk): メッセージ送信時にAFK状態を自動解除する機能を追加"
git commit -m "test(afk): AFK自動解除のユニットテストを追加"
```

---

## 🌲 ブランチ命名規則

```
<type>/<kebab-case-description>
```

| 例                                   | 用途             |
| ------------------------------------ | ---------------- |
| `feature/bump-reminder-mention-role` | 新機能           |
| `fix/afk-status-not-cleared`         | バグ修正         |
| `hotfix/crash-on-empty-guild`        | 緊急修正         |
| `refactor/db-repository-split`       | リファクタリング |
| `docs/git-workflow`                  | ドキュメント     |

- **すべて小文字のkebab-case** を使用
- 日本語・スペースは使用しない

---

## 🔍 PR 運用規則

### PR 作成時のチェック

- [ ] ブランチ名が命名規則に従っている
- [ ] ベースブランチが正しい（通常は `develop`、hotfixは `main`）
- [ ] コミットメッセージが Conventional Commits 形式になっている
- [ ] `pnpm test` がローカルで通っている
- [ ] `pnpm typecheck` がローカルで通っている

### CI のステータスチェック

PR に対して以下の CI が自動で実行される：

| チェック                 | ワークフロー     | 内容                         |
| ------------------------ | ---------------- | ---------------------------- |
| **Test**                 | `deploy.yml`     | 型チェック + 全テスト実行    |
| **Lint Commit Messages** | `commitlint.yml` | コミットメッセージ形式の検証 |

すべて ✅ でないとマージできない（ブランチ保護設定による）。

### マージ戦略

| マージ先  | 推奨方式             | 理由                                       |
| --------- | -------------------- | ------------------------------------------ |
| `develop` | **Squash and merge** | feature ブランチの細かいコミットをまとめる |
| `main`    | **Merge commit**     | リリース履歴を明確に残す                   |

---

## 🏷️ ブランチ保護の設定（GitHub UI）

[Settings > Branches](https://github.com/sonozaki-sz/guild-mng-bot-v2/settings/branches) で以下を設定する。

### `main` ブランチ

| 設定                                                  | 値  |
| ----------------------------------------------------- | --- |
| Require a pull request before merging                 | ✅  |
| Require status checks: `Test`, `Lint Commit Messages` | ✅  |
| Do not allow bypassing the above settings             | ✅  |

### `develop` ブランチ

| 設定                                                  | 値  |
| ----------------------------------------------------- | --- |
| Require a pull request before merging                 | ✅  |
| Require status checks: `Test`, `Lint Commit Messages` | ✅  |
| Do not allow bypassing the above settings             | ✅  |

---

## 📚 参考

- [Conventional Commits](https://www.conventionalcommits.org/ja/v1.0.0/)
- [commitlint 設定](../../commitlint.config.js)
- [CI/CD ワークフロー](../../.github/workflows/)
