"use client";

import { AlarmLink, GlobalHeader, ServiceLinks, StoreSelect, UserPop, type HeaderMenu, type UserPopItem } from "@/components/common";
import { logout } from "@/app/actions";
import { roleLabel } from "@/lib/auth-routes";
import type { Scope } from "@/lib/browser-storage";
import type { AdminStore } from "@/lib/session";
import { useAccount, useCurrentBp, useMenus, useScope, useStores } from "./session-gate";

// ERP·플랫폼 헤더. 메뉴·점포·이름은 로그인 정보(SessionGate)에서 그린다.
// 메뉴는 2단계까지만 그린다(3단계는 헤더에 보이지 않는다, 2026-10-13).
// 플랫폼 화면의 BP 선택기는 BP 목록 API 가 없어 아직 두지 않는다.
export function AdminHeader({ area }: { area: "erp" | "platform" }) {
  const account = useAccount();
  const menus: HeaderMenu[] = useMenus().map((m) => ({
    label: m.name,
    items: m.children.map((c) => ({ label: c.name, href: c.url ?? "#" })),
  }));
  // 내정보·비밀번호·회원 탈퇴는 슬라이드 패널 작업 전이라 아직 아무 데도 가지 않는다.
  const mine: UserPopItem[] = [
    { label: "내정보 관리", href: "#" },
    { label: "비밀번호 변경", href: "#" },
  ];
  const userItems: UserPopItem[] =
    area === "erp"
      ? [...mine, { label: "회원 탈퇴", href: "#" }, { label: "로그아웃", action: logout, danger: true }]
      : [...mine, { label: "로그아웃", action: logout, danger: true }];

  return (
    <GlobalHeader
      menus={menus}
      right={
        <>
          {area === "erp" ? <ScopeSelect /> : <div className="flex-1" />}
          <ServiceLinks hrefs={{ erp: "/home", platform: "/platform" }} />
          <AlarmLink href="#" />
          <UserPop name={`${account.name ?? account.loginId} (${roleLabel(account.roleTypeCode)})`} items={userItems} />
        </>
      }
    />
  );
}

// 범위 선택기 — 전체 · 직영 · 가맹 · 점포 하나 중 하나(okf/home.md). 점포가 없는 유형은 고를 것이 없어 뺀다.
function ScopeSelect() {
  const account = useAccount();
  const bp = useCurrentBp();
  const [scope, setScope] = useScope();
  // 플랫폼 계정이 고른 BP 의 탭이면 BP 이름을 앞에 붙여, 어느 BP 의 데이터인지 늘 보이게 한다.
  const prefix = bp.bpCodeId === account.bp.bpCodeId ? "" : `${bp.tradeName} · `;
  const options = scopeOptions(useStores()).map((o) => ({ ...o, label: prefix + o.label }));
  const value = options.find((o) => JSON.stringify(o.scope) === JSON.stringify(scope))?.label ?? options[0]?.label ?? "";
  return (
    <StoreSelect
      options={options.map((o) => o.label)}
      value={value}
      onChange={(label) => {
        const next = options.find((o) => o.label === label);
        if (next) setScope(next.scope);
      }}
    />
  );
}

function scopeOptions(stores: AdminStore[]): { label: string; scope: Scope }[] {
  if (stores.length === 0) return [];
  const direct = stores.filter((s) => s.storeTypeCode === "DIRECT").length;
  const franchise = stores.filter((s) => s.storeTypeCode === "FRANCHISE").length;
  return [
    { label: `전체 ${stores.length}개점`, scope: { type: "ALL" } },
    ...(direct ? [{ label: `직영점포 전체 ${direct}개점`, scope: { type: "DIRECT" } as const }] : []),
    ...(franchise ? [{ label: `가맹점포 전체 ${franchise}개점`, scope: { type: "FRANCHISE" } as const }] : []),
    ...stores.map((s) => ({ label: s.name, scope: { type: "STORE", storeId: s.storeId } as const })),
  ];
}
