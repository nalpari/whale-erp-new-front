"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { openAction } from "@/app/notifications/actions";
import { useAllMenus, useService } from "@/components/site/session-gate";
import { serviceOfPath } from "@/lib/menus";
import { safeLink } from "@/lib/notification-view";

/**
 * 알림 줄을 누를 때 — 웨일ERP 탭에서 갈 곳이 플랫폼 화면이면 그 자리에서 플랫폼을 새 탭으로 연다.
 * 알림은 로그인한 계정의 것이라, 플랫폼 계정이 BP 를 골라 연 탭에도 플랫폼 업무(문의사항 · 도입문의 접수 등) 알림이 온다. 그대로
 * /notifications/{id}/open 을 거쳐 가면 이 탭 메뉴에 없는 주소라 「접근 권한이 없는 메뉴입니다.」로 막혔다(2026-11-13 사용자 지적, 통합테스트).
 * 새 탭은 누른 그 순간에 열어야 팝업 차단에 걸리지 않으므로 이동 화면을 거치지 않고, 읽음 처리는 뒤에서 하고 종 · 목록을 다시 그린다.
 * 헤더 「플랫폼관리」 바로가기처럼 새 탭(noopener)이라 그 탭은 주소대로 플랫폼으로 열린다. 그 밖의 알림은 기본 이동(이동 화면)을 그대로 둔다.
 */
export function usePlatformOpen(onOpened?: () => void) {
  const service = useService();
  const menus = useAllMenus();
  const router = useRouter();
  return (e: MouseEvent, n: { id: number; link: string | null }) => {
    if (service !== "WHALE_ERP") return;
    const link = safeLink(n.link);
    if (!link || serviceOfPath(menus, link) !== "PLATFORM") return;
    e.preventDefault();
    window.open(link, "_blank", "noopener");
    onOpened?.();
    // 읽음 처리 실패(만료 등)는 여기서 알리지 않는다 — 다음에 알림함 · 종이 다시 그려질 때 미확인으로 남아 보인다
    void openAction(n.id).then(() => router.refresh(), () => undefined);
  };
}
