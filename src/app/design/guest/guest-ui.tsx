import Link from "next/link";
import { type ReactNode, ViewTransition } from "react";
import { ARROW_NUDGE, BUTTON_MOTION } from "./theme";

// 비로그인 화면들이 함께 쓰는 조각 — 섹션 제목, 버튼, 화살표, 글자 위아래 여백 자르기.

export const TRIM = "[text-box:trim-both_cap_alphabetic]";
// 시안의 제목은 모두 「옅은 첫 줄 + 굵은 둘째 줄」 52px 두 줄이다.
export function SectionTitle({ light, bold, dark = false }: { light: string; bold: string; dark?: boolean }) {
  return (
    <h2 className={`text-[52px] leading-[1.2] tracking-[-0.025em] ${dark ? "text-[#f5f5f5]" : "text-guest-ink"}`}>
      <span className="block font-normal">{light}</span>
      <span className="block font-bold">{bold}</span>
    </h2>
  );
}

// 화살표는 SVG 를 마스크로 써서 글자색을 따른다 — 호버로 글자색이 바뀌면 화살표도 같이 바뀐다.
export function Arrow() {
  return (
    <span
      aria-hidden
      className={`h-[15.0674px] w-[16.7004px] shrink-0 bg-current mask-[url(/guest/arrow.svg)] mask-contain mask-center mask-no-repeat ${ARROW_NUDGE}`}
    />
  );
}

// 호버는 ERP 버튼처럼 흰 바탕 + 남색 테두리·글자로 바꾼다. 테두리는 처음부터 같은 굵기로 깔아 크기가 흔들리지 않는다.
const BUTTON_TONE = {
  navy: "border-guest-navy bg-guest-navy text-white hover:bg-white hover:text-guest-navy",
  soft: "border-guest-navy-soft bg-guest-navy-soft text-white hover:border-guest-navy hover:bg-white hover:text-guest-navy",
  white: "border-white bg-white text-guest-navy text-[17px]! hover:border-guest-navy",
  outline: "border-guest-button-line bg-white text-guest-ink hover:border-guest-navy hover:text-guest-navy",
  line: "border-guest-navy-soft bg-white text-guest-navy hover:border-guest-navy",
};
export function GuestButton({
  tone,
  href = "#",
  arrow = false,
  grow = false,
  children,
}: {
  tone: keyof typeof BUTTON_TONE;
  href?: string;
  arrow?: boolean;
  grow?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex h-[48px] shrink-0 items-center justify-center gap-[12px] rounded-[6px] border px-[18px] text-[18px] leading-[1.5] font-semibold whitespace-nowrap ${BUTTON_MOTION} ${grow ? "flex-1" : ""} ${BUTTON_TONE[tone]}`}
    >
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}

export function TitleRow({ light, bold, action }: { light: string; bold: string; action: ReactNode }) {
  return (
    <div className="flex items-end justify-between">
      <SectionTitle light={light} bold={bold} />
      {action}
    </div>
  );
}

// 시안의 아이콘 그라데이션(옅은 회청 → 진한 청). 달력·봉투·책갈피 아이콘이 함께 쓴다.
export const ICON_GRADIENT = "linear-gradient(114deg, rgba(174,190,206,0.8) 8.98%, rgba(32,96,154,0.8) 94.82%)";

// 비로그인 화면 사이를 옮길 때 본문을 겹쳐 바꾼다(globals.css 의 guest-page). 레이아웃은 화면을 옮겨도 남아 있어
// 들어오고 나가는 순간이 생기지 않으므로 각 page 가 이것으로 본문을 감싼다. 머리말은 움직이지 않는다.
// 본문과 푸터 사이는 시안대로 60px 띄운다. 로그인처럼 푸터가 본문에 바로 붙는 화면은 flush 를 준다.
export function GuestPage({ children, flush = false }: { children: ReactNode; flush?: boolean }) {
  return (
    <ViewTransition enter="guest-page" exit="guest-page" default="none">
      <div className={flush ? "" : "pb-[60px]"}>{children}</div>
    </ViewTransition>
  );
}
