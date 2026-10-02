// 직원 정보 관리 — 헤더 메뉴 직원관리 › 직원 정보 관리.
import * as ui from "../../ui.mjs";
import { staffSections } from "../../staff-sections.mjs";
import { erpHeader } from "../../site.mjs";

export default ({ A, R }) => {
  const s = staffSections({ A, R });
  return {
    title: "직원 정보 관리",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "직원 정보 관리",
      titleRight: `<div class="flex gap-[6px]">${ui.slideTrigger("가입 연결 확인 1", s.holdPanel, "soft")}${ui.button("계약서 작성", { href: s.N })}</div>`,
      body: ui.listBody(s.listFilter, s.listTab),
      panels: s.holdForm,
    }),
  };
};
