// TO-DO 목록 URL 쿼리 ↔ 조회 조건 ↔ api 쿼리. 화면 상태는 URL 에만 둔다(직원 목록 staff-list-query.ts 와 같은 규칙).
// 기본값은 URL 에서 빼고, 이상한 값은 오류 없이 그 칸만 기본값으로 돌린다. 상태 체크는 모르는 값만 버린다 — 남는 게 없으면 0건이다.
// 점포 조건은 점포 목록(stores-query.ts)과 같은 네 가지다 — 목록에서 고른 점포(storeIds) · 목록에서 비운 「전체」(빈 storeIds) · 헤더 범위(scope) ·
// 정해지지 않음(필터가 헤더 범위로 채운다). 옛 주소의 storeId=N 은 storeIds=N 으로 읽는다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { components } from "../../lib/api-types.generated.ts";
import type { Scope } from "../../lib/browser-storage.ts";
import { PAGE_SIZES, type PageSize } from "../../lib/staff-members.ts";
import { SCOPE_PARAM, scopeKeyOf, scopeOfParam } from "../../lib/store-scope.ts";
import { MAX_PICKED_STORES, pickedIdsOf } from "../stores/stores-query.ts";

export type TodoStatus = components["schemas"]["TodoStatus"];
export type TodoAssigneeType = components["schemas"]["TodoAssigneeType"];

/** 화면 순서. 한글은 getEnum("TodoStatus") 로 받는다 */
export const TODO_STATUSES: readonly TodoStatus[] = ["PENDING", "IN_PROGRESS", "DONE"];
const ASSIGNEE_TYPES: readonly TodoAssigneeType[] = ["INDIVIDUAL", "ALL"];

export interface TodoListQuery {
  /** 목록에서 고른 점포(근무지). 비었으면 storesCleared · scope 로 정한다 — 짝은 점포 목록의 StoresQuery 와 같다 */
  storeIds: number[];
  /** 목록에서 비운 「전체」(주소에는 빈 storeIds) — 헤더 범위가 아니다 */
  storesCleared: boolean;
  /** 헤더 범위(주소의 scope). 고른 점포 · 빈 storeIds 가 있으면 null */
  scope: Scope | null;
  statuses: TodoStatus[];
  /** 담당 — 빈 값이면 전체 */
  assigneeType: TodoAssigneeType | "";
  urgentOnly: boolean;
  /** 수행 예정 기간 YYYY-MM-DD, 그날 포함. 빈 값이면 열린 끝 */
  dueDateFrom: string;
  dueDateTo: string;
  page: number;
  pageSize: PageSize;
}

type RawSearch = Record<string, string | string[] | undefined>;

export const DEFAULT_TODO_LIST_QUERY: TodoListQuery = {
  storeIds: [],
  storesCleared: false,
  scope: null,
  statuses: [...TODO_STATUSES],
  assigneeType: "",
  urgentOnly: false,
  dueDateFrom: "",
  dueDateTo: "",
  page: 1,
  pageSize: 20,
};

const MAX_ID = 2_147_483_647;
const MAX_PAGE = 1_000_000;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const idOf = (v: string) => (/^[1-9]\d*$/.test(v) && Number(v) <= MAX_ID ? Number(v) : null);

/** 있는 날짜(YYYY-MM-DD)만. 2026-02-30 같은 값은 api 가 400 이라 여기서 버린다 */
function dateOf(raw: string | undefined): string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  const d = new Date(`${raw}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === raw ? raw : "";
}

export function parseTodoListQuery(raw: RawSearch): TodoListQuery {
  // 옛 주소의 storeId 하나는 고른 점포로 읽는다(storeIds 가 있으면 그쪽)
  const legacyStoreId = first(raw.storeId);
  const rawStoreIds = first(raw.storeIds) ?? (legacyStoreId && idOf(legacyStoreId) ? legacyStoreId : undefined);
  const storeIds = [...new Set((rawStoreIds ?? "").split(",").map(idOf).filter((id) => id !== null))].slice(0, MAX_PICKED_STORES);
  const status = first(raw.status);
  const assigneeType = first(raw.assigneeType);
  const page = Number(first(raw.page));
  const pageSize = Number(first(raw.pageSize));
  const picked = status === undefined ? null : new Set(status.split(","));
  return {
    storeIds,
    storesCleared: rawStoreIds !== undefined && !storeIds.length,
    scope: rawStoreIds !== undefined ? null : scopeOfParam(first(raw[SCOPE_PARAM])),
    statuses: picked ? TODO_STATUSES.filter((s) => picked.has(s)) : [...TODO_STATUSES],
    assigneeType: ASSIGNEE_TYPES.find((t) => t === assigneeType) ?? "",
    urgentOnly: first(raw.urgent) === "1",
    dueDateFrom: dateOf(first(raw.dueDateFrom)),
    dueDateTo: dateOf(first(raw.dueDateTo)),
    page: Number.isInteger(page) && page >= 1 && page <= MAX_PAGE ? page : 1,
    pageSize: PAGE_SIZES.find((s) => s === pageSize) ?? DEFAULT_TODO_LIST_QUERY.pageSize,
  };
}

export function toTodoListSearch(query: TodoListQuery): string {
  const params = new URLSearchParams();
  // 점포 조건 — 점포 목록의 setStoreCondition 과 같다(고른 점포 · 비운 「전체」 · 헤더 범위)
  if (query.storeIds.length) params.set("storeIds", query.storeIds.join(","));
  else if (query.storesCleared) params.set("storeIds", "");
  else if (query.scope) params.set(SCOPE_PARAM, scopeKeyOf(query.scope));
  if (query.statuses.length !== TODO_STATUSES.length) params.set("status", TODO_STATUSES.filter((s) => query.statuses.includes(s)).join(","));
  if (query.assigneeType) params.set("assigneeType", query.assigneeType);
  if (query.urgentOnly) params.set("urgent", "1");
  if (query.dueDateFrom) params.set("dueDateFrom", query.dueDateFrom);
  if (query.dueDateTo) params.set("dueDateTo", query.dueDateTo);
  if (query.page !== 1) params.set("page", String(query.page));
  if (query.pageSize !== DEFAULT_TODO_LIST_QUERY.pageSize) params.set("pageSize", String(query.pageSize));
  const search = params.toString();
  return search ? `?${search}` : "";
}

/**
 * GET /todos 쿼리. 점포는 고른 점포 · 점포 하나 범위면 storeIds(쉼표), 직영 · 가맹 범위면 storeTypes, 전체 · 비운 「전체」면 싣지 않는다 —
 * 업무 범위 밖 점포는 api 가 뺀다. 상태는 `status=A&status=B` 로 되풀이하고 셋 다면 뺀다. 0건이 확실한 조건(상태를 하나도 안 고름 · 기간이 거꾸로)이면
 * null — api 는 빈 상태를 「전체」로 읽어 반대가 된다.
 */
export function todoListApiSearch(query: TodoListQuery): string | null {
  if (query.statuses.length === 0) return null;
  if (query.dueDateFrom && query.dueDateTo && query.dueDateFrom > query.dueDateTo) return null;
  const params = new URLSearchParams();
  const storeIds = pickedIdsOf(query);
  if (storeIds.length) params.set("storeIds", storeIds.join(","));
  else if (query.scope?.type === "DIRECT" || query.scope?.type === "FRANCHISE") params.set("storeTypes", query.scope.type);
  if (query.statuses.length !== TODO_STATUSES.length) for (const s of query.statuses) params.append("status", s);
  if (query.assigneeType) params.set("assigneeType", query.assigneeType);
  if (query.urgentOnly) params.set("isUrgent", "true");
  if (query.dueDateFrom) params.set("dueDateFrom", query.dueDateFrom);
  if (query.dueDateTo) params.set("dueDateTo", query.dueDateTo);
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  return params.toString();
}

/** 상세 · 등록으로 갈 때 지금 목록 주소를 ?back= 으로 넘긴다 — [목록] · [취소]가 같은 조건 · 쪽으로 돌아온다(점포 목록 withBack 과 같다) */
export const withBack = (path: string, listHref: string) => (listHref === "/todos" ? path : `${path}?back=${encodeURIComponent(listHref)}`);

/** 상세 · 등록 · 수정에서 돌아갈 목록 주소. TO-DO 목록 주소가 아니면(다른 곳으로 보내려는 값) 기본 목록으로 */
export function backHrefOf(raw: string | string[] | undefined): string {
  const value = typeof raw === "string" ? raw : "";
  return /^\/todos(\?[^#]*)?$/.test(value) ? value : "/todos";
}

/** 필터 · 건수를 바꾼다. 쪽은 1로 돌린다 */
export function withFilter(query: TodoListQuery, next: Partial<TodoListQuery>): TodoListQuery {
  return { ...query, ...next, page: 1 };
}

/** 고른 점포를 바꾼다. 비면 「전체」(주소에는 빈 storeIds — 헤더 범위로 다시 채우지 않는다) */
export const withPickedStores = (query: TodoListQuery, ids: number[]) => withFilter(query, { storeIds: ids, storesCleared: !ids.length, scope: null });

/** 헤더 범위로 점포 조건을 건다(목록에서 고른 점포는 비운다) */
export const withScopeCondition = (query: TodoListQuery, scope: Scope) => withFilter(query, { storeIds: [], storesCleared: false, scope });

/** 기본값과 다른 거르는 조건이 있는가. 빈 목록 문구를 가를 때 쓴다 — 쪽 · 건수 · 점포 「전체」(헤더 범위 전체 · 비운 것)는 조건이 아니다 */
export function hasTodoFilter(query: TodoListQuery): boolean {
  const scope = query.scope?.type === "ALL" ? null : query.scope;
  return toTodoListSearch({ ...query, scope, storesCleared: false, page: 1, pageSize: DEFAULT_TODO_LIST_QUERY.pageSize }) !== "";
}

/**
 * 쪽이 비었을 때 갈 주소. 1쪽이 아닌데 줄이 없으면(마지막 쪽의 마지막 줄을 지우고 돌아옴 · 손으로 친 쪽) 남은 마지막 쪽, 0건이면 1쪽.
 * 그대로 두면 되는 경우는 null — 조건은 그대로 둔다.
 */
export function emptyPageHref(query: TodoListQuery, rowCount: number, total: number): string | null {
  if (rowCount > 0 || query.page === 1) return null;
  return `/todos${toTodoListSearch({ ...query, page: Math.max(1, Math.ceil(total / query.pageSize)) })}`;
}
