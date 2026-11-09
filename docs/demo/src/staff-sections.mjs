// 직원관리 화면들이 같이 쓰는 내용. 목업 docs/mockup/staff/index.html 은 탭 하나에 모두 있었는데,
// 데모에서는 헤더 메뉴의 소메뉴마다 화면을 나눴다(2026-10-02 재영): 직원 정보·근로계약·근무스케줄·출퇴근 현황·급여명세서·TO-DO.
// 목업에서 목록 옆에 붙어 있던 등록·수정 폼(근무스케줄, 기록 보정, TO-DO)은 슬라이드 패널로 옮겼다.
import * as ui from "./ui.mjs";
import * as x from "./extra.mjs";
import * as p from "./staff-parts.mjs";
import { link } from "./site.mjs";
import { req } from "./biz-form.mjs";
import { withIcon } from "./pages/system/admins.mjs";

// 급여명세서 작성 팝업: 점포 · 이름으로 표 줄을 좁히고, 직원을 고르면 「작성」을 켠다. erp.js 목록 거르기는 dialog 안을 건너뛰어 이 부품에 붙여 둔다.
const PICK_SCRIPT = `<script>
(() => {
  document.querySelectorAll("[data-staff-pick]").forEach((box) => {
    const dlg = box.closest("dialog");
    const store = box.querySelector("[data-pick-store]");
    const name = box.querySelector("[data-pick-name]");
    const ok = dlg.querySelector("[data-pick-ok]");
    const none = box.querySelector("[data-pick-none]");
    const rows = [...box.querySelectorAll("tbody tr")];
    const setOk = (on) => {
      ok.style.cssText = on ? "" : "opacity:.4;pointer-events:none";
      ok.setAttribute("aria-disabled", on ? "false" : "true");
    };
    const run = () => {
      const s = store.value === "전체 점포" ? "" : store.value;
      const q = name.value.trim();
      let shown = 0;
      rows.forEach((tr) => {
        const [, n, st] = tr.cells;
        const hit = (!s || st.textContent === s) && (!q || n.textContent.includes(q));
        tr.hidden = !hit;
        if (hit) shown++;
        const r = tr.querySelector("input");
        if (!hit && r.checked) r.checked = false;
      });
      none.hidden = shown > 0;
      setOk(rows.some((tr) => !tr.hidden && tr.querySelector("input").checked));
    };
    box.addEventListener("input", run);
    box.addEventListener("change", run);
    dlg.addEventListener("close", () => {
      store.selectedIndex = 0;
      name.value = "";
      rows.forEach((tr) => (tr.querySelector("input").checked = false));
      run();
    });
  });
})();
</script>`;

export function staffSections({ A, R }) {
  const L = (path) => link(R, path);
  const offBtn = (label, a = {}) => ui.button(label, { variant: "off", ...a });
  // 직원관리의 목록은 맨 앞에 순번(2026-10-02 재영). 순번은 내림차순 — 첫 줄이 전체 건수다(2026-10-13 재영).
  // 목록 화면 표 — 비면 열 이름 줄을 두고 빈 칸이 남는 높이를 채운다(ui.fillTable, 앱 DataTable fillEmpty, 2026-11-05 사용자 지정, 3팀 확인 필요).
  // 데모 목록은 늘 줄이 있어 거른 결과가 비었을 때의 「조건에 맞는 …」 문구를 넘긴다 — 「등록된 …」(아예 없음)은 앱만 가른다
  const numberedList = (columns, rows, empty, total = rows.length) =>
    ui.fillTable([{ header: "순번", width: "w-[60px]" }, ...columns], rows.map((r, i) => [total - i, ...r]), empty);
  const pageNav = (n) => `<div class="pt-[14px]">${ui.pagination(A, 1, n)}</div>`;

  // 필터의 점포 칸. 헤더 점포 선택이 점포 1개면 그 점포로 고정, 전체·일반·가맹 묶음이면 검색(erp.js initScopeStore, 2026-10-02 재영).
  const storeFilter = () =>
    ui.filterSection("점포", ui.searchField(A, { placeholder: "점포명", label: "점포" }).replace("<input ", "<input data-scope-store "), { tight: true });

  // ── 직원 목록 ──
  const staffCols = [
    { header: "순번", width: "w-[60px]" },
    // 직원 160 — 가린 행 「본사에 정보제공 미동의」가 한 줄에 든다. 휴대전화번호 160 · 휴대폰 아이콘 + 번호(앱 staff-table.tsx, 2026-11-05 사용자 지정, 3팀 확인 필요)
    { header: "직원", width: "w-[160px]" },
    { header: "휴대전화번호", width: "w-[160px]" },
    { header: "점포" },
    { header: "고용형태", width: "w-[110px]" },
    { header: "가입·인증", width: "w-[210px]" },
    { header: "계약 상태", width: "w-[160px]" },
    { header: "재직", width: "w-[110px]" },
  ];
  const D = L("staff/detail.html");
  const who = (name, href) => (href ? ui.link(name, href) : name);
  const holdPanel = "hold-form";
  const staffRows = [
    [who("서지안", D), "010-2841-7702", "모리커피 서초점", "정직원", p.tag("ok", "가입 완료"), p.tag("ok", "체결 완료"), p.mark("ok", "재직")],
    [who("오세라", D), "010-3392-4418", "모리커피 서초점", "정직원", p.tag("ok", "가입 완료"), p.tag("ok", "체결 완료"), p.mark("ok", "재직")],
    [who("문태경", D), "010-4471-2298", "온기식당 판교점", "정직원", p.tag("ok", "가입 완료"), p.tag("ok", "체결 완료"), `${p.mark("ok", "재직")} ${p.tag("warn", "퇴직 예정 09-30")}`], // 퇴직 예정은 재직으로 센다(2026-10-08 재영)
    [who("배정숙", D), "010-8820-3317", "온기식당 판교점", "파트타이머", p.tag("ok", "가입 완료"), p.tag("warn", "갱신 예정 D-20"), p.mark("ok", "재직")],
    [who("남도현"), "010-9014-5563", "모리커피 성수점", "파트타이머", p.tag("warn", "초대 발송 · 08-31"), p.tag("quiet", "발송 대기"), p.mark("subtle", "가입 대기")],
    [`<button type="button" aria-expanded="false" aria-controls="${holdPanel}" class="text-erp-link hover:underline">하준서</button>`, "010-3392-4418", "모리커피 성수점", "파트타이머", p.tag("risk", "연결 보류 · 4일"), p.tag("quiet", "발송 대기"), p.mark("risk", "확인 필요")],
    [who("정유담"), "010-5518-7734", "온기식당 판교점", "파트타이머", p.tag("info", "소속 추가 확인"), p.tag("quiet", "발송 대기"), p.mark("subtle", "응답 대기")],
    [who("권도윤", D), "010-7742-1160", "모리커피 서초점", "파트타이머", p.tag("ok", "가입 완료"), p.tag("warn", "서명 대기 · D-24"), p.mark("warn", "날인 대기")],
    [who("유하람", D), "010-2093-8875", "모리커피 연남점", "파트타이머", p.tag("ok", "가입 완료"), p.tag("risk", "거부 · 09-02"), p.mark("risk", "재발송 필요")],
    [`<span class="whitespace-nowrap text-erp-muted">본사에 정보제공 미동의</span>`, "-", "모리커피 연남점", "-", "-", "-", "-"],
    [who("민세하"), "010-7725-3390", "모리커피 성수점", "파트타이머", p.tag("risk", "가입 불가(만 19세 미만)"), p.tag("quiet", "발송 대기"), p.mark("risk", "삭제 대상")],
    [who("임채운"), "010-6613-0284", "모리커피 연남점", "파트타이머", p.tag("quiet", "가입 완료"), p.tag("quiet", "종료"), p.mark("subtle", "퇴직 07-31")],
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
    // 순번은 내림차순 — 최근 등록이 먼저라 1쪽 첫 줄이 전체 건수다(2026-10-12).
    ui.fillTable(staffCols, staffRows.map(([name, tel, ...rest], i) => [63 - i, name, tel === "-" ? tel : withIcon("phone", tel), ...rest]), "조건에 맞는 직원이 없습니다.") +
    pageNav(4);

  // ── 근로계약 ──
  const N = L("staff/contracts-new.html");
  // 상태별 버튼(재발송 · 새 계약)은 상세 제목 줄로 옮겼다. 목록은 직원 이름으로 그 상태의 상세에 들어가고,
  // 임시저장 행은 상세 없이 이어 쓰기(contracts-draft)로 바로 가며 삭제는 그 화면에서 확인한 뒤다(2026-10-13, 운영 정책 CTR-19).
  // 행 끝 칸에 있던 안내 문구는 상태 칸에 붙인다(2026-10-12). 상세는 상태마다 한 장이라 같은 상태의 다른 행도 그 견본으로 간다.
  const C = (s) => L(`staff/contracts-${s}.html`);
  const CDraft = C("draft");
  const contractRows = [
    [ui.link("한서윤", CDraft), "모리커피 성수점", "-", "-", "-", p.tag("quiet", "임시저장")],
    [ui.link("남도현", C("pending")), "모리커피 성수점", "2026-09-14 ~ 무기한", "11,200 /h", "-", p.tag("quiet", "발송 대기")],
    [ui.link("하준서", C("hold")), "모리커피 성수점", "2026-09-14 ~ 무기한", "11,200 /h", "-", p.tag("risk", "발송 대기 · 연결 보류")],
    [ui.link("정유담", C("pending")), "온기식당 판교점", "2026-09-18 ~ 2027-03-17", "10,800 /h", "-", p.tag("quiet", "발송 대기 · 소속 확인 중")],
    [ui.link("권도윤", C("signing")), "모리커피 서초점", "2026-09-01 ~ 2027-08-31", "11,600 /h", "09-01", p.tag("warn", "서명 대기 · D-24")],
    // 권도윤은 앞 계약이 체결 완료라 08-23까지만 근무스케줄·출퇴근을 받는다(STAFF-29).
    [ui.link("권도윤", C("signed")), "모리커피 서초점", "2025-08-24 ~ 2026-08-23", "11,200 /h", "2025-08-20", p.tag("ok", "체결 완료 · 재계약 서명 대기")],
    [ui.link("유하람", C("detail")), "모리커피 연남점", "2026-08-28 ~ 2027-02-27", "10,800 /h", "08-28", p.tag("risk", "거부 · 09-02")],
    [ui.link("서지안", C("signed")), "모리커피 서초점", "2026-03-01 ~ 무기한", "2,840,000 /월", "02-24", p.tag("ok", "체결 완료")],
    [ui.link("오세라", C("signed")), "모리커피 서초점", "2025-11-01 ~ 무기한", "3,420,000 /월", "10-27", p.tag("ok", "체결 완료")],
    [ui.link("배정숙", C("signed")), "온기식당 판교점", "2026-02-10 ~ 2026-09-30", "11,600 /h", "02-06", p.tag("warn", "갱신 예정 · D-20")],
    // 파트타이머를 반복 갱신해 기간제 2년을 넘기면 무기계약으로 바뀐다(노무사 확인 2026-10-14, 질문 24). 첫 계약 2024-10-01 부터 다음 갱신이면 2년을 넘는다.
    [ui.link("송다인", C("signed")), "모리커피 연남점", "2026-04-01 ~ 2026-09-30", "11,200 /h", "03-27", p.tag("warn", "갱신 예정 · D-20 · 무기계약 전환")],
    [ui.link("임채운", C("ended")), "모리커피 연남점", "2026-08-01 ~ 2027-07-31", "10,400 /h", "07-20", p.tag("quiet", "종료 · 퇴직")],
    // 임채운은 앞 계약(체결 완료)으로 퇴직일 07-31까지 일했다. 퇴직은 체결 완료 계약을 닫지 않는다(운영 정책 CTR-24).
    [ui.link("임채운", C("signed")), "모리커피 연남점", "2025-08-01 ~ 2026-07-31", "10,400 /h", "2025-07-28", p.tag("ok", "체결 완료")],
  ];
  // 근로계약 관리: 왼쪽 필터(점포 · 직원 · 상태) + 목록. 목업의 목록 위 상태 라디오를 필터의 상태 체크로 옮겼다.
  const contractsFilter = ui.filterPanel(A, [
    storeFilter(),
    ui.filterSection("직원", ui.searchField(A, { placeholder: "이름" }), { tight: true }),
    ui.filterSection("상태", ["임시저장", "발송 대기", "서명 대기", "체결 완료", "거부", "갱신 예정", "종료"].map((t) => ui.checkbox(A, t, true)).join(""), { last: true }),
  ]);
  const contractsTab =
    ui.listToolbar(contractRows.length, "") +
    numberedList(
      [
        { header: "직원", width: "w-[90px]" },
        { header: "점포", width: "w-[140px]" },
        { header: "계약 기간" },
        { header: "급여", width: "w-[130px]" },
        { header: "발송일", width: "w-[80px]" },
        { header: "상태", width: "w-[220px]" },
      ],
      contractRows,
      "조건에 맞는 근로계약이 없습니다.",
    ) +
    p.note("「무기계약 전환」은 파트타이머를 반복 갱신해 첫 계약부터 2년이 넘는 계약입니다. 다시 갱신하면 기간의 정함이 없는 계약이 됩니다.") +
    pageNav(7);

  // ── 근무스케줄·출퇴근 ──
  const schedPanel = "sched-form";
  const fixPanel = "fix-form";
  const proxyPanel = "proxy-form";
  // 근무스케줄 보기는 로그인 후 홈과 같은 부품(staff-parts schedWeek·schedMonth)으로 그린다(2026-10-08 재영).
  // 관리는 그날 체결 완료 근로계약이 있는 재직자 전원(휴무 포함)을 보이고(미체결 직원은 뺀다, STAFF-29), 주간 보기 아래에 공백 안내와 「이 시간대에 배정」을 둔다.
  // 주간 근무표(직원 × 요일 표, 주 합계)는 없앴다(STAFF-26). 시간축 00~24시(STAFF-37), 주 08-17 ~ 08-23, 샘플의 오늘은 공백이 드러나는 토요일.
  const schedCrew = [
    ["오세라", "점장", { 1: [9, 18], 2: [9, 18], 4: [9, 18], 5: [9, 18], 6: [10, 15] }],
    ["유하람", "바리스타", { 2: [16, 22], 3: [16, 22], 5: [16, 22], 6: [17, 22], 0: [12, 22] }],
    ["서지안", "바리스타", { 1: [7, 16], 2: [7, 16], 3: [7, 16], 4: [7, 16], 0: [10, 19] }],
    // 넷째 칸은 체결 완료 계약 기간. 월간 보기는 그 밖의 날에 인원에서 뺀다(STAFF-29).
    ["권도윤", "바리스타", { 1: [13, 22], 3: [13, 22], 4: [13, 22], 5: [13, 22], 0: [13, 22] }, ["2025-08-24", "2026-08-23"]],
  ];
  const schedWeekView = p.schedWeek(schedCrew, { open: 0, close: 24, dates: { 1: 17, 2: 18, 3: 19, 4: 20, 5: 21, 6: 22, 0: 23 }, pick: 6, all: true, gap: schedPanel });
  // 지난 주 복사 미리보기(앱 schedule-copy.tsx). 앱은 도구 줄 아래 카드 안에 펼치지만 데모는 창으로 띄운다.
  // 제목 줄: 「지난 주 복사」 18px | 기간 16px 회색 + 오른쪽 [취소] [복사], 표 직원 200 · 지난 주 근무 · 이번 주 근무 140 가운데 · 처리 앞 36px, 아래 안내 박스(2026-11-05 사용자 지정, 3팀 확인 필요)
  const copyId = x.dialogId();
  const copyCell = "border-b border-erp-thead-line px-[10px]";
  const copyRow = (name, last, now, status) =>
    `<tr class="h-[46px]"><td class="${copyCell} truncate">${name}</td><td class="${copyCell} text-center tabular-nums${last === "-" ? " text-erp-muted" : ""}">${last}</td><td class="${copyCell} text-center tabular-nums${now === "-" ? " text-erp-muted" : ""}">${now}</td><td class="border-b border-erp-thead-line pr-[10px] pl-[36px]">${status}</td></tr>`;
  const copyDialog =
    `<dialog id="${copyId}" aria-labelledby="${copyId}-title" class="m-auto w-[760px] max-w-[calc(100vw-32px)] rounded-[2px] border border-[#ebebeb] bg-white p-[23px] font-erp tracking-[-0.025em] text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40">` +
    `<div class="flex items-center gap-[10px]"><h2 id="${copyId}-title" class="text-[18px] font-semibold">지난 주 복사</h2><span aria-hidden="true" class="h-[14px] w-px bg-[#d9d9d9]"></span><span class="flex-1 text-[16px] font-medium text-erp-label">8월 10일 ~ 16일 → 8월 17일 ~ 23일</span><span class="flex gap-[6px]">${offBtn("취소", { "data-close": true })}${ui.button("3명 복사", { "data-close": true })}</span></div>` +
    `<div class="mt-[18px] flex flex-col gap-[16px] text-[14px]"><table class="w-full table-fixed border-collapse text-[14px]"><thead><tr class="h-[42px] border-y border-erp-thead-line bg-erp-thead-bg text-left text-erp-thead-text"><th scope="col" class="w-[200px] px-[10px] font-medium">직원</th><th scope="col" class="w-[140px] px-[10px] text-center font-medium">지난 주 근무</th><th scope="col" class="w-[140px] px-[10px] text-center font-medium">이번 주 근무</th><th scope="col" class="pr-[10px] pl-[36px] font-medium">처리</th></tr></thead><tbody>` +
    copyRow("오세라", "5일 · 40.0h", "5일 · 40.0h", ui.badge("on", "복사")) +
    copyRow("유하람", "5일 · 28.0h", "5일 · 28.0h", ui.badge("on", "복사")) +
    copyRow("서지안", "5일 · 40.0h", "4일 · 32.0h", `${ui.badge("on", "일부 제외")} ${p.sub("08-23 시간 겹침")}`) +
    copyRow("권도윤", "5일 · 45.0h", "-", ui.badge("closed", "제외 · 근로계약 미체결")) +
    copyRow("배정숙", "-", "-", ui.badge("closed", "지난 주 근무 없음")) +
    `</tbody></table>` +
    p.guideBand("지난 주 복사", [
      "관리자가 [복사]를 누르면 지난 주 근무스케줄이 이번 주에 바로 등록됩니다.",
      "지난 주 근무가 없는 직원은 복사 대상에서 제외됩니다. 해당 직원은 [근무스케줄 등록]에서 직접 등록합니다.",
      "복사한 근무스케줄은 해당 <u>직원의 근무 앱</u>과 <u>이메일</u>로 알림이 발송됩니다.",
    ]) +
    `</div></dialog>`;
  // 도구 줄 둘째 줄: 「근무지」 라벨 + 300px 선택칸 · 기간 이동 · 오른쪽 [지난 주 복사] [근무스케줄 등록](앱 page.tsx ScheduleFrame · schedule-controls.tsx SchedulePicker, 2026-11-05 사용자 지정, 3팀 확인 필요).
  // 폐점 점포를 고르면 근무지 칸 바로 아래에 빨간 13px 「폐점 점포는 근무스케줄을 등록할 수 없습니다.」 — 데모 점포는 모두 운영 중이라 그리지 않는다.
  const schedTools = (nav) =>
    `<div class="flex flex-wrap items-center gap-[6px]"><span class="flex shrink-0 items-center gap-[8px]"><span aria-hidden="true" class="text-[14px] font-medium text-erp-label">근무지</span><span class="w-[300px]">${ui.select(["모리커피 서초점", "모리커피 연남점", "모리커피 성수점"], { "aria-label": "근무지" })}</span></span>${nav}<span class="flex-1"></span>${x.dialogTrigger("지난 주 복사", copyId, "soft")}${ui.slideTrigger("근무스케줄 등록", schedPanel)}</div>`;
  // 월간 보기는 달 이동을 달력 위가 아니라 도구 줄에 둔다(앱 showMonthNav={false})
  const schedMonthView = p.schedMonth(A, schedCrew, { year: 2026, month: 7, today: "2026-08-22", all: true, bar: schedTools });

  const schedLog = p.section(
    "변경이력",
    "",
    ui.dataTable(
      // 변경일시는 연도까지(점포 · BP 변경이력과 같다, 앱 schedule-controls.tsx ScheduleHistory, 2026-11-05 사용자 지정, 3팀 확인 필요)
      [{ header: "변경일시", width: "w-[180px]" }, { header: "구분", width: "w-[80px]" }, { header: "내용", align: "left" }],
      [
        ["2026-09-01 14:22", "수정", "서지안 09-04 13:00-21:30 → 09:00-17:00 · 정하윤"],
        ["2026-08-31 10:05", "추가", "09-08 일괄 등록 3명 · 정하윤"],
        ["2026-08-28 17:41", p.mark("risk", "삭제"), "배정숙 08-30 16:00-22:00 삭제 · 정하윤"],
      ],
    ),
  );
  // 출퇴근 현황: 일별 출퇴근은 하루씩, 근태 요약은 한 주씩 넘겨 본다(2026-10-02 재영). 데모의 오늘은 2026-09-06(일).
  // 데이터는 09-04 ~ 09-06 사흘과 08-24 · 08-31 두 주뿐이고, 나머지 날짜·주는 빈 표.
  const days = [
    ["2026-09-06", [
      ["오세라", p.sub("09:00"), "08:54", p.sub("근무 중"), p.mark("ok", "정상")],
      ["서지안", p.sub("09:00"), "08:57", p.sub("근무 중"), p.mark("ok", "정상")],
      ["유하람", p.sub("-"), "-", "-", p.mark("subtle", "휴무")],
      ["배정숙", p.sub("10:00"), p.sub("미기록"), "-", p.mark("risk", "미출근")],
    ]],
    ["2026-09-05", [
      ["오세라", p.sub("09:00"), "08:51", "18:02", p.mark("ok", "정상")],
      ["서지안", p.sub("13:00"), "12:58", p.sub("미기록"), p.mark("warn", "퇴근 미등록")],
      ["유하람", p.sub("-"), "-", "-", p.mark("subtle", "휴무")],
      ["배정숙", p.sub("10:00"), "09:58", "16:01", p.mark("ok", "정상")],
    ]],
    ["2026-09-04", [
      ["오세라", p.sub("09:00"), "09:00", "18:00", p.mark("ok", "정상")],
      ["서지안", p.sub("13:00"), "12:55", "21:36", p.mark("ok", "정상")],
      ["유하람", p.sub("-"), "-", "-", p.mark("subtle", "휴무")],
      ["배정숙", p.sub("10:00"), "09:55", "16:00", p.mark("ok", "정상")],
    ]],
    ["", []],
  ];
  const today = p.section(
    "일별 출퇴근",
    p.weekNav(A, "attend-days", "2026-09-06", { day: true, md: true }),
    // 표 틀을 옆 근태 요약 아래 끝까지 늘려 두 칸의 아래 선을 맞춘다 — 줄은 위에서부터 쌓이고 남는 높이는 틀 안 빈칸, 비었으면 안내가 그 가운데
    // (앱 attendance-sections.tsx DaySection, 2026-11-05 사용자 지정, 3팀 확인 필요)
    `<div id="attend-days" class="flex flex-1 flex-col">${days
      .map(([d, rows]) => {
        const cols = [{ header: "직원" }, { header: "예정" }, { header: "출근" }, { header: "퇴근" }, { header: "비고" }];
        const body = rows.length
          ? `<div class="flex min-h-0 flex-1 flex-col border-x border-b border-erp-thead-line [&>table]:-mb-px [&>table]:border-x-0">${ui.dataTable(cols, rows)}</div>`
          : ui.fillTable(cols, rows, "출·퇴근 기록이 없습니다.");
        return `<div data-week="${d}" hidden class="flex flex-1 flex-col">${body}</div>`;
      })
      .join("")}</div>`,
  ).replace('<section class="flex min-w-0 flex-col', '<section class="flex min-w-0 flex-1 flex-col'); // 묶음이 본문 남는 높이를 채운다(앱 Section fill)
  // 라벨 앞 색 칸은 근무스케줄 범례와 같은 14px(옅은 바탕 + 같은 계열 테두리), 막대도 같은 계열 진한 색(앱 Rate DOT · BAR, 2026-11-05 사용자 지정, 3팀 확인 필요)
  const RATE = {
    ok: ["bg-erp-on-bg border-erp-on/40", "bg-erp-on"],
    warn: ["bg-[#fff6e5] border-[#e8a33d]/50", "bg-[#e8a33d]"],
    risk: ["bg-erp-off-bg border-erp-off/40", "bg-erp-off"],
  };
  const rate = (label, pct, n, tone) =>
    // 라벨 시작선을 아래 근로시간 표 라벨과 맞추고(들여쓰기 13px) 굵기도 표 라벨과 같은 500, 라벨 98px 이라 막대가 표 값과 같은 세로줄(123px)에서 시작한다(앱 Rate, 2026-11-05 사용자 지정, 3팀 확인 필요)
    `<div class="flex h-[34px] items-center gap-[12px] pl-[13px] text-[14px]"><span class="flex w-[98px] shrink-0 items-center gap-[6px] font-medium text-erp-label"><span aria-hidden="true" class="size-[14px] shrink-0 rounded-[2px] border ${RATE[tone][0]}"></span>${label}</span><span class="w-[200px]">${p.meter(pct, RATE[tone][1])}</span><span>${n}</span></div>`;
  const weekSum = (week, [ok, late, miss], [total, over, night, paid]) => {
    const n = ok + late + miss;
    const pct = (v) => (n ? Math.round((v / n) * 100) : 0);
    return `<div data-week="${week}" hidden class="flex flex-col gap-[12px]"><div class="flex flex-col">${rate("정상 출근", pct(ok), `${ok}회`, "ok")}${rate("지각", pct(late), `${late}회`, "warn")}${rate("미기록", pct(miss), `${miss}회`, "risk")}</div>${ui.detailTable("근로시간", [
      ["총 근로시간", total],
      ["연장 근로", over],
      ["야간 근로", night],
      ["주휴 대상", paid],
    ])}</div>`;
  };
  // 본사 계정의 근태 요약 숫자에서는 본사 제공 동의가 없는 가맹 점포 직원을 뺀다 — 근로계약 목록 상태별 개수와 같은 기준(WHALEERP-133, 2026-10-26 재영).
  const summary = p.section(
    "근태 요약",
    p.weekNav(A, "attend-sums", "2026-08-31", { md: true }),
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
      ["사유", "퇴근 등록 누락 · 점장 확인"],
    ]) +
    histDialog("오세라", [
      ["일시", "2026-08-27 18:05"],
      ["구분", "대신 등록"],
      ["처리한 사람", "정하윤 (BP 마스터)"],
      ["등록한 값", "출근 10:00 · 퇴근 16:00"],
      ["사유", "위치 수집 일시 중지 · 점장 확인"],
    ]);
  // 「이상 없음」은 확인 필요 꼬리표가 붙은 줄에만 — 출근·퇴근 미등록은 보정으로 채운다(운영 정책 ATT-19, 2026-10-26 재영).
  const fixBtns = (ok = true) => `<span class="flex justify-center gap-[6px]">${ui.slideTrigger("보정", fixPanel, "off")}${ok ? p.ask("이상 없음", "off", "이상 없음으로 검토를 마치시겠습니까?", "확인 필요 꼬리표와 사유를 지웁니다.") : ""}</span>`;
  const fixList = p.section(
    "보정이 필요한 기록",
    // 기간 지정 조회는 이 목록에만, 최근 3개월 안에서 고른다(STAFF-31).
    `<span class="flex items-center gap-[6px]">${ui.dateField(A, { label: "기간 시작", value: "2026-08-06" })}<span>~</span>${ui.dateField(A, { label: "기간 끝", value: "2026-09-06" })}${ui.slideTrigger("출퇴근 대신 등록", proxyPanel, "soft")}</span>`,
    ui.fillTable(
      [
        { header: "직원", width: "w-[100px]" },
        { header: "날짜", width: "w-[80px]" },
        { header: "출근", width: "w-[80px]" },
        { header: "퇴근", width: "w-[80px]" },
        { header: "사유", align: "left" },
        { header: "", width: "w-[230px]" },
      ],
      [
        ["서지안", "09-05", "12:58", "-", p.tag("warn", "퇴근 미등록"), fixBtns(false)],
        ["권도윤", "08-21", "-", "21:12", p.tag("warn", "출근 미등록"), fixBtns(false)],
        ["배정숙", "09-02", "08:47", "23:58", p.tag("risk", "반경 밖 퇴근"), fixBtns()],
        ["남주호", "09-01", "09:04", "18:02", p.tag("risk", "위치 조작 감지"), fixBtns()],
        ["한도윤", "08-31", "09:00", "22:30", p.tag("risk", "근무 12시간 초과"), fixBtns()],
        ["문태경", "08-29", "09:02", "18:30", `${p.tag("info", "수정됨")} ${p.sub("08-30 정하윤")}`, x.dialogTrigger("이력", histId.문태경, "off")],
        ["오세라", "08-27", "10:00", "16:00", `${p.tag("info", "대신 등록")} ${p.sub("위치 수집 일시 중지 · 정하윤")}`, x.dialogTrigger("이력", histId.오세라, "off")],
      ],
      // 기간이 늘 걸려 있어 문구는 하나다(앱 attendance-fix-list.tsx)
      "보정이 필요한 출·퇴근 기록이 없습니다.",
    ),
  ).replace('<section class="flex min-w-0 flex-col', '<section class="flex min-w-0 flex-1 flex-col'); // 묶음이 본문 남는 높이를 채운다(앱 Section fill)
  // 첫 줄은 보기 전환(아이콘 + 글자)만, 둘째 줄은 근무지 · 기간 이동 · 동작 버튼(앱 page.tsx ScheduleFrame, 2026-11-05 사용자 지정, 3팀 확인 필요).
  // 데모는 탭마다 둘째 줄을 따로 그린다 — 주간은 ‹ 「2026년 8월 17일 ~ 23일」 › [이번 주], 월간은 ‹ 「2026년 8월」 › [이번 달]([이번 주] · [이번 달] outline).
  // 날짜 선택은 직원 상세와 같은 주 이동(2026-10-02 재영). 데모라 근무표 내용은 주를 바꿔도 그대로다.
  // 확정 단계는 없다 — 저장하면 바로 직원 근무 앱에 반영되고 바뀐 직원에게 알림이 간다(2026-10-08 재영, STAFF-15).
  // 근무지는 점포 하나씩 본다 — 등록은 고른 점포에 한다(2026-10-22 재영).
  const schedTab =
    `<div class="flex flex-col gap-[24px]">` +
    `<div class="flex">${x.segment("근무스케줄 보기", [
      { id: "sched-week", label: "주간 보기", icon: '<path d="M3 6h18M3 12h12M3 18h15"/>' },
      { id: "sched-month", label: "월간 보기", icon: '<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.75h18M8.25 2.25v4.5M15.75 2.25v4.5"/>' },
    ]).replaceAll('class="flex h-[32px] items-center', 'class="[&+&]:border-l [&+&]:border-erp-button-line flex h-[32px] items-center')}</div>` +
    x.tabPanel("sched-week", schedTools(p.weekNav(A, "", "2026-08-17", { range: true }) + ui.button("이번 주", { variant: "outline" })) + schedWeekView, true).replace('class="flex flex-col gap-[12px]"', 'class="flex flex-col gap-[24px]"') +
    x.tabPanel("sched-month", schedMonthView) +
    `<div class="flex flex-col gap-[24px]">${schedLog}</div>` +
    `</div>` +
    copyDialog;
  // 출퇴근 현황 필터 (STAFF-31, 2026-10-08 재영). 근태 요약에는 점포·고용형태·재직 상태만 걸린다. 유지하지 않는다.
  const attendFilter = ui.filterPanel(A, [
    storeFilter(),
    ui.filterSection("직원", ui.searchField(A, { placeholder: "이름 또는 번호" }), { tight: true }),
    ui.filterSection("고용형태", ui.checkbox(A, "정직원", true) + ui.checkbox(A, "파트타이머", true)),
    ui.filterSection("출퇴근 상태", ["정상", "지각", "미출근", "출근 미등록", "퇴근 미등록", "휴무"].map((t) => ui.checkbox(A, t, true)).join("")),
    // 확인 필요 사유는 넷 — 위치 오차 초과는 2026-10-20 에 없앴고 근무 12시간 초과는 2026-10-27 에 더했다(운영 정책 ATT-19).
    ui.filterSection("확인 필요 사유", ["반경 밖 출근", "반경 밖 퇴근", "위치 조작 감지", "근무 12시간 초과"].map((t) => ui.checkbox(A, t, true)).join("")),
    ui.filterSection("기록 구분", ["직원 등록", "대신 등록", "보정됨"].map((t) => ui.checkbox(A, t, true)).join("")),
    ui.filterSection("재직 상태", ui.select(["재직", "퇴직", "전체"], { "aria-label": "재직 상태" }), { tight: true, last: true }),
  ]);
  // 두 칸 사이 36px — 24px 는 왼쪽 표 끝과 「근태 요약」이 붙어 보였다. 두 칸 높이를 같게(stretch) 해 일별 표 틀이 근태 요약 아래 끝까지 늘어난다(앱 page.tsx, 2026-11-05 사용자 지정, 3팀 확인 필요)
  const attendTab = `<div class="flex flex-1 flex-col gap-[24px]"><div class="grid grid-cols-2 items-stretch gap-[36px]">${today}${summary}</div>${fixList}</div>${histDialogs}`;

  // ── 급여명세서 ──
  const PD = L("staff/payrolls-detail.html");
  // 급여명세서 관리는 달 단위로 넘겨 본다(2026-10-02 재영): ‹ 2026년 8월 › · 달 선택. 데모 데이터는 8월·7월, 나머지 달은 빈 목록.
  // 검토 대기 목록은 두지 않는다 — 사유는 명세서 상세에서만 보인다(STAFF-32, 2026-10-12 재영).
  // 검토 대기는 상태가 아니라 분류다 — 상태는 작성 중 그대로, 목록에는 「검토 대기」 배지와 필터(운영 정책 PAY-01·06, 2026-10-26 재영).
  const payRow = (name, store, h, base, extra, ded, net, st) => [ui.link(name, PD), store, h, base, extra, ded, `<b class="font-semibold">${net}</b>`, st];
  // 비면 열 이름 줄을 두고 빈 칸이 남는 높이를 채운다 — 거른 결과는 「조건에 맞는 급여명세서가 없습니다.」, 그달 명세서가 없으면 「이 달의 급여명세서가 없습니다.」(앱 payslip-table.tsx)
  const payList = (rows) =>
    numberedList(
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
        rows.length ? "조건에 맞는 급여명세서가 없습니다." : "이 달의 급여명세서가 없습니다.",
      ) + (rows.length ? pageNav(4) : "");
  // 총 건수 · 상태별 건수 · 검토 대기를 한 줄로, 버튼 · 건수 고르기는 오른쪽 — 모든 칸을 줄 가운데에 맞춘다(앱 page.tsx, 2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 상태 건수 줄과
  // 「총 N 건」 줄이 따로 있었다). 검토 대기는 상태가 아니라 분류라 세로선 뒤 꼬리표로 뗀다(운영 정책 v221 PAY-06)
  const vline = `<span aria-hidden="true" class="h-[11px] w-px bg-[#d9d9d9]"></span>`;
  const counts = ([a, b, c, d], review, right) =>
    `<div class="flex flex-wrap items-center gap-x-[12px] gap-y-[6px] text-[14px]"><p class="text-erp-ink">총 <b class="font-semibold">${(a + b + c + d).toLocaleString("ko-KR")}</b> 건</p>${vline}<p class="flex items-center text-erp-label">${[["작성 중", a], ["검토 중", b], ["확정", c], ["발송 완료", d]]
      .map(([l, n], i) => `<span class="flex items-center">${i ? '<span class="mx-[6px] text-erp-muted">·</span>' : ""}${l}<b class="ml-[4px] font-semibold text-erp-ink">${n}</b></span>`)
      .join("")}</p>${vline}${p.tag("quiet", `검토 대기 ${review}`)}<div class="ml-auto flex items-center gap-[6px]">${right}</div></div>`;
  // 목록 오른쪽 위 버튼: 「급여명세서 작성」은 어느 달이든 늘 보인다(2026-10-02 재영). 누르면 점포·직원을 고르는 팝업이 뜨고, 고른 직원으로 작성하면 데모라 명세서 화면으로 간다.
  // 근로계약이 없거나 이 달 명세서가 이미 있는 직원은 고를 수 없다(WHALEERP-226). 점포 · 이름으로 좁히기와 「작성」 켜기는 PICK_SCRIPT.
  const pickId = x.dialogId();
  const pickRow = (name, store, type, contract, slip) => {
    const ok = contract === "유효" && slip === "미작성";
    const pick = `<input type="radio" name="${pickId}-staff" aria-label="${name} 선택"${ok ? "" : " disabled"} class="size-[18px] accent-erp-brand disabled:opacity-30">`;
    return [pick, name, store, type, contract === "유효" ? contract : p.tag("risk", contract), slip === "미작성" ? slip : p.tag("quiet", slip)];
  };
  const pickRows = [
    pickRow("유하람", "모리커피 서초점", "정직원", "유효", "미작성"),
    pickRow("하준서", "모리커피 서초점", "파트타이머", "유효", "미작성"),
    pickRow("서지안", "모리커피 서초점", "정직원", "유효", "작성됨"),
    pickRow("오세라", "모리커피 서초점", "정직원", "유효", "작성됨"),
    pickRow("최다온", "온기식당 판교점", "파트타이머", "유효", "미작성"),
    pickRow("문태경", "온기식당 판교점", "정직원", "유효", "작성됨"),
    pickRow("남도현", "모리커피 성수점", "정직원", "계약 없음", "미작성"),
  ];
  const pickBody =
    // 안내는 제목과 한 묶음(6px), 입력칸과는 18px 뗀다 — 「이 달」은 「이번 달」로 읽혀 뺐다(앱, 2026-11-05 사용자 지정, 3팀 확인 필요)
    `<p class="-mt-[6px] text-[13px] text-erp-label">근로계약을 맺은 직원 중 급여명세서가 작성되지 않은 직원만 선택할 수 있습니다.</p>` +
    `<div data-staff-pick class="mt-[18px] flex flex-col gap-[12px]">` +
    ui.formRow(
      ui.field("점포", ui.select(["전체 점포", ...new Set(pickRows.map((r) => r[2]))], { "data-pick-store": true, "aria-label": "점포" }), "w-[220px]"),
      ui.field("직원", ui.searchField(A, { placeholder: "이름" }).replace("<input ", "<input data-pick-name ")),
    ) +
    `<div class="max-h-[322px] overflow-y-auto">${ui.dataTable(
      [{ header: "선택", width: "w-[60px]" }, { header: "직원" }, { header: "점포" }, { header: "계약 유형" }, { header: "근로계약" }, { header: "명세서" }],
      pickRows,
    )}<p data-pick-none hidden class="py-[24px] text-center text-erp-muted">조건에 맞는 직원이 없습니다.</p></div>` +
    `</div>`;
  const pickDialog =
    x.dialog(
      pickId,
      // 달 꼬리표 — 어느 달 명세서인지가 이 팝업의 핵심이라 포인트 꼬리표(연파랑 바탕 · 파랑 16px 600 · 28px · 알약형)로 보인다(앱 payslip-draft-dialog.tsx, 2026-11-05 사용자 지정, 3팀 확인 필요)
      `급여명세서 작성<span class="ml-[10px] inline-flex h-[28px] items-center rounded-full bg-erp-point-bg px-[12px] align-middle text-[16px] font-semibold text-erp-point">2026년 8월</span>`,
      pickBody,
      ui.button("취소", { variant: "off", "data-close": true }) + ui.button("작성", { href: PD, "data-pick-ok": true, "aria-disabled": "true", style: "opacity:.4;pointer-events:none" }),
      "w-[720px]",
    ) + PICK_SCRIPT;
  const payButtons = (n) =>
    x.dialogTrigger("급여명세서 작성", pickId, "soft") +
    (n ? p.ask(`확정 ${n}건 발송`, "primary", `확정한 급여명세서 ${n}건을 발송하시겠습니까?`, "직원 근무 앱으로 보냅니다.", "발송") : "") +
    `<div class="w-[80px] shrink-0">${ui.select(["20", "50", "100"], { "aria-label": "페이지당 건수" })}</div>`;
  const month = (key, body) => `<div data-week="${key}" hidden class="flex flex-1 flex-col gap-[12px]">${body}</div>`;
  const sent = p.tag("ok", "발송 완료");
  const months =
    month(
      "2026-08-01",
      counts([60, 0, 3, 0], 2, payButtons(3)) +
        payList([
          payRow("오세라", "모리커피 서초점", "180.0", "3,420,000", "184,000", "-", "3,604,000", p.tag("quiet", "작성 중")),
          payRow("서지안", "모리커피 서초점", "168.0", "2,840,000", "186,000", "-", "3,026,000", `${p.tag("quiet", "작성 중")} ${p.tag("warn", "검토 대기")}`),
          payRow("문태경", "온기식당 판교점", "184.0", "3,680,000", "276,000", "-", "3,956,000", p.tag("quiet", "작성 중")),
          payRow("배정숙", "온기식당 판교점", "96.0", "1,113,600", "92,800", "-", "1,206,400", p.tag("quiet", "작성 중")),
          payRow("권도윤", "모리커피 서초점", "176.0", "1,971,200", "164,800", "-", "2,136,000", `${p.tag("quiet", "작성 중")} ${p.tag("warn", "검토 대기")}`),
          ["남도현", "모리커피 성수점", "-", "-", "-", "-", "-", p.tag("risk", "계약 없음 · 초안 없음")],
        ]),
    ) +
    month(
      "2026-07-01",
      counts([0, 0, 0, 61], 0, payButtons(0)) +
        payList([
          payRow("오세라", "모리커피 서초점", "176.0", "3,420,000", "142,000", "241,800", "3,320,200", sent),
          payRow("서지안", "모리커피 서초점", "168.0", "2,840,000", "142,000", "241,800", "2,740,200", sent),
          payRow("문태경", "온기식당 판교점", "180.0", "3,680,000", "232,000", "268,400", "3,643,600", sent),
          payRow("배정숙", "온기식당 판교점", "92.0", "1,067,200", "88,000", "37,920", "1,117,280", sent),
          payRow("권도윤", "모리커피 서초점", "172.0", "1,926,400", "158,000", "68,780", "2,015,620", sent),
        ]),
    ) +
    month("", counts([0, 0, 0, 0], 0, payButtons(0)) + payList([]));
  // 급여명세서 관리: 왼쪽 필터(점포 · 직원 · 명세서 상태) + 달 이동 · 상태 건수 · 명세서 목록. 「급여 월」 선택칸은 달 이동으로 옮겼다.
  const payslipsFilter = ui.filterPanel(A, [
    storeFilter(),
    ui.filterSection("직원", ui.searchField(A, { placeholder: "이름" }), { tight: true }),
    ui.filterSection("명세서 상태", ["작성 중", "검토 중", "확정", "발송 완료"].map((t) => ui.checkbox(A, t, true)).join("")),
    ui.filterSection("분류", ui.checkbox(A, "검토 대기만", false), { last: true }),
  ]);
  // 직원 고르기 팝업은 달 묶음(hidden) 밖에 한 번만 둔다 — 숨긴 묶음 안의 dialog 는 열어도 보이지 않는다.
  const payrollTab = `<div class="flex flex-1 flex-col gap-[12px]">${p.weekNav(A, "pay-months", "2026-08-01", { month: true })}<div id="pay-months" class="flex flex-1 flex-col">${months}</div></div>${pickDialog}`;

  // ── TO-DO ──
  // TO-DO 리스트 관리: 왼쪽 필터(점포 · 담당 · 상태) + 목록. 근무지 체크는 점포 칸으로 바꿨다(2026-10-02 재영).
  const todosFilter = ui.filterPanel(A, [
    storeFilter(),
    ui.filterSection("담당", ui.searchField(A, { placeholder: "이름" }), { tight: true }),
    ui.filterSection("상태", ["대기", "진행 중", "완료"].map((t) => ui.checkbox(A, t, true)).join(""), { last: true }),
  ]);
  // 대기 중인 TO-DO 는 「수정」으로 고친다(2026-10-02 재영). 수정도 등록처럼 별도 화면이다 — 데모는 한 건(todos-edit.html)으로 보인다(앱 /todos/{id}/edit, 2026-11-06 사용자 지정)
  // 세 줄 모두 같은 수정 화면(todos-edit.html)으로 간다
  const editBtn = () => ui.button("수정", { variant: "off", href: link(R, "staff/todos-edit.html") });
  const todoTab =
    // TO-DO 등록은 패널이 아니라 별도 화면이다(앱 src/app/todos/new, 2026-11-06 사용자 지정)
    ui.listToolbar(12, ui.button("TO-DO 등록", { href: link(R, "staff/todos-new.html") })) +
    numberedList(
      [
        { header: "담당직원", width: "w-[240px]" }, // 앱 todo-table.tsx — 열 이름 2026-11-05 사용자 지정(3팀 확인 필요, 전엔 「담당」), 폭 240px 2026-11-06 사용자 지정
        { header: "근무지", width: "w-[240px]" }, // 앱 todo-table.tsx — 담당직원과 같은 폭(2026-11-06 사용자 지정)
        { header: "TO-DO", align: "left" },
        { header: "수행 예정", width: "w-[140px]" },
        { header: "상태", width: "w-[160px]" },
        { header: "", width: "w-[100px]" },
      ],
      [
        ["전체 · 각자", "모리커피 서초점", `본사 위생점검 대비 냉장고 정리 ${p.tag("risk", "긴급")}`, "2026-09-03", p.tag("warn", "진행 중"), ""],
        ["전체 · 한 명", "모리커피 서초점", "가을 신메뉴 POP 교체", "2026-09-04 10:00", p.tag("quiet", "대기"), editBtn()],
        ["서지안", "모리커피 서초점", "신규 원두 시음 기록 제출", "2026-09-05", p.tag("quiet", "대기"), editBtn()],
        ["오세라", "모리커피 서초점", "분기 재물조사 입회", "2026-09-08 14:00", p.tag("quiet", "대기"), editBtn()],
        ["전체 · 한 명", "온기식당 판교점", "여름 프로모션 POP 철거", "2026-08-25", `${p.tag("ok", "완료")} ${p.sub("문태경")}`, ""],
        ["권도윤", "모리커피 서초점", "신메뉴 시식 교육 참석", "2026-08-28 14:00", p.tag("ok", "완료"), ""],
      ],
      "조건에 맞는 TO-DO 가 없습니다.",
      12,
    ) +
    pageNav(2);

  // ── 슬라이드 패널 ──
  const panelHead = (title, right = "") => `<div class="flex items-center gap-[6px]"><h2 class="flex-1 text-[18px] font-semibold text-erp-ink">${title}</h2>${right}</div>`;
  const delId = x.dialogId();
  // 여러 명 일괄(STAFF-27, 2026-10-08 재영): 근무지 재직자 체크 목록 → 고른 직원마다 줄. 줄은 그 직원의 계약 근무시간으로 채우고 줄마다 고친다.
  // 체크 목록에는 근무일에 체결 완료 계약이 있는 직원만 나온다(STAFF-29). 데모는 서지안·오세라를 고른 장면 하나다.
  // 직원마다 상자 — 회색 머리 줄(42px)에 이름과 [근로계약 시간적용](26px · 13px outline 모양), 아래 시작시간 · 종료시간 · 휴게시간
  // (앱 schedule-form.tsx, 2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 이름 줄 + 아래 선, off 34px 「계약 값으로 되돌리기」). 1명도 같은 상자다.
  const contractTimeBtn = `<button type="button" class="h-[26px] shrink-0 rounded-[2px] border border-erp-brand bg-white px-[10px] text-[13px] font-medium whitespace-nowrap text-erp-ink transition-colors duration-150 ease-out hover:bg-erp-subtle">근로계약 시간적용</button>`;
  const shiftBox = (name, c) =>
    `<div class="flex flex-col overflow-hidden rounded-[2px] border border-erp-panel-line"><div class="flex h-[42px] items-center gap-[6px] border-b border-erp-thead-line bg-erp-thead-bg pr-[8px] pl-[12px]"><p class="flex-1 truncate text-[14px] font-semibold text-erp-ink">${name}</p>${contractTimeBtn}</div><div class="flex flex-col gap-[8px] p-[12px]">` +
    ui.formRow(ui.field(req("시작시간"), p.timeField(c[0], "시작시간")), ui.field(req("종료시간"), p.timeField(c[1], "종료시간")), ui.field("휴게시간", ui.textField({ value: c[2] }))) +
    `</div></div>`;
  // 여러 명: 체크 목록에는 근무일에 체결 완료 계약이 있는 직원만(STAFF-29). 데모는 서지안 · 오세라를 고른 장면 하나다.
  const bulkPane =
    `<div class="flex flex-col gap-[18px]" data-when="sched-mode:여러 명">` +
    `<div class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">${req("직원")}</span><div class="flex flex-wrap gap-x-[18px] gap-y-[8px]">${ui.checkbox(A, "서지안 · 바리스타", true)}${ui.checkbox(A, "오세라 · 점장", true)}</div></div>` +
    shiftBox("서지안", ["09:00", "16:00", "60분"]) +
    shiftBox("오세라", ["09:00", "18:00", "60분"]) +
    `</div>`;
  // 묶음 「근무스케줄 정보」 — 등록 인원(1명 · 여러 명) → 근무일 → 직원 → 시간, 묶음 사이 24(앱 schedule-form.tsx, 2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 묶음 「근무」, 라디오가 제목 위).
  // 근무지는 목록에서 고른 점포라 패널에 두지 않는다. 여러 명도 근무일은 하루 하나(주 단위는 지난 주 복사, STAFF-27).
  // 시작 · 종료 · 휴게는 계약 값으로 미리 채운다(STAFF-14). 직원 선택지는 근무일에 체결 완료 계약이 있는 직원만이다(STAFF-29) — 권도윤은 재계약 서명 대기라 빠졌다.
  // 버튼 줄은 가운데 [취소] [삭제](soft, 수정으로 열 때만 — 데모는 1명일 때 보인다) [저장], 1명 · 여러 명 모두 「저장」(전엔 삭제 왼쪽 끝 · 「2명 등록」).
  const schedForm = ui.slidePanel(
    schedPanel,
    "근무스케줄 등록·수정",
    panelHead("근무스케줄 등록·수정") +
      ui.formGroup(
        "근무스케줄 정보",
        `<div class="flex flex-col gap-[24px]">` +
          `<div class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">${req("등록 인원")}</span>${p.radios("sched-mode", ["1명", "여러 명"])}</div>` +
          ui.field(req("근무일"), ui.dateField(A, { label: "근무일", value: "2026-09-08" })) +
          `<div class="flex flex-col gap-[18px]" data-when="sched-mode:1명">` +
          ui.field(req("직원"), ui.select(["선택", "서지안 · 바리스타", "오세라 · 점장"], { value: "서지안 · 바리스타" })) +
          shiftBox("서지안", ["09:00", "16:00", "60분"]) +
          `</div>` +
          bulkPane +
          `</div>`,
      ) +
      // 직원 칸 아래 회색 줄 대신 안내 박스(앱 GuideBand 「근무스케줄 등록 안내」, 수정이면 「근무스케줄 수정 안내」)
      p.guideBand("근무스케줄 등록 안내", [
        "직원 목록에는 선택한 근무일에 <u>근로계약이 체결 완료</u>된 직원 중 <u>직원 근무 앱에 가입</u>한 직원만 표시됩니다.",
        "퇴직일이 정해진 직원은 퇴직일까지만 근무스케줄을 등록할 수 있습니다.",
        "여러 명을 등록할 때 일부가 실패하면, 성공한 직원은 등록되고 실패한 직원만 사유와 함께 남습니다.",
        "관리자가 근무스케줄을 저장하면 해당 <u>직원의 근무 앱</u>과 <u>이메일</u>로 알림이 발송됩니다.",
        "직원이 근무 앱에서 근무스케줄 알림을 끄면 알림은 근무 앱 알림함에만 표시됩니다.",
      ]) +
      `<div class="flex justify-center gap-[6px]">${offBtn("취소", { "data-close": true })}<span data-when="sched-mode:1명">${x.dialogTrigger("삭제", delId, "soft")}</span>${ui.button("저장", { "data-close": true })}</div>`,
  );
  const delDialog = x.dialog(
    delId,
    "근무스케줄을 삭제하시겠습니까?", // 앱 schedule-form.tsx 와 같은 제목 · 기본 버튼(2026-11-06 사용자 지정)
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
        p.fieldH("수정 사유", ui.textarea({ rows: 2, value: "퇴근 등록 누락 · 근무스케줄 종료 시각으로 보정. 점장 구두 확인." }), ""),
      ) +
      // 안내는 묶음 상자 밖 안내 박스, 버튼은 가운데 [취소] [저장](앱 attendance-fix-list.tsx FixForm, 2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 「보정 저장」, 사유 4줄)
      p.guideBand("보정 안내", [
        "최근 3개월 이내의 기록만 보정할 수 있으며, 미래 시각은 등록할 수 없습니다.",
        "관리자가 보정한 기록은 직원 근무 앱에 연필 아이콘으로 표시됩니다.",
        "보정한 기록의 확인 필요 표시와 사유는 삭제됩니다.",
        "퇴근 시각이 출근 시각과 같거나 이전인 경우, 다음 날 퇴근한 것으로 처리됩니다.",
        "그 외에 다음 날 퇴근한 경우, 관리자가 「다음 날 퇴근」을 체크합니다.",
      ]) +
      ui.panelButtons("취소", "저장"),
  );
  // 출퇴근 대신 등록(운영 정책 ATT-20): 직원 · 날짜 · 출근 · 퇴근 · 사유(필수). 직원 근무 앱에는 연필 표시로 보인다.
  // 그 날짜에 체결 완료 계약이 없는 직원은 선택지에서 뺀다(STAFF-29) — 09-06의 권도윤은 재계약 서명 대기라 빠졌다.
  // 위치정보에 동의한 직원은 여기서 고르지 않는다. 그날 출근 · 퇴근이 둘 다 없으면 「보정」으로 두 시각을 넣는다 — 조건은 대신 등록과 같다(최근 3개월 · 사유 필수 · 그날 체결 완료 계약, 2026-10-26 재영).
  // 보정으로 채운 줄은 「수정됨」 하나로만 보이고 「대신 등록」으로 같이 보이지 않는다.
  const proxyForm = ui.slidePanel(
    proxyPanel,
    "출퇴근 대신 등록",
    panelHead("출퇴근 대신 등록") +
      ui.formGroup(
        "출퇴근 기록",
        // 직원 칸은 한 줄 전체 폭(「이름 · 점포 (보정)」이 넘치지 않게), 날짜는 그 아래 줄. 선택지 첫 줄 「선택」(앱 ProxyForm, 2026-11-05 사용자 지정, 3팀 확인 필요)
        p.fieldH(req("직원"), ui.select(["선택", "오세라", "서지안", "배정숙", "유하람"]), ""),
        p.fieldH(req("날짜"), ui.dateField(A, { label: "날짜", value: "2026-09-06" }), ""),
        ui.formRow(p.fieldH(req("출근"), p.timeField("09:00", "출근"), ""), p.fieldH("퇴근", p.timeField("", "퇴근"), "")),
        p.fieldH(req("사유"), ui.textarea({ rows: 2, placeholder: "예: 위치 수집 일시 중지 · 점장 확인" }), ""),
      ) +
      p.guideBand("대신 등록 안내", [
        "위치정보 수집에 동의하지 않았거나 수집을 중지한 직원의 출·퇴근 기록은 관리자가 대신 등록합니다.",
        "최근 3개월 이내의 기록만 등록할 수 있으며, 미래 시각은 등록할 수 없습니다.",
        "관리자가 대신 등록한 기록은 직원 근무 앱에 연필 아이콘으로 표시됩니다.",
        "퇴근 시각이 출근 시각과 같거나 이전인 경우, 다음 날 퇴근한 것으로 처리됩니다.",
      ]) +
      ui.panelButtons("취소", "저장"),
  );
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

  return { L, N, holdPanel, holdForm, proxyForm, listFilter, attendFilter, contractsFilter, payslipsFilter, todosFilter, listTab, contractsTab, schedTab, attendTab, payrollTab, todoTab, schedForm, delDialog, fixForm };
}
