// 비로그인 소개 화면의 본문을 앱에서 그대로 떠 온다: (앱 dev 서버를 띄운 뒤) node docs/demo/snapshot-guest.mjs [http://localhost:3000]
// 앱 화면이 스크롤 고정 · 펼침 목록 · 화면 조각처럼 손으로 옮기기 어려운 모양이 되어(2026-11-10), 데모는 앱이 서버에서 그린 본문 HTML 을
// src/snapshots/*.html 로 저장해 쓴다 — 문구 · 클래스가 앱과 한 글자도 다르지 않다. 머리말 · 푸터는 데모 것을 그대로 쓴다.
// 클라이언트에서 움직이는 부분(스크롤로 바뀌는 기능 · 펼침)은 서버가 그린 첫 상태(첫 기능 · 첫 항목 펼침)로 멈춰 보인다.
// 그림 주소는 __A__guest/… 로, 화면 사이 링크는 데모 경로(__R__home/….html)로 바꾼다. 앱 public/guest 의 그림은 assets/guest 로 맞춰 복사한다.
import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const base = process.argv[2] ?? "http://localhost:3000";

const PAGES = {
  index: "/",
  "store-operations": "/store-operations",
  "finance-management": "/finance-management",
  franchise: "/franchise",
  "add-on-services": "/add-on-services",
};

const LINKS = {
  "/": "home/index.html",
  "/store-operations": "home/store-operations.html",
  "/finance-management": "home/finance-management.html",
  "/franchise": "home/franchise.html",
  "/add-on-services": "home/add-on-services.html",
  "/notices": "home/notices.html",
  "/leads": "home/inquiry.html",
  "/leads/new": "home/inquiry.html",
  "/login": "auth/login.html",
  "/sign-up": "auth/signup.html",
  "/signup": "auth/signup.html",
};

// 스트리밍된 본문(<div hidden id="S:n">)을 자리(<template id="B:n"> · <template id="P:n">)에 끼워 하나로 맞춘다.
function assemble(html) {
  const blocks = {};
  const re = /<div hidden id="S:(\d+)">/g;
  let m;
  while ((m = re.exec(html))) {
    const start = m.index + m[0].length;
    const end = html.indexOf("<script", start);
    blocks[m[1]] = html.slice(start, end).replace(/<\/div>\s*$/, "");
  }
  const h = html.indexOf("</header>") + "</header>".length;
  const f = html.indexOf("<footer");
  let main = html.slice(h, f);
  for (let i = 0; i < 10 && /<template id="[BP]:\d+"><\/template>/.test(main); i++) main = main.replace(/<template id="[BP]:(\d+)"><\/template>/g, (_, n) => blocks[n] ?? "");
  return main;
}

function rewrite(html) {
  return html
    .replace(/ srcSet="[^"]*"/g, "")
    .replace(/ (vt-update|vt-enter)="[^"]*"/g, "")
    .replace(/<!--\/?\$\??-->/g, "")
    .replace(/src="\/_next\/image\?url=([^&"]+)[^"]*"/g, (_, u) => `src="__A__${decodeURIComponent(u).replace(/^\//, "")}"`)
    .replace(/src="\/guest\//g, 'src="__A__guest/')
    .replace(/href="(\/[^"#?]*)([^"]*)"/g, (all, path, rest) => (LINKS[path] ? `href="__R__${LINKS[path]}${rest}"` : all));
}

mkdirSync(join(here, "src/snapshots"), { recursive: true });
for (const [name, path] of Object.entries(PAGES)) {
  const res = await fetch(base + path);
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  const main = rewrite(assemble(await res.text()));
  writeFileSync(join(here, `src/snapshots/${name}.html`), main);
  console.log(`src/snapshots/${name}.html ${(main.length / 1024).toFixed(1)}KB`);
}
cpSync(join(root, "public/guest"), join(here, "assets/guest"), { recursive: true });
console.log("assets/guest ← public/guest");
