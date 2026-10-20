"use client";

import Image from "next/image";
import { useState, type ComponentProps } from "react";
import { INPUT, INPUT_BOX } from "@/app/design/guest/guest-form";
import { RequiredField } from "./required-field";

// 비밀번호 칸 + 보기/숨기기. 1팀 비로그인 폼 규격을 쓴다(guest-form.ts) — design/guest/sign-up 의
// PasswordField 와 같은 생김새(아이콘은 guest 로그인 화면 자산을 그대로 쓴다). 이 칸은 RequiredField 의
// <label> 안에 있어 이름과 "(필수)" 가 이미 읽힌다 — 입력칸에 따로 aria-label 을 주면 그 연결을
// 덮어써 "(필수)" 가 안 읽힌다, 그래서 안 준다(2026-10-14 코드리뷰).
export function PasswordField({
  label,
  error,
  errorId,
  ...props
}: { label: string; error?: string; errorId?: string } & Omit<ComponentProps<"input">, "className" | "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <RequiredField label={label} error={error} errorId={errorId}>
      <span className={INPUT_BOX}>
        <input {...props} type={visible ? "text" : "password"} className={INPUT} />
        <button
          type="button"
          aria-pressed={visible}
          aria-label={visible ? `${label} 숨기기` : `${label} 보기`}
          onClick={() => setVisible((v) => !v)}
          className="flex size-[16px] shrink-0 items-center justify-center"
        >
          <Image src={visible ? "/guest/login/eye-off.svg" : "/guest/login/eye-on.svg"} alt="" width={16} height={16} />
        </button>
      </span>
    </RequiredField>
  );
}
