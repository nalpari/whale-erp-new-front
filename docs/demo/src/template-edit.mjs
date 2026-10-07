// 알림 템플릿 수정 화면(목업 docs/mockup/notify/templates-edit.html). 플랫폼 운영자 전용.
// 템플릿 하나는 알림 유형(또는 발송 용도) × 채널 한 칸이라, 채널마다 미리보기 모양이 다르다.
// 목업은 예시를 탭으로 오갔지만 데모는 상태 시연을 두지 않으므로 채널마다 한 장씩 만든다(notify/templates-edit*.mjs).
// 제목·본문 필수(2026-10-07 재영). 앱 푸시 글자 수는 NOTIFY-4 미정이라 목업 가정(제목 40·본문 100)으로 센다.
// 메일 본문은 NOTIFY-5 미정이라 목업 가정(일반 글 + 공통 메일 틀)으로 그린다.
// 변수 단추 삽입(data-insert-var)과 글자 수(data-count)는 erp.js.
import * as ui from "./ui.mjs";
import * as p from "./staff-parts.mjs";
import { req } from "./biz-form.mjs";
import { platformHeader, link } from "./site.mjs";

const box = (title, right, body) => p.box(title, right, `<div class="flex flex-col gap-[18px]">${body}</div>`, { pad: true });

// 채널별 미리보기. 새 회색을 만들지 않고 흰 바탕·#f8f9fb 바탕·1px 선으로만 나눈다.
const inboxLine = (title, sub) =>
  `<div class="flex flex-col gap-[4px] rounded-[2px] border border-erp-panel-line bg-white px-[16px] py-[12px]"><b class="text-[14px] font-semibold text-erp-ink">${title}</b><span class="text-[12px] text-erp-muted">${sub}</span></div>`;
const caption = (t) => `<span class="text-[13px] font-medium text-erp-label">${t}</span>`;
const PREVIEW = {
  ops: (v) => caption("관리자 웹 운영 알림함 한 줄") + inboxLine(v.title, v.sub),
  mail: (v) =>
    caption("메일 · 공통 메일 틀") +
    `<div class="overflow-hidden rounded-[2px] border border-erp-panel-line bg-white"><div class="border-b border-erp-panel-line px-[16px] py-[12px] text-[14px] font-semibold text-erp-ink">${v.title}</div><div class="flex flex-col gap-[16px] px-[16px] py-[16px] text-[14px] leading-[1.7] text-erp-ink"><p class="whitespace-pre-line">${v.body}</p><span>${ui.button(v.button)}</span></div><div class="border-t border-erp-panel-line bg-erp-thead-bg px-[16px] py-[12px] text-[12px] text-erp-muted">WHALE ERP 운영 알림 · 이 메일은 발신 전용입니다</div></div>`,
  push: (v) =>
    caption("잠금 화면 푸시") +
    `<div class="grid grid-cols-[28px_1fr] gap-x-[12px] gap-y-[4px] rounded-[8px] border border-erp-panel-line bg-erp-thead-bg px-[16px] py-[12px]"><span class="row-span-2 size-[28px] rounded-[2px] bg-erp-nav" aria-hidden="true"></span><b class="text-[14px] font-semibold text-erp-ink">${v.title}</b><span class="text-[14px] leading-[1.5] text-erp-ink">${v.body}</span></div>` +
    caption("직원 근무 앱 알림함 한 줄") +
    inboxLine(v.title, v.sub),
  inbox: (v) => caption("직원 근무 앱 알림함 한 줄") + inboxLine(v.title, v.sub),
  // 카카오 알림톡 말풍선. 대화창 바탕은 #f8f9fb, 머리 띠는 연한 파랑 바탕(상태 배지의 바탕 토큰)으로 나눈다.
  talk: (v) =>
    caption("카카오 알림톡") +
    `<div class="rounded-[4px] bg-erp-thead-bg p-[16px]"><div class="max-w-[300px] overflow-hidden rounded-[8px] border border-erp-panel-line bg-white"><div class="bg-erp-on-bg px-[12px] py-[8px] text-[12px] font-semibold text-erp-ink">알림톡 도착</div><p class="whitespace-pre-line px-[12px] py-[12px] text-[14px] leading-[1.6] text-erp-ink">${v.body}</p><div class="mx-[12px] mb-[12px] rounded-[2px] border border-erp-button-line py-[8px] text-center text-[13px] text-erp-ink">${v.button}</div></div></div>`,
};

// t: { kind, type, channel, to, title, body, vars, preview: { title, body, sub, button }, count, history, code, notice }
// title 을 비우면(알림톡) 제목 칸을 그리지 않는다. code 는 카카오 템플릿 코드(읽기 전용), notice 는 본문 위 안내 한 줄.
export function templateEdit(t) {
  return ({ A, R }) => {
    const bodyId = ui.uid("tpl-body");
    const titleId = ui.uid("tpl-title");
    const counted = (id, max) => (t.count ? ` <span class="text-[12px] font-normal text-erp-muted" data-count="${id}" data-max="${max}"></span>` : "");
    const vars = t.vars
      .map((v) => ui.button(v, { variant: "off", "data-insert-var": `#{${v}}`, "data-target": bodyId }))
      .join("");

    const info = ui.detailTable("템플릿", [
      [t.kind === "talk" ? "발송 용도" : "알림 유형", t.type],
      ["채널", t.channel],
      ["받는 사람", t.to],
      ...(t.code ? [["카카오 템플릿 코드", t.code]] : []),
    ]);
    const form = box(
      "문구",
      "",
      (t.title ? ui.field(req("제목") + counted(titleId, 40), ui.textField({ id: titleId, value: t.title })) : "") +
        (t.notice ? p.note(t.notice) : "") +
        ui.field(req("본문") + counted(bodyId, 100), ui.textarea({ id: bodyId, rows: t.kind === "mail" ? 8 : 4, value: t.body })) +
        `<div class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">변수</span><div class="flex flex-wrap gap-[6px]">${vars}</div>${p.help(t.kind === "talk" ? "누르면 본문 커서 자리에 들어갑니다. 변수 목록은 카카오에 등록된 것이라 고칠 수 없습니다." : "누르면 본문 커서 자리에 들어갑니다.")}</div>`,
    );
    const preview = box("미리보기", "", PREVIEW[t.kind](t.preview));
    const history = p.box(
      "변경 이력",
      "",
      ui.dataTable([{ header: "일시", width: "w-[120px]" }, { header: "수정자", width: "w-[90px]" }, { header: "내용", align: "left" }], t.history),
    );

    const list = link(R, "notify/templates.html");
    const right = `<div class="flex items-center gap-[6px]">${ui.button("목록", { variant: "off", href: list })}${p.ask(
      "기본 문구로 되돌리기",
      "soft",
      "기본 문구로 되돌리시겠습니까?",
      "처음 배포된 제목과 본문으로 바뀝니다. 되돌린 것도 변경 이력에 남습니다.",
      "되돌리기",
    )}${p.ask("저장", "primary", "저장하시겠습니까?", "", "저장")}</div>`;

    return {
      title: `알림 템플릿 수정 · ${t.channel}`,
      html: ui.erpFrame({
        header: platformHeader(A, R),
        title: "알림 템플릿 관리",
        body: ui.detailBody(p.detailHead("알림 템플릿 수정", right) + info + p.cols(form, preview + history)),
      }),
    };
  };
}
