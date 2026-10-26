// 직원 목록 · 상세의 타입과 조회 조건. 응답 타입은 whale-erp-api openapi 에서 생성한 것을 그대로 쓴다.
// api 를 부르는 함수는 staff-members-api.ts 에 있다 — 이 파일은 next/* 를 읽지 않아 node --test 가 바로 읽는다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { components } from "./api-types.generated.ts";
import type { Scope } from "./browser-storage.ts";
import type { EnumValue } from "./enums.ts";

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
/** 직원 상세(GET /staff-members/:id, WHALEERP-599). 목록 한 줄에 계정 이메일(email)을 더한 모양이다(WHALEERP-177). email 은 상세를 볼 수 있는 관리자(조회 권한)에게 나오고, 가입 전 · 탈퇴 · 퇴직, 본사 역할이 동의로만 보는 가맹 점포 직원이면 null(WHALEERP-180, 2026-10-16 노영주). */
export type StaffMember = Schemas["StaffMemberDetailResponseDto"];
/** 퇴직 확인창의 미리 보기 — 퇴직일이 지나면 정리될 건수 */
export type RetirementPreview = Schemas["RetirementPreviewResponseDto"];

/** 이메일이 없을 때 「가입 전」으로 묶는 가입 상태 — 계정이 아직 없는 초안 · 초대 발송. 화면 문구라 enum 한글을 쓰지 않는다. */
const NOT_JOINED_YET: ReadonlySet<StaffJoinState> = new Set(["DRAFT", "INVITED"]);

/**
 * 상세 기본 정보의 「이메일」 칸. 이메일은 회원 ID 라 보이기만 하고 어디에서도 고치지 못한다(ACC-17, WHALEERP-180).
 * 없을 때 초안 · 초대 발송은 「가입 전」, 나머지 가입 전 상태는 api enum(GET /enums/StaffJoinState)의 한글이다 — 초대 만료 · 거절은
 * 이미 계정이 있는 직원의 소속 추가 확인 · 복귀 확인에서도 생기고, 연결 보류 · 소속 추가 확인 · 복귀 확인은 계정이 있는 직원이라
 * 「가입 전」이라 하면 가입하라고 잘못 안내하게 된다. 가입 완료(퇴직 · 탈퇴 · 본사 역할이 보는 가맹 점포 직원)나 가입 상태를 모르면
 * 「-」다 — 탈퇴와 본사 미제공은 응답만으로 확실히 가를 수 없어 짐작해 적지 않는다(2026-10-16 노영주). enum 을 받지 못했거나
 * 목록에 없는 값도 영문 값 대신 「-」다.
 */
export function staffEmailText(staff: Pick<StaffMember, "email" | "joinState">, joinStateLabels: readonly EnumValue[]): string {
  if (staff.email) return staff.email;
  if (!staff.joinState || staff.joinState === "JOINED") return "-";
  if (NOT_JOINED_YET.has(staff.joinState)) return "가입 전";
  return joinStateLabels.find((v) => v.value === staff.joinState)?.label ?? "-";
}

/**
 * 상세 기본 정보의 「본사 제공 동의」 칸(WHALEERP-184 완료 조건 8, ATT-30). 가맹 점포 직원만 동의 · 미동의 값이 오고 직영 점포 직원은 null 이라
 * 줄을 그리지 않는다(null 을 돌려준다). 한글은 api enum(GET /enums/HqSharingConsentState)이고, 받지 못했거나 목록에 없는 값은 영문 대신 「-」다.
 * 값은 계정의 동의라 소속마다 다르지 않다. 본사 역할은 미동의 직원 상세가 404 라 늘 동의를 본다.
 */
export function hqSharingConsentText(staff: Pick<StaffMember, "hqSharingConsent">, labels: readonly EnumValue[]): string | null {
  if (staff.hqSharingConsent === null) return null;
  return labels.find((v) => v.value === staff.hqSharingConsent)?.label ?? "-";
}

/**
 * 상세 응답의 재직 이력 칸(WHALEERP-615)을 채운다. 칸이 없는 응답(api #136 배포 전 서버)은 이은 레코드가 없는 것으로 본다 — front 가
 * 먼저 배포돼도 `previousRecords` · `laterRecords` 를 읽는 곳이 오류가 되지 않게 응답을 받는 자리(getStaffMember)에서 한 번 맞춘다.
 */
export function withEmploymentHistory(staff: StaffMember): StaffMember {
  const raw = staff as Partial<Pick<StaffMember, "previousRecords" | "laterRecords">> & StaffMember;
  return { ...staff, previousRecords: raw.previousRecords ?? [], laterRecords: raw.laterRecords ?? [] };
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

/**
 * 직원 목록 조회 조건. 점포 조건은 근로계약 목록(contract-list.ts) · 점포 정보 관리(stores-query.ts)와 같은 짝이다(상단 점포 범위 ↔ 목록 점포 필터):
 * 목록에서 고른 점포(storeIds — 주소 storeIds=3,7), 목록에서 비운 「전체」(storesCleared — 주소 storeIds=), 헤더 범위(scope — 주소
 * scope=ALL · DIRECT · FRANCHISE · STORE:12, 헤더가 메뉴로 이동할 때 싣는다). 셋 다 없으면 정해지지 않은 것이라 필터가 헤더 범위로 채운다.
 */
export interface StaffListQuery {
  /** 목록에서 고른 점포. 비었으면 storesCleared · scope 로 정한다 */
  storeIds: number[];
  /** 목록에서 비운 「전체」(주소에는 빈 storeIds) — 헤더 범위가 아니다 */
  storesCleared: boolean;
  /** 헤더 범위(주소의 scope). 고른 점포 · 빈 storeIds 가 있으면 null */
  scope: Scope | null;
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
 * 주소에서 읽을 때 남기는 점포 수 — api 상한(1000)과 같다. 고르기는 막지 않는다 — 넘친 것은 주소를 다시 읽을 때 뒤가 말없이 빠진다
 * (근로계약 · 점포 정보 관리와 같은 한계).
 */
export const MAX_STORE_IDS = 1000;

/** 점포 조건에서 api 에 보낼 점포 id — 고른 점포, 없으면 범위가 점포 하나일 때 그 점포. 칩도 이 id 로 그린다 */
export const pickedStoreIdsOf = (query: Pick<StaffListQuery, "storeIds" | "scope">): number[] =>
  query.storeIds.length ? query.storeIds : query.scope?.type === "STORE" ? [query.scope.storeId] : [];

/**
 * GET /staff-members 쿼리. null 이면 api 를 부르지 않고 0건이다 — 묶음 · 고용형태를 하나도 고르지 않았을 때. api 는 빈 값을 400 으로
 * 막고, 파라미터를 빼면 전체가 나와 「하나도 안 고름」이 「전체」가 된다.
 * 점포는 고른 점포 · 점포 하나 범위면 storeIds(쉼표), 직영 · 가맹 범위면 점포를 풀지 않고 storeTypes 로 보낸다 — 그 유형의 폐점 점포는 api 가
 * 뺀다(칩과 같은 점포). 범위 「전체」 · 비운 「전체」(storesCleared — 범위가 함께 있어도) · 정해지지 않음은 점포 조건이 없다(업무 범위 전체). 업무 범위 밖 id 는 api 가 조용히 뺀다.
 * 모두 고른 체크와 재직 상태 「전체」는 파라미터를 뺀다.
 */
export function staffListApiSearch(query: StaffListQuery): string | null {
  if (query.joinGroups.length === 0 || query.employmentTypes.length === 0) return null;
  const params = new URLSearchParams();
  if (!query.storesCleared) {
    const storeIds = pickedStoreIdsOf(query);
    if (storeIds.length) params.set("storeIds", storeIds.join(","));
    else if (query.scope?.type === "DIRECT" || query.scope?.type === "FRANCHISE") params.set("storeTypes", query.scope.type);
  }
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.employmentTypes.length !== EMPLOYMENT_TYPES.length) params.set("employmentType", query.employmentTypes.join(","));
  if (query.joinGroups.length !== JOIN_GROUPS.length)
    params.set("joinState", query.joinGroups.flatMap((g) => JOIN_GROUP_STATES[g]).join(","));
  if (query.employmentStatus !== "ALL") params.set("employmentStatus", query.employmentStatus);
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  return params.toString();
}
