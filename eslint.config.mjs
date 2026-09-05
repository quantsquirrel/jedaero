import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // 도구·플러그인 설치물. 출품 코드가 아니다.
      // ★ `npm run lint 경고 0` 이 릴리스 게이트다 (DESIGN-RULES §11).
      //   남의 코드 경고가 섞이면 우리 코드의 신호가 묻혀 게이트가 무의미해진다.
      "oh-my-design/**",
      ".claude/**",
    ],
  },
];

export default eslintConfig;
