"use client";

import { useAccount } from "@/components/site/session-gate";
import { isPlatformRole } from "@/lib/auth-routes";

// 점포가 아예 없을 때의 빈 목록 문구 — 점포 없음 띠(no-store-band.tsx)와 같은 기준으로 역할마다 다르다(리뷰 반영).
// BP 마스터와 플랫폼 계정(고른 BP 의 점포 전체를 본다)은 「등록된 점포가 없습니다.」, 그 밖의 계정은 맡은 점포만 보여 BP 에 점포가 있어도 0 일 수 있어
// 「담당 점포가 없습니다.」(플랫폼 계정은 리뷰 반영 — 띠는 플랫폼 계정에 뜨지 않아 그 갈래가 빠져 있었다)
export function NoStoresText() {
  const role = useAccount().roleTypeCode;
  return <>{role === "BM" || isPlatformRole(role) ? "등록된 점포가 없습니다." : "담당 점포가 없습니다."}</>;
}
