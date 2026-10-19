"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { SUBMIT } from "@/app/design/guest/guest-form";
import { TermsMarkdown } from "@/components/site/terms-markdown";
import { getTermsVersionAction } from "@/lib/terms-actions";
import type { TermsVersionDetail } from "@/lib/terms";

// 약관 전문 확인창. 네이티브 <dialog> 라 Esc 닫기와 바깥 포커스 막기는 브라우저가 맡는다. 1팀 비로그인
// 폼 규격을 쓴다 — 폭·모서리·글자색은 design/guest/sign-up 의 TermsDialog 와 같다(2026-10-14).
// 본문은 처음 열 때 api 에서 받는다(약관 팝업 TermsLink 와 같은 server action) — 동의 기록과 같은 시행 중 버전이다. 받지 못했으면 다시 열 때 한 번 더 묻는다.
export function TermsDialog({ open, onClose, termsTypeCode }: { open: boolean; onClose: () => void; termsTypeCode: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  // undefined 는 아직 안 받음, null 은 받지 못함.
  const [terms, setTerms] = useState<TermsVersionDetail | null | undefined>(undefined);
  const [pending, startTransition] = useTransition();
  // 이번에 열린 동안 이미 물었는지. 실패(null)해도 열려 있는 동안은 다시 묻지 않고, 닫히면 다음 열기에 다시 묻게 푼다.
  const requested = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    if (open && !requested.current) {
      requested.current = true;
      startTransition(async () => {
        // action 의 try/catch 는 서버 안의 실패만 잡는다. 연결이 끊기거나 배포로 action 이 바뀌면 여기서 reject 되므로 받아 안내로 바꾼다 — 놓치면 오류 경계까지 올라가 가입 폼이 사라진다.
        try {
          setTerms(await getTermsVersionAction(termsTypeCode));
        } catch (error) {
          console.error(`약관 「${termsTypeCode}」 요청이 서버에 닿지 못했습니다`, error);
          setTerms(null);
        }
      });
    }
    if (!open && terms === null) requested.current = false;
  }, [open, terms, termsTypeCode]);

  return (
    <dialog
      ref={ref}
      aria-label={terms?.title ?? "약관 전문"}
      onClose={onClose}
      onClick={(e) => {
        // dialog 자체(backdrop)를 눌렀을 때만 닫는다 — 안쪽 여백을 눌러도 e.target 이 dialog 가 되지 않게 한다.
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[860px] max-w-[calc(100vw-32px)] rounded-[6px] bg-white p-[32px] text-guest-ink backdrop:bg-black/40"
    >
      {terms ? (
        <>
          <h2 className="text-[22px] leading-[1.4] font-bold">{terms.title}</h2>
          <p className="mt-[4px] text-[14px] text-[#767676]">
            {terms.version} · 시행일 {terms.effectiveDate}
          </p>
          <div className="mt-[20px] max-h-[60dvh] overflow-y-auto pr-[10px] text-[15px] leading-[1.6]">
            <TermsMarkdown content={terms.content} />
          </div>
        </>
      ) : (
        <p role={terms === null && !pending ? "alert" : "status"} className="py-[24px] text-center text-[15px] text-[#999]">
          {terms === null && !pending ? "약관을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요." : "약관을 불러오는 중입니다."}
        </p>
      )}
      {/* 회원가입 form 안에 있어 method="dialog" form 을 겹칠 수 없다. 단추가 직접 닫는다. */}
      <div className="mt-[24px] flex justify-end">
        <button type="button" onClick={onClose} className={`w-[180px] ${SUBMIT}`}>
          확인
        </button>
      </div>
    </dialog>
  );
}
