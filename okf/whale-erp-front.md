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
generated: { by: claude-code/opus-5, at: 2026-09-18T00:00:00Z }
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

* `src/app/` - App Router entry. `/` 는 `/items` 로 리다이렉트한다.
* `src/app/login/` - 로그인 화면과 서버 액션.
* `src/app/items/` - 품목 목록 (서버 컴포넌트).
* `src/lib/api.ts` - [whale-erp-api](http://localhost:8000) 클라이언트.
* `src/components/common/` - 2026 Whale ERP 1차수정 Figma 기준 공통 컴포넌트. `@/components/common` 에서 가져다 쓴다. 버튼·배지·입력칸·체크박스·라디오, 등록 폼(Field·FormRow·FormGroup·TextField·Textarea·SlidePanel), 목록(ListToolbar·DataTable·Pagination), 필터(FilterPanel·FilterSection), 헤더(GlobalHeader·StoreSelect·UserPop), 제목 줄(PageBar·ServiceLinks). 헤더는 Figma Top2 기준 v2(GlobalHeaderV2·ServiceLinksV2·AlarmLink·PageBarV2, StoreSelect·UserPop 은 `variant="v2"`)가 따로 있고 v1 도 그대로 쓸 수 있다. 메뉴·점포·표 열 같은 값은 props 로 받는다. 밝은 테마와 Pretendard 는 `ErpRoot` 안에서만 적용되고, 색 토큰은 `globals.css` 의 `erp-*` 다.
* `src/app/design/` - 공통 컴포넌트 샘플. `/design` 은 컴포넌트를 하나씩, `/design/full` 은 점포정보 관리 목록을 조합해 보여 주고, `/design/full-v2` 는 같은 화면을 헤더 v2 로 보여 주고 신규 등록 버튼으로 등록 패널(RNB)을 연다. 더미 데이터는 `sample.tsx` 에 있다.
* `public/` - Static assets served at the site root. `public/icons/` 는 Figma 에서 내려받은 아이콘이다.

# API

whale-erp-api 를 호출한다. 주소는 `API_BASE_URL` 로 주입한다
(`.env.development` 는 `http://localhost:8000`, `.env.production` 은 비어 있고
배포 환경이 주입한다). 두 파일 모두 git 이 추적하지 않는다.

| 호출 | 용도 |
|------|------|
| `POST /auth/customer/login` | 고객 로그인. `{accessToken, refreshToken, user}` 반환 |
| `POST /auth/logout` | 리프레시 토큰 폐기 |
| `GET /items?take=` | 품목 목록. 최대 200 |

JWT 액세스 토큰은 `httpOnly` 세션 쿠키에 담아 서버에서만 읽고, 매 호출에
`Authorization: Bearer` 로 싣는다. 리프레시 토큰은 쓰지 않는다 — 만료(15분)되면
다시 로그인한다.

# Commands

```bash
pnpm install    # deps
pnpm dev        # dev server
pnpm build      # production build
pnpm lint       # eslint
```
