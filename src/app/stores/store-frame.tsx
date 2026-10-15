import type { ReactNode } from "react";
import { PageBar } from "@/components/common";

/**
 * 점포 정보 관리 화면들의 제목 줄(「점포 정보 관리」)과 본문. 헤더 · 화면 높이 · 가로 스크롤 · 밝은 테마는 로그인 후 공통 틀
 * (AdminFrame)이 잡는다 — 여기서 헤더를 또 그리면 두 줄이 된다. 넘치는 내용은 본문 안에서만 스크롤한다(DESIGN.md 「한 화면 규칙」).
 * 목록은 필터 · 목록을 나란히, 상세 · 등록 · 수정은 흰 카드 하나를 둔다.
 */
export function StoreFrame({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <>
      <PageBar title="점포 정보 관리">{actions}</PageBar>
      {children}
    </>
  );
}

/** 상세 · 등록 · 수정의 본문 — 흰 카드 하나, 넘치면 이 안에서 스크롤한다 */
export function StoreCardBody({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
      <div className="flex flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">{children}</div>
    </div>
  );
}
