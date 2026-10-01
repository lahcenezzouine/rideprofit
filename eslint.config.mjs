import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // The thin client-side API layer (src/lib/apiClient.ts) and the
      // pages that consume it intentionally pass through loosely-typed
      // JSON straight from fetch() — the backend (src/lib/calculator.ts)
      // is the strictly-typed source of truth. Tightening these response
      // shapes is a nice-to-have, not a correctness issue.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
