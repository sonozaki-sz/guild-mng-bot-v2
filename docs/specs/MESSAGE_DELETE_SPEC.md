# メッセージ削除機能 - 仕様書

> Message Delete Function - メッセージ削除機能

最終更新: 2026年2月27日（実行確認ダイアログ・設定変更コマンド追加）

---

## 📋 概要

### 目的

モデレーター権限を持つユーザーが、サーバー内の全チャンネルまたは特定チャンネルにわたって、特定ユーザーのメッセージ・キーワード一致メッセージ・指定件数のメッセージを一括削除できる機能を提供し、スパムや不適切なメッセージの迅速な対応を可能にします。

### 主な用途

1. **スパム対策**: サーバー全体に渡るスパムメッセージを横断的に一括削除
2. **不適切なコンテンツの削除**: 特定ユーザーの違反メッセージをサーバー全体から一括削除
3. **キーワード削除**: 特定の言葉・フレーズを含むメッセージをサーバー全体から削除
4. **チャンネルクリーンアップ**: テストメッセージや古いメッセージの整理
5. **モデレーション効率化**: 手動削除の手間を大幅に削減

### 特徴

- **サーバー全チャンネル対応**: デフォルトでサーバー内の全テキストチャンネルを横断して削除
- **柔軟な削除条件**: 件数・ユーザー・キーワード・期間（日数/日付範囲）・チャンネルを自由に組み合わせ
- **期間指定削除**: 過去N日以内（`days`）や特定の日付範囲（`after` / `before`）でメッセージを絞り込んで削除
- **14日以上前のメッセージにも対応**: 古いメッセージも個別削除で対応
- **安全性重視**: フィルタ条件（`count`・`user`・`keyword`・`days`・`after`・`before`）のいずれも未指定時は実行を拒否
- **進捗表示**: 大量削除時にリアルタイムで進捗を表示
- **Cooldown機能**: 連続実行を防止し、誤操作を軽減
- **実行確認ダイアログ**: 削除実行前に確認ダイアログを表示。誤操作を防止（ユーザーごとに「次回から確認しない」設定が可能）
- **削除結果の詳細表示**: 削除完了後に削除件数・削除メッセージの内容（投稿者/日付/本文）をページネイション付きで表示
- **結果フィルター機能**: 削除結果を投稿者・メッセージ内容・日付でフィルタリングして確認可能

---

## 🎯 主要機能

### `/message-delete` コマンド

チャンネル内のメッセージを一括削除

### `/message-delete-config` コマンド

`/message-delete` の挙動設定を変更する。現時点では実行確認ダイアログの有効/無効を切り替える。設定はユーザーごとに DB に永続保存される。

| オプション | 型      | 説明                                                                    |
| ---------- | ------- | ----------------------------------------------------------------------- |
| `confirm`  | Boolean | `true`（デフォルト）: 削除前に確認ダイアログを表示。`false`: スキップ。 |

---

## ⚙️ コマンド仕様

### オプション

**1. `count` (オプション)**

- 削除するメッセージ数
- 範囲: 1以上（上限なし）
- 未指定の場合: 対象メッセージをすべて削除
- 注: 大量削除は時間がかかる場合があります

**2. `user` (オプション)**

- 削除対象のユーザーを指定
- 指定した場合、そのユーザーのメッセージのみ削除
- 未指定の場合、すべてのユーザーのメッセージが対象

**3. `keyword` (オプション)**

- メッセージの本文に対して部分一致検索を行い、マッチしたメッセージのみを削除対象とする
- 大文字/小文字を区別しない（case-insensitive）
- `user` オプションと併用可（ユーザー AND キーワードの両条件に一致するメッセージを削除）
- 未指定の場合、テキスト内容によるフィルタリングは行わない

**4. `days` (オプション)**

- 過去N日以内に投稿されたメッセージのみを削除対象とする
- 範囲: 1以上
- 例: `days:7` → 過去7日以内のメッセージのみ削除
- `after` / `before` との同時指定不可（排他）
- `count` と組み合わせ可（期間内でさらに件数を絞る）

**5. `after` (オプション)**

- この日時以降に投稿されたメッセージのみを削除対象とする
- 形式: `YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS`（ISO 8601 相当、時刻省略時は `00:00:00` 扱い）
- 例: `after:2026-01-01` → 2026年1月1日以降のメッセージのみ削除
- `days` との同時指定不可（排他）
- `before` と組み合わせることで日付範囲を指定可能

**6. `before` (オプション)**

- この日時以前に投稿されたメッセージのみを削除対象とする
- 形式: `YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS`（ISO 8601 相当、時刻省略時は `23:59:59` 扱い）
- 例: `before:2026-02-01` → 2026年2月1日以前のメッセージのみ削除
- `days` との同時指定不可（排他）
- `after` と組み合わせることで日付範囲を指定可能

**7. `channel` (オプション)**

- 削除対象を絞り込むチャンネルを指定
- **未指定の場合、サーバー内の全テキストチャンネルを対象** とする（デフォルト: サーバー全体）
- テキストベースのチャンネル（TextChannel, NewsChannel 等）のみ対象
- Botがアクセス権を持たないチャンネルはスキップ

### バリデーション

- 以下の「フィルタ条件オプション」のいずれも未指定の場合は実行を拒否する：
  - `count`・`user`・`keyword`・`days`・`after`・`before`
  - `channel` のみ指定でも拒否（フィルタ条件なしでチャンネル全削除になるため）
- `days` と `after` / `before` を同時指定した場合はエラー（排他）
- `after` > `before`（開始が終了より後）の場合はエラー
- `after` / `before` に無効な日付形式を指定した場合はエラー

---

## ⚠️ 実行確認ダイアログ

### 概要

`/message-delete-config confirm:true`（デフォルト）のユーザーに対して、コマンド実行時（オプション検証・権限チェック通過後）に確認ダイアログを Ephemeral で表示する。ユーザーが承認するまで削除処理は開始しない。

### ダイアログ UI

```
⚠️ **この操作は取り消せません**

以下の条件に一致するメッセージを削除します。実行しますか？

対象チャンネル: サーバー全体
削除条件:
  ユーザー    : @BadUser
  キーワード  : "スパム"
  期間        : 過去7日間

[✅ 削除する]  [❌ キャンセル]  [[ ] 次回から確認しない]
```

#### ボタン仕様

| ボタン             | customId                     | スタイル                               | 動作                                                                                   |
| ------------------ | ---------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------- |
| ✅ 削除する        | `msgdel_confirm_yes`         | `ButtonStyle.Danger`（赤）             | 削除処理を開始する。`skipConfirm` フラグが立っている場合は設定を DB に保存してから実行 |
| ❌ キャンセル      | `msgdel_confirm_no`          | `ButtonStyle.Secondary`（グレー）      | ダイアログを閉じキャンセルメッセージを表示。削除は実行しない                           |
| 次回から確認しない | `msgdel_confirm_skip_toggle` | OFF: `Secondary` / ON: `Success`（緑） | ON/OFF のトグル。状態は「削除する」押下時に DB へ保存（単独では保存しない）            |

#### 「次回から確認しない」ボタンの状態遷移

- 初期状態（OFF）: `[ ] 次回から確認しない`（`ButtonStyle.Secondary`）
- 押下後（ON）: `[✓] 次回から確認しない`（`ButtonStyle.Success` に変化）
- 再度押下: 初期状態に戻る（トグル）
- 「✅ 削除する」押下時に、現在のトグル状態を `skipConfirm` として DB に保存する

### 確認ダイアログ表示条件

| 条件                                                                   | ダイアログ表示 |
| ---------------------------------------------------------------------- | -------------- |
| `confirm = true`（DB 未登録＝デフォルト含む）                          | 表示           |
| `confirm = false`（`/message-delete-config confirm:false` で設定済み） | スキップ       |

### ダイアログのタイムアウト

- タイムアウト: **60秒**
- タイムアウト後はボタンを無効化し、`⌛ タイムアウトしました。再度コマンドを実行してください。` と表示
- タイムアウトはキャンセル扱い（削除は実行しない）

### `/message-delete-config` コマンドの設定反映

```
/message-delete-config confirm:false
→ 次回以降の /message-delete 実行で確認ダイアログをスキップ

/message-delete-config confirm:true
→ 確認ダイアログを再度有効化
```

- 変更後は `✅ 設定を更新しました。次回の /message-delete から反映されます。` と Ephemeral で応答

### 設定の永続化

- 保存先: DB の `user_settings` テーブル（または同等のキーバリューストア）
- キー: `userId + guildId`（ギルドごとに独立）
- デフォルト: `skipConfirm = false`（確認あり）
- 「次回から確認しない」トグル ON で「削除する」を押した場合と、`/message-delete-config confirm:false` の両方で `skipConfirm = true` に更新される

---

## 💡 使用例

### ⚠️ 注意: フィルタ条件オプションの全未指定は禁止

```
/message-delete
```

- **エラー**: フィルタ条件（`count`・`user`・`keyword`・`days`・`after`・`before`）がすべて未指定の場合は警告を表示して中止

```
/message-delete channel:#general
```

- **エラー**: `channel` のみ指定も禁止（フィルタ条件なしでチャンネル全削除になるため）

```
/message-delete days:7 after:2026-01-01
```

- **エラー**: `days` と `after` / `before` の同時指定は不可

```
/message-delete after:2026-02-28 before:2026-01-01
```

- **エラー**: `after` が `before` より後の日時は不可

### 例1: 特定ユーザーのメッセージをサーバー全体から削除

```
/message-delete user:@BadUser
```

- サーバー内の**全チャンネル**から `@BadUser` のメッセージをすべて検索して削除
- チャンネルごとに順次処理し、進捗を表示

### 例2: キーワードを含むメッセージをサーバー全体から削除

```
/message-delete keyword:スパム
```

- サーバー内の**全チャンネル**から「スパム」を含むメッセージをすべて削除

### 例3: ユーザー + キーワードの組み合わせで削除

```
/message-delete user:@BadUser keyword:宣伝
```

- サーバー内の全チャンネルから `@BadUser` が投稿した「宣伝」を含むメッセージを削除

### 例4: 件数を指定してサーバー全体から削除

```
/message-delete count:100 user:@Spammer
```

- サーバー全体から `@Spammer` のメッセージを最大100件削除
- 件数は全チャンネルの合計（例: チャンネルAで60件、チャンネルBで40件）

### 例5: 特定チャンネルに絞って削除

```
/message-delete keyword:広告 channel:#general
```

- `#general` チャンネルのみで「広告」を含むメッセージを削除

### 例6: 古いプロフィールメッセージを削除

```
/message-delete count:5 user:@User channel:#profile
```

- `#profile` チャンネルの `@User` のメッセージを5件削除
- 3ヶ月前のメッセージでも削除可能（個別削除で対応）

### 例7: 大量削除（サーバー全体 + 件数上限あり）

```
/message-delete count:500 keyword:NGワード
```

- サーバー全体から「NGワード」を含むメッセージを最大500件削除
- 100件ずつ複数回に分けて削除処理を実行

### 例8: 過去7日以内のメッセージを削除（日数指定）

```
/message-delete days:7 user:@Spammer
```

- サーバー全体から `@Spammer` の過去7日以内のメッセージをすべて削除

### 例9: 特定日以降のメッセージを削除（after 指定）

```
/message-delete after:2026-02-01 keyword:宣伝
```

- 2026年2月1日以降に投稿された「宣伝」を含むメッセージをサーバー全体から削除

### 例10: 日付範囲を指定して削除（after + before）

```
/message-delete after:2026-01-01 before:2026-01-31 user:@BadUser
```

- 2026年1月1日〜1月31日の間に `@BadUser` が投稿したメッセージをサーバー全体から削除

### 例11: 期間 + チャンネル絞り込み

```
/message-delete days:3 channel:#general
```

- `#general` チャンネルの過去3日以内のメッセージをすべて削除

### 例12: 件数上限 + 日付範囲

```
/message-delete count:200 after:2026-02-20T00:00:00 before:2026-02-27T23:59:59
```

- 指定期間内のメッセージを最大200件削除（時刻まで指定する例）

---

## 🔒 権限チェック

### 実行者の必要権限

- `MANAGE_MESSAGES` (メッセージ管理)
- または、`ADMINISTRATOR` (管理者)

### Botの必要権限

- `MANAGE_MESSAGES` (メッセージ管理)
- `READ_MESSAGE_HISTORY` (メッセージ履歴の閲覧)
- `VIEW_CHANNEL` (チャンネルの閲覧 ※全チャンネル横断削除時)

**権限不足の場合:**

- エラーメッセージを表示
- ログに記録

### Cooldown（クールダウン）

- **待機時間**: 5秒
- **目的**: 同じユーザーによる連続実行を防止
- **注意**: 大量削除中は処理が完了するまで時間がかかるため、完了前に再実行しても cooldown で制限される

### 同時実行時の挙動

**同じユーザーが連続実行:**

- Cooldown (5秒) により制限される
- 前回のコマンド実行から5秒経過していないと実行できない

**異なるユーザーが同じチャンネルで実行:**

- 同時実行可能（制限なし）
- 両方の削除処理が並行して実行される
- 注意点:
  - 同じメッセージを削除しようとするとエラーが発生する可能性
  - エラーは無視して処理を継続（後述のエラーハンドリング参照）
  - レート制限に引っかかりやすくなる

**推奨事項:**

- 同じチャンネルで複数のモデレーターが同時に削除コマンドを実行しないようコミュニケーションを取る
- 大量削除中は他のモデレーターに通知する

---

## 🔄 処理フロー

```
1. コマンド実行
   ↓
2. オプション検証
   - count・user・keyword・days・after・before がすべて未指定の場合は警告を出して中止
   - channel のみ指定でも中止
   - days と after/before の同時指定はエラー
   - after > before の場合はエラー
   - after・before の日付形式が不正な場合はエラー
   ↓
3. 権限チェック
   - 実行者の権限確認
   - Botの権限確認
   ↓
3.5. 実行確認ダイアログ（skipConfirm = false のユーザーのみ）
   - ダイアログを Ephemeral で表示
   - 「✅ 削除する」→ 処理継続（skipConfirm フラグを保存して次ステップへ）
   - 「❌ キャンセル」→ キャンセルメッセージを表示して終了
   - 「次回から確認しない」→ トグル更新（削除する押下時に DB 保存）
   - 60秒タイムアウト → タイムアウトメッセージを表示して終了
   ↓
4. 期間フィルターの計算
   - days 指定あり   → afterTs = Date.now() - days * 86400000, beforeTs = Date.now()
   - after/before 指定 → 各日付文字列を Unix ミリ秒に変換
   - いずれも未指定   → afterTs = 0, beforeTs = Infinity（期間制限なし）
   ↓
5. 対象チャンネルリスト取得
   - channel 指定あり → そのチャンネルのみ
   - channel 未指定   → サーバー内の全テキストチャンネル
                        （Botがアクセス不可のチャンネルはスキップ、スキップ数をログ記録）
   ↓
6. チャンネルごとにループ処理
   ├── 6a. メッセージ取得（ループ）
   │    - 100件ずつフェッチ（count 合計に達するまで繰り返し）
   │    - user 指定がある場合はフィルタリング
   │    - keyword 指定がある場合は本文の部分一致（case-insensitive）でフィルタリング
   │    - 期間フィルター: afterTs ≤ msg.createdTimestamp ≤ beforeTs に一致するもののみ収集
   │    - フェッチしたバッチの最古メッセージが afterTs より前になれば、そのチャンネルの
   │      走査を打ち切り（それ以降を取得しても範囲外のため）
   │    - 全条件に合致したメッセージを収集
   ├── 6b. メッセージを14日以内/以降に分類
   │    - 14日以内: bulkDelete 対象
   │    - 14日以降: 個別削除対象
   └── 6c. メッセージ削除（ループ）
        - 14日以内: 100件ずつ bulkDelete で高速削除
        - 14日以降: 1件ずつ個別削除（レート制限考慮）
        - 削除進捗をチャンネルごとに更新
   ↓
7. 全チャンネル処理完了
   ↓
8. 結果通知（Ephemeral）
   - 合計削除件数（チャンネル別内訳も表示）
   - 削除メッセージの詳細をページネイション付き Embed で表示
     - 各メッセージ: 投稿者 / 投稿日時 / チャンネル名 / メッセージ本文
     - フィルター: 投稿者・メッセージ内容・日付で絞り込み可能（セレクトメニュー/ボタン）
   ↓
9. ログ記録
   - 実行者
   - 合計削除件数・チャンネル別削除件数
   - 対象ユーザー（指定されている場合）
   - キーワード（指定されている場合）
   - 期間条件（days / after / before が指定されている場合）
```

---

## � 削除結果の詳細表示

### 概要

削除完了後、コマンド実行者（Ephemeral）に対して以下の情報を表示する。

1. **サマリー**: 合計削除件数・チャンネル別内訳
2. **削除メッセージ一覧**: ページネイション付きの Discord Embed

---

### サマリー Embed

```
✅ 削除完了
合計削除件数: 45件

チャンネル別内訳:
  #general        : 20件
  #random         : 15件
  #spam-channel   : 10件
```

---

### 削除メッセージ詳細 Embed（ページネイション）

#### 1ページあたりの表示件数

- **5件** を1ページとして表示（Embed のフィールド上限を考慮）

#### 各メッセージの表示内容

| 項目           | 内容                                               |
| -------------- | -------------------------------------------------- |
| 投稿者         | `@ユーザー名` + ユーザーアバター                   |
| 投稿日時       | `YYYY/MM/DD HH:mm:ss` (Discord タイムスタンプ形式) |
| チャンネル     | `#チャンネル名`                                    |
| メッセージ本文 | 最大200文字（超過時は「…」で省略）                 |

#### Embed レイアウト例（1ページ目）

```
📋 削除したメッセージ一覧  (1 / 9 ページ)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1] @Spammer#1234 | #general | 2026/02/25 10:30:15
    これは宣伝メッセージです。今すぐクリック！

[2] @Spammer#1234 | #random | 2026/02/25 10:31:02
    お得なサイトはこちら→ http://...

[3] @Spammer#1234 | #general | 2026/02/25 11:00:45
    フォローお願いします！

[4] @BadUser#5678 | #general | 2026/02/24 09:15:33
    不適切な発言の例です

[5] @Spammer#1234 | #spam-channel | 2026/02/23 22:05:11
    広告メッセージです

< 前へ  |  1/9  |  次へ >
```

---

### ページネイション操作

#### ボタン

| ボタン   | 説明                                 |
| -------- | ------------------------------------ |
| `◀ 前へ` | 前のページへ（1ページ目では無効化）  |
| `▶ 次へ` | 次のページへ（最終ページでは無効化） |

#### Interaction タイムアウト

- ページネイション操作は **15分間** 有効
- タイムアウト後はボタンを無効化し、「セッションが期限切れです」と表示

---

### フィルター機能

削除件数が複数の場合、ページネイション Embed にフィルター用のセレクトメニューを追加する。

#### フィルター種別

| フィルター                | UI コンポーネント         | 説明                                                                          |
| ------------------------- | ------------------------- | ----------------------------------------------------------------------------- |
| **投稿者**                | Select Menu（複数選択可） | 表示対象の投稿者を絞り込む                                                    |
| **メッセージ内容**        | Text Input（モーダル）    | 入力したキーワードを含むメッセージのみ表示                                    |
| **過去N日間（日数入力）** | Text Input（モーダル）    | 正の整数を入力。N日以内のメッセージのみ表示。`after`/`before` と排他          |
| **after（開始日時）**     | Text Input（モーダル）    | この日時以降のメッセージのみ表示。形式: `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SS` |
| **before（終了日時）**    | Text Input（モーダル）    | この日時以前のメッセージのみ表示。形式: `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SS` |

> **注意**: 過去N日間 と after/before は排他。一方を入力すると他方の入力は自動リセットされる。

#### フィルター適用時の挙動

- フィルター適用後はページ番号を1にリセット
- 複数のフィルターは AND 条件で適用
- フィルター中は Embed のタイトルに `（フィルター適用中）` と表示
- 「リセット」ボタンですべてのフィルターを解除
- 過去N日間を入力した場合、after/before の入力は自動リセットされる（排他）
- after/before を入力した場合、過去N日間の入力は自動リセットされる（排他）
- 過去N日間に 1 未満または整数以外を入力した場合はエラーメッセージを Ephemeral で表示し、フィルターは適用しない
- after/before に無効な日付形式を入力した場合はエラーメッセージを Ephemeral で表示し、フィルターは適用しない
- after > before の場合もエラーを表示してフィルターは適用しない

#### フィルター UI のレイアウト例

```
行1: [投稿者でフィルター ▼]
行2: [過去N日間を入力 🔢]  [after（開始日時）を入力 📅]  [before（終了日時）を入力 📅]  [内容で検索 🔍]  [リセット ✕]
行3: [◀ 前へ]  [1/3]  [▶ 次へ]

（フィルター適用中: 投稿者=@Spammer#1234 | 過去7日 | after=2026-02-01 | before=2026-02-27）
```

---

### 削除件数が0の場合

ページネイション Embed は表示せず、サマリーのみ表示する。

```
ℹ️ 削除可能なメッセージが見つかりませんでした。
```

---

### 削除件数が1件の場合

ページネイション・フィルターボタンは表示せず、1件の詳細のみ Embed に表示する。

---

## �📊 実装例

### TypeScript実装

```typescript
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Collection,
  EmbedBuilder,
  GuildTextBasedChannel,
  Message,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  TextChannel,
} from "discord.js";

/** 削除済みメッセージの記録 */
interface DeletedMessageRecord {
  authorId: string;
  authorTag: string;
  channelId: string;
  channelName: string;
  createdAt: Date;
  content: string;
}

const PAGE_SIZE = 5;

export const msgDelCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("message-delete")
    .setDescription(
      "メッセージを一括削除します（デフォルト: サーバー全チャンネル）",
    )
    .addIntegerOption((option) =>
      option
        .setName("count")
        .setDescription("削除するメッセージ数（未指定で全件削除）")
        .setRequired(false)
        .setMinValue(1),
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("特定ユーザーのメッセージのみ削除")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("keyword")
        .setDescription(
          "本文に指定キーワードを含むメッセージのみ削除（部分一致）",
        )
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("days")
        .setDescription(
          "過去N日以内のメッセージのみ削除（after/beforeとの同時指定不可）",
        )
        .setRequired(false)
        .setMinValue(1),
    )
    .addStringOption((option) =>
      option
        .setName("after")
        .setDescription(
          "この日時以降のメッセージのみ削除 (YYYY-MM-DD または YYYY-MM-DDTHH:MM:SS)",
        )
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("before")
        .setDescription(
          "この日時以前のメッセージのみ削除 (YYYY-MM-DD または YYYY-MM-DDTHH:MM:SS)",
        )
        .setRequired(false),
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("削除対象を絞り込むチャンネル（未指定でサーバー全体）")
        .setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const countOption = interaction.options.getInteger("count");
    const targetUser = interaction.options.getUser("user", false);
    const keyword = interaction.options.getString("keyword", false);
    const daysOption = interaction.options.getInteger("days", false);
    const afterStr = interaction.options.getString("after", false);
    const beforeStr = interaction.options.getString("before", false);
    const channelOption = interaction.options.getChannel("channel", false);

    // フィルタ条件が何もない場合は拒否
    if (
      !countOption &&
      !targetUser &&
      !keyword &&
      !daysOption &&
      !afterStr &&
      !beforeStr
    ) {
      await interaction.editReply(
        "⚠️ 警告: フィルタ条件が指定されていないため実行できません。\n" +
          "`count`・`user`・`keyword`・`days`・`after`・`before` のいずれか1つを指定してください。",
      );
      return;
    }

    // days と after/before の排他チェック
    if (daysOption && (afterStr || beforeStr)) {
      await interaction.editReply(
        "⚠️ `days` と `after`/`before` は同時に指定できません。どちらか一方を使用してください。",
      );
      return;
    }

    // after・before の日付パースとバリデーション
    const parseDate = (str: string, endOfDay = false): Date | null => {
      // YYYY-MM-DD の場合は時刻を補完
      const normalized = /^\d{4}-\d{2}-\d{2}$/.test(str)
        ? `${str}T${endOfDay ? "23:59:59" : "00:00:00"}`
        : str;
      const d = new Date(normalized);
      return isNaN(d.getTime()) ? null : d;
    };

    let afterTs = 0;
    let beforeTs = Infinity;

    if (daysOption) {
      afterTs = Date.now() - daysOption * 24 * 60 * 60 * 1000;
      beforeTs = Date.now();
    } else {
      if (afterStr) {
        const d = parseDate(afterStr, false);
        if (!d) {
          await interaction.editReply(
            "⚠️ `after` の日付形式が不正です。`YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS` 形式で指定してください。",
          );
          return;
        }
        afterTs = d.getTime();
      }
      if (beforeStr) {
        const d = parseDate(beforeStr, true);
        if (!d) {
          await interaction.editReply(
            "⚠️ `before` の日付形式が不正です。`YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS` 形式で指定してください。",
          );
          return;
        }
        beforeTs = d.getTime();
      }
      if (afterTs !== 0 && beforeTs !== Infinity && afterTs > beforeTs) {
        await interaction.editReply(
          "⚠️ `after` は `before` より前の日時を指定してください。",
        );
        return;
      }
    }

    const count = countOption ?? Infinity;
    const guild = interaction.guild!;

    // 対象チャンネルリストの構築
    let targetChannels: GuildTextBasedChannel[];
    if (channelOption) {
      if (!channelOption.isTextBased()) {
        await interaction.editReply("テキストチャンネルを指定してください。");
        return;
      }
      targetChannels = [channelOption as GuildTextBasedChannel];
    } else {
      // サーバー内の全テキストチャンネル（Botがアクセス可能なもの）
      const allChannels = await guild.channels.fetch();
      targetChannels = allChannels
        .filter(
          (ch): ch is TextChannel =>
            ch !== null &&
            ch.isTextBased() &&
            ch
              .permissionsFor(guild.members.me!)
              ?.has([
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageMessages,
              ]) === true,
        )
        .values()
        .toArray();
    }

    try {
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const deletedRecords: DeletedMessageRecord[] = [];
      const channelBreakdown: Record<string, number> = {};
      let totalDeleted = 0;

      for (const channel of targetChannels) {
        const collected: Message[] = [];
        let lastId: string | undefined;

        // メッセージ収集（count の残り件数まで）
        while (totalDeleted + collected.length < count) {
          const batch: Collection<string, Message> =
            await channel.messages.fetch({
              limit: 100,
              before: lastId,
            });

          if (batch.size === 0) break;

          let batchOldestTs = Infinity;

          for (const msg of batch.values()) {
            batchOldestTs = Math.min(batchOldestTs, msg.createdTimestamp);
            // 期間フィルター
            if (msg.createdTimestamp < afterTs) continue;
            if (msg.createdTimestamp > beforeTs) continue;
            // ユーザーフィルター
            if (targetUser && msg.author.id !== targetUser.id) continue;
            // キーワード部分一致フィルター（case-insensitive）
            if (
              keyword &&
              !msg.content.toLowerCase().includes(keyword.toLowerCase())
            )
              continue;
            collected.push(msg);
            if (totalDeleted + collected.length >= count) break;
          }

          lastId = batch.last()?.id;
          // バッチ最古メッセージが afterTs より前なら、それ以降を取得しても範囲外なので打ち切り
          if (batchOldestTs < afterTs) break;
          if (batch.size < 100) break;
        }

        if (collected.length === 0) continue;

        // 14日以内/以降に分類
        const newMsgs = collected.filter(
          (m) => m.createdTimestamp > twoWeeksAgo,
        );
        const oldMsgs = collected.filter(
          (m) => m.createdTimestamp <= twoWeeksAgo,
        );

        // 進捗表示
        await interaction.editReply(
          `削除中... (${channel.name}) 収集: ${collected.length}件`,
        );

        // bulkDelete（14日以内）
        for (let i = 0; i < newMsgs.length; i += 100) {
          const chunk = newMsgs.slice(i, i + 100);
          await channel.bulkDelete(chunk, true);
          totalDeleted += chunk.length;
          if (i + 100 < newMsgs.length) {
            await new Promise((r) => setTimeout(r, 1000));
          }
        }

        // 個別削除（14日以降）
        for (const msg of oldMsgs) {
          try {
            await msg.delete();
            totalDeleted++;
          } catch (err) {
            logger.warn(`[MsgDel] Failed to delete message ${msg.id}:`, err);
          }
          await new Promise((r) => setTimeout(r, 500));
        }

        // 削除済みメッセージを記録
        for (const msg of collected) {
          deletedRecords.push({
            authorId: msg.author.id,
            authorTag: msg.author.tag,
            channelId: channel.id,
            channelName: channel.name,
            createdAt: msg.createdAt,
            content:
              msg.content.slice(0, 200) + (msg.content.length > 200 ? "…" : ""),
          });
        }

        channelBreakdown[channel.name] = collected.length;
      }

      if (totalDeleted === 0) {
        await interaction.editReply(
          "ℹ️ 削除可能なメッセージが見つかりませんでした。",
        );
        return;
      }

      // --- サマリー Embed ---
      const breakdownText = Object.entries(channelBreakdown)
        .map(([ch, n]) => `#${ch}: ${n}件`)
        .join("\n");

      const summaryEmbed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("✅ 削除完了")
        .addFields(
          { name: "合計削除件数", value: `${totalDeleted}件`, inline: true },
          { name: "チャンネル別内訳", value: breakdownText || "—" },
        );

      // 1件のみの場合はボタンなしで詳細も表示
      if (deletedRecords.length === 1) {
        const r = deletedRecords[0];
        summaryEmbed.addFields({
          name: `[1] @${r.authorTag} | #${r.channelName}`,
          value: `${r.createdAt.toLocaleString("ja-JP")}\n${r.content || "*(本文なし)*"}`,
        });
        await interaction.editReply({ embeds: [summaryEmbed] });
        return;
      }

      // --- ページネイション付き詳細 Embed ---
      await sendPaginatedResult(interaction, summaryEmbed, deletedRecords);

      const periodLabel = daysOption
        ? `days=${daysOption}`
        : [afterStr && `after=${afterStr}`, beforeStr && `before=${beforeStr}`]
            .filter(Boolean)
            .join(" ") || "";

      logger.info(
        `[MsgDel] ${interaction.user.tag} deleted ${totalDeleted} messages` +
          `${targetUser ? ` from ${targetUser.tag}` : ""}` +
          `${keyword ? ` keyword="${keyword}"` : ""}` +
          `${periodLabel ? ` ${periodLabel}` : ""}` +
          ` channels=[${Object.keys(channelBreakdown).join(", ")}]`,
      );
    } catch (error) {
      logger.error("[MsgDel] Error:", error);
      await interaction.editReply("メッセージの削除中にエラーが発生しました。");
    }
  },

  cooldown: 5,
};

/**
 * 削除済みメッセージ一覧をページネイション + フィルター付き Embed で送信する。
 */
async function sendPaginatedResult(
  interaction: ChatInputCommandInteraction,
  summaryEmbed: EmbedBuilder,
  records: DeletedMessageRecord[],
  filterAuthorId?: string,
  filterKeyword?: string,
  filterDays?: number,   // 過去N日間フィルター（after/before と排他）
  filterAfter?: Date,    // after（開始日時）フィルター
  filterBefore?: Date,   // before（終了日時）フィルター
): Promise<void> {
  // フィルター適用
  let filtered = records;
  if (filterAuthorId) {
    filtered = filtered.filter((r) => r.authorId === filterAuthorId);
  }
  if (filterKeyword) {
    const kw = filterKeyword.toLowerCase();
    filtered = filtered.filter((r) => r.content.toLowerCase().includes(kw));
  }
  // 過去N日間フィルター（after/before が未指定の場合のみ適用）
  if (filterDays && !filterAfter && !filterBefore) {
    const threshold = Date.now() - filterDays * 24 * 60 * 60 * 1000;
    filtered = filtered.filter((r) => r.createdAt.getTime() >= threshold);
  }
  // after/before による日付範囲フィルター（days より優先）
  if (filterAfter) {
    filtered = filtered.filter((r) => r.createdAt >= filterAfter!);
  }
  if (filterBefore) {
    filtered = filtered.filter((r) => r.createdAt <= filterBefore!);
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  let currentPage = 0;

  const buildDetailEmbed = (page: number): EmbedBuilder => {
    const start = page * PAGE_SIZE;
    const slice = filtered.slice(start, start + PAGE_SIZE);
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(
        `📋 削除したメッセージ一覧  (${page + 1} / ${totalPages} ページ)` +
          (filterAuthorId || filterKeyword || filterDays || filterAfter || filterBefore
            ? " （フィルター適用中）"
            : ""),
      ).setFooter(
        filterAfter || filterBefore
          ? {
              text:
                [filterAfter && `after: ${filterAfter.toLocaleDateString("ja-JP")}`, filterBefore && `before: ${filterBefore.toLocaleDateString("ja-JP")}`]
                  .filter(Boolean)
                  .join(" ～ "),
            }
          : null,
      ),
      );
    for (let i = 0; i < slice.length; i++) {
      const r = slice[i];
      embed.addFields({
        name: `[${start + i + 1}] @${r.authorTag} | #${r.channelName}`,
        value: `${r.createdAt.toLocaleString("ja-JP")}\n${r.content || "*(本文なし)*"}`,
      });
    }
    return embed;
  };

  const buildComponents = (page: number) => {
    const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("msgdel_prev")
        .setLabel("◀ 前へ")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId("msgdel_next")
        .setLabel("▶ 次へ")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages - 1),
    );

    // フィルター行（複数件の場合のみ）
    const uniqueAuthors = [...new Set(records.map((r) => r.authorTag))];
    const authorSelect = new StringSelectMenuBuilder()
      .setCustomId("msgdel_filter_author")
      .setPlaceholder("投稿者でフィルター")
      .setMinValues(0)
      .setMaxValues(Math.min(uniqueAuthors.length, 25))
      .addOptions(
        uniqueAuthors.slice(0, 25).map((tag) => ({ label: tag, value: tag })),
      );
    const dateRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("msgdel_filter_days")
        .setLabel(
          filterDays
            ? `過去${filterDays}日間 ✏️`
            : "過去N日間を入力 🔢",
        )
        // days 指定中は緑、after/before 指定中は無効化
        .setStyle(filterDays ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(!!(filterAfter || filterBefore)),
      new ButtonBuilder()
        .setCustomId("msgdel_filter_after")
        .setLabel(
          filterAfter
            ? `after: ${filterAfter.toLocaleDateString("ja-JP")} ✏️`
            : "after（開始日時）を入力 📅",
        )
        // after 指定中は緑、days 指定中は無効化
        .setStyle(filterAfter ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(!!filterDays),
      new ButtonBuilder()
        .setCustomId("msgdel_filter_before")
        .setLabel(
          filterBefore
            ? `before: ${filterBefore.toLocaleDateString("ja-JP")} ✏️`
            : "before（終了日時）を入力 📅",
        )
        // before 指定中は緑、days 指定中は無効化
        .setStyle(filterBefore ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(!!filterDays),
      new ButtonBuilder()
        .setCustomId("msgdel_filter_keyword")
        .setLabel("内容で検索 🔍")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("msgdel_filter_reset")
        .setLabel("リセット ✕")
        .setStyle(ButtonStyle.Danger),
    );

    return [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        authorSelect,
      ),
      dateRow,
      navRow,
    ];
  };

  const response = await interaction.editReply({
    embeds: [summaryEmbed, buildDetailEmbed(currentPage)],
    components: buildComponents(currentPage),
  });

  // 15分間インタラクションを待機
  const collector = response.createMessageComponentCollector({
    time: 15 * 60 * 1000,
  });

  collector.on("collect", async (i) => {
    if (i.user.id !== interaction.user.id) {
      await i.reply({
        content: "操作権限がありません。",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (i.customId === "msgdel_prev")
      currentPage = Math.max(0, currentPage - 1);
    if (i.customId === "msgdel_next")
      currentPage = Math.min(totalPages - 1, currentPage + 1);
    // フィルター処理は実装側で i.customId に応じて分岐
    await i.update({
      embeds: [summaryEmbed, buildDetailEmbed(currentPage)],
      components: buildComponents(currentPage),
    });
  });

  collector.on("end", async () => {
    await interaction.editReply({ components: [] }).catch(() => {});
  });
}
```

**Cooldownの実装詳細:**

- 各ユーザーごとに最後のコマンド実行時刻を記録
- 同じユーザーが5秒以内に再実行しようとするとエラーメッセージを表示
- 異なるユーザーは個別にcooldownが管理される

---

**実行確認ダイアログの実装:**

```typescript
/**
 * 実行確認ダイアログを表示し、ユーザーの応答を待つ。
 * @returns `"confirmed"` | `"cancelled"` | `"timeout"`
 */
async function showConfirmDialog(
  interaction: ChatInputCommandInteraction,
  summary: string,
): Promise<"confirmed" | "cancelled" | "timeout"> {
  let skipNext = false; // 「次回から確認しない」トグル状態

  const buildButtons = () =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("msgdel_confirm_yes")
        .setLabel("✅ 削除する")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("msgdel_confirm_no")
        .setLabel("❌ キャンセル")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("msgdel_confirm_skip_toggle")
        .setLabel(
          skipNext ? "[✓] 次回から確認しない" : "[ ] 次回から確認しない",
        )
        .setStyle(skipNext ? ButtonStyle.Success : ButtonStyle.Secondary),
    );

  const response = await interaction.editReply({
    content: `⚠️ **この操作は取り消せません**\n\n${summary}\n\n実行しますか？`,
    components: [buildButtons()],
  });

  return new Promise((resolve) => {
    const collector = response.createMessageComponentCollector({
      time: 60_000,
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({
          content: "操作権限がありません。",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (i.customId === "msgdel_confirm_skip_toggle") {
        skipNext = !skipNext;
        await i.update({ components: [buildButtons()] });
        return;
      }

      collector.stop(i.customId);
    });

    collector.on("end", async (_, reason) => {
      if (reason === "msgdel_confirm_yes") {
        if (skipNext) {
          await saveUserSetting(interaction.user.id, interaction.guildId!, {
            skipConfirm: true,
          });
        }
        resolve("confirmed");
      } else if (reason === "msgdel_confirm_no") {
        await interaction.editReply({
          content: "❌ 削除をキャンセルしました。",
          components: [],
        });
        resolve("cancelled");
      } else {
        // time out
        await interaction.editReply({
          content: "⌛ タイムアウトしました。再度コマンドを実行してください。",
          components: [],
        });
        resolve("timeout");
      }
    });
  });
}

/**
 * ユーザー設定を DB に保存するユーティリティ（実装省略）。
 */
async function saveUserSetting(
  userId: string,
  guildId: string,
  patch: { skipConfirm?: boolean },
): Promise<void> {
  // DB の user_settings テーブルに upsert する
}

/**
 * ユーザー設定を DB から取得するユーティリティ（実装省略）。
 */
async function getUserSetting(
  userId: string,
  guildId: string,
): Promise<{ skipConfirm: boolean }> {
  // DB から取得。未登録の場合はデフォルト { skipConfirm: false } を返す
  return { skipConfirm: false };
}
```

**`execute` 内での使用例:**

```typescript
// 権限チェック後、削除処理開始前に挿入
const { skipConfirm } = await getUserSetting(interaction.user.id, guild.id);
if (!skipConfirm) {
  const conditionSummary = buildConditionSummary({
    targetUser,
    keyword,
    daysOption,
    afterStr,
    beforeStr,
    channelOption,
  });
  const result = await showConfirmDialog(interaction, conditionSummary);
  if (result !== "confirmed") return;
}
```

---

## ⚠️ Discord API制限

### 14日制限（bulkDelete）

Discordの`bulkDelete`メソッドは、**14日以上前のメッセージを削除できません**。

**対応:**

- **14日以内**: `bulkDelete()`で高速一括削除（100件ずつ）
- **14日以降**: `message.delete()`で個別削除（1件ずつ、時間がかかる）
- 削除対象のメッセージを自動的に分類して適切な方法で削除

**パフォーマンス:**

- 一括削除: 100件を数秒で削除
- 個別削除: 1件あたり約0.5秒（レート制限考慮）
  - 例: 100件の個別削除 → 約50秒
  - 例: 500件の個別削除 → 約250秒（約4分）

### レート制限

- 一度に削除できるメッセージ数: 最大100件（bulkDelete制限）
- メッセージフェッチ: 100件ずつ
- レート制限: 適切な間隔を空ける必要あり

**対応:**

- 100件ずつに分割してフェッチ・削除
- 削除バッチ間に1秒の待機時間を挿入
- 大量削除時は進捗を表示

---

## 🛡️ エラーハンドリング

### 想定されるエラー

1. **`count`・`user`・`keyword` の全未指定**

   ```
   ⚠️ 警告: `count`・`user`・`keyword` のいずれも未指定のため実行できません。
   少なくとも `count`・`user`・`keyword` のいずれか1つを指定してください。
   ```

2. **権限不足**

   ```
   ❌ この操作を実行する権限がありません。
   必要な権限: メッセージ管理
   ```

3. **Bot権限不足**

   ```
   ❌ Botにメッセージ削除権限がありません。
   ```

4. **古いメッセージの個別削除（時間がかかる）**

   ```
   ⚠️ 14日以上前のメッセージは個別削除します。時間がかかる場合があります。
   削除中... (general) 50/200件
   ```

5. **メッセージが見つからない**

   ```
   ℹ️ 削除可能なメッセージが見つかりませんでした。
   ```

6. **メッセージが既に削除されている（同時実行時）**
   - 他のユーザーが同時に削除コマンドを実行した場合
   - メッセージが既に削除されているエラーは無視して処理を継続
   - ログに警告を記録（削除失敗件数は含めない）

7. **`days` と `after`/`before` の同時指定**

   ```
   ⚠️ `days` と `after`/`before` は同時に指定できません。どちらか一方を使用してください。
   ```

8. **`after` / `before` の日付形式が不正**

   ```
   ⚠️ `after` の日付形式が不正です。`YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS` 形式で指定してください。
   ```

9. **`after` が `before` より後**

   ```
   ⚠️ `after` は `before` より前の日時を指定してください。
   ```

10. **実行確認のキャンセル**

    ```
    ❌ 削除をキャンセルしました。
    ```

11. **実行確認ダイアログのタイムアウト（60秒）**

    ```
    ⌛ タイムアウトしました。再度コマンドを実行してください。
    ```

12. **ページネイションセッションのタイムアウト**
    - 15分間操作がなかった場合
    - ボタン・セレクトメニューを無効化し、「セッションが期限切れです」と表示

---

## 📝 ログ記録

### ログフォーマット

```
[MsgDel] <実行者> deleted <合計削除件数> messages [from <対象ユーザー>] [keyword="<キーワード>"] [days=<N> | after=<日時> before=<日時>] channels=[<チャンネル名, ...>]
```

### 例

```
[MsgDel] Admin#1234 deleted 50 messages from Spammer#5678 channels=[general, random]
[MsgDel] Moderator#4321 deleted 100 messages keyword="広告" channels=[general, spam-channel, announcements]
[MsgDel] Admin#1234 deleted 30 messages from BadUser#9999 keyword="spam" channels=[general]
[MsgDel] Moderator#4321 deleted 80 messages from Spammer#5678 days=7 channels=[general, random]
[MsgDel] Admin#1234 deleted 45 messages after=2026-02-01 before=2026-02-27 channels=[general]
```

---

## 🧪 テストケース

最新の件数とカバレッジは [TEST_PROGRESS.md](../progress/TEST_PROGRESS.md) を参照。

### ユニットテスト

- [ ] 権限チェック
- [ ] `count`・`user`・`keyword` 全未指定時のバリデーション拒否
- [ ] `channel` のみ指定時のバリデーション拒否
- [ ] キーワード部分一致フィルター（大文字小文字を区別しない）
- [ ] ユーザー + キーワード複合フィルター
- [ ] メッセージフィルタリング（ユーザー指定）
- [ ] 14日制限フィルター
- [ ] 件数制限（全チャンネル合計で上限に達した場合）
- [ ] count 未指定時の全件削除ロジック
- [ ] サーバー全チャンネル取得（Bot アクセス不可チャンネルのスキップ）
- [ ] `days` 指定による期間フィルター（afterTs/beforeTs の計算）
- [ ] `after` / `before` の日付パースと boundary 計算（時刻省略補完）
- [ ] `days` + `after`/`before` 同時指定の排他バリデーション
- [ ] 無効な日付形式のエラー
- [ ] `after` > `before` のエラー
- [ ] フェッチ打ち切り最適化（バッチ最古メッセージが afterTs より前の場合）
- [ ] `showConfirmDialog` — 「✅ 削除する」押下で `"confirmed"` を返す
- [ ] `showConfirmDialog` — 「❌ キャンセル」押下で `"cancelled"` を返す
- [ ] `showConfirmDialog` — 60秒タイムアウトで `"timeout"` を返す
- [ ] `showConfirmDialog` — 「次回から確認しない」トグルで `skipNext` が変化する
- [ ] `showConfirmDialog` — 「次回から確認しない」ON + 「✅ 削除する」押下で `saveUserSetting` が呼ばれる
- [ ] `showConfirmDialog` — `skipNext = false` で「✅ 削除する」押下の場合、`saveUserSetting` が呼ばれない
- [ ] `getUserSetting` — DB 未登録時に `{ skipConfirm: false }` を返す
- [ ] `getUserSetting` / `saveUserSetting` のユーザー×ギルドごとの独立性

### インテグレーションテスト

- [ ] 通常削除（14日以内のメッセージ）
- [ ] 14日以上前のメッセージの個別削除
- [ ] 混在メッセージ（14日以内 + 14日以降）の削除
- [ ] キーワード指定削除（サーバー全体）
- [ ] ユーザー指定削除（サーバー全体）
- [ ] ユーザー + キーワード + channel 指定削除
- [ ] days 指定削除（全チャンネル横断）
- [ ] after + before の範囲指定削除
- [ ] after のみ指定削除
- [ ] before のみ指定削除
- [ ] count + days の組み合わせ（期間内で件数上限）
- [ ] channel 未指定でサーバー全チャンネルを横断して削除
- [ ] count 合計が全チャンネルをまたいで正しく機能すること
- [ ] すべてのフィルターオプション未指定時のエラー処理
- [ ] days と after の同時指定エラー
- [ ] after > before エラー
- [ ] 無効な日付形式エラー（after/before）
- [ ] afterTs 最適化によるフェッチ打ち切りの動作確認
- [ ] 権限不足エラー
- [ ] Cooldown 機能
- [ ] 同時実行時のエラーハンドリング（メッセージ削除競合）
- [ ] 大量削除時の進捗表示
- [ ] `skipConfirm = false` のユーザーが `/message-delete` を実行したとき確認ダイアログが表示される
- [ ] 確認ダイアログで「✅ 削除する」押下後に削除が実行される
- [ ] 確認ダイアログで「❌ キャンセル」押下後に削除が実行されない
- [ ] 確認ダイアログで「次回から確認しない」ON +「✅ 削除する」後、次回実行でダイアログが出ない
- [ ] `skipConfirm = true` のユーザーが `/message-delete` を実行したとき確認ダイアログをスキップする
- [ ] `/message-delete-config confirm:false` 実行後、次回の `/message-delete` でダイアログが出ない
- [ ] `/message-delete-config confirm:true` 実行後、次回の `/message-delete` でダイアログが復活する
- [ ] `/message-delete-config` の設定はユーザー×ギルドごとに独立している

### ページネイション・フィルターテスト

- [ ] 5件ごとにページが区切られること
- [ ] 1件のみの場合はページネイションボタンが表示されないこと
- [ ] ページネイション「前へ」「次へ」ボタンの動作
- [ ] 1ページ目で「前へ」が無効化されること
- [ ] 最終ページで「次へ」が無効化されること
- [ ] 投稿者フィルターで正しく絞り込まれること
- [ ] キーワードフィルターで正しく絞り込まれること
- [ ] 過去N日間フィルター（任意の数値を入力し、N日以内のメッセージのみ表示）
- [ ] 過去N日間に 1 未満または整数以外を入力した時のエラー表示
- [ ] 過去N日間入力時、after/before ボタンの無効化
- [ ] after/before 入力時、過去N日間ボタンの無効化
- [ ] after フィルター（指定日時以降のメッセージのみ表示）
- [ ] before フィルター（指定日時以前のメッセージのみ表示）
- [ ] after + before 両方指定の AND フィルター
- [ ] after/before 指定時、過去N日間ボタンが無効化されること
- [ ] after/before 指定時、Embed footer に after/before 日付が表示されること
- [ ] after/before に無効な日付入力時のエラー表示（フィルターは適用されない）
- [ ] after > before 入力時のエラー表示（フィルターは適用されない）
- [ ] after/before リセット後、過去N日間ボタンが再有効化されること
- [ ] 複数フィルターの AND 条件が正しく動作すること
- [ ] フィルターリセットで全件表示に戻ること
- [ ] 15分後にセッションがタイムアウトし、ボタンが無効化されること
- [ ] コマンド実行者以外がボタンを押した場合に弾かれること

---

## 🌐 多言語対応（i18next）

### ローカライゼーションキー

```typescript
// commands.json
export default {
  msgDel: {
    errors: {
      filterOptionsEmpty: {
        title: "警告",
        description:
          "フィルタ条件が指定されていないため実行できません。\n" +
          "`count`・`user`・`keyword`・`days`・`after`・`before` のいずれか1つを指定してください。",
      },
      invalidChannel: "テキストチャンネルを指定してください。",
      noMessages: "削除可能なメッセージが見つかりませんでした。",
      permissionDenied: "この操作を実行する権限がありません。",
      botPermissionDenied: "Botにメッセージ削除権限がありません。",
      failed: "メッセージの削除中にエラーが発生しました。",
      sessionExpired:
        "セッションが期限切れです。コマンドを再実行してください。",
      daysAndDateConflict:
        "`days` と `after`/`before` は同時に指定できません。どちらか一方を使用してください。",
      invalidAfterDate:
        "`after` の日付形式が不正です。`YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS` 形式で指定してください。",
      invalidBeforeDate:
        "`before` の日付形式が不正です。`YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS` 形式で指定してください。",
      afterAfterBefore: "`after` は `before` より前の日時を指定してください。",
    },
    confirm: {
      title: "⚠️ **この操作は取り消せません**",
      body: "以下の条件に一致するメッセージを削除します。実行しますか？",
      yes: "✅ 削除する",
      no: "❌ キャンセル",
      skipToggleOff: "[ ] 次回から確認しない",
      skipToggleOn: "[✓] 次回から確認しない",
      cancelled: "❌ 削除をキャンセルしました。",
      timeout: "⌛ タイムアウトしました。再度コマンドを実行してください。",
    },
    progress: {
      collecting: "削除中... ({{channel}}) 収集: {{count}}件",
      deleting: "削除中... {{current}}/{{total}}件",
      bulk: "削除中... {{current}}/{{total}}件 (一括削除)",
      individual:
        "削除中... {{current}}/{{total}}件 (14日以上前のメッセージを個別削除中...)",
    },
    success: {
      title: "✅ 削除完了",
      totalCount: "合計削除件数",
      channelBreakdown: "チャンネル別内訳",
      listTitle: "📋 削除したメッセージ一覧  ({{page}} / {{total}} ページ)",
      listTitleFiltered:
        "📋 削除したメッセージ一覧  ({{page}} / {{total}} ページ) （フィルター適用中）",
    },
    pagination: {
      prev: "◀ 前へ",
      next: "▶ 次へ",
      filterByAuthor: "投稿者でフィルター",
      filterByKeyword: "内容で検索 🔍",
      filterByDays: "過去N日間を入力 🔢",
      filterByDaysActive: "過去{{days}}日間 ✏️",
      filterByAfter: "after（開始日時）を入力 📅",
      filterByBefore: "before（終了日時）を入力 📅",
      filterByAfterActive: "after: {{date}} ✏️",
      filterByBeforeActive: "before: {{date}} ✏️",
      resetFilter: "リセット ✕",
      invalidDaysInput: "日数は1以上の整数で入力してください。",
    },
  },
  msgDelConfig: {
    success:
      "✅ 設定を更新しました。次回の `/message-delete` から反映されます。",
    confirmEnabled: "実行確認ダイアログ: 有効",
    confirmDisabled: "実行確認ダイアログ: 無効",
  },
};
```

---

## 関連ドキュメント

- [Discord.js - TextChannel.bulkDelete](https://discord.js.org/#/docs/discord.js/main/class/TextChannel?scrollTo=bulkDelete)
- [Discord.js - Message.fetch](https://discord.js.org/#/docs/discord.js/main/class/MessageManager?scrollTo=fetch)
- [Discord API - Bulk Delete Messages](https://discord.com/developers/docs/resources/channel#bulk-delete-messages)
