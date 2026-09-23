# WHALE ERP 1팀 1차 논리 ERD

1팀 1차 범위의 데이터를 엔티티와 관계로 정리한 **논리 모델**이다. 물리 설계(인덱스, 제약, 타입 세부)는 whale-erp-api 에서 정한다.

## 보는 법

- `#` 은 식별자, `->` 는 다른 엔티티 참조다. 선 끝의 `1`·`N`·`0..1` 은 관계 수다.
- 태그: `중심` 은 그 영역의 핵심 엔티티, `이력` 은 지우지 않는 변경 기록, `3팀 참조` 는 3팀 소유라 참조만 한다.
- 속성 이름은 업무 용어집 표기를 따른다. 제안 컬럼명은 카탈로그에만 있다.

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
- **근무지 좌표·반경** 은 출퇴근 GPS 판정에 필요한 3팀 요구다. 1팀 점포 테이블에 넣을지, 3팀 확장 테이블로 둘지 정해야 한다.
- **알림(`notifications`)과 알림 수신** 은 3팀 소유다. 관리자 계정을 수신자로 참조한다.

## 아직 정하지 않은 것

- 로그인을 아이디로 하는가 이메일로 하는가 (AUTH-1)
- 계정 찾기의 본인 확인 수단 — 이메일 대조인가 휴대전화 인증인가 (AUTH-2)
- 관리자 비밀번호 초기화는 초기 비밀번호 메일인가 재설정 링크인가 (CONFIG-3)
- BP 공통코드 상세 코드의 관리 주체를 따로 저장하는가 (CONFIG-7)
- 메뉴 삭제와 메뉴 변경 이력의 유무 (SYSTEM-7)
- 공통코드 등록 뒤 코드 값 변경 가능 여부 (SYSTEM-10)

---

## 인증·계정

로그인·회원가입·계정 찾기·강제 비밀번호 변경을 아우르는 인증 영역이다. BP 마스터가 사업자 회원가입으로 직접 만들거나, 플랫폼 관리자가 BP 마스터 계정 관리에서 등록한다. 아이디(영문·숫자 4~20자)로 로그인하고 연속 5회 실패 시 5분 잠금한다. 접근 토큰 1시간, 갱신 토큰은 마지막 사용 후 1시간이다.

### 약관 버전 `terms_versions` · 엔티티

이용약관·개인정보 수집·이용 약관의 버전을 관리한다. 관리자 계정은 동의한 버전 ID를 참조한다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 약관 버전 ID | id | `terms_version_id` |  |
|  | 약관 유형 | enum | `terms_type` | 이용약관·개인정보수집이용 |
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

BP 조직을 식별하고 사업자정보를 관리하는 테이블이다. BP 생성 시 자동 채번되며, 소속 관리자 계정과 1:N으로 연결된다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | BP ID | id | `bp_id` |  |
|  | BP 코드 | text | `bp_code` | BP+6자리, 고유, 자동 채번, 변경 불가 |
|  | 상호명 | text | `corp_name` | 1~50자 |
|  | 사업자등록번호 | text | `biz_reg_no` | BP 간 고유 |
|  | 대표자명 | text | `biz_ceo_name` | 인증 결과만 |
|  | 개업일자 | date | `biz_open_date` | 인증 결과만 |
|  | 대표자 연락처 | text | `biz_ceo_phone` |  |
|  | 대표자 이메일 | text | `biz_ceo_email` |  |
|  | 사업장 우편번호 | text | `biz_zip_code` |  |
|  | 사업장 기본주소 | text | `biz_address` |  |
|  | 사업장 상세주소 | text | `biz_address_detail` |  |
|  | 업태 | text | `biz_category` | 50자 |
|  | 종목 | text | `biz_item` | 50자 |
|  | 최종 인증일시 | datetime | `biz_verified_at` |  |
|  | 삭제 여부 | bool | `is_deleted` |  |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` | customers FK |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` | customers FK |

### 관리자 계정 `customers` · 중심

BP 마스터·BP 관리자·가맹 마스터·가맹 관리자·플랫폼 마스터·플랫폼 관리자를 모두 담는 단일 테이블이다. 사업자정보(상호명·사업자등록번호·대표자명·업태·종목 등)는 모두 `bp_codes` 테이블에서 관리한다. api 저장소의 customers 테이블에 해당한다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 관리자 ID | id | `customer_id` |  |
|  | 관리자 로그인ID | text | `login_id` | 영문·숫자 4~20자, 탈퇴·삭제 포함 고유, 변경 불가 |
| FK | BP | id | `bp_id` | bp_codes FK, 플랫폼 관리자는 NULL |
|  | 이름 | text | `name` | 한글·영문 2~20자 |
|  | 비밀번호 해시 | hash | `password_hash` |  |
|  | 연락처 | text | `phone` | 숫자 10~11자리 |
|  | 이메일 | text | `email` | 사용·미사용 계정 간 고유 |
|  | 권한역할 | enum | `role` | BP마스터·BP관리자·가맹마스터·가맹관리자·플랫폼마스터·플랫폼관리자 |
| FK | 권한 그룹 | id | `role_group_id` | 한 명에 하나 |
| FK | 연결 가맹 마스터 | id | `linked_franchise_master_id` | 가맹 관리자만 |
| FK | 이용약관 최근 동의 버전 | id | `terms_of_use_version_id` | terms_versions FK, 필수 |
|  | 이용약관 동의 일시 | datetime | `terms_of_use_agreed_at` |  |
| FK | 개인정보 최근 동의 버전 | id | `privacy_version_id` | terms_versions FK, 필수 |
|  | 개인정보 동의 일시 | datetime | `privacy_agreed_at` |  |
|  | 약관 최근 동의 일시 | datetime | `terms_agreed_at` | 이용약관과 개인정보 수집·이용 동의한 일시 |
|  | 강제 비밀번호 변경 대상 | bool | `force_password_change` | 초기·임시 비밀번호 발급 시 true |
|  | 로그인 실패 횟수 | int | `failed_login_count` | 5회 잠금 |
|  | 잠금 해제 시각 | datetime | `locked_until` | 5분 잠금 |
|  | 최근 로그인 일시 | datetime | `last_login_at` |  |
|  | 가입경로 | enum | `signup_channel` | BP 마스터만, 회원가입·플랫폼등록 |
|  | 소속 부서 | text | `department` | 플랫폼 관리자만, 선택 |
|  | 직책 | text | `job_title` | 플랫폼 관리자만, 선택 |
|  | 우편번호 | text | `zip_code` | 플랫폼 관리자만, 선택 |
|  | 기본주소 | text | `address` | 플랫폼 관리자만, 선택 |
|  | 상세주소 | text | `address_detail` | 플랫폼 관리자만, 선택 |
|  | 탈퇴 일시 | datetime | `withdrawn_at` | 논리 삭제 |
|  | 탈퇴 사유 코드 | text | `withdraw_reason_code` | 공통코드 '탈퇴 사유' |
|  | 탈퇴 상세 사유 | text | `withdraw_reason_detail` | 직접입력 시 500자 |
|  | 계정 상태 | enum | `status` | 사용·미사용·탈퇴 |
|  | 삭제 여부 | bool | `is_deleted` | 오등록 삭제용, 논리 삭제 |
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
|  | 만료 시각 | datetime | `expires_at` | 1시간 |
|  | 사용 시각 | datetime | `used_at` | 로그인 성공 시 |
|  | 발급 용도 | enum | `purpose` | 임시비밀번호·초기비밀번호·비밀번호초기화 |
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
|  | 시도 시각 | datetime | `attempted_at` |  |

### 관리자 변경 이력 `admin_change_histories` · 이력

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 변경 이력 ID | id | `change_id` |  |
| FK | 대상 관리자 | id | `customer_id` |  |
|  | 변경 유형 | enum | `change_type` | 기본정보수정·상태변경·비밀번호변경·비밀번호초기화·탈퇴·삭제 |
|  | 변경 항목 | text | `field` | 이름·연락처·이메일·계정상태 등 |
|  | 변경 전 값 | text | `before_value` | 비밀번호는 저장 안 함 |
|  | 변경 후 값 | text | `after_value` | 비밀번호는 저장 안 함 |
| FK | 변경자 | id | `changed_by` | 본인 또는 관리자 |
|  | 변경 일시 | datetime | `changed_at` |  |

### 약관 동의 이력 `terms_agreement_histories` · 이력

관리자 계정의 약관 동의·재동의 이력을 기록한다. 약관 버전이 바뀌어 재동의하거나, 최초 가입 시 동의한 내역을 남긴다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 동의 이력 ID | id | `agreement_id` |  |
| FK | 관리자 | id | `customer_id` | customers FK |
| FK | 약관 버전 | id | `terms_version_id` | terms_versions FK |
|  | 동의 여부 | bool | `agreed` |  |
|  | 동의 일시 | datetime | `agreed_at` |  |
|  | 동의 경로 | enum | `channel` | 회원가입·재동의·약관변경 |
|  | 접속 IP | text | `ip_address` |  |

**관계**

- 관리자 계정 `1` -- `N` 관리자 접속 상태
- 관리자 계정 `1` -- `N` 임시 비밀번호
- 관리자 계정 `1` -- `N` 관리자 로그인 이력
- 관리자 계정 `1` -- `N` 관리자 변경 이력 (대상)
- 관리자 계정 `1` -- `N` 관리자 변경 이력 (변경자)
- 관리자 계정(가맹마스터) `1` -- `N` 관리자 계정(가맹관리자) · 연결
- 약관 버전 `1` -- `N` 관리자 계정 · 이용약관 동의
- 약관 버전 `1` -- `N` 관리자 계정 · 개인정보 동의
- 관리자 계정 `1` -- `N` 약관 동의 이력
- 약관 버전 `1` -- `N` 약관 동의 이력
- BP 코드 `1` -- `N` 관리자 계정 · BP 소속

---

## 마이페이지

로그인한 관리자 본인의 정보 관리(기본정보·사업자정보)·비밀번호 변경·회원 탈퇴를 다룬다. 사업자정보 탭은 BP 마스터에게만 보인다.

마이페이지는 별도 엔티티를 만들지 않는다. 기본정보 수정은 `customers` 테이블의 이름·연락처·이메일을 갱신하고, 사업자정보 수정은 `bp_codes` 테이블의 사업자정보 속성을 갱신하며, 비밀번호 변경은 `customers.password_hash`를 갱신한다. 모든 변경은 `admin_change_histories`에 이력을 남긴다. 회원 탈퇴는 `customers.status`를 '탈퇴'로 바꾸고 `withdrawn_at`·`withdraw_reason_code`를 기록하며, 같은 BP의 다른 계정을 미사용으로 전환하고 점포를 폐점한다.

---

## 점포관리

직영(일반점포)과 가맹(가맹점포)을 같은 구조로 다룬다. 상태는 미운영 -> 운영 -> 폐점 한 방향이고, 운영 전환은 사업자정보 인증 완료가 조건이다. 사업자정보는 `store_business_infos`, 층별정보(매장평수·좌석수·층수 등)는 `store_floor_infos` 테이블로 분리하여 관리한다.

### 점포 `stores` · 중심

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 점포 ID | id | `store_id` |  |
|  | 점포코드 | text | `store_code` | ST+6자리, 고유, 자동 채번, 변경 불가 |
| FK | BP | id | `bp_id` | 소속 BP, bp_codes FK |
|  | 점포유형 | enum | `store_type` | 일반점포·가맹점포, 변경 불가 |
|  | 점포명 | text | `name` | 1~50자, 필수 |
|  | 점포 연락처 | text | `phone` | 숫자 9~11자리 |
|  | 우편번호 | text | `zip_code` |  |
|  | 기본주소 | text | `address` |  |
|  | 상세주소 | text | `address_detail` |  |
|  | 위도 | decimal | `latitude` | 소수점 6자리 |
|  | 경도 | decimal | `longitude` | 소수점 6자리 |
|  | 근무지 반경 | int | `geofence_radius_m` | 50~1000m, 10m 단위, 기본 100m |
|  | 대표 이미지 경로 | text | `image_path` | JPG·PNG 5MB, 선택, 1장 |
|  | 폐점일 | date | `closed_on` | 폐점 전환일 자동 |
|  | 점포상태 | enum | `status` | 미운영·운영·폐점 |
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
|  | 층수 구분 | enum | `floor_type` | 지상·지하 |
|  | 층수 | int | `floor_number` |  |
|  | 삭제 여부 | bool | `is_deleted` |  |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` | customers FK |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` | customers FK |

### 점포 사업자정보 `store_business_infos` · 엔티티

점포의 사업자등록 정보를 관리하는 테이블이다. 점포와 1:1 관계이며, 사업자 번호 인증 전에는 행이 없을 수 있다. 인증 완료 여부는 별도 저장하지 않고 사업자등록번호 유무로 판정한다. 한 번 저장된 사업자등록번호는 바꿀 수 없으며, 바꾸려면 점포를 끝내고 새로 등록한다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK·FK | 점포 | id | `store_id` | stores FK, 1:1 |
|  | 상호명 | text | `biz_corp_name` | 직접 입력, 인증과 무관 |
|  | 사업자등록번호 | text | `biz_reg_no` | 미운영·운영 점포 간 플랫폼 전체 고유, 저장 후 변경 불가 |
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
|  | 변경 항목 | text | `field` | 점포명·점포상태·연락처 등 |
|  | 변경 전 값 | text | `before_value` |  |
|  | 변경 후 값 | text | `after_value` |  |
| FK | 변경자 | id | `changed_by` |  |
|  | 변경 일시 | datetime | `changed_at` |  |
|  | 보존 기한 | date | `retain_until` | 1년 보존 |

### 관리자 점포 매핑 `admin_store_mappings` · 엔티티

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
- 점포 `1` -- `N` 점포 변경 이력
- 관리자 계정 `1` -- `N` 관리자 점포 매핑
- 점포 `1` -- `N` 관리자 점포 매핑
- 관리자 계정 `1` -- `N` 점포 · 등록자
- 관리자 계정 `1` -- `N` 점포 변경 이력 · 변경자

---

## BP 마스터 계정 관리

플랫폼 사용자가 BP 마스터 계정을 등록·조회·수정·삭제하는 영역이다. BP 조직 정보는 `bp_codes` 테이블에서 관리된다.

이 영역은 `bp_codes` 테이블과 `customers` 테이블의 BP 마스터 행(role = BP마스터)을 다룬다. BP 조직 정보(상호명·사업자정보)는 `bp_codes`에, 계정 정보는 `customers`에 있다. 속성 상세는 인증·계정 섹션의 `bp_codes`·`customers` 테이블을 참조한다.

### BP 변경 이력 `bp_change_histories` · 이력

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 변경 이력 ID | id | `change_id` |  |
| FK | BP | id | `bp_id` | bp_codes FK |
|  | 변경 항목 | text | `field` | 상호명·BP상태·사업자정보 등 |
|  | 변경 전 값 | text | `before_value` |  |
|  | 변경 후 값 | text | `after_value` |  |
| FK | 변경자 | id | `changed_by` |  |
|  | 변경 일시 | datetime | `changed_at` |  |
|  | 비고 | text | `note` | 탈퇴 줄에만 탈퇴 사유 |

**관계**

- BP 코드 `1` -- `N` 관리자 계정 · BP 소속
- BP 코드 `1` -- `N` 점포 · 소속
- BP 코드 `1` -- `N` BP 변경 이력
- 관리자 계정 `1` -- `N` BP 변경 이력 · 변경자

---

## 환경설정 & 시스템관리

BP·플랫폼의 권한 그룹·공통코드·메뉴·휴일과 플랫폼 공식 휴일을 관리한다. 플랫폼 관리자 계정은 `customers` 테이블을 공유하고(역할이 플랫폼마스터·플랫폼관리자), 플랫폼 권한 그룹은 `role_groups`(bp_id=NULL), 공통코드는 `code_groups`·`code_items`, 메뉴는 `menus` 테이블을 공유한다.

### 권한 그룹 `role_groups` · 중심

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 권한 그룹 ID | id | `role_group_id` |  |
|  | 권한 코드 | text | `role_code` | 유형코드+6자리(BM000001 등), 고유, 변경 불가 |
| FK | BP | id | `bp_id` | bp_codes FK, 플랫폼 권한은 NULL |
|  | 권한 유형 | enum | `role_type` | BP마스터·BP관리자·가맹마스터·가맹관리자·플랫폼마스터·플랫폼관리자, 변경 불가 |
|  | 권한명 | text | `name` | 같은 BP 안 유형 무관 고유 |
|  | 설명 | text | `description` |  |
|  | 마스터 권한 여부 | bool | `is_master` | BM000001·FM000001·PM000001·PA000001 |
|  | 사용 상태 | enum | `status` | 사용·사용중지 |
| FK | 관리계정 | id | `manager_customer_id` | FA 그룹은 만든 가맹 마스터 |
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
| PK | 그룹 ID | id | `code_group_id` |  |
|  | 그룹 코드 | text | `group_code` | 대문자 밑줄, 예: EMP_TYPE, 고유, 변경 불가 |
|  | 그룹명 | text | `group_name` |  |
|  | 관리 주체 | enum | `ownership` | 플랫폼고정·플랫폼제공 |
|  | 설명 | text | `description` |  |
|  | 사용 상태 | enum | `status` | 사용·사용중지 |
|  | 표시 순서 | int | `sort_order` |  |
|  | 삭제 여부 | bool | `is_deleted` |  |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` | customers FK |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` | customers FK |

### 상세 코드 `code_items` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 상세코드 ID | id | `code_item_id` |  |
|  | 상세코드 | text | `value` | 같은 BP·같은 그룹 내 고유, 등록 후 변경 불가(서비스 코드 포함) |
| FK | 그룹 | id | `code_group_id` |  |
| FK | BP | id | `bp_id` | BP전용 코드만, 플랫폼 코드는 NULL |
|  | 코드명 | text | `label` |  |
|  | 관리 주체 | enum | `item_ownership` | 플랫폼고정·플랫폼제공·BP전용 |
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
| FK | 서비스 코드 | text | `service_code` | 공통코드 '서비스' 그룹의 코드 값 |
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

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 휴일 ID | id | `holiday_id` |  |
| FK | BP | id | `bp_id` | bp_codes FK |
|  | 적용 범위 | enum | `scope` | 전체점포·특정점포 |
|  | 휴일 시작날짜 | date | `start_date` |  |
|  | 휴일 종료날짜 | date | `end_date` | 하루짜리면 시작날짜와 같음 |
|  | 휴일명 | text | `name` | 30자 |
|  | 종일 여부 | bool | `is_all_day` |  |
|  | 설명 | text | `description` |  |
|  | 반복 규칙 | json | `repeat_rule` | 반복유형·주기·요일·종료조건 등 |
|  | 삭제 여부 | bool | `is_deleted` |  |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` |  |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` |  |

### 휴일 점포 매핑 `holiday_store_mappings` · 엔티티

BP 휴일이 적용되는 점포를 관리하는 매핑 테이블이다. 전체 점포 적용 시에도 개별 점포별로 행을 생성한다.

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK·FK | 휴일 | id | `holiday_id` | bp_holidays FK |
| PK·FK | 대상 점포 | id | `store_id` | stores FK |
| PK | 휴일 날짜 | date | `holiday_date` |  |
|  | 삭제 여부 | bool | `is_deleted` |  |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` | customers FK |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` | customers FK |

### BP 휴일 변경 이력 `bp_holiday_change_histories` · 이력

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 변경 이력 ID | id | `change_id` |  |
| FK | 휴일 | id | `holiday_id` |  |
|  | 변경 유형 | enum | `change_type` | 등록·수정·삭제 |
|  | 변경 항목 | text | `field` |  |
|  | 변경 전 값 | text | `before_value` |  |
|  | 변경 후 값 | text | `after_value` |  |
| FK | 변경자 | id | `changed_by` |  |
|  | 변경 일시 | datetime | `changed_at` |  |

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
- BP 휴일 `1` -- `N` BP 휴일 변경 이력
- 관리자 계정 `1` -- `N` BP 휴일 · 등록자
- 관리자 계정 `1` -- `N` BP 휴일 변경 이력 · 변경자
- 플랫폼 공식 휴일은 BP 휴일 캘린더에 조회용으로 표시됨 (데이터 참조는 없고 화면에서만 합침)
- 공통코드 그룹 '서비스' `1` -- `N` 메뉴 · 서비스 코드

### 플랫폼 공식 휴일 `public_holidays` · 엔티티

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 공식 휴일 ID | id | `public_holiday_id` |  |
|  | 날짜 | date | `holiday_date` | 한 날짜에 한 건 |
|  | 연도 | int | `year` |  |
|  | 휴일명 | text | `name` |  |
|  | 비고 | text | `note` |  |
|  | 동기화 배치 ID | text | `sync_batch_id` |  |
|  | 최종 동기화 일시 | datetime | `synced_at` |  |
|  | 삭제 여부 | bool | `is_deleted` |  |
|  | 등록 일시 | datetime | `created_at` |  |
| FK | 등록자 | id | `created_by` | customers FK |
|  | 최근 수정 일시 | datetime | `updated_at` |  |
| FK | 수정자 | id | `updated_by` | customers FK |

### 동기화 이력 `public_holiday_sync_histories` · 이력

| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |
|---|---|---|---|---|
| PK | 동기화 이력 ID | id | `sync_id` |  |
|  | 대상 연도 | int | `year` |  |
|  | 동기화 일시 | datetime | `synced_at` |  |
|  | 등록 건수 | int | `created_count` |  |
|  | 수정 건수 | int | `updated_count` |  |
|  | 삭제 건수 | int | `deleted_count` |  |
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
