# 관리자 웹 유저플로우를 운영 정책 v272에 맞춘다

근거: 2026-11-09 재영 지시(기획 세션 header 전달). 유저플로우 19개 대조에서 나온 3팀 흐름의 어긋남을 고친다. 흐름 사본 갱신은 api 쪽에서 따로 한다.

## 고칠 것

- `docs/flow/staff-hiring`
  - 연결 판정·연결 보류를 없앤다(운영 정책 JOI-04·05·06).
  - 가입에서 본인인증을 뺀다(운영 정책 ACC-23).
  - 근로계약 상태는 여덟이다(운영 정책 CTR-02). 거부는 사유를 받지 않는다(운영 정책 CTR-07).
  - 소속 추가 확인·복귀 확인 경로와 본인 대조·수정 요청을 넣는다(운영 정책 JOI-01·09·10, CTR-27).
- `docs/flow/schedule-todo`: TO-DO 배정 알림함 줄 삭제(운영 정책 NTF-09), 근무스케줄 변경은 메일(운영 정책 NTF-18), 수행 임박은 직원 알림함만(운영 정책 NTF-12), 웹 대신 등록(운영 정책 ATT-20).
- `docs/flow/payroll`: 시스템이 계산하는 지급 항목은 기본급·주휴·연장뿐이다(운영 정책 PAY-02).
- `docs/flow/support`: 문의 등록 때 운영자에게 운영 알림이 간다(운영 정책 CNT-10), 문의자 화면은 마지막 답변만(운영 정책 CNT-17).
- `docs/flow/community-notify`: v272 NTF-01이 열 가지로 바뀌어 「열 사건」이 맞으므로 고치지 않는다.

## 하지 않는 것

- 1팀 흐름과 「확인 필요」 항목.
- 빠짐 항목 가운데 payroll 2건, schedule-todo 2건.

## 검증

- archify `validate --quality showcase`, `deliver`, `visual-check` 통과.
- 그림을 열어 선과 글자가 겹치지 않는지 본다.
- 저장소 밖 사본에서 api `deliverables/test_build_userflow.py` 를 돌린다.
