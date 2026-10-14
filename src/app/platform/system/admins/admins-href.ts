import type { AdminStatus } from "@/lib/platform-admins";

// 목록 조건 · 쪽 · 연 상세는 주소(?keyword · roleGroupId · status · page · admin)에 둔다 — 새로 고쳐도, 링크를 나눠도 같은 화면이다.
// 상세 · 등록 · 수정은 따로 주소가 없는 슬라이드 패널이다(2026-10-08) — 상세만 ?admin= 으로 어느 계정인지 남긴다.

export type AdminsQuery = {
  page: number;
  keyword?: string;
  roleGroupId?: number;
  /** 하나만 고른 때만 둔다. 둘 다 고르거나 둘 다 끄면 전체(사용 · 미사용)다. */
  status?: AdminStatus;
  /** 상세를 연 계정 */
  admin?: number;
  /** 개발 중 조회만 권한 보기(current-permission.ts) */
  permission?: "view";
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
  return {
    page: positiveInt(one(params.page)) ?? 1,
    keyword,
    roleGroupId: positiveInt(one(params.roleGroupId)),
    status: status === "ACTIVE" || status === "INACTIVE" ? status : undefined,
    admin: positiveInt(one(params.admin)),
    permission: params.permission === "view" ? "view" : undefined,
  };
}

export function adminsHref(query: Partial<AdminsQuery>): string {
  const params = new URLSearchParams();
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.roleGroupId) params.set("roleGroupId", String(query.roleGroupId));
  if (query.status) params.set("status", query.status);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.admin) params.set("admin", String(query.admin));
  if (query.permission) params.set("permission", query.permission);
  const search = params.toString();
  return `/platform/system/admins${search ? `?${search}` : ""}`;
}
