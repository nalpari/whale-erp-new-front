"use client";

import Image from "next/image";
import { useState, type ComponentProps } from "react";
import { FIELD } from "./theme";

/** 비밀번호 칸 + 눈 아이콘(보기·숨기기, 회원가입 password-field.tsx 와 같은 아이콘 쌍 — docs/demo pwField 기준,
 * 2026-10-26 사용자 지정). 오른쪽에 아이콘 버튼을 겹치는 칸은 공통 TextField 가 className 을 안 받아 FIELD
 * 토큰을 직접 써서 만든다(search-field.tsx 와 같은 방식). 두 번째로 쓰는 화면(회원탈퇴 패널)이 생겨 공통
 * 컴포넌트로 올렸다(DESIGN.md, 2026-10-27). */
export function PasswordInput({ fieldLabel, ...props }: { fieldLabel: string } & Omit<ComponentProps<"input">, "type" | "className">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${FIELD} pr-[34px]`} />
      <button
        type="button"
        aria-pressed={visible}
        aria-label={`${fieldLabel} ${visible ? "숨기기" : "보기"}`}
        onClick={() => setVisible((v) => !v)}
        className="absolute top-0 right-0 grid size-[34px] place-items-center text-erp-label hover:text-erp-ink"
      >
        <Image src={visible ? "/icons/eye-off.svg" : "/icons/eye-on.svg"} alt="" width={16} height={16} />
      </button>
    </div>
  );
}
