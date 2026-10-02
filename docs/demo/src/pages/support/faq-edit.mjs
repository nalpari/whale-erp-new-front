// FAQ 수정. 목업 docs/mockup/support/notice-edit.html 의 FAQ 종류를 플랫폼 관리자로 본 것(공지사항 수정과 나눴다, 2026-10-02 재영).
// 목업대로 FAQ 에는 상단 고정이 없다. 제목·본문 자리는 질문·답변, 목록의 카테고리를 여기서 정한다.
import * as ui from "../../ui.mjs";
import * as p from "../../staff-parts.mjs";
import { platformHeader, link } from "../../site.mjs";

const box = (title, right, body) => p.box(title, right, `<div class="flex flex-col gap-[18px]">${body}</div>`, { pad: true });
const hint = (text) => `<span class="text-[14px] font-normal text-erp-label">${text}</span>`;

export default ({ A, R }) => {
  const content = box(
    "내용",
    "",
    ui.field("카테고리", ui.select(["가입·계정", "직원·근로", "요금·구독", "점포·설비"], { value: "직원·근로" })) +
      ui.field("질문", ui.textField({ value: "근로계약서를 보냈는데 직원이 못 받았다고 합니다" })) +
      ui.field(
        "답변",
        ui.textarea({
          rows: 10,
          value: "계약 상세에서 발송 이력을 먼저 확인하세요. 직원이 아직 가입하지 않았다면 상태가 발송 대기로 남고, 가입이 끝나는 순간 자동으로 발송됩니다.",
        }),
      ),
  );

  const target = (label, desc, on) => ui.checkbox(A, desc ? `${label} ${hint(`— ${desc}`)}` : label, on);
  const targets = box(
    "노출 대상",
    "",
    `<div class="flex flex-col gap-[12px]">${target("비회원", "", false)}${target("회원", "로그인한 모든 사용자", false)}${target("BP", "사업자 관리자", true)}${target("점포", "점포 단위 관리자", false)}</div>`,
  );

  const history = p.box(
    "변경 이력",
    "",
    ui.dataTable(
      [{ header: "일시", width: "w-[120px]" }, { header: "처리자", width: "w-[90px]" }, { header: "내용", align: "left" }],
      [
        ["09-03 10:20", "이서준", "답변 수정"],
        ["08-20 15:11", "이서준", "작성 · 게시"],
      ],
    ),
  );

  const list = link(R, "support/community-faq.html");
  const right = `<div class="flex items-center gap-[6px]">${ui.button("목록", { variant: "off", href: list })}${ui.button("임시저장", { variant: "soft" })}${ui.button("게시", { href: list })}</div>`;

  return {
    title: "FAQ 수정",
    html: ui.erpFrame({ header: platformHeader(A, R), title: "FAQ", body: ui.detailBody(p.detailHead("FAQ 수정", right) + p.cols(content, targets + history)) }),
  };
};
