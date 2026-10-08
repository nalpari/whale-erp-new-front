// BP 휴일 등록. 목업 docs/mockup/config/holidays-new.html 의 기본 상태(일부 점포 3곳 · 하루)를 BP 마스터로 본 것.
// 목업은 BP 휴일 관리 위 팝업으로 연다 — holidays.mjs 가 newForm 을 확인창에 싣고, 이 파일은 주소로 바로 열 때의 화면이다.
// 적용 범위(목업 typepick)와 날짜 유형(목업 seg)은 1팀 라디오로 옮겼다.
// 휴일 정보를 위로, 적용 대상을 아래로 둔다. 휴일 정보는 휴일명 → 날짜 → 설명 순서로 세로로 쌓는다(2026-10-07).
import * as ui from "../../ui.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link, STORES } from "../../site.mjs";

// 적용 범위 — 선택 상자만 둔다(안내 문구 없음 · 2026-10-07). 전체 화면은 반 칸, 패널은 한 칸 전체.
// 일부 점포면 대상 점포, 전체 점포면 예외 점포 고르기를 보인다(HOLIDAY_SCRIPT · 목업 data-reveal 과 같다).
export const scopeField = (store, panel) => {
  const f = ui.field(c.req("적용 범위"), ui.select(["전체 점포", "일부 점포"], { value: store ? "일부 점포" : "전체 점포", "data-hscope": true }));
  return panel ? f : c.row(f, c.blank);
};

// 점포 고르기 — BP 관리자 관리 등록의 점포 매핑과 같은 영역(점포 찾기 펼침 목록 · 일괄 검색 · 전체 제거 · 2026-10-08)
export const holidayStorePicker = (A, picked, label = "대상 점포 찾기") =>
  c.storePicker(A, {
    label,
    clearLabel: "전체 제거",
    bulk: [...STORES].sort((a, b) => a[0].localeCompare(b[0])).map(([code, name, type]) => [name, code, type]),
    picked,
  });

const fieldLabel = (t) => `<span class="text-[14px] font-medium text-erp-label">${t}</span>`;
// 보일 조건이 맞을 때만 보이는 칸. key 는 data-hshow(휴일 유형) · data-hend(종료 조건) · data-hscope-show(적용 범위)
const when = (key, values, on, html) => `<div ${key}="${values}" class="flex flex-col gap-[8px]"${on ? "" : " hidden"}>${html}</div>`;

// 휴일 정보 + 반복 + 적용 대상(목업 holidays-new 의 입력 항목 전부 · 2026-10-08)
//  · 휴일 유형 하루: 날짜 하나 / 기간: 시작일 ~ 종료일 / 반복: 시작일 + 반복 묶음(반복 유형 · 종료 조건 → 종료일 또는 횟수)
//  · 적용 범위 일부 점포: 대상 점포 / 전체 점포: 예외 점포(고른 점포는 이 휴일의 모든 날짜에서 빠진다)
// s: { id, name, type, date, end, desc, rep, until, untilDate, count, store, picked, excluded }
export const holidayForm = (A, s, { panel = false } = {}) => {
  const types = ["하루", "기간", "반복"];
  const ends = ["종료일 없음", "특정 날짜까지", "지정 횟수만큼"];
  const dates =
    when("data-hshow", "하루 반복", s.type !== "기간", ui.dateField(A, { label: s.type === "반복" ? "시작일" : "날짜", value: s.date })) +
    when(
      "data-hshow",
      "기간",
      s.type === "기간",
      `<div class="flex items-center gap-[6px]"><div class="min-w-px flex-1">${ui.dateField(A, { label: "시작일", value: s.date })}</div><span class="text-erp-label">~</span><div class="min-w-px flex-1">${ui.dateField(A, { label: "종료일", value: s.end || "" })}</div></div>`,
    );
  const info = ui.formGroup(
    "휴일 정보",
    ui.field(c.req("휴일명"), ui.textField({ value: s.name, maxlength: 30 })),
    c.stack(fieldLabel(c.req("날짜")), `<div data-htype>${c.radios(`${s.id}-type`, types, types.indexOf(s.type))}</div>`, dates),
    ui.field("설명", ui.textarea({ rows: 4, value: s.desc })),
  );
  const repeat = when(
    "data-hshow",
    "반복",
    s.type === "반복",
    ui.formGroup(
      "반복",
      ui.field(c.req("반복 유형"), ui.select(["매일", "매주", "매월", "매년"], { value: s.rep || "매주" })),
      c.stack(
        fieldLabel(c.req("종료 조건")),
        `<div data-hendpick>${c.radios(`${s.id}-end`, ends, ends.indexOf(s.until || "종료일 없음"))}</div>`,
        when("data-hend", "특정 날짜까지", s.until === "특정 날짜까지", ui.dateField(A, { label: "종료일", value: s.untilDate || "" })),
        when(
          "data-hend",
          "지정 횟수만큼",
          s.until === "지정 횟수만큼",
          `<div class="flex w-[160px] items-center gap-[6px]">${ui.textField({ value: s.count || "", inputmode: "numeric", "aria-label": "반복 횟수" })}<span class="shrink-0 text-[14px] text-erp-ink">회</span></div>`,
        ),
      ),
    ),
  );
  const target = ui.formGroup(
    "적용 대상",
    scopeField(s.store, panel),
    when("data-hscope-show", "일부 점포", s.store, c.stack(fieldLabel(c.req("대상 점포")), holidayStorePicker(A, s.picked || []))),
    when("data-hscope-show", "전체 점포", !s.store, c.stack(fieldLabel("예외 점포"), holidayStorePicker(A, s.excluded || [], "뺄 점포 찾기"))),
  );
  return `<div data-hform class="contents">${info}${repeat}${target}</div>`;
};

// 휴일 유형 · 종료 조건 · 적용 범위에 따라 칸을 바꾼다. 한 화면에 양식이 둘(등록 · 수정 패널)이어도 한 번만 건다.
export const HOLIDAY_SCRIPT = `<script>
(() => {
  if (window.__holidayForm) return;
  window.__holidayForm = true;
  const pick = (box) => box?.querySelector("input:checked")?.closest("label")?.textContent.trim() || "";
  const apply = (f) => {
    const type = pick(f.querySelector("[data-htype]"));
    const end = pick(f.querySelector("[data-hendpick]"));
    const scope = f.querySelector("[data-hscope]")?.value;
    f.querySelectorAll("[data-hshow]").forEach((el) => (el.hidden = !el.dataset.hshow.split(" ").includes(type)));
    f.querySelectorAll("[data-hend]").forEach((el) => (el.hidden = el.dataset.hend !== end));
    f.querySelectorAll("[data-hscope-show]").forEach((el) => (el.hidden = el.dataset.hscopeShow !== scope));
  };
  document.addEventListener("change", (e) => {
    const f = e.target.closest("[data-hform]");
    if (f) apply(f);
  });
})();
</script>`;

// 등록 표본 — 일부 점포 3곳 · 하루
export const newForm = (A, { panel = false } = {}) =>
  holidayForm(
    A,
    {
      id: "hn",
      name: "재고 정리 휴무",
      type: "하루",
      date: "2026-10-15",
      desc: "분기 재고 실사로 하루 휴무",
      store: true,
      picked: [
        ["모리커피 성수점", "ST000002", "직영점포"],
        ["온기식당 판교점", "ST000003", "직영점포"],
        ["모리커피 연남점", "ST000006", "가맹점포"],
      ],
    },
    { panel },
  );

export default ({ A, R }) => ({
  title: "BP 휴일 등록",
  html: ui.erpFrame({
    header: erpHeader(A, R),
    title: "BP 휴일 관리",
    body: ui.detailBody(
      ui.sectionHead("BP 휴일 등록") +
        newForm(A) +
        c.buttons(ui.button("취소", { variant: "off", href: link(R, "config/holidays.html") }), ui.button("저장", { href: `${link(R, "config/holidays.html")}?panel=hol-detail-panel` })) +
        HOLIDAY_SCRIPT,
    ),
  }),
});
