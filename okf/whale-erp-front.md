---
type: Application
title: Whale ERP Frontend
description: Next.js 16 App Router frontend for Whale ERP.
resource: https://github.com/nalpari/whale-erp-new-front
tags: [erp, frontend, nextjs]
sources:
  - { id: package-json, resource: ../package.json, title: Dependency manifest }
  - { id: app-dir, resource: ../src/app, title: App Router entry }
  - { id: lib, resource: ../src/lib, title: 세션·영역 판정·api 호출 }
  - { id: proxy, resource: ../src/proxy.ts, title: 세션 확인·갱신 }
  - { id: common-components, resource: ../src/components/common, title: 공통 ERP 컴포넌트 }
generated: { by: claude-code/opus-5.5, at: 2026-10-13T09:00:00Z }
---

# Stack

| Piece      | Version | Notes                                   |
|------------|---------|-----------------------------------------|
| Next.js    | 16.3.3  | App Router, React Compiler enabled.     |
| React      | 19.2.8  | `react-dom` at the same version.        |
| TypeScript | ^5      | Strict config in `tsconfig.json`.       |
| Tailwind   | ^4      | Via `@tailwindcss/postcss`.             |
| pnpm       | 11.18.0 | `packageManager` 로 고정. npm 사용 금지. |

# Layout

* `src/app/` - App Router entry. 루트 layout 은 하나(`lang=ko`, Pretendard)이고 영역별 layout 은 route group 셋이다 — `(public)/(site)`(상단 메뉴+푸터, `/` 는 로그인 전 홈 자리표시, `/login`) · `(erp)`(`/home`, `/config/admins`) · `(platform)`(`/platform` 빈 홈, `/bp`). `(erp)`·`(platform)` 은 같은 틀(`src/components/site/admin-frame.tsx`)을 쓴다. 틀 안의 `SessionGate`(`session-gate.tsx`)가 로그인 정보와 이 탭의 BP·점포·공통코드를 준비할 때까지 로딩 화면을 보이고, 준비되면 `AdminHeader`(`admin-header.tsx`, login-info 의 menus 를 2단계까지)와 본문을 그린다. 영역 홈이 아니고 menus 에 없는 주소면 안내 후 `history.back()`(기록이 없으면 홈)이다. 훅 `useAccount`·`useMenus`·`useCan`·`useStores`·`useCodes`·`useCurrentBp`·`useScope` 로 화면이 읽는다. 영역은 URL 이 정하고(`src/lib/auth-routes.ts` 의 `areaOf`: `/`·`/login`·`/design` 은 public, `/platform`·`/bp`·`/system` 은 platform, 나머지는 모두 erp — 모르는 경로는 막는 쪽), 권한 유형 PM·PA 는 `/platform`, 그 밖은 `/home` 으로 간다(`homeOf`). GlobalHeader 로고는 아직 `/` 로 걸려 있다.
* `src/proxy.ts` - 쿠키만 보는 낙관적 확인. erp·platform 에 세션이 없으면 쿠키를 지우고 `/login`, BP·가맹 계정이 platform 에 오면 `/home`, 접근 토큰을 받은 지 10분이 지났으면(만료 50분 전부터) `POST /auth/admin/refresh`(5초 제한)로 쿠키를 새로 굽고(401 이면 쿠키를 지우고 `/login`, 그 밖의 실패는 접근 토큰이 아직 안 끝났으면 현재 쿠키로 계속하고 끝났으면 `/login`) — api 세션이 갱신 때만 연장되므로, 일찍 갱신해야 「마지막 사용부터 1시간」대로 쓰는 동안 끊기지 않는다. 서버 액션 요청(`next-action` 헤더)은 갱신하지 않는다(로그아웃의 쿠키 삭제와 겹치지 않게) —, 로그인한 채 `/login` 에 오면 홈으로 보낸다. `/api/*` 에 세션이 없으면 redirect 대신 401 JSON 을 준다. matcher 는 `_next/static`·`_next/image`·`icons/`·`favicon.ico`·루트 이미지 파일을 뺀다.
* `src/app/fonts.ts`, `src/app/fonts/` - Pretendard(400·500·600·800)를 저장소에 담아 쓴다. 변수는 루트 layout 의 `<html>` 에 달아야 `--font-erp` 가 채워진다.
* `src/lib/api.ts`, `src/lib/session.ts` - [whale-erp-api](http://localhost:8000) 호출 틀. `session.ts` 는 순수 모듈이다 — 세션 쿠키 `session`(httpOnly, lax, path `/`, 운영 secure, 만료 없음 — 브라우저를 닫으면 끝)에 접근·갱신 토큰, 접근 토큰 만료 시각, 로그인ID, 이름, 권한 유형, BP 코드를 JSON 으로 담고(`parseSession`·`sessionCookie`), 로그인·갱신·login-info·공통코드 응답 타입은 손으로 적었다(openapi-typescript 는 1팀 동의 대기, 2026-10-13 손으로 쓰기로 결정). 로그인마다 새로 만드는 `login-key` 쿠키(httpOnly 아님)도 여기 있다. `api.ts` 는 이를 다시 내보내며 `getSession`, `request()`·`ApiError`·Nest 오류 메시지 해석, `API_BASE_URL` 읽기를 둔다. `src/lib/browser-storage.ts` 는 로그인 정보를 브라우저에 두는 곳이다 — localStorage `whale-erp:login-info`{loginKey, account, menus} · `login-bp-info`{loginKey, bpCodeId, stores, codes} · `selected-bp`, sessionStorage(탭별) `whale-erp:current-bp`{loginKey, bpCodeId, bpCode, tradeName} · `stores` · `codes` · `scope`(범위 선택기 값). 공용 값은 loginKey 가 쿠키와 다르면, 탭 값은 bpCodeId 가 이 탭의 BP 와 다르면 버린다. BP 결정 순서는 `resolveBp`. `src/lib/bff.ts` 는 브라우저에서 `/api/*` 를 부르는 함수다.
* `src/app/actions.ts`, `src/app/(public)/(site)/login/` - 로그아웃 서버 액션(api 로그아웃 → `session`·`login-key` 쿠키 삭제 → `/login`)과 로그인 폼. 로그인 화면은 열릴 때 브라우저의 로그인 정보를 지운다. 로그인 서버 액션은 4xx 면 api 메시지를, 5xx·네트워크 오류면 연결 안내를 보이고, 아이디 저장은 localStorage 에만 둔다. 푸터·로그인의 약관 전문은 팝업이며(`src/lib/terms.ts` 는 `docs/mockup/assets/auth.js` 에서 옮긴 문구) 약관 전문 페이지는 없다.
* `src/components/common/` - 2026 Whale ERP 1차수정 Figma 기준 공통 컴포넌트. `@/components/common` 에서 가져다 쓴다. 버튼·배지·입력칸·체크박스·라디오, 등록 폼(Field·FormRow·FormGroup·TextField·Textarea·DateField·SlidePanel), 목록(ListToolbar·DataTable·Pagination), 상세(DetailTable·DetailValues), 필터(FilterPanel·FilterSection), 헤더(GlobalHeader·ServiceLinks·AlarmLink·StoreSelect·UserPop), 제목 줄(PageBar). 헤더는 Figma Top2 안이 확정이라 그 한 벌만 둔다(이전 v1 헤더와 `variant` 분기는 삭제). 메뉴·점포·표 열 같은 값은 props 로 받는다. 밝은 테마와 글꼴은 `ErpRoot` 안에서만 적용되고, 색 토큰은 `globals.css` 의 `erp-*` 다. `DateField` 는 네이티브 달력을 디자인대로 못 바꿔 달력판을 직접 그린다. 필터 패널이 좁고 잘라내는 영역이라 판은 `popover` 로 최상위 레이어에 띄운다(그래서 `package.json` 의 browserslist 가 popover 지원 선이다). 날짜 계산은 `date-math.ts` 에 두고 `node --test src/components/common/date-math.test.ts` 로 확인한다.
* `src/app/design/` - 공통 컴포넌트 샘플. `/design` 은 컴포넌트를 하나씩, `/design/full` 은 점포정보 관리 목록을 조합해 보여 주고 신규 등록 버튼으로 등록 패널(RNB)을 연다. `/design/detail` 은 Figma 03.프레임_상세로, 목록의 계약서보기에서 들어가고 목록 버튼으로 돌아온다(`Button` 에 `href` 를 주면 같은 모양의 링크가 된다). 계약서보기 같은 글자 링크는 Figma Link_text 색인 `erp-link` 를 쓴다. 샘플 이동 메뉴는 화면 아래 가운데에 떠 있다. 더미 데이터는 `sample.tsx` 에 있다.
* `public/` - Static assets served at the site root. `public/icons/` 는 Figma 에서 내려받은 아이콘이다.

# API

whale-erp-api 를 호출한다. 주소는 `API_BASE_URL` 로 주입한다
(`.env.development` 는 `http://localhost:8000`, `.env.production` 은 비어 있고
배포 환경이 주입한다). 두 파일 모두 git 이 추적하지 않는다.

지금 부르는 엔드포인트는 `POST /auth/admin/login`·`/auth/admin/refresh`·`/auth/admin/logout`(서버에서만), 그리고 BFF `src/app/api/[...path]/route.ts`(GET 만, 쿠키의 토큰을 붙여 대신 부르고 api 401 이면 세션 쿠키를 지운다)를 거쳐 화면이 부르는 `GET /auth/admin/login-info`(로그인마다 첫 탭에서 한 번)·`/bp-codes/{bpCodeId}/stores`·`/bp-codes/{bpCodeId}/code-items`(플랫폼 계정이 고른 다른 BP 의 탭)다. api 의 견본(items·stock_movements·staff·customers)과 견본 로그인
(`POST /auth/customer/login`, `GET /items`)은 2026-10-07 api 와 함께 지웠다(재영 결정).
JWT 액세스 토큰은 `httpOnly` 세션 쿠키(`session`)에 담아 서버에서만 읽고, 매 호출에
`Authorization: Bearer` 로 싣는다. 쿠키는 로그인 서버 액션과 `proxy.ts` 의 갱신이 굽는다.
아직 없는 것: 강제 비밀번호 변경 화면, 세션 만료 경고창. 로그인 이력에는 브라우저가 아니라 Next 서버의 IP 가 남는다.

# Commands

```bash
pnpm install    # deps
pnpm dev        # dev server
pnpm build      # production build
pnpm lint       # eslint
node --test src/lib/*.test.ts   # 영역 판정·세션 쿠키·탭 BP 결정
```
