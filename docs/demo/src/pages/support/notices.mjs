// 공지사항 — 헤더 메뉴 고객지원 › 공지사항.
import * as ui from "../../ui.mjs";
import { supportSections } from "../../support-sections.mjs";
import { erpHeader } from "../../site.mjs";

export default ({ A, R }) => {
  const s = supportSections({ A, R });
  return { title: "공지사항", html: ui.erpFrame({ header: erpHeader(A, R), title: "공지사항", body: ui.listBody(s.noticeFilter, s.notices), panels: "" }) };
};
