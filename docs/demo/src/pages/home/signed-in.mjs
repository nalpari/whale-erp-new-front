// 로그인 후 홈(BP 마스터 · 전체). 목업 docs/mockup/home/signed-in.html 의 BP 마스터 화면.
// 목업 맨 위 역할 전환 탭(가맹관리자 화면)과 서비스 바로가기 칸 설명은 뺐다.
// 경고 밴드와 수치 카드는 1팀 공통 컴포넌트에 없어 이 화면 안에서 토큰으로 만들었다.
import * as ui from "../../ui.mjs";
import { erpHeader, link } from "../../site.mjs";

const CARD = "rounded-[4px] border border-erp-panel-line bg-white";
// 경고 밴드: 흰 카드 한 줄에 상태 배지 + 문장 + 바로 갈 버튼
const band = (badge, text, actions) =>
  `<div class="${CARD} flex items-center gap-[12px] px-[24px] py-[12px]">${badge}<p class="flex-1 text-[15px] font-semibold">${text}</p><div class="flex gap-[6px]">${actions}</div></div>`;
// 수치 카드: 라벨 · 숫자 · 아랫줄. 카드 전체가 링크라 호버에 테두리 색만 바뀐다.
const figure = (A, href, label, value, unit, sub) =>
  `<a href="${href}" class="${CARD} flex flex-col gap-[10px] p-[24px] transition-[border-color] duration-150 ease-out hover:border-erp-brand"><span class="flex items-center gap-[6px] text-[14px] font-medium text-erp-label">${label}${ui.img(A, "chevron-small.svg", 5, 8, "rotate-180")}</span><span class="text-[22px] font-semibold">${value}<span class="ml-[2px] text-[14px] font-medium">${unit}</span></span><span class="text-[14px] text-erp-label">${sub}</span></a>`;
const warn = (t) => `<span class="text-erp-off">${t}</span>`;

export default ({ A, R }) => {
  const top = band(
    ui.badge("off", "갱신 예정"),
    "계약 갱신 예정 2건이 7일 안에 끝납니다",
    ui.button("계약 보기", { variant: "soft", href: link(R, "staff/contracts.html") }) + ui.button("새 계약 작성", { href: link(R, "staff/contracts-new.html") }),
  );

  const figures = `<div class="grid grid-cols-4 gap-[12px]">${[
    figure(A, link(R, "staff/index.html"), "재직 직원", "63", "명", `${warn("미체결 계약 3")} · 정직원 21 · 파트 42`),
    figure(A, link(R, "stores/index.html"), "운영 점포", "11", "개점", "직영 4 · 가맹 7"),
    figure(A, link(R, "staff/attendance.html"), "오늘 출근", "27", "명", `근무 예정 31 · ${warn("미출근 4")}`),
    figure(A, link(R, "support/index.html#inquiries"), "내 문의", "2", "건", "답변 대기 1 · 답변 완료 1"),
  ].join("")}</div>`;

  const nil = '<span class="text-erp-muted">—</span>';
  // 재직 직원 수는 site.mjs STORES(점포 목록의 근무직원수)와 같게 둔다.
  const storeRows = [
    ["모리커피 성수점", "직영", 8, 1, "3 / 4", 3],
    ["모리커피 을지로점", "가맹", 5, 1, "4 / 5", 2],
    ["모리커피 연남점", "가맹", 6, 1, "2 / 3", 1],
    ["모리커피 서초점", "직영", 9, 0, "7 / 8", 1],
    ["온기식당 판교점", "직영", 7, 0, "4 / 4", 0],
    ["온기식당 둔산점", "가맹", 6, 0, "3 / 3", 0],
    ["모리커피 청담점", "가맹", 0, 0, null, 0],
  ].map(([name, type, staff, open, today, todo]) => [name, type, staff || nil, open || nil, today ?? nil, todo || nil]);
  const stores = `<section class="${CARD} flex flex-col gap-[12px] p-[24px]">${ui.sectionHead(
    "점포별 현황",
    `<span class="self-center pr-[6px] text-[14px] text-erp-label">전체 11개점</span><div class="w-[96px] shrink-0">${ui.select(["전체", "직영", "가맹"], { "aria-label": "점포 유형" })}</div>`,
  )}${ui.dataTable(
    [
      { header: "점포", align: "left" },
      { header: "유형", width: "w-[70px]" },
      { header: "재직 직원", width: "w-[86px]" },
      { header: "미체결 계약", width: "w-[96px]" },
      { header: "오늘 출근", width: "w-[86px]" },
      { header: "미조치", width: "w-[70px]" },
    ],
    storeRows,
  )}<div class="flex items-center text-[14px]"><p class="flex-1 text-erp-label">11개점 중 상위 7개 · 미조치 많은 순</p>${ui.link("직원 목록", link(R, "staff/index.html"))}</div></section>`;

  const todo = [
    ["계약", "근로계약 서명 대기 3건", "남도현 외 2명 · 발송 후 6일 경과", "staff/contracts.html"],
    ["직원", "가입 연결 확인 필요 1건", "번호 불일치 · 4일 경과", "staff/index.html"],
    ["직원", "소속 확인 거절 1건", "이준호 · 서초점", "staff/index.html"],
    ["계약", "계약 갱신 예정 2건", "서지안 09-08 · 문태경 09-10 · 새 근로계약서 초안 없음", "staff/contracts.html"],
    ["문의", "답변 완료 1건", "KIOSK 영수증 프린터 연동 문의", "support/index.html#inquiries"],
    ["TO-DO", "긴급 TO-DO 미완료 1건", "성수점 · 냉장고 재료 폐기 · 오늘 14:00", "staff/todos.html"],
  ];
  const waiting = `<section class="${CARD} flex flex-col gap-[12px] p-[24px]">${ui.sectionHead("처리 대기", '<p class="text-[14px]">총 <b class="font-semibold">10</b> 건</p>')}${ui.dataTable(
    [
      { header: "구분", width: "w-[70px]" },
      { header: "항목", align: "left", width: "w-[190px]" },
      { header: "내용", align: "left" },
    ],
    todo.map(([kind, title, desc, href]) => [kind, ui.link(title, link(R, href)), `<span class="text-erp-label">${desc}</span>`]),
  )}</section>`;

  const body = `<div class="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto p-[24px]">${top}${figures}<div class="grid grid-cols-[7fr_5fr] items-start gap-[12px]">${stores}${waiting}</div></div>`;
  const titleRight = `<div class="flex items-center gap-[10px]"><span class="text-[13px] text-erp-label">09-03 09:40 기준</span><button type="button" aria-label="다시 불러오기" class="grid h-[32px] w-[38px] place-items-center rounded-[2px] border border-erp-button-line bg-white">${ui.img(A, "reset.svg", 14, 14)}</button></div>`;
  return { title: "홈", html: ui.erpFrame({ header: erpHeader(A, R), title: "안녕하세요, 정하윤님", titleRight, body }) };
};
