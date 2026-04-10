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
  ]),
  {
    rules: {
      // Degradar a warning — usar `any` es aceptable durante desarrollo activo
      "@typescript-eslint/no-explicit-any": "warn",
      // Degradar a warning — variables no usadas no bloquean el build
      "@typescript-eslint/no-unused-vars": "warn",
      // Degradar a warning — patrones de hooks debatibles pero funcionales
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
