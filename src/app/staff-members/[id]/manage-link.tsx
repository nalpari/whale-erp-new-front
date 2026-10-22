"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMenuRole } from "@/components/site/session-gate";
import type { MenuCode } from "@/lib/menus";

// 직원 상세 영역 머리의 「관리」. 직원 상세는 「직원 정보 관리」 권한으로 열리고 각 관리 화면은 그 메뉴의 조회 권한이라, 권한이 없는
// 관리자를 공통 틀이 막는 곳으로 보내지 않게 흐리게 두고 누를 수 없게 한다(화면이 없을 때의 「관리」와 같은 모양, front #90 리뷰).
// 막는 것은 공통 틀과 api 다.
export function MenuManageLink({ menuCode, menuName, href }: { menuCode: MenuCode; menuName: string; href: string }) {
  const canRead = useMenuRole(menuCode, "read");
  return canRead ? (
    <Link href={href} className="text-erp-link hover:underline">
      관리
    </Link>
  ) : (
    <span aria-disabled="true" title={`${menuName} 조회 권한이 없습니다.`} className="cursor-default text-erp-muted">
      관리
    </span>
  );
}

/**
 * 다른 메뉴 화면으로 가는 글자 링크(직원 상세 급여명세서 칸의 급여 기간 → 명세서 상세 등). 그 메뉴 조회 권한이 없으면 글자만 둔다 —
 * 「관리」처럼 공통 틀이 막는 곳으로 보내지 않는다(front #57 규칙).
 */
export function MenuTextLink({ menuCode, href, children }: { menuCode: MenuCode; href: string; children: ReactNode }) {
  const canRead = useMenuRole(menuCode, "read");
  return canRead ? (
    <Link href={href} className="text-erp-link hover:underline">
      {children}
    </Link>
  ) : (
    <>{children}</>
  );
}
