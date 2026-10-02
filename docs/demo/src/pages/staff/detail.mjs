// 직원 상세. 목업 docs/mockup/staff/detail.html(서지안)을 BP 마스터로 본 것. 조회만 하고 처리는 각 관리 탭으로 넘긴다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as p from "../../staff-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const L = (path) => link(R, path);
  const manage = (page) => ui.link("관리", L(`staff/${page}.html`));
  const resetId = x.dialogId();

  const head = ui.sectionHead(
    `<span class="flex items-center gap-[12px]">서지안<span class="text-[14px] font-normal text-erp-label">바리스타 · 모리커피 서초점</span><span class="pl-[6px] text-[14px] font-normal text-erp-label">EMP-2026-0143</span></span>`,
    ui.button("목록", { href: L("staff/index.html") }),
  );

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
  const reset = p.bar(`<span class="text-[14px] text-erp-label">앱에 못 들어간다면</span>`, x.dialogTrigger("비밀번호 초기화", resetId, "soft"));
  const contract = p.section(
    "근로계약",
    manage("contracts"),
    ui.detailTable("최근 계약", [
      ["계약 유형", "정직원 근로계약"],
      ["계약 기간", "2026-03-01 ~ 무기한"],
      ["계약 상태", p.tag("ok", "체결 완료")],
      ["최근 발송일", "2026-02-24"],
      ["갱신 예정일", "-"],
    ]),
  );

  const schedule = p.section(
    "근무스케줄",
    p.tag("quiet", "이번 주 38.5h") +
      p.w("w-[132px]", ui.select(["이번 주", "최근 4주", "최근 3개월", "최근 1년", "전체 · 3년"], { "aria-label": "기간" })) +
      `<span class="pl-[6px]">${manage("work-schedules")}</span>`,
    ui.dataTable(
      [{ header: "날짜" }, { header: "근무지" }, { header: "시작" }, { header: "종료" }, { header: "근무 유형" }],
      [
        ["09-01 월", "서초점", "09:00", "17:00", p.tag("quiet", "오픈")],
        ["09-02 화", "서초점", "09:00", "17:00", p.tag("quiet", "오픈")],
        ["09-04 목", "서초점", "13:00", "21:30", p.tag("quiet", "마감")],
        ["09-05 금", "서초점", "13:00", "21:30", p.tag("quiet", "마감")],
        ["09-06 토", "서초점", "09:00", "15:00", p.tag("quiet", "오픈")],
      ],
    ),
  );
  const attendance = p.section(
    "출퇴근 현황",
    p.tag("quiet", "이번 주 · 출근 4 · 지각 1 · 결근 0") + `<span class="pl-[6px]">${manage("attendance")}</span>`,
    ui.dataTable(
      [{ header: "날짜" }, { header: "출근" }, { header: "퇴근" }, { header: "상태" }, { header: "비고" }],
      [
        ["09-01", "08:52", "17:04", p.mark("ok", "정상"), "-"],
        ["09-02", "09:14", "17:02", p.mark("warn", "지각"), "14분"],
        ["09-04", "12:55", "21:36", p.mark("ok", "정상"), "-"],
        ["09-05", "12:58", "-", p.mark("warn", "퇴근 미등록"), "관리자 보정 필요"],
      ],
    ),
  );
  const payslips = p.section(
    "급여명세서",
    p.tag("warn", "미발송 1건") + `<span class="pl-[6px]">${manage("payslips")}</span>`,
    ui.dataTable(
      [{ header: "지급월" }, { header: "기본급" }, { header: "수당" }, { header: "공제" }, { header: "실지급액" }, { header: "상태" }],
      [
        [ui.link("2026-08", L("staff/payrolls-detail.html")), "2,840,000", "186,000", "-", "<b class=\"font-semibold\">3,026,000</b>", p.tag("warn", "검토 중")],
        ["2026-07", "2,840,000", "142,000", "241,800", "<b class=\"font-semibold\">2,740,200</b>", p.tag("ok", "발송 완료")],
        ["2026-06", "2,840,000", "98,000", "238,400", "<b class=\"font-semibold\">2,699,600</b>", p.tag("ok", "발송 완료")],
      ],
    ),
  );
  const todo = p.section(
    "TO-DO",
    p.tag("quiet", "전체 6 · 완료 4 · 미완료 2") + `<span class="pl-[6px]">${manage("todos")}</span>`,
    ui.dataTable(
      [{ header: "TO-DO", align: "left" }, { header: "배정", width: "w-[220px]" }, { header: "상태", width: "w-[110px]" }],
      [
        ["신메뉴 시식 교육 참석", "개인 배정 · 08-28 14:00", p.mark("ok", "08-28 완료")],
        ["여름 프로모션 POP 교체", "근무지 전체 · 한 명 수행", p.mark("ok", "08-25 완료")],
        [`본사 위생점검 대비 냉장고 정리 ${p.tag("risk", "긴급")}`, "근무지 전체 · 각자 수행 · 09-03", p.mark("subtle", "대기")],
        ["신규 원두 시음 기록 제출", "개인 배정 · 09-05", p.mark("subtle", "대기")],
      ],
    ),
  );

  const resetDialog = x.dialog(
    resetId,
    "비밀번호를 초기화하시겠습니까?",
    "재설정 링크가 이메일 아이디 jian.seo@example.com 으로 발송됩니다. 링크는 24시간 동안 한 번만 쓸 수 있습니다.",
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("초기화", { "data-close": true }),
  );

  const body = ui.detailBody(
    `<div class="flex flex-col gap-[12px]">${head}${p.cols(basic + reset + contract, schedule + attendance + payslips + todo, "grid-cols-[5fr_7fr]")}</div>` + resetDialog,
  );
  return { title: "직원 상세", html: ui.erpFrame({ header: erpHeader(A, R), title: "직원 상세", body }) };
};
