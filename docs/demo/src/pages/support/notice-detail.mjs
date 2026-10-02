// 공지사항 상세(BP 사용자 쪽). 목업 docs/mockup/support/notice-detail.html 을 BP 마스터로 본 것. 제목·본문·첨부·이전 다음만 있다.
import * as ui from "../../ui.mjs";
import * as p from "../../staff-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const L = (path) => link(R, path);
  // 직원 상세와 같은 틀: 첫 줄 「공지사항 상세」 + 목록, 공지는 머리 칸(제목 · 게시일·작성)이 있는 상자 안에(2026-10-02 재영).
  const head = p.detailHead("공지사항 상세", ui.button("목록", { href: L("support/notices.html") }));
  const text = `<div class="flex flex-col gap-[12px] text-[14px] leading-[1.7] text-erp-ink">${[
    "9월 14일(일) 새벽 2시부터 5시까지 정기 점검이 있습니다.",
    "점검 시간에는 관리자 웹과 직원 근무 앱을 모두 사용할 수 없습니다. 직원 근무 앱의 출퇴근 등록은 점검 중에도 기기에 기록되고 점검이 끝나면 자동으로 반영됩니다.",
    "점검이 일찍 끝나면 공지 없이 서비스를 재개합니다.",
  ]
    .map((t) => `<p>${t}</p>`)
    .join("")}</div>`;
  const files = ui.detailTable("첨부파일", [["파일", ui.detailValues([ui.link("점검_안내_2026-09.pdf", "#"), `<span class="text-erp-label">184 KB</span>`])]]);
  const nav = ui.detailTable("이전 · 다음", [
    ["이전", ui.detailValues([ui.link("근로계약 전자날인 기능이 열렸습니다", L("support/notice-detail.html")), `<span class="text-erp-label">09-01</span>`])],
    ["다음", p.sub("가장 최근 공지입니다")],
  ]);
  const notice = p.box("9월 정기 점검 안내 (09-14 02:00~05:00)", `<span class="text-[13px] text-erp-label">2026-09-05 · WHALE ERP 운영팀</span>`, text, { pad: true });
  const body = ui.detailBody(`${head}${notice}${files}${nav}`);
  return { title: "공지사항", html: ui.erpFrame({ header: erpHeader(A, R), title: "공지사항", body }) };
};
