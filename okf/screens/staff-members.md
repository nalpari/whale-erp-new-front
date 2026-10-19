---
type: Screen
title: 직원 정보 관리 화면 (구현)
description: /staff-members 목록과 /staff-members/[id] 상세의 구현 상태 — 목록 · 상세를 api 에 붙였고, 상세 머리에 퇴직 처리 · 퇴직일 변경 · 취소 확인창을, 기본 정보 아래에 비밀번호 초기화 확인창을 두었다. 남은 것.
tags: [staff, screen, retirement, password-reset]
status: draft
generated: { by: claude-code/opus-5.5, at: 2026-10-16T08:56:00Z }
sources:
  - id: staff-members-lib
    resource: ../../src/lib/staff-members.ts
    title: 타입(생성한 api 타입) · 조회 조건 → api 쿼리(staffListApiSearch) · 점포명 → 점포 id(storeIdsByName) · 상세 이메일 칸(staffEmailText)
    last_modified: 2026-10-16T08:56:00Z
  - id: staff-members-api
    resource: ../../src/lib/staff-members-api.ts
    title: api 호출 — 목록 · 상세 · 퇴직 미리 보기 · 처리 · 변경 · 취소 · 비밀번호 재설정 링크
    last_modified: 2026-10-16T09:00:00Z
  - id: staff-list-query
    resource: ../../src/app/staff-members/staff-list-query.ts
    title: 목록 URL ↔ 조회 조건(점포명 + storeIds)
    last_modified: 2026-10-15T10:00:00Z
  - id: staff-filter
    resource: ../../src/app/staff-members/staff-filter.tsx
    title: 목록 필터 — 점포명을 로그인 정보의 관리 점포로 점포 id 로 바꾼다
    last_modified: 2026-10-15T10:00:00Z
  - id: retirement-dialog
    resource: ../../src/app/staff-members/[id]/retirement-dialog.tsx
    title: 퇴직 처리 · 퇴직일 변경 · 취소 확인창
    last_modified: 2026-10-16T09:00:00Z
  - id: staff-detail-actions
    resource: ../../src/app/staff-members/[id]/staff-detail-actions.tsx
    title: 상세 머리 버튼(퇴직 · 목록) · 비밀번호 초기화 버튼
    last_modified: 2026-10-16T09:00:00Z
  - id: confirm-dialog
    resource: ../../src/components/common/confirm-dialog.tsx
    title: 공통 확인창 — confirmVariant 추가
    last_modified: 2026-10-15T10:00:00Z
  - id: staff-list-page
    resource: ../../src/app/staff-members/page.tsx
    title: 직원 목록 화면
    last_modified: 2026-10-12T08:33:58Z
  - id: staff-detail-page
    resource: ../../src/app/staff-members/[id]/page.tsx
    title: 직원 상세 화면(틀 + 기본 정보 · 퇴직일 · 이메일 + 비밀번호 초기화 자리)
    last_modified: 2026-10-16T08:56:00Z
  - id: password-reset-dialog
    resource: ../../src/app/staff-members/[id]/password-reset-dialog.tsx
    title: 비밀번호 초기화 확인창(WHALEERP-177)
    last_modified: 2026-10-16T09:00:00Z
  - id: password-reset
    resource: ../../src/lib/password-reset.ts
    title: 비밀번호 초기화 판정 — 버튼 노출 · 받는 곳 문구 · 실패 문구
    last_modified: 2026-10-16T07:47:00Z
  - id: use-action-failure
    resource: ../../src/app/staff-members/[id]/use-action-failure.ts
    title: 상세 확인창 실패 처리(failureEffect) — 퇴직 처리는 모두, 비밀번호 초기화는 403 만 쓴다
    last_modified: 2026-10-16T09:00:00Z
  - id: staff-detail-server-actions
    resource: ../../src/app/staff-members/[id]/actions.ts
    title: 퇴직 · 재설정 링크 발송 서버 액션
    last_modified: 2026-10-16T09:00:00Z
  - id: staff-row
    resource: ../../src/app/staff-members/staff-row.ts
    title: 한 줄 표시 규칙(배지 · D-day · 재직 칸)
    last_modified: 2026-10-12T08:33:58Z
  - id: retirement
    resource: ../../src/lib/retirement.ts
    title: 퇴직 처리 판정 — 상세 머리 버튼 · 퇴직일 범위 검사(WHALEERP-585)
    last_modified: 2026-10-15T10:00:00Z
  - id: button
    resource: ../../src/components/common/button.tsx
    title: 공통 Button — danger 추가
    last_modified: 2026-10-12T08:33:58Z
---

# api 에 붙였다

목록(`/staff-members`, WHALEERP-138)은 `GET /staff-members`, 상세(`/staff-members/[id]`, WHALEERP-184)는
`GET /staff-members/:id`(WHALEERP-599)로 받는다(WHALEERP-585, 2026-10-15 노영주 결정). 목 데이터(`staff-members.mock.ts`)는
지웠다. 응답 타입은 api openapi 에서 생성한 것(`StaffMemberListItemDto`)을 그대로 쓴다 — 가린 행은 `staffMemberId` 도 null
이라 목록은 순번으로 줄을 가르고 이름 링크를 걸지 않는다. api 를 부르는 함수는 `staff-members-api.ts` 에, next 를 읽지 않는
타입 · 조건 함수는 `staff-members.ts` 에 두어 node --test 가 바로 읽는다. 배치는 데모 `docs/demo/staff/index.html` ·
`detail.html` 과 같다(목록의 「이번 주」 칸만 뺐다).

상세 api(599)는 api main 에 머지됐고, `:id` 는 목록의 `staffMemberId` 다.

# 공통 틀 안에서 그린다

로그인 후 화면이라 루트 layout 의 공통 틀(`AdminFrame` — 로그인 정보 게이트 · 공통 헤더 · 알림 종 · 메뉴 권한 확인)이
바깥 틀과 `ErpRoot` 를 씌운다. 목록 · 상세 page 는 `PageBar`(제목 줄)부터 그리고, `layout.tsx` 는 탭 제목만 둔다
(WHALEERP-593, 2026-10-14). 주소는 메뉴 url 과 같아야 열린다 — 「직원 정보 관리」(MN000005) 메뉴 url 을 `/staff` 에서
`/staff-members` 로 바꾸는 것은 1팀 일이고(#592 결정), 반영 전에는 메뉴 권한 확인에서 막힌다. 상세의 「관리」 링크는 같은
결정의 메뉴 url 로 건다. 지금은 화면이 있는 근로계약(`/contracts`)만 링크이고, 근무스케줄(`/work-schedules`) ·
출퇴근 현황(`/attendance-records`) · 급여명세서(`/payslips`) · TO-DO(`/todos`)는 흐린 「관리」로 두었다 — 걸면 메뉴가
없을 때 「접근 권한이 없는 메뉴」로 막혀 권한 문제처럼 보인다(front #26 리뷰). 화면이 생기면 링크로 바꾼다.

# 목록 조회 조건

* 화면 묶음(가입 완료 · 초대 발송 · 연결 보류 · 소속 추가 확인 · 가입 불가)은 그 상태들을 `joinState` **쉼표 목록**으로,
  고용형태는 `employmentType` 쉼표 목록으로 보낸다. 모두 고른 목록과 재직 상태 「전체」는 파라미터를 뺀다(`staffListApiSearch`).
* **묶음 · 고용형태를 하나도 고르지 않았거나 점포명에 맞는 점포가 없으면 api 를 부르지 않고 0건이다.** api 는 빈 값을
  400 으로 막고, 파라미터를 빼면 전체를 돌려준다 — 둘을 바꿔 쓰면 「하나도 안 고름」이 「전체」가 된다.
* **점포명 → 점포 id 는 로그인 정보의 관리 점포(`useStores`)에서 찾는다**(2026-10-15 노영주 A안). 필터가 점포명 부분 일치로
  id 를 찾아 URL 에 `store` 와 `storeIds` 를 함께 두고, 서버는 `storeIds` 를 그대로 api 에 싣는다. 점포 목록 api(`GET /stores`)는
  「점포 정보 관리」(MN000002) 메뉴 권한이 있어야 열려, 직원 정보 관리만 가진 관리자가 점포명으로 거르면 403 이 나기 때문이다.
  모자란 점: 로그인 정보는 로그인할 때의 값이라 그 뒤에 생긴 점포는 다시 로그인해야 잡힌다(메뉴 · 권한과 같은 정책). 범위 밖
  id 는 api 가 조용히 뺀다.
* **api 상한을 화면이 먼저 막는다**(PR #36 리뷰). 넘기면 api 400 으로 목록 전체가 오류 화면이 되기 때문이다 — 검색어(이름 ·
  번호 · 점포명)는 50자(검색칸 `maxLength` + 파서가 자름), 쪽은 1,000,000 을 넘으면 1. 점포명에 맞는 점포가 500곳(`MAX_STORE_IDS`)을
  넘으면 잘라 보내지 않고(일부 점포가 조용히 빠진다) api 를 부르지 않은 채 「점포명을 더 좁혀 주세요」를 빈 목록 자리에 보인다.
* `store` 만 있고 `storeIds` 가 없는 주소(storeIds 를 싣기 전의 북마크 · 손으로 친 주소)는 파서가 `storeIds: null` 로 읽고, 필터가
  열리며 점포 목록에서 id 를 채워 주소를 바꾼다 — 그대로 두면 검색칸에 점포명이 있는데 0건이었다. 빈 값(`storeIds=`)은 「맞는 점포 없음」이다.
  채우기 전 첫 화면은 api 를 부르지 않으므로 빈 목록 자리에 「점포를 찾는 중입니다.」를 보인다(`staffListEmptyMessage`) — 「없음」이 깜빡이지 않게.
* 목록 라벨(`joinCell` 의 `StaffJoinState` · `EmploymentType`)은 아직 화면 상수다. `getEnum` 으로 바꾸는 것은 남았다 — 상세
  「이메일」 칸의 가입 상태 한글은 이미 `getEnum` 으로 받는다(아래 「이메일」).
* api 오류(401 · 403 · 5xx)는 `error.tsx` 가 받는다. 404(상세)는 상세가 먼저 `notFound()` 로 받는다.

# 상세 — 다시 작업할 것

기본 정보의 「재직 상태」는 `employmentStatusCells` 로 재직 · 퇴직 예정(퇴직일) · 퇴직만
보인다 — 목록의 재직 칸(`statusCells`)은 가입 · 계약 상태를 섞은 요약이라 상세에 쓰지 않는다(2026-10-13 재영: 머지 블로커).

상세는 틀과 기본 정보(+ 퇴직 예정 · 퇴직이면 퇴직일 줄, 이메일), 퇴직 처리 · 비밀번호 초기화 확인창만이다. 상세 요약 api(#183)가 나오면:

* 기본 정보의 직무 · 입사일 · 생년월일 · 본인인증(지금 「-」)을 채운다. 이메일은 상세 응답 `email` 로 채웠다(#177 · #180, 아래 「이메일」).
* 근로계약 · 근무스케줄 · 출퇴근 현황 · 급여명세서 · TO-DO 영역(지금 「준비 중입니다.」)을 데모처럼 채운다.
* 가린 직원(본사 제공 동의 없는 가맹 직원) · 업무 범위 밖 · 없는 직원은 상세 api 가 404 라 상세로 들어가지 못한다(#184 · #599).
  본사 제공 동의한 가맹 직원은 본사 역할에게도 상세가 열리지만, 비밀번호 초기화는 범위가 달라 버튼이 없다(아래).

# 이메일 (WHALEERP-180)

이메일은 회원 ID 로 취급한다 — 기본 정보 「이메일」 줄은 보이기만 하고, 화면 어디에도 입력칸 · 수정 버튼 · 변경 요청 흐름을 두지
않는다(ACC-17). 관리자 웹에 이메일 찾기 확인 화면은 따로 없고, 이메일 아이디 변경 요청 방식도 쓰지 않는다.

* 보이는 사람 — 상세를 볼 수 있는 관리자(「직원 정보 관리」 조회 권한)다. api 의 「수정 권한이 있을 때만」 조건을 뺐다(2026-10-16
  노영주, api kyoto · jolteon).
* 없을 때(`staffEmailText`) — 초안 · 초대 발송은 「가입 전」이다(화면 문구). 나머지 가입 전 상태(초대 만료 · 거절 · 연결 보류 · 소속
  추가 확인 · 복귀 확인 · 가입 불가(만 19세 미만))는 상세 페이지가 `getEnum("StaffJoinState")` 로 받은 한글을 쓴다 — front 에 enum 한글
  대응표를 두지 않는다(naming.md, PR #42 리뷰). 초대 만료 · 거절은 api 가 초대 유형을 가리지 않아 이미 계정이 있는 직원의 소속 추가
  확인 · 복귀 확인에서도 생기고(api `joinStateOf`), 연결 보류 · 소속 추가 확인 · 복귀 확인은 계정이 있는 직원이라 「가입 전」이라 하면
  가입하라고 잘못 안내하게 된다(PR 전 리뷰, 2026-10-16 노영주). 가입 완료인데 없는 것(퇴직 · 탈퇴 · 본사 역할이 동의로만 보는 가맹
  점포 직원)과 가입 상태를 모르는 것은 「-」다. 퇴직은 재직 상태 줄이 말해 주고, 탈퇴와 본사 미제공은 응답만으로 확실히 가를 수 없어
  짐작해 적지 않는다. enum 을 받지 못하면 상세는 그대로 그리고 이 칸만 「-」다(영문 값을 보이지 않는다, 원인은 서버 로그).
* 알려 주는 때(ACC-16) — 직원이 근무지에 직접 와서 물은 경우에만 알려 준다. 전화나 메시지로는 알려 주지 않는다. 목업
  (`docs/mockup/staff/detail.html` 안내 문단)에는 있고 데모에는 없어, 화면에 안내 문구를 두지 않고 운영 정책으로만 다룬다(2026-10-16 노영주).

# 퇴직 처리 (WHALEERP-585)

상세 머리의 「목록」 왼쪽에 둔다. 규칙은 api `okf/api/staff-retirement.md` 와 같고(`src/lib/retirement.ts`), 화면은 미리 가를
뿐 막는 것은 api 다.

* **처리하면 퇴직이 아니라 퇴직 예정이다.** 퇴직일만 저장하고 재직 상태 · 근로계약은 그대로다. 재직 상태 칸은 「재직 ·
  퇴직 예정 MM-DD」, 기본 정보에 퇴직일 줄이 생긴다. 퇴직일 다음 날 0시 배치가 퇴직으로 바꾸며 정리하고, 그 뒤 목록은
  「퇴직 MM-DD」이고 기본 재직 필터에서 빠진다. Plane 완료 조건 3(처리하면 퇴직)은 이 차이로 문구 수정을 요청했다.
* 버튼(`retirementActions`) — 가입 완료(`JOINED`) · 재직이고 「직원 정보 관리」(MN000005) 수정 권한(`useMenuRole`)이 있을 때만.
  퇴직일이 없으면 붉은 「퇴직 처리」, 퇴직일이 오늘보다 뒤면 「퇴직일 변경」 · 「퇴직 처리 취소」(목업). 퇴직일 당일부터는 배치가
  돌 수 있어 api 가 변경 · 취소를 409 로 막으므로 버튼을 두지 않는다. 퇴직 · 가입 전 레코드도 버튼이 없다. 업무 범위 밖 직원은
  상세 api 가 404 라 판정에 오지 않는다.
* 확인창 — 퇴직일(`checkRetiredDate`: 오늘 이후 상한 없음, 또는 최근 3개월 안. 달력 달로 빼고 말일 보정 5-31 → 2-28)을 받고,
  날짜를 바꿀 때마다 미리 보기(`retirement-preview`)를 다시 받아 지워질 근무스케줄 · 풀릴 개인 TO-DO 배정 · 닫힐 근로계약 건수를
  보인다. 그 날짜의 미리 보기가 있어야 확인 버튼이 열린다 — 입사일보다 앞선 날짜처럼 화면이 모르는 거절은 미리 보기의 400 으로
  받는다. 「닫힐 근로계약」은 **임시저장 · 발송 대기 · 서명 대기 · 수정 요청**이다 — 목업은 발송 대기 · 서명 대기뿐인데 api 가 임시저장도 닫는다
  (2026-10-12 재영, 목업 수정 요청함). 지난 날짜(`isSettledNow`)는 처리하는 즉시 정리된다고 붉게 알린다 — 되돌릴 길이 없다.
  확인창을 연 채 자정을 넘긴 경우는 **서버 시계로만** 판정한다 — api 의 즉시 정리 판정이 서버 시계라서다. 확인창이 경고를 정할
  때 쓴 오늘을 서버 액션(처리 · 변경)에 함께 보내고, 서버 액션이 서버의 오늘로 경고 없이 지난 날짜가 됐는지(`staleDayWarning`)
  판정해 막으며 서버의 오늘을 돌려준다. 확인창의 오늘은 그 값으로만 바뀌고(`todayAfterSubmit`) 경고 · 미리 보기를 다시 그린다.
  브라우저 시계는 쓰지 않는다 — 빠르면 과잉 경고, 받은 서버의 오늘을 덮으면 경고가 번갈아 사라졌다 나타났다(PR #36 재리뷰 2 · 3).
  남은 틈: 프런트 서버 시계와 api 시계 사이(수백 ms · 호스트 시계 차이). 완전히 막으려면 api 가 퇴직 POST · PUT 에 「기대한 오늘」을
  받아 비교해야 한다 — api 쪽 후속이고, 생기면 서버 액션이 확인창의 오늘을 그 값으로 넘긴다.
* 실패(`failureEffect`) — 403 강제 비밀번호 변경은 변경 팝업을 다시 띄우고, 403 권한 없음 · 사용할 수 없는 계정은 알린 뒤 이전
  화면으로(okf api admin-auth 「403 messages」). 400 · 404 · 409 · 401 은 확인창 안에 문구로, 결과를 모르는 실패(5xx · 연결)는
  화면을 새로 받는다.
* 공통 `ConfirmDialog` 에 확인 버튼 색(`confirmVariant`)을 더했다 — 퇴직 처리 확인이 붉다(데모). 공통 컴포넌트라 1팀 확인이 필요하다.

# 비밀번호 초기화 (WHALEERP-177)

기본 정보 표 아래 줄 오른쪽에 둔다(데모 자리). 관리자는 비밀번호를 알 수도 정할 수도 없다 — 재설정 링크가 직원 계정 이메일
(회원가입 때 쓴 것)로 가고, 직원이 링크를 열어 스스로 정한다. api 는 `POST /staff-members/:id/password-reset-links` 다.

* 버튼(`canResetPassword`) — 가입 완료(`JOINED`) · 재직이고 「직원 정보 관리」 수정 권한이 있을 때만. 퇴직 예정(재직 + 퇴직일)은
  보인다 — 아직 일하는 직원이고 api 도 퇴직(`RETIRED`)만 409 로 막는다(2026-10-16 노영주). 본사 역할(BM · BA, 로그인 정보의
  `roleTypeCode`)은 직영 점포 직원에게만 보인다 — 본사 제공 동의한 가맹 직원은 상세가 열리지만 api 의 계정 조치 범위
  (`canManageStaffAccount`)는 동의와 상관없이 점포 단위라 404 다(2026-10-14 재영, ATT-30). 점포 유형을 모르면 api 처럼 숨긴다
  (PR 전 리뷰, 2026-10-16 노영주). 본사 역할이 아니면 점포 유형을 보지 않는다. 탈퇴 계정(가입 완료인데 `email` 이 null)에게도
  숨긴다(데모 주석, 2026-10-16 노영주) — 상세 응답에 탈퇴 표시가 따로 없어, 가입 완료 · 재직 · (본사 역할이면) 직영인데 `email` 이
  null 이면 탈퇴뿐이라는 api 규칙(WHALEERP-180)에 기댄다. 놓친 경우는 api 409 다. 숨길 때는 줄째 뺀다.
* 확인창 — 제목 「비밀번호를 초기화하시겠습니까?」, 취소 · 초기화(데모 `resetDialog`). 본문은 데모 뼈대에 관리자가 비밀번호를 모른다는
  것(완료 조건 2) · 새 링크가 발송되면 앞 링크 무효(목업)를 더했다 — 받는 곳 · 24시간 한 번만 · 여러 BP 공통 · 1분 안에 다시 보낼 수 없음.
* 받는 곳(`resetRecipientText`) — 상세 응답의 `email`(계정 이메일, 재설정 링크가 가는 곳)으로 「이메일 아이디 OOO 으로」, null 이면
  「직원의 이메일 아이디로」. 상세 응답은 api #56 부터 `StaffMemberDetailResponseDto`(목록 한 줄 + `email`)다. `email` 은 조회 권한이면 나오고, 가입 전 · 탈퇴 · 퇴직, 본사 역할(BM · BA)이
  동의로만 보는 가맹 점포 직원이면 null 이다(WHALEERP-180 — api #56 은 수정 권한 없음도 null 이었다). null 인 경우 모두 다른 판정으로도
  버튼이 없다. 조회 권한만 있는 관리자에게는 email 이 와도 수정 권한 판정으로 버튼이 없다. 응답에 `email` 칸이 없으면(api #56 전 배포) 탈퇴인지 몰라 버튼을 숨긴다.
  기본 정보의 「이메일」 줄도 이 값으로 채운다(위 「이메일」). 타입은 api main(9df02b7, api #60 머지) 기준이다.
* 실패(`resetFailureMessage`) — 404 · 409 · 429 · 503 은 api 문구 그대로, 401 은 로그인 만료 문구다. 429 는 데모의 「잠시 뒤 다시
  시도해 주세요」가 아니라 api 의 「방금 재설정 링크를 보냈습니다. 1분 뒤에 다시 보낼 수 있습니다」다 — 결과 모름 뒤 다시 누른 경우가
  많아 이미 보냈다는 사실을 알려야 다시 보내 직원의 링크를 무효로 만들지 않는다(2026-10-16 노영주, 데모와 다름). 서버가 api 결과를
  모르면(5xx · 연결) 「직원이 메일을 받지 못했다면 1분 뒤 다시 보내 주세요」, 서버 액션 자체를 부르지 못하면(연결 끊김 · 배포 뒤 옛 화면)
  「화면을 새로 고친 뒤 …」다. api 의 503(링크 주소 · 발송기 없음 · 발송 실패, 문구가 있는 Nest 본문 `{ statusCode: 503, message }`)은
  보내지 않았다고 알린 것이라 결과 모름으로 묶지 않는다(`isApiSendRefusal`) — 프록시 · 로드밸런서의 503 은 결과 모름이다. 409 는
  화면이 낡았다는 뜻이라 상세를 다시 받아 버튼을 거둔다(`refreshesAfterReset`) — 다시 받으면 확인창도 함께 내려가므로 문구를
  토스트로 알리고 닫은 뒤 다시 받는다(PR #37 리뷰). 403 은 퇴직 확인창과 같다(`use-action-failure.ts` 의
  `useFailure`). 결과 모름은 서버 로그에 기능 이름(퇴직 · 비밀번호 초기화)과 staffMemberId 를 함께 남긴다 — 퇴직 서버 액션도 같다. 확인 버튼은 그리기 전 두 번째 클릭도 ref 로 막는다.
* 보낸 시각 · 기한은 보이지 않는다 — 성공하면 토스트 「재설정 링크를 보냈습니다.」뿐이다. Plane 완료 조건 4(발송 시각 · 기한 24시간)는
  발송 종류를 담는 이메일 발송 로그 테이블을 따로 만들어 발송 이력으로 다룬다(2026-10-16 노영주). api 응답의 `issuedAt` · `expiresAt`
  은 지금 쓰지 않는다.

# 아직 없는 것

* 재발송 버튼 — api 가 `invitation.canResend` 를 주지만, 누르면 부를 발송 api(#136)가 없다.
* 가입 연결 확인 시트(#139), 일괄 저장 · 직원 초대(근로계약서 초안) · 각 「관리」 링크의 대상 화면.
* 쪽 이동이 `router.replace` 라 뒤로 가기가 쪽을 거슬러 가지 않는다.

# 공통 Button 의 danger

퇴직 처리를 데모처럼 붉게 보이려고 공통 `Button` 에 `danger`(상태 빨강 `erp-off`)를 더했다 — 데모 `ui.mjs` 의
danger 와 같은 값이다. 공통 컴포넌트와 DESIGN.md(버튼 「세 종류」)는 1팀 관리라 **1팀 확인이 필요하다.**
