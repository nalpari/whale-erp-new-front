"use client";

import { useState, type ComponentProps } from "react";
import { TextField } from "@/components/common";
import { RequiredField } from "./required-field";

// 비밀번호 칸 + [보기]. 공통 컴포넌트(src/components/common)에 비밀번호 칸이 없어 TextField 위에 글자 버튼을 겹친다.
// docs/demo/src/biz-form.mjs 의 pwField 와 같다. error 가 있으면 helpText 대신 오류 문구만 보인다.
// 이 칸은 RequiredField 의 <label> 안에 있어 이름과 "(필수)" 가 이미 읽힌다 — 입력칸에 따로 aria-label 을
// 주면 그게 label 연결을 덮어써 "(필수)" 가 안 읽힌다, 그래서 안 준다(2026-10-14 코드리뷰로 뺐다).
export function PasswordField({
  label,
  helpText,
  error,
  errorId,
  ...props
}: { label: string; helpText?: string; error?: string; errorId?: string } & Omit<ComponentProps<typeof TextField>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <RequiredField label={label} error={error} errorId={errorId}>
      <div className="relative">
        <TextField {...props} type={visible ? "text" : "password"} />
        <button
          type="button"
          aria-pressed={visible}
          aria-label="비밀번호 보기"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-0 right-0 h-[34px] px-[10px] text-[13px] text-erp-label hover:text-erp-ink"
        >
          {visible ? "숨기기" : "보기"}
        </button>
      </div>
      {!error && helpText ? <span className="text-[13px] text-erp-label">{helpText}</span> : null}
    </RequiredField>
  );
}
