// 근로계약 목록의 순수 로직 — 주소 쿼리 ↔ API 쿼리, 칸 표기. 테스트: node --test src/app/contracts/contract-list.test.ts
// node --test 가 이 파일을 직접 읽으므로 값 import 는 상대 경로 + .ts 로 쓴다.

import type { components } from "@/lib/api-types.generated";
import type { Scope } from "../../lib/browser-storage.ts";
import type { AdminStore } from "../../lib/session.ts";
import { SCOPE_PARAM, isUnusableScope, scopeKeyOf, scopeOfParam, withoutStoreSearch } from "../../lib/store-scope.ts";

export const PAGE_SIZE = 20;

/** GET /contracts 의 한 줄과 한 페이지. api 의 openapi.json 에서 만든 타입을 쓴다(pnpm openapi:types). */
export type ContractListItem = components["schemas"]["ContractListItemDto"];
export type ContractListPage = components["schemas"]["ContractListResponseDto"];

/**
 * 화면 주소의 쿼리. 상태가 비어 있으면 전체다.
 * 점포 조건은 점포 정보 관리 목록(stores-query.ts)과 같은 짝이다(WHALEERP-133, 1팀 front #88 「상단 점포 범위 ↔ 목록 점포 필터 연동」):
 * 목록에서 고른 점포(storeIds — 주소 storeIds=3,7), 목록에서 비운 「전체」(storesCleared — 주소 storeIds=), 헤더 범위(scope — 주소
 * scope=ALL · DIRECT · FRANCHISE · STORE:12, 헤더가 메뉴로 이동할 때 싣는다). 셋 다 없으면 정해지지 않은 것이라 필터가 헤더 범위로 채운다.
 */
export interface ListQuery {
  page: number;
  staffMemberName: string;
  status: string[];
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

/** 상태는 api 가 아는 값만 남긴다. 주소에 직접 넣은 ?status=FOO 를 그대로 보내면 api 가 400 이다. */
export function withKnownStatus(q: ListQuery, known: { value: string }[]): ListQuery {
  return { ...q, status: q.status.filter((v) => known.some((k) => k.value === v)) };
}

export function readListQuery(params: SearchParams): ListQuery {
  const page = Number.parseInt(first(params.page), 10);
  const status = params.status;
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
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    // api 는 50자를 넘으면 400 이다(@MaxLength(50)). 주소에 직접 넣은 긴 값은 잘라 보낸다.
    staffMemberName: first(params.staffMemberName).trim().slice(0, NAME_MAX),
    status: (Array.isArray(status) ? status : status ? [status] : []).filter(Boolean),
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
  if (q.storeIds.length) s.set("storeIds", q.storeIds.join(","));
  else if (q.storesCleared) s.set("storeIds", "");
  else if (q.scope) s.set(SCOPE_PARAM, scopeKeyOf(q.scope));
  if (q.staffMemberName) s.set("staffMemberName", q.staffMemberName);
  for (const v of q.status) s.append("status", v);
  const text = s.toString();
  return text ? `?${text}` : "";
}

/** 목록 화면 주소 */
export const listHrefOf = (q: ListQuery) => `/contracts${toSearch(q)}`;

/**
 * api(GET /contracts) 쿼리. 고른 점포는 storeIds, 범위가 점포 하나면 그 id, 직영 · 가맹 전체면 점포를 풀지 않고 점포 유형(storeTypes)으로
 * 보낸다. 범위 「전체」 · 비운 「전체」는 점포 조건이 없다. 업무 범위 밖의 id 는 api 가 조용히 뺀다.
 */
export function apiSearch(q: ListQuery, pageSize: number): string {
  const s = new URLSearchParams();
  if (q.page > 1) s.set("page", String(q.page));
  s.set("pageSize", String(pageSize));
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
 * 저장 · 삭제 뒤 돌아갈 목록. 새로 만들었거나(등록) 지웠으면 점포 조건을 「전체」로 비운다(1팀 withoutStoreSearch — 새 계약의 점포가 고른
 * 점포 밖일 수 있다). 이어 쓰기 · 수정 저장은 같은 계약이라 그대로 돌아간다.
 */
export const listAfterSave = (back: string | string[] | undefined, created: boolean) => {
  const list = backHrefOf(back);
  return created ? withoutStoreSearch(list) : list;
};

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

/** 서명 대기의 남은 날. 날인 기한 날짜까지 며칠 남았는지(D-0 이 마감일). */
export function deadlineNote(row: Pick<ContractListItem, "status" | "signDeadlineAt">, now: Date): string | undefined {
  if (row.status !== "PENDING_SIGNATURE" || !row.signDeadlineAt) return undefined;
  const days = Math.round((Date.parse(kstDate(row.signDeadlineAt)) - Date.parse(kstDate(now.toISOString()))) / 86_400_000);
  return days >= 0 ? `D-${days}` : undefined;
}
