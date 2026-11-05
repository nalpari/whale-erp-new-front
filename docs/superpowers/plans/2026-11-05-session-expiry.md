# 세션 만료 처리 (C6) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

날짜: 2026-11-05 · 작성: 류제영(Claude 협업) · 설계: `docs/superpowers/specs/2026-11-05-session-expiry-design.md`

**Goal:** 세션이 끝난 것을 알게 되는 모든 곳에서, 화면 이동 중이면 로그인 화면에 만료 문구를, 쓰는 중이면 만료 팝업 하나를 보인다. 로그아웃 실패 문구도 바꾼다.

**Architecture:** 서버는 서버 액션의 401 에서 세션 쿠키를 지우고 30초짜리 표시 쿠키 `session-expired` 를 심는다. 브라우저는 `window.fetch` 를 한 번 감싸 서버 액션 응답에서 처음 보는 표시를 찾으면 팝업 신호를 보내고 결과를 화면에 넘기지 않는다. BFF 조회 · 업로드 창구 401 은 그 자리에서 같은 신호를 보낸다. 화면 이동 · 서버 렌더 401 은 `/login?reason=expired` 로 보내고, proxy 가 남은 쿠키를 갱신으로 확인해 정리한다.

**Tech Stack:** Next 16.3.3 (App Router · 서버 액션 · proxy), React 19.2, TypeScript, `node --test`(Node 24 타입 벗기기, 테스트 도구 없음)

## Global Constraints

- 문구(2026-11-05 결정, 그대로 쓴다)
  - 로그인 화면 `?reason=expired`: 「로그인이 만료되었습니다. 다시 로그인해 주세요.」 — LOGIN 버튼 위 빨간 한 줄(`login-form.tsx:147` 자리, 지금 `reason=account` 문구 자리)
  - 만료 팝업: 제목 「로그인 만료」, 본문 「로그인이 만료되었습니다. 다시 로그인해 주세요.」, 버튼 [확인] 하나, 취소 · Esc 없음
  - 로그아웃 실패 `alert`: 「로그아웃하지 못했습니다. 새로고침 후 다시 시도해 주세요.」
- 이유 값: `expired`. 쿼리 이름은 기존 `reason`(`LOGOUT_REASON_PARAM`).
- 표시 쿠키: 이름 `session-expired`, 값 = 시각(ms), `maxAge` 30, `path=/`, `sameSite=lax`, httpOnly 아님.
- 만료로 보지 않는 api(서버 표시 제외): `/auth/admin/password-change` · `/auth/admin/me/withdraw` · `/auth/admin/logout` — 정확히 그 경로만.
- 이벤트 이름: `whale-erp:session-expired`.
- 쿠키 감지(cookieStore · 주기 확인)와 대체 장치는 두지 않는다.
- `next/*` 를 import 하는 파일은 `node --test` 로 직접 시험하지 않는다 — 판정은 next 없는 파일의 순수 함수로 떼어 시험한다(기존 `auth-routes.ts` · `sign-out.ts` 방식).
- api 변경 없음. 짝 api 브랜치(`mantine`)에 요청할 것 없음.
- 커밋 · 푸시는 사용자가 맡겼을 때만 한다. 커밋 규칙: 영어 type + 한글 subject, `git add -A` 금지, `.playwright-mcp/` 넣지 않음, 끝 줄 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- 테스트 계정은 새로 만든 것만 쓴다. 사업자번호가 필요하면 먼저 묻는다.

---

## 파일 지도

| 파일 | 맡는 일 |
|---|---|
| `src/lib/auth-routes.ts` (고침) | 이유 `expired` · 문구 · `loginPathOf(…, reason)` · 만료 로그인 확인 판정 2개 |
| `src/lib/session-expiry.ts` (새 파일, next 없음) | 표시 쿠키 이름 · 모양, 표시 꺼내기, 서버 표시 판정, fetch 감싸기, 신호 |
| `src/lib/session-expiry.test.ts` (새 파일) | 위 순수 함수 시험 |
| `src/lib/redirect-expired.ts` (새 파일, 서버 전용) | `redirectExpired()` |
| `src/lib/api.ts` (고침) | `request()` · `requestRaw()` 401 → `markSessionExpired()` |
| `src/proxy.ts` (고침) | `toLogin` 이유, `/login?reason=expired` 갱신 확인 |
| `src/app/(public)/(site)/login/actions.ts` (고침) | 표시 쿠키 삭제 · `RedirectType.replace` |
| `src/components/site/session-gate.tsx` (고침) | 감시 설치 · 팝업 · 첫 준비 · 맞추기 |
| 신호 넣는 곳 7곳 · 계약서 파일 받기 | `notifySessionExpired()` · `?reason=expired` |
| 서버가 그리는 화면 약 17곳 | `redirectExpired()` |
| 서버 액션 · 화면의 401 분기 약 30곳 | 삭제 |
| `sign-out.ts` · 로그아웃 3곳 | 문구 · `signOut()` |

---

### Task 0: 준비

**Files:** 없음

- [ ] **Step 1: 의존성 설치**

워크트리 루트(`C:\workspace\.whale-erp-worktrees\whale-erp-new-front\golden-gate`)에서:

Run: `pnpm install`
Expected: 설치 완료(오류 없음)

- [ ] **Step 2: .env 복사(서버를 띄울 때만)**

메인 체크아웃의 `.env*` 를 이 워크트리 루트로 복사한다(`copy C:\workspace\whale-erp\whale-erp-new-front\.env* .` — 메인 경로는 `git worktree list` 로 확인).

- [ ] **Step 3: 기준 테스트**

Run: `pnpm test`
Expected: 전부 PASS. 실패가 있으면 이 작업 전부터 있던 것인지 기록하고 멈춘다.

---

### Task 1: 로그인 이유 `expired`

**Files:**
- Modify: `src/lib/auth-routes.ts`
- Test: `src/lib/auth-routes.test.ts`

**Interfaces:**
- Produces:
  - `EXPIRED_REASON = "expired"`, `EXPIRED_MESSAGE = "로그인이 만료되었습니다. 다시 로그인해 주세요."`
  - `logoutNoticeOf(value: unknown): string | null` — `account` · `expired` 를 읽는다
  - `loginPathOf(pathname: string, method = "GET", reason?: string): string`
  - `checksExpiredLogin(pathname: string, method: string, isAction: boolean, reason: string | null): boolean`
  - `type ExpiredLoginStep = "clear" | "home" | "stay"`, `expiredLoginStepOf(refreshed: "unauthorized" | "ok" | "failed"): ExpiredLoginStep`

- [ ] **Step 1: 실패하는 테스트 쓰기**

`src/lib/auth-routes.test.ts` 의 import 에 `checksExpiredLogin, EXPIRED_MESSAGE, EXPIRED_REASON, expiredLoginStepOf` 를 더하고 파일 끝에 붙인다:

```ts
test("로그인 화면 ?reason=expired — 만료 문구. account 는 그대로, 모르는 값은 무시", () => {
  assert.equal(EXPIRED_REASON, "expired");
  assert.equal(EXPIRED_MESSAGE, "로그인이 만료되었습니다. 다시 로그인해 주세요.");
  assert.equal(logoutNoticeOf("expired"), EXPIRED_MESSAGE);
  assert.equal(logoutNoticeOf("account"), ACCOUNT_CHANGED_MESSAGE);
  assert.equal(logoutNoticeOf("other"), null);
  assert.equal(logoutNoticeOf(["expired"]), null);
});

test("loginPathOf — 이유를 붙이고, 돌아올 곳(?next=)과 함께 붙는다", () => {
  assert.equal(loginPathOf("/stores", "GET", EXPIRED_REASON), "/login?reason=expired");
  assert.equal(loginPathOf("/excel-downloads/41", "GET", EXPIRED_REASON), "/login?next=%2Fexcel-downloads%2F41&reason=expired");
  // 서버 액션 POST 에는 next 를 붙이지 않지만 이유는 붙인다
  assert.equal(loginPathOf("/excel-downloads/41", "POST", EXPIRED_REASON), "/login?reason=expired");
  // 이유가 없으면 지금과 같다
  assert.equal(loginPathOf("/stores"), "/login");
  assert.equal(loginPathOf("/excel-downloads/41"), "/login?next=%2Fexcel-downloads%2F41");
});

test("checksExpiredLogin — /login?reason=expired 를 여는 GET 만 갱신으로 확인한다", () => {
  assert.equal(checksExpiredLogin("/login", "GET", false, "expired"), true);
  // 로그인 제출(서버 액션 POST)은 건드리지 않는다 — 로그인 액션의 새 쿠키와 겹친다
  assert.equal(checksExpiredLogin("/login", "POST", true, "expired"), false);
  assert.equal(checksExpiredLogin("/login", "GET", true, "expired"), false);
  assert.equal(checksExpiredLogin("/login", "GET", false, "account"), false);
  assert.equal(checksExpiredLogin("/login", "GET", false, null), false);
  assert.equal(checksExpiredLogin("/find", "GET", false, "expired"), false);
});

test("expiredLoginStepOf — 401 이면 쿠키 삭제, 살아 있으면 홈, 그 밖은 그대로", () => {
  assert.equal(expiredLoginStepOf("unauthorized"), "clear");
  assert.equal(expiredLoginStepOf("ok"), "home");
  assert.equal(expiredLoginStepOf("failed"), "stay");
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test src/lib/auth-routes.test.ts`
Expected: FAIL — `EXPIRED_REASON` 등이 export 되지 않음

- [ ] **Step 3: 구현**

`src/lib/auth-routes.ts` 에서 `ACCOUNT_CHANGED_MESSAGE` 줄과 `logoutNoticeOf` 를 아래로 바꾼다:

```ts
export const ACCOUNT_CHANGED_MESSAGE = "계정 상태가 변경되어 로그아웃되었습니다.";
/** 이 브라우저에서 로그인해 있다가 세션이 끝남(시간 만료 · 다른 곳 로그인 · 관리자 초기화) — api 가 이유를 알리지 않아 한 문장(2026-11-05 결정). */
export const EXPIRED_REASON = "expired";
export const EXPIRED_MESSAGE = "로그인이 만료되었습니다. 다시 로그인해 주세요.";
const NOTICES: Record<string, string> = { [ACCOUNT_CHANGED_REASON]: ACCOUNT_CHANGED_MESSAGE, [EXPIRED_REASON]: EXPIRED_MESSAGE };
/** 로그인 화면 쿼리의 이유 → 안내 문구. 모르는 값이면 null. */
export const logoutNoticeOf = (value: unknown): string | null => (typeof value === "string" && Object.hasOwn(NOTICES, value) ? NOTICES[value] : null);
```

`loginPathOf` 를 바꾼다(주석 첫 줄에 「reason 이 있으면 ?reason= 도 붙인다」를 더한다):

```ts
export function loginPathOf(pathname: string, method = "GET", reason?: string): string {
  const back = method === "GET" ? returnPathOf(pathname) : null;
  const params = new URLSearchParams();
  if (back) params.set(RETURN_PARAM, back);
  if (reason) params.set(LOGOUT_REASON_PARAM, reason);
  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}
```

파일 끝에 더한다:

```ts
/**
 * 세션 쿠키를 들고 /login?reason=expired 를 연 요청을 proxy 가 갱신으로 확인할지. 서버가 그리는 화면은 쿠키를 지울 수 없어
 * 이 주소로 보내고 proxy 가 정리한다(redirectExpired). 화면을 여는 GET 만 — 로그인 제출(서버 액션 POST)도 이 주소로 가므로,
 * 거기서 쿠키를 지우면 로그인 액션이 쓰는 새 쿠키와 같은 응답에서 겹친다(proxy 의 서버 액션 갱신 건너뛰기와 같은 이유).
 */
export function checksExpiredLogin(pathname: string, method: string, isAction: boolean, reason: string | null): boolean {
  return pathname === "/login" && method === "GET" && !isAction && reason === EXPIRED_REASON;
}

export type ExpiredLoginStep = "clear" | "home" | "stay";
/** 위 확인의 갱신 결과 → 할 일. 401 = 세션이 끝남(쿠키 삭제 후 로그인 화면), 200 = 살아 있음(새 쿠키 · 홈), 그 밖(api 꺼짐 · 시간 초과 · 5xx) = 쿠키를 두고 로그인 화면. */
export function expiredLoginStepOf(refreshed: "unauthorized" | "ok" | "failed"): ExpiredLoginStep {
  return refreshed === "unauthorized" ? "clear" : refreshed === "ok" ? "home" : "stay";
}
```

- [ ] **Step 4: 통과 확인**

Run: `node --test src/lib/auth-routes.test.ts`
Expected: PASS (기존 테스트 포함)

- [ ] **Step 5: 커밋 지점** — `feat: 로그인 화면 만료 이유 추가` (`src/lib/auth-routes.ts`, `src/lib/auth-routes.test.ts`)

---

### Task 2: 브라우저 감시 `session-expiry.ts`

**Files:**
- Create: `src/lib/session-expiry.ts`
- Test: `src/lib/session-expiry.test.ts`

**Interfaces:**
- Produces:
  - `EXPIRED_COOKIE = "session-expired"`, `SESSION_EXPIRED_EVENT = "whale-erp:session-expired"`
  - `expiredMarkOf(cookie: string): string | null`
  - `expiredCookie(now: number): { name; value; maxAge: 30; path: "/"; sameSite: "lax"; secure: boolean }`
  - `marksExpiry(path: string, init: RequestInit, isAction: boolean): boolean`
  - `watchedFetch(base: typeof fetch, readMark: () => string | null, onExpired: () => void): typeof fetch`
  - `notifySessionExpired(): void`, `installSessionExpiryWatch(): void`

- [ ] **Step 1: 실패하는 테스트 쓰기**

`src/lib/session-expiry.test.ts`:

```ts
// node --test src/lib/session-expiry.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { EXPIRED_COOKIE, expiredCookie, expiredMarkOf, marksExpiry, watchedFetch } from "./session-expiry.ts";

test("expiredMarkOf — 표시 쿠키 값만 꺼낸다", () => {
  assert.equal(expiredMarkOf("a=1; session-expired=1730790000000; login-key=x"), "1730790000000");
  assert.equal(expiredMarkOf("session-expired=5"), "5");
  assert.equal(expiredMarkOf("a=1; login-key=x"), null);
  assert.equal(expiredMarkOf(""), null);
  assert.equal(expiredMarkOf("my-session-expired=5"), null);
});

test("expiredCookie — 30초 · 화면 스크립트가 읽는다", () => {
  const c = expiredCookie(123);
  assert.equal(c.name, EXPIRED_COOKIE);
  assert.equal(c.value, "123");
  assert.equal(c.maxAge, 30);
  assert.equal(c.path, "/");
  assert.equal(c.sameSite, "lax");
  assert.equal("httpOnly" in c, false);
});

test("marksExpiry — 토큰을 실은 서버 액션의 401 만, 제외 경로는 빼고", () => {
  const auth = { headers: { Authorization: "Bearer t" } };
  assert.equal(marksExpiry("/stores", auth, true), true);
  assert.equal(marksExpiry("/stores?page=2", auth, true), true);
  assert.equal(marksExpiry("/auth/admin/me/withdraw-eligibility", auth, true), true);
  assert.equal(marksExpiry("/auth/admin/password-change", auth, true), false);
  assert.equal(marksExpiry("/auth/admin/me/withdraw", auth, true), false);
  assert.equal(marksExpiry("/auth/admin/logout", auth, true), false);
  assert.equal(marksExpiry("/stores", {}, true), false); // 토큰 없음(로그인 등)
  assert.equal(marksExpiry("/stores", auth, false), false); // 서버가 그리는 화면 · 라우트
  assert.equal(marksExpiry("/stores", { headers: new Headers({ authorization: "Bearer t" }) }, true), true);
});

const ok = () => Promise.resolve(new Response("ok"));
const action = { method: "POST", headers: { "Next-Action": "abc" } };
const settled = async (p: Promise<unknown>) => Promise.race([p.then(() => true), new Promise((r) => setTimeout(() => r(false), 20))]);

test("watchedFetch — 처음 보는 표시가 붙은 서버 액션 응답은 넘기지 않고 한 번만 알린다", async () => {
  let mark: string | null = null;
  let calls = 0;
  const f = watchedFetch(ok, () => mark, () => calls++);
  mark = "1";
  assert.equal(await settled(f("/stores", action)), false);
  assert.equal(calls, 1);
  // 같은 표시로 두 번 알리지 않는다
  assert.equal(await settled(f("/stores", action)), true);
  assert.equal(calls, 1);
  // 새 표시면 다시
  mark = "2";
  assert.equal(await settled(f("/stores", action)), false);
  assert.equal(calls, 2);
});

test("watchedFetch — 일반 요청 · 표시 없는 응답 · 감싸기 전 표시는 그대로 넘긴다", async () => {
  let calls = 0;
  const before = watchedFetch(ok, () => "0", () => calls++);
  assert.equal(await settled(before("/stores", action)), true); // 감싸기 전부터 있던 표시
  const f = watchedFetch(ok, () => null, () => calls++);
  assert.equal(await (await f("/api/stores")).text(), "ok");
  assert.equal(await settled(f("/stores", action)), true);
  let mark: string | null = null;
  const g = watchedFetch(ok, () => mark, () => calls++);
  mark = "9";
  assert.equal(await settled(g("/api/stores")), true); // 서버 액션이 아니면 표시가 있어도 넘긴다
  assert.equal(await settled(g(new Request("http://x/stores", action))), false); // Request 로 와도 헤더를 본다
  assert.equal(calls, 1);
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test src/lib/session-expiry.test.ts`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`src/lib/session-expiry.ts`:

```ts
// 세션 만료를 화면에 알리는 길. next/* 를 import 하지 않는다 — node --test 가 그대로 읽고, 서버(api.ts)도 같은 이름 · 판정을 쓴다.
// 서버: 서버 액션이 api 401 을 받으면 세션 쿠키를 지우고 표시 쿠키(시각, 30초)를 심는다(api.ts markSessionExpired).
// 브라우저: window.fetch 를 한 번 감싸 서버 액션 응답에 처음 보는 표시가 있으면 신호를 보내고 결과를 화면에 넘기지 않는다 —
// 화면마다의 401 처리 없이 팝업 하나만 뜬다(SessionGate). BFF 조회 · 업로드 창구 401 은 그 자리에서 notifySessionExpired() 를 부른다.
// 서버 액션이 window.fetch 로 나가는 것은 Next 16.3.3 소스(segment-cache/fetch.js · server-action-reducer.js)로 확인한 사실이지
// 약속된 동작이 아니다. Next 를 올릴 때 다시 확인한다 — 깨지면 서버 액션 401 은 api 문구로 보인다(대체 장치 없음, 2026-11-05).

export const EXPIRED_COOKIE = "session-expired";
export const SESSION_EXPIRED_EVENT = "whale-erp:session-expired";

/** 401 이 만료가 아닌 api — 발급 비밀번호 만료 · 이미 탈퇴됐을 수 있는 최종 제출 · 로그아웃 자체. 정확히 그 경로만 뺀다. */
const NOT_EXPIRY = ["/auth/admin/password-change", "/auth/admin/me/withdraw", "/auth/admin/logout"];

/** document.cookie 에서 표시 쿠키 값. 없으면 null. */
export function expiredMarkOf(cookie: string): string | null {
  for (const part of cookie.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === EXPIRED_COOKIE) return value.join("=") || null;
  }
  return null;
}

/** 표시 쿠키. 화면 스크립트가 읽어야 해서 httpOnly 가 아니다. 읽어도 지우지 않고 30초 뒤 사라진다 — 로그인 성공 때도 지운다. */
export function expiredCookie(now: number) {
  return { name: EXPIRED_COOKIE, value: String(now), maxAge: 30, path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" };
}

/** 이 api 401 로 세션 쿠키를 지우고 표시를 심을지 — 토큰을 실은 서버 액션 요청이고 제외 경로가 아닐 때만. */
export function marksExpiry(path: string, init: RequestInit, isAction: boolean): boolean {
  if (!isAction || !new Headers(init.headers).has("authorization")) return false;
  const bare = path.split("?")[0];
  return !NOT_EXPIRY.includes(bare);
}

const isActionRequest = (input: RequestInfo | URL, init?: RequestInit) =>
  new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined)).has("next-action");

/** base 를 감싼 fetch. 감쌀 때 있던 표시는 본 것으로 둔다 — 앞 탭의 표시로 이 탭이 팝업을 띄우지 않게. */
export function watchedFetch(base: typeof fetch, readMark: () => string | null, onExpired: () => void): typeof fetch {
  let seen = readMark();
  return async (input, init) => {
    const response = await base(input, init);
    if (!isActionRequest(input, init)) return response;
    const mark = readMark();
    if (mark === null || mark === seen) return response;
    seen = mark;
    onExpired();
    // 화면의 실패 처리가 돌지 않게 끝나지 않는다. 팝업 [확인]이 location.replace 로 화면을 떠난다.
    return new Promise<Response>(() => {});
  };
}

export function notifySessionExpired(): void {
  dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

let installed = false;
/** 한 번만 감싼다(SessionGate 가 화면이 열릴 때 부른다). */
export function installSessionExpiryWatch(): void {
  if (installed) return;
  installed = true;
  window.fetch = watchedFetch(window.fetch.bind(window), () => expiredMarkOf(document.cookie), notifySessionExpired);
}
```

- [ ] **Step 4: 통과 확인**

Run: `node --test src/lib/session-expiry.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋 지점** — `feat: 세션 만료 표시 · fetch 감시 추가` (`src/lib/session-expiry.ts`, `src/lib/session-expiry.test.ts`)

---

### Task 3: 서버 표시 · 로그인 성공 정리

**Files:**
- Modify: `src/lib/api.ts` (`request` · `requestRaw`)
- Modify: `src/app/(public)/(site)/login/actions.ts`

**Interfaces:**
- Consumes: `marksExpiry`, `expiredCookie`, `EXPIRED_COOKIE` (Task 2)

- [ ] **Step 1: `api.ts` 에 표시 함수 더하기**

import 에 `import { expiredCookie, marksExpiry } from "./session-expiry.ts";` 를 더하고, `request` 위에 둔다:

```ts
/**
 * 서버 액션이 api 401 을 받으면 세션 쿠키를 지우고 표시 쿠키를 심는다 — 브라우저의 감싼 fetch 가 보고 만료 팝업을 띄운다(session-expiry.ts).
 * 서버가 그리는 화면은 쿠키를 쓸 수 없어 빼고(redirectExpired), /api 라우트는 BFF 가 지운다. 쿠키 쓰기가 실패해도 401 처리는 그대로 간다.
 */
async function markSessionExpired(path: string, init: RequestInit): Promise<void> {
  try {
    if (!marksExpiry(path, init, (await headers()).has("next-action"))) return;
    const jar = await cookies();
    jar.delete(SESSION_COOKIE);
    jar.set(expiredCookie(Date.now()));
  } catch (e) {
    console.error("세션 만료 표시를 남기지 못함", path, e);
  }
}
```

- [ ] **Step 2: `request` · `requestRaw` 에서 부르기**

```ts
  if (!response.ok) {
    if (response.status === 401) await markSessionExpired(path, init);
    throw await apiError(response);
  }
```

```ts
export async function requestRaw(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(`${baseUrl()}${path}`, { ...init, cache: "no-store" });
  if (response.status === 401) await markSessionExpired(path, init);
  return response;
}
```

- [ ] **Step 3: 로그인 성공 — 표시 삭제 · 바꿔치기 이동**

`login/actions.ts`:
- `import { redirect, RedirectType } from "next/navigation";`
- `import { EXPIRED_COOKIE } from "@/lib/session-expiry";`
- `jar.set(loginKeyCookie(...))` 다음 줄에 `jar.delete(EXPIRED_COOKIE); // 다시 로그인한 직후 옛 표시로 팝업이 뜨지 않게`
- 마지막 줄:

```ts
  // replace — 기록의 /login?reason=expired 칸을 홈으로 바꿔 [뒤로]가 로그인 전 화면으로 간다(서버 액션 redirect 기본값은 push).
  redirect(returnPathOf(formData.get(RETURN_PARAM)) ?? homeOf(res.account.roleTypeCode), RedirectType.replace);
```

- [ ] **Step 4: 타입 확인**

Run: `pnpm exec tsc --noEmit`
Expected: 오류 없음

- [ ] **Step 5: 커밋 지점** — `feat: 서버 액션 401 에 만료 표시 남김` (`src/lib/api.ts`, `src/app/(public)/(site)/login/actions.ts`)

---

### Task 4: proxy — 이유 붙이기 · 만료 로그인 확인

**Files:**
- Modify: `src/proxy.ts`

**Interfaces:**
- Consumes: `EXPIRED_REASON`, `LOGOUT_REASON_PARAM`, `loginPathOf(…, reason)`, `checksExpiredLogin`, `expiredLoginStepOf` (Task 1); `LOGIN_KEY_COOKIE` (`@/lib/session`)

- [ ] **Step 1: import**

```ts
import {
  checksExpiredLogin,
  EXPIRED_REASON,
  expiredLoginStepOf,
  homeOf,
  isPlatformRole,
  isPublicPath,
  loginPathOf,
  LOGOUT_REASON_PARAM,
  redirectsSignedIn,
  RETURN_PARAM,
  signedInTargetOf,
} from "@/lib/auth-routes";
```

`@/lib/session` import 에 `LOGIN_KEY_COOKIE` 를 더한다.

- [ ] **Step 2: 공개 경로 처리에 만료 로그인 확인 넣기**

`if (isPublicPath(pathname)) {` 바로 안, `redirectsSignedIn` 앞에:

```ts
    // 서버가 그리는 화면의 401(redirectExpired)은 쿠키를 지우지 못하고 /login?reason=expired 로 온다. 쿠키만 보고 홈으로 되돌리면
    // 홈에서 또 401 이다 — 갱신으로 세션이 정말 끝났는지 묻는다. 판정은 auth-routes.ts(checksExpiredLogin · expiredLoginStepOf).
    if (session && checksExpiredLogin(pathname, req.method, req.headers.has("next-action"), req.nextUrl.searchParams.get(LOGOUT_REASON_PARAM))) {
      const refreshed = await refresh(session);
      const step = expiredLoginStepOf(refreshed === "unauthorized" ? "unauthorized" : refreshed ? "ok" : "failed");
      if (step === "clear") {
        req.cookies.delete(SESSION_COOKIE);
        const res = NextResponse.next({ request: { headers: req.headers } });
        res.cookies.delete(SESSION_COOKIE);
        return res;
      }
      if (step === "home" && refreshed && refreshed !== "unauthorized") {
        const target = signedInTargetOf(pathname, req.nextUrl.searchParams.get(RETURN_PARAM), homeOf(refreshed.roleTypeCode));
        const res = NextResponse.redirect(new URL(target, req.url));
        res.cookies.set(sessionCookie(refreshed));
        return res;
      }
      // stay — api 가 응답하지 않는다. 쿠키를 두고 로그인 화면을 보인다(로그아웃시키지 않는다).
      req.headers.delete(BP_HEADER);
      return NextResponse.next({ request: { headers: req.headers } });
    }
```

- [ ] **Step 3: `toLogin` 에 이유 붙이기**

```ts
// 로그인 키 쿠키는 브라우저를 닫거나 직접 로그아웃해야 사라진다 — 남아 있으면 「이 브라우저에서 로그인해 있다가 끊겼다」라 만료 문구를 붙인다.
function toLogin(req: NextRequest) {
  const reason = req.cookies.has(LOGIN_KEY_COOKIE) ? EXPIRED_REASON : undefined;
  const res = answersWith401(stripBp(req.nextUrl.pathname))
    ? NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 })
    : NextResponse.redirect(new URL(loginPathOf(req.nextUrl.pathname, req.method, reason), req.url));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
```

- [ ] **Step 4: 타입 · 테스트**

Run: `pnpm exec tsc --noEmit` 그리고 `pnpm test`
Expected: 오류 없음 · PASS

- [ ] **Step 5: 커밋 지점** — `feat: proxy 가 만료 로그인 이유를 붙이고 남은 쿠키 확인` (`src/proxy.ts`)

---

### Task 5: 만료 팝업 — `session-gate.tsx`

**Files:**
- Modify: `src/components/site/session-gate.tsx`

**Interfaces:**
- Consumes: `installSessionExpiryWatch`, `notifySessionExpired`, `SESSION_EXPIRED_EVENT` (Task 2), `EXPIRED_REASON`, `EXPIRED_MESSAGE`, `loginPathOf` (Task 1)

- [ ] **Step 1: import**

```ts
import { Button, ConfirmDialog, LoadingNotice, useBackdropActive, useToast } from "@/components/common";
import { EXPIRED_MESSAGE, EXPIRED_REASON, loginPathOf, returnPathOf } from "@/lib/auth-routes";
import { installSessionExpiryWatch, notifySessionExpired, SESSION_EXPIRED_EVENT } from "@/lib/session-expiry";
```

- [ ] **Step 2: `SessionGate` 에 감시 · 팝업 상태**

`const [attempt, setAttempt] = useState(0);` 아래에:

```ts
  // 만료 팝업(2026-11-05). 쓰는 중 401(서버 액션은 감싼 fetch, BFF 조회 · 업로드 창구는 그 자리)이 신호를 보낸다. 여럿 와도 하나만 연다.
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    installSessionExpiryWatch();
    const open = () => setExpired(true);
    addEventListener(SESSION_EXPIRED_EVENT, open);
    return () => removeEventListener(SESSION_EXPIRED_EVENT, open);
  }, []);
  // [확인]은 앱 안 이동이 아니라 location.replace — 끝나지 않는 서버 액션이 Next 의 액션 줄을 막아 router 이동이 막힐 수 있다.
  // 쿠키가 남아 있어도 proxy 가 /login?reason=expired 에서 갱신으로 확인해 정리한다.
  const expiredDialog = (
    <ConfirmDialog
      open={expired}
      title="로그인 만료"
      cancelLabel={null}
      onConfirm={() => location.replace(loginPathOf(location.pathname, "GET", EXPIRED_REASON))}
      onCancel={() => {}} // 닫을 수 없다 — Esc 로도 닫지 않는다
    >
      {EXPIRED_MESSAGE}
    </ConfirmDialog>
  );
```

- [ ] **Step 3: 세 가지 return 에 팝업 붙이기**

```ts
  if (state.status === "loading" || stale)
    return (
      <>
        <LoadingNotice text={switchNotice ?? (pathname === BP_SWITCH_PATH ? "BP 로 이동하는 중입니다." : "불러오는 중입니다.")} />
        {expiredDialog}
      </>
    );
  if (state.status === "error")
    return (
      <>
        <Notice>
          {/* 기존 내용 그대로 */}
        </Notice>
        {expiredDialog}
      </>
    );
  return (
    <>
      <Ready …기존 그대로…>{children}</Ready>
      {expiredDialog}
    </>
  );
```

- [ ] **Step 4: 첫 준비 401 — 이유 붙여 로그인 화면으로(팝업 없음)**

`if (e instanceof BffError && e.status === 401) {` 안:

```ts
          if (readLoginKey()) router.replace(loginPathOf(location.pathname, "GET", EXPIRED_REASON));
```

- [ ] **Step 5: 맞추기 401 — 신호**

점포 맞추기(`if (status === 401) { router.replace(loginPathOf(location.pathname)); s.stopped = true; }`)와 로그인 정보 맞추기(`} else if (status === 401) { s.stopped = true; router.replace(loginPathOf(location.pathname)); }`)의 `router.replace(...)` 를 `notifySessionExpired();` 로 바꾼다. `s.stopped = true` 는 둔다. 다른 탭 로그아웃(storage 이벤트, `if (!loginKey) router.replace(loginPathOf(location.pathname));`)은 그대로 둔다 — 직접 로그아웃은 문구 없음.

- [ ] **Step 6: 타입 · 린트**

Run: `pnpm exec tsc --noEmit` 그리고 `pnpm lint`
Expected: 오류 없음

- [ ] **Step 7: 커밋 지점** — `feat: 만료 팝업과 fetch 감시 연결` (`src/components/site/session-gate.tsx`)

---

### Task 6: 신호 넣는 곳 · 계약서 파일 받기

**Files:**
- Modify: `src/lib/use-load.ts:40`
- Modify: `src/app/staff-members/export/export-screen.tsx:96-101`
- Modify: `src/app/excel-downloads/[id]/excel-download-view.tsx:56`
- Modify: `src/components/common/excel-download.tsx:56`
- Modify: `src/app/contracts/new/contract-form.tsx:417-420`
- Modify: `src/components/community/post-form.tsx:195`
- Modify: `src/components/support/support-detail.tsx:73`
- Modify: `src/app/contracts/[contractId]/documents/[contractDocumentId]/route.ts:17`

**Interfaces:**
- Consumes: `notifySessionExpired` (`@/lib/session-expiry`), `EXPIRED_REASON` · `loginPathOf` (`@/lib/auth-routes`)

각 파일에 `import { notifySessionExpired } from "@/lib/session-expiry";` 를 더한다. 바꾼 뒤 쓰지 않게 된 import(`loginPathOf` · `router` · `SESSION_EXPIRED` 등)는 지운다 — `pnpm lint` 가 알려 준다.

- [ ] **Step 1: `use-load.ts:40`**

```ts
        if (e instanceof BffError && e.status === 401) return notifySessionExpired();
```

15행 주석의 「401 이면 로그인 화면으로 보낸다(SessionGate 와 같다)」를 「401 이면 만료 팝업 신호를 보낸다」로 고친다.

- [ ] **Step 2: `export-screen.tsx`**

`toLogin` 정의(96행)를 지우고 `loadFailed` 의 401 을:

```ts
    if (e instanceof BffError && e.status === 401) {
      notifySessionExpired();
      return null;
    }
```

161 · 176 행의 `toLogin()` 은 서버 액션 결과라 Task 8 에서 줄째 지운다. 이 Task 에서 같이 지워도 된다(`if (!result.ok && result.status === 401) return toLogin();` · `if (result.status === 401) return toLogin();` 두 줄 삭제).

- [ ] **Step 3: `excel-download-view.tsx:56`**

```ts
      // 세션이 끝났다 — 팝업 [확인]이 ?next= 를 붙여 로그인 뒤 이 화면으로 돌아오게 한다
      if (status === 401) return notifySessionExpired();
```

- [ ] **Step 4: `excel-download.tsx:56`**

`const { status } = response;` 다음 줄:

```ts
        if (status === 401) return notifySessionExpired();
```

53행 주석의 「401 로그인 만료 · 」를 지운다.

- [ ] **Step 5: `contract-form.tsx:417`**

```ts
        if (res.status === 401) {
          notifySessionExpired();
          return;
        }
```

416행 주석 끝을 「만료 팝업 신호를 보낸다.」로 고친다.

- [ ] **Step 6: `post-form.tsx:195` · `support-detail.tsx:73`**

```ts
        if (e instanceof BffError && e.status === 401) return notifySessionExpired();
        showErrors([e instanceof BffError ? e.message : "첨부파일을 받지 못했습니다."]);
```

```ts
        if (e instanceof BffError && e.status === 401) return notifySessionExpired();
        setError(e instanceof BffError ? e.message : "첨부파일을 받지 못했습니다.");
```

`post-form.tsx:173` 저장 401(`SESSION_EXPIRED` 폼 문구)은 **대기** 항목이라 손대지 않는다.

- [ ] **Step 7: 계약서 파일 받기 `route.ts:17`**

```ts
    const res = NextResponse.redirect(new URL(loginPathOf("/", "GET", EXPIRED_REASON), req.url));
```

- [ ] **Step 8: 타입 · 린트**

Run: `pnpm exec tsc --noEmit` 그리고 `pnpm lint`
Expected: 오류 없음

- [ ] **Step 9: 커밋 지점** — `feat: 조회 · 받기 401 을 만료 팝업으로` (위 8개 파일)

---

### Task 7: 서버가 그리는 화면의 401

**Files:**
- Create: `src/lib/redirect-expired.ts`
- Modify: 아래 표의 파일

**Interfaces:**
- Produces: `redirectExpired(): never`

- [ ] **Step 1: 새 함수**

`src/lib/redirect-expired.ts`:

```ts
import { redirect } from "next/navigation";
import { EXPIRED_REASON, loginPathOf } from "./auth-routes";

/**
 * 서버가 화면을 그리다 api 401 을 받았을 때. 그리는 중에는 쿠키를 지울 수 없어 /login?reason=expired 로만 보내고,
 * 남은 세션 쿠키는 proxy 가 그 주소에서 갱신으로 확인해 정리한다(checksExpiredLogin). redirect 는 오류를 던져 이동한다 —
 * try 안에서 부르면 그 catch 가 unstable_rethrow 로 다시 던져야 한다. catch 블록 안에서 부르는 것은 괜찮다.
 */
export function redirectExpired(): never {
  redirect(loginPathOf("/", "GET", EXPIRED_REASON));
}
```

- [ ] **Step 2: 화면마다 바꾸기**

규칙: 401 을 삼키거나(빈 목록) · 문구로 바꾸거나 · 위로 던지던 곳을 `redirectExpired()` 로. 401 · 403 을 함께 보던 곳은 403 만 남긴다. 각 파일에서 `import { redirectExpired } from "@/lib/redirect-expired";` 를 더한다. 바꾼 줄이 `try` 블록 **안**(catch 가 아님)이면 감싼 catch 첫 줄에 `unstable_rethrow(e)` 가 있는지 확인하고 없으면 더한다.

| 파일:줄 | 지금 | 바꾼 뒤 |
|---|---|---|
| `src/app/contracts/page.tsx:35` | `if (!(e instanceof ApiError && e.status === 401) && denied === null) throw e;` | `if (e instanceof ApiError && e.status === 401) redirectExpired();` 다음 줄 `if (denied === null) throw e;` |
| `src/app/contracts/new/page.tsx:31` | 같음 | 같음 |
| `src/app/contracts/[contractId]/page.tsx:58` | 같음 | 같음 |
| `src/app/contracts/[contractId]/edit/page.tsx:33` | 같음 | 같음 |
| `src/app/contracts/[contractId]/worker/page.tsx:29` | 같음 | 같음 |
| `src/app/contracts/new/load-form-data.ts:40` | `if (e instanceof ApiError && e.status === 401) throw e;` | 그대로 둔다(49행이 받는다) |
| `src/app/contracts/new/load-form-data.ts:49` | `return { stores: [], …, signedIn: false, … }` | `if (e instanceof ApiError && e.status === 401) redirectExpired();` — 10 · 14행 주석의 「signedIn=false 로 그리고 저장을 막는다」를 「로그인 화면(만료)으로 보낸다」로. `signedIn` 을 쓰는 곳이 남는지 grep 해 다른 이유(토큰 없음)로만 남으면 둔다 |
| `src/app/bp-admins/page.tsx:24` | 401 · 403 둘 다 로그 생략 | 그 catch 첫 줄에 `if (error instanceof ApiError && error.status === 401) redirectExpired();`, 조건은 `error.status === 403` 만 |
| `src/app/bp-holidays/page.tsx:38` | `return { denied: "로그인이 만료되었습니다…" }` | `redirectExpired();` |
| `src/app/work-schedules/page.tsx:38` | `throw error` | `redirectExpired();` (주석 「화면 전체의 일이라 그대로 올린다」 → 「로그인 화면(만료)으로 보낸다」) |
| `src/app/public-holidays/page.tsx:34` | 401 · 403 | 401 → `redirectExpired()`, 아래 `deniedMessage(error.status, …)` 는 `"플랫폼 휴일을 볼 권한이 없습니다."` 를 바로 넘긴다 |
| `src/app/notifications/page.tsx:21` | 401 · 403 | 401 → `redirectExpired()`, 403 만 남김 |
| `src/app/platform/notification-templates/page.tsx:20` | 401 · 403 | 같음 |
| `src/app/platform/notification-templates/new/page.tsx:15` | 401 · 403 | 같음 (설계 목록 밖에서 새로 찾음) |
| `src/app/platform/notification-templates/[id]/page.tsx:18` | 401 · 403 | 같음 (설계 목록 밖에서 새로 찾음) |
| `src/components/community/post-page.tsx:16` · `inquiry-page.tsx:22` | `denied()` 가 `401 \| 403` 반환 | 401 → `redirectExpired()`, 반환 타입 `403` |
| `src/components/community/list-load.tsx:9-17` | `deniedMessage(401 \| 403)` · 401 · 403 | `loadList` 의 401 → `redirectExpired()`(catch 블록 안). `deniedMessage` 의 401 분기를 지우고 `(forbidden: string) => forbidden` 이 되면 함수째 지우고 호출부 4곳(`public-holidays/page.tsx:38` · `inquiry-page.tsx:30` · `list-load.tsx:18` · `post-page.tsx:24`)에 문구를 바로 넘긴다 |

- [ ] **Step 3: 빠뜨린 곳 찾기**

Run: `grep -rn "status === 401" src/app src/components --include=page.tsx --include=*-page.tsx --include=list-load.tsx --include=load-form-data.ts`
Expected: 결과 없음

- [ ] **Step 4: 타입 · 린트 · 테스트**

Run: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`
Expected: 오류 없음 · PASS

- [ ] **Step 5: 커밋 지점** — `feat: 서버가 그리는 화면 401 을 만료 로그인으로` (`src/lib/redirect-expired.ts` 와 위 파일)

---

### Task 8: 겹치는 401 처리 지우기

①(감싼 fetch)이 먼저 잡아 돌지 않는 서버 액션 401 처리를 지운다. 지우면 401 은 다른 4xx 와 같이 api 문구로 내려가지만, 실제로는 감싼 fetch 가 결과를 넘기지 않아 화면에 오지 않는다.

**Files:** 아래 목록

- [ ] **Step 1: 서버 액션의 401 줄 지우기**

각 파일에서 `if (error.status === 401) return { … "로그인이 만료되었습니다…" … };` 한 줄(과 그 줄을 설명하는 주석 구절 「401 은 고정 문구로」)을 지운다:

- `src/app/attendance-records/actions.ts:31`
- `src/app/bp-admins/actions.ts:41`
- `src/app/bp-code-groups/actions.ts:24`
- `src/app/bp-masters/actions.ts:38`
- `src/app/code-groups/actions.ts:32`
- `src/app/notifications/actions.ts:23`
- `src/app/payslips/actions.ts:27`
- `src/app/payslips/[payslipId]/actions.ts:26`
- `src/app/platform/notification-templates/actions.ts:33`
- `src/app/platform-admins/actions.ts:34`
- `src/app/platform-menus/actions.ts:28`
- `src/app/staff-members/[id]/actions.ts:31`
- `src/app/stores/actions.ts:42`
- `src/app/todos/actions.ts:21`
- `src/app/work-schedules/actions.ts:34`
- `src/lib/role-group-actions.ts:19`
- `src/components/site/bp-page-actions.ts:16`
- `src/components/site/my-page-actions.ts:15` (타입 `status?: 400 | 401 | 409` → `400 | 409`)
- `src/lib/withdrawal-form.ts:32` (타입 `WithdrawVerifyFailure` 의 `400 | 401` → `400`)
- `src/lib/action-failure.ts:28` — 그리고 `src/lib/action-failure.test.ts` 의 401 기대를 「401 은 다른 4xx 처럼 api 문구」로 고친다. `SESSION_EXPIRED` 를 다른 곳(`post-form.tsx` · `inquiry-form.tsx` · `support-detail.tsx` · 업로드 route)이 아직 쓰면 상수는 남긴다
- `src/app/contracts/[contractId]/actions.ts:81 · 109`
- `src/app/contracts/[contractId]/send-model.ts:191 · 212` — `{ kind: "login" }` 을 받는 곳을 grep 해 그 분기도 지운다
- `src/lib/community-actions.ts:35`

**남기는 것**: `src/components/site/password-change-actions.ts:17` · `src/components/site/withdraw-actions.ts:44` · `src/app/actions.ts:50`(세션 없음) · 업로드 route 3개 · `api/[...path]/route.ts` · `address-search.ts:122`.

- [ ] **Step 2: 화면의 401 분기 지우기**

`pnpm exec tsc --noEmit` 를 돌리면 401 을 더는 돌려주지 않는 결과 타입과 비교하는 줄이 오류로 나올 수 있다. 오류가 없더라도 아래를 지운다:

- `src/app/bp-admins/admin-form-panel.tsx:192 · 285 · 287 · 348` — `result.status === 401` 분기 · 조건에서 401 만 뺀다
- `src/app/bp-masters/bp-master-form-panel.tsx:174 · 176 · 229` — 229 는 `result.status === 403` 만
- `src/app/platform-admins/admin-form-panel.tsx:243 · 250` (+170 · 216 주석의 401)
- `src/components/site/my-page-panel.tsx:197`
- `src/components/site/bp-profile-tab.tsx:244` · `src/app/stores/store-form-view.tsx:320` — `keepApiText` 조건에서 401 만 뺀다
- `src/lib/platform-admin-form.ts:163` — `result.status === 403` 만 (+157 주석)
- `src/app/bp-holidays/holiday-form-panel.tsx:155` — 배열에서 401 을 뺀다
- `src/app/work-schedules/schedule-form.tsx:237 · 257` · `src/app/todos/todo-form.tsx:113` — `result.status === 403` 만 (+todo-form 102 주석)
- `src/app/staff-members/export/export-screen.tsx:161 · 176` (Task 6 에서 안 지웠으면)
- `src/components/site/withdraw-panel.tsx:165 · 166` — 1단계 확인 401 줄 삭제. **197 행 최종 제출 401 은 남긴다**

- [ ] **Step 3: 남은 것 확인**

Run: `grep -rn "401" src --include=*.ts --include=*.tsx | grep -v "\.test\.ts" | grep -v api-types.generated`
Expected: 남는 것은 위 「남기는 것」, `session-gate.tsx`(첫 준비 · 맞추기 · 671), Task 6 의 신호 줄, `post-form.tsx:173` · `inquiry-form.tsx:64`(대기), `paper-request.ts`, `contract-form.tsx:312 · 417`, 설명 주석뿐

- [ ] **Step 4: 타입 · 린트 · 테스트**

Run: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`
Expected: 오류 없음 · PASS

- [ ] **Step 5: 커밋 지점** — `refactor: fetch 감시와 겹치는 서버 액션 401 처리 삭제`

---

### Task 9: 로그아웃 실패 문구

**Files:**
- Modify: `src/lib/sign-out.ts`, `src/lib/sign-out.test.ts`
- Modify: `src/components/site/admin-header.tsx:63`, `src/components/site/withdraw-panel.tsx:149 · 402`, `src/app/platform/no-menu-notice.tsx:48`

**Interfaces:**
- Consumes: `signOut(logout: () => Promise<void>): Promise<boolean>` (`@/lib/bff` 가 다시 내보냄)

- [ ] **Step 1: 테스트 먼저**

`sign-out.test.ts` 마지막 테스트의 기대를:

```ts
    assert.deepEqual(s.alerts, ["로그아웃하지 못했습니다. 새로고침 후 다시 시도해 주세요.", "로그아웃하지 못했습니다. 새로고침 후 다시 시도해 주세요."]);
```

Run: `node --test src/lib/sign-out.test.ts`
Expected: FAIL

- [ ] **Step 2: 문구 바꾸기**

`sign-out.ts`:

```ts
    // 새로 고침을 안내한다 — 배포 직후 옛 화면은 새로 고쳐야만 서버 액션을 찾는다
    alert("로그아웃하지 못했습니다. 새로고침 후 다시 시도해 주세요.");
```

Run: `node --test src/lib/sign-out.test.ts`
Expected: PASS

- [ ] **Step 3: 호출부를 `signOut()` 으로**

- `admin-header.tsx:63`: `{ label: "로그아웃", onSelect: () => void signOut(logout), danger: true }` — `UserPopItem` 은 `onSelect` 를 받는다(`user-pop.tsx:15`). `danger` 가 `onSelect` 항목에서도 되는지 타입으로 확인한다. `import { signOut } from "@/lib/bff";`
- `withdraw-panel.tsx:149`: `void signOut(logoutAfterWithdrawal);`
- `withdraw-panel.tsx:402`: `<form action={…}>` 를 `<div className="flex justify-center gap-[6px]"><Button onClick={() => void signOut(logoutAfterWithdrawal)}>확인</Button></div>` 로. 401 행 주석을 「signOut 으로 부른다 — 실패하면 알린다」로 고친다.
- `no-menu-notice.tsx:48`: `<form action={logout}>…</form>` 를 `<Button variant="off" onClick={() => void signOut(logout)}>로그아웃</Button>` 로. 이 파일이 서버 컴포넌트면 `"use client"` 가 필요하다 — 파일 머리를 보고, 서버 컴포넌트면 버튼만 작은 클라이언트 컴포넌트로 떼지 말고 파일에 `"use client"` 를 붙여도 되는지(서버 전용 import 가 없는지) 확인한다.

- [ ] **Step 4: 타입 · 린트 · 테스트**

Run: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`
Expected: 오류 없음 · PASS

- [ ] **Step 5: 커밋 지점** — `fix: 로그아웃 실패 문구를 새로고침 안내로` (위 6개 파일)

---

### Task 10: 문서 맞추기

**Files:**
- Modify: `okf/auth.md` (25 · 41~44행), `okf/log.md`
- Modify: `docs/mockup/auth/login.html`, `docs/mockup/auth/overview.html`, `docs/demo` 의 로그인 화면
- okf concept 의 `sources[].resource` 에 이번에 고친 파일(`src/proxy.ts` · `src/lib/auth-routes.ts` · `session-gate.tsx` 등)이 들어 있는 concept 도 본문 · `generated.at` 을 고친다 — `grep -rln "proxy.ts\|auth-routes.ts\|session-gate.tsx\|sign-out.ts\|api.ts" okf` 로 찾는다

- [ ] **Step 1: `okf/auth.md`** — 화면 이동 · 첫 화면 · 서버가 그리는 화면에서 알게 된 만료는 로그인 화면 문구 「로그인이 만료되었습니다. 다시 로그인해 주세요.」, 쓰는 중(조회 · 저장)은 만료 팝업(제목 「로그인 만료」, [확인] 하나) → 로그인 화면. 「로그인 화면에는 세션 만료 문구가 없다」를 지운다. 로그아웃 실패 문구를 적는다. `generated.at` 을 2026-11-05 로.
- [ ] **Step 2: `okf/log.md`** 한 줄: `2026-11-05 · auth · 세션 만료 문구 · 만료 팝업 · 로그아웃 실패 문구(C6, front marill)`
- [ ] **Step 3: 목업 · 데모** — 로그인 화면에 `?reason=expired` 상태(LOGIN 버튼 위 빨간 한 줄)를 더한다. 팝업 상태는 overview 에 한 줄 설명. 데모가 front 와 같은 문구를 쓰는지 확인한다.
- [ ] **Step 4: Manyfast** — 직접 고치지 않는다. 레드마인 새 부모 일감으로 요청할 내용을 사용자에게 먼저 보여 준다(키는 `~/.redmine-key`, 출력하지 않는다).
- [ ] **Step 5: 커밋 지점** — `docs: 세션 만료 안내를 okf · 목업 · 데모에 반영`

---

### Task 11: 확인

- [ ] **Step 1: 자동**

Run: `pnpm test`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`
Expected: 전부 통과. `pnpm build` 는 백그라운드로 돌린다.

- [ ] **Step 2: 구현 때 확인할 것(설계 4장)**
  - 서버 액션 401 뒤 세션이 되살아나는 경우가 있는지(접근 · 갱신 토큰이 같이 끝나는지)
  - 서버가 그리는 화면의 api 중 세션이 살아 있는데 401 을 주는 것이 있는지 — 있으면 로그인 화면 ↔ 홈을 오간다
  - Next 16.3.3 서버 액션이 `window.fetch` 로 나가는지(개발자 도구에서 감싼 함수를 지나는지)

- [ ] **Step 3: 브라우저(설계 5장 1~11)** — dev 서버는 사용자가 띄우라고 할 때 띄운다. 세션 끊기는 관리자 초기화 또는 같은 브라우저 다시 로그인. 새로 만든 테스트 계정만.

1. 1시간 넘게 둔 뒤 메뉴 클릭 → 로그인 화면 만료 문구
2. 메일 링크(엑셀 내려받기)로 열다 401 → 만료 문구 → 로그인 뒤 그 화면으로
3. 다른 창에서 돌아와 맞추기 401 → 팝업
4. 등록 [저장] 401 → 팝업 하나(폼 문구 · 다른 창 없음)
5. 점포 폐점 선택 · 칸을 벗어날 때 중복 확인 401 → 팝업 하나
6. 탭 두 개 — A 저장 실패 → A 팝업, B 는 메뉴 클릭 때 로그인 화면 만료 문구
7. 강제 비밀번호 · 탈퇴 최종 제출 401 → 만료 팝업 없이 지금 안내
8. 직접 로그아웃 → 문구 없음 / api 를 끈 채 로그아웃 → 실패 문구
9. 여러 요청이 한꺼번에 401 → 팝업 하나
10. 끊긴 직후 근로계약 메뉴 클릭(서버가 그리는 화면) → 로그인 화면 만료 문구
11. 로그인 뒤 [뒤로] → 로그인 전 화면 정상 / 다른 탭의 `/login?reason=expired` 새로 고침 → 홈

- [ ] **Step 4: 리뷰 → 커밋 · 푸시 · PR** — 사용자가 맡길 때. PR 본문 끝 `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
