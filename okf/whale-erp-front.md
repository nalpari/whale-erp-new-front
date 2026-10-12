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
generated: { by: claude-code/opus-5.5, at: 2026-10-08T02:00:00Z }
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
* `src/lib/api.ts` - [whale-erp-api](http://localhost:8000) 호출 틀. 세션 쿠키 읽기(`getSession`), `request()`·`ApiError`·Nest 오류 메시지 해석, `API_BASE_URL` 읽기, enum 조회(`getEnum`, 한 시간 캐시)가 있다. `next/headers` 를 써서 클라이언트 컴포넌트는 가져올 수 없다 — 값 타입과 한글 찾기(`EnumValue` · `labelOf`)는 `src/lib/enums.ts` 에 따로 둔다. 로그인·업무 호출은 각 화면이 이 틀 위에 더한다.
* `src/components/common/` - 2026 Whale ERP 1차수정 Figma 기준 공통 컴포넌트. `@/components/common` 에서 가져다 쓴다. 버튼·배지·입력칸·체크박스·라디오, 등록 폼(Field·FormRow·FormGroup·TextField·Textarea·DateField·SlidePanel), 목록(ListToolbar·DataTable·Pagination), 상세(DetailTable·DetailValues), 필터(FilterPanel·FilterSection), 헤더(GlobalHeader·ServiceLinks·AlarmLink·StoreSelect·UserPop), 제목 줄(PageBar). 헤더는 Figma Top2 안이 확정이라 그 한 벌만 둔다(이전 v1 헤더와 `variant` 분기는 삭제). 메뉴·점포·표 열 같은 값은 props 로 받는다. 밝은 테마와 글꼴은 `ErpRoot` 안에서만 적용되고, 색 토큰은 `globals.css` 의 `erp-*` 다. `DateField` 는 네이티브 달력을 디자인대로 못 바꿔 달력판을 직접 그린다. 필터 패널이 좁고 잘라내는 영역이라 판은 `popover` 로 최상위 레이어에 띄운다(그래서 `package.json` 의 browserslist 가 popover 지원 선이다). `autoHyphen` 을 켜면 숫자만 쳐도 YYYY-MM-DD 로 하이픈이 들어간다(기본 끔 — 2020-8-5 처럼 한 자리 달을 치는 칸이 깨지지 않게, 생년월일만 켠다). 날짜 계산은 `date-math.ts` 에 두고 `node --test src/components/common/date-math.test.ts` 로 확인한다.
* `src/app/contracts/` - 근로계약 관리 목록(`/contracts`). `GET /contracts` 를 부르고 필터 · 페이지는 주소 쿼리(`page` · `storeName` · `staffMemberName` · `status` 되풀이)에 둔다. 상태 한글은 `getEnum('ContractStatus')`. 관리자 로그인이 없어 세션이 없거나 토큰이 401 이면 표에 「로그인이 필요합니다」만 보인다. 쿼리 · 칸 표기는 `contract-list.ts` 에 두고 `node --test src/app/contracts/contract-list.test.ts` 로 확인한다. 행 끝 버튼(재발송 · 새 계약)은 아직 모양만이다. 「계약서 작성」은 `/contracts/new` 로 간다. 발송 대기 행의 상태 칸에는 판별한 초대 유형(예: 발송 대기 · 가입 초대, `getEnum('ContractDraftAction')`)이 붙는다. 임시저장 행은 「이어 쓰기」로 `/contracts/[contractId]/edit` 를 연다.
* `src/app/contracts/[contractId]/edit/` - 임시저장 이어 쓰기. 작성 화면과 같은 폼을 `GET /contracts/:contractId` 값으로 열고(`fromDetail`) `PUT` 으로 저장한다. 임시저장이 아니면 안내만 보이고, 없는 계약은 404. 근무지 · 한글 선택지는 두 화면이 `load-form-data.ts` 를 같이 쓴다.
* `src/app/contracts/new/` - 근로계약서 초안 작성. `docs/demo/staff/contracts-new` 를 공통 컴포넌트로 옮겼다. 근무지는 `GET /stores`, 저장은 서버 액션(`actions.ts`)이 `POST /contracts` 를 부르고 성공하면 목록으로 간다. api 의 400 · 404 · 409 문장을 그대로 보인다. 근무시간 · 휴게시간은 고른 요일 모두에 같게 들어가고 주 소정근로시간을 바로 셈한다. 만 19세 미만(계약 시작일 기준)이면 저장 버튼을 막는다. 주휴일 칸은 7일 근무를 협의하기 전까지 숨긴다(`hidden`). api 는 NULL 로 저장한다. 휴대전화번호는 칠 때 하이픈이 들어가고(010 은 3-4-4, 그 밖은 3-3-4) 저장은 숫자만, 생년월일은 `DateField autoHyphen`. 「임시저장」은 임시저장(DRAFT), 「초안 저장」은 발송 대기로 남기고 둘 다 아직 초대를 보내지 않는다. 임시저장은 이름 · 휴대전화번호 · 근무지 · 직무만 있으면 되고 비운 칸은 보내지 않는다(근로계약은 키만 NOT NULL). 근무 장소(계약서 조항) 칸이 있다. 목록은 비어 있는 기간 · 급여 · 상태를 「-」로 보인다. 종이 계약은 아직 없다(데모와 다른 점). 폼 로직은 `contract-form-model.ts` 에 두고 `node --test src/app/contracts/new/contract-form-model.test.ts` 로 확인한다.
* `src/app/design/` - 공통 컴포넌트 샘플. `/design` 은 컴포넌트를 하나씩, `/design/full` 은 점포정보 관리 목록을 조합해 보여 주고 신규 등록 버튼으로 등록 패널(RNB)을 연다. `/design/detail` 은 Figma 03.프레임_상세로, 목록의 계약서보기에서 들어가고 목록 버튼으로 돌아온다(`Button` 에 `href` 를 주면 같은 모양의 링크가 된다). 계약서보기 같은 글자 링크는 Figma Link_text 색인 `erp-link` 를 쓴다. 샘플 이동 메뉴는 화면 아래 가운데에 떠 있다. 더미 데이터는 `sample.tsx` 에 있다.
* `public/` - Static assets served at the site root. `public/icons/` 는 Figma 에서 내려받은 아이콘이다.

# API

whale-erp-api 를 호출한다. 주소는 `API_BASE_URL` 로 주입한다
(`.env.development` 는 `http://localhost:8000`, `.env.production` 은 비어 있고
배포 환경이 주입한다). 두 파일 모두 git 이 추적하지 않는다.

부르는 엔드포인트는 `GET /enums/{name}`(공개)과 `GET` · `POST /contracts` · `GET /stores`(관리자 토큰)다. 응답 타입은 openapi-typescript 생성 전이라 화면 옆에 손으로 옮겨 적었다(`contract-list.ts` 의 `ContractListItem`, `contract-form-model.ts` 의 `CreateContractBody`). api 의 견본(items·stock_movements·staff·customers)과 견본 로그인
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
```
