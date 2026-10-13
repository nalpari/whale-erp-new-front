"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { openAction } from "../../actions";

// 화면에 실제로 뜬 뒤에만 읽음 처리하고 업무 화면으로 보낸다. 프리렌더 중이면 보일 때까지 기다린다 — 브라우저가 링크를
// 미리 불러 둔 것만으로 읽음이 되면 안 된다(2026-10-13 종 팝오버를 지나가며 읽음이 된 일). 개발 모드의 effect 두 번은 ref 로 막는다.
export function OpenNotification({ id }: { id: number | null }) {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    const go = async () => {
      if (started.current) return;
      started.current = true;
      router.replace(id === null ? "/notifications?gone=1" : await openAction(id));
    };
    const doc = document as Document & { prerendering?: boolean };
    if (!doc.prerendering) {
      void go();
      return;
    }
    doc.addEventListener("prerenderingchange", go, { once: true });
    return () => doc.removeEventListener("prerenderingchange", go);
  }, [id, router]);

  return <p className="p-[24px] text-[14px] text-erp-muted">알림을 여는 중입니다…</p>;
}
