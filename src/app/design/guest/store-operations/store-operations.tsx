import type { ReactNode } from "react";
import { AttendanceMock, ContractMock, FacilityDetailMock, StaffAppHomeMock, StaffAppSignMock, StoreDetailMock } from "../screen-mocks";
import type { GuestRoutes } from "../guest-routes";
import { FloatingActions, GuestPage } from "../guest-ui";
import { IntroFeaturesSticky, type StickyFeature } from "../intro-features-sticky";
import { IntroMoments, IntroTimeline, type Moment } from "../intro-sections";

// Figma 「매장운영」(RQmNVgT2NL0njIFXVQPVG6 · 44:661, 로그인전_공유 — 2026-11-06 반영. 처음은 8QSOuwFFBfCbFWR6RBUlps · 1:688). 비로그인 메인의 매장운영 소개 화면이다.
// 실제 라우트((site))와 디자인 샘플이 함께 그린다. 구역 틀은 재무관리와 같이 쓴다(intro-sections.tsx).

const MOMENTS: Moment[] = [
  {
    before: { title: "첫 출근인데,\n근로계약서는 아직?", desc: "직원은 출근했는데 계약서를 작성하지 못했어요." },
    after: { title: "첫 출근 전,\n근로계약서 서명까지 완료!", desc: "직원 앱에서 간편하게 전자서명을 마칠 수 있어요." },
  },
  {
    before: { title: "급여 계산할 때마다,\n근무시간 확인부터?", desc: "직원 근무시간을 일일이 확인하기 번거로워요." },
    after: { title: "출퇴근 기록으로\n급여 관리도 간편하게!", desc: "기록된 정보로 급여 내역을 정리해요." },
  },
  {
    // 결근 — 전용 교체 기능은 없고, 출퇴근 현황에서 미출근을 보고 근무스케줄을 지운 뒤 다른 직원으로 다시 등록한다(새 직원에게 앱 · 이메일 알림). 그 흐름대로 쓴다(2026-11-10 사용자 지정).
    before: { title: "갑자기 결근한 직원,\n대신 일할 사람은?", desc: "급하게 근무할 직원을 배정하느라 바빠요." },
    after: { title: "결근 확인부터\n연락 및 근무 배정까지 바로!", desc: "결근을 바로 확인하고 다른 직원을 배정해요." },
  },
  {
    before: { title: "또 고장 난 장비,\n어떻게 수리했더라?", desc: "언제, 어디서 수리했는지 기록을 찾기 어려워요." },
    after: { title: "장비별 수리 이력으로\n빠르게 대응!", desc: "과거 내역으로 필요한 조치를 빠르게 내려요." },
  },
];

// 그림 칸은 사진이 아니라 관리자 웹 · 직원 앱 화면 조각(screen-mocks.tsx)이다(2026-11-10 사용자 지정).
// 큰 제목은 「~요」로 짧게, 아래 설명은 「~습니다」로 끝낸다(2026-11-10 사용자 지정).
const FEATURES: StickyFeature[] = [
  {
    id: "store",
    screens: [<StoreDetailMock key="store" />],
    tab: "점포 관리",
    no: "01 점포 관리",
    title: ["매장 정보,", "여기저기 찾을 필요 없어요"],
    lead: ["사업자 정보부터 운영 현황, 시설물 정보까지", "한곳에서 확인하고 관리할 수 있습니다."],
    points: ["운영·폐점 상태까지 한눈에 보는 점포 정보", "평수·좌석 수·주요 장비 기록"],
  },
  {
    id: "inspection",
    screens: [<FacilityDetailMock key="facility" />],
    tab: "점검 · 시설물",
    no: "02 점검 · 시설물",
    title: ["고장 나기 전에,", "점검 기록이 먼저 알려줘요"],
    lead: ["위생·운영 점검 결과를 기록하고 직원과 바로 공유할 수 있습니다.", "장비별 수리 이력이 남아 같은 고장에도 빠르게 대응할 수 있습니다."],
    points: ["템플릿으로 빠르게 끝내는 점검표", "시설물·장비 정보를 한곳에", "수리 이력과 수리비까지 재무에 연결"],
  },
  {
    id: "contract",
    // 한 화면에 관리자 웹 근로계약서(뒤 왼쪽)와 직원 앱 서명 화면(앞 오른쪽)을 겹친다 — 사장님이 보낸 계약서에 직원이 앱에서 서명하는 흐름(2026-11-10 사용자 지정).
    screens: [
      <div key="contract" className="relative h-[420px] w-[470px]">
        <div className="absolute top-[20px] left-0">
          <ContractMock />
        </div>
        <div className="absolute right-0 bottom-0 origin-bottom-right scale-[0.8]">
          <StaffAppSignMock />
        </div>
      </div>,
    ],
    tab: "근로계약 · 급여명세서",
    no: "03 근로계약 · 급여명세서",
    title: ["계약서와 급여명세서,", "더는 미룰 필요 없어요"],
    lead: ["직원 앱으로 근로계약서를 보내면 직원이 휴대폰으로 바로 서명합니다.", "급여명세서도 빠짐없이 발급해 노무 걱정을 덜 수 있습니다."],
    points: ["정직원·파트타이머 전자 근로계약서", "급여명세서·연장근무 수당명세서", "직원 앱으로 명세서 바로 발송"],
  },
  {
    id: "attendance",
    // 한 화면에 관리자 웹 출퇴근 현황(뒤 왼쪽)과 직원 앱 홈(앞 오른쪽, 오늘의 근무 · 오늘 할 일)을 겹친다 —
    // 사장님이 보는 기록과 직원이 쓰는 앱이 한눈에 보이게(2026-11-10 사용자 지정).
    screens: [
      <div key="attendance" className="relative h-[440px] w-[470px]">
        <div className="absolute top-[20px] left-0">
          <AttendanceMock />
        </div>
        <div className="absolute right-0 bottom-0 origin-bottom-right scale-[0.8]">
          <StaffAppHomeMock />
        </div>
      </div>,
    ],
    tab: "출퇴근 현황 · 업무배정",
    no: "04 출퇴근 현황 · 업무배정",
    title: ["몇 시에 왔더라?", "이제 기록이 알려줘요"],
    lead: ["직원은 매장에 도착해 직원 앱으로 출퇴근합니다.", "근무표와 실제 출근 기록을 나란히 확인하고,", "오늘 할 일은 TO-DO로 전달할 수 있습니다."],
    points: ["주간 근무 스케줄 공유", "매장 위치로 출퇴근 기록", "직원별 TO-DO 관리"],
  },
];

// 사장님이 하는 일 순서 — 주어는 모두 사장님이다. 초대는 카카오 알림톡으로 간다(2026-11-10 사용자 지정).
// 단계 아이콘 — 남색 1.8px 선 그림(28px). 초대 · 계약서 서명 · 근무표 · 위치 출퇴근 · 명세서.
function LineIcon({ children }: { children: ReactNode }) {
  return (
    <svg aria-hidden width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const FLOW = [
  {
    title: "직원 초대",
    desc: "이름과 연락처만 입력하면 초대 끝",
    icon: (
      <LineIcon>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
        <path d="M19 8v6M16 11h6" />
      </LineIcon>
    ),
  },
  {
    title: "근로계약서 관리",
    desc: "직원이 앱에서 서명하면 바로 확인",
    icon: (
      <LineIcon>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="m9 15 2 2 4-4" />
      </LineIcon>
    ),
  },
  {
    title: "근무표 공유",
    desc: "이번 주 근무 일정과 할 일 공유",
    icon: (
      <LineIcon>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
        <path d="M7 14h3M7 17h6" />
      </LineIcon>
    ),
  },
  {
    title: "출퇴근 확인",
    desc: "직원들의 출퇴근 현황을 확인",
    icon: (
      <LineIcon>
        <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </LineIcon>
    ),
  },
  {
    title: "급여명세서 발송",
    desc: "근무 기록을 반영해 급여명세서 발송",
    icon: (
      <LineIcon>
        <path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </LineIcon>
    ),
  },
];

export function StoreOperations({ routes }: { routes: GuestRoutes }) {
  return (
    // 맨 아래 흐름 구역(흰 바탕)이 푸터에 바로 붙어 본문 아래 60px 여백을 두지 않는다.
    <GuestPage flush>
      <IntroMoments light="사장님," bold="이런 순간 있으셨죠?" items={MOMENTS} />
      <IntroFeaturesSticky light="매장운영," bold="이렇게 달라집니다" items={FEATURES} />
      {/* 흐름 구역 제목 — 「직원 초대부터 월급날까지, 끊김 없이」에서 직원의 「첫」으로 시작해 서비스 이름으로 끝맺게 바꿨다(2026-11-12 사용자 지정) */}
      <IntroTimeline light="첫 출근부터 첫 월급까지," bold="WHALE ERP 하나로" steps={FLOW} />
      {/* 홈과 같은 무료 가입 띠를 아래에 띄운다(2026-11-12 사용자 지정) */}
      <FloatingActions routes={routes} />
    </GuestPage>
  );
}
