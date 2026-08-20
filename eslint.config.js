import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "fixtures/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: { projectService: true },
      globals: { process: "readonly", URL: "readonly" }
    },
    rules: {
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "no-useless-escape": "off"
    }
  },
  {
    files: ["**/*.mjs"],
    languageOptions: { globals: { process: "readonly", URL: "readonly" } }
  }
);
