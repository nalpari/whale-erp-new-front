"use client";

import { useEffect, useEffectEvent, useRef, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { EASE_OUT } from "./theme";

// Figma Slide. 목록 화면 오른쪽에서 밀려 나오는 등록·수정 패널(RNB).
// 화면을 덮지 않고 옆에 겹쳐 서므로 뒤쪽 목록은 그대로 읽을 수 있다.
// Esc 로는 닫는다. 안에서 열린 팝업이 있으면 그쪽이 먼저 닫히도록 useDismiss 와 같은 data-dismiss-open 규칙을 따르고, 안쪽 칸이 preventDefault 한 Esc 도 넘긴다.
// 닫히면 패널 안이 inert 가 되어 포커스가 body 로 떨어지므로 연 버튼으로 되돌린다.
// 놓을 자리는 쓰는 쪽에서 정한다 — relative 와 함께 overflow-x-clip 을 줘야 한다.
// 닫힌 패널은 화면 오른쪽 바깥에 서 있어서, 잘라 내지 않으면 그만큼 가로 스크롤이 생긴다.
// hidden 이 아니라 clip 이다 — hidden 은 세로축까지 auto 로 끌어올려 헤더 팝업·툴팁이 잘린다.
// 트리거와 패널 사이 어느 요소에도 relative 를 주면 안 된다. 그 순간 패널이 그 안으로 들어가 잘린다.
// 버튼 줄까지 내용에 들어 있어 함께 스크롤한다.
// 열린 패널은 바탕창(PanelBackdrop)에 자신을 등록한다. 등록·수정처럼 입력 중인 내용이 있는 패널은
// closeOnBackdrop 을 안 켜 바깥을 눌러도 그대로 열려 있다(실수로 날리면 되돌릴 수 없다) — 그 패널이 가장
// 위일 때는 바탕창 자체가 뜨지 않아 뒤 목록을 그대로 누를 수 있다(등록 패널을 연 채 목록 줄을 눌러 상세를
// 그 위에 겹쳐 여는 흐름이 막히던 문제를 코드 리뷰로 찾아 고쳤다, 2026-10-20). 상세처럼 잃을 입력이 없는
// 패널만 closeOnBackdrop 을 켠다 — 데모는 값이 고정이라 이 위험이 없었다.
// 패널 하나만 닫는 것은 Esc 와 같은 규칙이다 — 상세 위에 겹쳐 연 수정 패널처럼, 안쪽 패널의 onClose 가
// "더 안쪽이 열려 있으면 넘긴다"는 자기 화면의 조건을 가질 수 있어(admins-screen.tsx dismissDetail 의
// editOpen 검사), 등록된 onClose 를 한 번에 다 불러 봐도 그 조건이 아직 최신 렌더를 보지 못해 걸러지지
// 않는다 — 한 번에 하나씩, 다시 누르면 다음 것이 닫힌다.
type PanelEntry = { close: () => void; closable: boolean };
const openPanels = new Set<PanelEntry>();
const backdropListeners = new Set<() => void>();
const notifyBackdrop = () => backdropListeners.forEach((l) => l());

const topPanel = () => {
  const panels = [...openPanels];
  return panels[panels.length - 1];
};

/** 가장 위(가장 나중에 연) 패널이 closeOnBackdrop 을 켰을 때만 닫는다 — PanelBackdrop 클릭 핸들러 전용. */
function closeTopPanel() {
  const top = topPanel();
  if (top?.closable) top.close();
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

  useEffect(() => {
    if (open) {
      const entry: PanelEntry = { close, closable: closeOnBackdrop };
      openPanels.add(entry);
      notifyBackdrop();
      wasOpen.current = true;
      const onKey = (e: KeyboardEvent) => {
        // 안쪽 칸이 Esc 를 먼저 써 버렸으면(preventDefault — 자동완성 층 닫기 등) 패널은 그대로 둔다.
        // 그 칸이 층을 지우는 것이 이 처리보다 먼저 끝날 수 있어 data-dismiss-open 만으로는 못 막는다.
        if (e.key === "Escape" && !e.defaultPrevented && !document.querySelector("[data-dismiss-open]")) close();
      };
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("keydown", onKey);
        openPanels.delete(entry);
        notifyBackdrop();
      };
    }
    // 열렸다 닫힌 때만 되돌린다. 처음 그려질 때 다른 곳의 포커스를 빼앗으면 안 된다.
    if (wasOpen.current) {
      wasOpen.current = false;
      trigger.current?.focus();
    }
  }, [open, trigger, closeOnBackdrop]);

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

const subscribeBackdrop = (listener: () => void) => {
  backdropListeners.add(listener);
  return () => backdropListeners.delete(listener);
};
/**
 * 가장 위 패널이 closeOnBackdrop 을 켰을 때만 참 — 등록·수정처럼 켜지 않은 패널이 혼자 열려 있을 때는 거짓이라
 * 바탕창이 뜨지 않고 inert 로 빠진다. 그래야 등록 패널을 연 채로도 목록 줄을 눌러 상세를 그 위에 겹쳐 열 수 있다
 * (admins-screen.tsx) — 전체를 덮는 바탕창이 그 클릭을 가로채던 문제를 고쳤다(코드 리뷰, 2026-10-20).
 */
const topPanelClosable = () => topPanel()?.closable ?? false;

/**
 * 가장 위 패널이 closeOnBackdrop 을 켰을 때만 화면 전체(헤더 포함)를 덮는 바탕창 — 데모(docs/demo/assets/erp.js
 * setBackdrop)와 같다. 누르면 그 패널을 닫는다(Esc 와 같은 한 번에 하나씩). 켜지 않은 패널(등록·수정)이 가장
 * 위일 때는 바탕창이 뜨지 않아 뒤 목록을 그대로 누를 수 있다. AdminFrame 처럼 모든 패널의 relative 조상 안에
 * 한 번만 둔다.
 */
export function PanelBackdrop() {
  const open = useSyncExternalStore(subscribeBackdrop, topPanelClosable, () => false);
  return (
    <div
      aria-hidden="true"
      inert={!open}
      onClick={closeTopPanel}
      className={`fixed inset-0 z-[5] bg-erp-nav/40 transition-opacity duration-250 ${EASE_OUT} motion-reduce:transition-none ${open ? "opacity-100" : "opacity-0"}`}
    />
  );
}
