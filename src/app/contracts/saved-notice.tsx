"use client";

import { useEffect, useState } from "react";

// 저장 뒤 목록 위 안내(?saved=, WHALEERP-132). 처음 받은 문장만 쥐고, 그리자마자 주소에서 saved 를 지운다 — 새로고침 · 뒤로 가기 ·
// 즐겨찾기로 다시 열었을 때 「알림톡을 보냈습니다」가 또 뜨지 않게. 늘 같은 자리에 그려 두어, 필터가 헤더 범위로 주소를 채우는 바꿈
// (서버가 saved 없이 다시 그림)에도 안내가 남는다. 다른 화면으로 가면 사라진다.
export function SavedNotice({ text }: { text: string | null }) {
  const [shown] = useState(text);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("saved")) return;
    url.searchParams.delete("saved");
    window.history.replaceState(window.history.state, "", url);
  }, []);
  if (!shown) return null;
  return (
    <p role="status" className="rounded-[2px] border border-erp-panel-line bg-erp-subtle px-[16px] py-[12px] text-[14px] text-erp-ink">
      {shown}
    </p>
  );
}
