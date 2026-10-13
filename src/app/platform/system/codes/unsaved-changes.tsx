"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, use, useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/common";

// 두 패널(그룹 목록 · 상세 코드)의 저장하지 않은 변경을 모아 둔다. 변경이 있는데 다른 그룹 · 다른 쪽으로 가려 하면
// 버릴지 묻는다(2026-10-12 결정). 브라우저를 닫거나 새로 고칠 때는 브라우저 기본 확인창이 뜬다.
// 헤더 메뉴 이동은 묻지 않는다 — 헤더는 모든 화면이 함께 쓰는 공통 컴포넌트라 이 화면의 상태를 모른다.
type UnsavedChanges = {
  setDirty: (panel: string, dirty: boolean) => void;
  /** 한 패널에 저장하지 않은 변경이 있는지 — 그룹 패널의 [BP 적용]이 상세 코드 패널을 본다. */
  isDirty: (panel: string) => boolean;
  navigate: (href: string) => void;
};

const UnsavedChangesContext = createContext<UnsavedChanges | null>(null);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [dirtyPanels, setDirtyPanels] = useState<Record<string, boolean>>({});
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const hasChanges = Object.values(dirtyPanels).some(Boolean);

  useEffect(() => {
    if (!hasChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const value: UnsavedChanges = {
    setDirty: (panel, dirty) => setDirtyPanels((m) => (Boolean(m[panel]) === dirty ? m : { ...m, [panel]: dirty })),
    isDirty: (panel) => Boolean(dirtyPanels[panel]),
    // 그룹 · 쪽만 바뀌는 이동이라 스크롤을 맨 위로 올리지 않는다 — 누른 자리에서 그대로 본다.
    navigate: (href) => (hasChanges ? setPendingHref(href) : router.push(href, { scroll: false })),
  };

  const handleDiscard = () => {
    const href = pendingHref;
    setPendingHref(null);
    setDirtyPanels({});
    if (href) router.push(href, { scroll: false });
  };

  return (
    <UnsavedChangesContext value={value}>
      {children}
      <ConfirmDialog
        open={pendingHref !== null}
        title="저장하지 않은 변경"
        confirmLabel="버리고 이동"
        onConfirm={handleDiscard}
        onCancel={() => setPendingHref(null)}
      >
        저장하지 않은 변경이 있습니다. 버리고 이동할까요?
      </ConfirmDialog>
    </UnsavedChangesContext>
  );
}

export function useUnsavedChanges(): UnsavedChanges {
  const value = use(UnsavedChangesContext);
  if (!value) throw new Error("UnsavedChangesProvider 안에서만 쓴다");
  return value;
}

/** 저장하지 않은 변경이 있으면 이동 전에 묻는 링크. 새 탭 열기(⌘ · Ctrl · 가운데 버튼)는 그대로 둔다. */
export function GuardedLink({ href, onClick, ...props }: ComponentProps<typeof Link> & { href: string }) {
  const { navigate } = useUnsavedChanges();
  return (
    <Link
      {...props}
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(href);
      }}
    />
  );
}
