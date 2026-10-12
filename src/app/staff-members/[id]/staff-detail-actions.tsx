"use client";

import { Button } from "@/components/common";

// 퇴직 처리(WHALEERP-585) · 비밀번호 초기화(WHALEERP-177) 자리. 관리자 로그인과 api 연결 전이라 누르면 안내만 한다.
const notReady = () => window.alert("준비 중입니다.");

export function StaffDetailActions() {
  return (
    <>
      <Button variant="soft" onClick={notReady}>
        비밀번호 초기화
      </Button>
      <Button variant="soft" onClick={notReady}>
        퇴직 처리
      </Button>
      <Button href="/staff-members">목록</Button>
    </>
  );
}
