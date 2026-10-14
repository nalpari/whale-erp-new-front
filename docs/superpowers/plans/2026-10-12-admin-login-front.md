# 관리자 로그인 front + 레이아웃 3종 구현 계획 (whale-erp-front)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로그인 전(사이트형) · ERP · 플랫폼 세 레이아웃을 세우고, `/login` 을 api `POST /auth/admin/login` 에 연결해 권한 유형에 따라 `/home`·`/platform` 으로 보낸다.

**Architecture:** route group `(public)/(site)`·`(erp)`·`(platform)` 이 URL 영역별 레이아웃을 맡고 루트 레이아웃은 하나다. 브라우저는 api 를 직접 부르지 않는다 — 서버 액션이 로그인하고 httpOnly 쿠키 `session` 에 토큰을 두며, `src/proxy.ts` 가 쿠키만 보고 막기·갱신·영역 확인을 한다. 레이아웃에는 로그인 확인을 넣지 않는다.

**Tech Stack:** Next.js 16.3 App Router(React 19, 서버 액션, `proxy.ts`), Tailwind v4, `node --test`(Node 24 타입 제거 실행).

설계: `docs/superpowers/specs/2026-10-12-admin-login-layout-design.md` §2~§5. api 계약은 `docs/superpowers/plans/2026-10-12-admin-login-api.md` Task 2·3 의 **Produces**.

## Global Constraints

- 이 Next 는 학습 데이터와 다르다. 코드를 쓰기 전 해당 문서를 `node_modules/next/dist/docs/` 에서 확인한다(특히 `01-app/03-api-reference/03-file-conventions/proxy.md`, `route-groups.md`, `01-app/02-guides/authentication.md`).
- 화면은 DESIGN.md 를 따른다: 바탕은 흰색과 `#f8f9fb`(`bg-erp-thead-bg`) 둘뿐, 1px 선, 모서리 2px(카드 4px), 높이 34/42/46, 굵기 400·500·600·800, 전환 150ms `cubic-bezier(0.23,1,0.32,1)`, 그림자는 팝업 하나(`0 2px 6px rgba(40,47,55,0.08)`)뿐. 공통 컴포넌트(`@/components/common`)를 먼저 쓰고 `className`·`style` 을 넘기지 않는다.
- 색은 `--color-erp-*` 토큰. Figma 에 한 번만 나오는 색(#ebebeb 팝업 테두리, #d9d9d9 구분선)은 쓰는 자리에 적고 주석.
- 쿠키 이름 `session`(기존 `src/lib/api.ts` 의 `SESSION_COOKIE`). httpOnly, `sameSite: 'lax'`, `path: '/'`, 운영(`NODE_ENV=production`)에서 `secure`. `maxAge` 3600(api 갱신 토큰 수명과 같다).
- 권한 유형: `PM`·`PA` → `/platform`, 그 밖(`BM`·`BA`·`FM`·`FA`) → `/home`.
- api 응답 타입은 손으로 적는다(`openapi-typescript` 를 들이지 않는다) — `shortcut:` 주석을 단다.
- 3팀 화면(home·staff·support·notify 의 데모 html)은 고치지 않는다. 데모는 1팀 파일만.
- 커밋: 영문 타입 접두 + 한글 제목/본문, 의도별로 나눈다, `git add -A` 금지, 끝줄 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. 푸시는 사용자가 요청할 때만.
- 워크트리: `C:\workspace\.whale-erp-worktrees\whale-erp-new-front\petra`, 브랜치 `bulbasaur`. 모든 명령은 이 디렉터리에서.

## 파일 구조

| 파일 | 책임 |
|---|---|
| `src/lib/auth-routes.ts` (새) | 순수 함수: 권한 유형 → 홈, 경로 → 영역, 권한 이름 |
| `src/lib/auth-routes.test.ts` (새) | 위 함수 `node --test` |
| `src/lib/api.ts` (수정) | `Session` 모양, 쿠키 읽기·쓰기 헬퍼, api 응답 타입 |
| `src/lib/menus.ts` (새) | ERP·플랫폼 메뉴 상수 |
| `src/lib/login-session.ts` (새) | 헤더에 넣을 값(이름·권한은 쿠키, 점포·BP 목록은 견본) |
| `src/lib/terms.ts` (새, 생성) | 약관 두 가지 문구 |
| `src/components/site/admin-frame.tsx` (새) | ERP·플랫폼 공통 틀(100dvh, 1720px, GlobalHeader) |
| `src/components/site/site-nav.tsx`, `site-footer.tsx`, `terms-link.tsx` (새) | 로그인 전 상단 메뉴·푸터·약관 팝업 |
| `src/app/layout.tsx` (수정) | 루트 하나(`lang="ko"`, Pretendard) |
| `src/app/page.tsx` (삭제) | `/design` 리다이렉트 → `(public)/(site)/page.tsx` 로 |
| `src/app/(public)/(site)/layout.tsx`, `page.tsx`, `login/page.tsx`, `login/login-form.tsx`, `login/actions.ts` (새) | 로그인 전 |
| `src/app/(erp)/layout.tsx`, `home/page.tsx`, `config/admins/page.tsx` (새) | ERP |
| `src/app/(platform)/layout.tsx`, `platform/page.tsx`, `bp/page.tsx` (새) | 플랫폼 |
| `src/app/actions.ts` (새) | 로그아웃 서버 액션(두 레이아웃이 같이 쓴다) |
| `src/proxy.ts` (새) | 막기·갱신·영역 확인 |
| `docs/demo/src/public.mjs`, `docs/demo/src/pages/auth/terms.mjs`(삭제) | 데모 사이트형·약관 팝업 |
| `okf/whale-erp-front.md`, `okf/log.md` | 반영 |

---

### Task 0: 워크트리 준비

- [ ] **Step 1: 의존성·기준선**

```bash
cd /c/workspace/.whale-erp-worktrees/whale-erp-new-front/petra
git fetch origin && git status -sb          # bulbasaur, 깨끗해야 한다
git log --oneline origin/main -1 && git merge-base --is-ancestor origin/main HEAD && echo up-to-date || git rebase origin/main
pnpm install
pnpm lint && pnpm build
```

Expected: lint·build 성공(지금 상태 기준선). 실패하면 멈추고 사용자에게 알린다.

---

### Task 1: 경로·권한 규칙 (순수 함수)

**Files:**
- Create: `src/lib/auth-routes.ts`, `src/lib/auth-routes.test.ts`

**Interfaces:**
- Produces:
  - `type Area = 'public' | 'erp' | 'platform'`
  - `isPlatformRole(roleTypeCode: string): boolean`
  - `homeOf(roleTypeCode: string): '/platform' | '/home'`
  - `areaOf(pathname: string): Area`
  - `roleLabel(roleTypeCode: string): string`

- [ ] **Step 1: 실패하는 테스트**

`src/lib/auth-routes.test.ts`:

```ts
// node --test src/lib/auth-routes.test.ts
// Node 24 가 타입을 벗겨 그대로 실행한다. 테스트 도구를 따로 깔지 않는다(date-math.test.ts 와 같다).
import assert from "node:assert/strict";
import { test } from "node:test";
import { areaOf, homeOf, isPlatformRole, roleLabel } from "./auth-routes.ts";

test("플랫폼 마스터·관리자는 플랫폼 홈, 나머지는 ERP 홈", () => {
  assert.equal(homeOf("PM"), "/platform");
  assert.equal(homeOf("PA"), "/platform");
  for (const code of ["BM", "BA", "FM", "FA"]) assert.equal(homeOf(code), "/home");
  assert.equal(isPlatformRole("BM"), false);
});

test("경로는 영역으로 갈린다 — 접두가 경로 마디와 맞아야 한다", () => {
  assert.equal(areaOf("/"), "public");
  assert.equal(areaOf("/login"), "public");
  assert.equal(areaOf("/design/full"), "public");
  assert.equal(areaOf("/home"), "erp");
  assert.equal(areaOf("/config/admins"), "erp");
  assert.equal(areaOf("/platform"), "platform");
  assert.equal(areaOf("/bp"), "platform");
  assert.equal(areaOf("/system/admins"), "platform");
  // 마디 단위 비교. /homepage 는 /home 이 아니다.
  assert.equal(areaOf("/homepage"), "public");
  assert.equal(areaOf("/bpx"), "public");
});

test("권한 이름", () => {
  assert.equal(roleLabel("BM"), "BP 마스터");
  assert.equal(roleLabel("ZZ"), "ZZ");
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test src/lib/auth-routes.test.ts`
Expected: FAIL — `Cannot find module ... auth-routes.ts`

- [ ] **Step 3: 구현**

`src/lib/auth-routes.ts`:

```ts
// 로그인 뒤 어디로 가고, 어떤 경로가 어느 영역(레이아웃)인지. proxy·서버 액션·레이아웃이 같이 쓴다.
// next/* 를 import 하지 않는다 — node --test 로 바로 돌리기 위해서다.

export type Area = "public" | "erp" | "platform";

// 영역은 URL 이 정한다. 데모 폴더 구조와 같다(erpHeader 쪽 / platformHeader 쪽).
// 새 화면 폴더를 만들면 여기에 더한다. 빠뜨리면 그 경로는 로그인 없이 열린다.
const ERP_PREFIXES = ["/home", "/config", "/stores", "/staff", "/support", "/notify", "/mypage"];
const PLATFORM_PREFIXES = ["/platform", "/bp", "/system"];

const underAny = (pathname: string, prefixes: string[]) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export function areaOf(pathname: string): Area {
  if (underAny(pathname, PLATFORM_PREFIXES)) return "platform";
  if (underAny(pathname, ERP_PREFIXES)) return "erp";
  return "public";
}

export function isPlatformRole(roleTypeCode: string): boolean {
  return roleTypeCode === "PM" || roleTypeCode === "PA";
}

/** okf/auth.md — BP·가맹 계정은 웨일ERP(BP) 홈, 플랫폼 계정은 플랫폼관리 사이트. */
export function homeOf(roleTypeCode: string): "/platform" | "/home" {
  return isPlatformRole(roleTypeCode) ? "/platform" : "/home";
}

// shortcut: 공통코드 ROLE_TYPE 의 한글을 여기 적었다. naming.md 는 getCodes(group) 로 받으라 하지만 그 조회 API 가 아직 없다 — 생기면 지운다.
const ROLE_LABEL: Record<string, string> = {
  PM: "플랫폼 마스터",
  PA: "플랫폼 관리자",
  BM: "BP 마스터",
  BA: "BP 관리자",
  FM: "가맹 마스터",
  FA: "가맹 관리자",
};

export function roleLabel(roleTypeCode: string): string {
  return ROLE_LABEL[roleTypeCode] ?? roleTypeCode;
}
```

주의: 이 파일 확장자 import(`./auth-routes.ts`)는 테스트만 쓴다. 앱 코드에서는 `@/lib/auth-routes` 로 import 한다.

- [ ] **Step 4: 통과 확인**

Run: `node --test src/lib/auth-routes.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/auth-routes.ts src/lib/auth-routes.test.ts
git commit -m "feat: 로그인 후 홈과 경로별 영역 규칙

플랫폼 마스터·관리자는 /platform, 나머지는 /home 으로 간다. 경로는 마디 단위 접두로 로그인 전·ERP·플랫폼
영역에 나뉜다.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 세션 쿠키 모양과 api 타입

**Files:**
- Modify: `src/lib/api.ts`

**Interfaces:**
- Produces (모두 `@/lib/api` 에서 export):
  - `SESSION_COOKIE = 'session'`, `SESSION_MAX_AGE = 3600`
  - `interface Session { accessToken: string; refreshToken: string; accessTokenExpiresAt: number /* ms epoch */; loginId: string; name: string; roleTypeCode: string; bpCode: string }`
  - `parseSession(raw: string | undefined): Session | null` (next/* 없이 — proxy 도 쓴다)
  - `sessionCookie(session: Session): { name; value; httpOnly; sameSite; secure; path; maxAge }`
  - `interface AdminLoginResponse` · `interface AdminRefreshResponse` (api Task 2·3 Produces 와 같은 모양)
  - `getSession(): Promise<Session | null>`(기존, 모양만 바뀜), `request<T>`·`ApiError`(기존)
  - `ACCESS_TOKEN_TTL_MS = 3_600_000`

- [ ] **Step 1: `api.ts` 수정**

`src/lib/api.ts` 의 `SESSION_COOKIE`·`Session`·`getSession` 부분을 아래로 바꾸고(`request`·`ApiError`·`baseUrl`·`errorMessage` 는 그대로), `SESSION_COOKIE` 를 export 한다:

```ts
export const SESSION_COOKIE = "session";

/** api 갱신 토큰 수명(마지막 사용 후 1시간)과 같게 둔다. 갱신할 때마다 다시 1시간. */
export const SESSION_MAX_AGE = 60 * 60;

/** api 접근 토큰 수명. 응답에 만료 시각이 없어 발급 시각 + 이 값으로 잡는다. */
export const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000;

/**
 * 쿠키에 담는 값. 토큰은 Next 서버만 읽는다(httpOnly). 이름·권한은 헤더를 그리고 proxy 가 영역을 가르는 데 쓴다.
 * 권한은 쿠키 값이라 화면을 가르는 데만 믿는다 — 데이터 권한은 api 가 토큰으로 다시 확인한다.
 */
export interface Session {
  accessToken: string;
  refreshToken: string;
  /** 접근 토큰이 끝나는 시각(ms). proxy 가 이보다 1분 앞서 갱신한다. */
  accessTokenExpiresAt: number;
  loginId: string;
  name: string;
  roleTypeCode: string;
  bpCode: string;
}

// shortcut: api 응답 타입을 손으로 적었다(openapi-typescript 미도입, 1팀 동의 대기). 엔드포인트가 늘면 생성 타입으로 바꾼다.
/** POST /auth/admin/login 200 */
export interface AdminLoginResponse {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  admin: {
    adminAccountId: number;
    loginId: string;
    name: string | null;
    roleTypeCode: string;
    bpCode: string;
    isPasswordChangeRequired: boolean;
  };
}

/** POST /auth/admin/refresh 200 */
export interface AdminRefreshResponse {
  accessToken: string;
  refreshTokenExpiresAt: string;
}

/** 쿠키 값 → Session. 손상됐거나 모양이 다르면 로그아웃으로 본다. next/* 를 쓰지 않아 proxy 도 부른다. */
export function parseSession(raw: string | undefined): Session | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Partial<Session>;
    return typeof s.accessToken === "string" && typeof s.refreshToken === "string" && typeof s.roleTypeCode === "string"
      ? (s as Session)
      : null;
  } catch {
    return null;
  }
}

export function sessionCookie(session: Session) {
  return {
    name: SESSION_COOKIE,
    value: JSON.stringify(session),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export async function getSession(): Promise<Session | null> {
  return parseSession((await cookies()).get(SESSION_COOKIE)?.value);
}
```

`import { cookies } from "next/headers";` 는 파일 맨 위에 그대로 둔다. 주의: `parseSession`·`sessionCookie` 를 proxy 가 import 하면 `next/headers` 도 함께 딸려 온다. proxy 에서 문제가 되면(빌드 오류) 이 둘과 상수·타입을 `src/lib/session.ts` 로 옮기고 `api.ts` 가 다시 export 한다.

- [ ] **Step 2: 타입 확인**

Run: `pnpm lint && pnpm exec tsc --noEmit`
Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/lib/api.ts
git commit -m "feat: 관리자 세션 쿠키 모양과 로그인 응답 타입

쿠키 session 에 접근·갱신 토큰과 이름·권한을 담는다. 응답 타입은 손으로 적고 shortcut 주석을 남긴다.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 루트 레이아웃 정리 + ERP·플랫폼 레이아웃

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/lib/menus.ts`, `src/lib/login-session.ts`, `src/components/site/admin-frame.tsx`, `src/app/actions.ts`
- Create: `src/app/(erp)/layout.tsx`, `src/app/(erp)/home/page.tsx`, `src/app/(erp)/config/admins/page.tsx`
- Create: `src/app/(platform)/layout.tsx`, `src/app/(platform)/platform/page.tsx`, `src/app/(platform)/bp/page.tsx`

**Interfaces:**
- Consumes: `getSession`, `SESSION_COOKIE`, `request`(Task 2), `roleLabel`(Task 1), `GlobalHeader`·`HeaderMenu`·`StoreSelect`·`ServiceLinks`·`AlarmLink`·`UserPop`·`UserPopItem`·`PageBar`·`ErpRoot`·`FilterPanel`·`FilterSection`·`SearchField`·`ListToolbar`·`DataTable`(`@/components/common`)
- Produces:
  - `ERP_MENUS: HeaderMenu[]`, `PLATFORM_MENUS: HeaderMenu[]`
  - `getHeaderValues(area: 'erp' | 'platform'): Promise<{ userName: string; scopeOptions: string[]; scopeLabel: string; userItems: UserPopItem[] }>`
  - `AdminFrame({ menus, right, children })`
  - `logout(): Promise<void>` 서버 액션 (`@/app/actions`)

- [ ] **Step 1: 루트 레이아웃**

`src/app/layout.tsx` 전체:

```tsx
import type { Metadata } from "next";
import { pretendard } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Whale ERP",
  description: "웨일ERP 관리자",
};

// 루트 레이아웃은 하나다. 그룹마다 <html> 을 두면 그룹을 넘나들 때 전체를 다시 불러온다(route-groups 문서 Caveats).
// 영역별 틀은 (public)/(site) · (erp) · (platform) 레이아웃이 맡는다.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
```

(Geist 글꼴 두 개를 지운다. `body` 의 `flex flex-col` 은 쓰는 곳이 없어 뺀다 — `/design` 화면이 깨지면 되돌린다.)

- [ ] **Step 2: 메뉴 상수**

`src/lib/menus.ts` — 데모 `docs/demo/src/site.mjs` 의 `ERP_MENUS`·`PLATFORM_MENUS` 를 옮긴다. 화면이 아직 없는 메뉴는 `href: "#"`(`HeaderMenu` 의 href 가 필수라서. 데모의 `to()` 도 없는 화면은 `#`):

```ts
import type { HeaderMenu } from "@/components/common";

// 메뉴 조회 API 가 아직 없어 상수로 둔다(1팀 menus 테이블). 생기면 이 파일만 API 호출로 바꾼다 — 레이아웃이 받는 모양(HeaderMenu[])은 그대로다.
// 화면이 없는 메뉴는 "#". 화면을 만들면 그 경로로 바꾼다.
const menu = (label: string, items: [string, string?][]): HeaderMenu => ({
  label,
  items: items.map(([l, href]) => ({ label: l, href: href ?? "#" })),
});

export const ERP_MENUS: HeaderMenu[] = [
  menu("기초정보관리", [["상품 정보 관리"], ["가격 정보 관리"], ["카테고리 정보 관리"], ["자재 정보 관리"]]),
  menu("점포관리", [["점포 정보 관리"], ["계약서 템플릿 관리"], ["계약서 관리"], ["시설물 및 장비 관리"], ["점검표 템플릿 관리"], ["점검 결과 관리"]]),
  menu("직원관리", [["직원 정보 관리"], ["근로계약 관리"], ["급여명세서 관리"], ["근무스케줄 관리"], ["출·퇴근 현황 조회"], ["TO-DO 리스트 관리"]]),
  menu("매출조회", [["매출 조회"], ["매출 통계"]]),
  menu("재무관리", [["입·출금 관리"], ["매출/매입 거래 등록"], ["계정별 현황 조회"]]),
  menu("환경설정", [["BP 관리자 관리", "/config/admins"], ["BP 권한 그룹 관리"], ["BP 공통코드 관리"], ["BP 휴일 관리"]]),
  menu("고객지원", [["부가서비스 구독 관리"], ["구독료 청구 및 납부 현황"], ["결제수단 관리"], ["정산 현황 조회"], ["공지사항"], ["FAQ"], ["문의하기"]]),
];

export const PLATFORM_MENUS: HeaderMenu[] = [
  menu("회원관리", [["회원 정보 관리"]]),
  menu("BP 마스터 계정 관리", [["BP 마스터 계정 목록", "/bp"]]),
  menu("서비스정산관리", [["부가서비스 주문 내역"], ["부가서비스 정산"]]),
  menu("부가서비스관리", [["부가 서비스 정보 관리"]]),
  menu("프로모션관리", [["쿠폰 관리"], ["포인트 관리"]]),
  menu("시스템관리", [["플랫폼 관리자 관리"], ["플랫폼 권한 관리"], ["플랫폼 메뉴 관리"], ["플랫폼 공통코드 관리"], ["알림 템플릿 관리"]]),
];
```

구현 전에 `docs/demo/src/site.mjs` 의 두 배열(`ERP_MENUS` 18행 근처, `PLATFORM_MENUS` 307행 근처)과 항목·순서가 같은지 다시 대조한다(데모가 그 뒤에 바뀌었을 수 있다). 플랫폼 「시스템관리」 뒤에 항목이 더 있으면 그대로 옮긴다.

- [ ] **Step 3: 로그아웃 액션**

`src/app/actions.ts`:

```ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, request, SESSION_COOKIE } from "@/lib/api";

/** 이 브라우저의 접속만 끝낸다. api 가 실패해도 쿠키는 지운다 — 나가려는 사람을 붙잡지 않는다. */
export async function logout(): Promise<void> {
  const session = await getSession();
  if (session)
    await request("/auth/admin/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    }).catch(() => undefined);
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
```

- [ ] **Step 4: 헤더 값**

`src/lib/login-session.ts`:

```ts
import type { UserPopItem } from "@/components/common";
import { logout } from "@/app/actions";
import { getSession } from "@/lib/api";
import { roleLabel } from "@/lib/auth-routes";

// shortcut: 범위 선택 목록은 견본이다(데모 site.mjs 의 STORES·BPS). 점포·BP 범위 조회 API 가 생기면 세션의 bpCode 로 조회해 바꾼다.
const SAMPLE_STORE_SCOPE = ["전체 6개점", "직영점포 전체 4개점", "가맹점포 전체 2개점", "모리커피 서초점", "모리커피 성수점"];
const SAMPLE_BP_SCOPE = ["㈜한강상회 · BP000017", "㈜모리푸드 · BP000021", "㈜온기에프앤비 · BP000009"];

/**
 * 헤더 오른쪽에 넣을 값. 이름·권한은 세션 쿠키에서 읽는다. 쿠키가 없으면 proxy 가 이미 /login 으로 보냈어야 한다 —
 * 그래도 비어 있으면 빈 이름으로 그린다(레이아웃에서 막지 않는다. 레이아웃은 화면 이동 때 다시 실행되지 않는다).
 * 내정보·비밀번호·회원 탈퇴는 슬라이드 패널 작업 전이라 아직 아무 데도 가지 않는다.
 */
export async function getHeaderValues(area: "erp" | "platform") {
  const session = await getSession();
  const userName = session ? `${session.name} (${roleLabel(session.roleTypeCode)})` : "";
  const mine: UserPopItem[] = [
    { label: "내정보 관리", href: "#" },
    { label: "비밀번호 변경", href: "#" },
  ];
  const userItems: UserPopItem[] =
    area === "erp"
      ? [...mine, { label: "회원 탈퇴", href: "#" }, { label: "로그아웃", action: logout, danger: true }]
      : [...mine, { label: "로그아웃", action: logout, danger: true }];
  return area === "erp"
    ? { userName, userItems, scopeOptions: SAMPLE_STORE_SCOPE, scopeLabel: "점포" }
    : { userName, userItems, scopeOptions: SAMPLE_BP_SCOPE, scopeLabel: "BP" };
}
```

(`server-only` 패키지는 설치돼 있지 않아 쓰지 않는다 — 의존성을 새로 들이지 않는다. `getSession` 이 `next/headers` 를 쓰므로 클라이언트에서 import 하면 빌드가 막는다.)

- [ ] **Step 5: 공통 틀**

`src/components/site/admin-frame.tsx`:

```tsx
import type { ReactNode } from "react";
import { ErpRoot, GlobalHeader, type HeaderMenu } from "@/components/common";

// ERP·플랫폼 로그인 후 화면의 틀. 데모 ui.erpFrame 과 같다 — 화면은 100dvh 안에서 끝나고,
// 1720 보다 좁으면 body 가 아니라 이 바깥 영역이 가로로 스크롤한다. 등록 패널(SlidePanel)이 오른쪽에 겹쳐 서도록 relative + overflow-x-clip.
// 그 아래(PageBar + 본문)는 각 page 가 그린다.
export function AdminFrame({ menus, right, children }: { menus: HeaderMenu[]; right: ReactNode; children: ReactNode }) {
  return (
    <ErpRoot className="min-h-[100dvh]">
      <div className="h-[100dvh] overflow-x-auto overflow-y-hidden bg-erp-thead-bg">
        <div className="relative flex h-full min-w-[1720px] flex-col overflow-x-clip">
          <GlobalHeader menus={menus} right={right} />
          {children}
        </div>
      </div>
    </ErpRoot>
  );
}
```

- [ ] **Step 6: ERP·플랫폼 레이아웃**

`src/app/(erp)/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import { AlarmLink, ServiceLinks, StoreSelect, UserPop } from "@/components/common";
import { AdminFrame } from "@/components/site/admin-frame";
import { getHeaderValues } from "@/lib/login-session";
import { ERP_MENUS } from "@/lib/menus";

// 웨일ERP(BP) 영역. 로그인 확인은 여기서 하지 않는다 — proxy 가 한다.
export default async function ErpLayout({ children }: { children: ReactNode }) {
  const h = await getHeaderValues("erp");
  return (
    <AdminFrame
      menus={ERP_MENUS}
      right={
        <>
          <StoreSelect options={h.scopeOptions} label={h.scopeLabel} />
          <ServiceLinks hrefs={{ erp: "/home", platform: "/platform" }} />
          <AlarmLink href="#" />
          <UserPop name={h.userName} items={h.userItems} />
        </>
      }
    >
      {children}
    </AdminFrame>
  );
}
```

`src/app/(platform)/layout.tsx` — 위와 같고 `PLATFORM_MENUS`, `getHeaderValues("platform")`, 주석 「플랫폼관리 영역. BP·가맹 계정은 proxy 가 /home 으로 돌려보낸다」.

- [ ] **Step 7: 확인용 화면**

`src/app/(erp)/home/page.tsx`:

```tsx
import { PageBar } from "@/components/common";

// 로그인 후 홈(3팀 화면). 내용은 홈 화면 작업에서 채운다 — 지금은 레이아웃 확인용 틀.
export default function HomePage() {
  return (
    <>
      <PageBar title="홈" />
      <div className="flex min-h-0 flex-1 p-[24px]">
        <main className="flex-1 rounded-[4px] border border-erp-panel-line bg-white p-[25px]" />
      </div>
    </>
  );
}
```

`src/app/(platform)/bp/page.tsx` — 같은 모양, 제목 `BP 마스터 계정 목록`, 주석 「플랫폼 BP 마스터 계정 목록. 내용은 그 화면 작업에서 채운다」.

`src/app/(platform)/platform/page.tsx`:

```tsx
import { redirect } from "next/navigation";

// 플랫폼 홈. 목업이 없어 지금은 BP 마스터 계정 목록으로 보낸다. 홈 화면이 정해지면 이 파일만 바꾼다 —
// 로그인 후 이동·로고·서비스 바로가기는 모두 /platform 을 가리킨다.
export default function PlatformHome() {
  redirect("/bp");
}
```

`src/app/(erp)/config/admins/page.tsx`:

```tsx
import { DataTable, FilterPanel, FilterSection, ListToolbar, PageBar, SearchField, type Column } from "@/components/common";

// BP 관리자 관리(데모 config/admins.html). 지금은 레이아웃 확인용 빈 목록 — 필터·목록·슬라이드는 이 화면 작업에서 채운다.
type Row = { loginId: string };
const COLUMNS: Column<Row>[] = [
  { header: "아이디", width: "w-[140px]", align: "left", cell: (r) => r.loginId },
  { header: "이름", width: "w-[110px]", cell: () => null },
  { header: "역할", width: "w-[120px]", cell: () => null },
  { header: "권한 그룹", align: "left", cell: () => null },
  { header: "계정 상태", width: "w-[100px]", cell: () => null },
  { header: "매핑 점포", width: "w-[110px]", cell: () => null },
  { header: "등록일시", width: "w-[160px]", cell: () => null },
  { header: "최근 로그인", width: "w-[160px]", cell: () => null },
];

export default function AdminsPage() {
  return (
    <>
      <PageBar title="BP 관리자 관리" />
      <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
        <FilterPanel>
          <FilterSection label="아이디 · 이름" tight last>
            <SearchField placeholder="아이디 또는 이름 일부를 입력하세요" aria-label="아이디 · 이름" />
          </FilterSection>
        </FilterPanel>
        <main className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
          <ListToolbar total={0} />
          <DataTable columns={COLUMNS} rows={[]} rowKey={(r) => r.loginId} />
        </main>
      </div>
    </>
  );
}
```

- [ ] **Step 8: 빌드·눈 확인**

Run: `pnpm lint && pnpm build`
Expected: 성공. 라우트 목록에 `/home`, `/config/admins`, `/platform`, `/bp` 가 보인다.

Run: `pnpm dev` (백그라운드) 후 Playwright 로 1720×1000 에서 `http://localhost:3000/config/admins` 와 데모 `docs/demo/config/admins.html`(정적 서버 `python -m http.server 8765 --directory docs/demo` 로 연다)를 캡처해 헤더 높이(70+52)·메뉴 글자·제목 줄(59)·본문 여백(24)이 같은지 본다. 아직 proxy 가 없어 로그인 없이 열린다(정상). 사용자 이름 칸은 비어 있다(정상).

- [ ] **Step 9: 커밋** (의도별로 둘)

```bash
git add src/app/layout.tsx
git commit -m "refactor: 루트 레이아웃을 한국어·Pretendard 하나로 정리

create-next-app 기본값(Geist, lang=en)을 걷어 낸다.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"

git add src/lib/menus.ts src/lib/login-session.ts src/components/site/admin-frame.tsx src/app/actions.ts "src/app/(erp)" "src/app/(platform)"
git commit -m "feat: ERP·플랫폼 레이아웃과 확인용 화면

같은 GlobalHeader 에 메뉴·범위 선택·사용자 메뉴만 달리 넣는다. 범위 목록은 견본이고, 로그아웃은 api 를
불러 이 브라우저의 접속만 끝낸다. 플랫폼 홈 /platform 은 홈 화면이 정해질 때까지 /bp 로 보낸다.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 로그인 전 레이아웃(사이트형) + 약관 팝업

**Files:**
- Create: `src/lib/terms.ts`(생성), `src/components/site/terms-link.tsx`, `src/components/site/site-nav.tsx`, `src/components/site/site-footer.tsx`
- Create: `src/app/(public)/(site)/layout.tsx`, `src/app/(public)/(site)/page.tsx`
- Delete: `src/app/page.tsx`

**Interfaces:**
- Produces:
  - `TERMS: Record<'use' | 'policy', { title: string; ver: string; body: TermsBlock[] }>`, `type TermsBlock = [string, string | string[] | { head: string[]; rows: string[][] }]`
  - `TermsLink({ kind: 'use' | 'policy', children })` — 누르면 640px 팝업
  - `SiteNav()`, `SiteFooter()`

- [ ] **Step 1: 약관 문구 생성**

목업 `docs/mockup/assets/auth.js` 의 `TERMS` 에서 두 가지만 뽑아 TS 로 쓴다(데모 `public.mjs` 와 같은 원본):

```bash
node -e '
const fs=require("fs");
const src=fs.readFileSync("docs/mockup/assets/auth.js","utf8");
const from=src.indexOf("var TERMS = ")+12;
const T=new Function("return "+src.slice(from,src.indexOf("\n  };",from)+4))();
const pick={use:T.use,policy:T.policy};
fs.writeFileSync("src/lib/terms.ts",
`// 생성 파일 — 목업 docs/mockup/assets/auth.js 의 TERMS 에서 use·policy 를 옮겼다. 고치지 말고 목업을 고친 뒤 다시 만든다
// (명령은 docs/superpowers/plans/2026-10-12-admin-login-front.md Task 4 Step 1).
export type TermsBlock = [string, string | string[] | { head: string[]; rows: string[][] }];
export const TERMS: Record<"use" | "policy", { title: string; ver: string; body: TermsBlock[] }> = ${JSON.stringify(pick,null,2)};
`);'
pnpm exec tsc --noEmit
```

Expected: `src/lib/terms.ts` 가 생기고 타입 오류 없음. (문구에 HTML 태그가 없음을 확인했다 — 글자로 그린다.)

- [ ] **Step 2: 약관 팝업**

`src/components/site/terms-link.tsx`:

```tsx
"use client";

import { useRef, type ReactNode } from "react";
import { Button } from "@/components/common";
import { TERMS, type TermsBlock } from "@/lib/terms";

// 약관 전문 팝업. 로그인 화면 아래와 푸터가 같이 쓴다(폭 640px — 2026-10-06 피드백). 데모 public.mjs termsDialog 와 같은 모양.
// 네이티브 <dialog>: Esc·포커스 가두기·바깥 inert 를 브라우저가 맡는다.
const CELL = "border border-erp-thead-line px-[10px] py-[6px] text-left align-top";

function Block({ block: [head, v] }: { block: TermsBlock }) {
  return (
    <section className="flex flex-col gap-[6px]">
      {head && <h3 className="font-semibold">{head}</h3>}
      {Array.isArray(v) ? (
        <ol className="list-decimal pl-[18px]">{v.map((li, i) => <li key={i}>{li}</li>)}</ol>
      ) : typeof v === "string" ? (
        <p>{v}</p>
      ) : (
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>{v.head.map((h) => <th key={h} className={`${CELL} bg-erp-thead-bg font-medium text-erp-thead-text`}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {v.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={CELL}>{c}</td>)}</tr>)}
          </tbody>
        </table>
      )}
    </section>
  );
}

export function TermsLink({ kind, children }: { kind: "use" | "policy"; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const t = TERMS[kind];
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="transition-colors duration-150 ease-out hover:text-erp-ink">
        {children}
      </button>
      {/* #ebebeb 팝업 테두리·그림자는 DESIGN.md Popups 의 값 */}
      <dialog
        ref={ref}
        aria-label={t.title}
        className="m-auto w-[640px] max-w-[calc(100vw-32px)] rounded-[2px] border border-[#ebebeb] bg-white p-[23px] font-erp tracking-[-0.025em] text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40"
      >
        <h2 className="text-[18px] font-semibold">{t.title}</h2>
        <div className="mt-[12px] text-[14px] leading-[1.6]">
          <p className="text-[12px] text-erp-label">{t.ver}</p>
          <div className="mt-[12px] flex max-h-[60dvh] flex-col gap-[12px] overflow-y-auto pr-[10px]">
            {t.body.map((b, i) => <Block key={i} block={b} />)}
          </div>
        </div>
        <div className="mt-[24px] flex justify-end">
          <Button onClick={() => ref.current?.close()}>확인</Button>
        </div>
      </dialog>
    </>
  );
}
```

- [ ] **Step 3: 상단 메뉴·푸터**

`src/components/site/site-nav.tsx` — 데모 `public.mjs` `siteNav` 를 옮긴다:

```tsx
import Image from "next/image";
import Link from "next/link";

// 로그인 전 상단 메뉴(1팀 Figma GNB, 데모 public.mjs siteNav). 구획 메뉴는 홈의 구획으로 내려간다.
// 오른쪽 묶음은 버튼이 아니라 조용한 글자 링크다. 도입문의·공지사항은 화면이 없어 아직 "#".
const SECTIONS = [
  ["ops", "매장운영"],
  ["finance", "재무관리"],
  ["franchise", "프랜차이즈"],
  ["addons", "요금안내"],
] as const;

const QUIET = "flex items-center gap-[4px] text-[14px] font-medium text-erp-label transition-colors duration-150 ease-out hover:text-erp-ink";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-10 flex h-[70px] items-center gap-[54px] border-b border-erp-bar-line bg-white px-[24px]">
      <Link href="/" className="flex items-center gap-[10px]">
        <Image src="/icons/logo-whale.svg" alt="" width={53} height={40} />
        <p className="leading-[1.3] text-[#252525]">
          <span className="block text-[16px] font-extrabold uppercase">Whale ERP</span>
          <span className="block text-[12px]">Management System</span>
        </p>
      </Link>
      <nav aria-label="서비스 안내" className="flex flex-1 gap-[34px]">
        {SECTIONS.map(([id, label]) => (
          <Link key={id} href={`/#${id}`} className="text-[15px] font-medium text-erp-ink transition-colors duration-150 ease-out hover:text-erp-brand">
            {label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-[24px]">
        <Link href="/login" className={QUIET}>
          <svg viewBox="0 0 24 24" className="size-[16px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="3.4" />
            <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
          </svg>
          LOGIN
        </Link>
        <Link href="#" className={QUIET}>도입문의</Link>
        <Link href="#" className={QUIET}>공지사항</Link>
      </div>
    </header>
  );
}
```

(로고 마크업은 `GlobalHeader` 의 `Logo` 와 같다. `Logo` 가 export 되지 않아 옮겨 적었다 — 공통 컴포넌트를 고치지 않는다.)

`src/components/site/site-footer.tsx` — 데모 `public.mjs` `siteFoot`(1팀 Figma 푸터)를 옮기고, 약관 두 링크를 `TermsLink` 로:

```tsx
import { TermsLink } from "./terms-link";

// 1팀 Figma 푸터(데모 public.mjs siteFoot). 로고·소셜 아이콘 자산이 없어 인라인 SVG 로 그렸다.
// 이용약관·개인정보처리방침은 페이지가 아니라 로그인 화면과 같은 팝업으로 연다(2026-10-12).
const SEP = <span className="h-[11px] w-px bg-[#d9d9d9]" />; // #d9d9d9: DetailTable 값 구분선과 같은 색(DESIGN.md)

function Row({ items }: { items: React.ReactNode[] }) {
  return (
    <p className="flex flex-wrap items-center gap-[10px] text-[13px] text-erp-label">
      {items.map((it, i) => (
        <span key={i} className="contents">
          {i > 0 && SEP}
          {it}
        </span>
      ))}
    </p>
  );
}

function Social({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <a href="#" aria-label={label} className="grid size-[32px] shrink-0 place-items-center rounded-full bg-[#d9dbe0] text-white transition-colors duration-150 ease-out hover:bg-erp-brand">
      <svg viewBox="0 0 24 24" className="size-[15px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </a>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-erp-bar-line bg-white">
      <div className="mx-auto flex w-[1200px] items-start justify-between gap-[24px] px-[24px] py-[32px]">
        <div className="flex items-start gap-[18px]">
          <div className="flex flex-col items-center gap-[4px]">
            <svg viewBox="0 0 32 32" className="size-[32px] shrink-0" aria-hidden="true">
              <circle cx="16" cy="16" r="16" fill="#1a1a1a" />
              <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">im</text>
            </svg>
            <span className="text-[11px] whitespace-nowrap text-erp-label">INTERPLUG Co., Ltd.</span>
          </div>
          <div className="flex flex-col gap-[6px]">
            <Row items={[<TermsLink key="u" kind="use">이용약관</TermsLink>, <TermsLink key="p" kind="policy">개인정보처리방침</TermsLink>]} />
            <Row items={["상호: 인터플러그", "주소: 03787 서울특별시 서대문구 연세로 5다길 22-3, 발리빌딩 3층"]} />
            <Row items={["이메일: help@interplug.co.kr", "전화번호: 6923-0028", "사업자등록번호 : 1233467890"]} />
            <Row items={["통신판매업신고번호: 2021-00000000000"]} />
            <p className="mt-[6px] text-[12px] text-erp-muted">Copyrights© 2026 INTERPLUG. All Rights Reserved.</p>
          </div>
        </div>
        <div className="flex items-center gap-[10px]">
          <Social label="인스타그램">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
          </Social>
          <Social label="유튜브">
            <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
            <path d="M10.5 9.5v5l4.5-2.5z" fill="currentColor" stroke="none" />
          </Social>
          <Social label="틱톡">
            <path d="M14 3v10.2a3.3 3.3 0 1 1-3.3-3.3c.3 0 .6 0 .9.1V7.4a5.9 5.9 0 1 0 5 5.8V8.6c1 .7 2.2 1.1 3.4 1.1V7.1A5.9 5.9 0 0 1 16 3z" fill="currentColor" stroke="none" />
          </Social>
        </div>
      </div>
    </footer>
  );
}
```

옮기기 전에 데모 `siteFoot`(public.mjs 106행 근처)의 문구·순서가 위와 같은지 대조한다. `text-erp-muted`(globals.css 토큰)·`#d9dbe0` 는 데모가 쓰는 값 그대로다.

- [ ] **Step 4: 그룹 레이아웃과 홈**

`src/app/(public)/(site)/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import { ErpRoot } from "@/components/common";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";

// 로그인 전 화면(홈·로그인, 나중에 찾기·가입·도입문의·공지사항)의 틀. 카드형 틀은 두지 않는다 — 전부 상단 메뉴 + 본문 + 푸터(2026-10-12).
// ERP 화면과 달리 페이지 전체가 세로로 스크롤한다.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <ErpRoot>
      <div className="flex min-h-[100dvh] flex-col bg-white">
        <SiteNav />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </div>
    </ErpRoot>
  );
}
```

`src/app/(public)/(site)/page.tsx`:

```tsx
// 로그인 전 홈. 소개 구획(데모 home/index.html)은 홈 화면 작업에서 옮긴다 — 지금은 레이아웃 확인용.
// 상단 메뉴의 구획 링크(/#ops 등)가 닿을 자리만 둔다.
export default function PublicHome() {
  return (
    <div className="mx-auto flex w-[1200px] flex-col gap-[24px] px-[24px] py-[72px]">
      <h1 className="text-[22px] font-semibold">점포가 늘어도 관리는 한 곳에서</h1>
      {["ops", "finance", "franchise", "addons"].map((id) => (
        <section key={id} id={id} className="scroll-mt-[70px]" />
      ))}
    </div>
  );
}
```

`src/app/page.tsx` 를 지운다: `git rm src/app/page.tsx` (`/` 는 이제 위 화면이다. `/design` 은 그대로 열린다).

- [ ] **Step 5: 빌드·눈 확인**

Run: `pnpm lint && pnpm build`
Expected: 성공, `/` 가 정적 화면으로 잡힌다.

Playwright 1720×1000: `/` 와 데모 `home/index.html` 의 상단 메뉴(70px, 로고·구획 4개·오른쪽 링크 3개)와 푸터를 비교한다. 푸터의 「이용약관」을 눌러 640px 팝업이 뜨고 「확인」·Esc 로 닫히는지 본다.

- [ ] **Step 6: 커밋**

```bash
git add src/lib/terms.ts src/components/site/terms-link.tsx src/components/site/site-nav.tsx src/components/site/site-footer.tsx "src/app/(public)/(site)/layout.tsx" "src/app/(public)/(site)/page.tsx" src/app/page.tsx
git commit -m "feat: 로그인 전 사이트형 레이아웃과 약관 팝업

상단 메뉴 + 본문 + 푸터 한 가지 틀로 로그인 전 화면을 받는다. 푸터의 이용약관·개인정보처리방침은
로그인 화면과 같은 640px 팝업으로 연다. / 는 /design 대신 로그인 전 홈이다.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 로그인 화면과 api 연결

**Files:**
- Create: `src/app/(public)/(site)/login/page.tsx`, `login/login-form.tsx`, `login/actions.ts`

**Interfaces:**
- Consumes: `request`·`ApiError`·`AdminLoginResponse`·`sessionCookie`·`ACCESS_TOKEN_TTL_MS`(Task 2), `homeOf`(Task 1), `TermsLink`(Task 4)
- Produces: `login(prev: LoginState, formData: FormData): Promise<LoginState>` 서버 액션, `type LoginState = { error?: string; loginId?: string }`

- [ ] **Step 1: 서버 액션**

`src/app/(public)/(site)/login/actions.ts`:

```ts
"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_TTL_MS, ApiError, request, sessionCookie, type AdminLoginResponse } from "@/lib/api";
import { homeOf } from "@/lib/auth-routes";

export type LoginState = { error?: string; loginId?: string };

/**
 * api 로그인 → 쿠키 → 권한 유형별 홈. 실패 문구는 api 가 정한 것을 그대로 보인다(없는 아이디·불일치·탈퇴는 같은 문구, 미사용·잠금은 따로).
 * isPasswordChangeRequired 는 강제 비밀번호 변경 작업 전이라 지금은 쓰지 않는다.
 */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const loginId = String(formData.get("loginId") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!loginId || !password) return { error: "아이디와 비밀번호를 입력해 주세요", loginId };

  let res: AdminLoginResponse;
  try {
    res = await request<AdminLoginResponse>("/auth/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId, password, deviceInformation: (await headers()).get("user-agent")?.slice(0, 200) }),
    });
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message, loginId };
    return { error: "로그인 서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요", loginId };
  }

  (await cookies()).set(
    sessionCookie({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
      loginId: res.admin.loginId,
      name: res.admin.name ?? res.admin.loginId,
      roleTypeCode: res.admin.roleTypeCode,
      bpCode: res.admin.bpCode,
    }),
  );
  // redirect 는 try 밖에서 — 안에서 부르면 catch 가 이동 신호를 오류로 삼킨다.
  redirect(homeOf(res.admin.roleTypeCode));
}
```

- [ ] **Step 2: 폼(클라이언트)**

`src/app/(public)/(site)/login/login-form.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Button, Checkbox, Field, TextField } from "@/components/common";
import { login, type LoginState } from "./actions";

// 아이디 저장은 이 브라우저에만 둔다(okf/auth.md — 로그인 유지 선택은 없다).
const SAVED_ID = "whale-erp:saved-login-id";

const QUIET = "text-erp-label transition-colors duration-150 ease-out hover:text-erp-ink";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const idRef = useRef<HTMLInputElement>(null);
  const saveRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_ID);
      if (saved && idRef.current && !idRef.current.value) {
        idRef.current.value = saved;
        if (saveRef.current) saveRef.current.checked = true;
      }
    } catch {
      // 저장소를 못 쓰는 브라우저(사생활 보호 등)면 저장 없이 쓴다.
    }
  }, []);

  const remember = (form: FormData) => {
    try {
      if (saveRef.current?.checked) localStorage.setItem(SAVED_ID, String(form.get("loginId") ?? ""));
      else localStorage.removeItem(SAVED_ID);
    } catch {}
    return action(form);
  };

  return (
    <form action={remember} className="flex flex-col gap-[18px]">
      <h1 className="text-[18px] font-semibold">웨일ERP 로그인</h1>
      <Field label="아이디">
        <TextField ref={idRef} name="loginId" autoComplete="username" placeholder="아이디" defaultValue={state.loginId} required maxLength={20} />
      </Field>
      <Field label="비밀번호">
        <TextField name="password" type="password" autoComplete="current-password" placeholder="비밀번호" required maxLength={128} />
      </Field>
      <Checkbox ref={saveRef} label="아이디 저장" />
      {state.error && (
        <p role="alert" className="text-[13px] text-erp-off">
          {state.error}
        </p>
      )}
      <div className="grid">
        <Button type="submit" disabled={pending}>
          {pending ? "로그인 중" : "로그인"}
        </Button>
      </div>
      {/* 찾기·가입 화면은 다음 작업. 링크 자리는 데모와 같다. */}
      <p className="flex items-center justify-center gap-[10px] text-[14px]">
        <Link href="#" className={QUIET}>아이디 찾기</Link>
        <span className="h-[11px] w-px bg-[#d9d9d9]" />
        <Link href="#" className={QUIET}>비밀번호 찾기</Link>
        <span className="h-[11px] w-px bg-[#d9d9d9]" />
        <Link href="#" className="font-semibold text-erp-brand transition-colors duration-150 ease-out hover:text-erp-ink">사업자회원가입</Link>
      </p>
    </form>
  );
}
```

`TextField`·`Checkbox` 는 나머지 props 를 `<input>` 에 펼친다(`form.tsx`) — React 19 에서 `ref` 도 prop 으로 그대로 닿는다.
`text-erp-off`(#ef6363 상태 빨강)는 DESIGN.md 「색은 상태다」의 위험 표시다.

- [ ] **Step 3: 화면**

`src/app/(public)/(site)/login/page.tsx`:

```tsx
import type { Metadata } from "next";
import { TermsLink } from "@/components/site/terms-link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "로그인 · Whale ERP" };

// 로그인(데모 auth/login.html). 사이트형 틀 안에 흰 카드 하나. 카드 아래 약관 줄은 로그인 화면에만 있다 — 개인정보처리방침을 굵게(okf/auth.md 약관).
export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-[24px] bg-erp-thead-bg p-[24px] py-[72px]">
      <div className="flex w-[420px] flex-col rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
        <LoginForm />
      </div>
      <footer className="flex flex-col items-center gap-[6px] text-[12px] text-erp-label">
        <nav aria-label="약관 및 정책" className="flex gap-[12px]">
          <TermsLink kind="use">이용약관</TermsLink>
          <TermsLink kind="policy">
            <b className="font-semibold text-erp-ink">개인정보처리방침</b>
          </TermsLink>
        </nav>
        <p>
          <b className="font-semibold">WHALE ERP</b> Copyright © Interplug Corp. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
```

- [ ] **Step 4: 빌드**

Run: `pnpm lint && pnpm build`
Expected: 성공

- [ ] **Step 5: api 와 맞춰 보기 (api Task 2 가 끝난 뒤)**

api 워크트리에서 `pnpm start:dev`(8000). front `.env.development` 의 `API_BASE_URL` 이 `http://localhost:8000` 인지 확인. 로그인되는 계정이 없으면 이 단계는 화면만 본다:
- `/login` 에서 아무 아이디·비밀번호 → 「아이디 또는 비밀번호가 올바르지 않습니다」가 폼 아래에 뜬다(api 문구 그대로).
- api 를 끄고 시도 → 「로그인 서버에 연결하지 못했습니다…」.
실제 계정 로그인 성공 흐름은 사용자가 확인한다(설계 §5).

- [ ] **Step 6: 커밋**

```bash
git add "src/app/(public)/(site)/login"
git commit -m "feat: 관리자 로그인 화면을 api 와 연결

서버 액션이 POST /auth/admin/login 을 부르고 httpOnly 쿠키에 토큰을 둔 뒤 권한 유형에 따라 /home 또는
/platform 으로 보낸다. 실패 문구는 api 가 정한 것을 그대로 보이고, 아이디 저장은 브라우저에만 둔다.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: proxy — 막기 · 갱신 · 영역 확인

**Files:**
- Create: `src/proxy.ts`

**Interfaces:**
- Consumes: `areaOf`·`homeOf`·`isPlatformRole`(Task 1), `parseSession`·`sessionCookie`·`SESSION_COOKIE`·`ACCESS_TOKEN_TTL_MS`·`AdminRefreshResponse`(Task 2)

- [ ] **Step 1: 문서 확인**

`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` 의 「Using Cookies」「Setting Headers」(`NextResponse.next({ request: { headers } })`)와 matcher 절을 읽는다. 아래 코드가 그 API 와 다르면 문서를 따른다.

- [ ] **Step 2: 구현**

`src/proxy.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { areaOf, homeOf, isPlatformRole } from "@/lib/auth-routes";
import { ACCESS_TOKEN_TTL_MS, parseSession, SESSION_COOKIE, sessionCookie, type AdminRefreshResponse, type Session } from "@/lib/api";

// 쿠키만 보는 가벼운 확인(Next 16 authentication 가이드의 optimistic check). 데이터 권한은 api 가 토큰으로 다시 본다.
// - ERP·플랫폼 경로에 세션이 없으면 /login
// - 접근 토큰이 1분 안에 끝나면 갱신해 쿠키를 다시 쓴다. 갱신이 실패하면 /login
// - BP·가맹 계정이 플랫폼 경로에 오면 /home. 플랫폼 계정은 ERP 에도 들어간다(F-TLJOCK)
// - 로그인한 채 /login 에 오면 자기 홈
const REFRESH_EARLY_MS = 60_000;

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const area = areaOf(pathname);
  let session = parseSession(req.cookies.get(SESSION_COOKIE)?.value);

  if (area === "public") {
    if (pathname === "/login" && session) return NextResponse.redirect(new URL(homeOf(session.roleTypeCode), req.url));
    return NextResponse.next();
  }
  if (!session) return toLogin(req);
  if (area === "platform" && !isPlatformRole(session.roleTypeCode)) return NextResponse.redirect(new URL("/home", req.url));

  if (session.accessTokenExpiresAt - REFRESH_EARLY_MS > Date.now()) return NextResponse.next();

  session = await refresh(session);
  if (!session) return toLogin(req);
  const cookie = sessionCookie(session);
  // 이 요청의 서버 컴포넌트도 새 토큰을 읽게 요청 쿠키를 바꿔 넘기고, 브라우저에는 Set-Cookie 로 준다.
  req.cookies.set(SESSION_COOKIE, cookie.value);
  const res = NextResponse.next({ request: { headers: req.headers } });
  res.cookies.set(cookie);
  return res;
}

async function refresh(session: Session): Promise<Session | null> {
  const base = process.env.API_BASE_URL;
  if (!base) return null;
  try {
    const r = await fetch(`${base}/auth/admin/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
      cache: "no-store",
    });
    if (!r.ok) return null;
    const body = (await r.json()) as AdminRefreshResponse;
    return { ...session, accessToken: body.accessToken, accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS };
  } catch {
    return null; // api 가 죽었으면 다시 로그인하게 한다. 끝난 토큰으로 화면을 그리면 모든 호출이 401 이다.
  }
}

function toLogin(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

export const config = {
  // 정적 자원·이미지 최적화·아이콘·글꼴은 건너뛴다.
  matcher: ["/((?!_next/static|_next/image|icons/|favicon.ico).*)"],
};
```

갱신 실패 시 세션 만료 경고창(`S-QCNVFC`)은 다음 작업이다 — 지금은 바로 `/login` 으로 보낸다.

- [ ] **Step 3: 빌드·동작 확인**

Run: `pnpm lint && pnpm build`
Expected: 성공, 빌드 출력에 Proxy 가 잡힌다.

`pnpm dev` 후 쿠키 없이(새 시크릿 창 또는 Playwright 새 컨텍스트):
- `/home`, `/config/admins`, `/bp`, `/platform` → 모두 `/login` 으로 간다.
- `/`, `/login`, `/design` → 그대로 열린다.

가짜 쿠키로 영역 확인(Playwright `context.addCookies`, 값은 `encodeURIComponent(JSON.stringify({...}))` 가 아니라 Next 가 읽는 원문 JSON — `req.cookies.get` 은 디코드한다):
- `{"accessToken":"x","refreshToken":"y","accessTokenExpiresAt":<지금+30분 ms>,"loginId":"t","name":"테스트","roleTypeCode":"BM","bpCode":"BP000017"}` → `/home` 열림, 헤더에 「테스트 (BP 마스터)」, `/bp` → `/home` 으로 감, `/login` → `/home`.
- 같은 값에 `"roleTypeCode":"PM"` → `/bp` 열림, `/home` 도 열림.
- `accessTokenExpiresAt` 을 과거로 → 갱신이 실패해(가짜 토큰) `/login` 으로 가고 쿠키가 지워진다.

- [ ] **Step 4: 커밋**

```bash
git add src/proxy.ts
git commit -m "feat: proxy 로 로그인 확인·토큰 갱신·영역 확인

ERP·플랫폼 경로는 세션 쿠키가 있어야 열리고, 접근 토큰이 끝나기 1분 전에 갱신한다. BP·가맹 계정은
플랫폼 경로에 들어가지 못한다. 레이아웃에는 확인을 넣지 않는다(Next 16 가이드).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 데모 — 로그인 전 화면을 사이트형으로, 푸터 약관을 팝업으로

**Files:**
- Modify: `docs/demo/src/public.mjs`
- Delete: `docs/demo/src/pages/auth/terms.mjs`, `docs/demo/auth/terms.html`
- Regenerate: `docs/demo/auth/*.html`, `docs/demo/home/{index,inquiry,notices}.html`, `docs/demo/assets/erp.css`

- [ ] **Step 1: `authPage` 를 사이트형으로**

`docs/demo/src/public.mjs` 의 `authPage` 를 바꾼다(`header`·`home` 인자는 받기만 하고 쓰지 않게 — 부르는 쪽 6곳을 고치지 않는다):

```js
// 가운데 카드 하나짜리 화면(로그인·찾기·가입·가입 완료·강제 비밀번호 변경). 2026-10-12 부터 카드형 틀 없이 사이트형(상단 메뉴 + 본문 + 푸터)이다 —
// 흰 카드는 본문 안에 남는다. header·home 인자는 예전 호출과 맞추려고 받기만 한다.
export function authPage(A, R, { card, width = "w-[420px]", foot = "" }) {
  const main = `<div class="flex flex-col items-center gap-[24px] bg-erp-thead-bg p-[24px] py-[72px]"><main class="flex ${width} flex-col gap-[18px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">${card}</main>${foot}</div>`;
  return `<div class="${ui.ERP_THEME}"><div class="h-[100dvh] overflow-y-auto bg-white">${siteNav(A, R)}${main}${siteFoot(A, R)}</div></div>`;
}
```

(위 `authPage` 바로 위 주석 두 줄 「가운데 카드 하나짜리 화면…」「header 를 주면…」은 이 주석으로 바꾼다.)

- [ ] **Step 2: 푸터 약관을 팝업으로**

`siteFoot` 의 첫 `row(...)` 를 바꾼다 — 페이지 링크 대신 `legalFoot` 과 같은 팝업:

```js
  const use = x.dialogId();
  const policy = x.dialogId();
  const termsBtn = (id, label) => `<button type="button" data-dialog="${id}" class="text-erp-label transition-colors duration-150 ease-out hover:text-erp-ink">${label}</button>`;
```

를 `siteFoot` 맨 앞(`const sep` 아래)에 두고, `row(quietLink("이용약관", link(R, "auth/terms.html#use")), quietLink("개인정보처리방침", "#"))` 를 `row(termsBtn(use, "이용약관"), termsBtn(policy, "개인정보처리방침"))` 로, 반환 문자열 끝 `</footer>` 뒤에 `${termsDialog(use, "use", "w-[640px]")}${termsDialog(policy, "policy", "w-[640px]")}` 를 붙인다. 위 주석에 「이용약관·개인정보처리방침은 로그인 화면과 같은 팝업(2026-10-12)」을 더한다.

- [ ] **Step 3: 약관 전문 페이지 지우기**

```bash
grep -rn "auth/terms.html" docs/demo/src    # 남은 링크가 없어야 한다
git rm docs/demo/src/pages/auth/terms.mjs docs/demo/auth/terms.html
```

남은 링크가 있으면(예: 데모 입구 index 의 화면 목록) 그 줄을 지운다. `docs/demo/src/pages/index.mjs` 는 `pages` 목록을 자동으로 받으므로 다시 빌드하면 빠진다.

- [ ] **Step 4: 데모 빌드**

```bash
for i in 1 2 3; do node docs/demo/build.mjs && break; sleep 2; done   # Windows 에서 _check 파일 잠금(EBUSY)이 가끔 난다
git status --short docs/demo
```

Expected: 바뀐 html 은 `auth/*`(terms 제외), `home/index.html`·`home/inquiry.html`·`home/notices.html`(푸터), `index.html`(목록), `assets/erp.css`. **3팀 화면(home 의 signed-in, staff·support·notify)이 바뀌어 있으면 그 파일은 되돌린다** — `git checkout -- <그 파일>`. 단 `home/index.html`·`inquiry`·`notices` 는 로그인 전 공용 틀(public.mjs) 변경이라 바뀌는 것이 맞다 — 사용자에게 이 세 파일이 바뀐다는 것을 마지막 보고에 적는다.

- [ ] **Step 5: 눈 확인**

`python -m http.server 8765 --directory docs/demo` 후 Playwright: `auth/login.html`·`auth/find.html`·`auth/signup.html` 이 상단 메뉴 + 카드 + 푸터로 보이는지, 푸터 「이용약관」이 640px 팝업으로 뜨는지.

- [ ] **Step 6: 커밋**

```bash
git add docs/demo/src/public.mjs docs/demo/auth docs/demo/home/index.html docs/demo/home/inquiry.html docs/demo/home/notices.html docs/demo/index.html docs/demo/assets/erp.css
git status --short     # 의도하지 않은 파일이 staged 되지 않았는지
git commit -m "docs(demo): 로그인 전 화면을 사이트형으로, 푸터 약관을 팝업으로

로그인·찾기·가입 화면이 상단 메뉴 + 카드 + 푸터 틀을 쓴다. 푸터의 이용약관·개인정보처리방침은 로그인
화면과 같은 팝업으로 열고, 링크가 끊긴 약관 전문 페이지(auth/terms.html)는 지운다.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: okf 반영과 마무리 확인

**Files:**
- Modify: `okf/whale-erp-front.md`, `okf/log.md`, (해당하면) `okf/auth.md`

- [ ] **Step 1: 대상 찾기**

Run: `grep -rln "src/app/page.tsx\|src/app/layout.tsx\|src/lib/api.ts\|docs/demo/src/public.mjs\|auth/terms" okf`
→ 나온 concept 을 고친다. 최소한 `okf/whale-erp-front.md`:
- Layout 절: 「`/` 는 `/design` 으로 리다이렉트」→ 「`/` 는 로그인 전 홈. 레이아웃은 `(public)/(site)`(상단 메뉴+푸터) · `(erp)` · `(platform)`(같은 GlobalHeader, 메뉴만 다름) 셋이고 루트 레이아웃은 하나다. 영역은 URL 이 정한다(`src/lib/auth-routes.ts`)」
- `src/lib/api.ts` 줄: 세션 쿠키(`session`: 접근·갱신 토큰, 이름, 권한 유형, BP 코드) 모양, `parseSession`·`sessionCookie`, 손으로 적은 응답 타입
- `src/proxy.ts` 줄 추가: 막기·1분 전 갱신·영역 확인
- API 절: 「지금 부르는 엔드포인트는 없다」→ `POST /auth/admin/login`·`/refresh`·`/logout`
- 테스트: `node --test src/lib/auth-routes.test.ts`
각 concept 의 `generated.at` 을 지금 UTC 로 바꾼다. `okf/auth.md` 에는 「약관 전문 페이지 `/terms` 를 두지 않고 푸터·로그인 모두 팝업(2026-10-12)」을 화면 표·약관 절에 반영한다.

- [ ] **Step 2: log**

`okf/log.md` 맨 위(기존 형식 따라) 한 줄:

```
- 2026-10-12 관리자 로그인(BFF 쿠키 + proxy)과 레이아웃 3종(사이트형·ERP·플랫폼) 반영, 약관 전문 페이지 대신 팝업 — okf/whale-erp-front.md, okf/auth.md
```

- [ ] **Step 3: 전체 확인**

```bash
node --test src/lib/auth-routes.test.ts src/components/common/date-math.test.ts
pnpm lint && pnpm build
git status --short     # 남은 변경이 없어야 한다(okf 제외)
```

- [ ] **Step 4: 커밋**

```bash
git add okf/whale-erp-front.md okf/log.md okf/auth.md
git commit -m "docs: 관리자 로그인과 레이아웃 3종을 okf에 반영

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: 사용자에게 넘길 것**

푸시하지 않는다. 보고에 담는다: 두 저장소의 브랜치·커밋 목록, 확인한 것과 못 한 것(실제 계정 로그인은 사용자 몫), 데모에서 함께 바뀐 `home/index·inquiry·notices.html`, 알려진 한계(아래).

## 알려진 한계 (이번 범위 밖)

- 로그인 후에도 GlobalHeader 로고는 `/`(로그인 전 홈)로 간다 — `Logo` 가 공통 컴포넌트 안에 고정돼 있다. 1팀 공통 컴포넌트 수정 사항으로 넘긴다.
- 강제 비밀번호 변경 팝업이 없어 임시 비밀번호로 들어와도 바로 홈으로 간다.
- 세션 만료 경고창 없이 바로 `/login` 으로 간다.
- 브라우저 IP 가 api 로그인 이력에 남지 않는다(Next 서버 IP 가 남는다).
