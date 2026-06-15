import { defineConfig } from "oxfmt";

export default defineConfig({
  ignorePatterns: [".agents/**", ".husky/**"],
  tabWidth: 2,
  semi: true,
  singleQuote: false,
  trailingComma: "es5",
  sortImports: {
    newlinesBetween: false,
    groups: [
      "type-import",
      ["value-builtin", "value-external"],
      "type-internal",
      "value-internal",
      ["type-parent", "type-sibling", "type-index"],
      ["value-parent", "value-sibling", "value-index"],
      "unknown",
    ],
  },
  sortTailwindcss: {
    stylesheet: "./src/app/globals.css",
    functions: ["clsx", "cn"],
    preserveWhitespace: false,
  },
  sortPackageJson: { sortScripts: true },
});
