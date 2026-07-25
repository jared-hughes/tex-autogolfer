import { defineConfig, globalIgnores } from "eslint/config";
import love from "eslint-config-love";
import prettier from "eslint-config-prettier";

import tsParser from "@typescript-eslint/parser";

export default defineConfig(
  globalIgnores([
    ".*",
    "**/node_modules",
    "**/dist",
    "**/LICENSE",
    "**/.eslintrc.js",
    "**/*.json",
    "**/*.md",
    "**/*.tex",
    // TODO include
    "esbuild.mjs",
    "eslint.config.mjs",
  ]),
  love,
  prettier,
  {
    files: ["**"],

    basePath: import.meta.dirname,

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      parser: tsParser,
    },

    rules: {
      "@typescript-eslint/strict-boolean-expressions": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/restrict-plus-operands": "off",
      "@typescript-eslint/no-unused-vars": "off",

      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "no-type-imports" },
      ],

      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        { ignoreArrowShorthand: true },
      ],

      "no-console": "error",

      "@typescript-eslint/no-magic-numbers": "off",
      "@typescript-eslint/prefer-destructuring": "off",
      "prefer-template": "off",
      "no-param-reassign": "off",
      complexity: "off",
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        { allowDefaultCaseForExhaustiveSwitch: true },
      ],
      // This one's good, just disabling to avoid editing existing code.
      "@typescript-eslint/no-unsafe-type-assertion": "off",
      "require-unicode-regexp": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "no-plusplus": "off",
      "@typescript-eslint/no-misused-spread": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/init-declarations": "off",
      "no-negated-condition": "off",
    },
  },
);
