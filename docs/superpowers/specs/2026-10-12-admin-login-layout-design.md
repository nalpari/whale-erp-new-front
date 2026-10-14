# 관리자 로그인 + 레이아웃 3종 설계

2026-10-12 · grill-me / brainstorming 세션에서 정함

## 목표

관리자 웹에 로그인 전 · ERP · 플랫폼 세 레이아웃을 세우고, 1팀 관리자 로그인 API(whale-erp-api)를 만들어
front 로그인 화면과 연결한다. 로그인하면 권한 유형에 따라 ERP 홈(`/home`) 또는 플랫폼 홈(`/platform`)으로 간다.

기준 화면: 데모 `home/index.html`(로그인 전), `config/admins.html`(로그인 후 ERP), `bp/index.html`(로그인 후 플랫폼).
정책 근거: front `okf/auth.md`, api `okf/api/auth.md`.

## 작업 위치

| 저장소 | 위치 | 브랜치 |
|---|---|---|
| front | `C:\workspace\.whale-erp-worktrees\whale-erp-new-front\petra` | `bulbasaur` |
| api | `C:\workspace\.whale-erp-worktrees\whale-erp-api\<명소>` (새 워크트리, `main` 기준) | 새 포켓몬 이름 |

푸시는 사용자가 요청할 때만 한다.

## 1. api — 관리자 로그인 (`src/auth`)

| 엔드포인트 | 내용 |
|---|---|
| `POST /auth/admin/login` | 본문 `{loginId, password, deviceIdentifier?}`. 판정 순서: 잠금 → 아이디·비밀번호(임시·초기 비밀번호 포함) → 계정 상태. 응답 `{accessToken, refreshToken, refreshTokenExpiresAt, admin: {adminAccountId, loginId, name, roleTypeCode, bpCode, isPasswordChangeRequired}}` |
| `POST /auth/admin/refresh` | 본문 `{refreshToken}`. 회전하지 않고 `refresh_last_used_at` 을 지금으로 밀어 1시간 연장. 미사용·삭제·탈퇴 계정이면 거절 |
| `POST /auth/admin/logout` | 이 기기 세션 하나만 revoke. 204 |
| `POST /auth/admin/temporary-passwords` | 본문 `{name, loginId, email}`. 일치하면 임시 비밀번호를 메일(`EMAIL_TEMP_PASSWORD`)로 보낸다. 일치 여부와 상관없이 같은 응답 |

정책(`okf/auth.md`):

- 아이디는 영문 또는 영문·숫자 4~20자.
- 연속 5회 실패 시 5분 잠금. 잠긴 동안은 아이디·비밀번호를 확인하지 않는다. 실패 횟수는 행 잠금(`FOR UPDATE`) 아래에서 센다 — 기존 `attempt-lock.ts` 를 쓴다.
- 없는 아이디 · 비밀번호 불일치 · 임시 비밀번호 불일치 · 탈퇴 계정은 같은 문구, 같은 응답 시간(더미 해시). 미사용 계정은 비밀번호까지 맞을 때만 이용 제한을 알린다.
- 접근 토큰 1시간. 갱신 토큰은 마지막 사용부터 1시간, 원문 대신 sha256 해시를 `admin_sessions` 에 저장. 기기별 세션.
- 임시 비밀번호: 12자, 1시간 유효, 계정당 1시간 5회(계정 기준), 다시 받으면 앞의 것은 바로 만료, 메일이 실패하면 활성화하지 않는다, 발급하면 잠금이 풀린다. 기존 비밀번호도 살아 있다.
- 기존 비밀번호로 먼저 들어오면 쓰지 않은 임시 비밀번호는 무효. 임시 비밀번호로 들어와 새 비밀번호를 정하면 둘 다 만료 — 이 후반은 강제 변경 작업에서 한다.
- `admin_login_logs` 에 성공·실패와 실패 사유(`LoginFailureReason`)를 남긴다. 없는 아이디는 `admin_account_id` 를 비워 남긴다.

가드 수정: `AdminUser` 에 `sid` 를 더하고, admin 토큰도 세션이 살아 있는지(`admin_sessions.revoked_at IS NULL`, 삭제 아님) 확인한다. 지금은 확인 없이 통과한다(`jwt-auth.guard.ts:61`).

재사용: `JwtAuthGuard`·`@Public`·`@UserTypes`·`@CurrentUser`, `attempt-lock`, `throttle`, `password`(scrypt), `MailService`.

테스트: 서비스 단위 테스트(판정 순서, 잠금, 임시 비밀번호 규칙, 가드 세션 확인), e2e(로그인 → 갱신 → 로그아웃, 임시 비밀번호 발급 → 로그인).
문서: `pnpm openapi:export` 로 `openapi/openapi.json` 갱신, api `okf/api/auth.md` 반영.

## 2. front — 레이아웃

```
src/app/
  layout.tsx                    루트 하나. <html lang="ko">, Pretendard. Geist 등 create-next-app 기본값 정리
  (public)/(site)/layout.tsx    ErpRoot + SiteNav + {children} + SiteFooter. 페이지 전체 스크롤
    page.tsx                    /         로그인 전 홈(빈 틀)
    login/page.tsx              /login    로그인 폼(데모 auth/login 과 같은 모양)
  (erp)/layout.tsx              ErpRoot + GlobalHeader(ERP 값). 100dvh, 최소 폭 1720px
    home/page.tsx               /home             PageBar + 빈 본문
    config/admins/page.tsx      /config/admins    PageBar「BP 관리자 관리」 + 빈 필터 + 빈 목록 카드
  (platform)/layout.tsx         ErpRoot + GlobalHeader(플랫폼 값)
    platform/page.tsx           /platform  플랫폼 홈. 지금은 /bp 로 redirect
    bp/page.tsx                 /bp        PageBar + 빈 본문
  design/…                      그대로
```

결정:

- 레이아웃은 **사람이 아니라 영역(URL)** 으로 나눈다. 플랫폼 사용자도 BP 를 골라 ERP 영역에 들어가므로(F-TLJOCK) 사람 기준 레이아웃은 정책과 어긋난다.
- 루트 레이아웃은 하나. 그룹마다 루트 레이아웃을 두면 그룹을 넘나들 때 전체를 다시 불러온다.
- 레이아웃에서 로그인 확인을 하지 않는다. 레이아웃은 화면 이동 때 다시 실행되지 않는다(Next 16 authentication 가이드).
- `PageBar` 는 각 page 가 그린다.
- 로그인 전 화면은 모두 사이트형(상단 메뉴 + 본문 + 푸터). 카드형 틀은 없앤다.
- 약관(이용약관·개인정보처리방침)은 로그인 화면과 푸터 모두 같은 팝업(640px)으로 연다.

새 파일:

| 파일 | 내용 |
|---|---|
| `src/components/site/site-nav.tsx` | 로그인 전 상단 메뉴(70px): 로고, 구획 메뉴 4개, LOGIN·도입문의·공지사항 |
| `src/components/site/site-footer.tsx` | 인터플러그 푸터. 약관 링크는 팝업 |
| `src/components/site/terms-link.tsx` | 약관 링크 + 팝업(네이티브 `<dialog>`) |
| `src/components/site/admin-frame.tsx` | ERP·플랫폼 공통 틀(100dvh, 1720px, GlobalHeader) |
| `src/lib/menus.ts` | ERP·플랫폼 메뉴 상수(`HeaderMenu[]`). 화면이 없는 메뉴는 `#`(`HeaderMenu` 의 href 가 필수) |
| `src/lib/terms.ts` | 약관 문구 두 가지. 출처 목업 `auth.js` TERMS |
| `src/lib/login-session.ts` | 헤더에 넣을 값. 이름·권한은 세션 쿠키에서, 점포 범위 목록은 견본(`shortcut:` 주석). `homeOf(roleTypeCode)`: PM·PA → `/platform`, 그 밖 → `/home` |

ERP·플랫폼 레이아웃은 같은 `GlobalHeader` 에 `menus`·`right` 만 달리 넣는다.
오른쪽은 `StoreSelect`·`ServiceLinks`·`AlarmLink`·`UserPop`. 사용자 메뉴의 내정보·비밀번호·회원 탈퇴는 항목만 있고 동작하지 않는다.

## 3. front — 로그인 연결 (BFF)

브라우저는 api 를 직접 부르지 않는다. Next 서버가 토큰을 httpOnly 쿠키에 들고 api 를 대신 부른다.

| 파일 | 내용 |
|---|---|
| `src/app/(public)/(site)/login/actions.ts` | 서버 액션. api 로그인 → 쿠키 `session` 에 `{accessToken, refreshToken, accessTokenExpiresAt, name, roleTypeCode, bpCode}` → `homeOf()` 로 redirect. 실패하면 api 문구를 폼 아래에 보인다 |
| `src/proxy.ts` | 쿠키만 보는 가벼운 확인. ERP·플랫폼 경로에 쿠키가 없으면 `/login`. 접근 토큰이 끝났으면 갱신해 쿠키를 다시 쓰고, 갱신이 실패하면 `/login`. BP 사용자가 플랫폼 경로에 오면 `/home` |
| 로그아웃 서버 액션 | api 로그아웃 → 쿠키 삭제 → `/login` |
| `src/lib/api.ts` | `Session` 을 위 쿠키 모양으로 넓힌다. 요청에 `Authorization: Bearer` 를 붙이는 헬퍼 |

API 응답 타입은 손으로 적는다(로그인·갱신 두 개). `openapi-typescript` 는 들이지 않는다 — 1팀 동의 대기 항목이고 이번엔 타입이 둘뿐이다. `shortcut:` 주석을 단다.

## 3-1. front — 로그인 정보 관리 (2026-10-13 추가)

2026-10-14: 2절의 `(erp)`·`(platform)` 레이아웃을 없앴다. 로그인 후 화면은 폴더로 묶지 않고 루트 layout 의 `AdminLayout`(`src/components/site/admin-layout.tsx`)이 주소가 공개 경로(`isPublicPath`)가 아니면 공통 틀을 씌운다 — proxy 의 로그인 요구와 같은 기준이다. 틀이 같고, 서비스마다 다른 것(메뉴·홈·오른쪽 선택기)은 탭의 서비스로 가른다. 3팀 화면도 틀 안이라 화면 안의 헤더·틀을 빼야 한다.

api 가 `GET /auth/admin/login-info`·`/public-bp-codes/{bpCode}/code-items`·`/bp-codes/{bpCodeId}/stores`·`/bp-codes/{bpCodeId}/code-items` 를 더해, 위의 `menus.ts`(메뉴 상수)·`login-session.ts`(견본 점포 목록)를 지우고 로그인 정보로 그린다.

정책: 메뉴·버튼·점포 선택지·공통코드는 로그인 때의 값을 쓰고 다시 로그인해야 바뀐다. 데이터 권한은 api 가 요청마다 본다. 403·404·메뉴에 없는 주소는 안내 후 브라우저 이전 화면(`history.back()`, 기록이 없으면 홈).

| 저장소 | 키 | 값 | 버리는 조건 |
|---|---|---|---|
| 쿠키 httpOnly | `session` | 토큰 · 접근 토큰 만료 시각 · 권한 유형. 만료 없음 | 로그아웃 · 갱신 401 |
| 쿠키 | `login-key` | 로그인마다 새 UUID | 로그아웃 |
| localStorage | `whale-erp:v1:login-info` | `{ loginKey, account, menus }` | loginKey 다름 |
| localStorage | `whale-erp:v1:login-bp-info` | `{ loginKey, bpCodeId, stores, codes }` — 자기 BP. 새 탭에 복사할 때만 읽는다 | loginKey 다름 |
| localStorage | `whale-erp:v1:selected-bp` | `{ loginKey, bpCodeId, bpCode, tradeName }` — 플랫폼 계정이 마지막으로 고른 BP | loginKey 다름 · 고른 BP 403/404 |
| sessionStorage | `whale-erp:v1:current-bp` | `{ loginKey, bpCodeId, bpCode, tradeName }` — 이 탭의 BP | loginKey 다르면 탭 값 전부 |
| sessionStorage | `whale-erp:v1:stores` · `codes` · `scope` | `{ bpCodeId, … }` — 화면은 이것만 읽는다 | bpCodeId 가 이 탭의 BP 와 다름 |

로그인 후 BP 데이터는 `bpCodeId` 로 구분한다. 로그인 전 공개 공통코드만 `bpCode` 로 부른다(운영·개발 DB 의 식별자가 달라서).

`SessionGate`(`src/components/site/session-gate.tsx`) 순서: login-key 확인(없으면 로그아웃) → login-info 가 없으면 BFF 로 받아 저장 → 이 탭의 BP 결정(`resolveBp`: 고객 BP 계정·플랫폼 화면은 자기 BP, 플랫폼 계정의 ERP 화면은 `?bp=` → current-bp → selected-bp → 자기 BP) → 점포·공통코드(자기 BP 면 login-bp-info 복사, 다른 BP 면 `/bp-codes/{bpCodeId}/…` 두 개) → 화면. 401 은 `/login`(login-key 쿠키가 없으면 로그아웃 서버 액션), 로그인 정보 403·404 는 안내 후 로그아웃, 다른 BP 403·404 는 안내 후 selected-bp 를 지우고 홈, 그 밖은 [다시 시도]. 탭의 BP(current-bp)는 점포·공통코드를 받은 뒤에 쓴다.

탭의 서비스(`serviceCode`: WHALE_ERP · PLATFORM)는 `current-bp` 에 BP 와 함께 둔다. BP·가맹 계정은 늘 ERP, 플랫폼 계정은 자기 BP 탭이 플랫폼이고 BP 선택기로 연 탭이 ERP 다. 탭 값이 없는 새 탭은 ?bp= → 주소가 속한 메뉴의 서비스(ERP 면 마지막으로 고른 BP, 그 밖은 자기 BP 의 플랫폼)로 정한다(`resolveTab`). 헤더 메뉴는 그 서비스의 메뉴만 2단계까지 그린다. 주소 판정은 그 서비스의 홈과, 그 서비스에서 조회 권한(read)이 있는 메뉴의 url 과 그 아래 주소만 열고 3단계까지 본다(`src/lib/menus.ts`) — BP 계정의 플랫폼 주소, 플랫폼 탭의 ERP 주소는 여기서 막힌다. 범위 선택기(전체·직영·가맹·점포 하나)는 ERP 화면에만 두고, 바꾸면 홈으로 간다. 플랫폼 화면의 BP 선택기는 BP 목록 API 가 생긴 뒤 만든다(고르면 selected-bp 저장 후 `/home?bp={bpCodeId}` 새 탭).

API 타입은 손으로 적는다(2026-10-13 결정, `src/lib/session.ts`).

## 4. 데모 (`docs/demo`, 1팀 파일만)

- `public.mjs` `authPage` 를 사이트형(`siteNav` + 본문 + `siteFoot`)으로 바꾼다. 로그인·찾기·가입·가입완료·강제 비밀번호 변경 화면이 따라 바뀐다. 흰 카드는 본문 안에 남는다.
- `siteFoot` 의 이용약관·개인정보처리방침을 `termsDialog` 팝업으로 바꾼다. 회원가입 동의 단계 팝업은 그대로.
- 링크가 끊기는 약관 전문 페이지 `auth/terms.mjs`(`terms.html`)를 지운다.

## 5. 확인

- api: `pnpm test`, `pnpm test:e2e`, `pnpm openapi:export`
- front: `pnpm install`(워크트리), `pnpm lint`, `pnpm build`
- Playwright: `/`, `/login`, `/home`, `/config/admins`, `/bp` 를 1720px 로 캡처해 데모와 헤더·푸터 비교. 데모 재빌드 후 auth 화면 캡처
- `whaleadmin` 임시 비밀번호 발급 → 로그인, BP 마스터 계정 로그인은 사용자가 직접 확인한다
- 바꾼 파일이 okf concept `sources` 에 있으면 concept 과 `okf/log.md` 를 고친다(두 저장소 모두)

## 하지 않는 것

- 강제 비밀번호 변경 팝업·API, `/find`·`/signup` 화면, 아이디 찾기
- 내정보·비밀번호·회원 탈퇴 슬라이드, 「BP 변경」 버튼과 팝업
- 개발용 시드(BP 마스터 계정은 사용자가 SQL 로 만든다)
- 로그인 전 홈 소개 내용, admins 목록 내용, 슬라이드 패널 `@panel` 슬롯
- `forbidden()`/`unauthorized()`(실험 기능), `openapi-typescript`
