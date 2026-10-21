---
type: Screen
title: 급여명세서 관리 화면 (구현)
description: /payslips 목록(급여명세서 작성 팝업 포함)과 /payslips/[payslipId] 검토 화면. 데이터는 급여명세서 api(GET /payslips · GET /payslips/:id · GET /payslips/candidates · POST /payslips · POST /payslips/bulk)이고, api 에 칸이 없어 뺀 것과 아직 동작이 없는 버튼.
tags: [staff, payroll, screen]
status: draft
generated: { by: claude-code/opus-5.5, at: 2026-10-21T06:00:00Z }
sources:
  - id: payslips-lib
    resource: ../../src/lib/payslips.ts
    title: 타입(생성한 api 타입) · 조회 조건 · api 쿼리 · 달 · 합계
    last_modified: 2026-10-19T09:00:00Z
  - id: payslips-api
    resource: ../../src/lib/payslips-api.ts
    title: GET /payslips · GET /payslips/:id 호출(404 → null)
    last_modified: 2026-10-19T09:00:00Z
  - id: payslip-list-page
    resource: ../../src/app/payslips/page.tsx
    title: 목록 화면 — 상태 필터 · 달 이동 · 상태 건수 · 건수 선택 · 목록
    last_modified: 2026-10-19T09:00:00Z
  - id: payslip-list-query
    resource: ../../src/app/payslips/payslip-list-query.ts
    title: 목록 URL ↔ 조회 조건(달은 늘 싣는다, 기본 건수 20 은 뺀다)
    last_modified: 2026-10-19T09:00:00Z
  - id: payslip-row
    resource: ../../src/app/payslips/payslip-row.ts
    title: 목록 칸(급여 기간 · 출퇴근 확인 · 발송일) · 상태 색 · 지급 도움말 · 경고 띠
    last_modified: 2026-10-19T09:00:00Z
  - id: payslip-draft-dialog
    resource: ../../src/app/payslips/payslip-draft-dialog.tsx
    title: 급여명세서 작성 팝업 — 점포 · 이름 좁히기 · 직원 고르기 · 작성 · 일괄 작성(칸 문구 payslip-draft.ts, server action actions.ts)
    last_modified: 2026-10-19T14:00:00Z
  - id: payslip-detail-page
    resource: ../../src/app/payslips/[payslipId]/page.tsx
    title: 검토 화면 — 오른쪽 단(검토 사유 · 참조한 것 · 처리 이력)
    last_modified: 2026-10-19T09:00:00Z
  - id: payslip-edit
    resource: ../../src/app/payslips/[payslipId]/payslip-edit.ts
    title: 검토 화면 고칠 거리 — 임시저장 본문 · 추가 공제 붙이기 · 떼기 · 지난 명세서 불러오기(server action actions.ts)
    last_modified: 2026-10-19T16:00:00Z
  - id: payslip-review
    resource: ../../src/app/payslips/[payslipId]/payslip-review.tsx
    title: 검토 화면 — 머리 버튼 · 지급 내역 · 확인창
    last_modified: 2026-10-19T09:00:00Z
---

# api 로 그린다

목록은 `GET /payslips?month&status&storeIds&staffName&page&pageSize`, 상세는 `GET /payslips/:id` 다(`src/lib/payslips-api.ts`, 직원 목록
`staff-members-api.ts` 와 같은 `request()` · `authHeaders()` · `ApiError` 모양). 응답 타입은 `api-types.generated.ts` 의
`PayslipListResponseDto` · `PayslipDetailResponseDto` 를 그대로 쓴다. 메뉴 권한(MN000009 조회) · 관리 범위 · 가림은 api 가 본다.
상세의 없음 · 범위 밖 · 가림 · 이상한 id 는 404 → `notFound()`, 그 밖의 api 오류(꺼짐 · 401 · 403)는 `error.tsx` 가 받는다.
상태 · 검토 사유 · 처리 구분 · 근로계약 상태 · 계약 유형 한글은 `getEnum` 으로 받는다(`PayslipStatus` · `PayslipReviewReason` ·
`PayslipLogType` · `ContractStatus` · `EmploymentType`).

# 목록은 Plane WHALEERP-233 을 따른다

칸과 필터는 Plane WHALEERP-233 완료 조건이 기준이고, 데모(`staff-sections.mjs` payList · payslipsFilter)와 **일부러 다르다**.

* 필터는 급여 기간(목록 위 달 이동) · 점포 · 직원명 · 명세서 상태다(점포 · 직원명은 2026-10-19 사용자 요청으로 더했다).
  점포 · 직원명 검색칸은 직원 목록 필터와 같은 `SearchField` 다 — Enter · 돋보기로 반영하고, 점포명은 로그인 정보의 관리 점포에서
  맞는 점포 id 를 찾아(`storeIdsByName`) URL 에 `store` · `storeIds` 로 함께 둔다. 직원명은 `staffName`. api 는 `storeIds` ·
  `staffName` 을 받는다. 맞는 점포가 없으면 api 를 부르지 않고 0건(상태 건수도 0)이다. 점포명만 있고 id 가 없는 주소는 필터가
  들어오자마자 채운다. 직원명으로 거르면 본사 역할에게 가린 줄은 api 가 목록과 상태 건수에서 모두 뺀다 — 이름 검색으로 가린
  직원이 드러나지 않게. 상태 건수는 점포 · 직원명 필터를 따르고 상태 필터는 따르지 않는다.
  상태를 모두 고르면 `status` 를 빼고, 하나도 고르지 않으면 api 가 빈 값을 400 으로 막아 `status` 없이 부른 뒤 줄은 버리고
  상태 건수만 쓴다(0건).
* 칸은 순번 · 급여 기간 · 직원명 · 근무지 · 계약 유형 · 출퇴근 확인 여부 · 상태 · 발송일이다. 출퇴근 확인 여부는
  `isAttendanceConfirmed` — true 「확인」, false 「누락」, null(가린 줄) 「-」. api 에 누락 일수 칸이 없어 일수는 보이지 않는다.
  발송일은 `lastSentAt` 을 근로계약 목록처럼 MM-DD 로, 발송 전이면 「-」.
* 상태 건수는 `statusCounts`(상태 필터와 상관없이 점포 · 직원명 필터만 건 그 달 건수, 직원명으로 거르면 가린 줄은 뺀다). 쪽 넘김은 `total` · `page` · `pageSize`,
  건수는 20 · 50 · 100(기본 20, URL 에서 뺀다). 명세서가 없으면 「이 달의 급여명세서가 없습니다.」
* 가린 줄(`isMasked`, 본사 제공 동의 없는 가맹 점포 직원, ATT-30)은 근무지 · 급여 기간 밖은 「-」, 직원명은
  「본사 제공 동의 없음」이며 링크가 없다(payslipId 가 null 이라 순번으로 줄을 가른다).

# api 에 칸이 없어 뺀 것

목 시절 화면에 있던 값 가운데 api 응답에 없는 것은 값을 지어내지 않고 화면에서 뺐다.

* 목록 「계약 없음 · 초안 없음」 줄(이 달 명세서가 없는 재직 직원)과 출퇴근 누락 일수.
* 상세 「참조한 것」의 집계 근로시간 · 덧붙임 · 근무스케줄 기준 시간.
* 지급 칸 도움말의 계산 근거 글자(데모 「8.0h × 1.5배 · 가산 적용」) — 「계산값」 · 「계산값 A 을 B 으로 고침」만 남는다.
* 근로계약 번호(데모 `CTR-2026-0143`)는 contracts 에 칸이 없어 `근로계약 #id` 링크로 보인다. 계약 급여의 단위(월 · 시간)도
  칸이 없어 고용형태로 붙인다. 근로계약 상태가 null 이면 「-」.

# 목록 「확정 N건 발송」 (WHALEERP-231 · 237)

확정 건이 있고 수정 권한이 있을 때 선다. 확인창 뒤 `POST /payslips/send`(server action `sendPayslips`)로 목록과 같은 달 · 점포 ·
직원명(`sendTargetOf` — 건수와 같은 조건)의 확정 명세서를 보낸다. 모두 보내면 토스트 「N건을 발송했습니다.」, 실패가 있으면 결과 창
「N건 발송, M건 실패」에 실패 대상(직원 · 이유)을 따로 보인다 — 가린 명세서는 이름 대신 「본사 제공 동의 없음」. 끝나면 목록을
다시 받는다. 보내지 못한 명세서는 확정 그대로라 다시 보낼 수 있다.

# 검토 화면에서 고치기 · 확정 (WHALEERP-228 · 230)

버튼은 server action(`[payslipId]/actions.ts`)으로 api 를 부른다. 성공하면 토스트 뒤 `router.refresh()` 로 상세를 다시 받고,
page 가 `updatedAt` 을 `PayslipReview` 의 key 로 줘 금액 칸 · 스위치가 새 값으로 다시 선다. 실패하면 api 문장을 확인창 안에 보인다
(409 그사이 고침 · 상태 다름, 422 비어 있는 공제 등). api 가 `code` 를 붙인 5xx(메일 · 직원 앱 주소 설정 없음 503, 메일 실패 502)도
원인이 정해진 실패라 api 문장을 그대로 보인다. 그 밖의 5xx · 연결 실패 · server action 호출 끊김은 「결과를 확인하지 못했습니다」를
확인창에 두고 상세를 다시 받는다(실제로 저장 · 발송됐으면 새 값으로 다시 서며 안내도 사라진다). 목록 「확정 N건 발송」과 작성 팝업도
같은 규칙이고, 결과를 모르면 목록을 다시 받는다 — 오류 화면으로 가지 않아 입력하던 값이 남는다.

* **임시저장**(`PUT /payslips/:id`) — 줄마다 급여 항목 id 와 금액(빈 칸 null — 0 과 다르다), 가산 · 3.3% 스위치, 상세의 `updatedAt`.
  숫자가 아닌 칸이 있으면 보내지 않고 그 이름을 알린다. 상태는 그대로다. 3.3% 는 파트타이머만 보낸다.
* **항목 추가** — `GET /payslips/additional-items`(추가 공제) 중 아직 붙지 않은 것을 골라 빈 칸 한 줄을 붙인다. 붙인 추가 공제는
  「빼기」로 뗀다. 둘 다 임시저장해야 남는다(api 는 실은 추가 공제가 곧 붙은 목록이다).
* **지난 명세서에서 불러오기**(`GET /payslips/:id/previous-values`) — 같은 직원의 지난 명세서의 공제와 직접 넣는 지급 값을 칸에 채운다
  (`applyPrevious` — 같은 급여 항목 칸은 바꾸고, 없는 추가 공제는 붙이고, 이 명세서에 없는 지급 · 기본 공제 줄은 버린다). 저장하지
  않고 위에 「… 값 N칸을 불러왔습니다. 임시저장해야 남습니다.」 띠를 둔다. 지난 명세서가 없으면 확인창에 알린다.
* **확정**(`POST /payslips/:id/confirm`) — 저장하지 않은 바뀜이 있거나 보이는 공제가 비어 있으면 확인창의 확인이 막힌다(api 도
  422 `DEDUCTION_MISSING` 로 막는다). 검토 사유가 있으면 「확인한 것으로 남습니다」를 덧붙인다.
* **확정 취소**(`POST /payslips/:id/cancel-confirmation`) — 확정 · 발송 완료에서 검토 중으로. 발송 완료에서 취소하면 확인창이
  「직원 근무 앱에서는 다시 보낼 때까지 이 명세서가 보이지 않는다」고 알린다(직원 앱은 발송 완료만 보인다).
* **발송**(`POST /payslips/:id/send`, 확정일 때) · **재발송**(`POST /payslips/:id/resend`, 발송 완료일 때) — 머리 버튼, 확인창을 거친다.
  직원 앱 계정 이메일로 간다. 메일 설정 없음 · 계정 없음 · 메일 실패 등은 api 문장을 확인창에 보인다(실패하면 확정 그대로).
* 위쪽 경고 띠(`reviewBand`)는 이미 확인한 검토 사유(`acknowledgedAt` — 확정 때 확인됨)를 세우지 않는다.
* 3.3% 원천징수 칸 도움말은 「비과세를 포함한 지급 총액 N원에 매긴다」로 기준 금액을 보인다 — 금액은 관리자가 넣는다(PAY-03).
* 「출퇴근으로 다시 계산」은 출퇴근 집계(WHALEERP-227)가 없어 「준비 중」으로 막았다. 앱 푸시는 api 에 없어 보내지 않는다.

금액은 `adjustedAmount ?? calculatedAmount`(넣지 않았으면 빈 칸), 3.3% 를 켜면 소득세 · 지방소득세 칸이 빠지고 사업소득세(3%) ·
지방소득세(0.3%)가 선다(`isItemShown`, [직원 운영 관리](/staff.md) 급여). 고칠 수 있는 것은 작성 중 · 검토 중이고 「급여명세서 관리」
(MN000009) 수정 권한이 있을 때뿐이다. 확정 · 발송 완료는 읽기만 하고 「확정 취소」와 「발송」 · 「재발송」을 둔다(확정 취소는 데모에 없는 버튼). 출퇴근 보정 · 출퇴근
기록 보기는 출퇴근 현황 화면이 없어 「준비 중」이다.

# 급여명세서 작성 (WHALEERP-226)

목록의 「급여명세서 작성」(MN000009 등록 권한일 때만 보임)은 화면을 옮기지 않고 **목록 위 팝업**(720px, 데모 `staff-sections.mjs`
`pickId`)을 연다. 달은 목록의 달이다. **미리 고른 직원은 없다**(데모처럼 특정 직원 명세서로 바로 가지 않는다). 따로 있던
`/payslips/new` 화면은 지웠다.

* 열 때마다 `GET /payslips/candidates?month=` 를 server action(`getPayslipCandidatesAction`)으로 받는다. 위에 점포 선택(「전체 점포」 +
  작성 대상의 점포)과 직원 이름 검색칸이 있고, 표를 화면 안에서 좁힌다. 본사 역할에게 동의 없는 가맹 점포 직원은 api 가 빼서 없다.
* 표: 선택(라디오) · 직원 · 점포 · 계약 유형 · 근로계약(유효 / 「계약 없음」 빨간 꼬리표) · 명세서(미작성 / 「작성됨」 회색 꼬리표).
  근로계약이 없거나 이미 작성된 직원은 라디오가 막힌다. 고를 수 있는 직원에게 출퇴근 기록이 없으면 이름 옆에 「출퇴근 누락」을
  작게 붙인다. 좁혀서 0줄이면 「조건에 맞는 직원이 없습니다.」, 위에 「근로계약이 있고 이 달 명세서가 없는 직원만 고를 수 있습니다.」
* 아래 오른쪽 취소 · 작성(고르기 전에는 막힘). 작성은 `createPayslip`(`POST /payslips`) → 그 검토 화면으로 redirect. 409 는 문장과
  「작성된 명세서 보기」 링크, 422 · 404 등은 문장을 팝업 안에 보인다.
* 아래 왼쪽 「이 달 일괄 작성」 — 확인창(만들 건수) 뒤 `bulkCreatePayslips`(`POST /payslips/bulk`), 결과를 토스트 한 줄
  (「2건 작성 (출퇴근 누락 1건) · 3건 건너뜀 (이미 있음 1 · 계약 없음 2)」, `bulkSummary`)로 띄우고 팝업을 닫은 뒤 목록을 다시 받는다.
  만들 줄이 없으면 막힌다. 확인창은 팝업 `<dialog>` 밖에 둔다 — 안에 두면 확인창의 Esc 가 React 트리를 따라 팝업까지 닫는다.
* 닫으면(취소 · Esc) 고른 직원 · 좁히기 · 오류를 지운다. 공통 컴포넌트에 큰 팝업이 없어 확인창 · 변경 이력 팝업과 같은 네이티브
  `<dialog>` 를 쓴다.
* 초안은 작성 중 상태, 금액은 비어 있다(계산은 WHALEERP-227).

# 메뉴 url

공통 틀은 메뉴 url 아래 주소만 연다. MN000009 url 은 api 마이그레이션 `20261015110333_team3_menu_single_level_urls` 로 `/payslips` 가 됐다(그 전 초기 데이터는
`/staff/payrolls` 라 「접근 권한이 없는 메뉴」로 막혔다, #592 결정).
