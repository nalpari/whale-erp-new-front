"use client";

import { useEffect, useState } from "react";
import { SAVED_COOKIE } from "./contract-list";

// 저장 뒤 목록 위 안내(쿠키 SAVED_COOKIE, WHALEERP-132). 처음 받은 문장만 쥐고, 그리자마자 쿠키를 지운다 — 새로고침 · 뒤로 가기 ·
// 즐겨찾기로 다시 열었을 때 「알림톡을 보냈습니다」가 또 뜨지 않게. 주소는 건드리지 않아 필터의 헤더 범위 채우기와 겹치지 않는다.
// 늘 같은 자리에 그려 두어, 필터가 주소를 바꿔 서버가 쿠키 없이 다시 그려도 안내가 남는다. 다른 화면으로 가면 사라진다.
export function SavedNotice({ text }: { text: string | null }) {
  const [shown] = useState(text);
  useEffect(() => {
    if (text) document.cookie = `${SAVED_COOKIE}=; path=/contracts; max-age=0; samesite=lax`;
  }, [text]);
  if (!shown) return null;
  return (
    <p role="status" className="rounded-[2px] border border-erp-panel-line bg-erp-subtle px-[16px] py-[12px] text-[14px] text-erp-ink">
      {shown}
    </p>
  );
}
