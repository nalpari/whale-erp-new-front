import { EASE_OUT } from "@/components/common/theme";

// 비로그인 화면의 호버 전환. ERP 화면과 같이 색만 150ms 로 바꾸고, 움직임 줄이기 설정에서는 끈다.
export const HOVER = `transition-[color,background-color,border-color] duration-150 ${EASE_OUT} motion-reduce:transition-none`;

// 버튼: 색 전환에 누름 피드백(0.97 로 살짝 눌림)을 더한다. 0 이나 0.9 아래로 줄이면 버튼이 튄다.
// 안의 화살표가 group-hover 로 움직이도록 group 을 함께 단다.
export const BUTTON_MOTION = `group transition-[color,background-color,border-color,scale] duration-150 ${EASE_OUT} active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100`;

// 버튼 화살표: 호버하면 가는 쪽으로 3px 밀린다. Tailwind 의 hover 는 마우스가 있는 기기에서만 걸린다.
export const ARROW_NUDGE = `transition-[translate] duration-150 ${EASE_OUT} group-hover:translate-x-[3px] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0`;
