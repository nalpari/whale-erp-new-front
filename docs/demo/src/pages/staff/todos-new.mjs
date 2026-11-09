// TO-DO 등록. 앱(src/app/todos/new · todo-form.tsx)처럼 목록 옆 패널이 아니라 별도 화면이다.
// 점포 등록(stores/new.mjs)을 본떠 두 단으로 둔다 — 왼쪽 제목 · 내용(6줄) · 수행예정 날짜 · 시간 · 긴급요청(묶음 상자 없이, 라벨은 15px 600),
// 오른쪽 「배정내역」 묶음(근무지 · 배정대상 · 직원 / 수행 방식). 배정대상 · 수행 방식은 점포유형과 같은 큰 선택 카드다
// (2026-11-06 사용자 지정, 배치 · 이름은 2026-11-09 사용자 지정, 3팀 확인 필요).
// 처음 값은 앱 initialForm 과 같다 — 근무지 전체 · 각자 수행, 날짜는 오늘.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as p from "../../staff-parts.mjs";
import { req } from "../../biz-form.mjs";
import { erpHeader, link } from "../../site.mjs";

// 제목 · 내용(묶음 상자 없이)과 「배정」 상자 안 칸 — 라벨이 FormGroup 제목과 같은 15px 600 먹색 · 같은 간격(앱 TopField, 2026-11-06 사용자 지정)
// fill 이면 남는 높이를 채운다 — 내용 칸이 옆 「배정」 상자 아래 끝까지 늘어난다(앱 TopField fill)
const topField = (label, control, fill) =>
  `<label class="flex flex-col gap-[10px]${fill ? " min-h-0 flex-1 [&>textarea]:flex-1" : ""}"><span class="text-[15px] font-semibold text-erp-ink">${label}</span>${control}</label>`;

// 큰 선택 카드(앱 ChoiceCards — 점포유형 카드와 같은 모양). data-when 으로 아래 칸을 여닫으려고 name · value 를 단다.
// 이름은 감싸는 group 이 단다 — 여기에도 달면 같은 이름이 두 번 읽힌다
// 배정 대상 카드 앞 사람 아이콘(앱 todo-form.tsx TARGET_ICON — 개인 한 명, 근무지 전체 세 명)
const ONE = `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="size-[16px] shrink-0 stroke-erp-brand"><path d="M2.5 14c2.4-2.7 8.6-2.8 11 0M10.6 6.1a2.6 2.6 0 1 1-5.2 0 2.6 2.6 0 0 1 5.2 0Z" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const MANY = `<svg viewBox="0 0 24 16" fill="none" aria-hidden="true" class="h-[16px] w-[24px] shrink-0 stroke-erp-brand"><path d="M.8 13.4c.9-1.3 2.3-1.9 3.8-2M23.2 13.4c-.9-1.3-2.3-1.9-3.8-2" stroke-width="1.5" stroke-linecap="round"/><circle cx="4.4" cy="6.6" r="1.9" stroke-width="1.5"/><circle cx="19.6" cy="6.6" r="1.9" stroke-width="1.5"/><path d="M2.5 14c2.4-2.7 8.6-2.8 11 0M10.6 6.1a2.6 2.6 0 1 1-5.2 0 2.6 2.6 0 0 1 5.2 0Z" transform="translate(4 0)" stroke-width="1.5" stroke-linecap="round"/></svg>`;

// 줄은 [값, 제목, 설명?, 아이콘?] — 화면에는 제목 · 설명이 보인다(설명이 없으면 제목만). data-when(erp.js initWhen)은 값이 아니라
// 고른 카드의 글자를 보므로, 아래 칸의 data-when 은 카드 글자(배정 대상은 제목)로 적는다
const choiceCards = (name, items, checked) =>
  `<div role="radiogroup" class="grid grid-cols-2 gap-[12px]">${items
    .map(
      ([value, title, desc, icon = ""]) =>
        `<label class="flex cursor-pointer flex-col items-center gap-[2px] rounded-[4px] border border-erp-panel-line bg-white px-[18px] py-[10px] text-center transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-erp-brand has-[:checked]:border-erp-brand has-[:checked]:bg-erp-thead-bg has-[:focus-visible]:border-erp-brand"><input type="radio" name="${name}" value="${value}" class="sr-only"${value === checked ? " checked" : ""}><b class="flex items-center gap-[6px] text-[15px] font-semibold text-erp-ink">${icon}${title}</b>${desc ? `<span class="text-[13px] text-erp-label">${desc}</span>` : ""}</label>`,
    )
    .join("")}</div>`;

// 직원 고르기 상자(앱 STAFF_BOX · STAFF_BOX_HEAD) — 4px 테두리 · 제목 줄은 바탕 없이 아래 회색 선(erp-bar-line) · 회색 인원수
const CHIP = "flex h-[34px] items-center gap-[8px] rounded-[2px] border border-erp-field-line bg-white pr-[4px] pl-[10px] text-[14px] text-erp-ink";
const CANDIDATE = "h-[34px] rounded-[2px] border border-erp-field-line bg-white px-[10px] text-[14px] text-erp-ink transition-colors duration-150 ease-out hover:border-erp-brand";
const staffBox = (bg, title, count, inner) =>
  `<section class="flex min-w-0 flex-col overflow-hidden rounded-[4px] border border-erp-panel-line ${bg}"><h4 class="flex h-[42px] shrink-0 items-center gap-[8px] border-b border-erp-bar-line px-[12px] text-[14px] font-medium text-erp-ink">${title} <span class="font-normal text-erp-label">${count}명</span></h4>${inner}</section>`;

const group = (label, control, when) =>
  `<div role="group" aria-label="${label}" class="flex flex-col gap-[10px]"${when ? ` data-when="${when}"` : ""}><span class="text-[15px] font-semibold text-erp-ink">${req(label)}</span>${control}</div>`;

// edit 를 주면 TO-DO 수정(앱 /todos/{id}/edit, 같은 폼) — 근무지 · 배정 대상 · 수행 방식 · 직원은 바꾸지 않아 글자로만 보이고(api 가 받지 않는다),
// 안내 박스는 등록에만 둔다. 앱은 등록 저장 · 수정 취소 · 수정 저장 뒤 상세로 가고 등록 취소만 목록으로 간다 — 데모는 수정만 상세(todos-detail.html)로 간다.
export const render = ({ A, R }, edit) => {
  // 긴급요청 — 칸 이름(15px 600)을 앞에, 스위치를 뒤에(공지사항 등록 「상단 고정」과 같은 모양)
  const urgent = `<div class="flex flex-col gap-[8px]"><span class="flex items-center gap-[10px]"><span class="text-[15px] font-semibold text-erp-ink">긴급요청</span>${x.toggle("", edit?.urgent ?? false)}</span>${p.note("직원 근무 앱의 홈 및 근무 탭 최상단에 강조 표시되며, 관리자 웹의 미조치 건수에 포함됩니다.<br>별도의 푸시 알림은 발송하지 않습니다.")}</div>`;
  const content =
    `<div class="flex flex-col gap-[18px]">${topField(req("제목"), ui.textField({ maxlength: 100, placeholder: "100자 이내로 입력해 주세요.", value: edit?.title ?? "" }))}${topField(
      "내용",
      ui.textarea({ rows: 6, maxlength: 2000, placeholder: "2,000자 이내로 입력해 주세요.", value: edit?.body ?? "" }),
    )}` +
    ui.formRow(
      `<div class="flex min-w-0 flex-1 flex-col">${topField(req("수행예정 날짜"), ui.dateField(A, { label: "수행예정 날짜", value: edit?.date ?? "2026-11-09" }))}</div>`,
      `<div class="flex min-w-0 flex-1 flex-col">${topField("시간 (선택)", p.timeField(edit?.time ?? "", "시간"))}</div>`,
    ) +
    urgent +
    `</div>`;

  // 묶음 제목은 등록 · 수정 모두 「배정내역」(2026-11-09 사용자 지정)
  // 수정 화면은 바꿀 수 없는 배정내역을 상세 화면 「TO-DO」 표와 같은 상세 표로 보인다 — 위에 붙여 늘어나지 않게(앱 todo-form.tsx, 2026-11-09 사용자 지정, 3팀 확인 필요)
  const assign = edit
    ? // 표 바로 아래 느낌표 안내(앱 공통 GuideNote, 2026-11-09 사용자 지정)
      `<div class="flex min-w-0 flex-col gap-[8px] self-start">${ui.detailTable("배정내역", [
        ["근무지", edit.store],
        ["배정대상", edit.target],
      ])}<p class="flex items-start gap-[6px] text-[13px] leading-[1.6] font-medium text-erp-ink"><span class="mt-[3px] flex"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" class="shrink-0 text-erp-brand"><circle cx="8" cy="8" r="8" fill="currentColor"/><rect x="7.3" y="3.6" width="1.4" height="5.6" rx="0.7" fill="#fff"/><circle cx="8" cy="11.6" r="0.95" fill="#fff"/></svg></span><span>배정내역(근무지 · 배정대상 · 직원)은 등록한 뒤에 변경할 수 없습니다.</span></p></div>`
    : ui.formGroup(
    "배정내역",
    ...([
    topField(req("근무지"), ui.select(["선택", "모리커피 서초점", "온기식당 판교점"], { value: "모리커피 서초점" })),
    group(
      "배정대상",
      choiceCards(
        "todo-target",
        [
          ["개인", "개인 배정", "", ONE],
          ["근무지 전체", "근무지 전체 직원에게 배정", "", MANY],
        ],
        // 앱 처음 값은 근무지 전체 — 데모는 직원 고르기 상자를 보이려고 개인 배정을 고른 장면이다
        "개인",
      ),
    ),
    // 개인이면 직원 찾기 + 두 상자 — 「선택할 수 있는 직원 N명」(옅은 회청 바탕 · 제목 줄 바탕 없음 · 아래 회색 선)과 「선택한 직원 N명」(흰 바탕).
    // 칩을 누르면 아래로 옮겨 가고 × 로 뺀다(앱 todo-form.tsx, 2026-11-09 사용자 지정, 3팀 확인 필요). 데모는 근무지를 고른 뒤 한 명을 고른 장면
    group(
      "직원",
      ui.searchField(A, { placeholder: "이름 또는 휴대전화번호 끝자리", label: "직원 찾기" }) +
        staffBox("bg-erp-thead-bg", "선택할 수 있는 직원", 2, `<ul aria-label="선택할 수 있는 직원" class="flex flex-wrap gap-[6px] p-[12px]">${["오세라 · 5678", "권도윤 · 9012"].map((t) => `<li><button type="button" class="${CANDIDATE}">${t}</button></li>`).join("")}</ul>`) +
        staffBox("bg-white", "선택한 직원", 1, `<ul aria-label="선택한 직원" class="flex flex-wrap gap-[6px] p-[12px]"><li class="${CHIP}"><span class="font-medium">서지안 · 1234</span><button type="button" aria-label="서지안 빼기" class="grid size-[26px] place-items-center rounded-[2px] text-erp-label hover:text-erp-ink">×</button></li></ul>`),
      "todo-target:개인 배정",
    ),
    group(
      "수행 방식",
      choiceCards(
        "todo-mode",
        [
          ["각자 수행", "각자 수행", "배정된 직원이 모두 수행해야 완료"],
          ["한 명 수행", "한 명만 수행", "배정된 직원 중 한 명만 수행하면 완료"],
        ],
        "각자 수행",
      ),
      "todo-target:근무지 전체 직원에게 배정",
    ),
    ]),
  );

  const guide = p.guideBand("TO-DO 안내", [
    `TO-DO는 <u>근로계약이 체결 완료되고 가입을 마친 재직 직원(퇴직 예정 포함)</u>에게만 배정할 수 있습니다.`,
    `<b class="font-medium text-erp-ink">개인 배정</b> – 선택한 직원 한 명당 1건씩 등록됩니다. 근무지를 변경하면 선택한 직원이 초기화됩니다.`,
    `<b class="font-medium text-erp-ink">근무지 전체 · 각자 수행</b> – 모든 직원이 완료해야 완료됩니다. <u>등록 후 입사한 직원에게는 배정되지 않습니다.</u>`,
    `<b class="font-medium text-erp-ink">근무지 전체 · 한 명만 수행</b> – 한 명이 완료하면 모든 직원에게 완료로 표시됩니다.`,
    `<span class="text-erp-off">근무지 · 배정대상 · 수행 방식은 등록한 뒤에 변경할 수 없습니다.</span>`, // 빨간 글자(앱과 같다, 2026-11-06 사용자 지정)
  ]);

  // 등록 취소 · 저장은 목록으로, 수정 취소 · 저장은 그 TO-DO 상세로 간다(앱 cancelHref · 저장 뒤 이동, 2026-11-09 사용자 지정)
  const back = link(R, edit ? "staff/todos-detail.html" : "staff/todos.html");
  const body = ui.detailBody(
    // 취소 · 저장은 제목 줄 오른쪽 — 점포 등록과 같은 자리(앱 todo-form.tsx)
    ui.sectionHead(edit ? "TO-DO 수정" : "TO-DO 등록", ui.button("취소", { variant: "off", href: back }) + ui.button("저장", { href: back })) +
      `<div class="grid grid-cols-2 gap-[24px]">${content}${assign}</div>` +
      (edit ? "" : guide),
  );
  return { title: edit ? "TO-DO 수정" : "TO-DO 등록", html: ui.erpFrame({ header: erpHeader(A, R), title: "TO-DO 리스트 관리", body }) };
};

export default (ctx) => render(ctx);
