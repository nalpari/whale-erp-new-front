# WHALE ERP 1팀 1차 논리 ERD

1팀 1차 범위의 데이터를 엔티티와 관계로 정리한 **논리 모델**이다. 물리 설계(인덱스, 제약, 타입 세부)는 whale-erp-api 에서 정한다.

## 보는 법

- `#` 은 식별자, `->` 는 다른 엔티티 참조다. 선 끝의 `1`·`N`·`0..1` 은 관계 수다.
- 태그: `중심` 은 그 영역의 핵심 엔티티, `이력` 은 지우지 않는 변경 기록, `3팀 참조` 는 3팀 소유라 참조만 한다.
- 속성 이름은 업무 용어집 표기를 따른다. 제안 컬럼명은 카탈로그에만 있다.
- 논리 타입 `code` 는 공통코드 값을 담는 컬럼이다. 실제 타입은 text 이고 비고에 공통코드 그룹 코드를 적는다. 컬럼명은 그룹 코드를 소문자로 쓰고 `_code` 를 붙인다(예: `ACCOUNT_STATUS` → `account_status_code`). 상세 코드가 (그룹 코드, 상세코드, BP 코드) 복합키라 FK 는 걸지 않는다. 공통코드 테이블 자신의 `group_code`·`item_code` 는 코드를 정의하는 컬럼이라 text 다.

## 근거

- `docs/mockup/auth/` 6개 HTML (login, signup, signup-done, find, force-password, overview)
- `docs/mockup/mypage/` 4개 HTML (profile, password, withdraw, overview)
- `docs/mockup/stores/` 5개 HTML (index, detail, new, edit, overview)
- `docs/mockup/bp/` 5개 HTML (index, detail, new, edit, overview)
- `docs/mockup/config/` 11개 HTML (admins, admins-detail, admins-new, admins-edit, roles, codes, holidays, holidays-detail, holidays-new, holidays-edit, overview)
- `docs/mockup/system/` 9개 HTML (admins, admins-detail, admins-new, admins-edit, roles, menus, codes, holidays, overview)
- Manyfast 기능·명세 참조 코드: R-LYZWGG, R-QTPRUQ, R-DJGLEO, R-NMDCYH, R-KJGJXP

## 3팀과 맞닿는 곳

- **계정(`accounts`)과 직원 레코드(`staff_members`)** 는 3팀 소유다. 1팀 엔티티는 식별자로 참조만 한다.
- **관리자 계정(`customers`)** 은 1팀 소유다. BP 조직 정보(상호명·사업자정보 등)는 `bp_codes` 테이블에서 관리한다. 3팀 ERD 에서는 "1팀 참조"로 두고 있다.
- **근무지 좌표와 위치 적용 여부** 는 3팀 출퇴근 판정에 쓰인다. 점포 테이블에 위도·경도와 위치 적용 여부(`is_location_applied`, 기본 true)를 두고, 근무지 반경은 점포에서 관리하지 않는다 (2026-10-01).
- **알림(`notifications`)과 알림 수신** 은 3팀 소유다. 관리자 계정을 수신자로 참조한다.

## 확정 (2026-09-29)

- 관리자 비밀번호 초기화는 새 초기 비밀번호 메일이다 (CONFIG-3).
- 상세 코드에도 관리 주체를 저장한다 (CONFIG-7).
- 메뉴는 삭제하지 않고 사용중지하며 메뉴 변경 이력은 두지 않는다 (SYSTEM-7).
- 서비스·그룹·상세 코드는 등록 뒤 바꿀 수 없다 (SYSTEM-10).
- 플랫폼제공 공통코드 그룹은 'BP 적용 여부'를 적용으로 바꾸는 순간 사용 중인 모든 BP에 그룹과 상세 코드를 BP별 행으로 복사한다. 적용에서 미적용으로는 되돌릴 수 없다.
- 이력으로 저장하지 않는 것: 엑셀 내려받기, 메뉴 권한(CRUD) 변경, 공식 휴일 변경, 공통코드 변경. 보안 감사는 로그인 이력·메일 발송 이력·관리자 변경 이력으로 대신한다.
- 시스템이 처리한 변경의 변경자는 원인 제공자다(BP 탈퇴 → 탈퇴한 BP 마스터, 연쇄 미사용 → 미사용 처리한 사람). 배치 처리는 비운다.
- 임시·초기·초기화 비밀번호는 모두 1시간 뒤 만료한다. 만료된 초기 비밀번호는 비밀번호 찾기로 다시 받는다.
- 이력 보존: 업무 변경 이력(관리자·BP·점포·휴일)은 5년, 로그인 이력·메일 발송 이력은 1년이다. 점포 이력 1년 규칙은 폐기한다. 탈퇴 BP 는 탈퇴 BP 데이터 보존 정책(PL-ZHHPAV)이 우선한다.
- BP 탈퇴는 BP 마스터 본인만 한다 — 플랫폼 사용자는 미사용까지만 바꾼다. 탈퇴하면 하위 계정(BP 관리자·가맹 마스터·가맹 관리자)도 즉시 탈퇴 처리하고 개인정보를 지우며 아이디만 보존한다.
- 플랫폼 사용자의 점포 등록은 점포 목록에서 하고, 소속 BP 는 화면 상단에서 고른 BP 다.
- 비밀번호 초기화 메일은 플랫폼·BP 마스터·BP 관리자 모두 초기화 전용 양식 하나를 쓴다.
- 플랫폼 BP 를 둔다 (2026-09-30) — `bp_codes` 에 플랫폼 BP 여부(`is_platform`)가 true 인 행을 하나만 두고, 플랫폼 계정·플랫폼 권한 그룹·공통코드 원본 행이 모두 여기에 소속된다.
  그래서 `customers`·`role_groups` 의 `bp_id` 와 `code_items` 의 `bp_code` 는 NULL 없이 필수다. 플랫폼 BP 는 BP 목록·조회 범위·공통코드 배포·배치·통계·사업자등록번호 중복 검사 등 모든 고객 BP 대상 처리에서 빠진다.
  권한 판정은 `bp_id` 가 아니라 권한 유형(`auth_type_code`)으로 한다.
- 공통코드는 식별자 대신 코드로 PK 를 잡는다 (2026-09-30) — `code_groups` 는 `group_code`, `code_items` 는 (`group_code`, `item_code`, `bp_code`) 복합 PK 다. 세 값 모두 필수이고 등록 뒤 바꾸지 않는다. 복사된 행의 원본은 같은 그룹 코드·상세코드의 플랫폼 BP 행이라 원본 참조 컬럼을 두지 않는다.
- 공식 휴일 적재 이력 테이블은 두지 않는다 (2026-09-30) — 규칙 적재는 운영 작업이라 따로 기록하지 않는다. 동기화 이력은 3팀과의 배치 이력 공통화 논의 결과에 따라 남기거나 없앤다.
- 이력 테이블에는 변경 유형(`change_type`)을 두지 않는다 (2026-09-30) — 무엇이 바뀌었는지는 변경 항목과 변경 전후 값으로 본다.
- 공통코드 값을 담는 컬럼은 논리 타입 `code`, 이름은 그룹 코드 + `_code` 로 맞춘다 (2026-09-30) — 권한 유형·계정 상태·BP 상태·점포 상태·점포 유형·관리 주체·가입경로·탈퇴 사유(`WITHDRAW_REASON`)·휴일 유형·휴일 반복 유형·서비스·메일 유형(`MAIL_TYPE`)·약관 유형(`TERMS_TYPE`)·층수 구분(`FLOOR_TYPE`).
- 관리자 계정의 관리 점포 범위(전체·일부)는 전체 점포 적용 여부(`is_all_stores`, bool)로 둔다 (2026-09-30). BP 휴일의 적용 범위(전체점포·특정점포)도 같은 이름·같은 컬럼(`bp_holidays.is_all_stores`)으로 둔다 — 관리 점포 범위는 이 값이 true 면 소속 BP 모든 점포, false 면 점포 매핑에 있는 점포다.
- BP 상태를 `bp_codes.account_status_code`(사용·미사용·탈퇴)에 둔다 (2026-09-30) — BP 마스터 계정 상태와 함께 바뀌고, 오등록 삭제는 `is_deleted` 로 따로 본다. 상태 변경 일시는 `bp_codes` 에 두지 않는다.
- 가맹 마스터는 직영점을 포함한 BP 의 전체 점포에서 관리 점포를 고른다(한 점포 한 가맹 마스터).

## 아직 정하지 않은 것

- 로그인을 아이디로 하는가 이메일로 하는가 (AUTH-1)
- 계정 찾기의 본인 확인 수단 — 이메일 대조인가 휴대전화 인증인가 (AUTH-2)

---

## 인증·계정

로그인·회원가입·계정 찾기·강제 비밀번호 변경을 아우르는 인증 영역이다. BP 마스터가 사업자 회원가입으로 직접 만들거나, 플랫폼 관리자가 BP 마스터 계정 관리에서 등록한다. 아이디(영문·숫자 4~20자)로 로그인하고 연속 5회 실패 시 5분 잠금한다. 접근 토큰 1시간, 갱신 토큰은 마지막 사용 후 1시간이다.

### 약관 버전 `terms_versions` · 엔티티

이용약관·개인정보 수집·이용 약관의 버전을 관리한다. 관리자 계정은 동의한 버전 ID를 참조한다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 약관 버전 ID | id | `terms_version_id` |  |
|  | 약관 유형 코드 | code | `terms_type_code` | 공통코드 `TERMS_TYPE`(이용약관·개인정보 수집·이용 동의·마케팅 수신 동의·위치정보 수집·이용 동의) |
|  | 버전 번호 | text | `version` | 예: v1.0, v1.1 |
|  | 약관 내용 | text | `content` | 약관 본문 |
|  | 제목 | text | `title` |  |
|  | 시행일 | date | `effective_date` |  |
|  | 사용 여부 | bool | `is_active` | 현재 적용 중인 버전 |
|  | 삭제 여부 | bool | `is_deleted` |  |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` | customers FK |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` | customers FK |

### BP 코드 `bp_codes` · 중심

BP 조직을 식별하고 사업자정보를 관리하는 테이블이다. BP 생성 시 자동 채번되며, 소속 관리자 계정과 1:N으로 연결된다. BP 상태는 `account_status_code`(사용·미사용·탈퇴)에 둔다 — BP 등록, BP 상태 변경, 회원 탈퇴 때 BP 마스터 계정 상태(`customers.account_status_code`)와 같은 트랜잭션에서 시스템만 바꾸며 사람이 직접 고치지 않는다. 오등록 삭제는 상태가 아니라 `is_deleted` 로 표시하므로, BP 상태 판정은 늘 `is_deleted` = false 와 함께 본다 (점포 업무는 `account_status_code` = 사용, 사업자등록번호 중복 검사와 공통코드 배포는 `account_status_code` IN (사용, 미사용)).

플랫폼 BP 한 행(`is_platform` = true)을 함께 둔다. 플랫폼 마스터·플랫폼 관리자 계정, 플랫폼 권한 그룹, 공통코드 원본 행이 여기에 소속된다. 플랫폼 BP 에는 BP 마스터가 없고 상태 판정·점포·배포 대상이 아니며, 고객 BP 를 다루는 모든 조회·처리는 `is_platform` = false 인 행만 본다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | BP ID | id | `bp_id` |  |
|  | BP 코드 | text | `bp_code` | BP+6자리, 고유, 자동 채번, 변경 불가. 플랫폼 BP 는 BP000000 예약(채번 제외) |
|  | 플랫폼 BP 여부 | bool | `is_platform` | 기본 false. true 인 행은 하나만(부분 유일) |
|  | BP 상태 코드 | code | `account_status_code` | 공통코드 `ACCOUNT_STATUS`(사용·미사용·탈퇴), 기본 사용. 시스템만 변경, 플랫폼 BP 는 사용 고정 |
|  | 상호명 | text | `corp_name` | 1~50자 |
|  | 사업자등록번호 | text | `biz_reg_no` | 탈퇴하지 않은 고객 BP끼리 고유(부분 유일). 플랫폼 BP 는 검사에서 제외 |
|  | 대표자명 | text | `biz_ceo_name` | 인증 결과만 |
|  | 개업일자 | date | `biz_open_date` | 인증 결과만 |
|  | 대표자 연락처 | text | `biz_ceo_phone` | BP 탈퇴 때 삭제(개인정보) |
|  | 대표자 이메일 | text | `biz_ceo_email` | BP 탈퇴 때 삭제(개인정보) |
|  | 사업장 우편번호 | text | `biz_zip_code` |  |
|  | 사업장 기본주소 | text | `biz_address` |  |
|  | 사업장 상세주소 | text | `biz_address_detail` |  |
|  | 업태 | text | `biz_category` | 50자 |
|  | 종목 | text | `biz_item` | 50자 |
|  | 최종 인증일시 | datetime | `biz_verified_at` |  |
|  | 삭제 여부 | bool | `is_deleted` | 오등록 BP 삭제 때만 true. BP 탈퇴는 바꾸지 않음 |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` | customers FK |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` | customers FK |

### 관리자 계정 `customers` · 중심

BP 마스터·BP 관리자·가맹 마스터·가맹 관리자·플랫폼 마스터·플랫폼 관리자를 모두 담는 단일 테이블이다. 가맹 관리자의 연결 가맹 마스터는 따로 두지 않고 권한 그룹의 관리계정ID(`role_groups.manager_customer_id`)로 알아낸다. 사업자정보(상호명·사업자등록번호·대표자명·업태·종목 등)는 모두 `bp_codes` 테이블에서 관리한다. api 저장소의 customers 테이블에 해당한다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 관리자 ID | id | `customer_id` |  |
|  | 관리자 로그인ID | text | `login_id` | 영문·숫자 4~20자, 탈퇴·삭제 포함 고유, 변경 불가 |
| FK | BP | id | `bp_id` | bp_codes FK, 필수. 플랫폼 마스터·플랫폼 관리자는 플랫폼 BP |
|  | 이름 | text | `name` | 한글·영문 2~20자 |
|  | 비밀번호 해시 | hash | `password_hash` |  |
|  | 연락처 | text | `phone` | 숫자 10~11자리 |
|  | 이메일 | text | `email` | 사용·미사용 계정 간 고유 |
|  | 권한 유형 코드 | code | `auth_type_code` | 공통코드 `AUTH_TYPE`(플랫폼 마스터·플랫폼 관리자·BP 마스터·BP 관리자·가맹 마스터·가맹 관리자) |
| FK | 권한 그룹 | id | `role_group_id` | 한 명에 하나 |
| FK | 이용약관 최근 동의 버전 | id | `terms_of_use_version_id` | terms_versions FK, 동의 전(플랫폼등록 계정 첫 로그인 전)은 비움 |
|  | 이용약관 동의 일시 | datetime | `terms_of_use_agreed_at` |  |
| FK | 개인정보 최근 동의 버전 | id | `privacy_version_id` | terms_versions FK, 동의 전은 비움 |
|  | 개인정보 동의 일시 | datetime | `privacy_agreed_at` |  |
|  | 약관 최근 동의 일시 | datetime | `terms_agreed_at` | 이용약관과 개인정보 수집·이용 동의한 일시 |
|  | 강제 비밀번호 변경 대상 | bool | `force_password_change` | 초기·임시 비밀번호 발급 시 true |
|  | 초기 비밀번호 미발송 | bool | `initial_pw_unsent` | 계정 생성·초기화 메일이 실패하면 true, 다시 보내면 false |
|  | 로그인 실패 횟수 | int | `failed_login_count` | 5회 잠금 |
|  | 잠금 해제 시각 | datetime | `locked_until` | 5분 잠금 |
|  | 최근 로그인 일시 | datetime | `last_login_at` |  |
|  | 가입경로 코드 | code | `join_path_code` | 공통코드 `JOIN_PATH`(회원가입·플랫폼등록), 모든 계정 필수 |
|  | 전체 점포 적용 여부 | bool | `is_all_stores` | true 면 소속 BP 모든 점포(이후 등록 포함)를 관리하고 점포 매핑을 두지 않음. false 면 `admin_store_mappings`. 가맹 마스터는 false 만 |
|  | 소속 부서 | text | `department` | 플랫폼 관리자만, 선택 |
|  | 직책 | text | `job_title` | 플랫폼 관리자만, 선택 |
|  | 우편번호 | text | `zip_code` | 플랫폼 관리자만, 선택 |
|  | 기본주소 | text | `address` | 플랫폼 관리자만, 선택 |
|  | 상세주소 | text | `address_detail` | 플랫폼 관리자만, 선택 |
|  | 탈퇴 사유 코드 | code | `withdraw_reason_code` | 공통코드 `WITHDRAW_REASON`(WD_CLOSE 등 탈퇴 사유) |
|  | 탈퇴사유설명 | text | `withdraw_reason_detail` | 직접입력 시 500자 |
|  | 계정 상태 코드 | code | `account_status_code` | 공통코드 `ACCOUNT_STATUS`(사용·미사용·탈퇴). BP 마스터 계정은 `bp_codes.account_status_code` 와 같은 트랜잭션에서 함께 바뀐다 |
|  | 계정상태변경일시 | datetime | `status_changed_at` | 탈퇴 일시도 여기에 남는다. BP 가 탈퇴하면 하위 계정(BP 관리자·가맹 마스터·가맹 관리자)도 같은 순간 탈퇴하고 개인정보를 지운다 — 아이디만 보존 |
|  | 삭제 여부 | bool | `is_deleted` | 오등록 삭제용, 논리 삭제. 회원 탈퇴는 바꾸지 않음(상태만 탈퇴) |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` | 플랫폼등록 시 플랫폼 관리자 |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` | customers FK |

### 관리자 접속 상태 `admin_sessions` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 접속 ID | id | `session_id` |  |
| FK | 관리자 | id | `customer_id` |  |
|  | 기기 식별 정보 | text | `device_info` | 여러 브라우저 동시 로그인 |
|  | 접근 토큰 해시 | hash | `access_token_hash` | 1시간 |
|  | 갱신 토큰 해시 | hash | `refresh_token_hash` | 마지막 사용 후 1시간 |
|  | 갱신 토큰 마지막 사용 시각 | datetime | `refresh_last_used_at` | 여기서 1시간이 지나면 만료 |
|  | 발급 시각 | datetime | `issued_at` |  |
|  | 만료 시각 | datetime | `expires_at` |  |
|  | 종료 시각 | datetime | `revoked_at` | 로그아웃·비밀번호 변경 시 |
|  | 삭제 여부 | bool | `is_deleted` |  |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` | customers FK |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` | customers FK |

### 임시 비밀번호 `temp_passwords` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 임시 비밀번호 ID | id | `temp_pw_id` |  |
| FK | 관리자 | id | `customer_id` |  |
|  | 비밀번호 해시 | hash | `password_hash` | 12자 무작위 |
|  | 발급 시각 | datetime | `issued_at` |  |
|  | 만료 시각 | datetime | `expires_at` | 1시간 — 임시·초기·초기화 모두 |
|  | 사용 시각 | datetime | `used_at` | 로그인 성공 시 |
|  | 무효화 시각 | datetime | `invalidated_at` | 다시 발급하거나 비밀번호를 바꾸면 |
|  | 발급 용도 | enum | `purpose` | 임시비밀번호·초기비밀번호·비밀번호초기화. 찾기 발급 제한(계정당 1시간 5회)은 임시비밀번호만 센다 |
|  | 삭제 여부 | bool | `is_deleted` |  |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` | customers FK |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` | customers FK |

### 관리자 로그인 이력 `admin_login_histories` · 이력

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 로그인 이력 ID | id | `login_id` |  |
| FK | 관리자 | id | `customer_id` | 없는 아이디면 비움 |
|  | 접속 IP | text | `ip_address` |  |
|  | 성공 여부 | bool | `succeeded` |  |
|  | 실패 사유 | enum | `failure_reason` | 불일치·잠금·미사용·탈퇴 |
|  | 시도 시각 | datetime | `attempted_at` | 1년 보존 |

### 관리자 변경 이력 `admin_change_histories` · 이력

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 변경 이력 ID | id | `change_id` |  |
| FK | 대상 관리자 | id | `customer_id` |  |
|  | 변경 항목 | text | `field` | 이름·연락처·이메일·계정상태 등 |
|  | 변경 전 값 | text | `before_value` | 비밀번호는 저장 안 함 |
|  | 변경 후 값 | text | `after_value` | 비밀번호는 저장 안 함 |
| FK | 변경자 | id | `changed_by` | 본인 또는 관리자. 연쇄 미사용은 미사용 처리한 사람 |
|  | 변경 일시 | datetime | `changed_at` | 5년 보존 |

### 약관 동의 이력 `terms_agreement_histories` · 이력

관리자 계정의 약관 동의·재동의 이력을 기록한다. 약관 버전이 바뀌어 재동의하거나, 최초 가입 시 동의한 내역을 남긴다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 동의 이력 ID | id | `agreement_id` |  |
| FK | 관리자 | id | `customer_id` | customers FK |
| FK | 약관 버전 | id | `terms_version_id` | terms_versions FK |
|  | 동의 여부 | bool | `agreed` |  |
|  | 동의 일시 | datetime | `agreed_at` |  |
|  | 동의 경로 | enum | `channel` | 회원가입·최초 로그인·재동의·약관변경 |
|  | 접속 IP | text | `ip_address` |  |

### 메일 발송 이력 `mail_send_histories` · 이력

계정 생성·비밀번호 초기화·임시 비밀번호 등 계정 메일의 발송 결과를 남긴다. 초기 비밀번호 미발송 표시와 보안 감사의 근거다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 발송 이력 ID | id | `mail_id` |  |
|  | 메일 유형 코드 | code | `mail_type_code` | 공통코드 `MAIL_TYPE`(회원가입 완료·신규 BP 가입 알림·BP 신규 등록·플랫폼 관리자 계정 생성·BP 관리자 계정 생성·비밀번호 초기화·임시 비밀번호 발급·회원 탈퇴 완료) |
| FK | 수신 계정 | id | `customer_id` | customers FK |
|  | 발신 이메일 | text | `from_email` | 보낸 주소 |
|  | 수신 이메일 | text | `to_email` | 보낸 시점의 주소 |
|  | 메일 제목 | text | `subject` | 보낸 제목 그대로 |
|  | 메일 내용 | text | `body` | 보낸 본문. 초기·임시 비밀번호 값은 `********`로 가려서 저장 |
|  | 발송 결과 | enum | `result` | 성공·실패 |
|  | 실패 사유 | text | `failure_reason` |  |
| FK | 처리자 | id | `sent_by` | 관리자가 보냈을 때, 본인 요청은 비움 |
|  | 발송 일시 | datetime | `sent_at` | 1년 보존 |

**관계**

- 관리자 계정 `1` -- `N` 관리자 접속 상태
- 관리자 계정 `1` -- `N` 임시 비밀번호
- 관리자 계정 `1` -- `N` 관리자 로그인 이력
- 관리자 계정 `1` -- `N` 관리자 변경 이력 (대상)
- 관리자 계정 `1` -- `N` 관리자 변경 이력 (변경자)
- 관리자 계정 `1` -- `N` 메일 발송 이력
- 임시 비밀번호 `0..1` -- `N` 메일 발송 이력
- 약관 버전 `1` -- `N` 관리자 계정 · 이용약관 동의
- 약관 버전 `1` -- `N` 관리자 계정 · 개인정보 동의
- 관리자 계정 `1` -- `N` 약관 동의 이력
- 약관 버전 `1` -- `N` 약관 동의 이력
- BP 코드 `1` -- `N` 관리자 계정 · BP 소속

---

## 마이페이지

로그인한 관리자 본인의 정보 관리(기본정보·사업자정보)·비밀번호 변경·회원 탈퇴를 다룬다. 사업자정보 탭은 BP 마스터에게만 보인다.

마이페이지는 별도 엔티티를 만들지 않는다. 기본정보 수정은 `customers` 테이블의 이름·연락처·이메일을 갱신하고, 사업자정보 수정은 `bp_codes` 테이블의 사업자정보 속성을 갱신하며, 비밀번호 변경은 `customers.password_hash`를 갱신한다. 모든 변경은 `admin_change_histories`에 이력을 남긴다. 회원 탈퇴는 `customers.account_status_code`를 '탈퇴'로만 바꾸고(삭제 여부 `is_deleted`는 그대로 — 탈퇴 BP·계정은 목록과 상세에 계속 나온다), `bp_codes`의 대표자 연락처·대표자 이메일을 비우며, `status_changed_at`(탈퇴 일시)·`withdraw_reason_code`·`withdraw_reason_detail`을 기록하며, 같은 BP의 하위 계정도 함께 탈퇴 처리해 개인정보를 지우고(아이디만 보존) 점포를 폐점한다.

---

## 점포관리

직영(일반점포)과 가맹(가맹점포)을 같은 구조로 다룬다. 상태는 미운영 -> 운영 -> 폐점 한 방향이고, 운영 전환은 사업자정보 인증 완료 · 필수 항목 입력 · 좌표(위도·경도) 입력 · 소속 BP 사용 상태가 조건이다. 사업자정보는 `store_business_infos`, 층별정보(매장평수·좌석수·층수 등)는 `store_floor_infos`, 대표 이미지는 `store_image_files` 테이블로 분리하여 관리한다.

### 점포 `stores` · 중심

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 점포 ID | id | `store_id` |  |
|  | 점포코드 | text | `store_code` | ST+6자리, 고유, 자동 채번, 변경 불가 |
| FK | BP | id | `bp_id` | 소속 BP, bp_codes FK |
|  | 점포 유형 코드 | code | `store_type_code` | 공통코드 `STORE_TYPE`(일반점포·가맹점포), 변경 불가 |
|  | 점포명 | text | `name` | 1~50자, 필수 |
|  | 점포 연락처 | text | `phone` | 숫자 9~11자리 |
|  | 우편번호 | text | `zip_code` |  |
|  | 기본주소 | text | `address` |  |
|  | 상세주소 | text | `address_detail` |  |
|  | 위도 | decimal | `latitude` | 소수점 6자리 |
|  | 경도 | decimal | `longitude` | 소수점 6자리 |
|  | 위치 적용 여부 | bool | `is_location_applied` | 기본 true(사용). true 면 3팀이 위도·경도 기준으로 출퇴근 허용 여부를 판정, false 면 위치를 보지 않음 |
|  | 폐점일 | date | `closed_on` | 폐점 전환일 자동 |
|  | 점포 상태 코드 | code | `store_status_code` | 공통코드 `STORE_STATUS`(미운영·운영·폐점) |
|  | 삭제 여부 | bool | `is_deleted` | 미운영만 삭제 가능 |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` |  |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` |  |

### 점포 층별정보 `store_floor_infos` · 엔티티

점포의 층별 매장 정보를 관리하는 테이블이다. 한 점포에 여러 층이 등록될 수 있으며 점포와 1:N 관계이다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 층별정보 ID | id | `floor_info_id` |  |
| FK | 점포 | id | `store_id` | stores FK |
|  | 매장평수 | decimal | `floor_area_pyeong` | 소수 1자리, 선택 |
|  | 전용면적 | decimal | `floor_area_sqm` | 소수 2자리, 선택 |
|  | 좌석수 | int | `seat_count` | 0 이상, 선택 |
|  | 층수 구분 코드 | code | `floor_type_code` | 공통코드 `FLOOR_TYPE`(GROUND 지상·BASEMENT 지하) |
|  | 층수 | int | `floor_number` |  |
|  | 삭제 여부 | bool | `is_deleted` |  |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` | customers FK |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` | customers FK |

### 점포 대표 이미지 파일 `store_image_files` · 엔티티

점포 대표 이미지 파일의 정보를 관리하는 테이블이다. 파일 자체는 파일 저장소에 두고 이 테이블에는 저장 위치와 파일 정보만 둔다. 대표 이미지는 선택이고 점포당 1장이라, 삭제되지 않은 행은 점포마다 최대 하나다(부분 유일). 이미지를 바꾸면 기존 행을 삭제 처리하고 새 행을 만든다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 파일 ID | id | `file_id` |  |
| FK | 점포 | id | `store_id` | stores FK, 삭제되지 않은 행은 점포당 1개 |
|  | 원본 파일명 | text | `file_name` |  |
|  | 파일 형식 | text | `mime_type` | JPG·PNG |
|  | 파일 크기 | int | `size_bytes` | 5MB 이하 |
|  | 저장 위치 | text | `storage_key` | 파일 저장소 키 |
|  | 삭제 여부 | bool | `is_deleted` | 교체·삭제 시 true |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` | customers FK |

### 점포 사업자정보 `store_business_infos` · 엔티티

점포의 사업자등록 정보를 관리하는 테이블이다. 점포와 1:1 관계이며, 사업자 번호 인증 전에는 행이 없을 수 있다. 인증 완료 여부는 별도 저장하지 않고 사업자등록번호 유무로 판정한다. 한 번 저장된 사업자등록번호는 바꿀 수 없으며, 바꾸려면 점포를 끝내고 새로 등록한다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK·FK | 점포 | id | `store_id` | stores FK, 1:1 |
|  | 상호명 | text | `biz_corp_name` | 직접 입력, 인증과 무관 |
|  | 사업자등록번호 | text | `biz_reg_no` | 폐점·삭제되지 않은 점포끼리 고유(부분 유일), 저장 후 변경 불가 |
|  | 대표자명 | text | `biz_ceo_name` | 인증 결과만, 재인증 시 갱신 |
|  | 개업일자 | date | `biz_open_date` | 인증 결과만 |
|  | 대표자 연락처 | text | `biz_ceo_phone` | 휴대전화 10~11자리 |
|  | 사업자 우편번호 | text | `biz_zip_code` |  |
|  | 사업자 기본주소 | text | `biz_address` |  |
|  | 사업자 상세주소 | text | `biz_address_detail` |  |
|  | 업태 | text | `biz_category` | 50자 |
|  | 종목 | text | `biz_item` | 50자 |
|  | 최종 인증일시 | datetime | `biz_verified_at` |  |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` | customers FK |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` | customers FK |

### 점포 변경 이력 `store_change_histories` · 이력

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 변경 이력 ID | id | `change_id` |  |
| FK | 점포 | id | `store_id` |  |
|  | 변경 항목 | text | `field` | 점포명·점포상태·연락처·삭제 등 |
|  | 변경 전 값 | text | `before_value` |  |
|  | 변경 후 값 | text | `after_value` |  |
| FK | 변경자 | id | `changed_by` | BP 탈퇴로 자동 폐점하면 탈퇴한 BP 마스터 |
|  | 변경 일시 | datetime | `changed_at` | 5년 보존 |
|  | 보존 기한 | date | `retain_until` | 5년 보존 (1년 규칙 폐기) |

### 관리자 점포 매핑 `admin_store_mappings` · 엔티티

전체 점포 적용 여부(`customers.is_all_stores`)가 false 인 계정만 행을 가진다. 가맹점포 하나는 가맹 마스터 한 명만 맡는다 — 스키마 제약 없이 저장할 때 앱이 검사한다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK·FK | 관리자 | id | `customer_id` |  |
| PK·FK | 점포 | id | `store_id` |  |
|  | 삭제 여부 | bool | `is_deleted` |  |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` | customers FK |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` | customers FK |

**관계**

- BP 코드 `1` -- `N` 점포 · 소속
- 점포 `1` -- `N` 점포 층별정보
- 점포 `1` -- `0..1` 점포 사업자정보
- 점포 `1` -- `0..1` 점포 대표 이미지 파일
- 점포 `1` -- `N` 점포 변경 이력
- 관리자 계정 `1` -- `N` 관리자 점포 매핑
- 점포 `1` -- `N` 관리자 점포 매핑
- 관리자 계정 `1` -- `N` 점포 · 등록자
- 관리자 계정 `1` -- `N` 점포 변경 이력 · 변경자

---

## BP 마스터 계정 관리

플랫폼 사용자가 BP 마스터 계정을 등록·조회·수정·삭제하는 영역이다. BP 조직 정보는 `bp_codes` 테이블에서 관리된다.

이 영역은 `bp_codes` 테이블과 `customers` 테이블의 BP 마스터 행(auth_type_code = BP 마스터)을 다룬다. BP 조직 정보(상호명·사업자정보)는 `bp_codes`에, 계정 정보는 `customers`에 있다. 속성 상세는 인증·계정 섹션의 `bp_codes`·`customers` 테이블을 참조한다.

### BP 변경 이력 `bp_change_histories` · 이력

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 변경 이력 ID | id | `change_id` |  |
| FK | BP | id | `bp_id` | bp_codes FK |
|  | 변경 항목 | text | `field` | 상호명·BP상태·사업자정보 등 |
|  | 변경 전 값 | text | `before_value` |  |
|  | 변경 후 값 | text | `after_value` |  |
| FK | 변경자 | id | `changed_by` | 시스템 처리는 원인 제공자 |
|  | 변경 일시 | datetime | `changed_at` | 5년 보존 |
|  | 비고 | text | `note` | 탈퇴 줄에만 탈퇴 사유 |

**관계**

- BP 코드 `1` -- `N` 관리자 계정 · BP 소속
- BP 코드 `1` -- `N` 점포 · 소속
- BP 코드 `1` -- `N` BP 변경 이력
- 관리자 계정 `1` -- `N` BP 변경 이력 · 변경자

---

## 환경설정 & 시스템관리

BP·플랫폼의 권한 그룹·공통코드·메뉴·휴일과 플랫폼 공식 휴일을 관리한다. 플랫폼 관리자 계정은 `customers` 테이블을 공유하고(역할이 플랫폼마스터·플랫폼관리자), 플랫폼 권한 그룹은 `role_groups`(bp_id=플랫폼 BP), 공통코드는 `code_groups`·`code_items`, 메뉴는 `menus` 테이블을 공유한다.

### 권한 그룹 `role_groups` · 중심

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 권한 그룹 ID | id | `role_group_id` |  |
|  | 권한 코드 | text | `role_code` | 유형코드+6자리(BM000001 등), 고유, 변경 불가 |
| FK | BP | id | `bp_id` | bp_codes FK, 필수. 플랫폼 권한은 플랫폼 BP |
|  | 권한 유형 코드 | code | `auth_type_code` | 공통코드 `AUTH_TYPE`(플랫폼 마스터·플랫폼 관리자·BP 마스터·BP 관리자·가맹 마스터·가맹 관리자), 변경 불가 |
|  | 권한명 | text | `name` | 같은 BP·같은 관리계정ID 안 고유(BA 그룹끼리, 가맹 마스터별 FA 그룹끼리) |
|  | 설명 | text | `description` |  |
|  | 마스터 권한 여부 | bool | `is_master` | BM000001·FM000001·PM000001·PA000001 |
| FK | 관리계정 | id | `manager_customer_id` | FA 그룹은 만든 가맹 마스터 — 가맹 관리자의 연결 가맹 마스터는 여기서 알아낸다 |
|  | 삭제 여부 | bool | `is_deleted` |  |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` |  |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 최근 수정자 | id | `updated_by` |  |

### 권한 메뉴 `role_group_menus` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK·FK | 권한 그룹 | id | `role_group_id` |  |
| PK·FK | 메뉴 | id | `menu_id` |  |
|  | 조회 | bool | `can_read` |  |
|  | 등록 | bool | `can_create` |  |
|  | 수정 | bool | `can_update` |  |
|  | 삭제 | bool | `can_delete` |  |
|  | 삭제 여부 | bool | `is_deleted` |  |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` | customers FK |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` | customers FK |

### 공통코드 그룹 `code_groups` · 중심

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 그룹 코드 | text | `group_code` | 대문자 밑줄, 예: EMP_TYPE, 필수, 변경 불가. 삭제한 그룹의 코드도 다시 쓰지 않는다 |
|  | 그룹명 | text | `group_name` |  |
|  | 관리 주체 코드 | code | `manage_owner_code` | 공통코드 `MANAGE_OWNER` 중 플랫폼고정·플랫폼제공 |
|  | BP 적용 여부 | bool | `bp_applied` | 플랫폼제공 그룹만. 신규는 미적용, 적용으로 바꾸는 순간 사용 중인 모든 BP에 복사, 되돌릴 수 없음 |
|  | 설명 | text | `description` |  |
|  | 사용 상태 | enum | `status` | 사용·사용중지 |
|  | 표시 순서 | int | `sort_order` |  |
|  | 삭제 여부 | bool | `is_deleted` |  |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` | customers FK |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` | customers FK |

### 상세 코드 `code_items` · 엔티티

플랫폼 원본 행과 BP별 행을 함께 담는다. 플랫폼제공 그룹을 BP에 적용하면 그때의 상세 코드가 BP별 행으로 복사되고, BP는 자기 행의 코드명·표시 순서·사용 상태를 바꾼다. 적용 뒤 플랫폼이 추가한 코드는 기존 BP에 퍼지지 않고, 새로 가입하는 BP가 가입 때 적용된 그룹을 모두 복사받는다. 플랫폼고정 그룹은 복사하지 않고 원본을 모든 BP가 읽는다. BP전용 코드의 중복 검사는 그 BP가 가진 행 기준이다.
PK 는 그룹 코드 + 상세코드 + BP 코드이며 셋 다 필수다. 플랫폼 원본 행의 `bp_code` 는 플랫폼 BP(BP000000)다 — 한 BP 가 보는 코드는 `bp_code IN (그 BP, 플랫폼 BP)` 로 읽는다. 배포는 플랫폼 BP 에 복사하지 않는다.
복사된 행의 원본은 같은 `group_code`·`item_code` 의 플랫폼 BP 행이므로 원본을 가리키는 컬럼은 두지 않는다. 삭제는 논리 삭제라 삭제한 코드도 PK 에 남아 같은 그룹·BP 안에서 다시 쓰지 않는다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK·FK | 그룹 코드 | text | `group_code` | code_groups FK, 필수 |
| PK | 상세코드 | text | `item_code` | 필수. 영문 대문자·숫자·밑줄 20자, 등록 후 변경 불가 |
| PK·FK | BP 코드 | text | `bp_code` | bp_codes.bp_code FK, 필수. 플랫폼 원본은 플랫폼 BP(BP000000), BP별 행(적용 때 복사된 행·BP전용 코드)은 그 BP |
|  | 코드명 | text | `label` |  |
|  | 관리 주체 코드 | code | `manage_owner_code` | 공통코드 `MANAGE_OWNER`(플랫폼고정·플랫폼제공·BP전용) |
|  | 사용 상태 | enum | `status` | 사용·사용중지 |
|  | 표시 순서 | int | `sort_order` |  |
|  | 삭제 여부 | bool | `is_deleted` |  |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` | customers FK |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` | customers FK |

### 메뉴 `menus` · 중심

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 메뉴 ID | id | `menu_id` |  |
|  | 메뉴 코드 | text | `menu_code` | MN+6자리, 고유, 자동 채번, 변경 불가 |
|  | 서비스 코드 | code | `service_code` | 공통코드 `SERVICE` |
| FK | 상위 메뉴 | id | `parent_menu_id` | 최대 3단계 |
|  | 노출 메뉴명 | text | `name` | 필수 |
|  | 메뉴 URL | text | `url` |  |
|  | 메뉴 순서 | int | `sort_order` |  |
|  | 단계 | int | `depth` | 1~3 |
|  | 사용 상태 | enum | `status` | 사용·사용중지 |
|  | 삭제 여부 | bool | `is_deleted` |  |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` | customers FK |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` | customers FK |

### BP 휴일 `bp_holidays` · 중심

규칙을 한 줄로 저장하고, 실제 날짜는 화면에서 볼 때 계산한다. 기간과 반복은 함께 쓰지 않으며 종일만 다룬다(시각 없음).

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 휴일 ID | id | `holiday_id` |  |
| FK | BP | id | `bp_id` | bp_codes FK |
|  | 전체 점포 적용 여부 | bool | `is_all_stores` | true 면 전체 점포 휴일(예외 점포 제외), false 면 특정 점포 휴일(휴일-점포 매핑) |
|  | 휴일 유형 코드 | code | `holiday_type_code` | 공통코드 `HOLIDAY_TYPE`(DAY 하루·PERIOD 기간·REPEAT 반복) |
|  | 휴일 시작날짜 | date | `start_date` | 반복 기준일 |
|  | 휴일 종료날짜 | date | `end_date` | 하루는 시작일과 같게 · 기간의 종료일 · 반복은 비움 |
|  | 휴일 반복 유형 코드 | code | `holiday_repeat_type_code` | 공통코드 `HOLIDAY_REPEAT_TYPE`(DAILY·WEEKLY·MONTHLY·YEARLY) · 반복일 때만, 하루·기간은 비움 |
|  | 반복 종료 조건 | enum | `repeat_end_type` | 없음·날짜·횟수 |
|  | 반복 종료일 | date | `repeat_until` |  |
|  | 반복 횟수 | int | `repeat_count` |  |
|  | 휴일명 | text | `name` | 30자 |
|  | 설명 | text | `description` |  |
| FK | 원래 휴일 | id | `origin_holiday_id` | bp_holidays 자기 참조, '이후 모두' 수정으로 분할된 경우 |
|  | 삭제 여부 | bool | `is_deleted` |  |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` |  |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` |  |

### 휴일 점포 매핑 `holiday_store_mappings` · 엔티티

특정 점포 휴일이 적용되는 점포를 묶는 매핑 테이블이다. 한 휴일에 여러 점포가 붙는다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK·FK | 휴일 | id | `holiday_id` | bp_holidays FK |
| PK·FK | 대상 점포 | id | `store_id` | stores FK |
|  | 적용 종료일 | date | `effective_until` | 일부 점포를 빼거나 떼어 고칠 때 행을 지우지 않고 고른 날짜 전날을 넣는다 — 지난 날짜 보존 |
|  | 삭제 여부 | bool | `is_deleted` |  |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` | customers FK |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` | customers FK |

### 휴일 예외 점포 `holiday_excluded_stores` · 엔티티

전체 점포 휴일에서 빠지는 점포를 관리하는 매핑 테이블이다. 휴일의 모든 날짜에 적용된다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK·FK | 휴일 | id | `holiday_id` | bp_holidays FK |
| PK·FK | 예외 점포 | id | `store_id` | stores FK |
|  | 적용 시작일 | date | `effective_from` | 이 날짜부터 예외 — 지난 날짜 보존 |
|  | 삭제 여부 | bool | `is_deleted` |  |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` | customers FK |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` | customers FK |

### BP 휴일 변경 이력 `bp_holiday_change_histories` · 이력

수정·삭제는 고른 날짜부터 이후 모두에 적용한다. 삭제는 행을 지우지 않고 종료 조건·종료일을 앞당기는 것으로 기록한다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 변경 이력 ID | id | `change_id` |  |
| FK | 휴일 | id | `holiday_id` |  |
|  | 변경 항목 | text | `field` |  |
|  | 변경 전 값 | text | `before_value` |  |
|  | 변경 후 값 | text | `after_value` |  |
| FK | 변경자 | id | `changed_by` |  |
|  | 변경 일시 | datetime | `changed_at` | 5년 보존 |

**관계**

- BP 코드 `1` -- `N` 권한 그룹
- 권한 그룹 `1` -- `N` 권한 메뉴
- 메뉴 `1` -- `N` 권한 메뉴
- 관리자 계정 `1` -- `0..1` 권한 그룹 · 연결
- 권한 그룹(관리계정) `0..1` -- `N` 권한 그룹(FA) · 관리
- 공통코드 그룹 `1` -- `N` 상세 코드
- BP 코드 `1` -- `N` 상세 코드(BP전용)
- 메뉴 `0..1` -- `N` 메뉴 · 상하위
- BP 코드 `1` -- `N` BP 휴일
- BP 휴일 `1` -- `N` 휴일 점포 매핑
- 점포 `1` -- `N` 휴일 점포 매핑
- BP 휴일 `1` -- `N` 휴일 예외 점포
- 점포 `1` -- `N` 휴일 예외 점포
- BP 휴일 `0..1` -- `N` BP 휴일 · 원래 휴일(자기 참조)
- BP 휴일 `1` -- `N` BP 휴일 변경 이력
- 관리자 계정 `1` -- `N` BP 휴일 · 등록자
- 관리자 계정 `1` -- `N` BP 휴일 변경 이력 · 변경자
- 플랫폼 공식 휴일은 BP 휴일 캘린더에 조회용으로 표시됨 (데이터 참조는 없고 화면에서만 합침)
- 공통코드 그룹 '서비스' `1` -- `N` 메뉴 · 서비스 코드

### 플랫폼 공식 휴일 `public_holidays` · 엔티티

2000~2100년을 규칙으로 적재하고, 올해·다음 해는 매월 1일 공공 API로 다시 맞춘다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 공식 휴일 ID | id | `public_holiday_id` |  |
|  | 날짜 | date | `holiday_date` | 한 날짜에 한 건 |
|  | 연도 | int | `year` | 2000~2100 |
|  | 휴일명 | text | `name` |  |
|  | 비고 | text | `note` |  |
|  | 출처 | enum | `source` | 규칙 계산·공식 API |
|  | 공식 원본 식별자 | text | `source_ref` | 공식 API일 때만 |
|  | 최종 동기화 일시 | datetime | `synced_at` | 공식 API일 때만 |

### 동기화 이력 `public_holiday_sync_histories` · 이력

올해·다음 해분을 공식 API로 맞춘 이력이다. 배치 실행 이력을 3팀과 공통 테이블로 둘지 논의 중이며, 공통 테이블로 가면 이 테이블은 없앤다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 동기화 이력 ID | id | `sync_id` |  |
|  | 대상 연도 | int | `year` | 올해·다음 해 |
|  | 동기화 일시 | datetime | `synced_at` |  |
|  | 등록 건수 | int | `created_count` |  |
|  | 수정 건수 | int | `updated_count` |  |
|  | 삭제 건수 | int | `deleted_count` |  |
|  | 실패 건수 | int | `failed_count` |  |
|  | 오류 정보 | text | `error` |  |
|  | 결과 | enum | `result` | 성공·실패 |

---

## 3팀 참조 엔티티

3팀 소유이며 1팀이 식별자로만 참조하는 엔티티다.

### 계정 `accounts` · 3팀 참조

직원 근무 앱 로그인 주체. 관리자 계정과는 별도 테이블이다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 계정 ID | id | `account_id` |  |
|  | 이메일 아이디 | text | `email` |  |

### 직원 레코드 `staff_members` · 3팀 참조

점포별 직원 소속 단위. 근로계약·출퇴근·급여의 주체이다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 직원 레코드 ID | id | `staff_member_id` |  |
| FK | 점포 | id | `store_id` |  |
| FK | 계정 | id | `account_id` |  |
|  | 재직 상태 | enum | `employment_status` | 재직·퇴직 |
