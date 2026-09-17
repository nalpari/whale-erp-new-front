# WHALE ERP 1차 논리 ERD

3팀 1차 범위의 데이터를 엔티티와 관계로 정리한 **논리 모델**이다. 물리 설계(인덱스, 제약, 타입 세부)는 whale-erp-api 에서 정한다.

## 보는 법

- `index.html` 에서 개요를 보고, 위쪽 탭으로 영역별 상세로 넘어간다.
- 박스 제목 옆 태그: `CORE ENTITY` 는 그 장의 중심, `HISTORY` 는 지우지 않는 이력, `TEAM-1 REF` 는 1팀 소유라 참조만 한다.
- `#` 은 식별자, `→` 는 다른 엔티티 참조다. 선 끝의 `1`·`N`·`0..1` 은 관계 수다.
- 속성 이름은 업무 용어집(whale-erp-v2/CLAUDE.md) 표기를 따른다. 제안 컬럼명은 아래 카탈로그에만 있다.

## 다시 만들기

```bash
python3 docs/erd/_build.py
```

모델은 `_build.py` 안에 있다. HTML 과 이 README 는 그 결과물이라 직접 고치지 않는다. 스크립트가 박스 겹침, 선이 다른 박스를 지나는지, 표시 겹침, 4px 격자를 검사하고 어긋나면 실패한다.

## 근거

- Manyfast 기능·명세의 dataSpec 슬롯 (2026-09-15 11:16 읽음, 요구사항 6 · 기능 16 · 명세 26)
- front `docs/mockup` 확정 쟁점: STAFF-1~16, HOME-2·4·5, SUPPORT-1~4, NOTIFY-1·2
- staff `docs/mockup` 확정 쟁점: ATT-1~7, LOGIN-2·3, TAX-4·5, 알림 수신 설정

## api 저장소와의 대응

| 논리 엔티티 | api 현재 테이블 | 차이 |
|---|---|---|
| 계정 | `staff` | 이름이 겹친다. api 의 `staff` 는 직원 근무 앱 로그인 주체라 논리 모델의 **계정**에 해당한다. 논리 모델의 **직원 레코드**는 점포별 소속이라 별도 테이블(`staff_members` 등)이 필요하다. |
| 관리자 계정 | `customers` | 1팀 소유. 역할·BP 연결은 1팀 설계를 따른다. |
| 접속 상태 | 없음 (`refresh_token_hash` 한 칸) | 한 계정이 여러 기기에서 30일 유지하려면 접속 상태 테이블이 필요하다. api CLAUDE.md 도 같은 한계를 적어 두었다. |

## 1팀과 맞닿는 곳

- **점포·BP·관리자 계정**은 1팀 소유다. 3팀 엔티티는 식별자로 참조만 한다.
- **근무지 좌표·반경**은 출퇴근 GPS 판정에 필요한 3팀 요구다. 1팀 점포 테이블에 넣을지, 3팀 확장 테이블로 둘지 정해야 한다.
- **관리자 계정(`customers`)과 계정(`staff`)은 테이블을 나눈다.** 관리자이면서 직원인 사람은 없다. 관리자 계정은 BP 마스터가 사업자 회원가입으로 직접 만들고 그 아래 BP 관리자·가맹마스터·가맹관리자 계정은 만들어 준다. 계정은 초대받은 직원이 본인인증과 개인정보를 넣어 직접 가입한다. 두 테이블에 겹치는 속성은 이메일·비밀번호·잠금 정도라서 잠금과 핀 재설정 같은 로직은 테이블이 아니라 api 공통 모듈로 나눠 쓴다. (2026-09-15 재영 확인)
- **관리자 역할과 권한 범위**는 1팀 권한 관리에서 정한다. 3팀 화면의 업무 범위는 그 결과를 따른다.

## 아직 정하지 않은 것

- 근무시간 외 알림 보류의 기준 시각 (NOTI-1)과 알림톡 대체 발송 범위
- 배치·알림·알림톡/SMS·메일 발송의 대행사, 템플릿 검수, 발송 이력·재시도 저장 위치 (3팀 담당, 2026-09-17 배정)
- 신고 정보를 내 정보에서 조회·수정하는 방법
- 공유 TO-DO 수행자 이름 공개 (WORK-3), 연결 보류 안내 범위 (JOIN-3), 이메일을 못 받는 직원 (LOGIN-8)
- 위치정보 동의·주민등록번호 처리의 법무 검토, 주휴·연장 계산식과 보존·파기 기준의 노무 검토

## 계정과 접속

직원 근무 앱에 로그인하는 사람 단위의 데이터다. 이메일 아이디로 로그인하고 본인인증 휴대전화번호는 초대 연결의 매칭 키로만 쓴다. 비밀번호는 이메일 핀으로 재설정한다.

### 본인인증 이력 `identity_verifications` · 이력

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 본인인증 ID | id | `verification_id` |  |
| FK | 계정 | id | `account_id` |  |
|  | 인증 목적 | enum | `purpose` | 가입·휴대전화번호 변경 |
|  | 인증 휴대전화번호 | text | `phone` |  |
|  | 인증 결과 | enum | `result` |  |
|  | 인증 일시 | datetime | `verified_at` |  |

### 접속 상태 `auth_sessions` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 접속 ID | id | `session_id` |  |
| FK | 계정 | id | `account_id` |  |
|  | 기기 식별 정보 | text | `device_info` | 한 계정 여러 기기 |
|  | 발급 시각 | datetime | `issued_at` |  |
|  | 만료 시각 | datetime | `expires_at` | 마지막 접속 후 30일 |
|  | 종료 시각 | datetime | `revoked_at` | 재설정 시 모두 종료 |

### 계정 `accounts` · 중심

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 계정 ID | id | `account_id` |  |
|  | 이메일 아이디 | text | `email` | 로그인 아이디, 고유 |
|  | 비밀번호 해시 | hash | `password_hash` |  |
|  | 실명 | text | `real_name` | 본인인증 값, 수정 불가 |
|  | 생년월일 | date | `birth_date` | 본인인증 값, 수정 불가 |
|  | 휴대전화번호 | text | `phone` | 본인인증, 변경 시 재인증 |
|  | 동일인 식별값 | text | `ci` |  |
|  | 주소 | text | `address` | 다음 계약부터 반영 |
|  | 계정 상태 | enum | `status` | 가입 완료·연결 보류 |
|  | 로그인 실패 횟수 | int | `failed_login_count` | 5회 잠금 |
|  | 잠금 해제 시각 | datetime | `locked_until` | 재설정하면 해제 |

### 계정 변경 이력 `account_change_histories` · 이력

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 변경 이력 ID | id | `change_id` |  |
| FK | 계정 | id | `account_id` |  |
|  | 변경 항목 | enum | `field` | 휴대전화번호·이메일·주소·비밀번호 |
|  | 변경 전 값 | text | `before_value` | 비밀번호는 저장 안 함 |
|  | 변경 후 값 | text | `after_value` | 비밀번호는 저장 안 함 |
|  | 변경 경로 | enum | `channel` | 본인·핀 재설정·관리자 초기화 |
| FK | 요청 관리자 | id | `requested_by` | 관리자 초기화일 때 |
|  | 변경 일시 | datetime | `changed_at` |  |

### 로그인 이력 `login_histories` · 이력

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 로그인 이력 ID | id | `login_id` |  |
| FK | 계정 | id | `account_id` | 없는 이메일이면 비움 |
|  | 시도 이메일 | text | `email` |  |
|  | 성공 여부 | bool | `succeeded` |  |
|  | 실패 사유 | enum | `failure_reason` | 안내 문구는 구분 안 함 |
|  | 시도 시각 | datetime | `attempted_at` |  |

### 비밀번호 재설정 핀 `password_reset_pins` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 핀 ID | id | `pin_id` |  |
| FK | 계정 | id | `account_id` |  |
|  | 핀 검증값 | hash | `pin_hash` | 원본 저장 안 함 |
|  | 발급 시각 | datetime | `issued_at` | 1분 재발급 제한, 하루 10회 |
|  | 만료 시각 | datetime | `expires_at` | 10분 |
|  | 시도 횟수 | int | `attempt_count` | 5회 |
|  | 쿨다운 단계 | int | `cooldown_step` | 1·3·5분, 3회까지 |
|  | 쿨다운 해제 시각 | datetime | `cooldown_until` |  |
|  | 사용 시각 | datetime | `used_at` |  |

### 관리자 계정 `customers` · 1팀 참조

1팀 영역(환경설정·권한). api 저장소에서는 customers 테이블.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 관리자 ID | id | `admin_id` | api customers 테이블 |
| FK | BP | id | `bp_id` |  |
|  | 역할 | enum | `role` | BP 마스터·BP 관리자·가맹마스터·가맹관리자·플랫폼 |

**관계**

- 계정 `1` — `N` 본인인증 이력
- 계정 `1` — `N` 접속 상태
- 계정 `1` — `N` 로그인 이력
- 계정 `1` — `N` 비밀번호 재설정 핀
- 계정 `1` — `N` 계정 변경 이력
- 관리자 계정 `1` — `N` 계정 변경 이력 · 초기화 요청

## 채용과 초대

근로계약서 초안을 저장하면 미가입 직원 레코드가 생기고 시스템이 초대 유형을 정해 보낸다. 토큰과 본인인증 번호가 모두 맞아야 계정이 연결된다. 어긋나면 연결 보류로 넘어간다.

### 점포 `stores` · 1팀 참조

1팀 영역. 3팀은 참조만 한다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 점포 ID | id | `store_id` | 1팀 점포 정보 관리 |
| FK | BP | id | `bp_id` | 1팀 BP |
|  | 점포 유형 | enum | `store_type` | 직영·가맹 |
|  | 좌표 | geo | `location` |  |
|  | 근무지 반경 | int | `geofence_radius_m` | 기본 100m, 3팀 요청 항목 |

### 계정 `accounts` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 계정 ID | id | `account_id` |  |
|  | 이메일 아이디 | text | `email` |  |
|  | 본인인증 휴대전화번호 | text | `phone` |  |
|  | 동일인 식별값 | text | `ci` |  |

### 직원 레코드 `staff_members` · 중심

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 직원 레코드 ID | id | `staff_member_id` |  |
| FK | 점포 | id | `store_id` |  |
| FK | 계정 | id | `account_id` | 가입 전에는 비어 있음 |
| FK | 후보 계정 | id | `candidate_account_id` | 내부 전용, 화면에 안 보임 |
|  | 이름 | text | `name` | 초안 입력값 |
|  | 휴대전화번호 | text | `phone` | 초대 기준값 |
|  | 고용 형태 | enum | `employment_type` | 정직원·파트타이머, 계약으로만 바뀜 |
|  | 입사일 | date | `hired_on` |  |
|  | 재직 상태 | enum | `employment_status` | 재직·퇴직 |
|  | 가입 상태 | enum | `join_status` | 초안·초대 발송·가입 완료 |
|  | 퇴직일 | date | `retired_on` |  |

### 신고 정보 `staff_tax_profiles` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK·FK | 직원 레코드 | id | `staff_member_id` | 1:1 |
|  | 주민등록번호 | enc | `rrn_encrypted` | 암호화, 관리자 웹은 마스킹 |
|  | 은행 | enum | `bank_code` |  |
|  | 급여 계좌 | enc | `account_no_encrypted` | 예금주 본인 |
|  | 수집 목적 | text | `purpose` | 취득 신고·원천징수·급여 이체 |
|  | 수집 일시 | datetime | `collected_at` |  |
|  | 최종 수정 일시 | datetime | `updated_at` | 계좌 변경은 다음 급여부터 |

### 초대 `invitations` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 초대 ID | id | `invitation_id` |  |
| FK | 직원 레코드 | id | `staff_member_id` | 재초대로 여러 건 |
|  | 초대 유형 | enum | `type` | 가입 초대·재초대·소속 추가 확인·복귀 확인 |
|  | 초대 토큰 | text | `token` | 가입 초대·재초대만 |
|  | 수신 채널 | enum | `channel` |  |
|  | 발송 일시 | datetime | `sent_at` |  |
|  | 만료 일시 | datetime | `expires_at` | 30일 |
|  | 상태 | enum | `status` | 발송·수락·만료·거절 |
|  | 응답 일시 | datetime | `responded_at` |  |
|  | 거절 사유 | text | `reject_reason` | 소속 확인 거절 |

### 가입 연결 보류 `link_holds` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 보류 ID | id | `hold_id` |  |
| FK | 초대 | id | `invitation_id` |  |
| FK | 보류 계정 | id | `account_id` |  |
|  | 불일치 사유 | enum | `mismatch_reason` | 번호 불일치·이름 불일치 |
|  | 처리 결과 | enum | `resolution` | 승인·번호 수정 후 재초대 |
| FK | 처리 관리자 | id | `resolved_by` |  |
|  | 처리 일시 | datetime | `resolved_at` |  |

### 관리자 계정 `customers` · 1팀 참조

1팀 영역(환경설정·권한). api 저장소에서는 customers 테이블.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 관리자 ID | id | `admin_id` | api customers 테이블 |
| FK | BP | id | `bp_id` |  |
|  | 역할 | enum | `role` | BP 마스터·BP 관리자·가맹마스터·가맹관리자·플랫폼 |

**관계**

- 점포 `1` — `N` 직원 레코드 · 소속
- 계정 `0..1` — `N` 직원 레코드 · 연결
- 직원 레코드 `1` — `N` 초대 · 초대
- 직원 레코드 `1` — `0..1` 신고 정보
- 초대 `1` — `0..1` 가입 연결 보류
- 계정 `1` — `N` 가입 연결 보류 · 보류 계정
- 관리자 계정 `1` — `N` 가입 연결 보류 · 처리

## 근로계약

계약은 직원 레코드에 붙는다. 체결되면 고치지 않고 새 계약으로 대체한다. 계약서 데이터는 관리자 입력분·본인인증분·직원 입력분을 나눠 저장하고 발송 원본과 날인 완료본을 모두 보존한다.

### 직원 레코드 `staff_members` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 직원 레코드 ID | id | `staff_member_id` |  |
| FK | 점포 | id | `store_id` |  |
|  | 재직 상태 | enum | `employment_status` |  |

### 점포 `stores` · 1팀 참조

1팀 영역. 3팀은 참조만 한다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 점포 ID | id | `store_id` | 1팀 점포 정보 관리 |
| FK | BP | id | `bp_id` | 1팀 BP |
|  | 점포 유형 | enum | `store_type` | 직영·가맹 |

### 관리자 계정 `customers` · 1팀 참조

1팀 영역(환경설정·권한). api 저장소에서는 customers 테이블.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 관리자 ID | id | `admin_id` | api customers 테이블 |
| FK | BP | id | `bp_id` |  |
|  | 역할 | enum | `role` | BP 마스터·BP 관리자·가맹마스터·가맹관리자·플랫폼 |

### 근로계약 `contracts` · 중심

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 근로계약 ID | id | `contract_id` |  |
| FK | 직원 레코드 | id | `staff_member_id` |  |
| FK | 근무지 | id | `store_id` |  |
| FK | 직전 계약 | id | `previous_contract_id` | 재계약일 때 |
|  | 계약 유형 | enum | `contract_type` | 정직원·파트타이머 |
|  | 계약 기간 | date | `start_on·end_on` | 종료일 비우면 무기한 |
|  | 근무 조건 | json | `work_terms` | 근무일·시작·종료·휴게 |
|  | 급여 조건 | json | `wage_terms` | 시급·월급·지급일 |
|  | 연장·야간 가산 적용 여부 | bool | `overtime_premium` | 5인 미만 미적용 가능 |
|  | 계약 상태 | enum | `status` | 발송 대기·서명 대기·체결 완료·거부·만료·종료 |
|  | 초안 처리 유형 | enum | `draft_action` | 가입 초대·소속 추가 확인·복귀 확인·즉시 발송 |
|  | 발송 일시 | datetime | `sent_at` |  |
|  | 날인 기한 | datetime | `sign_due_at` | 발송일부터 30일 |
|  | 재발송 횟수 | int | `resend_count` |  |
|  | 거부 사유 | text | `reject_reason` |  |
| FK | 작성 관리자 | id | `created_by` |  |

### 계약 당사자 정보 `contract_parties` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK·FK | 근로계약 | id | `contract_id` | 1:1 |
|  | 관리자 입력 이름·번호 | text | `admin_name·admin_phone` |  |
|  | 본인인증 실명·생년월일 | text | `verified_name·birth_date` | 실명이 다르면 실명 반영 |
|  | 본인인증 휴대전화번호 | text | `verified_phone` |  |
|  | 직원 입력 주소 | text | `address` |  |
|  | 반영 일시 | datetime | `filled_at` | 가입 완료 시 채움 |

### 계약서 파일 `contract_documents` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 파일 ID | id | `document_id` |  |
| FK | 근로계약 | id | `contract_id` |  |
|  | 파일 구분 | enum | `kind` | 발송 원본·날인 완료본 |
|  | 저장 위치 | text | `storage_key` |  |
|  | 파일 해시 | hash | `checksum` |  |
|  | 생성 일시 | datetime | `created_at` |  |

### 계약 상태 이력 `contract_status_histories` · 이력

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 상태 이력 ID | id | `history_id` |  |
| FK | 근로계약 | id | `contract_id` |  |
|  | 변경 전 상태 | enum | `from_status` |  |
|  | 변경 후 상태 | enum | `to_status` |  |
|  | 처리 주체 | enum | `actor` | 관리자·직원·시스템 |
|  | 변경 일시 | datetime | `changed_at` |  |

**관계**

- 직원 레코드 `1` — `N` 근로계약
- 점포 `1` — `N` 근로계약 · 근무지
- 관리자 계정 `1` — `N` 근로계약 · 작성
- 근로계약 `1` — `1` 계약 당사자 정보
- 근로계약 `1` — `N` 계약서 파일
- 근로계약 `1` — `N` 계약 상태 이력

## 근무스케줄과 출퇴근

근무스케줄은 관리자가 등록하고 확정한다. 출퇴근은 직원이 직원 근무 앱에서 GPS 판정으로 등록한다. 좌표는 저장하지 않고 판정 결과와 오차만 남기며, 보정은 원본과 분리해 이력으로 쌓는다.

### 근무스케줄 `work_schedules` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 근무스케줄 ID | id | `schedule_id` |  |
| FK | 직원 레코드 | id | `staff_member_id` |  |
| FK | 근무지 | id | `store_id` |  |
|  | 근무 시작 일시 | datetime | `start_at` |  |
|  | 근무 종료 일시 | datetime | `end_at` | 같은 직원 겹침 차단 |
|  | 휴게시간 | int | `break_minutes` |  |
|  | 근무 유형 | enum | `work_type` | 오픈·미들·마감 |
|  | 확정 상태 | enum | `confirm_status` | 확정 전·확정 |
| FK | 기본값 근로계약 | id | `source_contract_id` | 등록 때 한 번 반영 |
| FK | 등록 관리자 | id | `created_by` |  |

### 근무스케줄 변경 이력 `work_schedule_histories` · 이력

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 변경 이력 ID | id | `history_id` |  |
| FK | 근무스케줄 | id | `schedule_id` |  |
|  | 변경 유형 | enum | `change_type` | 등록·수정·삭제 |
|  | 변경 전 값 | json | `before_value` |  |
|  | 변경 후 값 | json | `after_value` |  |
|  | 변경 주체 | id | `changed_by` |  |
|  | 변경 일시 | datetime | `changed_at` |  |

### 직원 레코드 `staff_members` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 직원 레코드 ID | id | `staff_member_id` |  |
| FK | 계정 | id | `account_id` |  |
| FK | 점포 | id | `store_id` |  |
|  | 재직 상태 | enum | `employment_status` |  |

### 계정 `accounts` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 계정 ID | id | `account_id` |  |
|  | 이메일 아이디 | text | `email` |  |

### 위치정보 동의 `location_consents` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 동의 ID | id | `consent_id` |  |
| FK | 계정 | id | `account_id` |  |
|  | 동의 문구 버전 | text | `terms_version` |  |
|  | 동의 일시 | datetime | `agreed_at` | 첫 출퇴근 등록 때 |
|  | 철회 일시 | datetime | `withdrawn_at` |  |

### 출퇴근 기록 `attendance_records` · 중심

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 출퇴근 기록 ID | id | `attendance_id` |  |
| FK | 직원 레코드 | id | `staff_member_id` |  |
| FK | 근무지 | id | `store_id` | 여럿이면 가장 가까운 곳 |
|  | 구분 | enum | `kind` | 출근·퇴근 |
|  | 기록 시각 | datetime | `recorded_at` | 기기 시각 |
|  | 서버 수신 시각 | datetime | `received_at` | 확정 기준 |
|  | 위치 판정 결과 | enum | `location_result` | 반경 안·확인 필요 |
|  | 판정 오차 | int | `accuracy_m` | 좌표는 저장 안 함 |
|  | 계약 미체결 경고 | bool | `unsigned_warning` | 경고 후 허용 |
| FK | 짝 출근 기록 | id | `clock_in_id` | 퇴근일 때 |

### 출퇴근 보정 이력 `attendance_corrections` · 이력

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 보정 이력 ID | id | `correction_id` |  |
| FK | 출퇴근 기록 | id | `attendance_id` |  |
|  | 수정 전 값 | json | `before_value` |  |
|  | 수정 후 값 | json | `after_value` |  |
|  | 수정 사유 | text | `reason` | 필수 |
| FK | 수정 관리자 | id | `corrected_by` | 최근 3개월만 |
|  | 수정 일시 | datetime | `corrected_at` |  |

### 점포 `stores` · 1팀 참조

1팀 영역. 3팀은 참조만 한다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 점포 ID | id | `store_id` | 1팀 점포 정보 관리 |
| FK | BP | id | `bp_id` | 1팀 BP |
|  | 점포 유형 | enum | `store_type` | 직영·가맹 |
|  | 좌표 | geo | `location` |  |
|  | 근무지 반경 | int | `geofence_radius_m` | 기본 100m |

**관계**

- 직원 레코드 `1` — `N` 근무스케줄
- 근무스케줄 `1` — `N` 근무스케줄 변경 이력
- 직원 레코드 `1` — `N` 출퇴근 기록
- 점포 `1` — `N` 출퇴근 기록 · 반경 판정
- 출퇴근 기록 `1` — `N` 출퇴근 보정 이력
- 직원 레코드 `N` — `0..1` 계정
- 계정 `1` — `N` 위치정보 동의

## TO-DO

TO-DO는 특별업무 지시 전용이다. 개인 또는 근무지 전체에 배정하고 전체는 각자 수행과 한 명 수행 중 하나를 고른다. 각자 수행으로 만든 여러 건은 배정 그룹으로 묶여 한 건처럼 고치고 지운다.

### 점포 `stores` · 1팀 참조

1팀 영역. 3팀은 참조만 한다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 점포 ID | id | `store_id` | 1팀 점포 정보 관리 |
| FK | BP | id | `bp_id` | 1팀 BP |
|  | 점포 유형 | enum | `store_type` | 직영·가맹 |

### 관리자 계정 `customers` · 1팀 참조

1팀 영역(환경설정·권한). api 저장소에서는 customers 테이블.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 관리자 ID | id | `admin_id` | api customers 테이블 |
| FK | BP | id | `bp_id` |  |
|  | 역할 | enum | `role` | BP 마스터·BP 관리자·가맹마스터·가맹관리자·플랫폼 |

### TO-DO `todos` · 중심

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | TO-DO ID | id | `todo_id` |  |
| FK | 근무지 | id | `store_id` |  |
|  | 배정 그룹 ID | id | `assign_group_id` | 전체·각자 수행 묶음 |
|  | 제목 | text | `title` |  |
|  | 내용 | text | `body` |  |
|  | 배정 방식 | enum | `assign_mode` | 개인·전체, 등록 후 변경 불가 |
|  | 수행 방식 | enum | `perform_mode` | 각자·공유, 등록 후 변경 불가 |
|  | 수행 예정 날짜 | date | `due_on` | 필수, 과거 날짜 불가 |
|  | 수행 시간 | time | `due_time` | 선택 |
|  | 긴급 여부 | bool | `urgent` | 근무시간 외 즉시 푸시 |
|  | 수행 상태 | enum | `status` | 대기·진행 중·완료 |
| FK | 수행자 | id | `performed_by` | 공유 TO-DO |
|  | 완료 일시 | datetime | `completed_at` |  |
| FK | 등록 관리자 | id | `created_by` |  |
|  | 등록일 | datetime | `created_at` |  |

### TO-DO 배정 대상 `todo_assignees` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK·FK | TO-DO | id | `todo_id` |  |
| PK·FK | 직원 레코드 | id | `staff_member_id` | 퇴직자 배정 불가 |
|  | 완료 여부 | bool | `completed` |  |
|  | 완료 시각 | datetime | `completed_at` |  |

### 직원 레코드 `staff_members` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 직원 레코드 ID | id | `staff_member_id` |  |
| FK | 점포 | id | `store_id` |  |
|  | 재직 상태 | enum | `employment_status` |  |

### TO-DO 상태 이력 `todo_status_histories` · 이력

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 상태 이력 ID | id | `history_id` |  |
| FK | TO-DO | id | `todo_id` |  |
|  | 변경 전 상태 | enum | `from_status` |  |
|  | 변경 후 상태 | enum | `to_status` |  |
|  | 긴급 표시 변경 | bool | `urgent_changed` | 긴급 표시 이력 |
|  | 변경 주체 | id | `changed_by` |  |
|  | 변경 일시 | datetime | `changed_at` |  |

**관계**

- 점포 `1` — `N` TO-DO · 근무지
- 관리자 계정 `1` — `N` TO-DO · 등록
- TO-DO `1` — `N` TO-DO 배정 대상
- 직원 레코드 `1` — `N` TO-DO 배정 대상
- TO-DO `1` — `N` TO-DO 상태 이력

## 급여명세서

근로계약과 출퇴근 기록을 참조해 초안을 만든다. 지급 항목은 시스템 계산값과 관리자 수정값을 나눠 두고 공제 항목은 미입력과 0을 구분한다. 검토 대기 사유가 붙은 명세서도 확인하면 확정할 수 있다.

### 직원 레코드 `staff_members` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 직원 레코드 ID | id | `staff_member_id` |  |
| FK | 점포 | id | `store_id` |  |
|  | 재직 상태 | enum | `employment_status` |  |

### 근로계약 `contracts` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 근로계약 ID | id | `contract_id` |  |
|  | 급여 조건 | json | `wage_terms` |  |
|  | 연장·야간 가산 적용 여부 | bool | `overtime_premium` |  |

### 급여명세서 `payslips` · 중심

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 급여명세서 ID | id | `payslip_id` |  |
| FK | 직원 레코드 | id | `staff_member_id` | 같은 기간 중복 생성 차단 |
| FK | 근무지 | id | `store_id` |  |
| FK | 참조 근로계약 | id | `contract_id` | 계약 없으면 초안 없음 |
|  | 급여 기간 | date | `period_start·period_end` |  |
|  | 계약 유형 | enum | `contract_type` |  |
|  | 출퇴근 참조 기간 | date | `attendance_from·to` |  |
|  | 명세서 상태 | enum | `status` | 작성 중·검토 중·확정·발송 완료 |
|  | 지급 총액 | money | `gross_pay` |  |
|  | 공제 총액 | money | `total_deduction` |  |
|  | 실지급액 | money | `net_pay` |  |
|  | 확정 일시 | datetime | `confirmed_at` |  |
| FK | 확정 관리자 | id | `confirmed_by` |  |

### 명세서 금액 항목 `payslip_items` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 항목 ID | id | `item_id` |  |
| FK | 급여명세서 | id | `payslip_id` |  |
|  | 항목 구분 | enum | `category` | 지급·공제 |
|  | 항목 코드 | enum | `code` | 기본급·주휴·연장·고정 수당·4대보험·소득세·지방소득세 |
|  | 시스템 계산값 | money | `calculated_amount` | 지급 항목만 |
|  | 관리자 수정값 | money | `adjusted_amount` |  |
|  | 입력 여부 | bool | `entered` | 공제 미입력과 0 구분 |

### 검토 대기 사유 `payslip_review_reasons` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 사유 ID | id | `reason_id` |  |
| FK | 급여명세서 | id | `payslip_id` |  |
|  | 사유 | enum | `reason` | 출퇴근 누락·계약 만료 후 기록·기간 중 계약 변경·공제 미입력 |
|  | 상세 | text | `detail` | 누락 일수 등 |
|  | 확인 일시 | datetime | `acknowledged_at` |  |

### 명세서 발송 이력 `payslip_dispatches` · 이력

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 발송 이력 ID | id | `dispatch_id` |  |
| FK | 급여명세서 | id | `payslip_id` |  |
|  | 발송 채널 | enum | `channel` | 이메일·앱 푸시 |
|  | 발송 상태 | enum | `status` |  |
|  | 발송 시각 | datetime | `sent_at` |  |
| FK | 발송자 | id | `sent_by` |  |

### 명세서 상태 이력 `payslip_status_histories` · 이력

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 상태 이력 ID | id | `history_id` |  |
| FK | 급여명세서 | id | `payslip_id` |  |
|  | 변경 전 상태 | enum | `from_status` |  |
|  | 변경 후 상태 | enum | `to_status` | 확정 취소는 검토 중으로 |
|  | 처리 주체 | id | `changed_by` |  |
|  | 변경 일시 | datetime | `changed_at` |  |

**관계**

- 직원 레코드 `1` — `N` 급여명세서
- 근로계약 `1` — `N` 급여명세서 · 산정 근거
- 급여명세서 `1` — `N` 명세서 금액 항목
- 급여명세서 `1` — `N` 검토 대기 사유
- 급여명세서 `1` — `N` 명세서 발송 이력
- 급여명세서 `1` — `N` 명세서 상태 이력

## 운영 알림과 직원 알림

관리자 웹의 운영 알림과 직원 근무 앱의 직원 알림은 같은 알림 구조를 쓴다. 읽음은 수신자마다 따로 두고 발송은 채널별 이력으로 남긴다. TO-DO 배정 알림은 근무시간 외에 발송 예정 시각을 잡아 보류한다.

### 알림 `notifications` · 중심

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 알림 ID | id | `notification_id` |  |
|  | 알림 대상 구분 | enum | `audience` | 운영 알림·직원 알림 |
|  | 알림 유형 | enum | `type` | 운영 6종·직원 4종 |
|  | 관련 업무 유형 | enum | `related_type` | 문의사항·도입문의·근로계약 등 |
|  | 관련 업무 ID | id | `related_id` |  |
|  | 알림 내용 | text | `body` |  |
|  | 중복 방지 키 | text | `dedupe_key` | 같은 사건·수신자 1회 |
|  | 긴급 여부 | bool | `urgent` |  |
|  | 생성 시각 | datetime | `created_at` |  |

### 관리자 계정 `customers` · 1팀 참조

1팀 영역(환경설정·권한). api 저장소에서는 customers 테이블.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 관리자 ID | id | `admin_id` | api customers 테이블 |
| FK | BP | id | `bp_id` |  |
|  | 역할 | enum | `role` | BP 마스터·BP 관리자·가맹마스터·가맹관리자·플랫폼 |

### 알림 수신 `notification_recipients` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 수신 ID | id | `recipient_id` |  |
| FK | 알림 | id | `notification_id` |  |
| FK | 수신 계정 | id | `account_id` | 직원 알림 |
| FK | 수신 관리자 | id | `admin_id` | 운영 알림 |
|  | 읽음 여부 | bool | `is_read` |  |
|  | 읽음 처리 시각 | datetime | `read_at` |  |

### 계정 `accounts` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 계정 ID | id | `account_id` |  |
|  | 이메일 아이디 | text | `email` |  |

### 알림 발송 이력 `notification_deliveries` · 이력

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 발송 이력 ID | id | `delivery_id` |  |
| FK | 알림 수신 | id | `recipient_id` |  |
|  | 발송 채널 | enum | `channel` | 앱 푸시·알림톡·이메일 |
|  | 발송 예정 시각 | datetime | `scheduled_at` | 보류 시 |
|  | 발송 시각 | datetime | `sent_at` |  |
|  | 발송 결과 | enum | `result` |  |
|  | 대체 발송 여부 | bool | `is_fallback` | 푸시 실패 시 알림톡 |
|  | 묶음 발송 ID | id | `batch_id` | 보류분 아침 묶음 |

### 알림 수신 설정 `notification_preferences` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK·FK | 계정 | id | `account_id` |  |
| PK | 알림 유형 | enum | `type` |  |
|  | 수신 여부 | bool | `enabled` | 기본 켬, 계약·급여는 끌 수 없음 |
|  | 변경 시각 | datetime | `updated_at` |  |

**관계**

- 알림 `1` — `N` 알림 수신
- 관리자 계정 `0..1` — `N` 알림 수신
- 알림 수신 `1` — `N` 알림 발송 이력
- 계정 `0..1` — `N` 알림 수신
- 계정 `1` — `N` 알림 수신 설정

## 고객지원과 커뮤니티

플랫폼 관리자가 공지사항·FAQ를 쓰고 노출 대상을 정하면, 사용자는 자기가 대상인 글만 본다. 문의사항은 로그인한 관리자가, 도입문의는 비로그인 사용자가 남긴다. 둘 다 사용자 노출 답변과 운영자 내부 메모를 나눠 둔다.

### 공지사항·FAQ `posts` · 중심

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 게시물 ID | id | `post_id` |  |
|  | 콘텐츠 유형 | enum | `content_type` | 공지사항·FAQ |
|  | 제목 | text | `title` |  |
|  | 본문 | text | `body` |  |
|  | 게시 상태 | enum | `status` | 임시저장·게시·비공개 |
|  | 공지사항 유형 | enum | `notice_type` | 점검·기능·약관·안내 |
|  | 게시 기간 | date | `publish_from·to` |  |
|  | 상단 고정 여부 | bool | `pinned` | 공지사항만 |
|  | FAQ 카테고리 | enum | `faq_category` | FAQ만 |
|  | 삭제 일시 | datetime | `deleted_at` | 복구 가능, 무기한 보관 |
| FK | 최종 수정 관리자 | id | `updated_by` |  |
|  | 최종 수정 일시 | datetime | `updated_at` |  |

### 노출 대상 `post_audiences` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK·FK | 게시물 | id | `post_id` |  |
| PK | 대상 유형 | enum | `audience_type` | 비회원·회원·BP·점포·부가서비스 |
|  | 부가서비스 상품 | enum | `addon_code` | 부가서비스일 때 |

### 첨부파일 `post_attachments` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 첨부파일 ID | id | `attachment_id` |  |
| FK | 게시물 | id | `post_id` | 글당 5개 |
|  | 파일 이름 | text | `file_name` |  |
|  | 파일 크기 | int | `size_bytes` | 10MB 이하 |
|  | 저장 위치 | text | `storage_key` |  |
|  | 순서 | int | `sort_order` |  |

### 문의사항 `inquiries` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 문의사항 ID | id | `inquiry_id` |  |
| FK | 등록 관리자 | id | `created_by` | 본인 문의만 보임 |
| FK | 대상 BP·점포 | id | `scope_id` |  |
|  | 문의 유형 | enum | `category` |  |
|  | 제목 | text | `title` |  |
|  | 문의 내용 | text | `body` |  |
|  | 답변 상태 | enum | `status` | 접수·처리중·답변완료 |
|  | 운영자 내부 메모 | text | `internal_memo` | 사용자에게 안 보임 |
|  | 등록 시각 | datetime | `created_at` |  |

### 문의 답변 `inquiry_replies` · 이력

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 답변 ID | id | `reply_id` |  |
| FK | 문의사항 | id | `inquiry_id` | 답변 이력 전부 보관 |
|  | 답변 내용 | text | `body` |  |
| FK | 답변 관리자 | id | `replied_by` |  |
|  | 답변 시각 | datetime | `replied_at` |  |

### 관리자 계정 `customers` · 1팀 참조

1팀 영역(환경설정·권한). api 저장소에서는 customers 테이블.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 관리자 ID | id | `admin_id` | api customers 테이블 |
| FK | BP | id | `bp_id` |  |
|  | 역할 | enum | `role` | BP 마스터·BP 관리자·가맹마스터·가맹관리자·플랫폼 |

### 도입문의 `leads` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 도입문의 ID | id | `lead_id` |  |
|  | 문의자 이름 | text | `contact_name` |  |
|  | 업종 | enum | `industry` | 목록 선택, 기타는 직접 입력 |
|  | 전화번호 | text | `phone` | 휴대전화 아닐 수 있음 |
|  | 이메일 | text | `email` | 접수 확인 발송 |
|  | 관심 서비스 | enum | `interests` | 매장운영·재무관리·프랜차이즈·기타 |
|  | 도입 예정 시기 | enum | `plan_period` | 목록 선택 |
|  | 문의 내용 | text | `body` |  |
|  | 개인정보 동의 일시 | datetime | `privacy_agreed_at` | 필수 |
|  | 마케팅 동의 일시 | datetime | `marketing_agreed_at` | 선택 |
|  | 답변 상태 | enum | `status` |  |
|  | 사용자 노출 답변 | text | `reply` | 이메일로 회신 |
|  | 운영자 내부 메모 | text | `internal_memo` |  |
|  | 접수 일시 | datetime | `created_at` |  |
|  | 상담 완료일 | date | `consulted_on` | 1년 뒤 파기 |

**관계**

- 공지사항·FAQ `1` — `N` 노출 대상
- 공지사항·FAQ `1` — `0..5` 첨부파일
- 문의사항 `1` — `N` 문의 답변
- 관리자 계정 `1` — `N` 문의사항 · 등록
