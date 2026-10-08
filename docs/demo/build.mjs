// 데모 HTML 과 assets/erp.css 를 만든다: node docs/demo/build.mjs
// src/pages/**/*.mjs 하나가 화면 하나다. 같은 경로의 .html 로 나간다(src/pages/stores/index.mjs → stores/index.html).
// 화면은 src/ui.mjs(1팀 공통 컴포넌트를 옮긴 것)로만 그린다.
// erp.css 는 앱과 같은 Tailwind 로 docs/demo 안을 훑어 만든다. 색·서체 토큰은 src/app/globals.css 의 ERP @theme 를 그대로 읽는다.
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdirSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resetIds } from "./src/ui.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const pagesDir = join(here, "src/pages");

const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : n.endsWith(".mjs") ? [p] : [];
  });

// 입구 화면(index)은 다른 화면을 다 그린 뒤 그 목록을 받아 맨 마지막에 그린다.
const isEntry = (f) => relative(pagesDir, f) === "index.mjs";
const files = walk(pagesDir).sort((a, b) => isEntry(a) - isEntry(b));
const built = [];
for (const file of files) {
  // relative() 는 윈도우에서 \ 로 나온다. split("/") 만 쓰면 깊이가 0으로 잘못 세어져
  // assets 상대 경로(../assets/)가 전부 assets/ 로 빠진다 — 슬래시를 먼저 통일한다.
  const rel = relative(pagesDir, file).replaceAll("\\", "/").replace(/\.mjs$/, ".html");
  const depth = rel.split("/").length - 1;
  const R = "../".repeat(depth); // 데모 루트까지
  const A = `${R}assets/`;
  resetIds();
  const { title, html } = (await import(pathToFileURL(file).href)).default({ A, R, pages: built });
  built.push({ rel, title, out: join(here, rel) });
  const out = join(here, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(
    out,
    `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Whale ERP 데모</title>
<link rel="stylesheet" href="${A}erp.css?v=__V__">
<script src="${A}erp.js?v=__V__" defer></script>
</head>
<body>
${html}
</body>
</html>
`,
  );
  console.log(rel);
}

// pnpm 은 postcss 를 최상위에 두지 않으므로 @tailwindcss/postcss 옆에서 찾는다.
const require = createRequire(realpathSync(join(root, "node_modules/@tailwindcss/postcss/package.json")));
const postcss = require("postcss");
const tailwind = require("@tailwindcss/postcss");
const theme = readFileSync(join(root, "src/app/globals.css"), "utf8").match(/@theme \{[^}]*--color-erp-[^}]*\}/)?.[0];
if (!theme) throw new Error("globals.css 에서 ERP @theme 블록을 찾지 못했다");
const input = `@import "tailwindcss" source(none);
@source "./";
${theme}
${readFileSync(join(here, "assets/base.css"), "utf8")}`;
const { css } = await postcss([tailwind()]).process(input, { from: join(here, "erp.input.css") });
writeFileSync(join(here, "assets/erp.css"), css);
console.log(`assets/erp.css ${(css.length / 1024).toFixed(1)}KB`);

// 자원 주소에 erp.js·erp.css 내용의 짧은 해시를 붙인다. 미니 nginx 가 캐시 헤더를 주지 않아 브라우저가 옛 erp.js 를
// 새 HTML 과 함께 쓰면 화면이 깨진다(2026-10-08 홈 월간 보기 빈 목록). 내용이 같으면 값도 같아 HTML 이 괜히 바뀌지 않는다.
const v = createHash("sha1").update(readFileSync(join(here, "assets/erp.js"))).update(css).digest("hex").slice(0, 8);
for (const { out } of built) writeFileSync(out, readFileSync(out, "utf8").replaceAll("__V__", v));
