// 급여명세서 관리 — 헤더 메뉴 직원관리 › 급여명세서 관리.
import * as ui from "../../ui.mjs";
import { staffSections } from "../../staff-sections.mjs";
import { erpHeader } from "../../site.mjs";

export default ({ A, R }) => {
  const s = staffSections({ A, R });
  return {
    title: "급여명세서 관리",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "급여명세서 관리",
      titleRight: "",
      body: ui.detailBody(s.payrollTab),
      panels: "",
    }),
  };
};
