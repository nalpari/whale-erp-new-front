# 직원 정보 관리 목록 화면 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로그인 없이 `/staff-members` 에 접속해 데모와 같은 직원 목록을 보고 필터 · 검색 · 페이지 이동을 쓸 수 있게 한다(목 데이터).

**Architecture:** 서버 컴포넌트 페이지가 URL 쿼리를 `parseStaffListQuery` 로 읽어 `getStaffMembers` 를 부르고, 그 결과를
공통 컴포넌트로 그린다. 필터 · 건수 · 페이지 조작은 클라이언트 컴포넌트가 `router.replace` 로 URL 만 바꾼다. 거르기 ·
URL 변환 · 한 줄 표시는 순수 함수라 `node --test` 로 시험한다.

**Tech Stack:** Next.js 16.3 App Router, React 19, Tailwind 4, TypeScript, Node 24 내장 `node:test`(타입을 벗겨 실행).

**Spec:** `docs/plans/2026-10-12-staff-member-list-screen-design.md`

**작업 위치:** worktree `~/.whale-erp-worktrees/whale-erp-front/giza`, 브랜치 `squirtle`. 모든 명령은 이 디렉터리에서 돈다.

## Global Constraints

- 데이터는 목이다. api 를 부르지 않고, 개발용 토큰 경로를 만들지 않는다.
- 응답 모양은 api `StaffMemberListResponseDto` 를 그대로 옮긴다(`{ items, total }`, 날짜는 ISO 문자열).
- 순수 모듈(`src/lib/staff-members.ts`, `src/lib/staff-members.mock.ts`, `src/app/staff-members/staff-list-query.ts`, `src/app/staff-members/staff-row.ts`)은 `node --test` 가 직접 읽으므로 **서로를 상대 경로 + `.ts` 확장자로** import 하고 `@/` 별칭을 쓰지 않는다. 컴포넌트(`.tsx`)는 평소처럼 `@/` 를 쓴다.
- Node 타입 벗기기가 못 읽는 문법(`enum`, 생성자 매개변수 속성, `namespace`)을 순수 모듈에 쓰지 않는다.
- 표는 8칸(데모의 「이번 주」 칸은 뺐다), 제목 줄 버튼은 「직원 초대」(근로계약서 초안 작성 링크).
- 화면은 `src/components/common/` 공통 컴포넌트를 먼저 쓴다. 색은 `--color-erp-*` 토큰.
- 배지: 데모 `ok`·`info` → `Badge tone="on"`, `warn`·`risk` → `Badge tone="off"`, `quiet` → 회색 배지 `inline-block rounded-[2px] px-[4px] py-[2px] text-center text-[14px] font-medium bg-erp-subtle text-erp-ink whitespace-nowrap`. 글자: 초록 `text-erp-on`, 붉은 `text-erp-off`, 흐린 `text-erp-muted`.
- 날짜는 한국 날짜 기준. 갱신 예정은 종료일까지 0~30일(갱신 예정 알림과 같은 30일, `okf/notify.md` `S-JUWPXF`).
- 커밋 메시지는 영어 type 접두 + 한글 제목, 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- `next dev` 가 `AGENTS.md` 상단 블록을 다시 써 넣는다 — 그 변경은 커밋에 섞지 않는다(`git add` 는 경로를 지정해서).

## Review Focus

- **체크를 모두 끄면** — 결과가 0건이고 URL 에 `joinGroup=` 이 남아 새로고침해도 0건이어야 한다(기본값으로 돌아가면 안 된다). → Task 1 「묶음을 하나도 고르지 않으면 0건」, Task 3 「체크를 모두 끄면 빈 값으로 남는다」.
- **4쪽에서 필터를 바꾸면** — 1쪽으로 돌아가야 한다(그대로면 빈 쪽이 보인다). → Task 3 「필터를 바꾸면 page 를 지운다」.
- **같은 파라미터가 두 번 오면**(`?store=a&store=b`) — 첫 값만 쓰고 오류가 나지 않아야 한다. → Task 3 「같은 이름이 여럿이면 첫 값」.
- **D-day 경계** — 오늘이 기한이면 D-0, 종료일이 지난 체결 완료 계약은 「갱신 예정」이 아니라 「체결 완료」. → Task 4 「오늘이 기한이면 D-0」, 「종료일이 지났으면 체결 완료」.
- **번호를 하이픈과 함께 검색** — `010-2841` 로 서지안이 찾혀야 한다. → Task 1 「하이픈 섞인 번호로 찾는다」.

---

### Task 1: 직원 목록 타입과 거르기 (`queryStaff`)

**Files:**
- Create: `src/lib/staff-members.ts`
- Create: `src/lib/staff-members.test.ts`

**Interfaces:**
- Produces (`src/lib/staff-members.ts`):
  - 타입 `StaffJoinState`, `EmploymentType`, `EmploymentStatus`, `ContractStatus`, `StoreType`, `StaffMemberListItem`, `StaffMemberListResponse`, `JoinGroup`, `EmploymentStatusFilter`, `PageSize`, `StaffListQuery`, `StaffRecord`
  - 상수 `EMPLOYMENT_TYPES`, `JOIN_GROUPS`, `JOIN_GROUP_STATES`, `PAGE_SIZES`
  - `function kstToday(now?: Date): string` — 한국 날짜 `YYYY-MM-DD`
  - `function queryStaff(query: StaffListQuery, records: readonly StaffRecord[]): StaffMemberListResponse`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/lib/staff-members.test.ts`:

```ts
// node --test src/lib/staff-members.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EMPLOYMENT_TYPES,
  JOIN_GROUPS,
  kstToday,
  queryStaff,
  type StaffListQuery,
  type StaffRecord,
} from "./staff-members.ts";

const base: StaffListQuery = {
  store: "",
  keyword: "",
  employmentTypes: [...EMPLOYMENT_TYPES],
  joinGroups: [...JOIN_GROUPS],
  employmentStatus: "EMPLOYED",
  page: 1,
  pageSize: 20,
};

let nextId = 1;
const rec = (over: Partial<StaffRecord> = {}): StaffRecord => ({
  staffMemberId: nextId++,
  isMasked: false,
  name: "서지안",
  phone: "01028417702",
  store: { storeId: 1, name: "모리커피 서초점", storeType: "DIRECT" },
  employmentType: "FULL_TIME",
  joinState: "JOINED",
  invitation: null,
  linkHold: null,
  contract: null,
  employmentStatus: "EMPLOYED",
  retiredDate: null,
  ...over,
});
const ids = (r: { items: { staffMemberId: number }[] }) => r.items.map((i) => i.staffMemberId);

test("기본은 재직만, 최근 등록 먼저", () => {
  const a = rec();
  const b = rec({ employmentStatus: "RETIRED" });
  const c = rec();
  const res = queryStaff(base, [a, b, c]);
  assert.deepEqual(ids(res), [c.staffMemberId, a.staffMemberId]);
  assert.equal(res.total, 2);
});

test("재직 상태 ALL 이면 퇴직도 나온다", () => {
  const res = queryStaff({ ...base, employmentStatus: "ALL" }, [rec(), rec({ employmentStatus: "RETIRED" })]);
  assert.equal(res.total, 2);
});

test("가린 행은 개인 칸을 비워 낸다", () => {
  const m = rec({ isMasked: true, name: "가맹직원", store: { storeId: 6, name: "모리커피 연남점", storeType: "FRANCHISE" } });
  const [item] = queryStaff(base, [m]).items;
  assert.equal(item.isMasked, true);
  assert.equal(item.name, null);
  assert.equal(item.phone, null);
  assert.equal(item.joinState, null);
  assert.equal(item.employmentStatus, null);
  assert.deepEqual(item.store, m.store);
});

test("검색어가 있으면 가린 행을 뺀다 — 가린 사람이 검색으로 드러나지 않게", () => {
  const m = rec({ isMasked: true, name: "가맹직원" });
  assert.equal(queryStaff({ ...base, keyword: "가맹직원" }, [m]).total, 0);
});

test("재직 상태로 걸러도 가린 행은 남는다 — api 와 같다", () => {
  const m = rec({ isMasked: true, employmentStatus: "RETIRED" });
  assert.equal(queryStaff({ ...base, employmentStatus: "RETIRED" }, [m]).total, 1);
  assert.equal(queryStaff(base, [m]).total, 0);
});

test("점포명으로 걸러도 가린 행은 남는다 — 점포는 가린 칸이 아니다", () => {
  const m = rec({ isMasked: true, store: { storeId: 6, name: "모리커피 연남점", storeType: "FRANCHISE" } });
  assert.equal(queryStaff({ ...base, store: "연남" }, [m, rec()]).total, 1);
});

test("이름 부분 일치로 찾는다", () => {
  assert.equal(queryStaff({ ...base, keyword: "지안" }, [rec(), rec({ name: "오세라" })]).total, 1);
});

test("하이픈 섞인 번호로 찾는다", () => {
  const res = queryStaff({ ...base, keyword: "010-2841" }, [rec(), rec({ phone: "01033924418" })]);
  assert.equal(res.total, 1);
});

test("고용형태 하나만 고르면 그것만", () => {
  const res = queryStaff({ ...base, employmentTypes: ["PART_TIME"] }, [rec(), rec({ employmentType: "PART_TIME" })]);
  assert.equal(res.total, 1);
});

test("초대 발송 묶음은 INVITED · EXPIRED · REJECTED", () => {
  const rows = [
    rec({ joinState: "INVITED" }),
    rec({ joinState: "EXPIRED" }),
    rec({ joinState: "REJECTED" }),
    rec({ joinState: "JOINED" }),
  ];
  assert.equal(queryStaff({ ...base, joinGroups: ["INVITED"] }, rows).total, 3);
});

test("DRAFT · RETURN_PENDING 은 묶음을 모두 고를 때만 보인다", () => {
  const rows = [rec({ joinState: "DRAFT" }), rec({ joinState: "RETURN_PENDING" })];
  assert.equal(queryStaff(base, rows).total, 2);
  assert.equal(queryStaff({ ...base, joinGroups: JOIN_GROUPS.slice(0, 4) }, rows).total, 0);
});

test("묶음을 하나도 고르지 않으면 0건", () => {
  assert.equal(queryStaff({ ...base, joinGroups: [] }, [rec()]).total, 0);
});

test("쪽을 나누고, 마지막 쪽 너머는 빈 items 와 total", () => {
  const rows = Array.from({ length: 25 }, () => rec());
  const p2 = queryStaff({ ...base, page: 2 }, rows);
  assert.equal(p2.items.length, 5);
  assert.equal(p2.total, 25);
  const p9 = queryStaff({ ...base, page: 9 }, rows);
  assert.deepEqual(p9.items, []);
  assert.equal(p9.total, 25);
});

test("kstToday 는 한국 날짜 — UTC 로 전날 15시는 한국 0시", () => {
  assert.equal(kstToday(new Date("2026-10-11T15:00:00Z")), "2026-10-12");
  assert.equal(kstToday(new Date("2026-10-11T14:59:00Z")), "2026-10-11");
});
```

- [ ] **Step 2: 실패하는지 본다**

Run: `node --test src/lib/staff-members.test.ts`
Expected: FAIL — `Cannot find module '.../src/lib/staff-members.ts'`

- [ ] **Step 3: 구현한다**

`src/lib/staff-members.ts`:

```ts
// 직원 목록 데이터 계층. 응답 모양은 whale-erp-api 의 GET /staff-members(StaffMemberListResponseDto)를 그대로 옮겼다.
// 관리자 로그인(1팀)이 생기기 전이라 지금은 목 데이터를 거른다. api 를 붙일 때 getStaffMembers 의 안만 request() 로
// 바꾸고(점포명 → storeIds, 묶음 → joinState 쉼표 목록, ALL → employmentStatus 생략), 함수 이름과 돌려주는 모양은 그대로다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import { buildMockStaff } from "./staff-members.mock.ts";

export type StaffJoinState =
  | "JOINED"
  | "LINK_HOLD"
  | "UNDER_AGE"
  | "AFFILIATION_PENDING"
  | "RETURN_PENDING"
  | "INVITED"
  | "EXPIRED"
  | "REJECTED"
  | "DRAFT";
export type EmploymentType = "FULL_TIME" | "PART_TIME";
export type EmploymentStatus = "EMPLOYED" | "RETIRED";
export type ContractStatus = "PENDING_SEND" | "PENDING_SIGNATURE" | "SIGNED" | "REJECTED" | "EXPIRED" | "ENDED";
export type StoreType = "DIRECT" | "FRANCHISE";

/** 직원 목록 한 줄. isMasked 면 staffMemberId · store 밖의 칸은 모두 null 이다(본사 제공 동의 없음). */
export interface StaffMemberListItem {
  staffMemberId: number;
  isMasked: boolean;
  name: string | null;
  phone: string | null;
  store: { storeId: number; name: string; storeType: StoreType };
  employmentType: EmploymentType | null;
  joinState: StaffJoinState | null;
  invitation: { invitationType: string; status: string; lastSentAt: string; expiresAt: string } | null;
  linkHold: { linkHoldId: number; mismatchReason: string; verifiedPhoneLast4: string; heldAt: string } | null;
  contract: { contractId: number; status: ContractStatus | null; signDeadlineAt: string | null; endDate: string | null } | null;
  employmentStatus: EmploymentStatus | null;
  /** 퇴직일 YYYY-MM-DD. 재직이면서 값이 있으면 퇴직 예정 */
  retiredDate: string | null;
}

export interface StaffMemberListResponse {
  items: StaffMemberListItem[];
  total: number;
}

export const EMPLOYMENT_TYPES: readonly EmploymentType[] = ["FULL_TIME", "PART_TIME"];

/** 화면 「가입·인증」 체크 다섯. api 의 StaffJoinState 를 묶는다. */
export type JoinGroup = "JOINED" | "INVITED" | "LINK_HOLD" | "AFFILIATION" | "UNDER_AGE";
export const JOIN_GROUPS: readonly JoinGroup[] = ["JOINED", "INVITED", "LINK_HOLD", "AFFILIATION", "UNDER_AGE"];
// DRAFT · RETURN_PENDING 은 체크 항목이 없어 다섯 다 고른 상태(= 필터 없음)에서만 보인다.
export const JOIN_GROUP_STATES: Record<JoinGroup, readonly StaffJoinState[]> = {
  JOINED: ["JOINED"],
  INVITED: ["INVITED", "EXPIRED", "REJECTED"],
  LINK_HOLD: ["LINK_HOLD"],
  AFFILIATION: ["AFFILIATION_PENDING"],
  UNDER_AGE: ["UNDER_AGE"],
};

export type EmploymentStatusFilter = EmploymentStatus | "ALL";
export const PAGE_SIZES = [20, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export interface StaffListQuery {
  /** 점포명 검색어 */
  store: string;
  /** 이름 · 휴대전화번호 검색어 */
  keyword: string;
  employmentTypes: EmploymentType[];
  joinGroups: JoinGroup[];
  employmentStatus: EmploymentStatusFilter;
  page: number;
  pageSize: PageSize;
}

/** 목 한 줄. 가린 행도 거르기에 쓸 값을 갖고 있다가 응답으로 낼 때 지운다 — api 는 서버에서 가린다. */
export type StaffRecord = StaffMemberListItem;

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 한국 날짜 YYYY-MM-DD. 서버가 UTC 로 돌아도 0시~9시에 날짜가 어긋나지 않게 한다. */
export function kstToday(now: Date = new Date()): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

function masked(r: StaffRecord): StaffMemberListItem {
  return {
    staffMemberId: r.staffMemberId,
    isMasked: true,
    name: null,
    phone: null,
    store: r.store,
    employmentType: null,
    joinState: null,
    invitation: null,
    linkHold: null,
    contract: null,
    employmentStatus: null,
    retiredDate: null,
  };
}

/** 목 거르기. api 와 같은 규칙으로 거르고 쪽을 나눈다. */
export function queryStaff(query: StaffListQuery, records: readonly StaffRecord[]): StaffMemberListResponse {
  const store = query.store.trim();
  const keyword = query.keyword.trim();
  const digits = keyword.replace(/\D/g, "");
  const allTypes = query.employmentTypes.length === EMPLOYMENT_TYPES.length;
  const allGroups = query.joinGroups.length === JOIN_GROUPS.length;
  const states = new Set<StaffJoinState>(query.joinGroups.flatMap((g) => JOIN_GROUP_STATES[g]));
  // 가린 칸으로 거르면 건수가 그 값을 알려 준다 — api 처럼 가린 행을 뺀다. 재직 상태는 화면 기본 필터라 예외다.
  const filtersPersonal = keyword !== "" || !allTypes || !allGroups;

  const hits = records
    .filter((r) => {
      if (r.isMasked && filtersPersonal) return false;
      if (store && !r.store.name.includes(store)) return false;
      if (keyword && !(r.name?.includes(keyword) || (digits !== "" && r.phone?.includes(digits)))) return false;
      if (!allTypes && !(r.employmentType && query.employmentTypes.includes(r.employmentType))) return false;
      if (!allGroups && !(r.joinState && states.has(r.joinState))) return false;
      if (query.employmentStatus !== "ALL" && r.employmentStatus !== query.employmentStatus) return false;
      return true;
    })
    .sort((a, b) => b.staffMemberId - a.staffMemberId);

  const start = (query.page - 1) * query.pageSize;
  return {
    items: hits.slice(start, start + query.pageSize).map((r) => (r.isMasked ? masked(r) : r)),
    total: hits.length,
  };
}

/** 직원 목록. 지금은 목이다(관리자 로그인 전). */
export async function getStaffMembers(query: StaffListQuery): Promise<StaffMemberListResponse> {
  return queryStaff(query, buildMockStaff(kstToday()));
}
```

이 단계에서는 `staff-members.mock.ts` 가 없어 import 가 실패한다. Task 2 가 만든다 — 이 Task 의 테스트가 돌도록
**빈 목을 임시로 만든다**:

`src/lib/staff-members.mock.ts`:

```ts
import type { StaffRecord } from "./staff-members.ts";

export function buildMockStaff(_today: string): StaffRecord[] {
  return [];
}
```

- [ ] **Step 4: 통과하는지 본다**

Run: `node --test src/lib/staff-members.test.ts`
Expected: `# pass 14`, `# fail 0`

- [ ] **Step 5: 커밋한다**

```bash
pnpm lint
git add src/lib/staff-members.ts src/lib/staff-members.mock.ts src/lib/staff-members.test.ts
git commit -m "feat: 직원 목록 타입과 목 거르기 (WHALEERP-138)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 목 데이터 69건 (`buildMockStaff`)

**Files:**
- Modify: `src/lib/staff-members.mock.ts` (Task 1 의 빈 목을 바꾼다)
- Create: `src/lib/staff-members.mock.test.ts`

**Interfaces:**
- Consumes: `StaffRecord`, `queryStaff`, `EMPLOYMENT_TYPES`, `JOIN_GROUPS` (Task 1)
- Produces: `function buildMockStaff(today: string): StaffRecord[]` — 69건, 그중 퇴직 6 · 가린 행 7. 기본 필터(재직)로 63건 = 20건에 4쪽

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/lib/staff-members.mock.test.ts`:

```ts
// node --test src/lib/staff-members.mock.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMockStaff } from "./staff-members.mock.ts";
import { EMPLOYMENT_TYPES, JOIN_GROUPS, queryStaff, type StaffListQuery } from "./staff-members.ts";

const TODAY = "2026-10-12";
const rows = buildMockStaff(TODAY);
const base: StaffListQuery = {
  store: "",
  keyword: "",
  employmentTypes: [...EMPLOYMENT_TYPES],
  joinGroups: [...JOIN_GROUPS],
  employmentStatus: "EMPLOYED",
  page: 1,
  pageSize: 20,
};

test("69건, id 가 겹치지 않는다", () => {
  assert.equal(rows.length, 69);
  assert.equal(new Set(rows.map((r) => r.staffMemberId)).size, 69);
});

test("기본 필터(재직)는 데모처럼 63건, 20건에 4쪽", () => {
  const res = queryStaff(base, rows);
  assert.equal(res.total, 63);
  assert.equal(queryStaff({ ...base, page: 4 }, rows).items.length, 3);
});

test("첫 쪽은 데모의 순서 — 서지안부터", () => {
  const names = queryStaff(base, rows).items.slice(0, 4).map((i) => i.name);
  assert.deepEqual(names, ["서지안", "오세라", "문태경", "배정숙"]);
});

test("가맹 점포 직원은 모두 가린 행이고, 가린 행은 모두 가맹 점포다", () => {
  for (const r of rows) assert.equal(r.isMasked, r.store.storeType === "FRANCHISE", `id ${r.staffMemberId}`);
  assert.equal(rows.filter((r) => r.isMasked).length, 7);
});

test("데모의 상태 예가 모두 있다", () => {
  const states = new Set(rows.map((r) => r.joinState));
  for (const s of ["JOINED", "INVITED", "LINK_HOLD", "AFFILIATION_PENDING", "UNDER_AGE"] as const) assert.ok(states.has(s), s);
  const contracts = new Set(rows.map((r) => r.contract?.status));
  for (const s of ["PENDING_SEND", "PENDING_SIGNATURE", "SIGNED", "REJECTED", "ENDED"] as const) assert.ok(contracts.has(s), s);
});

test("날짜는 오늘을 기준으로 만든다 — 연결 보류 4일 전, 날인 기한 24일 뒤, 종료 20일 뒤", () => {
  const hold = rows.find((r) => r.joinState === "LINK_HOLD");
  assert.equal(hold?.linkHold?.heldAt.slice(0, 10), "2026-10-08");
  const signing = rows.find((r) => r.contract?.status === "PENDING_SIGNATURE");
  assert.equal(signing?.contract?.signDeadlineAt?.slice(0, 10), "2026-11-05");
  const renewal = rows.find((r) => r.name === "배정숙");
  assert.equal(renewal?.contract?.endDate, "2026-11-01");
});

test("번호는 숫자만 10~11자리", () => {
  for (const r of rows) if (r.phone !== null) assert.match(r.phone, /^\d{10,11}$/);
});
```

- [ ] **Step 2: 실패하는지 본다**

Run: `node --test src/lib/staff-members.mock.test.ts`
Expected: FAIL — `69건` 테스트가 `0 !== 69` 로 실패(빈 목).

- [ ] **Step 3: 구현한다**

`src/lib/staff-members.mock.ts` 를 바꾼다:

```ts
// 직원 목록 목 데이터. 데모(docs/demo/src/staff-sections.mjs)의 열두 줄을 api 응답 모양으로 옮기고, 가입 완료 직원으로
// 채워 기본 필터(재직)에서 데모와 같은 63건이 되게 했다. 보는 사람은 BP 마스터로 본다 — api 가 지금 가맹 점포 직원을
// 모두 가리므로 가맹 점포 직원은 모두 가린 행이다. 그래서 데모에서 가맹 점포(모리커피 연남점)에 있던 유하람 · 임채운은
// 직영 점포로 옮겨 그 표시 예를 잃지 않게 했다.
// 날짜는 오늘(한국)을 기준으로 만들어 「연결 보류 · 4일」, 「갱신 예정 D-20」 같은 표시가 늘 데모처럼 보인다.
import type { StaffRecord, StoreType } from "./staff-members.ts";

const STORES: Record<string, { storeId: number; name: string; storeType: StoreType }> = {
  seocho: { storeId: 1, name: "모리커피 서초점", storeType: "DIRECT" },
  seongsu: { storeId: 2, name: "모리커피 성수점", storeType: "DIRECT" },
  pangyo: { storeId: 3, name: "온기식당 판교점", storeType: "DIRECT" },
  gwanghwamun: { storeId: 4, name: "온기식당 광화문점", storeType: "DIRECT" },
  euljiro: { storeId: 5, name: "모리커피 을지로점", storeType: "FRANCHISE" },
  yeonnam: { storeId: 6, name: "모리커피 연남점", storeType: "FRANCHISE" },
  cheongdam: { storeId: 7, name: "모리커피 청담점", storeType: "FRANCHISE" },
  bupyeong: { storeId: 8, name: "모리커피 부평점", storeType: "FRANCHISE" },
  dunsan: { storeId: 9, name: "온기식당 둔산점", storeType: "FRANCHISE" },
  seomyeon: { storeId: 10, name: "온기식당 서면점", storeType: "FRANCHISE" },
  ilsan: { storeId: 11, name: "온기식당 일산점", storeType: "FRANCHISE" },
};
const DIRECT = [STORES.seocho, STORES.seongsu, STORES.pangyo, STORES.gwanghwamun];
const FRANCHISE = [STORES.euljiro, STORES.yeonnam, STORES.cheongdam, STORES.bupyeong, STORES.dunsan, STORES.seomyeon, STORES.ilsan];

const FILLER_NAMES = [
  "김하늘", "이도윤", "박서연", "최민준", "정하은", "강지호", "조수아", "윤시우", "장예린", "임도현",
  "한지민", "오준서", "서유나", "신재원", "권나연", "황민서", "안지후", "송다인", "전우진", "홍채원",
  "고은우", "문서진", "양하린", "손지환", "배수빈", "백건우", "허소율", "유태민", "남궁별", "노아린",
];

/** today 에서 n 일 뒤의 날짜(YYYY-MM-DD). */
function day(today: string, n: number): string {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
/** today 에서 n 일 뒤 한국 9시의 시각(ISO). */
const at = (today: string, n: number) => `${day(today, n)}T09:00:00+09:00`;

function staff(over: Partial<StaffRecord> & Pick<StaffRecord, "staffMemberId" | "name" | "phone" | "store">): StaffRecord {
  return {
    isMasked: false,
    employmentType: "PART_TIME",
    joinState: "JOINED",
    invitation: null,
    linkHold: null,
    contract: { contractId: over.staffMemberId, status: "SIGNED", signDeadlineAt: null, endDate: null },
      employmentStatus: "EMPLOYED",
    retiredDate: null,
    ...over,
  };
}

const pending = (id: number) => ({ contractId: id, status: "PENDING_SEND" as const, signDeadlineAt: null, endDate: null });

export function buildMockStaff(today: string): StaffRecord[] {
  // 데모의 열두 줄. id 를 가장 크게 주어 첫 쪽에 데모 순서대로 나온다.
  const demo: StaffRecord[] = [
    staff({ staffMemberId: 69, name: "서지안", phone: "01028417702", store: STORES.seocho, employmentType: "FULL_TIME" }),
    staff({ staffMemberId: 68, name: "오세라", phone: "01033924418", store: STORES.seocho, employmentType: "FULL_TIME" }),
    staff({ staffMemberId: 67, name: "문태경", phone: "01044712298", store: STORES.pangyo, employmentType: "FULL_TIME", retiredDate: day(today, 18) }),
    staff({
      staffMemberId: 66, name: "배정숙", phone: "01088203317", store: STORES.pangyo,
      contract: { contractId: 66, status: "SIGNED", signDeadlineAt: null, endDate: day(today, 20) },
    }),
    staff({
      staffMemberId: 65, name: "남도현", phone: "01090145563", store: STORES.seongsu, joinState: "INVITED", contract: pending(65),
      invitation: { invitationType: "SIGNUP", status: "SENT", lastSentAt: at(today, -12), expiresAt: at(today, 18) },
    }),
    staff({
      staffMemberId: 64, name: "하준서", phone: "01033924418", store: STORES.seongsu, joinState: "LINK_HOLD", contract: pending(64),
      invitation: { invitationType: "SIGNUP", status: "ACCEPTED", lastSentAt: at(today, -6), expiresAt: at(today, 24) },
      linkHold: { linkHoldId: 1, mismatchReason: "PHONE_MISMATCH", verifiedPhoneLast4: "4418", heldAt: at(today, -4) },
    }),
    staff({
      staffMemberId: 63, name: "정유담", phone: "01055187734", store: STORES.pangyo, joinState: "AFFILIATION_PENDING", contract: pending(63),
      invitation: { invitationType: "AFFILIATION_CONFIRM", status: "SENT", lastSentAt: at(today, -2), expiresAt: at(today, 28) },
    }),
    staff({
      staffMemberId: 62, name: "권도윤", phone: "01077421160", store: STORES.seocho,
      contract: { contractId: 62, status: "PENDING_SIGNATURE", signDeadlineAt: at(today, 24), endDate: null },
    }),
    staff({
      staffMemberId: 61, name: "유하람", phone: "01020938875", store: STORES.seongsu,
      contract: { contractId: 61, status: "REJECTED", signDeadlineAt: null, endDate: null },
    }),
    staff({ staffMemberId: 60, name: "이민서", phone: "01046602231", store: STORES.yeonnam, isMasked: true }),
    staff({
      staffMemberId: 59, name: "민세하", phone: "01077253390", store: STORES.seongsu, joinState: "UNDER_AGE", contract: pending(59),
      invitation: { invitationType: "SIGNUP", status: "REJECTED_UNDER_AGE", lastSentAt: at(today, -9), expiresAt: at(today, 21) },
    }),
    staff({
      staffMemberId: 58, name: "임채운", phone: "01066130284", store: STORES.gwanghwamun, employmentStatus: "RETIRED", retiredDate: day(today, -73),
      contract: { contractId: 58, status: "ENDED", signDeadlineAt: null, endDate: day(today, -73) },
    }),
  ];

  // 나머지 57건: 앞의 6건은 가맹 점포(가린 행), 9의 배수 번째 5건은 퇴직.
  const fillers = Array.from({ length: 57 }, (_, i): StaffRecord => {
    const franchise = i < 6;
    const retired = i > 0 && i % 9 === 0 && i <= 45;
    return staff({
      staffMemberId: 57 - i,
      name: FILLER_NAMES[i % FILLER_NAMES.length],
      phone: `010${String(30000000 + i * 104729).padStart(8, "0")}`,
      store: franchise ? FRANCHISE[i % FRANCHISE.length] : DIRECT[i % DIRECT.length],
      isMasked: franchise,
      employmentType: i % 3 === 0 ? "FULL_TIME" : "PART_TIME",
      employmentStatus: retired ? "RETIRED" : "EMPLOYED",
      retiredDate: retired ? day(today, -30 - i) : null,
      contract: retired
        ? { contractId: 57 - i, status: "ENDED", signDeadlineAt: null, endDate: day(today, -30 - i) }
        : { contractId: 57 - i, status: "SIGNED", signDeadlineAt: null, endDate: null },
    });
  });

  return [...demo, ...fillers];
}
```

- [ ] **Step 4: 통과하는지 본다**

Run: `node --test src/lib/staff-members.mock.test.ts src/lib/staff-members.test.ts`
Expected: `# fail 0`, pass 7 + 14 = 21.

- [ ] **Step 5: 커밋한다**

```bash
pnpm lint
git add src/lib/staff-members.mock.ts src/lib/staff-members.mock.test.ts
git commit -m "feat: 직원 목록 목 데이터 (WHALEERP-138)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: URL ↔ 쿼리 (`staff-list-query.ts`)

**Files:**
- Create: `src/app/staff-members/staff-list-query.ts`
- Create: `src/app/staff-members/staff-list-query.test.ts`

**Interfaces:**
- Consumes: `StaffListQuery`, `EMPLOYMENT_TYPES`, `JOIN_GROUPS`, `PAGE_SIZES`, 타입들 (Task 1)
- Produces:
  - `const DEFAULT_STAFF_LIST_QUERY: StaffListQuery`
  - `function parseStaffListQuery(raw: Record<string, string | string[] | undefined>): StaffListQuery`
  - `function toStaffListSearch(query: StaffListQuery): string` — `""` 또는 `"?..."`
  - `function withFilter(query: StaffListQuery, next: Partial<StaffListQuery>): StaffListQuery` — 바꾸고 `page` 를 1 로

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/app/staff-members/staff-list-query.test.ts`:

```ts
// node --test src/app/staff-members/staff-list-query.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_STAFF_LIST_QUERY, parseStaffListQuery, toStaffListSearch, withFilter } from "./staff-list-query.ts";

test("빈 URL 은 기본값 — 재직, 모든 체크, 1쪽, 20건", () => {
  assert.deepEqual(parseStaffListQuery({}), DEFAULT_STAFF_LIST_QUERY);
  assert.equal(DEFAULT_STAFF_LIST_QUERY.employmentStatus, "EMPLOYED");
  assert.equal(DEFAULT_STAFF_LIST_QUERY.pageSize, 20);
});

test("기본값은 URL 에서 빠진다", () => {
  assert.equal(toStaffListSearch(DEFAULT_STAFF_LIST_QUERY), "");
});

test("고른 값만 URL 에 남는다", () => {
  const search = toStaffListSearch({
    ...DEFAULT_STAFF_LIST_QUERY,
    keyword: "서지안",
    joinGroups: ["LINK_HOLD", "JOINED"],
    employmentStatus: "ALL",
    page: 2,
    pageSize: 50,
  });
  const params = new URLSearchParams(search);
  assert.equal(params.get("keyword"), "서지안");
  assert.equal(params.get("joinGroup"), "JOINED,LINK_HOLD"); // 화면 순서로 정렬
  assert.equal(params.get("employmentStatus"), "ALL");
  assert.equal(params.get("page"), "2");
  assert.equal(params.get("pageSize"), "50");
  assert.equal(params.has("employmentType"), false);
});

test("체크를 모두 끄면 빈 값으로 남는다 — 새로고침해도 0건 조건", () => {
  const q = { ...DEFAULT_STAFF_LIST_QUERY, joinGroups: [] };
  const search = toStaffListSearch(q);
  assert.equal(search, "?joinGroup=");
  assert.deepEqual(parseStaffListQuery({ joinGroup: "" }).joinGroups, []);
});

test("모르는 묶음은 버리고 아는 것만 남긴다", () => {
  assert.deepEqual(parseStaffListQuery({ joinGroup: "NOPE,LINK_HOLD" }).joinGroups, ["LINK_HOLD"]);
});

test("이상한 값은 그 칸만 기본값", () => {
  const q = parseStaffListQuery({ page: "0", pageSize: "7", employmentStatus: "SOMETIMES", keyword: "오세라" });
  assert.equal(q.page, 1);
  assert.equal(q.pageSize, 20);
  assert.equal(q.employmentStatus, "EMPLOYED");
  assert.equal(q.keyword, "오세라");
  assert.equal(parseStaffListQuery({ page: "2.5" }).page, 1);
  assert.equal(parseStaffListQuery({ page: "abc" }).page, 1);
});

test("같은 이름이 여럿이면 첫 값", () => {
  assert.equal(parseStaffListQuery({ store: ["서초", "판교"] }).store, "서초");
});

test("검색어는 앞뒤 공백을 지운다", () => {
  assert.equal(parseStaffListQuery({ keyword: "  서지안 " }).keyword, "서지안");
});

test("parse(toSearch(q)) 는 q", () => {
  const q = {
    ...DEFAULT_STAFF_LIST_QUERY,
    store: "판교",
    employmentTypes: ["PART_TIME" as const],
    joinGroups: ["INVITED" as const, "UNDER_AGE" as const],
    employmentStatus: "RETIRED" as const,
    page: 3,
    pageSize: 100 as const,
  };
  const params = Object.fromEntries(new URLSearchParams(toStaffListSearch(q)));
  assert.deepEqual(parseStaffListQuery(params), q);
});

test("필터를 바꾸면 page 를 지운다 — 4쪽에서 거르면 빈 쪽이 보이지 않게", () => {
  const q = withFilter({ ...DEFAULT_STAFF_LIST_QUERY, page: 4 }, { keyword: "서지안" });
  assert.equal(q.page, 1);
  assert.equal(q.keyword, "서지안");
});
```

- [ ] **Step 2: 실패하는지 본다**

Run: `node --test src/app/staff-members/staff-list-query.test.ts`
Expected: FAIL — `Cannot find module '.../staff-list-query.ts'`

- [ ] **Step 3: 구현한다**

`src/app/staff-members/staff-list-query.ts`:

```ts
// 직원 목록 URL 쿼리 ↔ 쿼리 객체. 화면 상태는 URL 에만 둔다 — 새로고침 · 뒤로 가기 · 링크 공유에도 같은 목록이다.
// 기본값은 URL 에서 빼고, 이상한 값은 오류 없이 그 칸의 기본값으로 돌린다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import {
  EMPLOYMENT_TYPES,
  JOIN_GROUPS,
  PAGE_SIZES,
  type EmploymentStatusFilter,
  type StaffListQuery,
} from "../../lib/staff-members.ts";

type RawSearch = Record<string, string | string[] | undefined>;

export const DEFAULT_STAFF_LIST_QUERY: StaffListQuery = {
  store: "",
  keyword: "",
  employmentTypes: [...EMPLOYMENT_TYPES],
  joinGroups: [...JOIN_GROUPS],
  employmentStatus: "EMPLOYED",
  page: 1,
  pageSize: 20,
};

const STATUS_FILTERS: readonly EmploymentStatusFilter[] = ["EMPLOYED", "RETIRED", "ALL"];

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** 쉼표 목록. 파라미터가 없으면 전부, 빈 값이면 하나도 고르지 않은 것. 순서는 화면 순서로 맞춘다. */
function listOf<T extends string>(raw: string | undefined, allowed: readonly T[]): T[] {
  if (raw === undefined) return [...allowed];
  const picked = new Set(raw.split(","));
  return allowed.filter((a) => picked.has(a));
}

export function parseStaffListQuery(raw: RawSearch): StaffListQuery {
  const page = Number(first(raw.page));
  const pageSize = Number(first(raw.pageSize));
  const status = first(raw.employmentStatus);
  return {
    store: first(raw.store)?.trim() ?? "",
    keyword: first(raw.keyword)?.trim() ?? "",
    employmentTypes: listOf(first(raw.employmentType), EMPLOYMENT_TYPES),
    joinGroups: listOf(first(raw.joinGroup), JOIN_GROUPS),
    employmentStatus: STATUS_FILTERS.find((s) => s === status) ?? DEFAULT_STAFF_LIST_QUERY.employmentStatus,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    pageSize: PAGE_SIZES.find((s) => s === pageSize) ?? DEFAULT_STAFF_LIST_QUERY.pageSize,
  };
}

export function toStaffListSearch(query: StaffListQuery): string {
  const params = new URLSearchParams();
  if (query.store) params.set("store", query.store);
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.employmentTypes.length !== EMPLOYMENT_TYPES.length)
    params.set("employmentType", EMPLOYMENT_TYPES.filter((t) => query.employmentTypes.includes(t)).join(","));
  if (query.joinGroups.length !== JOIN_GROUPS.length)
    params.set("joinGroup", JOIN_GROUPS.filter((g) => query.joinGroups.includes(g)).join(","));
  if (query.employmentStatus !== DEFAULT_STAFF_LIST_QUERY.employmentStatus) params.set("employmentStatus", query.employmentStatus);
  if (query.page !== 1) params.set("page", String(query.page));
  if (query.pageSize !== DEFAULT_STAFF_LIST_QUERY.pageSize) params.set("pageSize", String(query.pageSize));
  const search = params.toString();
  return search ? `?${search}` : "";
}

/** 필터 · 건수를 바꾼다. 쪽은 1로 돌린다 — 4쪽에서 거르면 빈 쪽이 보인다. */
export function withFilter(query: StaffListQuery, next: Partial<StaffListQuery>): StaffListQuery {
  return { ...query, ...next, page: 1 };
}
```

- [ ] **Step 4: 통과하는지 본다**

Run: `node --test src/app/staff-members/staff-list-query.test.ts`
Expected: `# pass 10`, `# fail 0`

- [ ] **Step 5: 커밋한다**

```bash
pnpm lint
git add src/app/staff-members/staff-list-query.ts src/app/staff-members/staff-list-query.test.ts
git commit -m "feat: 직원 목록 URL 쿼리 해석 (WHALEERP-138)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 한 줄 표시 (`staff-row.ts`)

**Files:**
- Create: `src/app/staff-members/staff-row.ts`
- Create: `src/app/staff-members/staff-row.test.ts`

**Interfaces:**
- Consumes: `StaffMemberListItem`, `EmploymentType`, `JoinGroup` (Task 1)
- Produces:
  - `type CellStyle = "badge-on" | "badge-off" | "badge-neutral" | "mark-on" | "mark-off" | "muted"`
  - `interface Cell { text: string; style: CellStyle }`
  - `EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string>`, `JOIN_GROUP_LABELS: Record<JoinGroup, string>`
  - `formatPhone(phone: string): string`
  - `joinCell(item: StaffMemberListItem, today: string): Cell`
  - `contractCell(item: StaffMemberListItem, today: string): Cell | null` — null 이면 `-`
  - `statusCells(item: StaffMemberListItem): Cell[]`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/app/staff-members/staff-row.test.ts`:

```ts
// node --test src/app/staff-members/staff-row.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { StaffMemberListItem } from "../../lib/staff-members.ts";
import { contractCell, formatPhone, joinCell, statusCells } from "./staff-row.ts";

const TODAY = "2026-10-12";
const item = (over: Partial<StaffMemberListItem> = {}): StaffMemberListItem => ({
  staffMemberId: 1,
  isMasked: false,
  name: "서지안",
  phone: "01028417702",
  store: { storeId: 1, name: "모리커피 서초점", storeType: "DIRECT" },
  employmentType: "FULL_TIME",
  joinState: "JOINED",
  invitation: null,
  linkHold: null,
  contract: { contractId: 1, status: "SIGNED", signDeadlineAt: null, endDate: null },
  employmentStatus: "EMPLOYED",
  retiredDate: null,
  ...over,
});
const contract = (status: NonNullable<StaffMemberListItem["contract"]>["status"], over = {}) => ({
  contract: { contractId: 1, status, signDeadlineAt: null, endDate: null, ...over },
});

test("번호는 3-4-4, 10자리는 3-3-4", () => {
  assert.equal(formatPhone("01028417702"), "010-2841-7702");
  assert.equal(formatPhone("0212345678"), "021-234-5678");
  assert.equal(formatPhone("12345"), "12345");
});

test("가입·인증 — 가입 완료 · 초대 발송 · 연결 보류", () => {
  assert.deepEqual(joinCell(item(), TODAY), { text: "가입 완료", style: "badge-on" });
  assert.deepEqual(
    joinCell(item({ joinState: "INVITED", invitation: { invitationType: "SIGNUP", status: "SENT", lastSentAt: "2026-08-31T09:12:00+09:00", expiresAt: "2026-09-30T09:12:00+09:00" } }), TODAY),
    { text: "초대 발송 · 08-31", style: "badge-off" },
  );
  assert.deepEqual(
    joinCell(item({ joinState: "LINK_HOLD", linkHold: { linkHoldId: 1, mismatchReason: "PHONE_MISMATCH", verifiedPhoneLast4: "4418", heldAt: "2026-10-08T09:00:00+09:00" } }), TODAY),
    { text: "연결 보류 · 4일", style: "badge-off" },
  );
});

test("가입·인증 — 초대 발송일은 한국 날짜다(UTC 로 전날이어도)", () => {
  const cell = joinCell(item({ joinState: "INVITED", invitation: { invitationType: "SIGNUP", status: "SENT", lastSentAt: "2026-08-30T15:30:00Z", expiresAt: "2026-09-29T15:30:00Z" } }), TODAY);
  assert.equal(cell.text, "초대 발송 · 08-31");
});

test("가입·인증 — 나머지 상태", () => {
  const cases: [StaffMemberListItem["joinState"], string, string][] = [
    ["EXPIRED", "초대 만료", "badge-off"],
    ["REJECTED", "거절", "badge-off"],
    ["AFFILIATION_PENDING", "소속 추가 확인", "badge-on"],
    ["RETURN_PENDING", "복귀 확인", "badge-on"],
    ["UNDER_AGE", "가입 불가(만 19세 미만)", "badge-off"],
    ["DRAFT", "초안", "badge-neutral"],
  ];
  for (const [joinState, text, style] of cases) assert.deepEqual(joinCell(item({ joinState }), TODAY), { text, style });
});

test("가입·인증 — 퇴직한 가입 완료는 회색", () => {
  assert.deepEqual(joinCell(item({ employmentStatus: "RETIRED" }), TODAY), { text: "가입 완료", style: "badge-neutral" });
});

test("계약 — 상태별 표시", () => {
  assert.equal(contractCell(item({ contract: null }), TODAY), null);
  assert.deepEqual(contractCell(item(contract("PENDING_SEND")), TODAY), { text: "발송 대기", style: "badge-neutral" });
  assert.deepEqual(contractCell(item(contract("SIGNED")), TODAY), { text: "체결 완료", style: "badge-on" });
  assert.deepEqual(contractCell(item(contract("REJECTED")), TODAY), { text: "거부", style: "badge-off" });
  assert.deepEqual(contractCell(item(contract("EXPIRED")), TODAY), { text: "만료", style: "badge-off" });
  assert.deepEqual(contractCell(item(contract("ENDED")), TODAY), { text: "종료", style: "badge-neutral" });
});

test("계약 — 서명 대기 D-day 는 한국 날짜로", () => {
  assert.deepEqual(
    contractCell(item(contract("PENDING_SIGNATURE", { signDeadlineAt: "2026-11-05T09:00:00+09:00" })), TODAY),
    { text: "서명 대기 · D-24", style: "badge-off" },
  );
});

test("오늘이 기한이면 D-0", () => {
  assert.equal(contractCell(item(contract("PENDING_SIGNATURE", { signDeadlineAt: "2026-10-12T23:00:00+09:00" })), TODAY)?.text, "서명 대기 · D-0");
  assert.equal(contractCell(item(contract("SIGNED", { endDate: TODAY })), TODAY)?.text, "갱신 예정 D-0");
});

test("계약 — 종료일 30일 안이면 갱신 예정, 31일이면 체결 완료", () => {
  assert.deepEqual(contractCell(item(contract("SIGNED", { endDate: "2026-11-01" })), TODAY), { text: "갱신 예정 D-20", style: "badge-off" });
  assert.equal(contractCell(item(contract("SIGNED", { endDate: "2026-11-11" })), TODAY)?.text, "갱신 예정 D-30");
  assert.equal(contractCell(item(contract("SIGNED", { endDate: "2026-11-12" })), TODAY)?.text, "체결 완료");
});

test("종료일이 지났으면 체결 완료", () => {
  assert.equal(contractCell(item(contract("SIGNED", { endDate: "2026-10-11" })), TODAY)?.text, "체결 완료");
});

test("재직 칸 — 위에서부터 처음 맞는 것", () => {
  const cases: [Partial<StaffMemberListItem>, { text: string; style: string }[]][] = [
    [{ employmentStatus: "RETIRED", retiredDate: "2026-07-31" }, [{ text: "퇴직 07-31", style: "muted" }]],
    [{ joinState: "LINK_HOLD" }, [{ text: "확인 필요", style: "mark-off" }]],
    [{ joinState: "UNDER_AGE" }, [{ text: "삭제 대상", style: "mark-off" }]],
    [{ joinState: "AFFILIATION_PENDING" }, [{ text: "응답 대기", style: "muted" }]],
    [{ joinState: "RETURN_PENDING" }, [{ text: "응답 대기", style: "muted" }]],
    [{ joinState: "INVITED" }, [{ text: "가입 대기", style: "muted" }]],
    [contract("PENDING_SIGNATURE"), [{ text: "날인 대기", style: "mark-off" }]],
    [contract("REJECTED"), [{ text: "재발송 필요", style: "mark-off" }]],
    [contract("EXPIRED"), [{ text: "재발송 필요", style: "mark-off" }]],
    [{}, [{ text: "재직", style: "mark-on" }]],
    [{ retiredDate: "2026-10-30" }, [{ text: "재직", style: "mark-on" }, { text: "퇴직 예정 10-30", style: "badge-off" }]],
  ];
  for (const [over, expected] of cases) assert.deepEqual(statusCells(item(over)), expected, JSON.stringify(over));
});
```

- [ ] **Step 2: 실패하는지 본다**

Run: `node --test src/app/staff-members/staff-row.test.ts`
Expected: FAIL — `Cannot find module '.../staff-row.ts'`

- [ ] **Step 3: 구현한다**

`src/app/staff-members/staff-row.ts`:

```ts
// 직원 목록 한 줄을 화면 문구와 모양으로 바꾼다. 색과 문구는 데모(docs/demo/src/staff-sections.mjs)를 따른다.
// 라벨은 목 단계라 여기 한 곳에 둔다 — api 를 붙일 때 getEnum 으로 바꾼다.
// 날짜는 모두 한국 날짜로 견준다. today 는 kstToday() 값(YYYY-MM-DD)을 받는다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { EmploymentType, JoinGroup, StaffMemberListItem } from "../../lib/staff-members.ts";

export type CellStyle = "badge-on" | "badge-off" | "badge-neutral" | "mark-on" | "mark-off" | "muted";
export interface Cell {
  text: string;
  style: CellStyle;
}

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = { FULL_TIME: "정직원", PART_TIME: "파트타이머" };
export const JOIN_GROUP_LABELS: Record<JoinGroup, string> = {
  JOINED: "가입 완료",
  INVITED: "초대 발송",
  LINK_HOLD: "연결 보류",
  AFFILIATION: "소속 추가 확인",
  UNDER_AGE: "가입 불가",
};

/** 갱신 예정으로 보이는 종료일까지의 날수. 갱신 예정 알림과 같다(okf/notify.md, S-JUWPXF). */
const RENEWAL_NOTICE_DAYS = 30;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 시각(ISO)이나 날짜(YYYY-MM-DD)를 한국 날짜로. */
function kstDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date(Date.parse(value) + KST_OFFSET_MS).toISOString().slice(0, 10);
}
/** from 에서 to 까지의 날수(같은 날이면 0). */
function dayDiff(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}
const mmdd = (date: string) => date.slice(5);

export function formatPhone(phone: string): string {
  if (/^\d{11}$/.test(phone)) return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
  if (/^\d{10}$/.test(phone)) return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
  return phone;
}

export function joinCell(item: StaffMemberListItem, today: string): Cell {
  switch (item.joinState) {
    case "JOINED":
      return { text: "가입 완료", style: item.employmentStatus === "RETIRED" ? "badge-neutral" : "badge-on" };
    case "INVITED":
      return {
        text: item.invitation ? `초대 발송 · ${mmdd(kstDate(item.invitation.lastSentAt))}` : "초대 발송",
        style: "badge-off",
      };
    case "EXPIRED":
      return { text: "초대 만료", style: "badge-off" };
    case "REJECTED":
      return { text: "거절", style: "badge-off" };
    case "LINK_HOLD":
      return {
        text: item.linkHold ? `연결 보류 · ${dayDiff(kstDate(item.linkHold.heldAt), today)}일` : "연결 보류",
        style: "badge-off",
      };
    case "AFFILIATION_PENDING":
      return { text: "소속 추가 확인", style: "badge-on" };
    case "RETURN_PENDING":
      return { text: "복귀 확인", style: "badge-on" };
    case "UNDER_AGE":
      return { text: "가입 불가(만 19세 미만)", style: "badge-off" };
    default:
      return { text: "초안", style: "badge-neutral" };
  }
}

export function contractCell(item: StaffMemberListItem, today: string): Cell | null {
  const c = item.contract;
  if (!c || !c.status) return null;
  switch (c.status) {
    case "PENDING_SEND":
      return { text: "발송 대기", style: "badge-neutral" };
    case "PENDING_SIGNATURE":
      return {
        text: c.signDeadlineAt ? `서명 대기 · D-${dayDiff(today, kstDate(c.signDeadlineAt))}` : "서명 대기",
        style: "badge-off",
      };
    case "SIGNED": {
      const left = c.endDate ? dayDiff(today, c.endDate) : null;
      // 종료일이 지난 체결 완료는 종료 배치 전의 잠깐이다. 갱신 예정이 아니다.
      return left !== null && left >= 0 && left <= RENEWAL_NOTICE_DAYS
        ? { text: `갱신 예정 D-${left}`, style: "badge-off" }
        : { text: "체결 완료", style: "badge-on" };
    }
    case "REJECTED":
      // api 가 거부일을 주지 않아 데모의 「· 09-02」는 붙이지 않는다.
      return { text: "거부", style: "badge-off" };
    case "EXPIRED":
      return { text: "만료", style: "badge-off" };
    case "ENDED":
      return { text: "종료", style: "badge-neutral" };
  }
}

/** 재직 칸. 가입 · 계약 · 재직 상태를 한눈에 보는 요약이다(데모). 위에서부터 처음 맞는 것. */
export function statusCells(item: StaffMemberListItem): Cell[] {
  if (item.employmentStatus === "RETIRED")
    return [{ text: item.retiredDate ? `퇴직 ${mmdd(item.retiredDate)}` : "퇴직", style: "muted" }];
  if (item.joinState === "LINK_HOLD") return [{ text: "확인 필요", style: "mark-off" }];
  if (item.joinState === "UNDER_AGE") return [{ text: "삭제 대상", style: "mark-off" }];
  if (item.joinState === "AFFILIATION_PENDING" || item.joinState === "RETURN_PENDING")
    return [{ text: "응답 대기", style: "muted" }];
  if (item.joinState !== "JOINED") return [{ text: "가입 대기", style: "muted" }];
  const status = item.contract?.status;
  if (status === "PENDING_SIGNATURE") return [{ text: "날인 대기", style: "mark-off" }];
  if (status === "REJECTED" || status === "EXPIRED") return [{ text: "재발송 필요", style: "mark-off" }];
  const cells: Cell[] = [{ text: "재직", style: "mark-on" }];
  if (item.retiredDate) cells.push({ text: `퇴직 예정 ${mmdd(item.retiredDate)}`, style: "badge-off" });
  return cells;
}
```

- [ ] **Step 4: 통과하는지 본다**

Run: `node --test src/app/staff-members/staff-row.test.ts`
Expected: `# pass 11`, `# fail 0`

- [ ] **Step 5: 커밋한다**

```bash
pnpm lint
git add src/app/staff-members/staff-row.ts src/app/staff-members/staff-row.test.ts
git commit -m "feat: 직원 목록 한 줄 표시 규칙 (WHALEERP-138)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 화면 (`/staff-members`)

**Files:**
- Create: `src/app/staff-members/staff-table.tsx`
- Create: `src/app/staff-members/staff-filter.tsx`
- Create: `src/app/staff-members/staff-list-controls.tsx`
- Create: `src/app/staff-members/page.tsx`

**Interfaces:**
- Consumes: `getStaffMembers`, `kstToday`, `EMPLOYMENT_TYPES`, `JOIN_GROUPS`, `PAGE_SIZES`, `StaffListQuery`, `StaffMemberListItem` (Task 1) · `parseStaffListQuery`, `toStaffListSearch`, `withFilter` (Task 3) · `joinCell`, `contractCell`, `statusCells`, `formatPhone`, `EMPLOYMENT_TYPE_LABELS`, `JOIN_GROUP_LABELS`, `Cell` (Task 4)
- Produces: 경로 `/staff-members`

이 Task 는 화면 조립이라 단위 테스트가 없다(이 저장소에 컴포넌트 테스트 도구가 없다). 검증은 `pnpm build` 와 개발 서버에서
HTML 을 확인하는 것으로 한다(Step 6).

- [ ] **Step 1: 표를 쓴다**

`src/app/staff-members/staff-table.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, DataTable, type Column } from "@/components/common";
import type { StaffMemberListItem } from "@/lib/staff-members";
import { contractCell, EMPLOYMENT_TYPE_LABELS, formatPhone, joinCell, statusCells, type Cell } from "./staff-row";

// 데모 staff-parts.mjs 의 회색 배지(quiet). 공통 Badge 에는 on · off 두 가지뿐이다.
const NEUTRAL = "inline-block rounded-[2px] px-[4px] py-[2px] text-center text-[14px] font-medium bg-erp-subtle text-erp-ink whitespace-nowrap";
const DASH = "-";

function CellView({ cell }: { cell: Cell }) {
  switch (cell.style) {
    case "badge-on":
      return <Badge tone="on">{cell.text}</Badge>;
    case "badge-off":
      return <Badge tone="off">{cell.text}</Badge>;
    case "badge-neutral":
      return <span className={NEUTRAL}>{cell.text}</span>;
    case "mark-on":
      return <span className="text-erp-on">{cell.text}</span>;
    case "mark-off":
      return <span className="text-erp-off">{cell.text}</span>;
    case "muted":
      return <span className="text-erp-muted">{cell.text}</span>;
  }
}

type Row = { no: number; item: StaffMemberListItem };
// 가린 행은 점포만 보이고 나머지는 「-」다. 각 칸이 같은 판단을 하지 않도록 여기서 한 번 가른다.
const personal = (render: (item: StaffMemberListItem) => ReactNode) => (r: Row) => (r.item.isMasked ? DASH : render(r.item));

export function StaffTable({ items, startNo, today }: { items: StaffMemberListItem[]; startNo: number; today: string }) {
  const columns: Column<Row>[] = [
    { header: "순번", width: "w-[60px]", cell: (r) => r.no },
    {
      header: "직원",
      width: "w-[110px]",
      cell: ({ item }) =>
        item.isMasked ? (
          <span className="text-erp-muted">본사 제공 동의 없음</span>
        ) : item.joinState === "JOINED" && item.employmentStatus === "EMPLOYED" ? (
          <Link href={`/staff-members/${item.staffMemberId}`} className="text-erp-link hover:underline">
            {item.name}
          </Link>
        ) : (
          item.name
        ),
    },
    { header: "휴대전화번호", width: "w-[140px]", cell: personal((item) => (item.phone ? formatPhone(item.phone) : DASH)) },
    { header: "점포", cell: (r) => r.item.store.name },
    { header: "고용형태", width: "w-[110px]", cell: personal((item) => (item.employmentType ? EMPLOYMENT_TYPE_LABELS[item.employmentType] : DASH)) },
    { header: "가입·인증", width: "w-[210px]", cell: personal((item) => <CellView cell={joinCell(item, today)} />) },
    {
      header: "계약 상태",
      width: "w-[160px]",
      cell: personal((item) => {
        const cell = contractCell(item, today);
        return cell ? <CellView cell={cell} /> : DASH;
      }),
    },
    {
      header: "재직",
      width: "w-[110px]",
      cell: personal((item) => (
        <span className="inline-flex flex-wrap items-center justify-center gap-[4px]">
          {statusCells(item).map((cell) => (
            <CellView key={cell.text} cell={cell} />
          ))}
        </span>
      )),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={items.map((item, i) => ({ no: startNo + i, item }))}
      rowKey={(r) => r.item.staffMemberId}
      empty="조회된 직원이 없습니다."
    />
  );
}
```

- [ ] **Step 2: 필터를 쓴다**

`src/app/staff-members/staff-filter.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Checkbox, FilterPanel, FilterSection, SearchField, Select } from "@/components/common";
import { EMPLOYMENT_TYPES, JOIN_GROUPS, type EmploymentStatusFilter, type StaffListQuery } from "@/lib/staff-members";
import { toStaffListSearch, withFilter } from "./staff-list-query";
import { EMPLOYMENT_TYPE_LABELS, JOIN_GROUP_LABELS } from "./staff-row";

const toggle = <T,>(list: readonly T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

// 직원 목록 왼쪽 필터. 값은 URL 에만 둔다 — 바꾸면 URL 을 바꾸고 서버가 목록을 다시 그린다.
// 검색칸은 Enter 나 돋보기를 눌렀을 때 반영한다. key 에 URL 값을 넣어 초기화 · 뒤로 가기 때 칸도 따라 바뀌게 한다.
export function StaffFilter({ query }: { query: StaffListQuery }) {
  const router = useRouter();
  const go = (next: Partial<StaffListQuery>) =>
    router.replace(`/staff-members${toStaffListSearch(withFilter(query, next))}`, { scroll: false });

  return (
    <FilterPanel onReset={() => router.replace("/staff-members", { scroll: false })}>
      <FilterSection label="점포" tight>
        <SearchField
          key={`store-${query.store}`}
          defaultValue={query.store}
          placeholder="점포명"
          aria-label="점포"
          onSearch={(value) => go({ store: value.trim() })}
        />
      </FilterSection>
      <FilterSection label="이름·휴대전화번호" tight>
        <SearchField
          key={`keyword-${query.keyword}`}
          defaultValue={query.keyword}
          placeholder="이름 또는 번호"
          aria-label="이름·휴대전화번호"
          onSearch={(value) => go({ keyword: value.trim() })}
        />
      </FilterSection>
      <FilterSection label="고용형태">
        {EMPLOYMENT_TYPES.map((type) => (
          <Checkbox
            key={type}
            label={EMPLOYMENT_TYPE_LABELS[type]}
            checked={query.employmentTypes.includes(type)}
            onChange={() => go({ employmentTypes: toggle(query.employmentTypes, type) })}
          />
        ))}
      </FilterSection>
      <FilterSection label="가입·인증">
        {JOIN_GROUPS.map((group) => (
          <Checkbox
            key={group}
            label={JOIN_GROUP_LABELS[group]}
            checked={query.joinGroups.includes(group)}
            onChange={() => go({ joinGroups: toggle(query.joinGroups, group) })}
          />
        ))}
      </FilterSection>
      <FilterSection label="재직 상태" tight last>
        <Select
          aria-label="재직 상태"
          value={query.employmentStatus}
          onChange={(e) => go({ employmentStatus: e.target.value as EmploymentStatusFilter })}
        >
          <option value="EMPLOYED">재직</option>
          <option value="RETIRED">퇴직</option>
          <option value="ALL">전체</option>
        </Select>
      </FilterSection>
    </FilterPanel>
  );
}
```

- [ ] **Step 3: 건수 · 쪽 조작을 쓴다**

`src/app/staff-members/staff-list-controls.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Pagination, Select } from "@/components/common";
import { PAGE_SIZES, type PageSize, type StaffListQuery } from "@/lib/staff-members";
import { toStaffListSearch, withFilter } from "./staff-list-query";

// 페이지당 건수. 바꾸면 1쪽으로 돌아간다.
export function StaffPageSize({ query }: { query: StaffListQuery }) {
  const router = useRouter();
  return (
    <div className="w-[80px] shrink-0">
      <Select
        aria-label="페이지당 건수"
        value={String(query.pageSize)}
        onChange={(e) =>
          router.replace(`/staff-members${toStaffListSearch(withFilter(query, { pageSize: Number(e.target.value) as PageSize }))}`, {
            scroll: false,
          })
        }
      >
        {PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function StaffPagination({ query, totalPages }: { query: StaffListQuery; totalPages: number }) {
  const router = useRouter();
  return (
    <Pagination
      page={query.page}
      totalPages={totalPages}
      onPageChange={(page) => router.replace(`/staff-members${toStaffListSearch({ ...query, page })}`)}
    />
  );
}
```

- [ ] **Step 4: 페이지를 쓴다**

`src/app/staff-members/page.tsx`:

```tsx
import { AlarmLink, Button, GlobalHeader, ListToolbar, PageBar, ServiceLinks, StoreSelect, UserPop } from "@/components/common";
import { getStaffMembers, kstToday } from "@/lib/staff-members";
// 헤더 메뉴 · 사용자 메뉴는 아직 디자인 견본의 값뿐이다. 1팀 관리자 로그인 · 메뉴 권한이 생기면 그 값으로 바꾼다.
import { MENUS, STORES, USER_ITEMS } from "../design/sample";
import { StaffFilter } from "./staff-filter";
import { StaffPageSize, StaffPagination } from "./staff-list-controls";
import { parseStaffListQuery } from "./staff-list-query";
import { StaffTable } from "./staff-table";

// 직원 정보 관리 목록(WHALEERP-138). 데모 docs/demo/staff/index.html 을 공통 컴포넌트로 옮겼다.
// 관리자 로그인이 생기기 전이라 데이터는 목이다(getStaffMembers). 화면 상태는 URL 에만 둔다.
// 화면 높이에 맞춰 두고 넘치는 내용은 필터와 목록 안에서만 스크롤한다(디자인 견본 design/full 과 같은 틀).
export default async function StaffMembersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseStaffListQuery(await searchParams);
  const { items, total } = await getStaffMembers(query);
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  return (
    <div className="h-[100dvh] overflow-x-auto overflow-y-hidden bg-erp-thead-bg">
      <div className="relative flex h-full min-w-[1720px] flex-col overflow-x-clip">
        <GlobalHeader
          menus={MENUS}
          right={
            <>
              <StoreSelect options={STORES} />
              <ServiceLinks />
              <AlarmLink href="#" />
              <UserPop name="정하윤 (BP 마스터)" items={USER_ITEMS} />
            </>
          }
        />
        <PageBar title="직원 정보 관리">
          {/* 초안을 저장하면 초대가 나간다 — 데모의 「계약서 작성」을 이름만 바꿨다(2026-10-12 yjnoh). */}
          <Button href="/staff-members/contracts/new">직원 초대</Button>
        </PageBar>
        <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
          <StaffFilter query={query} />
          <main className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
            <ListToolbar total={total}>
              <Button variant="soft" href="/staff-members/export">
                일괄 저장
              </Button>
              <StaffPageSize query={query} />
            </ListToolbar>
            <StaffTable items={items} startNo={(query.page - 1) * query.pageSize + 1} today={kstToday()} />
            <div className="pt-[14px]">
              <StaffPagination query={query} totalPages={totalPages} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 린트와 빌드**

Run: `pnpm lint && pnpm build`
Expected: 둘 다 성공. `pnpm build` 출력의 경로 목록에 `/staff-members` 가 보인다. 타입 오류가 나면 위 코드의 타입만 고친다(동작은 바꾸지 않는다).

- [ ] **Step 6: 개발 서버에서 확인한다**

```bash
pnpm dev --port 3100   # 백그라운드로 띄운다
curl -s localhost:3100/staff-members | grep -o '서지안\|총 <b[^>]*>[0-9]*</b>\|본사 제공 동의 없음' | sort -u
curl -s 'localhost:3100/staff-members?joinGroup=LINK_HOLD' | grep -o '하준서\|연결 보류 · 4일\|총 <b[^>]*>[0-9]*</b>' | sort -u
curl -s 'localhost:3100/staff-members?page=4' | grep -o 'aria-current="page"[^>]*>[0-9]*' | head -1
curl -s 'localhost:3100/staff-members?keyword=%EA%B0%80%EB%A7%B9&employmentStatus=ALL' | grep -c '본사 제공 동의 없음'
```

Expected:
- 첫 줄: `서지안`, `본사 제공 동의 없음`, `총 <b …>63</b>`
- 둘째 줄: `하준서`, `연결 보류 · 4일`, `총 <b …>1</b>`
- 셋째 줄: 현재 쪽 4
- 넷째 줄: `0`(검색어가 있으면 가린 행이 빠진다)

그다음 브라우저에서 `http://localhost:3100/staff-members` 를 열어 체크 끄기 · 검색 · 쪽 · 건수 · 초기화를 눌러 본다(가능하면
브라우저 도구로 스크린샷). `next dev` 가 `AGENTS.md` 를 고쳤으면 그 변경은 커밋하지 않는다.

- [ ] **Step 7: 커밋한다**

```bash
git add src/app/staff-members/staff-table.tsx src/app/staff-members/staff-filter.tsx src/app/staff-members/staff-list-controls.tsx src/app/staff-members/page.tsx
git commit -m "feat: 직원 정보 관리 목록 화면 /staff-members (WHALEERP-138)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 마무리 확인

**Files:** 없음(확인만). 고칠 것이 생기면 그 파일.

- [ ] **Step 1: 전체 확인**

```bash
node --test src/lib/staff-members.test.ts src/lib/staff-members.mock.test.ts src/app/staff-members/staff-list-query.test.ts src/app/staff-members/staff-row.test.ts src/components/common/date-math.test.ts
pnpm lint
pnpm build
```
Expected: `# fail 0`(pass 14 + 7 + 10 + 11 + 기존 date-math), 린트 · 빌드 성공.

- [ ] **Step 2: 개발 서버를 띄워 둔다**

사용자가 바로 볼 수 있게 `pnpm dev --port 3100` 을 띄워 두고 주소 `http://localhost:3100/staff-members` 를 알린다.
푸시 · PR 은 이 계획 밖이다 — 사용자에게 묻는다.
