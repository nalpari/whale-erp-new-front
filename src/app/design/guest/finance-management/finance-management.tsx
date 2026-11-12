import type { ReactNode } from "react";
import type { GuestRoutes } from "../guest-routes";
import { FloatingActions, GuestPage } from "../guest-ui";
import { type AccordionFeature, IntroFeaturesAccordion } from "../intro-features-accordion";
import { FinanceAccountMock, FinanceEntryMock, FinanceRatioMock, FinanceSalesMock } from "../screen-mocks";
import { IntroMoments, IntroTimeline, type Moment } from "../intro-sections";

// Figma 「재무관리」(RQmNVgT2NL0njIFXVQPVG6 · 44:1412, 로그인전_공유 — 2026-11-06). 비로그인 메인의 재무관리 소개 화면이다.
// 실제 라우트((site))와 디자인 샘플이 함께 그린다. 링크는 받은 routes 로 건다(guest-routes.ts). 구역 틀은 매장운영과 같이 쓴다(intro-sections.tsx).


const MOMENTS: Moment[] = [
  {
    before: { title: "통장 따로, 매출 따로, 엑셀 따로", desc: "흩어진 거래 내역, 확인도 막막해" },
    after: { title: "입출금과 매출을 한 화면에서", desc: "모든 입출금과 매출 내역을 한곳에서 확인하세요." },
  },
  {
    before: { title: "현금 매출은 늘 기억에만 의존", desc: "기억에 맡긴 현금 매출 누락될까 걱정" },
    after: { title: "통장 밖 현금 거래까지 빠짐없이 기록", desc: "통장에 남지 않는 현금 거래 빠짐없이 기록하세요." },
  },
  {
    before: { title: "매출은 늘었는데 남는 게 없다", desc: "매출은 늘었는데, 돈이 어디로 나갔는지 몰라요" },
    after: { title: "돈이 새는 곳, 계정별 비율로 한눈에", desc: "지출 비율을 살펴 불필요한 비용부터 줄이세요." },
  },
];

const FEATURES: AccordionFeature[] = [
  {
    id: "account",
    screen: <FinanceAccountMock />,
    tab: "입출금",
    no: "01 입출금",
    title: ["통장 내역,", "은행 앱 열지 않고 확인하세요"],
    lead: ["사업자 통장 거래를 자동으로 불러오고,", "입출금마다 메모와 계정을 붙여 깔끔하게 정리합니다."],
    points: ["실시간 입출금 현황", "거래별 메모 관리", "항목별 회계 계정 연결"],
  },
  {
    id: "transaction",
    screen: <FinanceEntryMock />,
    tab: "매출 · 매입 등록",
    no: "02 매출 · 매입 등록",
    title: ["현금 거래도", "장부에서 빠지지 않게"],
    lead: ["통장에 찍히지 않는 현금 매출, 카드로 산 식자재까지 직접 등록하세요.", "새는 돈 없이 모든 거래가 기록됩니다."],
    points: ["매출·매입·지출 거래 등록", "영수증 보며 간편하게 입력", "급여·수리비 자동 반영"],
  },
  {
    id: "ledger",
    screen: <FinanceRatioMock />,
    tab: "계정별 현황",
    no: "03 계정별 현황",
    title: ["어디로 돈이 새는지,", "비율로 보입니다"],
    lead: ["인건비, 재료비, 임대료가 매출의 몇 %인지 계정별로 확인하세요.", "줄여야 할 곳이 선명해집니다."],
    points: ["기간별 계정 현황", "매출 대비 항목별 비율", "점포별 회계 상황 비교"],
  },
  {
    id: "sales",
    screen: <FinanceSalesMock />,
    tab: "매출 조회 · 통계",
    no: "04 매출 조회 · 통계",
    title: ["지난달보다 잘 팔렸을까?", "숫자로 확인하세요"],
    lead: ["판매 채널, 결제수단, 상품별로 매출을 나눠 보고 전월·전년과 비교합니다.", "감이 아닌 데이터로 다음 달을 준비하세요."],
    points: ["점포별 매출 조회", "전월·전년 대비 비교", "상품별 판매 내역"],
  },
];

// 단계 아이콘 — 남색 1.8px 선 그림. 매장운영 흐름과 같은 모양(2026-11-10 사용자 지정).
function LineIcon({ children }: { children: ReactNode }) {
  return (
    <svg aria-hidden width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

// 사장님이 하는 일 순서 — 매장운영 「끊김 없이」와 같은 흰 바탕 물결 흐름(2026-11-10 사용자 지정, 전엔 어두운 바탕 아이콘 카드).
const FLOW = [
  {
    title: "통장 연동",
    desc: "사업자 통장 내역 자동으로 불러오기",
    icon: (
      <LineIcon>
        <path d="M3 10 12 4l9 6" />
        <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />
      </LineIcon>
    ),
  },
  {
    title: "계정 연결",
    desc: "거래마다 회계 계정 지정",
    icon: (
      <LineIcon>
        <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9z" />
        <circle cx="8" cy="8" r="1.5" />
      </LineIcon>
    ),
  },
  {
    title: "거래 추가",
    desc: "통장 밖 현금 · 카드 거래 직접 등록",
    icon: (
      <LineIcon>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </LineIcon>
    ),
  },
  {
    title: "비율 확인",
    desc: "매출 대비 계정별 비율 확인",
    icon: (
      <LineIcon>
        <path d="M12 3a9 9 0 1 0 9 9h-9z" />
        <path d="M15 3.5A9 9 0 0 1 20.5 9H15z" />
      </LineIcon>
    ),
  },
  {
    title: "기간 비교",
    desc: "전월 · 전년 매출과 나란히 비교",
    icon: (
      <LineIcon>
        <path d="M4 20h16" />
        <path d="M7 16v-4M12 16V7M17 16v-6" />
      </LineIcon>
    ),
  },
];

export function FinanceManagement({ routes }: { routes: GuestRoutes }) {
  return (
    // 맨 아래 부가서비스 구역(회색 바탕)이 푸터에 바로 붙는 시안이라 본문 아래 60px 여백을 두지 않는다.
    <GuestPage flush>
      <IntroMoments light="장부 정리," bold="아직도 월말에 몰아서 하시나요?" items={MOMENTS} />
      <IntroFeaturesAccordion light="재무관리," bold="이렇게 달라집니다" items={FEATURES} />
      {/* 흐름 구역 제목 — 「거래가 쌓일수록, 매장이 선명해져요」는 무엇이 선명해지는지 빠져 있어, 매장운영과 같은 「A부터 B까지, WHALE ERP 하나로」 꼴로 바꿨다(2026-11-12 사용자 지정) */}
      <IntroTimeline light="통장 연동부터 장부 정리까지," bold="WHALE ERP 하나로" steps={FLOW} />
      {/* 홈 · 매장운영과 같은 무료 가입 띠를 아래에 띄운다(2026-11-12 사용자 지정) */}
      <FloatingActions routes={routes} />
    </GuestPage>
  );
}
