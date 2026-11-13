"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/common";
import { EXPIRED_MESSAGE, EXPIRED_REASON, loginPathOf } from "@/lib/auth-routes";
import { SESSION_EXPIRED_EVENT } from "@/lib/session-expiry";

// 화면을 쓰다 로그인이 끊겼을 때(조회 · 저장 · 확인) 띄우는 「로그인 만료」 팝업. 로그인한 화면의 틀(AdminFrame)에 하나만 둔다.
// bff() · useAction 이 만료를 알면 SESSION_EXPIRED_EVENT 를 보낸다. 이미 열려 있으면 그대로라 여러 요청이 한꺼번에 실패해도 팝업은 하나다.
// [확인] 하나뿐이고 Esc · 바깥 클릭으로 닫히지 않는다. 로그인 화면으로는 앱 안 이동이 아니라 location.replace 로 간다 —
// 결과를 넘기지 않고 멈춰 둔 서버 액션이 앱 안 이동을 막을 수 있고, 뒤로 가기로 만료된 화면에 돌아오지 않게 한다.
export function SessionExpiredDialog() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = () => setOpen(true);
    addEventListener(SESSION_EXPIRED_EVENT, show);
    return () => removeEventListener(SESSION_EXPIRED_EVENT, show);
  }, []);
  return (
    <ConfirmDialog
      open={open}
      title="로그인 만료"
      cancelLabel={null}
      onConfirm={() => location.replace(loginPathOf(location.pathname, "GET", EXPIRED_REASON))}
      onCancel={() => {}}
    >
      <p>{EXPIRED_MESSAGE}</p>
    </ConfirmDialog>
  );
}
