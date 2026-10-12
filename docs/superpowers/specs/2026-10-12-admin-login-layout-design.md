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
| `src/components/site/terms-dialog.tsx` | 약관 팝업(네이티브 `<dialog>`) |
| `src/lib/menus.ts` | ERP·플랫폼 메뉴 상수(`HeaderMenu[]`). 화면이 없는 메뉴는 href 없음 |
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
