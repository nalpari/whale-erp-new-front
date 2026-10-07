// 알림 템플릿의 알림 유형·발송 용도 코드(공통코드 NOTIFICATION_TYPE·SEND_PURPOSE, 1팀 8종은 1팀 값 그대로, 2026-10-07 확정).
// 목록·수정·등록 화면이 같이 쓴다. 템플릿 코드의 기본값은 「채널 접두 + 이 코드」이고 운영자가 바꿀 수 있다(NOTIFY-10).
export const CHANNELS = [
  ["운영 알림", "NTF"],
  ["앱 푸시", "PUSH"],
  ["메일", "EMAIL"],
  ["알림톡", "TALK"],
];

// [이름, 코드, 구분]
export const KINDS = [
  ["문의사항 접수", "INQUIRY_RECEIVED", "알림 유형"],
  ["도입문의 접수", "LEAD_RECEIVED", "알림 유형"],
  ["문의사항 답변", "INQUIRY_ANSWERED", "알림 유형"],
  ["도입문의 처리 상태 변경", "LEAD_ANSWERED", "알림 유형"],
  ["근로계약 날인", "CONTRACT_SIGNED", "알림 유형"],
  ["근로계약 거부", "CONTRACT_REJECTED", "알림 유형"],
  ["근로계약 만료", "CONTRACT_EXPIRED", "알림 유형"],
  ["가입 연결 보류", "LINK_HOLD", "알림 유형"],
  ["소속 추가 확인 거절", "AFFILIATION_REJECTED", "알림 유형"],
  ["계약 갱신 예정", "CONTRACT_RENEWAL_DUE", "알림 유형"],
  ["근로계약서 발송", "CONTRACT_SENT", "알림 유형"],
  ["근무스케줄 주요 변경", "SCHEDULE_CHANGED", "알림 유형"],
  ["TO-DO 배정", "TODO_ASSIGNED", "알림 유형"],
  ["급여명세서 발송", "PAYSLIP_SENT", "알림 유형"],
  ["비밀번호 찾기 핀", "STAFF_PASSWORD_PIN", "발송 용도"],
  ["관리자 초기화 재설정 링크", "STAFF_RESET_LINK", "발송 용도"],
  ["로그인 이메일 변경 핀", "EMAIL_CHANGE_PIN", "발송 용도"],
  ["도입문의 접수 확인", "LEAD_CONFIRMATION", "발송 용도"],
  ["가입 초대", "STAFF_INVITATION", "발송 용도"],
  ["회원가입 완료", "SIGNUP_DONE", "발송 용도"],
  ["신규 BP 가입 알림", "SIGNUP_ALERT", "발송 용도"],
  ["BP 신규 등록", "BP_REGISTER", "발송 용도"],
  ["플랫폼 관리자 계정 생성", "PLAT_ADMIN_CREATE", "발송 용도"],
  ["BP 관리자 계정 생성", "BP_ADMIN_CREATE", "발송 용도"],
  ["비밀번호 초기화", "PASSWORD_RESET", "발송 용도"],
  ["임시 비밀번호 발급", "TEMP_PASSWORD", "발송 용도"],
  ["회원 탈퇴 완료", "WITHDRAW_DONE", "발송 용도"],
];
export const CODE = Object.fromEntries(KINDS.map(([n, c]) => [n, c]));
