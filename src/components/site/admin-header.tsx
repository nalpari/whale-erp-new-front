"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useEffectEvent, useState, type ReactNode } from "react";
import { GlobalHeader, ScopeSelect, ServiceLinks, useBackdropActive, UserPop, type HeaderMenu, type ScopeSelectSection, type UserPopItem } from "@/components/common";
import { logout } from "@/app/actions";
import { bpPath, isBpPathScreen } from "@/lib/bp-path";
import type { ServiceCode } from "@/lib/browser-storage";
import { findMenu, HOME, PENDING_PLATFORM_MENU } from "@/lib/menus";
import type { AccountBp, AdminStore } from "@/lib/session";
import { isClosedStore, openStores, SCOPE_PARAM, scopeFromAddress, scopeKeyOf, scopeOfKey, withScope } from "@/lib/store-scope";
import { BpSelectDialog } from "./bp-select-dialog";
import { useAccount, useCurrentBp, useMenus, useMyPageOpen, useMyPageTrigger, usePageMenu, useScope, useService, useStores } from "./session-gate";

// 로그인 후 화면의 헤더 하나. 메뉴·점포·이름은 로그인 정보(SessionGate)에서 그린다.
// 메뉴는 이 탭 서비스(useService)의 것만, 2단계까지 그린다(3단계는 헤더에 보이지 않는다, 2026-10-13).
// 서비스마다 다른 것은 오른쪽 선택기와 서비스 바로가기의 동작이다 — 선택기는 ERP 면 점포 범위, 플랫폼이면 BP 선택기 자리(비어 있다. BP 는
// 서비스 바로가기의 웨일ERP 로 고른다). 바로가기는 serviceTargets 참고.
// 메뉴 링크는 점포 범위를 주소(?scope=)에 싣는다(store-scope.ts) — 점포 검색 필터가 있는 목록은 처음부터 그 범위로 검색하고, 없는 목록은 무시한다.
// alarm 은 알림 종(NotificationBellSlot, 서버 컴포넌트)이다. 클라이언트인 이 헤더가 직접 그릴 수 없어 루트 layout 이 만들어 AdminLayout → AdminFrame 을 거쳐 넘긴다.
export function AdminHeader({ alarm }: { alarm: ReactNode }) {
  const account = useAccount();
  const service = useService();
  const all = useMenus();
  const backdropActive = useBackdropActive();
  const [bpSelectOpen, setBpSelectOpen] = useState(false);
  const [, setMyPageOpen] = useMyPageOpen();
  const myPageTrigger = useMyPageTrigger();
  const tabBp = useCurrentBp().bpCodeId;
  const [scope] = useScope();
  // /bp/{id} 주소로 옮긴 ERP 화면에만 탭 BP 를 붙인다(BP_PATH_SCREENS). 메뉴 url 자체는 옛 경로 그대로다.
  const linkOf = (url: string) => (service === "WHALE_ERP" && isBpPathScreen(url) ? bpPath(tabBp, url) : withScope(url, scope));
  const menus: HeaderMenu[] = all.map((m) => {
      const items = m.children.flatMap((c) => {
        // 하위 메뉴로 가는 길로만 들어온 메뉴는 조회 권한이 없다(isAllowed 가 막는다). 권한 있는 첫 하위 메뉴로 보내고, 없으면 뺀다.
        const href = c.permission.read && c.url ? c.url : findMenu(c.children, (x) => x.permission.read && !!x.url)?.url;
        if (!href) return [];
        const item = { label: c.name, href: linkOf(href) };
        const pending = PENDING_PLATFORM_MENU;
        const missing = service === "PLATFORM" && c.url === pending.after && !findMenu(all, (x) => x.url === pending.url);
        return missing ? [item, { label: pending.name, href: pending.url }] : [item];
      });
      return { label: m.name, items, href: items.length === 0 && m.permission.read && m.url ? linkOf(m.url) : undefined };
    });
  // 비밀번호 변경·회원 탈퇴는 슬라이드 패널 작업 전이라 아직 아무 데도 가지 않는다(S-PTWREE·S-JHQQNR).
  const mine: UserPopItem[] = [
    { label: "내정보 관리", onSelect: () => setMyPageOpen(true) },
    { label: "비밀번호 변경", href: "#" },
  ];
  const userItems: UserPopItem[] =
    service === "WHALE_ERP"
      ? [...mine, { label: "회원 탈퇴", href: "#" }, { label: "로그아웃", action: logout, danger: true }]
      : [...mine, { label: "로그아웃", action: logout, danger: true }];

  return (
    <GlobalHeader
      menus={menus}
      inert={backdropActive}
      logoHref={HOME[service]}
      right={
        <>
          {service === "WHALE_ERP" ? <HeaderScopeSelect /> : <div className="flex-1" />}
          <ServiceLinks targets={serviceTargets(account.bp, service, () => setBpSelectOpen(true))} />
          {alarm}
          <UserPop name={account.name ?? account.loginId} items={userItems} triggerRef={myPageTrigger} />
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
// 플랫폼관리 아이콘은 플랫폼 계정에게만 보인다 — BP·가맹 계정은 애초에 그 화면에 들어갈 권한이 없어
// platform 자리를 비워 ServiceLinks 가 아이콘을 그리지 않게 한다(사용자 지적, 2026-10-21).
function serviceTargets(bp: AccountBp, service: ServiceCode, openBpSelect: () => void) {
  if (!bp.isPlatform) return { erp: "/home" };
  const openPlatform = () => window.open(HOME.PLATFORM, "_blank", "noopener");
  return { erp: openBpSelect, platform: service === "PLATFORM" ? HOME.PLATFORM : openPlatform };
}

// 범위 선택기 — 전체 · 직영 · 가맹 · 점포 하나 중 하나(okf/home.md). 모양은 데모 scopeDropdown(칸은 「BP 이름 · 고른 값」, 목록은 BP 묶음 · 직영 · 가맹 묶음 + 검색).
// 폐점이 아닌 점포가 없는 유형은 「직영 · 가맹 전체」 항목을 뺀다(폐점 점포만 있으면 그 유형 묶음은 남고 회색 점포만 보인다).
// 폐점 점포는 그 유형 묶음 끝에 회색으로 보이고 하나씩 고를 수 있지만, 개수와 직영 · 가맹 전체에는 넣지 않는다.
// 바꾸면 지금 화면 메뉴(목록 · 상세 · 등록 · 수정)의 목록으로 늘 간다(2026-10-21 정책). 범위는 주소(?scope=)에 실어, 점포 검색 필터가
// 있는 목록은 그 범위로 바로 검색하고 없는 목록은 기본 조건으로 연다. 다른 검색 조건과 목록에서 고른 점포는 초기값이다.
// 어느 메뉴에 점포 검색 필터가 있는지 헤더는 모른다 — 메뉴 주소 · 코드를 적어 두지 않는다. 메뉴가 아닌 화면(홈 등)은 범위만 바꾼다.
function HeaderScopeSelect() {
  const bp = useCurrentBp();
  const router = useRouter();
  const pageMenu = usePageMenu();
  const stores = useStores();
  const [scope, setScope] = useScope();
  const pageUrl = pageMenu?.url ?? null;
  // 칸 앞의 BP 이름이 어느 BP 의 데이터인지 늘 보인다(플랫폼 계정이 고른 BP 의 탭도)
  return (
    <>
      {/* 주소의 범위를 읽는다 — useSearchParams 는 운영 빌드에서 Suspense 로 감싸야 한다 */}
      <Suspense fallback={null}>
        <ScopeFromAddress />
      </Suspense>
      <ScopeSelect
        title={bp.tradeName}
        sections={scopeSections(bp.tradeName, stores)}
        value={scopeKeyOf(scope)}
        onChange={(key) => {
          const next = scopeOfKey(key);
          if (!next) return;
          setScope(next);
          if (pageUrl) router.push(withScope(pageUrl, next));
        }}
      />
    </>
  );
}

/**
 * 주소에 범위(?scope=)가 있으면 이 탭의 헤더 범위를 그 값으로 맞춘다 — 다른 탭에서 복사한 주소를 열거나 뒤로 가기로 앞 범위의 주소에 오면
 * 목록은 주소의 범위로 검색하는데 헤더는 다른 범위를 보이면 헷갈린다. 이 탭의 점포에 없는 범위(지운 점포 · 폐점만 남은 유형)는 따르지 않는다.
 * scope 는 헤더 범위만 뜻한다 — 목록에서 비운 「전체」는 빈 storeIds 로 적는다(store-scope.ts).
 */
function ScopeFromAddress() {
  const param = useSearchParams().get(SCOPE_PARAM) ?? undefined;
  const stores = useStores();
  const [scope, setScope] = useScope();
  const follow = useEffectEvent(() => {
    const wanted = scopeFromAddress(param, scope, stores);
    if (wanted) setScope(wanted);
  });
  useEffect(() => follow(), [param]);
  return null;
}

/**
 * BP 묶음(전체 · 직영 · 가맹) + 직영 · 가맹 점포 묶음. 점포는 보조 줄에 점포코드를 둬 같은 이름도 가른다.
 * 개수는 폐점이 아닌 점포만 센다. 폐점 점포는 묶음 끝에 회색 이름 · 보조 줄 「폐점」으로 둔다(색만으로 상태를 말하지 않는다 — DESIGN.md).
 */
function scopeSections(bpName: string, stores: AdminStore[]): ScopeSelectSection[] {
  if (stores.length === 0) return [];
  const open = openStores(stores);
  const ofType = (type: string) => stores.filter((s) => s.storeTypeCode === type);
  const direct = ofType("DIRECT");
  const franchise = ofType("FRANCHISE");
  const openCount = (list: AdminStore[]) => list.filter((s) => !isClosedStore(s)).length;
  const storeOptions = (list: AdminStore[]) =>
    [...list.filter((s) => !isClosedStore(s)), ...list.filter(isClosedStore)].map((s) => ({
      key: `STORE:${s.storeId}`,
      label: s.name,
      meta: isClosedStore(s) ? `${s.storeCode} · 폐점` : s.storeCode,
      muted: isClosedStore(s),
    }));
  const dirOpen = openCount(direct);
  const frOpen = openCount(franchise);
  return [
    {
      title: bpName,
      options: [
        { key: "ALL", label: `전체 ${open.length}개점`, meta: `직영 ${dirOpen} · 가맹 ${frOpen}` },
        ...(dirOpen ? [{ key: "DIRECT", label: `직영 ${dirOpen}개점`, meta: "직영점포 전체" }] : []),
        ...(frOpen ? [{ key: "FRANCHISE", label: `가맹 ${frOpen}개점`, meta: "가맹점포 전체" }] : []),
      ],
    },
    ...(direct.length ? [{ title: `직영 ${dirOpen}`, options: storeOptions(direct) }] : []),
    ...(franchise.length ? [{ title: `가맹 ${frOpen}`, options: storeOptions(franchise) }] : []),
  ];
}

