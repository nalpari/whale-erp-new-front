import type { ReactNode } from "react";
import type { GuestRoutes } from "../guest-routes";
import { FloatingActions, GuestPage } from "../guest-ui";
import { type AccordionFeature, IntroFeaturesAccordion } from "../intro-features-accordion";
import { IntroMoments, IntroTimeline, type Moment } from "../intro-sections";
import { FranchiseContractMock, FranchiseInspectionMock, FranchiseMenuMock, FranchiseStoreMock } from "../screen-mocks";

// Figma 「프랜차이즈」(RQmNVgT2NL0njIFXVQPVG6 · 44:1035, 로그인전_공유 — 2026-11-06). 비로그인 메인의 프랜차이즈(본사) 소개 화면이다.
// 실제 라우트((site))와 디자인 샘플이 함께 그린다. 링크는 받은 routes 로 건다(guest-routes.ts). 구역 틀은 매장운영 · 재무관리와 같이 쓴다(intro-sections.tsx).


// 매장운영과 같은 말투 — 도입 전은 「~?」 질문, 도입 후는 「~!」, 설명은 「~요」(2026-11-10 사용자 지정).
const MOMENTS: Moment[] = [
  {
    before: { title: "계약서 한 장에 도장 받으러 또 방문?", desc: "계약서마다 가맹점을 찾아가 서명을 받아야 해요." },
    after: { title: "계약서 전송부터 서명까지 온라인으로!", desc: "계약서를 온라인으로 보내고 서명까지 바로 받아요." },
  },
  {
    before: { title: "가맹점마다 메뉴 가격이 다르다면?", desc: "매장마다 다른 메뉴판과 가격, 관리하기 막막해요." },
    after: { title: "메뉴 · 가격을 전 가맹점에 한 번에!", desc: "메뉴와 가격을 일괄 배포해 모든 가맹점에 적용해요." },
  },
  {
    before: { title: "정보공개서 자료, 뭐부터 준비하지?", desc: "가맹점 자료를 매년 처음부터 다시 모아야 해요." },
    after: { title: "필요한 가맹점 자료가 이미 한곳에!", desc: "정리된 자료로 정보공개서를 바로 준비해요." },
  },
];

// 그림 칸은 기능을 보여 주는 화면 예시(screen-mocks.tsx) — 재무관리와 같은 펼침 목록(2026-11-10 사용자 지정).
const FEATURES: AccordionFeature[] = [
  {
    id: "contract",
    screen: <FranchiseContractMock />,
    tab: "가맹계약",
    no: "01 가맹계약",
    title: ["계약서 들고", "찾아갈 필요 없습니다"],
    lead: ["표준 템플릿으로 가맹점별 계약서를 만들어 보내면,", "가맹점주가 온라인에서 확인하고 바로 서명합니다."],
    points: ["표준 계약서 템플릿", "신규·갱신·양도양수 계약", "서명 현황 확인·계약서 다운로드"],
  },
  {
    id: "store",
    screen: <FranchiseStoreMock />,
    tab: "가맹점 등록",
    no: "02 가맹점 등록",
    title: ["계약이 끝나면,", "가맹점 관리가 바로 시작됩니다"],
    lead: ["매장을 등록하고 가맹점주 계정을 연결하세요.", "서명된 계약서만 붙이면 가맹점으로 전환됩니다."],
    points: ["가맹점주 계정 발급·매장 연결", "가맹계약서 연결", "계약 상태·해지 사유 관리"],
  },
  {
    id: "menu",
    screen: <FranchiseMenuMock />,
    tab: "상품 · 가격 배포",
    no: "03 상품 · 가격 배포",
    title: ["신메뉴 출시,", "전 가맹점에 한 번에"],
    lead: ["상품과 카테고리, 가격을 본사에서 등록해 배포하세요.", "어느 가맹점에서 주문해도 같은 메뉴, 같은 가격입니다."],
    points: ["상품·카테고리 일괄 배포", "표준가·프로모션 가격 관리", "자재 공급가 관리"],
  },
  {
    id: "inspection",
    screen: <FranchiseInspectionMock />,
    tab: "가맹점 점검 · 정보공개서",
    no: "04 가맹점 점검 · 정보공개서",
    title: ["점검도, 정보공개서 자료도", "미리 준비됩니다"],
    lead: ["슈퍼바이저가 현장에서 남긴 점검 결과를 가맹점주와 바로 공유하고,", "정보공개서에 필요한 자료도 손쉽게 모읍니다."],
    points: ["현장 점검 결과 온라인 공유", "가맹점 매출·영업일수 조회", "원부자재·장비 납품 정보"],
  },
];

// 단계 아이콘 — 남색 1.8px 선 그림. 매장운영 · 재무관리 흐름과 같은 모양(2026-11-10 사용자 지정).
function LineIcon({ children }: { children: ReactNode }) {
  return (
    <svg aria-hidden width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

// 본사가 하는 일 순서 — 매장운영 「끊김 없이」와 같은 흰 바탕 물결 흐름(2026-11-10 사용자 지정, 전엔 어두운 바탕 아이콘 카드).
const FLOW = [
  {
    title: "템플릿 등록",
    desc: "본사 표준 계약서 준비",
    icon: (
      <LineIcon>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </LineIcon>
    ),
  },
  {
    title: "계약서 작성",
    desc: "가맹점별로 빠르게 생성",
    icon: (
      <LineIcon>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="m10 17 5-5 1.5 1.5-5 5H10z" />
      </LineIcon>
    ),
  },
  {
    title: "온라인 서명",
    desc: "가맹점주 서명까지 온라인으로",
    icon: (
      <LineIcon>
        <path d="M3 17c3-4 5-9 7-9s-1 9 2 9 3-5 5-5 2 3 4 3" />
        <path d="M3 21h18" />
      </LineIcon>
    ),
  },
  {
    title: "매장 연결",
    desc: "가맹점주 계정과 매장 연결",
    icon: (
      <LineIcon>
        <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
        <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
      </LineIcon>
    ),
  },
  {
    title: "운영 시작",
    desc: "메뉴 배포부터 매장 점검까지",
    icon: (
      <LineIcon>
        <path d="M3 9 5 4h14l2 5" />
        <path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" />
        <path d="M5 13v7h14v-7M10 20v-4h4v4" />
      </LineIcon>
    ),
  },
];

export function Franchise({ routes }: { routes: GuestRoutes }) {
  return (
    // 맨 아래 부가서비스 구역(회색 바탕)이 푸터에 바로 붙는 시안이라 본문 아래 60px 여백을 두지 않는다.
    <GuestPage flush>
      <IntroMoments light="가맹점이 늘수록," bold="본사가 바빠지는 이유" items={MOMENTS} />
      <IntroFeaturesAccordion light="프랜차이즈 본사," bold="이렇게 달라집니다" items={FEATURES} />
      {/* 흐름 구역 제목 — 「계약서 한 장에서, 가맹점 오픈까지」는 뜻이 모호하고 끝이 「~까지」로 끊겨, 매장운영 · 재무관리와 같은 「A부터 B까지, WHALE ERP 하나로」 꼴로 바꿨다(2026-11-12 사용자 지정) */}
      <IntroTimeline light="가맹계약부터 매장 연결까지," bold="WHALE ERP 하나로" steps={FLOW} />
      {/* 홈 · 매장운영과 같은 무료 가입 띠를 아래에 띄운다(2026-11-12 사용자 지정) */}
      <FloatingActions routes={routes} />
    </GuestPage>
  );
}
