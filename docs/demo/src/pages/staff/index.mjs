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
      titleRight: ui.button("직원 초대", { href: s.N }) /* 직원 목록 제목 줄만 예외로 「직원 초대」(2026-10-12 재영) */,
      body: ui.listBody(s.listFilter, s.listTab),
      panels: s.holdForm,
    }),
  };
};
