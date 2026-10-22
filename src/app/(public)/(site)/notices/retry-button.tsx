"use client";

import { useRouter } from "next/navigation";
import { GuestButton } from "@/app/design/guest/guest-ui";

// 불러오지 못했을 때 「다시 시도」 — 주소(쪽 · #faq 탭)를 그대로 둔 채 서버에서 다시 받는다.
export function RetryButton() {
  const router = useRouter();
  return (
    <GuestButton tone="outline" onClick={() => router.refresh()}>
      다시 시도
    </GuestButton>
  );
}
