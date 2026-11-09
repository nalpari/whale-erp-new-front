// 재무관리 소개. 앱 디자인 샘플 src/app/design/guest/finance-management/page.tsx(Figma 로그인전_공유 · 재무관리 44:1412, 2026-11-06)를 옮겼다. 구역 틀은 매장운영과 같이 쓴다(guest-intro.mjs).
import * as g from "../../guest.mjs";
import * as intro from "../../guest-intro.mjs";

const S = "finance-management";

const MOMENTS = [
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

const FEATURES = [
  {
    id: "account",
    photo: `${S}/feature-account.png`,
    tab: "입출금",
    no: "01 입출금",
    title: ["통장 내역,", "은행 앱 열지 않고 확인하세요"],
    lead: ["사업자 통장 거래를 자동으로 불러오고,", "입출금마다 메모와 계정을 붙여 깔끔하게 정리합니다."],
    points: ["실시간 입출금 현황", "거래별 메모 관리", "항목별 회계 계정 연결"],
  },
  {
    id: "transaction",
    photo: `${S}/feature-transaction.png`,
    tab: "매출 · 매입 등록",
    no: "02 매출 · 매입 등록",
    title: ["현금 거래도", "장부에서 빠지지 않게"],
    lead: ["통장에 찍히지 않는 현금 매출, 카드로 산 식자재까지 직접 등록하세요.", "새는 돈 없이 모든 거래가 기록됩니다."],
    points: ["매출·매입·지출 거래 등록", "영수증 보며 간편하게 입력", "급여·수리비 자동 반영"],
  },
  {
    id: "ledger",
    photo: `${S}/feature-ledger.png`,
    tab: "계정별 현황",
    no: "03 계정별 현황",
    title: ["어디로 돈이 새는지,", "비율로 보입니다"],
    lead: ["인건비, 재료비, 임대료가 매출의 몇 %인지 계정별로 확인하세요.", "줄여야 할 곳이 선명해집니다."],
    points: ["기간별 계정 현황", "매출 대비 항목별 비율", "점포별 회계 상황 비교"],
  },
  {
    id: "sales",
    photo: `${S}/feature-sales.png`,
    tab: "매출 조회 · 통계",
    no: "04 매출 조회 · 통계",
    title: ["지난달보다 잘 팔렸을까?", "숫자로 확인하세요"],
    lead: ["판매 채널, 결제수단, 상품별로 매출을 나눠 보고 전월·전년과 비교합니다.", "감이 아닌 데이터로 다음 달을 준비하세요."],
    points: ["점포별 매출 조회", "전월·전년 대비 비교", "상품별 판매 내역"],
  },
];

// 「거래 추가」는 원 둘과 더하기를 겹친 그림이다. 선 굵기만큼 SVG 가 칸보다 커서 그만큼 당겨 놓는다(Figma 44:1621).
const FLOW = [
  { title: "01 통장 연동", desc: "사업자 통장 내역 불러오기", icon: [{ src: `${S}/flow-bank.svg`, width: 64, height: 64, left: 0, top: 0 }] },
  { title: "02 계정 연결", desc: "거래마다 회계 계정 지정", icon: [{ src: `${S}/flow-ledger.svg`, width: 64, height: 64, left: 0, top: 0 }] },
  {
    title: "03 거래 추가",
    desc: "현금·카드 매입 직접 등록",
    icon: [
      { src: `${S}/flow-add-1.svg`, width: 55, height: 56, left: 4, top: 3 },
      { src: `${S}/flow-add-2.svg`, width: 20.0011, height: 20.0011, left: 5, top: 4 },
      { src: `${S}/flow-add-3.svg`, width: 24, height: 24, left: 19, top: 19 },
    ],
  },
  { title: "04 비율 확인", desc: "매출 대비 항목별 비중", icon: [{ src: `${S}/flow-ratio.svg`, width: 64, height: 64, left: 0, top: 0 }] },
  { title: "05 기간 비교", desc: "전월·전년과 나란히 비교", icon: [{ src: `${S}/flow-compare.svg`, width: 64, height: 64, left: 0, top: 0 }] },
];

// 「재무관리 구독」 — 그라데이션 원 위에 유리 원, 그 위에 원화 기호 선 아이콘(Figma 44:1705).
const financeIcon = (A) =>
  `<span class="relative block size-[74px]"><span class="absolute top-[11.98px] left-0 h-[62.03px] w-[61.53px] rounded-full shadow-[inset_0_4px_4px_rgba(255,255,255,0.25)]" style="background-image:${g.ICON_GRADIENT}"></span><span class="absolute top-0 left-[15.56px] size-[52.44px] rounded-full ${g.GLASS}"></span>${g.gimg(A, `${S}/addon-finance.svg`, 38, 38, "absolute top-[7px] left-[23px] max-w-none")}</span>`;

const ADD_ONS = (A) => [
  { name: "POS", desc: "팔기만 하면 매출이 자동으로 모입니다", icon: g.posIcon(A) },
  // 봉투 뒤판은 부가서비스 화면과 달리 흰색이 아래로 옅어지는 그림이다(Figma 44:1689). 앞판은 같은 그림이다.
  { name: "발주 관리", desc: "자재 주문부터 결제까지 한 번에", icon: g.orderIcon(A, `${S}/addon-order-back.svg`, "add-on-services/order-mail-front.svg") },
  { name: "재무관리 구독", desc: "필요한 매장에만 재무 기능 추가", icon: financeIcon(A) },
];

export default ({ A, R }) => ({
  title: "재무관리",
  head: g.head(A),
  html: g.page(A, R, {
    current: "home/finance-management.html",
    main:
      intro.moments(A, R, "장부 정리,", "아직도 월말에 몰아서 하시나요?", MOMENTS) +
      intro.features(A, "재무관리,", "이렇게 달라집니다", FEATURES) +
      intro.flow(A, "거래가 쌓일수록", "매장이 선명해집니다.", FLOW) +
      intro.addOns(A, R, ADD_ONS(A)),
    flush: true,
  }),
});
