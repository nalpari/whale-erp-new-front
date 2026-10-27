"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";
import { bff, BffError } from "@/lib/bff";

export type Loaded<T> = { key: string; data: T } | { key: string; error: string };

/**
 * 홈 영역 하나를 부른다. key(범위 · 점포 · 새로고침 횟수 · 부르는 조건)가 바뀔 때와 retry 때만 다시 부른다(HOM-08) — 그 밖에는 부르지 않는다.
 * 지금 key 의 결과가 아니면 got 은 null(부르는 중)이다. 영역마다 따로 불러 한쪽이 실패해도 다른 쪽은 보인다.
 * load 가 null 이면 부르지 않는다(빈 범위 · 다른 화면). 401 이면 로그인 화면으로 보낸다(SessionGate 와 같다).
 */
export function useHomeLoad<T>(load: (() => Promise<T>) | null, key: string, what: string): { got: Loaded<T> | null; retry: () => void } {
  const router = useRouter();
  const [retries, setRetries] = useState(0);
  const [got, setGot] = useState<Loaded<T> | null>(null);
  const enabled = load !== null;
  const full = `${key}#${retries}`;
  // 부르지 않는 동안(빈 범위)에는 지난 결과를 비운다 — 원래 범위로 돌아오면 key 가 지난 결과와 같아져 옛 값이 잠깐 보였다(#148 재리뷰)
  if (!enabled && got !== null) setGot(null);
  const run = useEffectEvent(() => load?.());
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    run()?.then(
      (data) => {
        if (!cancelled) setGot({ key: full, data });
      },
      (e: unknown) => {
        if (cancelled) return;
        if (e instanceof BffError && e.status === 401) return router.replace("/login");
        console.error(`홈 ${what} 조회 실패`, e);
        setGot({ key: full, error: e instanceof BffError ? e.message : "잠시 뒤 다시 불러와 주세요" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [enabled, full, what, router]);
  return { got: got?.key === full ? got : null, retry: () => setRetries((n) => n + 1) };
}

/** BFF GET 하나 — path 가 null 이면 부르지 않는다 */
export function useHomeApi<T>(path: string | null, key: string, what: string): Loaded<T> | null {
  return useHomeLoad(path === null ? null : () => bff<T>(path), `${key}|${path}`, what).got;
}
