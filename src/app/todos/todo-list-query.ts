// TO-DO 목록 URL 쿼리 ↔ 조회 조건 ↔ api 쿼리. 화면 상태는 URL 에만 둔다(직원 목록 staff-list-query.ts 와 같은 규칙).
// 기본값은 URL 에서 빼고, 이상한 값은 오류 없이 그 칸만 기본값으로 돌린다. 상태 체크는 모르는 값만 버린다 — 남는 게 없으면 0건이다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { components } from "../../lib/api-types.generated.ts";
import { PAGE_SIZES, type PageSize } from "../../lib/staff-members.ts";

export type TodoStatus = components["schemas"]["TodoStatus"];
export type TodoAssigneeType = components["schemas"]["TodoAssigneeType"];

/** 화면 순서. 한글은 getEnum("TodoStatus") 로 받는다 */
export const TODO_STATUSES: readonly TodoStatus[] = ["PENDING", "IN_PROGRESS", "DONE"];
const ASSIGNEE_TYPES: readonly TodoAssigneeType[] = ["INDIVIDUAL", "ALL"];

export interface TodoListQuery {
  /** 근무지. null 이면 업무 범위 전체 */
  storeId: number | null;
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
  storeId: null,
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

/** 있는 날짜(YYYY-MM-DD)만. 2026-02-30 같은 값은 api 가 400 이라 여기서 버린다 */
function dateOf(raw: string | undefined): string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  const d = new Date(`${raw}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === raw ? raw : "";
}

export function parseTodoListQuery(raw: RawSearch): TodoListQuery {
  const storeId = first(raw.storeId);
  const status = first(raw.status);
  const assigneeType = first(raw.assigneeType);
  const page = Number(first(raw.page));
  const pageSize = Number(first(raw.pageSize));
  const picked = status === undefined ? null : new Set(status.split(","));
  return {
    storeId: storeId && /^[1-9]\d*$/.test(storeId) && Number(storeId) <= MAX_ID ? Number(storeId) : null,
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
  if (query.storeId !== null) params.set("storeId", String(query.storeId));
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
 * GET /todos 쿼리. 상태는 `status=A&status=B` 로 되풀이하고 셋 다면 뺀다. 0건이 확실한 조건(상태를 하나도 안 고름 · 기간이 거꾸로)이면
 * null — api 는 빈 상태를 「전체」로 읽어 반대가 된다.
 */
export function todoListApiSearch(query: TodoListQuery): string | null {
  if (query.statuses.length === 0) return null;
  if (query.dueDateFrom && query.dueDateTo && query.dueDateFrom > query.dueDateTo) return null;
  const params = new URLSearchParams();
  if (query.storeId !== null) params.set("storeId", String(query.storeId));
  if (query.statuses.length !== TODO_STATUSES.length) for (const s of query.statuses) params.append("status", s);
  if (query.assigneeType) params.set("assigneeType", query.assigneeType);
  if (query.urgentOnly) params.set("isUrgent", "true");
  if (query.dueDateFrom) params.set("dueDateFrom", query.dueDateFrom);
  if (query.dueDateTo) params.set("dueDateTo", query.dueDateTo);
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  return params.toString();
}

/** 상세의 「목록」 주소. 받은 쿼리를 목록과 같은 규칙으로 걸러 다시 만든다 — 모르는 이름 · 이상한 값은 따라오지 않는다 */
export function todoListHref(raw: RawSearch): string {
  return `/todos${toTodoListSearch(parseTodoListQuery(raw))}`;
}

/** 필터 · 건수를 바꾼다. 쪽은 1로 돌린다 */
export function withFilter(query: TodoListQuery, next: Partial<TodoListQuery>): TodoListQuery {
  return { ...query, ...next, page: 1 };
}

/** 기본값과 다른 거르는 조건이 있는가. 빈 목록 문구를 가를 때 쓴다 — 쪽 · 건수는 조건이 아니다 */
export function hasTodoFilter(query: TodoListQuery): boolean {
  return toTodoListSearch({ ...query, page: 1, pageSize: DEFAULT_TODO_LIST_QUERY.pageSize }) !== "";
}

/**
 * 쪽이 비었을 때 갈 주소. 1쪽이 아닌데 줄이 없으면(마지막 쪽의 마지막 줄을 지우고 돌아옴 · 손으로 친 쪽) 남은 마지막 쪽, 0건이면 1쪽.
 * 그대로 두면 되는 경우는 null — 조건은 그대로 둔다.
 */
export function emptyPageHref(query: TodoListQuery, rowCount: number, total: number): string | null {
  if (rowCount > 0 || query.page === 1) return null;
  return `/todos${toTodoListSearch({ ...query, page: Math.max(1, Math.ceil(total / query.pageSize)) })}`;
}
