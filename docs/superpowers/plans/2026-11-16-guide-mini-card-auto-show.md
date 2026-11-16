# 미니 카드 자동 띄우기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 점포 · 권한 그룹 · 관리자 · 직원이 0건인 화면에 메뉴로 들어오면 그 단계 미니 카드를 오른쪽 아래에 자동으로 띄운다.

**Architecture:** 판정(어느 화면 → 어느 단계 · 어떤 건수, 닫은 기록 키)은 `src/lib/start-guide.ts` 순수 함수로 두고 node --test 로 본다. 건수는 새 서버 액션 하나가 목록 API 를 1쪽만 불러 `total` 로 준다. `GuideMiniCardSlot` 은 `?guide=` 도착이 없을 때만 자동 판정을 하고, 보일 가이드 = 도착 가이드 ?? 자동 가이드다.

**Tech Stack:** Next.js(이 저장소 버전 — `node_modules/next/dist/docs/` 확인), React 19, node:test, Tailwind.

**Spec:** `docs/superpowers/specs/2026-11-16-guide-mini-card-auto-show-design.md`

## Global Constraints

- 화면 파일(1팀 · 3팀 `src/app/stores` · `bp-role-groups` · `bp-admins` · `staff-members`)은 고치지 않는다.
- 서버 액션은 화면에서 `useAction(…, { overlay: false })` 로 부르고, 실패 처리 첫 줄에서 `expiredFailureOf` 로 만료를 거른다(`src/lib/expiry-guard.test.ts` G2 · G4).
- 웨일ERP 탭(`useService() === "WHALE_ERP"`)에서만 자동으로 띄운다.
- 갈래는 `initialTrackOf(account.roleTypeCode)`.
- 닫은 기록은 `localStorage`, 읽기 · 쓰기 모두 try/catch(막힌 브라우저에서도 화면이 깨지지 않게, 실패하면 기록 없음으로 본다).
- 화면 문구 · 주석은 한국어, 날짜 「2026-11-16 사용자 지정」.
- CRLF 파일은 줄 끝을 보존한다.

## Review Focus

- `?guide=` 로 들어온 카드를 닫은 뒤 같은 화면에 그대로 있을 때 자동 카드가 대신 떠서는 안 된다 → Task 3 Step 1 판정 `autoAllowed` 테스트.
- 건수 조회가 늦게 와서 그새 다른 화면으로 옮겼으면 띄우지 않는다 → Task 3 응답 화면 확인.
- 점포가 폐점 점포만 있을 때는 0건으로 본다(점포 없음 띠와 같다) → Task 1 `autoGuideOf` 는 화면만 보고, 점포 조건은 Task 3 에서 `stores.every(isClosedStore)`.
- 계정 · BP 가 바뀌면 닫은 기록이 섞이지 않는다 → Task 1 `autoDismissKey` 테스트.
- 조회 실패(403 · 500 · 만료)는 띄우지 않고 오류도 띄우지 않는다 → Task 2 실패 결과, Task 3 는 `ok` 일 때만.

---

### Task 1: 자동 판정 함수(lib)

**Files:**
- Modify: `src/lib/start-guide.ts` (파일 끝, 미니 카드 판정 묶음 아래)
- Test: `src/lib/start-guide.test.ts`

**Interfaces:**
- Produces:
  - `export type GuideCountKind = "stores" | "roleGroups" | "admins" | "staff"`
  - `export type AutoGuide = { guide: GuideRef; count: GuideCountKind }`
  - `export function autoGuideOf(track: GuideTrack, screen: string): AutoGuide | null`
  - `export function cardPartsOf(guide: GuideRef, screen: string): GuidePart[]` — `partsOnScreen` 이 비었고 화면이 `/stores` 이고 단계가 STEP 1 이면 그 단계 칸 전부, 아니면 `partsOnScreen` 그대로
  - `export const autoDismissKey = (adminAccountId: number, bpCodeId: number, guide: GuideRef, screen: string) => string` — 「guide-auto-dismissed:<계정>:<BP>:<갈래>-<단계>:<화면>」

화면 → 건수 표(모듈 상수): `/stores`·`/stores/new` → `stores`, `/bp-role-groups` → `roleGroups`, `/bp-admins` → `admins`, `/staff-members` → `staff`. 표에 없는 화면은 null. 단계는 그 갈래 `GUIDE_STEPS` 의 주 단계(STEP n) 순서대로 `cardPartsOf(…, screen)` 이 비지 않은 첫 단계.

- [ ] **Step 1: 실패하는 테스트**

```ts
test("자동 띄우기 — 화면별 단계 · 건수", () => {
  assert.deepEqual(autoGuideOf("STORE", "/stores/new"), { guide: { track: "STORE", step: "1" }, count: "stores" });
  assert.deepEqual(autoGuideOf("STORE", "/stores"), { guide: { track: "STORE", step: "1" }, count: "stores" });
  assert.deepEqual(autoGuideOf("STORE", "/bp-role-groups"), { guide: { track: "STORE", step: "2" }, count: "roleGroups" });
  assert.deepEqual(autoGuideOf("STORE", "/bp-admins"), { guide: { track: "STORE", step: "2" }, count: "admins" });
  assert.deepEqual(autoGuideOf("STORE", "/staff-members"), { guide: { track: "STORE", step: "3" }, count: "staff" });
  assert.equal(autoGuideOf("STORE", "/work-schedules"), null);
  assert.equal(autoGuideOf("STORE", "/stores/12"), null);
  assert.deepEqual(autoGuideOf("FRANCHISEE", "/stores"), { guide: { track: "FRANCHISEE", step: "1" }, count: "stores" });
});

test("자동 띄우기 — 점포 목록에서도 STEP 1 칸을 보인다", () => {
  const g = { track: "STORE" as const, step: "1" };
  assert.ok(cardPartsOf(g, "/stores").length > 0);
  assert.deepEqual(cardPartsOf(g, "/stores/new"), partsOnScreen(g, "/stores/new"));
  assert.equal(cardPartsOf({ track: "STORE", step: "3" }, "/stores").length, 0);
});

test("자동 띄우기 닫은 기록 — 계정 · BP · 단계 · 화면마다 다르다", () => {
  const g = { track: "STORE" as const, step: "3" };
  const k = autoDismissKey(1, 8, g, "/staff-members");
  assert.equal(k, "guide-auto-dismissed:1:8:STORE-3:/staff-members");
  assert.notEqual(k, autoDismissKey(2, 8, g, "/staff-members"));
  assert.notEqual(k, autoDismissKey(1, 9, g, "/staff-members"));
});
```

- [ ] **Step 2: 실패 확인** — `node --test src/lib/start-guide.test.ts` → `autoGuideOf is not a function` 류로 FAIL.
- [ ] **Step 3: 구현** — 위 Interfaces 그대로. 가맹점 갈래 STEP 1 칸은 `/stores` 라 `partsOnScreen` 으로 잡힌다. 가맹점 갈래에서 `/bp-role-groups` 등 칸이 없는 화면은 null 이 맞는지 테스트 결과로 확인하고, 다르면 실제 칸 기준(데이터)이 맞다 — 테스트 기대값을 데이터에 맞춘다.
- [ ] **Step 4: 통과 확인** — 같은 명령, 모두 PASS.
- [ ] **Step 5: 커밋** — `feat: 미니 카드 자동 띄우기 판정(화면 → 단계 · 건수, 닫은 기록 키)`

### Task 2: 건수 서버 액션

**Files:**
- Create: `src/app/start-guide/guide-count-actions.ts` (`"use server"`)

**Interfaces:**
- Consumes: `GuideCountKind`(Task 1, `"stores"` 제외)
- Produces: `export async function getGuideCountAction(kind: Exclude<GuideCountKind, "stores">): Promise<{ ok: true; total: number } | { ok: false; expired?: true }>`

- `roleGroups`: `getBpRoleGroups(1).total`(`src/lib/bp-role-groups.ts`, 고정 권한은 api 가 이미 뺀다).
- `admins`: `getBpAdmins({ page: 1, pageSize: 20, storeIds: [] }).total`(`src/lib/bp-admins.ts`).
- `staff`: `request("/staff-members?page=1&pageSize=20", { method: "GET", headers: await authHeaders() })` 의 `total` — 조건 없이 부르면 api 는 재직 상태 구분 없이 업무 범위 전체를 센다(`staff-member-list.query.dto.ts` employmentStatus 선택값). 3팀 lib 은 고치지 않는다.
- catch 첫 줄 `const expired = expiredFailureOf(error); if (expired) return expired;`, 그 밖은 `console.warn` 후 `{ ok: false }`(`my-page-actions.ts` 모양).

- [ ] **Step 1: 작성** — 위대로.
- [ ] **Step 2: 확인** — `pnpm test` 전체 PASS(G2 가 새 catch 를 본다), `pnpm lint` 오류 없음, `pnpm exec tsc --noEmit` 에서 이 파일 오류 없음.
- [ ] **Step 3: 커밋** — `feat: 미니 카드 자동 띄우기 건수 조회 액션`

### Task 3: 카드 슬롯에 붙이기

**Files:**
- Modify: `src/app/start-guide/guide-mini-card.tsx`
- Modify: `src/lib/start-guide.ts` · `src/lib/start-guide.test.ts`(판정 `autoAllowed` 추가)

**Interfaces:**
- Consumes: Task 1 전부, `getGuideCountAction`(Task 2), `useAccount` · `useCurrentBp` · `useService` · `useStores`(`@/components/site/session-gate`), `isClosedStore`(`@/lib/store-scope`), `useAction`(`@/components/common`).
- Produces: `export function autoAllowed(arrival: GuideArrival, screen: string): boolean` — 도착 기억(`arrival.seen`)이 이 화면 것이면(닫았든 아니든) false, 아니면 true. `seen` 은 「STORE-1|/stores/new」 모양.

- [ ] **Step 1: 실패하는 테스트**

```ts
test("자동 띄우기는 ?guide= 도착이 없는 화면에서만", () => {
  assert.equal(autoAllowed({ guide: null, seen: null }, "/staff-members"), true);
  assert.equal(autoAllowed({ guide: "STORE-3", seen: "STORE-3|/staff-members" }, "/staff-members"), false);
  assert.equal(autoAllowed({ guide: null, seen: "STORE-3|/staff-members" }, "/staff-members"), false); // 도착 카드를 닫은 뒤
});
```

- [ ] **Step 2: 실패 확인** — `node --test src/lib/start-guide.test.ts` FAIL.
- [ ] **Step 3: `autoAllowed` 구현** 후 PASS 확인.
- [ ] **Step 4: 슬롯 고치기**
  - 상태 `auto: { key: string; guide: GuideRef } | null` 을 더한다. 보일 가이드 = `parseGuide(next.guide) ?? auto?.guide`, 칸 = `cardPartsOf(보일 가이드, screen)`.
  - effect(의존: `screen`, `service`, 계정 id, BP id, 점포 0건 여부, `autoAllowed(next, screen)`): 조건(웨일ERP · `autoAllowed` · `autoGuideOf` 결과 있음 · 닫은 기록 없음)이 아니면 `auto` 를 null. `count === "stores"` 이면 `stores.every(isClosedStore)` 로 바로 정한다. 그 밖은 `getGuideCountAction` 을 부르고, 응답이 왔을 때 effect 가 정리됐으면(화면이 바뀜) 버린다. `ok && total === 0` 이면 `auto` 를 정하고 펼침 · 기본 자리로 둔다.
  - 닫기(×): 보이는 것이 자동 카드면 `localStorage.setItem(autoDismissKey(...), "1")` 후 `auto` 를 null, 도착 카드면 지금 동작 그대로.
  - 머리 주석에 자동 띄우기 규칙 한 문단(2026-11-16 사용자 지정).
- [ ] **Step 5: 확인** — `pnpm test`, `pnpm lint` 통과. dev 서버(3001)에서 점포 · 직원 없는 BP 로 메뉴 진입 → 카드 뜸, × → 다시 들어와도 안 뜸, 시작 가이드 [가기] → 뜸, 직원 있는 BP → 안 뜸, 플랫폼 탭 → 안 뜸. (서버는 사용자에게 묻고 켠다.)
- [ ] **Step 6: 커밋** — `feat: 그 단계 화면에 0건이면 미니 카드 자동 띄우기`

### Task 4: 문서

**Files:**
- Modify: `DESIGN.md`(Navigation 「시작 가이드」 미니 카드 문장 뒤)
- Modify: okf 에서 `guide-mini-card.tsx` · `start-guide.ts` 를 `sources[].resource` 로 둔 concept(`grep -rl "guide-mini-card\|start-guide.ts" okf`) 본문 · `generated.at`(UTC), `okf/log.md` 2026-11-16 한 줄.

- [ ] **Step 1: 작성** — 규칙: 점포 · 권한 그룹 · 관리자 · 직원 화면에 메뉴로 들어와 0건이면 그 단계 카드가 자동으로 뜬다, 웨일ERP 탭만, 닫으면 그 브라우저 · 계정 · BP 에서 다시 안 뜬다, 시작 가이드 [가기]는 늘 띄운다(2026-11-16 사용자 지정).
- [ ] **Step 2: 커밋** — `docs: 미니 카드 자동 띄우기 규칙 반영(DESIGN · okf)`

이후 정해진 순서: lint → superpowers 리뷰 → pr-review-toolkit → PR(base main) → code-review → ip-code-review-claude. 머지는 하지 않는다.
