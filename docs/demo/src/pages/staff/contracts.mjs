// 근로계약 관리 — 헤더 메뉴 직원관리 › 근로계약 관리.
import * as ui from "../../ui.mjs";
import { staffSections } from "../../staff-sections.mjs";
import { erpHeader } from "../../site.mjs";

export default ({ A, R }) => {
  const s = staffSections({ A, R });
  return {
    title: "근로계약 관리",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "근로계약 관리",
      titleRight: ui.button("계약서 작성", { href: s.N }),
      body: ui.detailBody(s.contractsTab),
      panels: "",
    }),
  };
};
