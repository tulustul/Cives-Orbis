import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import eslintPluginJsonSchemaValidator from "eslint-plugin-json-schema-validator";
import boundaries from "eslint-plugin-boundaries";

export default tseslint.config(
  ...eslintPluginJsonSchemaValidator.configs["flat/recommended"],
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      boundaries
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      "react-hooks/exhaustive-deps": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "boundaries/element-types": ['error', {
        default: "disallow",
        rules: [
          { from: "main", allow: ["shared", "main"] },
          { from: "worker", allow: ["shared", "worker"] },
        ]
      }],
      "boundaries/no-unknown-files": 'error',
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
          alwaysTryTypes: true,
        },
        alias: {
          map: [["@", "./src"]],
          extensions: [".ts", ".tsx", ".js", ".jsx"]
        },
      },
      "boundaries/include": ["src/**"],
      "boundaries/elements": [
        { type: "shared", pattern: "src/shared/**" },
        { type: "worker", pattern: "src/ai/**" },
        { type: "worker", pattern: "src/map-generators/**" },
        { type: "worker", pattern: "src/core/**" },
        { type: "main", pattern: "src/bridge/**" },
        { type: "main", pattern: "src/renderer/**" },
        { type: "main", pattern: "src/ui/**" },
        { type: "main", pattern: "src/utils/**" },
        { type: "tooling", pattern: "src/vite-env.d.ts", mode:'file' },
      ],
    }
  },
)
