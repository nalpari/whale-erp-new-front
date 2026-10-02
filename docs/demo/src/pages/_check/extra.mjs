// extra.mjs 부품 검사용(탭·확인창·스위치).
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import { erpHeader } from "../../site.mjs";

export default ({ A, R }) => {
  const d = x.dialogId();
  const body = ui.detailBody(
    x.tabs([
      { id: "one", label: "첫째", html: ui.sectionHead("첫째 탭", x.dialogTrigger("삭제", d, "soft")) + x.toggle("사용", true) },
      { id: "two", label: "둘째", html: ui.sectionHead("둘째 탭") },
    ]) + x.dialog(d, "삭제하시겠습니까?", "삭제한 항목은 복구할 수 없습니다.", ui.button("취소", { variant: "off", "data-close": true }) + ui.button("삭제", { "data-close": true })),
  );
  return { title: "부품 검사", html: ui.erpFrame({ header: erpHeader(A, R), title: "부품 검사", body }) };
};
