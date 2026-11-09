// TO-DO 리스트 관리 — 헤더 메뉴 직원관리 › TO-DO 리스트 관리.
import * as ui from "../../ui.mjs";
import { staffSections } from "../../staff-sections.mjs";
import { erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const s = staffSections({ A, R });
  return {
    title: "TO-DO 리스트 관리",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "TO-DO 리스트 관리",
      // [TO-DO 등록]은 화면 제목 줄 오른쪽(앱 page.tsx PageBar · TodoCreateButton, 2026-11-09 사용자 지정)
      titleRight: ui.button("TO-DO 등록", { href: link(R, "staff/todos-new.html") }),
      body: ui.listBody(s.todosFilter, s.todoTab),
    }),
  };
};
