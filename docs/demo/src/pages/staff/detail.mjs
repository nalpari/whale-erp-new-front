// 직원 상세. 목업 docs/mockup/staff/detail.html(서지안)을 BP 마스터로 본 것. 조회만 하고 처리는 각 관리 탭으로 넘긴다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as p from "../../staff-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const L = (path) => link(R, path);
  const manage = (page) => ui.link("관리", L(`staff/${page}.html`));
  const resetId = x.dialogId();
  // 묶음 제목은 표 머리 안에 둔다(2026-10-02 재영): 왼쪽 제목, 오른쪽 끝에 요약·이동·「관리」.
  // 머리 칸은 detail-table.tsx 의 제목 칸과 같은 모양이고, 아래 data-table 머리줄과 선이 겹치지 않게 아래 테두리만 뺐다.
  const headIn = (title, right) => `<span class="flex-1">${title}</span><span class="flex items-center gap-[6px] text-[14px] font-normal">${right}</span>`;
  // 머리 칸 아래 열 이름 줄은 흰 바탕에 굵고 진한 글자(2026-10-02 재영)
  const whiteHead = (table) =>
    table.replace("border-erp-thead-line bg-erp-thead-bg\">", "border-erp-thead-line bg-white\">").replaceAll('class="px-[10px] font-medium text-erp-thead-text"', 'class="px-[10px] font-semibold text-erp-ink"');
  // 표 아래 요약 한 줄(오른쪽 끝에 이름 + 값)
  const foot = (label, value) =>
    `<div class="flex h-[46px] items-center justify-end gap-[12px] border-x border-b border-erp-thead-line bg-erp-thead-bg px-[12px] text-[14px]"><span class="text-erp-thead-text">${label}</span><b class="font-semibold text-erp-ink">${value}</b></div>`;
  const box = (title, right, body) =>
    `<section class="min-w-0"><h3 class="flex h-[42px] items-center gap-[6px] rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px] text-[16px] font-medium text-erp-ink">${headIn(title, right)}</h3>${body}</section>`;

  const basic = ui.detailTable("기본 정보", [
    ["이름", "서지안"],
    ["직무", "바리스타"],
    ["고용 형태", "정직원"],
    ["소속 근무지", "모리커피 서초점"],
    ["입사일", "2026-03-01"],
    ["재직 상태", "재직"],
    ["생년월일", "1998-07-12"],
    ["휴대전화번호", "010-2841-7702"],
    ["본인인증", "완료"],
    ["이메일", "jian.seo@example.com"],
  ]);
  const reset = p.bar("", x.dialogTrigger("비밀번호 초기화", resetId, "soft"));
  const contract =
    ui.detailTable(headIn("근로계약", manage("contracts")), [
      ["계약 유형", "정직원 근로계약"],
      ["계약 기간", "2026-03-01 ~ 무기한"],
      ["계약 상태", p.tag("ok", "체결 완료")],
      ["최근 발송일", "2026-02-24"],
      ["갱신 예정일", "-"],
    ]);

  // 근무스케줄은 주 단위로 넘겨 본다(2026-10-02 재영). 화살표로 한 주씩, 가운데 주 이름을 누르면 달력에서 그 달의 몇째 주를 고른다.
  // 데모 데이터는 3주뿐이고, 다른 주를 고르면 빈 표가 나온다. 처음 열리는 주는 data-week-start.
  const weeks = [
    ["2026-08-24", [["08-25 화", "09:00", "17:00", "오픈"], ["08-26 수", "09:00", "17:00", "오픈"], ["08-28 금", "13:00", "21:30", "마감"], ["08-29 토", "13:00", "21:30", "마감"]]],
    ["2026-08-31", [["09-01 화", "09:00", "17:00", "오픈"], ["09-02 수", "09:00", "17:00", "오픈"], ["09-04 금", "13:00", "21:30", "마감"], ["09-05 토", "13:00", "21:30", "마감"], ["09-06 일", "09:00", "15:00", "오픈"]]],
    ["2026-09-07", [["09-08 화", "09:00", "17:00", "오픈"], ["09-09 수", "09:00", "17:00", "오픈"], ["09-11 금", "13:00", "21:30", "마감"], ["09-12 토", "13:00", "21:30", "마감"]]],
  ];
  // 근무시간 = 종료 - 시작 - 휴게(근로기준법 제54조 최소: 4시간 이상 30분, 8시간 이상 1시간)
  const mins = (t) => +t.slice(0, 2) * 60 + +t.slice(3);
  const worked = (s, e) => {
    const m = mins(e) - mins(s);
    return m - (m >= 480 ? 60 : m >= 240 ? 30 : 0);
  };
  const weekTable = (week, rows) =>
    `<div data-week="${week}" hidden>${whiteHead(ui.dataTable(
      [{ header: "날짜" }, { header: "근무지" }, { header: "시작" }, { header: "종료" }, { header: "근무 유형" }],
      rows.map(([d, s, e, t]) => [d, "서초점", s, e, p.tag("quiet", t)]),
      "이 주에 잡힌 근무스케줄이 없습니다.",
    ))}${foot("주간 근무시간 합계", `${(rows.reduce((n, [, s, e]) => n + worked(s, e), 0) / 60).toFixed(1)}h`)}</div>`;
  const schedule = box(
    "근무스케줄",
    p.weekNav(A, "sched-weeks") + manage("work-schedules"),
    `<div id="sched-weeks">${weeks.map(([w, rows]) => weekTable(w, rows)).join("")}${weekTable("", [])}</div>`,
  );
  // 출퇴근 현황도 주 단위로 넘겨 본다(2026-10-02 재영). 데이터 없는 주는 빈 표.
  const attendWeeks = [
    ["2026-08-24", [["08-25", "08:55", "17:03", p.mark("ok", "정상"), "-"], ["08-26", "08:58", "17:01", p.mark("ok", "정상"), "-"], ["08-28", "12:52", "21:34", p.mark("ok", "정상"), "-"], ["08-29", "13:05", "21:31", p.mark("warn", "지각"), "5분"]], "출근 4 · 지각 1 · 결근 0"],
    ["2026-08-31", [["09-01", "08:52", "17:04", p.mark("ok", "정상"), "-"], ["09-02", "09:14", "17:02", p.mark("warn", "지각"), "14분"], ["09-04", "12:55", "21:36", p.mark("ok", "정상"), "-"], ["09-05", "12:58", "-", p.mark("warn", "퇴근 미등록"), "관리자 보정 필요"]], "출근 4 · 지각 1 · 결근 0"],
    ["", [], "출근 0 · 지각 0 · 결근 0"],
  ];
  const attendance = box(
    "출퇴근 현황",
    p.weekNav(A, "attend-weeks") + manage("attendance"),
    `<div id="attend-weeks">${attendWeeks
      .map(
        ([week, rows, sum]) =>
          `<div data-week="${week}" hidden>${whiteHead(
            ui.dataTable([{ header: "날짜" }, { header: "출근" }, { header: "퇴근" }, { header: "상태" }, { header: "비고" }], rows, "이 주의 출퇴근 기록이 없습니다."),
          )}${foot("주간 출퇴근", sum)}</div>`,
      )
      .join("")}</div>`,
  );
  const payslips = box(
    "급여명세서",
    manage("payslips"),
    whiteHead(ui.dataTable(
      [{ header: "지급월" }, { header: "기본급" }, { header: "수당" }, { header: "공제" }, { header: "실지급액" }, { header: "상태" }],
      [
        [ui.link("2026-08", L("staff/payrolls-detail.html")), "2,840,000", "186,000", "-", "<b class=\"font-semibold\">3,026,000</b>", p.tag("warn", "검토 중")],
        ["2026-07", "2,840,000", "142,000", "241,800", "<b class=\"font-semibold\">2,740,200</b>", p.tag("ok", "발송 완료")],
        ["2026-06", "2,840,000", "98,000", "238,400", "<b class=\"font-semibold\">2,699,600</b>", p.tag("ok", "발송 완료")],
      ],
    )) + foot("미발송", "1건"),
  );
  // TO-DO 는 열 이름 줄(TO-DO · 배정 · 상태)을 빼고 머리 칸 바로 아래에 줄을 둔다(2026-10-02 재영).
  const noHead = (table) => table.replace(/<thead>.*?<\/thead>/, "").replace('<table class="', '<table class="border-t ');
  const todo = box(
    "TO-DO",
    manage("todos"),
    noHead(ui.dataTable(
      [{ header: "TO-DO", align: "left" }, { header: "배정", width: "w-[220px]" }, { header: "상태", width: "w-[110px]" }],
      [
        ["신메뉴 시식 교육 참석", "개인 배정 · 08-28 14:00", p.mark("ok", "08-28 완료")],
        ["여름 프로모션 POP 교체", "근무지 전체 · 한 명 수행", p.mark("ok", "08-25 완료")],
        [`본사 위생점검 대비 냉장고 정리 ${p.tag("risk", "긴급")}`, "근무지 전체 · 각자 수행 · 09-03", p.mark("subtle", "대기")],
        ["신규 원두 시음 기록 제출", "개인 배정 · 09-05", p.mark("subtle", "대기")],
      ],
    )) + foot("전체 6", "완료 4 · 미완료 2"),
  );

  const resetDialog = x.dialog(
    resetId,
    "비밀번호를 초기화하시겠습니까?",
    "재설정 링크가 이메일 아이디 jian.seo@example.com 으로 발송됩니다. 링크는 24시간 동안 한 번만 쓸 수 있습니다.",
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("초기화", { "data-close": true }),
  );

  const body = ui.detailBody(
    `<div class="flex flex-col gap-[12px]"><div class="flex items-center gap-[6px]"><h2 class="flex-1 text-[18px] font-semibold text-erp-ink">직원 상세</h2>${ui.button("목록", { href: L("staff/index.html") })}</div>${p.cols(basic + reset + contract, schedule + attendance + payslips + todo, "grid-cols-[5fr_7fr]")}</div>` + resetDialog,
  );
  return { title: "직원 상세", html: ui.erpFrame({ header: erpHeader(A, R), title: "직원 정보 관리", body }) };
};
