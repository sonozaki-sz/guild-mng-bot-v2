# テスト実装進捗

> テストの実装状況と今後の計画

最終更新: 2026年2月28日

**関連**: [TODO.md](../../TODO.md) - タスク管理 | [IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md) - 実装進捗

---

## 📊 現在のテスト状況

### 最新テスト実行結果（2026年2月28日）

- ✅ **全テスト PASSED**: 987/987
- ✅ **全スイート PASSED**: 206/206
- ⏱️ **実行時間**: ~4秒
- 📦 **カバレッジ（global）**: statements 100% / functions 100% / lines 100% / branches 99.19%
- 🎯 **ブランチ0.81%の残差**: v8が async/await を Generator 変換する際に生成する内部追跡ブランチ（`stickyMessageSetEmbedModalHandler.ts` / `stickyMessageUpdateEmbedModalHandler.ts` / `stickyMessageViewSelectHandler.ts` 内の `|| null` / `??` 演算子）のアーティファクトであり、実際のロジックブランチはすべてカバー済み
- ✅ **カバレッジしきい値**: `branches: 99, functions: 100, lines: 100, statements: 100`（`vitest.config.ts` 設定済み / 全クリア）

### ✅ カバレッジ100% 作業ステータス（完了）

- **達成日**: 2026年2月25日
- **結果**: statements 100% / functions 100% / lines 100% / branches 99.19%（v8 async内部ブランチのみ残差）
- **`vitest.config.ts` thresholds**: `{ branches: 99, functions: 100, lines: 100, statements: 100 }` 設定済み
- **除外ファイル（型専用/再エクスポートのみ）**:
  - `src/shared/database/stores/usecases/bumpReminderStoreContext.ts`
  - `src/bot/features/bump-reminder/repositories/types.ts`
  - `src/bot/features/sticky-message/repositories/types.ts`
  - `src/bot/handlers/interactionCreate/ui/types.ts`
  - `src/shared/errors/errorHandler.ts`

**主な追加テストファイル（2026-02-25）**

| ファイル                                       | 対象                     |
| ---------------------------------------------- | ------------------------ |
| `stickyMessagePayloadBuilder.test.ts`          | ペイロードビルダー       |
| `stickyMessageResendService.test.ts`           | 再送サービス             |
| `stickyMessageRepository.test.ts`              | リポジトリ               |
| `stickyMessageConfigService.test.ts` (shared)  | 設定サービス             |
| `botStickyMessageDependencyResolver.test.ts`   | DI解決                   |
| `stickyMessageCreateHandler.test.ts`           | 作成ハンドラ             |
| `sticky-message.test.ts` (commands)            | コマンドファイル         |
| `stickyMessageCommand.execute.test.ts`         | コマンド実行             |
| `stickyMessageRemove.test.ts`                  | 削除ユースケース         |
| `stickyMessageSet.test.ts`                     | 設定ユースケース         |
| `stickyMessageUpdate.test.ts`                  | 更新ユースケース         |
| `stickyMessageView.test.ts`                    | 閲覧ユースケース         |
| `stickyMessageSetModalHandler.test.ts`         | SetModalハンドラ         |
| `stickyMessageSetEmbedModalHandler.test.ts`    | SetEmbedModalハンドラ    |
| `stickyMessageUpdateModalHandler.test.ts`      | UpdateModalハンドラ      |
| `stickyMessageUpdateEmbedModalHandler.test.ts` | UpdateEmbedModalハンドラ |
| `stickyMessageViewSelectHandler.test.ts`       | ViewSelectハンドラ       |

### src↔tests マッピング監査クローズ（2026年2月21日）

- `src` 対称マッピング監査の残件は **0件としてクローズ**
- `src/**/*.d.ts`（例: `src/shared/locale/i18next.d.ts`）は監査対象外に統一
- 根拠: 宣言ファイルは Vitest 実行対象ではなく、`*.test.ts` との1:1対応を要求しない

### モジュール別カバレッジ

| モジュール             | カバレッジ | 状態 | テスト数 |
| ---------------------- | ---------- | ---- | -------- |
| メッセージレスポンス   | 100%       | ✅   | 17       |
| CustomErrors           | 100%       | ✅   | 19       |
| CooldownManager        | 100%       | ✅   | 22       |
| GuildConfigRepository  | 100%       | ✅   | 30       |
| Logger                 | 100%       | ✅   | 15       |
| Environment Config     | 100%       | ✅   | 11       |
| ErrorHandler           | 100%       | ✅   | 14       |
| BumpReminderRepository | 100%       | ✅   | 26       |
| BumpReminderService    | 100%       | ✅   | 21       |
| StickyMessage (all)    | 100%       | ✅   | 100+     |

**注**: 主要な共有モジュールは十分にテストされています。全体カバレッジが低いのは、コマンド、イベント、Web API等の未テストモジュールが多数あるためです。

---

## 🎯 今後のテスト拡張

### 後続フェーズ（1-2ヶ月）🟡

基盤テストの整備後に拡張する領域。

#### Locale（多言語対応テスト）

- [ ] **LocaleManager**
  - 言語切り替え
  - フォールバック処理
  - コマンドローカライゼーション自動生成

- [ ] **翻訳の完全性テスト**
  - すべてのキーが定義されているか
  - プレースホルダーの一貫性
  - 複数形対応

#### Web Routes（Web APIテスト）

- [ ] **ギルド管理API**
  - 認証とアクセス制御
  - CRUD操作
  - バリデーション
  - エラーレスポンス

※ `health` / `ready` ルートは実装済み（`tests/unit/web/routes/health.test.ts`）。

#### Repositories（リポジトリテスト）

- [x] **StickyMessage リポジトリ**（`stickyMessageRepository.test.ts`）
- [ ] **将来のリポジトリ**
  - VAC関連
  - その他機能拡張に伴うリポジトリ

---

### 長期フェーズ（機能安定後）🟢

運用最適化・品質保証を強化する領域。

#### E2E テスト

- [ ] **主要ユーザーフローの検証**
  - コマンド実行からDB保存までの完全フロー
  - イベント処理の完全フロー
  - エラーリカバリーフロー

- [ ] **実際のDiscord環境での動作確認**
  - テストサーバーでの自動テスト
  - 主要機能の動作検証

#### パフォーマンステスト

- [ ] **負荷テスト**
  - 大量コマンド実行
  - 大量データ処理
  - メモリリーク検証

- [ ] **ベンチマーク**
  - 応答時間の測定
  - スループットの測定
  - リソース使用量の測定

---

## 📈 カバレッジ目標

### 短期目標（1-2ヶ月）

- **全体カバレッジ**: ✅ **100%達成**（statements/functions/lines）、branches 99.19%
- **コアモジュール**: ✅ 全モジュール 100%
- **新機能**: 実装と同時にテスト作成（方針継続）

### 中期目標（3-6ヶ月）

- **統合テスト**: 主要フローをカバー
- **E2Eテスト**: 基本的なユーザーフローを実装

### 長期目標

- **E2Eテスト**: 包括的なカバレッジ
- **パフォーマンステスト**: 継続的な監視

---

## 🏆 マイルストーン

### Phase 1: コアモジュールの完全カバー ✅

- [x] エラーハンドリング
- [x] データベース基盤
- [x] ロガー
- [x] 環境設定
- [x] クールダウン管理

### Phase 2: Bot機能のテスト ✅

- [x] コマンドのテスト（/ping, /afk, /afk-config, /vac, /vac-config, /bump-reminder-config）
- [x] イベントのテスト（clientReady, interactionCreate, messageCreate, voiceStateUpdate, channelDelete）
- [x] スケジューラーのテスト（JobScheduler, VACハンドラ, Bumpハンドラ）
- [x] sticky-message 全機能のユニットテスト（17ファイル新規作成）
- **目標**: 2026年3月末 → **完了**: 2026年2月22日

### Phase 2.5: カバレッジ100%達成 ✅

- [x] 全モジュールの statements/functions/lines 100%
- [x] v8 thresholds 設定 `{ branches: 99, functions: 100, lines: 100, statements: 100 }`
- [x] 型専用ファイル5件を coverage.exclude に追加
- **完了**: 2026年2月25日

### Phase 3: Web UIと統合テスト

- [ ] Web APIのテスト
- [ ] 統合テストの拡充
- [ ] E2Eテストの基盤構築
- **目標**: 2026年5月末

### Phase 4: 完全なテストカバレッジ ✅（単体テスト達成）

- [x] 全機能の**単体テスト**完了（statements/functions/lines 100%）
- [ ] パフォーマンステスト実装
- [ ] CI/CDでの継続的なテスト実行
- **目標**: 2026年7月末（E2E / パフォーマンス等の残タスク）

---

## 📝 メモ

### テスト実装時の注意点

1. **テストファーストを心がける**
   - 新機能は可能な限りTDDで開発
   - バグ修正時は再現テストを先に書く

2. **メンテナンス性を重視**
   - ヘルパー関数を積極的に活用
   - テストコードも品質を保つ

3. **実行速度に注意**
   - 遅いテストは並列化を検討
   - 統合テストは必要最小限に

4. **継続的な改善**
   - カバレッジレポートを定期的に確認
   - 低カバレッジのモジュールを優先的にテスト

---

## 🔗 関連ドキュメント

- [TESTING_GUIDELINES.md](TESTING_GUIDELINES.md) - テスト方針・ガイドライン
- [TODO.md](../TODO.md) - 開発タスク一覧
