import Link from "next/link";
import type { ComponentProps } from "react";

const TONE = {
  primary: "border-erp-brand bg-erp-brand text-white",
  soft: "border-erp-brand-soft bg-erp-brand-soft text-white",
  off: "border-erp-subtle bg-erp-subtle text-erp-ink",
  // 퇴직 처리처럼 되돌리기 어려운 동작. 미운영 배지와 같은 상태 빨강 토큰을 쓴다 — 데모 ui.mjs 의 danger 와 같다(2026-10-08 재영, DESIGN.md Buttons · 1팀 동의 2026-10-27).
  danger: "border-erp-off bg-erp-off text-white",
  // 다른 버튼이 호버했을 때의 모양(흰 바탕 · 브랜드 테두리 · 먹색 글자)을 처음부터 쓰고, 호버하면 옅은 회색(erp-subtle)으로 바뀐다. 안내 상자 안이나 표 아래의 이동 버튼처럼 색 바탕이
  // 무거운 자리에 둔다 — 회원 탈퇴의 [직원 자료 일괄 저장] · [근로계약 확인](2026-10-30 사용자 지정, 1팀 동의 2026-10-30 — DESIGN.md Buttons 「Outline」).
  outline: "border-erp-brand bg-white text-erp-ink hover:bg-erp-subtle!",
};

export type ButtonVariant = keyof typeof TONE;

// 링크로 그릴 때도 글자가 가운데 오도록 inline-flex 로 둔다. <a> 는 <button> 처럼 가운데 정렬이 기본이 아니다.
const SHELL =
  "inline-flex h-[34px] shrink-0 items-center justify-center rounded-[2px] border px-[24px] text-[14px] font-medium whitespace-nowrap transition-[background-color,border-color,color] duration-150 ease-out hover:border-erp-brand hover:bg-white hover:text-erp-ink disabled:pointer-events-none disabled:opacity-40";

// href 를 주면 링크, 없으면 버튼이다. 둘은 섞어 쓸 수 없다 — 하나의 props 로 두면
// <Button href disabled> 가 그대로 통과해 눌리는 링크가 되고, button 전용 속성(type·form·ref)이 조용히 사라진다.
type ButtonProps = { variant?: ButtonVariant; className?: string } & (
  | ({ href: string } & Omit<ComponentProps<typeof Link>, "href" | "className">)
  | ({ href?: never } & Omit<ComponentProps<"button">, "className">)
);

// Figma Btn_basic / Btn_basic_off2 / Btn_basic_off(+ danger). 이 종류들은 호버하면(Figma 의 active 상태) 흰 바탕·브랜드 테두리·기본 글자색이 된다.
// outline 은 그 모양이 기본이고 호버하면 erp-subtle 바탕이 된다.
// 테두리를 처음부터 같은 색으로 깔아 두어 호버 때 크기가 변하지 않는다. 막힌 버튼(disabled)은 흐리게 두고 호버하지 않는다.
export function Button(props: ButtonProps) {
  const tone = (variant: ButtonVariant = "primary", className = "") => `${SHELL} ${TONE[variant] ?? TONE.primary} ${className}`;

  // 생김새는 버튼이고 하는 일이 이동일 때(목록으로 돌아가기 등) href 를 준다.
  if (props.href !== undefined) {
    const { variant, className, ...rest } = props;
    return <Link {...rest} className={tone(variant, className)} />;
  }
  const { variant, className, type = "button", ...rest } = props;
  return <button {...rest} type={type} className={tone(variant, className)} />;
}
