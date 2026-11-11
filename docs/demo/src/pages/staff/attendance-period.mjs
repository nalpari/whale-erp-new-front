// 출·퇴근 현황 조회 — 급여명세서 [출퇴근 기록 확인] · [출퇴근 기록 보기]로 온 모습(그 직원의 기간 기록 전체, WHALEERP-664).
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
      body: ui.listBody(s.attendFilter, s.attendPeriodTab),
      panels: s.fixForm + s.proxyForm,
    }),
  };
};
