// 공지사항 상세(BP 사용자 쪽). 목업 docs/mockup/support/notice-detail.html 을 BP 마스터로 본 것. 제목·본문·첨부·이전 다음만 있다.
import * as ui from "../../ui.mjs";
import * as p from "../../staff-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

const tag = (text) => `<span class="inline-block rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[4px] py-px text-[14px] font-medium whitespace-nowrap text-erp-sub">${text}</span>`;
// #d9d9d9 — DESIGN.md 의 값 구분선
const bar = `<span aria-hidden="true" class="h-[11px] w-px shrink-0 bg-[#d9d9d9]"></span>`;

export default ({ A, R }) => {
  const L = (path) => link(R, path);
  // 머리 줄 — 「공지사항 상세」 대신 공지 제목(20px), 아래 줄에 「구분 [꼬리표]」 | 「게시일 [꼬리표]」(앱 support-detail.tsx, 2026-11-06 사용자 지정)
  const head = `<div class="flex items-center gap-[18px]"><div class="flex min-w-0 flex-1 flex-col gap-[8px] py-[6px]"><h2 class="break-all text-[20px] font-semibold text-erp-ink">9월 정기 점검 안내 (09-14 02:00~05:00)</h2><div class="flex items-center gap-[10px] text-[14px] font-medium text-erp-label"><span class="flex items-center gap-[6px]">구분 ${tag("점검")}</span>${bar}<span class="flex items-center gap-[6px]">게시일 ${tag("2026-09-05")}</span></div></div>${ui.button("목록", { href: L("support/notices.html") })}</div>`;
  // 본문은 제목 줄 없는 테두리 상자에 바로, 15px(2026-11-06 사용자 지정)
  const text = `<div class="flex flex-col gap-[12px] rounded-[2px] border border-erp-thead-line bg-white p-[16px] text-[15px] leading-[1.7] text-erp-ink">${[
    "9월 14일(일) 새벽 2시부터 5시까지 정기 점검이 있습니다.",
    "점검 시간에는 관리자 웹과 직원 근무 앱을 모두 사용할 수 없습니다. 직원 근무 앱의 출퇴근 등록은 점검 중에도 기기에 기록되고 점검이 끝나면 자동으로 반영됩니다.",
    "점검이 일찍 끝나면 공지 없이 서비스를 재개합니다.",
  ]
    .map((t) => `<p>${t}</p>`)
    .join("")}</div>`;
  // 첨부 — 문의 상세 첨부와 같은 목록: 그림은 64px 둥근 썸네일, PDF 는 이름 + 크기(앱 support-detail.tsx, 2026-11-06 사용자 지정 — 전엔 「파일 | 이름 크기」 상세 표)
  const thumb = `<span class="grid size-[64px] shrink-0 place-items-center rounded-[8px] border border-erp-panel-line bg-erp-thead-bg text-[12px] text-erp-label">PNG</span>`;
  const fileRow = (name, size, image = false) =>
    `<li class="flex items-center gap-[10px] border-b border-erp-thead-line px-[12px] last:border-b-0 ${image ? "py-[12px]" : "h-[46px]"}">${image ? thumb : ""}${ui.link(name, "#")}<span class="text-erp-label">${size}</span></li>`;
  const files = p.box("첨부파일", "", `<ul class="rounded-b-[2px] border border-erp-thead-line bg-white">${fileRow("점검_시간표.png", "212KB", true)}${fileRow("점검_안내_2026-09.pdf", "184KB")}</ul>`);
  // 이전 · 다음 — 상세 표와 같은 선 · 46px · 라벨 110px 이되 본문과 같은 15px, 제목 링크와 게시일 사이 구분선(2026-11-06 사용자 지정)
  const navRow = (label, value) =>
    `<div class="flex h-[46px] border-b border-erp-thead-line last:border-b-0"><dt class="flex w-[110px] shrink-0 items-center px-[12px] font-medium text-erp-label">${label}</dt><dd class="flex min-w-0 flex-1 items-center px-[12px] text-erp-ink">${value}</dd></div>`;
  const nav = p.box(
    "이전 · 다음",
    "",
    `<dl class="rounded-b-[2px] border border-erp-thead-line bg-white text-[15px]">${navRow("이전", `<span class="flex min-w-0 items-center gap-[10px]">${ui.link("근로계약 전자날인 기능이 열렸습니다", L("support/notice-detail.html"))}${bar}<span class="shrink-0 text-erp-label">2026-09-01</span></span>`)}${navRow("다음", `<span class="text-erp-muted">목록의 맨 위 공지입니다.</span>`)}</dl>`,
  );
  const body = ui.detailBody(`${head}${text}${files}${nav}`);
  return { title: "공지사항", html: ui.erpFrame({ header: erpHeader(A, R), title: "공지사항", body }) };
};
