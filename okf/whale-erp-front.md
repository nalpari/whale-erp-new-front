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
generated: { by: claude-code/opus-5.5, at: 2026-10-13T07:17:41Z }
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
* `src/app/fonts.ts`, `src/app/fonts/` - Pretendard(400·500·600·800, 비로그인 화면용 700)를 저장소에 담아 쓴다. 변수는 루트 layout 의 `<html>` 에 달아야 `--font-erp` 가 채워진다.
* `src/lib/api.ts` - [whale-erp-api](http://localhost:8000) 호출 틀. 세션 쿠키 읽기(`getSession`), `request()`·`ApiError`·Nest 오류 메시지 해석, `API_BASE_URL` 읽기, enum 조회(`getEnum`, 한 시간 캐시)가 있다. `next/headers` 를 써서 클라이언트 컴포넌트는 가져올 수 없다 — 값 타입과 한글 찾기(`EnumValue` · `labelOf`)는 `src/lib/enums.ts` 에 따로 둔다. 로그인·업무 호출은 각 화면이 이 틀 위에 더한다.
* `src/components/common/` - 2026 Whale ERP 1차수정 Figma 기준 공통 컴포넌트. `@/components/common` 에서 가져다 쓴다. 버튼·배지·꼬리표(Tag)·스위치(Toggle)·입력칸·체크박스·라디오, 확인창(ConfirmDialog, 네이티브 dialog), 토스트(`useToast()` — `toast("saved" | "updated" | "deleted")` 가 ‘저장되었습니다.’ · ‘수정되었습니다.’ · ‘삭제되었습니다.’ 를 하단 가운데에 3초 띄운다. ErpRoot 가 한 번만 두어 화면을 옮겨도 남는다), 등록 폼(Field·FormRow·FormGroup·TextField·Textarea·DateField·SlidePanel), 목록(ListToolbar·DataTable·Pagination — DataTable 은 rowState 로 고른 줄·추가 줄 바탕을, rowProps 로 줄 속성을 받는다), 상세(DetailTable·DetailValues), 필터(FilterPanel·FilterSection), 헤더(GlobalHeader·ServiceLinks·AlarmLink·StoreSelect·UserPop), 제목 줄(PageBar). 헤더는 Figma Top2 안이 확정이라 그 한 벌만 둔다(이전 v1 헤더와 `variant` 분기는 삭제). 메뉴·점포·표 열 같은 값은 props 로 받는다. 밝은 테마와 글꼴은 `ErpRoot` 안에서만 적용되고, 색 토큰은 `globals.css` 의 `erp-*` 다. `DateField` 는 네이티브 달력을 디자인대로 못 바꿔 달력판을 직접 그린다. 필터 패널이 좁고 잘라내는 영역이라 판은 `popover` 로 최상위 레이어에 띄운다(그래서 `package.json` 의 browserslist 가 popover 지원 선이다). 막힌 버튼은 흐리게(opacity 40) 두고, 값이 틀린 입력칸은 `aria-invalid` 로 빨간 테두리가 된다. `autoHyphen` 을 켜면 숫자만 쳐도 YYYY-MM-DD 로 하이픈이 들어간다(기본 끔 — 2020-8-5 처럼 한 자리 달을 치는 칸이 깨지지 않게, 생년월일만 켠다). 날짜 계산은 `date-math.ts` 에 두고 `node --test src/components/common/date-math.test.ts` 로 확인한다.
* `src/app/contracts/` - 근로계약 관리 목록(`/contracts`). `GET /contracts` 를 부르고 필터 · 페이지는 주소 쿼리(`page` · `storeName` · `staffMemberName` · `status` 되풀이)에 둔다. 상태 한글은 `getEnum('ContractStatus')`. 관리자 로그인이 없어 세션이 없거나 토큰이 401 이면 표에 「로그인이 필요합니다」만 보인다. 쿼리 · 칸 표기는 `contract-list.ts` 에 두고 `node --test src/app/contracts/contract-list.test.ts` 로 확인한다. 행 끝 버튼 칸은 없앴고 직원 이름을 누르면 상세(`/contracts/[contractId]`)로 간다 — 임시저장만 상세를 거치지 않고 이어 쓰기(`/contracts/[contractId]/edit`)로 바로 간다. 고용 형태 칸(`getEnum('EmploymentType')`)이 있고, 급여는 고용 형태와 상관없이 시급이라 「11,600 /h」로 보인다. 「계약서 작성」은 `/contracts/new` 로 간다. 발송 대기 행의 상태 칸에는 판별한 초대 유형(예: 발송 대기 · 가입 초대, `getEnum('ContractDraftAction')`)이 붙는다. 상태별 버튼은 상세로 옮겼다.
* `src/app/contracts/[contractId]/` - 근로계약 상세. `GET /contracts/:contractId` 로 계약 내용(주휴일 빼고)과 상태 변경 이력을 보인다. 위쪽 제목 줄에 상태별 버튼과 「목록」이 선다 — 임시저장은 「이어 쓰기」(`edit/`), 발송 대기 「초대 재발송」, 서명 대기 · 만료 「재발송」, 서명 완료 「새 계약」(재발송 · 새 계약은 API 가 없어 비활성), 거부 · 종료는 없음. 급여 칸 이름은 늘 「시급」이다. 칸 표기는 `detail-format.ts`, `node --test "src/app/contracts/[contractId]/detail-format.test.ts"`.
* `src/app/contracts/[contractId]/edit/` - 임시저장 이어 쓰기. 작성 화면과 같은 폼을 `GET /contracts/:contractId` 값으로 열고(`fromDetail`) `PUT` 으로 저장한다. 임시저장이 아니면 안내만 보이고, 없는 계약은 404. 임시저장 삭제는 여기에만 있다 — 폼 위쪽 버튼 줄의 취소와 임시저장 사이(`ContractForm` 의 `deleteButton`). 공통 `ConfirmDialog` 로 한 번 더 묻고 서버 액션(`../actions.ts`)이 `DELETE /contracts/:contractId` 를 부른 뒤 목록으로 간다. 실패하면 확인창 안에 이유를 보인다. 근무지 · 한글 선택지는 두 화면이 `load-form-data.ts` 를 같이 쓴다.
* `src/app/contracts/new/` - 근로계약서 초안 작성. `docs/demo/staff/contracts-new` 를 공통 컴포넌트로 옮겼다. 근무지는 `GET /stores`, 저장은 서버 액션(`actions.ts`)이 `POST /contracts` 를 부르고 성공하면 목록으로 간다. api 의 400 · 404 · 409 문장을 그대로 보인다. 근무시간 · 휴게시간은 고른 요일 모두에 같게 들어가고 주 소정근로시간을 바로 셈한다. 만 19세 미만(계약 시작일 기준)이면 저장 버튼을 막는다. 주휴일 칸은 7일 근무를 협의하기 전까지 숨긴다(`hidden`). api 는 NULL 로 저장한다. 휴대전화번호는 칠 때 하이픈이 들어가고(010 은 3-4-4, 그 밖은 3-3-4) 저장은 숫자만, 생년월일은 `DateField autoHyphen`. 「임시저장」은 임시저장(DRAFT), 「초안 저장」은 발송 대기로 남기고 둘 다 아직 초대를 보내지 않는다. 임시저장은 이름 · 휴대전화번호 · 근무지 · 직무만 있으면 되고 비운 칸은 보내지 않는다(근로계약은 키만 NOT NULL). 근무 장소(계약서 조항) 칸이 있다. 목록은 비어 있는 기간 · 급여 · 상태를 「-」로 보인다. 종이 계약은 아직 없다(데모와 다른 점). 폼 로직은 `contract-form-model.ts` 에 두고 `node --test src/app/contracts/new/contract-form-model.test.ts` 로 확인한다.
* `src/app/platform/` - 플랫폼 관리 화면. `layout.tsx` 가 헤더(메뉴는 `platform-menus.ts`, api 초기 데이터의 플랫폼 메뉴 URL)를 두고 각 화면이 제목 줄과 본문을 둔다. 첫 화면은 `/platform/system/codes`(플랫폼 공통코드 관리). 두 패널은 저장하지 않은 변경을 서로 지킨다 — 한쪽을 저장해 화면이 다시 그려져도 다른 쪽 입력값은 남고, [BP 적용]은 어느 패널에든 저장하지 않은 변경이 있으면 막힌다. 저장 · BP 적용 요청이 닿지 않거나 상세 코드 조회만 실패하면 오류 화면으로 넘기지 않고 그 패널에서 알린다. api 오류 문구는 400 · 404 · 409 만 그대로 보이고 401 · 403 은 고정 한국어 문구로 바꾼다. 로그인 전이라 사용자 이름·BP 선택은 비워 두었다.
* `src/lib/codes.ts` - 플랫폼 공통코드 데이터 함수(`getCodeGroups`·`getCodeItems`·`saveCodeGroups`·`saveCodeItems`·`applyCodeGroupToBps`). api `/code-groups` 를 부른다. api 는 플랫폼 관리자 토큰만 받는데 관리자 웹 로그인이 아직 없어, `src/lib/api.ts` 의 `authHeaders()` 가 세션이 없으면 개발 서버에서만 `.env.local` 의 `API_DEV_TOKEN`(whaleadmin 관리자 토큰, 12시간)을 싣는다. 이 토큰은 커밋하지 않고, 로그인이 생기면 지운다. 저장은 api 가 붙은 DB(로컬은 공용 개발 DB)에 그대로 쓴다. 입력 규칙은 `code-validation.ts`, 패널 초안의 바뀜 판정 · 저장 요청 만들기 · 409 문구 해석은 `code-drafts.ts` 에 두고 `pnpm test`(`node --test src/lib/*.test.ts`)로 확인한다. 임시 권한은 `current-permission.ts`(`?permission=view` 로 조회만).
* `src/lib/api-types.generated.ts` - api 의 `openapi/openapi.json` 에서 만든 요청·응답 타입. 손으로 고치지 않고 `pnpm openapi:types` 로 다시 만든다(`WHALE_API_DIR`, 기본 `../whale-erp-api`).
* `src/app/design/` - 공통 컴포넌트 샘플. `/design` 은 컴포넌트를 하나씩, `/design/full` 은 점포정보 관리 목록을 조합해 보여 주고 신규 등록 버튼으로 등록 패널(RNB)을 연다. `/design/detail` 은 Figma 03.프레임_상세로, 목록의 계약서보기에서 들어가고 목록 버튼으로 돌아온다(`Button` 에 `href` 를 주면 같은 모양의 링크가 된다). 계약서보기 같은 글자 링크는 Figma Link_text 색인 `erp-link` 를 쓴다. `/design/guest` 는 Figma 「로그인전_Main」(8QSOuwFFBfCbFWR6RBUlps · 1:2)을 옮긴 비로그인 메인으로, 관리자 디자인 시스템과 따로 `guest-*` 색 토큰(globals.css)과 `public/guest/` 에셋, 영문 글꼴(REM·Inter Tight·Inter, `design/guest/fonts.ts`)을 쓴다. FAQ 는 네이티브 `details` 로 여닫는다. 비로그인 화면들은 `design/guest/layout.tsx` 가 머리말(스크롤해도 위에 붙는 sticky)·푸터를 함께 두고, 공용 조각은 `guest-ui.tsx` 에 있다. `/design/guest/store-operations` 는 Figma 「로그인전_Sub」(1:688) 매장운영 소개 화면으로, 샘플 이동 메뉴에는 넣지 않고 비로그인 머리말의 매장운영 메뉴와 메인의 매장운영 카드·버튼으로 들어간다. `/design/guest/add-on-services` 는 Figma 「로그인전_부가서비스」(1:1083)로, 머리말의 부가 서비스 메뉴·메인의 부가서비스 카드와 「부가서비스 둘러보기」·매장운영의 「부가서비스 전체 보기」로 들어간다. 두 화면이 함께 쓰는 아이콘은 `guest-icons.tsx` 에 있다. 샘플 이동 메뉴는 화면 아래 가운데에 떠 있다. 더미 데이터는 `sample.tsx` 에 있다.
* `public/` - Static assets served at the site root. `public/icons/` 는 Figma 에서 내려받은 아이콘이다.

# API

whale-erp-api 를 호출한다. 주소는 `API_BASE_URL` 로 주입한다
(`.env.development` 는 `http://localhost:8000`, `.env.production` 은 비어 있고
배포 환경이 주입한다). 두 파일 모두 git 이 추적하지 않는다.

부르는 엔드포인트는 `GET /enums/{name}`(공개)과 `GET` · `POST` · `PUT` · `DELETE /contracts` · `GET /stores`(관리자 토큰)다. 응답 타입은 openapi-typescript 생성 전이라 화면 옆에 손으로 옮겨 적었다(`contract-list.ts` 의 `ContractListItem`, `contract-form-model.ts` 의 `CreateContractBody`). api 의 견본(items·stock_movements·staff·customers)과 견본 로그인
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
