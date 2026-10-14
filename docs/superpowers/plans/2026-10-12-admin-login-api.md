# 관리자 로그인 API 구현 계획 (whale-erp-api)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 1팀 관리자(`admin_accounts`)가 아이디·비밀번호(임시 비밀번호 포함)로 로그인·갱신·로그아웃하고, 이름·아이디·이메일로 임시 비밀번호를 메일로 받게 한다.

**Architecture:** 직원 앱 로그인(`src/auth/account-auth.*`, `src/auth-session/`)과 같은 모양으로 `src/auth/admin-auth.*`·`src/auth/admin-session.service.ts` 를 더한다. 잠금(`attempt-lock`)·해시(`password`)·요청 제한(`throttle`)·전역 가드는 그대로 쓰고, 가드에 admin 세션 확인을 넣는다. 메일은 기존 `MailService` + `EMAIL_TEMP_PASSWORD` 템플릿.

**Tech Stack:** NestJS 11, Prisma, PostgreSQL, jest(+supertest e2e), class-validator, `@nestjs/jwt`, `@nestjs/throttler`.

설계: front 저장소 `docs/superpowers/specs/2026-10-12-admin-login-layout-design.md` §1.

## Global Constraints

- 테이블은 이미 있다(`admin_accounts`·`admin_sessions`·`temporary_passwords`·`admin_login_logs`). **마이그레이션을 만들지 않는다.** 확정 마이그레이션(`20261006000000_team1_initial`, `…000100_team1_initial_data`)은 절대 고치지 않는다.
- 계정 상태 코드: `ACTIVE`(사용) · `INACTIVE`(미사용) · `WITHDRAWN`(탈퇴). 권한 유형: `PM`·`PA`·`BM`·`BA`·`FM`·`FA`.
- 아이디: `^[A-Za-z0-9]{4,20}$`(DB CHECK), 대소문자 그대로 비교. `login_id` 는 SQL 유니크 인덱스뿐이라 Prisma 에서는 `findFirst`.
- 접근 토큰 1시간(`ACCESS_TTL = '1h'`). 갱신 토큰은 회전하지 않고 마지막 사용부터 1시간(`ADMIN_SESSION_IDLE_MS = 60 * 60 * 1000`). DB 에는 sha256 해시(`hashToken`)만.
- 실패 문구 하나: `아이디 또는 비밀번호가 올바르지 않습니다` (401). 미사용: `사용이 중지된 계정입니다. 관리자에게 문의해 주세요` (403, 비밀번호가 맞을 때만). 잠금: 429.
- 임시 비밀번호: 12자, 1시간, 계정당 1시간 5회(`purpose = TEMPORARY` 만 센다), 다시 받으면 앞의 것 무효, 메일이 실패하면 아무것도 쓰지 않는다, 발급하면 잠금 해제.
- 응답·오류는 Nest 기본 `{ statusCode, message, error }`.
- 커밋: 영문 타입 접두 + 한글 제목/본문, 의도별로 나눈다, `git add -A` 금지, 끝줄 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. 푸시는 사용자가 요청할 때만.
- 이 저장소의 `okf/` 규칙: 고친 파일이 어떤 concept 의 `sources[].resource` 에 있으면 그 concept 과 `okf/log.md` 를 고친다.

## 파일 구조

| 파일 | 책임 |
|---|---|
| `src/auth/auth.types.ts` (수정) | `AdminUser` 에 `sid` |
| `src/auth/admin-session.service.ts` (새) | `admin_sessions` 발급·갱신·확인·종료, `admin_login_logs` 기록 |
| `src/auth/jwt-auth.guard.ts` (수정) | admin 토큰도 세션 확인 |
| `src/auth/admin-auth.service.ts` (새) | 로그인 판정·갱신·로그아웃 |
| `src/auth/admin-temporary-password.service.ts` (새) | 임시 비밀번호 발급 |
| `src/auth/admin-auth.controller.ts` (새) | `POST /auth/admin/{login,refresh,logout,temporary-passwords}` |
| `src/auth/dto/admin-*.dto.ts` (새) | 요청·응답 DTO |
| `src/auth/throttle.ts` (수정) | 계정 축이 `loginId` 도 센다 |
| `src/auth/auth.module.ts` (수정) | 새 서비스·컨트롤러, `MailModule` |
| `test/admin-auth.e2e-spec.ts` (새) | 로그인·갱신·로그아웃·가드 |
| `test/admin-temporary-password.e2e-spec.ts` (새) | 발급 → 로그인 |

---

### Task 0: api 워크트리 준비

**Files:** 없음(환경)

- [ ] **Step 1: 이름 확인 후 워크트리 만들기**

```bash
cd /c/workspace/whale-erp/whale-erp-api
git fetch origin
git worktree list && git branch -a | grep -iE "squirtle|charmander" ; ls /c/workspace/.whale-erp-worktrees/whale-erp-api 2>/dev/null
# 겹치지 않으면(겹치면 다른 명소·포켓몬 이름):
git worktree add /c/workspace/.whale-erp-worktrees/whale-erp-api/kyoto -b squirtle origin/main
cp .env* /c/workspace/.whale-erp-worktrees/whale-erp-api/kyoto/
cd /c/workspace/.whale-erp-worktrees/whale-erp-api/kyoto && pnpm install && pnpm prisma generate
```

- [ ] **Step 2: 기준선 확인**

Run: `pnpm test 2>&1 | tail -5`
Expected: 모든 테스트 PASS. (실패가 있으면 멈추고 사용자에게 알린다 — 이 작업 전부터 깨진 것이다.)

Run: `pnpm test:e2e -- account-auth 2>&1 | tail -5`
Expected: PASS (로컬 DB 가 `.env.local` 의 `DATABASE_URL` 로 떠 있어야 한다. 안 뜨면 사용자에게 DB 를 띄워 달라고 한다).

---

### Task 1: admin 세션 서비스 + 가드의 세션 확인

**Files:**
- Modify: `src/auth/auth.types.ts`
- Create: `src/auth/admin-session.service.ts`
- Modify: `src/auth/jwt-auth.guard.ts`
- Modify: `src/auth/auth.module.ts` (providers 에 `AdminSessionService`)
- Test: `src/auth/admin-session.service.spec.ts`, `src/auth/jwt-auth.guard.spec.ts`(기존 파일에 케이스 추가)

**Interfaces:**
- Produces:
  - `ADMIN_SESSION_IDLE_MS: number` (= 3_600_000)
  - `ADMIN_INVALID_SESSION_MESSAGE = '만료되었거나 종료된 접속입니다'`
  - `AdminSessionService.issue(input: { adminAccountId: number; deviceInformation?: string }, client: Prisma.TransactionClient): Promise<{ sessionId: number; refreshToken: string; expiresAt: Date }>`
  - `AdminSessionService.setAccessToken(sessionId: number, accessToken: string, client?: Prisma.TransactionClient): Promise<void>`
  - `AdminSessionService.validate(refreshToken: string): Promise<{ sessionId: number; adminAccountId: number; expiresAt: Date }>`
  - `AdminSessionService.isActive(sessionId: number, adminAccountId: number): Promise<boolean>`
  - `AdminSessionService.revoke(sessionId: number): Promise<void>`
  - `AdminSessionService.recordLogin(input: { adminAccountId?: number; clientAddress?: string; isSucceeded: boolean; failureReason?: LoginFailureReason }, client?: Prisma.TransactionClient): Promise<void>`
  - `AdminUser = { type: 'admin'; id: number; email: string; sid: number }`

- [ ] **Step 1: 실패하는 테스트 — 세션 서비스**

`src/auth/admin-session.service.spec.ts`:

```ts
import { UnauthorizedException } from '@nestjs/common';
import { hashToken } from './password';
import {
  ADMIN_SESSION_IDLE_MS,
  AdminSessionService,
} from './admin-session.service';

// Prisma 는 쓰는 메서드만 흉내 낸다.
function prismaMock() {
  return {
    adminSession: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    adminLoginLog: { create: jest.fn() },
  };
}

describe('AdminSessionService', () => {
  it('issue 는 갱신 토큰 해시만 저장하고 만료를 지금부터 1시간으로 둔다', async () => {
    const prisma = prismaMock();
    prisma.adminSession.create.mockResolvedValue({ sessionId: 7 });
    const service = new AdminSessionService(prisma as never);
    const before = Date.now();

    const issued = await service.issue(
      { adminAccountId: 1, deviceInformation: 'chrome' },
      prisma as never,
    );

    const data = prisma.adminSession.create.mock.calls[0][0].data;
    expect(data.refreshTokenHash).toBe(hashToken(issued.refreshToken));
    expect(data.refreshTokenHash).not.toBe(issued.refreshToken);
    expect(issued.sessionId).toBe(7);
    expect(issued.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + ADMIN_SESSION_IDLE_MS,
    );
  });

  it('validate 는 종료·만료·없는 토큰을 같은 401 로 거부한다', async () => {
    const prisma = prismaMock();
    prisma.adminSession.findFirst.mockResolvedValue(null);
    const service = new AdminSessionService(prisma as never);
    await expect(service.validate('nope')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('validate 는 사용 중 계정이 아니면 거부한다', async () => {
    const prisma = prismaMock();
    prisma.adminSession.findFirst.mockResolvedValue({
      sessionId: 1,
      adminAccountId: 2,
      expiresAt: new Date(Date.now() + 1000),
      adminAccount: { accountStatusCode: 'INACTIVE', isDeleted: false },
    });
    const service = new AdminSessionService(prisma as never);
    await expect(service.validate('t')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('validate 는 살아 있으면 마지막 사용 시각과 만료를 민다', async () => {
    const prisma = prismaMock();
    prisma.adminSession.findFirst.mockResolvedValue({
      sessionId: 1,
      adminAccountId: 2,
      expiresAt: new Date(Date.now() + 1000),
      adminAccount: { accountStatusCode: 'ACTIVE', isDeleted: false },
    });
    prisma.adminSession.updateMany.mockResolvedValue({ count: 1 });
    const service = new AdminSessionService(prisma as never);

    const valid = await service.validate('t');

    expect(valid).toMatchObject({ sessionId: 1, adminAccountId: 2 });
    const { data } = prisma.adminSession.updateMany.mock.calls[0][0];
    expect(data.refreshLastUsedAt).toBeInstanceOf(Date);
    expect(data.expiresAt.getTime() - data.refreshLastUsedAt.getTime()).toBe(
      ADMIN_SESSION_IDLE_MS,
    );
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test -- admin-session.service`
Expected: FAIL — `Cannot find module './admin-session.service'`

- [ ] **Step 3: `auth.types.ts` 의 `AdminUser` 에 sid**

`src/auth/auth.types.ts` 에서 `AdminUser` 를 바꾸고, 위 주석 두 곳(「admin 은 없다」, 「1팀 로그인이 생기면 쓴다」)을 지금 사실로 고친다:

```ts
/**
 * 가드가 검증을 마치고 요청에 실어 주는 값. 두 종류 모두 접속 상태(`sid`)가 있다 —
 * account 는 auth_sessions, admin 은 admin_sessions 의 id 다.
 */
export type AuthUser = AccountUser | AdminUser;

export interface AdminUser {
  type: 'admin';
  id: number;
  /** 관리자 이메일. 비어 있을 수 있는 칸이라 없으면 빈 문자열이다. */
  email: string;
  /** 이 요청의 토큰을 낸 접속 상태(admin_sessions). 로그아웃이 이 접속만 종료한다. */
  sid: number;
}
```

`UserType` 주석의 「지금 토큰을 내는 로그인은 `account` 하나이고, `admin` 은 1팀 로그인이 생기면 쓴다」를 「`admin` 은 관리자 웹 로그인(`/auth/admin`)이 낸다」로 바꾸고, `JwtPayload.sid` 주석을 「이 토큰을 낸 접속 상태의 id. account 는 auth_sessions, admin 은 admin_sessions」로 바꾼다.

- [ ] **Step 4: 세션 서비스 구현**

`src/auth/admin-session.service.ts`:

```ts
import { randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginFailureReason, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { hashToken } from './password';

/** 갱신 토큰은 마지막으로 쓴 때부터 이 시간이 지나면 만료다(okf/auth.md 로그인 · 세션). */
export const ADMIN_SESSION_IDLE_MS = 60 * 60 * 1000;

export const ADMIN_INVALID_SESSION_MESSAGE = '만료되었거나 종료된 접속입니다';

type Client = Prisma.TransactionClient | PrismaService;

/**
 * 관리자 웹 접속 상태(admin_sessions)와 로그인 이력(admin_login_logs).
 * 직원 앱의 AuthSessionService 와 같은 규칙이고, 수명만 다르다 — 갱신 토큰은 회전하지
 * 않고 쓸 때마다 만료를 「지금 + 1시간」으로 민다.
 */
@Injectable()
export class AdminSessionService {
  constructor(private readonly prisma: PrismaService) {}

  /** 새 접속. 로그인 성공 트랜잭션 안에서 부른다. 같은 기기 정보라도 앞 접속을 끊지 않는다 — 여러 탭·브라우저 동시 로그인. */
  async issue(
    input: { adminAccountId: number; deviceInformation?: string },
    client: Client,
  ): Promise<{ sessionId: number; refreshToken: string; expiresAt: Date }> {
    const now = new Date();
    const refreshToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(now.getTime() + ADMIN_SESSION_IDLE_MS);
    const { sessionId } = await client.adminSession.create({
      data: {
        adminAccountId: input.adminAccountId,
        deviceInformation: input.deviceInformation ?? null,
        // 접근 토큰은 sid 를 담아야 해서 행을 만든 뒤에 서명한다. 서명 뒤 setAccessToken 이 채운다.
        accessTokenHash: '',
        refreshTokenHash: hashToken(refreshToken),
        refreshLastUsedAt: now,
        expiresAt,
        createdBy: input.adminAccountId,
      },
      select: { sessionId: true },
    });
    return { sessionId, refreshToken, expiresAt };
  }

  async setAccessToken(
    sessionId: number,
    accessToken: string,
    client: Client = this.prisma,
  ): Promise<void> {
    await client.adminSession.update({
      where: { sessionId },
      data: { accessTokenHash: hashToken(accessToken) },
    });
  }

  /**
   * 갱신 토큰이 살아 있는 접속을 가리키면 마지막 사용 시각을 지금으로, 만료를 1시간 뒤로 민다.
   * 없는 토큰·만료·종료·사용 중이 아닌 계정을 같은 401 로 답한다 — 구분해 주면 토큰이 한때
   * 유효했는지가 드러난다.
   */
  async validate(
    refreshToken: string,
  ): Promise<{ sessionId: number; adminAccountId: number; expiresAt: Date }> {
    const now = new Date();
    const session = await this.prisma.adminSession.findFirst({
      where: {
        refreshTokenHash: hashToken(refreshToken),
        revokedAt: null,
        isDeleted: false,
      },
      include: {
        adminAccount: { select: { accountStatusCode: true, isDeleted: true } },
      },
    });
    // 만료 시각과 같은 순간도 만료다.
    if (
      !session ||
      session.expiresAt.getTime() <= now.getTime() ||
      session.adminAccount.isDeleted ||
      session.adminAccount.accountStatusCode !== 'ACTIVE'
    )
      throw new UnauthorizedException(ADMIN_INVALID_SESSION_MESSAGE);

    const expiresAt = new Date(now.getTime() + ADMIN_SESSION_IDLE_MS);
    // 읽은 뒤 쓰는 사이 로그아웃·만료될 수 있어 살아 있다는 조건을 다시 건다.
    const { count } = await this.prisma.adminSession.updateMany({
      where: {
        sessionId: session.sessionId,
        revokedAt: null,
        isDeleted: false,
        expiresAt: { gt: now },
      },
      data: { refreshLastUsedAt: now, expiresAt },
    });
    if (count === 0)
      throw new UnauthorizedException(ADMIN_INVALID_SESSION_MESSAGE);
    return {
      sessionId: session.sessionId,
      adminAccountId: session.adminAccountId,
      expiresAt,
    };
  }

  /**
   * 요청마다 가드가 부른다. 읽기만 한다. 계정 상태는 보지 않는다 — 미사용·탈퇴 계정의 접속은
   * 접근 토큰이 끝나는 최대 1시간 안에 끝난다는 것이 정책이다(갱신에서 거절).
   */
  async isActive(sessionId: number, adminAccountId: number): Promise<boolean> {
    const alive = await this.prisma.adminSession.count({
      where: { sessionId, adminAccountId, revokedAt: null, isDeleted: false },
    });
    return alive > 0;
  }

  async revoke(sessionId: number): Promise<void> {
    await this.prisma.adminSession.updateMany({
      where: { sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async recordLogin(
    input: {
      adminAccountId?: number;
      clientAddress?: string;
      isSucceeded: boolean;
      failureReason?: LoginFailureReason;
    },
    client: Client = this.prisma,
  ): Promise<void> {
    await client.adminLoginLog.create({
      data: {
        adminAccountId: input.adminAccountId ?? null,
        clientAddress: input.clientAddress ?? null,
        isSucceeded: input.isSucceeded,
        failureReason: input.failureReason ?? null,
      },
    });
  }
}
```

- [ ] **Step 5: 세션 서비스 테스트 통과**

Run: `pnpm test -- admin-session.service`
Expected: PASS (4 tests)

- [ ] **Step 6: 실패하는 테스트 — 가드가 admin 세션을 확인한다**

`src/auth/jwt-auth.guard.spec.ts` 를 열어 기존 가드 생성 방식(목 `JwtService`·`Reflector`·`AuthSessionService`)을 따라 `AdminSessionService` 목(`{ isActive: jest.fn() }`)을 생성자 네 번째 인자로 더하고, 아래 두 케이스를 더한다. 기존 케이스 중 「admin 은 세션 확인 없이 통과」를 확인하던 것이 있으면 아래 케이스로 바꾼다.

```ts
it('admin 토큰은 접속이 살아 있어야 통과하고 sid 를 싣는다', async () => {
  jwt.verifyAsync.mockResolvedValue({ sub: 3, type: 'admin', email: '', typ: 'access', sid: 9 });
  adminSessions.isActive.mockResolvedValue(true);
  const request = { headers: { authorization: 'Bearer t' } } as { headers: Record<string, string>; user?: unknown };

  await expect(guard.canActivate(contextOf(request))).resolves.toBe(true);
  expect(adminSessions.isActive).toHaveBeenCalledWith(9, 3);
  expect(request.user).toEqual({ type: 'admin', id: 3, email: '', sid: 9 });
});

it('admin 토큰의 접속이 종료됐거나 sid 가 없으면 401', async () => {
  jwt.verifyAsync.mockResolvedValue({ sub: 3, type: 'admin', email: '', typ: 'access', sid: 9 });
  adminSessions.isActive.mockResolvedValue(false);
  await expect(guard.canActivate(contextOf({ headers: { authorization: 'Bearer t' } }))).rejects.toBeInstanceOf(UnauthorizedException);

  jwt.verifyAsync.mockResolvedValue({ sub: 3, type: 'admin', email: '', typ: 'access' });
  await expect(guard.canActivate(contextOf({ headers: { authorization: 'Bearer t' } }))).rejects.toBeInstanceOf(UnauthorizedException);
});
```

(`contextOf`·`jwt`·`guard` 는 기존 spec 의 헬퍼 이름을 그대로 쓴다. 이름이 다르면 기존 이름에 맞춘다.)

- [ ] **Step 7: 실패 확인**

Run: `pnpm test -- jwt-auth.guard`
Expected: FAIL — 새 케이스에서 `isActive` 가 불리지 않음

- [ ] **Step 8: 가드 수정**

`src/auth/jwt-auth.guard.ts` — 생성자에 `private readonly adminSessions: AdminSessionService` 를 더하고(import `{ AdminSessionService } from './admin-session.service'`), `else` 갈래를 바꾼다:

```ts
    } else {
      // admin 도 접속 상태(admin_sessions)를 확인한다. 로그아웃한 토큰이 남은 1시간 동안 통과하지 않게.
      const { sid } = payload;
      if (
        typeof sid !== 'number' ||
        !(await this.adminSessions.isActive(sid, payload.sub))
      )
        throw new UnauthorizedException('만료되었거나 종료된 접속입니다');
      user = { type: 'admin', id: payload.sub, email: payload.email, sid };
    }
```

같은 파일 위 주석의 「액세스 토큰은 서명만 보면 15분 동안 통과하므로」 → 「서명만 보면 수명(직원 15분·관리자 1시간) 동안 통과하므로」, 「접속 상태가 있는 종류(account)는」 → 「두 종류 모두」로 고친다.

`src/auth/auth.module.ts` providers 에 `AdminSessionService` 를 더한다(import 포함).

- [ ] **Step 9: 전체 단위 테스트**

Run: `pnpm test`
Expected: 모두 PASS. `retirement.controller` 처럼 `AdminUser` 를 만드는 테스트가 `sid` 없음으로 타입 오류가 나면 그 테스트의 값에 `sid: 1` 을 더한다.

- [ ] **Step 10: 커밋**

```bash
git add src/auth/auth.types.ts src/auth/admin-session.service.ts src/auth/admin-session.service.spec.ts src/auth/jwt-auth.guard.ts src/auth/jwt-auth.guard.spec.ts src/auth/auth.module.ts
git status --short   # 위 목록 + Step 9 에서 고친 spec 만 있어야 한다. 있으면 그것도 add
git commit -m "feat(auth): 관리자 접속 상태(admin_sessions)와 가드의 세션 확인

관리자 토큰도 접속이 살아 있어야 통과한다. 지금까지는 세션 확인 없이 통과했다.
갱신 토큰은 회전하지 않고 마지막 사용부터 1시간으로 민다.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 관리자 로그인 (`POST /auth/admin/login`)

**Files:**
- Create: `src/auth/dto/admin-login.dto.ts`, `src/auth/dto/admin-login.response.dto.ts`
- Create: `src/auth/admin-auth.service.ts`, `src/auth/admin-auth.controller.ts`
- Modify: `src/auth/throttle.ts`, `src/auth/throttle.spec.ts`, `src/auth/auth.module.ts`
- Test: `test/admin-auth.e2e-spec.ts`

**Interfaces:**
- Consumes: Task 1 `AdminSessionService`, `ADMIN_SESSION_IDLE_MS`
- Produces:
  - HTTP `POST /auth/admin/login` 본문 `{ loginId: string; password: string; deviceInformation?: string }` → 200
    `{ accessToken: string; refreshToken: string; refreshTokenExpiresAt: string(ISO); admin: { adminAccountId: number; loginId: string; name: string | null; roleTypeCode: string; bpCode: string; isPasswordChangeRequired: boolean } }`
  - 401 `아이디 또는 비밀번호가 올바르지 않습니다` · 403 `사용이 중지된 계정입니다. 관리자에게 문의해 주세요` · 429 잠금
  - `AdminAuthService.login(dto: AdminLoginDto, clientAddress?: string): Promise<AdminLoginResponseDto>`
  - `AdminAuthService.signAccessToken(adminAccountId: number, email: string, sessionId: number): Promise<string>` (private 아님 — Task 3 이 쓴다)
  - `ADMIN_ACCESS_TTL = '1h'`

- [ ] **Step 1: 실패하는 e2e 테스트**

`test/admin-auth.e2e-spec.ts`:

```ts
import { randomBytes } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { hashPassword } from '../src/auth/password';
import { AdminLoginResponseDto } from '../src/auth/dto/admin-login.response.dto';
import { MAIL_CONFIG } from '../src/mail/mail.config';
import { MAIL_TRANSPORT } from '../src/mail/mail.service';
import { PrismaService } from '../src/prisma/prisma.service';

const PASSWORD = 'correct-horse-1!';
const body = (res: { body: unknown }) => res.body as AdminLoginResponseDto;
const messageOf = (res: { body: unknown }) => (res.body as { message: string }).message;

// 관리자 로그인 HTTP 계약을 실제 DB 로 확인한다. 계정마다 다른 아이디를 써 요청 제한(계정 10/10분)에 걸리지 않게 한다.
describe('/auth/admin (e2e, DB)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwt: JwtService;
  let passwordHash: string;
  let platformBpCodeId: number;
  let roleGroupId: number;
  const created: number[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      // 메일을 실제로 보내지 않는다. MAIL_* 환경 변수가 없어도 뜨게 설정도 바꿔 끼운다.
      .overrideProvider(MAIL_CONFIG).useValue({ username: 'test@test.invalid', password: 'x' })
      .overrideProvider(MAIL_TRANSPORT).useValue({ sendMail: jest.fn().mockResolvedValue({ messageId: 'test' }) })
      .compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
    passwordHash = await hashPassword(PASSWORD);
    // 시드의 whaleadmin 과 같은 BP·권한 그룹을 빌려 쓴다(플랫폼 BP, PM 그룹).
    const seed = await prisma.adminAccount.findFirstOrThrow({ where: { loginId: 'whaleadmin' } });
    platformBpCodeId = seed.bpCodeId;
    roleGroupId = seed.roleGroupId;
  });

  afterAll(async () => {
    const mine = { adminAccountId: { in: created } };
    await prisma.adminSession.deleteMany({ where: mine });
    await prisma.adminLoginLog.deleteMany({ where: mine });
    await prisma.temporaryPassword.deleteMany({ where: mine });
    await prisma.mailSendLog.deleteMany({ where: mine });
    await prisma.adminAccount.deleteMany({ where: mine });
    await app.close();
  });

  async function createAdmin(overrides: { accountStatusCode?: string; roleTypeCode?: string } = {}) {
    const loginId = `e2e${randomBytes(6).toString('hex')}`; // 15자, 영문·숫자
    const admin = await prisma.adminAccount.create({
      data: {
        loginId,
        bpCodeId: platformBpCodeId,
        name: '테스트',
        passwordHash,
        email: `${loginId}@test.invalid`,
        roleTypeCode: overrides.roleTypeCode ?? 'PM',
        roleGroupId,
        joinPathCode: 'PLATFORM_REGISTERED',
        accountStatusCode: overrides.accountStatusCode ?? 'ACTIVE',
      },
    });
    created.push(admin.adminAccountId);
    return admin;
  }

  const login = (loginId: string, password: string) =>
    request(app.getHttpServer()).post('/auth/admin/login').send({ loginId, password });

  it('맞는 아이디·비밀번호면 토큰과 권한 유형을 준다', async () => {
    const admin = await createAdmin();
    const res = await login(admin.loginId, PASSWORD).expect(200);

    expect(body(res).admin).toMatchObject({
      adminAccountId: admin.adminAccountId,
      loginId: admin.loginId,
      roleTypeCode: 'PM',
      bpCode: 'BP000000',
      isPasswordChangeRequired: false,
    });
    const payload = await jwt.verifyAsync<{ type: string; sid: number; exp: number; iat: number }>(body(res).accessToken);
    expect(payload.type).toBe('admin');
    expect(payload.exp - payload.iat).toBe(3600);
    const session = await prisma.adminSession.findUniqueOrThrow({ where: { sessionId: payload.sid } });
    expect(session.accessTokenHash).not.toBe('');
    const log = await prisma.adminLoginLog.findFirstOrThrow({ where: { adminAccountId: admin.adminAccountId } });
    expect(log.isSucceeded).toBe(true);
  });

  it('없는 아이디와 틀린 비밀번호는 같은 401 문구다', async () => {
    const admin = await createAdmin();
    const wrong = await login(admin.loginId, 'wrong-password-1!').expect(401);
    const missing = await login(`nobody${randomBytes(4).toString('hex')}`, PASSWORD).expect(401);
    expect(messageOf(wrong)).toBe('아이디 또는 비밀번호가 올바르지 않습니다');
    expect(messageOf(missing)).toBe(messageOf(wrong));
  });

  it('탈퇴 계정은 맞는 비밀번호여도 없는 계정과 같은 401', async () => {
    const admin = await createAdmin({ accountStatusCode: 'WITHDRAWN' });
    const res = await login(admin.loginId, PASSWORD).expect(401);
    expect(messageOf(res)).toBe('아이디 또는 비밀번호가 올바르지 않습니다');
  });

  it('미사용 계정은 비밀번호가 맞을 때만 403 으로 알린다', async () => {
    const admin = await createAdmin({ accountStatusCode: 'INACTIVE' });
    await login(admin.loginId, 'wrong-password-1!').expect(401);
    const res = await login(admin.loginId, PASSWORD).expect(403);
    expect(messageOf(res)).toBe('사용이 중지된 계정입니다. 관리자에게 문의해 주세요');
  });

  it('5번 틀리면 잠기고, 잠긴 동안은 맞는 비밀번호도 429', async () => {
    const admin = await createAdmin();
    for (let i = 0; i < 4; i++) await login(admin.loginId, 'wrong-password-1!').expect(401);
    await login(admin.loginId, 'wrong-password-1!').expect(429);
    await login(admin.loginId, PASSWORD).expect(429);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test:e2e -- admin-auth`
Expected: FAIL — `Cannot find module '../src/auth/dto/admin-login.response.dto'`

- [ ] **Step 3: DTO**

`src/auth/dto/admin-login.dto.ts`:

```ts
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminLoginDto {
  /** 관리자 로그인 아이디. 영문·숫자 4~20자이고 대소문자를 그대로 비교한다. 형식은 여기서 막지 않는다 — 틀린 형식도 같은 실패 문구로 답한다. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  loginId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;

  /** 브라우저 구분용 설명(User-Agent 등). 접속 목록에 남길 뿐 접속을 끊는 데 쓰지 않는다. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  deviceInformation?: string;
}
```

`src/auth/dto/admin-login.response.dto.ts`:

```ts
export class AdminLoginAccountDto {
  adminAccountId: number;
  loginId: string;
  name: string | null;
  /** 공통코드 ROLE_TYPE — PM·PA 면 플랫폼관리 사이트, 그 밖은 웨일ERP(BP) 홈으로 보낸다. */
  roleTypeCode: string;
  /** 소속 BP 코드. 플랫폼 계정은 BP000000. */
  bpCode: string;
  /** 초기·임시 비밀번호로 들어왔으면 true. 강제 비밀번호 변경 화면을 띄운다. */
  isPasswordChangeRequired: boolean;
}

export class AdminLoginResponseDto {
  /** Authorization: Bearer <accessToken>. 1시간 뒤 만료된다. */
  accessToken: string;
  /** 원문은 이 응답에만 있다. 서버에는 해시만 남는다. */
  refreshToken: string;
  /** 마지막으로 쓴 때부터 1시간이 되는 시각. 갱신할 때마다 뒤로 밀린다. */
  refreshTokenExpiresAt: Date;
  admin: AdminLoginAccountDto;
}
```

- [ ] **Step 4: 서비스**

`src/auth/admin-auth.service.ts`:

```ts
import { randomUUID } from 'node:crypto';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginFailureReason } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminSessionService } from './admin-session.service';
import {
  ATTEMPT_LOCK_MS,
  AttemptState,
  CLEARED_ATTEMPT_STATE,
  isLocked,
  registerFailure,
} from './attempt-lock';
import { JwtPayload } from './auth.types';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminLoginResponseDto } from './dto/admin-login.response.dto';
import { dummyPasswordHash, verifyPassword } from './password';

export const ADMIN_ACCESS_TTL = '1h';

export const INVALID_ADMIN_LOGIN_MESSAGE = '아이디 또는 비밀번호가 올바르지 않습니다';
const INACTIVE_MESSAGE = '사용이 중지된 계정입니다. 관리자에게 문의해 주세요';
const LOCKED_MESSAGE = `로그인이 잠겼습니다. ${ATTEMPT_LOCK_MS / 60_000}분 뒤에 다시 시도하거나 비밀번호 찾기로 임시 비밀번호를 받아 주세요`;

const ACCOUNT_SELECT = {
  adminAccountId: true,
  loginId: true,
  name: true,
  email: true,
  passwordHash: true,
  roleTypeCode: true,
  accountStatusCode: true,
  isPasswordChangeRequired: true,
  failedLoginCount: true,
  lockExpiresAt: true,
  bpCode: { select: { bpCode: true } },
} as const;

/** 비밀번호가 무엇으로 맞았는지. 임시 비밀번호면 그 행 id 를 들고 간다. */
type Matched = { kind: 'password' } | { kind: 'temporary'; temporaryPasswordId: number };

type Outcome =
  | { kind: 'issued'; sessionId: number; refreshToken: string; expiresAt: Date; isPasswordChangeRequired: boolean }
  | { kind: 'locked' }
  | { kind: 'changed' };

/**
 * 관리자 웹 로그인(1팀 admin_accounts). 판정 순서는 okf/auth.md 「로그인 · 세션」:
 * 잠금 → 아이디·비밀번호(임시·초기 포함) → 계정 상태. 직원 앱 로그인(AccountAuthService)과 같은 경합 처리를 쓴다.
 */
@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: AdminSessionService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: AdminLoginDto, clientAddress?: string): Promise<AdminLoginResponseDto> {
    const found = await this.prisma.adminAccount.findFirst({
      where: { loginId: dto.loginId, isDeleted: false },
      select: ACCOUNT_SELECT,
    });
    // 탈퇴 계정은 없는 계정과 같다 — 같은 문구, 같은 검증 시간. 이력에는 탈퇴로 남긴다.
    const account = found?.accountStatusCode === 'WITHDRAWN' ? null : found;
    const log = (failureReason: LoginFailureReason, adminAccountId = account?.adminAccountId) =>
      this.sessions.recordLogin({ adminAccountId, clientAddress, isSucceeded: false, failureReason });

    // 잠겨 있으면 비밀번호를 보지 않고, 실패 횟수에도 더하지 않는다.
    if (account && isLocked(this.stateOf(account), new Date())) {
      await log('LOCKED');
      throw this.locked();
    }

    const matched = account ? await this.match(account.adminAccountId, account.passwordHash, dto.password) : null;
    if (!account) {
      // 계정이 없어도 같은 시간을 쓴다. 시간 차로 아이디가 있는지 훑지 못하게.
      await verifyPassword(dto.password, await dummyPasswordHash());
      if (found) await log('WITHDRAWN', found.adminAccountId);
      else await this.sessions.recordLogin({ clientAddress, isSucceeded: false, failureReason: 'PASSWORD_MISMATCH' });
      throw new UnauthorizedException(INVALID_ADMIN_LOGIN_MESSAGE);
    }
    if (!matched) {
      const state = await this.countFailure(account.adminAccountId);
      await log('PASSWORD_MISMATCH');
      throw isLocked(state, new Date()) ? this.locked() : new UnauthorizedException(INVALID_ADMIN_LOGIN_MESSAGE);
    }
    // 미사용은 비밀번호까지 맞을 때만 알린다.
    if (account.accountStatusCode !== 'ACTIVE') {
      await log('INACTIVE');
      throw new ForbiddenException(INACTIVE_MESSAGE);
    }

    const outcome = await this.completeSuccess(account.adminAccountId, account.passwordHash, matched, dto, clientAddress);
    if (outcome.kind === 'locked') {
      await log('LOCKED');
      throw this.locked();
    }
    // 검증하는 사이 비밀번호·상태가 바뀌었다. 실패 횟수는 더하지 않는다 — 그 순간에는 맞는 값이었다.
    if (outcome.kind === 'changed') {
      await log('PASSWORD_MISMATCH');
      throw new UnauthorizedException(INVALID_ADMIN_LOGIN_MESSAGE);
    }

    return {
      accessToken: await this.issueAccessToken(account.adminAccountId, account.email ?? '', outcome.sessionId),
      refreshToken: outcome.refreshToken,
      refreshTokenExpiresAt: outcome.expiresAt,
      admin: {
        adminAccountId: account.adminAccountId,
        loginId: account.loginId,
        name: account.name,
        roleTypeCode: account.roleTypeCode,
        bpCode: account.bpCode.bpCode,
        isPasswordChangeRequired: outcome.isPasswordChangeRequired,
      },
    };
  }

  /** 접근 토큰을 서명하고 그 해시를 접속에 남긴다. 갱신(Task 3)도 쓴다. */
  async issueAccessToken(adminAccountId: number, email: string, sessionId: number): Promise<string> {
    const claims: JwtPayload & { jti: string } = {
      sub: adminAccountId,
      type: 'admin',
      email,
      typ: 'access',
      sid: sessionId,
      // 같은 초에 두 번 서명해도 토큰이 같아지지 않게.
      jti: randomUUID(),
    };
    const token = await this.jwt.signAsync(claims, { expiresIn: ADMIN_ACCESS_TTL });
    await this.sessions.setAccessToken(sessionId, token);
    return token;
  }

  /**
   * 원래 비밀번호가 맞으면 그것으로, 아니면 살아 있는 임시 비밀번호(가장 최근 하나 — 다시 받으면 앞의 것은 무효다)로 맞춰 본다.
   */
  private async match(adminAccountId: number, passwordHash: string, password: string): Promise<Matched | null> {
    if (await verifyPassword(password, passwordHash)) return { kind: 'password' };
    const temporary = await this.prisma.temporaryPassword.findFirst({
      where: { adminAccountId, usedAt: null, invalidatedAt: null, isDeleted: false, expiresAt: { gt: new Date() } },
      orderBy: { issuedAt: 'desc' },
      select: { temporaryPasswordId: true, passwordHash: true },
    });
    if (temporary && (await verifyPassword(password, temporary.passwordHash)))
      return { kind: 'temporary', temporaryPasswordId: temporary.temporaryPasswordId };
    return null;
  }

  /**
   * 맞은 뒤의 처리. 행을 잠그고 다시 읽어, 검증하던 사이 잠김·비밀번호 변경·상태 변경이 없을 때만 쓴다(한 트랜잭션).
   * - 원래 비밀번호로 들어오면 쓰지 않은 임시 비밀번호를 무효로 한다.
   * - 임시 비밀번호로 들어오면 그 행을 사용 처리하고 강제 변경 대상으로 표시한다. 원래 비밀번호는 살려 둔다.
   */
  private completeSuccess(
    adminAccountId: number,
    verifiedHash: string,
    matched: Matched,
    dto: AdminLoginDto,
    clientAddress?: string,
  ): Promise<Outcome> {
    return this.prisma.$transaction(async (tx): Promise<Outcome> => {
      await tx.$queryRaw`SELECT 1 FROM admin_accounts WHERE admin_account_id = ${adminAccountId} FOR UPDATE`;
      const now = new Date();
      const current = await tx.adminAccount.findUniqueOrThrow({
        where: { adminAccountId },
        select: { passwordHash: true, accountStatusCode: true, isDeleted: true, failedLoginCount: true, lockExpiresAt: true, isPasswordChangeRequired: true },
      });
      if (current.isDeleted || current.accountStatusCode !== 'ACTIVE' || current.passwordHash !== verifiedHash) return { kind: 'changed' };
      if (isLocked(this.stateOf(current), now)) return { kind: 'locked' };

      if (matched.kind === 'password') {
        await tx.temporaryPassword.updateMany({
          where: { adminAccountId, usedAt: null, invalidatedAt: null },
          data: { invalidatedAt: now },
        });
      } else {
        const { count } = await tx.temporaryPassword.updateMany({
          where: { temporaryPasswordId: matched.temporaryPasswordId, usedAt: null, invalidatedAt: null, expiresAt: { gt: now } },
          data: { usedAt: now },
        });
        if (count === 0) return { kind: 'changed' };
      }
      const isPasswordChangeRequired = matched.kind === 'temporary' || current.isPasswordChangeRequired;
      await tx.adminAccount.update({
        where: { adminAccountId },
        data: {
          failedLoginCount: CLEARED_ATTEMPT_STATE.failedCount,
          lockExpiresAt: CLEARED_ATTEMPT_STATE.lockExpiresAt,
          lastLoginAt: now,
          isPasswordChangeRequired,
        },
      });
      const session = await this.sessions.issue({ adminAccountId, deviceInformation: dto.deviceInformation }, tx);
      await this.sessions.recordLogin({ adminAccountId, clientAddress, isSucceeded: true }, tx);
      return { kind: 'issued', ...session, isPasswordChangeRequired };
    });
  }

  /** 틀린 시도를 행 잠금 아래에서 센다. 동시에 들어온 시도가 같은 값을 써 5회 제한을 넘지 못하게. */
  private countFailure(adminAccountId: number): Promise<AttemptState> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM admin_accounts WHERE admin_account_id = ${adminAccountId} FOR UPDATE`;
      const now = new Date();
      const stored = await tx.adminAccount.findUniqueOrThrow({
        where: { adminAccountId },
        select: { failedLoginCount: true, lockExpiresAt: true },
      });
      const current = this.stateOf(stored);
      const next = registerFailure(current, now);
      if (next !== current)
        await tx.adminAccount.update({
          where: { adminAccountId },
          data: { failedLoginCount: next.failedCount, lockExpiresAt: next.lockExpiresAt },
        });
      return next;
    });
  }

  private stateOf(a: { failedLoginCount: number; lockExpiresAt: Date | null }): AttemptState {
    return { failedCount: a.failedLoginCount, lockExpiresAt: a.lockExpiresAt };
  }

  private locked(): HttpException {
    return new HttpException(
      { statusCode: HttpStatus.TOO_MANY_REQUESTS, message: LOCKED_MESSAGE, error: 'Too Many Requests' },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
```

(`bpCode` 는 `AdminAccount` → `BpCode` 관계 필드 이름이다 — `schema.prisma` 에서 확인함.)

- [ ] **Step 5: 요청 제한의 계정 축이 loginId 도 세게**

`src/auth/throttle.spec.ts` 에 케이스 추가:

```ts
it('계정 축은 관리자 로그인의 loginId 로도 센다(대소문자 그대로)', () => {
  expect(accountTracker({ body: { loginId: 'WhaleAdmin' } })).toBe('admin:WhaleAdmin');
});
```

Run: `pnpm test -- throttle` → FAIL.

`src/auth/throttle.ts` `accountTracker` 의 이메일 분기 바로 아래에 더한다:

```ts
  // 관리자 로그인은 아이디로 센다. 아이디는 대소문자를 구분해 저장·비교하므로 그대로 키로 쓴다.
  const loginId = (req.body as { loginId?: unknown } | undefined)?.loginId;
  if (typeof loginId === 'string' && loginId.trim())
    return `admin:${loginId.trim()}`;
```

Run: `pnpm test -- throttle` → PASS.

- [ ] **Step 6: 컨트롤러와 모듈**

`src/auth/admin-auth.controller.ts`:

```ts
import { Body, Controller, HttpCode, HttpStatus, Ip, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AdminAuthService } from './admin-auth.service';
import { Public } from './auth.decorators';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminLoginResponseDto } from './dto/admin-login.response.dto';

// 관리자 웹(whale-erp-front) 로그인. 로그인은 익명으로 갈아 넣을 수 있는 표면이라 요청 제한을 건다.
@UseGuards(ThrottlerGuard)
@Controller('auth/admin')
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: AdminLoginDto, @Ip() ip: string): Promise<AdminLoginResponseDto> {
    return this.auth.login(dto, ip);
  }
}
```

`src/auth/auth.module.ts`: `controllers` 에 `AdminAuthController`, `providers` 에 `AdminAuthService` 를 더한다(import 포함). 위 주석 「직원 근무 앱 로그인(3팀 accounts)만 있다. 관리자 웹 로그인은 … 여기에 더한다」를 「직원 근무 앱 로그인(3팀 accounts, `/auth/account`)과 관리자 웹 로그인(1팀 admin_accounts, `/auth/admin`)이 가드 · JWT · 요청 제한을 함께 쓴다」로 바꾼다.

주의: front 는 Next 서버에서 api 를 부르므로 `@Ip()` 는 Next 서버 주소가 된다. 지금은 그대로 두고, Task 5 의 okf 반영 때 「front 가 브라우저 IP 를 넘기는 방법(X-Forwarded-For + trust proxy)은 다음 작업」으로 남긴다.

- [ ] **Step 7: e2e 통과 확인**

Run: `pnpm test:e2e -- admin-auth`
Expected: PASS (5 tests). `MAIL_CONFIG` import 경로가 다르면 `src/mail/mail.config.ts` 의 실제 export 이름에 맞춘다(Task 4 전에는 MailModule 이 없어 override 가 무시되어도 통과한다).

Run: `pnpm test && pnpm lint`
Expected: PASS, lint 오류 없음

- [ ] **Step 8: 커밋**

```bash
git add src/auth/admin-auth.service.ts src/auth/admin-auth.controller.ts src/auth/dto/admin-login.dto.ts src/auth/dto/admin-login.response.dto.ts src/auth/throttle.ts src/auth/throttle.spec.ts src/auth/auth.module.ts test/admin-auth.e2e-spec.ts
git commit -m "feat(auth): 관리자 로그인 POST /auth/admin/login

잠금 → 아이디·비밀번호(임시 비밀번호 포함) → 계정 상태 순으로 판정한다. 없는 아이디·불일치·탈퇴는
같은 문구와 같은 시간으로 거부하고, 미사용은 비밀번호가 맞을 때만 알린다. 응답에 권한 유형을 실어
front 가 ERP 홈과 플랫폼 홈을 고르게 한다.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 갱신 · 로그아웃

**Files:**
- Create: `src/auth/dto/admin-refresh.response.dto.ts`
- Modify: `src/auth/admin-auth.service.ts`, `src/auth/admin-auth.controller.ts`
- Test: `test/admin-auth.e2e-spec.ts` (케이스 추가)

**Interfaces:**
- Consumes: `AdminSessionService.validate/revoke`, `AdminAuthService.issueAccessToken`, 기존 `RefreshDto`(`{ refreshToken }`)
- Produces:
  - `POST /auth/admin/refresh` 본문 `{ refreshToken }` → 200 `{ accessToken: string; refreshTokenExpiresAt: string(ISO) }`, 실패 401 `만료되었거나 종료된 접속입니다`
  - `POST /auth/admin/logout` (Bearer) → 204

- [ ] **Step 1: 실패하는 e2e 케이스 추가** (`describe` 안 끝에)

```ts
  it('갱신은 새 접근 토큰을 주고, 로그아웃하면 그 토큰도 갱신도 막힌다', async () => {
    const admin = await createAdmin();
    const { refreshToken } = body(await login(admin.loginId, PASSWORD).expect(200));

    const refreshed = await request(app.getHttpServer()).post('/auth/admin/refresh').send({ refreshToken }).expect(200);
    const accessToken = (refreshed.body as { accessToken: string }).accessToken;
    expect(accessToken).toEqual(expect.any(String));

    await request(app.getHttpServer()).post('/auth/admin/logout').set('Authorization', `Bearer ${accessToken}`).expect(204);
    await request(app.getHttpServer()).post('/auth/admin/logout').set('Authorization', `Bearer ${accessToken}`).expect(401);
    await request(app.getHttpServer()).post('/auth/admin/refresh').send({ refreshToken }).expect(401);
  });

  it('미사용으로 바뀐 계정은 갱신을 거절한다', async () => {
    const admin = await createAdmin();
    const { refreshToken } = body(await login(admin.loginId, PASSWORD).expect(200));
    await prisma.adminAccount.update({ where: { adminAccountId: admin.adminAccountId }, data: { accountStatusCode: 'INACTIVE' } });
    await request(app.getHttpServer()).post('/auth/admin/refresh').send({ refreshToken }).expect(401);
  });
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test:e2e -- admin-auth`
Expected: FAIL — `/auth/admin/refresh` 404

- [ ] **Step 3: DTO·서비스·컨트롤러**

`src/auth/dto/admin-refresh.response.dto.ts`:

```ts
export class AdminRefreshResponseDto {
  /** Authorization: Bearer <accessToken>. 1시간 뒤 만료된다. */
  accessToken: string;
  /** 갱신 토큰은 새로 주지 않는다. 쓰던 것의 새 만료 시각(지금 + 1시간)이다. */
  refreshTokenExpiresAt: Date;
}
```

`AdminAuthService` 에 메서드 추가(import `AdminRefreshResponseDto`, `ADMIN_INVALID_SESSION_MESSAGE`):

```ts
  /** 갱신 토큰은 회전하지 않는다. 쓸 때마다 만료가 지금부터 1시간으로 밀린다. 사용 중이 아닌 계정은 접속 서비스가 거절한다. */
  async refresh(refreshToken: string): Promise<AdminRefreshResponseDto> {
    const session = await this.sessions.validate(refreshToken);
    // 이메일은 바뀔 수 있는 표시값이라 지금 행에서 읽는다.
    const account = await this.prisma.adminAccount.findUnique({
      where: { adminAccountId: session.adminAccountId },
      select: { email: true },
    });
    if (!account) throw new UnauthorizedException(ADMIN_INVALID_SESSION_MESSAGE);
    return {
      accessToken: await this.issueAccessToken(session.adminAccountId, account.email ?? '', session.sessionId),
      refreshTokenExpiresAt: session.expiresAt,
    };
  }

  /** 이 기기의 접속만 종료한다. */
  logout(sessionId: number): Promise<void> {
    return this.sessions.revoke(sessionId);
  }
```

`AdminAuthController` 에 추가(import `ApiBearerAuth` from `@nestjs/swagger`, `SkipThrottle, Throttle` from `@nestjs/throttler`, `CurrentUser, UserTypes`, `type AuthUser`, `RefreshDto`, `REFRESH_IP_LIMIT`, `UnauthorizedException`, `AdminRefreshResponseDto`):

```ts
  /** 접근 토큰 재발급. 만료·종료된 접속이면 401 이고, front 는 로그인 화면으로 보낸다. */
  @Public()
  @Throttle({ ip: REFRESH_IP_LIMIT })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto): Promise<AdminRefreshResponseDto> {
    return this.auth.refresh(dto.refreshToken);
  }

  /** 이 기기의 접속을 종료한다. 다른 브라우저는 그대로다. */
  @ApiBearerAuth()
  @UserTypes('admin')
  @SkipThrottle({ ip: true })
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentUser() user: AuthUser): Promise<void> {
    // @UserTypes('admin') 가 막지만 타입은 모른다.
    if (user.type !== 'admin') throw new UnauthorizedException();
    return this.auth.logout(user.sid);
  }
```

(`AuthUser` 는 `import type` 으로 — 기존 account 컨트롤러 주석의 TS1272 이유.)

- [ ] **Step 4: 통과 확인**

Run: `pnpm test:e2e -- admin-auth && pnpm test && pnpm lint`
Expected: PASS (7 e2e tests)

- [ ] **Step 5: 커밋**

```bash
git add src/auth/dto/admin-refresh.response.dto.ts src/auth/admin-auth.service.ts src/auth/admin-auth.controller.ts test/admin-auth.e2e-spec.ts
git commit -m "feat(auth): 관리자 접속 갱신·로그아웃

갱신 토큰은 회전하지 않고 쓸 때마다 만료를 1시간 뒤로 민다. 사용 중이 아닌 계정의 갱신은 거절한다.
로그아웃은 그 기기의 접속 하나만 끊는다.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 임시 비밀번호 발급 (`POST /auth/admin/temporary-passwords`)

**Files:**
- Create: `src/auth/dto/admin-temporary-password.dto.ts`, `src/auth/admin-temporary-password.service.ts`, `src/auth/admin-temporary-password.service.spec.ts`
- Modify: `src/auth/admin-auth.controller.ts`, `src/auth/auth.module.ts`(`imports: [MailModule]`)
- Test: `test/admin-temporary-password.e2e-spec.ts`

**Interfaces:**
- Consumes: `MailService.send({ templateCode: 'EMAIL_TEMP_PASSWORD', to, variables: { 관리자이름, 임시비밀번호 }, maskedVariables: ['임시비밀번호'], adminAccountId })`, `hashPassword`
- Produces:
  - `POST /auth/admin/temporary-passwords` 본문 `{ name, loginId, email }` → 202 `{ message: '입력한 정보와 일치하는 계정이 있으면 임시 비밀번호를 메일로 보냈습니다' }` (일치 여부와 상관없이 같은 응답)
  - 429 `임시 비밀번호는 1시간에 5번까지 받을 수 있습니다`(일치하는 계정이 한도를 넘었을 때만), 503 `메일을 보내지 못했습니다. 잠시 뒤 다시 시도해 주세요`
  - `generateTemporaryPassword(): string` (12자)

- [ ] **Step 1: 실패하는 단위 테스트 — 임시 비밀번호 모양**

`src/auth/admin-temporary-password.service.spec.ts`:

```ts
import { generateTemporaryPassword } from './admin-temporary-password.service';

describe('generateTemporaryPassword', () => {
  it('12자이고 영문·숫자·특수문자를 하나 이상 담는다(비밀번호 정책)', () => {
    for (let i = 0; i < 200; i++) {
      const p = generateTemporaryPassword();
      expect(p).toHaveLength(12);
      expect(p).toMatch(/[A-Za-z]/);
      expect(p).toMatch(/[0-9]/);
      expect(p).toMatch(/[!@#$%^&*]/);
      // 헷갈리는 글자(0·O·1·l·I)를 쓰지 않는다 — 메일을 보고 손으로 옮겨 적는다.
      expect(p).not.toMatch(/[0O1lI]/);
    }
  });
});
```

Run: `pnpm test -- admin-temporary-password` → FAIL (모듈 없음)

- [ ] **Step 2: 실패하는 e2e**

`test/admin-temporary-password.e2e-spec.ts`:

```ts
import { randomBytes } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { hashPassword } from '../src/auth/password';
import { MAIL_CONFIG } from '../src/mail/mail.config';
import { MAIL_TRANSPORT } from '../src/mail/mail.service';
import { PrismaService } from '../src/prisma/prisma.service';

const PASSWORD = 'correct-horse-1!';
const SAME = '입력한 정보와 일치하는 계정이 있으면 임시 비밀번호를 메일로 보냈습니다';

describe('POST /auth/admin/temporary-passwords (e2e, DB)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const sendMail = jest.fn();
  const created: number[] = [];
  let seed: { bpCodeId: number; roleGroupId: number };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MAIL_CONFIG).useValue({ username: 'test@test.invalid', password: 'x' })
      .overrideProvider(MAIL_TRANSPORT).useValue({ sendMail })
      .compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    seed = await prisma.adminAccount.findFirstOrThrow({ where: { loginId: 'whaleadmin' }, select: { bpCodeId: true, roleGroupId: true } });
  });

  beforeEach(() => sendMail.mockReset().mockResolvedValue({ messageId: 'test' }));

  afterAll(async () => {
    const mine = { adminAccountId: { in: created } };
    await prisma.adminSession.deleteMany({ where: mine });
    await prisma.adminLoginLog.deleteMany({ where: mine });
    await prisma.temporaryPassword.deleteMany({ where: mine });
    await prisma.mailSendLog.deleteMany({ where: mine });
    await prisma.adminAccount.deleteMany({ where: mine });
    await app.close();
  });

  async function createAdmin() {
    const loginId = `e2e${randomBytes(6).toString('hex')}`;
    const admin = await prisma.adminAccount.create({
      data: {
        loginId, bpCodeId: seed.bpCodeId, roleGroupId: seed.roleGroupId, name: '테스트',
        passwordHash: await hashPassword(PASSWORD), email: `${loginId}@test.invalid`,
        roleTypeCode: 'PM', joinPathCode: 'PLATFORM_REGISTERED', accountStatusCode: 'ACTIVE',
        failedLoginCount: 5, lockExpiresAt: new Date(Date.now() + 60_000), // 잠긴 계정
      },
    });
    created.push(admin.adminAccountId);
    return admin;
  }

  const issue = (b: object) => request(app.getHttpServer()).post('/auth/admin/temporary-passwords').send(b);
  const sentPassword = () => {
    const { text } = sendMail.mock.calls.at(-1)[0] as { text: string };
    return /임시 비밀번호: (\S{12})/.exec(text)![1];
  };

  it('일치하면 메일을 보내고 잠금을 풀며, 그 임시 비밀번호로 로그인하면 강제 변경 대상이다', async () => {
    const admin = await createAdmin();
    const res = await issue({ name: '테스트', loginId: admin.loginId, email: admin.email }).expect(202);
    expect(res.body).toEqual({ message: SAME });
    expect(sendMail).toHaveBeenCalledTimes(1);

    const after = await prisma.adminAccount.findUniqueOrThrow({ where: { adminAccountId: admin.adminAccountId } });
    expect(after.lockExpiresAt).toBeNull();

    const login = await request(app.getHttpServer()).post('/auth/admin/login').send({ loginId: admin.loginId, password: sentPassword() }).expect(200);
    expect((login.body as { admin: { isPasswordChangeRequired: boolean } }).admin.isPasswordChangeRequired).toBe(true);
    // 원래 비밀번호도 살아 있다.
    await request(app.getHttpServer()).post('/auth/admin/login').send({ loginId: admin.loginId, password: PASSWORD }).expect(200);
  });

  it('일치하지 않으면 메일 없이 같은 응답', async () => {
    const admin = await createAdmin();
    const res = await issue({ name: '다른사람', loginId: admin.loginId, email: admin.email }).expect(202);
    expect(res.body).toEqual({ message: SAME });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('다시 받으면 앞의 임시 비밀번호는 무효다', async () => {
    const admin = await createAdmin();
    await issue({ name: '테스트', loginId: admin.loginId, email: admin.email }).expect(202);
    const first = sentPassword();
    await issue({ name: '테스트', loginId: admin.loginId, email: admin.email }).expect(202);
    await request(app.getHttpServer()).post('/auth/admin/login').send({ loginId: admin.loginId, password: first }).expect(401);
  });

  it('메일이 실패하면 503 이고 임시 비밀번호를 남기지 않는다', async () => {
    const admin = await createAdmin();
    sendMail.mockRejectedValue(new Error('smtp down'));
    await issue({ name: '테스트', loginId: admin.loginId, email: admin.email }).expect(503);
    expect(await prisma.temporaryPassword.count({ where: { adminAccountId: admin.adminAccountId } })).toBe(0);
  });
});
```

(요청 제한: 계정 축이 본문 `email` 로 센다 — 계정마다 이메일이 달라 10/10분에 걸리지 않는다. 메일 본문 정규식은 `EMAIL_TEMP_PASSWORD` 템플릿의 「임시 비밀번호: #{임시비밀번호}」 줄을 따른다.)

Run: `pnpm test:e2e -- admin-temporary-password` → FAIL (404)

- [ ] **Step 3: DTO**

`src/auth/dto/admin-temporary-password.dto.ts`:

```ts
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AdminTemporaryPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  loginId: string;

  /** 저장값은 소문자다(admin_accounts_email_lower). */
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email: string;
}
```

- [ ] **Step 4: 서비스**

`src/auth/admin-temporary-password.service.ts`:

```ts
import { randomInt } from 'node:crypto';
import { HttpException, HttpStatus, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { CLEARED_ATTEMPT_STATE } from './attempt-lock';
import { AdminTemporaryPasswordDto } from './dto/admin-temporary-password.dto';
import { hashPassword } from './password';

const VALID_MS = 60 * 60 * 1000;
const MAX_PER_HOUR = 5;
export const TEMPORARY_PASSWORD_SENT_MESSAGE = '입력한 정보와 일치하는 계정이 있으면 임시 비밀번호를 메일로 보냈습니다';

// 헷갈리는 글자(0·O·1·l·I)를 뺐다. 메일을 보고 손으로 옮겨 적는다.
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%^&*';

/** 12자. 비밀번호 정책(영문·숫자·특수문자 각 1자 이상)을 채운다. */
export function generateTemporaryPassword(): string {
  const pick = (s: string) => s[randomInt(s.length)];
  const all = LETTERS + DIGITS + SYMBOLS;
  const chars = [pick(LETTERS), pick(DIGITS), pick(SYMBOLS), ...Array.from({ length: 9 }, () => pick(all))];
  // 정해 둔 앞 세 자리 순서가 드러나지 않게 섞는다(Fisher–Yates).
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/**
 * 비밀번호 찾기의 임시 비밀번호(okf/auth.md 「계정 찾기」). 이름·아이디·이메일이 모두 맞는 사용 중 계정에만 보낸다.
 * 메일을 먼저 보내고, 보내진 뒤에만 저장한다 — 메일이 나가지 않으면 임시 비밀번호도 활성화하지 않는다.
 */
@Injectable()
export class AdminTemporaryPasswordService {
  private readonly logger = new Logger(AdminTemporaryPasswordService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async issue(dto: AdminTemporaryPasswordDto): Promise<{ message: string }> {
    const sent = { message: TEMPORARY_PASSWORD_SENT_MESSAGE };
    const account = await this.prisma.adminAccount.findFirst({
      where: { loginId: dto.loginId, name: dto.name, email: dto.email, accountStatusCode: 'ACTIVE', isDeleted: false },
      select: { adminAccountId: true, name: true, email: true },
    });
    // 계정이 있는지 드러내지 않는다.
    if (!account?.email) return sent;

    const since = new Date(Date.now() - VALID_MS);
    const issuedLastHour = await this.prisma.temporaryPassword.count({
      where: { adminAccountId: account.adminAccountId, purpose: 'TEMPORARY', issuedAt: { gte: since } },
    });
    // 한도는 맞는 정보를 넣은 사람에게만 알린다. 이름·아이디·이메일을 모두 아는 사람에게는 계정 존재가 이미 드러나 있다.
    if (issuedLastHour >= MAX_PER_HOUR)
      throw new HttpException(
        { statusCode: HttpStatus.TOO_MANY_REQUESTS, message: `임시 비밀번호는 1시간에 ${MAX_PER_HOUR}번까지 받을 수 있습니다`, error: 'Too Many Requests' },
        HttpStatus.TOO_MANY_REQUESTS,
      );

    const password = generateTemporaryPassword();
    const passwordHash = await hashPassword(password);
    try {
      await this.mail.send({
        templateCode: 'EMAIL_TEMP_PASSWORD',
        to: account.email,
        variables: { 관리자이름: account.name ?? dto.loginId, 임시비밀번호: password },
        maskedVariables: ['임시비밀번호'],
        adminAccountId: account.adminAccountId,
      });
    } catch (e) {
      this.logger.warn(`임시 비밀번호 메일 실패 admin=${account.adminAccountId}: ${(e as Error).message}`);
      throw new ServiceUnavailableException('메일을 보내지 못했습니다. 잠시 뒤 다시 시도해 주세요');
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM admin_accounts WHERE admin_account_id = ${account.adminAccountId} FOR UPDATE`;
      // 다시 받으면 앞의 것은 바로 만료다.
      await tx.temporaryPassword.updateMany({
        where: { adminAccountId: account.adminAccountId, usedAt: null, invalidatedAt: null },
        data: { invalidatedAt: now },
      });
      await tx.temporaryPassword.create({
        data: { adminAccountId: account.adminAccountId, passwordHash, issuedAt: now, expiresAt: new Date(now.getTime() + VALID_MS), purpose: 'TEMPORARY' },
      });
      // 잠긴 계정도 받을 수 있고, 받으면 잠금이 풀린다.
      await tx.adminAccount.update({
        where: { adminAccountId: account.adminAccountId },
        data: { failedLoginCount: CLEARED_ATTEMPT_STATE.failedCount, lockExpiresAt: CLEARED_ATTEMPT_STATE.lockExpiresAt },
      });
    });
    return sent;
  }
}
```

- [ ] **Step 5: 컨트롤러·모듈**

`AdminAuthController` 생성자에 `private readonly temporaryPasswords: AdminTemporaryPasswordService` 를 더하고 추가:

```ts
  /** 비밀번호 찾기. 일치 여부와 상관없이 같은 202 로 답한다. */
  @Public()
  @Post('temporary-passwords')
  @HttpCode(HttpStatus.ACCEPTED)
  issueTemporaryPassword(@Body() dto: AdminTemporaryPasswordDto): Promise<{ message: string }> {
    return this.temporaryPasswords.issue(dto);
  }
```

`src/auth/auth.module.ts`: `imports` 에 `MailModule`(from `'../mail/mail.module'`), `providers` 에 `AdminTemporaryPasswordService`.

주의 — 이 import 로 api 기동에 `MAIL_USERNAME`·`MAIL_PASSWORD` 가 필수가 된다(`mail.module.ts` 주석). 기존 e2e 파일들(`test/*.e2e-spec.ts`)이 `AppModule` 을 그대로 띄우므로, 로컬·CI 의 테스트 환경에 두 값이 없으면 전부 기동 실패한다. Step 6 에서 확인한다.

- [ ] **Step 6: 통과 확인 + 기존 e2e 영향 확인**

Run: `pnpm test -- admin-temporary-password && pnpm test:e2e -- admin-temporary-password`
Expected: PASS (unit 1, e2e 4)

Run: `pnpm test:e2e 2>&1 | tail -15`
Expected: 전부 PASS. 기존 e2e 가 「MAIL_USERNAME 이 필요합니다」류로 실패하면 `.env.local`(로컬)·`.env.example` 에 값이 있는지 확인하고, 없으면 **멈추고 사용자에게 알린다**(Gmail 앱 비밀번호를 넣을지, 테스트 전용 더미 값을 둘지 사용자가 정한다).

Run: `pnpm lint`

- [ ] **Step 7: 커밋**

```bash
git add src/auth/dto/admin-temporary-password.dto.ts src/auth/admin-temporary-password.service.ts src/auth/admin-temporary-password.service.spec.ts src/auth/admin-auth.controller.ts src/auth/auth.module.ts test/admin-temporary-password.e2e-spec.ts
git commit -m "feat(auth): 관리자 임시 비밀번호 발급 POST /auth/admin/temporary-passwords

이름·아이디·이메일이 맞는 사용 중 계정에 12자 임시 비밀번호를 메일로 보낸다. 1시간 유효, 계정당
1시간 5회, 다시 받으면 앞의 것은 무효, 발급하면 잠금이 풀린다. 메일을 보낸 뒤에만 저장한다.
AuthModule 이 MailModule 을 들여 기동에 MAIL_* 가 필요해진다.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: OpenAPI · okf 반영

**Files:**
- Modify: `openapi/openapi.json` (생성), `okf/api/auth.md`, `okf/log.md`, 이 작업이 고친 `src/auth/*` 를 `sources` 에 둔 다른 concept

- [ ] **Step 1: OpenAPI 갱신**

Run: `pnpm openapi:export && git diff --stat openapi/openapi.json`
Expected: `/auth/admin/login`·`/refresh`·`/logout`·`/temporary-passwords` 경로가 더해진 diff

- [ ] **Step 2: okf 대상 찾기**

Run: `grep -rln "src/auth/\(jwt-auth.guard\|auth.types\|auth.module\|throttle\)" okf`
→ 나온 concept 마다 본문에서 바뀐 사실(관리자 로그인 4개 경로, admin 세션 확인, 접근 1시간·갱신 마지막 사용 후 1시간·회전 안 함, 계정 축 loginId, MailModule 로 MAIL_* 필수)을 고치고 `generated.at` 을 지금 UTC 로 바꾼다.

`okf/api/auth.md` 의 「관리자 로그인은 1팀 담당이고 아직 결정된 것이 없다」 부분을 위 사실로 바꾸고 「갱신 토큰 회전 여부는 1팀이 정한다」를 「회전하지 않는다(2026-10-12 1팀). 토큰은 front Next 서버의 httpOnly 쿠키에만 있고 수명이 마지막 사용 후 1시간이다」로 바꾼다. 남은 일로 「front 가 브라우저 IP 를 넘기는 방법(X-Forwarded-For + trust proxy)」「강제 비밀번호 변경 API」를 적는다.

- [ ] **Step 3: log 한 줄**

`okf/log.md` 맨 위(기존 형식 따라)에:

```
- 2026-10-12 관리자 로그인 API(/auth/admin login·refresh·logout·temporary-passwords)와 admin 세션 확인 반영 — okf/api/auth.md
```

- [ ] **Step 4: 커밋**

```bash
git add openapi/openapi.json okf/api/auth.md okf/log.md   # Step 2 에서 고친 concept 도 하나씩 add
git commit -m "docs: 관리자 로그인 API를 OpenAPI와 okf에 반영

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: 사용자 확인용 안내 준비**

사용자가 직접 할 시험(구현자는 하지 않는다):
1. api `.env.local` 에 `MAIL_USERNAME`·`MAIL_PASSWORD`(Gmail 앱 비밀번호) 확인 후 `pnpm start:dev`
2. `http://localhost:8000/docs` → `POST /auth/admin/temporary-passwords` 에 `{ "name": "플랫폼 관리자", "loginId": "whaleadmin", "email": "rjy1537@interplug.co.kr" }`
3. 메일의 임시 비밀번호로 front `/login` 로그인
