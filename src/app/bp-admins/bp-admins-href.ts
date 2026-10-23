// BP 관리자 목록 주소 ↔ 쿼리 객체. 검색 조건 · 쪽 · 연 상세 · 수정은 주소에만 둔다 — 새로 고쳐도, 링크를 나눠도 같은 화면이다.
// 상세는 ?admin=, 그 위에 겹친 수정은 ?edit=1 로 남겨 브라우저 뒤로 가기가 수정 → 상세 → 목록 순으로 접힌다(플랫폼 관리자와 같다). 등록은 남기지 않는다.
// 점포 조건(storeIds · storesCleared · scope)은 점포 목록과 같은 네 가지다 — 뜻은 stores-query.ts 의 표를 본다.
// 이 파일의 주소는 옛 경로(/bp-admins…)다. 탭 BP(/bp/{id})는 이동할 때 bpPath(클라이언트)로 씌운다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { Scope } from "../../lib/browser-storage.ts";
import type { BpAdminListQuery, BpAdminStatus } from "../../lib/bp-admins.ts";
import { BP_ADMIN_PAGE_SIZES, type BpAdminPageSize } from "../../lib/bp-admin-paging.ts";
import { SCOPE_PARAM, scopeKeyOf, scopeOfParam } from "../../lib/store-scope.ts";
import { MAX_PICKED_STORES, pickedIdsOf } from "../stores/stores-query.ts";

export const PATH = "/bp-admins";

export type BpAdminsQuery = {
  page: number;
  pageSize: BpAdminPageSize;
  keyword?: string;
  roleGroupId?: number;
  accountStatus?: BpAdminStatus;
  storeIds: number[];
  storesCleared: boolean;
  scope: Scope | null;
  /** 상세를 연 계정 */
  admin?: number;
  /** 상세 위에 수정 패널을 열었다 — admin 이 있을 때만 참이다 */
  edit?: boolean;
};

type Params = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
/** int4 양의 정수만 — 9자리까지 받아 api 의 정수 범위를 넘기지 않는다 */
const positiveInt = (v: string | undefined) => {
  const n = v && /^\d{1,9}$/.test(v) ? Number(v) : 0;
  return n >= 1 ? n : undefined;
};

export function parseBpAdminsQuery(params: Params): BpAdminsQuery {
  const status = one(params.accountStatus);
  const pageSize = Number(one(params.pageSize));
  const rawStoreIds = one(params.storeIds);
  const storeIds = [...new Set((rawStoreIds ?? "").split(",").map(positiveInt).filter((id) => id !== undefined))].slice(0, MAX_PICKED_STORES);
  const admin = positiveInt(one(params.admin));
  return {
    page: positiveInt(one(params.page)) ?? 1,
    pageSize: BP_ADMIN_PAGE_SIZES.find((s) => s === pageSize) ?? BP_ADMIN_PAGE_SIZES[0],
    // api 는 20자까지 받는다. 넘는 검색어는 400 이 되므로 잘라 둔다.
    keyword: one(params.keyword)?.trim().slice(0, 20).trim() || undefined,
    roleGroupId: positiveInt(one(params.roleGroupId)),
    accountStatus: status === "ACTIVE" || status === "INACTIVE" ? status : undefined,
    storeIds,
    // 빈 storeIds 는 목록에서 비운 「전체」다 — 헤더 범위가 아니다. 고른 점포가 있으면 범위는 쓰지 않는다
    storesCleared: rawStoreIds !== undefined && !storeIds.length,
    scope: rawStoreIds !== undefined ? null : scopeOfParam(one(params[SCOPE_PARAM])),
    admin,
    edit: admin !== undefined && one(params.edit) === "1" ? true : undefined,
  };
}

/** 화면 주소(옛 경로). 기본값은 뺀다. */
export function bpAdminsHref(query: Partial<BpAdminsQuery>): string {
  const params = new URLSearchParams();
  if (query.storeIds?.length) params.set("storeIds", query.storeIds.join(","));
  else if (query.storesCleared) params.set("storeIds", "");
  else if (query.scope) params.set(SCOPE_PARAM, scopeKeyOf(query.scope));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.roleGroupId) params.set("roleGroupId", String(query.roleGroupId));
  if (query.accountStatus) params.set("accountStatus", query.accountStatus);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.pageSize && query.pageSize !== BP_ADMIN_PAGE_SIZES[0]) params.set("pageSize", String(query.pageSize));
  if (query.admin) params.set("admin", String(query.admin));
  if (query.admin && query.edit) params.set("edit", "1");
  const search = params.toString();
  return `${PATH}${search ? `?${search}` : ""}`;
}

/** api 조회 조건 — 고른 점포는 storeIds, 헤더 범위가 직영 · 가맹 전체면 점포를 풀지 않고 storeTypeCode 로 보낸다(점포 목록과 같다). */
export function bpAdminListQueryOf(query: BpAdminsQuery): BpAdminListQuery {
  const { page, pageSize, keyword, roleGroupId, accountStatus } = query;
  const scopeType = !query.storeIds.length && (query.scope?.type === "DIRECT" || query.scope?.type === "FRANCHISE") ? query.scope.type : undefined;
  return { page, pageSize, keyword, roleGroupId, accountStatus, storeIds: pickedIdsOf(query), storeTypeCode: scopeType };
}

/** 필터 · 건수를 바꾼다. 쪽은 1로 돌리고 연 상세는 닫는다 — 4쪽에서 거르면 빈 쪽이 보인다. */
export const withBpAdminFilter = (
  query: BpAdminsQuery,
  next: Partial<Pick<BpAdminsQuery, "keyword" | "roleGroupId" | "accountStatus" | "pageSize">>,
): BpAdminsQuery => ({ ...query, ...next, page: 1, admin: undefined, edit: undefined });

/** 고른 점포를 바꾼다. 비면 「전체」(주소에는 빈 storeIds — 헤더 범위로 다시 채우지 않는다). */
export const withPickedStores = (query: BpAdminsQuery, ids: number[]): BpAdminsQuery => ({
  ...withBpAdminFilter(query, {}),
  storeIds: ids,
  storesCleared: !ids.length,
  scope: null,
});

/** 헤더 범위로 점포 조건을 건다(목록에서 고른 점포는 비운다). */
export const withScopeCondition = (query: BpAdminsQuery, scope: Scope): BpAdminsQuery => ({
  ...withBpAdminFilter(query, {}),
  storeIds: [],
  storesCleared: false,
  scope,
});
