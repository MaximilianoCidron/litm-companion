import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["src/**/*"],
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**/*" },
        { type: "feature", pattern: "src/features/*", mode: "folder", capture: ["name"] },
        { type: "shared", pattern: "src/shared/**/*" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              from: { type: "app" },
              allow: [
                { to: { type: "app" } },
                { to: { type: "feature" } },
                { to: { type: "shared" } },
              ],
            },
            {
              from: { type: "feature", captured: { name: "{{name}}" } },
              allow: [
                { to: { type: "feature", captured: { name: "{{name}}" } } },
                { to: { type: "shared" } },
              ],
            },
            {
              from: { type: "shared" },
              allow: [{ to: { type: "shared" } }],
            },
          ],
        },
      ],
      "boundaries/no-unknown": "error",
      "boundaries/no-unknown-files": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
