# bpmaster 로그인 응답 정리

확인: 2026-10-14, 로컬 api(`whale-erp-api` santorini · 브랜치 snorlax, http://localhost:8000). 토큰 값은 가렸다.

로그인하면 api 를 두 번 부른다.

1. `POST /auth/admin/login` — 로그인 서버 액션이 부른다. 토큰은 httpOnly `session` 쿠키에만 담고 브라우저 스크립트에는 넘기지 않는다.
2. `GET /auth/admin/login-info` — 로그인 후 첫 탭의 SessionGate 가 BFF(`/api/auth/admin/login-info`)로 한 번 부른다. 결과를 브라우저 저장소에 나눠 담는다.

## 1. POST /auth/admin/login

```json
{
  "accessToken": "<가림>",
  "refreshToken": "<가림>",
  "refreshTokenExpiresAt": "2026-10-14T07:50:55.516Z",
  "account": {
    "adminAccountId": 168,
    "loginId": "bpmaster",
    "name": "BP마스터테스트용",
    "roleTypeCode": "BM",
    "bp": {
      "bpCodeId": 8,
      "bpCode": "BP000007",
      "tradeName": "BPMaster_커피",
      "isPlatform": false
    },
    "isPasswordChangeRequired": false
  }
}
```

| 필드 | 값 | 쓰는 곳 |
|---|---|---|
| `accessToken` | (가림) | `session` 쿠키. BFF·서버 컴포넌트가 Bearer 로 붙인다 |
| `refreshToken` | (가림) | `session` 쿠키. proxy 가 만료 50분 전부터 갱신에 쓴다 |
| `refreshTokenExpiresAt` | 2026-10-14T07:50:55.516Z | 쓰지 않는다(쿠키는 만료 없음, 끊기면 proxy 가 /login 으로) |
| `account.roleTypeCode` | BM | `session` 쿠키 + 로그인 후 이동(BM → `/home`) |
| `account` 나머지 | | 쓰지 않는다 — 화면은 login-info 의 account 를 쓴다 |

## 2. GET /auth/admin/login-info

최상위 키: `account` · `menus` · `stores` · `codes`

### account

```json
{
  "adminAccountId": 168,
  "loginId": "bpmaster",
  "name": "BP마스터테스트용",
  "email": "bpmaster@test.co.kr",
  "roleTypeCode": "BM",
  "bp": {
    "bpCodeId": 8,
    "bpCode": "BP000007",
    "tradeName": "BPMaster_커피",
    "isPlatform": false
  },
  "isPasswordChangeRequired": false,
  "temporaryPasswordExpiresAt": null,
  "isTermsAgreementRequired": false
}
```

| 필드 | 뜻 |
|---|---|
| `adminAccountId` · `loginId` · `name` · `email` | 계정. 헤더 사용자 이름은 `name (권한 이름)` |
| `roleTypeCode` | 권한 유형 BM(BP 마스터). 권한 이름은 공통코드 `ROLE_TYPE` 에서 찾는다 |
| `bp` | 소속 BP. `isPlatform` false = 고객 BP → 탭 서비스는 늘 `WHALE_ERP` |
| `isPasswordChangeRequired` · `temporaryPasswordExpiresAt` · `isTermsAgreementRequired` | 강제 비밀번호 변경 팝업과 남은 시간·약관 동의 표시 |

### menus — 21개(1단계 5개)

권한은 R(조회)·C(등록)·U(수정)·D(삭제). 하위 메뉴로 가는 길로만 들어온 상위 메뉴는 R 이 없다.

| 메뉴 | 단계 | 코드 | url | 서비스 | 권한 |
|---|---|---|---|---|---|
| 점포관리 | 1 | `MN000001` | — | WHALE_ERP | R--- |
| &nbsp;&nbsp;점포 정보 관리 | 2 | `MN000002` | `/stores` | WHALE_ERP | RCUD |
| 직원관리 | 1 | `MN000004` | — | WHALE_ERP | R--- |
| &nbsp;&nbsp;직원 정보 관리 | 2 | `MN000005` | `/staff` | WHALE_ERP | RCUD |
| &nbsp;&nbsp;근로계약 관리 | 2 | `MN000006` | — | WHALE_ERP | R--- |
| &nbsp;&nbsp;&nbsp;&nbsp;계약 목록 | 3 | `MN000007` | `/staff/contracts` | WHALE_ERP | RCUD |
| &nbsp;&nbsp;&nbsp;&nbsp;근로계약서 초안 작성 | 3 | `MN000008` | `/staff/contracts/new` | WHALE_ERP | RCUD |
| &nbsp;&nbsp;급여명세서 관리 | 2 | `MN000009` | `/staff/payrolls` | WHALE_ERP | RCUD |
| &nbsp;&nbsp;근무스케줄 관리 | 2 | `MN000010` | `/staff/schedules` | WHALE_ERP | RCUD |
| &nbsp;&nbsp;출·퇴근 현황 조회 | 2 | `MN000025` | `/staff/attendance` | WHALE_ERP | RCUD |
| &nbsp;&nbsp;TO-DO 리스트 관리 | 2 | `MN000026` | `/staff/todos` | WHALE_ERP | RCUD |
| 고객지원 | 1 | `MN000034` | — | WHALE_ERP | R--- |
| &nbsp;&nbsp;공지사항 | 2 | `MN000035` | `/support/notices` | WHALE_ERP | RCUD |
| &nbsp;&nbsp;문의하기 | 2 | `MN000036` | `/support/inquiries` | WHALE_ERP | RCUD |
| 운영 알림 | 1 | `MN000041` | — | WHALE_ERP | R--- |
| &nbsp;&nbsp;알림함 | 2 | `MN000042` | `/notifications` | WHALE_ERP | RCUD |
| 환경설정 | 1 | `MN000011` | — | WHALE_ERP | R--- |
| &nbsp;&nbsp;BP 관리자 관리 | 2 | `MN000012` | `/settings/admins` | WHALE_ERP | RCUD |
| &nbsp;&nbsp;BP 권한 그룹 관리 | 2 | `MN000013` | `/settings/roles` | WHALE_ERP | RCUD |
| &nbsp;&nbsp;BP 공통코드 관리 | 2 | `MN000014` | `/settings/codes` | WHALE_ERP | RCUD |
| &nbsp;&nbsp;BP 휴일 관리 | 2 | `MN000015` | `/settings/holidays` | WHALE_ERP | RCUD |

### stores — 11개

| storeId | storeCode | 이름 | 유형 | 상태 |
|---|---|---|---|---|
| 7 | ST900001 | 테스트 강남점 | DIRECT | OPERATING |
| 18 | ST900012 | 테스트 김포 스타벅스 | DIRECT | NOT_OPERATING |
| 16 | ST900010 | 테스트 부산서면점 | FRANCHISE | OPERATING |
| 15 | ST900009 | 테스트 수원점 | FRANCHISE | OPERATING |
| 10 | ST900004 | 테스트 신촌점 | FRANCHISE | OPERATING |
| 14 | ST900008 | 테스트 여의도점 | DIRECT | OPERATING |
| 8 | ST900002 | 테스트 역삼점 | DIRECT | OPERATING |
| 12 | ST900006 | 테스트 잠실점 | FRANCHISE | OPERATING |
| 11 | ST900005 | 테스트 종로점 | DIRECT | OPERATING |
| 13 | ST900007 | 테스트 판교점 | FRANCHISE | OPERATING |
| 9 | ST900003 | 테스트 홍대점 | FRANCHISE | OPERATING |

### codes — 그룹 19개

모양은 `{ 그룹코드: [{ value, label, order }] }`. 앞 6개만 적었다.

| 그룹 | 개수 | 값(라벨) |
|---|---|---|
| `SERVICE` | 12 | WHALE_ERP(Whale ERP), PLATFORM(Whale ERP 플랫폼 관리), POS(POS), KIOSK(KIOSK), TABLE_ORDER(Table Order), PICK_UP_ORDER(Pick Up Order) … |
| `ROLE_TYPE` | 6 | PM(플랫폼 마스터), PA(플랫폼 관리자), BM(BP 마스터), BA(BP 관리자), FM(가맹 마스터), FA(가맹 관리자) |
| `ACCOUNT_STATUS` | 3 | ACTIVE(사용), INACTIVE(미사용), WITHDRAWN(탈퇴) |
| `JOIN_PATH` | 2 | SIGNUP(회원가입), PLATFORM_REGISTERED(플랫폼등록) |
| `WITHDRAW_REASON` | 6 | WD_CLOSE(폐업·사업 종료), WD_SWITCH(다른 서비스 이용), WD_COST(비용 부담), WD_FEATURE(기능 부족), WD_HARD(이용이 어려움), WD_INPUT(직접입력) |
| `TERMS_TYPE` | 6 | TERMS_SERVICE(이용약관(BP 사업자 회원가입용)), PRIVACY_COLLECT(개인정보 수집·이용 동의(BP 사업자 회원가입용)), STAFF_TERMS_SERVICE(이용약관(직원 근무 앱 회원가입용)), STAFF_PRIVACY(개인정보 수집·이용 동의(직원 근무 앱 회원가입용)), MARKETING(마케팅 수신 동의), LOCATION(위치정보 수집·이용 동의) |
| `FLOOR_TYPE` | 2 | GROUND(지상), BASEMENT(지하) |
| `STORE_STATUS` | 3 | NOT_OPERATING(미운영), OPERATING(운영), CLOSED(폐점) |
| `STORE_TYPE` | 2 | DIRECT(직영점포), FRANCHISE(가맹점포) |
| `MANAGE_OWNER` | 3 | PLATFORM_FIXED(플랫폼고정), PLATFORM_PROVIDED(플랫폼제공), BP_ONLY(BP전용) |
| `HOLIDAY_TYPE` | 3 | DAY(하루), PERIOD(기간), REPEAT(반복) |
| `HOLIDAY_REPEAT_TYPE` | 4 | DAILY(매일), WEEKLY(매주), MONTHLY(매월), YEARLY(매년) |
| `BANK` | 25 | B002(KDB산업은행), B003(IBK기업은행), B004(KB국민은행), B007(Sh수협은행), B011(NH농협은행), B012(지역농축협) … |
| `FAQ_CATEGORY` | 4 | ACCOUNT(가입·계정), STAFF_LABOR(직원·근로), BILLING(요금·구독), STORE_FACILITY(점포·설비) |
| `INQUIRY_CATEGORY` | 5 | ACCOUNT(가입·계정), STAFF_LABOR(직원·근로), BILLING(요금·구독), STORE_FACILITY(점포·설비), ETC(기타) |
| `INDUSTRY` | 5 | CAFE(카페·음료), RESTAURANT(음식점), BAKERY(베이커리·디저트), PUB(주점), ETC(기타) |
| `PLAN_PERIOD` | 4 | WITHIN_1M(1개월 안), WITHIN_3M(3개월 안), UNDECIDED(아직 정하지 않음), WITHIN_6M(6개월 안) |
| `AAAAA` | 0 |  |
| `BBB` | 1 | AB233(3333) |

## 3. 브라우저에 담는 곳

| 저장소 | 키(`whale-erp:v1:` 접두) | 담는 것 |
|---|---|---|
| localStorage | `login-info` | `{ loginKey, account, menus }` |
| localStorage | `login-bp-info` | `{ loginKey, bpCodeId, stores, codes }` — 새 탭에 복사할 때만 읽는다 |
| sessionStorage | `current-bp` | `{ loginKey, serviceCode: "WHALE_ERP", bpCodeId: 8, bpCode, tradeName }` |
| sessionStorage | `stores` · `codes` · `scope` | 이 탭 BP 의 점포·공통코드·범위 선택값 |

화면은 `useAccount` · `useService` · `useMenus` · `useCurrentBp` · `useStores` · `useCodes` · `useScope` · `useMenuRole` 로 꺼내 쓴다.
