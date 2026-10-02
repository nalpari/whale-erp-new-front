// FAQ — 헤더 메뉴 고객지원 › FAQ.
import * as ui from "../../ui.mjs";
import { supportSections } from "../../support-sections.mjs";
import { erpHeader } from "../../site.mjs";

export default ({ A, R }) => {
  const s = supportSections({ A, R });
  return { title: "FAQ", html: ui.erpFrame({ header: erpHeader(A, R), title: "FAQ", body: ui.listBody(s.faqFilter, s.faq), panels: "" }) };
};
