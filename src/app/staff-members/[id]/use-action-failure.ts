"use client";

import { useRouter } from "next/navigation";
import { PASSWORD_REQUIRED_EVENT } from "@/lib/bff";
import { failureEffect } from "@/lib/retirement";
import type { ActionFailure } from "./actions";

// 직원 상세 확인창(퇴직 처리 · 비밀번호 초기화 · 생년월일 정정)이 서버 액션 실패를 받은 뒤 할 일. 403 두 가지는 okf api admin-auth 「403 messages」를 따른다.

/** 실패를 받은 뒤 할 일. 확인창 안에 둘 문구면 돌려주고, 아니면 여기서 처리하고 null. */
export function useFailure() {
  const router = useRouter();
  return (failure: ActionFailure): string | null => {
    switch (failureEffect(failure)) {
      case "password":
        dispatchEvent(new Event(PASSWORD_REQUIRED_EVENT));
        return failure.message;
      case "leave":
        // 권한이 없거나 쓸 수 없는 계정 — 안내하고 들어오기 전 화면으로(공통 틀의 메뉴 권한 막기와 같다)
        alert(failure.message);
        if (history.length > 1) history.back();
        else router.replace("/home");
        return null;
      case "refresh":
        router.refresh();
        return failure.message;
      case "inline":
        return failure.message;
    }
  };
}
