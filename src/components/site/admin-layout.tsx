"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isPublicPath } from "@/lib/auth-routes";
import { AdminFrame } from "./admin-frame";

// 로그인 전·후 틀을 가른다. 기준은 proxy 와 같은 공개 경로 목록(isPublicPath)이라 「로그인이 필요한 화면 = 공통 틀이 씌워지는 화면」이다.
// 로그인 후 화면은 폴더를 묶지 않아도(괄호 폴더 없이 주소 그대로) 이 틀 안에 들어가고, ERP·플랫폼은 탭의 서비스(SessionGate)로 가른다.
// 공개 경로를 더하면 proxy 의 로그인 요구와 이 틀이 함께 빠진다.
export function AdminLayout({ alarm, children }: { alarm: ReactNode; children: ReactNode }) {
  if (isPublicPath(usePathname())) return children;
  return <AdminFrame alarm={alarm}>{children}</AdminFrame>;
}
