// 공지사항 · FAQ 수정 화면 공용 조각(앱 src/components/community/post-form.tsx, 2026-11-06 사용자 지정).
import * as ui from "./ui.mjs";

export const REQ = '<span aria-hidden="true" class="ml-[2px] text-[#e93737]">*</span>';
// 꼬리표(앱 공통 Tag)
export const tag = (text) => `<span class="inline-block rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[4px] py-px text-[14px] font-medium whitespace-nowrap text-erp-sub">${text}</span>`;
// 제목 줄 없는 상자 — 칸 묶음 사이 24px(18px 은 답답했다, 2026-11-06 사용자 지정). 칸 이름은 16px 500 먹색(앱 Label strong)
export const bare = (body) =>
  `<section class="min-w-0"><div class="flex flex-col gap-[24px] rounded-[2px] border border-erp-thead-line bg-white p-[16px]">${body.replaceAll("text-[14px] font-medium text-erp-label", "text-[16px] font-medium text-erp-ink")}</div></section>`;
// 제목 줄 있는 상자(변경이력)
export const titled = (title, body) =>
  `<section class="min-w-0"><h3 class="flex h-[42px] items-center rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px] text-[16px] font-medium text-erp-ink">${title}</h3><div class="flex flex-col gap-[24px] rounded-b-[2px] border border-erp-thead-line bg-white p-[16px]">${body}</div></section>`;
export const note = (html) => `<p class="text-[14px] leading-[1.6] text-erp-label">${html}</p>`;
export const name = (text, required = false) => `<span class="flex items-center text-[16px] font-medium text-erp-ink">${text}${required ? REQ : ""}</span>`;
export const group = (body) => `<div class="flex flex-col gap-[8px]">${body}</div>`;

// 노출 대상 표 — 이름 칸 110px(체크 상자 + 굵은 이름) · 설명 칸, 줄 46px, 15px(2026-11-06 사용자 지정).
// 회원을 찍으면 BP · 점포도 찍히고, 회원을 풀면 함께 풀리며, 회원이 찍힌 채 하나를 풀면 회원도 풀린다. BP · 점포를 모두 찍으면 회원도 찍힌다.
const AUD = [
  ["비회원", "로그인전 홈화면"],
  ["회원", "<u>BP · 점포 포함</u> 로그인한 모든 사용자"],
  ["BP", "BP마스터, BP관리자"],
  ["점포", "가맹마스터, 가맹관리자"],
];
export const audiences = (A, checked) =>
  bare(
    group(
      name("노출 대상", true) +
        `<table class="w-full table-fixed border-collapse text-[15px]"><colgroup><col class="w-[110px]"><col></colgroup><tbody>${AUD.map(
          ([label, hint], i) =>
            `<tr class="h-[46px] border border-erp-thead-line"><th scope="row" class="border-r border-erp-thead-line bg-erp-thead-bg px-[12px] text-left font-semibold text-erp-ink">${ui.checkbox(A, `<span class="text-[15px] font-semibold">${label}</span>`, checked[i])}</th><td class="px-[12px] text-erp-label">${hint}</td></tr>`,
        ).join("")}</tbody></table>`,
    ),
  );

// 변경이력 두 줄 — 「등록 | 시각」, 「최종수정 | 시각 · 수정자 [상태]」. 이름 칸 56px · #d9d9d9 구분선. 게시만 파랑 배지, 임시저장 · 비공개는 꼬리표
const line = (label, body) =>
  `<p class="flex min-w-0 items-center gap-[10px] text-[14px] leading-[1.6] text-erp-ink"><span class="w-[56px] shrink-0 text-erp-label">${label}</span><span aria-hidden="true" class="h-[11px] w-px shrink-0 bg-[#d9d9d9]"></span><span class="flex min-w-0 items-center gap-[8px]">${body}</span></p>`;
export const history = (created, updated, by, published = true) =>
  titled("변경이력", `<div class="flex flex-col gap-[6px]">${line("등록", created)}${line("최종수정", `${updated} · ${by} ${published ? ui.badge("on", "게시") : tag("임시저장")}`)}</div>`);

// 첨부파일 칸(앱 공통 AttachmentField): [파일 선택] · 안내 · 목록(34px 줄 · 이름 · 크기 · 「빼기」, 그림은 64px 둥근 썸네일) · 올리지 않은 파일 「└ 까닭」
const thumb = `<span class="grid size-[64px] shrink-0 place-items-center rounded-[8px] border border-erp-panel-line bg-erp-thead-bg text-[12px] text-erp-label">PNG</span>`;
const row = (name, size, image = false) =>
  `<li class="flex items-center gap-[10px] border-b border-erp-divider ${image ? "py-[12px]" : "h-[34px]"}"><span class="flex min-w-0 flex-1 items-center gap-[10px]">${image ? thumb : ""}<span class="truncate text-erp-link hover:underline">${name}</span></span><span class="text-erp-label">${size}</span><button type="button" class="text-erp-link hover:underline">빼기</button></li>`;
const rejected = (name, reason) =>
  `<li role="status" class="flex flex-col justify-center gap-[2px] border-b border-erp-divider py-[6px] leading-[1.6] break-keep"><p class="break-all text-erp-ink">${name}</p><p class="flex gap-[4px] pl-[6px] text-erp-off"><span aria-hidden="true" class="text-erp-muted">└</span><span>${reason}</span></p></li>`;
export const attachments = (files, reject) =>
  group(
    `<span class="flex items-center text-[16px] font-medium text-erp-ink">첨부파일 <span class="ml-[6px] text-[12px] font-normal text-erp-muted">${files.length} / 5</span></span>` +
      `<div>${ui.button("파일 선택", { variant: "soft" })}</div>` +
      note('JPG, PNG, PDF 파일을 최대 5개까지 첨부할 수 있습니다. <span class="whitespace-nowrap">(파일당 10MB 이하)</span>') +
      `<ul aria-label="첨부파일" class="text-[14px]">${files.map(([n, s, img]) => row(n, s, img)).join("")}${reject ? rejected(...reject) : ""}</ul>`,
  );

// 칸 이름 줄 오른쪽 값의 출처 — 「공통코드 그룹 [FAQ_CATEGORY]」(문의사항 상세 머리 줄과 같은 모양)
export const source = (title, value) => `<span class="ml-auto flex items-center gap-[6px] pl-[10px] text-erp-label text-[14px] font-medium">${title} ${tag(value)}</span>`;
