import type { AdminStatus } from "@/lib/platform-admins";
import { ADMIN_PAGE_SIZES, type AdminPageSize } from "../../lib/platform-admin-paging.ts";

// 목록 조건 · 쪽 · 쪽 건수 · 연 상세 · 수정은 주소(?keyword · roleGroupId · status · page · pageSize · admin · edit)에 둔다 — 새로 고쳐도, 링크를 나눠도 같은 화면이다.
// 상세 · 등록 · 수정은 따로 경로(/platform-admins/[id] 등)가 없는 슬라이드 패널이다(2026-10-08) — 상세는 ?admin= 으로 어느 계정인지 남기고,
// 그 위에 겹친 수정은 ?edit=1 로 남겨 브라우저 뒤로 가기가 수정 → 상세로 돌아오게 한다(2026-10-22 사용자 요청). 등록은 남기지 않는다.

export type AdminsQuery = {
  page: number;
  /** 한 쪽 건수 — 기본(20)이면 주소에 남기지 않는다 */
  pageSize: AdminPageSize;
  keyword?: string;
  roleGroupId?: number;
  /**
   * 하나만 고른 때 그 상태, 둘 다 끄면 NONE(결과 없음 — api 를 부르지 않고 빈 목록, 2026-10-27 사용자 지정). 둘 다 고르면 두지 않는다(전체).
   */
  status?: AdminStatus | "NONE";
  /** 상세를 연 계정 */
  admin?: number;
  /** 상세 위에 수정 패널을 열었다 — admin 이 있을 때만 참이다 */
  edit?: boolean;
};

type Params = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
const positiveInt = (v: string | undefined) => {
  const n = v && /^\d{1,9}$/.test(v) ? Number(v) : 0;
  return n >= 1 ? n : undefined;
};

export function parseAdminsQuery(params: Params): AdminsQuery {
  const status = one(params.status);
  // api 는 20자까지 받는다. 넘는 검색어는 400 이 되므로 잘라 둔다.
  const keyword = one(params.keyword)?.trim().slice(0, 20).trim() || undefined;
  const admin = positiveInt(one(params.admin));
  const pageSize = Number(one(params.pageSize));
  return {
    page: positiveInt(one(params.page)) ?? 1,
    pageSize: ADMIN_PAGE_SIZES.find((s) => s === pageSize) ?? ADMIN_PAGE_SIZES[0],
    keyword,
    roleGroupId: positiveInt(one(params.roleGroupId)),
    status: status === "ACTIVE" || status === "INACTIVE" || status === "NONE" ? status : undefined,
    admin,
    edit: admin !== undefined && one(params.edit) === "1" ? true : undefined,
  };
}

export function adminsHref(query: Partial<AdminsQuery>): string {
  const params = new URLSearchParams();
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.roleGroupId) params.set("roleGroupId", String(query.roleGroupId));
  if (query.status) params.set("status", query.status);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.pageSize && query.pageSize !== ADMIN_PAGE_SIZES[0]) params.set("pageSize", String(query.pageSize));
  if (query.admin) params.set("admin", String(query.admin));
  if (query.admin && query.edit) params.set("edit", "1");
  const search = params.toString();
  return `/platform-admins${search ? `?${search}` : ""}`;
}

/**
 * 수정 패널을 세울지. 주소에 ?edit=1 이 있어도 그 계정을 고칠 수 없거나(canUpdate — 메뉴 수정 권한에 더해 PA 는 PM 계정을
 * 고치지 못한다, platform-admin-actions.ts adminActionsOf), 상세를 못 불러왔거나(지운 계정 · 실패 띠), 화면에 남은
 * 상세가 주소의 계정이 아니면(다른 계정으로 옮기는 중 — 앞 상세를 붙잡아 둔다) 열지 않는다. 마지막 것이 빠지면 앞 계정의
 * 수정 폼이 다른 계정 주소 위에 열려 엉뚱한 계정을 고칠 수 있다. 없는 수정 패널 때문에 상세의 [닫기] · Esc 도 막히지 않는다.
 */
export function isEditOpen(
  query: Pick<AdminsQuery, "admin" | "edit">,
  canUpdate: boolean,
  shown: { admin: { adminAccountId: number } } | { failed: string } | null,
): boolean {
  return Boolean(query.edit && canUpdate && shown && "admin" in shown && shown.admin.adminAccountId === query.admin);
}
