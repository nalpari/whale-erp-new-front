# 직원 정보 관리 목록 화면 설계 (목 데이터)

- 날짜: 2026-10-12
- 브랜치: `squirtle` (worktree `giza`)
- 작업: WHALEERP-138 [관리자웹] 직원 목록의 초대·가입 상태와 재발송 (화면 부분)
- 기준 화면: `docs/demo/staff/index.html` (원본 `docs/demo/src/staff-sections.mjs`)
- API: `GET /staff-members` — whale-erp-api 브랜치 `jigglypuff`, 설계 `docs/plans/2026-10-12-staff-member-list-design.md`
- 상태: 설계 확정, 구현 계획 전

## 목적

관리자 로그인 없이 `/staff-members` 에 접속해 데모와 같은 직원 목록을 보고, 필터 · 검색 · 페이지 이동이
실제로 동작하게 한다. 데이터는 목이지만 api 응답 모양(`{ items, total }`, `StaffMemberListItemDto`)을 그대로
따른다 — api 를 붙일 때 `getStaffMembers` 한 함수의 안만 바뀐다.

## 정해진 것

| 항목 | 결정 |
|---|---|
| 데이터 | 목. 관리자 로그인(1팀)이 없어 api 를 부를 수 없다. 개발용 토큰 경로는 만들지 않는다 |
| 상태 보관 | URL 쿼리. 서버 컴포넌트 페이지가 `searchParams` 를 읽고, 필터 · 페이지 조작은 URL 만 바꾼다 |
| 여러 개 선택 필터 | 데모대로 체크박스. 목 함수는 배열을 받는다. api 는 연결할 때 `joinState` · `employmentType` 을 쉼표 목록으로 넓힌다 |
| enum 라벨 | 목 단계라 `staff-row.ts` 한 곳에 둔다. api 연결 때 `getEnum` 으로 바꾼다 |
| 테스트 | 순수 함수만 `node --test`(이 저장소의 `date-math.test.ts` 방식, 도구를 따로 깔지 않는다) |

## 화면 범위

넣는 것 — 데모 그대로.

- 화면 틀: `GlobalHeader`(디자인 견본의 메뉴 · 오른쪽 요소), `PageBar` 「직원 정보 관리」, 왼쪽 `FilterPanel`, 오른쪽 목록.
- 필터: 점포(점포명 검색), 이름·휴대전화번호, 고용형태(체크 2), 가입·인증(체크 5), 재직 상태(재직 · 퇴직 · 전체, 기본 재직), 초기화.
- 목록 도구 줄: 총 N건, 「일괄 저장」 버튼(`/staff-members/export` 링크만, 화면 없음), 페이지당 건수 20 · 50 · 100.
- 제목 줄 오른쪽 「직원 초대」 버튼 — 근로계약서 초안 작성(`/staff-members/contracts/new`) 링크만, 화면 없음. 초안을 저장하면 초대가
  나가는 흐름이라 데모의 「계약서 작성」을 이름만 바꿨다(2026-10-12 yjnoh).
- 표 8칸: 순번 · 직원 · 휴대전화번호 · 점포 · 고용형태 · 가입·인증 · 계약 상태 · 재직. 빈 문구 「조회된 직원이 없습니다.」
  순번은 내림차순이다 — 최근 등록이 먼저 오므로 1쪽 첫 줄이 전체 건수, 마지막 쪽 끝 줄이 1(2026-10-12 yjnoh).
  데모의 「이번 주」 칸은 뺐다(2026-10-12 yjnoh) — api 응답에서도 `weeklyScheduledMinutes` 를 뺐다.
- 페이지 이동: `Pagination`.

빼는 것.

- 연결 보류 이름을 눌러 여는 「가입 연결 확인」 시트(WHALEERP-139, mskim). 이름은 일반 글자다.
- 헤더 범위 선택기 동작(WHALEERP-301), MY PAGE 팝업 동작(1팀), 일괄 저장 화면(WHALEERP-337), 직원 상세 화면.

## URL 쿼리

| 파라미터 | 값 | 기본(URL 에서 빠짐) |
|---|---|---|
| `store` | 점포명 검색어 | 없음 |
| `keyword` | 이름 · 번호 검색어 | 없음 |
| `employmentType` | `FULL_TIME,PART_TIME` 중 고른 것, 쉼표 | 둘 다 고름 |
| `joinGroup` | `JOINED,INVITED,LINK_HOLD,AFFILIATION,UNDER_AGE` 중 고른 것, 쉼표 | 다섯 다 고름 |
| `employmentStatus` | `EMPLOYED` · `RETIRED` · `ALL` | `EMPLOYED` |
| `page` | 1 이상 정수 | 1 |
| `pageSize` | 20 · 50 · 100 | 20 |

- 체크를 하나도 고르지 않으면 값이 빈 파라미터(`joinGroup=`)로 남고, 결과는 0건이다.
- 이상한 값(`pageSize=7`, 모르는 묶음, `page=0`)은 오류 없이 그 칸의 기본값으로 돌린다. 모르는 묶음 이름은 버린다.
- 필터나 건수를 바꾸면 `page` 를 지운다(1쪽).

### 가입·인증 묶음 → `StaffJoinState`

| 화면 체크 | `joinState` |
|---|---|
| 가입 완료 | `JOINED` |
| 초대 발송 | `INVITED` · `EXPIRED` · `REJECTED` |
| 연결 보류 | `LINK_HOLD` |
| 소속 추가 확인 | `AFFILIATION_PENDING` |
| 가입 불가 | `UNDER_AGE` |

`DRAFT` · `RETURN_PENDING` 은 체크 항목이 없어 다섯 다 고른 상태(= 필터 없음)에서만 보인다.

## 한 줄 표시 (`staff-row.ts`)

배지 색은 데모를 따른다 — 데모의 `ok` · `info` 는 `Badge tone="on"`, `warn` · `risk` 는 `Badge tone="off"`,
`quiet` 는 회색 배지(데모 `staff-parts.mjs` 의 `NEUTRAL` — `bg-erp-subtle text-erp-ink`). 아래 표의 「흐린」 배지는
이 회색 배지다. 직원 칸의 「본사 제공 동의 없음」과 재직 칸의 흐린 글자만 `text-erp-muted` 글자다. 날짜는 한국 날짜 `MM-DD`, D-day 는 한국 오늘 기준.

**가린 행(`isMasked`)** — 직원 칸에 흐린 「본사 제공 동의 없음」, 점포만 보이고 나머지는 `-`.

**직원** — 가입 완료이면서 재직이면 상세 링크(`/staff-members/{id}`, 화면은 아직 없음), 아니면 글자.

**휴대전화번호** — `01028417702` → `010-2841-7702`.

**가입·인증**

| `joinState` | 표시 |
|---|---|
| `JOINED` | on 「가입 완료」, 퇴직이면 흐린 글자 |
| `INVITED` | off 「초대 발송 · MM-DD」(`invitation.lastSentAt`) |
| `EXPIRED` | off 「초대 만료」 |
| `REJECTED` | off 「거절」 |
| `LINK_HOLD` | off 「연결 보류 · N일」(`linkHold.heldAt` 부터 지난 날수) |
| `AFFILIATION_PENDING` | on 「소속 추가 확인」 |
| `RETURN_PENDING` | on 「복귀 확인」 |
| `UNDER_AGE` | off 「가입 불가(만 19세 미만)」 |
| `DRAFT` | 흐린 「초안」 |

**계약 상태** (`contract` 가 없으면 `-`)

| `contract.status` | 표시 |
|---|---|
| `PENDING_SEND` | 흐린 「발송 대기」 |
| `PENDING_SIGNATURE` | off 「서명 대기 · D-N」(`signDeadlineAt`) |
| `SIGNED` | 종료일이 30일 안이면 off 「갱신 예정 D-N」, 아니면 on 「체결 완료」 |
| `REJECTED` | off 「거부」 — api 가 거부일을 주지 않아 데모의 「· 09-02」는 뺀다 |
| `EXPIRED` | off 「만료」 |
| `ENDED` | 흐린 「종료」 |

갱신 예정 기준 30일은 갱신 예정 알림과 같다 — 「갱신 예정 알림은 계약 종료일 30일 전에 한 번만 만든다」(`okf/notify.md`,
`S-JUWPXF`). 홈 상단 경고 밴드의 7일(`okf/home.md`, `HOME-5`)과는 다른 표시다.

**재직 칸** — 데모처럼 한눈에 보는 요약. 위에서부터 처음 맞는 것.

| 조건 | 표시 |
|---|---|
| `employmentStatus = RETIRED` | 흐린 「퇴직 MM-DD」(`retiredDate`) |
| `LINK_HOLD` | 붉은 글자 「확인 필요」 |
| `UNDER_AGE` | 붉은 글자 「삭제 대상」 |
| `AFFILIATION_PENDING` · `RETURN_PENDING` | 흐린 「응답 대기」 |
| `JOINED` 아님 | 흐린 「가입 대기」 |
| 계약 `PENDING_SIGNATURE` | 붉은 글자 「날인 대기」 |
| 계약 `REJECTED` · `EXPIRED` | 붉은 글자 「재발송 필요」 |
| 그 밖 | 초록 「재직」, `retiredDate` 가 있으면 옆에 off 「퇴직 예정 MM-DD」 |

글자 색은 데모의 `mark` — 초록 `text-erp-on`, 붉은 `text-erp-off`, 흐린 `text-erp-muted`.

## 구성

| 파일 | 하는 일 |
|---|---|
| `src/app/staff-members/page.tsx` | 서버 컴포넌트. `await searchParams` → `parseStaffListQuery` → `getStaffMembers` → 조립 |
| `src/app/staff-members/staff-list-query.ts` | URL ↔ 쿼리 객체(`parseStaffListQuery` · `toStaffListSearch`). 순수 함수 |
| `src/app/staff-members/staff-row.ts` | 한 줄 → 화면 문구 · 색(`joinCell` · `contractCell` · `statusCells` · `formatPhone`). `today` 를 인자로 받는다 |
| `src/app/staff-members/staff-filter.tsx` | 클라이언트. 필터 패널. 바꾸면 `router.replace` |
| `src/app/staff-members/staff-list-controls.tsx` | 클라이언트. 페이지당 건수 `Select` 와 `Pagination` |
| `src/app/staff-members/staff-table.tsx` | `DataTable` 8칸 정의와 셀 그리기 |
| `src/lib/staff-members.ts` | api DTO 를 옮긴 타입, 묶음 → 상태 변환, `getStaffMembers(query)` |
| `src/lib/staff-members.mock.ts` | 목 63건 |

### `getStaffMembers`

지금은 목 배열을 이 순서로 다룬다 — api 규칙과 같게.

1. 점포명 · 검색어 · 고용형태 · 가입 묶음으로 거른다. 검색어는 이름 부분 일치 또는 숫자만 남긴 번호 부분 일치.
2. **가린 행은 검색어 · 고용형태 · 가입 묶음 필터가 하나라도 걸리면 뺀다.** 재직 상태 필터는 예외라 가린 행도
   재직 · 퇴직으로 걸러 남긴다(api 와 같다). 그래서 목의 가린 행은 재직 상태 값을 내부에 갖고, 응답으로는 `null` 이다.
3. 재직 상태로 거른다(`ALL` 이면 거르지 않는다).
4. `staffMemberId` 내림차순, 쪽 나누기. 마지막 쪽 너머면 `{ items: [], total }`.

api 를 붙일 때: 점포명은 점포 조회로 ID 를 구해 `storeIds` 로, 묶음은 `joinState` 쉼표 목록으로, `ALL` 은
`employmentStatus` 를 빼서 보낸다. 함수 이름과 돌려주는 모양은 그대로다.

### 목 데이터

- 데모의 열두 줄을 api 모양으로 옮긴다. 점포는 데모의 11개(직영 4 · 가맹 7)를 쓴다.
- 보는 사람은 BP 마스터로 본다 — api 가 지금 가맹 점포 직원을 모두 가리므로 **목의 가맹 점포 직원은 모두 가린
  행**이다. 그래서 데모에서 가맹 점포(모리커피 연남점)에 있던 유하람(거부) · 임채운(퇴직)은 직영 점포로 옮겨,
  그 표시 예를 가린 행 때문에 잃지 않는다.
- 나머지는 가입 완료 · 체결 완료 직원으로 채워 총 63건, 기본 20건에 4쪽이 되게 한다. 그중 몇은 퇴직이라 재직
  기본 필터의 건수와 「전체」의 건수가 다르다.
- 날짜는 오늘(한국)을 기준으로 만든다 — 「연결 보류 · 4일」, 「갱신 예정 D-20」, 「서명 대기 · D-24」가 늘 데모처럼 보이게.

## 테스트

`node --test src/app/staff-members/*.test.ts src/lib/staff-members.test.ts`

- `staff-list-query.test.ts` — 빈 URL 은 기본값, 기본값은 URL 에서 빠짐, 체크를 모두 끄면 `joinGroup=` 이고 0건
  조건, 이상한 값은 그 칸만 기본값, `parse(toSearch(q))` 가 `q`.
- `staff-row.test.ts` — 위 표들의 각 줄, 가린 행, 번호 모양, D-day 경계(오늘 = D-0).
- `staff-members.test.ts` — 묶음 → 상태, 검색어(이름 · 번호 · 하이픈 섞인 번호), 점포명, 고용형태, 재직 필터에도 가린
  행이 남음, 검색어가 있으면 가린 행이 빠짐, 쪽 나누기와 `total`, 마지막 쪽 너머.

## 확인

`pnpm lint`, `pnpm build`, 위 테스트. 그다음 `pnpm dev` 로 띄워 `/staff-members` 를 열고 필터 · 검색 · 쪽 ·
건수를 눌러 본다.

## 범위 밖

- api 연결(관리자 로그인 이후), `getEnum`, openapi 타입 생성.
- 가입 연결 확인 시트(139), 재발송 버튼(136 이 정해진 뒤), 직원 상세 · 일괄 저장 화면.
