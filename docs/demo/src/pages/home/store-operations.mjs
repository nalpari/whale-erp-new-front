// 매장운영 소개. 앱 디자인 샘플 src/app/design/guest/store-operations/page.tsx(Figma 로그인전_공유 · 매장운영 44:661, 2026-11-06)를 옮겼다. 구역 틀은 재무관리와 같이 쓴다(guest-intro.mjs).
import * as g from "../../guest.mjs";
import * as intro from "../../guest-intro.mjs";

const S = "store-operations";

const MOMENTS = [
  {
    before: { title: "계약서 쓸 틈도 없이 시작된 첫 출근", desc: "첫 출근은 했는데, 계약서는 아직" },
    after: { title: "출근 전, 휴대폰으로 계약서 서명 완료", desc: "휴대폰으로 간편하게 근로계약서 서명을 마치세요." },
  },
  {
    before: { title: "파트타이머 급여 계산할 때마다 한숨", desc: "근무시간 확인부터 급여 계산까지 막막" },
    after: { title: "출퇴근 기록 그대로, 정확한 급여명세서", desc: "기록된 근무시간을 반영해 급여 내역을 정리하세요." },
  },
  {
    before: { title: "고장 난 장비, 지난 수리 기록은 어디에?", desc: "또 고장 난 장비, 지난 수리 기록은 어디에?" },
    after: { title: "장비별 수리 이력으로 바로 대응", desc: "이전 수리 내역을 확인하고 고장에 빠르게 대응하세요." },
  },
];

const FEATURES = [
  {
    id: "store",
    photo: `${S}/feature-store.png`,
    tab: "점포 관리",
    no: "01 점포 관리",
    title: ["매장 정보,", "찾지 말고 바로 꺼내세요"],
    lead: ["사업자번호, 계약 기간, 평수와 좌석 수까지 한곳에 정리됩니다.", "서류함을 뒤지던 시간이 사라집니다."],
    points: ["운영·폐점 상태까지 한눈에 보는 점포 정보", "가맹계약 기간과 상태 정리", "평수·좌석 수·주요 장비 기록"],
  },
  {
    id: "inspection",
    photo: `${S}/feature-inspection.png`,
    tab: "점검 · 시설물",
    no: "02 점검 · 시설물",
    title: ["고장 나기 전에,", "점검 기록이 먼저 알려줍니다"],
    lead: ["위생·운영 점검 결과를 기록하고 직원과 바로 공유하세요.", "장비별 수리 이력이 남아 같은 고장에 두 번 당황하지 않습니다."],
    points: ["템플릿으로 빠르게 끝내는 점검표", "시설물·장비 정보를 한곳에", "수리 이력과 수리비까지 재무에 연결"],
  },
  {
    id: "contract",
    photo: `${S}/feature-contract.png`,
    tab: "근로계약 · 급여",
    no: "03 근로계약 · 급여",
    title: ["계약서와 급여명세서,", "더는 미루지 마세요"],
    lead: ["직원 앱으로 근로계약서를 보내면 직원이 휴대폰으로 바로 서명합니다.", "급여명세서도 빠짐없이 발급해 노무 걱정을 덜어드립니다."],
    points: ["정직원·파트타이머 전자 근로계약서", "급여명세서·연장근무 수당명세서", "직원 앱으로 명세서 바로 발송"],
  },
  {
    id: "attendance",
    photo: `${S}/feature-attendance.png`,
    tab: "근무 · 출퇴근",
    no: "04 근무 · 출퇴근",
    title: ["몇 시에 왔더라?", "이제 기록이 답합니다"],
    lead: ["직원은 매장 QR만 찍으면 출퇴근 끝.", "근무표와 실제 출근 기록을 나란히 보고, 오늘 할 일은", "TO-DO로 전달하세요."],
    points: ["주간 근무 스케줄 공유", "QR 한 번으로 출퇴근 기록", "직원별 TO-DO 리스트"],
  },
];

const FLOW = [
  { title: "01 직원 초대", desc: "카톡·문자로 가입 링크 전송", icon: g.STAFF_ICON },
  { title: "02 계약서 서명", desc: "지원자 휴대폰으로 바로 전자서명", icon: [{ src: `${S}/flow-sign.svg`, width: 64, height: 64, left: 0, top: 0 }] },
  {
    title: "03 근무표 공유",
    desc: "나의 이번 주 스케줄을 한눈에",
    icon: [
      { src: `${S}/flow-schedule-1.svg`, width: 57.3682, height: 30.6686, left: 3.34, top: 3.33 },
      { src: `${S}/flow-schedule-2.svg`, width: 57.3334, height: 17.3282, left: 3.33, top: 30 },
      { src: `${S}/flow-schedule-2.svg`, width: 57.3334, height: 17.3282, left: 3.33, top: 43.33 },
    ],
  },
  {
    title: "04 QR 출퇴근",
    desc: "도착 후 매장 QR만 찍으면 끝",
    icon: [
      { src: `${S}/flow-clock-1.svg`, width: 57.3333, height: 57.3333, left: 3.33, top: 3.33 },
      { src: `${S}/flow-clock-2.svg`, width: 14.6671, height: 25.3338, left: 30, top: 14 },
    ],
  },
  { title: "05 급여 명세서", desc: "근무 기록 그대로 정확하게", icon: [{ src: `${S}/flow-payslip.svg`, width: 64, height: 64, left: 0, top: 0 }] },
];

// 아이콘 칸은 폭 74. 재고 · 대기 순번 SVG 는 그림자 여백만큼 칸보다 커서 그만큼 당겨 놓는다(Figma 44:903).
const ADD_ONS = (A) => [
  {
    name: "점포 재고 관리",
    desc: "떨어지기 전에 미리 확인하는 재고",
    icon: `<span class="relative block h-[74px] w-[71.94px]">${g.gimg(A, `${S}/addon-stock.svg`, 88.1962, 96.0942, "absolute top-[-11.68px] left-[-12.98px] max-w-none")}</span>`,
  },
  { name: "예약 관리", desc: "방문 예약을 날짜·시간별로 한눈에", icon: g.calendarIcon() },
  {
    name: "대기 순번 관리",
    desc: "기다리는 손님에게 차례를 깔끔하게 안내",
    icon: `<span class="relative block h-[70.96px] w-[74px]">${g.gimg(A, `${S}/addon-waiting.svg`, 89.1891, 87.6633, "absolute top-0 left-0 max-w-none")}</span>`,
  },
];

export default ({ A, R }) => ({
  title: "매장운영",
  head: g.head(A),
  html: g.page(A, R, {
    current: "home/store-operations.html",
    main:
      intro.moments(A, R, "사장님,", "이런 순간 있으셨죠?", MOMENTS) +
      intro.features(A, "매장운영,", "이렇게 달라집니다", FEATURES) +
      intro.flow(A, "채용부터 월급날까지,", "끊김 없이", FLOW) +
      intro.addOns(A, R, ADD_ONS(A)),
    flush: true,
  }),
});
