// FAQ 수정. 목업 docs/mockup/support/notice-edit.html 의 FAQ 종류를 플랫폼 관리자로 본 것(공지사항 수정과 나눴다, 2026-10-02 재영).
// 목업대로 FAQ 에는 상단 고정 · 게시 기간 · 첨부가 없다. 제목·본문 자리는 질문·답변, 목록의 카테고리를 여기서 정한다.
// 배치는 앱 post-form.tsx 와 같다(2026-11-06 사용자 지정): 왼쪽 상자(카테고리 · 질문 · 답변), 오른쪽 노출 대상 상자 → 변경이력.
import * as ui from "../../ui.mjs";
import * as p from "../../staff-parts.mjs";
import * as q from "../../post-parts.mjs";
import { platformHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  // 카테고리는 공통코드 FAQ_CATEGORY 의 사용 중인 것만 — 칸 이름 줄 오른쪽에 출처 「공통코드 그룹 [FAQ_CATEGORY]」(2026-11-06 사용자 지정)
  const category = q.group(`<span class="flex items-center text-[16px] font-medium text-erp-ink">카테고리${q.REQ}${q.source("공통코드 그룹", "FAQ_CATEGORY")}</span>${ui.select(["가입·계정", "직원·근로", "요금·구독", "점포·설비"], { value: "직원·근로" })}`);
  const content = q.bare(
    category +
      ui.field(`질문${q.REQ} <span class="ml-[6px] text-[12px] font-normal text-erp-muted">27 / 200</span>`, ui.textField({ value: "근로계약서를 보냈는데 직원이 못 받았다고 합니다" })) +
      ui.field(
        `답변${q.REQ}`,
        ui.textarea({
          rows: 10,
          value: "계약 상세에서 발송 이력을 먼저 확인하세요. 직원이 아직 가입하지 않았다면 상태가 서명 요청 전으로 남고, 가입이 끝나는 순간 자동으로 발송됩니다.",
        }),
      ),
  );

  const targets = q.audiences(A, [false, false, true, false]);
  // 변경 이력 표는 두지 않는다 — 등록 시각과 마지막 수정만 남긴다(WHALEERP-272).
  const history = q.history("2026-09-03 09:40", "2026-09-03 10:20", "이서준");

  // 사용 중지된 카테고리의 FAQ 는 게시하거나 내용을 고칠 때 카테고리를 바꿔야 한다(비공개 · 삭제는 그대로 된다).
  const list = link(R, "support/community-faq.html");
  const right = `<div class="flex items-center gap-[6px]">${ui.button("목록", { href: list })}${ui.button("삭제", { variant: "soft" })}${ui.button("비공개", { variant: "soft", "data-toast": "비공개로 변경했습니다." })}${ui.button("임시저장", { variant: "soft", "data-toast": "임시저장했습니다." })}${ui.button("게시", { "data-toast": "게시했습니다." })}</div>`;

  return {
    title: "FAQ 수정",
    html: ui.erpFrame({ header: platformHeader(A, R), title: "FAQ", body: ui.detailBody(p.detailHead("FAQ 수정", right) + p.cols(content, targets + history)) }),
  };
};
