"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/common";
import { LOGOUT_FAILED_EVENT, LOGOUT_FAILED_MESSAGE } from "@/lib/sign-out";

// 로그아웃이 실패했을 때(연결 끊김 · 배포 직후 옛 화면이 로그아웃 액션을 못 찾음 · 서버 오류)의 「로그아웃 실패」 팝업. signOut() 이 이벤트를 보낸다.
// 옛 화면은 새로 고쳐야 액션을 다시 찾으므로 버튼은 [새로고침] 하나다(2026-11-09 사용자 지정). Esc 로는 닫을 수 있다 — 화면을 계속 쓰다 다시 시도해도 된다.
export function LogoutFailedDialog() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = () => setOpen(true);
    addEventListener(LOGOUT_FAILED_EVENT, show);
    return () => removeEventListener(LOGOUT_FAILED_EVENT, show);
  }, []);
  return (
    <ConfirmDialog open={open} title="로그아웃 실패" confirmLabel="새로고침" cancelLabel={null} onConfirm={() => location.reload()} onCancel={() => setOpen(false)}>
      <p>{LOGOUT_FAILED_MESSAGE}</p>
    </ConfirmDialog>
  );
}
