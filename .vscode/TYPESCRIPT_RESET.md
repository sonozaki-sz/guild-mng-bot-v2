# TypeScript Language Server のリセット手順

VSCodeでTypeScriptエラーが消えない場合、以下の手順を実行してください:

## 方法1: VSCodeコマンドで再起動 (推奨)

1. `Ctrl+Shift+P` (または `Cmd+Shift+P` on Mac)
2. "TypeScript: Restart TS Server" と入力して実行
3. または "Developer: Reload Window" を実行

## 方法2: VSCodeを再起動

VSCodeを完全に閉じて再起動してください。

## 確認事項

- ✅ ビルドは成功しています: `pnpm run build`
- ✅ 型チェックは成功しています: `pnpm run typecheck`
- ✅ tsconfig.json は正しく設定されています

エラーはVSCodeの言語サーバーのキャッシュ問題です。
上記の手順で解決します。
