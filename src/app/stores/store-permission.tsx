"use client";

import type { ReactNode } from "react";
import { usePagePermission } from "@/components/site/session-gate";

/**
 * 지금 주소(점포 정보 관리 /stores 와 그 아래 등록 · 수정)의 메뉴 권한이 있을 때만 children 을 그린다 — 서버 컴포넌트(목록 · 등록 · 수정 화면)가 감싸 쓴다.
 * 메뉴 권한은 로그인 정보(브라우저)에 있어 서버에서는 모른다. 화면은 숨기기만 하고 막는 것은 api 다.
 * 가맹 마스터 · 가맹 관리자는 등록 권한이 켜져 있어도 api 가 403 으로 막는다.
 */
export function StorePermission({ action, children, fallback = null }: { action: "create" | "update" | "delete"; children: ReactNode; fallback?: ReactNode }) {
  return usePagePermission()[action] ? children : fallback;
}
