# 로그인 후 홈(여러 점포 화면) 계획

**목표:** 관리자 웹 로그인 후 홈(`/home`)에 경고 밴드 · 수치 카드 넷 · 점포별 현황 표 · 처리 대기를 채운다. 업무 범위가 점포 하나일 때의 점포 하나 화면은 다음 PR 이다.

**Plane 일감:** WHALEERP-307~310 (점포 하나 화면은 341 · 342 · 344)

**짝 문서:** api `docs/plans/2026-10-27-home-summary-api.md` (작업 트리 `whale-erp-api/machu-picchu`)

**작업 위치:** worktree `~/.whale-erp-worktrees/whale-erp-front/angkor-wat`, 브랜치 `golem` (origin/main)

## 근거

| 근거 | 쓰는 곳 |
|---|---|
| 목업 `docs/mockup/home/signed-in.html` 「BP 마스터 화면」 탭 | 경고 밴드 · 수치 카드 · 점포별 현황 표 · 처리 대기의 문구와 배치 |
| 데모 `docs/demo/home/signed-in.html` (원본 `src/pages/home/signed-in.mjs`) | 1팀 컴포넌트로 옮긴 배치(처리 대기를 구분 · 항목 · 내용 표로) |
| `okf/home.md` 「로그인 후 홈」 · 「범위 선택기」 | 범위 · 다시 부르기 · 숨김 규칙 |
| 운영 정책 HOM-01~08 (v212) | 아래 「정한 것」 |

## 정한 것 (2026-10-27 재영)

- 업무 범위는 헤더 범위 선택기(`useScope`)다. `scopeStores` 로 점포 ID 로 풀어 `storeIds` 로 보내고 전체면 보내지 않는다. 범위를 바꾸면 다시 부르고, 그 밖에는 제목 줄의 새로고침 버튼으로만 다시 부른다(HOM-08). 응답의 `asOf` 를 「MM-DD HH:mm 기준」으로 보인다.
- 홈은 메뉴가 아니라 헤더가 이동시키지 않는다 — 클라이언트 컴포넌트가 `bff()` 로 부른다. summary 와 pending 은 따로 불러 한쪽이 실패해도 다른 쪽은 보인다.
- 플랫폼 계정(`platform: true`)은 현황 없이 안내와 Platform 콘솔 바로가기만 보인다.
- 수치 카드 넷: 재직 직원 · 운영 점포 · 오늘 출근 · 내 문의. api 가 null 을 준 카드(권한 없음)는 숨긴다(「준비 중」 자리 없음).
- 내 문의는 로그인한 관리자가 쓴 문의다. 처리 대기의 문의 줄은 최근 7일 안에 답변완료된 것이다.
- 소속 확인 거절은 그 직원 레코드에 새 진행(재발송 · 새 계약 · 퇴직 처리)이 생길 때까지 처리 대기에 남는다.
- 경고 밴드는 `renewals` 가 있을 때만(종료일 7일 안 갱신 예정). 가려진 직원(isMasked)은 이름 없이 점포와 날짜만 보인다.
- 홈에 운영 알림 목록을 두지 않는다. 헤더는 고치지 않는다.

## 화면

1. **제목 줄** — 「안녕하세요, {이름}님」, 오른쪽에 「MM-DD HH:mm 기준」과 새로고침 버튼.
2. **경고 밴드** — 「갱신 예정」 배지 · 「계약 갱신 예정 N건이 7일 안에 끝납니다」 · 대상 셋까지(이름(점포) MM-DD, 나머지는 「외 N명」) · [계약 보기] · [새 계약 작성](근로계약 관리 등록 권한).
3. **수치 카드 넷** — 재직 직원(정직원 · 파트, 미체결 계약 수) · 운영 점포(직영 · 가맹) · 오늘 출근(근무 예정 · 미출근) · 내 문의(답변 대기 · 답변완료). 갈 화면에 조회 권한이 있으면 카드가 링크다(직원 목록 · 점포 정보 관리 · 출·퇴근 현황 · 문의하기). 오늘 출근은 출·퇴근 현황(/attendance-records) 조회 권한이 있을 때 링크다(2026-10-27 재영). 본사 역할 안내는 범위에 가맹 점포가 있을 때만 보인다.
4. **점포별 현황 표** — api 가 준 일곱 곳(미조치 많은 순). 점포 · 유형 · 재직 직원 · 미체결 계약 · 오늘 출근(출근 / 근무 예정) · 미조치. 0 은 「—」, 권한 없는 칸(null)도 「—」. 아래에 「전체 N개점 중 상위 M개 · 미조치 많은 순」과 [직원 목록] 링크.
   - 목업의 전체 · 직영 · 가맹 탭은 두지 않는다 — 업무 범위는 헤더 한 곳에서만 고른다(운영 정책 SCP-01). 탭을 두면 헤더 범위와 표의 범위가 따로 놀게 된다.
5. **처리 대기** — api `items` 순서 그대로. 구분 · 항목(목록으로 가는 링크) · 내용. 0건 유형은 api 가 이미 뺀다. 줄이 없으면 「처리할 일이 없습니다.」
6. **점포가 없는 BP** — 「등록된 점포가 없습니다」와 점포 등록 링크(점포 정보 관리 등록 권한이 있을 때, HOME-4).
7. **범위에 드는 점포가 이 탭에 없을 때**(`isUnusableScope` — 다른 BP 탭에서 복사한 범위 등) — api 를 부르지 않고 「상단에서 범위를 다시 고르세요」 안내만. 쿼리를 빼면 BP 전체가 보이기 때문이다.
8. **오류** — api 가 401 이면 로그인 화면으로 보낸다(SessionGate 와 같다). 이 화면이 모르는 처리 대기 유형은 그 줄만 건너뛴다.

### 처리 대기 문구 · 링크

대표 이름(`firstName`)이 가려졌으면 이름 없이 「N건」이다. 경과는 0일이면 「오늘 발송」처럼 쓴다.

| 유형 | 구분 | 항목 | 내용 | 링크 |
|---|---|---|---|---|
| CONTRACT_RENEWAL | 계약 | 계약 갱신 예정 N건 | 서지안 외 1명 · 새 근로계약서 초안 없음 | `/contracts?storeIds=3,7&status=SIGNED` |
| CONTRACT_PENDING_SIGNATURE | 계약 | 근로계약 서명 대기 N건 | 남도현 외 2명 · 발송 후 6일 경과 | `/contracts?storeIds=3&status=PENDING_SIGNATURE` |
| CONTRACT_CORRECTION_REQUESTED | 계약 | 근로계약 수정 요청 N건 | 이름 · 요청 후 N일 경과 | `/contracts?storeIds=3&status=CORRECTION_REQUESTED` |
| AFFILIATION_REJECTED | 직원 | 소속 확인 거절 N건 | 이름 · 거절 후 N일 경과 | `/staff-members?storeIds=3&joinGroup=INVITED` |
| INQUIRY_ANSWERED | 문의 | 문의 답변완료 N건 | 제목 외 N건 · 답변 후 N일 경과 | `/bp/{bp}/support-inquiries?status=ANSWERED` |
| URGENT_TODO | TO-DO | 긴급 TO-DO N건 | 제목 외 N건 · 등록 후 N일 경과 | `/todos?storeIds=3&status=PENDING%2CIN_PROGRESS&urgent=1` |

- 주소는 각 목록의 주소 만들기(`listHrefOf` · `staffListHrefOf` · `toTodoListSearch`)로 만들어 그 목록의 query 파서와 어긋나지 않는다. 문의하기는 탭 BP 주소(`bpPath`)다.
- 직원 목록은 가입 상태를 묶음(가입·인증 체크)으로만 거른다 — 거절(REJECTED)은 「초대」 묶음(초대 · 만료 · 거절)에 들어 있어 그 묶음으로 건다. 거절만 따로 보이지는 않는다.

### 알려진 한계 (front #148 리뷰, 목록에 조건을 더하지 않기로)

- 갱신 예정 줄 · 경고 밴드 「계약 보기」는 근로계약 목록의 그 점포 체결 완료 **전부**를 연다 — 목록에 종료일 조건이 없어 7일 안에 끝나는 것만 따로 보이지 않는다.
- 문의 답변완료 줄은 문의하기 목록의 답변완료 **전체**를 연다 — 목록에 기간 조건이 없어 최근 7일(api 기준 마지막 답변 7일) 것만 따로 보이지 않는다.
- 소속 확인 거절은 직원 목록의 「초대」 묶음(초대 · 만료 · 거절)으로 연다 — 위 직원 목록 줄.
- TO-DO 상태 이름 「미완료」를 쓰지 않으려고(용어집 TO-DO 상태 3종) 항목을 「긴급 TO-DO N건」으로 줄였다.

## api 연결

- `GET /home/summary?storeIds=1,2` → `HomeSummaryResponseDto`, `GET /home/pending?storeIds=1,2` → `HomePendingResponseDto`(`bff()` · BFF 일반 GET 프록시).
- 타입: `WHALE_API_DIR=~/.whale-erp-worktrees/whale-erp-api/machu-picchu pnpm openapi:types`.
- 범위가 점포 하나여도 이 PR 에서는 같은 여러 점포 화면에 그 점포 하나로 보인다(점포 하나 화면은 다음 PR).

## 목업 · 데모 정리

- 처리 대기의 「가입 연결 확인 필요」 줄을 뺀다(없앤 규칙, 운영 정책 JOI-05 · 06). api 유형 여섯에 맞춰 근로계약 수정 요청 줄을 더하고 순서를 api 순서로 바꾼다.
- 쟁점 HOME-8 을 「확정 · 2026-10-27 재영」으로 더한다 — 플랫폼 계정은 안내만 · 내 문의는 내가 쓴 문의 · 문의 줄은 최근 7일 답변완료 · 소속 확인 거절은 새 진행이 생길 때까지.
- 점포 하나 탭의 「연결 보류」 직원 줄은 다음 PR 몫이라 둔다.

## 확인

1. 순수 함수 테스트 — `node --test src/app/home/home-view.test.ts` (범위 → storeIds, 처리 대기 문구 · 링크, 가린 이름, 경고 밴드 문구)
2. `corepack pnpm lint` · `npx next typegen` → `corepack pnpm exec tsc --noEmit` · `corepack pnpm test` · `corepack pnpm build`
3. 화면 띄우기 · 스크린샷은 재영이 따로 한다.
