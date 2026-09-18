"use client";

import { useEffect, useEffectEvent, useRef, type ReactNode, type RefObject } from "react";
import { EASE_OUT } from "./theme";

// Figma Slide. 목록 화면 오른쪽에서 밀려 나오는 등록·수정 패널(RNB).
// 화면을 덮지 않고 옆에 겹쳐 서므로 뒤쪽 목록은 그대로 읽을 수 있다. 바깥을 눌러도 닫히지 않는다 — 입력 중인 내용이 날아가면 안 된다.
// Esc 로는 닫는다(다른 팝업과 같다). 닫히면 패널 안이 inert 가 되어 포커스가 body 로 떨어지므로 연 버튼으로 되돌린다.
// 놓을 자리는 쓰는 쪽에서 정한다 — relative 와 함께 overflow-x-clip 을 줘야 한다.
// 닫힌 패널은 화면 오른쪽 바깥에 서 있어서, 잘라 내지 않으면 그만큼 가로 스크롤이 생긴다.
// 버튼 줄까지 내용에 들어 있어 함께 스크롤한다.
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
  trigger?: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const close = useEffectEvent(() => onClose());
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") close();
      };
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
    // 열렸다 닫힌 때만 되돌린다. 처음 그려질 때 다른 곳의 포커스를 빼앗으면 안 된다.
    if (wasOpen.current) {
      wasOpen.current = false;
      trigger?.current?.focus();
    }
  }, [open, trigger]);

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
