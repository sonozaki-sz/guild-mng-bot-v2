// eslint.config.js
// ESLint v9 フラット設定

import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "*.js"],
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      prettier: prettierPlugin,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      ...eslintConfigPrettier.rules,
      "prettier/prettier": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
    },
  },
  {
    files: ["src/shared/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "../locale",
              message:
                "shared内部ではbarrel import（../locale 等）を禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../locale",
              message:
                "shared内部ではbarrel import（../locale 等）を禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../locale",
              message:
                "shared内部ではbarrel import（../locale 等）を禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../../locale",
              message:
                "shared内部ではbarrel import（../locale 等）を禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../utils",
              message:
                "shared内部ではbarrel import（../locale 等）を禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../utils",
              message:
                "shared内部ではbarrel import（../locale 等）を禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../utils",
              message:
                "shared内部ではbarrel import（../locale 等）を禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../../utils",
              message:
                "shared内部ではbarrel import（../locale 等）を禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../errors",
              message:
                "shared内部ではbarrel import（../locale 等）を禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../errors",
              message:
                "shared内部ではbarrel import（../locale 等）を禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../errors",
              message:
                "shared内部ではbarrel import（../locale 等）を禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../../errors",
              message:
                "shared内部ではbarrel import（../locale 等）を禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../database",
              message:
                "shared内部ではbarrel import（../locale 等）を禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../database",
              message:
                "shared内部ではbarrel import（../locale 等）を禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../database",
              message:
                "shared内部ではbarrel import（../locale 等）を禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../../database",
              message:
                "shared内部ではbarrel import（../locale 等）を禁止し、直接モジュールをimportしてください。",
            },
          ],
          patterns: [
            {
              group: ["**/bot/**", "**/web/**"],
              message: "shared から bot/web への依存は禁止です。",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/bot/features/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "..",
              message:
                "bot/features内部ではfeatureローカルbarrel import（..）を禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../..",
              message:
                "bot/features内部ではfeatureローカルbarrel import（../..）を禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../..",
              message:
                "bot/features内部ではfeatureローカルbarrel import（../../..）を禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "./index",
              message:
                "bot/features内部ではindex経由importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../index",
              message:
                "bot/features内部ではindex経由importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../index",
              message:
                "bot/features内部ではindex経由importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../index",
              message:
                "bot/features内部ではindex経由importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../../shared/locale",
              message:
                "bot/features内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../../../shared/locale",
              message:
                "bot/features内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../../shared/utils",
              message:
                "bot/features内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../../../shared/utils",
              message:
                "bot/features内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../../shared/errors",
              message:
                "bot/features内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../../../shared/errors",
              message:
                "bot/features内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../../shared/database",
              message:
                "bot/features内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../../../shared/database",
              message:
                "bot/features内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/bot/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "../shared/locale",
              message:
                "bot内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../shared/locale",
              message:
                "bot内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../shared/locale",
              message:
                "bot内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../../shared/locale",
              message:
                "bot内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../shared/utils",
              message:
                "bot内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../shared/utils",
              message:
                "bot内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../shared/utils",
              message:
                "bot内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../../shared/utils",
              message:
                "bot内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../shared/errors",
              message:
                "bot内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../shared/errors",
              message:
                "bot内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../shared/errors",
              message:
                "bot内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../../shared/errors",
              message:
                "bot内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../shared/database",
              message:
                "bot内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../shared/database",
              message:
                "bot内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../shared/database",
              message:
                "bot内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../../shared/database",
              message:
                "bot内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
          ],
          patterns: [
            {
              group: ["**/web/**"],
              message: "bot から web への依存は禁止です。",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/web/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "../shared/locale",
              message:
                "web内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../shared/locale",
              message:
                "web内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../shared/locale",
              message:
                "web内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../shared/utils",
              message:
                "web内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../shared/utils",
              message:
                "web内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../shared/utils",
              message:
                "web内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../shared/errors",
              message:
                "web内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../shared/errors",
              message:
                "web内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../shared/errors",
              message:
                "web内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../shared/database",
              message:
                "web内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../shared/database",
              message:
                "web内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
            {
              name: "../../../shared/database",
              message:
                "web内部ではsharedのbarrel importを禁止し、直接モジュールをimportしてください。",
            },
          ],
          patterns: [
            {
              group: ["**/bot/**"],
              message: "web から bot への依存は禁止です。",
            },
          ],
        },
      ],
    },
  },
];
