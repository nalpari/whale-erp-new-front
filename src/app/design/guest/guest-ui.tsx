import Image from "next/image";
import Link from "next/link";
import { type ReactNode, ViewTransition } from "react";
import { ARROW_NUDGE, ARROW_NUDGE_BACK, BUTTON_MOTION, HOVER } from "./theme";

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
// back 은 시안의 「로그인 이동」처럼 같은 화살표를 좌우로 뒤집은 것이다.
export function Arrow({ back = false }: { back?: boolean }) {
  return (
    <span
      aria-hidden
      className={`h-[15.0674px] w-[16.7004px] shrink-0 bg-current mask-[url(/guest/arrow.svg)] mask-contain mask-center mask-no-repeat ${back ? `-scale-x-100 ${ARROW_NUDGE_BACK}` : ARROW_NUDGE}`}
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
  tall = false,
  children,
}: {
  tone: keyof typeof BUTTON_TONE;
  href?: string;
  // true 는 글 뒤에 나아가는 화살표, "back" 은 글 앞에 되돌아가는 화살표.
  arrow?: boolean | "back";
  grow?: boolean;
  // 폼 아래 버튼 줄은 66px 이다.
  tall?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex ${tall ? "h-[66px]" : "h-[48px]"} shrink-0 items-center justify-center gap-[12px] rounded-[6px] border px-[18px] text-[18px] leading-[1.5] font-semibold whitespace-nowrap ${BUTTON_MOTION} ${grow ? "flex-1" : ""} ${BUTTON_TONE[tone]}`}
    >
      {arrow === "back" && <Arrow back />}
      {children}
      {arrow === true && <Arrow />}
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

// 로그인·계정 찾기 왼쪽 칸 — 구름 위 고래 그림에 영문 머리말, 큰 제목, 안내 두 줄을 아래쪽에 얹는다.
export function GuestVisual({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children: ReactNode }) {
  return (
    <div className="relative flex flex-col justify-end gap-[32px] overflow-hidden px-[60px] py-[74px]">
      {/* 16:9 그림이 높이 730px 칸을 채우느라 폭 1300px 가까이로 그려진다. sizes 를 칸 폭(50vw)으로 주면
          작은 사본을 받아 늘려 그려 흐려지므로, 실제로 그려지는 폭을 알려 준다. */}
      <Image src="/guest/login/visual.png" alt="" fill loading="eager" sizes="max(50vw, 1300px)" className="object-cover" />
      <div className="relative flex flex-col gap-[34px] uppercase">
        <p className={`font-[family-name:var(--font-rem)] text-[24px] leading-none font-medium tracking-[-0.025em] text-[rgba(58,86,112,0.5)] ${TRIM}`}>{eyebrow}</p>
        {title}
      </div>
      <p className={`relative pl-[10px] text-[17px] leading-[1.4] text-[rgba(58,86,112,0.6)] ${TRIM}`}>{children}</p>
    </div>
  );
}

// 자주 묻는 질문 한 줄(메인 · 공지사항 FAQ). name 을 같이 준 <details> 라 하나를 열면 나머지가 닫힌다.
// 펼침 움직임은 globals.css 의 details[name="guest-faq"] 가 맡는다.
// 여백은 박스가 아니라 질문 줄(summary)에 둬서 박스 거의 전체가 눌린다. 박스에는 아래 4px 만 남긴다(위 22 · 아래 22 를 맞추려고).
// 답변 간격도 margin 이 아니라 padding 이어야 펼침 높이에 함께 들어간다 — margin 이면 열 때 튄다.
export function FaqItem({ q, open = false, children }: { q: string; open?: boolean; children?: ReactNode }) {
  return (
    <details name="guest-faq" open={open} className="group rounded-[3px] bg-[#fafafa] pb-[4px] open:bg-[#f5f5f5]">
      <summary className={`flex cursor-pointer px-[20px] pt-[22px] pb-[18px] list-none items-center gap-[11px] text-[17px] leading-[1.5] font-semibold text-guest-ink hover:text-guest-navy ${HOVER} [&::-webkit-details-marker]:hidden`}>
        <span className="flex size-[28px] shrink-0 items-center justify-center rounded-full bg-guest-navy text-[18px] font-bold tracking-normal text-white">Q</span>
        <span className="flex-1">{q}</span>
        <Image src="/guest/faq-plus.svg" alt="" width={28} height={28} className="group-open:hidden" />
        <Image src="/guest/faq-close.svg" alt="" width={28} height={28} className="hidden group-open:block" />
      </summary>
      {children && <p className="pr-[20px] pb-[18px] pl-[60px] text-[16px] leading-[1.5] text-guest-sub">{children}</p>}
    </details>
  );
}
