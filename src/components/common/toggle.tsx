import type { ComponentProps } from "react";

// 켜고 끄는 스위치(사용 상태 등). 체크박스 위에 그려 폼 · 키보드(Space) 동작을 그대로 받는다.
// 상태는 스위치 모양으로만 말하고 옆 글자(label)는 바뀌지 않는다 — 공통코드의 ‘사용’(2026-10-08 데모 결정).
// 알약형은 원래 헤더 조작 요소 전용이지만, 스위치도 "지금 조작하는 것"이라 같은 모양을 쓴다(1팀과 맞출 것).
export function Toggle({ label, ...props }: { label: string } & Omit<ComponentProps<"input">, "type" | "role" | "className" | "style">) {
  return (
    <label className="inline-flex items-center gap-[8px] text-[14px] whitespace-nowrap text-erp-ink">
      <span className="relative inline-flex h-[20px] w-[36px] shrink-0">
        <input
          {...props}
          type="checkbox"
          role="switch"
          className="peer absolute inset-0 appearance-none rounded-full bg-erp-field-line transition-colors duration-150 ease-out checked:bg-erp-brand disabled:opacity-40"
        />
        <span className="pointer-events-none absolute top-[2px] left-[2px] size-[16px] rounded-full bg-white transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] peer-checked:translate-x-[16px] motion-reduce:transition-none" />
      </span>
      {label}
    </label>
  );
}
