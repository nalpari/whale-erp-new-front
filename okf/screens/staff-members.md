---
type: Screen
title: 직원 정보 관리 화면 (구현)
description: /staff-members 목록과 /staff-members/[id] 상세의 구현 상태 — 목록 · 상세를 api 에 붙였고, 목록 가입·인증 칸과 상세 가입 상태 줄에 가입 초대 재발송을 두었으며, 상세 머리에 퇴직 처리 · 퇴직일 변경 · 취소 확인창을, 기본 정보에 재입사로 이은 재직 이력 줄(WHALEERP-615)을, 그 아래에 비밀번호 초기화 확인창을, 그 아래에 가장 최근 근로계약 요약 칸을, 두 단 아래에 발송 이력 칸(WHALEERP-136)을, 오른쪽에 근무스케줄 · 출퇴근 현황 · 급여명세서 · TO-DO 영역을 영역마다 상세 요약 api(#183)로 따로 받아 두었다 — 근무스케줄은 데모대로 한 주 보기 · 주 넘김 · 주 선택 달력이다(2026-10-22 노영주, WHALEERP-185 기간 선택을 걷었다), 기본 정보 생년월일 줄에 [정정] 확인창(WHALEERP-602)을 두었다. 남은 것.
tags: [staff, screen, retirement, password-reset, invitation, birth-date]
status: draft
generated: { by: claude-code/sonnet-5.5, at: 2026-10-29T07:31:22Z }
sources:
  - id: staff-members-lib
    resource: ../../src/lib/staff-members.ts
    title: 타입(생성한 api 타입) · 조회 조건 → api 쿼리(staffListApiSearch — 고른 점포 · 점포 하나 범위는 storeIds, 직영 · 가맹 범위는 storeTypes) · 상세 이메일 칸(staffEmailText) · 본사 제공 동의 칸(hqSharingConsentText)
    last_modified: 2026-10-26T03:31:34Z
  - id: staff-members-api
    resource: ../../src/lib/staff-members-api.ts
    title: api 호출 — 목록 · 상세 · 상세 영역 요약(근무스케줄은 한 주) · 퇴직 미리 보기 · 처리 · 변경 · 취소 · 비밀번호 재설정 링크 · 생년월일 정정(correctBirthDate)
    last_modified: 2026-10-26T03:31:34Z
  - id: api-types-generated
    resource: ../../src/lib/api-types.generated.ts
    title: 생성한 api 타입 — 근무스케줄 칸은 한 주 응답 StaffMemberWeekScheduleResponseDto, TO-DO 칸은 TodoItemDto, 목록 쿼리 storeIds · storeTypes, 재직 이력은 StaffMemberEmploymentPeriodDto · 생년월일 정정(BirthDateCorrectionDto · 상세의 birthDateCorrectable)
    last_modified: 2026-10-26T03:31:34Z
  - id: send-log-box
    resource: ../../src/app/staff-members/[id]/send-log-box.tsx
    title: 상세 발송 이력 칸 — 가입 초대 · 소속 추가 확인 요청 발송 결과 · 실패 사유 · 재시도(WHALEERP-136), 줄 글자는 send-log-view.ts
    last_modified: 2026-10-29T07:30:00Z
  - id: staff-list-query
    resource: ../../src/app/staff-members/staff-list-query.ts
    title: 목록 URL ↔ 조회 조건(점포 조건 storeIds · 빈 storeIds · scope) · 상세로 넘기는 ?back=(withBack · backHrefOf)
    last_modified: 2026-10-23T04:18:49Z
  - id: staff-filter
    resource: ../../src/app/staff-members/staff-filter.tsx
    title: 목록 필터 — 점포 칸은 공통 점포 고르기(StorePicker), 상단 점포 범위와 잇는다(근로계약 목록과 같은 규칙)
    last_modified: 2026-10-23T03:37:40Z
  - id: retirement-dialog
    resource: ../../src/app/staff-members/[id]/retirement-dialog.tsx
    title: 퇴직 처리 · 퇴직일 변경 · 취소 확인창
    last_modified: 2026-10-16T09:00:00Z
  - id: staff-detail-actions
    resource: ../../src/app/staff-members/[id]/staff-detail-actions.tsx
    title: 상세 머리 버튼(퇴직 · 목록 — ?back= 의 목록 주소로) · 비밀번호 초기화 버튼
    last_modified: 2026-10-23T03:37:40Z
  - id: confirm-dialog
    resource: ../../src/components/common/confirm-dialog.tsx
    title: 공통 확인창 — confirmVariant 추가
    last_modified: 2026-10-15T10:00:00Z
  - id: resend-invitation-button
    resource: ../../src/app/staff-members/resend-invitation-button.tsx
    title: 가입 초대 재발송 버튼 · 확인창(WHALEERP-138) — 근로계약 관리 수정 권한(MN000006)으로 가린다
    last_modified: 2026-10-23T05:20:57Z
  - id: staff-table
    resource: ../../src/app/staff-members/staff-table.tsx
    title: 목록 표 — 가입·인증 칸의 재발송 버튼, 가린 행의 이름 자리, 상세 링크에 목록 주소 ?back=
    last_modified: 2026-10-23T03:37:40Z
  - id: staff-list-page
    resource: ../../src/app/staff-members/page.tsx
    title: 직원 목록 화면 — 도구 줄 [일괄 저장]은 BP 마스터 · 가맹마스터에게만(bulk-export-button.tsx)
    last_modified: 2026-10-29T02:41:12Z
  - id: staff-export-screen
    resource: ../../src/app/staff-members/export/export-screen.tsx
    title: 직원 자료 일괄 저장 화면(WHALEERP-337) — 미리 보기 · 지난 요청(BFF) · 요청 · 내려받기(서버 액션 actions.ts) · 판정 bulk-export-model.ts
    last_modified: 2026-10-29T02:41:12Z
  - id: staff-detail-page
    resource: ../../src/app/staff-members/[id]/page.tsx
    title: 직원 상세 화면(틀 + 기본 정보 · 퇴직일 · 재직 이력 · 가입 상태 · 초대 · 이메일 + 비밀번호 초기화 자리 + 근로계약 칸 + 오른쪽 영역 배치 · 근무스케줄 주(주소 week) · [목록] 주소(주소 back, 없으면 상세 주소에 붙은 예전 목록 조건) + 생년월일 줄 [정정])
    last_modified: 2026-10-26T03:31:34Z
  - id: employment-history
    resource: ../../src/app/staff-members/[id]/employment-history.ts
    title: 재직 이력 줄(재입사로 이은 이전 · 이후 재직 기간, WHALEERP-615 — 링크는 ?back= + week)
    last_modified: 2026-10-23T07:40:00Z
  - id: contract-box
    resource: ../../src/app/staff-members/[id]/contract-box.tsx
    title: 상세 근로계약 칸 — 근로계약 영역 요약(api #183)을 받고 실패 · 권한 없음이면 이 칸만 안내, 계약이 없으면 작성으로(WHALEERP-184). 「계약 상태」 다음 줄에 「급여 계좌」(요약 응답 payrollAccount, 하이픈 · 가림 없음; 계약이 없는 직원에게는 계좌 줄을 보이지 않음 — 노영주 결정 2026-10-29; 요약 응답 canViewPayrollAccount 가 true 일 때만 줄을 넣고 false 면 줄 자체를 숨김 — 재영 정책 2026-10-29: 가맹 직원 급여 계좌는 본사 역할에게 안 보임). 줄 라벨 칸은 DetailTable 과 같은 폭(110px)을 옮겨 쓴다.
    last_modified: 2026-10-29T06:45:42Z
  - id: contract-summary
    resource: ../../src/app/staff-members/[id]/contract-summary.ts
    title: 근로계약 칸 줄 글자(유형 · 기간 · 최근 발송일 · 갱신 예정일 · 급여 계좌 — 「은행이름 계좌번호」, 신고 정보 없으면 -; payrollAccountRows — canViewPayrollAccount 가 true 일 때만 줄, false · 칸 없는 옛 응답은 숨김)
    last_modified: 2026-10-29T06:51:08Z
  - id: summary-view
    resource: ../../src/app/staff-members/[id]/summary-view.ts
    title: 상세 요약 영역 판정 — 영역 403 문구 가르기(출퇴근 현황은 일반 메뉴 가드 403 도 영역 권한 안내) · 근무스케줄 주(주소 week · 주 글자 · 주 선택 달력 판) · 날짜 칸 · 급여명세서 지급월 · 금액 글자 · 빈 상태 · TO-DO 배정 · 상태 글자 · 요약 줄 · 이력 문구 · 출퇴근 현황 줄 만들기(attendanceLines — 시각 기준 첫 출근 · 마지막 퇴근 · 비고) · 「관리」 주소(attendanceManageHref)
    last_modified: 2026-10-29T02:36:35Z
  - id: summary-boxes
    resource: ../../src/app/staff-members/[id]/summary-boxes.tsx
    title: 상세 오른쪽 영역(근무스케줄 한 주 표 · 출퇴근 현황 한 주 표(AttendanceBox) · 급여명세서 · TO-DO 목록 · 요약 · 최근 처리 이력)
    last_modified: 2026-10-29T02:36:35Z
  - id: summary-load
    resource: ../../src/app/staff-members/[id]/summary-load.ts
    title: 상세 영역 데이터 받기 — loadArea(영역 실패 판정 · 로그, 출퇴근 현황용 includeAccessDenied) · loadLabels(enum 한글)
    last_modified: 2026-10-29T02:36:35Z
  - id: manage-link
    resource: ../../src/app/staff-members/[id]/manage-link.tsx
    title: 상세 영역 머리의 「관리」 — 그 메뉴 조회 권한이 없으면 흐리게. 다른 메뉴 글자 링크(MenuTextLink) — 권한이 없으면 글자만
    last_modified: 2026-10-22T06:09:19Z
  - id: week-nav
    resource: ../../src/app/staff-members/[id]/week-nav.tsx
    title: 근무스케줄 칸 머리의 주 넘김 · 주 선택 달력(popover, 데모 weekNav · erp.js initWeeks)
    last_modified: 2026-10-22T06:09:19Z
  - id: todo-links
    resource: ../../src/app/staff-members/[id]/todo-links.tsx
    title: TO-DO 칸 제목 링크 — TO-DO 리스트 관리 조회 권한이 없으면 글자만
    last_modified: 2026-10-22T06:09:19Z
  - id: data-table
    resource: ../../src/components/common/data-table.tsx
    title: 공통 표 — 열 이름 줄 모양 headVariant(default · plain · none). 직원 상세만 plain · none 을 켠다
    last_modified: 2026-10-22T06:09:19Z
  - id: attendance-query
    resource: ../../src/app/attendance-records/attendance-query.ts
    title: 출·퇴근 현황 조회 URL 쿼리 — 직원 상세 「관리」 주소가 쓰는 staffMemberId · employment · date · week · fixFrom/fixTo, 비고의 ENTRY_KIND_LABELS · REVIEW_REASONS, 다음날 표시 laterDayMark
    last_modified: 2026-10-29T02:36:35Z
  - id: attendance-records-api
    resource: ../../src/lib/attendance-records-api.ts
    title: 출·퇴근 현황 api 호출 — 직원 상세 출퇴근 현황 칸이 getPeriodAttendance 를 staffMemberId 로 부른다
    last_modified: 2026-10-29T02:36:35Z
  - id: menus
    resource: ../../src/lib/menus.ts
    title: 메뉴 코드 — 직원 상세가 보는 다른 메뉴(근로계약 · 급여명세서 MN000009 · 근무스케줄 · 출·퇴근 현황 MN000025 · TO-DO)
    last_modified: 2026-10-29T02:36:35Z
  - id: password-reset-dialog
    resource: ../../src/app/staff-members/[id]/password-reset-dialog.tsx
    title: 비밀번호 초기화 확인창(WHALEERP-177)
    last_modified: 2026-10-16T09:00:00Z
  - id: password-reset
    resource: ../../src/lib/password-reset.ts
    title: 비밀번호 초기화 판정 — 버튼 노출 · 받는 곳 문구 · 실패 문구
    last_modified: 2026-10-16T07:47:00Z
  - id: birth-date-dialog
    resource: ../../src/app/staff-members/[id]/birth-date-dialog.tsx
    title: 생년월일 줄의 [정정] 버튼 · 정정 확인창(WHALEERP-602)
    last_modified: 2026-10-26T04:17:24Z
  - id: birth-date
    resource: ../../src/lib/birth-date.ts
    title: 생년월일 정정 판정 — 버튼 노출 · 입력 검사 · 안내 문구 · 닫고 다시 받는 409
    last_modified: 2026-10-26T04:06:15Z
  - id: use-action-failure
    resource: ../../src/app/staff-members/[id]/use-action-failure.ts
    title: 상세 확인창 실패 처리(failureEffect) — 퇴직 처리는 모두, 비밀번호 초기화는 403 만, 생년월일 정정은 403 · 결과 모름을 쓴다
    last_modified: 2026-10-26T03:31:34Z
  - id: staff-detail-server-actions
    resource: ../../src/app/staff-members/[id]/actions.ts
    title: 퇴직 · 재설정 링크 발송 · 생년월일 정정 서버 액션(실패에 api 409 code 를 싣는다)
    last_modified: 2026-10-26T03:31:34Z
  - id: staff-row
    resource: ../../src/app/staff-members/staff-row.ts
    title: 한 줄 표시 규칙(배지 · D-day · 재직 칸 · 재발송 판정 · 상세 초대 줄). 갱신 예정 날수(RENEWAL_NOTICE_DAYS)를 상세 근로계약 칸과 함께 쓴다
    last_modified: 2026-10-23T05:20:57Z
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
결정의 메뉴 url 로 건다. 지금은 근로계약(그 계약 상세 `/contracts/{id}`, 계약이 없으면 `/contracts`, MN000006) · TO-DO(`/todos`, MN000026) · 근무스케줄(`/work-schedules?store=<근무지>&week=<칸이 보던 주 월요일>`, MN000010) · 급여명세서(`/payslips`, MN000009)가 링크이고,
그 메뉴 조회 권한이 없으면 흐린 「관리」로 둔다(`MenuManageLink`, `manage-link.tsx` — front #90 리뷰). 권한을 보지 않는 링크를 걸 길은 `Box` 에 두지 않았다.
출퇴근 현황(`/attendance-records`, MN000025 — `MENU_CODE.attendanceRecords`)도 화면이 생겨 링크로 걸었다(WHALEERP-186). 주소는
`/attendance-records?storeIds=<근무지>&staffMemberId=<직원>&employment=ALL&date=<일별 날>&week=<보는 주 월요일>&fixFrom=<월요일>&fixTo=<일요일>`
(`attendanceManageHref` — 일별 날은 오늘이 그 주 안이면 오늘, 아니면 그 주 월요일. 화면은 date 를 날짜 형식만 보고 그대로 받는다) — 출·퇴근 현황 조회 화면의 쿼리(`attendance-query.ts`)로 그 직원 한 명 · 근무지 · 주를 걸고, 퇴직 직원도 보이게 재직 상태는 전체다.

# 목록 조회 조건

* 화면 묶음(가입 완료 · 초대 발송 · 연결 보류 · 소속 추가 확인 · 가입 불가)은 그 상태들을 `joinState` **쉼표 목록**으로,
  고용형태는 `employmentType` 쉼표 목록으로 보낸다. 모두 고른 목록과 재직 상태 「전체」는 파라미터를 뺀다(`staffListApiSearch`).
* **묶음 · 고용형태를 하나도 고르지 않았으면 api 를 부르지 않고 0건이다.** api 는 빈 값을
  400 으로 막고, 파라미터를 빼면 전체를 돌려준다 — 둘을 바꿔 쓰면 「하나도 안 고름」이 「전체」가 된다.
* **점포 칸은 공통 점포 고르기(`StorePicker`)이고 상단 점포 범위와 잇는다**(재영 Buzz 공지 2026-10-22, 근로계약 목록 front #109 · WHALEERP-133 과 같은 규칙,
  `staff-list-query.ts` · `staff-filter.tsx`). 점포 조건은 네 가지다 — 목록에서 고른 점포(`storeIds=3,7`), 목록에서 비운 「전체」(빈 `storeIds=` —
  헤더 범위가 아니다), 헤더 범위(`scope=ALL · DIRECT · FRANCHISE · STORE:12`, 헤더가 메뉴로 이동할 때 싣는다), 정해지지 않음(주소에 셋 다 없음 —
  필터가 헤더 범위로 채운다, `fillScopeOf`). 고른 점포 · 빈 `storeIds` 가 `scope` 보다 앞선다. 초기화는 헤더 범위로 돌아간다.
  api 에는 고른 점포 · 점포 하나 범위를 `storeIds`(쉼표), 직영 · 가맹 범위를 점포를 풀지 않고 `storeTypes` 로 보낸다(`staffListApiSearch`) —
  `storeTypes` 를 주면 api 가 TO-DO 목록처럼 그 유형의 폐점 점포를 빼서 칩과 결과가 같다(근로계약은 폐점 점포의 계약도 나온다). 범위 「전체」 · 비운 「전체」(범위가 함께 있어도) · 정해지지 않음은 점포 조건이 없다(업무 범위 전체).
  칩 이름은 로그인 정보의 점포(`useStores`)에서 찾는다 — 점포 목록 api(`GET /stores`)는 「점포 정보 관리」(MN000002) 메뉴 권한이 있어야 열려 서버가 찾지 않는다.
  로그인 정보에 없는 고른 점포(로그인 뒤 맡게 된 점포 · 다른 탭에서 복사한 주소)는 「점포 {id}」 칩으로 둔다 — 조건에서 빼면 api 가 볼 수 있는 점포까지
  잃는다(업무 범위 밖 id 는 api 가 조용히 뺀다). 주소의 범위를 이 탭에서 쓸 수 없으면(점포 하나가 로그인 정보에 없음 · 직영 · 가맹에 폐점이 아닌 점포가 없음 —
  `isUnusableScope`) 「전체」(빈 `storeIds`)로 바꾸고 토스트로 알린다.
* **예전 점포명 주소(`?store=`)는 읽지 않는다** — 그 주소로 오면 함께 실린 `storeIds` 도 버리고 점포 조건이 없는 것으로 보아 상단 범위로 채운다(상단이 전체면 주소는 그대로 두고 읽지만 않는다)
  (근로계약 `?storeName=` 과 같다). 그래서 「점포를 찾는 중입니다.」 · 「점포명을 더 좁혀 주세요」 빈 목록 문구와 `staffListEmptyMessage` · `tooManyStores` 는 걷었다.
  `storeIdsByName` 은 급여명세서 목록도 점포 고르기로 바꾸며 지웠다(2026-10-26).
* **api 상한을 화면이 먼저 막는다**(PR #36 리뷰). 넘기면 api 400 으로 목록 전체가 오류 화면이 되기 때문이다 — 검색어(이름 ·
  번호)는 50자(검색칸 `maxLength` + 파서가 자름), 쪽은 1,000,000 을 넘으면 1, 주소의 `storeIds` 는 int4 양의 정수만 남기고 1000개(`MAX_STORE_IDS`,
  api 상한 — 500 에서 1000 으로 올림)에서 자른다. 직영 · 가맹 범위 칩을 지워 점포 id 목록으로 바뀔 때 1000개를 넘으면 뒤가 빠진다 — 근로계약 · 1팀 점포 정보 관리와 같은 한계다.
* **상세로 갈 때 목록 주소를 `?back=` 으로 넘긴다**(`withBack`, 기본 목록이면 싣지 않는다). 상세의 [목록]은 `detailListHrefOf` 로 정한다 — `back` 이 있으면
  `backHrefOf(back)`(직원 목록 주소가 아니면 기본 목록이고, 이때 아래 예전 조건으로 떨어지지 않는다. 받은 쿼리는 목록과 같은 규칙으로 걸러 다시 만든다 — 같은 이름이 여럿이면 첫 값).
  `back` 이 없으면 예전처럼 목록 조건을 상세 주소에 그대로 붙인 주소(`/staff-members/5?keyword=홍&page=3` — 북마크 등)의 조건을 목록 규칙으로 다시 만들어 돌아간다
  (같은 이름 여럿은 첫 값, 모르는 이름 · 예전 `?store=` 는 버리고, 상세 전용 `week` 는 목록에 넣지 않는다). 둘 다 없으면 기본 목록이다. 브라우저 뒤로 가기는 목록 조작이 `replace` 라 상세로 가기 직전의 목록 주소로 간다. 근무스케줄 주
  넘김(`weekHref`)은 `week` 만 바꾸고 `back` 과 예전 형식 목록 조건을 그대로 둔다 — 주를 옮긴 뒤에도 [목록]이 같은 조건으로 돌아간다.
  직원 등록 화면은 따로 없다 — 「직원 초대」는 근로계약 작성(`/contracts/new`)이라 `back` 을 싣지 않는다(근로계약 `backHrefOf` 가 근로계약 목록 주소만 받는다).
  상세 안에서 다른 화면(근로계약 등)으로 가는 링크는 `back` 을 싣지 않는다. 직원 목록에서 저장 · 삭제 뒤 목록으로 돌아가는 동작이 없어(퇴직 처리 · 변경 · 취소는
  상세에 머물고 다시 받는다) 근로계약의 `withoutStoreSearch` 처리는 두지 않았다.
* 목록 라벨(`joinCell` 의 `StaffJoinState` · `EmploymentType`)은 아직 화면 상수다. `getEnum` 으로 바꾸는 것은 남았다 — 상세
  「이메일」 칸의 가입 상태 한글은 이미 `getEnum` 으로 받는다(아래 「이메일」).
* api 오류(401 · 403 · 5xx)는 `error.tsx` 가 받는다. 없는 직원(상세 api 404)은 상세가 먼저 `notFound()` 로 받는다. 로그인 뒤 페이지는 루트 `loading.tsx` 로 스트리밍되어 응답 코드는 404 가 아니라 200 이고 안내는 화면 안에서 처리된다(화면은 같다).

# 상세 (WHALEERP-184)

배치는 데모 `docs/demo/src/pages/staff/detail.mjs` 와 같은 5:7 두 단이다 — 왼쪽은 기본 정보 · 비밀번호 초기화 · 근로계약, 오른쪽은
근무스케줄 · 출퇴근 현황 · 급여명세서 · TO-DO. 근무스케줄 · 급여명세서 표의 열 이름 줄은 데모 `whiteHead` 대로 흰 바탕 · 600 먹색 글자(공통 `DataTable` `headVariant="plain"` —
기본값은 그대로라 다른 화면은 바뀌지 않는다)이고, 표 아래 요약 줄은 데모 `foot` 처럼 모서리를 둥글리지 않는다.

처음 들어올 때는 「직원 상세」 제목 줄 아래 본문 전체(기본 정보 · 비밀번호 초기화 · 네 영역)를 `LoadGroup` 이 빈 자리(`BODY_PENDING` — 화면에는 비어 있고 화면 낭독기에만 `role="status"` 「로딩중입니다.」를 읽는다. 상세 진입에는 고래 로딩을 쓰지 않는다)로 덮고, 근로계약 · 근무스케줄 · 급여명세서 · TO-DO 네 영역(`LoadGroupArea`)이 모두 온 뒤 한 번에 보인다(2026-10-28). 15초가 지나면 풀어 늦는 영역은 그 자리에 빈 자리(`AREA_PENDING`, 최소 높이 92px — 영역이 들어올 때 상자 높이가 크게 출렁이지 않는다)만 둔다. 작은 영역에는 고래 로딩을 쓰지 않는다. 주를 바꾸면(`LoadGroupArea key={monday}`) 근무스케줄 영역은 같은 빈 자리를 두지만, 주 넘김이 `startTransition` 안의 `router.replace` 라 새 화면이 올 때까지 이전 화면이 남아 보통 보이지 않는다. 영역 실패는 지금처럼 영역 안 안내 · 다시 하기다.

**기본 정보**는 상세 응답(`GET /staff-members/:id`)으로 채운다. api #183 이 직무(`jobTitle`) · 입사일(`hiredDate`) · 생년월일(`birthDate`)을 더했다.

* 재직 상태는 이름 옆 칩이다(`employmentStatusCells` — 재직 · 퇴직 예정(퇴직일) · 퇴직). Plane 완료 조건은 「이름 아래」지만 줄 높이가 46 고정이라
  옆에 두고, 따로 있던 「재직 상태」 줄은 뺐다. 목록의 재직 칸(`statusCells`)은 가입 · 계약 상태를 섞은 요약이라 상세에 쓰지 않는다(2026-10-13 재영: 머지 블로커).
* **본인인증은 보이지 않는다** — 1차 범위 밖이다(WHALEERP-612 → 2차, 2026-10-21 재영). 기본 정보의 줄도 이름 옆 칩도 두지 않는다.
  데모 `detail.mjs` 의 기본 정보에는 아직 「본인인증 완료」 줄이 있다.
* 입사일은 나중에 시스템이 첫 체결 계약 시작일로 채운다. 지금은 늘 null 이라 「-」다(2026-10-21 재영).
* **재직 이력**(WHALEERP-615, 목업 `docs/mockup/staff/detail.html`, 운영 정책 CTR-30) — 퇴직 뒤 같은 점포에 다시 입사하면 새 직원 레코드가
  생기고 api 가 직전 재직 레코드와 잇는다(api #136). 상세 응답 `previousRecords` · `laterRecords` 로 퇴직일 줄(재직 중이면 입사일 줄) 아래에 「재직 이력」(이전 재직 기간, 「· 이전 재직」)과
  「이후 재입사」 줄을 둔다(`employmentHistoryLines`). 기간은 「입사일 ~ 퇴직일」(퇴직일이 없으면 「재직 중」, 입사일이 없으면 「-」)이고 누르면 그 레코드의
  상세로 간다 — 상세의 [목록] 주소(`detailListHrefOf`)를 `?back=` 으로 싣고(기본 목록이면 싣지 않음) 근무스케줄이 보던 주(`week` — 근무스케줄 칸과 같은 `weekParam` 으로 읽는다)를 이어 단다(`historySearch`) — 거기서도 [목록]이 같은 조건 · 쪽으로 돌아간다. 좁은 단에서 꺾여도
  잘리지 않게 높이가 내용만큼 늘어나는 줄이다(`multiline`). 이은 레코드가 없으면 줄이 없다. 칸이 없는
  응답(api #136 배포 전 서버)은 응답을 받는 자리(`getStaffMember` → `withEmploymentHistory`)에서 빈 목록으로 채운다 — front 가 먼저 배포돼도 상세가 오류가 되지 않는다. 링크는 「재직 이력 기간 직원 상세」로 읽힌다(`aria-label`). 순서(가까운 것부터) · 가림(본사 제공 동의) · 체결 완료된 레코드만 내기는 api 가 정한다. 직원 목록은 그대로다(레코드마다 한 줄, 2026-10-22 재영 C안).
* 생년월일은 api 가 주는 대로 보인다 — 본사 역할(동의한 가맹 직원) · 퇴직 직원에게도 화면에서 따로 가리지 않는다(2026-10-21 재영).
* 가맹 점포 직원은 「본사 제공 동의」 줄(동의 · 미동의)이 있다(완료 조건 8, ATT-30). 상세 응답 `hqSharingConsent`(api #113, API 전용 enum
  `HqSharingConsentState`, 한글은 `GET /enums/HqSharingConsentState`)이고, 직영 점포 직원은 null 이라 줄이 없다(`hqSharingConsentText`). 값은 계정의 동의라
  철회하면 바로 미동의, 가입 전도 미동의다. 본사 역할은 미동의 직원 상세가 404 라 늘 동의를 보고, 미동의는 가맹 역할 · 플랫폼이 본다.
* 가린 직원(본사 제공 동의 없는 가맹 직원) · 업무 범위 밖 · 없는 직원은 상세 api 가 404 라 상세로 들어가지 못한다(#184 · #599).
  본사 제공 동의한 가맹 직원은 본사 역할에게도 상세가 열리지만, 비밀번호 초기화는 범위가 달라 버튼이 없다(아래).

**나머지 영역은 영역마다 따로 받는다** — 근로계약 · 근무스케줄 · 급여명세서 · TO-DO 모두
상세 요약 api(`GET /staff-members/:id/summary/…`, api #183)다(`summary-boxes.tsx`, 근로계약은 `contract-box.tsx`). 영역마다 `LoadGroupArea`(자기 Suspense 경계) 안의 서버 컴포넌트다. 처음 들어올 때는 `LoadGroup` 이 기본 정보까지 본문 전체를 딤으로 덮었다가 네 영역이 모두 온 뒤 한 번에 보이고, 한 영역이 실패해도 나머지는 그대로다.

* 경로마다 직원 정보 관리 조회 + 그 영역 메뉴 조회 권한이 필요하다. 영역 권한이 없으면 그 영역만 403 이고 message 가 정확히
  「조회 권한이 없습니다.」다(api `READ_DENIED_MESSAGE`, 403 문구 네 번째로 확정 2026-10-21 재영). 화면은 이 문구로만 가른다(`areaFailureOf`, 문구 상수는
  `summary-view.ts` 의 `AREA_READ_DENIED_MESSAGE` 한 곳) — 「{영역}을 볼 권한이 없습니다.」만 보이고 다시 하기는 두지 않으며 로그도 남기지 않는다.
  다른 403(공통 「접근 권한이 없습니다. 관리자에게 문의해 주세요.」) · 404 · 5xx · 연결 실패는 「{영역}을 불러오지 못했습니다.」 + 「다시 하기」
  (`router.refresh()`)이고 상태 코드와 함께 서버 로그에 남긴다.
* **근무스케줄**은 데모(`detail.mjs` · `staff-parts.mjs` weekNav · `erp.js` initWeeks)대로 **한 주(월~일)**다 — WHALEERP-185 의 기간 선택 · 건수 · 쪽 번호를
  걷고 되돌렸다(2026-10-22 노영주). 상세 요약의 주 api(`GET /staff-members/:id/summary/work-schedules?weekStart=<월요일>`, 근무스케줄 관리 조회 권한, 생성 타입
  `StaffMemberWeekScheduleResponseDto`)로 받는다. api 쪽 기간 목록 경로(`…/work-schedules`)는 남아 있지만 화면은 부르지 않는다.
  칸 머리(`week-nav.tsx`)는 ‹ 이전 주 · 가운데 버튼 「2026년 10-19 ~ 10-25」(연도는 그 주 월요일의 해, `weekLabel`) · 다음 주 › 이고, 가운데 버튼은 주 선택 달력(네이티브
  popover auto · role=dialog 「주 선택」 · aria-expanded, 버튼 아래 6px 가운데 · 화면 끝 8px 안쪽, 급여명세서 목록 달 판과 같은 모양)을 연다. 달력은 그 달에 목요일이 드는 주들을
  「N주」 줄로 보이고(몇째 주는 목요일이 든 달 기준 — 9월 1주 = 08-31 ~ 09-06, `weekRowsOf` · `weekMonthOf`), 지금 주 줄은 브랜드 바탕(aria-pressed)이며 열 때 그 줄에 포커스가 간다.
  ‹ › 로 달만 바꾸면 고른 주는 그대로, 줄을 누르면 그 주로 옮기고 닫은 뒤 포커스를 가운데 버튼으로 돌린다. 아래 「이번 주」도 같다.
  주소 값은 `week`(그 주 월요일, 근무스케줄 화면과 같은 이름). 날짜가 아니거나 1900~2999년 밖이면 이번 주이고, 월요일이 아닌 날짜는 그 주 월요일로 맞추며(`weekParam`), 이번 주면 주소에서 뺀다(`weekHref`).
  옮길 때는 다른 조회 조건(목록으로 돌아갈 값)을 둔 채 `week` 만 바꾸고 지난 주소 값(`weekStart` · `schedulePeriod` · `schedulePage` · `schedulePageSize`)은 함께 뺀다(`replace`, 스크롤 그대로,
  응답 전에 다시 눌러도 앞의 이동을 잃지 않게 낙관적 주). 표는 날짜(`MM-DD 요일`) · 근무지 · 시작 · 종료(근무스케줄 화면과 같은 `endLabel` — 「익일 02:00」 · 「24:00」), api 순서(시작 일시 순)이고
  아래에 「주간 근무시간 합계 Xh」(응답 `totalWorkMinutes`, 소수 한 자리)다. 빈 주는 「이 주에 잡힌 근무스케줄이 없습니다.」 + 0.0h. 권한 · 실패는 위 영역 규칙과 같다.
  칸 머리 「관리」는 `/work-schedules?store=<근무지>&week=<보는 주 월요일>` 이다.
* **출퇴근 현황**(WHALEERP-186, 재영 2026-10-29 결정, ATT-19 · ATT-34)은 새 api 없이 `GET /attendance-records?from=<월요일>&to=<일요일>&staffMemberId=<id>`(`getPeriodAttendance`,
  `AttendanceBox`)로 받는다. 표시 기간은 바로 위 근무스케줄 영역과 같은 주이고 주 넘김을 함께 따라간다(`LoadGroupArea key={monday}`). 표는 날짜(`MM-DD 요일`) · 출근 · 퇴근 · 상태 · 비고,
  날짜 오름차순(같은 날은 api 순서). 줄 만들기는 `summary-view.ts` 의 `attendanceLines`다.
  * 상태 칸은 api 의 날 상태(`AttendanceDayStatus` — ATT-34 지각 · 퇴근 미등록 · 미출근 · 출근 미등록 · 정상 …)를 `getEnum` 한글로 보인다. 상태가 없는 줄(근무스케줄 시작 전)과 한글을 받지 못한 경우는 「-」(영문 값을 보이지 않는다).
  * 비고 칸은 확인 필요 사유(`AttendanceReviewReason` enum 한글, ATT-19 — 반경 밖 출근 · 반경 밖 퇴근 · 위치 조작 감지 · 근무 12시간 초과. 위치 오차 초과는 쓰지 않는다) · 「보정됨」(`isCorrected`) · 「대신 등록」(`entryMethod` PROXY)을 「 · 」로 잇는다.
    「보정됨」 · 「대신 등록」 글자는 출·퇴근 현황 조회 화면의 `ENTRY_KIND_LABELS` 를 쓴다.
  * 하루에 출퇴근 쌍이 여럿이면 한 줄에 첫 출근 · 마지막 퇴근(시각 기준 — 기록 시각이 가장 이른 출근 · 가장 늦은 퇴근. api 가 출근 없는 퇴근을 쌍 맨 뒤에 붙여 순서로 고르지 않는다. 자정을 넘긴 퇴근은 출·퇴근 화면과 같은 `laterDayMark` 로 「06:00(다음날)」), 비고 끝에 「외 N회」(N = 쌍 수 - 1)다. 자세한 쌍은 「관리」로 본다. 근무스케줄만 있고 기록이 없는 날도 api 가 준 줄은 출근 · 퇴근 「-」로 그대로 둔다.
  * 이 api 는 영역 전용 문구(「조회 권한이 없습니다.」)가 아니라 일반 메뉴 가드를 쓴다 — 출·퇴근 현황 조회 권한이 없으면 403 「접근 권한이 없습니다. 관리자에게 문의해 주세요.」다. 이 영역에서는 그 403 도 영역 권한 안내로 본다(`loadArea` 의 `includeAccessDenied`).
    가려진 직원(404) · 실패는 영역 실패 안내 · 다시 하기, 줄이 없으면 「이 주에 출퇴근 기록이 없습니다.」다.
* **급여명세서**는 데모 detail.html 처럼 최근 명세서 3건(응답 `recent`, api 순서 = 급여 기간 시작일 최신순)을 지급월 · 기본급 · 수당 · 공제 · 실지급액(굵게) · 상태
  배지(`PayslipStatus` enum, 급여 목록과 같은 `STATUS_STYLE`)로 보이고 아래에 미발송 N건(`unsentCount`, 발송 완료가 아닌 모두)이다(WHALEERP-186, 2026-10-22). 지급월은 급여 기간
  시작일의 `YYYY-MM`(`payMonthText`)이고 모든 줄이 명세서 상세(`/payslips/{payslipId}`)로 가며, 「급여명세서 관리」(MN000009) 조회 권한이 없으면 글자만이다(`MenuTextLink`).
  금액이 없거나(null) 0 이면 「-」(데모의 검토 중 줄 공제), 아니면 쉼표 글자다(`payAmountText`). 열 너비는 데모처럼 똑같이 나눈다. 칸 머리 「관리」는 `/payslips`.
  최근 명세서도 미발송도 없으면 「급여명세서가 없습니다.」(`isPayslipSummaryEmpty`) — api 는 둘을 같은 직원의 명세서 전체에서 세어 `recent` 가 비면 미발송도 0 이고, `unsentCount` 는 api 가 바뀔 때를 대비해 함께 본다. 옛 「구분」 열(이번 달 · 최근 확정)과 급여 기간 글자는 걷었다.
* **TO-DO** 는 목록(`GET /staff-members/:id/todos`, #118 — 앞쪽 5건)을 데모처럼 열 이름 줄 없는 표(공통 `DataTable` `headVariant="none"`)로 그린다 — 제목(+ 긴급 배지) ·
  배정(220px) · 상태(110px). 배정은 `TodoAssigneeType` · `TodoExecutionMode` 한글(`getEnum`)과 수행 예정으로 「개인 · 08-28 14:00」 · 「근무지 전체 · 각자 수행 · 09-03」이다(`todoAssignText` —
  데모는 「개인 배정」이지만 enum 한글은 「개인」이라 enum 을 따른다). 상태는 배지가 아닌 색 글자(`todoStatusMark`) — 완료는 파랑 「MM-DD 완료」(`completedAt` 의 한국 날짜),
  대기는 회색, 진행 중은 TO-DO 목록과 같은 파랑(데모에 진행 중 줄이 없다). 그 아래에 요약
  (`…/summary/todos`, TO-DO 관리 조회 권한)으로 「전체 N · 완료 n · 미완료 n」 줄과 「최근 처리 이력」 5건을 더했다. 이력은 api 순서(최신이 위)
  그대로이고, 문구는 등록(이전 상태 없음) · 긴급 표시 변경 · 「이전 → 이후」 상태(`TodoStatus` 한글), 바꾼 쪽은 `StatusChangeActor` 한글(관리자 · 직원 ·
  시스템)이다 — 사람 이름은 오지 않는다(2026-10-21 노영주 A안). **TO-DO 관리 조회 권한이 없으면 목록까지 영역 전체를 막는다**(2026-10-22 노영주, front #90 리뷰). api 가 목록 · 요약 두 경로에 같은 영역 권한을
  걸어(api #113, `requireAreaRead`) 권한이 없으면 둘 다 403 「조회 권한이 없습니다.」다. 화면은 한 경로라도 그러면(`isAreaForbidden`) 목록을 그리지 않고
  「TO-DO 를 볼 권한이 없습니다.」만 보인다(`TodoBox`). 그 밖에는 목록과 요약이 따로 실패한다 — 목록 자리 · 요약 줄 자리에 각각 안내 · 다시 하기. 한 `LoadGroupArea` 로 묶어 칸 높이가 두 번 바뀌지 않게 했다.
  배정이 없으면 목록의 빈 상태(「배정된 TO-DO 가 없습니다.」)가 말해 요약 줄을 그리지 않는다. 제목 링크는 「TO-DO 리스트 관리」(MN000026)
  조회 권한이 없으면 글자로 둔다(`todo-links.tsx`).

# 근로계약 칸 (WHALEERP-184)

* 근로계약 영역 요약(`GET /staff-members/:id/summary/contracts`)으로 가장 최근 계약 하나를 받는다(전에는 상세 응답의 `contract` 로 계약 상세를
  한 번 더 받았다). 「근로계약 관리」 조회 권한이 없으면 영역 403 이라 「근로계약을 볼 권한이 없습니다.」(front #79 와 같은 자리), 나머지 실패는
  「근로계약을 불러오지 못했습니다.」 + 「다시 하기」다(위 영역 규칙).
* enum(`ContractStatus` · `EmploymentType`)을 받지 못했거나 응답에 그 enum 이 빠져 빈 목록이어도 칸은 그린다 — 계약 유형 · 계약 상태만 「-」이고(영문 값을 보이지 않는다)
  원인은 서버 로그에 남긴다. 이메일 칸의 가입 상태와 같은 방식이다.
* 줄은 목업대로 계약 유형(`{고용 형태} 근로계약`) · 계약 기간(`시작일 ~ 종료일`, 종료일이 없으면 무기한, 시작일이 없으면 「-」) ·
  계약 상태(근로계약 목록과 같은 배지 `contracts/columns.tsx` StatusBadge + `getEnum("ContractStatus")`) · 최근 발송일 · 갱신 예정일이고, 칸 아래에 「가장 최근 계약 1건만」 안내를 둔다.
* **최근 발송일**은 api 의 `lastSentAt`(`contracts.sent_at`, 발송 · 재발송 때 덮어쓴다)을 한국 날짜로 보인다. 보낸 적이 없으면 「-」.
* **갱신 예정일**은 api 의 `renewalDate` 다 — 체결 완료이고 종료일이 오늘 이후일 때 종료일 30일 전으로, 목록 「갱신 예정 D-n」(`RENEWAL_NOTICE_DAYS`)과
  같은 기준이다. 화면이 따로 셈하던 `renewalDateOf` 는 지웠다.
* **계약 없음**(`contract: null`)은 「등록된 근로계약이 없습니다.」와 「근로계약서 작성」(`/contracts/new`) 버튼이다(184 완료 조건 3). 버튼은 근로계약 관리
  조회 · 등록 권한이 있을 때만(`ContractMenuPermission`, front #57 규칙). 근로계약서를 쓰면서 직원 레코드가 생기므로 거의 나오지 않는다(2026-10-19 노영주).
  작성 화면은 직원을 미리 채워 받지 않아 빈 작성 화면으로 간다 — 이 직원으로 미리 채우는 것은 남은 일이다.

# 발송 이력 칸 (WHALEERP-136)

* 두 단 아래 전체 너비 칸 「발송 이력」(`send-log-box.tsx`, 줄 글자는 `send-log-view.ts`). 이 직원 레코드의 근로계약이 보낸 가입 초대 · 소속 추가 확인 요청
  (재발송 포함)을 `GET /staff-members/:id/summary/send-logs` 로 받아 최근 순으로 모두 보인다. 발송 이력은 이 화면에만 둔다 — 계약 상세 · 따로 된 화면에는
  두지 않는다(2026-10-26 김민식). 데모에 없는 칸이라 열이 많아 두 단 아래에 두었다. 따로 된 발송 이력 화면을 두지 않기로 해 「관리」 자리는 비운다(`manage={false}` — 흐린 「관리」는 생길 화면이 있다는 뜻이다).
* 열은 발송 일시(한국 시각) · 종류(`StaffSendKind` 한글, 재발송이면 뒤에 「(재발송)」 — 그 계약 상세 링크라 계약이 여럿이어도 가를 수 있다) · 결과(`StaffSendResult` 배지 — 성공 초록, 실패 빨강, 접수 여부 모름
  회색) · 재시도(다시 보낼 수 있는 실패 「가능」, 접수 여부 모름 「확인 필요」, 다시 보낼 수 없는 실패 「불가」, 성공 「-」) · 실패 사유(api 문구 그대로, 비면 「-」, 한 줄로 자르고 전체는 title).
  재시도는 그 발송 한 번의 판정이고, 지금 재발송을 누를 수 있는지는 가입 상태 줄의 재발송 버튼이 정한다.
* 근로계약 관리 조회 권한을 보는 경로라 그 권한이 없으면 「발송 이력을 볼 권한이 없습니다.」, 나머지 실패는 「다시 하기」다(근로계약 칸과 같다).
  enum 을 받지 못했거나 목록에 없는 새 값이면 종류 · 결과만 「-」다(`labelIn` — 공통 `labelOf` 와 달리 영문 값을 돌려주지 않는다). 종류를 모르면 계약 링크도 걸지 않고, 「(재발송)」은 그대로 붙인다. 건수 상한은 두지 않는다 — 직원 레코드 하나의 초대 발송은 몇 건이다. 칸은 상세 LoadGroup 안이라 본문과 함께 열린다(묶음은 15초면 풀린다). 보낸 초대가 없으면 「보낸 초대가 없습니다.」.

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
* 버튼(`retirementActions`) — 가입 완료(`JOINED`) · 재직이고 지금 주소의 메뉴(`/staff-members` — 지금은 「직원 정보 관리」 MN000005) 수정 권한이 있을 때만. 메뉴 코드가 아니라 주소로 찾는다(`usePagePermission`).
  퇴직일이 없으면 붉은 「퇴직 처리」, 퇴직일이 오늘보다 뒤면 「퇴직일 변경」 · 「퇴직 처리 취소」(목업). 퇴직일 당일부터는 배치가
  돌 수 있어 api 가 변경 · 취소를 409 로 막으므로 버튼을 두지 않는다. 퇴직 · 가입 전 레코드도 버튼이 없다. 업무 범위 밖 직원은
  상세 api 가 404 라 판정에 오지 않는다.
* 확인창 — 퇴직일(`checkRetiredDate`: 오늘 이후 상한 없음, 또는 최근 3개월 안. 달력 달로 빼고 말일 보정 5-31 → 2-28)을 받고,
  퇴직일 검증 오류는 입력칸 아래(2026-10-29 재영 공지)다 — 형식 · 3개월 범위는 화면이 `checkRetiredDate` 로, 입사일보다 앞섬 같은 api 400 은 미리 보기 · 처리 응답에서 받아 둘 다 날짜 칸 아래(퇴직일 칸 바로 아래(「지금 퇴직일과 같습니다」 위), `role="alert"`)에 보이고(`showsBelowDateField`) 날짜가 틀리면 미리 보기 자리는 비운다. 처리 중에 날짜를 바꿨으면 이전 날짜의 저장 400 은 붙이지 않는다. 권한 403 · 상태 409 · 결과 모름 · 미리 보기 연결 오류는 지금 자리(미리 보기 자리 · 맨 아래)에 둔다. 날짜가 실제로 바뀔 때만(blur 의 같은 값은 제외) 미리 보기(`retirement-preview`)를 다시 받아(미리 보기가 실패 — 연결 · 서버 오류 · 권한 · 상태 충돌 등 — 한 뒤에는 같은 날짜로도 다시 받는다, `reloadsPreview`) 지워질 근무스케줄 · 풀릴 개인 TO-DO 배정 · 닫힐 근로계약 건수를
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
* 공통 `ConfirmDialog` 에 확인 버튼 색(`confirmVariant`)을 더했다 — 퇴직 처리 확인이 붉다(데모). 1팀 동의(2026-10-27).

# 비밀번호 초기화 (WHALEERP-177)

기본 정보 표 아래 줄 오른쪽에 둔다(데모 자리). 관리자는 비밀번호를 알 수도 정할 수도 없다 — 재설정 링크가 직원 계정 이메일
(회원가입 때 쓴 것)로 가고, 직원이 링크를 열어 스스로 정한다. api 는 `POST /staff-members/:id/password-reset-links` 다.

* 버튼(`canResetPassword`) — 가입 완료(`JOINED`) · 재직이고 지금 주소의 메뉴(`/staff-members`, 지금은 「직원 정보 관리」) 수정 권한(`usePagePermission`)이 있을 때만. 퇴직 예정(재직 + 퇴직일)은
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

# 생년월일 정정 (WHALEERP-602)

기본 정보 「생년월일」 줄 값 옆에 [정정] 버튼을 둔다(`BirthDateCell`). 목업(`docs/mockup/staff/detail.html`)에는 없는 버튼이고 노영주 승인안이다
(2026-10-26). api 는 `PUT /staff-members/:id/birth-date` `{ birthDate }` 로 204 다. 직원 이름 · 성별 · 외국인 여부는 여전히 수정할 수 없다.

* 버튼(`canCorrectBirthDate`) — 지금 주소의 메뉴 수정 권한(`usePagePermission`)이 있고 상세 응답의 `birthDateCorrectable` 이 true 일 때만.
  이 칸은 api 가 가입 전(탈퇴 · 연결 보류 포함) · 퇴직으로 막는 경우와 같은 판정이다 — `joinState` 는 직원 레코드 기준이라 탈퇴 · 연결 보류 계정도 `JOINED` 로 와서
  쓰지 않는다. 퇴직 예정(재직 + 퇴직일)은 보인다. 옛 api 응답(칸 없음)은 false 로 채워 숨긴다(`withEmploymentHistory`). 본사 역할 · 점포 범위는 화면이 보지 않는다 — 범위 밖 · 본사에 가린 직원은 api 가 404 다.
* 확인창 — 제목 「생년월일 정정」, 지금 생년월일, 새 생년월일(`DateField`), 체크 「신분증 등으로 본인의 생년월일을 확인했습니다」(체크해야
  [정정]이 눌린다), 안내 세 줄(`BIRTH_DATE_NOTES` — 체결한 계약서는 안 바뀜 · 날인 대기 계약은 본인 대조를 다시 함 · 다른 근무지 소속에도 같이 바뀜),
  [취소] · [정정]. 공통 `DateField` 에 상한이 없어 오늘 뒤는 달력으로 막지 못한다 — 입력하면 칸 아래에 알리고 [정정]을 막는다(`checkBirthDate`,
  지금 생년월일과 같은 값도 미리 알린다). 만 19세 미만은 api 가 본다.
* 성공 — 토스트 「생년월일을 정정했습니다.」, 확인창을 닫고 `router.refresh`. 서버 액션(`correctBirthDateAction`)은 날짜 모양 · 오늘 뒤 · 같은 값을 api 까지 보내지 않고 막는다.
* 실패 — 검증 오류는 입력칸 아래(2026-10-29 재영 공지): 400 `BIRTH_DATE_INVALID` · `BIRTH_DATE_UNDER_AGE` 는 둘 다 새 생년월일 입력 검증이라 날짜 칸 아래 `dateNote` 자리에 api 문구를 보인다(`showsBelowBirthDateField`, 날짜를 고치면 지운다). 409 `BIRTH_DATE_UNCHANGED` 는 확인창 맨 아래에 api 문구(UNCHANGED 는 낡은 「지금 생년월일」을 다시 받는다 — `router.refresh`). 409 `BIRTH_DATE_NOT_JOINED` ·
  `BIRTH_DATE_RETIRED` 는 상태가 바뀐 것이라 토스트로 알리고 닫은 뒤 다시 받는다(`refreshesAfterCorrection` — `ActionFailure.code` 가 api 오류 본문의
  `code` 를 싣는다). 403 · 결과 모름은 `useFailure`, 404 는 확인창 안 문구. 칸 아래 400 문구는 날짜가 실제로 바뀔 때만 지우고(DateField 는 값이 같아도 blur 때 onChange 를 부른다) 그 동안 [정정]을 잠그며, 처리 중에 날짜를 바꿨으면 이전 날짜의 400 은 붙이지 않고, 맨 아래 오류는 날짜 · 체크를 바꿀 때 지운다. 새 생년월일이 바뀌면(DateField 의 blur 보정 포함) 신분증 확인 체크를 풀어 다시 받는다(`confirmAfterDateChange`) — 눌러서 blur 되는 순간 덜 친 값이 맞춰져 관리자가 보지 못한 날짜가 저장되는 것을 막는다. 칸에 덜 친 값이 보이는 채(DateField 는 덜 친 값을 밖으로 내보내지 않는다) [정정]이나 체크를 누르면 — 입력 이벤트 중에는 상태를 바꾸지 않고(바꾸면 DateField 칸이 되돌려진다) 그 순간에만 칸의 글자를 DOM 에서 읽어 판정한다(`isPendingInput`) — 보내지 않고 체크를 풀며, 체크박스 아래에 「날짜를 다 입력한 뒤 다시 확인해 주세요」를 보인다. 마우스로 체크할 때 pointerdown 뒤 날짜가 blur 로 바뀌었으면 이어진 click 이 체크를 다시 켜지 않는다(`ignoresCheck`) — 키보드 Space 는 그대로 된다. 확인한 뒤 입력칸을 한 번이라도 고쳤으면(입력 이벤트에서 ref 만 바꾼다) 체크를 풀고 보내지 않는다 — 1990-05-01 을 확인하고 1990-05-1 로 지운 채 [정정]을 누르면 blur 가 같은 값으로 맞춰 값 비교로는 못 잡는다. pointerdown 시각은 체크 영역 밖의 pointerdown · 키 입력(날짜 입력 포함)에서 지운다. 확인 버튼은 그리기 전 두 번째 클릭도 ref 로 막는다.
* 정정 이력은 화면에 보이지 않는다(이번 범위 밖).

# 가입 초대 재발송 (WHALEERP-138)

목록 「가입·인증」 칸의 배지 옆과 상세 기본 정보 「가입 상태」 줄에 soft 「재발송」을 둔다. 데모는 재발송을 근로계약 상세 제목 줄에만
두고 목록 자리가 없어, 칸을 210px 에서 300px 로 넓혀 배지 옆에 세웠다(데모와 다름). 상세는 목록의 이름 링크가 가입 완료 · 재직
직원에게만 걸려 실제로는 거의 쓰이지 않지만, 주소로 들어온 경우를 위해 같은 판정을 둔다.

* 보일지(`canResendInvitation`) — 응답의 `contract.canResend` 하나로 정한다(WHALEERP-611 · 130. 초대 행이 없는 옛 소속 확인 계약도
  보이도록 api #164 가 `invitation` 에서 `contract` 로 옮겼다. #164 전 응답을 위한 `invitation.canResend` 대체 값은 api #164 가
  머지 · 배포된 뒤 걷었다 — front #146 리뷰 참고 5). 최근 계약이 있을 때만 — 호출부가 `contract &&` 로 막는다. api 가 재발송
  (`POST /contracts/:id/send`, #136)이 가입 초대 알림톡이나 소속 추가 확인 요청을 실제로 보낼 수 있을 때만 참으로 준다 — 가입 전 ·
  휴대폰 번호 · 계약 발송 대기 또는 서명 대기 · 수락하지 않은 초대. 가입한 직원(앱 알림 재발송은 근로계약 상세에서)은 거짓이다. 예전에는
  화면이 계약 발송 대기까지 함께 봤다(앱 알림 전이라 서명 대기는 409 였다). 근로계약 상세의 재발송 버튼(`send-button.tsx`)과 같은 서버
  액션 · 실패 판정을 쓴다.
* 무엇을 보내는지 — api 가 보낼 때 다시 판별해 그 번호로 가입한 계정이 없으면 가입 초대 알림톡, 있으면 소속 추가 확인 요청(알림톡 ·
  메일, 계약은 발송 대기 · 날인 기한은 직원이 수락한 날부터, WHALEERP-130)을 보낸다. 화면이 읽은 가입 상태는 보낼 때와 다를 수 있어
  확인창이 둘을 함께 알린다(`inviteResendCopy`, 근로계약 상세 발송 대기와 같은 문구). 그사이 가입했으면 api 가 앱 알림으로 보낸다.
* 권한 — 근로계약 관리(MN000006) 수정 권한일 때만(`useMenuRole(MENU_CODE.contracts, "update")`). 다른 메뉴 화면에 놓인 버튼이라
  메뉴 코드로 찾는다(front #57). api #97(WHALEERP-592)이 send 경로에 같은 수정 권한을 건다. `MENU_CODE.contracts` 는 front #79 와 같은
  이름 · 값이다.
* 보내기 — 확인창(계약서를 다시 보내시겠습니까?) 뒤 근로계약 상세와 같은 서버 액션(`sendContract`)과 실패 판정(`sendFailureOf`)을
  쓴다. 성공하면 토스트 「계약서를 다시 보냈습니다.」와 함께 화면을 다시 받아 새 발송일(「초대 발송 · MM-DD」)을 보인다. 409 ·
  502 · 503 은 api 문구 그대로다 — `SEND_FAILED`(되돌렸고 다시 보낼 수 있음) · `SEND_CHANNEL_NOT_READY` · `SEND_PHONE_NOT_MOBILE` 는
  확인창 안에 보인다. 접수 여부를 모르면(`SEND_UNCONFIRMED`, 코드 없는 502 · 504, 연결 끊김) 가입 초대 재발송은 계약 상태를 바꾸지 않아 다시 받은
  화면에도 버튼이 그대로라, 확인창을 연 채 보내기를 잠그고(닫았다 열어도) 문구를 남긴 뒤 다시 받는다 — 바로 다시 눌러 알림톡이 두 번
  가지 않게(근로계약 상세와 같다, PR #85 리뷰). 풀려면 화면을 새로 고친다. 문구는 근로계약 상세용 「상세를 다시 읽었으니」 대신 「화면을
  다시 읽었으니」다. 화면이 낡았으면(상태 충돌) 다시 받은 화면에서 버튼이 사라지므로 토스트로 알리고 닫은 뒤 다시 받는다.

# 상세 가입 상태 · 초대 (WHALEERP-138)

기본 정보에 「가입 상태」(목록과 같은 `joinCell` 배지)와 「초대」(`invitationText` — 초대 유형 · 초대 상태 · 보낸 날)를 더했다.
초대 유형 · 상태 한글은 `getEnum("InvitationType")` · `getEnum("InvitationStatus")` 이고, 받지 못하면 그 조각만 빠진다(영문 값을
보이지 않는다). 가린 직원은 상세가 404 라 이 줄이 없다.

# 직원 자료 일괄 저장 (WHALEERP-337)

`/staff-members/export`(운영 정책 RET-09, 목업 `docs/mockup/staff/export.html`, 계획 `docs/plans/2026-10-29-staff-records-export-screen.md`).
목록 도구 줄의 [일괄 저장]과 이 화면은 BP 마스터(`BM`) · 가맹마스터(`FM`)에게만 보이고(`canBulkExport`), 다른 역할이 주소로 오면
「일괄 저장은 BP 마스터와 가맹마스터만 쓸 수 있습니다」를 보인다 — 막는 것은 api 403 이다. 업무 범위는 헤더 범위(`useScope`)를
`storeIdsOfScope`(`scopeStores` — 직영 · 가맹은 폐점 점포를 뺀다, 전체는 빈 목록)로 바꿔 미리 보기 · 요청에 싣는다.
미리 보기(`GET /staff-members/bulk-exports/preview`) · 지난 요청(`GET /staff-members/bulk-exports`)은 BFF, 요청 · 내려받기 주소는 서버 액션이고,
내려받기는 받은 서명 주소로 탭을 옮긴다(`location.assign`). 대상 0명 · 같은 범위 만드는 중이면 [일괄 저장 요청]을 끄고 까닭을 적으며, 요청한 뒤에는 새 미리 보기를 받을 때까지 꺼 둔다.
실패 줄의 [다시 요청]은 그 요청의 `storeIds` 로 다시 보내고, 같은 점포 묶음을 만드는 중인 줄이 있으면 끈다(막는 것은 api 409). api 503 은 요청이 만들어지지 않은 것이라 api 문장을 그대로 보인다.
만드는 중인 줄이 있거나 미리 보기가 `inProgress` 면 10초마다 둘을 다시 읽는다 — 운영 알림은 보내지 않는다(운영 정책 NTF-01). 받을 수 있는 기한은 api `expiresAt`(한국 날짜 MM-DD)로 보인다.
api(Plane 336)가 openapi.json 에 싣기 전이라 응답 타입은 `bulk-export-model.ts` 에 손으로 적었다.

# 아직 없는 것

* 가입 연결 확인 시트(#139), 직원 초대(근로계약서 초안).
* 상세 「근로계약서 작성」 버튼의 직원 미리 채움 — 작성 화면이 직원을 받지 않는다.
* 쪽 이동이 `router.replace` 라 뒤로 가기가 쪽을 거슬러 가지 않는다.

# 공통 Button 의 danger

퇴직 처리를 데모처럼 붉게 보이려고 공통 `Button` 에 `danger`(상태 빨강 `erp-off`)를 더했다 — 데모 `ui.mjs` 의
danger 와 같은 값이다. 1팀이 동의해(2026-10-27) DESIGN.md Buttons 에 네 번째 모양 **Danger** 로 올렸다.
