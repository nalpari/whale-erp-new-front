---
type: Convention
title: 네이밍 규칙
description: DB·API·FRONT 세 계층이 같은 개념을 같은 영문 이름으로 부르게 하는 규약. 용어집 표준 표기와 영문 식별자의 대응표를 함께 둔다.
tags: [convention, naming, shared]
sources:
  - { id: naming-2026-09-30, resource: ../../docs/raw/2026-09-30-네이밍-규칙.md, title: WHALE ERP 네이밍 규칙 (DB · API · FRONT) }
generated: { by: claude-code/opus-5.5, at: 2026-10-06T01:12:21Z }
---

근거: `docs/raw/2026-09-30-네이밍-규칙.md` (3팀 기획 세션 · 2026-10-06 고침)

**확정** — 2026-10-01 재영이 문서 전체를 확인했다. 새 라우트·타입·API 함수는 이 규칙을 따른다.

세 저장소(`whale-erp-api`, `whale-erp-front`, `whale-erp-staff`)가 같은 개념을 같은 영문 이름으로 부르게 하려는 규약이다. 한글 용어는 공통 용어집의 표준 표기를 따르고, 여기 적힌 **영문 식별자**가 그 표준 표기의 코드 이름이다. 새 개념을 코드에 넣을 때는 대응표에 먼저 한 줄을 더한다.

원본은 기획 세션이 관리한다. 원자료 `docs/raw/2026-09-30-네이밍-규칙.md` 한 파일을 제자리에서 고치고 세 저장소에 같은 내용으로 둔다. 파일 이름의 날짜는 만든 날이지 버전이 아니며, 고칠 때마다 머리말에 「고침」 줄을 더한다. 최신인지는 「고침」 줄과 `okf/log.md`를 비교해 확인하고, 고친 뒤 각 저장소에서 `/okf-ingest`를 돌린다. 새 개념이 생기면 공통 용어집에 표준 표기를 먼저 정하고 대응표에 영문 식별자를 더한다.

# 원칙

1. **계층마다 생태계 관례를 따른다.** DB는 `snake_case`, API·JSON·TypeScript는 `camelCase`, URL·파일은 `kebab-case`. 변환은 Prisma `@map` 이 맡는다.
2. **표준 표기 하나 = 영문 식별자 하나.** 세 계층이 같은 어근을 쓴다 — `attendance_records` ↔ `attendanceRecord` ↔ `/attendance-records` ↔ `AttendanceRecord`.
3. **약어 금지.** `emp`, `ctr`, `att` 처럼 줄이지 않는다. 예외는 `id`, `url`, `bp`, `hq`, `faq`, `todo`, `rrn`(주민등록번호), `biz`(사업자), `ceo`(대표자), `admin`(관리자) 뿐이다.

# FRONT (Next.js)

관리자 웹과 직원 근무 앱이 함께 쓴다.

| 대상 | 규칙 | 예 |
|---|---|---|
| 라우트 폴더 | kebab-case 영문, API 자원 이름과 같게 | `app/staff-members/[id]/contracts/new/` |
| 파일 | kebab-case | `contract-form.tsx`, `use-payslips.ts` |
| 컴포넌트 | PascalCase | `ContractForm`, `PayslipStatusBadge` |
| 훅 | `use` + 명사 | `usePayslips`, `useStoreScope` |
| API 함수 · 서버 액션 | 동사 + 자원 | `getPayslips`, `createContract`, `resendContract` |
| 이벤트 핸들러 | `handle` 접두 | `handleSubmit`, `handleProxyEntryClick` |
| 쿼리 키 | `[자원, 범위, 조건]` | `['payslips', 'list', { storeId, month }]` |
| 타입 | 자원 PascalCase 단수, enum 은 API 값 그대로 | `Payslip`, `PayslipStatus` |
| 화면 문구 | enum → 한글 대응표를 한 곳에 | `PAYSLIP_STATUS_LABEL.CONFIRMED = '확정'` |

# API (NestJS)

| 대상 | 규칙 | 예 |
|---|---|---|
| 경로 | kebab-case 복수 명사, 동사 금지 | `GET /staff-members/:id/contracts` |
| 상태를 바꾸는 동작 | 하위 경로 + POST | `POST /contracts/:id/resend`, `POST /payslips/:id/cancel-confirmation` |
| 쿼리 파라미터 | camelCase | `?storeId=3&from=2026-09-01` |
| JSON 필드 | camelCase, DB 컬럼명을 그대로 내보내지 않는다 | `{ startDate, isProxyEntry }` |
| 모듈 폴더 | 자원 복수 kebab | `src/payslips/`, `src/staff-members/` |
| 파일 | `{자원}.{역할}.ts` | `payslips.service.ts` |
| DTO | 파일 `create-payslip.dto.ts` · 클래스 `CreatePayslipDto` | 응답은 `payslip.response.dto.ts` · `PayslipResponseDto` |

## 목록 응답

| 항목 | 규칙 |
|---|---|
| 목록 응답 | `{ items, total }` |
| total 구하기 | `findMany` + `count` — 같은 `where`, `$transaction` 으로 묶는다 |
| 페이지 파라미터 | `page`(1부터), `pageSize`(기본 20, 최대 200) |
| 정렬 | 기본 정렬 + 마지막에 `id` |
| 빈 결과 · 마지막 페이지를 넘긴 요청 | `{ items: [], total }` |
| 오류 응답 | Nest 기본 `{ statusCode, message, error }` 를 그대로 둔다 |

오류를 Nest 기본 형식으로 두는 것은 front 가 이미 그 형식을 읽기 때문이다 — `src/lib/api.ts` 의 `errorMessage` 가 `message` 를 꺼내고 검증 실패일 때의 배열까지 다룬다.

기존 items 예제(`take`·`skip`, 배열 응답, `id` 순)는 front 가 지금 형식으로 부르고 있어 바꾸지 않는다. `/items` 와 `listItems` 는 그대로 두고, **새로 만드는 목록 API 부터** 적용한다.

# DB (PostgreSQL + Prisma)

| 대상 | 규칙 | 예 |
|---|---|---|
| 테이블 | snake_case 복수형 | `contracts`, `attendance_records`, `location_access_logs` |
| Prisma 모델 | PascalCase 단수형 + `@@map` | `model Contract { … @@map("contracts") }` |
| 컬럼 | snake_case, Prisma 필드는 camelCase + `@map` | `start_date` ↔ `startDate` |
| 기본키 · 외래키 | `{참조 단수}_id` · `{참조 단수}_id` (기본키도 같은 이름) | `contracts.contract_id`, `staff_members.staff_member_id`, 외래키 `store_id` |
| 시각 | `_at`, `timestamptz` | `signed_at`, `reviewed_at`, `created_at` |
| 날짜만 | `_date` | `start_date`, `birth_date` |
| 참·거짓 | `is_` · `has_` | `is_proxy_entry`, `is_premium_applied` |
| 삭제 표시 | `is_deleted boolean NOT NULL DEFAULT false`. 행을 DELETE 하지 않는다. 삭제가 가능한 테이블에만 둔다 | `contracts.is_deleted` |
| 금액 | `_amount`, 원 단위 정수 | `base_pay_amount` |
| 길이 · 단위 | 단위를 이름 끝에 | `break_minutes`, `radius_m` |
| 상태 값 | Prisma enum, 값은 UPPER_SNAKE | `ContractStatus.PENDING_SIGNATURE` |
| 이력 | 변경 전후는 `_histories`, 사건 기록은 `_logs` | `contract_status_histories`, `payslip_logs` |
| 인덱스 · 키 | `{table}_{cols}_{idx·key·fkey}` | `stock_movements_item_id_idx` |
| CHECK 제약 | `{table}_{col}_{조건}`, 조건을 이름에 쓴다 | `items_sku_not_blank`, `payslip_items_amount_nonzero` |

**삭제 표시 · 기본키 이름** (2026-10-02 재영, api 세션에서 정함)

- 삭제 가능한 데이터는 행을 지우지 않고 `is_deleted = true` 로 표시한다. 표시는 `is_deleted` 하나뿐이다 — `deleted_at` 을 함께 두면 플래그와 시각이 어긋난 행이 생길 수 있다. 삭제 시각이 필요해지면 그때 `deleted_at` 을 더하고 CHECK 로 묶는다.
- 남아야 하는 기록(`stock_movements`, `*_logs`, `*_histories`)에는 두지 않는다. 이 컬럼이 없는 테이블은 지우지 않는 테이블이다.
- 모든 조회에 `is_deleted = false` 를 건다. 빠뜨려도 오류가 나지 않고 지운 행이 그대로 보인다 — 목록, id 조회, total 을 위한 count, insert 전 존재 확인 모두 해당한다.
- 유니크 제약은 부분 인덱스(`WHERE NOT is_deleted`)로 만든다. 안 그러면 지운 행이 sku·email 을 붙잡아 같은 값으로 다시 만들 때 409 가 난다. Prisma 가 표현하지 못해 CHECK 제약처럼 마이그레이션 SQL 에만 남는다.
- 새 테이블부터 기본키도 `{참조 단수}_id` 로 짓는다. 지금 있는 `items`·`stock_movements`(예제)와 `staff`·`customers`(템플릿 인증 주체)는 기본키가 `id` 인데, 결함이 아니라 예제·템플릿이라 고치지 않는다. front 의 `listItems` 와 로그인이 아직 쓰고 있어, 계정 테이블과 첫 도메인 모듈이 생길 때 함께 정리하거나 대체한다.

ERD 에 단수·복수가 섞인 이름은 다음 ERD 재생성 때 복수형으로 맞춘다. 이 저장소 `docs/erd/_build.py` 에 남은 것은 `attendance`, `schedule_history`, `access_log` 셋이고, `access_log` 는 `location_access_logs`(확인자료)로 바꾼다. 이름만 고쳐도 박스 폭과 연결점 좌표를 다시 맞춰야 해서, 테이블 구조가 바뀌어 어차피 다시 그릴 때 함께 처리한다. (2026-09-30 기획 세션 확인)

# 영문 식별자 (용어집 대응표)

새 테이블·API·타입은 이 이름을 쓴다.

DB 테이블은 복수형, 모델·타입은 PascalCase 단수형으로 바꿔 쓴다.

## 사람 · 조직

| 표준 표기 | 영문 식별자 | 비고 |
|---|---|---|
| 플랫폼 마스터 / 플랫폼 관리자 | `PM` / `PA` | 공통코드 `ROLE_TYPE` 의 상세코드. DB 저장값이자 화면 표시값이고, `role_groups.role_code` 의 2글자 접두로도 쓴다(`PM000001`). `role_code` CHECK 제약이 `^[A-Z]{2}[0-9]{6}$` 라 2글자가 아니면 저장되지 않는다 |
| BP 마스터 / BP 관리자 | `BM` / `BA` | 같은 공통코드. `BM000001` · `BA000001` |
| 가맹마스터 / 가맹관리자 | `FM` / `FA` | 같은 공통코드. `FM000001` · `FA000001` |
| BP | `bp` | 1팀 테이블, 3팀은 참조만 |
| 본사 | `hq` | |
| 점포 · 근무지 | `store` | 근무지는 직원 레코드의 `store_id` |
| 직영 / 가맹 | `DIRECT` / `FRANCHISE` | `store_type` |
| 계정 | `account` | 로그인 주체. api 의 기존 `staff` 테이블(템플릿의 인증 주체)과 직원 레코드 `staff_members` 는 다른 것이다. 계정 테이블을 만들 때 `staff` 를 정리한다 |
| 직원 레코드 | `staff_member` | 계정 1 : 레코드 N |
| 정직원 / 파트타이머 | `FULL_TIME` / `PART_TIME` | `employment_type` |
| 업무 범위 · 범위 선택기 | `scope` · `ScopeSelector` | |

## 채용 · 계약

| 표준 표기 | 영문 식별자 | 비고 |
|---|---|---|
| 근로계약(서) | `contract` | 초안은 상태 `PENDING_SEND` 인 계약 |
| 근로계약 상태 6종 | `PENDING_SEND` · `PENDING_SIGNATURE` · `SIGNED` · `REJECTED` · `EXPIRED` · `ENDED` | 발송 대기 · 서명 대기 · 체결 완료 · 거부 · 만료 · 종료 |
| 전자계약 / 종이 계약 | `ELECTRONIC` / `PAPER` | `contract_method` |
| 날인 · 필기 서명 · 날인 기한 | `sign` · `handwritten_signature` · `sign_deadline_at` | |
| 재발송 | `resend` | |
| 초대 · 초대 토큰 | `invitation` · `invitation_token` | |
| 초대 유형 4종 | `SIGNUP` · `REINVITE` · `AFFILIATION_CONFIRM` · `RETURN_CONFIRM` | 가입 초대 · 재초대 · 소속 추가 확인 · 복귀 확인 |
| 가입 불가(만 19세 미만) | `REJECTED_UNDER_AGE` | 초대 상태 값 |
| 연결 보류 · 가입 연결 확인 | `link_hold` · `approve_link` | |
| 본인인증 | `identity_verification` | |
| 신고 정보 | `tax_profile` | |
| 주민등록번호 · 급여 계좌 | `rrn` · `payroll_account` | |
| 주휴일 | `weekly_holiday` | 요일 값 |

## 근무 · 출퇴근

| 표준 표기 | 영문 식별자 | 비고 |
|---|---|---|
| 근무스케줄 | `work_schedule` | |
| 출퇴근 기록 · 출퇴근 현황 | `attendance_record` · `attendance` | 현황은 화면·경로 이름 |
| 출근 / 퇴근 | `CHECK_IN` / `CHECK_OUT` | |
| 보정 | `correction` | |
| 대신 등록 | `proxy_entry` | `entry_method = PROXY` |
| 확인 필요 · 사유 | `needs_review` · `review_reason` | |
| 사유 3종 | `ACCURACY_EXCEEDED` · `OUT_OF_RADIUS_CHECKOUT` · `MOCK_LOCATION` | 위치 오차 초과 · 반경 밖 퇴근 · 위치 조작 감지 |
| 이상 없음 | `mark_reviewed` | 검토만 마치고 값은 그대로 |
| 근무지 반경 | `radius_m` | |
| 위치정보 동의 · 일시 중지 | `location_consent` · `paused_at` | |
| 확인자료 | `location_access_log` | |
| 본사 제공 동의 | `hq_sharing_consent` | |
| 약관·동의 문구 버전 | `terms_version` · `consent_version` | |
| TO-DO | `todo` | |
| 배정 대상 · 수행 방식 | `assignee` · `execution_mode` (`EACH` / `ANY_ONE`) | 각자 수행 / 한 명 수행 |
| 수행 예정 일시 · 긴급 | `due_date` · `due_time` · `is_urgent` | |
| TO-DO 상태 | `PENDING` · `IN_PROGRESS` · `DONE` | 대기 · 진행 중 · 완료 |

## 급여

| 표준 표기 | 영문 식별자 | 비고 |
|---|---|---|
| 급여명세서 | `payslip` | |
| 상태 4종 | `DRAFTING` · `REVIEWING` · `CONFIRMED` · `SENT` | 작성 중 · 검토 중 · 확정 · 발송 완료 |
| 확정 취소 · 처리 이력 | `cancel_confirmation` · `payslip_log` | |
| 검토 대기 사유 4종 | `MISSING_ATTENDANCE` · `AFTER_CONTRACT_END` · `CONTRACT_CHANGED` · `DEDUCTION_MISSING` | |
| 지급 항목 / 공제 항목 | `earning` / `deduction` | 줄 하나는 `payslip_item` |
| 기본 공제 / 추가 공제 | `BASIC` / `ADDITIONAL` | |
| 비과세 | `is_tax_free` | |
| 3.3% 원천징수 | `business_income_withholding` | 적용 여부는 `is_withholding_applied` |
| 연장·야간·휴일 가산 적용 여부 | `is_premium_applied` | |
| 주휴수당 · 연장수당 | `weekly_holiday_pay` · `overtime_pay` | 항목 코드 |
| 일괄 저장 | `bulk_export` | |

## 고객지원 · 알림

| 표준 표기 | 영문 식별자 | 비고 |
|---|---|---|
| 공지사항 · FAQ · 문의사항 · 도입문의 | `notice` · `faq` · `inquiry` · `lead` | |
| 노출 대상 | `audience` | |
| 게시 상태 | `PUBLISHED` · `DRAFT` · `PRIVATE` | 게시 · 임시저장 · 비공개 |
| 문의 답변 상태 | `RECEIVED` · `IN_PROGRESS` · `ANSWERED` | 접수 · 처리중 · 답변완료 |
| 운영 알림 · 앱 푸시 | `notification` · `push` | |
