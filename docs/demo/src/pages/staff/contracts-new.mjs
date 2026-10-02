// 근로계약서 초안 작성. 목업 docs/mockup/staff/contracts-new.html 의 기본 상태(정직원 · 전자계약 · 남도현)를 BP 마스터로 본 것.
// 목업의 고용 형태·계약 방식 전환 버튼은 라디오로 그렸고, 종이 계약을 골랐을 때의 칸은 기본 상태가 아니라 넣지 않았다.
import * as ui from "../../ui.mjs";
import * as p from "../../staff-parts.mjs";
import { req, group } from "../../biz-form.mjs";
import { erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const L = (path) => link(R, path);
  const choice = (label, name, options) =>
    `<div class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">${label}</span>${p.radios(name, options)}</div>`;

  const hours = ui.dataTable(
    [{ header: "요일", width: "w-[70px]" }, { header: "시업" }, { header: "종업" }, { header: "휴게 시작" }, { header: "휴게 종료" }],
    [
      ...["월", "화", "수", "목", "금"].map((d) => [d, "09:00", "18:00", "12:00", "13:00"]),
      ...["토", "일"].map((d) => [d, "-", "-", "-", "-"]),
    ],
  );

  // 근무 일정 입력(2026-10-02 재영): 근무시간·휴게시간(시 00~23, 분 00·30 선택)과 근무요일(월~일 눌러 켜고 끄기).
  // 고르면 아래 소정근로시간 표와 주 시간이 따라 바뀐다(erp.js initWorkPlan).
  const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const pick = (k, v, opts, label) => `<span class="w-[72px]">${ui.select(opts, { value: v, "aria-label": label, "data-k": k })}</span>`;
  const span = (k, [sh, sm, eh, em], what) =>
    `<span class="flex items-center gap-[8px] text-[14px] text-erp-ink">${pick(`${k}-sh`, sh, HOURS, `${what} 시작 시`)}시${pick(`${k}-sm`, sm, ["00", "30"], `${what} 시작 분`)}분 ~${pick(`${k}-eh`, eh, HOURS, `${what} 끝 시`)}시${pick(`${k}-em`, em, ["00", "30"], `${what} 끝 분`)}분</span>`;
  const dayChip = (d, on) =>
    `<button type="button" aria-pressed="${on}" class="grid size-[34px] place-items-center rounded-[2px] border border-erp-field-line bg-white text-[14px] text-erp-label transition-colors duration-150 ease-out aria-pressed:border-erp-brand-soft aria-pressed:bg-erp-brand-soft aria-pressed:text-white">${d}</button>`;
  // 칸 배치는 이 폼의 다른 항목과 같게(라벨 위 · 입력 아래, 구분선 없음).
  // 근무요일은 월급·시급 옆(2026-10-02 재영). data-workplan 은 그 줄과 근무시간 줄을 함께 감싼다.
  const workDays = group("근무요일", `<span class="flex gap-[6px]">${["월", "화", "수", "목", "금", "토", "일"].map((d, i) => dayChip(d, i < 5)).join("")}</span>`);
  const workTimes = ui.formRow(group("근무시간", span("work", ["09", "00", "18", "00"], "근무시간")), group("휴게시간", span("rest", ["12", "00", "13", "00"], "휴게시간")));

  const form =
    ui.formGroup(
      "직원 정보",
      // 직원 정보는 모두 필수(2026-10-02 재영). 표시는 1팀 폼과 같은 「라벨 *」.
      ui.formRow(
        p.fieldH(req("이름"), ui.textField({ value: "남도현" }), ""),
        p.fieldH(req("휴대전화번호"), ui.textField({ value: "010-9014-5563", inputmode: "tel" }), "초대 발송과 가입 연결의 기준값"),
      ),
      ui.formRow(
        p.fieldH(req("생년월일"), ui.dateField(A, { label: "생년월일", value: "1998-07-12" }), ""),
        p.fieldH(req("소속 근무지"), ui.select(["모리커피 성수점", "모리커피 서초점", "온기식당 판교점"]), ""),
        p.fieldH(req("직무"), ui.textField({ value: "바리스타" }), ""),
      ),
    ) +
    ui.formGroup(
      "계약 방식",
      choice("고용 형태", "employment", ["정직원", "파트타이머"]),
      choice("계약 방식", "method", ["전자계약", "종이 계약"]),
      // 종이 계약이면 날인한 근로계약서·임금계약서를 첨부한다(2026-10-02 재영). 목업은 날인본 파일 한 칸.
      `<div data-when="method:종이 계약" class="flex w-full gap-[6px]">${p.fieldH(req("근로계약서"), p.fileField("근로계약서"), "당사자가 모두 날인한 파일")}${p.fieldH("임금계약서", p.fileField("임금계약서"), "따로 작성한 경우")}</div>`,
    ) +
    ui.formGroup(
      "계약 조건",
      ui.formRow(
        p.fieldH(req("계약 시작일"), ui.dateField(A, { label: "계약 시작일", value: "2026-09-14" }), ""),
        p.fieldH("계약 종료일", ui.dateField(A, { label: "계약 종료일" }), "비워 두면 기간의 정함이 없는 계약"),
      ),
      `<div data-workplan class="flex flex-col gap-[18px]">` +
      ui.formRow(
        // 고용 형태에 따라 월급(정직원)·시급(파트타이머) 중 하나가 보인다(목업과 같은 값, erp.js initWhen). 둘 다 필수(2026-10-02 재영).
        p.fieldH(req("월급"), ui.textField({ value: "2,400,000", inputmode: "numeric" }), "월 소정근로시간 기준 최저임금 이상").replace("<div ", '<div data-when="employment:정직원" '),
        p.fieldH(req("시급"), ui.textField({ value: "11,200", inputmode: "numeric" }), "2026년 최저임금 10,320원 이상").replace("<div ", '<div data-when="employment:파트타이머" '),
        workDays,
      ).replace('class="flex w-full gap-[6px]"', 'class="flex w-full items-start gap-[6px]"') +
        workTimes +
        `</div>`,
      `<div class="flex flex-col gap-[8px]"><div class="flex items-center"><span class="flex-1 text-[14px] font-medium text-erp-label">소정근로시간</span><span class="text-[14px] text-erp-label">주 <b data-hours-sum class="font-semibold text-erp-ink">40.0</b> 시간</span></div>${hours.replace("<table ", "<table data-hours ")}</div>`,
      ui.formRow(
        p.fieldH(
          "임금지급일",
          `<span class="flex gap-[6px]">${p.w("w-[100px]", ui.select(["익월", "당월"], { "aria-label": "임금지급 월" }))}${ui.textField({ value: "10", "aria-label": "임금지급일 날짜", inputmode: "numeric" })}</span>`,
          "",
        ),
        p.fieldH("근무 장소", ui.textField({ value: "서울 성동구 연무장길 18, 1층" }), ""),
      ),
    ) +
    ui.formGroup(
      "4대보험 가입 여부",
      // 가입 판단이 같은 둘씩 한 묶음(건강보험·국민연금 / 고용보험·산재보험), 처음엔 모두 풀린 상태(2026-10-02 재영).
      `<div class="flex gap-[24px]">${["건강보험 · 국민연금", "고용보험 · 산재보험"].map((n) => ui.checkbox(A, n, false)).join("")}</div>`,
    ) +
    p.band("만 19세 미만 직원은 등록할 수 없습니다", {
      desc: "근로계약·출퇴근·급여는 점포에서 따로 관리해 주세요. 계약 시작일 기준으로 따지며, 만 19세 미만이면 저장이 막히고 초대도 나가지 않습니다.",
    }) +
    p.bar(
      "",
      ui.button("초안 저장하고 발송", { href: L("staff/contracts.html"), "data-when": "method:전자계약" }) +
        ui.button("날인본 등록하고 체결 완료", { href: L("staff/contracts.html"), "data-when": "method:종이 계약" }),
    );


  const head = ui.sectionHead(
    `근로계약서 <span class="pl-[6px] text-[14px] font-normal text-erp-label">모리커피 성수점</span>`,
    ui.button("취소", { variant: "off", href: L("staff/contracts.html") }) + p.ask("임시저장", "soft", "작성 중인 초안을 임시저장하시겠습니까?", "초대와 계약서는 보내지 않습니다.") + ui.button("초안 저장", { href: L("staff/contracts.html") }),
  );
  const body = ui.detailBody(`<div class="flex flex-col gap-[12px]">${head}${`<div class="flex flex-col gap-[24px]">${form}</div>`}</div>`);
  return { title: "근로계약서 초안 작성", html: ui.erpFrame({ header: erpHeader(A, R), title: "근로계약서 초안 작성", body }) };
};
