---
type: Screen
title: 직원 정보 관리 화면 (구현)
description: /staff 목록과 /staff/[id] 상세의 구현 상태 — 화면만 목 데이터로 만들었고, api 는 관리자 로그인 · 상세 요약 api 가 나온 뒤 붙인다. 붙일 때 바꿀 곳과 다시 작업할 것.
tags: [staff, screen, mock]
status: draft
generated: { by: claude-code/opus-5.5, at: 2026-10-13T02:10:00Z }
sources:
  - id: staff-members-lib
    resource: ../../src/lib/staff-members.ts
    title: 데이터 계층 — 타입(api 응답 모양) · queryStaff · findStaff · getStaffMembers · getStaffMember
    last_modified: 2026-10-12T08:33:58Z
  - id: staff-members-mock
    resource: ../../src/lib/staff-members.mock.ts
    title: 목 데이터 69건(기본 재직 필터 63건)
    last_modified: 2026-10-12T08:33:58Z
  - id: staff-list-page
    resource: ../../src/app/staff/page.tsx
    title: 직원 목록 화면
    last_modified: 2026-10-12T08:33:58Z
  - id: staff-detail-page
    resource: ../../src/app/staff/[id]/page.tsx
    title: 직원 상세 화면(틀 + 기본 정보)
    last_modified: 2026-10-12T08:33:58Z
  - id: staff-row
    resource: ../../src/app/staff/staff-row.ts
    title: 한 줄 표시 규칙(배지 · D-day · 재직 칸)
    last_modified: 2026-10-12T08:33:58Z
  - id: button
    resource: ../../src/components/common/button.tsx
    title: 공통 Button — danger 추가
    last_modified: 2026-10-12T08:33:58Z
---

# 화면만 있다

직원 정보 관리의 목록(`/staff`, WHALEERP-138)과 상세(`/staff/[id]`, WHALEERP-184)는 **화면만 목
데이터로 만든 상태**다. 관리자 로그인(1팀)이 아직 없어 관리자 토큰으로 api 를 부를 수 없고, 상세의 내용을 주는
상세 요약 api(WHALEERP-183)는 이 작업 범위가 아니다. 그래서 둘 다 `src/lib/staff-members.ts` 의 함수가 목을 거른다
— **api 를 붙일 때 그 함수의 안만 바꾸고 화면은 손대지 않게** 나눠 두었다. 배치는 데모
`docs/demo/staff/index.html` · `detail.html` 과 같다(목록의 「이번 주」 칸만 뺐다).

# 목록 — api 를 붙일 때

응답 모양은 api `GET /staff-members`(whale-erp-api PR #13)를 그대로 옮겼다. `getStaffMembers(query)` 안을
`request()` 로 바꿀 때:

* 화면 묶음(가입 완료 · 초대 발송 · 연결 보류 · 소속 추가 확인 · 가입 불가)은 그 상태들을 `joinState` **쉼표 목록**으로,
  고용형태는 `employmentType` 쉼표 목록으로 보낸다. 모두 고른 목록과 재직 상태 「전체」는 파라미터를 뺀다.
* **묶음 · 고용형태를 하나도 고르지 않았거나 점포명에 맞는 점포가 없으면 api 를 부르지 않고 0건이다.** api 는 빈 값을
  400 으로 막고, 파라미터를 빼면 전체를 돌려준다 — 둘을 바꿔 쓰면 「하나도 안 고름」이 「전체」가 된다.
* 점포 필터는 화면이 점포명 검색인데 api 는 `storeIds` 다. 점포 조회로 ID 를 구해 보낸다.
* 라벨(`StaffJoinState` · `EmploymentType`)은 `getEnum` 으로 바꾼다. 화면 묶음 라벨(`JOIN_GROUP_LABELS`)은 화면 것이라 남는다.
* api 오류(403 · 400 · 네트워크)를 받을 화면(`error.tsx`)이 아직 없다. 붙일 때 같이 만든다.

# 상세 — 다시 작업할 것

상세는 틀과 기본 정보만이다. 기본 정보의 「재직 상태」는 `employmentStatusCells` 로 재직 · 퇴직 예정(퇴직일) · 퇴직만
보인다 — 목록의 재직 칸(`statusCells`)은 가입 · 계약 상태를 섞은 요약이라 상세에 쓰지 않는다(2026-10-13 재영: 머지 블로커).

상세는 틀과 기본 정보만이다. 상세 요약 api(#183)가 나오면 `getStaffMember(id)` 를 그 응답으로 바꾸고:

* 기본 정보의 직무 · 입사일 · 생년월일 · 본인인증 · 이메일(지금 「-」)을 채운다.
* 근로계약 · 근무스케줄 · 출퇴근 현황 · 급여명세서 · TO-DO 영역(지금 「준비 중입니다.」)을 데모처럼 채운다.
* 「퇴직 처리」(#585, api 는 main 에 있음) · 「비밀번호 초기화」(#177)는 지금 누르면 「준비 중입니다.」 알림만 띄운다.
  관리자 로그인 뒤 확인창과 api 호출로 바꾼다.
* 가린 직원(본사 제공 동의 없는 가맹 직원)은 상세로 들어가지 못하고 404 다(#184). api 도 같은 판단을 해야 한다.

# 아직 없는 것

* 재발송 버튼 — api 가 `invitation.canResend` 를 주지만, 누르면 부를 발송 api(#136)가 없다.
* 가입 연결 확인 시트(#139), 일괄 저장 · 직원 초대(근로계약서 초안) · 각 「관리」 링크의 대상 화면.
* 쪽 이동이 `router.replace` 라 뒤로 가기가 쪽을 거슬러 가지 않는다.

# 공통 Button 의 danger

퇴직 처리를 데모처럼 붉게 보이려고 공통 `Button` 에 `danger`(상태 빨강 `erp-off`)를 더했다 — 데모 `ui.mjs` 의
danger 와 같은 값이다. 공통 컴포넌트와 DESIGN.md(버튼 「세 종류」)는 1팀 관리라 **1팀 확인이 필요하다.**
