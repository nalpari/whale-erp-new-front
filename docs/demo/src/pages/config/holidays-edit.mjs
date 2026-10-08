// BP 휴일 수정. 목업 docs/mockup/config/holidays-edit.html 을 BP 마스터로 본 것. 표본은 상세와 같은 HD-0114 정기휴무(고른 날짜 2026-09-28).
// 목업은 BP 휴일 관리 위 팝업으로 연다 — holidays.mjs 가 editForm 을 확인창에 싣고, 이 파일은 주소로 바로 열 때의 화면이다.
// 저장하면 확인창 없이 목록으로 가서 상세 패널을 연다(?panel= · 2026-10-08).
// 휴일 정보(휴일명 → 날짜 → 설명) · 반복을 위로, 적용 대상을 맨 아래로 둔다. 등록과 같은 양식(holidayForm)을 쓴다(2026-10-08).
import * as ui from "../../ui.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";
import { holidayForm, HOLIDAY_SCRIPT } from "./holidays-new.mjs";

export const editForm = (A, { panel = false } = {}) =>
  holidayForm(
    A,
    {
      id: "he",
      name: "정기휴무",
      type: "반복",
      date: "2026-09-28",
      desc: "월요일마다 쉬는 정기 휴무",
      rep: "매주",
      until: "종료일 없음",
      store: true,
      picked: [["온기식당 판교점", "ST000003", "직영점포"]],
    },
    { panel },
  );


export default ({ A, R }) => {
  const detail = link(R, "config/holidays-detail.html");
  return {
    title: "BP 휴일 수정",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "BP 휴일 관리",
      body: ui.detailBody(
        ui.sectionHead(`BP 휴일 수정${c.sub("정기휴무 · HD-0114")}`) +
          editForm(A) +
          c.buttons(ui.button("취소", { variant: "off", href: detail }), ui.button("저장", { href: `${link(R, "config/holidays.html")}?panel=hol-detail-panel` })) +
          HOLIDAY_SCRIPT,
      ),
    }),
  };
};
