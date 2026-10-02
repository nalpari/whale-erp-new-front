// 3팀 화면(staff · support · notify)이 같이 쓰는 임시 부품. 1팀 공통 컴포넌트에 없어 데모용으로 만든 것이고, 컴포넌트 제안의 대상이다.
// 생김새는 DESIGN.md 토큰과 규칙(2px 모서리, 1px 선, 34/42/46 높이, 그림자 없음)으로만 만든다.
import * as ui from "./ui.mjs";

// 상태 배지. 1팀 Badge 는 운영(파랑)·미운영(빨강) 두 가지라, 회색 중립 배지를 더했다.
// ok·info → 파랑, warn·risk → 빨강(손이 가야 하는 상태), quiet → 회색.
const NEUTRAL = "inline-block rounded-[2px] px-[4px] py-[2px] text-center text-[14px] font-medium bg-erp-subtle text-erp-ink whitespace-nowrap";
export const tag = (tone, text) =>
  tone === "ok" || tone === "info" ? ui.badge("on", text) : tone === "warn" || tone === "risk" ? ui.badge("off", text) : `<span class="${NEUTRAL}">${text}</span>`;

// 색 글자(표 안의 "정상"·"지각"·"확인 필요" 같은 짧은 상태)
const MARK = { ok: "text-erp-on", warn: "text-erp-off", risk: "text-erp-off", subtle: "text-erp-muted" };
export const mark = (tone, text) => `<span class="${MARK[tone]}">${text}</span>`;

// 흐린 보조 글자(셀 안의 덧붙임)
export const sub = (text) => `<span class="text-erp-muted">${text}</span>`;

// 사용자에게 보이는 안내 문구
export const note = (text) => `<p class="text-[13px] leading-[1.6] text-erp-label">${text}</p>`;

// 입력칸 아래 도움말. ui.field 의 control 자리에 입력칸과 함께 넣는다.
export const help = (text) => `<span class="text-[12px] leading-[1.5] text-erp-muted">${text}</span>`;
// 도움말이 있는 칸. 도움말 유무가 섞인 줄에서도 칸 위쪽이 맞도록 감싸서 위로 붙인다(도움말 없는 칸은 text 를 비운다).
export const fieldH = (label, control, text, width) =>
  `<div class="flex flex-col gap-[8px] ${width ?? "min-w-px flex-1"}">${ui.field(label, control, "w-full")}${text ? help(text) : ""}</div>`;

// 경고 밴드: 제목 아래 즉시 조치 영역. tone 이 risk 면 빨강 계열 바탕.
export function band(title, { desc = "", actions = "", tone } = {}) {
  const risk = tone === "risk";
  return `<div class="flex min-h-[46px] items-center gap-[12px] rounded-[2px] border px-[16px] py-[12px] ${risk ? "border-erp-off-bg bg-erp-off-bg" : "border-erp-panel-line bg-erp-thead-bg"}"><div class="flex min-w-0 flex-1 flex-col gap-[4px]"><p class="text-[14px] font-semibold ${risk ? "text-erp-off" : "text-erp-ink"}">${title}</p>${desc ? `<p class="text-[14px] leading-[1.6] text-erp-ink">${desc}</p>` : ""}</div>${actions ? `<div class="flex shrink-0 gap-[6px]">${actions}</div>` : ""}</div>`;
}

// 진행 단계. items: [state(done|now|wait), title, meta]
const STEP_DOT = {
  done: "border-erp-brand bg-erp-brand text-white",
  now: "border-erp-brand bg-white text-erp-brand",
  wait: "border-erp-field-line bg-white text-erp-muted",
};
export const steps = (items) =>
  `<ol class="flex flex-col border-t border-erp-thead-line">${items
    .map(
      ([state, title, meta], i) =>
        `<li class="flex min-h-[46px] items-center gap-[12px] border-b border-erp-thead-line py-[8px]"${state === "now" ? ' aria-current="step"' : ""}><span class="grid size-[24px] shrink-0 place-items-center rounded-full border text-[12px] font-semibold ${STEP_DOT[state]}">${i + 1}</span><span class="flex min-w-0 flex-1 flex-col gap-[2px]"><span class="text-[14px] ${state === "wait" ? "text-erp-label" : "font-medium text-erp-ink"}">${title}</span>${meta ? `<span class="text-[13px] text-erp-muted">${meta}</span>` : ""}</span></li>`,
    )
    .join("")}</ol>`;

// 사용량 막대(63/100 등). 폭만 style 로 준다.
export const meter = (pct) =>
  `<span class="block h-[6px] w-full overflow-hidden rounded-[2px] bg-erp-subtle"><span class="block h-full bg-erp-brand" style="width:${pct}%"></span></span>`;

// 하나만 고르는 필터·선택(목업의 seg). 라디오 묶음으로 그린다.
export const radios = (name, options, selected = options[0]) =>
  `<div role="radiogroup" class="flex flex-wrap items-center gap-x-[18px] gap-y-[8px]">${options.map((o) => ui.radio(o, name, o === selected)).join("")}</div>`;

// 고정 폭 칸(셀렉트·날짜 등)
export const w = (cls, html) => `<div class="${cls} shrink-0">${html}</div>`;
// 한 줄 도구 모음(왼쪽 · 오른쪽)
export const bar = (left, right = "") =>
  `<div class="flex items-center gap-[6px]">${left}<span class="flex-1"></span>${right}</div>`;

// 카드 안 묶음: 제목 줄 + 내용
export const section = (title, right, ...content) => `<section class="flex min-w-0 flex-col gap-[12px]">${ui.sectionHead(title, right)}${content.join("")}</section>`;
// 7:5 두 단(목업 grid--7-5). 단마다 묶음을 세로로 쌓는다.
export const cols = (left, right, tmpl = "grid-cols-[7fr_5fr]") =>
  `<div class="grid ${tmpl} items-start gap-[24px]"><div class="flex min-w-0 flex-col gap-[24px]">${left}</div><div class="flex min-w-0 flex-col gap-[24px]">${right}</div></div>`;

// 아이콘만 있는 네모 버튼(이전·다음 주)
export const iconButton = (A, icon, label) =>
  `<button type="button" aria-label="${label}" class="grid size-[34px] shrink-0 place-items-center rounded-[2px] border border-erp-button-line bg-white transition-[border-color] duration-150 ease-out hover:border-erp-brand">${ui.img(A, icon, 16, 16)}</button>`;

// 첨부 파일 칸: 고른 파일 이름을 보여 주는 읽기 전용 칸 + 「파일 선택」(안에 숨은 file 입력). 이름 표시는 erp.js 가 한다.
// 1팀 공통 컴포넌트에 파일 칸이 없어 컴포넌트 제안 대상.
export const fileField = (label, accept = ".pdf,.jpg,.jpeg,.png") =>
  `<div data-file class="flex gap-[6px]">${ui.textField({ readonly: true, placeholder: "PDF · JPG · PNG", "aria-label": `${label} 파일 이름` })}${ui
    .button("파일 선택", { variant: "soft" })
    .replace('<button type="button"', '<label class="cursor-pointer"><span')
    .replace("</button>", `</span><input type="file" accept="${accept}" aria-label="${label} 파일 선택" class="sr-only"></label>`)}</div>`;

// 합계 줄(실지급액)
export const total = (label, value) =>
  `<div class="flex h-[46px] items-center border-y border-erp-thead-line px-[12px]"><span class="flex-1 text-[16px] font-semibold text-erp-ink">${label}</span><span class="text-[22px] font-semibold text-erp-ink">${value}</span></div>`;

// 시간 입력칸(네이티브 time)
export const timeField = (value, label) => ui.textField({ type: "time", value, "aria-label": label });

