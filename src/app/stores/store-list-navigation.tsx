"use client";

import { useRouter } from "next/navigation";
import { createContext, use, useOptimistic, useTransition, type ReactNode } from "react";
import { storesHref, type StoresQuery } from "./stores-query";

type Navigation = { current: StoresQuery; navigate: (next: StoresQuery) => void };

const NavigationContext = createContext<Navigation | null>(null);

/**
 * 목록 화면의 조건 · 쪽 · 보기를 한 낙관적 쿼리로 쥔다. 필터 · 보기 전환 · 건수 · 쪽 넘기기가 모두 이것을 나눠 쓰므로,
 * 서버가 새 목록을 돌려주기 전에 다른 조작을 이어서 해도 앞의 변경을 잃지 않는다(조작마다 따로 쥐면 옛 쿼리로 덮는다).
 * 조작은 router.replace 라 기록을 쌓지 않는다(뒤로 가기는 이 화면을 떠난다). 스크롤은 그대로 둔다.
 */
export function StoreListNavigationProvider({ query, children }: { query: StoresQuery; children: ReactNode }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(query);
  const navigate = (next: StoresQuery) =>
    startTransition(() => {
      setCurrent(next);
      router.replace(storesHref(next), { scroll: false });
    });
  return <NavigationContext value={{ current, navigate }}>{children}</NavigationContext>;
}

export function useStoreListNavigation(): Navigation {
  const navigation = use(NavigationContext);
  if (!navigation) throw new Error("StoreListNavigationProvider 안에서 써야 합니다");
  return navigation;
}
