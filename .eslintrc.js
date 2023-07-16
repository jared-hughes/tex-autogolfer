module.exports = {
  env: {
    browser: false,
    es2021: true,
  },
  extends: ["standard-with-typescript", "prettier"],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: "tsconfig.json",
  },
  ignorePatterns: [
    "node_modules",
    "dist",
    "LICENSE",
    // Opt-out instead of opt-in to avoid forgetting to include some js/ts file.
    ".eslintrc.js",
    "*.json",
    "*.md",
  ],
  parser: "@typescript-eslint/parser",
  rules: {
    "@typescript-eslint/strict-boolean-expressions": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/restrict-template-expressions": "off",
    "@typescript-eslint/no-confusing-void-expression": [
      "error",
      { ignoreArrowShorthand: true },
    ],
    "no-console": "error",
  },
};
