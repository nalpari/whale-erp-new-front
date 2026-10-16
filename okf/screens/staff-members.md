---
type: Screen
title: 직원 정보 관리 화면 (구현)
description: /staff-members 목록과 /staff-members/[id] 상세의 구현 상태 — 목록 · 상세를 api 에 붙였고(상세는 WHALEERP-599 대기), 상세 머리에 퇴직 처리 · 퇴직일 변경 · 취소 확인창을 두었다. 남은 것.
tags: [staff, screen, retirement]
status: draft
generated: { by: claude-code/opus-5.5, at: 2026-10-16T03:00:00Z }
sources:
  - id: staff-members-lib
    resource: ../../src/lib/staff-members.ts
    title: 타입(생성한 api 타입) · 조회 조건 → api 쿼리(staffListApiSearch) · 점포명 → 점포 id(storeIdsByName)
    last_modified: 2026-10-15T10:00:00Z
  - id: staff-members-api
    resource: ../../src/lib/staff-members-api.ts
    title: api 호출 — 목록 · 상세 · 퇴직 미리 보기 · 처리 · 변경 · 취소
    last_modified: 2026-10-15T10:00:00Z
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
    last_modified: 2026-10-15T10:00:00Z
  - id: staff-detail-actions
    resource: ../../src/app/staff-members/[id]/staff-detail-actions.tsx
    title: 상세 머리 버튼(퇴직 · 목록)
    last_modified: 2026-10-15T10:00:00Z
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
    title: 직원 상세 화면(틀 + 기본 정보 + 퇴직일)
    last_modified: 2026-10-15T10:00:00Z
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

**순서: api 599 머지 → front 585 머지.** 상세 api 가 없으면 상세가 모두 404 다. `:id` 가 무엇을 가리키는지는 599 설계가 정하고,
지금은 목록의 `staffMemberId` 다(`getStaffMember` 의 TODO).

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
* 라벨(`StaffJoinState` · `EmploymentType`)은 아직 화면 상수다. `getEnum` 으로 바꾸는 것은 남았다.
* api 오류(401 · 403 · 5xx)는 `error.tsx` 가 받는다. 404(상세)는 상세가 먼저 `notFound()` 로 받는다.

# 상세 — 다시 작업할 것

상세는 틀과 기본 정보만이다. 기본 정보의 「재직 상태」는 `employmentStatusCells` 로 재직 · 퇴직 예정(퇴직일) · 퇴직만
보인다 — 목록의 재직 칸(`statusCells`)은 가입 · 계약 상태를 섞은 요약이라 상세에 쓰지 않는다(2026-10-13 재영: 머지 블로커).

상세는 틀과 기본 정보(+ 퇴직 예정 · 퇴직이면 퇴직일 줄)만이다. 상세 요약 api(#183)가 나오면:

* 기본 정보의 직무 · 입사일 · 생년월일 · 본인인증 · 이메일(지금 「-」)을 채운다.
* 근로계약 · 근무스케줄 · 출퇴근 현황 · 급여명세서 · TO-DO 영역(지금 「준비 중입니다.」)을 데모처럼 채운다.
* 「비밀번호 초기화」(#177)는 지금 누르면 「준비 중입니다.」 알림만 띄운다.
* 가린 직원(본사 제공 동의 없는 가맹 직원) · 업무 범위 밖 · 없는 직원은 상세 api 가 404 라 상세로 들어가지 못한다(#184 · #599).

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
  받는다. 「닫힐 근로계약」은 **임시저장 · 발송 대기 · 서명 대기**다 — 목업은 발송 대기 · 서명 대기뿐인데 api 가 임시저장도 닫는다
  (2026-10-12 재영, 목업 수정 요청함). 지난 날짜(`isSettledNow`)는 처리하는 즉시 정리된다고 붉게 알린다 — 되돌릴 길이 없다.
  확인창을 연 채 자정을 넘기면 확인을 누를 때 오늘(KST, 브라우저 시계)을 다시 센다. 경고 없이 지난 날짜가 됐으면
  (`settlesWithoutWarning`) 처리하지 않고 경고를 띄워 다시 확인받고, 미리 보기도 새 오늘로 다시 받는다(PR #36 리뷰).
* 실패(`failureEffect`) — 403 강제 비밀번호 변경은 변경 팝업을 다시 띄우고, 403 권한 없음 · 사용할 수 없는 계정은 알린 뒤 이전
  화면으로(okf api admin-auth 「403 messages」). 400 · 404 · 409 · 401 은 확인창 안에 문구로, 결과를 모르는 실패(5xx · 연결)는
  화면을 새로 받는다.
* 공통 `ConfirmDialog` 에 확인 버튼 색(`confirmVariant`)을 더했다 — 퇴직 처리 확인이 붉다(데모). 공통 컴포넌트라 1팀 확인이 필요하다.

# 아직 없는 것

* 재발송 버튼 — api 가 `invitation.canResend` 를 주지만, 누르면 부를 발송 api(#136)가 없다.
* 가입 연결 확인 시트(#139), 일괄 저장 · 직원 초대(근로계약서 초안) · 각 「관리」 링크의 대상 화면.
* 쪽 이동이 `router.replace` 라 뒤로 가기가 쪽을 거슬러 가지 않는다.

# 공통 Button 의 danger

퇴직 처리를 데모처럼 붉게 보이려고 공통 `Button` 에 `danger`(상태 빨강 `erp-off`)를 더했다 — 데모 `ui.mjs` 의
danger 와 같은 값이다. 공통 컴포넌트와 DESIGN.md(버튼 「세 종류」)는 1팀 관리라 **1팀 확인이 필요하다.**
