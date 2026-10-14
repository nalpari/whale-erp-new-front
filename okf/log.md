# Bundle history

## 2026-10-14
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
