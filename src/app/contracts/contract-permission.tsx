"use client";

import type { ReactNode } from "react";
import { useMenuRole, usePagePermission } from "@/components/site/session-gate";
import { MENU_CODE } from "@/lib/menus";

type Action = "create" | "update" | "delete";

/**
 * 지금 주소(근로계약 관리 /contracts 와 그 아래 작성 · 상세 · 수정)의 메뉴 권한이 있을 때만 children 을 그린다 — 서버 컴포넌트
 * (목록 · 상세 · 작성 · 수정 화면)가 감싸 쓴다(WHALEERP-592). 동작을 여럿 주면 그중 하나만 있어도 그린다(임시저장 이어 쓰기는
 * 작성 또는 수정). 메뉴 권한은 로그인 정보(브라우저)에 있어 서버에서는 모른다. 화면은 숨기기만 하고 막는 것은 api 다.
 */
export function ContractPermission({ action, children, fallback = null }: { action: Action | readonly Action[]; children: ReactNode; fallback?: ReactNode }) {
  const can = usePagePermission();
  return (typeof action === "string" ? [action] : action).some((a) => can[a]) ? children : fallback;
}

/**
 * 다른 메뉴 화면에 놓인 근로계약 버튼(직원 정보 관리의 「직원 초대」 → 근로계약서 작성)용 — 지금 주소가 근로계약이 아니라
 * 메뉴 코드(근로계약 관리 MN000006)로 권한을 찾는다. 막는 것은 api 다.
 */
export function ContractMenuPermission({ action, children }: { action: Action; children: ReactNode }) {
  return useMenuRole(MENU_CODE.contracts, action) ? children : null;
}
