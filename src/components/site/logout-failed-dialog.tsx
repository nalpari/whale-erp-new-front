"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/common";
import { LOGOUT_FAILED_EVENT, LOGOUT_FAILED_MESSAGE } from "@/lib/sign-out";

/**
 * 로그아웃 실패 팝업(2026-11-09 사용자 지정 — 브라우저 경고창 대신). signOut() 이 실패하면 신호를 보낸다.
 * [새로고침] 하나 — 배포 직후 옛 화면은 새로 고쳐야만 서버 액션을 찾는다. 화면은 그대로 쓸 수 있어 Esc 로 닫아도 된다.
 */
export function LogoutFailedDialog() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = () => setOpen(true);
    addEventListener(LOGOUT_FAILED_EVENT, show);
    return () => removeEventListener(LOGOUT_FAILED_EVENT, show);
  }, []);
  return (
    <ConfirmDialog open={open} title="로그아웃 실패" confirmLabel="새로고침" cancelLabel={null} onConfirm={() => location.reload()} onCancel={() => setOpen(false)}>
      {LOGOUT_FAILED_MESSAGE}
    </ConfirmDialog>
  );
}
