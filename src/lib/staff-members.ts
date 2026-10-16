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
/** 직원 상세(GET /staff-members/:id, WHALEERP-599). 목록 한 줄에 계정 이메일(email)을 더한 모양이다(WHALEERP-177). email 은 링크 발송과 같은 기준이라 가입 전 · 탈퇴 · 퇴직, 수정 권한 없음, 본사 역할이 동의로만 보는 가맹 점포 직원이면 null. */
export type StaffMember = Schemas["StaffMemberDetailResponseDto"];
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
  /**
   * 점포명에 맞는 점포 id. 필터가 로그인 정보의 점포 목록에서 찾아 넣는다(storeIdsByName). store 가 비면 쓰지 않는다.
   * null 은 점포명만 있고 아직 찾지 않은 것(storeIds 없이 들어온 주소) — 필터가 열리며 채운다.
   */
  storeIds: number[] | null;
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

/** api 가 한 번에 받는 점포 id 수(StaffMemberListQueryDto @ArrayMaxSize). 넘으면 400 이다. */
export const MAX_STORE_IDS = 500;

/** 점포명에 맞는 점포가 api 상한을 넘었는가. 잘라 보내면 일부 점포가 조용히 빠지므로 목록 대신 좁혀 달라고 한다. */
export const tooManyStores = (query: StaffListQuery) => !!query.store && (query.storeIds?.length ?? 0) > MAX_STORE_IDS;

/**
 * 목록이 비었을 때 기본 문구 대신 보일 것. 점포 id 를 아직 찾지 않은 주소는 필터가 곧 채우므로 「없음」으로 깜빡이지 않게 찾는 중이라 하고,
 * 점포가 너무 많으면 좁혀 달라고 한다. 그 밖은 undefined(표의 기본 문구).
 */
export function staffListEmptyMessage(query: StaffListQuery): string | undefined {
  if (query.store && query.storeIds === null) return "점포를 찾는 중입니다.";
  if (tooManyStores(query)) return `점포명에 맞는 점포가 ${MAX_STORE_IDS}곳을 넘습니다. 점포명을 더 좁혀 주세요.`;
  return undefined;
}

/**
 * GET /staff-members 쿼리. null 이면 api 를 부르지 않고 0건이다 — 묶음 · 고용형태를 하나도 고르지 않았거나 점포명에 맞는
 * 점포가 없을 때. api 는 빈 값을 400 으로 막고, 파라미터를 빼면 전체가 나와 「하나도 안 고름」이 「전체」가 된다.
 * 점포 id 를 아직 찾지 않았거나(null) 상한을 넘어도 부르지 않는다(tooManyStores).
 * 모두 고른 체크와 재직 상태 「전체」는 파라미터를 뺀다.
 */
export function staffListApiSearch(query: StaffListQuery): string | null {
  if (query.joinGroups.length === 0 || query.employmentTypes.length === 0) return null;
  if (query.store && (!query.storeIds || query.storeIds.length === 0 || tooManyStores(query))) return null;
  const params = new URLSearchParams();
  if (query.store && query.storeIds) params.set("storeIds", query.storeIds.join(","));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.employmentTypes.length !== EMPLOYMENT_TYPES.length) params.set("employmentType", query.employmentTypes.join(","));
  if (query.joinGroups.length !== JOIN_GROUPS.length)
    params.set("joinState", query.joinGroups.flatMap((g) => JOIN_GROUP_STATES[g]).join(","));
  if (query.employmentStatus !== "ALL") params.set("employmentStatus", query.employmentStatus);
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  return params.toString();
}
