"use client";

import { useState } from "react";
import { CHECKBOX } from "@/app/design/guest/guest-form";
import { HOVER } from "@/app/design/guest/theme";
import { TermsDialog } from "./terms-dialog";

export type AgreeValue = { useAgreed: boolean; privacyAgreed: boolean };
export const AGREE_INITIAL: AgreeValue = { useAgreed: false, privacyAgreed: false };

// 약관동의. 항목은 회원가입 데모(docs/demo/src/pages/auth/signup.mjs)와 같고, 1팀 비로그인 폼 규격
// (guest-form.ts)을 쓴다 — design/guest/sign-up 의 약관동의 묶음과 같은 생김새다(2026-10-14).
// "모두 동의합니다."는 아래 두 필수 항목과 양방향으로 맞춘다(데모의 정적 HTML 은 한쪽으로만 맞췄지만,
// React 에서는 어느 쪽을 눌러도 맞게 하는 편이 표준적인 "전체 선택" 동작이다).
// 값은 부모(SignupForm)가 들고 있다 — 제출 전 필수 두 개 동의 여부를 거기서 검사하고,
// 오류 문구도 이 묶음 안이 아니라 묶음과 회원가입 버튼 사이에 따로 보여준다(2026-10-12 피드백).
export function AgreeSection({ value, onChange }: { value: AgreeValue; onChange: (value: AgreeValue) => void }) {
  const [openDialog, setOpenDialog] = useState<"use" | "privacy" | null>(null);

  const setAll = (checked: boolean) => onChange({ useAgreed: checked, privacyAgreed: checked });

  return (
    <section className="flex flex-col gap-[24px]">
      <h2 className="text-[20px] leading-[1.4] font-semibold text-[#111]">약관동의</h2>
      <div className="flex flex-col gap-[18px] text-[16px] leading-[1.5] font-medium text-[#5e697b]">
        <label className="flex items-center gap-[8px] text-guest-ink">
          <input type="checkbox" checked={value.useAgreed && value.privacyAgreed} onChange={(e) => setAll(e.target.checked)} className={CHECKBOX} />
          모두 동의합니다.
        </label>
        <hr className="border-[#ebebeb]" />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-[8px]">
            <input type="checkbox" checked={value.useAgreed} onChange={(e) => onChange({ ...value, useAgreed: e.target.checked })} className={CHECKBOX} />
            이용약관 동의 (필수)
          </label>
          <button
            type="button"
            onClick={() => setOpenDialog("use")}
            className={`text-[15px] text-guest-slate underline underline-offset-[3px] hover:text-guest-navy ${HOVER}`}
          >
            내용보기
          </button>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-[8px]">
            <input
              type="checkbox"
              checked={value.privacyAgreed}
              onChange={(e) => onChange({ ...value, privacyAgreed: e.target.checked })}
              className={CHECKBOX}
            />
            개인정보 수집·이용 동의 (필수)
          </label>
          <button
            type="button"
            onClick={() => setOpenDialog("privacy")}
            className={`text-[15px] text-guest-slate underline underline-offset-[3px] hover:text-guest-navy ${HOVER}`}
          >
            내용보기
          </button>
        </div>
      </div>

      <TermsDialog open={openDialog === "use"} onClose={() => setOpenDialog(null)} termsTypeCode="TERMS_SERVICE" />
      <TermsDialog open={openDialog === "privacy"} onClose={() => setOpenDialog(null)} termsTypeCode="PRIVACY_COLLECT" />
    </section>
  );
}
