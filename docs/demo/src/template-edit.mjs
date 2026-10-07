// 알림 템플릿 수정·등록 화면(목업 docs/mockup/notify/templates-edit.html · templates-new.html). 플랫폼 운영자 전용.
// 등록한 것과 기본 37건 모두 모든 항목을 고친다(NOTIFY-10, 2026-10-07 재영): 채널·유형·템플릿 코드·카카오 템플릿 코드·변수 목록·사용 여부.
// 템플릿 하나는 알림 유형(또는 발송 용도) × 채널 한 칸이라, 채널마다 미리보기 모양이 다르다.
// 목업은 예시를 탭으로 오갔지만 데모는 상태 시연을 두지 않으므로 채널마다 한 장씩 만든다(notify/templates-edit*.mjs).
// 제목·본문 필수(2026-10-07 재영). 앱 푸시는 제목 40자·본문 100자이고 넘으면 저장하지 않는다(NOTIFY-4).
// 메일 본문은 일반 글만 쓰고 머리·꼬리·버튼은 공통 메일 틀이 붙인다(NOTIFY-5).
// 변수 단추 삽입·글자 수·변수 목록 편집·저장 전 검사·템플릿 코드 기본값과 바꿈 확인은 erp.js(initTemplateEdit).
import * as ui from "./ui.mjs";
import * as p from "./staff-parts.mjs";
import { req } from "./biz-form.mjs";
import * as x from "./extra.mjs";
import { platformHeader, link } from "./site.mjs";
import { CHANNELS, KINDS } from "./template-codes.mjs";

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

// t: { mode("edit"|"new"), kind, type, channel, to, templateCode, kakaoCode, title, body, vars:[{name,label,required,example}], preview, count, history, notice, base }
// kind 가 talk 면 제목 칸 대신 카카오 템플릿 코드 칸을 둔다. base 는 기본 37건(기본 문구로 되돌리기가 이때만 보인다).
const field = (label, control, w) => ui.field(label, control, w ?? "min-w-px flex-1");

export function templateEdit(t) {
  return ({ A, R }) => {
    const isNew = t.mode === "new";
    const bodyId = ui.uid("tpl-body");
    const titleId = ui.uid("tpl-title");
    const codeDlg = x.dialogId();
    const saveDlg = x.dialogId();
    const counted = (id, max) => (t.count ? ` <span class="text-[12px] font-normal text-erp-muted" data-count="${id}" data-max="${max}"></span>` : "");
    const channelName = t.channel ?? "운영 알림";
    const talk = t.kind === "talk";

    // 템플릿 정보 — 모두 고친다. 등록에서는 채널·유형을 고르면 템플릿 코드 기본값이 채워진다.
    const kindOpts = ["선택", ...KINDS.map(([n, , g]) => `${n} · ${g}`)];
    const kindValue = t.type ? kindOpts.find((o) => o.startsWith(`${t.type} · `)) : "선택";
    const info = box(
      "템플릿",
      x.toggle("사용", t.inUse ?? true),
      ui.formRow(
        field(req("발송 채널"), ui.select(isNew ? ["선택", ...CHANNELS.map((c) => c[0])] : CHANNELS.map((c) => c[0]), { value: isNew ? "선택" : channelName, "data-tpl-channel": true })),
        field(req("알림 유형 · 발송 용도"), ui.select(kindOpts, { value: kindValue, "data-tpl-kind": true })),
      ) +
        ui.formRow(
          p.fieldH(
            req("템플릿 코드"),
            ui.textField({ value: t.templateCode ?? "", "data-tpl-code": true, ...(isNew ? {} : { "data-code-original": t.templateCode, "data-code-dialog": codeDlg }), "aria-label": "템플릿 코드" }),
            isNew ? "채널과 유형을 고르면 「채널 접두 + 코드」로 채워집니다. 바꿀 수 있습니다." : "바꾸면 발송 코드도 함께 바꿔야 할 수 있습니다.",
          ),
          `<div class="min-w-px flex-1" data-tpl-talk${talk ? "" : " hidden"}>${p.fieldH(req("카카오 템플릿 코드"), ui.textField({ value: t.kakaoCode ?? "", "aria-label": "카카오 템플릿 코드" }), "카카오에 등록한 코드입니다.", "w-full")}</div>`,
        ) +
        (t.to ? p.help(`받는 사람 · ${t.to}`) : ""),
    );

    // 변수 목록 — 줄마다 변수 이름·표시 이름·필수·예시 값. 본문 위 변수 단추는 이 목록에서 그린다(erp.js).
    const varRow = (v = {}) =>
      `<tr class="h-[46px] border-b border-erp-thead-line" data-var-row><td class="px-[6px]">${ui.textField({ value: v.name ?? "", "aria-label": "변수 이름", "data-var-name": true })}</td><td class="px-[6px]">${ui.textField({ value: v.label ?? "", "aria-label": "표시 이름" })}</td><td class="px-[6px]"><span class="flex justify-center">${ui.checkbox(A, "", v.required ?? false, { "aria-label": "필수", "data-var-required": true })}</span></td><td class="px-[6px]">${ui.textField({ value: v.example ?? "", "aria-label": "예시 값" })}</td><td class="px-[6px] text-center">${ui.button("삭제", { variant: "off", "data-var-del": true })}</td></tr>`;
    const varTable = `<table class="w-full table-fixed border-collapse border-x border-erp-thead-line text-[14px]"><colgroup><col class="w-[22%]"><col class="w-[22%]"><col class="w-[64px]"><col><col class="w-[84px]"></colgroup><thead><tr class="h-[42px] border-y border-erp-thead-line bg-erp-thead-bg">${["변수 이름", "표시 이름", "필수", "예시 값", ""].map((h) => `<th scope="col" class="px-[10px] font-medium text-erp-thead-text">${h}</th>`).join("")}</tr></thead><tbody data-var-body>${(t.vars ?? []).map(varRow).join("")}</tbody></table><template data-var-template>${varRow()}</template>`;
    const varBox = p.box("변수 목록", ui.button("줄 추가", { variant: "off", "data-var-add": true }), varTable);

    const form = box(
      "문구",
      "",
      `<div data-tpl-errors hidden class="flex flex-col gap-[4px] rounded-[2px] border border-erp-off-bg bg-erp-off-bg px-[16px] py-[12px] text-[14px] leading-[1.6] text-erp-off"></div>` +
        `<div data-tpl-title${talk ? " hidden" : ""}>${ui.field(req("제목") + counted(titleId, 40), ui.textField({ id: titleId, value: t.title ?? "", "data-tpl-check": true }), "w-full")}</div>` +
        (t.notice ? `<div data-tpl-talk${talk ? "" : " hidden"}>${p.note(t.notice)}</div>` : "") +
        ui.field(req("본문") + counted(bodyId, 100), ui.textarea({ id: bodyId, rows: t.kind === "mail" ? 8 : 4, value: t.body ?? "", "data-tpl-check": true, "data-tpl-body": true })) +
        `<div class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">변수</span><div class="flex flex-wrap gap-[6px]" data-var-buttons data-target="${bodyId}"></div>${p.help("누르면 본문 커서 자리에 들어갑니다. 단추는 변수 목록에서 만들어집니다.")}</div>`,
    );
    const preview = t.preview ? box("미리보기", "", PREVIEW[t.kind](t.preview)) : box("미리보기", "", p.help("채널을 고르고 본문을 넣으면 채널 모양으로 보입니다."));
    const history = t.history
      ? p.box("변경 이력", "", ui.dataTable([{ header: "일시", width: "w-[120px]" }, { header: "수정자", width: "w-[90px]" }, { header: "내용", align: "left" }], t.history))
      : "";

    const list = link(R, "notify/templates.html");
    const revert = t.base
      ? p.ask("기본 문구로 되돌리기", "soft", "기본 문구로 되돌리시겠습니까?", "처음 배포된 제목과 본문으로 바뀝니다. 되돌린 것도 변경 이력에 남습니다.", "되돌리기")
      : "";
    // 저장은 먼저 erp.js 가 본문을 검사하고(목록에 없는 변수·빠진 필수 변수), 통과하면 확인창을 연다.
    const save =
      ui.button("저장", { "data-tpl-save": saveDlg, "data-toast": "" }) +
      x.dialog(saveDlg, "저장하시겠습니까?", "", `${ui.button("취소", { variant: "off", "data-close": true })}${ui.button("저장", { "data-close": true })}`);
    const right = `<div class="flex items-center gap-[6px]">${ui.button("목록", { variant: "off", href: list })}${revert}${save}</div>`;
    const codeConfirm = x.dialog(
      codeDlg,
      "템플릿 코드를 바꾸시겠습니까?",
      "발송 코드에서 이 템플릿 코드를 쓰고 있으면 함께 바꿔야 합니다.",
      `${ui.button("되돌리기", { variant: "off", "data-close": true, "data-code-revert": true })}${ui.button("바꾸기", { "data-close": true })}`,
    );
    const prefixes = JSON.stringify(Object.fromEntries(CHANNELS)).replaceAll('"', "&quot;");
    const kinds = JSON.stringify(Object.fromEntries(KINDS.map(([n, c, g]) => [`${n} · ${g}`, c]))).replaceAll('"', "&quot;");

    const heading = isNew ? "알림 템플릿 등록" : "알림 템플릿 수정";
    return {
      title: isNew ? heading : `${heading} · ${channelName}`,
      html: ui.erpFrame({
        header: platformHeader(A, R),
        title: "알림 템플릿 관리",
        body: ui.detailBody(
          `<div class="flex flex-col gap-[24px]" data-tpl-root${isNew ? " data-tpl-new" : ""} data-prefixes="${prefixes}" data-kinds="${kinds}">` +
            p.detailHead(heading, right) +
            p.cols(info + form, preview + varBox + history) +
            codeConfirm +
            `</div>`,
        ),
      }),
    };
  };
}
