// 직원 목록 · 상세의 타입과 조회 조건. 응답 타입은 whale-erp-api openapi 에서 생성한 것을 그대로 쓴다.
// api 를 부르는 함수는 staff-members-api.ts 에 있다 — 이 파일은 next/* 를 읽지 않아 node --test 가 바로 읽는다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { components } from "./api-types.generated.ts";

type Schemas = components["schemas"];

export type StaffJoinState = Schemas["StaffJoinState"];
export type EmploymentType = Schemas["EmploymentType"];
export type EmploymentStatus = Schemas["EmploymentStatus"];
export type ContractStatus = Schemas["ContractStatus"];

/**
 * 직원 목록 한 줄(GET /staff-members). isMasked 면 store 밖의 칸은 모두 null 이다 — staffMemberId 도 null(본사 제공 동의 없음).
 * invitation.canResend 는 재발송 버튼을 보일지, contract.updatedAt 은 「거부 · MM-DD」를 그리는 최종 수정 일시다.
 * retiredDate 는 퇴직일 YYYY-MM-DD — 재직이면서 값이 있으면 퇴직 예정이다.
 */
export type StaffMemberListItem = Schemas["StaffMemberListItemDto"];
export type StaffMemberListResponse = Schemas["StaffMemberListResponseDto"];
/** 직원 상세(GET /staff-members/:id, WHALEERP-599). 목록 한 줄과 같은 모양이다. */
export type StaffMember = StaffMemberListItem;
/** 퇴직 확인창의 미리 보기 — 퇴직일이 지나면 정리될 건수 */
export type RetirementPreview = Schemas["RetirementPreviewResponseDto"];

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
  /** 점포명에 맞는 점포 id. 필터가 로그인 정보의 점포 목록에서 찾아 넣는다(storeIdsByName). store 가 비면 쓰지 않는다 */
  storeIds: number[];
  /** 이름 · 휴대전화번호 검색어 */
  keyword: string;
  employmentTypes: EmploymentType[];
  joinGroups: JoinGroup[];
  employmentStatus: EmploymentStatusFilter;
  page: number;
  pageSize: PageSize;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 한국 날짜 YYYY-MM-DD. 서버가 UTC 로 돌아도 0시~9시에 날짜가 어긋나지 않게 한다. */
export function kstToday(now: Date = new Date()): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * 점포명 부분 일치로 점포 id 를 찾는다. 점포 목록은 로그인 정보의 관리 점포(useStores)다 — 점포 목록 api 는
 * 「점포 정보 관리」 메뉴 권한이 있어야 열려 직원 정보 관리만 가진 관리자가 쓸 수 없다. 로그인 뒤 새로 생긴 점포는 다시 로그인해야 잡힌다.
 */
export function storeIdsByName(stores: readonly { storeId: number; name: string }[], name: string): number[] {
  const needle = name.trim().toLowerCase();
  return stores.filter((s) => s.name.toLowerCase().includes(needle)).map((s) => s.storeId);
}

/**
 * GET /staff-members 쿼리. null 이면 api 를 부르지 않고 0건이다 — 묶음 · 고용형태를 하나도 고르지 않았거나 점포명에 맞는
 * 점포가 없을 때. api 는 빈 값을 400 으로 막고, 파라미터를 빼면 전체가 나와 「하나도 안 고름」이 「전체」가 된다.
 * 모두 고른 체크와 재직 상태 「전체」는 파라미터를 뺀다.
 */
export function staffListApiSearch(query: StaffListQuery): string | null {
  if (query.joinGroups.length === 0 || query.employmentTypes.length === 0) return null;
  if (query.store && query.storeIds.length === 0) return null;
  const params = new URLSearchParams();
  if (query.store) params.set("storeIds", query.storeIds.join(","));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.employmentTypes.length !== EMPLOYMENT_TYPES.length) params.set("employmentType", query.employmentTypes.join(","));
  if (query.joinGroups.length !== JOIN_GROUPS.length)
    params.set("joinState", query.joinGroups.flatMap((g) => JOIN_GROUP_STATES[g]).join(","));
  if (query.employmentStatus !== "ALL") params.set("employmentStatus", query.employmentStatus);
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  return params.toString();
}
