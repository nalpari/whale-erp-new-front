"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/common";
import { ERP_THEME } from "@/components/common/theme";

// 로그인 화면(/auth/login)이 아직 없다. 그리로 가는 자리(로고·로그인 링크·웨일ERP 시작하기)는 404 대신
// 디자인 시스템 안내창(TermsDialog 와 같은 생김새의 네이티브 dialog, 단 이쪽은 body 로 포털한다)을 띄운다(2026-10-12, 코드리뷰 반영 — alert() 대신).
// 로그인 화면이 생기면 이 파일을 지우고 쓰는 곳을 href="/auth/login" 으로 되돌린다.

// 서버 렌더와 hydration 첫 렌더에서는 false, 그 뒤 브라우저에서는 true. 그래서 서버·클라이언트 HTML 이 같다.
const noopSubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

// 안내창은 document.body 로 포털해 띄운다. 쓰는 자리가 <p> 안일 수 있어(예: 가입 폼 「이미 계정이 있나요?」)
// <dialog>·<div> 를 그 자리에 두면 hydration 오류가 난다(2026-10-13).
// 포털하면 ErpRoot 밖이 되므로 ERP_THEME 을 dialog 에 직접 붙인다.
const LOGIN_PENDING = "로그인 화면은 개발 예정입니다.";

function PendingDialog({ open, onClose, message }: { open: boolean; onClose: () => void; message: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const isClient = useIsClient();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    // isClient: 포털이 붙은 뒤에야 ref 가 생긴다.
  }, [open, isClient]);

  if (!isClient) return null;
  return createPortal(
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // dialog 는 p-0, 여백은 안쪽 div 가 갖는다. 그래야 안쪽 여백을 눌러도 e.target 이 dialog 가 아니고
        // backdrop 을 누를 때만 닫힌다(TermsDialog 와 같음, 2026-10-12 코드리뷰).
        if (e.target === ref.current) onClose();
      }}
      className={`${ERP_THEME} m-auto w-[360px] max-w-[calc(100vw-32px)] rounded-[2px] border border-[#ebebeb] p-0 shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40`}
    >
      <div className="p-[23px]">
        <p className="text-[14px]">{message}</p>
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
      <PendingDialog open={dialog.open} onClose={dialog.close} message={LOGIN_PENDING} />
    </>
  );
}

// 글자 링크처럼 보이는 자리. 생김새는 쓰는 쪽이 className 으로 정한다(auth 전용이라 공통 컴포넌트 규칙 밖).
// message 를 주면 로그인이 아닌 다른 개발 예정 화면(GNB 메뉴·도입문의·공지사항 등) 안내로 쓴다(2026-10-13).
export function LoginPendingLink({
  className,
  message = LOGIN_PENDING,
  label,
  children,
}: {
  className?: string;
  message?: string;
  label?: string;
  children: ReactNode;
}) {
  const dialog = usePendingDialog();
  return (
    <>
      <button type="button" onClick={dialog.show} aria-label={label} className={`cursor-pointer ${className ?? ""}`}>
        {children}
      </button>
      <PendingDialog open={dialog.open} onClose={dialog.close} message={message} />
    </>
  );
}
