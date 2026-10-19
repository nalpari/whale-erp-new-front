import type { ReactNode } from "react";
import { LABEL } from "@/app/design/guest/guest-form";

// 1팀 비로그인 폼 규격(guest-form.ts)을 쓴다 — 로그인 전 공개 화면은 ERP 관리자 화면과 다른 디자인
// 시스템을 쓰기로 했다(docs/demo/src/pages/auth/signup.mjs, 2026-10-14). Field(공통 컴포넌트)는
// label 이 string 만 받고 오류 문구도 못 그려서, 여기서 라벨+필수표시+오류문구를 조합한다.
// errorId 는 오류 문구 <span> 의 id 다 — 입력칸의 aria-describedby 가 이 id 를 가리켜야 스크린리더가
// 오류를 읽는다(2026-10-14 코드리뷰).
export function RequiredField({
  label,
  error,
  errorId,
  children,
}: {
  label: string;
  error?: string;
  errorId?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-[10px]">
      <span className={LABEL}>
        {label}
        <span aria-hidden className="text-[#e93737]">
          {" *"}
        </span>
        <span className="sr-only">(필수)</span>
      </span>
      {children}
      {error ? (
        <span id={errorId} role="alert" className="text-[14px] leading-[1.5] text-[#e93737]">
          {error}
        </span>
      ) : null}
    </label>
  );
}
