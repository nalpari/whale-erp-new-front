"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/common";
import { getTermsVersionAction } from "@/lib/terms-actions";
import type { TermsVersionDetail } from "@/lib/terms";
import { TermsMarkdown } from "./terms-markdown";

// 약관 전문 팝업. 강제 비밀번호 변경 팝업의 약관 재동의가 쓴다(푸터는 약관 전문 화면 /terms 로 간다). 폭 640px — 2026-10-06 피드백. 데모 public.mjs termsDialog 와 같은 모양.
// 본문은 처음 열 때 api 에서 받는다(server action) — 대부분 열지 않고 동의만 하므로 미리 받지 않는다. 받은 본문은 팝업이 떠 있는 동안 다시 묻지 않는다.
// 네이티브 <dialog>: Esc·포커스 가두기·바깥 inert 를 브라우저가 맡는다.
export function TermsLink({ termsTypeCode, children }: { termsTypeCode: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  // undefined 는 아직 안 받음, null 은 받지 못함.
  const [terms, setTerms] = useState<TermsVersionDetail | null | undefined>(undefined);
  const [pending, startTransition] = useTransition();

  const handleOpen = () => {
    ref.current?.showModal();
    // 받지 못했으면 다시 열 때 한 번 더 묻는다.
    if (!terms && !pending) startTransition(async () => setTerms(await getTermsVersionAction(termsTypeCode)));
  };

  return (
    <>
      <button type="button" onClick={handleOpen} className="transition-colors duration-150 ease-out hover:text-erp-ink">
        {children}
      </button>
      {/* #ebebeb 팝업 테두리·그림자는 DESIGN.md Popups 의 값 */}
      <dialog
        ref={ref}
        aria-label={terms?.title ?? "약관 전문"}
        className="m-auto w-[640px] max-w-[calc(100vw-32px)] rounded-[2px] border border-[#ebebeb] bg-white p-[23px] font-erp tracking-[-0.025em] text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40"
      >
        {terms ? (
          <>
            <h2 className="text-[18px] font-semibold">{terms.title}</h2>
            <div className="mt-[12px] text-[14px] leading-[1.6]">
              <p className="text-[12px] text-erp-label">
                {terms.version} · 시행일 {terms.effectiveDate}
              </p>
              <div className="mt-[12px] max-h-[60dvh] overflow-y-auto pr-[10px]">
                <TermsMarkdown content={terms.content} />
              </div>
            </div>
          </>
        ) : (
          // #999 빈 값 회색: DESIGN.md Neutral 의 「데이터가 없을 때의 안내 문구」
          <p role={terms === null && !pending ? "alert" : "status"} className="py-[24px] text-center text-[14px] text-[#999]">
            {terms === null && !pending ? "약관을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요." : "약관을 불러오는 중입니다."}
          </p>
        )}
        <div className="mt-[24px] flex justify-end">
          <Button onClick={() => ref.current?.close()}>확인</Button>
        </div>
      </dialog>
    </>
  );
}
