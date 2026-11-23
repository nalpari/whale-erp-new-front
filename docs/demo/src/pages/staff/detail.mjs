// 직원 상세. 목업 docs/mockup/staff/detail.html(서지안)을 BP 마스터로 본 것. 처리는 각 관리 탭으로 넘기고, 퇴직 처리만 여기서 한다(2026-10-07 재영).
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as p from "../../staff-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const L = (path) => link(R, path);
  const manage = (page) => ui.link("관리", L(`staff/${page}.html`));
  const retireId = x.dialogId();
  const { headIn, box } = p;
  // 머리 칸 아래 열 이름 줄은 흰 바탕에 굵고 진한 글자(2026-10-02 재영)
  const whiteHead = (table) =>
    table.replace("border-erp-thead-line bg-erp-thead-bg\">", "border-erp-thead-line bg-white\">").replaceAll('class="px-[10px] font-medium text-erp-thead-text"', 'class="px-[10px] font-semibold text-erp-ink"');
  // 표 아래 요약 한 줄(오른쪽 끝에 이름 + 값)
  const foot = (label, value) =>
    `<div class="flex h-[46px] items-center justify-end gap-[12px] border-x border-b border-erp-thead-line bg-erp-thead-bg px-[12px] text-[14px]"><span class="text-erp-thead-text">${label}</span><b class="font-semibold text-erp-ink">${value}</b></div>`;

  // 요약 띠 — 성명(+ 재직) · 고용형태 · 직무 · 근무지(유형 꼬리표) · 입사일 · 가입 상태(앱 staff-members/[id]/page.tsx, 2026-11-19 사용자 지정)
  const summary = p.summaryStrip([
    ["성명", `<span class="truncate">서지안</span>${p.mark("ok", "재직")}`],
    ["고용형태", "정직원"],
    ["직무", "바리스타"],
    ["근무지", p.storeName("직영", "모리커피 서초점")],
    ["입사일", "2026-03-01"],
    ["가입 상태", p.tag("ok", "가입 완료")],
  ]);
  // 인적 사항 · 직원 앱 계정을 한 표 「직원 정보」로 — 제목 줄 오른쪽에 점선 알약 [생년월일 수정] · [비밀번호 초기화](앱 RoundButton).
  // 초대는 「종류 ┃ 결과 ┃ YYYY-MM-DD 발송」(앱 invitationParts, 2026-11-19 사용자 지정)
  const birthBody = `<div class="flex flex-col gap-[12px]">${ui.dateField(A, { label: "생년월일", value: "1998-07-12" })}</div>`;
  const basic = ui.detailTable(
    "직원 정보",
    [
      ["생년월일", "1998-07-12"],
      ["휴대전화번호", "010-2841-7702"],
      ["이메일", "jian.seo@example.com"],
      ["초대", ui.detailValues(["가입 초대", "수락", "2026-02-24 발송"])],
    ],
    `<span class="flex items-center gap-[6px]">${p.roundAsk("생년월일 수정", "생년월일 수정", birthBody, "저장")}${p.roundAsk(
      "비밀번호 초기화",
      "비밀번호를 초기화하시겠습니까?",
      // 계정 비밀번호는 여러 BP 가 함께 쓴다. 가입 전·퇴직·탈퇴 직원에게는 초기화 버튼을 숨긴다(2026-10-08 재영).
      "재설정 링크가 이메일 아이디 jian.seo@example.com 으로 발송됩니다. 직원은 24시간 안에 비밀번호를 설정해야 합니다. 계정 비밀번호는 여러 BP가 함께 쓰므로 다른 BP 로그인에도 적용됩니다. 같은 계정에 1분 안에 다시 요청하면 「잠시 뒤 다시 시도해 주세요」로 막습니다.",
      "초기화",
    )}</span>`,
  );
  const contract =
    ui.detailTable(headIn("근로계약", manage("contracts")), [
      ["계약 유형", "정직원 근로계약"],
      ["계약 기간", "2026-03-01 ~ 무기한"],
      ["계약 상태", p.tag("ok", "서명 완료")],
      ["최근 발송일", "2026-02-24"],
      ["갱신 예정일", "-"],
    ]);

  // 근무스케줄은 주 단위로 넘겨 본다(2026-10-02 재영). 화살표로 한 주씩, 가운데 주 이름을 누르면 달력에서 그 달의 몇째 주를 고른다.
  // 데모 데이터는 3주뿐이고, 다른 주를 고르면 빈 표가 나온다. 처음 열리는 주는 data-week-start.
  const weeks = [
    ["2026-08-24", [["08-25 화", "09:00", "17:00"], ["08-26 수", "09:00", "17:00"], ["08-28 금", "13:00", "21:30"], ["08-29 토", "13:00", "21:30"]]],
    ["2026-08-31", [["09-01 화", "09:00", "17:00"], ["09-02 수", "09:00", "17:00"], ["09-04 금", "13:00", "21:30"], ["09-05 토", "13:00", "21:30"], ["09-06 일", "09:00", "15:00"]]],
    ["2026-09-07", [["09-08 화", "09:00", "17:00"], ["09-09 수", "09:00", "17:00"], ["09-11 금", "13:00", "21:30"], ["09-12 토", "13:00", "21:30"]]],
  ];
  // 근무시간 = 종료 - 시작 - 휴게(근로기준법 제54조 최소: 4시간 이상 30분, 8시간 이상 1시간)
  const mins = (t) => +t.slice(0, 2) * 60 + +t.slice(3);
  const worked = (s, e) => {
    const m = mins(e) - mins(s);
    return m - (m >= 480 ? 60 : m >= 240 ? 30 : 0);
  };
  const schedTable = (rows) =>
    whiteHead(ui.dataTable(
      [{ header: "날짜" }, { header: "근무지" }, { header: "시작" }, { header: "종료" }],
      rows.map(([d, s, e]) => [d, "서초점", s, e]),
      "등록된 근무스케줄이 없습니다.",
    )) + foot("주간 근무시간 합계", `${(rows.reduce((n, [, s, e]) => n + worked(s, e), 0) / 60).toFixed(1)}h`);
  // 출퇴근 현황도 같은 주를 본다(2026-10-02 재영). 데이터 없는 주는 빈 표.
  const attendWeeks = {
    "2026-08-24": [["08-25", "08:55", "17:03", p.mark("ok", "정상"), "-"], ["08-26", "08:58", "17:01", p.mark("ok", "정상"), "-"], ["08-28", "12:52", "21:34", p.mark("ok", "정상"), "-"], ["08-29", "13:05", "21:31", p.mark("warn", "지각"), "5분"]],
    "2026-08-31": [["09-01", "08:52", "17:04", p.mark("ok", "정상"), "-"], ["09-02", "09:14", "17:02", p.mark("warn", "지각"), "14분"], ["09-04", "12:55", "21:36", p.mark("ok", "정상"), "-"], ["09-05", "12:58", "-", p.mark("warn", "퇴근 미등록"), "관리자 보정 필요"]],
  };
  const attendTable = (rows) =>
    whiteHead(ui.dataTable([{ header: "날짜" }, { header: "출근" }, { header: "퇴근" }, { header: "상태" }, { header: "비고" }], rows, "등록된 출퇴근 기록이 없습니다."));
  // 근무스케줄 · 출퇴근 현황은 같은 주를 본다 — 주 이동을 두 상자 위 한 줄로 올리고 두 상자를 12px 로 붙인다(앱 page.tsx, 2026-11-19 사용자 지정).
  // 주마다 두 상자를 한 묶음([data-week])으로 바꿔 보인다
  const weekPair = (week, sched, attend) =>
    `<div data-week="${week}" hidden class="flex flex-col gap-[12px]">${box("근무스케줄", manage("work-schedules"), schedTable(sched))}${box("출퇴근 현황", manage("attendance"), attendTable(attend))}</div>`;
  const scheduleAndAttendance = `<div class="flex flex-col gap-[12px]"><div class="flex items-center gap-[8px]"><span class="flex-1 text-[14px] font-medium text-erp-label">근무스케줄 · 출퇴근 현황 기간</span>${p.weekNav(A, "staff-weeks")}</div><div id="staff-weeks">${weeks
    .map(([w, rows]) => weekPair(w, rows, attendWeeks[w] ?? []))
    .join("")}${weekPair("", [], [])}</div></div>`;
  const payslips = box(
    "급여명세서",
    manage("payslips"),
    whiteHead(ui.dataTable(
      [{ header: "지급월" }, { header: "기본급" }, { header: "수당" }, { header: "공제" }, { header: "실지급액" }, { header: "상태" }],
      [
        [ui.link("2026-08", L("staff/payrolls-detail.html")), "2,840,000", "186,000", "-", "<b class=\"font-semibold\">3,026,000</b>", `${p.tag("quiet", "작성 중")} ${p.tag("warn", "검토 대기")}`],
        ["2026-07", "2,840,000", "142,000", "241,800", "<b class=\"font-semibold\">2,740,200</b>", p.tag("ok", "발송 완료")],
        ["2026-06", "2,840,000", "98,000", "238,400", "<b class=\"font-semibold\">2,699,600</b>", p.tag("ok", "발송 완료")],
      ],
    )) + foot("미발송", "1건"),
  );
  // TO-DO 처리 이력 — TO-DO 상자 요약 줄 아래에 붙인다(앱 summary-boxes.tsx TodoSummaryFoot). 바꾼 사람 이름은 오지 않아 바꾼 쪽만 보인다
  const todoHistory = `<section aria-label="TO-DO 처리 이력"><h4 class="flex h-[38px] items-center border-x border-b border-erp-thead-line bg-white px-[12px] text-[13px] font-medium text-erp-label">TO-DO 처리 이력</h4><ul class="rounded-b-[2px] border-x border-b border-erp-thead-line bg-white text-[14px]">${[
    ["08-28 15:02", "신메뉴 시식 교육 참석", "진행 중 → 완료", "직원"],
    ["08-27 18:40", "본사 위생점검 대비 냉장고 정리", "긴급 표시 변경", "관리자"],
    ["08-25 11:20", "여름 프로모션 POP 교체", "대기 → 완료", "직원"],
  ]
    .map(
      ([when, title, what, who]) =>
        `<li class="flex h-[46px] items-center gap-[10px] border-b border-erp-thead-line px-[12px] last:border-b-0"><span class="w-[100px] shrink-0 text-erp-label">${when}</span><span class="min-w-0 flex-1 truncate text-erp-ink">${title}</span><span class="w-[140px] shrink-0 text-center text-erp-ink">${what}</span><span class="w-[60px] shrink-0 text-center text-erp-label">${who}</span></li>`,
    )
    .join("")}</ul></section>`;
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
    )) + foot("전체 6", "완료 4 · 미완료 2") + todoHistory,
  );

  // 퇴직 처리(운영 정책 CTR-24·CTR-25). 퇴직일은 오늘 이후이거나 최근 3개월 안의 지난 날짜(STAFF-24).
  // 근무지가 업무 범위 안이고 「직원 정보 관리」 수정 권한이 있을 때만, 가입 전(초안·가입 대기) 레코드가 아닐 때만 버튼이 보인다.
  // 처리하면 퇴직일만 저장하고 재직 상태·근로계약은 그대로다(퇴직 예정). 퇴직일 다음 날 시스템이 퇴직으로 바꾸며 정리한다(2026-10-08 재영, STAFF-28).
  // 퇴직 예정인 동안에는 같은 자리에 「퇴직일 변경」·「퇴직 처리 취소」. 데모는 재직 장면 하나다.
  const retireDialog = x.dialog(
    retireId,
    "퇴직 처리",
    `<div class="flex flex-col gap-[12px]">${ui.dateField(A, { label: "퇴직일", value: "2026-09-10" })}<p class="flex items-start gap-[6px] text-[13px]"><span aria-hidden="true" class="mt-[5px] ml-[4px] size-[7px] shrink-0 rounded-bl-[4px] border-b border-l border-erp-brand-soft"></span><span><span class="mr-[6px] inline-block rounded-full border border-erp-thead-line bg-erp-thead-bg px-[10px] leading-[20px] font-medium text-erp-ink">퇴직일은 2026-06-10 이후 날짜로 선택해 주세요.</span><span class="text-erp-label">지난 날짜는 최근 3개월까지만 선택할 수 있습니다.</span></span></p><section class="rounded-[2px] border border-erp-thead-line"><h3 class="flex h-[42px] items-center border-b border-erp-thead-line bg-erp-thead-bg px-[12px] text-[14px] font-medium text-erp-ink">퇴직일 이후 정리되는 항목</h3><ul><li class="flex min-h-[46px] items-center gap-[12px] border-b border-erp-thead-line px-[12px] py-[8px] last:border-b-0"><span class="min-w-0 flex-1">삭제되는 근무스케줄<span class="block text-[13px] text-erp-label">퇴직일 다음 날(2026-09-11)부터</span></span><span class="shrink-0 font-semibold">2건</span></li><li class="flex min-h-[46px] items-center gap-[12px] border-b border-erp-thead-line px-[12px] py-[8px] last:border-b-0"><span class="min-w-0 flex-1">배정 해제되는 TO-DO<span class="block text-[13px] text-erp-label">완료하지 않은 개인 배정</span></span><span class="shrink-0 font-semibold">1건</span></li></ul></section>${p.guideBand("퇴직 처리 안내", ["퇴직 처리 시 퇴직일이 저장되며, 퇴직일까지는 '퇴직 예정' 상태로 재직 정보와 근로계약이 유지됩니다.", "퇴직일 다음 날 '퇴직' 상태로 변경되며, 재직 정보와 근로계약이 정리됩니다. 이후에는 퇴직 처리를 되돌릴 수 없습니다.", "퇴직 처리는 퇴직일 전까지 취소할 수 있으며, 퇴직 후에도 직원의 앱 계정은 유지됩니다."])}</div>`,
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("퇴직 처리", { variant: "danger", "data-close": true }),
  );

  const body = ui.detailBody(
    `<div class="flex flex-col gap-[12px]">${p.detailHead("직원 상세", x.dialogTrigger("퇴직 처리", retireId, "danger") + ui.button("목록", { href: L("staff/index.html") }))}${summary}${p.cols(basic + contract, scheduleAndAttendance + payslips + todo, "grid-cols-[5fr_7fr]")}</div>` + retireDialog,
  );
  return { title: "직원 상세", html: ui.erpFrame({ header: erpHeader(A, R), title: "직원정보 관리", body }) };
};
