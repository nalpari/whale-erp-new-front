"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";
import { useLoadGroupHold } from "@/components/common/load-group";
import { bff, BffError } from "@/lib/bff";
import { PASSWORD_CHANGE_REQUIRED_MESSAGE } from "@/lib/retirement";

export type Loaded<T> = { key: string; data: T } | { key: string; error: string };

/**
 * 화면 영역 하나를 부른다(홈 · LoadGroup 안의 영역). key(범위 · 점포 · 새로고침 횟수 · 부르는 조건)가 바뀔 때와 retry 때만 다시 부른다(HOM-08) — 그 밖에는 부르지 않는다.
 * 지금 key 의 결과가 아니면 got 은 null(부르는 중)이다. 영역마다 따로 불러 한쪽이 실패해도 다른 쪽은 보인다.
 * 가장 가까운 LoadGroup 이 있으면 처음 받는 동안 그 묶음을 붙잡고(성공 · 실패로 끝나면 놓는다), 묶음이 풀린 뒤의 key 변경 · retry 는 묶지 않는다. 묶음 밖이면 그대로 동작한다.
 * load 가 null 이면 부르지 않는다(빈 범위 · 다른 화면). 401 이면 로그인 화면으로 보낸다(SessionGate 와 같다) — 이때 묶음은 놓지 않는다(이동하므로 시간 제한이 푼다).
 */
export function useLoad<T>(load: (() => Promise<T>) | null, key: string, what: string): { got: Loaded<T> | null; retry: () => void } {
  const router = useRouter();
  const [retries, setRetries] = useState(0);
  const [got, setGot] = useState<Loaded<T> | null>(null);
  const enabled = load !== null;
  const full = `${key}#${retries}`;
  // key 가 바뀌거나 부르지 않는 동안(빈 범위)에는 지난 결과를 비운다 — A → B → A 처럼 원래 key 로 돌아오면 B 응답 전이라도
  // 남아 있던 A 의 옛 결과가 key 와 같아져 잠깐 보였다(#148 재리뷰 · WHALEERP-620)
  const [seen, setSeen] = useState(full);
  if (seen !== full) {
    setSeen(full);
    if (got !== null) setGot(null);
  } else if (!enabled && got !== null) setGot(null);
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
        // 강제 비밀번호 변경 전 403 은 정해진 동작이라 오류로 남기지 않는다 — 팝업 뒤 화면이 먼저 부른다(2026-10-28)
        const passwordPending = e instanceof BffError && e.status === 403 && e.message === PASSWORD_CHANGE_REQUIRED_MESSAGE;
        if (!passwordPending) console.error(`${what} 조회 실패`, e);
        setGot({ key: full, error: e instanceof BffError ? e.message : "잠시 뒤 다시 불러와 주세요." });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [enabled, full, what, router]);
  const current = got?.key === full ? got : null;
  // 부르지 않는 로더(enabled 가 false)와 이미 받은 로더는 붙잡지 않는다
  useLoadGroupHold(enabled && current === null);
  return { got: current, retry: () => setRetries((n) => n + 1) };
}

/** BFF GET 하나 — path 가 null 이면 부르지 않는다 */
export function useApi<T>(path: string | null, key: string, what: string): Loaded<T> | null {
  return useLoad(path === null ? null : () => bff<T>(path), `${key}|${path}`, what).got;
}
