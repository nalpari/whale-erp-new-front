"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/common";

// 로그인 화면(/auth/login)이 아직 없다. 그리로 가는 자리(로고·로그인 링크·웨일ERP 시작하기)는 404 대신
// 디자인 시스템 안내창(TermsDialog 와 같은 네이티브 dialog 틀)을 띄운다(2026-10-12, 코드리뷰 반영 — alert() 대신).
// 로그인 화면이 생기면 이 파일을 지우고 쓰는 곳을 href="/auth/login" 으로 되돌린다.
function PendingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // TermsDialog 와 같은 이유로 안쪽은 padding 없는 div 로 감싼다(2026-10-12 코드리뷰).
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[360px] max-w-[calc(100vw-32px)] rounded-[2px] border border-[#ebebeb] bg-white p-0 font-erp tracking-[-0.025em] text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40"
    >
      <div className="p-[23px]">
        <p className="text-[14px]">로그인 화면은 개발 예정입니다.</p>
        <div className="mt-[18px] flex justify-end">
          <Button onClick={onClose}>확인</Button>
        </div>
      </div>
    </dialog>
  );
}

function usePendingDialog() {
  const [open, setOpen] = useState(false);
  return { open, show: () => setOpen(true), close: () => setOpen(false) };
}

export function LoginPendingButton({ children }: { children: ReactNode }) {
  const dialog = usePendingDialog();
  return (
    <>
      <Button onClick={dialog.show}>{children}</Button>
      <PendingDialog open={dialog.open} onClose={dialog.close} />
    </>
  );
}

// 글자 링크처럼 보이는 자리. 생김새는 쓰는 쪽이 className 으로 정한다(auth 전용이라 공통 컴포넌트 규칙 밖).
export function LoginPendingLink({ className, children }: { className?: string; children: ReactNode }) {
  const dialog = usePendingDialog();
  return (
    <>
      <button type="button" onClick={dialog.show} className={`cursor-pointer ${className ?? ""}`}>
        {children}
      </button>
      <PendingDialog open={dialog.open} onClose={dialog.close} />
    </>
  );
}
