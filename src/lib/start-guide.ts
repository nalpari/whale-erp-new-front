// 홈 [시작 가이드] 단계 — 로그인 역할로 갈래를 고른다(2026-11-04 사용자 지정, 쿠팡이츠 사장님 「시작 가이드」 목록처럼).
// BP 마스터 · BP 관리자는 「매장 사장님 | 프랜차이즈 본사」 탭으로 고르고(가맹 점포가 있으면 본사가 처음 값), 가맹 마스터 · 가맹 관리자는 「가맹점」 하나다.
// 단계를 누르면 시작 가이드 화면(/start-guide)의 그 단계 설명으로 간다(2026-11-11 사용자 지정 — 전엔 그 화면으로 바로 갔다).
// 실제 화면은 설명 안 [OOO로 가기]로 가고, 그 메뉴의 조회 권한이 없으면 그 버튼만 흐리게 둔다.

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
    { label: "STEP 4", title: "근무스케줄 등록하기", path: "/work-schedules" },
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

export const isGuideTrack = (value: string | null): value is GuideTrack => value === "STORE" || value === "HQ" || value === "FRANCHISEE";

/** 단계 번호 — 「STEP 2」 → "2", 하위 단계 「2-1」 → 묶음 단계 "2" */
export const stepNumberOf = (step: GuideStep) => (step.sub ? step.label.split("-")[0] : step.label.replace("STEP ", ""));

// ── 시작 가이드 화면(/start-guide)의 단계 설명(2026-11-11 사용자 지정) ──
// 문구는 실제 화면의 버튼 · 칸 이름을 그대로 쓴다(store-form-view · role-form · role-menu-dialog · admin-form-panel · contract-form ·
// schedule-form · schedule-copy · attendance-fix-list · payslip-draft-dialog · payslip-review). 화면 이름이 바뀌면 여기도 고친다.
// 메뉴 이름은 적지 않는다 — [OOO로 가기] 버튼이 메뉴 트리에서 읽는다(BP 마다 메뉴 이름이 다를 수 있다).

/** 화면 예시 그림 종류(guide-mocks.tsx) */
export type GuideMockKind =
  | "store-form"
  | "biz-verify"
  | "store-list"
  | "role-group"
  | "role-menu"
  | "admin-form"
  | "franchise-master"
  | "contract"
  | "staff-app"
  | "schedule"
  | "schedule-copy"
  | "attendance"
  | "attendance-fix"
  | "payslip-review"
  | "payslip-send";

/** 따라 할 칸 하나 */
export type GuidePart = {
  /** 하위 단계 번호(「2-1」) — 왼쪽 목록의 하위 단계를 누르면 이 칸으로 내려온다 */
  label?: string;
  title: string;
  /** 따라 할 순서(번호 목록) */
  actions: string[];
  /** 느낌표 안내 — 안내끼리는 빈 줄(\n\n)로 나누고, \n 하나는 같은 안내 안 줄바꿈이다(2026-11-11 사용자 지정) */
  tip?: string;
  /** [OOO로 가기] 가 보낼 화면(탭 BP 접두 없이) */
  path?: string;
  mock: GuideMockKind;
};

export type GuideDetail = {
  summary: string;
  when: string;
  need: string;
  parts: GuidePart[];
};

const STORE_FORM: GuidePart = {
  title: "점포 등록하기",
  path: "/stores/new",
  mock: "store-form",
  // 「점포 목록 위 [등록]을 눌러요」는 뺐다 — [점포 등록으로 가기]가 목록을 거치지 않고 바로 등록 화면으로 간다(2026-11-11 사용자 지정)
  actions: [
    "「점포 기본정보」에서 점포유형(직영 · 가맹)을 선택하고 점포명 · 점포 연락처 · 점포 주소를 입력해요.",
    "주소를 입력하면 위도·경도가 자동으로 채워져요.\n직원 앱에서 출퇴근 위치를 확인하려면 [출퇴근 위치적용]을 '사용'으로 설정해 주세요.",
    "[저장]을 누르면 점포가 등록되고 상세 화면으로 이동해요.",
  ],
  tip: "점포 유형은 등록 후 변경할 수 없어요.",
};

/** 사업자 진위확인 — 점포 등록 화면의 「사업자정보」 상자(biz-verification-box.tsx). [인증하기]는 확인만 하고 저장은 화면의 [저장]이 한다(2026-11-11 사용자 지정) */
const BIZ_VERIFY: GuidePart = {
  title: "사업자 진위확인하기",
  path: "/stores/new",
  mock: "biz-verify",
  actions: [
    "「사업자정보」에 사업자등록번호 · 대표자명 · 개업일자를 입력해요.",
    "[인증하기]를 누르면 사업자 진위를 확인해요. 확인되면 「인증 완료」로 표시돼요.",
    "[저장]을 눌러 인증 정보를 함께 저장해요.",
    "사업자 인증을 완료하고 점포 상태를 '운영'으로 변경해 주세요.",
  ],
  tip: "점포를 등록할 때 사업자 인증은 선택이지만, 점포 상태를 '운영'으로 변경하려면 반드시 인증을 완료해야 해요.",
};

const ROLE_GROUP: GuidePart = {
  label: "2-1",
  title: "권한 그룹 등록하기",
  path: "/bp-role-groups",
  mock: "role-group",
  actions: [
    // 문구는 2026-11-11 사용자 지정
    "[등록]을 누르면 오른쪽에 「권한 등록」 영역이 열려요.",
    "권한명(예: 매니저)과 설명을 입력해 주세요.",
    "[저장]을 누르면 왼쪽 목록에 새로운 권한 그룹이 추가돼요.",
  ],
  tip: "권한 그룹은 관리자가 접근할 수 있는 메뉴를 설정하는 기능이에요.\n업무에 필요한 메뉴만 선택하고, 같은 업무를 담당하는 관리자에게는 동일한 권한 그룹을 지정해 주세요.",
};

const ROLE_MENU: GuidePart = {
  label: "2-2",
  title: "메뉴 권한 설정하기",
  path: "/bp-role-groups",
  mock: "role-menu",
  actions: [
    "목록의 메뉴설정 열에서 방금 만든 그룹의 [설정]을 눌러요.",
    "「권한별 메뉴설정」 팝업에서 메뉴마다 조회 · 등록 · 수정 · 삭제 중 맡길 것만 체크해요.",
    "[저장]을 누른 뒤 [닫기]를 눌러 팝업을 닫아 주세요. 저장 후에도 팝업은 자동으로 닫히지 않아요.",
  ],
  tip: "점포의 상태를 변경할 수 있는 점포관리나 급여명세서처럼 민감한 정보가 포함된 메뉴는 권한을 주지 않는 것을 추천해요.",
};

const adminForm = (title: string): GuidePart => ({
  label: "2-3",
  title,
  path: "/bp-admins",
  mock: "admin-form",
  actions: [
    // 문구는 2026-11-11 사용자 지정
    "[등록]을 누르면 「관리자 등록」 패널이 열려요.",
    "아이디·이름·연락처·이메일을 입력하고, 계정 역할은 'BP 관리자'를 선택해 주세요.",
    "'권한명'에서 앞서 등록한 권한 그룹을 선택해 주세요.",
    "'대상점포 범위'에서 전체 점포 또는 일부 점포를 선택한 뒤 [저장]을 눌러 주세요.",
  ],
  // 대상점포 안내(2026-11-11 사용자 요청) — 관리 점포 범위 규칙은 manyfast F-MOQKGY(전체 점포 적용 여부 · 신규 점포 자동 매핑)와 같다
  tip: "관리자는 지정된 점포만 조회하고 관리할 수 있어요.\n'전체 점포'를 선택하면 앞으로 등록할 점포까지 자동으로 포함되고, '일부 점포'는 선택한 점포에만 접근할 수 있어요.\n\n초기 비밀번호는 등록한 이메일로 발송돼요.",
});

const CONTRACT: GuidePart = {
  title: "근로계약서 작성하기",
  path: "/staff-members",
  mock: "contract",
  actions: [
    // 문구는 2026-11-11 사용자 지정
    "직원 목록 상단의 [직원 초대]를 누르면 근로계약서 작성 화면이 열려요.",
    "직원 정보(이름·휴대전화번호·생년월일·소속 근무지·직무)를 입력해 주세요.",
    "고용 형태와 계약 방식(전자·종이)을 선택하고 근로계약 조건을 입력해 주세요.",
    "전자계약은 [서명 요청], 종이계약은 [종이 계약 등록]을 눌러요.",
  ],
  tip: "근로계약서를 작성하면 직원 초대도 함께 진행돼요.\n단, 계약 시작일 기준 만 19세 미만인 직원은 계약서를 저장할 수 없어요.",
};

const SIGN: GuidePart = {
  title: "직원이 서명하면 완료돼요",
  path: "/contracts",
  mock: "staff-app",
  actions: [
    // 문구는 2026-11-11 사용자 지정
    "직원 앱에 가입하지 않은 경우, 가입 초대 알림톡이 발송돼요. 직원이 가입하면 '직원 서명 대기' 상태로 변경돼요.",
    "이미 가입한 직원은 직원 앱에서 바로 근로계약서에 서명할 수 있어요.",
    "종이계약은 별도 발송 없이 바로 '서명 완료' 상태로 처리돼요.",
  ],
  tip: "종이계약은 서명한 근로계약서 파일을 반드시 첨부해 주세요.",
};

const SCHEDULE: GuidePart = {
  title: "근무스케줄 등록하기",
  path: "/work-schedules",
  mock: "schedule",
  actions: [
    // 문구는 2026-11-11 사용자 지정
    "주간 보기에서 근무지를 선택해 주세요.",
    "[근무스케줄 등록]을 누르고 근무일·직원·시작시간·종료시간·휴게시간을 입력해 주세요.",
    "[근로계약 시간적용]을 누르면 근로계약서에 설정된 근무시간이 자동으로 입력돼요.",
    "[저장]을 누르면 직원 앱과 이메일로 알림이 자동 발송돼요.",
  ],
  tip: "근로계약서 서명을 완료하고 직원 앱에 가입한 직원만 근무스케줄 등록 대상으로 선택할 수 있어요.",
};

const SCHEDULE_COPY: GuidePart = {
  // 문구는 2026-11-11 사용자 지정
  title: "지난주 근무스케줄 복사하기",
  path: "/work-schedules",
  mock: "schedule-copy",
  actions: [
    "근무스케줄이 등록되지 않은 다음 주로 이동한 뒤 [지난 주 복사]를 눌러요.",
    "미리보기에서 복사할 근무스케줄을 확인하고 [N명 복사]를 눌러요.",
  ],
};

const ATTENDANCE: GuidePart = {
  title: "출퇴근 현황 보기",
  path: "/attendance-records",
  mock: "attendance",
  // 문구는 2026-11-11 사용자 지정
  actions: [
    "「일별 출퇴근」에서 직원별 예정 근무시간과 실제 출퇴근 시간을 확인해 주세요.",
    "'확인 필요'로 표시된 기록은 비고에서 사유를 확인해 주세요.",
    "「근태 요약」에서 <u>정상출근·지각·미기록 현황과 근로시간</u>을 확인할 수 있어요.",
  ],
};

const ATTENDANCE_FIX: GuidePart = {
  title: "누락되거나 잘못된 기록 보정하기",
  path: "/attendance-records",
  mock: "attendance-fix",
  actions: [
    // 문구는 2026-11-11 사용자 지정
    "출퇴근 기록이 누락된 경우, [출퇴근 대신 등록]을 눌러 직원·날짜·출퇴근 시간·사유를 입력해 주세요.",
    "잘못된 기록은 해당 항목의 [보정]을 눌러 수정해 주세요. 기록에 문제가 없다면 [이상 없음]을 눌러요.",
  ],
  tip: "최근 3개월 이내의 출퇴근 기록만 보정할 수 있어요. 보정된 기록은 직원 앱에서 연필 아이콘으로 표시돼요.",
};

const PAYSLIP_REVIEW: GuidePart = {
  title: "급여명세서 작성 · 확정하기",
  path: "/payslips",
  mock: "payslip-review",
  // 문구는 2026-11-11 사용자 지정
  actions: [
    "[급여명세서 작성]을 눌러 직원을 선택한 뒤 [작성]을 눌러요.\n여러 명의 급여명세서를 작성하려면 [일괄 작성]을 선택해 주세요.",
    "검토 화면에서 지급·공제 내역을 확인한 뒤 [확정]을 눌러요.",
  ],
  tip: "공제 항목에 빈칸이 있으면 급여명세서를 확정할 수 없어요. 공제 대상이 아닌 항목에는 '0'을 입력해 주세요.",
};

const PAYSLIP_SEND: GuidePart = {
  title: "급여명세서 보내기",
  path: "/payslips",
  mock: "payslip-send",
  // 문구는 2026-11-11 사용자 지정
  actions: [
    "확정된 급여명세서는 [발송]을 눌러 직원에게 보내요. 여러 건을 한 번에 보내려면 [확정 N건 발송]을 눌러요.",
    "발송 후 수정이 필요한 경우, 급여명세서를 수정한 뒤 [재발송]을 눌러요.",
  ],
  tip: "급여명세서는 직원 앱에 등록된 이메일 주소로 발송돼요.",
};

const STAFF_DETAIL: GuideDetail = {
  // 문구는 2026-11-11 사용자 지정
  summary: "직원에게 근로계약서를 보내 주세요. 근로계약서를 발송하면 직원 초대도 함께 진행돼요. 직원이 계약서에 서명하면 근무스케줄을 등록할 수 있어요.",
  when: "새 직원과 근로계약을 체결하고 직원 앱으로 초대할 때",
  need: "직원의 휴대전화번호와 근로계약 조건(근무시간·임금)을 미리 준비해 주세요.\n계약 시작일 기준 만 19세 미만인 직원은 근로계약을 진행할 수 없어요.",
  parts: [CONTRACT, SIGN],
};

const SCHEDULE_DETAIL: GuideDetail = {
  summary: "직원별 근무 일정을 등록해 주세요. 근무스케줄을 저장하면 직원 앱으로 알림이 자동 발송돼요.",
  when: "직원의 주간·월간 근무 일정을 등록하고 관리할 때",
  need: "근로계약서 서명을 완료하고 직원 앱에 가입한 직원만 근무스케줄을 등록할 수 있어요.",
  parts: [SCHEDULE, SCHEDULE_COPY],
};

const ATTENDANCE_DETAIL: GuideDetail = {
  summary: "직원이 직원 앱에 기록한 출퇴근 내역을 확인해 주세요. 누락되거나 잘못된 기록은 직접 수정할 수 있어요.",
  when: "직원의 출퇴근 기록을 확인하거나 누락·오류 기록을 수정할 때",
  need: "직원이 직원 앱에서 출퇴근을 기록하려면 점포의 [출퇴근 위치적용]을 '사용'으로 설정해야 해요.\n출퇴근 기록은 최근 3개월 이내의 내역만 수정할 수 있어요.",
  parts: [ATTENDANCE, ATTENDANCE_FIX],
};

const PAYSLIP_DETAIL: GuideDetail = {
  // 문구는 2026-11-11 사용자 지정
  summary: "직원의 출퇴근 기록을 바탕으로 급여명세서를 작성해 주세요. 급여 내역을 검토하고 확정하면 직원에게 발송할 수 있어요.",
  when: "한 달간의 근무 내역을 바탕으로 직원 급여를 정산할 때",
  need: "해당 월의 출퇴근 기록을 미리 확인해 주세요. 공제 항목에 입력되지 않은 값이 있으면 급여명세서를 확정할 수 없어요.",
  parts: [PAYSLIP_REVIEW, PAYSLIP_SEND],
};

const ADMIN_DETAIL = (who: string, adminTitle: string): GuideDetail => ({
  // 문구는 2026-11-11 사용자 지정
  summary: `${who}에게 매장 관리 업무를 맡기려면 관리자 계정을 등록해 주세요. 혼자 관리한다면 이 단계는 건너뛰어도 돼요.`,
  when: `${who}와 매장 관리 업무를 나눠서 진행할 때`,
  need: "관리자 계정을 등록하기 전에 권한 그룹을 먼저 설정해 주세요.\n권한 그룹에서는 관리자가 접근할 수 있는 화면과 접근할 수 없는 화면을 설정할 수 있어요.",
  parts: [ROLE_GROUP, ROLE_MENU, adminForm(adminTitle)],
});

const GUIDE_DETAILS: Record<GuideTrack, Record<string, GuideDetail>> = {
  STORE: {
    "1": {
      summary: "운영 중인 매장을 점포로 등록해 주세요. 사업자 인증을 완료하고 점포 상태를 '운영'으로 변경하면 직원을 초대하고 근무표와 급여를 관리할 수 있어요.",
      when: "WHALE ERP를 처음 사용하거나 새로운 점포를 추가할 때",
      need: "직원을 초대하려면 사업자 인증과 점포 위치 정보(위도·경도)가 필요해요.",
      // 본사가 WHALE ERP 를 쓰지 않는 가맹점은 직영으로 등록해 혼자 관리한다(2026-11-11 사용자 지정 — 비로그인 홈 「프랜차이즈 본사가 Whale ERP를 쓰지 않나요?」와 같은 안내)
      parts: [
        {
          ...STORE_FORM,
          tip: `${STORE_FORM.tip}\n\n프랜차이즈 본사가 WHALE ERP를 사용하지 않는 가맹점은 점포 유형을 '직영'으로 등록해 관리할 수 있어요.`,
        },
        BIZ_VERIFY,
      ],
    },
    "2": ADMIN_DETAIL("점장이나 매니저", "관리자 계정 등록하기"),
    "3": STAFF_DETAIL,
    "4": SCHEDULE_DETAIL,
    "5": ATTENDANCE_DETAIL,
    "6": PAYSLIP_DETAIL,
  },
  HQ: {
    "1": {
      summary:
        "운영 중인 점포를 직영과 가맹으로 구분해 등록해 주세요. 사업자 인증을 완료하고 점포 상태를 '운영'으로 변경하면 직원을 초대하고 근무표와 급여를 관리할 수 있어요. 가맹 점포는 STEP 3에서 가맹점주에게 관리를 맡길 수 있어요.",
      when: "WHALE ERP를 처음 사용하거나 새로운 점포를 추가할 때",
      // 본사 탭 문구는 같은 항목이면 매장 사장님 탭 문구 · 말투(「~해 주세요」, 붙임 「·」)를 따른다(2026-11-11 사용자 지정)
      need: "직원을 초대하려면 사업자 인증과 점포 위치 정보(위도·경도)가 필요해요.\n점포마다 직영·가맹 구분도 확인해 주세요.",
      parts: [STORE_FORM, BIZ_VERIFY],
    },
    "2": ADMIN_DETAIL("본사 직원", "BP 관리자 등록하기"),
    "3": {
      summary: "가맹점주의 가맹 마스터 계정을 등록해 주세요. 계정을 등록하면 가맹점주가 자기 점포의 직원·근무·급여를 직접 관리할 수 있어요.",
      when: "가맹점주가 자기 점포의 직원·근무·급여를 직접 관리하게 할 때",
      need: "가맹으로 등록한 점포가 필요해요.\n가맹 마스터는 일부 점포만 선택할 수 있고, 다른 가맹 마스터가 관리하는 점포는 선택할 수 없어요.",
      parts: [
        {
          label: "3-1",
          title: "가맹 마스터 메뉴 권한 확인하기",
          path: "/bp-role-groups",
          mock: "role-menu",
          actions: [
            "권한 그룹 목록 상단의 [가맹마스터 메뉴설정 보기]를 눌러 주세요.",
            "가맹점주가 사용할 수 있는 메뉴와 조회·등록·수정·삭제 권한을 확인해 주세요.",
          ],
        },
        {
          label: "3-2",
          title: "가맹 마스터 등록하기",
          path: "/bp-admins",
          mock: "franchise-master",
          // 2-3 「관리자 계정 등록하기」와 같은 순서 · 말투 — 계정 역할과 대상점포만 가맹 마스터에 맞춘다
          actions: [
            "[등록]을 누르면 「관리자 등록」 패널이 열려요.",
            "아이디·이름·연락처·이메일을 입력하고, 계정 역할은 '가맹 마스터'를 선택해 주세요.",
            "'권한명'에서 가맹점주에게 줄 권한 그룹을 선택해 주세요.",
            "'대상점포 범위'에서 가맹점주가 관리할 가맹 점포를 선택한 뒤 [저장]을 눌러 주세요.",
          ],
          tip: "가맹 마스터는 일부 점포만 선택할 수 있고, 다른 가맹 마스터가 관리하는 점포는 목록에 나오지 않아요.\n\n초기 비밀번호는 등록한 이메일로 발송돼요.",
        },
      ],
    },
    "4": {
      ...STAFF_DETAIL,
      summary: "직영점 직원에게 근로계약서를 보내 주세요. 근로계약서를 발송하면 직원 초대도 함께 진행돼요. 가맹점 직원은 가맹점주가 초대해요.",
    },
    "5": {
      summary: "직영점 직원의 근무 일정을 등록하고, 직원이 직원 앱에 기록한 출퇴근 내역을 확인해 주세요. 누락되거나 잘못된 기록은 직접 수정할 수 있어요.",
      when: "직영점 직원의 주간·월간 근무 일정을 등록하고 출퇴근 기록을 확인할 때",
      need: "근로계약서 서명을 완료하고 직원 앱에 가입한 직원만 근무스케줄을 등록할 수 있어요.\n출퇴근 기록은 최근 3개월 이내의 내역만 수정할 수 있어요.",
      parts: [SCHEDULE, ATTENDANCE, ATTENDANCE_FIX],
    },
    "6": {
      ...PAYSLIP_DETAIL,
      summary: "직원의 출퇴근 기록을 바탕으로 급여명세서를 작성해 주세요. 급여 내역을 검토하고 확정하면 직원에게 발송할 수 있어요. 가맹점 직원 정보는 본사 제공에 동의한 직원만 확인할 수 있어요.",
    },
  },
  FRANCHISEE: {
    "1": {
      summary: "본사가 배정한 점포를 확인해 주세요. 점포를 확인하면 직원 · 근무스케줄 · 급여를 점포별로 관리할 수 있어요.",
      when: "가맹 마스터 계정으로 처음 로그인했을 때",
      need: "가맹점은 점포를 직접 등록할 수 없어요. 점포가 보이지 않으면 본사에 배정을 요청해 주세요.",
      parts: [
        {
          title: "맡은 점포 확인하기",
          path: "/stores",
          mock: "store-list",
          actions: ["점포 목록에서 배정된 점포를 확인해요.", "점포를 누르면 주소 · 사업자정보 등 상세 정보를 확인할 수 있어요."],
          tip: "가맹점은 점포를 직접 등록할 수 없어요. 점포가 보이지 않으면 본사에 배정을 요청하세요.",
        },
      ],
    },
    "2": {
      summary: "점장이나 매니저에게 일부 업무를 맡기려면 가맹 관리자 계정을 등록해 주세요. 가맹 관리자는 가맹 마스터만 등록할 수 있어요.",
      when: "점장이나 매니저와 함께 점포를 관리할 때",
      need: "가맹 관리자는 가맹 마스터만 등록할 수 있어요. 권한 그룹을 먼저 등록하고, 관리자의 이메일 주소를 확인해 주세요.",
      parts: [
        { ...ROLE_GROUP, label: undefined },
        { ...ROLE_MENU, label: undefined },
        {
          ...adminForm("가맹 관리자 등록하기"),
          label: undefined,
          actions: [
            "[등록]을 누르면 「관리자 등록」 패널이 열려요.",
            "아이디 · 이름 · 연락처 · 이메일을 입력하고, 계정 역할은 가맹 관리자를 선택해요.",
            "권한명에서 앞에서 만든 그룹을 선택해요.",
            "담당 점포를 선택하고 [저장]을 눌러요.",
          ],
        },
      ],
    },
    "3": STAFF_DETAIL,
    "4": SCHEDULE_DETAIL,
    "5": ATTENDANCE_DETAIL,
    "6": PAYSLIP_DETAIL,
  },
};

/** 시작 가이드 화면 주소 — 갈래 · 단계, 하위 단계면 그 칸으로 내려간다(#part-2-1) */
export function guideHref(track: GuideTrack, step?: string, part?: string) {
  return `/start-guide?track=${track}${step ? `&step=${step}` : ""}${part ? `#part-${part}` : ""}`;
}

export const guideDetailOf = (track: GuideTrack, step: string): GuideDetail => GUIDE_DETAILS[track][step];
