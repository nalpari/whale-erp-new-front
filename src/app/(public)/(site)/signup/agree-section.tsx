"use client";

import { useState } from "react";
import { Checkbox, FormGroup } from "@/components/common";
import { TERMS } from "./_components/terms";
import { TermsDialog } from "./_components/terms-dialog";

export type AgreeValue = { useAgreed: boolean; privacyAgreed: boolean };
export const AGREE_INITIAL: AgreeValue = { useAgreed: false, privacyAgreed: false };

// 약관동의. 항목은 회원가입 데모(docs/demo/src/pages/auth/signup.mjs)와 같고, 모양은 ERP 디자인 시스템을 쓴다(로그인 화면과 같은 틀).
// "모두 동의합니다."는 아래 두 필수 항목과 양방향으로 맞춘다(데모의 정적 HTML 은 한쪽으로만 맞췄지만,
// React 에서는 어느 쪽을 눌러도 맞게 하는 편이 표준적인 "전체 선택" 동작이다).
// 값은 부모(SignupForm)가 들고 있다 — 제출 전 필수 두 개 동의 여부를 거기서 검사하고,
// 오류 문구도 이 카드 안이 아니라 카드와 회원가입 버튼 사이에 따로 보여준다(2026-10-12 피드백).
export function AgreeSection({ value, onChange }: { value: AgreeValue; onChange: (value: AgreeValue) => void }) {
  const [openDialog, setOpenDialog] = useState<"use" | "privacy" | null>(null);

  const setAll = (checked: boolean) => onChange({ useAgreed: checked, privacyAgreed: checked });

  return (
    <FormGroup title="약관동의">
      <Checkbox label="모두 동의합니다." checked={value.useAgreed && value.privacyAgreed} onChange={(e) => setAll(e.target.checked)} />
      <hr className="border-erp-divider" />
      <div className="flex items-center justify-between">
        <Checkbox label="이용약관 동의 (필수)" checked={value.useAgreed} onChange={(e) => onChange({ ...value, useAgreed: e.target.checked })} />
        <button type="button" className="text-[14px] text-erp-link underline" onClick={() => setOpenDialog("use")}>
          내용보기
        </button>
      </div>
      <div className="flex items-center justify-between">
        <Checkbox label="개인정보 수집·이용 동의 (필수)" checked={value.privacyAgreed} onChange={(e) => onChange({ ...value, privacyAgreed: e.target.checked })} />
        <button type="button" className="text-[14px] text-erp-link underline" onClick={() => setOpenDialog("privacy")}>
          내용보기
        </button>
      </div>

      <TermsDialog open={openDialog === "use"} onClose={() => setOpenDialog(null)} doc={TERMS.use} />
      <TermsDialog open={openDialog === "privacy"} onClose={() => setOpenDialog(null)} doc={TERMS.privacy} />
    </FormGroup>
  );
}
