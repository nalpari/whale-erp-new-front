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

  // 변경 이력 표는 두지 않는다 — 마지막 수정자 · 수정 시각만 남긴다(WHALEERP-272). 게시 기간 · 상단 고정 · 유형은 공지에만 있다.
  const history = box("최근 수정", "",
    `<p class="text-[14px] text-erp-ink">2026-09-03 10:20 · 이서준</p><p class="text-[14px] leading-[1.6] text-erp-label">둘이 동시에 고치면 나중 저장이 막히고(409) 최신 내용을 다시 불러옵니다.</p>`,
  );

  // 카테고리는 공통코드 FAQ_CATEGORY 의 사용 중인 것만. 사용 중지된 카테고리의 FAQ 는 게시하거나 내용을 고칠 때 카테고리를 바꿔야 한다(비공개 · 삭제는 그대로 된다).
  const list = link(R, "support/community-faq.html");
  const right = `<div class="flex items-center gap-[6px]">${ui.button("목록", { variant: "off", href: list })}${ui.button("삭제", { variant: "soft" })}${ui.button("비공개", { variant: "soft" })}${ui.button("임시저장", { variant: "soft" })}${ui.button("게시", { href: list })}</div>`;

  return {
    title: "FAQ 수정",
    html: ui.erpFrame({ header: platformHeader(A, R), title: "FAQ", body: ui.detailBody(p.detailHead("FAQ 수정", right) + p.cols(content, targets + history)) }),
  };
};
