---
target: 플랫폼 관리자 관리 화면 — 아이디/이메일 실시간 유효성 체크
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-10-20T01-52-41Z
slug: src-app-platform-admins
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2/4 | 아이디 중복확인 중 대기 표시 없음, 저장 버튼도 "저장 중" 전환 없음 |
| 2 | Match System / Real World | 4/4 | 용어 사용 정확·일관 |
| 3 | User Control and Freedom | 4/4 | 중첩 팝업 Esc 순서, 취소, 실패 시 입력값 보존 모두 잘 처리됨 |
| 4 | Consistency and Standards | 1/4 | 같은 저장소 안에 "중복확인" 패턴이 세 가지 성숙도로 공존 |
| 5 | Error Prevention | 2/4 | 저장 클릭 시 이미 알고 있던 중복 아이디 오류를 조용히 버림 |
| 6 | Recognition Rather Than Recall | 4/4 | 역할 선택지에 이름+코드+유형 인라인 표시, 실패해도 입력값 유지 |
| 7 | Flexibility and Efficiency | 3/4 | Enter로 확인 가능, 일괄 작업은 없지만 이 화면 성격상 수용 가능 |
| 8 | Aesthetic and Minimalist Design | 4/4 | DESIGN.md "조용한 작업대" 원칙에 충실 |
| 9 | Error Recovery | 3/4 | 실패 경로는 잘 연결, 성공 경로는 확인 신호 전무 |
| 10 | Help and Documentation | 3/4 | 비활성 상태에 title 툴팁으로 맥락 설명 제공 |
| **Total** | | **30/40** | **Good** |

## Design Specificity Verdict

디자인 리뷰: 화면 전체는 이 제품을 위해 만들어졌다 — 플랫폼 마스터 자기보호, 마스터 계정 보호, 주소 종속 검증, 삭제 결과를 굵게 명시. 아이디/이메일 실시간 유효성 검증만 덜 다듬어짐 — signup-form.tsx가 같은 문제를 세 차례 리뷰로 완성한 것과 대비됨.

디텍터 스캔: findings 0건. 거짓양성 없음.

시각 오버레이: 브라우저 자동화 도구 없어 생략, 정적 분석으로 대체.

## Overall Impression

삭제·초기화는 모범적이나, 영구적인 아이디 입력 과정에서 조용함이 절제가 아니라 신호 부재로 느껴진다. 이미 같은 코드베이스에 검증된 패턴이 있어 새로 설계할 필요가 없다.

## What's Working

1. 삭제/초기화 확인창 문구 — 무엇이 깨지는지 굵게, 되돌릴 수 없음을 분명히.
2. 요청 순서 보장 정확 — checkNumber ref 가드, 경쟁 상태 없음.
3. 자기보호 가드(isSelf) 폼·상세 양쪽 일관.

## Priority Issues

- [P1] 아이디 중복확인 중 대기 상태 표시 없음 (admin-form-panel.tsx:108-126)
- [P1] 아이디 사용 가능 시 긍정 확인 없음 (admin-form-panel.tsx:116-123)
- [P2] 저장 시 이미 알고 있던 중복 오류를 조용히 버림 (admin-form-panel.tsx:132-136)
- [P2] 저장 버튼에 처리 중 표시 없음 (admin-form-panel.tsx:306-308)
- [P3] 저장 중에도 폼이 계속 입력 가능 (fieldset disabled 없음)
- [P3] 대기/성공 상태에 aria-live 없음

## Persona Red Flags

Alex (파워 유저): 대기 신호 없어 흐름 깨짐, 저장 버튼 재클릭 충동.
Sam (접근성 의존): 백그라운드 확인 신호 전무.

## Minor Observations

- LOGIN_ID_TAKEN 메시지 마침표 누락
- 이메일 소문자 변환이 입력칸에 반영 안 됨
- 역할그룹 옵션 긴 이름 시 폭 문제 가능

## Questions to Consider

1. 내부 도구가 왜 회원가입 폼보다 허술한가?
2. "조용한 작업대"는 절제인가 신호 부재인가?
3. 저장 때 버린 중복 오류를 서버 왕복으로 다시 찾는 방식, 받아들일 트레이드오프인가?
