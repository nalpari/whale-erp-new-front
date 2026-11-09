// 근로계약 목록의 순수 로직 — 주소 쿼리 ↔ API 쿼리, 칸 표기. 테스트: node --test src/app/contracts/contract-list.test.ts
// node --test 가 이 파일을 직접 읽으므로 값 import 는 상대 경로 + .ts 로 쓴다.

import type { components } from "@/lib/api-types.generated";
import type { Scope } from "../../lib/browser-storage.ts";
import type { AdminStore } from "../../lib/session.ts";
import { PAGE_SIZES, type PageSize } from "../../lib/staff-members.ts";
import { SCOPE_PARAM, isUnusableScope, scopeKeyOf, scopeOfParam, withoutStoreSearch } from "../../lib/store-scope.ts";

/** 페이지당 건수 — 다른 목록(직원 · 급여명세서)과 같은 선택지다(WHALEERP-133). 고른 값은 주소 pageSize 에 둔다 */
export { PAGE_SIZES, type PageSize };
const DEFAULT_PAGE_SIZE: PageSize = 20;

/** GET /contracts 의 한 줄과 한 페이지. api 의 openapi.json 에서 만든 타입을 쓴다(pnpm openapi:types). */
export type ContractListItem = components["schemas"]["ContractListItemDto"];
export type ContractListPage = components["schemas"]["ContractListResponseDto"];

/**
 * 화면 주소의 쿼리. 상태가 비어 있으면 전체다. 상태를 모두 끈 것은 statusNone(주소 status=NONE)이고 빈 목록이다(공통 정책 「목록 필터
 * 체크박스」, WHALEERP-654).
 * 점포 조건은 점포 정보 관리 목록(stores-query.ts)과 같은 짝이다(WHALEERP-133, 1팀 front #88 「상단 점포 범위 ↔ 목록 점포 필터 연동」):
 * 목록에서 고른 점포(storeIds — 주소 storeIds=3,7), 목록에서 비운 「전체」(storesCleared — 주소 storeIds=), 헤더 범위(scope — 주소
 * scope=ALL · DIRECT · FRANCHISE · STORE:12, 헤더가 메뉴로 이동할 때 싣는다). 셋 다 없으면 정해지지 않은 것이라 필터가 헤더 범위로 채운다.
 */
export interface ListQuery {
  page: number;
  pageSize: PageSize;
  staffMemberName: string;
  status: string[];
  statusNone: boolean;
  storeIds: number[];
  storesCleared: boolean;
  scope: Scope | null;
}

/** 고를 수 있는 점포 수 — api 상한(ListContractsQueryDto storeIds 1000개)과 같다 */
export const MAX_PICKED_STORES = 1000;

/** int4 양의 정수만 — 9자리까지 받아 api 의 정수 범위를 넘기지 않는다 */
const positiveInt = (v: string) => (/^\d{1,9}$/.test(v) && Number(v) >= 1 ? Number(v) : null);

type SearchParams = { [key: string]: string | string[] | undefined };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const NAME_MAX = 50;

/** 상태를 모두 끈 것의 주소 값 */
const STATUS_NONE = "NONE";

/** 상태는 api 가 아는 값만 남긴다. 주소에 직접 넣은 ?status=FOO 를 그대로 보내면 api 가 400 이다. */
export function withKnownStatus(q: ListQuery, known: { value: string }[]): ListQuery {
  return { ...q, status: q.status.filter((v) => known.some((k) => k.value === v)) };
}

export function readListQuery(params: SearchParams): ListQuery {
  const page = Number.parseInt(first(params.page), 10);
  const pageSize = Number(first(params.pageSize));
  const status = (Array.isArray(params.status) ? params.status : params.status ? [params.status] : []).filter(Boolean);
  // NONE 이 섞여 있으면 다른 값과 함께여도 모두 끈 것이다(주소를 직접 고친 경우)
  const statusNone = status.includes(STATUS_NONE);
  const rawStoreIds = params.storeIds === undefined ? undefined : first(params.storeIds);
  // 숫자가 아닌 조각은 버리고 겹친 것은 하나로 — 주소에 직접 넣은 값으로 api 가 400 을 내지 않게
  const storeIds = [
    ...new Set(
      (rawStoreIds ?? "")
        .split(",")
        .map(positiveInt)
        .filter((id): id is number => id !== null),
    ),
  ].slice(0, MAX_PICKED_STORES);
  return {
    // 숫자가 아니거나 1보다 작으면 첫 페이지. api 는 page=0 을 400 으로 돌려준다.
    // 상태를 모두 끈 목록은 늘 빈 한 쪽이다 — 쪽 번호가 남으면 없는 쪽이 골라진 채 그려진다
    page: Number.isInteger(page) && page >= 1 && !statusNone ? page : 1,
    // 고를 수 있는 값이 아니면 기본(20) — 주소에 직접 넣은 큰 값으로 api 상한(200)을 넘기지 않게
    pageSize: PAGE_SIZES.find((n) => n === pageSize) ?? DEFAULT_PAGE_SIZE,
    // api 는 50자를 넘으면 400 이다(@MaxLength(50)). 주소에 직접 넣은 긴 값은 잘라 보낸다.
    staffMemberName: first(params.staffMemberName).trim().slice(0, NAME_MAX),
    status: statusNone ? [] : status,
    statusNone,
    storeIds,
    // 빈 storeIds 는 목록에서 비운 것 — 「전체」다(헤더 범위가 아니다). 고른 점포 · 비운 전체가 있으면 범위는 쓰지 않는다
    storesCleared: rawStoreIds !== undefined && !storeIds.length,
    scope: rawStoreIds !== undefined ? null : scopeOfParam(first(params[SCOPE_PARAM]) || undefined),
  };
}

/**
 * 화면 주소. 기본값(1페이지 · 빈 칸)은 빼서 주소를 짧게 둔다. 점포 조건은 고른 점포 → storeIds, 비운 「전체」 → 빈 storeIds, 아니면 헤더
 * 범위 → scope 다(stores-query.ts setStoreCondition 과 같다 — 목록에서 비운 것을 scope=ALL 로 적으면 헤더 범위까지 바뀐다).
 */
export function toSearch(q: ListQuery): string {
  const s = new URLSearchParams();
  if (q.page > 1) s.set("page", String(q.page));
  if (q.pageSize !== DEFAULT_PAGE_SIZE) s.set("pageSize", String(q.pageSize));
  if (q.storeIds.length) s.set("storeIds", q.storeIds.join(","));
  else if (q.storesCleared) s.set("storeIds", "");
  else if (q.scope) s.set(SCOPE_PARAM, scopeKeyOf(q.scope));
  if (q.staffMemberName) s.set("staffMemberName", q.staffMemberName);
  if (q.statusNone) s.set("status", STATUS_NONE);
  for (const v of q.status) s.append("status", v);
  const text = s.toString();
  return text ? `?${text}` : "";
}

/** 목록 화면 주소 */
export const listHrefOf = (q: ListQuery) => `/contracts${toSearch(q)}`;

/**
 * api(GET /contracts) 쿼리. 고른 점포는 storeIds, 범위가 점포 하나면 그 id, 직영 · 가맹 전체면 점포를 풀지 않고 점포 유형(storeTypes)으로
 * 보낸다. 범위 「전체」 · 비운 「전체」는 점포 조건이 없다. 업무 범위 밖의 id 는 api 가 조용히 뺀다.
 * 상태를 모두 끈 것(statusNone)은 상태 조건 없이 첫 쪽 한 줄로 보낸다 — api 에 「없음」 값이 없고, 상태별 개수는 상태 조건 · 쪽과
 * 관계없이 오므로 그대로 받아 체크박스에 붙이고 목록만 page.tsx 가 비운다.
 */
export function apiSearch(q: ListQuery): string {
  const s = new URLSearchParams();
  // 모두 끈 것은 목록을 버리고 개수만 쓴다 — 개수는 쪽과 상관없으니 첫 쪽 한 줄만 받는다(api pageSize 하한 1)
  if (q.page > 1 && !q.statusNone) s.set("page", String(q.page));
  s.set("pageSize", q.statusNone ? "1" : String(q.pageSize));
  const ids = q.storeIds.length ? q.storeIds : q.scope?.type === "STORE" ? [q.scope.storeId] : [];
  if (ids.length) s.set("storeIds", ids.join(","));
  else if (q.scope?.type === "DIRECT" || q.scope?.type === "FRANCHISE") s.set("storeTypes", q.scope.type);
  if (q.staffMemberName) s.set("staffMemberName", q.staffMemberName);
  for (const v of q.status) s.append("status", v);
  return `?${s}`;
}

/** 칩으로 그릴 점포 id — 고른 점포, 없으면 범위가 점포 하나일 때 그 점포 */
export const pickedIdsOf = (q: Pick<ListQuery, "storeIds" | "scope">): number[] =>
  q.storeIds.length ? q.storeIds : q.scope?.type === "STORE" ? [q.scope.storeId] : [];

/**
 * 필터가 헤더 범위로 채울 범위 — 주소에 점포 조건(고른 점포 · 비운 「전체」 · scope)이 없고 헤더 범위가 「전체」가 아닐 때만.
 * 주소 직접 입력 · 즐겨찾기 · 그런 주소로 뒤로 가기에서 생긴다.
 */
export const fillScopeOf = (q: Pick<ListQuery, "storeIds" | "storesCleared" | "scope">, headerScope: Scope): Scope | null =>
  q.storeIds.length || q.storesCleared || q.scope || headerScope.type === "ALL" ? null : headerScope;

/** 고른 점포를 바꾼다. 비면 「전체」(빈 storeIds — 헤더 범위로 다시 채우지 않는다). 첫 쪽으로 간다 */
export const withPickedStores = (q: ListQuery, ids: number[]): ListQuery => ({ ...q, storeIds: ids, storesCleared: !ids.length, scope: null, page: 1 });

/** 헤더 범위로 점포 조건을 건다(고른 점포는 비운다). 첫 쪽으로 간다 */
export const withScopeCondition = (q: ListQuery, scope: Scope): ListQuery => ({ ...q, storeIds: [], storesCleared: false, scope, page: 1 });

/**
 * 주소의 범위를 이 탭에서 쓸 수 없는가 — 고를 점포가 없다(점포 하나가 로그인 정보에 없음 · 직영 · 가맹에 폐점이 아닌 점포가 없음).
 * 헤더(scopeFromAddress) · 칩(scopeStores)과 같은 isUnusableScope 다 — 폐점을 세면 헤더는 따르지 않고 칩은 비었는데 api 에는 점포 유형이
 * 가는, 보이지 않는 조건이 생긴다(#109 리뷰). 그런 주소는 필터가 「전체」로 바꾸고 알린다. 고른 점포(storeIds)는 보지 않는다 — 로그인
 * 정보에 없어도 「점포 {id}」 칩으로 보이고 지울지는 사용자가 정한다.
 */
export const unusableScopeOf = (q: Pick<ListQuery, "scope">, stores: readonly AdminStore[]): boolean => !!q.scope && isUnusableScope(q.scope, stores);

/**
 * 목록에서 나가는 주소(상세 · 이어 쓰기 · 작성 · 근로자 정보)에 지금 목록 주소를 ?back= 으로 싣는다 — 그 화면들의 [목록] · 저장 · 삭제 뒤
 * 이동이 같은 조건 · 쪽으로 돌아온다(1팀 「상세 · 등록으로 갈 때 목록 주소를 ?back= 으로 넘긴다」). 기본 목록이면 싣지 않는다. href 에 이미
 * 쿼리(?send= 등)가 있으면 뒤에 붙인다. back 은 backHrefOf 로 다시 걸러 근로계약 목록 주소만 싣는다.
 */
export function withBack(href: string, back: string | string[] | undefined): string {
  const list = backHrefOf(back);
  return list === "/contracts" ? href : `${href}${href.includes("?") ? "&" : "?"}back=${encodeURIComponent(list)}`;
}

/**
 * 저장 · 삭제 뒤 돌아갈 목록. 새로 만들었거나(등록) 지웠으면(savedStoreId null) 점포 조건을 「전체」로 비운다(1팀 withoutStoreSearch — 새
 * 계약의 점포가 고른 점포 밖일 수 있다). 이어 쓰기 · 수정 저장은 저장한 점포가 목록의 고른 점포(점포 하나 범위 포함) 밖이면 비운다 — 임시저장
 * 이어 쓰기는 점포를 바꿀 수 있어 그대로 돌아가면 방금 저장한 계약이 안 보인다(#109 리뷰). 직영 · 가맹 범위는 점포 유형을 몰라 그대로 둔다.
 * 상태를 모두 끈 목록(status=NONE)에서 왔으면 상태 조건을 「전체」로 푼다 — 그대로 돌아가면 방금 저장한 계약이 반드시 안 보인다.
 */
export function listAfterSave(back: string | string[] | undefined, savedStoreId: number | null): string {
  const list = withoutStatusNone(backHrefOf(back));
  if (savedStoreId === null) return withoutStoreSearch(list);
  const picked = pickedIdsOf(readListQuery(Object.fromEntries(new URLSearchParams(list.split("?")[1] ?? ""))));
  return picked.length && !picked.includes(savedStoreId) ? withoutStoreSearch(list) : list;
}

/** 상태 「모두 끔」을 「전체」로 푼 목록 주소 */
function withoutStatusNone(list: string): string {
  const at = list.indexOf("?");
  const path = at < 0 ? list : list.slice(0, at);
  const params = new URLSearchParams(at < 0 ? "" : list.slice(at + 1));
  if (!params.getAll("status").includes(STATUS_NONE)) return list;
  params.delete("status");
  const text = params.toString();
  return text ? `${path}?${text}` : path;
}

/**
 * 상태 체크 하나를 켜거나 끈 뒤의 조건. 모두 끄면 statusNone(빈 상태 목록은 「전체」라 따로 적는다), 모두 켜면 쿼리에서 빼 「전체」로
 * 둔다 — 새 상태가 생겨도 전체에 들어간다. 그 밖에는 enum 순서대로 고른 값이다.
 */
export function toggledStatus(checked: string[], all: string[], value: string, on: boolean): Pick<ListQuery, "status" | "statusNone"> {
  const next = on ? [...checked, value] : checked.filter((v) => v !== value);
  if (next.length === 0) return { status: [], statusNone: true };
  return { status: next.length === all.length ? [] : all.filter((v) => next.includes(v)), statusNone: false };
}

/** 돌아갈 목록 주소. 근로계약 목록 주소가 아니면(다른 곳으로 보내려는 값) 기본 목록으로 — 서버 액션에 온 값도 이것으로 거른다 */
export function backHrefOf(raw: string | string[] | undefined): string {
  const value = typeof raw === "string" ? raw : "";
  return /^\/contracts(\?[^#]*)?$/.test(value) ? value : "/contracts";
}

export function periodText(row: Pick<ContractListItem, "startDate" | "endDate">): string {
  if (!row.startDate) return "-";
  return `${row.startDate} ~ ${row.endDate ?? "무기한"}`;
}

/** 급여액은 고용 형태와 상관없이 시급이다(2026-10-12 재영). */
export function wageText(row: Pick<ContractListItem, "wageAmount">): string {
  if (row.wageAmount === null) return "-";
  return `${row.wageAmount.toLocaleString("ko-KR")} /h`;
}

// 날짜는 한국 시간으로 끊는다. 서버(UTC)에서 그리면 오전 9시 전 발송이 전날로 보인다.
const kstDate = (iso: string) => new Date(new Date(iso).getTime() + 9 * 3600_000).toISOString().slice(0, 10);

/** 발송일 MM-DD. 발송 전이면 "-" */
export function sentText(sentAt: string | null): string {
  return sentAt ? kstDate(sentAt).slice(5) : "-";
}

/**
 * 상태 칸에 붙는 직원의 가입 · 초대 안내(WHALEERP-133). 저장 때 판별한 초대 유형(draftAction)이 아니라 직원의 지금 상태(staffJoinState)라
 * 초대가 만료 · 거절되면 「가입 대기 중」이 아니다. 발송 대기는 초대에 응답을 기다리는 동안, 서명 대기는 소속 · 복귀 확인을 기다리는
 * 동안만 붙인다(가입한 직원의 서명 대기는 남은 날만).
 */
const JOIN_NOTES: Partial<Record<ContractListItem["staffJoinState"], string>> = {
  INVITED: "가입 대기 중",
  AFFILIATION_PENDING: "소속 확인 중",
  RETURN_PENDING: "복귀 확인 중",
  LINK_HOLD: "정보 확인 필요",
  UNDER_AGE: "가입 불가",
  EXPIRED: "초대 만료",
  REJECTED: "초대 거절",
};
const WAITING_SIGNATURE_NOTES = new Set<ContractListItem["staffJoinState"]>(["AFFILIATION_PENDING", "RETURN_PENDING"]);
const IN_PROGRESS_NOTES = new Set<NonNullable<ContractListItem["status"]>>(["DRAFT", "PENDING_SEND", "PENDING_SIGNATURE", "CORRECTION_REQUESTED"]);

/**
 * 체결 완료의 갱신 예정 안내(WHALEERP-156). 갱신 예정일(종료일 30일 전)이 오늘이거나 지났으면 직원 목록 배지와 같이 종료일까지 남은 날
 * (「갱신 예정 D-n」), 아직이면 그 날짜(「갱신 예정 YYYY-MM-DD」 — 해가 바뀌어도 읽히게). 지난 날짜를 앞으로 올 날처럼 보이지 않게 한다.
 */
function renewalNote(renewalDate: string, now: Date): string {
  const today = kstDate(now.toISOString());
  if (renewalDate > today) return `갱신 예정 ${renewalDate}`;
  const left = Math.round((Date.parse(renewalDate) + 30 * 86_400_000 - Date.parse(today)) / 86_400_000);
  return `갱신 예정 D-${Math.max(left, 0)}`;
}

/**
 * 상태 칸 뒤에 「 · 」로 붙일 안내(목록 끝 칸에 두던 것, WHALEERP-133). 가입 · 초대 안내, 재계약 서명 대기의 「재계약」, 서명 대기의 남은
 * 날, 체결 완료의 갱신 예정일(WHALEERP-156 — 이미 재계약했으면 api 가 비운다), 퇴직한 직원이면 「퇴직」. 발송 대기인데 가입 · 초대
 * 안내가 없으면(나간 초대가 없는 초안 직원 · api 가 가입 상태를 아직 싣지 않은 먼저 배포된 화면) 판별한 초대 유형을 붙이던 예전 안내로
 * 둔다(draftActionLabel).
 */
export function statusNotes(
  row: Pick<ContractListItem, "status" | "signDeadlineAt" | "draftAction" | "staffJoinState" | "staffRetired" | "renewalDate" | "previousContractId">,
  now: Date,
  draftActionLabel: (v: string) => string = (v) => v,
): string[] {
  const notes: string[] = [];
  const join = row.staffJoinState == null ? undefined : JOIN_NOTES[row.staffJoinState];
  if (row.status === "PENDING_SEND") {
    if (join) notes.push(join);
    else if ((row.staffJoinState == null || row.staffJoinState === "DRAFT") && row.draftAction) notes.push(draftActionLabel(row.draftAction));
  }
  if (row.status === "PENDING_SIGNATURE" && join && WAITING_SIGNATURE_NOTES.has(row.staffJoinState)) notes.push(join);
  // 재계약은 체결 전까지(임시저장 · 발송 대기 · 서명 대기 · 수정 요청) 표시한다 — 퇴직 뒤 재입사는 가입 초대(발송 대기)로 시작한다
  if (row.previousContractId && row.status && IN_PROGRESS_NOTES.has(row.status)) notes.push("재계약");
  const deadline = deadlineNote(row, now);
  if (deadline) notes.push(deadline);
  if (row.status === "SIGNED" && row.renewalDate) notes.push(renewalNote(row.renewalDate, now));
  if (row.staffRetired) notes.push("퇴직");
  return notes;
}

/**
 * 저장 뒤 목록 위 안내(WHALEERP-132) — 시스템이 한 처리. 저장 응답(status · draftAction)에서 savedKindOf 로 고른 값을 짧게 사는 쿠키
 * (SAVED_COOKIE)로 목록에 넘긴다. 주소에 싣지 않는다 — 주소에 남으면 새로고침 · 뒤로 가기 · 즐겨찾기마다 다시 뜨고, 지우려고 주소를 바꾸면
 * 필터의 헤더 범위 채우기와 겹친다(front #127 ip-code-review). 모르는 값이면 안내가 없다.
 */
export const SAVED_COOKIE = "contract-saved";
/** 쿠키가 사는 시간(초) — 저장 뒤 목록을 그릴 동안만. 목록이 그리면 SavedNotice 가 지운다 */
export const SAVED_COOKIE_MAX_AGE = 60;

const SAVED_NOTICES: Record<string, string> = {
  DRAFT: "임시저장했습니다. 직원 이름을 눌러 이어 쓸 수 있습니다.",
  PAPER: "종이 계약을 등록했습니다. 발송 · 전자서명 없이 바로 서명 완료입니다.",
  SIGNUP_INVITE: "근로계약서를 저장하고 직원 휴대전화로 가입 초대 알림톡을 보냈습니다. 직원이 가입하면 직원 서명 대기로 넘어갑니다.",
  IMMEDIATE_SEND: "근로계약서를 저장하고 직원 앱으로 보냈습니다. 직원이 서명하면 서명 완료입니다.",
  AFFILIATION_CONFIRM: "근로계약서를 저장했습니다. 이 번호로 가입한 계정이 있어 소속 추가 확인을 기다립니다 — 직원이 이 점포 소속을 확인하면 앱에서 계약서를 봅니다.",
  RETURN_CONFIRM: "근로계약서를 저장했습니다. 이 점포에서 퇴직한 직원의 계정이라 복귀 확인을 기다립니다 — 직원이 복귀를 확인하면 앱에서 계약서를 봅니다.",
};

/**
 * 저장 응답 → 안내 종류. 임시저장 · 종이 계약 등록은 상태로, 보낸 저장은 api 가 싣는 「시스템이 실제로 한 처리」(draftAction —
 * 가입 초대 · 소속 추가 확인 · 복귀 확인 · 가입한 직원에게 앱으로 보낸 즉시 발송)로 고른다. 수정 요청을 고쳐 저장한 것도 같다.
 */
export function savedKindOf(saved: { status?: string | null; draftAction?: string | null } | null | undefined): string | null {
  if (saved?.status === "DRAFT") return "DRAFT";
  if (saved?.status === "SIGNED") return "PAPER";
  return saved?.draftAction ?? null;
}

export const savedNoticeOf = (raw: string | string[] | undefined): string | null =>
  typeof raw === "string" && Object.hasOwn(SAVED_NOTICES, raw) ? SAVED_NOTICES[raw] : null;

/** 서명 대기의 남은 날. 날인 기한 날짜까지 며칠 남았는지(D-0 이 마감일). */
export function deadlineNote(row: Pick<ContractListItem, "status" | "signDeadlineAt">, now: Date): string | undefined {
  if (row.status !== "PENDING_SIGNATURE" || !row.signDeadlineAt) return undefined;
  const days = Math.round((Date.parse(kstDate(row.signDeadlineAt)) - Date.parse(kstDate(now.toISOString()))) / 86_400_000);
  return days >= 0 ? `D-${days}` : undefined;
}
