"use client";

import { useEffect, useState } from "react";
import { SAVED_COOKIE, savedNoticeOf } from "./contract-list";

// 저장 뒤 목록 위 안내(쿠키 SAVED_COOKIE, WHALEERP-132). 쿠키는 화면이 읽는다 — 서버가 문장을 그려 두면 목록 → 상세 → [뒤로] 때 Next 가
// 기억한 화면을 다시 써 안내가 또 뜬다(front #127 리뷰). 처음 그릴 때 쿠키를 읽어 문장을 쥐고 곧바로 지운다 — 다시 그려지거나 뒤로
// 돌아와도 쿠키가 없어 뜨지 않는다. 주소는 건드리지 않아 필터의 헤더 범위 채우기와 겹치지 않는다. 다른 화면으로 가면 사라진다.
export function SavedNotice() {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    const value = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${SAVED_COOKIE}=`))
      ?.slice(SAVED_COOKIE.length + 1);
    if (value === undefined) return;
    document.cookie = `${SAVED_COOKIE}=; path=/contracts; max-age=0; samesite=lax`;
    // 쿠키는 클라이언트에서 읽고 바로 지운다 — 첫 렌더에 읽으면 하이드레이션이 어긋나고, 읽으며 지우는 것은 그리는 중에 할 수 없다(login-form 과 같다).
    // 값은 풀지 않는다 — 넣는 값이 모두 영문 키라 풀 것이 없고, 깨진 값(다른 경로 · 하위 도메인에서 심은 %E0 등)을 decodeURIComponent 에
    // 넘기면 URIError 로 목록이 오류 화면이 된다(front #127 재리뷰). 모르는 값이면 savedNoticeOf 가 null 이라 안내가 없다
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText(savedNoticeOf(value));
  }, []);
  if (!text) return null;
  return (
    <p role="status" className="rounded-[2px] border border-erp-panel-line bg-erp-subtle px-[16px] py-[12px] text-[14px] text-erp-ink">
      {text}
    </p>
  );
}
