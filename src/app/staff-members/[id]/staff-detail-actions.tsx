"use client";

import { Button } from "@/components/common";

// 퇴직 처리(WHALEERP-585) · 비밀번호 초기화(WHALEERP-177) 자리. 관리자 로그인과 api 연결 전이라 누르면 안내만 한다.
const notReady = () => window.alert("준비 중입니다.");

// 카드 머리 오른쪽. 데모는 퇴직 처리가 붉은 강조(danger)인데 공통 Button 에 그 색이 없어 primary 로 둔다.
export function StaffDetailActions() {
  return (
    <>
      <Button onClick={notReady}>퇴직 처리</Button>
      <Button href="/staff-members">목록</Button>
    </>
  );
}

// 기본 정보 표 바로 아래 줄 오른쪽(데모와 같은 자리).
export function PasswordResetButton() {
  return (
    <Button variant="soft" onClick={notReady}>
      비밀번호 초기화
    </Button>
  );
}
