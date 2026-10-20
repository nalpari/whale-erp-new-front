"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/common";

/** 한 칸만 못 불러왔을 때의 「다시 하기」. 페이지를 다시 받는다(router.refresh) — 다른 칸은 값이 같으면 그대로 보인다. */
export function RetryButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button variant="off" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
      다시 하기
    </Button>
  );
}
