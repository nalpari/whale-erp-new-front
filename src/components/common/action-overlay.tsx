"use client";

import { usePathname } from "next/navigation";
import { createContext, use, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { busyTextOf, createBusyStore, wrapAction, type ActionOptions } from "./busy-stack.ts";
import { LoadingNotice } from "./load-group";

// 등록 · 수정 · 삭제 같은 쓰기 요청을 부르는 동안 화면 전체(헤더 포함)를 덮는 「처리중」 딤. 덮개는 ErpRoot 가 하나만 둔다(토스트와 같다) —
// 화면은 useAction 으로 요청을 감싸기만 한다. 서버 액션이 redirect 로 끝나 화면이 옮겨지면 덮개도 함께 내린다(경로(pathname)가 바뀌면 비운다).

type Begin = (text: string) => () => void;
const NO_SUBSCRIBE = () => () => {};
const HAS_POPOVER = () => "popover" in HTMLElement.prototype;
const ActionContext = createContext<Begin | null>(null);

export function ActionProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createBusyStore);
  const text = useSyncExternalStore(store.subscribe, store.text, () => null);
  const begin = store.begin;
  const pathname = usePathname();
  // redirect 로 끝나는 서버 액션은 이동이 끝난 뒤에야 돌려주거나 돌려주지 않을 수 있다 — 화면이 옮겨졌으면 덮개를 내린다
  useEffect(() => {
    store.clear();
  }, [pathname, store]);
  return (
    <ActionContext value={begin}>
      {children}
      <Overlay text={text} />
    </ActionContext>
  );
}

// 확인창(네이티브 dialog)보다 위에 서도록 popover(최상위 레이어)로 연다. 뒤 화면은 클릭 · Tab 이 닿지 않게 막는다.
// popover 를 모르는 브라우저(":popover-open" 이 SyntaxError)는 fixed 덮개로 같은 딤을 그린다(help-tip · date-field 와 같은 판정).
// 한계: 미지원 브라우저의 fixed 덮개는 최상위 레이어가 아니라 열린 네이티브 확인창보다 아래에 깔린다.
// 덮개를 열 때 있던 포커스는 기억했다가 내릴 때 그 요소가 아직 문서에 있으면 돌려준다.
function Overlay({ text }: { text: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const before = useRef<Element | null>(null);
  const canPopover = useSyncExternalStore(NO_SUBSCRIBE, HAS_POPOVER, () => true);
  const open = text !== null;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      before.current = document.activeElement;
      if (canPopover && !el.matches(":popover-open")) el.showPopover();
      el.focus({ preventScroll: true });
    } else {
      if (canPopover && el.matches(":popover-open")) el.hidePopover();
      const back = before.current;
      before.current = null;
      if (back instanceof HTMLElement && back.isConnected) back.focus({ preventScroll: true });
    }
  }, [open, canPopover]);
  return (
    <div
      ref={ref}
      {...(canPopover ? { popover: "manual" } : {})}
      tabIndex={-1}
      onKeyDown={(e) => {
        // 새로고침(F5 · Ctrl/⌘+R)은 막지 않는다 — 요청이 멈췄을 때 빠져나갈 길이다
        const reload = e.key === "F5" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r");
        if (!reload) e.preventDefault();
      }}
      className={
        canPopover
          ? "m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0 outline-none [&:popover-open]:flex [&:popover-open]:flex-col"
          : `fixed inset-0 z-[1000] flex-col outline-none ${open ? "flex" : "hidden"}`
      }
    >
      {open && <LoadingNotice text={text} />}
    </div>
  );
}

/**
 * 쓰기 요청(서버 액션 · fetch)을 감싼다. 부르는 동안 화면 전체에 고래 로딩 + 문구를 띄우고, 끝나면(성공 · 실패 · redirect) 내린다.
 * 결과는 그대로 돌려준다. 문구는 kind(등록중입니다 · 수정중입니다 · 삭제중입니다), text, 없으면 「처리중입니다」다.
 * ErpRoot 밖에서 쓰면 덮개 없이 그대로 부른다.
 */
export function useAction<A extends unknown[], R>(action: (...args: A) => Promise<R>, options?: ActionOptions): (...args: A) => Promise<R> {
  const begin = use(ActionContext);
  const text = busyTextOf(options);
  // action 이 바뀌면 감싼 함수도 바뀐다(인라인 함수는 렌더마다) — 호출부는 이 함수를 effect 의존성으로 쓰지 않는다
  return useMemo(() => wrapAction(begin, text, action), [begin, text, action]);
}
