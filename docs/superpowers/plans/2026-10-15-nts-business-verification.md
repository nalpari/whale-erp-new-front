# 국세청 사업자등록번호 진위확인 — 회원가입 연동 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 회원가입 「인증하기」가 api 를 거쳐 국세청 진위확인을 부르고, 인증한 사업자정보를 가입할 때 `bp_codes` 에 저장한다.

**Architecture:** api 에 국세청 호출을 맡는 `NtsBusinessClient` 와, 중복 검사 → 국세청 확인 → 10분 JWT 발급을 하는 `BusinessVerificationService` 를 둔다. 가입은 그 토큰을 받아 `biz_*` 를 채운다. front 는 서버 액션으로 엔드포인트를 부르고, 받은 토큰을 화면 상태로 들고 있다가 가입 요청에 싣는다.

**Tech Stack:** api — NestJS · Prisma · `@nestjs/jwt` · Jest. front — Next 16 서버 액션 · React 19 · `node --test`.

**Spec:** `docs/superpowers/specs/2026-10-15-nts-business-verification-design.md`

## Global Constraints

- 국세청 연동은 회원가입 PR 들(front #23 · api #37)과 **별도 PR** 로 올린다(2026-10-15 사용자 결정).
  - api: 워크트리 `C:\workspace\.whale-erp-worktrees\whale-erp-api\colosseum`, 브랜치 `magikarp`. 가입 코드(`admin-signup`)가 아직 #37 에만 있어서 `bulbasaur` 위에서 땄다. PR base 는 `bulbasaur` 로 열고, #37 이 머지되면 `main` 으로 바꾼다. alhambra·bulbasaur 는 다른 세션 담당이라 손대지 않는다.
  - front: 워크트리 `C:\workspace\.whale-erp-worktrees\whale-erp-new-front\angkor-wat`, 브랜치 `slowpoke`(`main` 기준). 연동할 회원가입 화면은 PR #23 에 있다. 그래서 Part B 는 #23 이 머지된 뒤 `main` 을 받아 시작한다. stonehenge·papaya 는 다른 세션 담당이라 손대지 않는다.
- 환경변수: `NTS_SERVICE_KEY`. 값을 출력·로그·커밋하지 않는다. 두 워크트리 모두 메인 체크아웃에서 `.env*` 를 복사해 키가 들어 있다(front 는 쓰지 않는다).
- 국세청 엔드포인트: `POST https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=<키>`. 본문 `{ businesses: [{ b_no, start_dt, p_nm }] }`, 결과 `data[0].valid` 가 `"01"`(일치) 또는 `"02"`(불일치).
- 토큰: `typ: 'biz-verification'`, 유효 10분(`expiresIn: '10m'`).
- 응답 문구(그대로 쓴다):
  - 409: `이미 등록된 사업자등록번호입니다.`
  - 422: `입력한 사업자정보가 국세청 정보와 일치하지 않습니다.`
  - 503: `국세청 확인이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.`
  - 400(토큰): `사업자정보 인증이 만료되었습니다. 다시 인증해 주세요.`
  - front 연결 실패: `사업자정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.`
  - front 10분 경과: `인증 시간(10분)이 지났습니다. 다시 인증해 주세요.`
- 국세청 호출 시간 제한 5초. front 서버 액션 시간 제한은 기존 `TIMEOUT_MS`(10초)를 쓴다.
- 회원가입 화면은 세 칸(사업자등록번호·대표자명·개업일자)만 둔다. 휴업·폐업은 막지 않는다.
- 커밋·푸시 전 리뷰 순서(사용자 고정 규칙): ① lint·tsc·test·로컬 실동작 → ② `superpowers:requesting-code-review` → ③ `pr-review-toolkit:review-pr` → ④ `code-review:code-review` → ⑤ `ip-code-review-claude`.
- 코드 주석은 주변 코드처럼 한국어로, 왜 그렇게 하는지를 적는다.

## Review Focus

1. **인증한 뒤 다른 BP 가 같은 번호로 먼저 가입함** → 가입이 409 `이미 등록된 사업자등록번호입니다.` 로 거절되고 BP 는 만들어지지 않는다. Task 3 의 트랜잭션 재검사 테스트로 고정한다.
2. **국세청이 200 인데 본문 모양이 다름**(`data` 없음, `valid` 가 `"01"`·`"02"` 밖) → 일치로 보지 않고 503. Task 1 테스트로 고정한다.
3. **서비스 키가 이미 URL 인코딩된 값(Encoding 키)** → 두 번 인코딩하지 않는다(`%` 가 있으면 그대로 쓴다). Task 1 테스트로 고정한다.
4. **다른 용도의 JWT(가입 완료 토큰·로그인 토큰)를 `bizVerificationToken` 으로 보냄** → `typ` 이 달라 400. Task 2 테스트로 고정한다.
5. **인증 요청 중에 지우기·재인증을 누르거나, 응답이 늦게 옴** → 칸과 버튼이 잠겨 누를 수 없다. 늦은 응답은 그때 값에만 적용한다. Task 6 의 수동 확인 항목으로 둔다.

---

## Part A — api (colosseum · magikarp)

### Task 1: `NtsBusinessClient`

**Files:**
- Create: `src/admin-signup/nts-business.client.ts`
- Test: `src/admin-signup/nts-business.client.spec.ts`

**Interfaces:**
- Produces:
  - `type BizIdentity = { bizRegistrationNumber: string; bizCeoName: string; bizOpenDate: string }` — `bizOpenDate` 는 `YYYY-MM-DD`.
  - `class NtsUnavailableError extends Error`
  - `class NtsBusinessClient { constructor(serviceKey: string | undefined, fetchFn?: typeof fetch); verify(identity: BizIdentity): Promise<'MATCH' | 'MISMATCH'> }` — 그 밖의 경우는 모두 `NtsUnavailableError` 를 던진다.
  - `const NTS_TIMEOUT_MS = 5_000`

- [ ] **Step 1: 실패하는 테스트를 쓴다.** `fetchFn` 은 `jest.fn()` 으로 바꿔 끼운다(`bizppurio.client.ts` 와 같은 주입 방식).
  - `'국세청 validate 에 b_no · start_dt(하이픈 없이) · p_nm 을 POST 한다'`
    - `verify({ bizRegistrationNumber: '1234567890', bizCeoName: '정하윤', bizOpenDate: '2020-03-02' })`
    - 첫 인자 URL 이 `https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=` 로 시작한다.
    - `method: 'POST'`
    - 본문을 JSON 으로 풀면 `{ businesses: [{ b_no: '1234567890', start_dt: '20200302', p_nm: '정하윤' }] }`
    - `signal` 이 있다.
  - `'valid 01 은 MATCH, 02 는 MISMATCH'` — 응답 `{ data: [{ valid: '01' }] }`, `{ data: [{ valid: '02' }] }`.
  - `'200 이어도 data · valid 가 뜻밖이면 NtsUnavailableError'` — `{}`, `{ data: [] }`, `{ data: [{ valid: '03' }] }`.
  - `'2XX 가 아니면 NtsUnavailableError'` — `status: 500`.
  - `'fetch 가 실패(시간 초과 포함)하면 NtsUnavailableError'` — `Object.assign(new Error('t'), { name: 'TimeoutError' })` 로 reject.
  - `'키가 비어 있으면 부르지 않고 NtsUnavailableError'` — `serviceKey` 가 `''` 와 `undefined` 인 경우. `fetchFn` 이 불리지 않는다.
  - `'Decoding 키는 인코딩하고, % 가 든 Encoding 키는 그대로 쓴다'`
    - 키 `'a+b/c=='` → URL 에 `serviceKey=a%2Bb%2Fc%3D%3D`
    - 키 `'a%2Bb'` → `serviceKey=a%2Bb`
- [ ] **Step 2: 실행해서 실패를 확인한다.** `pnpm test -- nts-business.client` → FAIL(모듈 없음).
- [ ] **Step 3: 구현한다.**
  - 시간 제한은 `AbortSignal.timeout(NTS_TIMEOUT_MS)`.
  - `NtsUnavailableError` 메시지에는 키와 URL 을 넣지 않는다. 상태 코드나 원인 이름만 넣는다.
- [ ] **Step 4: 다시 실행해서 통과를 확인한다.** `pnpm test -- nts-business.client` → PASS.
- [ ] **Step 5: 커밋한다.** `git add src/admin-signup/nts-business.client.ts src/admin-signup/nts-business.client.spec.ts`, 메시지 `feat(signup): 국세청 사업자등록번호 진위확인 클라이언트`.

### Task 2: 진위확인 엔드포인트와 토큰

**Files:**
- Create: `src/admin-signup/business-verification.service.ts`
- Create: `src/admin-signup/dto/business-verification.dto.ts`
- Create: `src/admin-signup/dto/business-verification.response.dto.ts`
- Modify: `src/admin-signup/admin-signup.controller.ts`
- Modify: `src/admin-signup/admin-signup.module.ts`
- Test: `src/admin-signup/business-verification.service.spec.ts`
- Test: `src/admin-signup/admin-signup.controller.spec.ts`(케이스 추가)

**Interfaces:**
- Consumes: Task 1 의 `NtsBusinessClient` · `NtsUnavailableError` · `BizIdentity`.
- Produces:
  - `type BizVerificationTokenPayload = BizIdentity & { typ: 'biz-verification' }`
  - `class BusinessVerificationService`
    - `isBizRegistrationNumberTaken(bizRegistrationNumber: string, db?: Prisma.TransactionClient | PrismaService): Promise<boolean>`
    - `verify(identity: BizIdentity): Promise<string>` — 토큰을 돌려준다.
    - `readToken(token: string): Promise<BizIdentity>` — 잘못됐거나 만료됐으면 `BadRequestException(만료 문구)`.
  - DTO `BusinessVerificationDto { bizRegistrationNumber; bizCeoName; bizOpenDate }`
    - 번호: `@Matches(/^[0-9]{10}$/)`, 문구 `사업자등록번호는 숫자 10자리로 입력해 주세요.`
    - 대표자명: `@Transform(trim)` 후 `@Length(1, 50)`
    - 개업일자: `@IsISO8601({ strict: true })` 와 `@Matches(/^\d{4}-\d{2}-\d{2}$/)`
  - 응답 `BusinessVerificationResponseDto { verificationToken: string }`
  - 경로 `POST /auth/signup/business-verifications`, `@HttpCode(HttpStatus.OK)`. 요청 제한은 컨트롤러 기본 한도.
  - 모듈 프로바이더 `NtsBusinessClient`: `useFactory` 로 `ConfigService` 의 `NTS_SERVICE_KEY` 를 읽는다. `isProduction()` 이고 키가 비었으면 `throw new Error('NTS_SERVICE_KEY 가 비어 있다')` 로 기동을 멈춘다.

- [ ] **Step 1: 실패하는 테스트를 쓴다.** prisma · jwt · client 는 `admin-signup.service.spec.ts` 처럼 목으로 바꾼다.
  - `'다른 BP 가 쓰는 번호면 국세청을 부르지 않고 409'` — `bpCode.findFirst` 가 행을 돌려준다. `ConflictException('이미 등록된 사업자등록번호입니다.')`, `client.verify` 는 불리지 않는다.
  - `'BP 중복은 삭제·탈퇴를 빼고 본다'` — `bpCode.findFirst` 의 `where` 가 `{ bizRegistrationNumber, isDeleted: false, accountStatusCode: { not: 'WITHDRAWN' } }`.
  - `'점포 사업자정보가 쓰는 번호여도 409'` — `storeBusinessProfile.findFirst` 가 행을 돌려준다. `where` 는 `{ bizRegistrationNumber, store: { isDeleted: false } }`(실제 관계 이름은 `schema.prisma` 의 `StoreBusinessProfile` 에서 확인한다).
  - `'MISMATCH 면 422 와 불일치 문구'` — `UnprocessableEntityException`.
  - `'NtsUnavailableError 면 503 과 장애 문구, 로그를 남긴다'` — `ServiceUnavailableException`. `Logger.error` 가 불리고, 그 인자에 대표자명이 들어 있지 않다.
  - `'MATCH 면 typ biz-verification 10분 토큰'` — `jwt.signAsync` 가 `({ typ: 'biz-verification', ...identity }, { expiresIn: '10m' })` 로 불린다.
  - `'readToken 은 typ 이 다르거나(signup·access) 서명·만료가 틀리면 400 만료 문구'` — `jwt.verifyAsync` 가 reject 하는 경우와 `{ typ: 'signup' }` 을 돌려주는 경우.
  - `'readToken 은 토큰의 세 값을 돌려준다'`
  - 컨트롤러 spec: `'진위확인은 { verificationToken } 으로 답한다'`.
- [ ] **Step 2: 실행해서 실패를 확인한다.** `pnpm test -- business-verification admin-signup.controller` → FAIL.
- [ ] **Step 3: 구현한다.** 순서는 중복 검사(BP·점포를 `Promise.all`) → `client.verify` → 서명이다. `UnprocessableEntityException`·`ServiceUnavailableException` 문구는 Global Constraints 그대로 쓴다. `AdminSignupService` 의 머리 주석 "아직 없다"도 고친다.
- [ ] **Step 4: 다시 실행해서 통과를 확인한다.** `pnpm test -- admin-signup business-verification` → PASS.
- [ ] **Step 5: 커밋한다.** 메시지 `feat(signup): 사업자정보 진위확인 API — 중복 검사 후 국세청 확인, 10분 토큰`.

### Task 3: 가입할 때 사업자정보 저장

**Files:**
- Modify: `src/admin-signup/dto/signup.dto.ts`
- Modify: `src/admin-signup/admin-signup.service.ts`
- Test: `src/admin-signup/admin-signup.service.spec.ts`
- Test: `test/admin-signup.e2e-spec.ts`(DB 가 뜨는 환경에서만)

**Interfaces:**
- Consumes: Task 2 의 `readToken` · `isBizRegistrationNumberTaken(number, tx)`.
- Produces:
  - `SignupDto.bizVerificationToken?: string` — `@IsOptional() @IsString() @MaxLength(2048)`
  - `SignupInput.bizVerificationToken?: string`
  - `AdminSignupService` 생성자에 `BusinessVerificationService` 를 주입한다.

- [ ] **Step 1: 실패하는 테스트를 쓴다.**
  - `'토큰이 없으면 biz_* 를 비워 둔다'` — `tx.bpCode.create` 의 `data` 에 `bizRegistrationNumber` 가 없다(지금과 같다).
  - `'토큰이 있으면 토큰의 값과 가입 시각을 저장한다'`
    - `readToken` 이 `{ bizRegistrationNumber: '1234567890', bizCeoName: '정하윤', bizOpenDate: '2020-03-02' }` 를 돌려준다.
    - `create.data` 에 `bizRegistrationNumber: '1234567890'`, `bizCeoName: '정하윤'`, `bizOpenDate: new Date('2020-03-02T00:00:00.000Z')`, `bizVerifiedAt: now` 가 있다.
  - `'토큰이 틀리면 트랜잭션 전에 400'` — `readToken` 이 `BadRequestException` 을 던진다. `$transaction` 은 불리지 않는다.
  - `'트랜잭션 안에서 번호가 이미 쓰이면 409 이고 BP 를 만들지 않는다'` — `isBizRegistrationNumberTaken` 이 `tx` 와 함께 불려 true 를 돌려준다. `ConflictException('이미 등록된 사업자등록번호입니다.')`, `tx.bpCode.create` 는 불리지 않는다.
  - e2e(선택): 키 없이 돌도록 `NtsBusinessClient` 를 `{ verify: async () => 'MATCH' }` 로 덮는다. 진위확인 → 가입 → `bp_codes` 행의 `biz_registration_number` · `biz_verified_at` 이 채워진 것을 본다.
- [ ] **Step 2: 실행해서 실패를 확인한다.** `pnpm test -- admin-signup.service` → FAIL.
- [ ] **Step 3: 구현한다.**
  - `readToken` 은 `ensureAvailable` 다음, 트랜잭션 전에 부른다.
  - 번호 재검사는 `nextBpCode` 의 advisory lock 다음에 한다. 그래야 동시 가입이 한 줄로 서서 같은 번호가 둘 다 통과하지 못한다.
  - P2002 재확인 블록은 그대로 둔다.
- [ ] **Step 4: 다시 실행해서 통과를 확인한다.** `pnpm test -- admin-signup` → PASS. DB 가 있으면 `pnpm test:e2e -- admin-signup` → PASS.
- [ ] **Step 5: 커밋한다.** 메시지 `feat(signup): 가입할 때 사업자정보 인증 토큰으로 biz_* 저장`.

### Task 4: openapi · 문서 · 실동작 · 리뷰 · 푸시

**Files:**
- Modify: `openapi/openapi.json`(생성)
- Modify: `.env.example`(`NTS_SERVICE_KEY=` 빈 줄과 한 줄 설명)
- Modify: okf 중 `src/admin-signup/` 를 `sources` 로 가진 concept(`grep -rl admin-signup okf` 로 찾는다), `okf/log.md`

- [ ] **Step 1:** `pnpm openapi:export` → `openapi/openapi.json` 에 `/auth/signup/business-verifications` 와 `SignupDto.bizVerificationToken` 이 생긴다.
- [ ] **Step 2: okf 를 고친다.**
  - 진위확인 경로·순서·문구·토큰 10분을 적는다.
  - 회원가입에는 대표자 연락처 등 선택 입력이 없다는 점을 적는다(근거 "2026-10-15 사용자 확인").
  - `generated.at` 을 갱신하고 `okf/log.md` 에 한 줄 남긴다.
- [ ] **Step 3: 실동작을 확인한다(①).**
  - `pnpm lint`, `pnpm build`, `pnpm test` 가 모두 통과한다.
  - colosseum 에서 api 를 띄운다.
  - 실제 사업자정보로 `curl -X POST localhost:<port>/auth/signup/business-verifications` → 200 `{ verificationToken }`.
  - 대표자명을 틀리게 보내면 → 422.
- [ ] **Step 4: 커밋하고 리뷰한다.** 커밋 전에 ② `superpowers:requesting-code-review`, 그다음 ③ `pr-review-toolkit:review-pr` 을 돌리고 지적을 반영한다.
- [ ] **Step 5: 푸시한다.** `git push -u origin magikarp` 후 PR 을 연다(base `bulbasaur`). 그다음 ④ `code-review:code-review`, ⑤ `ip-code-review-claude`(새 PR, magikarp) 를 돌린다.

## Part B — front (angkor-wat · slowpoke, PR #23 머지 뒤)

### Task 5: 진위확인 서버 액션과 결과 해석

**Files:**
- Create: `src/app/(public)/(site)/signup/_components/biz-verification.ts`
- Test: `src/app/(public)/(site)/signup/_components/biz-verification.test.ts`
- Modify: `src/app/(public)/(site)/signup/actions.ts`
- Modify: `src/lib/api-types.generated.ts`(`pnpm openapi:types`, `WHALE_API_DIR` 을 colosseum 으로)

**Interfaces:**
- Consumes: api 경로 `POST /auth/signup/business-verifications` → `{ verificationToken }`.
- Produces:
  - `biz-verification.ts`(순수 함수, 서버·클라이언트 공용):
    - `BIZ_VERIFICATION_TTL_MS = 10 * 60_000`
    - `BIZ_VERIFY_FAILED_MESSAGE`, `BIZ_VERIFICATION_EXPIRED_MESSAGE`(Global Constraints 문구)
    - `bizVerificationFailure(status: number, message: string): { message: string; log: boolean }`
    - `isBizVerificationExpired(verifiedAt: number, now: number): boolean`
  - `actions.ts`:
    - `type BizVerificationResult = { ok: true; verificationToken: string } | { ok: false; message: string }`
    - `verifyBusiness(input: { bizRegistrationNumber: string; bizCeoName: string; bizOpenDate: string }): Promise<BizVerificationResult>`
    - `SignupPayload.bizVerificationToken?: string`

- [ ] **Step 1: 실패하는 테스트를 쓴다(`node:test`, `validators.test.ts` 와 같은 꼴).**
  - `bizVerificationFailure`:
    - 400·409·422 → `{ message: <api 문구>, log: false }`
    - 503 → `{ message: <api 문구>, log: true }`
    - 429 → `{ message: BUSY_MESSAGE, log: true }`
    - 404·500 → `{ message: BIZ_VERIFY_FAILED_MESSAGE, log: true }`
  - `isBizVerificationExpired`:
    - `(0, 9 * 60_000 + 59_999)` → false
    - `(0, 10 * 60_000)` → true
- [ ] **Step 2: 실행해서 실패를 확인한다.** `node --test "src/app/(public)/(site)/signup/_components/biz-verification.test.ts"` → FAIL.
- [ ] **Step 3: 구현한다.**
  - `verifyBusiness` 는 `checkAvailability` 와 같은 꼴이다: `request` + `apiHeaders()` + `AbortSignal.timeout(TIMEOUT_MS)`.
  - `ApiError` 가 아닌 실패는 로그를 남기고 `BIZ_VERIFY_FAILED_MESSAGE` 를 돌려준다.
  - `SignupPayload` 의 "사업자정보를 보내지 않는다" 주석과 signupToken 옆의 "검증 API 가 아직 없어" 주석 가운데, 사업자정보에 관한 부분을 지금 동작에 맞게 고친다.
- [ ] **Step 4: 실행한다.** `pnpm test` → PASS. `pnpm openapi:types` 로 생성 파일을 새로 만든다.
- [ ] **Step 5: 커밋한다.** 메시지 `feat(auth): 회원가입 사업자정보 진위확인 서버 액션`.

### Task 6: 인증 섹션 연동

**Files:**
- Modify: `src/app/(public)/(site)/signup/biz-auth-section.tsx`

**Interfaces:**
- Consumes: Task 5 의 `verifyBusiness` 와 문구들.
- Produces:
  - `type BizVerification = { token: string; verifiedAt: number }`
  - `type BizAuthValue = { bizRegistrationNumber: string; bizCeoName: string; bizOpenDate: string; verification: BizVerification | null; notice?: string }`
    - 기존 `verified: boolean` 은 `verification !== null` 로 바꾼다.
    - `notice` 는 api 실패 문구나 10분 경과 문구다. 칸을 고치거나, 인증하기·재인증·지우기를 누르면 지운다.
  - `BIZ_AUTH_INITIAL` 은 `verification: null` 로.

- [ ] **Step 1: `handleVerifyClick` 을 비동기로 바꾼다.**
  - 화면 검사(`invalid`)를 통과하면 `pending` 을 켜고 `verifyBusiness` 를 부른다.
  - 성공 → `onChange({ ...value, verification: { token, verifiedAt: Date.now() }, notice: undefined })`
  - 실패 → `onChange({ ...value, notice: message })`
  - 액션 호출이 throw 하면 → `console.error` 를 남기고 `BIZ_VERIFY_FAILED_MESSAGE`.
  - `pending` 인 동안:
    - 세 칸·지우기는 `disabled` 다.
    - 인증하기 버튼 글자는 `인증 중…` 이다.
    - 다시 누르면 아무것도 하지 않는다.
- [ ] **Step 2: 오류 자리를 정한다.** 오류 자리는 `error ?? value.notice` 를 보인다. `notice` 일 때는 칸의 `aria-invalid` 를 걸지 않는다(어느 칸이 틀렸는지 모른다).
- [ ] **Step 3: 재인증·지우기를 맞춘다.** 둘 다 `verification: null, notice: undefined` 로 만든다. 재인증은 값을 남기고, 지우기는 `BIZ_AUTH_INITIAL` 로 돌린다.
- [ ] **Step 4: 머리 주석을 고친다.** "API 연동이 없다 … 자리표시자다" 문단을 지금 동작(api 진위확인, 10분 토큰)으로 바꾼다.
- [ ] **Step 5: 확인한다.** `pnpm lint`, `pnpm exec tsc --noEmit` 가 통과한다. 그다음 Task 7 과 함께 수동으로 확인한다.

### Task 7: 가입 요청에 토큰 싣기 · 10분 경과 처리

**Files:**
- Modify: `src/app/(public)/(site)/signup/signup-form.tsx`

**Interfaces:**
- Consumes: Task 5 의 `isBizVerificationExpired` · `BIZ_VERIFICATION_EXPIRED_MESSAGE` · `SignupPayload.bizVerificationToken`, Task 6 의 `BizAuthValue`.

- [ ] **Step 1: `handleSubmit` 에 만료 검사를 넣는다.** 칸 검사와 약관 검사를 통과한 뒤, `setPending(true)` 전에 둔다.
  - `biz.verification` 이 있고 `isBizVerificationExpired(biz.verification.verifiedAt, Date.now())` 이면, `setBiz({ ...biz, verification: null, notice: BIZ_VERIFICATION_EXPIRED_MESSAGE })` 하고 사업자정보 섹션으로 스크롤한 뒤 return 한다.
- [ ] **Step 2: 토큰을 싣는다.** `createSignup` 페이로드에 `...(biz.verification ? { bizVerificationToken: biz.verification.token } : {})` 를 더한다.
- [ ] **Step 3: 실동작을 확인한다(①).** api(colosseum)와 front 를 띄우고 `/signup` 에서 확인한다.
  - [ ] 실제 사업자정보로 인증하기 → 「인증완료」
  - [ ] 대표자명을 틀리면 → 422 문구가 보이고 칸 테두리는 빨갛지 않다.
  - [ ] 이미 가입한 BP 의 번호 → 409 문구
  - [ ] api 를 끈 채로 → 연결 실패 문구
  - [ ] 인증 중에는 칸·버튼이 잠긴다(Review Focus 5).
  - [ ] 인증하고 가입 → DB `bp_codes` 의 `biz_*`·`biz_verified_at` 이 채워진다.
  - [ ] 인증하지 않고 가입 → `biz_*` 가 비어 있다.
  - [ ] 10분 경과 → 개발자도구에서 `Date.now` 를 앞당기거나 `BIZ_VERIFICATION_TTL_MS` 를 잠시 줄여 문구를 확인한다. 줄였으면 되돌린다.
- [ ] **Step 4: 확인한다.** `pnpm lint`, `pnpm test`, `pnpm build` 가 모두 통과한다.
- [ ] **Step 5: 커밋한다.** Task 6 과 함께 커밋한다. 메시지 `feat(auth): 회원가입 사업자정보 인증하기를 국세청 진위확인으로 연동`.

### Task 8: front 문서 · 리뷰 · 푸시

**Files:**
- Modify: `okf/auth.md`(「가입」 절 59~62행)
- Modify: `okf/whale-erp-front.md`(signup 항목)
- Modify: `okf/log.md`

- [ ] **Step 1: `okf/auth.md` 를 고친다.**
  - 61행의 "인증에 성공해야 대표자 연락처…선택 입력이 열린다"를 회원가입에서 뺀다. 그 칸들은 마이페이지·점포에서 받는다고 적고, 근거는 `2026-10-15 사용자 확인` 으로 둔다.
  - 재인증 문장은 "인증 결과를 지우고 세 칸은 남긴다"로 맞춘다.
  - `generated.at` 을 갱신한다.
- [ ] **Step 2: `okf/whale-erp-front.md` 를 고친다.** signup 설명의 "국세청 진위확인 연동 전이라 … 싣지 않는다"를 지금 동작으로 바꾼다. 서버 액션 `verifyBusiness`, 10분 토큰, 가입 시 `bizVerificationToken` 을 적는다. `generated.at` 을 갱신한다.
- [ ] **Step 3: `okf/log.md` 에 한 줄 남긴다.**
- [ ] **Step 4: 리뷰를 돌린다.** ② `superpowers:requesting-code-review` → 커밋 `docs(okf): 회원가입 사업자정보 진위확인 반영` → ③ `pr-review-toolkit:review-pr` 을 돌리고 지적을 반영한다.
- [ ] **Step 5: 푸시한다.** `git push -u origin slowpoke` 후 PR 을 연다(base `main`). 그다음 ④ `code-review:code-review`, ⑤ `ip-code-review-claude`(새 PR, slowpoke) 를 돌린다. PR 본문에 api PR(magikarp)이 먼저 머지돼야 한다는 점을 적는다.
