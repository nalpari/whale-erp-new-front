// 직원관리 화면들이 같이 쓰는 내용. 목업 docs/mockup/staff/index.html 은 탭 하나에 모두 있었는데,
// 데모에서는 헤더 메뉴의 소메뉴마다 화면을 나눴다(2026-10-02 재영): 직원 정보·근로계약·근무스케줄·출퇴근 현황·급여명세서·TO-DO.
// 목업에서 목록 옆에 붙어 있던 등록·수정 폼(근무스케줄, 기록 보정, TO-DO)은 슬라이드 패널로 옮겼다.
import * as ui from "./ui.mjs";
import * as x from "./extra.mjs";
import * as p from "./staff-parts.mjs";
import { link } from "./site.mjs";
import { req } from "./biz-form.mjs";

export function staffSections({ A, R }) {
  const L = (path) => link(R, path);
  const offBtn = (label, a = {}) => ui.button(label, { variant: "off", ...a });
  // 직원관리의 목록은 맨 앞에 순번(2026-10-02 재영)
  const numbered = (columns, rows, empty) => ui.dataTable([{ header: "순번", width: "w-[60px]" }, ...columns], rows.map((r, i) => [i + 1, ...r]), empty);
  const pageNav = (n) => `<div class="pt-[14px]">${ui.pagination(A, 1, n)}</div>`;

  // 필터의 점포 칸. 헤더 점포 선택이 점포 1개면 그 점포로 고정, 전체·일반·가맹 묶음이면 검색(erp.js initScopeStore, 2026-10-02 재영).
  const storeFilter = () =>
    ui.filterSection("점포", ui.searchField(A, { placeholder: "점포명", label: "점포" }).replace("<input ", "<input data-scope-store "), { tight: true });

  // ── 직원 목록 ──
  const staffCols = [
    { header: "순번", width: "w-[60px]" },
    { header: "직원", width: "w-[110px]" },
    { header: "휴대전화번호", width: "w-[140px]" },
    { header: "점포" },
    { header: "고용형태", width: "w-[110px]" },
    { header: "가입·인증", width: "w-[210px]" },
    { header: "계약 상태", width: "w-[160px]" },
    { header: "이번 주", width: "w-[90px]" },
    { header: "재직", width: "w-[110px]" },
  ];
  const D = L("staff/detail.html");
  const who = (name, href) => (href ? ui.link(name, href) : name);
  const holdPanel = "hold-form";
  const staffRows = [
    [who("서지안", D), "010-2841-7702", "모리커피 서초점", "정직원", p.tag("ok", "가입 완료"), p.tag("ok", "체결 완료"), "34.5h", p.mark("ok", "재직")],
    [who("오세라", D), "010-3392-4418", "모리커피 서초점", "정직원", p.tag("ok", "가입 완료"), p.tag("ok", "체결 완료"), "40.0h", p.mark("ok", "재직")],
    [who("문태경", D), "010-4471-2298", "온기식당 판교점", "정직원", p.tag("ok", "가입 완료"), p.tag("ok", "체결 완료"), "42.0h", p.mark("ok", "재직")],
    [who("배정숙", D), "010-8820-3317", "온기식당 판교점", "파트타이머", p.tag("ok", "가입 완료"), p.tag("warn", "갱신 예정 D-20"), "24.0h", p.mark("ok", "재직")],
    [who("남도현"), "010-9014-5563", "모리커피 성수점", "파트타이머", p.tag("warn", "초대 발송 · 08-31"), p.tag("quiet", "발송 대기"), "-", p.mark("subtle", "가입 대기")],
    [`<button type="button" aria-expanded="false" aria-controls="${holdPanel}" class="text-erp-link hover:underline">하준서</button>`, "010-3392-4418", "모리커피 성수점", "파트타이머", p.tag("risk", "연결 보류 · 4일"), p.tag("quiet", "발송 대기"), "-", p.mark("risk", "확인 필요")],
    [who("정유담"), "010-5518-7734", "온기식당 판교점", "파트타이머", p.tag("info", "소속 추가 확인"), p.tag("quiet", "발송 대기"), "-", p.mark("subtle", "응답 대기")],
    [who("권도윤", D), "010-7742-1160", "모리커피 서초점", "파트타이머", p.tag("ok", "가입 완료"), p.tag("warn", "서명 대기 · D-24"), "18.0h", p.mark("warn", "날인 대기")],
    [who("유하람", D), "010-2093-8875", "모리커피 연남점", "파트타이머", p.tag("ok", "가입 완료"), p.tag("risk", "거부 · 09-02"), "-", p.mark("risk", "재발송 필요")],
    [p.sub("본사 제공 동의 없음"), "-", "모리커피 연남점", "-", "-", "-", "-", "-"],
    [who("민세하"), "010-7725-3390", "모리커피 성수점", "파트타이머", p.tag("risk", "가입 불가(만 19세 미만)"), p.tag("quiet", "발송 대기"), "-", p.mark("risk", "삭제 대상")],
    [who("임채운"), "010-6613-0284", "모리커피 연남점", "파트타이머", p.tag("quiet", "가입 완료"), p.tag("quiet", "종료"), "-", p.mark("subtle", "퇴직 07-31")],
  ];
  // 직원 정보 관리: 점포 목록처럼 왼쪽 필터 + 오른쪽 목록(목업의 목록 위 검색칸·선택칸을 필터로 옮겼다).
  const listFilter = ui.filterPanel(A, [
    storeFilter(),
    ui.filterSection("이름·휴대전화번호", ui.searchField(A, { placeholder: "이름 또는 번호" }), { tight: true }),
    ui.filterSection("고용형태", ui.checkbox(A, "정직원", true) + ui.checkbox(A, "파트타이머", true)),
    ui.filterSection("가입·인증", ["가입 완료", "초대 발송", "연결 보류", "소속 추가 확인", "가입 불가"].map((t) => ui.checkbox(A, t, true)).join("")),
    ui.filterSection("재직 상태", ui.select(["재직", "퇴직", "전체"], { "aria-label": "재직 상태" }), { tight: true, last: true }),
  ]);
  const listTab =
    ui.listToolbar(
      63,
      ui.button("일괄 저장", { variant: "soft", href: L("staff/export.html") }) +
        `<div class="w-[80px] shrink-0">${ui.select(["20", "50", "100"], { "aria-label": "페이지당 건수" })}</div>`,
    ) +
    ui.dataTable(staffCols, staffRows.map((r, i) => [i + 1, ...r]), "조회된 직원이 없습니다.") +
    pageNav(4);

  // ── 근로계약 ──
  const N = L("staff/contracts-new.html");
  const contractRows = [
    ["남도현", "모리커피 성수점", "2026-09-14 ~ 무기한", "11,200 /h", "-", p.tag("quiet", "발송 대기"), p.ask("초대 재발송", "off", "가입 초대를 다시 보내시겠습니까?", "남도현 님(010-9014-5563)에게 가입 초대를 다시 보냅니다.")],
    ["하준서", "모리커피 성수점", "2026-09-14 ~ 무기한", "11,200 /h", "-", p.tag("quiet", "발송 대기"), offBtn("연결 확인", { href: L("staff/index.html") })],
    ["정유담", "온기식당 판교점", "2026-09-18 ~ 2027-03-17", "10,800 /h", "-", p.tag("quiet", "발송 대기"), p.sub("소속 확인 중")],
    ["권도윤", "모리커피 서초점", "2026-09-01 ~ 2027-08-31", "11,600 /h", "09-01", p.tag("warn", "서명 대기 · D-24"), p.ask("재발송", "off", "근로계약서를 재발송하시겠습니까?", "권도윤 님에게 서명 대기 중인 근로계약서를 다시 보냅니다.")],
    [ui.link("유하람", L("staff/contracts-detail.html")), "모리커피 연남점", "2026-08-28 ~ 2027-02-27", "10,800 /h", "08-28", p.tag("risk", "거부 · 09-02"), offBtn("상세", { href: L("staff/contracts-detail.html") })],
    ["서지안", "모리커피 서초점", "2026-03-01 ~ 무기한", "2,840,000 /월", "02-24", p.tag("ok", "체결 완료"), offBtn("새 계약", { href: N })],
    ["오세라", "모리커피 서초점", "2025-11-01 ~ 무기한", "3,420,000 /월", "10-27", p.tag("ok", "체결 완료"), offBtn("새 계약", { href: N })],
    ["배정숙", "온기식당 판교점", "2026-02-10 ~ 2026-09-30", "11,600 /h", "02-06", p.tag("warn", "갱신 예정 · D-20"), offBtn("재계약", { href: N })],
    ["임채운", "모리커피 연남점", "2025-08-01 ~ 2026-07-31", "10,400 /h", "07-28", p.tag("quiet", "종료"), p.sub("퇴직")],
  ];
  // 근로계약 관리: 왼쪽 필터(점포 · 직원 · 상태) + 목록. 목업의 목록 위 상태 라디오를 필터의 상태 체크로 옮겼다.
  const contractsFilter = ui.filterPanel(A, [
    storeFilter(),
    ui.filterSection("직원", ui.searchField(A, { placeholder: "이름" }), { tight: true }),
    ui.filterSection("상태", ["발송 대기", "서명 대기", "체결 완료", "거부", "갱신 예정", "종료"].map((t) => ui.checkbox(A, t, true)).join(""), { last: true }),
  ]);
  const contractsTab =
    ui.listToolbar(contractRows.length, "") +
    numbered(
      [
        { header: "직원", width: "w-[90px]" },
        { header: "점포", width: "w-[140px]" },
        { header: "계약 기간" },
        { header: "급여", width: "w-[130px]" },
        { header: "발송일", width: "w-[80px]" },
        { header: "상태", width: "w-[150px]" },
        { header: "", width: "w-[140px]" },
      ],
      contractRows,
      "조회된 근로계약이 없습니다.",
    ) +
    pageNav(7);

  // ── 근무스케줄·출퇴근 ──
  const schedPanel = "sched-form";
  const fixPanel = "fix-form";
  const proxyPanel = "proxy-form";
  // 근무스케줄 보기는 로그인 후 홈과 같은 부품(staff-parts schedWeek·schedMonth)으로 그린다(2026-10-08 재영).
  // 관리는 그날 재직자 전원(휴무·배정 불가 포함)을 보이고, 주간 보기 아래에 공백 안내와 「이 시간대에 배정」을 둔다.
  // 주간 근무표(직원 × 요일 표, 주 합계)는 없앴다(STAFF-26). 운영 07:00-22:00, 주 08-17 ~ 08-23, 샘플의 오늘은 공백이 드러나는 토요일.
  const schedCrew = [
    ["오세라", "점장", { 1: [9, 18], 2: [9, 18], 4: [9, 18], 5: [9, 18], 6: [11, 20] }],
    ["유하람", "바리스타", { 2: [16, 22], 3: [16, 22], 5: [16, 22], 6: [12, 22], 0: [12, 22] }],
    ["서지안", "바리스타", { 1: [7, 16], 2: [7, 16], 3: [7, 16], 4: [7, 16], 0: [10, 19] }],
    ["권도윤", "바리스타", { 1: [13, 22], 3: [13, 22], 4: [13, 22], 5: [13, 22], 0: [13, 22] }],
    ["하준서", "바리스타", {}, "계약 대기 · 배정 불가"],
  ];
  const schedWeekView = p.schedWeek(schedCrew, { open: 7, close: 22, dates: { 1: 17, 2: 18, 3: 19, 4: 20, 5: 21, 6: 22, 0: 23 }, pick: 6, all: true, gap: schedPanel });
  const schedMonthView = p.schedMonth(A, schedCrew, { year: 2026, month: 7, today: "2026-08-22", all: true });

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
  // 출퇴근 현황: 일별 출퇴근은 하루씩, 근태 요약은 한 주씩 넘겨 본다(2026-10-02 재영). 데모의 오늘은 2026-09-06(일).
  // 데이터는 09-04 ~ 09-06 사흘과 08-24 · 08-31 두 주뿐이고, 나머지 날짜·주는 빈 표.
  const days = [
    ["2026-09-06", [
      ["오세라", p.sub("09:00"), "08:54", p.sub("근무 중"), p.mark("ok", "정상")],
      ["서지안", p.sub("09:00"), "08:57", p.sub("근무 중"), p.mark("ok", "정상")],
      ["권도윤", p.sub("13:00"), p.mark("warn", "13:18"), p.sub("근무 중"), p.mark("warn", "지각 18분")],
      ["유하람", p.sub("-"), "-", "-", p.mark("subtle", "휴무")],
      ["배정숙", p.sub("10:00"), p.sub("미기록"), "-", p.mark("risk", "미출근")],
    ]],
    ["2026-09-05", [
      ["오세라", p.sub("09:00"), "08:51", "18:02", p.mark("ok", "정상")],
      ["서지안", p.sub("13:00"), "12:58", p.sub("미기록"), p.mark("warn", "퇴근 미등록")],
      ["권도윤", p.sub("-"), "-", "-", p.mark("subtle", "휴무")],
      ["유하람", p.sub("-"), "-", "-", p.mark("subtle", "휴무")],
      ["배정숙", p.sub("10:00"), "09:58", "16:01", p.mark("ok", "정상")],
    ]],
    ["2026-09-04", [
      ["오세라", p.sub("09:00"), "09:00", "18:00", p.mark("ok", "정상")],
      ["서지안", p.sub("13:00"), "12:55", "21:36", p.mark("ok", "정상")],
      ["권도윤", p.sub("13:00"), "13:02", "21:30", p.mark("ok", "정상")],
      ["유하람", p.sub("-"), "-", "-", p.mark("subtle", "휴무")],
      ["배정숙", p.sub("10:00"), "09:55", "16:00", p.mark("ok", "정상")],
    ]],
    ["", []],
  ];
  const today = p.section(
    "일별 출퇴근",
    p.weekNav(A, "attend-days", "2026-09-06", { day: true }),
    `<div id="attend-days">${days
      .map(
        ([d, rows]) =>
          `<div data-week="${d}" hidden>${ui.dataTable(
            [{ header: "직원" }, { header: "예정" }, { header: "출근" }, { header: "퇴근" }, { header: "비고" }],
            rows,
            "이 날의 출퇴근 기록이 없습니다.",
          )}</div>`,
      )
      .join("")}</div>`,
  );
  const rate = (label, pct, n) =>
    `<div class="flex h-[34px] items-center gap-[12px] text-[14px]"><span class="w-[80px] shrink-0 text-erp-label">${label}</span><span class="w-[200px]">${p.meter(pct)}</span><span>${n}</span></div>`;
  const weekSum = (week, [ok, late, miss], [total, over, night, paid]) => {
    const n = ok + late + miss;
    const pct = (v) => (n ? Math.round((v / n) * 100) : 0);
    return `<div data-week="${week}" hidden class="flex flex-col gap-[12px]"><div class="flex flex-col">${rate("정상 출근", pct(ok), `${ok}회`)}${rate("지각", pct(late), `${late}회`)}${rate("미기록", pct(miss), `${miss}회`)}</div>${ui.detailTable("근로시간", [
      ["총 근로시간", total],
      ["연장 근로", over],
      ["야간 근로", night],
      ["주휴 대상", paid],
    ])}</div>`;
  };
  const summary = p.section(
    "근태 요약",
    p.weekNav(A, "attend-sums", "2026-08-31"),
    `<div id="attend-sums">${weekSum("2026-08-31", [54, 5, 2], ["1,284h", "42h", "18h", "38명"])}${weekSum("2026-08-24", [58, 3, 1], ["1,312h", "36h", "16h", "38명"])}${weekSum("", [0, 0, 0], ["0h", "0h", "0h", "-"])}</div>`,
  );
  // 「이력」은 그 기록의 변경 이력을 확인창으로 보인다(변경 전후 값·일시·처리한 사람·사유, 2026-10-02 재영).
  const histId = { 문태경: x.dialogId(), 오세라: x.dialogId() };
  const histDialog = (name, rows) =>
    x.dialog(histId[name], `${name} 출퇴근 기록 이력`, ui.detailTable("이력", rows), ui.button("닫기", { variant: "off", "data-close": true }));
  const histDialogs =
    histDialog("문태경", [
      ["일시", "2026-08-30 10:12"],
      ["구분", "보정"],
      ["처리한 사람", "정하윤 (BP 마스터)"],
      ["변경 전", "출근 09:02 · 퇴근 없음"],
      ["변경 후", "출근 09:02 · 퇴근 18:30"],
      ["사유", "퇴근 등록 누락 · 마감 확인"],
    ]) +
    histDialog("오세라", [
      ["일시", "2026-08-27 18:05"],
      ["구분", "대신 등록"],
      ["처리한 사람", "정하윤 (BP 마스터)"],
      ["등록한 값", "출근 10:00 · 퇴근 16:00"],
      ["사유", "위치 수집 일시 중지 · 점장 확인"],
    ]);
  const fixBtns = () => `<span class="flex justify-center gap-[6px]">${ui.slideTrigger("보정", fixPanel, "off")}${p.ask("이상 없음", "off", "이상 없음으로 검토를 마치시겠습니까?", "확인 필요 꼬리표와 사유를 지웁니다.")}</span>`;
  const fixList = p.section(
    "보정이 필요한 기록",
    ui.slideTrigger("출퇴근 대신 등록", proxyPanel, "soft"),
    ui.dataTable(
      [
        { header: "직원", width: "w-[100px]" },
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
        ["문태경", "08-29", "09:02", "18:30", `${p.tag("info", "수정됨")} ${p.sub("08-30 정하윤")}`, x.dialogTrigger("이력", histId.문태경, "off")],
        ["오세라", "08-27", "10:00", "16:00", `${p.tag("info", "대신 등록")} ${p.sub("위치 수집 일시 중지 · 정하윤")}`, x.dialogTrigger("이력", histId.오세라, "off")],
      ],
    ),
  );
  const schedTab =
    p.bar(
      // 날짜 선택은 직원 상세와 같은 주 이동(2026-10-02 재영). 데모라 근무표 내용은 주를 바꿔도 그대로다.
      p.weekNav(A, "", "2026-08-17") + p.tag("warn", "확정 전"),
      p.ask("지난 주 복사", "soft", "지난 주 근무스케줄을 복사하시겠습니까?", "지난 주 근무스케줄을 지금 보고 있는 주에 그대로 넣습니다.", "복사") +
        ui.slideTrigger("근무스케줄 등록", schedPanel, "soft") +
        p.ask("근무스케줄 확정", "primary", "이 주의 근무스케줄을 확정하시겠습니까?", "", "확정"),
    ) +
    p.bar(
      x.segment("근무스케줄 보기", [
        { id: "sched-week", label: "주간 보기" },
        { id: "sched-month", label: "월간 보기" },
      ]),
      `<span class="text-[14px] text-erp-label">모리커피 서초점 · 운영 07:00-22:00</span>`,
    ) +
    x.tabPanel("sched-week", schedWeekView, true) +
    x.tabPanel("sched-month", schedMonthView) +
    `<div class="flex flex-col gap-[24px] pt-[12px]">${schedLog}</div>`;
  const attendTab = `<div class="flex flex-col gap-[24px]">${p.cols(today, summary, "grid-cols-2")}${fixList}</div>${histDialogs}`;

  // ── 급여명세서 ──
  const PD = L("staff/payrolls-detail.html");
  const review = (tone, label, detail) => `${p.tag(tone, label)} ${p.sub(detail)}`;
  // 급여명세서 관리는 달 단위로 넘겨 본다(2026-10-02 재영): ‹ 2026년 8월 › · 달 선택. 데모 데이터는 8월·7월, 나머지 달은 빈 목록.
  const reviewList = (rows) =>
    p.section(
      "검토 대기",
      p.tag(rows.length ? "warn" : "quiet", `${rows.length ? 9 : 0}건`),
      numbered(
        [
          { header: "직원", width: "w-[110px]" },
          { header: "근무지", width: "w-[140px]" },
          { header: "급여 기간", width: "w-[110px]" },
          { header: "검토 사유", align: "left" },
          { header: "", width: "w-[120px]" },
        ],
        rows,
        "검토 대기 중인 명세서가 없습니다.",
      ),
    );
  const payRow = (name, store, h, base, extra, ded, net, st) => [ui.link(name, PD), store, h, base, extra, ded, `<b class="font-semibold">${net}</b>`, st];
  const payList = (title, right, rows) =>
    p.section(
      title,
      right,
      numbered(
        [
          { header: "직원" },
          { header: "점포" },
          { header: "근로시간" },
          { header: "기본급" },
          { header: "수당" },
          { header: "공제" },
          { header: "실지급" },
          { header: "상태", width: "w-[180px]" },
        ],
        rows,
        "이 달의 급여명세서가 없습니다.",
      ),
      rows.length ? pageNav(4) : "",
    );
  const counts = (a, b, c, d) =>
    `<p class="text-[14px] text-erp-label">작성 중 <b class="font-semibold text-erp-ink">${a}</b> · 검토 중 <b class="font-semibold text-erp-ink">${b}</b> · 확정 <b class="font-semibold text-erp-ink">${c}</b> · 발송 완료 <b class="font-semibold text-erp-ink">${d}</b></p>`;
  // 목록 오른쪽 위 버튼: 「급여명세서 작성」은 어느 달이든 늘 보인다(2026-10-02 재영). 데모라 명세서 화면으로 간다.
  const payButtons = (n) => ui.button("급여명세서 작성", { variant: "soft", href: PD }) + (n ? p.ask(`확정 ${n}건 발송`, "primary", `확정한 급여명세서 ${n}건을 발송하시겠습니까?`, "직원 근무 앱으로 보냅니다.", "발송") : "");
  const month = (key, body) => `<div data-week="${key}" hidden class="flex flex-col gap-[24px]">${body}</div>`;
  const sent = p.tag("ok", "발송 완료");
  const months =
    month(
      "2026-08-01",
      counts(52, 8, 3, 0) +
        reviewList([
          ["서지안", "모리커피 서초점", "2026-08", review("warn", "출퇴근 누락", "09-05 퇴근 미등록 등 2일"), offBtn("검토", { href: PD })],
          ["유하람", "모리커피 연남점", "2026-08", review("risk", "계약 만료 후 기록 포함", "08-29 ~ 08-31 · 3일"), offBtn("검토", { href: PD })],
          ["배정숙", "온기식당 판교점", "2026-08", review("info", "기간 중 계약 변경", "08-16 시급 조정"), offBtn("검토", { href: PD })],
          ["권도윤", "모리커피 서초점", "2026-08", review("risk", "공제 미입력", "4대보험·소득세 비어 있음"), offBtn("검토", { href: PD })],
          ["남도현", "모리커피 성수점", "2026-08", p.tag("risk", "근로계약 없음"), "-"],
        ]) +
        payList("급여명세서", payButtons(3), [
          payRow("오세라", "모리커피 서초점", "180.0", "3,420,000", "184,000", "-", "3,604,000", p.tag("quiet", "작성 중")),
          payRow("서지안", "모리커피 서초점", "168.0", "2,840,000", "186,000", "-", "3,026,000", p.tag("warn", "검토 중")),
          payRow("문태경", "온기식당 판교점", "184.0", "3,680,000", "276,000", "-", "3,956,000", p.tag("quiet", "작성 중")),
          payRow("배정숙", "온기식당 판교점", "96.0", "1,113,600", "92,800", "-", "1,206,400", p.tag("quiet", "작성 중")),
          payRow("권도윤", "모리커피 서초점", "176.0", "1,971,200", "164,800", "-", "2,136,000", p.tag("warn", "검토 중")),
          ["남도현", "모리커피 성수점", "-", "-", "-", "-", "-", p.tag("risk", "계약 없음 · 초안 없음")],
        ]),
    ) +
    month(
      "2026-07-01",
      counts(0, 0, 0, 61) +
        reviewList([]) +
        payList("급여명세서", payButtons(0), [
          payRow("오세라", "모리커피 서초점", "176.0", "3,420,000", "142,000", "241,800", "3,320,200", sent),
          payRow("서지안", "모리커피 서초점", "168.0", "2,840,000", "142,000", "241,800", "2,740,200", sent),
          payRow("문태경", "온기식당 판교점", "180.0", "3,680,000", "232,000", "268,400", "3,643,600", sent),
          payRow("배정숙", "온기식당 판교점", "92.0", "1,067,200", "88,000", "37,920", "1,117,280", sent),
          payRow("권도윤", "모리커피 서초점", "172.0", "1,926,400", "158,000", "68,780", "2,015,620", sent),
        ]),
    ) +
    month("", counts(0, 0, 0, 0) + reviewList([]) + payList("급여명세서", payButtons(0), []));
  // 급여명세서 관리: 왼쪽 필터(점포 · 직원 · 명세서 상태) + 달 이동 · 상태 건수 · 검토 대기 · 명세서 목록. 「급여 월」 선택칸은 달 이동으로 옮겼다.
  const payslipsFilter = ui.filterPanel(A, [
    storeFilter(),
    ui.filterSection("직원", ui.searchField(A, { placeholder: "이름" }), { tight: true }),
    ui.filterSection("명세서 상태", ["작성 중", "검토 중", "확정", "발송 완료"].map((t) => ui.checkbox(A, t, true)).join(""), { last: true }),
  ]);
  const payrollTab = `<div class="flex flex-col gap-[12px]">${p.weekNav(A, "pay-months", "2026-08-01", { month: true })}<div id="pay-months">${months}</div></div>`;

  // ── TO-DO ──
  const todoPanel = "todo-form";
  // TO-DO 리스트 관리: 왼쪽 필터(점포 · 담당 · 상태) + 목록. 근무지 체크는 점포 칸으로 바꿨다(2026-10-02 재영).
  const todosFilter = ui.filterPanel(A, [
    storeFilter(),
    ui.filterSection("담당", ui.searchField(A, { placeholder: "이름" }), { tight: true }),
    ui.filterSection("상태", ["대기", "진행 중", "완료"].map((t) => ui.checkbox(A, t, true)).join(""), { last: true }),
  ]);
  // 대기 중인 TO-DO 는 「수정」으로 슬라이드 패널을 열어 고친다(2026-10-02 재영). 패널은 아래 todoEdits.
  const todoEditIds = [0, 1, 2].map(() => ui.uid("todo-edit"));
  const editBtn = (i) => ui.slideTrigger("수정", todoEditIds[i], "off");
  const todoTab =
    ui.listToolbar(12, ui.slideTrigger("TO-DO 등록", todoPanel)) +
    numbered(
      [
        { header: "담당", width: "w-[140px]" },
        { header: "근무지", width: "w-[140px]" },
        { header: "TO-DO", align: "left" },
        { header: "수행 예정", width: "w-[140px]" },
        { header: "상태", width: "w-[160px]" },
        { header: "", width: "w-[100px]" },
      ],
      [
        ["전체 · 각자", "모리커피 서초점", `본사 위생점검 대비 냉장고 정리 ${p.tag("risk", "긴급")}`, "09-03", p.tag("warn", "진행 중"), ""],
        ["전체 · 한 명", "모리커피 서초점", "가을 신메뉴 POP 교체", "09-04 10:00", p.tag("quiet", "대기"), editBtn(0)],
        ["서지안", "모리커피 서초점", "신규 원두 시음 기록 제출", "09-05", p.tag("quiet", "대기"), editBtn(1)],
        ["오세라", "모리커피 서초점", "분기 재물조사 입회", "09-08 14:00", p.tag("quiet", "대기"), editBtn(2)],
        ["전체 · 한 명", "온기식당 판교점", "여름 프로모션 POP 철거", "08-25", `${p.tag("ok", "완료")} ${p.sub("문태경")}`, ""],
        ["권도윤", "모리커피 서초점", "신메뉴 시식 교육 참석", "08-28 14:00", p.tag("ok", "완료"), ""],
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
        ui.formRow(ui.field("근무지", ui.select(["모리커피 서초점", "모리커피 성수점"])), ui.field("직원", ui.select(["서지안 · 바리스타", "오세라 · 점장", "권도윤 · 바리스타"], { name: "sched-staff" }))),
        ui.formRow(ui.field("근무일", ui.dateField(A, { label: "근무일", value: "2026-09-08" })), ui.field("근무 유형", ui.select(["오픈", "미들", "마감"]))),
        // 계약 근무시간 띠(STAFF-14)는 계약이 있는 직원일 때, 미체결 경고는 미체결 직원(권도윤)을 골랐을 때만 보인다(data-when).
        `<div class="flex flex-col gap-[12px]" data-when="sched-staff:!권도윤 · 바리스타">${p.band("근로계약 근무시간을 불러왔습니다 · 화·목·토 09:00–16:00 · 휴게 60분", { desc: "등록할 때 한 번만 반영됩니다. 계약이 나중에 바뀌어도 등록한 근무스케줄은 바뀌지 않습니다." })}<div class="flex justify-end">${offBtn("계약 값으로 되돌리기")}</div></div>`,
        ui.formRow(ui.field("시작", p.timeField("09:00", "시작")), ui.field("종료", p.timeField("16:00", "종료")), ui.field("휴게시간", ui.textField({ value: "60분" }))),
        `<div data-when="sched-staff:권도윤 · 바리스타">${p.band("권도윤 · 근로계약 미체결", { tone: "risk" })}</div>`,
      ) +
      `<div class="flex justify-between gap-[6px]">${x.dialogTrigger("삭제", delId, "soft")}<span class="flex gap-[6px]">${offBtn("취소", { "data-close": true })}${ui.button("저장", { "data-close": true })}</span></div>`,
  );
  const delDialog = x.dialog(
    delId,
    "이 근무스케줄을 삭제하시겠습니까?",
    "서지안 · 2026-09-08 근무스케줄을 삭제합니다.",
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
  // 출퇴근 대신 등록(운영 정책 ATT-20): 직원 · 날짜 · 출근 · 퇴근 · 사유(필수). 직원 근무 앱에는 연필 표시로 보인다.
  const proxyForm = ui.slidePanel(
    proxyPanel,
    "출퇴근 대신 등록",
    panelHead("출퇴근 대신 등록") +
      ui.formGroup(
        "출퇴근 기록",
        ui.formRow(
          p.fieldH(req("직원"), ui.select(["오세라", "서지안", "권도윤", "배정숙", "유하람"]), ""),
          p.fieldH(req("날짜"), ui.dateField(A, { label: "날짜", value: "2026-09-06" }), ""),
        ),
        ui.formRow(p.fieldH(req("출근"), p.timeField("09:00", "출근"), ""), p.fieldH("퇴근", p.timeField("", "퇴근"), "")),
        p.fieldH(req("사유"), ui.textarea({ rows: 4, placeholder: "예: 위치 수집 일시 중지 · 점장 확인" }), ""),
      ) +
      ui.panelButtons("취소", "대신 등록"),
  );
  // 배정 대상·수행 방식 라벨과 ⓘ 툴팁(2026-10-08 재영)
  const TIP_TARGET = "개인: 고른 직원에게만 보입니다. 여러 명을 고르면 한 사람에 한 건씩 생깁니다.\n근무지 전체: 그 근무지의 재직 직원 모두에게 보입니다.";
  const TIP_MODE = "각자 수행: 직원마다 한 건씩 생기고 저마다 완료합니다.\n한 명 수행: 한 건을 함께 보고, 한 명이 완료하면 모두에게 완료로 보입니다. 등록한 뒤에는 바꿀 수 없습니다.";
  const tipLabel = (label, text) => `<span class="flex items-center gap-[6px] text-[14px] font-medium text-erp-label">${label}${p.infoTip(label, text)}</span>`;
  // 개인 배정 직원 고르기(STAFF-25 확정 — 한 명 이상, 직원마다 1건). 개인일 때만 보이고, 수행 방식은 근무지 전체일 때만 보인다(data-when).
  // 고른 근무지의 재직 직원을 이름·휴대전화번호 끝자리로 찾고, 고른 직원은 칩. 데모라 칩의 ×·근무지 변경 비우기·저장 막기는 안내 문구로만 보인다.
  const staffChip = (name) =>
    `<li class="flex h-[34px] items-center gap-[8px] rounded-[2px] border border-erp-field-line bg-white pr-[4px] pl-[10px] text-[14px]"><span class="font-medium">${name}</span><button type="button" aria-label="${name} 빼기" class="grid size-[26px] place-items-center rounded-[2px] text-erp-label hover:text-erp-ink">×</button></li>`;
  const staffPick = (radio, picked = []) =>
    `<div class="flex flex-col gap-[8px]" data-when="${radio}:개인"><span class="text-[14px] font-medium text-erp-label">직원</span>${ui.searchField(A, { placeholder: "이름 또는 휴대전화번호 끝자리" })}<ul aria-label="고른 직원" class="flex flex-wrap gap-[6px]">${picked.map(staffChip).join("")}</ul>${p.help("고른 근무지의 재직 직원 중 한 명 이상 고르고, 직원마다 1건씩 생긴다. 근무지를 바꾸면 비우고, 아무도 고르지 않으면 「직원을 한 명 이상 골라 주세요」로 막는다.")}</div>`;
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
        `<div class="flex flex-col gap-[8px]">${tipLabel("배정 대상", TIP_TARGET)}${p.radios("todo-target", ["개인", "근무지 전체"], "근무지 전체")}</div>`,
        staffPick("todo-target"),
        `<div class="flex flex-col gap-[8px]" data-when="todo-target:근무지 전체">${tipLabel("수행 방식", TIP_MODE)}${p.radios("todo-mode", ["각자 수행", "한 명 수행"])}${p.help("등록 후에는 바꿀 수 없다 · 각자 수행은 직원당 1건, 한 명 수행은 공유 1건")}</div>`,
        ui.formRow(p.fieldH("수행 예정 날짜", ui.dateField(A, { label: "수행 예정 날짜", value: "2026-09-03" }), ""), p.fieldH("시간", p.timeField("", "시간"), "선택")),
        `<div class="flex flex-col gap-[8px]">${x.toggle("긴급", true)}</div>`,
      ) +
      ui.panelButtons("취소", "등록하고 배정"),
  );

  // TO-DO 수정: 등록과 같은 칸. 수행 방식은 등록 후에 바꿀 수 없어(목업) 글자로만 보인다. 아래에 삭제.
  const todoEdit = (id, { title, body, store, person, mode, date, time = "", urgent = false }) => {
    const target = person ? "개인" : "근무지 전체";
    return ui.slidePanel(
      id,
      "TO-DO 수정",
      panelHead("TO-DO 수정", p.tag("quiet", "대기")) +
        ui.formGroup("내용", ui.field("제목", ui.textField({ value: title })), ui.field("내용", ui.textarea({ rows: 3, value: body }))) +
        ui.formGroup(
          "배정",
          ui.field("근무지", ui.select(["모리커피 서초점", "온기식당 판교점"], { value: store })),
          `<div class="flex flex-col gap-[8px]">${tipLabel("배정 대상", TIP_TARGET)}${p.radios(`${id}-target`, ["개인", "근무지 전체"], target)}</div>`,
          staffPick(`${id}-target`, person ? [person] : []),
          `<div class="flex flex-col gap-[8px]" data-when="${id}-target:근무지 전체">${tipLabel("수행 방식", TIP_MODE)}<span class="text-[14px] text-erp-ink">${mode}</span>${p.help("등록 후에는 바꿀 수 없다")}</div>`,
          ui.formRow(p.fieldH("수행 예정 날짜", ui.dateField(A, { label: "수행 예정 날짜", value: date }), ""), p.fieldH("시간", p.timeField(time, "시간"), "선택")),
          `<div class="flex flex-col gap-[8px]">${x.toggle("긴급", urgent)}</div>`,
        ) +
        `<div class="flex justify-between gap-[6px]">${p.ask("삭제", "soft", "이 TO-DO 를 삭제하시겠습니까?", `「${title}」을 지웁니다. 배정된 직원 근무 앱에서도 사라집니다.`)}<span class="flex gap-[6px]">${offBtn("취소", { "data-close": true })}${ui.button("저장", { "data-close": true })}</span></div>`,
    );
  };
  const todoEdits = [
    { title: "가을 신메뉴 POP 교체", body: "여름 POP 를 떼고 가을 신메뉴 POP 를 붙인다", store: "모리커피 서초점", mode: "한 명 수행", date: "2026-09-04", time: "10:00" },
    { title: "신규 원두 시음 기록 제출", body: "시음 노트 양식에 맛·향을 적어 제출", store: "모리커피 서초점", person: "서지안", mode: "각자 수행", date: "2026-09-05" },
    { title: "분기 재물조사 입회", body: "본사 담당자 방문 때 재고 수량 확인에 입회", store: "모리커피 서초점", person: "오세라", mode: "각자 수행", date: "2026-09-08", time: "14:00" },
  ]
    .map((t, i) => todoEdit(todoEditIds[i], t))
    .join("");

  // 가입 연결 확인: 목업 docs/mockup/staff/invites-holds.html 의 별도 화면을 직원 목록의 슬라이드 패널로 흡수했다(2026-10-02 재영, 데모만). 하준서 이름을 누르면 열린다.
  const approveId = x.dialogId();
  const reinviteId = x.dialogId();
  const holdForm =
    ui.slidePanel(
      holdPanel,
      "가입 연결 확인",
      panelHead("가입 연결 확인", p.tag("risk", "번호 불일치 · 4일 경과")) +
        ui.detailTable("하준서 · 모리커피 성수점", [
          ["초안에 적은 번호", "010-3392-4418"],
          ["가입자가 인증한 번호", "010-****-4418"],
          ["가입자 실명", p.sub("표시하지 않음")],
          ["다른 소속", p.sub("표시하지 않음")],
          ["초대 발송", "2026-08-31 09:12"],
          ["가입 완료", "2026-08-31 21:40"],
        ]) +
        `<div class="flex justify-center gap-[6px]">${offBtn("닫기", { "data-close": true })}${x.dialogTrigger("번호 수정 후 재초대", reinviteId, "soft")}${x.dialogTrigger("이 계정으로 연결 승인", approveId)}</div>`,
    ) +
    x.dialog(
      approveId,
      "이 계정으로 연결하시겠습니까?",
      "하준서 님의 직원 레코드에 이 계정을 연결하고, 멈춰 있던 근로계약서를 발송합니다.",
      ui.button("취소", { variant: "off", "data-close": true }) + ui.button("연결 승인", { "data-close": true }),
    ) +
    x.dialog(
      reinviteId,
      "번호 수정 후 재초대",
      ui.field("휴대전화번호", ui.textField({ value: "010-3392-4418", inputmode: "tel" })),
      ui.button("취소", { variant: "off", "data-close": true }) + ui.button("재초대", { "data-close": true }),
    );

  return { L, N, holdPanel, holdForm, proxyForm, todoEdits, listFilter, contractsFilter, payslipsFilter, todosFilter, listTab, contractsTab, schedTab, attendTab, payrollTab, todoTab, schedForm, delDialog, fixForm, todoForm };
}
