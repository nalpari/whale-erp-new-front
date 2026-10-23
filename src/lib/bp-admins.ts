// BP 관리자 계정 데이터 접근(/bp-admins, MN000012). api 는 whale-erp-api `/bp-admins` 다.
// 대상 BP 는 화면 주소(/bp/{id}/bp-admins)에서 proxy 가 실은 헤더를 authHeaders() 가 X-Bp-Code-Id 로 넘긴다 — 함수에 BP 를 넘기지 않는다.
// 역할 규칙(누가 누구를 보고 고치는지)은 api 가 판정하고, 상세의 actions 로 화면에 알려 준다 — 화면은 미리 숨기거나 막기만 한다.
import { authHeaders, request } from "./api";
// 이력 팝업(platform-admins/history-dialog.tsx)을 함께 써서 한 쪽 건수도 같은 값을 쓴다
import { HISTORY_PAGE_SIZE } from "./platform-admin-paging";

// shortcut: api 의 bp-admins 모듈이 아직 main 에 없어 작업 지시서의 DTO 를 손으로 옮겼다 — api 가 머지되면 pnpm openapi:types 로
// 만든 components["schemas"] 로 바꾸고 이 주석을 지운다(플랜 「api 머지 뒤」).
export type BpAdminRoleType = "BA" | "FM" | "FA";
export type BpAdminStatus = "ACTIVE" | "INACTIVE";

export type BpAdminRoleGroup = { roleGroupId: number; roleCode: string; name: string; roleTypeCode: BpAdminRoleType };

export type BpAdmin = {
  adminAccountId: number;
  loginId: string;
  name: string | null;
  roleTypeCode: BpAdminRoleType;
  roleGroup: BpAdminRoleGroup;
  accountStatus: BpAdminStatus;
  isAllStores: boolean;
  /** 전체 점포면 0 */
  storeCount: number;
  createdAt: string;
  lastLoginAt: string | null;
  isInitialPasswordUnsent: boolean;
};
export type BpAdminList = { items: BpAdmin[]; total: number; inactiveCount: number };

export type BpAdminStore = { storeId: number; storeCode: string; name: string; storeStatusCode: string; /** 보는 사람의 관리 범위 밖 */ isOutOfScope: boolean };

export type BpAdminActions = {
  isSelf: boolean;
  canUpdate: boolean;
  canResetPassword: boolean;
  canChangeScope: boolean;
  canChangeRoleGroup: boolean;
};

export type BpAdminDetail = BpAdmin & {
  phone: string | null;
  email: string | null;
  statusChangedAt: string | null;
  createdByName: string | null;
  updatedAt: string;
  updatedByName: string | null;
  /** 소속 BP 의 지금 점포 수 — 「전체 점포」 계정의 안내 문구용 */
  bpStoreCount: number;
  /** 일부 점포일 때 매핑 점포 */
  stores: BpAdminStore[];
  /** 가맹 관리자만 — 연결 가맹 마스터 */
  franchiseMaster: { adminAccountId: number; loginId: string; name: string | null } | null;
  actions: BpAdminActions;
};

export type BpAdminStoreOption = {
  storeId: number;
  storeCode: string;
  name: string;
  storeTypeCode: "DIRECT" | "FRANCHISE";
  storeStatusCode: string;
};

export type BpAdminHistory = {
  changeId: number;
  field: string;
  beforeValue: string | null;
  afterValue: string | null;
  changedAt: string;
  changedByName: string | null;
};
export type BpAdminHistoryList = { items: BpAdminHistory[]; total: number };

export type CreateBpAdminInput = {
  loginId: string;
  name: string;
  phone: string;
  email: string;
  roleTypeCode: BpAdminRoleType;
  roleGroupId: number;
  isAllStores: boolean;
  /** 전체 점포면 빈 배열 */
  storeIds: number[];
};
export type UpdateBpAdminInput = {
  name: string;
  phone: string;
  email: string;
  accountStatus: BpAdminStatus;
  roleGroupId: number;
  isAllStores: boolean;
  /** 보는 사람의 관리 범위 안 점포만. 범위 밖 매핑은 api 가 그대로 둔다 */
  storeIds: number[];
  /** 상세에서 받은 값 — 그 사이 다른 사람이 고쳤으면 409 */
  updatedAt: string;
};

export type BpAdminListQuery = {
  page: number;
  pageSize: number;
  keyword?: string;
  roleGroupId?: number;
  accountStatus?: BpAdminStatus;
  /** 고른 점포 — 그 점포를 관리하는 계정(전체 점포 계정 포함) */
  storeIds: number[];
  /** 헤더 범위가 직영 · 가맹 전체일 때 점포를 풀지 않고 유형으로 거른다 */
  storeTypeCode?: "DIRECT" | "FRANCHISE";
};

const json = async (method: "GET" | "POST" | "PUT", body?: unknown): Promise<RequestInit> => ({
  method,
  headers: { ...(await authHeaders()), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
  body: body === undefined ? undefined : JSON.stringify(body),
});

/** GET /bp-admins — 대상 BP 의 BA · FM · FA 계정, 등록일시 최신순. 가맹 쪽 사용자는 본인과 매핑 점포가 겹치는 FA 만 받는다. */
export async function getBpAdmins(query: BpAdminListQuery): Promise<BpAdminList> {
  const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) });
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.roleGroupId) params.set("roleGroupId", String(query.roleGroupId));
  if (query.accountStatus) params.set("accountStatus", query.accountStatus);
  if (query.storeIds.length) params.set("storeIds", query.storeIds.join(","));
  if (query.storeTypeCode) params.set("storeTypeCode", query.storeTypeCode);
  return request(`/bp-admins?${params}`, await json("GET"));
}

/** GET /bp-admins/role-groups — 보는 사람이 고를 수 있는 BA · FM · FA 권한 그룹(필터 · 폼 선택지). */
export async function getBpAdminRoleGroups(): Promise<BpAdminRoleGroup[]> {
  return (await request<{ items: BpAdminRoleGroup[] }>("/bp-admins/role-groups", await json("GET"))).items;
}

/**
 * GET /bp-admins/store-options — 보는 사람의 관리 범위 안에서 고를 수 있는 점포만. 폐점 · (가맹 마스터면) 다른 가맹 마스터 담당은 빠진다(2026-10-23).
 * 수정할 때는 고치는 계정(adminAccountId)을 함께 보낸다 — 그 계정이 맡은 점포를 「다른 가맹 마스터 담당」으로 빼지 않게(지시서 추가 요청, 2026-10-23).
 */
export async function getBpAdminStoreOptions(roleTypeCode: BpAdminRoleType, adminAccountId?: number): Promise<BpAdminStoreOption[]> {
  const params = new URLSearchParams({ roleTypeCode });
  if (adminAccountId) params.set("adminAccountId", String(adminAccountId));
  return (await request<{ items: BpAdminStoreOption[] }>(`/bp-admins/store-options?${params}`, await json("GET"))).items;
}

/** GET /bp-admins/{id} — 볼 수 없는 계정 · BP 마스터 · 플랫폼 계정은 404. */
export async function getBpAdmin(id: number): Promise<BpAdminDetail> {
  return request(`/bp-admins/${id}`, await json("GET"));
}

/** GET /bp-admins/{id}/histories — 변경 이력, 최신순. */
export async function getBpAdminHistories(id: number, page = 1): Promise<BpAdminHistoryList> {
  return request(`/bp-admins/${id}/histories?page=${page}&pageSize=${HISTORY_PAGE_SIZE}`, await json("GET"));
}

/** GET /bp-admins/login-id-availability — 지우거나 탈퇴한 계정의 아이디도 쓸 수 없다. 등록 권한이 필요하다. */
export async function checkBpAdminLoginIdAvailable(loginId: string): Promise<boolean> {
  const params = new URLSearchParams({ loginId });
  return (await request<{ available: boolean }>(`/bp-admins/login-id-availability?${params}`, await json("GET"))).available;
}

/** POST /bp-admins — 사용으로 만들고 초기 비밀번호를 메일로만 보낸다. 메일이 실패해도 계정은 만들어진다. */
export async function createBpAdmin(input: CreateBpAdminInput): Promise<{ adminAccountId: number; isMailSent: boolean }> {
  return request("/bp-admins", await json("POST", input));
}

/** PUT /bp-admins/{id} — 상세에서 받은 updatedAt 을 함께 보낸다. */
export async function updateBpAdmin(id: number, input: UpdateBpAdminInput): Promise<void> {
  await request(`/bp-admins/${id}`, await json("PUT", input));
}

/** POST /bp-admins/{id}/password-reset — 새 초기 비밀번호를 그 계정 이메일로만 보낸다. 미사용 계정도 된다. */
export async function resetBpAdminPassword(id: number): Promise<{ isMailSent: boolean; updatedAt: string }> {
  return request(`/bp-admins/${id}/password-reset`, await json("POST"));
}
