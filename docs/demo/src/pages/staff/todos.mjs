// TO-DO 리스트 관리 — 헤더 메뉴 직원관리 › TO-DO 리스트 관리.
import * as ui from "../../ui.mjs";
import { staffSections } from "../../staff-sections.mjs";
import { erpHeader } from "../../site.mjs";

export default ({ A, R }) => {
  const s = staffSections({ A, R });
  return {
    title: "TO-DO 리스트 관리",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "TO-DO 리스트 관리",
      titleRight: "",
      body: ui.detailBody(s.todoTab),
      panels: s.todoForm,
    }),
  };
};
