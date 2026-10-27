# BP 마스터 계정 관리 화면 계획

**목표:** 플랫폼 메뉴 「BP 마스터 계정 관리」(`MN000203`, `/bp-masters`)를 만든다 — 목록 · 필터 · 엑셀, 상세 · 등록 · 수정 슬라이드 패널, 상태 변경 · 비밀번호 초기화 · 삭제 · 변경 이력.

**Plane 일감:** #411 목록 화면 · #416 상세 화면 · #418 삭제 확인 창 · #420 등록 화면 · #422 수정 화면 · #424 비밀번호 초기화 확인 창 (API 쪽 #415 · #419 · #423 등).

**짝 작업:** api 는 아래 「API 작업 지시서」를 api 세션에 따로 넘겨 병행한다. 지금 api main(3e5a224)에는 `/bp-codes` · `/bp-role-groups` 뿐이고 BP 마스터 관리 API 는 없다.

**작업 위치:** worktree `colosseum` · 브랜치 `meowth`(main `40cc59e5` 에서 분기).

## 근거

| 근거 | 쓰는 곳 |
|---|---|
| `okf/bp.md` (S-ALHCJS · S-GZDODB · S-PRRLMA · S-OJEYQJ · S-CQGGZS · F-EHHJLV · PL-OCJOFP · PL-EIMSQF · 쟁점 BP-1~8) | 규칙 · 문구 |
| 목업 `docs/mockup/bp/` (BP-6~8 은 2026-10-22 커밋 `576c7508` 로 반영) | 화면 내용 · 상태 · 팝업 |
| 데모 `docs/demo/bp/` | 생김새(컴포넌트 · 간격 · 색)만 |
| `src/app/platform-admins/` | 슬라이드 패널 틀 · 파일 구성 |
| `src/app/stores/` | 사업자 인증 · 주소 검색 · 엑셀 |

## 확정한 결정 (2026-10-22 재영)

| # | 주제 | 결정 |
|---|---|---|
| Q1 | API 담당 | api 는 따로 지시한다. 이 계획에 지시서를 담는다. |
| Q2 · Q10 | 화면 구조 | 슬라이드 패널. `/bp-masters` 한 화면, 상세 · 등록 · 수정은 464px 패널, 열린 상세는 `?bp=<bpCodeId>`. 플랫폼 관리자와 같은 틀(BP-6). |
| Q3 | 기준 문서 | 정책서 · 목업이 기준, 데모는 생김새만. 데모에 빠진 상태 · 팝업 · 문구는 정책서대로 채운다. |
| Q4 | 수정 일시 · 수정자 | 데모대로 상세에 넣는다(BP-7). `bp_codes.updated_at / updated_by`. |
| Q5 | 문서 수정 | 목업 수정 → `/okf-from-mockup bp`. Manyfast 는 아래 문안만 남기고 사용자가 반영한다. |
| Q6 | 엑셀 | 점포와 같게 — 즉시 생성(1만 건 미만) · 1분 제한 · 진행률 · 내려받기 이력. 1만 건 이상은 안내만. |
| Q7 | 소속 점포 | 수만 보인다. 점포 목록 연결은 나중에(BP-8). |
| Q8 | 착수 | api 와 병행. |
| Q9 | 임시 타입 | `src/lib/bp-masters.ts` 에 지시서대로 손으로 적고 `shortcut:` 주석. api openapi 가 main 에 들어오면 생성 타입으로 바꾼 뒤 머지. |
| Q11 | 패널 배치 | 상태 변경 · 초기화는 기본정보 그 줄 버튼, 하단 [닫기][삭제][수정][변경 이력], 이력은 팝업(페이지 나눔). |
| Q12 | 결과물 | front 브랜치 하나 · PR 하나(api 머지 전 draft). 커밋 순서: 문서 → 계획 → 화면. |
| Q13 | 탭 BP 경로 | 적용하지 않는다. 플랫폼 메뉴라 `/bp/{bpCodeId}` 장치(ERP 화면 전용) 대상이 아니다. |
| — | 등록 폼 길이 | 데모대로 기본정보 / 사업자정보 두 묶음으로 둔다. 실제 길이는 화면이 나온 뒤 본다. |

목록의 연락처 · 이메일, 등록자 · 등록 일시는 정책서대로 한 칸에 두 줄이다(데모의 분리 칸을 따르지 않는다). 아이디 규칙(영문 · 숫자 4~20자, 탈퇴 · 삭제 포함 고유)은 naming.md 「관리자 로그인ID」가 근거다.

## 파일

플랫폼 관리자 화면 파일을 하나씩 대응시켜 만든다.

| 새 파일 (`src/app/bp-masters/`) | 본뜰 곳 | 하는 일 |
|---|---|---|
| `page.tsx` | `platform-admins/page.tsx` | 목록 + `?bp=` 상세를 서버에서 함께 받음. 상세 404 는 패널 실패 띠 |
| `bp-masters-href.ts` (+test) | `admins-href.ts` | 검색 기준 · 검색어 · 상태(다중) · 인증 여부 · 페이지 · 건수 ↔ 주소 |
| `bp-masters-screen.tsx` | `admins-screen.tsx` | 필터 · 목록 · 패널 여닫기, 포커스 복귀 |
| `bp-master-filter.tsx` | `admin-filter.tsx` | 검색 기준 select + 검색어, 상태 체크 3종, 사업자 인증 3택 |
| `bp-master-table.tsx` | `admin-table.tsx` | 9칸(두 줄 칸 2개), 탈퇴 행 "탈퇴로 삭제됨", 미인증 행 번호 빈칸 |
| `bp-master-detail-panel.tsx` | `admin-detail-panel.tsx` | 기본정보 · 사업자정보 읽기 전용, 상태 · 초기화 · 삭제 팝업, 상태 띠, 등록 완료 띠 |
| `bp-master-form-panel.tsx` | `admin-form-panel.tsx` + `stores/store-form-view.tsx` 사업자 영역 | 등록 · 수정 공용. 아이디 중복 확인, 사업자 인증 펼침 · 완료 카드 · 재인증 확인, 주소 검색 |
| `history-dialog.tsx` | `platform-admins/history-dialog.tsx` | 변경 이력 팝업(페이지 나눔, 탈퇴 줄에 사유) |
| `bp-master-excel.tsx` · `excel/route.ts` | `stores/store-excel.tsx` · `stores/excel/route.ts` | 진행률 · 429 · 400 안내, 토큰 붙여 중계 |
| `actions.ts` · `error.tsx` | `platform-admins/actions.ts` | 서버 액션(등록 · 수정 · 상태 · 초기화 · 삭제 · 인증) |
| `src/lib/bp-masters.ts` | `src/lib/platform-admins.ts` | 데이터 접근. 임시 타입은 `shortcut:` 주석 |

메뉴 주소는 DB 가 이미 `/bp-masters` 다(api 마이그레이션 `20261019144438`). 버튼은 `usePagePermission` 으로 가른다 — 등록 create, 수정 · 상태 변경 · 비밀번호 초기화 update, 삭제 delete.

## 화면 내용 (정책서 기준, 데모에 빠진 것 포함)

**목록**
- 필터: 검색 기준(BP 코드 · 아이디+이름 · 상호명 · 사업자등록번호) + 검색어, 상태 사용 · 미사용 · 탈퇴(처음엔 모두), 사업자정보 인증(전체 · 인증완료 · 미인증). 모두 AND
- 칸: BP 코드 · 아이디 · 이름 · 연락처/이메일(두 줄) · 상태 · 상호명 · 사업자등록번호 · 가입경로 · 등록자/등록 일시(두 줄)
- 등록 일시 내림차순, 20 · 50 · 100건(기본 20)
- 결과 없음 "일치하는 BP가 없습니다.", 하단 안내 문구(미인증 기준 · 탈퇴 검색 제한 · 엑셀 범위)
- 엑셀 상태: 생성 중 N% · 1분 제한 · 1만 건 이상 · 실패

**상세 패널**
- 제목: 상호명 + 상태 배지. 미사용 · 탈퇴 띠, 등록 직후 "BP를 등록했습니다 · BP 코드 · 메일 주소" 띠(BP-3)
- 기본정보: BP 코드, 아이디, 이름, 연락처, 이메일, 비밀번호 [초기화], BP 상태 + 바뀐 일시 [상태 변경], 소속 점포 수, 가입경로, 등록 일시 · 등록자, 수정 일시 · 수정자, 최근 로그인, 약관 동의, 강제 비밀번호 변경
- 사업자정보: 인증 배지, 상호명, 번호, 대표자명, 대표자 연락처 · 이메일, 개업일자, 주소, 업태 · 종목, 최종 인증 일시. 미인증이면 6항목 "-"
- 하단 [닫기][삭제][수정][변경 이력]. 삭제는 조건 미충족이면 흐리게 + 말풍선 이유. 탈퇴 BP 는 수정 · 초기화 · 삭제 · 상태 변경 없음

**팝업**
- 상태 변경: 사용→미사용(하위 관리자 있음 / 없음 두 문구), 미사용→사용
- 비밀번호 초기화 확인 → 완료 / 메일 발송 실패(다시 초기화 안내)
- 계정 삭제 확인
- 변경 이력(변경 일시 · 변경자 · 항목 · 전 · 후, 빈 상태, 안내 문구)
- 재인증 확인(등록 · 수정 모두)

**등록 · 수정 패널**
- 필수: 아이디 · 이름 · 연락처 · 이메일 · 상호명. 아이디 중복 확인, 이메일 형식 · 중복
- 사업자 인증은 [사업자 번호 인증하기]로 펼침(데모처럼 처음부터 펼치지 않음). 인증하면 읽기 전용 완료 카드, [재인증]은 확인 한 번
- 번호 중복 · 확인 불가 · 처리 오류면 문구를 보이고 인증 없이 저장 가능
- 주소: 검색으로 우편번호 · 기본주소, 상세주소 직접 입력
- 수정: BP 코드 · 아이디 · 가입경로 읽기 전용, 상태 + 적용 일시 표시만, 재인증 결과는 저장해야 반영, 실패 띠

## API 작업 지시서

api 세션에 그대로 붙여 넣는 문안이다. front 는 이 필드 이름으로 임시 타입을 적는다. 이름을 바꾸면 양쪽에 알린다.

```
## 작업: BP 마스터 계정 관리 API (메뉴 MN000203, 화면 /bp-masters)

근거: whale-erp-front okf/bp.md (BP-1~8, S-ALHCJS · S-GZDODB · S-PRRLMA · S-OJEYQJ · S-CQGGZS · F-EHHJLV · PL-OCJOFP · PL-EIMSQF).
모듈: src/bp-masters/ (bp-masters.controller.ts · bp-masters.service.ts · dto/). 기존 /bp-codes 는 그대로 둔다.
가드: 플랫폼 계정(PM·PA)만. MN000203 메뉴 권한 — 조회 GET, 등록 POST /bp-masters, 수정 PUT · status · password-reset · business-verifications, 삭제 DELETE.
대상: bp_codes 중 is_platform = false, is_deleted = false. BP 1 : BP 마스터(role_type_code = 'BM') 1.
본뜰 곳: src/platform-admins/ (temp-password.ts · platform-admin-mail.ts · histories), src/admin-signup/ (nextBpCode · BusinessVerificationService).
끝나면 pnpm openapi:export 로 openapi/openapi.json 을 커밋한다.

### 1. GET /bp-masters — 목록
query: page(1부터), pageSize(20|50|100, 기본 20),
       searchType = BP_CODE | LOGIN_ID_NAME | TRADE_NAME | BIZ_REGISTRATION_NUMBER, keyword,
       statuses = ACTIVE,INACTIVE,WITHDRAWN (쉼표, 없으면 전체),
       verification = VERIFIED | UNVERIFIED (없으면 전체; 인증 = biz_verified_at IS NOT NULL)
정렬: bp_codes.created_at DESC, bp_code_id DESC
응답: { items: BpMasterSummary[], total }
BpMasterSummary {
  bpCodeId, bpCode, loginId,
  name | null, phone | null, email | null,   // 탈퇴 BP 는 null (front 가 "탈퇴로 삭제됨")
  accountStatus: 'ACTIVE'|'INACTIVE'|'WITHDRAWN',
  tradeName, bizRegistrationNumber | null,
  joinPath: 'SIGNUP'|'PLATFORM_REGISTERED',
  createdAt, createdByName | null
}
- 탈퇴 BP 는 이름으로 찾히지 않는다(LOGIN_ID_NAME 에서 아이디만 맞춘다).

### 2. GET /bp-masters/{bpCodeId} — 상세 (지웠거나 플랫폼 BP 면 404)
BpMasterDetail = BpMasterSummary + {
  adminAccountId,
  statusChangedAt | null,
  bizCeoName, bizOpenDate(YYYY-MM-DD), bizCeoPhone, bizCeoEmail,
  bizZipCode, bizAddress, bizAddressDetail, bizCategory, bizItem, bizVerifiedAt   (모두 nullable)
  storeCount,            // 폐점 · 삭제 제외
  subAdminCount,         // 이 BP 의 BA · FM · FA 중 삭제 안 된 계정 수
  lastLoginAt | null, termsAgreedAt | null, isPasswordChangeRequired,
  updatedAt, updatedByName | null,     // bp_codes.updated_at / updated_by
  deletion: { isDeletable: boolean, reasons: string[] }   // 화면 말풍선 문구 그대로
}
삭제 조건: 상태 사용·미사용 AND last_login_at 없음 AND subAdminCount = 0 AND 등록 점포(삭제 안 된 것) 0.

### 3. GET /bp-masters/{bpCodeId}/histories?page&pageSize — 변경 이력
응답 { items: [{ changedAt, field(한글 항목명), beforeValue, afterValue, changedByName, note }], total }, 최신순.
bp_change_histories 와 그 BP 마스터의 admin_change_histories 를 합쳐 보인다. note 는 탈퇴 줄의 탈퇴 사유만.
사유는 받지 않는다. 비밀번호 초기화는 이력에 넣지 않는다(mail_send_logs 에 남음).

### 4. GET /bp-masters/login-id-availability?loginId — { available }
/platform-admins 와 같은 규칙(영문 · 숫자 4~20자, 탈퇴 · 삭제 포함 전체 admin_accounts 에서 고유).

### 5. POST /bp-masters/business-verifications — 사업자 진위확인
body { bizRegistrationNumber, bizCeoName, bizOpenDate, bpCodeId? }   // 수정 화면은 bpCodeId 를 보내 자기 BP 를 중복에서 뺀다
응답 { verificationToken }  (10분)
409 번호 중복 · 422 국세청 불일치 · 503 국세청 장애. BusinessVerificationService 를 재사용하고
isBizRegistrationNumberTaken 에 제외할 bpCodeId 인자를 더한다. 중복 검사를 국세청보다 먼저 한다.

### 6. POST /bp-masters — 등록
body { loginId, name, phone, email, tradeName,
       bizCeoPhone?, bizCeoEmail?, bizZipCode?, bizAddress?, bizAddressDetail?, bizCategory?, bizItem?,
       verificationToken? }      // 번호 · 대표자명 · 개업일자는 토큰에서만 꺼낸다
응답 { bpCodeId, bpCode, email, isMailSent }
한 트랜잭션: bp_codes(ACTIVE, nextBpCode 재사용 — 삭제한 순번 재사용 안 함) + admin_accounts(BM, BP 마스터 기본 권한 그룹,
join_path PLATFORM_REGISTERED, 약관 미동의, is_password_change_required = true) + 초기 비밀번호(temp_passwords, 1시간).
커밋 뒤 메일 EMAIL_BP_REGISTER. 메일 실패해도 등록은 남고 isMailSent = false.
409: 아이디 · 이메일 중복(PL-OCJOFP), 토큰 번호 중복(트랜잭션 안에서 다시 검사).

### 7. PUT /bp-masters/{bpCodeId} — 수정
body { name, phone, email, tradeName, bizCeoPhone?, bizCeoEmail?, bizZipCode?, bizAddress?, bizAddressDetail?,
       bizCategory?, bizItem?, verificationToken? }
- updatedAt 비교(409) 없음 — 마지막 저장이 남는다(S-CQGGZS).
- 탈퇴 BP 는 409. 아이디 · BP 코드 · 가입경로 · 상태는 바꾸지 않는다.
- 토큰이 있으면 세 값 + biz_verified_at 갱신, 없으면 그대로.
- 계정 칸만 바뀌어도 bp_codes.updated_at / updated_by 를 갱신한다(상세의 수정 일시 표시).
- 바뀐 칸마다 이력 한 줄.

### 8. POST /bp-masters/{bpCodeId}/status — 상태 변경
body { status: 'ACTIVE' | 'INACTIVE' }   응답 204
- INACTIVE: bp_codes + 그 BP 의 BM · BA · FM · FA 전부 INACTIVE, 한 트랜잭션. 선행 조건 검사 없음, 세션 · 비밀번호 그대로.
- ACTIVE: bp_codes + BM 만 ACTIVE. 나머지 계정은 그대로.
- status_changed_at 갱신, 이력. WITHDRAWN 은 받지 않고 탈퇴 BP 는 409.

### 9. POST /bp-masters/{bpCodeId}/password-reset — 비밀번호 초기화
응답 { isMailSent }. 12자 무작위, 메일 EMAIL_PASSWORD_RESET 로만, 1시간 만료, is_password_change_required = true,
기존 비밀번호 즉시 무효, 세션 유지. 탈퇴 BP 는 409. temp-password.ts 재사용.

### 10. DELETE /bp-masters/{bpCodeId} — 삭제
2번의 조건을 서버에서 다시 본다. 못 지우면 409 + 이유. bp_codes · admin_accounts 를 함께 is_deleted = true,
login_id 는 남겨 다시 못 쓴다. 응답 204.

### 11. GET /bp-masters/excel?(1번과 같은 조건) — 엑셀
/stores/excel 과 같은 방식: 한 사람 1분 1회(429), 1만 건 이상 400, 조건 없음 허용.
목록 항목 + BP 사업자정보 전체. 연락처 · 대표자 연락처만 가린다. 내려받은 사람 · 일시 · 조건 · 건수를 남긴다.
1만 건 이상 예약 생성(메일 링크)은 이번 범위 밖.

### 오류 형식
Nest 기본 { statusCode, message, error } 그대로. message 는 화면에 그대로 보일 한글 문장.
```

## Manyfast 문안 (사용자가 직접 반영)

| 명세 | 바꿀 문장 |
|---|---|
| `S-GZDODB` | "상태 변경은 상세의 제목줄 버튼" → "상태 변경 · 비밀번호 초기화는 기본정보의 그 줄 버튼, 삭제 · 수정 · 변경 이력은 하단 버튼" |
| `S-GZDODB` | "변경 이력 표" → "[변경 이력] 버튼으로 여는 팝업(페이지 나눔)" |
| `S-GZDODB` | 기본정보에 "수정 일시 · 수정자(BP 또는 BP 마스터 계정을 마지막으로 고친 시각과 사람)" 추가 |
| `S-GZDODB` | 소속 점포 수를 누르면 점포 목록으로 가는 문장 → "소속 점포 수만 보인다(점포 목록 연결은 나중에)" |
| `S-ALHCJS` 외 3건 | 화면 형태를 "목록 위로 밀려 나오는 슬라이드 패널"로 |

## 작업 순서

1. ~~워크트리~~ — `colosseum` · `meowth` (완료)
2. ~~커밋 1 · 문서~~ — 목업 수정 → `/okf-from-mockup bp` (`576c7508`, 완료)
3. 커밋 2 · 계획 — 이 문서. api 세션에 「API 작업 지시서」를 넘긴다.
4. 데이터 접근 — `src/lib/bp-masters.ts`, 임시 타입(`shortcut:`), 주소 조건 `bp-masters-href.ts` + 테스트.
5. 목록 — 필터 · 표 · 페이지 · 건수 · 엑셀.
6. 상세 패널 — 읽기 전용 표, 상태 · 초기화 · 삭제 팝업, 이력 팝업, 띠.
7. 등록 · 수정 패널 — 폼 검증, 아이디 중복, 사업자 인증 · 재인증, 주소 검색.
8. draft PR — `pnpm lint` · 타입체크 · 테스트 통과, 리뷰를 먼저 받는다.
9. api 머지 후 — `openapi-typescript` 로 `api-types.generated.ts` 재생성, 임시 타입 → 생성 타입, 실제 api 로 화면 확인, okf `sources` · log 갱신, draft 해제 후 머지.

## 남긴 것과 위험

- **미룬 것:** 소속 점포 → 점포 목록 연결(BP-8, `/bp-switch` 에 이동할 곳을 받는 방식이 후보), 엑셀 1만 건 이상 예약 생성(점포와 함께).
- **계약 어긋남:** 병행이라 api 가 필드 이름을 바꾸면 front 임시 타입이 조용히 틀린다. 9단계에서 생성 타입으로 바꿀 때 타입 오류로 드러나므로 그 전에 머지하지 않는다.
- **이력 합치기:** BP 이력과 BP 마스터 계정 이력이 두 테이블이다. 지시서 3번에 api 가 합쳐 달라고 적었다.
- **등록 폼 길이:** 464px 패널에 계정 4칸 + 사업자 9칸 + 인증 카드가 들어가 세로로 길다. 데모대로 두 묶음으로 두고 화면이 나온 뒤 본다.
- **확인 안 한 것:** 데모의 `erp.js` 동작, Manyfast 원문(okf 인용만 봄) — 화면 작업 전에 본다.
