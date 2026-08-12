import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated animation data — large, machine-written, never hand-edited.
    "src/animations/*.json",
    // Vendored third-party build output (see scripts/vendor-pglite.mts).
    "public/pglite/**",
  ]),

  {
    rules: {
      // Underscore-prefixed bindings are the conventional way to say
      // "deliberately discarded", which we use when omitting keys from an
      // object via destructuring (e.g. Zustand's `partialize`).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
]);

export default eslintConfig;
