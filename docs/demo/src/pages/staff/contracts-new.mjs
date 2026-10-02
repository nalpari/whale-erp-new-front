// 근로계약서 초안 작성. 목업 docs/mockup/staff/contracts-new.html 의 기본 상태(정직원 · 전자계약 · 남도현)를 BP 마스터로 본 것.
// 목업의 고용 형태·계약 방식 전환 버튼은 라디오로 그렸고, 종이 계약을 골랐을 때의 칸은 기본 상태가 아니라 넣지 않았다.
import * as ui from "../../ui.mjs";
import * as p from "../../staff-parts.mjs";
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

  const form =
    ui.formGroup(
      "직원 정보",
      ui.formRow(
        p.fieldH("이름", ui.textField({ value: "남도현" }), ""),
        p.fieldH("휴대전화번호", ui.textField({ value: "010-9014-5563", inputmode: "tel" }), "초대 발송과 가입 연결의 기준값"),
      ),
      ui.formRow(
        p.fieldH("생년월일", ui.dateField(A, { label: "생년월일", value: "1998-07-12" }), ""),
        p.fieldH("소속 근무지", ui.select(["모리커피 성수점", "모리커피 서초점", "온기식당 판교점"]), ""),
        p.fieldH("직무", ui.textField({ value: "바리스타" }), ""),
      ),
    ) +
    ui.formGroup(
      "계약 방식",
      choice("고용 형태", "employment", ["정직원", "파트타이머"]),
      choice("계약 방식", "method", ["전자계약", "종이 계약"]),
    ) +
    ui.formGroup(
      "계약 조건",
      ui.formRow(
        p.fieldH("계약 시작일", ui.dateField(A, { label: "계약 시작일", value: "2026-09-14" }), ""),
        p.fieldH("계약 종료일", ui.dateField(A, { label: "계약 종료일" }), "비워 두면 기간의 정함이 없는 계약"),
      ),
      ui.formRow(
        p.fieldH("월급", ui.textField({ value: "2,400,000", inputmode: "numeric" }), "월 소정근로시간 기준 최저임금 이상"),
        p.fieldH("주휴일", ui.select(["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"]), ""),
      ),
      `<div class="flex flex-col gap-[8px]"><div class="flex items-center"><span class="flex-1 text-[14px] font-medium text-erp-label">소정근로시간</span><span class="text-[14px] text-erp-label">주 <b class="font-semibold text-erp-ink">40.0</b> 시간</span></div>${hours}</div>`,
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
      `<div class="flex gap-[24px]">${["고용보험", "산재보험", "국민연금", "건강보험"].map((n) => ui.checkbox(A, n, true)).join("")}</div>`,
    ) +
    p.band("만 19세 미만 직원은 등록할 수 없습니다", {
      desc: "근로계약·출퇴근·급여는 점포에서 따로 관리해 주세요. 계약 시작일 기준으로 따지며, 만 19세 미만이면 저장이 막히고 초대도 나가지 않습니다.",
    }) +
    p.bar("", ui.button("초안 저장하고 발송", { href: L("staff/contracts.html") }));


  const head = ui.sectionHead(
    `근로계약서 <span class="pl-[6px] text-[14px] font-normal text-erp-label">모리커피 성수점</span>`,
    ui.button("취소", { variant: "off", href: L("staff/contracts.html") }) + ui.button("임시저장", { variant: "soft" }) + ui.button("초안 저장", { href: L("staff/contracts.html") }),
  );
  const body = ui.detailBody(`<div class="flex flex-col gap-[12px]">${head}${`<div class="flex flex-col gap-[24px]">${form}</div>`}</div>`);
  return { title: "근로계약서 초안 작성", html: ui.erpFrame({ header: erpHeader(A, R), title: "근로계약서 초안 작성", body }) };
};
