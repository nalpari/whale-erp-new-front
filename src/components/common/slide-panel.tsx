"use client";

import { createContext, use, useCallback, useEffect, useEffectEvent, useRef, useState, type ReactNode, type RefObject } from "react";
import { EASE_OUT } from "./theme";

// Figma Slide. 목록 화면 오른쪽에서 밀려 나오는 등록·수정·상세 패널(RNB).
// 화면을 덮지 않고 옆에 겹쳐 서므로 뒤쪽 목록은 그대로 읽을 수 있다. 열리면 화면 전체(헤더 포함)를 덮는 바탕창이 같이
// 떠서 뒤 조작을 막는다(데모 2026-10-06 결정과 같다. PanelBackdropProvider) — 등록·수정처럼 입력 중인 내용이 있는
// 패널은 바깥을 눌러도 닫히지 않는다(실수로 날리면 되돌릴 수 없다). 상세처럼 잃을 입력이 없는 패널만 closeOnBackdrop
// 으로 닫음을 켠다(코드 리뷰로 찾음, 2026-10-20 — 데모는 값이 고정이라 이 위험이 없었다).
// Esc 로는 모든 패널이 닫힌다(그 전부터 있던 길이라 그대로 둔다). 안에서 열린 팝업이 있으면 그쪽이 먼저 닫히도록
// useDismiss 와 같은 data-dismiss-open 규칙을 따르고, 안쪽 칸이 preventDefault 한 Esc 도 넘긴다.
// 겹쳐 연 패널(상세 위 수정)이 있으면 바탕창 한 번으로는 그 패널만 닫힌다 — 각 onClose 가 이미 "안쪽부터" 규칙을
// 스스로 지킨다(예: 수정이 열려 있으면 상세의 onClose 는 닫지 않고 돌아온다). 두 번째로 눌러야 다음 겹이 닫힌다.
// 닫히면 패널 안이 inert 가 되어 포커스가 body 로 떨어지므로 연 버튼으로 되돌린다.
// 놓을 자리는 쓰는 쪽에서 정한다 — relative 와 함께 overflow-x-clip 을 줘야 한다.
// 닫힌 패널은 화면 오른쪽 바깥에 서 있어서, 잘라 내지 않으면 그만큼 가로 스크롤이 생긴다.
// hidden 이 아니라 clip 이다 — hidden 은 세로축까지 auto 로 끌어올려 헤더 팝업·툴팁이 잘린다.
// 트리거와 패널 사이 어느 요소에도 relative 를 주면 안 된다. 그 순간 패널이 그 안으로 들어가 잘린다.
// 버튼 줄까지 내용에 들어 있어 함께 스크롤한다.

type PanelEntry = { close: PanelCloser; closable: boolean };
type PanelCloser = () => void;
const PanelStackContext = createContext<((entry: PanelEntry) => () => void) | null>(null);

/** ErpRoot(PanelBackdropProvider) 안에서만 쓴다 — 화면 전체를 덮는 바탕창 하나를 모든 슬라이드 패널이 같이 쓴다. */
function usePanelStack() {
  const register = use(PanelStackContext);
  if (!register) throw new Error("SlidePanel 은 ErpRoot(PanelBackdropProvider) 안에서만 쓴다");
  return register;
}

/**
 * 슬라이드 패널 바탕창 — ErpRoot 에 한 번만 둔다(toast 와 같다). 열린 패널이 하나라도 있으면 화면 전체를 덮어 뒤 조작을
 * 막는다. 누르면 closeOnBackdrop 을 켠 패널들만 안쪽(나중에 연 것)부터 닫으려 한다 — 실제로 몇 겹이 닫히는지는
 * 각 패널의 onClose 가 정한다. 입력 중인 내용이 있는 패널(closeOnBackdrop 을 안 켠 패널)은 눌러도 그대로 열려
 * 있다 — 떠 있다는 것만 보이고(바탕창이 뒤 조작을 막는다), 닫는 건 Esc 나 패널 안의 버튼으로만 한다.
 */
export function PanelBackdropProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<PanelEntry[]>([]);
  const register = useCallback((entry: PanelEntry) => {
    setStack((s) => [...s, entry]);
    return () => setStack((s) => s.filter((e) => e !== entry));
  }, []);
  const open = stack.length > 0;

  return (
    <PanelStackContext value={register}>
      {children}
      <div
        data-panel-backdrop
        inert={!open}
        onClick={() => [...stack].reverse().forEach((e) => e.closable && e.close())}
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
  closeOnBackdrop = false,
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
  /** 바탕창을 눌러도 닫을지. 입력을 잃을 수 있는 등록·수정 패널은 기본값(false)을 그대로 두고 Esc·버튼으로만 닫는다 */
  closeOnBackdrop?: boolean;
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
      const unregister = registerPanel({ close, closable: closeOnBackdrop });
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
  }, [open, trigger, registerPanel, closeOnBackdrop]);

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
