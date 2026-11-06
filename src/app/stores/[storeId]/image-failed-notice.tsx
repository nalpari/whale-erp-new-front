"use client";

import { useEffect, useState } from "react";
import { NoticeBand } from "@/components/common";

/**
 * 등록 직후 대표 이미지만 실패했을 때의 띠. 주소의 `?imageFailed=` 는 한 번 알리는 데만 쓰고 바로 지운다 —
 * 남겨 두면 새로고침 · 뒤로 가기 · 상태 변경 뒤 다시 받을 때마다 지난 실패가 또 보인다. 띠는 이 화면에 있는 동안만 남는다.
 * Next 의 router 를 거치지 않고 history.replaceState 로 주소만 바꿔 화면을 다시 받지 않는다(Next 16 이 router 상태와 맞춘다).
 */
export function ImageFailedNotice({ message }: { message: string | null }) {
  const [shown] = useState(message);
  useEffect(() => {
    if (!message) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("imageFailed");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [message]);
  return shown ? <NoticeBand title="점포는 저장했습니다." detail={shown} /> : null;
}
