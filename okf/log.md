# Bundle history

## 2026-10-19
* **Update**: [직원 정보 관리 화면 (구현)](/screens/staff-members.md) — 리뷰 반영: 직원 상세 TO-DO 영역의 「관리」 · 제목 링크를 MN000026 조회 권한으로 가른다(없으면 글자).
* **Update**: [직원 정보 관리 화면 (구현)](/screens/staff-members.md) — 직원 상세의 TO-DO 영역을 `GET /staff-members/:id/todos` 로 채우고 「관리」를 `/todos`(MN000026) 에 걸었다(#118, TO-DO 리스트 관리 화면 #116 · #117 과 함께).
* **Update**: [직원 정보 관리 화면 (구현)](/screens/staff-members.md) — PR #47 리뷰 반영: 응답에 enum 이 빠져 `getEnum` 이 빈 목록을 주면 받지 못한 것과 같이 근로계약 칸의 계약 유형 · 계약 상태를 「-」로 둔다(`labelsOrNull`). 영문 값이 보이던 경로였다.
* **Update**: [직원 정보 관리 화면 (구현)](/screens/staff-members.md) — WHALEERP-184 직원 상세의 근로계약 칸을 채웠다. 가장 최근 계약으로 `GET /contracts/:id` 를 따로 받아 계약 유형 · 기간 · 상태 · 갱신 예정일(종료일 30일 전)을 보이고, 못 받으면 이 칸만 안내 · 「다시 하기」. 최근 발송일은 발송 로그 테이블이 생길 때까지 「-」, 「관리」는 그 계약 상세로 간다(2026-10-19 노영주). 리뷰 반영: 종료일이 지난 체결 완료는 목록처럼 갱신 예정일 「-」. 2차 리뷰 반영: enum 을 못 받아도 칸은 그리고 그 값만 「-」, 403 은 경고 로그, 실패 로그에 상태 코드, 최근 발송일 근거(상세 응답에만 없음)와 「아직 없는 것」의 낡은 두 줄(발송 api · 관리 링크 대상)을 바로잡았다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — front #41 재리뷰 참고 반영(영주). 발송 확인창이 서버 액션 호출 자체가 끊겨도(브라우저 ↔ Next · 배포 중 재시작) 오류 화면 대신 「발송됐는지 알 수 없음」으로 보내기를 막고 상세를 다시 읽는다.

## 2026-10-16
* **Update**: [Notifications](/notify.md) — 근로계약 화면(목록 · 작성 · 이어 쓰기 · 상세)의 임시 헤더(`GlobalHeader` · 샘플 메뉴 · `NotificationBellSlot`) · 바깥 틀과 `contracts/layout` 의 `ErpRoot` 를 걷었다 — 공통 틀(AdminFrame)이 헤더를 그려 헤더가 두 번 보이던 것(WHALEERP-592 재범위: 헤더 · 틀 정리). 화면은 `PageBar` 부터 그린다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — front #41 리뷰 반영(영주). 발송 확인창이 접수 여부 모름(SEND_UNCONFIRMED · 코드 없는 502 · 504 · api 응답 전 끊김)과 409 상태 충돌 · 「다른 요청이 먼저 고침」이면 보내기를 막고 상세를 다시 읽는다(`send-model.ts`). 응답 전 끊김은 오류 화면 대신 확인창 문장. api-types 를 api #59 반영(2a826ee)으로 다시 만들었다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 근로계약 상세의 「발송」(발송 대기) · 「재발송」(서명 대기)을 켰다(WHALEERP-136, api psyduck). 확인창 → 서버 액션 `sendContract` → `POST /contracts/:id/send`, 실패 문장은 확인창에. api-types 를 다시 만들었다.
* **Update**: [직원 정보 관리 화면 (구현)](/screens/staff-members.md) — front #40 재리뷰 사소 반영(영주). 퇴직 확인창의 「닫힐 근로계약」 설명에 「수정 요청」을 더했다(api #58 이 퇴직 때 수정 요청도 닫는다). api-types 를 api #58(e57f334) openapi 로 다시 만들었다(설명 문구만).
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — front #40 리뷰 참고 반영. 수정 요청 모드에서 근무지 선택을 잠그고(api #58 이 근무지 변경을 400 으로 막음) 하단 안내를 수정 요청 문구로 바꿨다. 대체 확인창에 「수정 요청」을 더했다(api 의 대체 종료 대상과 같게). `api-types.generated.ts` 를 api #58 반영(71b0f20) openapi 로 다시 만들었다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 근로계약 「수정 요청」 상태 표시와 날인 전 근로자 정보 수정 화면 `/contracts/[contractId]/worker`, 수정 요청 계약을 고치는 이어 쓰기 `correction` 모드(WHALEERP-125 · 126). 상세 제목 줄에 「근로자 정보 수정」 · 「계약서 수정」. api-types 를 api nidoran 으로 다시 만들었다.
* **Update**: [직원 정보 관리 화면 (구현)](/screens/staff-members.md) — PR #42 리뷰 반영: 상세 「이메일」 칸의 가입 상태 한글을 상수 대응표 대신 `getEnum("StaffJoinState")` 로 받는다(naming.md). 「가입 전」 · 「-」만 화면 문구로 남기고, enum 을 받지 못하면 상세는 그리고 이 칸만 「-」다. 목록 `joinCell` 의 상수는 남은 일 그대로다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — `api-types.generated.ts` 를 api #60(jolteon 4935fe2, WHALEERP-180) openapi 로 다시 만들었다(PR #42 리뷰: 처음엔 커밋 전 작업 트리로 만들어 #60 head 와 email 설명 한 줄이 달랐다). 상세 `email` 설명만 바뀌었다(조회 권한이면 보인다). api #60 머지 뒤 api main(9df02b7) 기준으로 다시 만들어 차이가 없음을 확인했다.
* **Update**: [직원 정보 관리 화면 (구현)](/screens/staff-members.md) — WHALEERP-180: 상세 이메일은 조회 권한이면 보이고 고치지 못한다(회원 ID). 없을 때 초안 · 초대 발송은 「가입 전」, 초대 만료 · 거절 · 연결 보류 · 소속 추가 확인 · 복귀 확인 · 가입 불가는 목록의 가입 상태 글자(어긋나면 staff-row.test.ts 가 잡는다), 가입 완료 · 모르는 값이면 「-」(`staffEmailText`, PR 전 리뷰 두 차례). ACC-16(근무지에서 직접 물을 때만 알려 줌)은 화면에 넣지 않고 문서로만 둔다. 주석의 「수정 권한 없음이면 null」을 뺐다(2026-10-16 노영주).
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — api #56 머지(api main b119919) 뒤 `api-types.generated.ts` 를 api main 기준으로 다시 만들어 머지 전 브랜치(rapidash 0ed2373) 기준과 차이가 없음을 확인했다. main(front #38) 병합 — okf/log.md 충돌만 풀었다.
* **Update**: [직원 정보 관리 화면 (구현)](/screens/staff-members.md) — PR #37 리뷰 반영: 409 면 문구를 토스트로 알리고 확인창을 닫은 뒤 상세를 다시 받는다(다시 받으면 확인창이 함께 내려가 문구가 사라졌다). 응답에 email 칸이 없으면 버튼을 숨긴다. 「이메일」 줄 표시 범위는 확정(api #56 5d671d6)으로 고쳤다.
* **Update**: [직원 정보 관리 화면 (구현)](/screens/staff-members.md) — api #56 이 상세 `email` 을 더 좁혔다(0ed2373: 퇴직 레코드 · 수정 권한 없는 관리자도 null). 주석 · 문서를 맞췄다. 기본 정보 「이메일」은 null 이면 「-」 그대로, ACC-17 은 「보일 때 고치지 못한다」로 읽는다(노영주, 재영 확인 전). 버튼 판정은 그대로다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — `api-types.generated.ts` 를 api #56(rapidash 0ed2373, 머지 전) openapi 로 다시 만들었다. 상세 `email` 설명만 바뀌었다.
* **Update**: [직원 정보 관리 화면 (구현)](/screens/staff-members.md) — api #56 이 상세 `email` 을 링크 발송과 같은 기준으로 바꿨다(0d69bcf: 본사 역할이 동의로만 보는 가맹 점포 직원도 null). email null 전제를 적은 주석 · 문서를 고쳤다. 버튼 판정은 그대로다 — 본사 역할 + 직영 아님으로 이미 숨긴다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — `api-types.generated.ts` 를 api #56(rapidash fa67545, 머지 전) openapi 로 다시 만들었다. 상세 `email` 설명만 바뀌었다.
* **Update**: [직원 정보 관리 화면 (구현)](/screens/staff-members.md) — PR #37 리뷰 반영: 확인창 핸들러를 `handleConfirm` 으로(naming.md `handle` 접두).
* **Update**: [직원 정보 관리 화면 (구현)](/screens/staff-members.md) — PR #37 리뷰 반영: 서버 액션 「결과 모름」 로그에 기능 이름(퇴직 · 비밀번호 초기화)과 staffMemberId 를 남긴다(앞 변경에서 퇴직 접두가 빠졌다).
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — `api-types.generated.ts` 를 api #56(rapidash 4748961, 머지 전) openapi 로 다시 만들었다: 직원 상세 응답 `StaffMemberDetailResponseDto`(+ `email`), 재설정 링크 403 설명, main 의 다른 변경 포함. api 머지 뒤 api main 기준으로 다시 만든다.
* **Update**: [직원 정보 관리 화면 (구현)](/screens/staff-members.md) — 비밀번호 초기화 2차 리뷰 반영(노영주): 429 는 api 문구(이미 보냈다는 사실), 탈퇴(가입 완료 + email null) 직원에게 버튼 숨김, 409 면 상세를 다시 받음, 서버 액션을 부르지 못하면 「화면을 새로 고친 뒤」, 결과 모름 로그에 staffMemberId. 599 대기 · TODO(599) 서술을 지웠다(api main 머지, `:id` = staffMemberId).
* **Update**: [직원 정보 관리 화면 (구현)](/screens/staff-members.md) — 비밀번호 초기화 PR 전 리뷰 반영: 본사 역할은 직영 점포 직원에게만 버튼(가맹 직원은 api 가 404), 프록시 503 은 결과 모름, 확인 버튼 이중 클릭 막기, 상세 확인창 실패 처리를 `use-action-failure.ts` 로 분리.
* **Update**: [직원 정보 관리 화면 (구현)](/screens/staff-members.md) — 비밀번호 초기화(WHALEERP-177)를 api 에 붙였다. 가입 완료 · 재직(퇴직 예정 포함) · 수정 권한일 때만 버튼, 데모 확인창, 429 · 503 · 결과 모름 문구. 받는 곳 이메일과 기본 정보 「이메일」 줄은 api #56 상세 응답 `email` 로 채웠고(타입은 api 브랜치로 생성, 머지 뒤 다시 만든다), 발송 시각 · 기한(완료 조건 4)은 이메일 발송 로그 테이블과 함께 따로 다룬다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 근로계약서 작성 · 이어 쓰기에 성별(남 · 여, 초안 저장부터 필수)과 외국인 체크, 상세에 「성별」 줄을 더했다(WHALEERP-125 본인 대조 · 132). api-types 를 api sandshrew 로 다시 만들었다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — `api-types.generated.ts` 를 api #49 5차 반영(7a5ddec) openapi 로 다시 만들었다(`replaceContractIds` 상한 200, main 의 다른 변경 포함). 화면 동작은 그대로다.
* **Update**: [직원 정보 관리 화면 (구현)](/screens/staff-members.md) — PR #36 재리뷰(bfb3306) 반영: 퇴직 확인창이 확인할 때 브라우저 시계로 오늘을 바꾸지 않고, 서버 액션이 날짜 바뀜으로 막으며 돌려준 서버의 오늘로만 바꾼다(`todayAfterSubmit`) — 브라우저 시계가 빠를 때의 과잉 경고와 경고가 번갈아 보이던 것. api 시계와의 틈은 api 「기대한 오늘」 후속.
* **Update**: [직원 정보 관리 화면 (구현)](/screens/staff-members.md) — PR #36 재리뷰 반영: 퇴직 확인창의 자정 넘김 재확인을 서버 액션이 서버 시계로 다시 판정한다(브라우저 시계가 늦으면 경고 없이 즉시 정리되던 틈). storeIds 없는 예전 주소는 첫 화면에 「점포를 찾는 중입니다.」를 보여 빈 목록이 깜빡이지 않는다.
* **Update**: [직원 정보 관리 화면 (구현)](/screens/staff-members.md) — PR #36 리뷰 반영: 목록 검색어 50자 · 쪽 1,000,000 · 점포 500곳을 api 상한 안에서 화면이 먼저 막고(넘기면 목록 전체가 오류 화면이었다), storeIds 없는 예전 주소는 필터가 점포 id 를 채운다. 퇴직 확인창을 연 채 자정을 넘기면 확인할 때 오늘을 다시 세어, 경고 없이 즉시 정리될 날짜면 다시 확인받는다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — PR #35 블로커 반영: 권한 수정 폼이 고치던 중 최신 값을 먼저 받아 둔 뒤 동시 수정 409 를 받으면 refresh 를 기다리지 않고 받아 둔 값으로 바로 다시 채운다(`afterConflict`) — 전에는 다시 채우기가 돌지 않아 저장이 계속 409 였다.

## 2026-10-15
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — front #33 3차 리뷰 반영(영주). `/contracts/paper` 의 Origin 검사를 Next 16.3 서버 액션(`parseHostHeader`)과 똑같이 했다 — `x-forwarded-host` 가 있으면 첫 값만 보고 `host` 로 다시 보지 않는다. `api-types.generated.ts` 를 api #49 4차 반영 openapi 로 다시 만들었다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — api #49 3차 리뷰에 맞췄다. 같은 점포 진행 중 계약 대체 확인창이 계약마다 직원 이름 · 계약 기간을 보인다(409 `contracts` 의 `name` · `startDate` · `endDate`, 없으면 뺀다). `api-types.generated.ts` 를 api #49 의 openapi 로 다시 만들었다(503 설명 · main 의 다른 변경 포함).
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — front #33 재리뷰 반영(영주). `/contracts/paper` 의 Origin 검사를 서버 액션 기준으로 맞췄다(`x-forwarded-host` 첫 값 또는 `host`) — `src/lib/paper-request.ts` 로 옮기고 proxy 401 경로 판정(`answersWith401`)과 함께 단위 테스트를 더했다. 근로계약서 작성 · 이어 쓰기에서 저장하지 못하면 폼 맨 아래 안내로 화면을 옮긴다(위쪽 버튼을 누르면 안내가 화면 밖이라 제자리처럼 보였다).
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — front #33 리뷰 반영(영주). 상세는 `documents` 가 없어도 깨지지 않는다(api #49 전 배포 대비). 세션이 끊긴 채 「종이 계약 등록」을 누르면 proxy 가 `/contracts/paper` 에는 401 JSON 을 줘 로그인으로 간다. 날인본 내려받기가 실패하면 상세로 돌아와 안내(`?document=`)를 띄우고, 401 이면 쿠키를 지우고 로그인으로. `/contracts/paper` 는 Origin 이 다르면 403. 종이 계약 대체 확인창에 체결 완료 종료를 적었다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 종이 계약 등록(CTR-23, Plane #132): 계약 방식 「종이 계약」을 열고 날인본 칸(근로계약서 필수 · 임금계약서 선택)과 「종이 계약 등록」 버튼, 라우트 핸들러 `/contracts/paper` 로 multipart 를 api 에 넘긴다(서버 액션 한도 6MB 를 넘어서). proxy 본문 한도 21MB. 상세에 계약 방식 · 날인본 내려받기 링크(`/contracts/[contractId]/documents/[contractDocumentId]`).
* **Update**: [직원 정보 관리 화면 (구현)](/screens/staff-members.md) — WHALEERP-585: 목록 · 상세를 목 데이터에서 api(`GET /staff-members` · `GET /staff-members/:id` #599)로 바꾸고 목 데이터를 지웠다. 점포명은 로그인 정보의 관리 점포로 점포 id 를 찾는다(점포 목록 api 는 점포 메뉴 권한이 필요해서). 상세 머리에 퇴직 처리 · 퇴직일 변경 · 취소 확인창(미리 보기 건수, 처리하면 퇴직 예정, 닫힐 근로계약에 임시저장 포함)을 두고, 공통 `ConfirmDialog` 에 `confirmVariant` 를 더했다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) · [시스템관리](/system.md) — 전체 PR 리뷰 반영: 메뉴 권한 회수 확인창 Esc 가 팝업까지 닫던 것, 메뉴 저장 5xx 는 고친 칸을 두고 409 · 결과 모름 뒤 다시 채움을 알림, 조회가 잠긴 줄의 등록 막음, 동시 수정 409 만 칸 다시 채움, 공통코드 403 문구 그대로 · 저장 뒤 갱신 실패를 성공으로, 막힌 이유를 글자로(enum 을 못 받으면 일반 문구), 메뉴 코드 타입 · 권한 찾기 순수 함수(`menuPermissionOf`) · 권한 폼 검증(`role-form-sync`) 테스트. system.md 에 PA000001 이 api 에서 고정 권한이 아니라는 구현 메모를 더했다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 2차 코드 리뷰 반영: 권한 수정 폼이 기준값(`role-form-sync.ts`)으로 저장해 남의 변경을 덮어쓰지 않게(바뀐 것 없으면 [저장] 막음), 생성 타입을 giza 최신 openapi 로 다시 만들어 권한 목록은 `PlatformRoleGroupSummaryListResponseDto`, 플랫폼 관리자 권한 선택지는 생성 타입으로 되돌림, PA000001 고정 권한 문구 정리, 서비스 탭 휠 끝 · Tab 키 대상, 핸들러 이름 `handle` 접두.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) · [점포 관리](/stores.md) — 코드 리뷰 반영: 공통코드 [추가]는 수정 + 등록 권한일 때만(api 가 패널 저장을 늘 수정으로 본다), 권한 화면 409 뒤 실패 문구 · 삭제 확인창이 사라지지 않게(최신 값은 409 뒤에만 다시 채움), 바꿀 수 없는 등록 · 수정 · 삭제가 켜진 줄은 조회도 막음, 서비스 탭 휠 · 방향키, 플랫폼 계정은 BP 선택기 전까지 점포 등록 불가를 적고 권한 화면의 api 머지 순서를 적었다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 플랫폼 권한 관리(MN000214, `/platform/system/roles`) 화면을 더했다. api `/platform-role-groups`(giza 작업분 openapi)로 생성 타입을 다시 만들었다. api 에 같은 이름의 DTO(`PlatformRoleGroupListResponseDto`)가 둘이라 플랫폼 관리자 권한 선택지 응답은 임시로 손 타입을 쓴다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) · [점포 관리](/stores.md) — 로그인이 생겨 플랫폼 관리자 · 플랫폼 공통코드 · 점포 정보 관리의 임시 장치를 걷었다: 화면 권한 `?permission=view`(`current-permission.ts`) 대신 로그인 메뉴 권한(`useMenuPermission`, 등록 · 수정 · 삭제 따로), 지금 사용자는 `current-admin.ts` 대신 로그인 정보 `account`, 점포 등록 BP 는 환경 변수 `STORE_REGISTER_BP_CODE_ID` 대신 이 탭의 BP, 점포 상태 · 유형 · 층 · 권한 유형 라벨은 상수표 대신 로그인 정보의 공통코드(`CodeLabel`), 점포 오류 화면은 공통 틀 안에 맞췄다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — PR #30 ⑤ 블로커 반영: 사업자정보 칸에 값이 있는데 인증이 없으면(재인증 · 10분 경과 · 가입 거절 뒤) 가입 요청을 보내지 않고 인증하거나 비우게 한다. 보이던 사업자정보가 빠진 채 가입되던 것.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) · [로그인](/auth.md) — 회원가입 사업자정보 「인증하기」를 api 국세청 진위확인(`POST /auth/signup/business-verifications`, api lapras)에 이었다. 받은 10분 토큰을 가입 때 `bizVerificationToken` 으로 싣고, 10분 경과 · 가입이 토큰 만료(400) · 사업자번호 중복(409)으로 거절되면 인증을 풀고 다시 인증하게 한다. 회원가입의 사업자정보는 세 칸뿐이고 대표자 연락처 등은 마이페이지 · 점포에서 받는다고 `auth.md` 를 고쳤다(2026-10-15 사용자 확인).
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — PR #23 ⑤ 블로커 반영: 회원가입 아이디 칸을 입력하는 순간 소문자로 바꿔 보인다. api 는 소문자로 저장하고 관리자 웹 로그인은 대소문자를 구분해, 대문자로 가입한 사람이 같은 아이디로 로그인하지 못하던 것.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 회원가입 PR 리뷰(pr-review-toolkit) 반영. 가입 완료 화면은 URL 쿼리(signupToken 등)를 읽지 않고 가입 성공 뒤 서버 액션이 심는 httpOnly 쿠키로 값을 받으며, 쿠키가 없으면 로그인으로 보낸다(`S-UUBGOD`). 서버 액션이 사용자 IP(`X-Forwarded-For`)를 api 로 넘기고, 10초 제한 · 응답 모양 검사 · 실패 문구 분리(400 · 409 만 api 문구, 429 는 「잠시 후 다시 시도해 주세요.」 — `S-RCJXIG`)를 넣었다. 409 면 아이디 · 이메일을 다시 확인한다. 완료 경로는 상수 하나(`SIGNUP_DONE_PATH`)로 쓰고 공개 경로 · 쿠키 모양 · 검사 경계값 테스트를 더했다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 회원가입(`/signup`)에 이어 가입 완료(`/signup/done`)도 guest 디자인으로 다시 맞췄다 — `design/guest/sign-up/complete` 샘플의 두 칸 틀(`GuestPage`·`GuestVisual`·`GuestButton`)을 그대로 가져와 가입 성공 쿠키 값(상호명·아이디·이메일)을 끼워 넣었다. `SiteFooter`(로그인 전 틀 전체가 공유)도 guest 디자인(`guest.mjs` footer)으로 전역 전환했다 — `/login`·홈 푸터도 같이 바뀐다(두 화면의 본문은 아직 ERP 스타일이라 디자인이 섞여 있다). 고치다가 `src/proxy.ts` 의 로그인 게이트 matcher 가 `/guest/*` 정적 자산(비주얼 그림·푸터 로고)을 빼먹어 비로그인 사용자에게 `/login` 으로 307 리다이렉트하던 버그를 찾아 `guest/` 를 matcher 제외 목록에 더했다 — `/design/guest` 샘플은 보는 사람이 이미 로그인돼 있어 드러나지 않았다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — front #28 리뷰 반영: 막힌 입력칸 회색을 공통 `theme.ts` 에서 빼고 근로계약서 작성 화면(과 데모 작성 화면)에서만 적용한다. 1팀 화면(플랫폼 사용자 관리 · 점포 수정 · 날짜 칸)의 막힌 칸은 그대로다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) · [직원 운영 관리](/staff.md) — 근로계약서 데모 확인(2026-10-15)과 노무사 답변(2026-10-14)을 작성 화면에 반영했다. 시급 줄을 소정근로시간 표 위로, 표 바로 밑에 급여 지급 방식(계좌 · 현금), 파트타이머는 표에서 요일별 시업 · 종업 · 휴게를 고친다. 주휴일을 고르는 칸으로 되살렸다(주 15시간 미만이면 없음, 7일 근무면 초안 저장을 막는다). 정직원 수습 묶음(기간 · 감액률 · 수습 중 시급, 1년 미만 계약 · 최저임금 90% 아래면 막는다), 4대보험 가입 대상 안내, 계산 기준 안내(주휴 ÷ 5 · 연장 + 야간 2.0배 · 계약 밖 요일 1.5배), 읽기 전용 · 막힌 칸 회색. 상세에 주휴일 · 급여 지급 방식 · 수습. 최저임금은 시스템이 관리하기 전까지 하드코딩. 데모(docs/demo)에도 같은 내용을 넣었다.
* **Update**: [고객지원](/support.md) — SUPPORT-4 를 「한 화면 세 탭」에서 「화면 셋 · 메뉴 셋」으로 바꿨다(2026-10-15 재영 A안, WHALEERP-596): 공지사항 `/support-notices` · FAQ `/support-faqs` · 문의하기 `/support-inquiries`, 메뉴 순서도 이대로. 공통 틀의 메뉴 권한 판정이 해시를 보지 않기 때문이다. 목업 · 유저플로우 문구와 목업 LNB 순서도 맞췄다. 메뉴 데이터는 api 마이그레이션이 바꾼다.
* **Update**: [고객지원](/support.md) — SUPPORT-4 를 「한 화면 세 탭」에서 「화면 셋 · 메뉴 셋」으로 바꿨다(2026-10-15 재영 C안, WHALEERP-596): 공지사항 `/support-notices` · FAQ `/support-faqs` · 문의하기 `/support-inquiries`, 메뉴 순서도 이대로. 공통 틀의 메뉴 권한 판정이 해시를 보지 않기 때문이다. 목업 · 유저플로우 문구와 목업 LNB 순서도 맞췄다. 메뉴 데이터는 api 마이그레이션이 바꾼다.
* **Update**: [운영 알림](/notify.md) — 운영 알림함(`/notifications`)을 공통 틀에 맞췄다. page 의 바깥 틀 · 임시 헤더(견본 메뉴 · 점포 · 고정 이름 · 종)와 layout 의 `ErpRoot` 를 뺐다. `[id]/open` 은 자체 틀이 없어 그대로다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) · [점포 관리](/stores.md) — PR #27 2차 리뷰 블로커 반영: 주소 검색 · 좌표 액션이 쿠키 모양만 보지 않고 토큰을 `GET /auth/admin/login-info` 로 확인한 뒤 키를 쓴다(꾸민 쿠키로 통과하던 것), `STORE_REGISTER_BP_CODE_ID` 는 개발 DB 전용이라 운영 · 스테이징에 넣지 않는다고 적었다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — PR #27 리뷰 블로커 반영: 주소 검색 · 좌표 server action 이 로그인 세션 없이는 JUSO · 카카오 키를 쓰지 않게, 점포 대표자 연락처 검사를 api 와 같은 숫자 10~11자리로(유선 번호 점포도 수정 저장 가능).
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 관리자 로그인이 들어온 main 을 받고 점포 화면을 공통 틀(AdminFrame) 안에 맞췄다(`StoreFrame` 은 제목 줄 · 본문만, `stores/layout.tsx` 의 ErpRoot 는 걷음 — 헤더 · 높이 · 테마는 공통 틀이 잡는다). 로그인 전에 쓰던 개발 토큰 `API_DEV_TOKEN` 을 지웠다 — api 가 토큰의 접속(sid)까지 확인해 서명만 맞춘 토큰은 더 통하지 않는다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) · [점포 관리](/stores.md) — 점포 화면 2차 리뷰와 api 3팀 계약(mankey) 반영: 등록 BP 를 코드에 박지 않고 환경 변수 `STORE_REGISTER_BP_CODE_ID` 로(없으면 싣지 않음), 진위확인은 지금 칸 값과 같을 때만 인증으로 보고 인증 안 한 변경은 저장 전에 막음(`savedCeoName`), 카카오 좌표는 십진수 · 범위 안만, 운영 조건 한글은 `GET /enums/StoreOperationRequirement`(상수표 지움), 폐점 + 이미지 저장 결과 모름 문구, 잘린 엑셀은 저장하지 않음, 주소 승인키 만료(E0014) · 시스템 오류는 설정 오류로, 칸을 못 찾은 검증 오류는 띠로, 핸들러 이름 `handle` 접두. 생성 타입은 api mankey openapi 로 다시 만들었다. `stores.md` 에 `sources` 를 더했다.

## 2026-10-14
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — main 병합(1팀 관리자 로그인 · 공개 경로 · 비로그인 디자인). 회원가입 · 가입 완료를 `/auth/signup` · `/auth/signup-done` 에서 `(public)/(site)/signup` · `/signup/done` 으로 옮겨 로그인과 같은 로그인 전 틀을 쓰게 했다 — 공개 경로 목록이 `/signup` 이라 옛 경로는 로그인을 요구하게 됐다. 자체 GNB · 푸터(`site-page.tsx`)와 로그인 대기 안내창(`login-pending.tsx`)은 지우고, 로그인 링크와 「웨일ERP 시작하기」는 `/login` 으로 보낸다. 데모의 회원가입 · 가입 완료는 main 의 비로그인 디자인을 따랐다.
* **Update**: 회원가입 코드리뷰 반영 — 입력칸에 `aria-invalid`·`aria-describedby` 를 걸어 오류 테두리·스크린리더 연결을 살리고, 칸을 고치면 바로 오류를 지우고(기존엔 blur 때만), 제출 때 첫 오류 칸으로 포커스를 옮긴다. 비밀번호 칸의 불필요한 `aria-label` 을 빼 "(필수)" 안내가 다시 들리게 했다. 가입 완료 화면은 `signupToken` 이 없으면 상호명·아이디·이메일을 보이지 않는다(주소에 값만 지어 넣는 위조 방지). `validators.ts` 에 테스트를 더했다. [Whale ERP Frontend](/whale-erp-front.md).
* **Add**: BP 회원가입·가입 완료 화면(`src/app/auth/`)을 pikachu 브랜치에서 옮겨 왔다 — 기본정보·사업자정보 인증(선택)·약관동의·제출, 공개 화면 틀(GNB·푸터, `site-page.tsx`), 로그인 화면이 없어 LOGIN·로그인 링크 등은 개발 예정 안내창, 로고·"웨일ERP 시작하기"는 `/auth/signup` 으로. 디자인 데모(`docs/demo/src/pages/auth/signup*.mjs`)도 함께 옮겼다. [Whale ERP Frontend](/whale-erp-front.md).
* **Update**: 바꿀 수 없는 입력칸 모양(disabled 에 더해 readOnly 도 #f8f9fb 바탕·회색 글자)을 [Whale ERP Frontend](/whale-erp-front.md) 공통 컴포넌트 설명과 DESIGN.md 「바꿀 수 없는 칸」 규칙에 적었다.
* **Update**: [직원 정보 관리 화면](/screens/staff-members.md) — 목록 · 상세를 공통 틀에 맞췄다(WHALEERP-593). page 의 바깥 틀 · 임시 헤더(견본 메뉴 · 점포 · 고정 이름)와 layout 의 `ErpRoot` 를 뺐고, 상세 「관리」 링크를 메뉴 url 결정(#592)의 한 단계 주소로 바꿨다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) · [점포 관리](/stores.md) — 점포 화면 전체 리뷰(코드 · 테스트 · 주석 · 오류 처리 · 타입) 반영: 결과를 모를 때 등록은 저장을 잠그고 목록 확인 안내, 수정 · 삭제 · 폐점 전 이미지도 「모름」을 따로 알림, 플랫폼 관리자 등록은 BP 를 늘 먼저 싣고 막히면 빼고 다시 보냄, 층 줄 키 충돌과 모르는 층 구분 보존, 검증 오류를 칸마다 나눔, 엑셀은 4xx 문구 그대로 · xlsx 가 아니면 저장 안 함, 주소 · 좌표 키 오류는 서버 로그로, 찾지 못한 점포 id 는 조건에서 빼고 알림, 이력만 실패하면 이력 칸에만 알림. 대표 이미지 · 엑셀을 붙이며 구현 절의 「1차 범위 밖」(대표 이미지 · 엑셀)을 걷었다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 점포 화면 코드 리뷰 반영: 상태 변경 왕복이 빈 사업자주소 · 층 구분만 있는 줄을 바꾸지 않게, 폐점과 이미지 변경을 함께 저장하면 이미지를 먼저, 주소를 바꾸거나 지우면 옛 좌표를 비움, 이력 표 갱신, 목록 조작이 한 낙관적 쿼리를 나눠 씀. 주소 server action 을 `src/lib/address-actions.ts` 로 옮겼다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) · [점포 관리](/stores.md) — 점포 목록 엑셀 바로 받기를 api `GET /stores/excel` 에 붙였다(중계 경로 `/stores/excel`, 받는 동안 버튼이 「파일 만드는 중 · N%」).
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) · [점포 관리](/stores.md) — 점포 대표 이미지 올리기 · 바꾸기 · 지우기와 상세 · 카드 표시를 api `/stores/:id/image`(공통 S3 저장소)에 맞춰 붙였다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) · [점포 관리](/stores.md) — 점포 주소를 고르면 카카오 로컬 API 로 위도 · 경도를 채운다(행정안전부 좌표제공 API 는 개발 키가 없어 쓰지 않는다).
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 점포 타입을 api openapi 생성 타입으로 바꾸고, 플랫폼 관리자의 점포 등록에 BP000007(id 8)을 임시로 고정해 싣는다(로그인 전).
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 점포 정보 관리 화면(`/stores` 목록 · `/stores/[storeId]` 상세 · `/stores/new` 등록 · `/stores/[storeId]/edit` 수정)을 api `/stores` 계약(2026-10-14)에 맞춰 만들었다. 주소 자동완성을 `src/components/address-field.tsx` 로 옮겨 플랫폼 관리자와 함께 쓰고(`label`), ConfirmDialog 에 `confirmDisabled` 를 더했다. 근로계약 근무지 선택지는 `GET /stores/options` 를 부른다. `pnpm test` 163건.
* **Update**: [점포 관리](/stores.md) — 화면 주소를 `/stores/:storeId` 로 바꾸고(코드 대신 숫자 id · api 합의), 구현 절(api 계약 · 1차 범위 밖 · 409 구분)을 더했다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 비로그인 디자인 샘플에 도입문의(`/design/guest/inquiry`) · 공지사항 · FAQ(`/design/guest/notices`)와 `FaqItem`, FAQ 펼침 · 고르는 칸 목록(globals.css)을 더했다.
* **Update**: PR #19 리뷰 반영 — 헤더 2단계 메뉴는 조회 권한이 있는 메뉴(없으면 권한 있는 첫 하위 메뉴)로만 연결하고, 권한 이름은 공통코드 `ROLE_TYPE`(useCodes)에서 읽는다. 탭 서비스 값은 WHALE_ERP·PLATFORM 만 받는다. 로그아웃이 실패하면 안내하고 다시 시도하게 한다 — [Whale ERP Frontend](/whale-erp-front.md).
* **Update**: 로그인 후 화면을 폴더로 묶지 않고 루트 layout 의 `AdminLayout` 이 공개 경로가 아니면 공통 틀을 씌운다(`(erp)`·`platform/layout.tsx` 삭제, 홈은 `src/app/home`). ERP·플랫폼은 탭의 서비스(sessionStorage `current-bp` 의 `serviceCode`)로 가르고 헤더 메뉴·홈·메뉴 권한 확인·오른쪽 선택기가 그 값을 본다. 3팀 화면도 틀 안에 들어가 자기 헤더를 빼야 한다 — [Whale ERP Frontend](/whale-erp-front.md).
* **Update**: main 병합 뒤 플랫폼 화면(`/platform/system/*` · `/platform/notification-templates`)에 공통 틀을 씌웠다 — `platform/layout.tsx` 의 임시 헤더를 공통 틀로 바꾸고 `(platform)` 그룹 폴더는 없앴다(화면이 모두 `/platform` 아래라 필요 없음). 공통 헤더의 알림 종을 `NotificationBellSlot` 으로 바꿨다 — [Whale ERP Frontend](/whale-erp-front.md).
* **Update**: PR #19 리뷰 반영 — 메뉴 판정을 조회 권한 있는 메뉴로 좁히고, 브라우저 저장 키에 버전(`whale-erp:v1:`)을 넣고, 세션 쿠키를 토큰·만료·권한 유형만 두도록 줄였다. [Whale ERP Frontend](/whale-erp-front.md) 의 영역·API·명령 서술도 코드에 맞췄다.
* **Update**: 강제 비밀번호 변경 팝업, 영역별 메뉴(플랫폼은 /platform 아래), 하위 메뉴 없는 1단계 메뉴 바로 이동, 다른 탭 로그인·로그아웃 따라가기를 [Whale ERP Frontend](/whale-erp-front.md) 에 반영했다. 레이아웃 확인용 자리표시 `/bp`·`/config/admins` 는 지웠다.
* **Update**: [고객지원·커뮤니티](/support.md) — 상담하지 않은 도입문의는 플랫폼 운영자가 상세의 [삭제]로 지운다(CNT-11 v120, WHALEERP-590). 목업 · 데모 도입문의 상세에 [삭제]를 넣었다(지우는 api 는 아직 없다).
* **Update**: [고객지원·커뮤니티](/support.md) — front #21 확인 요청 두 건 재영 결정: 공지 · FAQ 목록 노출 대상 열은 뺀 대로, 문의 상세 「보낸 곳」의 운영 점포 · 요금 PLAN · 이전 문의는 1차에 넣지 않는다(목업 · 데모에서 걷음).
* **Update**: [고객지원·커뮤니티](/support.md) · [홈·계정 진입](/home.md) — 내 api(`posts` · `leads` · `inquiries`)와 Plane #272 · 273 · 274 · 295 · 332 · 588 에 목업 · 데모를 맞췄다. 공지 유형 · 게시 기간 · 비공개 · 삭제, 변경 이력 표 대신 최근 수정, 커뮤니티관리 목록 칸 · 거르기(노출 대상 · 상호 · 운영 형태 열과 제목 · 담당자 검색을 뺐다), 문의 · 도입문의 [처리 시작], 도입문의 상세의 동의 일시 · 상담 완료일 · 답변 완료 상태, 도입문의 접수의 관심 서비스 여러 개 · 업종 직접 입력 · 도입 예정 시기 선택.
* **Update**: `2026-09-30-네이밍-규칙.md` 2026-10-14 고침을 [네이밍 규칙](/conventions/naming.md) 에 옮겼다 — 메일 템플릿 표의 「운영 알림 짝」을 걷고 운영 알림 · 메일 분리(운영 정책 NTF-03), 알림 템플릿 줄에 기본 문구 칸(`default_*`)을 적었다(재영).
* **Update**: [운영 알림](/notify.md) — 2026-10-13 결정으로 현행화. 운영 알림은 알림함에만 넣고 메일은 업무 쪽이 따로 보낸다(NTF-03 v114, NOTIFY-3 에 「바뀜」), 가맹 점포 계약 알림의 본사 제공 동의 조건(NOTIFY-13), 받을 때 기준(결정 A), 메일 탭 24건, 버튼 링크 칸은 메일 · 알림톡만, 저장 확인창 하나에 코드 경고, NTF-24 감수, 결정 표에 NOTIFY-17~20. 목업 · 데모 · 계획 · 논리 ERD · 플로우도 맞췄다.
* **Update**: [직원 운영 관리](/staff.md) — 근로계약 상태 7종, 임시저장 필수 칸(고용 형태 포함, CTR-02) · 이어 쓰기에서 삭제(CTR-19) · 같은 점포 대체 확인 · 다른 점포 근무 시간 겹침 차단(CTR-26), 급여 칸은 현업 엑셀 견본(front #15), 일괄 등록 줄의 근무 유형을 뺐다. 목업 · 데모(임시저장 행은 이어 쓰기로 바로)도 맞췄다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 임시저장 필수 칸에 고용 형태를 더했다(CTR-02). 화면 안내 문구는 아직 「직무만」이다.
* **Update**: [고객지원·커뮤니티](/support.md) — 답변 알림의 메일은 업무 쪽(NTF-03), 문의사항은 429 없이 5분 안 같은 제목 · 내용이면 409(2026-10-14 재영), 처리 시작 관리자 · 시각(api #26), 첨부파일 저장소 결정 대기(Plane #587) 표시. 도입문의 429 문구도 목업 · 데모에 넣었다.

## 2026-10-13
* **Update**: [운영 알림](/notify.md) — 운영 알림 · 메일 분리(운영 정책 NTF-03 v114, 2026-10-13 재영): 목업 NOTIFY-16 쟁점 블록과 운영 알림 화면 계획에서 「메일 버튼도 /notifications/{id}/open 으로 들어온다」를 걷었다. 메일 버튼은 업무 화면으로 바로 가고 #249 는 취소됐다.

* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 플랫폼 관리자 관리 화면(`/platform/system/admins`)을 api `/platform-admins` 에 붙여 만들었다. 목록 · 필터, 상세 · 등록 · 수정 슬라이드 패널(겹치면 Esc 는 가장 위의 것만 닫는다), 비밀번호 초기화 · 삭제(404 · 409 · 결과 모름이면 상세를 다시 받는다) · 변경 이력. 등록의 아이디는 칸을 벗어나거나 Enter 때 `GET /platform-admins/login-id-availability` 로 중복 확인, 입력 · api 칸 오류는 그 칸 바로 아래. 주소는 행정안전부 도로명주소 API 자동완성(`JUSO_API_KEY`, 캐시 없음, `server-only`, 키 견본 `.env.example` — 카카오 우편번호보다 층 안 목록 모양이 화면과 맞아 이것으로 정했다). 공통: `Field required`(붉은 *), DetailTable `multiline`, SlidePanel 은 preventDefault 된 Esc 를 넘긴다. `pnpm test` 는 `src/**/*.test.ts` 를 돈다.
* **Update**: 근로계약서 작성 급여 칸을 현업 엑셀 견본대로 바꿨다 — 시급 옆 읽기 전용 월급 칸, 정직원은 연봉 · 비과세 항목 · 급여항목 표, 파트타이머는 요일별 소계 · 주휴수당 · 주급 · 월급여 표. 근무요일은 근무 · 휴게시간과 한 줄, 시급 · 월급 · 연봉은 급여 표 위 한 줄. 휴일근무 두 칸은 뺐고, 파트타이머 수당 칸은 정해지지 않아 뺐다. [Whale ERP Frontend](/whale-erp-front.md).
* **Update**: 근로계약서 작성에 api #12 칸(수당 · 월 근로시간 · 조항)과 정직원 월급(시급 × 월 기본시간) 안내, 같은 점포 진행 중 계약 대체 확인창(WHALEERP-129)을 더했다. PR #13 리뷰 참고 항목 — 근로계약 화면 `error.tsx` · 목록 403 안내 · 주소 쿼리 거르기, `pnpm test` 가 `src` 전체 테스트를 돌린다, 근로계약 타입을 생성 타입으로, 메뉴 견본 「직원 정보 관리 · 근로계약 관리」 주소, 직원 목록 「직원 초대」를 `/contracts/new` 로. [Whale ERP Frontend](/whale-erp-front.md).
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — `/design` 맨 위에 디자인 샘플 화면 목록 표를 더했다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 회원가입 완료 화면 `/design/guest/sign-up/complete` 를 더하고 가입 폼에서 잇는다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 사업자 회원가입을 `/design/guest/sign-up` 으로 만들었다(기획 시안 항목 + Figma 비로그인 폼 규격, 가입 요청은 아직 보내지 않는다). 아이디·이메일 사용 가능 여부는 샘플 목록으로 보인다. 비로그인 폼 규격을 `guest-form.ts` 로 모았다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — Figma 「아이디/비밀번호 찾기」를 `/design/guest/find-account` 로 옮겼다(인증 요청은 아직 보내지 않는다). 머리말 Login 아이콘이 호버 때 글자와 함께 먹색으로 바뀐다(Figma 1:1855).
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — Figma 「로그인전_로그인」을 `/design/guest/login` 으로 옮겼다(로그인 요청은 아직 보내지 않는다).
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 비로그인 화면 사이 이동에 페이지 전환(ViewTransition)을 넣었다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — Figma 「로그인전_부가서비스」를 `/design/guest/add-on-services` 로 옮기고, 비로그인 아이콘을 `guest-icons.tsx` 로 모았다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — Figma 「로그인전_Sub」를 `/design/guest/store-operations` 매장운영 화면으로 옮기고, 비로그인 머리말·푸터를 `design/guest/layout.tsx` 로 모았다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — Figma 「로그인전_Main」을 `/design/guest` 비로그인 메인으로 옮겼다(guest 색 토큰, Pretendard 700, REM·Inter Tight·Inter).
* **Update**: [운영 알림](/notify.md) — 기본 템플릿 37건 → 40건, 되돌리기는 제목·본문·변수 목록만(NOTIFY-17·18), 알림톡 카카오 템플릿 코드·변수 목록도 고친다(NOTIFY-10)로 맞췄다. 데모 `template-codes.mjs` 에 빠진 세 코드를 더했다.
* **Update**: [네이밍](/conventions/naming.md) — 기본 템플릿 코드 37건 → 40건. 표에 빠져 있던 `PUSH_PAYSLIP_RESENT` · `EMAIL_PAYSLIP_SENT` · `EMAIL_PAYSLIP_RESENT` 를 더했다(마이그레이션 `20261007000100_team3_initial_data` 와 맞춤).
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 알림 템플릿 관리 화면(#575 · #576 · #579 · #582) 목록 · 등록 · 수정과 메뉴 한 줄. `ApiError.messages` 로 400 문장 목록을 남긴다.
* **Update**: [운영 알림](/notify.md) — NOTIFY-16(2026-10-13 재영): 알림 이동은 api 가 주는 `link`(업무 쪽이 넘긴 경로)로 간다. 경로표 `linkOf` 를 지우고 `safeLink` 로 관리자 웹 안 경로만 보낸다. 논리 ERD 알림에 「업무 링크」 칸.
* **Update**: [운영 알림](/notify.md) — front #14 리뷰 반영. 근로계약 알림은 `/contracts/{id}`, 문의 · 도입문의는 화면이 생길 때까지 알림함 안내. 목록 · 팝오버에 내용 · 관련 업무, 근로계약 화면 넷의 종, 서버 액션 알림 ID 정수 검사. `DataTable` 머리 칸 변경은 되돌리고 전체 선택을 툴바로.
* **Update**: [운영 알림](/notify.md) — NOTIFY-12~15 확정(2026-10-13 재영)을 목업 쟁점과 결정 절에 반영했다. 논리 ERD 알림에 「알림 제목」 칸을 더해 그림 · 카탈로그 · 물리 그림을 다시 만들었다.
* **Update**: [운영 알림](/notify.md) — 구현 절을 더했다. 운영 알림함 `/notifications`, 눌러서 이동 `/notifications/[id]/open`(화면에 뜬 뒤에만 읽음), 전역 종 `NotificationBell`(공통 GNB 전이라 임시 헤더 세 곳에), 경로표 `linkOf`. `DataTable` 의 `Column.header` 를 `ReactNode` 로 넓혔다(전체 선택 체크박스).
* **Update**: 근로계약 화면 요건 변경(Plane #133 · #155 · #132). 목록의 임시저장 행은 이어 쓰기로 바로 가고, 임시저장 삭제를 상세에서 이어 쓰기 화면(취소와 임시저장 사이)으로 옮겨 공통 `ConfirmDialog` 로 묻는다. 목록에 고용 형태 칸을 더하고, 급여는 정직원도 시급으로 보인다(작성 · 상세의 칸 이름도 「시급」). [Whale ERP Frontend](/whale-erp-front.md).
* **Update**: [직원 정보 관리 화면 (구현)](/screens/staff-members.md) — 상세 「재직 상태」를 목록 요약(`statusCells`) 대신 재직 · 퇴직 예정 · 퇴직만 보이도록 고쳤다(PR #4 머지 블로커, 2026-10-13 재영).
* **Update**: `2026-09-30-네이밍-규칙.md` 2026-10-13 고침을 [네이밍 규칙](/conventions/naming.md) 에 옮겼다 — 삭제 표시 예외에 노출 대상 연결 표 `post_audiences` 행 삭제를 더했다(재영, api #18).
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 공통코드 [BP 적용]이 막혔을 때 「저장한 뒤 적용할 수 있습니다」 안내를 버튼을 감싼 칸에 달았다. 막힌 버튼은 호버를 받지 않아(Button disabled:pointer-events-none) 버튼에 단 안내가 뜨지 않았다(PR #9 리뷰).
* **Update**: `2026-09-30-네이밍-규칙.md` 2026-10-13 고침을 [네이밍 규칙](/conventions/naming.md) 에 옮겼다 — 삭제 표시 예외에 임시저장(`DRAFT`) 근로계약 행 삭제를 더했다(재영).

## 2026-10-12

* **Update**: 근로계약 목록의 행 끝 버튼 칸을 없애고 직원 이름으로 상세에 들어가게 했다. 상세 화면(`src/app/contracts/[contractId]/`)을 만들어 상태별 버튼을 위쪽으로 옮기고 임시저장 삭제를 더했다. [Whale ERP Frontend](/whale-erp-front.md).
* **Update**: 근로계약서 작성의 휴대전화번호 · 생년월일에 하이픈 자동 입력을 더했다. 공통 `DateField` 에 켜는 칸만 쓰는 `autoHyphen` 을 더했다(기본 끔). [Whale ERP Frontend](/whale-erp-front.md).
* **Add**: [직원 정보 관리 화면 (구현)](/screens/staff-members.md) — 직원 목록(#138) · 상세(#184)를 화면만 목 데이터로 만든 상태와, api(목록 #329 · 상세 요약 #183 · 관리자 로그인)를 붙일 때 바꿀 곳 · 다시 작업할 것. 공통 Button 의 danger 추가(1팀 확인 필요)도 적었다.
* **Update**: `docs/mockup/stores/index.html` 의 점포 목록 검색 변경을 [점포 관리](/stores.md) 에 옮겼다 — 점포는 점포명·점포코드로 찾아 여러 곳 골라 보고(고른 점포만 · 고르지 않으면 전체), 사업자등록번호는 따로 넣는다.
* **Update**: 점포 정보 관리 · BP 관리자 관리 목업 · 데모 — 필터 [초기화]가 고른 점포도 비운다. BP 관리자 관리 목업의 점포 검색도 같은 점포 고르기로 바꿨다. 고른 점포로 목록을 거르고 다른 조건에 모두 걸리면 「조회된 결과가 없습니다.」를 보이는 것은 데모 점포 정보 관리뿐이다(BP 관리자 관리 데모 · 두 목업은 칩만 쌓이고 목록은 그대로).
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 공통코드 화면 리뷰 반영: 자기 패널 저장 뒤 입력 행이 남던 문제(새 그룹이 다음 쪽에 들어갈 때 · 공백만 고칠 때), [BP 적용]이 상세 코드 패널의 변경을 막도록, 요청 실패 · 상세 코드 조회 실패를 패널에서 알리고, 401 · 403 문구를 바꿨다. 저장 데이터 만들기를 `src/lib/code-drafts.ts` 로 빼 테스트하고 `pnpm test` 를 더했다.
* **Update**: [시스템관리](/system.md) — 공통코드 목업 · 데모의 BP 적용 안내를 새 정책(다시 적용하면 뒤에 추가한 코드도 기존 BP에 들어감)으로 맞췄다. 화면은 한 패널을 저장해도 다른 패널의 고치던 값을 지우지 않는다. 이 화면이 부르는 whale-erp-api `/code-groups` 는 api main 에 머지됐다(PR #15).
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 공통 토스트를 더했다(저장 · 수정 · 삭제 문구, 하단 가운데, 3초 · 2026-10-12 결정). 플랫폼 공통코드 저장 성공에 붙였다.
* **Update**: [시스템관리](/system.md) — 상세 코드 새 행을 여러 개 만들어 한 번에 저장하고, 새 행끼리도 중복을 검사한다(2026-10-12 결정). 화면 · 목업 · 데모를 함께 고쳤다.
* **Update**: [시스템관리](/system.md) — 공통코드 그룹 목록에서 끌어서 순서 바꾸기를 뺐다(상세 코드만 남김, 2026-10-12 결정).
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) — 공통코드 화면을 목 데이터에서 실제 api(`/code-groups`) 호출로 바꿨다. 로그인 전에는 개발 서버에서만 `API_DEV_TOKEN` 을 싣는다.
* **Update**: 플랫폼 공통코드 관리 2~8단계(검수까지) — [Whale ERP Frontend](/whale-erp-front.md) 공통 컴포넌트에 Tag · Toggle · ConfirmDialog 를 더하고 DataTable 줄 상태, 막힌 버튼 · 틀린 입력칸 모양을 적었다. 끌어서 순서 바꾸기는 `src/lib/reorder.ts`(`node --test src/lib/reorder.test.ts`).
* **Update**: 플랫폼 공통코드 관리 개발 0·1단계 — [Whale ERP Frontend](/whale-erp-front.md) 에 플랫폼 화면 틀(`src/app/platform/`), 공통코드 데이터 함수(목, api 와 같은 모양), openapi 타입 생성(`pnpm openapi:types`)을 적었다. [시스템관리](/system.md) 의 BP 적용 정책을 「다시 적용 가능, 없는 행만 넣음」으로 고쳤다(2026-10-12 결정).

## 2026-10-13

* **Update**: 로그인 정보 브라우저 관리(login-info · 탭별 BP·점포·공통코드 · SessionGate · BFF)와 헤더의 메뉴·범위 선택기를 login-info 로 그리는 것을 [Whale ERP Frontend](/whale-erp-front.md) 에 반영했다. 메뉴 상수 `menus.ts` 와 견본 `login-session.ts` 는 지웠다.

## 2026-10-12

* **Update**: 관리자 로그인(BFF 쿠키 + proxy)과 레이아웃 3종(사이트형·ERP·플랫폼) 반영, 약관 전문 페이지 대신 팝업 — [Whale ERP Frontend](/whale-erp-front.md), [로그인](/auth.md).

## 2026-10-08

* **Update**: 근로계약서 작성 · 이어 쓰기의 주휴일 칸을 숨겼다(7일 근무 협의 전, api 는 NULL 저장). [Whale ERP Frontend](/whale-erp-front.md).
* **Update**: 근로계약서 작성의 주휴일을 고르는 칸에서 근무로 정해진 값을 보여 주는 칸으로 바꿨다. [Whale ERP Frontend](/whale-erp-front.md).
* **Update**: 근로계약 목록 상태 칸에 판별한 초대 유형을 붙였다(발송 대기 · 가입 초대 등). [Whale ERP Frontend](/whale-erp-front.md).
* **Update**: 임시저장 이어 쓰기 화면(`src/app/contracts/[contractId]/edit/`)과 목록의 「이어 쓰기」를 더했다. [Whale ERP Frontend](/whale-erp-front.md).
* **Update**: main 을 합치고 근로계약서 작성의 임시저장을 직원 칸 · 근무지만 필수로 줄였다. 근무 장소 칸을 더했고 목록은 비어 있는 계약 칸을 「-」로 보인다. [Whale ERP Frontend](/whale-erp-front.md).
* **Update**: 근로계약서 초안 작성에 「임시저장」 버튼(근로계약 상태 DRAFT)을 더했다. 목록 상태 필터에도 임시저장이 생긴다(enum 에서 받는다). [Whale ERP Frontend](/whale-erp-front.md).
* **Update**: 근로계약서 초안 작성 화면(`src/app/contracts/new/`)을 만들고 목록의 「계약서 작성」을 이었다 — api `POST /contracts` · `GET /stores`. enum 한글 찾기를 클라이언트에서도 쓰려고 `src/lib/enums.ts` 로 뺐다. [Whale ERP Frontend](/whale-erp-front.md) 의 Layout · API 절을 맞췄다.
* **Update**: 근로계약 관리 목록(`src/app/contracts/`)을 하드코딩에서 api `GET /contracts` 로 바꾸고 `src/lib/api.ts` 에 `getEnum` · `labelOf` 를 더했다. [Whale ERP Frontend](/whale-erp-front.md) 의 Layout · API 절을 맞췄다. 논리 ERD(`docs/erd/_build.py`)의 근로계약 근무 조건 · 급여 조건을 `contract_work_days` 와 항목별 컬럼으로 풀었다(3팀 확인 전).
* **Update**: `2026-09-30-네이밍-규칙.md` 2026-10-08 고침을 [네이밍 규칙](/conventions/naming.md) 에 옮겼다 — 「근무 · 출퇴근」의 근무 유형 4종(`DAY`·`OPEN`·`MIDDLE`·`CLOSE`, enum `work_type`) 줄을 지웠다(재영).
* **Update**: 퇴직 처리를 근로계약과 분리한 결정(퇴직 예정, STAFF-28, 운영 정책 CTR-24·25 v91)과 비밀번호 초기화 안내를 [직원 운영 관리](/staff.md) 에 넣었다. 목업·데모도 맞췄다.
* **Update**: 근무스케줄 여러 명 일괄 등록 입력(STAFF-27, 2026-10-08 재영)을 [직원 운영 관리](/staff.md) 에 넣었다. 목업·데모의 오른쪽 일괄 등록 패널은 없앴다.
* **Update**: `2026-09-30-네이밍-규칙.md` 2026-10-08 고침 두 줄을 [네이밍 규칙](/conventions/naming.md) 에 옮겼다 — `PUSH_SCHEDULE_CHANGED` 이름 「근무스케줄 변경」, (1팀) `mail_type_code` 비고를 알림 템플릿 `template_code` 로.
* **Update**: 근무스케줄 확정 단계를 없앤 결정(2026-10-08 재영, 운영 정책 PAY-14)을 [직원 운영 관리](/staff.md) 에 넣었다 — 저장하면 바로 반영, 저장마다 바뀐 직원에게 알림, 확정 버튼·확정 전 꼬리표 제거. 목업·데모·논리 ERD 도 맞췄다.
* **Update**: 근무스케줄 등록 패널의 계약 근무시간 안내 띠를 없애고 「계약 값으로 되돌리기」만 남긴 것(STAFF-14, 2026-10-08 재영)을 [직원 운영 관리](/staff.md) 에 적었다.
* **Update**: 월간 보기의 월 이동(‹ › · 이번 달)을 [직원 운영 관리](/staff.md)·[홈](/home.md) 에 적었다. 근무스케줄 등록 패널의 계약 근무시간 띠 문구·예시 날짜·미체결 경고 조건도 목업·데모에서 고쳤다(2026-10-08 재영).
* **Update**: 근무스케줄 관리를 로그인 후 홈과 같은 주간·월간 보기로 바꾸고 주간 근무표를 없앤 것(STAFF-26, 2026-10-08 재영)을 [직원 운영 관리](/staff.md) 에 넣었다. 목업·데모는 같은 부품을 쓴다.
* **Update**: 점포 하나 화면 주간 보기에 근무스케줄 관리와 같은 「근무 인원」 줄·범례를 더한 것(2026-10-08 재영)을 [홈](/home.md) 에 적었다.
* **Update**: 점포 하나 화면 근무스케줄에서 근무 유형(주간·오픈·미들·마감) 표시를 빼고 막대 색을 근무스케줄 관리와 맞춘 것(2026-10-08 재영)을 [홈](/home.md) 에 적었다. 목업·데모도 맞췄다.
* **Update**: TO-DO 개인 배정의 직원 고르기(한 명 이상, STAFF-25 확정)와 수행 방식 조건부 표시·툴팁(2026-10-08 재영)을 [직원 운영 관리](/staff.md) 에 넣었다. 목업·데모도 맞췄다.
* **Update**: 문의사항 첨부파일(운영 정책 CNT-18, 2026-10-08 재영)을 [고객지원·커뮤니티](/support.md) 에 넣었다 — 등록 폼의 첨부 칸·거절 안내, 내 문의·플랫폼 문의 상세의 첨부 보기. 목업·데모도 맞췄다.
* **Update**: 문의사항 답변을 답변 완료 뒤에도 고치는 규칙(운영 정책 CNT-17, 2026-10-08 재영)을 [고객지원·커뮤니티](/support.md) 에 넣었다 — 운영자 상세의 답변 수정·이전 답변, 문의자 상세의 마지막 답변·수정 시각. 목업·데모도 맞췄다.
* **Update**: 커뮤니티 관리 문의사항 필터에 「보낸 곳」 검색(2026-10-08 재영)을 [고객지원·커뮤니티](/support.md) 에 적었다. 데모만 고쳤고 목업은 필터 영역이 없어 그대로다.

## 2026-10-07

* **Update**: `docs/mockup/config/admins-detail.html` 의 BP 관리자 상세 정리를 [BP 환경설정](/config.md) 화면 표에 옮겼다 — 등록일시·최종 수정일시 옆에 처리자명, 계정 상태·권한 그룹 영역을 빼고 권한 그룹은 제목 줄 배지로.
* **Update**: `docs/mockup/config/roles.html` 의 권한 그룹 수정 흐름 변경을 [BP 환경설정](/config.md) 에 옮겼다 — 상세에서 권한명·설명을 바로 고쳐 저장하고 따로 수정 단계를 두지 않는다(플랫폼 권한 관리와 같다).
* **Update**: `2026-09-30-네이밍-규칙.md` 삭제 표시 절에 더해진 예외(`todo_assignees` 는 행을 DELETE 하고 배정 해제는 `todo_status_histories` 에 남긴다, 2026-10-07 재영)를 [네이밍 규칙](/conventions/naming.md) 에 반영했다.
* **Add**: 직원 상세의 퇴직 처리(운영 정책 CTR-24·25, 2026-10-07 재영)를 [직원 운영 관리](/staff.md) 에 넣었다 — 버튼·확인창·취소, STAFF-6 예외, STAFF-24(퇴직일 범위) 확정. 데모도 맞췄다.
* **Update**: `2026-09-30-네이밍-규칙.md` 「템플릿 사용 여부 · 변수 목록」 줄의 변수 모양에 `isButtonLink`(선택)를 더해 [네이밍 규칙](/conventions/naming.md) 에 반영했다 — 메일 공통 틀·알림톡 버튼이 붙이는 링크 변수는 이 표시로 「필수 변수는 제목·본문에」 검사에서 뺀다(2026-10-07 재영).
* **Update**: 다른 세션이 원자료에 더한 근무 유형 4종(ed083af)과 급여 항목 표·급여 항목 코드(2b47d56·ad61fe9)가 front okf 에 빠져 있어 [네이밍 규칙](/conventions/naming.md) 「근무 · 출퇴근」「급여」 절을 원자료로 갈음했다.
* **Update**: `2026-09-30-네이밍-규칙.md`(7e88e65) 의 견본 삭제 반영을 [네이밍 규칙](/conventions/naming.md) 에 옮겼다 — 예시 이름을 실제 DDL 이름(contracts_staff_member_id_idx 등)으로, 「예제는 고치지 않는다」·「listItems 는 그대로」 문장을 「2026-10-07 에 지웠다」로. 견본 `Item` 이 없어진 front 사정도 맞췄다.
* **Update**: api 견본(items·stock_movements·staff·customers)과 견본 로그인을 지운 결정(2026-10-07 재영)에 맞춰 front 의 `src/app/items/`·`src/app/login/`·`docs/result/architecture.html` 을 지우고 `src/lib/api.ts` 를 호출 틀만 남겼다. 첫 화면은 `/design`. [Whale ERP Frontend](/whale-erp-front.md) 의 Layout·API 절을 맞췄다.
* **Update**: `2026-09-30-네이밍-규칙.md`(45f1ff4) 「알림 템플릿」 행 비고를 [네이밍 규칙](/conventions/naming.md) 에 반영했다 — 발송 채널 + 템플릿 이름 + 템플릿 코드로 구분.
* **Update**: `2026-09-30-네이밍-규칙.md`(8c77649) 의 「고객지원 · 알림」을 [네이밍 규칙](/conventions/naming.md) 에 반영했다 — 알림 유형·발송 용도 공통코드를 없애고 템플릿 이름·수신 설정 묶음을 더했으며, 코드값 표를 기본 템플릿 코드 37건 표로 바꿨다.
* **Update**: NOTIFY-11(공통코드 대신 템플릿 이름·코드로 구분, 앱 푸시는 수신 설정 묶음, 코드가 겹칠 때만 막음, 2026-10-07 재영)을 [운영 알림](/notify.md) 에 반영했다. 목업·데모의 「알림 유형·발송 용도」 열·칸·꼬리표를 템플릿 이름으로 바꾸고 데모 코드 목록을 전체 코드 문자열로 바꿨다.
* **Update**: NOTIFY-7 을 「시스템관리 아래」로 바꾼 결정(2026-10-07 재영)을 [운영 알림](/notify.md) 에 반영했다 — 목업·데모 메뉴를 시스템관리(1팀 블록, 한 줄만 추가)로 옮기고 따로 세운 3팀 메뉴를 지웠다.
* **Update**: NOTIFY-7 확정(알림 템플릿 관리는 Platform 아래 3팀 메뉴로 따로 한 줄, 2026-10-07 재영)을 [운영 알림](/notify.md) 에 반영하고 목업·데모의 임시 표현을 걷었다.
* **Update**: NOTIFY-4(앱 푸시 제목 40·본문 100, 넘으면 저장 안 함)·NOTIFY-5(메일은 일반 글 + 공통 메일 틀) 확정(2026-10-07 재영)을 [운영 알림](/notify.md) 에 반영했다. 목업·데모의 「가정해 센다」 문구를 걷고 데모 저장 전 검사에 글자 수를 더했다.
* **Update**: `2026-09-30-네이밍-규칙.md`(6916f3a) 5장 「고객지원 · 알림」의 알림 템플릿 식별자(알림 템플릿·발송 채널·템플릿 코드·사용 여부·변수 목록·알림 유형·발송 용도)와 NOTIFICATION_TYPE·SEND_PURPOSE 코드값 표를 [네이밍 규칙](/conventions/naming.md) 에 반영했다. 원자료에 같은 절이 두 번 들어가 있어(뒤의 것은 「템플릿 코드는 바꾸지 않는다」 옛 문구) 앞의 것만 옮겼다.
* **Update**: 알림 템플릿 등록과 전체 수정(NOTIFY-10, 2026-10-07 재영)을 [운영 알림](/notify.md) 에 반영했다 — 등록 화면, 모든 항목 수정, 변수 목록 편집과 저장 전 검사, 템플릿 코드 기본값과 바꿈 확인, 사용 여부, 되돌리기는 기본 37건만. 데모도 맞췄다.
* **Update**: 알림 템플릿의 템플릿 코드 값을 확정 공통코드(NOTIFICATION_TYPE·SEND_PURPOSE, 1팀 8종은 1팀 값)로 바꾸고 「예시」 표시를 걷었다 — [운영 알림](/notify.md) 목업·데모 목록.
* **Update**: 3팀 발송 용도 두 코드 이름을 바꿨다(2026-10-07 재영) — 비밀번호 찾기 핀 EMAIL_STAFF_PASSWORD_PIN, 관리자 초기화 재설정 링크 EMAIL_STAFF_RESET_LINK. 화면 이름은 그대로. [운영 알림](/notify.md) 목업·데모 목록.
* **Update**: 알림 템플릿마다 템플릿 코드를 두기로 한 결정(2026-10-07 재영)을 [운영 알림](/notify.md) 에 반영했다 — 목록 네 탭에 열, 수정 화면에 읽기 전용(알림톡은 카카오 템플릿 코드와 이름표로 가름). 코드 값은 예시. 데모도 맞췄다.
* **Update**: 1팀 관리자 메일 8종을 알림 템플릿 메일 탭에서 관리하기로 한 결정(NOTIFY-9, 2026-10-07 재영)을 [운영 알림](/notify.md) 에 반영했다 — 메일 탭 14 → 22건, 1팀 꼬리표. 데모도 맞췄다.
* **Update**: 알림톡 본문도 화면에서 고치기로 한 결정(NOTIFY-8, 2026-10-07 재영)을 [운영 알림](/notify.md) 에 반영했다 — 수정 화면에 알림톡(본문만·코드와 변수 고정·검수 안내·말풍선 미리보기), 목록에 최근 수정. 데모도 맞췄다.
* **Update**: NOTIFY-6 을 「승인 상태를 두지 않음」으로 바꿨다(2026-10-07 재영) — 알림톡 목록은 발송 용도·카카오 템플릿 코드·본문 요약만, 상세는 읽기 전용. [운영 알림](/notify.md) 정책도 맞췄다.
* **Update**: 알림 템플릿 관리 결정(2026-10-07 재영)을 [운영 알림](/notify.md) 에 반영했다 — NOTIFY-6 확정(알림톡 승인 상태는 운영자가 직접 기록), 제목 필수·알림톡 제목 없음, 기본 문구 대체 발송은 서버 로그에만.
* **Update**: [로그인](/auth.md) 「로그인 · 세션」의 갱신 거절 대상에 탈퇴 계정을 더했다 — 미사용·삭제·탈퇴 계정이면 갱신을 거절한다. BP 마스터 탈퇴로 함께 탈퇴된 하위 계정의 열린 세션도 최대 1시간 안에 끝난다. `docs/mockup/auth/overview.html` 정책도 맞췄다.
* **Update**: 운영 알림 유형에 근로계약 만료가 더해져 열 가지가 된 것을 [운영 알림](/notify.md) 정책 줄에 반영했다(2026-10-07 재영). 알림톡은 가입 초대 하나이고 더 보낼 상황은 앱 NOTI-2 에서 정한다고 목록 화면에 적었다.
* **Add**: `docs/mockup/notify/templates.html`·`templates-edit.html` 의 알림 템플릿 관리(F-TZPHZT)를 [운영 알림](/notify.md) 에 넣었다 — 화면 둘, 정책 다섯 줄, 미정 쟁점 NOTIFY-4~7.
* **Update**: [로그인](/auth.md) 「로그인 · 세션」과 `docs/mockup/auth/overview.html` 정책에 갱신 거절 규칙을 더했다 — 갱신 토큰으로 세션을 연장할 때 미사용·삭제 계정이면 거절해, 끊지 않은 세션도 최대 1시간 안에 끝난다.
* **Update**: 로그인 중인 세션을 강제로 끊는 정책을 없앴다 — 관리자의 비밀번호 초기화·미사용 전환·계정 삭제와 본인의 MY PAGE 비밀번호 변경·강제 비밀번호 변경 모두 열린 세션과 다른 기기 로그인을 그대로 둔다. [플랫폼 시스템 관리](/system.md)(미사용·삭제), [BP 환경설정](/config.md)(초기화·미사용), [MY PAGE](/mypage.md)(`S-PTWREE`), [로그인](/auth.md)(`S-VFGQLI`) 과 목업·화면 정의서·데모·유저 플로우(bp-master·admin-account·mypage·auth-account)를 맞췄다. 세션이 끝나는 것은 로그아웃과 만료뿐이다.
* **Update**: `docs/mockup/bp/detail.html`·`overview.html` 의 BP 미사용 전환 정책 변경을 [BP 마스터 계정 관리](/bp.md) 에 옮겼다 — 관리자 계정 전부를 미사용으로 바꿔도 로그인 중인 세션은 끊지 않는다(`S-CQGGZS`). 비밀번호를 그대로 두는 것은 같다.
* **Update**: `docs/mockup/bp/detail.html` 의 비밀번호 초기화 팝업에서 세션을 끊는다는 안내를 뺀 것을 [BP 마스터 계정 관리](/bp.md) 에 옮겼다 — 초기화해도 로그인 중인 세션은 끊지 않는다(`S-PRRLMA`). 플랫폼 관리자 상세와 같은 정책이다.

## 2026-10-06

* **Update**: `2026-09-30-네이밍-규칙.md`(md5 f7ff246d) 「화면 문구」 줄의 「front 에」를 「front·staff 에」로 [네이밍 규칙](/conventions/naming.md) 에 반영했다 — 두 클라이언트 공통 규칙이다.
* **Update**: `2026-09-30-네이밍-규칙.md`(md5 dca33aa8) 4장 FRONT 표의 「화면 문구」 줄을 [네이밍 규칙](/conventions/naming.md) 에 반영했다 — enum 한글은 `getEnum(name)` 으로 받은 label 을 쓰고 front 에 상수 대응표를 두지 않는다.
* **Update**: `2026-09-30-네이밍-규칙.md`(md5 c9b20796) 의 새로 쓴 4장 「API 타입·enum 공유」를 [네이밍 규칙](/conventions/naming.md) 에 반영했다 — enum 은 생성 파일(`labels.ts`) 대신 api 의 `GET /enums`·`/enums/{name}` 을 `getEnum(name)` 으로 받아 Next 서버 캐시에 두고 `version` 이 바뀌면 새로 받는다. 공통코드도 `getCodes(group)` 로 같은 모양. 요청·응답 타입만 openapi.json 에서 생성한다.
* **Update**: `2026-09-30-네이밍-규칙.md`(md5 59625752) 의 고친 「원본」·「front·staff 쪽」 줄을 [네이밍 규칙](/conventions/naming.md) 에 반영했다 — 타입 생성의 원본을 api 가 커밋한 `openapi/openapi.json` 으로 맞추고 `/docs-json` 은 같은 Swagger 문서라는 설명으로만 남겼다.
* **Update**: `2026-09-30-네이밍-규칙.md`(md5 ca6c609b) 4장 「API 타입·enum 공유」의 미정을 결정으로 바꿔 [네이밍 규칙](/conventions/naming.md) 에 반영했다 — 생성 도구 openapi-typescript, api 가 `openapi/openapi.json`·`enum-labels.json` 을 커밋, front·staff 는 `pnpm api:types` 로 `WHALE_API_DIR`(기본 `../whale-erp-api`)에서 읽어 생성하고 머리에 api 커밋 해시를 적는다. 1팀 동의 대기. front 구현은 아직 하지 않았다.
* **Update**: [네이밍 규칙](/conventions/naming.md) 맨 앞에 「# 범위」 절을 staff·api 와 같은 문구로 넣었다 — 원자료 머리말의 적용 범위·상태(1팀 영역은 재영 확인 대상 아님)·원본 관리 방식. 같은 내용을 따로 적어 두었던 머리 세 단락은 걷었다.
* **Update**: `2026-09-30-네이밍-규칙.md` 에서 front 에만 빠져 있던 셋을 [네이밍 규칙](/conventions/naming.md) 에 넣어 staff·api 와 맞췄다 — DB 표의 「역할 외래키」(`{역할}_by`, 2026-10-06 재영), 「식별자 1팀 예외」 절, 대응표의 1팀 묶음 셋(인증·계정 · BP·점포 · 설정·시스템관리)과 그 밖에 빠진 줄(관리자 계정·직무·임금계약서·계약서 파일 구분·4대보험 가입 여부). 1팀 묶음에는 「1팀이 판단하는 영역, 재영 확인 대상 아님」을 표시했다.
* **Update**: `2026-09-30-네이밍-규칙.md` 4장의 「API 타입·enum 공유」(A안, 2026-10-06 재영)를 [네이밍 규칙](/conventions/naming.md) FRONT 절 아래에 반영했다 — api `/docs-json` 에서 타입·enum 을 생성하고 손으로 적지 않는다. 생성 도구·시점과 한글 대응표 전달 방법은 미정.
* **Update**: `docs/mockup/system/roles.html`·`overview.html` 의 권한 상한 정책 변경을 [플랫폼 시스템 관리](/system.md) 에 옮겼다 — 플랫폼 관리자 추가 권한의 메뉴 CRUD 상한은 설정자 본인 권한뿐이고 기준 고정 권한(PA000001) 상한은 뺐다(`S-EFQREM`). 플랫폼 마스터는 본인 메뉴 전체 안에서 준다.
* **Update**: `docs/mockup/system/admins-detail.html` 의 비밀번호 초기화 정책 변경을 [플랫폼 시스템 관리](/system.md) 에 옮겼다 — 초기화해도 로그인 중인 세션은 끊지 않는다(`S-XKYOND`). 기존 비밀번호 무효화는 그대로다.
* **Update**: 목업 쟁점 HOME-6(점포 하나를 고르면 홈이 무엇을 보여주는가) 확정을 [홈·계정 진입](/home.md)에 반영했다 — 업무 범위가 점포 하나면 점포 하나 화면(공지 띠·카드 넷·근무스케줄·직원 정보, 처리 대기 없음). 가맹 역할은 늘, BP 역할은 점포 하나를 고를 때. 옛 「가맹 역할은 점포 상세 카드」 규칙과 「탭으로 오간다」 설명을 갈음했다.

* **Update**: 공통코드 코드값 CHECK 제약 두 개를 목업 안내와 맞췄다 — `code_groups.group_code` 에 20자 제한이, `code_items.item_code` 에 영문 시작 조건이 각각 빠져 있어 둘 다 `^[A-Z][A-Z0-9_]{0,19}$` 로 통일했다. 목업 공통코드 화면은 그룹·상세 모두 "영문 대문자·숫자·밑줄, 영문으로 시작, 20자 이내"로 안내한다(2026-09-29 확정). 카탈로그 비고도 보강하고 물리 모델을 다시 만들었다. 그룹 13종·상세 60건 전수 통과(최장 19자).

* **Update**: 약관 유형 상세코드 `STAFF_PRIVACY_COLLECT`(21자)를 `STAFF_PRIVACY`(13자)로 줄였다 — 물리 모델의 `code_items.item_code` CHECK 제약이 `^[A-Z0-9_]{1,20}$` 라 21자는 저장되지 않는다. 1팀 ERD 카탈로그·네이밍 원자료·초기 데이터 명세를 고치고 물리 모델을 다시 만들었다. Manyfast `S-PNPZBX` 는 PRO 플랜이 막혀 대기다. 그룹 13종과 상세 60건을 전수 검사해 나머지는 제약을 지킨다(최장 `STAFF_TERMS_SERVICE`·`PLATFORM_REGISTERED` 19자).

* **Update**: `2026-09-29-약관3종-표준안.md` 의 표준안 결론과 미정 항목을 [로그인](/auth.md) 약관 절에 반영했다 — 이용약관 22조 구조, 개인정보 동의 4단 표와 "입력 시 수집" 갈음(제22조 충족 여부는 법무 확인 대기), 마케팅 동의의 채널별 선택·2년 재확인·야간 별도, 못 채운 값 5개와 DPA 별도 문서 여부. 약관 전문 자체는 원자료에 둔다.
* **Update**: `2026-09-30-네이밍-규칙.md` 의 역할 값을 [네이밍 규칙](/conventions/naming.md) 「사람 · 조직」에 반영했다 — `PLATFORM_MASTER` 류를 공통코드 `ROLE_TYPE` 상세코드(`PM`·`PA`·`BM`·`BA`·`FM`·`FA`)로 바꿨다. 긴 형식은 저장소에서 쓰이는 곳이 없었고, `role_groups.role_code` CHECK 제약(`^[A-Z]{2}[0-9]{6}$`)이 유형코드를 대문자 2글자로 못 박아 접두로 쓸 수도 없다.

## 2026-10-02

* **Update**: 약관 유형 공통코드 `TERMS_TYPE` 을 목업 약관 전문 6종에 맞춰 6종으로 정리했다 — 직원 앱용 `STAFF_TERMS_SERVICE`·`STAFF_PRIVACY_COLLECT` 를 더해 1팀 ERD 카탈로그와 네이밍 원자료 용어집에 반영했다(Manyfast S-PNPZBX·F-OFBCVL 승인 대기).
* **Update**: 1팀 ERD `store_image_files` 에 최근 수정 일시·수정자(`updated_at`·`updated_by`)를 더하고, 파일 형식(`mime_type`)을 파일 구분 enum `file_type`(JPG·PNG)으로 바꿨다.
* **Update**: [네이밍 규칙](/conventions/naming.md) 약어 금지 예외에 `admin` 을 더하고, 1팀 ERD 의 나머지 약어를 풀었다 — `auth_type_code`→`role_type_code`(공통코드 `ROLE_TYPE`), `ip_address`→`client_address`, `public_holiday_sync_logs`→`public_holiday_synchronization_logs`(`synchronized_at`·`synchronization_id`). 목업·데모 공통코드 화면의 그룹 코드도 맞췄다.
* **Update**: BP 테이블(`bp_codes`)의 기본키와 이를 가리키는 외래키 `bp_id` 를 테이블 단수형에 맞춰 `bp_code_id` 로 바꿨다 — 1팀 ERD 6개 테이블, 3팀 ERD 의 1팀 참조 박스(점포·관리자 계정), 네이밍 규칙 원자료.
* **Update**: 1팀 ERD `bp_holidays` 의 기본키를 테이블 단수형에 맞춰 `bp_holiday_id` 로 바꾸고, 이를 가리키는 외래키(`holiday_store_mappings`·`holiday_excluded_stores`·`bp_holiday_change_histories` 의 `bp_holiday_id`, 자기 참조 `origin_bp_holiday_id`)도 맞췄다.
* **Update**: 1팀 ERD 의 날짜 컬럼 5개를 [네이밍 규칙](/conventions/naming.md) 의 `_date` 접미로(`closed_date`·`repeat_end_date`·`effective_end_date`·`effective_start_date`·`retain_end_date`), 시각 컬럼 `locked_until` 을 `_at` 접미 `lock_expires_at` 으로 맞췄다. 물리 ERD 기본키는 새 규칙대로 논리 이름(`{참조 단수}_id`)을 그대로 쓴다.
* **Update**: [네이밍 규칙](/conventions/naming.md) DB 절에 삭제 표시(`is_deleted`) 규칙과 함정 두 가지, 기본키도 `{참조 단수}_id`(새 테이블부터) 규칙을 넣고 시각 예시 `deleted_at` 을 `created_at` 으로 바꿨다(2026-10-02 재영, api 세션에서 정함).
* **Update**: 네이밍 규칙 원자료의 1팀 예외에서 세 줄(전체 범위 참·거짓, 변경 이력, 논리 삭제)을 빼고, 삭제 여부(`deleted_at` ↔ `is_deleted`)를 맞춰야 할 것으로 옮겼다. 용어집의 「공통코드 그룹」 목록 절도 각 용어 행과 겹쳐 뺐고, 사건 기록 4종의 용어집 식별자를 `_log` 로 맞췄다(`admin_login_log` 등). 2장 「1팀 예외」 절 이름은 「식별자 1팀 예외」로 바꾸고, 「맞춰야 할 것 (1팀 ↔ 3팀)」 절은 통째로 뺐다. [네이밍 규칙](/conventions/naming.md) 본문은 그대로다.
* **Update**: 1팀 ERD 의 참·거짓 컬럼 8개를 [네이밍 규칙](/conventions/naming.md) 의 `is_` 접두로 맞췄다(`is_bp_applied`, `is_readable` 등). 원자료 공통코드 표의 BP 적용 여부도 같이 고쳤다.
* **Update**: [네이밍 규칙](/conventions/naming.md) 약어 금지 예외에 `biz`(사업자)·`ceo`(대표자)를 더했다. 1팀 ERD 의 나머지 약어(`temp`·`pw`·`reg_no`·`corp`·`info`)는 풀어 썼다.
* **Update**: 점포 유형 표기를 일반점포에서 직영점포로 바꾼 정책(코드 `DIRECT`·`FRANCHISE`)을 [점포 관리](/stores.md) 에 반영했다.
* **Update**: 목업 안에서 어긋나던 곳을 사용자 결정으로 정리해 [로그인](/auth.md) 약관 6종, [BP 마스터 계정 관리](/bp.md) 미인증 BP 의 하이픈 표시 6항목, [점포 관리](/stores.md) 목록 검색(검색 기준+검색어), [BP 환경설정](/config.md) 권한명 중복 범위(같은 관리계정ID), [플랫폼 시스템 관리](/system.md) 관리자 목록 등록일시 검색에 반영했다. 가입 유형(AUTH-3 ↔ HOME-2)은 3팀과 협의 중이라 [홈·계정 진입](/home.md) 은 그대로 둔다.
* **Add**: `docs/mockup/` 의 1팀 영역 6곳을 새 concept 으로 옮겼다 — [로그인](/auth.md) AUTH-1~4, [MY PAGE](/mypage.md) MYPAGE-1~3, [BP 마스터 계정 관리](/bp.md) BP-1~5, [점포 관리](/stores.md) STORE-1~4, [BP 환경설정](/config.md) CONFIG-1~10, [플랫폼 시스템 관리](/system.md) SYSTEM-1~10. 보류 쟁점은 없었고, 목업 안에서 서로 어긋나는 문구는 확정 쪽을 따르거나 뺐다.

## 2026-10-01

* **Update**: [Whale ERP Frontend](/whale-erp-front.md) 에 상세 화면(DetailTable·/design/detail)과 Figma Link_text 토큰을 적었다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) 에 직접 그린 달력(DateField·date-math)과 popover 때문에 올린 browserslist 를 적었다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) 에 헤더 v2 확정으로 v1 헤더·`variant` 분기·`/design/full-v2` 를 지운 것을 적었다.

## 2026-09-18

* **Update**: [Whale ERP Frontend](/whale-erp-front.md) 에 `/design/full` 에도 등록 패널이 붙은 것과 샘플 이동 메뉴를 아래 가운데로 옮긴 것을 적었다.
* **Update**: Pretendard 를 CDN 대신 저장소(`src/app/fonts/`)에서 쓰도록 바꾼 것을 [Whale ERP Frontend](/whale-erp-front.md) 에 적었다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) 에 등록 폼 공통 컴포넌트와 오른쪽 슬라이드 패널(RNB)을 적었다.

## 2026-09-17

* **Update**: [Whale ERP Frontend](/whale-erp-front.md) 에 헤더 v2(Figma Top2)와 `/design/full-v2` 샘플을 적었다.
* **Update**: [Whale ERP Frontend](/whale-erp-front.md) 에 공통 컴포넌트(src/components/common), 디자인 샘플(src/app/design), 아이콘(public/icons), erp 토큰을 적고 sources 에 추가했다.
* **Update**: [Naming](/conventions/naming.md) 문서 전체(1~5장)를 2026-10-01 재영 확인으로 확정했다.
* **Update**: [Naming](/conventions/naming.md) 의 영문 식별자 대응표를 2026-10-01 재영 확인으로 표시했다. 1~4장 계층별 규칙은 여전히 제안이다.
* **Update**: `2026-09-30-네이밍-규칙.md` 의 고친 3장(목록 응답 규칙 확정, 오류는 Nest 기본 유지, 날짜·시각 형식 뺌)과 상태 표시를 [네이밍 규칙](/conventions/naming.md) 에 반영했다.

## 2026-09-30

* **Add**: `2026-09-30-네이밍-규칙.md` 의 DB·API·FRONT 규칙과 용어집 영문 식별자 대응표를 [네이밍 규칙](/conventions/naming.md) 으로 새로 만들었다. 세 저장소가 같은 경로를 쓴다.
* **Update**: 가산 이름을 연장·야간·휴일로 넓히고 주휴·연장 계산 기준을 [직원 운영 관리](/staff.md) 에 적었다.
* **Update**: 파트타이머 명세서의 3.3% 원천징수를 켠 채로 시작하는 것으로 [직원 운영 관리](/staff.md) 를 고쳤다. 노무·세무 확인은 기다린다.
* **Add**: 가맹 점포 직원의 본사 제공 동의를 [직원 운영 관리](/staff.md) 에 넣었다. 동의 없는 직원은 본사 화면에서 가린다.
* **Update**: 만 19세 미만을 근로계약서 초안 단계에서 먼저 막는 것으로 [직원 운영 관리](/staff.md) 를 고쳤다. ERD 근로계약 초안에 관리자 입력 생년월일 칸을 넣었다.
* **Add**: 만 19세 미만을 서비스 대상에서 빼는 결정을 [직원 운영 관리](/staff.md) 에 반영했다. 법무 확인은 기다린다.

## 2026-09-29

* **Update**: 대신 등록으로 충분하다는 판단을 [직원 운영 관리](/staff.md) 에 반영했다. 법무 확인은 기다린다.
* **Update**: 대신 등록 대상에 위치 수집을 일시 중지한 직원이 더해진 것을 [직원 운영 관리](/staff.md) 에 반영했다.
* **Update**: 직원 자료 일괄 저장의 쓸 수 있는 역할과 받을 수 있는 기한이 정해진 것을 [직원 운영 관리](/staff.md) 에 반영했다.
* **Add**: 직원 자료 일괄 저장 기능을 [직원 운영 관리](/staff.md) 에 넣었다. 쓸 수 있는 역할과 받을 수 있는 기한은 미정이다.
* **Update**: 위치 판정 결과를 저장하지 않기로 바뀐 것을 [직원 운영 관리](/staff.md) 에 반영했다.
* **Update**: 확인 필요 사유에 위치 조작 감지가 더해진 것을 [직원 운영 관리](/staff.md) 에 반영했다.
* **Update**: 연장·야간·휴일 가산 적용 여부를 근로계약서에서 빼 급여명세서로 옮긴 결정을 [직원 운영 관리](/staff.md) 에 반영했다.
* **Update**: 위치정보 동의를 거부·철회한 직원의 출퇴근을 관리자가 대신 등록하는 결정과 위치 판정 결과 분리를 [직원 운영 관리](/staff.md) 에 반영했다. 대체수단 적정성은 법무 검토로 남겼다.
* **Update**: 종이 계약 세 가지가 전자계약과 같게 확정되고(STAFF-19) 파트타이머 명세서가 기본 공제와 3.3% 를 함께 두는 것으로 정해져 [직원 운영 관리](/staff.md) 를 맞췄다.
* **Update**: 계약 조건을 칸으로 나눠 받고 4대보험 가입 여부를 계약서에 담으며 종이 계약을 받는 결정을 [직원 운영 관리](/staff.md) 에 반영했다. 종이 계약의 미정 셋은 쟁점으로 남겼다.
* **Update**: 급여명세서의 지급·공제 항목을 옛 시스템에서 모두 가져오기로 한 결정을 [직원 운영 관리](/staff.md) 에 반영했다. 3.3% 원천징수는 미정으로 남겼다.

## 2026-09-28

* **Update**: TO-DO 배정이 앱 푸시를 보내지 않고 긴급은 강조 표시로만 남는다는 결정(앱 NOTI-1)을 [직원 운영 관리](/staff.md) 에 반영했다.

## 2026-09-18

* **Update**: 급여명세서 알림 문구를 처음 발송과 다시 발송으로 나눈 결정을 [직원 운영 관리](/staff.md) 의 급여 정책에 더했다.
* **Update**: 급여명세서의 상태 이력을 처리 이력으로 넓혀 수정 내용까지 남긴다는 결정을 [직원 운영 관리](/staff.md) 의 급여 정책에 더했다.
* **Update**: 관리자 비밀번호 초기화가 임시 비밀번호 대신 24시간 유효한 재설정 링크를 보내는 방식으로 바뀌어 [직원 운영 관리](/staff.md) 의 정책 줄을 고쳤다. 링크와 핀은 한 번만 쓰고 재요청 시 앞 링크가 무효가 된다는 규칙도 함께 적었다.

## 2026-09-17

* **Update**: 발송 결과를 알림 한 줄에 담고 별도 이력 화면을 두지 않는다는 결정(NOTIFY-3)을 [운영 알림](/notify.md) 의 정책과 결정 표에 더했다.

## 2026-09-16

* **Update**: 도입문의가 사업자 정보를 받지 않고 문의자 정보와 도입 문의 내용만 받는 것으로 바뀌어 [홈·계정 진입](/home.md) 과 [고객지원·커뮤니티](/support.md) 를 맞췄다. 푸터 링크 여는 방식도 적었다.

## 2026-09-16

* **Update**: 필기 서명은 처리 완료본에 합성하고 이미지 파일도 따로 보관한다는 결정(STAFF-17)을 [직원 운영 관리](/staff.md) 에 더했다.

## 2026-09-14

* **Update**: 공통 용어집에 맞춰 "스케줄"을 "근무스케줄"로, 번호 뜻의 "연락처"를 "휴대전화번호"로 일괄 고쳤다. 뜻은 바뀌지 않았다.
* **Update**: 공통 용어집에 맞춰 okf 전 concept 의 "직원 앱"을 "직원 근무 앱"으로, "계약 초안"을 "근로계약서 초안"으로 일괄 고쳤다. 뜻은 바뀌지 않았다.
* **Update**: 주민등록번호는 계약서에 넣지 않고 날인 뒤 직원 근무 앱에서 4대보험·원천징수용으로 따로 받는다는 결정(STAFF-16)을 [직원 운영 관리](/staff.md) 의 정책과 결정 표에 더했다.

## 2026-09-11

* **Update**: 가맹점은 가입하지 않고 본사가 관리자 계정을 만들어 준다는 결정을 [홈·계정 진입](/home.md) 의 화면 표와 정책에 반영했다. 초대 가입 문구를 걷어냈다.
* **Update**: 스케줄 알림은 확정 때 등록·수정된 직원에게만 간다는 결정(STAFF-15)을 [직원 운영 관리](/staff.md) 에 더했다.
* **Update**: 스케줄 기본값은 근로계약 근무시간이라는 결정(STAFF-14)을 [직원 운영 관리](/staff.md) 의 정책과 결정 표에 더했다.
* **Addition**: `docs/mockup/staff/` 의 확정 쟁점 13건(STAFF-1~13)과 정책 35줄, 화면 7개를
  [직원 운영 관리](/staff.md) concept 으로 옮겼다. 보류 없음.
* **Addition**: `docs/mockup/support/` 의 확정 쟁점 4건(SUPPORT-1~4)과 정책 19줄, 화면 7개를
  [고객지원·커뮤니티](/support.md) concept 으로 옮겼다. 보류 없음.
* **Addition**: `docs/mockup/notify/` 의 확정 쟁점 2건(NOTIFY-1·2)과 정책 14줄, 화면 2개를
  [운영 알림](/notify.md) concept 으로 옮겼다. 보류 없음.
* **Update**: [홈·계정 진입](/home.md) 의 "1차 범위 밖 위젯" 줄에 출처 `S-JTHJWL` 을 보강했다.
  `docs/mockup/staff-app/`·`attendance/` 는 화면이 없어 건너뛰었다.

## 2026-09-10

* **Addition**: `docs/mockup/home/` 의 확정 쟁점 4건(HOME-1·2·4·5)과 정책 24줄을
  [홈·계정 진입](/home.md) concept 으로 옮겼다. HOME-3 은 보류라 뺐다.

## 2026-08-28

* **Update**: whale-erp-api 연동 샘플(고객 로그인·품목 목록)을 추가하고 [Whale ERP Frontend](/whale-erp-front.md) 에 API 절을 만들었다.
* **Update**: 패키지 매니저를 pnpm 으로 전환하면서 [Whale ERP Frontend](/whale-erp-front.md) 의 스택과 명령을 갱신했다.
* **Initialization**: Created the OKF v0.2 bundle root and the [Whale ERP Frontend](/whale-erp-front.md) concept.
