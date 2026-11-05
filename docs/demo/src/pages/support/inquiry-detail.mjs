// 문의사항 상세·답변. 앱 src/components/community/inquiry-detail.tsx(InquiryDetailView)를 플랫폼 관리자로 본 것.
// 처리중은 이 화면, 접수(처리 시작 전)는 inquiry-detail-received, 답변 완료(답변 수정)는 inquiry-detail-done 이 state 를 바꿔 그린다.
// 처리중은 운영자가 상세에서 [처리 시작]으로 직접 바꾼다 — 접수 상태에서만 되고 바꾼 시각 · 운영자가 남는다(POST /inquiries/{id}/processing, WHALEERP-274).
// 모양은 2026-11-05 사용자 지정(front PR #226): 머리 줄(제목 20px + 접수일시 · 분류 · 상태), 「문의내용」 상자, 첨부는 종류 칸 없이,
// 답변 제목 옆 「등록자 · 등록 … (수정됨 … · 수정자)」, 처리이력은 열 이름 줄 없이 단계 회색 500 · 할 일 안내에 느낌표 아이콘.
import * as ui from "../../ui.mjs";
import * as p from "../../staff-parts.mjs";
import { platformHeader, link } from "../../site.mjs";
import { floatingHelpTip } from "../../role-side.mjs";

const DIVIDER = '<span aria-hidden="true" class="h-[11px] w-px shrink-0 bg-[#d9d9d9]"></span>';
const TAG = (text) => `<span class="inline-block rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[4px] py-px text-[14px] font-medium whitespace-nowrap text-erp-sub">${text}</span>`;
// 상태 배지 — 답변완료 on · 처리중 꼬리표 · 접수 off(앱 StatusBadge)
const STATUS = { RECEIVED: ui.badge("off", "접수"), IN_PROGRESS: TAG("처리중"), ANSWERED: ui.badge("on", "답변완료") };
// 상자 — 제목 바 15px 600(DetailTable 제목과 같다). left 면 보조 글자를 제목 옆에 구분선과 함께, 아니면 오른쪽 끝
const box = (title, hint, body, { left = false, pad = true } = {}) =>
  `<section class="min-w-0"><h3 class="flex h-[42px] items-center ${left ? "gap-[10px]" : "gap-[6px]"} rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px] text-[15px] font-semibold text-erp-ink"><span class="min-w-0 truncate ${left ? "shrink-0" : "flex-1"}">${title}</span>${
    hint ? `${left ? DIVIDER : ""}<span class="min-w-0 truncate text-[14px] font-normal text-erp-label">${hint}</span>` : ""
  }</h3>${pad ? `<div class="flex flex-col gap-[18px] rounded-b-[2px] border border-erp-thead-line bg-white p-[16px]">${body}</div>` : body}</section>`;
const prose = (text) => `<p class="text-[14px] leading-[1.7] whitespace-pre-wrap break-keep text-erp-ink">${text}</p>`;
// 저장 버튼 옆 안내 — 플레이스홀더(회색)와 갈리게 회청 느낌표 동그라미 + 먹색 13px 500(앱 Guide)
const ICON = `<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" class="shrink-0 text-erp-brand"><circle cx="8" cy="8" r="8" fill="currentColor"/><rect x="7.3" y="3.6" width="1.4" height="5.6" rx="0.7" fill="#fff"/><circle cx="8" cy="11.6" r="0.95" fill="#fff"/></svg>`;
const guide = (text) => `<p class="flex items-start gap-[6px] text-[13px] leading-[1.6] font-medium text-erp-ink"><span class="mt-[3px] flex">${ICON}</span><span>${text}</span></p>`;
const pending = (text) => `<span class="flex min-w-0 items-center gap-[6px]">${ICON}<span class="truncate">${text}</span></span>`;
const spread = (left, right) => `<div class="flex items-center gap-[12px]"><div class="flex-1">${left}</div>${right}</div>`;
// 쓸 수 있는 답변 · 메모 칸은 테두리를 연회청으로 진하게, 포커스하면 회청(앱 ACTIVE_FIELD)
const active = (html) => `<div class="[&_textarea]:border-erp-brand-soft [&_textarea:focus]:border-erp-brand">${html}</div>`;

// 첨부(CNT-18): 종류 칸 없이 줄만 — 이미지는 64px 미리보기(8px 둥글게), PDF 는 이름 + 크기
const thumb = (name) => `<span title="${name}" class="grid size-[64px] shrink-0 place-items-center rounded-[8px] border border-erp-panel-line bg-erp-thead-bg text-[12px] text-erp-label">PNG</span>`;
const fileRow = (name, size, image) =>
  `<li class="flex items-center border-b border-erp-thead-line px-[12px] last:border-b-0 ${image ? "py-[12px]" : "h-[46px]"}"><a href="#" class="flex min-w-0 items-center gap-[10px] text-left text-[14px]">${image ? thumb(name) : ""}<span class="truncate text-erp-link hover:underline">${name}</span><span class="text-erp-muted">${size}</span></a></li>`;
const files = ([png, pdf]) => box("첨부파일", "", `<ul class="rounded-b-[2px] border border-erp-thead-line bg-white">${fileRow(...png, true)}${fileRow(...pdf, false)}</ul>`, { pad: false });

// 처리이력 — 열 이름 줄 없음, 단계 칸 100px 왼쪽 정렬 회색 500(위 「문의자」 라벨 칸과 세로줄을 맞춘다)
const steps = (rows) =>
  `<table class="w-full table-fixed border-collapse border border-erp-thead-line text-[14px]"><colgroup><col class="w-[100px]"><col><col class="w-[80px]"></colgroup><tbody class="text-erp-ink">${rows
    .map(
      ([t, meta, done]) =>
        `<tr class="h-[46px] border-b border-erp-thead-line"><td class="truncate px-[10px] text-left"><span class="pl-[2px] font-medium text-erp-label">${t}</span></td><td class="truncate px-[10px] text-left">${meta}</td><td class="px-[10px] text-center">${done ? ui.badge("on", "완료") : ui.badge("off", "대기")}</td></tr>`,
    )
    .join("")}</tbody></table>`;
const replyLines = (lines) =>
  `<span class="flex flex-col py-[12px] leading-[1.6]">${lines
    .map(([kind, text]) => `<span class="flex min-w-0 items-center gap-[10px]"><span class="shrink-0 text-erp-label">${kind}</span>${DIVIDER}<span class="truncate">${text}</span></span>`)
    .join("")}</span>`;

// 문의자 「점포」 도움말 — 작은 표(앱 STORE_HELP)
const STORE_HELP = `<table class="border-collapse text-[13px] leading-[1.5] whitespace-nowrap"><thead><tr class="text-erp-label"><th class="pr-[12px] pb-[4px] text-left font-medium">권한유형</th><th class="pr-[12px] pb-[4px] text-left font-medium">대상점포</th><th class="pb-[4px] text-left font-medium">점포</th></tr></thead><tbody class="font-normal">${[
  ["가맹마스터 · 가맹관리자", "1곳", "그 점포"],
  ["가맹마스터 · 가맹관리자", "여러 곳", "BP 단위 문의"],
  ["BP 마스터 · BP 관리자", "-", "BP 단위 문의"],
]
  .map(([r, n, s]) => `<tr class="border-t border-erp-thead-line"><td class="py-[4px] pr-[12px]">${r}</td><td class="py-[4px] pr-[12px]">${n}</td><td class="py-[4px]">${s}</td></tr>`)
  .join("")}</tbody></table>`;
const sender = ([name, bp, role]) =>
  ui
    .detailTable("문의자", [
      ["이름", name],
      ["BP상호명", bp],
      ["권한유형", role],
      [`<span class="flex min-w-0 items-center gap-[4px]"><span class="truncate">점포</span>${floatingHelpTip(STORE_HELP, "점포")}</span>`, p.sub("BP 단위 문의")],
    ])
    .replaceAll("w-[110px]", "w-[100px]");

// 목록(community-sections)의 행과 같은 건을 그린다. 처리중 = 주휴수당, 접수 = KIOSK, 답변 완료 = 가맹점 초대 메일(BP 쪽 내 문의 상세 inquiry-mine 과 같은 건).
const CASES = {
  wait: {
    title: "파트타이머 주휴수당이 계산되지 않습니다", category: "직원·근로", at: "2026-09-04 10:32", status: "IN_PROGRESS",
    body: "파트타이머 배정숙 직원의 9월 급여명세서를 만들었는데 주휴수당이 0원으로 나옵니다. 주 15시간 넘게 일했고 출퇴근 기록도 다 있는데 왜 안 잡히는지 모르겠습니다. 확인 부탁드립니다.",
    files: [["주휴수당_0원_화면.png", "412 KB"], ["9월_급여명세서_배정숙.pdf", "1.2 MB"]],
    sender: ["정하윤", "㈜한강상회", "BP 마스터"], processing: "2026-09-04 11:15 · 이서준",
    memo: "계약서에 소정근로시간이 주 14시간으로 들어가 있음. 실제 근무는 16시간대.\n계약을 새로 써야 주휴가 잡힘 — 개발팀 확인 완료. 답변에는 계약 수정 절차만 안내할 것.",
  },
  received: {
    title: "KIOSK 구독을 늘리고 싶습니다", category: "요금·구독", at: "2026-09-02 16:48", status: "RECEIVED",
    body: "지금 KIOSK 1대를 쓰고 있는데 2호점 오픈에 맞춰 1대를 더 늘리고 싶습니다. 구독을 어디서 바꾸는지, 요금은 언제부터 붙는지 알려 주세요.",
    files: null, sender: ["배정숙", "온기식당", "BP 마스터"], processing: null, memo: "",
  },
  done: {
    title: "가맹점 초대 메일이 반송됩니다", category: "점포·설비", at: "2026-08-30 16:12", status: "ANSWERED",
    body: "점포관리에서 가맹점 두 곳에 초대 메일을 보냈는데 둘 다 반송됩니다. 주소는 맞게 넣었고, 같은 주소로 제가 직접 보내면 잘 갑니다. 반송 사유가 “발신 도메인 인증 실패”라고 나옵니다.",
    files: [["반송_메일_화면.png", "286 KB"], ["반송_사유_원문.pdf", "96 KB"]],
    sender: ["정하윤", "㈜한강상회", "BP 마스터"], processing: "2026-08-31 09:12 · 이서준",
    memo: "가맹점 메일 서버가 발신 도메인 검증을 새로 켬. 발신 도메인 인증(SPF · DKIM) 갱신 완료 — 효준 확인.",
    answer: "원인이 확인되어 조치했습니다. 가맹점 메일 서버가 발신 도메인 검증을 새로 켜면서 반송된 것으로, 발신 도메인 인증 설정을 갱신했습니다. 점포관리에서 초대 다시 보내기를 눌러 주세요.",
    // 답변 이력 — 오래된 것부터 [일시, 운영자, 본문]. 첫 줄이 등록, 나머지가 수정
    replies: [
      ["2026-08-31 09:40", "이서준", "발신 도메인 인증 설정을 갱신했습니다. 초대를 다시 보내 주세요."],
      ["2026-09-02 11:05", "김하린", null],
    ],
  },
};

export const render = ({ A, R }, state = "wait") => {
  const done = state === "done";
  const received = state === "received";
  const c = CASES[state];
  const first = done && c.replies[0];
  const last = done && c.replies.at(-1);
  const prevAnswer = done
    ? `<details class="group rounded-[2px] border border-erp-panel-line"><summary class="flex h-[34px] cursor-pointer items-center gap-[10px] bg-erp-thead-bg px-[12px] text-[14px] font-medium text-erp-ink transition-colors duration-150 hover:bg-erp-subtle [&::-webkit-details-marker]:hidden"><span class="flex-1">이전 답변 1개</span>${ui.img(
        A,
        "chevron-small.svg",
        5,
        8,
        "-rotate-90 transition-transform duration-150 group-open:rotate-90",
      )}</summary><div class="flex flex-col gap-[12px] border-t border-erp-panel-line p-[12px]"><p class="text-[14px] text-erp-label">${first[0]} · ${first[1]}</p>${prose(first[2])}</div></details>`
    : "";
  const answerBody = done
    ? prose(c.answer) + prevAnswer + `<div class="flex items-center justify-end gap-[6px]">${ui.button("답변 수정", { variant: "soft" })}</div>`
    : active(ui.textarea({ rows: 6, placeholder: "문의자가 확인할 답변을 작성해 주세요.\n문제 해결 방법이나 필요한 조치를 구체적으로 안내해 주세요.", "aria-label": "답변 내용" })) +
      spread(guide("답변을 저장하면 처리 상태가 '답변완료'로 변경되며, 문의자에게 알림함과 이메일로 안내됩니다."), ui.button("답변 저장"));
  const left =
    box("문의내용", "", prose(c.body)) +
    (c.files ? files(c.files) : "") +
    box("답변", done ? `${first[1]} · 등록 ${first[0]} (수정됨 ${last[0]} · ${last[1]})` : "문의자에게 표시됩니다.", answerBody, { left: done }) +
    box(
      "운영자 메모",
      "운영자에게만 표시됩니다.",
      active(ui.textarea({ rows: 4, value: c.memo, "aria-label": "내부 기록" })) +
        spread(guide("작성한 메모는 다른 운영자와 공유됩니다. 내용을 모두 지우고 저장하면 메모가 삭제됩니다."), ui.button("메모 저장", { variant: "soft" })),
    );

  const right =
    sender(c.sender) +
    box(
      "처리이력",
      "",
      steps([
        ["접수", c.at, true],
        // 「확인」 줄은 처리중을 거친 건만 완료로 그린다. 처리 시작 없이 바로 답했으면 api 가 processingStartedAt 을 null 로 주므로 이 줄을 숨긴다.
        received ? ["확인", pending("[처리 시작]을 누르면 문의자에게 처리중으로 표시됩니다."), false] : ["확인", c.processing, true],
        done
          ? ["답변", replyLines(c.replies.map(([at, by], i) => [i === 0 ? "등록" : "수정", `${at} · ${by}`])), true]
          : ["답변", pending("답변을 저장하면 문의자에게 답변완료로 표시됩니다."), false],
      ]),
      { pad: false },
    );

  // 머리 줄 — 점포 정보 관리 상세의 점포명 줄과 같은 모양(제목 20px, 아래 줄 「접수일시 … | 분류 [꼬리표] | [상태]」), [처리 시작] [목록] 오른쪽
  const head = `<div class="flex items-center gap-[18px]"><div class="flex min-w-0 flex-1 flex-col gap-[6px] py-[6px]"><h2 class="break-all text-[20px] font-semibold text-erp-ink">${c.title}</h2><div class="flex flex-wrap items-center gap-[10px] text-[14px] font-medium text-erp-label"><span>접수일시 ${c.at}</span>${DIVIDER}<span class="flex items-center gap-[6px]">분류 ${TAG(c.category)}</span>${DIVIDER}${STATUS[c.status]}</div></div><div class="flex items-center gap-[6px]">${received ? ui.button("처리 시작", { variant: "soft" }) : ""}${ui.button("목록", { href: link(R, "support/community-asks.html") })}</div></div>`;

  return {
    title: "문의사항 상세",
    html: ui.erpFrame({
      header: platformHeader(A, R),
      title: "문의사항",
      body: ui.detailBody(head + p.cols(left, right)),
    }),
  };
};
export default (ctx) => render(ctx);
