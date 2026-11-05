# 세션 만료 공통 경고창 (C6) · 로그아웃 실패 문구 설계

날짜: 2026-11-05 · 작성: 류제영(Claude 협업) · 계획 원본: https://claude.ai/artifact/3qcXXVx2Fax6C1mcTsaaSw

## 목적

세션이 끊겨 로그인 화면으로 갈 때 문구 없이 넘어가는 경우(1팀 검토 C6, D 표 1~10)를 한꺼번에 고친다.

- 화면을 **옮기는 중**에 알게 되면 → 로그인 화면으로 보내며 이유를 보인다.
- 화면을 **쓰는 중**에 알게 되면 → 그 화면 위에 만료 팝업을 **하나만** 띄우고 [확인] 뒤 로그인 화면으로 보낸다.

같은 PR 에 로그아웃 실패 문구(헤더 · 탈퇴 완료 · 메뉴 없음 화면)를 넣는다.

## 범위

- 포함: 로그인 화면 만료 문구, 만료 팝업, 서버 액션 401 공통 처리(`window.fetch` 감싸기), 서버가 그리는 화면의 401, 로그아웃을 `signOut()` 으로 모으기, ①과 겹치는 화면별 401 처리 삭제, okf · 목업 · 데모.
- 제외:
  - 끊기기 전 경고 + 연장 버튼 — 하지 않기로 함(2026-11-02).
  - 다른 기기 로그인 · 관리자 초기화 · 시간 만료를 나눈 문구 — api 사유 코드가 없다. 모두 「만료」로 보인다.
  - 배포 직후 옛 화면의 서버 액션 실패(버전 어긋남) — 따로 할 일로 뺐다(todo 「배포 직후 옛 화면」).
  - 로그아웃 고정 주소(`POST /logout`) — 하지 않기로 함(2026-11-05).
  - **대기**: 공지 · 문의 저장(업로드 창구) 401(`post-form.tsx:173` · `inquiry-form.tsx:64`). 팝업으로 맞출지, 지금 폼 문구(「고친 내용을 옮겨 둔 뒤 다시 로그인해 주세요」)를 둘지 담당자 확인 뒤 정한다.

## 작업 위치

| 저장소 | 워크트리 · 브랜치 | 비고 |
|---|---|---|
| front | golden-gate · `marill` (main `acf31f4c` 에서) | api 변경 없음. 짝 api 브랜치는 `mantine` |

## 1. 언제 무엇을 보이나

| 언제 알게 되나 | D 표 | 처리 | 잡는 곳 |
|---|---|---|---|
| 메뉴 클릭 · 새로 고침 — proxy 토큰 갱신 401, 또는 갱신 실패 + 토큰 끝남 | 1 · 2 | 로그인 화면 `?reason=expired` | `proxy.ts` `toLogin` |
| 화면을 처음 여는 중 로그인 정보 401 | 8 · 9 | 로그인 화면 `?reason=expired` (로딩 화면뿐이라 팝업 없음) | `session-gate.tsx` 첫 준비 |
| 메뉴 클릭 뒤 서버가 화면을 그리다 api 401 (토큰이 10분 안이라 proxy 가 통과 — 다른 곳에서 끊긴 직후) | 새로 찾음 | 로그인 화면 `?reason=expired` | 공통 함수 `redirectExpired()` + proxy 가 그 주소에서 쿠키 정리 |
| 쓰는 중 BFF 조회 · 맞추기 · 엑셀 · 종이 계약 · 첨부 받기 401 | 3~7 · 10 | 만료 팝업 → [확인] → 로그인 | 그 자리에서 `notifySessionExpired()` |
| 쓰는 중 저장 · 삭제 · 중복 확인 등 서버 액션 401 | — | 만료 팝업 **하나만** → [확인] → 로그인. 화면의 실패 처리는 돌지 않음 | 서버 `request()` 가 표시 쿠키 + 브라우저 `window.fetch` 감싸기가 먼저 잡음 |
| 계약서 파일 받기 401 (새 탭 · 다운로드 주소) | — | 로그인 화면 `?reason=expired` | `documents/…/route.ts:30` |
| 직접 로그아웃 · 다른 탭 로그아웃 | 12 | 문구 없이 로그인 화면 (지금 그대로) | — |
| 로그아웃 자체가 실패 | 18~20 | 경고창 | `signOut()` |

### 문구 (2026-11-05 결정)

| 어디서 | 모양 | 문구 |
|---|---|---|
| 로그인 화면 (`?reason=expired`) | LOGIN 버튼 위 빨간 한 줄 — 지금 `reason=account` 문구 자리(`login-form.tsx:147`, 로그인 실패 문구가 있으면 그것으로 바뀜) | 「로그인이 만료되었습니다. 다시 로그인해 주세요.」 |
| 만료 팝업 | 공통 `ConfirmDialog`, 버튼 [확인] 하나, 취소 · Esc 없음 | 제목 「로그인 만료」 / 본문 「로그인이 만료되었습니다. 다시 로그인해 주세요.」 |
| 로그아웃 실패 | `alert` | 「로그아웃하지 못했습니다. 새로고침 후 다시 시도해 주세요.」 — 배포 직후 옛 화면은 새로 고쳐야만 되므로 |

## 2. 구조

```
                       ┌─ proxy: 로그인 키 쿠키는 있는데 세션이 없거나 갱신 401 ─────────┐
 화면 이동 · 첫 화면 ──┼─ SessionGate 첫 준비: 로그인 정보 401 ─────────────────────────┼──▶ /login?reason=expired
                       └─ 서버가 화면을 그리다 401: redirectExpired() ──────────────────┘
                          (세션 쿠키가 남아 있으면 proxy 가 갱신으로 확인 → 401 이면 쿠키 삭제)

                       ┌─ BFF 조회 · 맞추기 · 엑셀 · 종이 계약 · 첨부 받기 401 ─▶ notifySessionExpired() ─┐
 화면 쓰는 중 ─────────┤                                                                                  ├─▶ [만료 팝업 하나]
                       └─ 서버 액션 401                                                                   │      │ [확인]
                            [Next 서버] request(): 세션 쿠키 삭제 + 표시 쿠키 session-expired=시각        │      ▼
                            [브라우저] 감싼 window.fetch: 서버 액션 응답 + 처음 보는 표시                  │  location.replace(
                                 → notifySessionExpired(), 화면에는 결과를 넘기지 않음(끝나지 않음) ─────┘   /login?reason=expired)
```

### 2-1. 표시 쿠키 `session-expired`

- 서버가 「방금 이 브라우저의 세션이 끝났다」고 알리는 쪽지다. 값은 시각, 30초, `path=/`, `sameSite=lax`, httpOnly 아님(화면 스크립트가 읽는다).
- 읽어도 지우지 않는다. 탭마다 「이미 본 값」을 기억해 같은 값으로 두 번 띄우지 않는다. 30초 뒤 사라지고, 로그인 성공 때 지운다(다시 로그인한 직후 옛 쪽지로 팝업이 뜨지 않게).
- 다른 탭에 바로 알리는 쿠키 감지(cookieStore 이벤트 · 0.5초 확인)는 두지 않는다(2026-11-05). 다른 탭은 다음에 누를 때 알게 된다 — 메뉴는 proxy 가 로그인 화면으로, 저장은 그 탭의 감싼 fetch 가 팝업으로.

### 2-2. 서버 쪽 — `request()` · `requestRaw()` (`src/lib/api.ts`)

401 이면 `markSessionExpired(path, init)` 한 줄. 아래를 모두 만족할 때만 세션 쿠키를 지우고 표시 쿠키를 심는다. 판정은 순수 함수 `marksExpiry()` 로 떼어 테스트한다.

- 로그인 토큰(`Authorization`)을 실은 요청
- 서버 액션 요청(`next-action` 헤더) — 서버가 그리는 화면에서는 쿠키를 쓸 수 없다. `/api` 라우트는 BFF 가 지금처럼 지운다(`api/[...path]/route.ts:29`)
- 제외 경로가 아님 — 401 이 만료가 아닌 api:
  - `/auth/admin/password-change` (발급 비밀번호 만료)
  - `/auth/admin/me/withdraw` (탈퇴 최종 제출 — 이미 탈퇴됐을 수 있음)
  - `/auth/admin/logout`
- 쿠키 쓰기가 실패하면 로그만 남긴다.

### 2-3. 브라우저 쪽 — `src/lib/session-expiry.ts` (새 파일, next 를 import 하지 않음)

- `EXPIRED_COOKIE` · `SESSION_EXPIRED_EVENT`(`whale-erp:session-expired`) · `notifySessionExpired()` · `expiredMarkOf(cookie)`(순수 함수, 테스트).
- `installSessionExpiryWatch()` — 한 번만 `window.fetch` 를 감싼다. `next-action` 요청의 응답이고 처음 보는 표시가 있으면 신호를 보내고 **끝나지 않는 Promise** 를 돌려준다. 그 밖의 요청 · 응답은 손대지 않고 그대로 돌려준다. 본문은 읽지 않는다.
- 서버 액션이 `window.fetch` 로 나가는 것은 Next 16.3.3 소스(`segment-cache/fetch.js` · `navigation-testing-lock.js` · `server-action-reducer.js`)로 확인한 사실이지 약속된 동작이 아니다. 대체 장치는 두지 않는다. Next 를 올릴 때 확인 목록과 코드 주석에 남긴다 — 깨지면 서버 액션 401 은 api 문구로 보인다.

### 2-4. 만료 팝업 — `session-gate.tsx`

- 화면이 열릴 때 감시를 시작하고 `SESSION_EXPIRED_EVENT` 를 받으면 팝업을 연다. 이미 열려 있으면 무시한다(정책 「동시에 여럿 실패해도 한 번만」, `okf/auth.md` 44행).
- [확인] → `location.replace(loginPathOf(지금 주소, "GET", EXPIRED_REASON))`. 앱 안 이동(`router.push`)을 쓰지 않는다 — 끝나지 않는 서버 액션이 Next 의 서버 액션 줄을 막고 있어 앱 안 이동이 막힐 수 있다.
- 첫 준비 401(237 · 238)은 팝업 없이 이유를 붙여 로그인 화면으로. 맞추기 401(435 · 504)은 신호.

### 2-5. 로그인 이유 — `src/lib/auth-routes.ts` · `src/proxy.ts`

- `EXPIRED_REASON = "expired"` 와 문구를 `ACCOUNT_CHANGED_REASON` 옆에 둔다. `logoutNoticeOf` 가 둘을 읽는다. `loginPathOf` 에 이유 인자를 더한다(`?next=` 와 함께 붙는다).
- `proxy.ts` `toLogin`: 로그인 키 쿠키(`login-key`)가 있으면 `?reason=expired` 를 붙인다. 로그인 키는 브라우저를 닫거나 직접 로그아웃해야 사라지므로 「이 브라우저에서 로그인해 있다가 끊겼다」를 가른다 — 직접 로그아웃한 사람에게는 붙지 않는다.

### 2-6. 서버가 그리는 화면의 401

화면을 그리는 중에는 쿠키를 바꿀 수 없다. 그냥 `/login` 으로 보내면 남은 세션 쿠키 때문에 proxy 가 홈으로 되돌리고, 홈에서 또 401 이 난다.

- 새 서버 전용 함수 `redirectExpired()` — `redirect(loginPathOf(…, EXPIRED_REASON))`. `catch` 안에서 부르면 `unstable_rethrow` 규칙대로 다시 던지게 한다.
- `proxy.ts` 공개 경로 처리: `/login?reason=expired` 에 세션 쿠키를 들고 오면 홈으로 되돌리기 전에 기존 `refresh()` 를 한 번 부른다. **GET 이고 서버 액션이 아닐 때만** — 로그인 제출(POST)도 이 주소로 가므로, 거기서 쿠키를 지우면 로그인 액션이 쓰는 새 쿠키와 겹쳐 로그인이 무시될 수 있다(`proxy.ts:52` 와 같은 이유).

  | 갱신 결과 | 처리 |
  |---|---|
  | 401 — 세션이 정말 끝남 | 세션 쿠키 삭제 → 로그인 화면 + 만료 문구 |
  | 200 — 살아 있음 | 새 토큰을 쿠키에 쓰고 홈(또는 `?next=`)으로. 이유는 무시 |
  | 그 밖 — api 꺼짐 · 5초 시간 초과 · 5xx | 쿠키를 그대로 두고 로그인 화면만 보임 |

  판정은 순수 함수로 떼어 테스트한다. 살아 있는 세션은 지우지 않으므로 이 주소를 링크로 걸어도 로그아웃되지 않는다. api 호출은 이 주소에 세션 쿠키를 들고 올 때만 더해진다(평소는 지금처럼 10분에 한 번 갱신).
- 갱신 판정은 api `admin-auth.service.ts:200` `refresh()` — 세션 테이블에서 갱신 토큰을 찾지 못하거나(만료 · 로그아웃 · 종료) 계정이 없으면 401. api 는 요청마다 토큰이 아니라 세션 번호로 살아 있는지 본다(`jwt-auth.guard.ts:68`).
- 바꿀 곳: `contracts/page.tsx:35` · `contracts/new/page.tsx:31` · `contracts/new/load-form-data.ts:40 · 49` · `contracts/[contractId]/page.tsx:58` · `[contractId]/edit/page.tsx:33` · `[contractId]/worker/page.tsx:29` · `bp-admins/page.tsx:24` · `bp-holidays/page.tsx:38` · `work-schedules/page.tsx:38` · `public-holidays/page.tsx:34` · `notifications/page.tsx:21` · `platform/notification-templates/page.tsx:20` · `components/community/post-page.tsx:16` · `inquiry-page.tsx:22` · `list-load.tsx:10 · 17`. 각자의 401 처리(삼키기 · 문구 · 오류 화면)를 `redirectExpired()` 로 바꾸고, 401 · 403 을 같이 다루던 곳은 403 만 남긴다. 지금 근로계약 화면은 401 을 삼켜 빈 목록으로 보인다.

### 2-7. 로그인 성공 — `login/actions.ts`

- 표시 쿠키를 지운다.
- 성공 이동을 `redirect(target, RedirectType.replace)` 로 바꾼다. 기록의 `/login?reason=expired` 칸이 홈으로 바뀌어, [뒤로] 가 로그인 전 화면으로 간다.

### 2-8. 로그아웃 실패

- `admin-header.tsx` · `withdraw-panel.tsx`(149 · 402) · `platform/no-menu-notice.tsx` 의 로그아웃을 `signOut()` 으로 부른다.
- `src/lib/sign-out.ts` 의 실패 문구를 「로그아웃하지 못했습니다. 새로고침 후 다시 시도해 주세요.」로 바꾸고 `sign-out.test.ts` 를 맞춘다.

## 3. 바뀌는 파일

| | 위치 | 내용 |
|---|---|---|
| 새 파일 | `src/lib/session-expiry.ts` | 2-3 |
| 새 함수 | `src/lib/api.ts` `markSessionExpired()` · `marksExpiry()` | 2-2 |
| 새 함수 | `redirectExpired()` (`src/lib/`, 서버 전용) | 2-6 |
| 새 값 | `src/lib/auth-routes.ts` | 이유 `expired` · 문구 · `loginPathOf` 인자 |
| 고침 | `src/proxy.ts` | `toLogin` 이유(2-5), 공개 경로의 `/login?reason=expired` 처리(2-6) |
| 고침 | `src/components/site/session-gate.tsx` | 감시 · 팝업 · 첫 준비 · 맞추기(2-4) |
| 고침 | `use-load.ts:40` · `export-screen.tsx:99` · `excel-download-view.tsx:56` · `excel-download.tsx:53` · `contract-form.tsx:417` · `post-form.tsx:195` · `support-detail.tsx:73` | 바로 `/login`(또는 띠)을 `notifySessionExpired()` 로 |
| 고침 | `contracts/[contractId]/documents/[contractDocumentId]/route.ts:30` | `/login` 에 `?reason=expired` |
| 고침 | 서버가 그리는 화면 약 15곳 | 2-6 |
| 고침 | `login/actions.ts` | 2-7 |
| 고침 | `admin-header.tsx` · `withdraw-panel.tsx` · `platform/no-menu-notice.tsx` · `sign-out.ts` · `sign-out.test.ts` | 2-8 |
| 지움 | 서버 액션 401 분기 — `stores` · `bp-admins` · `bp-masters` · `platform-admins` · `platform-menus` · `code-groups` · `bp-code-groups` · `todos` · `work-schedules` · `attendance-records` · `payslips`(2) · `notifications` · `platform/notification-templates` · `staff-members/[id]` 의 `actions.ts`, `role-group-actions.ts` · `bp-page-actions.ts` · `my-page-actions.ts` · `withdrawal-form.ts` · `action-failure.ts:28`(+ 테스트) · `contracts/[contractId]/actions.ts:81 · 109` · `send-model.ts:191 · 212` · `community-actions.ts:35` | ①이 먼저 잡아 돌지 않는다(2026-11-05 결정). 제외 목록(`password-change-actions.ts:17` · `withdraw-actions.ts:44`)은 남긴다 |
| 지움 | 화면의 서버 액션 결과 401 분기 — `bp-admins/admin-form-panel` · `bp-masters/bp-master-form-panel` · `platform-admins/admin-form-panel` · `my-page-panel` · `bp-profile-tab` · `store-form-view` · `platform-admin-form.ts` · `export-screen.tsx:161 · 176` · `withdraw-panel.tsx:166` | 401 분기 삭제. `schedule-form` · `todo-form` 처럼 401 · 403 을 같이 보던 곳은 403 만 남김 |
| 그대로 | 강제 비밀번호(`force-password-dialog.tsx:58`) · 탈퇴 최종(`withdraw-panel.tsx:197`) · 카카오 주소 검색 401(`address-search.ts:122`) · BFF 쿠키 삭제(`api/[...path]/route.ts:29`) · 업로드 창구 서버 쪽(`platform-notices/save` · `support-inquiries/save` · `contracts/paper` 의 `route.ts`) | 만료가 아니거나 기반 코드 |

## 4. 위험 · 감수

| 항목 | 처리 |
|---|---|
| Next 내부 동작(서버 액션 = `window.fetch`)에 기댐 | 16.3.3 확인. 대체 없음. 업그레이드 확인 목록 · 주석 |
| 끝나지 않는 서버 액션이 앱 안 이동을 막음 | [확인]은 `location.replace`. 팝업은 닫을 수 없음 |
| 모든 fetch 가 감싼 함수를 지남 | `next-action` + 처음 보는 표시일 때만 끼어듦. 통과 경로 테스트 |
| 다른 기기 로그인 · 관리자 초기화도 「만료」로 보임 | 감수 — api 사유 코드 필요 |
| 팝업을 닫을 수 없어 입력을 잃음 | 감수 — 정책 「저장 중이던 입력은 복구하지 않는다」 |
| 서버 액션 401 뒤 세션이 되살아날 수 있나 | 접근 · 갱신 토큰이 거의 같이 끝남. 구현 때 실제 확인 |
| 갱신은 되는데 화면이 계속 401 이면 로그인 화면 ↔ 홈을 오감 | 구현 때 서버가 그리는 화면의 api 에 만료가 아닌 401 이 있는지 확인. 지금 아는 3개는 화면 그리기에서 부르지 않음 |
| 만료 로그인 화면 주소에서 api 호출 1번 | 감수 |

## 5. 확인

자동 — `pnpm test` · `pnpm lint` · 타입 · `pnpm build`

- 표시 꺼내기: 있음 · 없음 · 다른 쿠키뿐
- 서버 표시 판정: 토큰 + 서버 액션 + 일반 경로 → 표시 / 제외 경로 3개 · 토큰 없음 · 서버 액션 아님 → 안 함
- 로그인 이유: `expired` · `account` · 모르는 값, `?next=` 와 함께
- fetch 감싸기: 표시 있는 서버 액션 응답은 넘기지 않음 / 표시 없는 응답 · 일반 요청은 그대로 / 같은 표시로 두 번 알리지 않음
- proxy 만료 로그인 판정: GET + 쿠키 + 갱신 401 → 삭제 / 갱신 200 → 홈 / 그 밖 → 그대로 / POST · 서버 액션 → 건드리지 않음
- 로그아웃 실패 문구

브라우저 — 세션 끊기는 관리자 초기화 또는 같은 브라우저 다시 로그인. 테스트 계정은 새로 만든 것만 쓴다.

1. 1시간 넘게 둔 뒤 메뉴 클릭 → 로그인 화면 만료 문구
2. 메일 링크(엑셀 내려받기)로 열다 401 → 만료 문구 → 로그인 뒤 그 화면으로
3. 다른 창에서 돌아와 맞추기 401 → 팝업
4. 등록 [저장] 401 → 팝업 하나(폼 문구 · 다른 창 없음)
5. 점포 폐점 선택 · 칸을 벗어날 때 중복 확인 401 → 팝업 하나
6. 탭 두 개 — A 저장 실패 → A 팝업, B 는 메뉴 클릭 때 로그인 화면 만료 문구
7. 강제 비밀번호 · 탈퇴 최종 제출 401 → 만료 팝업 없이 지금 안내
8. 직접 로그아웃 → 문구 없음 / api 를 끈 채 로그아웃 → 실패 문구
9. 여러 요청이 한꺼번에 401 → 팝업 하나
10. 끊긴 직후 근로계약 메뉴 클릭(서버가 그리는 화면) → 로그인 화면 만료 문구
11. 로그인 뒤 [뒤로] → 로그인 전 화면 정상 / 다른 탭의 `/login?reason=expired` 새로 고침 → 홈

## 6. 문서

| 문서 | 바꿀 것 |
|---|---|
| `okf/auth.md` 25 · 41~44행 | 화면 이동 · 첫 화면 · 서버가 그리는 화면 중 만료는 로그인 화면 문구, 쓰는 중(조회 · 저장)은 팝업 → 로그인. 「로그인 화면에는 세션 만료 문구가 없다」를 지운다. `generated.at` · `okf/log.md` |
| `docs/mockup/auth/login.html` · `overview.html` · `docs/demo` 로그인 | 만료 문구 상태 |
| Manyfast | 직접 고치지 않고 레드마인 일감(새 부모)으로 요청 |

## 7. 순서

1. 이 설계 문서 검토
2. 구현 계획(writing-plans)
3. 공통: `session-expiry.ts` · 서버 표시 · 로그인 이유 · proxy + 테스트
4. 팝업 · 신호 넣는 곳 · 서버가 그리는 화면
5. 겹치는 401 처리 삭제
6. 로그아웃 실패 문구
7. okf · 목업 · 데모
8. 브라우저 확인 → 리뷰 → 커밋 · 푸시 · PR (api 요청 없음)
