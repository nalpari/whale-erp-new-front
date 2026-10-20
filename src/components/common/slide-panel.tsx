"use client";

import { createContext, use, useCallback, useEffect, useEffectEvent, useRef, useState, type ReactNode, type RefObject } from "react";
import { EASE_OUT } from "./theme";

// Figma Slide. 목록 화면 오른쪽에서 밀려 나오는 등록·수정·상세 패널(RNB).
// 화면을 덮지 않고 옆에 겹쳐 서므로 뒤쪽 목록은 그대로 읽을 수 있다. 열리면 화면 전체(헤더 포함)를 덮는 바탕창이 같이
// 뜨고, 바탕창을 누르면 열려 있는 패널을 닫는다(데모 2026-10-06 결정과 같다. PanelBackdropProvider).
// Esc 로도 닫는다. 안에서 열린 팝업이 있으면 그쪽이 먼저 닫히도록 useDismiss 와 같은 data-dismiss-open 규칙을 따르고, 안쪽 칸이 preventDefault 한 Esc 도 넘긴다.
// 겹쳐 연 패널(상세 위 수정)이 있으면 바탕창 한 번으로는 그 패널만 닫힌다 — 각 onClose 가 이미 "안쪽부터" 규칙을
// 스스로 지킨다(예: 수정이 열려 있으면 상세의 onClose 는 닫지 않고 돌아온다). 두 번째로 눌러야 다음 겹이 닫힌다.
// 닫히면 패널 안이 inert 가 되어 포커스가 body 로 떨어지므로 연 버튼으로 되돌린다.
// 놓을 자리는 쓰는 쪽에서 정한다 — relative 와 함께 overflow-x-clip 을 줘야 한다.
// 닫힌 패널은 화면 오른쪽 바깥에 서 있어서, 잘라 내지 않으면 그만큼 가로 스크롤이 생긴다.
// hidden 이 아니라 clip 이다 — hidden 은 세로축까지 auto 로 끌어올려 헤더 팝업·툴팁이 잘린다.
// 트리거와 패널 사이 어느 요소에도 relative 를 주면 안 된다. 그 순간 패널이 그 안으로 들어가 잘린다.
// 버튼 줄까지 내용에 들어 있어 함께 스크롤한다.

type PanelCloser = () => void;
const PanelStackContext = createContext<((close: PanelCloser) => () => void) | null>(null);

/** ErpRoot(PanelBackdropProvider) 안에서만 쓴다 — 화면 전체를 덮는 바탕창 하나를 모든 슬라이드 패널이 같이 쓴다. */
function usePanelStack() {
  const register = use(PanelStackContext);
  if (!register) throw new Error("SlidePanel 은 ErpRoot(PanelBackdropProvider) 안에서만 쓴다");
  return register;
}

/**
 * 슬라이드 패널 바탕창 — ErpRoot 에 한 번만 둔다(toast 와 같다). 열린 패널이 하나라도 있으면 화면 전체를 덮어 뒤 조작을
 * 막고, 누르면 지금 열려 있는 패널들을 안쪽(나중에 연 것)부터 닫으려 한다 — 실제로 몇 겹이 닫히는지는 각 패널의
 * onClose 가 정한다.
 */
export function PanelBackdropProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<PanelCloser[]>([]);
  const register = useCallback((close: PanelCloser) => {
    setStack((s) => [...s, close]);
    return () => setStack((s) => s.filter((c) => c !== close));
  }, []);
  const open = stack.length > 0;

  return (
    <PanelStackContext value={register}>
      {children}
      <div
        data-panel-backdrop
        inert={!open}
        onClick={() => [...stack].reverse().forEach((close) => close())}
        className={`fixed inset-0 z-[5] bg-erp-nav/40 transition-opacity duration-250 ${EASE_OUT} motion-reduce:transition-none ${open ? "opacity-100" : "opacity-0"}`}
      />
    </PanelStackContext>
  );
}

export function SlidePanel({
  id,
  open,
  onClose,
  label,
  trigger,
  children,
}: {
  /** 연 버튼의 aria-controls 와 짝이 되는 id */
  id: string;
  open: boolean;
  onClose: () => void;
  /** 패널이 무엇인지 알리는 이름(예: "점포 등록") */
  label: string;
  /** 패널을 연 버튼. 닫을 때 포커스를 여기로 되돌린다. */
  trigger: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const close = useEffectEvent(() => onClose());
  const wasOpen = useRef(false);
  const registerPanel = usePanelStack();

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const onKey = (e: KeyboardEvent) => {
        // 안쪽 칸이 Esc 를 먼저 써 버렸으면(preventDefault — 자동완성 층 닫기 등) 패널은 그대로 둔다.
        // 그 칸이 층을 지우는 것이 이 처리보다 먼저 끝날 수 있어 data-dismiss-open 만으로는 못 막는다.
        if (e.key === "Escape" && !e.defaultPrevented && !document.querySelector("[data-dismiss-open]")) close();
      };
      document.addEventListener("keydown", onKey);
      const unregister = registerPanel(close);
      return () => {
        document.removeEventListener("keydown", onKey);
        unregister();
      };
    }
    // 열렸다 닫힌 때만 되돌린다. 처음 그려질 때 다른 곳의 포커스를 빼앗으면 안 된다.
    if (wasOpen.current) {
      wasOpen.current = false;
      trigger.current?.focus();
    }
  }, [open, trigger, registerPanel]);

  return (
    <aside
      id={id}
      aria-label={label}
      inert={!open}
      className={`absolute inset-y-0 right-0 z-10 flex w-[464px] flex-col gap-[16px] overflow-y-auto border-x border-erp-panel-line bg-white p-[24px] transition-transform duration-250 ${EASE_OUT} motion-reduce:transition-none ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {children}
    </aside>
  );
}
