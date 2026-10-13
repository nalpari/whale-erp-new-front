import { BUTTON_MOTION, HOVER } from "./theme";

// 비로그인 폼(로그인·계정 찾기·회원가입)이 함께 쓰는 Figma 규격 — 입력칸 56px, 주 버튼 66px, 모서리 6px.
// Tailwind 는 소스 글자를 읽어 CSS 를 만들므로 클래스를 조립하지 말고 통째로 적는다.

// 입력칸 껍데기. 테두리는 처음부터 깔아 두고 포커스 때 색만 남색으로 바꾼다.
export const INPUT_BOX = `flex h-[56px] items-center gap-[10px] rounded-[6px] border border-[#ebebeb] bg-white px-[16px] focus-within:border-guest-navy has-disabled:bg-guest-card ${HOVER}`;
export const INPUT =
  "min-w-0 flex-1 bg-transparent text-[15px] leading-[1.5] text-guest-ink outline-none! placeholder:text-[#999] placeholder:tracking-[-0.002em] disabled:text-[#767676]";
// 입력칸 위 이름표.
export const LABEL = "text-[16px] leading-[1.4] font-medium text-guest-ink";
// 폼의 주 버튼(66px 남색).
export const SUBMIT =
  "h-[66px] rounded-[6px] border border-guest-navy bg-guest-navy text-[18px] leading-[1.5] font-semibold tracking-normal text-white hover:bg-white hover:text-guest-navy active:scale-[0.99] [transition:color_250ms_ease,background-color_250ms_ease,scale_150ms_cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none";
// 입력칸 옆에 서는 56px 버튼(「인증번호 받기」).
export const FIELD_BUTTON = `h-[56px] shrink-0 rounded-[6px] border border-guest-ink bg-white px-[18px] text-[18px] leading-[1.5] font-semibold whitespace-nowrap hover:border-guest-navy hover:text-guest-navy ${BUTTON_MOTION}`;
// 20px 체크 상자. 체크하면 남색 바탕에 흰 체크.
export const CHECKBOX = `size-[20px] shrink-0 appearance-none rounded-[4px] border border-[#aab4c4] bg-white bg-center bg-no-repeat checked:border-guest-navy checked:bg-guest-navy checked:bg-[url(/icons/check.svg)] ${HOVER}`;
