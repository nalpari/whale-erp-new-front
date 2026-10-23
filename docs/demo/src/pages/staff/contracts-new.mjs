// 근로계약서 초안 작성. 목업 docs/mockup/staff/contracts-new.html 의 기본 상태(정직원 · 전자계약 · 남도현)를 BP 마스터로 본 것.
// 목업의 고용 형태·계약 방식 전환 버튼은 라디오로 그렸고, 종이 계약을 골랐을 때의 칸은 기본 상태가 아니라 넣지 않았다.
// 임시저장 이어 쓰기(contracts-draft.mjs)도 이 틀을 쓴다 — 목록에서 임시저장 행을 누르면 바로 온다(2026-10-13, 운영 정책 CTR-19).
import * as ui from "../../ui.mjs";
import * as p from "../../staff-parts.mjs";
import { req, group } from "../../biz-form.mjs";
import { erpHeader, link } from "../../site.mjs";

// d: 이어 쓰기면 { name, phone } — 직원 칸 값과 제목 줄 「삭제」(확인 뒤 행 삭제)만 바뀐다.
export const contractForm = (d) => ({ A, R }) => {
  const L = (path) => link(R, path);
  const choice = (label, name, options) =>
    `<div class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">${label}</span>${p.radios(name, options)}</div>`;

  // 소정근로시간 표는 고용 형태별로 다르다(front #15). 정직원은 요일 · 시업 · 종업 · 휴게 다섯 칸, 파트타이머는 같은 표에
  // 근무시간 · 시급 · 소계 열과 소계 · 주휴수당 · 주급 · 월급여 줄을 붙인다. 값은 erp.js initWorkPlan 이 근무시간 · 시급으로 다시 셈한다.
  const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
  const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const WAGE = 11200;
  const won = (n) => n.toLocaleString("ko-KR");
  const day = (d, i) => (i < 5 ? [d, "09:00", "18:00", "12:00", "13:00"] : [d, "-", "-", "-", "-"]);
  const hoursFull = ui.dataTable(
    [{ header: "요일", width: "w-[70px]" }, { header: "시업" }, { header: "종업" }, { header: "휴게 시작" }, { header: "휴게 종료" }],
    DAYS.map(day),
  );
  // 파트타이머 견본: 월~금 하루 8시간 · 시급 11,200 → 주 40시간 448,000 · 주휴 8시간(주 시간 ÷ 5) 89,600 · 주급 537,600 · 월급여 주급 × 4.345
  const b = (v) => `<b>${v}</b>`;
  const weekPay = 40 * WAGE, holidayPay = 8 * WAGE, weekly = weekPay + holidayPay, monthlyPart = Math.round(weekly * 4.345);
  // 파트타이머는 요일마다 시업 · 종업 · 휴게를 고친다(2026-10-14). 칸은 위 근무시간과 같은 시 · 분 선택 상자이고, 근무하지 않는 요일은 「-」.
  const timePick = (d, what, v) =>
    `<span class="w-[72px]">${ui.select(HOURS, { value: v.slice(0, 2), "aria-label": `${d} ${what} 시`, "data-h": "" })}</span>시` +
    `<span class="w-[72px]">${ui.select(["00", "30"], { value: v.slice(3), "aria-label": `${d} ${what} 분`, "data-m": "" })}</span>분`;
  const timeIn = (d, what, v) =>
    `<span data-t class="flex items-center justify-center gap-[6px] text-[14px] text-erp-ink">${v === "-" ? "-" : timePick(d, what, v)}</span>`;
  const dayTimes = (d, i) => {
    const [, ...t] = day(d, i);
    return [d, ...t.map((v, k) => timeIn(d, ["시업", "종업", "휴게 시작", "휴게 종료"][k], v))];
  };
  const hoursPart = ui.dataTable(
    [
      { header: "요일", width: "w-[90px]" },
      { header: "시업" }, { header: "종업" }, { header: "휴게 시작" }, { header: "휴게 종료" },
      { header: "근무시간" }, { header: "시급" }, { header: "소계" },
    ],
    [
      ...DAYS.map((d, i) => [...dayTimes(d, i), i < 5 ? "8" : "", won(WAGE), i < 5 ? won(8 * WAGE) : "-"]),
      ["소계", "", "", "", "", b("40"), "", b(won(weekPay))],
      ["주휴수당", "", "", "", "", "8", "", won(holidayPay)],
      ["주급", "", "", "", "", "", "", b(won(weekly))],
      ["월급여", "", "", "", "", "", "", b(won(monthlyPart))],
    ],
  );
  const hoursHead = `<div class="flex items-center"><span class="flex-1 text-[14px] font-medium text-erp-label">소정근로시간</span><span class="text-[14px] text-erp-label">주 <b data-hours-sum class="font-semibold text-erp-ink">40.0</b> 시간</span></div>`;

  // 셈한 칸(현업 견본의 회색 칸)과 입력 칸. 정직원 급여 표 둘(비과세 항목 · 급여항목)이 나란히 선다.
  const calc = (v, a) => `<span ${a} class="block rounded-[2px] bg-erp-thead-bg px-[10px] text-right leading-[34px]">${v}</span>`;
  const num = (v, label, a) => ui.textField({ value: v, inputmode: "numeric", "aria-label": label, ...a });
  const payTable = (title, table, help) =>
    `<div class="flex min-w-px flex-1 flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">${title}</span>${table}${p.help(help)}</div>`;
  // 정직원 견본: 시급 11,200 · 월 기본시간 209 → 2,340,800, 비과세 500,000 → 월급 2,840,800, 연봉 × 12
  const TAX_FREE = [["식대", 200000], ["자가운전보조금", 200000], ["육아수당", 100000]];
  const taxFreeSum = TAX_FREE.reduce((n, [, v]) => n + v, 0);
  const basePay = 209 * WAGE, monthlyFull = basePay + taxFreeSum;
  const taxFree = ui.dataTable(
    [{ header: "항목" }, { header: "금액" }],
    [...TAX_FREE.map(([k, v]) => [k, num(won(v), k, { "data-tax-free": "" })]), ["합계", calc(won(taxFreeSum), "data-tax-free-sum")]],
  );
  const payItems = ui.dataTable(
    [{ header: "항목" }, { header: "시간", width: "w-[110px]" }, { header: "금액" }],
    [
      ["월 기본시간", num("209", "월 기본시간", { "data-pay-rate": "1" }), calc(won(basePay), "data-pay-amount")],
      ["월간 연장근무", num("0", "월간 연장근무", { "data-pay-rate": "1.5" }), calc("0", "data-pay-amount")],
      ["기본시간 중 야간근무", num("0", "기본시간 중 야간근무", { "data-pay-rate": "0.5" }), calc("0", "data-pay-amount")],
      ["합계(계산용)", "", calc(won(basePay), "data-pay-sum")],
    ],
  );

  // 근무 일정 입력(2026-10-02 재영): 근무시간·휴게시간(시 00~23, 분 00·30 선택)과 근무요일(월~일 눌러 켜고 끄기).
  // 고르면 아래 소정근로시간 표와 주 시간이 따라 바뀐다(erp.js initWorkPlan).
  const pick = (k, v, opts, label) => `<span class="w-[72px]">${ui.select(opts, { value: v, "aria-label": label, "data-k": k })}</span>`;
  const span = (k, [sh, sm, eh, em], what) =>
    `<span class="flex items-center gap-[8px] text-[14px] text-erp-ink">${pick(`${k}-sh`, sh, HOURS, `${what} 시작 시`)}시${pick(`${k}-sm`, sm, ["00", "30"], `${what} 시작 분`)}분 ~${pick(`${k}-eh`, eh, HOURS, `${what} 끝 시`)}시${pick(`${k}-em`, em, ["00", "30"], `${what} 끝 분`)}분</span>`;
  const dayChip = (d, on) =>
    `<button type="button" aria-pressed="${on}" class="grid size-[34px] place-items-center rounded-[2px] border border-erp-field-line bg-white text-[14px] text-erp-label transition-colors duration-150 ease-out aria-pressed:border-erp-brand-soft aria-pressed:bg-erp-brand-soft aria-pressed:text-white">${d}</button>`;
  // 칸 배치는 이 폼의 다른 항목과 같게(라벨 위 · 입력 아래, 구분선 없음).
  // 근무요일 · 근무시간 · 휴게시간이 한 줄(front #15). data-workplan 은 그 줄부터 급여 표까지 감싼다 — 근무시간 · 시급을 바꾸면 표가 따라 바뀐다.
  const workDays = group("근무요일", `<span class="flex gap-[6px]">${DAYS.map((d, i) => dayChip(d, i < 5)).join("")}</span>`);
  const workTimes = group("근무시간", span("work", ["09", "00", "18", "00"], "근무시간")) + group("휴게시간", span("rest", ["12", "00", "13", "00"], "휴게시간"));

  const form =
    ui.formGroup(
      "직원 정보",
      // 직원 정보는 모두 필수(2026-10-02 재영). 표시는 1팀 폼과 같은 「라벨 *」.
      ui.formRow(
        p.fieldH(req("이름"), ui.textField({ value: d?.name ?? "남도현" }), ""),
        p.fieldH(req("휴대전화번호"), ui.textField({ value: d?.phone ?? "010-9014-5563", inputmode: "tel" }), "초대 발송과 가입 연결의 기준값"),
      ),
      ui.formRow(
        p.fieldH(req("생년월일"), ui.dateField(A, { label: "생년월일", value: "1998-07-12" }), ""),
        p.fieldH(req("소속 근무지"), ui.select(["모리커피 성수점", "모리커피 서초점", "온기식당 판교점"]), ""),
        p.fieldH(req("직무"), ui.textField({ value: "바리스타" }), ""),
      ),
      // 기재사항 · 주민등록번호는 받지 않는다(WHALEERP-132, 가입 값은 날인 전 본인 대조에만 — 2026-10-23 WHALEERP-130)
      p.help("주소 등 직원 기재사항은 받지 않는다 — 직원이 가입하며 넣는 값은 계약서에 채우지 않고 날인 전 본인 대조에만 쓴다. 주민등록번호는 날인을 마친 뒤 직원이 앱에서 넣는다."),
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
      // 급여 칸은 현업 엑셀 견본(2026-10-13, front #15). 시급 · 월급(읽기 전용) · 연봉(정직원만) 한 줄이 소정근로시간 표 위에 있고(2026-10-14),
      // 표 바로 밑에 급여 지급 방식(계좌 · 현금)을 고른다. 정직원은 그 아래 비과세 항목 · 급여항목 표가 선다.
      // 흰 칸은 입력, 회색 칸은 셈한 값이고 셈한 값은 저장하지 않는다.
      `<div data-workplan class="flex flex-col gap-[18px]">` +
        ui.formRow(workDays, workTimes) +
        `<div data-when="employment:정직원" data-pay="full" class="flex flex-col gap-[18px]">` +
        ui.formRow(
          p.fieldH(req("시급"), num(won(WAGE), "시급", { "data-wage": "" }), "2026년 최저임금 10,320원 이상"),
          p.fieldH("월급", ui.textField({ value: won(monthlyFull), readonly: true, "data-month": "" }), "급여항목 합계 + 비과세 합계"),
          p.fieldH("연봉", ui.textField({ value: won(monthlyFull * 12), readonly: true, "data-year": "" }), "월급 × 12"),
        ) +
        `<div class="flex flex-col gap-[8px]">${hoursHead}${hoursFull.replace("<table ", "<table data-hours ")}${p.help("요일마다 같은 시간이 들어간다. 요일별로 다른 시간은 근무스케줄에서 고친다. 이 소정근로시간이 근무스케줄 기본값이 된다.")}</div>` +
        choice(req("급여 지급 방식"), "pay-method-full", ["계좌", "현금"]) +
        ui.formRow(
          payTable("비과세 항목", taxFree, "금액은 원 단위. 0 원도 값으로 저장한다."),
          payTable("급여항목", payItems, "시간은 월 · 30분(0.5) 단위. 연장 1.5배 · 야간 0.5배(가산분)로 셈한다."),
        ) +
        `</div>` +
        `<div data-when="employment:파트타이머" data-pay="part" class="flex flex-col gap-[18px]">` +
        ui.formRow(
          p.fieldH(req("시급"), num(won(WAGE), "시급", { "data-wage": "" }), "2026년 최저임금 10,320원 이상"),
          p.fieldH("월급", ui.textField({ value: won(monthlyPart), readonly: true, "data-month": "" }), "주급 × 4.345"),
          `<div class="min-w-px flex-1"></div>`,
        ) +
        `<div class="flex flex-col gap-[8px]">${hoursHead}${hoursPart.replace("<table ", "<table data-hours data-hours-part ")}${p.help("요일마다 시업 · 종업 · 휴게를 고칠 수 있다. 위 근무시간 · 휴게시간을 바꾸거나 요일을 켜면 그 값으로 다시 채운다. 월급여는 주급 × 4.345. 이 소정근로시간이 근무스케줄 기본값이 된다.")}</div>` +
        choice(req("급여 지급 방식"), "pay-method-part", ["계좌", "현금"]) +
        `</div>` +
        `</div>` +
        // 계산 기준(노무사 확인 2026-10-14, 질문 1 · 2 · 12 · 13): 주휴는 주 15시간 이상이고 그 주 소정근로일을 다 나온 주에만, 주휴시간 = 주 근로시간 ÷ 5.
        // 초과근무는 단시간근로자여도 1.5배(5인 미만 사업장은 1.0배 가능), 연장과 야간이 겹치면 2.0배, 계약하지 않은 요일 근무는 연장으로 1.5배.
        p.note("주휴수당은 주 15시간 이상이고 그 주 소정근로일을 다 나온 주에만 주고, 주휴시간은 주 근로시간 ÷ 5 입니다. 연장과 야간이 겹치면 2.0배, 계약하지 않은 요일에 일한 시간은 연장(1.5배)으로 셉니다. 셈한 값은 저장하지 않습니다."),
      ui.formRow(
        p.fieldH("연차휴가", ui.textField({ value: "근로기준법에 따른다" }), "계약서 연차휴가 조항에 그대로 들어간다"),
        p.fieldH("퇴직금", ui.textField({ value: "근로자퇴직급여 보장법에 따른다" }), "계약서 퇴직금 조항에 그대로 들어간다"),
      ),
      ui.formRow(
        // 주휴일은 특정 요일로 정해 계약서 휴일 조항에 적는다(노무사 확인 2026-10-14, 질문 4). 주 15시간 미만이면 없음.
        p.fieldH(req("주휴일"), ui.select([...DAYS, "없음 (주 15시간 미만)"], { value: "일", "data-weekly-holiday": "" }), "특정 요일로 정해 계약서 휴일 조항에 적는다. 주 15시간 미만이면 주휴가 없어 고를 수 없다"),
        p.fieldH(
          "임금지급일",
          `<span class="flex gap-[6px]">${p.w("w-[100px]", ui.select(["익월", "당월"], { "aria-label": "임금지급 월" }))}${ui.textField({ value: "10", "aria-label": "임금지급일 날짜", inputmode: "numeric" })}</span>`,
          "",
        ),
        p.fieldH("근무 장소", ui.textField({ value: "서울 성동구 연무장길 18, 1층" }), ""),
      ),
    ) +
    // 수습(노무사 확인 2026-10-14, 질문 19): 정직원만, 4대보험 가입 여부 위. 필수는 아니지만 수습 대상이면 계약서에 적는다.
    // 계약 기간이 1년 이상(또는 기간의 정함 없음)일 때만 둘 수 있고, 수습 기간은 최대 3개월, 감액해도 최저임금의 90% 이상.
    // 수습 중 시급은 시급 × (1 − 감액률)로 셈해 보인다(erp.js initWorkPlan). 급여명세서는 수습 기간이면 그렇다고 표기한다.
    `<div data-when="employment:정직원">` +
    ui.formGroup(
      "수습",
      choice("수습 여부", "probation", ["없음", "적용"]),
      `<div data-when="probation:적용" class="flex w-full items-start gap-[6px]">` +
        p.fieldH(req("수습 기간"), ui.select(["1개월", "2개월", "3개월"], { value: "3개월" }), "최대 3개월. 계약 기간이 1년 이상이거나 기간의 정함이 없을 때만 둘 수 있다") +
        p.fieldH(req("임금 감액률"), `<span class="flex items-center gap-[8px] text-[14px] text-erp-ink">${ui.textField({ value: "10", inputmode: "decimal", "aria-label": "임금 감액률", "data-probation-rate": "" })}%</span>`, "최대 10%. 감액하지 않으면 0") +
        p.fieldH("수습 중 시급", ui.textField({ value: "10,080", readonly: true, "data-probation-wage": "" }), "시급 × (1 − 감액률). 최저임금의 90%(9,288원) 이상이어야 한다") +
        `</div>`,
    ) +
    `</div>` +
    ui.formGroup(
      "4대보험 가입 여부",
      // 가입 판단이 같은 둘씩 한 묶음(건강보험·국민연금 / 고용보험·산재보험), 처음엔 모두 풀린 상태(2026-10-02 재영).
      `<div class="flex gap-[24px]">${["건강보험 · 국민연금", "고용보험 · 산재보험"].map((n) => ui.checkbox(A, n, false)).join("")}</div>`,
      // 월 60시간 이상이면 가입이 원칙(노무사 확인 2026-10-14, 질문 6). 월 시간은 소정근로시간 표의 주 시간 × 4.345 로 셈한다(erp.js initWorkPlan).
      // 3.3% 원천징수는 부과 기관이 달라 4대보험과 따로 공제한다.
      p.note(`이 계약은 월 약 <b data-insure-month class="font-semibold text-erp-ink">174</b>시간이라 <b data-insure-need class="font-semibold text-erp-ink">4대보험 가입 대상</b>입니다. 월 60시간 이상 일하면 가입이 원칙이고, 3.3% 원천징수와는 따로 공제합니다.`),
    ) +
    p.band("만 19세 미만 직원은 등록할 수 없습니다", {
      desc: "근로계약·출퇴근·급여는 점포에서 따로 관리해 주세요. 계약 시작일 기준으로 따지며, 만 19세 미만이면 저장이 막히고 초대도 나가지 않습니다.",
    }) +
    // 같은 점포 진행 중 계약은 대체 확인, 다른 점포와 근무 시간이 겹치면 저장을 막는다(2026-10-13 재영, 운영 정책 CTR-26).
    p.note("같은 점포에 진행 중 계약이 있으면 「기존 근로계약을 대체하시겠습니까?」를 묻습니다. 다른 점포 근로계약과 근무 시간이 겹치면 저장되지 않고 「다른 점포 근로계약과 근무 시간이 겹칩니다」를 알립니다.") +
    p.bar(
      "",
      ui.button("초안 저장하고 발송", { href: L("staff/contracts.html"), "data-when": "method:전자계약" }) +
        ui.button("날인본 등록하고 체결 완료", { href: L("staff/contracts.html"), "data-when": "method:종이 계약" }),
    );


  const head = ui.sectionHead(
    `근로계약서 <span class="pl-[6px] text-[14px] font-normal text-erp-label">모리커피 성수점</span>`,
    ui.button("취소", { variant: "off", href: L("staff/contracts.html") }) +
      // 이어 쓰기에서만 삭제가 취소와 임시저장 사이에 선다. 확인 뒤 임시저장 행을 지운다(발송 대기부터는 지우지 않는다).
      (d ? p.ask("삭제", "soft", "임시저장한 근로계약서를 삭제하시겠습니까?", `${d.name} 님의 임시저장을 지웁니다. 삭제하면 되돌릴 수 없습니다.`, "삭제") : "") +
      p.ask("임시저장", "soft", "작성 중인 초안을 임시저장하시겠습니까?", "초대와 계약서는 보내지 않습니다. 이름 · 휴대전화번호 · 근무지 · 직무 · 고용 형태가 있어야 임시저장됩니다.") +
      ui.button("초안 저장", { href: L("staff/contracts.html") }),
  );
  // 읽기 전용 · 막힌 칸은 이 화면에서만 회색 바탕이다(데모 확인 2026-10-15). 공통 FIELD 는 건드리지 않는다.
  const body = ui.detailBody(`<div class="flex flex-col gap-[12px] [&_:is(input,select)[readonly]]:bg-erp-thead-bg [&_:is(input,select):disabled]:bg-erp-thead-bg">${head}${`<div class="flex flex-col gap-[24px]">${form}</div>`}</div>`);
  const title = d ? "근로계약서 이어 쓰기" : "근로계약서 초안 작성";
  return { title, html: ui.erpFrame({ header: erpHeader(A, R), title, body }) };
};

export default contractForm();
