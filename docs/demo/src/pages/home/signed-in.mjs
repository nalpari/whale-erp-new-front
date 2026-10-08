// 로그인 후 홈(BP 마스터). 목업 docs/mockup/home/signed-in.html.
// 범위 선택기가 「전체」면 BP 마스터 화면, 점포 하나를 고르면 점포 하나 화면(HOME-6 B, 2026-10-06 재영)으로 바뀐다(erp.js initScopeView).
// 목업 맨 위 역할 전환 탭과 서비스 바로가기 칸 설명은 뺐다.
// 경고 밴드와 수치 카드는 1팀 공통 컴포넌트에 없어 이 화면 안에서 토큰으로 만들었다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as p from "../../staff-parts.mjs";
import { erpHeader, link, STORES } from "../../site.mjs";

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
    figure(A, link(R, "support/inquiries.html"), "내 문의", "2", "건", "답변 대기 1 · 답변 완료 1"),
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
    ["문의", "답변 완료 1건", "KIOSK 영수증 프린터 연동 문의", "support/inquiries.html"],
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

  const all = `<div data-scope-view="all" class="flex flex-col gap-[12px]">${top}${figures}<div class="grid grid-cols-[7fr_5fr] items-start gap-[12px]">${stores}${waiting}</div></div>`;
  const body = `<div class="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto p-[24px]">${all}${oneStore(A, R)}</div>`;
  const titleRight = `<div class="flex items-center gap-[10px]"><span class="text-[13px] text-erp-label">09-03 09:40 기준</span><button type="button" aria-label="다시 불러오기" class="grid h-[32px] w-[38px] place-items-center rounded-[2px] border border-erp-button-line bg-white">${ui.img(A, "reset.svg", 14, 14)}</button></div>`;
  return { title: "홈", html: ui.erpFrame({ header: erpHeader(A, R), title: "안녕하세요, 정하윤님", titleRight, body }) };
};

// ── 점포 하나 화면(HOME-6 B) ──
// 데모라 어느 점포를 골라도 을지로점 예시 직원·근무스케줄을 보인다. 점포 이름과 운영 점포 정보만 고른 점포로 바뀐다.
// 근무 막대는 근무스케줄 관리와 같은 부품·색이고, 근무 유형(주간·오픈·미들·마감)은 보이지 않는다(2026-10-08 재영).
// [이름, 고용 형태, 시작 시, 끝 시(익일은 24+), 근무요일(0=일)]
const CREW = [
  ["김민재", "정직원", 9, 18, [1, 2, 3, 4, 5]],
  ["최유나", "정직원", 11, 20, [2, 3, 4, 5, 6]],
  ["이수빈", "파트타이머", 9, 15, [1, 4, 5]],
  ["강다은", "파트타이머", 12, 18, [1, 2, 3, 4, 5]],
  ["정우진", "파트타이머", 13, 19, [4, 5, 6, 0]],
  ["한지원", "파트타이머", 18, 25, [4, 5, 6, 0]],
];
const hm = (h) => (h >= 24 ? `익일 ${String(h - 24).padStart(2, "0")}:00` : `${String(h).padStart(2, "0")}:00`);
const span = (c) => `${hm(c[2])}~${hm(c[3])}`;
const WD = "일월화수목금토";
const days = (c) => {
  const d = c[4];
  if (d.length === 5 && d.join() === "1,2,3,4,5") return "월~금";
  if (d.join() === "2,3,4,5,6") return "화~토";
  if (d.join() === "4,5,6,0") return "목~일";
  return d.map((n) => WD[n]).join("·");
};
const HOLIDAY = ["2026-09-24", "2026-09-25", "2026-09-26"];
const TODAY = "2026-09-03";

function oneStore(A, R) {
  const head = (title, right = "") =>
    `<div class="flex items-center gap-[6px]"><h2 class="flex-1 text-[18px] font-semibold text-erp-ink">${title}</h2>${right}</div>`;
  const card = (inner, cls = "") => `<section class="${CARD} flex min-w-0 flex-col gap-[12px] p-[24px] ${cls}">${inner}</section>`;
  const kv = (rows) => `<dl class="grid grid-cols-[84px_1fr] gap-x-[12px] gap-y-[8px] text-[14px]">${rows.map(([k, v]) => `<dt class="text-erp-label">${k}</dt><dd class="min-w-0 truncate text-erp-ink">${v}</dd>`).join("")}</dl>`;
  const soft = (label, href) => ui.button(label, { variant: "soft", href: link(R, href) });

  const notices = card(
    `<div class="flex items-center gap-[18px]"><h2 class="text-[18px] font-semibold text-erp-ink">공지사항</h2><div class="flex min-w-0 flex-1 gap-[24px] overflow-hidden text-[14px]">${[
      ["업데이트", "급여명세서 일괄 발송 기능이 추가되었습니다", "09-01"],
      ["점검", "정기 시스템 점검 안내 (09-14 02:00~05:00)", "08-29"],
      ["안내", "추석 연휴 고객센터 운영 안내", "08-27"],
    ]
      .map(([k, t, d]) => `<a href="${link(R, "support/notices.html")}" class="flex shrink-0 items-center gap-[6px] hover:underline">${p.tag("quiet", k)}${t}${p.sub(d)}</a>`)
      .join("")}</div>${soft("공지 목록", "support/notices.html")}</div>`,
  );

  // 운영 점포 정보: 점포 목록(site.mjs STORES)의 값. 고른 점포로 erp.js 가 채운다.
  const storeMap = Object.fromEntries(STORES.map((s) => [s[1], [s[2], s[4], s[5], s[8]]]));
  const info = card(
    head("운영 점포 정보", soft("점포 정보", "stores/detail.html")) +
      kv([
        ["점포", '<span data-scope-name>모리커피 을지로점</span>'],
        ["유형", '<span data-store-field="0">가맹점포</span>'],
        ["사업자번호", '<span data-store-field="1">201-12-34567</span>'],
        ["전화번호", '<span data-store-field="2">02-2265-0917</span>'],
        ["주소", '<span data-store-field="3">서울 중구</span>'],
      ]),
  ).replace("<section ", `<section data-stores='${JSON.stringify(storeMap)}' `);

  const pay = card(
    head("직원 급여", soft("급여명세서", "staff/payslips.html")) +
      `<div class="flex flex-col gap-[4px]"><span class="text-[14px] text-erp-label">9월 급여 지급 예정</span><span class="text-[22px] font-semibold">1,184<span class="ml-[2px] text-[14px] font-medium">만원</span></span><span class="text-[13px] text-erp-label">직원 6명 · 급여명세서 합계</span></div>` +
      kv([["정직원 2명", "642만원"], ["파트타이머 4명", "542만원"]]),
  );

  const todo = card(
    head("TO-DO", soft("TO-DO 리스트", "staff/todos.html")) +
      `<div class="flex items-end justify-between"><span class="text-[14px] text-erp-label">오늘 완료</span><span class="text-[22px] font-semibold">7<span class="ml-[2px] text-[14px] font-medium">/ 12건</span></span></div>` +
      `<div class="h-[6px] overflow-hidden rounded-[2px] bg-erp-subtle"><div class="h-full w-[58%] bg-erp-brand"></div></div>` +
      `<span class="text-[13px] text-erp-label">미완료 5건 · ${p.mark("warn", "긴급 1")}</span>` +
      `<ul class="flex flex-col border-t border-erp-thead-line text-[14px]">${[
        [p.tag("risk", "긴급"), "냉장고 재료 폐기", "오늘 14:00 · 근무지 전체"],
        [p.tag("quiet", "일반"), "신메뉴 POP 교체", "김민재 · 진행 중"],
      ]
        .map(([t, title, d]) => `<li class="flex items-center gap-[8px] border-b border-erp-thead-line py-[8px]">${t}<a class="min-w-0 flex-1 truncate hover:underline" href="${link(R, "staff/todos.html")}">${title}</a>${p.sub(d)}</li>`)
        .join("")}</ul>`,
  );

  const ask = card(
    head("내 문의", soft("문의 내역", "support/inquiries.html")) +
      `<span class="text-[13px] text-erp-label">답변 대기 ${p.mark("warn", "1")}건 · 전체 2건</span>` +
      `<ul class="flex flex-col border-t border-erp-thead-line text-[14px]">${[
        [p.tag("warn", "접수"), "급여명세서 발송 후 직원 앱에서 보이지 않습니다", "09-02"],
        [p.tag("ok", "답변완료"), "근무스케줄을 주 단위로 일괄 등록할 수 있나요", "08-27"],
      ]
        .map(([t, title, d]) => `<li class="flex items-center gap-[8px] border-b border-erp-thead-line py-[8px]">${t}<a class="min-w-0 flex-1 truncate hover:underline" href="${link(R, "support/inquiry-detail.html")}">${title}</a>${p.sub(d)}</li>`)
        .join("")}</ul>`,
  );

  // 근무스케줄: 근무스케줄 관리와 같은 부품(staff-parts schedWeek·schedMonth, 2026-10-08 재영). 홈은 그날 근무자만 보인다.
  // 주간 보기는 주 이동 + 날짜가 붙은 요일 칩 + 09시~익일 02시 시간축(17칸) + 근무 인원 줄. 월간 보기는 2026년 9월 달력.
  const crew = CREW.map((c) => [c[0], c[1], Object.fromEntries(c[4].map((wd) => [wd, [c[2], c[3]]]))]);
  const week =
    p.bar(p.weekNav(A, "", "2026-08-31"), `<span class="text-[14px] text-erp-label">근무 <b class="font-semibold text-erp-ink" data-wd-count>${crew.filter((c) => c[2][4]).length}</b>명</span>`) +
    p.schedWeek(crew, { open: 9, close: 26, dates: { 1: 31, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 }, pick: 4 });
  const month = p.schedMonth(A, crew, { year: 2026, month: 8, today: TODAY, holiday: Object.fromEntries(HOLIDAY.map((d) => [d, "추석"])) });

  const sched = card(
    head(
      `근무스케줄 <span class="ml-[6px] text-[14px] font-normal text-erp-label">영업일 기준 · 마감 익일 02:00</span>`,
      x.segment("근무스케줄 보기", [
        { id: "home-week", label: "주간 보기" },
        { id: "home-month", label: "월간 보기" },
      ]) + soft("근무스케줄 관리", "staff/work-schedules.html"),
    ) +
      x.tabPanel("home-week", week, true) +
      x.tabPanel("home-month", month, false),
  );

  // 직원 정보: 시안의 직원 표. 직원 초대 버튼 대신 계약서 작성, 직원 수 상한 표시는 뺐다.
  const staffRows = [
    ...CREW.map((c, i) => [
      ui.link(c[0], link(R, "staff/detail.html")),
      c[1],
      span(c),
      days(c),
      [
        `${p.tag("ok", "체결 완료")} ${p.sub("무기한")}`,
        `${p.tag("ok", "체결 완료")} ${p.sub("무기한")}`,
        `${p.tag("warn", "갱신 예정 · D-18")} ${p.sub("~09-21")}`,
        `${p.tag("warn", "서명 대기")} ${p.sub("날인 기한 09-27")}`,
        `${p.tag("ok", "체결 완료")} ${p.sub("~2027-02-28")}`,
        `${p.tag("ok", "체결 완료")} ${p.sub("~2027-05-31")}`,
      ][i],
      "재직",
    ]),
    [ui.link("박서연", link(R, "staff/index.html")), "파트타이머", p.sub("—"), p.sub("—"), `${p.tag("risk", "연결 보류")} ${p.sub("번호 불일치")}`, p.sub("가입 대기")],
  ];
  const staff = card(
    head(
      `직원 정보 <span class="ml-[6px] text-[14px] font-normal text-erp-label">재직 6 · 가입 대기 1</span>`,
      soft("근로계약 관리", "staff/contracts.html") + soft("직원 관리", "staff/index.html") + ui.button("계약서 작성", { href: link(R, "staff/contracts-new.html") }),
    ) +
      ui.dataTable(
        [
          { header: "직원", width: "w-[110px]" },
          { header: "구분", width: "w-[110px]" },
          { header: "근무 시간", width: "w-[170px]" },
          { header: "근무요일", width: "w-[110px]" },
          { header: "근로계약", align: "left" },
          { header: "상태", width: "w-[100px]" },
        ],
        staffRows,
      ),
  );

  return `<div data-scope-view="one" class="flex flex-col gap-[12px]" hidden>${notices}<div class="grid grid-cols-4 items-start gap-[12px]">${info}${pay}${todo}${ask}</div>${sched}${staff}</div>`;
}
