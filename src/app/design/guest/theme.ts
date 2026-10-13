import { EASE_OUT } from "@/components/common/theme";

// 비로그인 화면의 색 전환. ERP 화면(150ms 강한 감속)보다 길고 고르게(250ms ease) 바꾼다 — 강한 감속 곡선은 색이
// 처음 수십 ms 에 거의 다 바뀌어 전환이 없는 것처럼 보인다(2026-10-13 요청). 움직임 줄이기 설정에서는 끈다.
// Tailwind 는 소스의 글자를 그대로 읽어 CSS 를 만들므로 클래스를 조립하지 말고 통째로 적는다.
export const HOVER =
  "[transition:color_250ms_ease,background-color_250ms_ease,border-color_250ms_ease] motion-reduce:transition-none";

// 버튼: 색 전환에 누름 피드백(0.97 로 살짝 눌림)을 더한다. 눌림은 손에 바로 반응해야 해서 150ms 강한 감속으로 따로 둔다.
// 0 이나 0.9 아래로 줄이면 버튼이 튄다. 안의 화살표가 group-hover 로 움직이도록 group 을 함께 단다.
export const BUTTON_MOTION =
  "group [transition:color_250ms_ease,background-color_250ms_ease,border-color_250ms_ease,scale_150ms_cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100";

// 버튼 화살표: 호버하면 가는 쪽으로 3px 밀린다. Tailwind 의 hover 는 마우스가 있는 기기에서만 걸린다.
export const ARROW_NUDGE = `transition-[translate] duration-250 ${EASE_OUT} group-hover:translate-x-[3px] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0`;
// 되돌아가는 버튼(「로그인 이동」)의 화살표는 뒤집혀 있어 반대쪽으로 민다.
export const ARROW_NUDGE_BACK = `transition-[translate] duration-250 ${EASE_OUT} group-hover:-translate-x-[3px] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0`;
