"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, type ReactNode } from "react";
import { GlobalHeader, ScopeSelect, ServiceLinks, UserPop, type HeaderMenu, type ScopeSelectSection, type UserPopItem } from "@/components/common";
import { logout } from "@/app/actions";
import { findMenu, PENDING_PLATFORM_MENU } from "@/lib/menus";
import type { AdminStore } from "@/lib/session";
import { isClosedStore, openStores, pickedListHref, scopedListHref, scopeKeyOf, scopeOfKey, usesStoreScope } from "@/lib/store-scope";
import { useAccount, useCurrentBp, useMenus, usePageMenu, useScope, useService, useStorePicks, useStores } from "./session-gate";

// 로그인 후 화면의 헤더 하나. 메뉴·점포·이름은 로그인 정보(SessionGate)에서 그린다.
// 메뉴는 이 탭 서비스(useService)의 것만, 2단계까지 그린다(3단계는 헤더에 보이지 않는다, 2026-10-13).
// 서비스마다 다른 것은 오른쪽 선택기뿐이다 — ERP 는 점포 범위 선택기, 플랫폼은 BP 선택기(BP 목록 API 가 없어 아직 두지 않는다).
// 점포 검색 컴포넌트를 쓰는 목록 메뉴(store-scope.ts)의 링크는 점포 범위를 싣는다 — 메뉴로 들어가면 처음부터 그 점포로 검색한다.
// 그 메뉴 안에서 사용자가 목록의 점포를 바꿨으면(store-picks) 범위 대신 그 점포를 싣는다.
// alarm 은 알림 종(NotificationBellSlot, 서버 컴포넌트)이다. 클라이언트인 이 헤더가 직접 그릴 수 없어 루트 layout 이 만들어 AdminLayout → AdminFrame 을 거쳐 넘긴다.
export function AdminHeader({ alarm }: { alarm: ReactNode }) {
  const account = useAccount();
  const service = useService();
  const all = useMenus();
  const [scope] = useScope();
  const stores = useStores();
  const [picks] = useStorePicks();
  const linkOf = (url: string) => {
    if (!usesStoreScope(url)) return url;
    if (picks?.url !== url) return scopedListHref(url, scope, stores);
    return pickedListHref(
      url,
      picks.stores.map((s) => s.storeId),
      stores,
    );
  };
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
          {service === "WHALE_ERP" ? <HeaderScopeSelect /> : <div className="flex-1" />}
          <ServiceLinks hrefs={{ erp: "/home", platform: "/platform" }} />
          {alarm}
          <UserPop name={account.name ?? account.loginId} items={userItems} />
        </>
      }
    />
  );
}

// 범위 선택기 — 전체 · 직영 · 가맹 · 점포 하나 중 하나(okf/home.md). 모양은 데모 scopeDropdown(칸은 「BP 이름 · 고른 값」, 목록은 BP 묶음 · 직영 · 가맹 묶음 + 검색).
// 폐점이 아닌 점포가 없는 유형은 「직영 · 가맹 전체」 항목을 뺀다(폐점 점포만 있으면 그 유형 묶음은 남고 회색 점포만 보인다).
// 폐점 점포는 그 유형 묶음 끝에 회색으로 보이고 하나씩 고를 수 있지만, 개수와 직영 · 가맹 전체에는 넣지 않는다.
// 바꾸면 지금 화면이 점포 검색 컴포넌트를 쓰는 메뉴(목록 · 상세 · 등록 · 수정)일 때 그 목록으로 가서 범위의 점포로 검색한다.
// 다른 화면은 그대로 두고 범위만 바꾼다 — 그 뒤 그런 목록에 들어가면 이 범위로 검색한다.
// 목록에서 사용자가 고른 점포의 기억(store-picks)은 범위를 새로 고르거나 그 메뉴를 떠나면 지운다 — 다시 들어오면 범위를 따른다.
function HeaderScopeSelect() {
  const bp = useCurrentBp();
  const router = useRouter();
  const pageMenu = usePageMenu();
  const stores = useStores();
  const [scope, setScope] = useScope();
  const [picks, setPicks] = useStorePicks();
  const pageUrl = pageMenu?.url ?? null;
  const forgetPicksOutside = useEffectEvent(() => {
    if (picks && picks.url !== pageUrl) setPicks(null);
  });
  useEffect(() => forgetPicksOutside(), [pageUrl]);
  // 칸 앞의 BP 이름이 어느 BP 의 데이터인지 늘 보인다(플랫폼 계정이 고른 BP 의 탭도)
  return (
    <ScopeSelect
      title={bp.tradeName}
      sections={scopeSections(bp.tradeName, stores)}
      value={scopeKeyOf(scope)}
      onChange={(key) => {
        const next = scopeOfKey(key);
        if (!next) return;
        setScope(next);
        if (pageUrl && usesStoreScope(pageUrl)) router.push(scopedListHref(pageUrl, next, stores));
      }}
    />
  );
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

