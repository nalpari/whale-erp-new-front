# TO-DO 관리 화면 계획

**목표:** 관리자 웹에 TO-DO 리스트 관리(`/todos`) 목록·등록·수정·상세를 만들고, 직원 상세의 TO-DO 영역을 채운다.

**Plane 일감:** #116 목록 화면 · #117 등록·수정 화면 · #118 직원 상세의 TO-DO 영역 (부모 #109)

**짝 문서:** api `docs/plans/2026-10-19-todos.md` (브랜치 `feature/todos`) · staff `docs/plans/2026-10-19-work-tab-todos.md`

**작업 위치:** worktree `~/.whale-erp-worktrees/whale-erp-front/todos`, 브랜치 `feature/todos-screen` (origin/main `27d47b9`)

## 근거

| 근거 | 쓰는 곳 |
|---|---|
| 목업 `docs/mockup/staff/index.html` TO-DO 탭 | 필터(상태·담당), 건수 줄, 표 칸(담당·근무지·TO-DO·수행 예정·상태), 등록 칸, 「배정 방식이 만드는 차이」 안내 |
| 데모 `docs/demo/staff/todos.html` (원본 `src/pages/staff/todos.mjs`) | 1팀 컴포넌트로 옮길 때의 배치 |
| api T-1~T-4 (2026-10-19 재영) | 상세의 관리자 상태 변경(T-1), 그룹 삭제 결과 안내(T-2) |
| 메뉴 `MN000026` 「TO-DO 리스트 관리」 url `/todos` | 공통 틀·권한(read·create·update·delete 로 버튼을 가린다) |

## 화면

1. **목록 `/todos`** — 서버 컴포넌트가 URL 쿼리로 `GET /todos` 를 부른다. 필터: 근무지·상태·담당(개인/근무지 전체)·긴급·수행 예정 기간. 정렬은 api 순서 그대로(미완료 긴급 → 미완료 나머지 → 완료). 그룹은 한 줄(「전체 · 각자」, 「전체 · 한 명」)이고 개인은 직원 이름. 「TO-DO 등록」 버튼은 create 권한일 때만. 목업의 상태별 건수 줄(대기 n · 진행 중 n · 완료 n)은 api 가 상태별 건수를 주지 않아 총 건수만 보인다.
2. **등록 `/todos/new`** — 제목·내용·근무지·배정 대상(개인/근무지 전체)·직원(개인일 때, 근무지의 체결 완료 근로계약이 있고 가입을 마친 재직 직원(퇴직 예정 포함)에서 이름·번호 끝자리로 골라 칩)·수행 방식(근무지 전체일 때)·수행 예정 날짜·시간(선택)·긴급. 근무지를 바꾸면 고른 직원을 비운다. 지난 날짜·직원 0명은 막는다.
3. **상세 `/todos/[id]`** — 내용, 배정·수행 방식, 그룹이면 직원별 상태, 상태 이력. 상태 바꾸기(T-1, update 권한). 수정(제목·내용·수행 예정 일시·긴급만, 배정은 읽기 전용). 삭제(대기일 때, 그룹이면 「대기 n건 지움 · m건 남음」 안내, T-2).
4. **직원 상세 TO-DO 영역** — `RIGHT_BOXES` 의 TO-DO 칸에 `GET /staff-members/:id/todos` 의 api 정렬(미완료 긴급 → 미완료 → 완료) 앞쪽 5건을 보이고 `manageHref: "/todos"` 를 건다(메뉴 url 이 생겼으므로). 「관리」 · 제목 링크는 TO-DO 리스트 관리(MN000026) 조회 권한이 없으면 글자로만 보인다(「관리」는 흐리게).

## 순서와 확인

1. api 브랜치로 타입 생성: `WHALE_API_DIR=../../whale-erp-api/todos pnpm openapi:types`
2. 순수 함수(쿼리 변환·한 줄 표시·등록 입력 검사) 테스트 먼저 → `node --test`
3. 화면 → `pnpm lint` · `tsc` · `pnpm build`
4. 로컬 api(브랜치)로 등록 → 목록 → 상세 상태 변경 → 삭제를 한 번 돌려 보기
5. 커밋·PR 은 재영 확인

## 상단 점포 범위 연동 (2026-10-22 재영)

목록 필터의 근무지 선택(`storeId` 하나)을 점포 목록과 같은 점포 고르기(`StorePicker`)로 바꾸고, 헤더 범위(`?scope=`)를 따른다. api 는 `GET /todos` 에 `storeIds`(쉼표, 1000개까지) · `storeTypes`(DIRECT · FRANCHISE)를 받고 업무 범위 밖 점포는 뺀다.

| 주소 | 뜻 | api 조건 |
|---|---|---|
| `storeIds=3,7` | 목록에서 고른 점포 | `storeIds=3,7` |
| `storeIds=` | 목록에서 비운 「전체」(헤더 범위가 아니다) | 없음 |
| `scope=STORE:12` | 헤더 범위 — 점포 하나 | `storeIds=12` |
| `scope=DIRECT` · `scope=FRANCHISE` | 헤더 범위 — 직영 · 가맹 전체 | `storeTypes=DIRECT` · `FRANCHISE` |
| `scope=ALL` | 헤더 범위 — 전체 | 없음 |
| (없음) | 정해지지 않음 — 필터가 헤더 범위로 채운다(`fillScopeOf`) | 채운 뒤의 조건 |

- `storeIds` 는 빈 값이어도 `scope` 보다 앞선다. 옛 주소의 `storeId=N` 은 `storeIds=N` 으로 읽는다.
- 칩 이름은 로그인 정보의 관리 점포(`useStores`)에서 찾는다 — 점포 목록 api 는 「점포 정보 관리」 권한이 있어야 열려 서버가 찾지 않는다. 로그인 정보에 없는 점포는 조건에서 빼고 알리고, 이 탭에서 쓸 수 없는 범위는 「전체」로 바꾸고 알린다.
- 직영 · 가맹 범위는 api 에 `storeTypes` 로 보내고 폐점 점포는 api 가 뺀다 — 칩(폐점 제외)과 목록이 맞는다. 로그인 정보의 점포는 브라우저에만 있어 서버가 id 로 풀지 않는다. 폐점 점포 TO-DO 는 「전체」나 점포를 골라 본다(2026-10-22 재영).
- 상세 · 등록 · 수정은 목록 주소를 `?back=` 으로 받는다(`/todos` 주소만). 등록 뒤에는 점포 검색을 「전체」로 비운 목록(`withoutStoreSearch` — 새 TO-DO 가 보이게)으로, 삭제 뒤에는 들어올 때의 목록 조건 그대로 돌아간다(하나 지워도 점포 조건은 틀어지지 않는다, 2026-10-22 재영).
- 확인: `node --test src/app/todos/todo-list-query.test.ts` (네 가지 상태 · 범위 종류 · api 변환 · back 거르기)
