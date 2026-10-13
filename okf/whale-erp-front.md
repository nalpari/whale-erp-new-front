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
generated: { by: claude-code/opus-5.5, at: 2026-10-13T00:48:45Z }
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
* `src/components/common/` - 2026 Whale ERP 1차수정 Figma 기준 공통 컴포넌트. `@/components/common` 에서 가져다 쓴다. 버튼·배지·꼬리표(Tag)·스위치(Toggle)·입력칸·체크박스·라디오, 확인창(ConfirmDialog, 네이티브 dialog), 토스트(`useToast()` — `toast("saved" | "updated" | "deleted")` 가 ‘저장되었습니다.’ · ‘수정되었습니다.’ · ‘삭제되었습니다.’ 를 하단 가운데에 3초 띄운다. ErpRoot 가 한 번만 두어 화면을 옮겨도 남는다), 등록 폼(Field·FormRow·FormGroup·TextField·Textarea·DateField·SlidePanel), 목록(ListToolbar·DataTable·Pagination — DataTable 은 rowState 로 고른 줄·추가 줄 바탕을, rowProps 로 줄 속성을 받는다), 상세(DetailTable·DetailValues), 필터(FilterPanel·FilterSection), 헤더(GlobalHeader·ServiceLinks·AlarmLink·StoreSelect·UserPop), 제목 줄(PageBar). 헤더는 Figma Top2 안이 확정이라 그 한 벌만 둔다(이전 v1 헤더와 `variant` 분기는 삭제). 메뉴·점포·표 열 같은 값은 props 로 받는다. 밝은 테마와 글꼴은 `ErpRoot` 안에서만 적용되고, 색 토큰은 `globals.css` 의 `erp-*` 다. `DateField` 는 네이티브 달력을 디자인대로 못 바꿔 달력판을 직접 그린다. 필터 패널이 좁고 잘라내는 영역이라 판은 `popover` 로 최상위 레이어에 띄운다(그래서 `package.json` 의 browserslist 가 popover 지원 선이다). 막힌 버튼은 흐리게(opacity 40) 두고, 값이 틀린 입력칸은 `aria-invalid` 로 빨간 테두리가 된다. 날짜 계산은 `date-math.ts` 에 두고 `node --test src/components/common/date-math.test.ts` 로 확인한다.
* `src/app/platform/` - 플랫폼 관리 화면. `layout.tsx` 가 헤더(메뉴는 `platform-menus.ts`, api 초기 데이터의 플랫폼 메뉴 URL)를 두고 각 화면이 제목 줄과 본문을 둔다. 첫 화면은 `/platform/system/codes`(플랫폼 공통코드 관리). 두 패널은 저장하지 않은 변경을 서로 지킨다 — 한쪽을 저장해 화면이 다시 그려져도 다른 쪽 입력값은 남고, [BP 적용]은 어느 패널에든 저장하지 않은 변경이 있으면 막힌다. 저장 · BP 적용 요청이 닿지 않거나 상세 코드 조회만 실패하면 오류 화면으로 넘기지 않고 그 패널에서 알린다. api 오류 문구는 400 · 404 · 409 만 그대로 보이고 401 · 403 은 고정 한국어 문구로 바꾼다. 로그인 전이라 사용자 이름·BP 선택은 비워 두었다.
* `src/lib/codes.ts` - 플랫폼 공통코드 데이터 함수(`getCodeGroups`·`getCodeItems`·`saveCodeGroups`·`saveCodeItems`·`applyCodeGroupToBps`). api `/code-groups` 를 부른다. api 는 플랫폼 관리자 토큰만 받는데 관리자 웹 로그인이 아직 없어, `src/lib/api.ts` 의 `authHeaders()` 가 세션이 없으면 개발 서버에서만 `.env.local` 의 `API_DEV_TOKEN`(whaleadmin 관리자 토큰, 12시간)을 싣는다. 이 토큰은 커밋하지 않고, 로그인이 생기면 지운다. 저장은 api 가 붙은 DB(로컬은 공용 개발 DB)에 그대로 쓴다. 입력 규칙은 `code-validation.ts`, 패널 초안의 바뀜 판정 · 저장 요청 만들기 · 409 문구 해석은 `code-drafts.ts` 에 두고 `pnpm test`(`node --test src/lib/*.test.ts`)로 확인한다. 임시 권한은 `current-permission.ts`(`?permission=view` 로 조회만).
* `src/lib/api-types.generated.ts` - api 의 `openapi/openapi.json` 에서 만든 요청·응답 타입. 손으로 고치지 않고 `pnpm openapi:types` 로 다시 만든다(`WHALE_API_DIR`, 기본 `../whale-erp-api`).
* `src/app/design/` - 공통 컴포넌트 샘플. `/design` 은 컴포넌트를 하나씩, `/design/full` 은 점포정보 관리 목록을 조합해 보여 주고 신규 등록 버튼으로 등록 패널(RNB)을 연다. `/design/detail` 은 Figma 03.프레임_상세로, 목록의 계약서보기에서 들어가고 목록 버튼으로 돌아온다(`Button` 에 `href` 를 주면 같은 모양의 링크가 된다). 계약서보기 같은 글자 링크는 Figma Link_text 색인 `erp-link` 를 쓴다. 샘플 이동 메뉴는 화면 아래 가운데에 떠 있다. 더미 데이터는 `sample.tsx` 에 있다.
* `public/` - Static assets served at the site root. `public/icons/` 는 Figma 에서 내려받은 아이콘이다.

# API

whale-erp-api 를 호출한다. 주소는 `API_BASE_URL` 로 주입한다
(`.env.development` 는 `http://localhost:8000`, `.env.production` 은 비어 있고
배포 환경이 주입한다). 두 파일 모두 git 이 추적하지 않는다.

지금 부르는 엔드포인트는 없다. api 의 견본(items·stock_movements·staff·customers)과 견본 로그인
(`POST /auth/customer/login`, `GET /items`)은 2026-10-07 api 와 함께 지웠다(재영 결정).
관리자 웹 로그인은 1팀이 새로 만든다.

JWT 액세스 토큰은 `httpOnly` 세션 쿠키(`session`)에 담아 서버에서만 읽고, 매 호출에
`Authorization: Bearer` 로 싣는 틀은 남겨 두었다. 쿠키를 굽는 쪽은 새 로그인이 맡는다.

# Commands

```bash
pnpm install    # deps
pnpm dev        # dev server
pnpm build      # production build
pnpm lint       # eslint
pnpm openapi:types  # api openapi.json → src/lib/api-types.generated.ts
```
