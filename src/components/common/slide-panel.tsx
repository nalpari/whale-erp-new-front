import type { ReactNode } from "react";
import { EASE_OUT } from "./theme";

// Figma Slide. 목록 화면 오른쪽에서 밀려 나오는 등록·수정 패널(RNB).
// 화면을 덮지 않고 옆에 겹쳐 서므로 뒤쪽 목록은 그대로 읽을 수 있다. 바깥을 눌러도 닫히지 않는다 — 입력 중인 내용이 날아가면 안 된다.
// 놓을 자리는 쓰는 쪽에서 정한다 — relative 와 함께 overflow-x-clip 을 줘야 한다.
// 닫힌 패널은 화면 오른쪽 바깥에 서 있어서, 잘라 내지 않으면 그만큼 가로 스크롤이 생긴다.
// 버튼 줄까지 내용에 들어 있어 함께 스크롤한다.
export function SlidePanel({
  open,
  label,
  children,
}: {
  open: boolean;
  /** 패널이 무엇인지 알리는 이름(예: "점포 등록") */
  label: string;
  children: ReactNode;
}) {
  return (
    <aside
      aria-label={label}
      aria-hidden={!open}
      inert={!open}
      className={`absolute inset-y-0 right-0 z-10 flex w-[464px] flex-col gap-[16px] overflow-y-auto border-x border-erp-panel-line bg-white transition-transform duration-250 ${EASE_OUT} motion-reduce:transition-none p-[24px] ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {children}
    </aside>
  );
}
