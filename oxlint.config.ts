import { defineConfig } from "oxlint";

export default defineConfig({
  ignorePatterns: [".agents/**", ".husky/**"],
  categories: {
    correctness: "warn",
  },
  plugins: ["oxc", "import", "react", "typescript", "node", "promise", "eslint", "unicorn"],
  jsPlugins: ["eslint-plugin-check-file"],
  rules: {
    "eslint/no-unused-vars": "error",
    "prefer-template": "error",
    "unicorn/prefer-node-protocol": "error",
    "check-file/filename-naming-convention": [
      "error",
      {
        "**/*.{ts,tsx}": "KEBAB_CASE",
      },
      {
        ignoreMiddleExtensions: true,
      },
    ],
    "check-file/folder-naming-convention": [
      "error",
      {
        "src/**": "KEBAB_CASE",
      },
    ],
  },
  options: {
    typeAware: true,
    typeCheck: true,
  },
});
