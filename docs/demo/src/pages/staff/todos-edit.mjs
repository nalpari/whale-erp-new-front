// TO-DO 수정. 등록(todos-new.mjs)과 같은 두 단 폼 — 앱은 등록 · 수정이 한 폼(todo-form.tsx)이다(2026-11-06 사용자 지정).
// 전엔 목록 옆 슬라이드 패널이었다. 제목 · 내용 · 수행 예정 일시 · 긴급만 고치고, 배정은 글자로만 보인다.
import { render } from "./todos-new.mjs";

export default (ctx) =>
  render(ctx, {
    title: "가을 신메뉴 POP 교체",
    body: "여름 POP 를 떼고 가을 신메뉴 POP 를 붙인다",
    store: "모리커피 서초점",
    target: "근무지 전체 · 한 명 수행",
    date: "2026-09-04",
    time: "10:00",
  });
