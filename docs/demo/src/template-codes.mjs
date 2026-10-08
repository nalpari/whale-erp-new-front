// 기본 알림 템플릿 37건의 템플릿 코드(네이밍 규칙 5장 「기본 템플릿 코드」, 2026-10-07 재영).
// 알림 유형·발송 용도 공통코드는 없다(NOTIFY-11). 템플릿은 채널 + 템플릿 이름 + 템플릿 코드로 구분하고,
// 코드는 전체 문자열 그대로 둔다(접두를 조립하지 않는다 — EMAIL_CHANGE_PIN 처럼 접두와 겹치는 것이 있다).
export const CHANNELS = [
  ["운영 알림", "NTF"],
  ["앱 푸시", "PUSH"],
  ["메일", "EMAIL"],
  ["알림톡", "TALK"],
];

// 수신 설정 묶음 — 앱 푸시 템플릿만 하나 고른다. 직원 알림 수신 설정이 이 묶음으로 켜고 끈다.
export const PUSH_GROUPS = ["근로계약서", "근무스케줄", "TO-DO", "급여명세서"];

const OPS = [
  ["문의사항 접수", "INQUIRY_RECEIVED"],
  ["도입문의 접수", "LEAD_RECEIVED"],
  ["문의사항 답변", "INQUIRY_ANSWERED"],
  ["도입문의 처리 상태 변경", "LEAD_ANSWERED"],
  ["근로계약 날인", "CONTRACT_SIGNED"],
  ["근로계약 거부", "CONTRACT_REJECTED"],
  ["근로계약 만료", "CONTRACT_EXPIRED"],
  ["가입 연결 보류", "LINK_HOLD"],
  ["소속 추가 확인 거절", "AFFILIATION_REJECTED"],
  ["계약 갱신 예정", "CONTRACT_RENEWAL_DUE"],
];

// 채널별 { 템플릿 이름: 템플릿 코드 }
export const CODES = {
  NTF: Object.fromEntries(OPS.map(([n, c]) => [n, `NTF_${c}`])),
  PUSH: {
    "근로계약서 발송": "PUSH_CONTRACT_SENT",
    "근무스케줄 변경": "PUSH_SCHEDULE_CHANGED",
    "TO-DO 배정": "PUSH_TODO_ASSIGNED",
    "급여명세서 발송": "PUSH_PAYSLIP_SENT",
  },
  EMAIL: {
    ...Object.fromEntries(OPS.map(([n, c]) => [n, `EMAIL_${c}`])),
    "비밀번호 찾기 핀": "EMAIL_STAFF_PASSWORD_PIN",
    "관리자 초기화 재설정 링크": "EMAIL_STAFF_RESET_LINK",
    "로그인 이메일 변경 핀": "EMAIL_CHANGE_PIN",
    "도입문의 접수 확인": "EMAIL_LEAD_CONFIRMATION",
    "회원가입 완료": "EMAIL_SIGNUP_DONE",
    "신규 BP 가입 알림": "EMAIL_SIGNUP_ALERT",
    "BP 신규 등록": "EMAIL_BP_REGISTER",
    "플랫폼 관리자 계정 생성": "EMAIL_PLAT_ADMIN_CREATE",
    "BP 관리자 계정 생성": "EMAIL_BP_ADMIN_CREATE",
    "비밀번호 초기화": "EMAIL_PASSWORD_RESET",
    "임시 비밀번호 발급": "EMAIL_TEMP_PASSWORD",
    "회원 탈퇴 완료": "EMAIL_WITHDRAW_DONE",
  },
  TALK: { "가입 초대": "TALK_STAFF_INVITATION" },
};
export const ALL_CODES = Object.values(CODES).flatMap((m) => Object.values(m));
