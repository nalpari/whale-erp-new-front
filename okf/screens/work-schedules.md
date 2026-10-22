---
type: Screen
title: 근무스케줄 관리 화면 (구현)
description: /work-schedules 주간 · 월간 보기, 변경 이력 패널, 등록 · 수정 · 삭제 패널(한 명 · 여러 명 일괄). 데이터는 근무스케줄 api 다. 지난 주 복사는 다음 PR.
tags: [staff, work-schedule, screen]
status: draft
generated: { by: claude-code/opus-5.5, at: 2026-10-22T11:00:00Z }
sources:
  - id: page
    resource: ../../src/app/work-schedules/page.tsx
    title: 화면 틀 · 도구 줄(근무지 · 보기 · 주 이동) · 데이터 읽기
    last_modified: 2026-10-21T09:21:20Z
  - id: query
    resource: ../../src/app/work-schedules/work-schedule-query.ts
    title: 주소 ↔ 조회 조건 ↔ api 쿼리, 주 · 달 · 42일 범위
    last_modified: 2026-10-21T09:21:20Z
  - id: view
    resource: ../../src/app/work-schedules/work-schedule-view.ts
    title: 막대 · 근무 인원 줄(30분 → 1시간) · 공백 · 이력 한 줄
    last_modified: 2026-10-21T09:21:20Z
  - id: week
    resource: ../../src/app/work-schedules/schedule-week.tsx
    title: 주간 보기
    last_modified: 2026-10-21T09:21:20Z
  - id: month
    resource: ../../src/app/work-schedules/schedule-month.tsx
    title: 월간 보기
    last_modified: 2026-10-21T09:21:20Z
  - id: controls
    resource: ../../src/app/work-schedules/schedule-controls.tsx
    title: 근무지 고르기 · 날짜로 주 고르기 · 변경 이력 패널
    last_modified: 2026-10-21T09:21:20Z
  - id: form
    resource: ../../src/app/work-schedules/schedule-form.tsx
    title: 등록 · 수정 패널(SchedulePanel) · 도구 줄 「근무스케줄 등록」 · 막대 · 「이 시간대에 배정」
    last_modified: 2026-10-22T11:00:00Z
  - id: form-model
    resource: ../../src/app/work-schedules/schedule-form-model.ts
    title: 시각 선택지 · 근무 길이 · 화면에서 막는 것 · 계약 값 → 입력칸
    last_modified: 2026-10-22T11:00:00Z
  - id: actions
    resource: ../../src/app/work-schedules/actions.ts
    title: 등록 · 일괄 · 수정 · 삭제 · 받을 수 있는 직원 · 계약 값 server action
    last_modified: 2026-10-22T11:00:00Z
  - id: api
    resource: ../../src/lib/work-schedules-api.ts
    title: 근무스케줄 api(조회 · 이력 · 직원 · 계약 값 · 등록 · 일괄 · 수정 · 삭제)
    last_modified: 2026-10-22T11:00:00Z
---

# What it is

근무스케줄 관리(`/work-schedules`, 메뉴 MN000010 「근무스케줄 관리」 — #202 · #343 · #608). 목업 `docs/mockup/staff/index.html` 근무스케줄 탭과
데모 `docs/demo/staff/work-schedules.html`(원본 `docs/demo/src/staff-parts.mjs` 의 `schedWeek` · `schedMonth` · `coverRow`)을 공통 컴포넌트로 옮겼다.
계획은 `docs/plans/2026-10-21-work-schedules-screen.md`, api 결정은 api `docs/plans/2026-10-21-work-schedules.md` 다.

화면 상태는 주소에만 둔다: `?store=&view=week|month&week=<월요일>&day=&month=YYYY-MM&history=1&hfrom=&hto=&hstaff=&hpage=&hsize=`. 기본값(이번 주 · 오늘 · 이번 달)은 주소에서 뺀다.
근무스케줄은 점포 하나씩 본다 — 주소에 점포가 없으면 헤더 범위가 점포 하나일 때 그 점포(`?scope=STORE:12` 도 읽는다), 아니면 폐점이 아닌 첫 점포로 옮긴다(`SchedulePicker`).

# 주간 보기

* 요일 칩 7개(월~일, 그날 근무 인원 `days[].headcount`) → 고른 요일의 시간축 24칸(00~23시).
* 직원 줄은 그날 `schedulableDates` 에 든 직원만(휴무 포함, STAFF-29). 본사에게 가려진 직원(`isMasked`)은 줄을 두되 이름 · 막대를 비우고 key 는 순번이다(STAFF-39).
* 막대는 시작 · 길이의 비율, 자정을 넘으면 24시에서 자르고 글자로 「22:00~익일 02:00」(STAFF-33), 24시에 끝나면 「~24:00」. 쪼갠 근무는 한 줄에 막대 여럿.
* 근무 인원 줄 24칸 — api 의 30분 칸 48개에서 **한 시간 칸 = 두 반칸 중 작은 값**(30분 공백도 0 으로 보이게). api 가 전날 넘어온 새벽 근무도 센다(api Q4). 근무 앞뒤 · 사이 모두 빈칸 없이 숫자로 보이고 아무도 없으면 0(빨강)이다(2026-10-22 재영 — 앞서 둔 「근무 바깥은 빈칸」을 바꿈). 공백 안내는 그날 시작한 근무의 첫 시작~마지막 종료 사이만 세고(STAFF-37), 전날에서 넘어온 근무가 끝난 뒤의 새벽은 공백으로 세지 않는다. 그래서 주간은 전주 일요일부터 8일을 받는다. 가린 직원의 넘어온 근무는 items 에 없어 그날 근무로 센다. 0 빨강 · 1 회색 · 2 이상 파랑 + 숫자.
* 공백 줄 — 그날 시작한 근무의 첫 시작~마지막 종료 사이 0 인 구간을 30분 단위로 「공백 1시간 30분 · 15:00-16:30 에 배정된 직원이 없습니다」. 공백마다 「이 시간대에 배정」이 그 근무일 · 공백 시각으로 등록 패널을 연다.

# 등록 · 수정 · 삭제(#203)

* 여는 곳: 도구 줄 「근무스케줄 등록」(등록 권한) · 막대(수정 권한이 없으면 글자만) · 「이 시간대에 배정」. 패널(`SchedulePanel`)은 화면 안 상태라 주소에 남지 않는다 — 입력이 이동에 지워지지 않게. 등록 패널은 바깥을 눌러도 닫히지 않는다.
* 방식 「한 명 / 여러 명 일괄」, 근무일은 하루 하나. 직원은 그 근무일에 받을 수 있는 직원(`GET /assignable-staff`, STAFF-29)이고 근무일을 바꾸면 고른 직원을 비운다.
* 직원을 고르면 계약 근무시간(`GET /defaults`)으로 채운다. 계약에 시작 · 종료가 있으면 「계약 값으로 되돌리기」를 보인다(STAFF-14). 공백에서 열면 그 시각 · 휴게 0분을 두고 계약 값으로 덮지 않는다.
* 시각은 30분 단위 선택(시작 00:00~23:30, 종료 00:30~24:00 — 시작보다 이르면 「익일 02:00」), 휴게는 분. 화면에서 먼저 막는 것은 빈칸 · 24시간 · 휴게 ≥ 근무시간이고 나머지(계약 · 퇴직일 · 겹침 · 가입 전 · 가림)는 api 문장을 그대로 보인다.
* 여러 명 일괄은 체크 목록 → 직원마다 줄, 저장은 「n명 등록」(`POST /bulk`). 일부가 실패하면 성공한 직원은 빼고 실패한 직원만 사유와 함께 남긴다.
* 수정은 직원 고정, 근무일 · 시각 · 휴게. 「삭제」는 확인창 뒤(삭제 권한). 결과를 모르면(5xx · 끊김) 토스트로 알리고 화면을 새로 받아 닫는다 — 다시 저장하면 겹칠 수 있다.
* 폐점 점포(운영 정책 ATT-33, 2026-10-22 재영)는 점포 고르기에 그대로 있되 「근무스케줄 등록」을 막고 옆에 「폐점 점포는 근무스케줄을 등록할 수 없습니다.」, 「이 시간대에 배정」은 숨긴다. 수정 · 삭제는 막지 않는다. api 쪽 거절은 WHALEERP-614.

# 월간 보기

* 달력 6주(그 달 1일이 든 주의 월요일부터 42일)를 한 번에 읽는다(api 상한 42일). 칸에는 `headcount` 만, 그 달 밖의 날은 흐린 칸.
* 왼쪽: 고른 날 · ‹ › 날 이동 · 근무자(이름 · 고용 형태 · 시간). 본사에게 가려진 직원은 이름 없이 「그 밖에 n명(본사 제공 동의 없음)」으로만 센다.

# 변경 이력

* 「변경 이력」(쪽 머리)으로 여는 `SlidePanel`(바깥 눌러 닫힘 — 잃을 입력이 없다). 필터: 변경일 기간(`DateField` 둘) · 직원(그 기간 응답의 가리지 않은 직원). 20 · 50 · 100 + `Pagination`.
* 줄: 일시(한국 시각 MM-DD HH:mm) · 구분(추가 · 수정 · 삭제 — 삭제는 빨강 꼬리표에 글자로도) · 「서지안 09-04 13:00-21:30 → 09:00-17:00 · 정하윤」. 근무일이 바뀌면 뒤에도 날짜, 휴게만 바뀌면 「휴게 30분 → 60분」.
* 본사 계정 · 가맹 점포에서 동의 없는 직원의 이력은 api 가 줄째로 뺀다(api Q12).

# 아직 없는 것

* 지난 주 복사 미리보기(#204) — 다음 PR(계획 문서 「PR 나눔」 3).
* 직원 상세의 근무스케줄 칸 안(지금 「준비 중입니다.」). 「관리」 링크는 걸었다(`/work-schedules?store=<근무지>`).
