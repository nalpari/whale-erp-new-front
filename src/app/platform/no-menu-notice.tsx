"use client";

import { Button, ReadonlyCard, ReadonlyValue } from "@/components/common";
import { logout } from "@/app/actions";
import { useCodeLabel } from "@/components/site/code-label";
import { useAccount, useMenus, useMyPageOpen } from "@/components/site/session-gate";
import { firstMenuUrl } from "@/lib/menus";

// 접근할 플랫폼 메뉴가 하나도 없는 플랫폼 계정의 권한 요청 안내(S-XJDKSI — 메뉴 없는 계정도 로그인되고 안내와 마이페이지만 보인다).
// 메뉴가 있는데 여기 있으면 비밀번호 강제 변경 팝업이 떠 있는 동안이다 — 안내를 그리지 않는다(SessionGate 가 바꾼 뒤 첫 메뉴로 보낸다).
// 관리자에게 권한을 요청할 때 계정을 알려 줄 수 있게 아이디 · 권한 유형을 함께 보인다.
export function NoMenuNotice() {
  const account = useAccount();
  const hasMenu = firstMenuUrl(useMenus(), "PLATFORM") !== null;
  const [, setMyPageOpen] = useMyPageOpen();
  const roleTypeLabel = useCodeLabel("ROLE_TYPE");
  if (hasMenu) return null;
  return (
    <section aria-labelledby="no-menu-title" className="flex w-[420px] flex-col items-center gap-[24px] text-center">
      <span className="flex size-[64px] items-center justify-center rounded-[4px] border border-erp-panel-line bg-erp-thead-bg text-erp-brand" aria-hidden>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="10.5" width="16" height="10" rx="2" />
          <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
          <path d="M12 14.5v2.5" />
        </svg>
      </span>
      <div className="flex flex-col gap-[10px]">
        <h2 id="no-menu-title" className="text-[18px] font-semibold text-erp-ink">
          접근할 수 있는 메뉴가 없습니다.
        </h2>
        {/* 한 줄로 둔다(사용자 지정, 2026-10-28) — 계정 정보 상자 폭(420px)보다 넓어 가운데로 양쪽에 넘친다. */}
        <p className="text-[14px] leading-[1.6] whitespace-nowrap text-erp-label">
          이 계정에는 아직 플랫폼관리 메뉴 권한이 없습니다. 아래 계정 정보로 관리자에게 권한을 요청해 주세요.
        </p>
      </div>
      <div className="w-full text-left">
        <ReadonlyCard title="계정 정보">
          <div className="flex gap-[18px]">
            <ReadonlyValue label="아이디" value={account.loginId} bold />
            <ReadonlyValue label="사용자 권한" value={roleTypeLabel(account.roleTypeCode)} />
          </div>
        </ReadonlyCard>
      </div>
      <div className="flex gap-[6px]">
        <Button variant="soft" onClick={() => setMyPageOpen(true)}>
          내정보 관리
        </Button>
        <form action={logout}>
          <Button type="submit" variant="off">
            로그아웃
          </Button>
        </form>
      </div>
    </section>
  );
}
