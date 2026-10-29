"use client";

import { usePathname } from "next/navigation";
import { LoadingNotice } from "@/components/common";
import { isPublicPath } from "@/lib/auth-routes";

// 로그인 후 화면을 옮기는 동안(서버에서 다 받아 오는 페이지가 받는 동안) 이전 화면에 멈춰 보이지 않게 하는 공통 로딩이다.
// SessionGate 본문 자리(헤더 아래)는 세로 flex 라 LoadingNotice 의 flex-1 이 그 자리를 채운다. 같은 화면의 쿼리 변경(주 넘기기 · 정렬 등)은
// 화면 전환이 아니라서 이 로딩이 뜨지 않는다. 로그인 전 화면은 (public)/(site)/loading.tsx 가 따로 맡고, 로그인 후 화면에서 /login 같은
// 공개 경로로 갈 때는 공개 틀 위에 로딩이 뜨지 않게 AdminLayout 과 같은 기준(isPublicPath)으로 비운다.
export default function Loading() {
  return isPublicPath(usePathname()) ? null : <LoadingNotice />;
}
