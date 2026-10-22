import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { PageBar } from "@/components/common";
import { ApiError, deniedMessageOf } from "@/lib/api";
import { NoticeBand } from "./store-parts";

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

/**
 * api 가 점포 조회를 거절했을 때의 화면(deniedMessageOf — BP 를 고르지 않음 400 · 권한 · 다른 BP 403 · 없는 BP 404). 다시 시도해도 같아
 * 오류 화면 대신 그 문장을 띠로 보인다. 플랫폼 계정이 BP 없는 옛 주소로 오면 SessionGate 가 탭 BP 주소로 보내기 전에 서버가 헤더 없이 먼저
 * 부른다 — api 가 헤더를 요구하면(점포 탭 BP 전환) 이 400 을 받는다.
 */
export function StoreDenied({ message }: { message: string }) {
  return (
    <StoreFrame>
      <StoreCardBody>
        <NoticeBand title={message} />
      </StoreCardBody>
    </StoreFrame>
  );
}

/** api 의 점포 404 문장(whale-erp-api store-management.service.ts 의 NOT_FOUND). 가드의 BP 404(「BP 를 찾을 수 없습니다」)와 가른다 */
const STORE_NOT_FOUND = "점포를 찾을 수 없습니다";

/**
 * 상세 · 수정의 점포 조회 실패(getStore(id).catch(storeDenied(id))). 없거나 볼 수 없는 점포(점포 404 — 다른 BP 의 점포 포함)는 찾을 수 없음 화면,
 * api 가 거절했으면(BP 를 고르지 않음 400 · 403 · 없는 BP 404) 그 문장({ denied } — StoreDenied 로 그린다). 그 밖(라우트 없는 404 포함)은
 * 그대로 던져 error.tsx 가 받는다. 문장이 바뀌어 점포 404 를 못 알아보면 찾을 수 없음 화면 대신 그 문장 띠가 된다.
 */
export const storeDenied =
  (storeId: number) =>
  (error: unknown): { denied: string } => {
    const denied = deniedMessageOf(error);
    if (denied === null) throw error;
    const status = error instanceof ApiError ? error.status : undefined;
    console.warn("점포 조회 거절", { storeId, status, message: denied });
    if (status === 404 && denied === STORE_NOT_FOUND) notFound();
    return { denied };
  };

/** 상세 · 등록 · 수정의 본문 — 흰 카드 하나, 넘치면 이 안에서 스크롤한다 */
export function StoreCardBody({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
      <div className="flex flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">{children}</div>
    </div>
  );
}
