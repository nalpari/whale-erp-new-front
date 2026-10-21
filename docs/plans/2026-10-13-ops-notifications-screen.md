# 운영 알림함 화면 계획

**목표:** 관리자 웹에 운영 알림함 `/notifications` 를 만든다. 목록을 보여 주고 알림을 누르면 읽음으로 바꾼 뒤 그 업무 화면으로 보낸다. 모두 읽음과 선택 삭제도 둔다.

**Plane 일감:** #253 전역 종과 팝오버 · #254 알림함 목록 화면 · #255 업무 상세 이동.

**짝 문서:** api `docs/plans/2026-10-13-ops-notifications.md` (API 모양·수신자·생성 지점은 그쪽)

**작업 위치:** 워크트리 `~/.whale-erp-worktrees/whale-erp-front/petra`, 브랜치 `bulbasaur`(origin/main `f7c7315`에서 시작)

## 근거

| 근거 | 화면에 들어가는 것 |
|---|---|
| 데모 `docs/demo/src/pages/notify/index.mjs` | 칸 구성(선택 · 미확인 점 · 알림 · 구분 · 일시), 「모두 읽음」·「선택 삭제」 확인창, 빈 상태 「받은 알림이 없습니다.」. 왼쪽 필터와 내용·메일 칸은 없다(2026-10-02 재영) |
| 목업 `docs/mockup/notify/index.html` · NOTIFY-1 | 눌러 들어가면 읽음. 줄마다 읽음 버튼이 없다 |
| 목업 NOTIFY-2 · 운영 정책 NTF-07 · 목업 `assets/app.js` 종 팝오버 | 종과 알림함을 둘 다 둔다. 종은 미확인 건수와 최근 몇 건, 「알림함 전체 보기」를 보인다 |
| 운영 정책 NTF-06 | 모두 읽음만 둔다 |
| 운영 정책 LST-01·02 · Manyfast 「운영 알림함 확인 및 업무 이동」 | 페이지 번호로 나누고 20·50·100 가운데 고른다. 기본은 20 |
| Manyfast 「운영 알림함 확인 및 업무 이동」 예외 | 목록 조회에 실패하면 안내와 다시 시도를 보인다. 읽음 처리에 실패하면 상태를 그대로 두고 다시 누를 수 있다 |

## 범위

**넣는 것**
1. `src/app/notifications/` — `layout.tsx`, `page.tsx`, 표, 툴바, `actions.ts`(모두 읽음·선택 삭제), `[id]/open/route.ts`(읽음 뒤 이동)
2. `src/lib/notifications.ts` — API 호출(`request()`), 쿼리 파싱, 알림 → 업무 화면 경로 (바뀜(NOTIFY-16): 경로표를 두지 않고 업무 쪽 `link` + `safeLink`)
3. 종 `NotificationBell` 을 새 컴포넌트로 만들고(아래 「종」), 지금 헤더를 임시로 조립하는 세 곳(`platform/layout.tsx`, 직원 정보 관리 목록·상세)의 `AlarmLink href="#"` 를 바꾼다.

**넣지 않는 것**
- 공통 GNB(공통 헤더·공통 레이아웃). 아직 없다 — `platform/layout.tsx` 의 「TODO(공통 헤더)」. 만드는 쪽이 종 자리에 `NotificationBell` 을 넣으면 되도록 okf와 #253에 적어 둔다.
- `AlarmLink`·`GlobalHeader` 수정. `AlarmLink` 는 고치지 않고 그대로 둔다(디자인 견본 `/design` 이 쓴다).
- 업무 상세 화면들. 아직 없는 경로는 화면이 생기기 전까지 404가 난다(아래 표).

## 화면

데모와 같은 틀로 만든다: `GlobalHeader` → `PageBar title="운영 알림함"` → 흰 패널 안에 `ListToolbar` · 표 · 페이지 번호.

바뀜(2026-10-15): 공통 틀(AdminFrame)이 공통 헤더 · 알림 종 · `ErpRoot` 를 씌우므로 화면은 `PageBar` 부터 그린다. `page.tsx` 의 바깥 틀 · `GlobalHeader` · 디자인 견본(`design/sample`) 값과 `layout.tsx` 의 `ErpRoot` 를 지우고 탭 제목만 둔다(1팀 10/14 「화면을 공통 틀에 맞추는 작업 안내」). `[id]/open` 은 공통 틀 안에서 열리고 자체 틀이 없어 그대로 둔다.

| 칸 | 내용 |
|---|---|
| 선택 | `Checkbox`. 머리에는 전체 선택 |
| 미확인 | 안 읽은 줄에 점과 sr-only 「미확인」 |
| 알림 | 제목. 안 읽은 줄은 굵게, 읽은 줄은 흐리게 쓴다. 누르면 `/notifications/{id}/open` 으로 간다 |
| 구분 | API의 `kind`(템플릿 이름)를 회색 배지로 보인다 |
| 일시 | `MM-DD HH:mm`, KST |

- 툴바: 「총 n건」, 「미확인 n」, 「모두 읽음」(확인창 「모든 알림을 읽음으로 바꾸시겠습니까?」), 「선택 삭제」(확인창 「선택한 알림을 삭제하시겠습니까?」 / 「삭제한 알림은 되돌릴 수 없습니다.」, 고른 것이 없으면 「선택된 알림이 없습니다」), 페이지당 건수
- 화면 상태(`page`, `pageSize`)는 직원 목록처럼 URL에만 둔다.
- `DataTable` 의 `Column.header` 가 `string` 이라 전체 선택 체크박스를 넣을 수 없다. `ReactNode` 로 넓힌다. `string` 도 `ReactNode` 라 기존 화면은 그대로다(공통 컴포넌트, 김창수 작성 — PR에 적는다).

### 종 (#253)

공통 GNB가 아직 없어서(2026-10-13 확인) 종을 헤더와 떨어진 컴포넌트로 만든다.

- `src/components/notifications/notification-bell.tsx` — `"use client"`. props `{ unreadCount, recent }`. `recent` 는 목록 API의 한 줄 모양 그대로 최대 5건이다.
- 데이터는 헤더를 조립하는 서버 컴포넌트가 `GET /notifications?pageSize=5` 를 불러 넘긴다. 응답의 `unreadCount` 가 배지 숫자다. 따로 API를 두지 않는다.
- 아이콘: `alarm.svg` 에는 빨간 점(`<circle>`)이 그림에 들어 있어 늘 보인다. 점을 뺀 `alarm-bell.svg` 를 더하고, 미확인이 있을 때만 건수 배지를 그린다. 99건이 넘으면 「99+」로 보인다.
- 누르면 팝오버를 연다(목업 `assets/app.js` 의 종 팝오버). 머리는 「미확인 알림 n건」이다. 줄마다 미확인 점, 제목, 구분, 일시를 보이고 누르면 `/notifications/{id}/open` 으로 간다. 맨 아래에 「알림함 전체 보기」(`/notifications`)를 둔다. 없으면 「받은 알림이 없습니다.」를 보인다.
- 바깥을 누르거나 Esc를 누르면 닫는다. 버튼에는 `aria-expanded` 와 `aria-label="알림 n건"` 을 둔다.
- API 조회에 실패해도 헤더는 그려야 한다. 이때는 배지 없이 종만 보이고, 누르면 알림함으로 간다.
- 건수는 화면에 들어올 때와 새로고침할 때만 다시 센다. 자동 갱신(폴링)은 두지 않는다.

### 누르면 읽음 → 이동

`/notifications/[id]/open` 은 「알림을 여는 중입니다…」만 보이는 페이지다. **이 페이지를 불러오는 것(GET)으로는 아무것도 바꾸지 않는다.**
1. 화면에 실제로 뜨면(`document.prerendering` 이면 `prerenderingchange` 까지 기다린다) 서버 액션 `openAction(id)` 가 api `POST /notifications/:id/read` 를 부른다.
2. 바뀜(NOTIFY-16): 경로표를 두지 않고 업무 쪽 `link` + `safeLink`. `linkOf(item)` 의 경로로 `router.replace` 한다. 경로가 없거나 남의 알림(404)이면 `/notifications?gone=1`, 읽음 처리가 실패하면 `/notifications?error=read` 로 돌려보내 토스트를 띄운다. 실패한 줄은 미확인 그대로라 다시 누를 수 있다.
3. 읽음이 바뀌면(이동 · 모두 읽음 · 선택 삭제) `revalidatePath("/", "layout")` 로 모든 화면을 다시 그리게 한다 — 종은 화면마다 서버가 그려서 알림함만 비우면 예전 숫자가 남는다.

처음에는 route handler 의 GET 에서 바로 읽음 처리했다. 그런데 Chrome 이 종 팝오버의 링크를 미리 불러 들여(마우스가 지나가는 것만으로) 알림이 읽음이 됐다(2026-10-13 재영 확인). 메일 보안 검사기가 메일 링크를 열어 보는 것도 같은 문제라 GET 에서 떼었다. 링크는 `<Link>` 가 아니라 `<a>` 로 건다.

> **바뀜 (2026-10-13 재영, 운영 정책 NTF-03 v114):** 운영 알림은 메일을 붙이지 않는다. 메일 버튼은 업무 화면(`ADMIN_WEB_URL + 업무 경로`)으로 바로 가고 이 경로를 쓰지 않는다. #249 는 취소됐다. 아래 문단은 그 전 결정이다.

**메일 버튼도 이 경로로 들어온다 (2026-10-13 재영, 걷음).** 운영 알림 메일(WHALEERP-249, 효준)의 버튼 링크는 `ADMIN_WEB_URL + /notifications/{수신 ID}/open` 이다. 그래서 알림 → 업무 화면 경로표는 아래 `linkOf` 한 곳에만 있고, api는 업무별 주소를 모른다. 메일로 들어온 사람이 로그인 전이면 로그인 뒤 이 주소로 돌아와야 하는데, 관리자 웹 로그인(1팀)이 생길 때 그쪽 돌아가기 규칙을 따른다. 받는 사람이 아닌 계정으로 열면 api가 404를 주므로 `/notifications?gone=1` 로 보낸다.

### 알림 → 업무 화면 (NOTIFY-16 이후: 업무 쪽 `link`)

**2026-10-13 재영 — 아래 경로표는 버렸다.** 갈 화면은 알림을 만드는 업무 쪽이 `notify` 의 `link` 로 넘기고, 화면은 `safeLink` 로 관리자 웹 안의 경로인지만 본다. 아래 표는 처음 계획의 기록이다.


| 템플릿 코드 | 관련 업무 | 경로 | 지금 있나 |
|---|---|---|---|
| `NTF_CONTRACT_SIGNED` · `_REJECTED` · `_EXPIRED` · `_RENEWAL_DUE` | CONTRACT | `/contracts/{id}` | 있음(front #13) |
| `NTF_LINK_HOLD` · `NTF_AFFILIATION_REJECTED` | STAFF_MEMBER | `/staff-members/{id}` | 있음 |
| `NTF_INQUIRY_RECEIVED` | INQUIRY | `/platform-inquiries/{id}` | 없음 |
| `NTF_INQUIRY_ANSWERED` | INQUIRY | `/support/inquiries/{id}` | 없음 |
| `NTF_LEAD_RECEIVED` · `NTF_LEAD_ANSWERED` | LEAD | `/platform-leads/{id}` | 없음 |

바뀜(NOTIFY-16): 경로표를 두지 않고 업무 쪽 `link` + `safeLink`. 계약 상세는 main 의 실제 경로 `/contracts/{id}`(front #13)다. 화면이 없는 문의 · 도입문의 넷은 `linkOf` 가 null 을 돌려 알림함에서 안내한다(front #14 리뷰). 데모에서 날인 알림이 거부 상세(유하람)로 가던 문제는 이 표로 없어진다. 계약 ID로 가기 때문이다.

### 데이터와 개발 중 호출

- 서버 컴포넌트가 `request()` 로 `GET /notifications?page&pageSize` 를 부른다. 이 화면은 처음부터 진짜 API를 쓰고 목 데이터는 두지 않는다.
- 로그인이 아직 없어서 개발 서버에서는 `.env.local` 의 `API_DEV_TOKEN`(관리자 토큰)으로 부른다. `api.ts` 의 기존 대체 경로를 그대로 쓴다.
- 타입은 api의 `openapi.json` 이 갱신된 뒤 `pnpm openapi:types` 로 받는다.
- 오류: 401·403이면 「권한이 없습니다」를, 그 밖의 오류면 「알림을 불러오지 못했습니다」와 「다시 시도」 버튼(같은 URL로 새로고침)을 보인다.

## 쟁점

api 계획의 NOTIFY-12~15를 `docs/mockup/notify/overview.html` 쟁점 절에 미정으로 적는다. 이 화면에만 걸리는 새 쟁점은 없다.

## 테스트

`package.json` 의 `node --test src/lib/*.test.ts` 로 돌린다.

| 파일 | 확인할 것 |
|---|---|
| `src/lib/notifications.test.ts` | 바뀜(NOTIFY-16): 경로표를 두지 않고 업무 쪽 `link` + `safeLink`. `linkOf` 를 열 가지 코드마다 확인 / 모르는 코드·`relatedId` 없음이면 `null` / 쿼리 파싱(`page` 0·음수·문자, `pageSize` 20·50·100 밖이면 기본값) / 일시를 KST로 `MM-DD HH:mm` / 종 배지 글자(0이면 없음, 100 이상은 「99+」) |

화면은 개발 서버에서 직접 확인한다. 목록, 누르면 읽음과 이동, 모두 읽음, 선택 삭제, 빈 상태, API를 끈 상태의 오류 안내를 차례로 본다.

## 할 일 순서
1. `notifications.ts` 테스트 → 구현(`linkOf`, 쿼리, 일시) — 바뀜(NOTIFY-16): 경로표를 두지 않고 업무 쪽 `link` + `safeLink`
2. api 타입 받기(`pnpm openapi:types`)
3. `page.tsx`·표·툴바·`actions.ts`·`open/route.ts`
4. `NotificationBell` 과 헤더 세 곳 바꾸기
5. `okf/notify.md` 의 화면·소스 갱신, `generated.at`, `okf/log.md` 한 줄
6. `pnpm lint` · `pnpm test` · `pnpm build`
