import Link from "next/link";
import type { ComponentProps } from "react";

const TONE = {
  primary: "border-erp-brand bg-erp-brand text-white",
  soft: "border-erp-brand-soft bg-erp-brand-soft text-white",
  off: "border-erp-subtle bg-erp-subtle text-erp-ink",
};

export type ButtonVariant = keyof typeof TONE;

// 링크로 그릴 때도 글자가 가운데 오도록 inline-flex 로 둔다. <a> 는 <button> 처럼 가운데 정렬이 기본이 아니다.
const SHELL =
  "inline-flex h-[34px] shrink-0 items-center justify-center rounded-[2px] border px-[24px] text-[14px] font-medium whitespace-nowrap transition-[background-color,border-color,color] duration-150 ease-out hover:border-erp-brand hover:bg-white hover:text-erp-ink";

// href 를 주면 링크, 없으면 버튼이다. 둘은 섞어 쓸 수 없다 — 하나의 props 로 두면
// <Button href disabled> 가 그대로 통과해 눌리는 링크가 되고, button 전용 속성(type·form·ref)이 조용히 사라진다.
type ButtonProps = { variant?: ButtonVariant; className?: string } & (
  | ({ href: string } & Omit<ComponentProps<typeof Link>, "href" | "className">)
  | ({ href?: never } & Omit<ComponentProps<"button">, "className">)
);

// Figma Btn_basic / Btn_basic_off2 / Btn_basic_off. 세 종류 모두 호버하면(Figma 의 active 상태) 흰 바탕·브랜드 테두리·기본 글자색이 된다.
// 테두리를 처음부터 같은 색으로 깔아 두어 호버 때 크기가 변하지 않는다.
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
