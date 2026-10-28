"use client";

import { useEffect, useState } from "react";
import { bff } from "@/lib/bff";
import type { BpOption } from "@/lib/session";
import { useAccount, useCurrentBp } from "./session-gate";

// 같은 탭에서 헤더 · 점포 등록이 함께 물어도 한 번만 부른다. BP 상태는 다른 탭(BP 마스터 관리)에서 바뀔 수 있어
// 30초가 지나면 다음 화면에서 다시 묻는다 — 오래 남은 「미사용」이 다시 사용으로 바뀐 BP 의 저장을 막지 않게(리뷰로 찾음)
const TTL_MS = 30_000;
const cache = new Map<number, { at: number; pending: Promise<string | null> }>();

/**
 * 이 탭 BP 의 계정 상태(공통코드 ACCOUNT_STATUS — 사용 · 미사용 · 탈퇴). 플랫폼 계정만 본다 — BP 계정은 자기 BP 가 사용이 아니면 로그인하지 못한다.
 * BP 하나를 따로 묻는 api 가 없어 BP 선택 창과 같은 GET /bp-codes 를 BP코드로 찾는다. 받기 전 · 받지 못함 · BP 계정은 null 이다(2026-10-28).
 */
export function useCurrentBpStatus(): string | null {
  const account = useAccount();
  const bp = useCurrentBp();
  const [status, setStatus] = useState<{ bpCodeId: number; code: string | null } | null>(null);
  useEffect(() => {
    if (!account.bp.isPlatform) return;
    let live = true;
    const cached = cache.get(bp.bpCodeId);
    let pending = cached && Date.now() - cached.at < TTL_MS ? cached.pending : undefined;
    if (!pending) {
      const params = new URLSearchParams({ page: "1", pageSize: "20", keyword: bp.bpCode });
      pending = bff<{ items: BpOption[] }>(`/bp-codes?${params}`)
        .then((r) => r.items.find((b) => b.bpCodeId === bp.bpCodeId)?.accountStatusCode ?? null)
        // 응답 모양이 달라 꺼내다 던져도 여기서 받는다 — 거절된 약속이 캐시에 남지 않게 지우고 null(리뷰로 찾음)
        .catch((e: unknown) => {
          cache.delete(bp.bpCodeId);
          console.warn("이 탭 BP 의 상태를 확인하지 못했습니다", e);
          return null;
        });
      cache.set(bp.bpCodeId, { at: Date.now(), pending });
    }
    pending.then((code) => live && setStatus({ bpCodeId: bp.bpCodeId, code }));
    return () => {
      live = false;
    };
  }, [account.bp.isPlatform, bp.bpCodeId, bp.bpCode]);
  return account.bp.isPlatform && status?.bpCodeId === bp.bpCodeId ? status.code : null;
}
