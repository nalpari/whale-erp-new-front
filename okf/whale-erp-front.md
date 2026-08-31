---
type: Application
title: Whale ERP Frontend
description: Next.js 16 App Router frontend for Whale ERP.
resource: https://github.com/nalpari/whale-erp-new-front
tags: [erp, frontend, nextjs]
sources:
  - { id: package-json, resource: ../package.json, title: Dependency manifest }
  - { id: app-dir, resource: ../src/app, title: App Router entry }
generated: { by: claude-code/opus-5, at: 2026-08-31T04:16:36Z }
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
* `public/` - Static assets served at the site root.

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
