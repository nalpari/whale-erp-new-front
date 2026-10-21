"use client";

import { useState, type ReactNode } from "react";
import { GlobalHeader, ServiceLinks, StoreSelect, UserPop, type HeaderMenu, type UserPopItem } from "@/components/common";
import { logout } from "@/app/actions";
import type { Scope, ServiceCode } from "@/lib/browser-storage";
import { bpPath, isBpPathScreen } from "@/lib/bp-path";
import { findMenu, HOME, PENDING_PLATFORM_MENU } from "@/lib/menus";
import type { AccountBp, AdminStore } from "@/lib/session";
import { BpSelectDialog } from "./bp-select-dialog";
import { useAccount, useCodes, useCurrentBp, useMenus, useScope, useService, useStores } from "./session-gate";

// 로그인 후 화면의 헤더 하나. 메뉴·점포·이름은 로그인 정보(SessionGate)에서 그린다.
// 메뉴는 이 탭 서비스(useService)의 것만, 2단계까지 그린다(3단계는 헤더에 보이지 않는다, 2026-10-13).
// 서비스마다 다른 것은 오른쪽 선택기와 서비스 바로가기의 동작이다 — 선택기는 ERP 면 점포 범위, 플랫폼이면 BP 선택기 자리(비어 있다. BP 는
// 서비스 바로가기의 웨일ERP 로 고른다). 바로가기는 serviceTargets 참고.
// alarm 은 알림 종(NotificationBellSlot, 서버 컴포넌트)이다. 클라이언트인 이 헤더가 직접 그릴 수 없어 루트 layout 이 만들어 AdminLayout → AdminFrame 을 거쳐 넘긴다.
export function AdminHeader({ alarm }: { alarm: ReactNode }) {
  const account = useAccount();
  const service = useService();
  const all = useMenus();
  const [bpSelectOpen, setBpSelectOpen] = useState(false);
  const role = useCodes("ROLE_TYPE").find((c) => c.value === account.roleTypeCode)?.label ?? account.roleTypeCode;
  const tabBp = useCurrentBp().bpCodeId;
  // /bp/{id} 주소로 옮긴 ERP 화면에만 탭 BP 를 붙인다(BP_PATH_SCREENS). 메뉴 url 자체는 옛 경로 그대로다.
  const linkOf = (url: string) => (service === "WHALE_ERP" && isBpPathScreen(url) ? bpPath(tabBp, url) : url);
  const menus: HeaderMenu[] = all.map((m) => {
      const items = m.children.flatMap((c) => {
        // 하위 메뉴로 가는 길로만 들어온 메뉴는 조회 권한이 없다(isAllowed 가 막는다). 권한 있는 첫 하위 메뉴로 보내고, 없으면 뺀다.
        const url = c.permission.read && c.url ? c.url : findMenu(c.children, (x) => x.permission.read && !!x.url)?.url;
        if (!url) return [];
        const item = { label: c.name, href: linkOf(url) };
        const pending = PENDING_PLATFORM_MENU;
        const missing = service === "PLATFORM" && c.url === pending.after && !findMenu(all, (x) => x.url === pending.url);
        return missing ? [item, { label: pending.name, href: pending.url }] : [item];
      });
      return { label: m.name, items, href: items.length === 0 && m.permission.read && m.url ? linkOf(m.url) : undefined };
    });
  // 내정보·비밀번호·회원 탈퇴는 슬라이드 패널 작업 전이라 아직 아무 데도 가지 않는다.
  const mine: UserPopItem[] = [
    { label: "내정보 관리", href: "#" },
    { label: "비밀번호 변경", href: "#" },
  ];
  const userItems: UserPopItem[] =
    service === "WHALE_ERP"
      ? [...mine, { label: "회원 탈퇴", href: "#" }, { label: "로그아웃", action: logout, danger: true }]
      : [...mine, { label: "로그아웃", action: logout, danger: true }];

  return (
    <GlobalHeader
      menus={menus}
      right={
        <>
          {service === "WHALE_ERP" ? <ScopeSelect /> : <div className="flex-1" />}
          <ServiceLinks targets={serviceTargets(account.bp, service, () => setBpSelectOpen(true))} />
          {alarm}
          <UserPop name={`${account.name ?? account.loginId} (${role})`} items={userItems} />
          {bpSelectOpen && <BpSelectDialog onClose={() => setBpSelectOpen(false)} />}
        </>
      }
    />
  );
}

// 서비스 바로가기. BP · 가맹 계정은 늘 자기 BP 의 웨일ERP 다.
// 플랫폼 계정의 웨일ERP 는 BP 선택 팝업이다 — ERP 탭에서 눌러도 다시 열어 다른 BP 를 고르게 한다(고른 BP 는 새 탭).
// 플랫폼관리는 ERP 탭이면 그 탭은 두고 플랫폼을 새 탭으로 연다 — 웨일ERP 가 고른 BP 를 새 탭으로 여는 것과 같다.
// 같은 탭을 플랫폼으로 바꾸면 앞서 본 ERP 화면이 뒤로 가기 기록에 남아, 뒤로 갈 때마다 「접근 권한이 없는 메뉴」로 막힌다.
// noopener — 새 탭이 이 탭의 sessionStorage(ERP · 고른 BP)를 물려받지 않아, 주소(/platform)대로 자기 BP 의 플랫폼으로 열린다.
function serviceTargets(bp: AccountBp, service: ServiceCode, openBpSelect: () => void) {
  if (!bp.isPlatform) return { erp: "/home", platform: HOME.PLATFORM };
  const openPlatform = () => window.open(HOME.PLATFORM, "_blank", "noopener");
  return { erp: openBpSelect, platform: service === "PLATFORM" ? HOME.PLATFORM : openPlatform };
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
    // 선택기는 문구로 항목을 가른다. 같은 이름의 점포는 점포코드를 붙여 서로 다른 항목이 되게 한다.
    ...stores.map((s) => ({
      label: stores.filter((t) => t.name === s.name).length > 1 ? `${s.name} (${s.storeCode})` : s.name,
      scope: { type: "STORE", storeId: s.storeId } as const,
    })),
  ];
}

