"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/common";
import { ERP_THEME } from "@/components/common/theme";

// 로그인 화면(/auth/login)이 아직 없다. 그리로 가는 자리(로고·로그인 링크·웨일ERP 시작하기)는 404 대신
// 디자인 시스템 안내창(TermsDialog 와 같은 네이티브 dialog 틀)을 띄운다(2026-10-12, 코드리뷰 반영 — alert() 대신).
// 로그인 화면이 생기면 이 파일을 지우고 쓰는 곳을 href="/auth/login" 으로 되돌린다.

// 서버 렌더와 hydration 첫 렌더에서는 false, 그 뒤 브라우저에서는 true. 그래서 서버·클라이언트 HTML 이 같다.
const noopSubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

// 안내창은 document.body 로 포털해 띄운다. 이 링크는 <p> 안에도 들어가는데(가입 폼 「이미 계정이 있나요?」,
// 가입 완료 안내 문단), <dialog>·<div> 는 <p> 안에 둘 수 없어 hydration 오류가 났다(2026-10-13).
// 포털하면 ErpRoot 밖이 되므로 ERP_THEME 을 dialog 에 직접 붙인다.
function PendingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const isClient = useIsClient();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open, isClient]);

  if (!isClient) return null;
  return createPortal(
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // TermsDialog 와 같은 이유로 안쪽은 padding 없는 div 로 감싼다(2026-10-12 코드리뷰).
        if (e.target === ref.current) onClose();
      }}
      className={`${ERP_THEME} m-auto w-[360px] max-w-[calc(100vw-32px)] rounded-[2px] border border-[#ebebeb] p-0 shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40`}
    >
      <div className="p-[23px]">
        <p className="text-[14px]">로그인 화면은 개발 예정입니다.</p>
        <div className="mt-[18px] flex justify-end">
          <Button onClick={onClose}>확인</Button>
        </div>
      </div>
    </dialog>,
    document.body,
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
