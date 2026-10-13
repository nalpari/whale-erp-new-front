// 출·퇴근 현황 조회 — 헤더 메뉴 직원관리 › 출·퇴근 현황 조회.
import * as ui from "../../ui.mjs";
import { staffSections } from "../../staff-sections.mjs";
import { erpHeader } from "../../site.mjs";

export default ({ A, R }) => {
  const s = staffSections({ A, R });
  return {
    title: "출·퇴근 현황 조회",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "출·퇴근 현황 조회",
      titleRight: "",
      body: ui.listBody(s.attendFilter, s.attendTab),
      panels: s.fixForm + s.proxyForm,
    }),
  };
};
