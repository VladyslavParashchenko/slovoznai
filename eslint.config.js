import js from "@eslint/js"
import stylistic from "@stylistic/eslint-plugin"
import eslintConfigPrettier from "eslint-config-prettier"
import svelte from "eslint-plugin-svelte"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
  { ignores: ["build/**", ".svelte-kit/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs["flat/recommended"],
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  eslintConfigPrettier,
  ...svelte.configs["flat/prettier"],
  // Після eslint-config-prettier, бо він вимикає стильові правила.
  {
    plugins: { "@stylistic": stylistic },
    rules: { "@stylistic/semi": ["error", "never"] },
  },
)
