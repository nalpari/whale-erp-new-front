// 문의하기 — 헤더 메뉴 고객지원 › 문의하기.
import * as ui from "../../ui.mjs";
import { supportSections } from "../../support-sections.mjs";
import { erpHeader } from "../../site.mjs";

export default ({ A, R }) => {
  const s = supportSections({ A, R });
  return { title: "문의하기", html: ui.erpFrame({ header: erpHeader(A, R), title: "문의하기", body: ui.listBody(s.inquiryFilter, s.inquiries), panels: s.askForm }) };
};
