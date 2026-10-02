// 근무스케줄 관리 — 헤더 메뉴 직원관리 › 근무스케줄 관리.
import * as ui from "../../ui.mjs";
import { staffSections } from "../../staff-sections.mjs";
import { erpHeader } from "../../site.mjs";

export default ({ A, R }) => {
  const s = staffSections({ A, R });
  return {
    title: "근무스케줄 관리",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "근무스케줄 관리",
      titleRight: "",
      body: ui.detailBody(s.schedTab),
      panels: s.schedForm + s.delDialog,
    }),
  };
};
