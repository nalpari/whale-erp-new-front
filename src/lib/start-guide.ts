// 홈 [시작 가이드] 단계 — 로그인 역할로 갈래를 고른다(2026-11-04 사용자 지정, 쿠팡이츠 사장님 「시작 가이드」 목록처럼).
// BP 마스터 · BP 관리자는 「매장 사장님 | 프랜차이즈 본사」 탭으로 고르고(가맹 점포가 있으면 본사가 처음 값), 가맹 마스터 · 가맹 관리자는 「가맹점」 하나다.
// 단계를 누르면 그 화면으로 간다. 그 메뉴의 조회 권한이 없으면 흐리게 두고 누를 수 없다 — 숨기면 단계 번호가 빠져 순서가 어색하다.

export type GuideTrack = "STORE" | "HQ" | "FRANCHISEE";

export type GuideStep = {
  /** 「STEP 2」 · 하위 단계는 「2-1」 */
  label: string;
  title: string;
  /** 갈 화면(탭 BP 접두 없이) — 하위 단계를 가진 묶음 단계는 없다 */
  path?: string;
  /** 「선택」 꼬리표 — 하지 않아도 되는 단계 */
  optional?: boolean;
  /** 하위 단계(들여 쓴 작은 줄) */
  sub?: boolean;
  /** 단계 아래 회색 한 줄 */
  note?: string;
  /** 끝냈는지 볼 수 있는 단계 — 지금은 점포 하나라도 등록했는지(stores)만 본다(2026-11-04 사용자 지정) */
  doneWhen?: "stores";
};

export const TRACK_LABEL: Record<GuideTrack, string> = { STORE: "매장 사장님", HQ: "프랜차이즈 본사", FRANCHISEE: "가맹점" };

const ADMIN_STEPS = (adminTitle: string): GuideStep[] => [
  { label: "2-1", title: "권한 그룹 등록하기", path: "/bp-role-groups", sub: true },
  { label: "2-2", title: "메뉴 권한 설정하기", path: "/bp-role-groups", sub: true },
  { label: "2-3", title: adminTitle, path: "/bp-admins", sub: true },
];

export const GUIDE_STEPS: Record<GuideTrack, GuideStep[]> = {
  STORE: [
    { label: "STEP 1", title: "점포 등록하기", path: "/stores/new", doneWhen: "stores" },
    { label: "STEP 2", title: "함께 일할 관리자 추가하기", optional: true },
    ...ADMIN_STEPS("관리자 계정 등록하기"),
    { label: "STEP 3", title: "직원 초대 · 근로계약 보내기", path: "/staff-members" },
    { label: "STEP 4", title: "근무스케줄 짜기", path: "/work-schedules" },
    { label: "STEP 5", title: "출퇴근 확인하기", path: "/attendance-records" },
    { label: "STEP 6", title: "급여명세서 보내기", path: "/payslips" },
  ],
  HQ: [
    { label: "STEP 1", title: "점포 등록하기(직영 · 가맹 구분)", path: "/stores/new", doneWhen: "stores" },
    { label: "STEP 2", title: "본사 관리자 추가하기", optional: true },
    ...ADMIN_STEPS("BP 관리자 등록하기"),
    { label: "STEP 3", title: "가맹점주 계정 만들기" },
    { label: "3-1", title: "가맹 마스터 메뉴 권한 확인하기", path: "/bp-role-groups", sub: true },
    { label: "3-2", title: "가맹 마스터 등록하기(맡을 가맹 점포 지정)", path: "/bp-admins", sub: true },
    { label: "STEP 4", title: "직영점 직원 초대 · 근로계약 보내기", path: "/staff-members", note: "가맹점 직원은 가맹점주가 초대합니다." },
    { label: "STEP 5", title: "근무스케줄 · 출퇴근 확인하기", path: "/work-schedules" },
    { label: "STEP 6", title: "급여명세서 보내기 · 가맹점 현황 보기", path: "/payslips", note: "가맹점 직원 정보는 본사 제공에 동의한 직원만 보입니다." },
  ],
  FRANCHISEE: [
    { label: "STEP 1", title: "맡은 점포 확인하기", path: "/stores" },
    { label: "STEP 2", title: "가맹 관리자 등록하기", path: "/bp-admins", optional: true, note: "가맹 마스터만 등록할 수 있습니다." },
    { label: "STEP 3", title: "직원 초대 · 근로계약 보내기", path: "/staff-members" },
    { label: "STEP 4", title: "근무스케줄 짜기", path: "/work-schedules" },
    { label: "STEP 5", title: "출퇴근 확인하기", path: "/attendance-records" },
    { label: "STEP 6", title: "급여명세서 보내기", path: "/payslips" },
  ],
};

/** 로그인 역할과 점포로 처음 보일 갈래. 가맹 역할은 가맹점, 가맹 점포가 하나라도 있으면 본사, 그 밖은 매장 사장님 */
export function initialTrackOf(roleTypeCode: string, storeTypeCodes: readonly string[]): GuideTrack {
  if (roleTypeCode === "FM" || roleTypeCode === "FA") return "FRANCHISEE";
  return storeTypeCodes.includes("FRANCHISE") ? "HQ" : "STORE";
}

/** 이 역할이 고를 수 있는 갈래 — 가맹 역할은 가맹점 하나, BP 역할은 매장 사장님 · 본사 둘 */
export function tracksOf(roleTypeCode: string): GuideTrack[] {
  return roleTypeCode === "FM" || roleTypeCode === "FA" ? ["FRANCHISEE"] : ["STORE", "HQ"];
}
