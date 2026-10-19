// node --test src/app/design/guest/guest-routes.test.ts
// 비로그인 화면 사이 링크가 로그인 없이 열리는 경로인지 본다 — 공개 경로에서 빠지면 proxy 가 /login 으로 보내고 공통 틀이 씌워진다.
import assert from "node:assert/strict";
import { test } from "node:test";
import { isPublicPath } from "../../../lib/auth-routes.ts";
import { SAMPLE_ROUTES, SITE_ROUTES } from "./guest-routes.ts";

test("비로그인 화면 링크(실제 · 샘플)는 모두 공개 경로다", () => {
  for (const [name, path] of [...Object.entries(SITE_ROUTES), ...Object.entries(SAMPLE_ROUTES)]) {
    // 해시·빈 값이 섞이면 이 검사가 뜻을 잃는다 — 표에는 경로만 둔다.
    assert.match(path, /^\/[^#]*$/, name);
    assert.equal(isPublicPath(path), true, `${name} ${path}`);
  }
});
