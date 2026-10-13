---
type: Application
title: Whale ERP Frontend
description: Next.js 16 App Router frontend for Whale ERP.
resource: https://github.com/nalpari/whale-erp-new-front
tags: [erp, frontend, nextjs]
sources:
  - { id: package-json, resource: ../package.json, title: Dependency manifest }
  - { id: app-dir, resource: ../src/app, title: App Router entry }
  - { id: common-components, resource: ../src/components/common, title: 공통 ERP 컴포넌트 }
generated: { by: claude-code/opus-5.5, at: 2026-10-13T02:30:00Z }
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

* `src/app/` - App Router entry. `/` 는 `/design`(공통 컴포넌트 견본)으로 리다이렉트한다. 관리자 웹 로그인은 1팀이 새로 만들고, 생기면 첫 화면을 그쪽으로 바꾼다.
* `src/app/fonts.ts`, `src/app/fonts/` - Pretendard(400·500·600·800)를 저장소에 담아 쓴다. 변수는 루트 layout 의 `<html>` 에 달아야 `--font-erp` 가 채워진다.
* `src/lib/api.ts` - [whale-erp-api](http://localhost:8000) 호출 틀. 세션 쿠키 읽기(`getSession`), `request()`·`ApiError`·Nest 오류 메시지 해석, `API_BASE_URL` 읽기만 있다. 로그인·업무 호출은 각 화면이 이 틀 위에 더한다.
* `src/components/common/` - 2026 Whale ERP 1차수정 Figma 기준 공통 컴포넌트. `@/components/common` 에서 가져다 쓴다. 버튼·배지·입력칸·체크박스·라디오, 등록 폼(Field·FormRow·FormGroup·TextField·Textarea·DateField·SlidePanel), 목록(ListToolbar·DataTable·Pagination), 상세(DetailTable·DetailValues), 필터(FilterPanel·FilterSection), 헤더(GlobalHeader·ServiceLinks·AlarmLink·StoreSelect·UserPop), 제목 줄(PageBar). 헤더는 Figma Top2 안이 확정이라 그 한 벌만 둔다(이전 v1 헤더와 `variant` 분기는 삭제). 메뉴·점포·표 열 같은 값은 props 로 받는다. 바꿀 수 없는(disabled) 입력칸은 바탕이 `erp-thead-bg`(#f8f9fb)라 입력 가능한 칸과 갈린다(2026-10-12, 1팀 영역 전체). 밝은 테마와 글꼴은 `ErpRoot` 안에서만 적용되고, 색 토큰은 `globals.css` 의 `erp-*` 다. `DateField` 는 네이티브 달력을 디자인대로 못 바꿔 달력판을 직접 그린다. 필터 패널이 좁고 잘라내는 영역이라 판은 `popover` 로 최상위 레이어에 띄운다(그래서 `package.json` 의 browserslist 가 popover 지원 선이다). 날짜 계산은 `date-math.ts` 에 두고 `node --test src/components/common/date-math.test.ts` 로 확인한다.
* `src/app/design/` - 공통 컴포넌트 샘플. `/design` 은 컴포넌트를 하나씩, `/design/full` 은 점포정보 관리 목록을 조합해 보여 주고 신규 등록 버튼으로 등록 패널(RNB)을 연다. `/design/detail` 은 Figma 03.프레임_상세로, 목록의 계약서보기에서 들어가고 목록 버튼으로 돌아온다(`Button` 에 `href` 를 주면 같은 모양의 링크가 된다). 계약서보기 같은 글자 링크는 Figma Link_text 색인 `erp-link` 를 쓴다. 샘플 이동 메뉴는 화면 아래 가운데에 떠 있다. 더미 데이터는 `sample.tsx` 에 있다.
* `src/app/auth/` - 로그인 전 화면(1팀). 지금은 `/auth/signup`(BP 회원가입: 기본정보·사업자정보 인증(선택)·약관동의·제출)과 `/auth/signup-done`(가입 완료)뿐이다. 디자인 기준은 `docs/demo/src/pages/auth/`. 아이디·이메일은 칸을 벗어날 때 api 로 중복을 확인하고, 제출 전에 확인을 못 마친 칸을 다시 확인해 가입 요청이 중복으로 거절되지 않게 한다. 사업자정보 "인증하기"는 국세청 진위확인 연동 전이라 빈 칸과 사업자등록번호 형식(숫자 10자리, 숫자만 입력)만 보고, api `SignupDto` 가 사업자정보를 받지 않아 가입 요청에는 싣지 않는다. 로그인 화면이 아직 없어 그리로 가는 자리(로고·로그인 링크·웨일ERP 시작하기)는 개발 예정 안내창(디자인 시스템 dialog, body 로 포털)을 띄운다(`_components/login-pending.tsx`). 가입 완료 화면은 상호명·아이디·이메일을 URL 쿼리로 받고 메일·10분 안내는 문구만 있다 — 백엔드(가입 세션·메일 발송)가 나오면 바꾼다(2026-10-12 결정).
* `public/` - Static assets served at the site root. `public/icons/` 는 Figma 에서 내려받은 아이콘이다.

# API

whale-erp-api 를 호출한다. 주소는 `API_BASE_URL` 로 주입한다
(`.env.development` 는 `http://localhost:8000`, `.env.production` 은 비어 있고
배포 환경이 주입한다). 두 파일 모두 git 이 추적하지 않는다.

지금 부르는 엔드포인트는 회원가입 셋이다 — `POST /auth/signup`(가입, 중복이면 409),
`POST /auth/signup/login-id-availability`·`POST /auth/signup/email-availability`(중복 확인, `{ available }`).
셋 다 api main 에 아직 없다(api petra 워크트리에서 작업 중). api 의 견본(items·stock_movements·staff·customers)과
견본 로그인(`POST /auth/customer/login`, `GET /items`)은 2026-10-07 api 와 함께 지웠다(재영 결정).
관리자 웹 로그인은 1팀이 새로 만든다.

JWT 액세스 토큰은 `httpOnly` 세션 쿠키(`session`)에 담아 서버에서만 읽고, 매 호출에
`Authorization: Bearer` 로 싣는 틀은 남겨 두었다. 쿠키를 굽는 쪽은 새 로그인이 맡는다.

# Commands

```bash
pnpm install    # deps
pnpm dev        # dev server
pnpm build      # production build
pnpm lint       # eslint
```
