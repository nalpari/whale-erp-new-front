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
  /** canResend — 재발송 버튼을 보일지. 간격 제한 없이 상태로만 정한다(api) */
  invitation: { invitationType: string; status: string; lastSentAt: string; expiresAt: string; canResend: boolean } | null;
  linkHold: { linkHoldId: number; mismatchReason: string; verifiedPhoneLast4: string; heldAt: string } | null;
  /** updatedAt — 최종 수정 일시. 거부일을 따로 저장하지 않아 「거부 · MM-DD」를 이 값으로 그린다 */
  contract: {
    contractId: number;
    status: ContractStatus | null;
    signDeadlineAt: string | null;
    endDate: string | null;
    updatedAt: string | null;
  } | null;
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
