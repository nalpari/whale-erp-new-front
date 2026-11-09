import Image from "next/image";
import { OrderIcon } from "../guest-icons";
import type { GuestRoutes } from "../guest-routes";
import { GuestPage } from "../guest-ui";
import { type AddOn, type Feature, type FlowStep, IntroAddOns, IntroFeatures, IntroFlow, IntroMoments, type Moment } from "../intro-sections";

// Figma 「프랜차이즈」(RQmNVgT2NL0njIFXVQPVG6 · 44:1035, 로그인전_공유 — 2026-11-06). 비로그인 메인의 프랜차이즈(본사) 소개 화면이다.
// 실제 라우트((site))와 디자인 샘플이 함께 그린다. 링크는 받은 routes 로 건다(guest-routes.ts). 구역 틀은 매장운영 · 재무관리와 같이 쓴다(intro-sections.tsx).

const ASSET = "/guest/franchise";

const MOMENTS: Moment[] = [
  {
    before: { title: "도장 받으러 오가는 계약서 한 장", desc: "계약서 한 장, 도장 받으러 방문" },
    after: { title: "온라인 전송부터 서명까지 한 번에", desc: "계약서를 온라인으로 보내고 서명까지 완료하세요." },
  },
  {
    before: { title: "가맹점마다 다른 메뉴판과 가격", desc: "매장마다 다른 메뉴 가격 관리도 막막" },
    after: { title: "한 번 배포로 전 가맹점 메뉴·가격 통일", desc: "메뉴와 가격을 일괄 배포해 가맹점마다 적용하세요." },
  },
  {
    before: { title: "매년 돌아오는 정보공개서 자료 준비", desc: "가맹점 자료는 매년 어디서부터 모아야 할까요?" },
    after: { title: "필요한 가맹점 자료, 이미 한곳에 정리", desc: "정리된 가맹점 자료를 활용해 정보공개서를 준비하세요." },
  },
];

const FEATURES: Feature[] = [
  {
    id: "contract",
    photo: `${ASSET}/feature-contract.png`,
    tab: "가맹계약",
    no: "01 가맹계약",
    title: ["계약서 들고", "찾아갈 필요 없습니다"],
    lead: ["표준 템플릿으로 가맹점별 계약서를 만들어 보내면,", "가맹점주가 온라인에서 확인하고 바로 서명합니다."],
    points: ["표준 계약서 템플릿", "신규·갱신·양도양수 계약", "서명 현황 확인·계약서 다운로드"],
  },
  {
    id: "store",
    photo: `${ASSET}/feature-store.png`,
    tab: "가맹점 등록",
    no: "02 가맹점 등록",
    title: ["계약이 끝나면,", "가맹점 관리가 바로 시작됩니다"],
    lead: ["매장을 등록하고 가맹점주 계정을 연결하세요.", "서명된 계약서만 붙이면 가맹점으로 전환됩니다."],
    points: ["가맹점주 계정 발급·매장 연결", "가맹계약서 연결", "계약 상태·해지 사유 관리"],
  },
  {
    id: "menu",
    photo: `${ASSET}/feature-menu.png`,
    tab: "상품 · 가격 배포",
    no: "03 상품 · 가격 배포",
    title: ["신메뉴 출시,", "전 가맹점에 한 번에"],
    lead: ["상품과 카테고리, 가격을 본사에서 등록해 배포하세요.", "어느 가맹점에서 주문해도 같은 메뉴, 같은 가격입니다."],
    points: ["상품·카테고리 일괄 배포", "표준가·프로모션 가격 관리", "자재 공급가 관리"],
  },
  {
    id: "inspection",
    photo: `${ASSET}/feature-inspection.png`,
    tab: "가맹점 점검 · 정보공개서",
    no: "04 가맹점 점검 · 정보공개서",
    title: ["점검도, 정보공개서 자료도", "미리 준비됩니다"],
    lead: ["슈퍼바이저가 현장에서 남긴 점검 결과를 가맹점주와 바로 공유하고,", "정보공개서에 필요한 자료도 손쉽게 모읍니다."],
    points: ["현장 점검 결과 온라인 공유", "가맹점 매출·영업일수 조회", "원부자재·장비 납품 정보"],
  },
];

// 선 아이콘 조각은 선 굵기만큼 SVG 가 칸보다 커서 그만큼 당겨 놓는다. 「매장 연결」의 마지막 조각은 시안이 180도 돌려 두었다(Figma 44:1263).
const FLOW: FlowStep[] = [
  {
    title: "01 템플릿 등록",
    desc: "본사 표준 계약서 준비",
    icon: [
      { src: `${ASSET}/flow-template-1.svg`, width: 60, height: 60, left: 1.67, top: 2 },
      { src: `${ASSET}/flow-template-2.svg`, width: 38, height: 38, left: 13, top: 13 },
    ],
  },
  { title: "02 계약서 작성", desc: "가맹점별로 빠르게 생성", icon: [{ src: `${ASSET}/flow-write.svg`, width: 64, height: 64, left: 0, top: 0 }] },
  {
    title: "03 온라인 서명",
    desc: "가맹점주가 확인 후 서명",
    icon: [
      { src: `${ASSET}/flow-sign-1.svg`, width: 25.3333, height: 14.6667, left: 19.33, top: 3.33 },
      { src: `${ASSET}/flow-sign-2.svg`, width: 46.6667, height: 52, left: 8.67, top: 8.67 },
      { src: `${ASSET}/flow-sign-3.svg`, width: 20, height: 14.6667, left: 22, top: 30 },
    ],
  },
  {
    title: "04 매장 연결",
    desc: "가맹점주 계정과 매장 연결",
    icon: [
      { src: `${ASSET}/flow-link-1.svg`, width: 38.0003, height: 38.0003, left: 24.5, top: 2 },
      { src: `${ASSET}/flow-link-2.svg`, width: 38, height: 38, left: 2.5, top: 24 },
      { src: `${ASSET}/flow-link-3.svg`, width: 20, height: 20, left: 2.5, top: 5 },
      { src: `${ASSET}/flow-link-4.svg`, width: 19, height: 20, left: 42.5, top: 38, rotate: 180 },
    ],
  },
  {
    title: "05 운영 시작",
    desc: "메뉴 배포부터 매장 점검까지",
    icon: [
      { src: `${ASSET}/flow-open-1.svg`, width: 59, height: 18, left: 2.5, top: 3.33 },
      { src: `${ASSET}/flow-open-2.svg`, width: 49, height: 32, left: 7.5, top: 31.33 },
      { src: `${ASSET}/flow-open-3.svg`, width: 21, height: 21, left: 21.5, top: 42.33 },
      { src: `${ASSET}/flow-open-4.svg`, width: 59, height: 4, left: 2.5, top: 17.33 },
      { src: `${ASSET}/flow-open-5.svg`, width: 59, height: 18, left: 2.5, top: 17.33 },
    ],
  },
];

// 아이콘 칸은 폭 74. 레시피 · 점포 SVG 는 그림자 여백만큼 칸보다 커서 그만큼 당겨 놓는다(Figma 44:1315 · 44:1328).
const ADD_ONS: AddOn[] = [
  // 발주 관리 봉투는 재무관리 화면과 같은 그림이다(뒤판은 흰색이 옅어지는 쪽).
  {
    name: "발주 관리",
    desc: "본사가 구독하면 가맹점도 함께 사용",
    icon: <OrderIcon back="/guest/finance-management/addon-order-back.svg" front="/guest/add-on-services/order-mail-front.svg" />,
  },
  {
    name: "레시피 관리",
    desc: "어느 가맹점에서도 같은 맛 그대로",
    icon: (
      <span className="relative block h-[74px] w-[67.83px]">
        <Image src={`${ASSET}/addon-recipe.svg`} alt="" width={80.8159} height={83.7806} className="absolute top-[-1.2px] left-[-12.98px] max-w-none" />
      </span>
    ),
  },
  {
    name: "점포수 추가",
    desc: "가맹점이 늘어나는 만큼 확장",
    icon: (
      <span className="relative block size-[74px]">
        <Image src={`${ASSET}/addon-store.svg`} alt="" width={98.9649} height={79.6842} className="absolute top-[-5.68px] left-[-12.48px] max-w-none" />
      </span>
    ),
  },
];

export function Franchise({ routes }: { routes: GuestRoutes }) {
  return (
    // 맨 아래 부가서비스 구역(회색 바탕)이 푸터에 바로 붙는 시안이라 본문 아래 60px 여백을 두지 않는다.
    <GuestPage flush>
      <IntroMoments routes={routes} light="가맹점이 늘수록," bold="본사가 바빠지는 이유" items={MOMENTS} />
      <IntroFeatures light="프랜차이즈 본사," bold="이렇게 달라집니다" items={FEATURES} backdrop={false} />
      <IntroFlow light="계약서 한 장에서" bold="가맹점 오픈까지" steps={FLOW} />
      <IntroAddOns routes={routes} items={ADD_ONS} raised />
    </GuestPage>
  );
}
