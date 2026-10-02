// 직원관리 화면들이 같이 쓰는 내용. 목업 docs/mockup/staff/index.html 은 탭 하나에 모두 있었는데,
// 데모에서는 헤더 메뉴의 소메뉴마다 화면을 나눴다(2026-10-02 재영): 직원 정보·근로계약·근무스케줄·출퇴근 현황·급여명세서·TO-DO.
// 목업에서 목록 옆에 붙어 있던 등록·수정 폼(근무스케줄, 기록 보정, TO-DO)은 슬라이드 패널로 옮겼다.
import * as ui from "./ui.mjs";
import * as x from "./extra.mjs";
import * as p from "./staff-parts.mjs";
import { link } from "./site.mjs";

export function staffSections({ A, R }) {
  const L = (path) => link(R, path);
  const offBtn = (label, a = {}) => ui.button(label, { variant: "off", ...a });
  const pageNav = (n) => `<div class="pt-[14px]">${ui.pagination(A, 1, n)}</div>`;

  // ── 직원 목록 ──
  const staffCols = [
    { header: "직원", width: "w-[160px]", align: "left" },
    { header: "휴대전화번호", width: "w-[140px]" },
    { header: "점포", align: "left" },
    { header: "고용형태", width: "w-[110px]" },
    { header: "가입·인증", width: "w-[210px]" },
    { header: "계약 상태", width: "w-[160px]" },
    { header: "이번 주", width: "w-[90px]" },
    { header: "재직", width: "w-[110px]" },
  ];
  const D = L("staff/detail.html");
  const PHOTO = { 서지안: 1, 오세라: 4, 문태경: 2, 배정숙: 5, 남도현: 3, 하준서: 6 };
  const who = (name, href) =>
    `<span class="flex items-center gap-[10px]">${p.avatar(A, name, PHOTO[name])}${href ? ui.link(name, href) : name}</span>`;
  const staffRows = [
    [who("서지안", D), "010-2841-7702", "모리커피 서초점", "정직원", p.tag("ok", "가입 완료"), p.tag("ok", "체결 완료"), "38.5h", p.mark("ok", "재직")],
    [who("오세라", D), "010-3392-4418", "모리커피 서초점", "정직원", p.tag("ok", "가입 완료"), p.tag("ok", "체결 완료"), "40.0h", p.mark("ok", "재직")],
    [who("문태경", D), "010-4471-2298", "온기식당 판교점", "정직원", p.tag("ok", "가입 완료"), p.tag("ok", "체결 완료"), "42.0h", p.mark("ok", "재직")],
    [who("배정숙", D), "010-8820-3317", "온기식당 판교점", "파트타이머", p.tag("ok", "가입 완료"), p.tag("warn", "갱신 예정 D-20"), "24.0h", p.mark("ok", "재직")],
    [who("남도현"), "010-9014-5563", "모리커피 성수점", "파트타이머", p.tag("warn", "초대 발송 · 08-31"), p.tag("quiet", "발송 대기"), "-", p.mark("subtle", "가입 대기")],
    [who("하준서"), "010-3392-4418", "모리커피 성수점", "파트타이머", `<a href="${L("staff/invites-holds.html")}">${p.tag("risk", "연결 보류")}</a>`, p.tag("quiet", "발송 대기"), "-", p.mark("risk", "확인 필요")],
    [who("정유담"), "010-5518-7734", "온기식당 판교점", "파트타이머", p.tag("info", "소속 추가 확인"), p.tag("quiet", "발송 대기"), "-", p.mark("subtle", "응답 대기")],
    [who("권도윤", D), "010-7742-1160", "모리커피 서초점", "파트타이머", p.tag("ok", "가입 완료"), p.tag("warn", "서명 대기 · D-24"), "18.0h", p.mark("warn", "날인 대기")],
    [who("유하람", D), "010-2093-8875", "모리커피 연남점", "파트타이머", p.tag("ok", "가입 완료"), p.tag("risk", "거부 · 09-02"), "-", p.mark("risk", "재발송 필요")],
    [p.sub("본사 제공 동의 없음"), "-", "모리커피 연남점", "-", "-", "-", "-", "-"],
    [who("민세하"), "010-7725-3390", "모리커피 성수점", "파트타이머", p.tag("risk", "가입 불가(만 19세 미만)"), p.tag("quiet", "발송 대기"), "-", p.mark("risk", "삭제 대상")],
    [who("임채운"), "010-6613-0284", "모리커피 연남점", "파트타이머", p.tag("quiet", "가입 완료"), p.tag("quiet", "종료"), "-", p.mark("subtle", "퇴직 07-31")],
  ];
  // 직원 정보 관리: 점포 목록처럼 왼쪽 필터 + 오른쪽 목록(목업의 목록 위 검색칸·선택칸을 필터로 옮겼다).
  const listFilter = ui.filterPanel(A, [
    ui.filterSection("점포", ui.searchField(A, { placeholder: "점포명" }), { tight: true }),
    ui.filterSection("이름·휴대전화번호", ui.searchField(A, { placeholder: "이름 또는 번호" }), { tight: true }),
    ui.filterSection("고용형태", ui.checkbox(A, "정직원", true) + ui.checkbox(A, "파트타이머", true)),
    ui.filterSection("재직 상태", ui.select(["재직", "퇴직", "전체"], { "aria-label": "재직 상태" }), { tight: true, last: true }),
  ]);
  const listTab =
    ui.listToolbar(
      63,
      ui.button("일괄 저장", { variant: "soft", href: L("staff/export.html") }) +
        `<div class="w-[80px] shrink-0">${ui.select(["20", "50", "100"], { "aria-label": "페이지당 건수" })}</div>`,
    ) +
    ui.dataTable(staffCols, staffRows, "조회된 직원이 없습니다.") +
    pageNav(4);

  // ── 근로계약 ──
  const N = L("staff/contracts-new.html");
  const contractRows = [
    ["남도현", "2026-09-14 ~ 무기한", "11,200 /h", "-", p.tag("quiet", "발송 대기"), offBtn("초대 재발송")],
    ["하준서", "2026-09-14 ~ 무기한", "11,200 /h", "-", p.tag("quiet", "발송 대기"), offBtn("연결 확인", { href: L("staff/invites-holds.html") })],
    ["정유담", "2026-09-18 ~ 2027-03-17", "10,800 /h", "-", p.tag("quiet", "발송 대기"), p.sub("소속 확인 중")],
    ["권도윤", "2026-09-01 ~ 2027-08-31", "11,600 /h", "09-01", p.tag("warn", "서명 대기 · D-24"), offBtn("재발송")],
    [ui.link("유하람", L("staff/contracts-detail.html")), "2026-08-28 ~ 2027-02-27", "10,800 /h", "08-28", p.tag("risk", "거부 · 09-02"), offBtn("상세", { href: L("staff/contracts-detail.html") })],
    ["서지안", "2026-03-01 ~ 무기한", "2,840,000 /월", "02-24", p.tag("ok", "체결 완료"), offBtn("새 계약", { href: N })],
    ["오세라", "2025-11-01 ~ 무기한", "3,420,000 /월", "10-27", p.tag("ok", "체결 완료"), offBtn("새 계약", { href: N })],
    ["배정숙", "2026-02-10 ~ 2026-09-30", "11,600 /h", "02-06", p.tag("warn", "갱신 예정 · D-20"), offBtn("재계약", { href: N })],
    ["임채운", "2025-08-01 ~ 2026-07-31", "10,400 /h", "07-28", p.tag("quiet", "종료"), p.sub("퇴직")],
  ];
  const contractList = p.section(
    "근로계약",
    "",
    p.bar(p.radios("contract-state", ["전체", "발송 대기", "서명 대기", "거부·만료", "갱신 예정"])),
    ui.dataTable(
      [
        { header: "직원", width: "w-[90px]", align: "left" },
        { header: "계약 기간" },
        { header: "급여", width: "w-[130px]" },
        { header: "발송일", width: "w-[80px]" },
        { header: "상태", width: "w-[150px]" },
        { header: "", width: "w-[140px]" },
      ],
      contractRows,
      "조회된 근로계약이 없습니다.",
    ),
    pageNav(7),
  );
  const contractsTab = contractList;

  // ── 근무스케줄·출퇴근 ──
  const schedPanel = "sched-form";
  const fixPanel = "fix-form";
  const ticks = Array.from({ length: 15 }, (_, i) => String(7 + i).padStart(2, "0"));
  const BAR = {
    on: "bg-erp-brand-soft text-white",
    none: "bg-erp-subtle text-erp-muted",
    blocked: "bg-erp-off-bg text-erp-off",
  };
  const tlRow = (name, role, left, width, label, tone = "on") =>
    `<div class="flex h-[46px] items-center border-b border-erp-thead-line"><span class="w-[140px] shrink-0 truncate px-[10px] text-[14px]">${name} <span class="text-erp-muted">${role}</span></span><div class="relative h-[34px] flex-1 rounded-[2px] bg-erp-thead-bg"><div class="absolute inset-y-0 flex items-center truncate rounded-[2px] px-[10px] text-[13px] ${BAR[tone]}" style="left:${left}%;width:${width}%">${label}</div></div></div>`;
  const COVER = ["bg-erp-off-bg text-erp-off", "bg-erp-subtle text-erp-ink", "bg-erp-on-bg text-erp-on"];
  const cover = [0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1];
  const swatch = (i, label) => `<span class="flex items-center gap-[6px]"><span class="size-[12px] rounded-[2px] ${COVER[i]}"></span>${label}</span>`;
  const timeline =
    `<div class="flex flex-col">` +
    `<div class="flex h-[42px] items-center border-y border-erp-thead-line bg-erp-thead-bg"><span class="w-[140px] shrink-0 px-[10px] text-[14px] font-medium text-erp-thead-text">직원</span><div class="grid flex-1 grid-cols-15 text-[12px] text-erp-thead-text">${ticks.map((t) => `<span>${t}</span>`).join("")}</div></div>` +
    tlRow("오세라", "점장", 26.667, 60, "11:00-20:00 · 미들") +
    tlRow("유하람", "바리스타", 33.333, 66.667, "12:00-22:00 · 마감") +
    tlRow("서지안", "바리스타", 0, 100, "휴무", "none") +
    tlRow("권도윤", "바리스타", 0, 100, "휴무", "none") +
    tlRow("하준서", "바리스타", 0, 100, "계약 대기 · 배정 불가", "blocked") +
    `<div class="flex h-[46px] items-center border-b border-erp-thead-line"><span class="w-[140px] shrink-0 px-[10px] text-[14px] text-erp-label">근무 인원</span><div class="grid h-[34px] flex-1 grid-cols-15 gap-px">${cover
      .map((n) => `<span class="grid place-items-center text-[13px] font-medium ${COVER[Math.min(n, 2)]}">${n}</span>`)
      .join("")}</div></div>` +
    `<div class="flex items-center gap-[18px] pt-[12px] text-[13px] text-erp-label">${swatch(0, "아무도 없음")}${swatch(1, "혼자 근무 · 휴게 불가")}${swatch(2, "2명 이상")}</div>` +
    `</div>`;
  const dayView =
    p.bar(
      `<h3 class="text-[16px] font-semibold text-erp-ink">2026-08-22 토</h3>${p.tag("risk", "공백 4시간")}`,
      p.iconButton(A, "prev.svg", "이전 날") +
        p.w("w-[150px]", ui.dateField(A, { label: "날짜", value: "2026-08-22" })) +
        p.iconButton(A, "next.svg", "다음 날") +
        offBtn("오늘") +
        `<span class="pl-[6px] text-[14px] text-erp-label">운영 07:00-22:00</span>`,
    ) +
    timeline +
    p.bar(p.note("07:00-11:00 에 배정된 직원이 없습니다."), ui.slideTrigger("이 시간대에 배정", schedPanel, "soft"));
  const wk = (...c) => c;
  const weekView =
    p.bar(`<h3 class="text-[16px] font-semibold text-erp-ink">주간 근무스케줄</h3>${p.tag("quiet", "모리커피 서초점 · 9명")}`) +
    ui.dataTable(
      [{ header: "직원", width: "w-[120px]", align: "left" }, ...["월 17", "화 18", "수 19", "목 20", "금 21", "토 22", "일 23"].map((h) => ({ header: h })), { header: "주 합계", width: "w-[100px]" }],
      [
        wk("오세라", "09-18", "09-18", p.sub("휴무"), "09-18", "09-18", "11-20", p.sub("휴무"), "45.0h"),
        wk("서지안", "07-16", "07-16", "07-16", "07-16", p.sub("휴무"), p.sub("휴무"), "10-19", "40.0h"),
        wk("하준서", "-", "-", "-", "-", "-", "-", "-", p.sub("계약 대기")),
        wk("권도윤", "13-22", p.sub("휴무"), "13-22", "13-22", "13-22", p.sub("휴무"), "13-22", "45.0h"),
        wk("유하람", p.sub("휴무"), "16-22", "16-22", p.sub("휴무"), "16-22", "12-22", "12-22", "38.0h"),
      ],
    );

  const schedLog = p.section(
    "변경 이력",
    "",
    ui.dataTable(
      [{ header: "일시", width: "w-[120px]" }, { header: "구분", width: "w-[80px]" }, { header: "내용", align: "left" }],
      [
        ["09-01 14:22", "수정", "서지안 09-04 13:00-21:30 → 09:00-17:00 · 정하윤"],
        ["08-31 10:05", "추가", "권도윤 09-01~09-06 일괄 등록 6건 · 정하윤"],
        ["08-28 17:41", p.mark("risk", "삭제"), "배정숙 08-30 마감 삭제 · 정하윤"],
      ],
    ),
  );
  const today = p.section(
    "오늘 출퇴근",
    p.tag("quiet", "08-20 목"),
    ui.dataTable(
      [{ header: "직원", align: "left" }, { header: "예정" }, { header: "출근" }, { header: "퇴근" }, { header: "비고" }],
      [
        ["오세라", p.sub("09:00"), "08:54", p.sub("근무 중"), p.mark("ok", "정상")],
        ["서지안", p.sub("07:00"), "07:02", "16:03", p.mark("ok", "정상")],
        ["권도윤", p.sub("13:00"), p.mark("warn", "13:18"), p.sub("근무 중"), p.mark("warn", "지각 18분")],
        ["유하람", p.sub("-"), "-", "-", p.mark("subtle", "휴무")],
        ["배정숙", p.sub("10:00"), p.sub("미기록"), "-", p.mark("risk", "미출근")],
      ],
    ),
  );
  const rate = (label, pct, n) =>
    `<div class="flex h-[34px] items-center gap-[12px] text-[14px]"><span class="w-[80px] shrink-0 text-erp-label">${label}</span><span class="w-[200px]">${p.meter(pct)}</span><span>${n}</span></div>`;
  const summary = p.section(
    "이번 주 근태 요약",
    "",
    `<div class="flex flex-col">${rate("정상 출근", 88, "54회")}${rate("지각", 8, "5회")}${rate("미기록", 4, "2회")}</div>`,
    ui.detailTable("근로시간", [
      ["총 근로시간", "1,284h"],
      ["연장 근로", "42h"],
      ["야간 근로", "18h"],
      ["주휴 대상", "38명"],
    ]),
  );
  const fixBtns = () => `<span class="flex justify-center gap-[6px]">${ui.slideTrigger("보정", fixPanel, "off")}${offBtn("이상 없음")}</span>`;
  const fixList = p.section(
    "보정이 필요한 기록",
    `<span class="pr-[6px] text-[14px] text-erp-label">최근 3개월 이내만 수정 가능</span>` + ui.button("출퇴근 대신 등록", { variant: "soft" }),
    ui.dataTable(
      [
        { header: "직원", width: "w-[100px]", align: "left" },
        { header: "날짜", width: "w-[80px]" },
        { header: "출근", width: "w-[80px]" },
        { header: "퇴근", width: "w-[80px]" },
        { header: "사유", align: "left" },
        { header: "", width: "w-[230px]" },
      ],
      [
        ["서지안", "09-05", "12:58", "-", p.tag("warn", "퇴근 미등록"), fixBtns()],
        ["권도윤", "09-03", "-", "21:12", p.tag("warn", "출근 미등록"), fixBtns()],
        ["배정숙", "09-02", "08:47", "23:58", p.tag("risk", "퇴근 시각 이상"), fixBtns()],
        ["남주호", "09-01", "09:04", "18:02", p.tag("risk", "위치 조작 감지"), fixBtns()],
        ["문태경", "08-29", "09:02", "18:30", `${p.tag("info", "수정됨")} ${p.sub("08-30 정하윤")}`, offBtn("이력")],
        ["오세라", "08-27", "10:00", "16:00", `${p.tag("info", "대신 등록")} ${p.sub("위치 수집 일시 중지 · 정하윤")}`, offBtn("이력")],
      ],
    ),
  );
  const schedTab =
    p.bar(
      p.iconButton(A, "prev.svg", "이전 주") +
        `<span class="px-[6px] text-[14px] font-semibold">2026-08-17 ~ 08-23</span>` +
        p.iconButton(A, "next.svg", "다음 주") +
        p.w("w-[150px]", ui.dateField(A, { label: "날짜로 이동", value: "2026-08-22" })) +
        offBtn("이번 주"),
      ui.button("지난 주 복사", { variant: "soft" }) + ui.slideTrigger("근무스케줄 등록", schedPanel, "soft") + ui.button("근무스케줄 확정"),
    ) +
    p.bar(x.segment("근무표 보기", [{ id: "sched-day", label: "일간 근무표" }, { id: "sched-week", label: "주간 근무표" }])) +
    x.tabPanel("sched-day", dayView, true) +
    x.tabPanel("sched-week", weekView) +
    `<div class="flex flex-col gap-[24px] pt-[12px]">${schedLog}</div>`;
  const attendTab = `<div class="flex flex-col gap-[24px]">${p.cols(today, summary, "grid-cols-2")}${fixList}</div>`;

  // ── 급여명세서 ──
  const PD = L("staff/payrolls-detail.html");
  const review = (tone, label, detail) => `${p.tag(tone, label)} ${p.sub(detail)}`;
  const reviewList = p.section(
    "검토 대기",
    p.tag("warn", "9건"),
    ui.dataTable(
      [
        { header: "직원", width: "w-[110px]", align: "left" },
        { header: "근무지", width: "w-[110px]" },
        { header: "급여 기간", width: "w-[110px]" },
        { header: "검토 사유", align: "left" },
        { header: "", width: "w-[120px]" },
      ],
      [
        ["서지안", "서초점", "2026-08", review("warn", "출퇴근 누락", "09-05 퇴근 미등록 등 2일"), offBtn("검토", { href: PD })],
        ["유하람", "연남점", "2026-08", review("risk", "계약 만료 후 기록 포함", "08-29 ~ 08-31 · 3일"), offBtn("검토", { href: PD })],
        ["배정숙", "판교점", "2026-08", review("info", "기간 중 계약 변경", "08-16 시급 조정"), offBtn("검토", { href: PD })],
        ["권도윤", "서초점", "2026-08", review("risk", "공제 미입력", "4대보험·소득세 비어 있음"), offBtn("검토", { href: PD })],
        ["남도현", "성수점", "2026-08", p.tag("risk", "근로계약 없음"), "-"],
      ],
    ),
  );
  const payRow = (name, store, h, base, extra, ded, net, st) => [ui.link(name, PD), store, h, base, extra, ded, `<b class="font-semibold">${net}</b>`, st];
  const payList = p.section(
    "2026년 8월 급여명세서",
    p.tag("quiet", "작성 중 52건") +
      `<span class="px-[6px] text-[14px] text-erp-label">지급 예정 <b class="font-semibold text-erp-ink">₩184,220,000</b></span>` +
      ui.button("초안 일괄 생성", { variant: "soft" }) +
      ui.button("확정 3건 발송"),
    ui.dataTable(
      [
        { header: "직원", align: "left" },
        { header: "점포" },
        { header: "근로시간" },
        { header: "기본급" },
        { header: "수당" },
        { header: "공제" },
        { header: "실지급" },
        { header: "상태", width: "w-[180px]" },
      ],
      [
        payRow("오세라", "서초점", "180.0", "3,420,000", "184,000", "-", "3,604,000", p.tag("quiet", "작성 중")),
        payRow("서지안", "서초점", "168.0", "2,840,000", "186,000", "-", "3,026,000", p.tag("warn", "검토 중")),
        payRow("문태경", "판교점", "184.0", "3,680,000", "276,000", "-", "3,956,000", p.tag("quiet", "작성 중")),
        payRow("배정숙", "판교점", "96.0", "1,113,600", "92,800", "-", "1,206,400", p.tag("quiet", "작성 중")),
        payRow("권도윤", "서초점", "176.0", "1,971,200", "164,800", "-", "2,136,000", p.tag("warn", "검토 중")),
        ["남도현", "성수점", "-", "-", "-", "-", "-", p.tag("risk", "계약 없음 · 초안 없음")],
      ],
    ),
    pageNav(4),
  );
  const payrollTab =
    p.bar(
      p.w("w-[148px]", ui.select(["2026-08", "2026-07"], { "aria-label": "급여 월" })) +
        p.w("w-[150px]", ui.select(["상태 전체", "작성 중", "검토 중", "확정", "발송 완료"], { "aria-label": "명세서 상태" })),
      `<span class="text-[14px] text-erp-label">작성 중 <b class="font-semibold text-erp-ink">52</b> · 검토 중 <b class="font-semibold text-erp-ink">8</b> · 확정 <b class="font-semibold text-erp-ink">3</b> · 발송 완료 <b class="font-semibold text-erp-ink">0</b></span>`,
    ) + `<div class="flex flex-col gap-[24px]">${reviewList}${payList}</div>`;

  // ── TO-DO ──
  const todoPanel = "todo-form";
  const todoTab =
    ui.listToolbar(
      12,
      p.w("w-[140px]", ui.select(["상태 전체", "대기", "진행 중", "완료"], { "aria-label": "상태" })) +
        p.w("w-[150px]", ui.select(["담당 전체", "개인 배정", "근무지 전체"], { "aria-label": "담당" })) +
        ui.slideTrigger("TO-DO 등록", todoPanel),
    ) +
    ui.dataTable(
      [
        { header: "담당", width: "w-[140px]", align: "left" },
        { header: "근무지", width: "w-[110px]" },
        { header: "TO-DO", align: "left" },
        { header: "수행 예정", width: "w-[140px]" },
        { header: "상태", width: "w-[160px]" },
      ],
      [
        ["전체 · 각자", "서초점", `본사 위생점검 대비 냉장고 정리 ${p.tag("risk", "긴급")}`, "09-03", p.tag("warn", "진행 중")],
        ["전체 · 한 명", "서초점", "가을 신메뉴 POP 교체", "09-04 10:00", p.tag("quiet", "대기")],
        ["서지안", "서초점", "신규 원두 시음 기록 제출", "09-05", p.tag("quiet", "대기")],
        ["오세라", "서초점", "분기 재물조사 입회", "09-08 14:00", p.tag("quiet", "대기")],
        ["전체 · 한 명", "판교점", "여름 프로모션 POP 철거", "08-25", `${p.tag("ok", "완료")} ${p.sub("문태경")}`],
        ["권도윤", "서초점", "신메뉴 시식 교육 참석", "08-28 14:00", p.tag("ok", "완료")],
      ],
      "등록된 TO-DO 가 없습니다.",
    ) +
    pageNav(2);

  // ── 슬라이드 패널 ──
  const panelHead = (title, right = "") => `<div class="flex items-center gap-[6px]"><h2 class="flex-1 text-[18px] font-semibold text-erp-ink">${title}</h2>${right}</div>`;
  const delId = x.dialogId();
  const schedForm = ui.slidePanel(
    schedPanel,
    "근무스케줄 등록·수정",
    panelHead("근무스케줄 등록·수정") +
      p.radios("sched-mode", ["한 명", "여러 명 일괄"]) +
      ui.formGroup(
        "근무",
        ui.formRow(ui.field("근무지", ui.select(["모리커피 서초점", "모리커피 성수점"])), ui.field("직원", ui.select(["서지안 · 바리스타", "오세라 · 점장", "권도윤 · 바리스타"]))),
        ui.formRow(ui.field("근무일", ui.dateField(A, { label: "근무일", value: "2026-09-07" })), ui.field("근무 유형", ui.select(["오픈", "미들", "마감"]))),
        p.band("근로계약의 근무시간에서 채웠다 — 화·목·토 09:00-16:00 · 휴게 60분"),
        `<div class="flex justify-end">${offBtn("계약 값으로 되돌리기")}</div>`,
        ui.formRow(ui.field("시작", p.timeField("09:00", "시작")), ui.field("종료", p.timeField("16:00", "종료")), ui.field("휴게시간", ui.textField({ value: "60분" }))),
        p.band("권도윤 · 근로계약 미체결", { tone: "risk" }),
      ) +
      `<div class="flex justify-between gap-[6px]">${x.dialogTrigger("삭제", delId, "soft")}<span class="flex gap-[6px]">${offBtn("취소", { "data-close": true })}${ui.button("저장", { "data-close": true })}</span></div>`,
  );
  const delDialog = x.dialog(
    delId,
    "이 근무스케줄을 삭제하시겠습니까?",
    "서지안 · 2026-09-07 근무스케줄을 삭제합니다.",
    offBtn("취소", { "data-close": true }) + ui.button("삭제", { "data-close": true }),
  );
  const fixForm = ui.slidePanel(
    fixPanel,
    "기록 보정",
    panelHead("기록 보정", p.tag("quiet", "서지안 · 09-05")) +
      ui.formGroup(
        "출퇴근 기록",
        ui.formRow(p.fieldH("출근", p.timeField("12:58", "출근"), "원본 12:58"), p.fieldH("퇴근", p.timeField("21:30", "퇴근"), "원본 없음")),
        p.fieldH("수정 사유", ui.textarea({ rows: 4, value: "퇴근 등록 누락 · 마감 근무스케줄 종료 시각으로 보정. 점장 구두 확인." }), ""),
      ) +
      ui.panelButtons("취소", "보정 저장"),
  );
  const todoForm = ui.slidePanel(
    todoPanel,
    "TO-DO 등록",
    panelHead("TO-DO 등록") +
      ui.formGroup(
        "내용",
        ui.field("제목", ui.textField({ value: "본사 위생점검 대비 냉장고 정리" })),
        ui.field("내용", ui.textarea({ rows: 3, value: "선반별로 비우고 유통기한 지난 재료는 폐기 후 사진 남길 것" })),
      ) +
      ui.formGroup(
        "배정",
        ui.field("근무지", ui.select(["모리커피 서초점", "온기식당 판교점"])),
        `<div class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">배정 대상</span>${p.radios("todo-target", ["개인", "근무지 전체"], "근무지 전체")}</div>`,
        `<div class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">수행 방식</span>${p.radios("todo-mode", ["각자 수행", "한 명 수행"])}${p.help("등록 후에는 바꿀 수 없다 · 각자 수행은 직원당 1건, 한 명 수행은 공유 1건")}</div>`,
        ui.formRow(p.fieldH("수행 예정 날짜", ui.dateField(A, { label: "수행 예정 날짜", value: "2026-09-03" }), ""), p.fieldH("시간", p.timeField("", "시간"), "선택")),
        `<div class="flex flex-col gap-[8px]">${x.toggle("긴급", true)}</div>`,
      ) +
      ui.panelButtons("취소", "등록하고 배정"),
  );

  return { L, N, listFilter, listTab, contractsTab, schedTab, attendTab, payrollTab, todoTab, schedForm, delDialog, fixForm, todoForm };
}
