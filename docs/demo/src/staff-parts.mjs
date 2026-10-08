// 3팀 화면(staff · support · notify)이 같이 쓰는 임시 부품. 1팀 공통 컴포넌트에 없어 데모용으로 만든 것이고, 컴포넌트 제안의 대상이다.
// 생김새는 DESIGN.md 토큰과 규칙(2px 모서리, 1px 선, 34/42/46 높이, 그림자 없음)으로만 만든다.
import * as ui from "./ui.mjs";
import * as x from "./extra.mjs";

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
// 근무 인원 줄(근무스케줄 관리 일간 근무표). 칸마다 그 시간대에 근무 중인 인원 — 0 아무도 없음, 1 혼자 근무, 2 이상.
// 로그인 후 홈 점포 하나 화면의 주간 보기도 같은 줄·같은 범례를 쓴다(2026-10-08 재영).
export const COVER = ["bg-erp-off-bg text-erp-off", "bg-erp-subtle text-erp-ink", "bg-erp-on-bg text-erp-on"];
export const coverRow = (counts, attrs = "") =>
  `<div class="flex h-[46px] items-center border-b border-erp-thead-line"${attrs}><span class="w-[140px] shrink-0 px-[10px] text-[14px] text-erp-label">근무 인원</span><div class="grid h-[34px] flex-1 gap-px" style="grid-template-columns:repeat(${counts.length},minmax(0,1fr))">${counts
    .map((n) => `<span class="grid place-items-center text-[13px] font-medium ${COVER[Math.min(n, 2)]}">${n}</span>`)
    .join("")}</div></div>`;
const swatch = (i, label) => `<span class="flex items-center gap-[6px]"><span class="size-[12px] rounded-[2px] ${COVER[i]}"></span>${label}</span>`;
export const coverLegend = `<div class="flex items-center gap-[18px] pt-[12px] text-[13px] text-erp-label">${swatch(0, "아무도 없음")}${swatch(1, "혼자 근무 · 휴게 불가")}${swatch(2, "2명 이상")}</div>`;

// ── 근무스케줄 보기(주간·월간) ──
// 로그인 후 홈 점포 하나 화면과 근무스케줄 관리가 같은 틀을 쓴다(2026-10-08 재영).
// crew 한 줄: [이름, 보조 글자, { 요일(0=일): [시작 시, 끝 시] }, 배정 불가 사유?]. 익일은 24+ 로 적는다.
// 공통 opts: all(그날 재직자 전원 — 관리) / 아니면 근무자만(홈).
const SCHED_BAR = {
  on: "bg-erp-brand-soft text-white",
  none: "bg-erp-subtle text-erp-muted",
  blocked: "bg-erp-off-bg text-erp-off",
};
const WDS = "일월화수목금토";
const hh = (h) => String(h % 24).padStart(2, "0");
const hm = (h) => `${h >= 24 ? "익일 " : ""}${hh(h)}:00`;
const shiftText = ([s, e]) => `${hm(s)}~${hm(e)}`;
const workers = (crew, wd) => crew.filter((c) => !c[3] && c[2][wd]);

// 주간 보기: 날짜가 붙은 요일 칩 + 그날 시간축 막대 + 근무 인원 줄 + 범례. 칩을 누르면 그 요일 묶음(data-wd-day)만 보인다(erp.js).
// opts: { open, close, dates: { 요일: 날 }, pick: 처음 요일, all, gap: 공백 안내의 「이 시간대에 배정」이 여는 패널 id(관리만) }
export function schedWeek(crew, { open, close, dates, pick, all = false, gap = "" }) {
  const span = close - open;
  const order = [1, 2, 3, 4, 5, 6, 0];
  const chips = order
    .map(
      (wd) =>
        `<button type="button" data-wd-pick="${wd}" data-count="${workers(crew, wd).length}" aria-pressed="${wd === pick}" class="flex h-[34px] flex-1 items-center justify-center gap-[6px] rounded-[2px] border text-[14px] transition-colors duration-150 ease-out aria-pressed:border-erp-brand aria-pressed:bg-erp-brand aria-pressed:text-white border-erp-button-line bg-white text-erp-ink hover:border-erp-brand">${WDS[wd]} ${dates[wd]}<span class="text-[13px] opacity-70">${workers(crew, wd).length}명</span></button>`,
    )
    .join("");
  const strip = (tone, left, width, text) =>
    `<div class="absolute inset-y-0 flex items-center truncate rounded-[2px] px-[10px] text-[13px] ${SCHED_BAR[tone]}" style="left:${left.toFixed(3)}%;width:${width.toFixed(3)}%">${text}</div>`;
  const row = (c, wd) => {
    const s = c[2][wd];
    const inner = c[3] ? strip("blocked", 0, 100, c[3]) : s ? strip("on", ((s[0] - open) / span) * 100, ((s[1] - s[0]) / span) * 100, shiftText(s)) : strip("none", 0, 100, "휴무");
    return `<div class="flex h-[46px] items-center border-b border-erp-thead-line"><span class="w-[140px] shrink-0 truncate px-[10px] text-[14px]">${c[0]} <span class="text-erp-muted">${c[1]}</span></span><div class="relative h-[34px] flex-1 rounded-[2px] bg-erp-thead-bg">${inner}</div></div>`;
  };
  // 그 시간대(1시간 칸)에 근무 중인 인원
  const cover = (wd) => Array.from({ length: span }, (_, i) => workers(crew, wd).filter((c) => c[2][wd][0] <= open + i && open + i < c[2][wd][1]).length);
  // 비는 시간대를 구간으로 묶어 알린다(관리만)
  const gapBar = (cov) => {
    const runs = [];
    cov.forEach((n, i) => (n ? null : runs.length && runs.at(-1)[1] === open + i ? (runs.at(-1)[1] += 1) : runs.push([open + i, open + i + 1])));
    const hours = runs.reduce((t, [s, e]) => t + e - s, 0);
    const msg = runs.length ? `${runs.map(([s, e]) => `${hm(s)}-${hm(e)}`).join(", ")} 에 배정된 직원이 없습니다.` : "비는 시간대가 없습니다.";
    return bar(`${tag(hours ? "risk" : "ok", hours ? `공백 ${hours}시간` : "공백 없음")}${note(msg)}`, hours ? ui.slideTrigger("이 시간대에 배정", gap, "soft") : "");
  };
  const groups = order
    .map((wd) => {
      const list = all ? crew : crew.filter((c) => c[2][wd] && !c[3]);
      const cov = cover(wd);
      return `<div data-wd-day="${wd}"${wd === pick ? "" : " hidden"}>${list.map((c) => row(c, wd)).join("")}${coverRow(cov)}${gap ? gapBar(cov) : ""}</div>`;
    })
    .join("");
  const ticks = Array.from({ length: span }, (_, i) => (open + i >= 24 ? `익일 ${hh(open + i)}` : hh(open + i)));
  return (
    `<div class="flex gap-[6px]">${chips}</div>` +
    `<div class="flex flex-col"><div class="flex h-[42px] items-center border-y border-erp-thead-line bg-erp-thead-bg"><span class="w-[140px] shrink-0 px-[10px] text-[14px] font-medium text-erp-thead-text">직원</span><div class="grid flex-1 text-[12px] text-erp-thead-text" style="grid-template-columns:repeat(${span},minmax(0,1fr))">${ticks.map((t) => `<span class="truncate">${t}</span>`).join("")}</div></div>${groups}</div>` +
    coverLegend
  );
}

// 월간 보기: 달력 + 왼쪽에 고른 날의 근무자. 달력 칸에는 인원만 둔다.
// 달력 위 ‹ 이전 달 · 2026년 9월 · 다음 달 › · 이번 달 로 달을 바꾼다(2026-10-08 재영). 칸은 erp.js initDayPlan 이 그린다.
// opts: { year, month(0부터), today, holiday: { 날짜: 이름 }, all }
export function schedMonth(A, crew, { year, month, today, holiday = {}, all = false }) {
  // 하루 목록 한 줄: [이름, 보조 글자, { 요일: "09:00~18:00" }, 배정 불가 사유?, 체결 완료 계약 기간 [시작, 끝]?]
  const plan = { crew: crew.map((c) => [c[0], c[1], Object.fromEntries(Object.entries(c[2]).map(([wd, s]) => [wd, shiftText(s)])), c[3] || "", c[4] || null]), holiday, today, year, month, all };
  const nav = `<div class="mb-[8px] flex items-center gap-[6px]"><span data-monthmove="-1">${iconButton(A, "prev.svg", "이전 달")}</span><b data-monthtitle class="min-w-[120px] text-center text-[15px] font-semibold">${year}년 ${month + 1}월</b><span data-monthmove="1">${iconButton(A, "next.svg", "다음 달")}</span>${ui.button("이번 달", { variant: "off", "data-monthtoday": true })}</div>`;
  return (
    `<div data-dayplan='${JSON.stringify(plan)}' class="grid grid-cols-[268px_minmax(0,1fr)] items-start gap-[18px]">` +
    `<div class="flex flex-col gap-[8px] rounded-[2px] border border-erp-thead-line p-[14px]"><div class="flex items-center justify-between"><button type="button" data-daymove="-1" aria-label="이전 날" class="grid size-[28px] place-items-center rounded-[2px] border border-erp-button-line">${ui.img(A, "prev.svg", 7, 12)}</button><b data-daytitle class="text-[15px] font-semibold"></b><button type="button" data-daymove="1" aria-label="다음 날" class="grid size-[28px] place-items-center rounded-[2px] border border-erp-button-line">${ui.img(A, "next.svg", 7, 12)}</button></div><p data-daysum class="text-[13px] text-erp-label"></p><ul data-daylist class="flex flex-col text-[14px]"></ul></div>` +
    `<div>${nav}<div class="grid grid-cols-7 gap-px overflow-hidden rounded-[2px] border border-erp-thead-line bg-erp-thead-line">${[..."월화수목금토일"]
      .map((d, i) => `<div class="bg-erp-thead-bg py-[6px] text-center text-[13px] ${i === 5 ? "text-erp-on" : i === 6 ? "text-erp-off" : "text-erp-thead-text"}">${d}</div>`)
      .join("")}<div data-monthcells class="contents"></div></div></div></div>`
  );
}

// 라벨 옆 ⓘ 툴팁. 헤더 서비스 바로가기 말풍선(ui.mjs tip)은 헤더 전용 알약형이라, 여기는 DESIGN.md 팝업 모양(2px·뜬 것 그림자)으로 그렸다.
export const infoTip = (label, text) =>
  `<span tabindex="0" aria-label="${label} 설명" class="group relative inline-grid size-[16px] cursor-help place-items-center text-[13px] text-erp-label">ⓘ<span role="tooltip" class="pointer-events-none absolute top-[calc(100%+6px)] left-0 z-20 w-[280px] rounded-[2px] border border-[#ebebeb] bg-white px-[12px] py-[10px] text-[13px] leading-[1.6] font-normal whitespace-pre-line text-erp-ink opacity-0 shadow-[0_2px_6px_rgba(40,47,55,0.08)] transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-visible:opacity-100">${text}</span></span>`;
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

// 주 이동: ‹ 2026년 08-31 ~ 09-06 › — 가운데를 누르면 주 선택 달력. 동작은 erp.js initWeeks.
// blocks: 주마다 바꿔 보일 묶음의 id([data-week="월요일"]). 비우면 날짜 표시만 바뀐다.
// day: true 면 하루씩(‹ 2026-09-06 (일) ›, 달력에서 날짜 하나) — 묶음 키는 그 날짜.
// month: true 면 한 달씩(‹ 2026년 8월 ›, 열두 달 판) — 묶음 키는 그 달 1일.
export const weekNav = (A, blocks = "", start = "2026-08-31", { day = false, month = false } = {}) => {
  const pop = ui.uid("week");
  const unit = month ? "달" : day ? "날" : "주";
  const step = month ? "month" : day ? "day" : "";
  return `<span data-weeks="${blocks}" data-week-start="${start}"${step ? ` data-step="${step}"` : ""} class="relative flex items-center gap-[6px]">${iconButton(A, "prev.svg", `이전 ${unit}`)}<button type="button" popovertarget="${pop}" aria-haspopup="dialog" aria-expanded="false" data-week-label class="h-[34px] min-w-[190px] rounded-[2px] border border-erp-button-line bg-white px-[12px] text-[14px] font-semibold text-erp-ink transition-[border-color] duration-150 ease-out hover:border-erp-brand"></button>${iconButton(A, "next.svg", `다음 ${unit}`)}<div id="${pop}" popover="auto" role="dialog" aria-label="${month ? "달" : day ? "날짜" : "주"} 선택" class="${ui.POPOVER}"></div></span>`;
};

// 상세 화면 틀(2026-10-02 재영): 본문 첫 줄은 「○○ 상세」 + 오른쪽 끝 버튼, 묶음 제목은 회색 머리 칸 안(왼쪽 제목, 오른쪽 끝 요약·이동·버튼).
// 머리 칸은 detail-table.tsx 의 제목 칸과 같은 모양이고, 아래 data-table 머리줄과 선이 겹치지 않게 아래 테두리만 뺐다.
export const detailHead = (title, right) =>
  `<div class="flex items-center gap-[6px]"><h2 class="flex-1 text-[18px] font-semibold text-erp-ink">${title}</h2>${right}</div>`;
export const headIn = (title, right = "") =>
  `<span class="flex-1">${title}</span><span class="flex items-center gap-[6px] text-[14px] font-normal">${right}</span>`;
// pad: 표가 아니라 글을 담을 때 테두리·안쪽 여백을 둔다.
export const box = (title, right, body, { pad = false } = {}) =>
  `<section class="min-w-0"><h3 class="flex h-[42px] items-center gap-[6px] rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px] text-[16px] font-medium text-erp-ink">${headIn(title, right)}</h3>${
    pad ? `<div class="rounded-b-[2px] border border-erp-thead-line bg-white p-[16px]">${body}</div>` : body
  }</section>`;

// 누르면 확인창이 뜨는 버튼(데모라 실제로 바꾸지는 않는다). body 는 설명 문장이나 표, ok 는 확인 버튼 글자(「닫기」면 닫기 하나만).
// okAttrs: 확인 버튼에 붙일 속성(예: data-remove-picked).
export const ask = (label, variant, title, body = "", ok = label, okAttrs = {}) => {
  const id = x.dialogId();
  const buttons = ok === "닫기" ? ui.button("닫기", { variant: "off", "data-close": true }) : ui.button("취소", { variant: "off", "data-close": true }) + ui.button(ok, { "data-close": true, ...okAttrs });
  return x.dialogTrigger(label, id, variant) + x.dialog(id, title, body, buttons);
};

// 합계 줄(실지급액)
export const total = (label, value) =>
  `<div class="flex h-[46px] items-center border-y border-erp-thead-line px-[12px]"><span class="flex-1 text-[16px] font-semibold text-erp-ink">${label}</span><span class="text-[22px] font-semibold text-erp-ink">${value}</span></div>`;

// 시간 입력칸(네이티브 time)
export const timeField = (value, label) => ui.textField({ type: "time", value, "aria-label": label });

