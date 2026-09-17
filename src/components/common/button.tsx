import type { ComponentProps } from "react";

const TONE = {
  primary: "border-erp-brand bg-erp-brand text-white",
  soft: "border-erp-brand-soft bg-erp-brand-soft text-white",
  off: "border-erp-subtle bg-erp-subtle text-erp-ink",
};

export type ButtonVariant = keyof typeof TONE;

// Figma Btn_basic / Btn_basic_off2 / Btn_basic_off. 세 종류 모두 호버하면(Figma 의 active 상태) 흰 바탕·브랜드 테두리·기본 글자색이 된다.
// 테두리를 처음부터 같은 색으로 깔아 두어 호버 때 크기가 변하지 않는다.
export function Button({
  variant = "primary",
  type = "button",
  className = "",
  ...props
}: { variant?: ButtonVariant } & ComponentProps<"button">) {
  return (
    <button
      {...props}
      type={type}
      className={`h-[34px] shrink-0 rounded-[2px] border px-[24px] text-[14px] font-medium whitespace-nowrap transition-[background-color,border-color,color] duration-150 ease-out hover:border-erp-brand hover:bg-white hover:text-erp-ink ${TONE[variant]} ${className}`}
    />
  );
}
