import type { ReactNode } from "react";

// 상세 코드 행 삭제 — 플랫폼 · BP 공통코드 관리가 함께 쓴다. [삭제](휴지통 아이콘)는 바로 지우지 않고 지울 행으로 표시해 두었다가 [저장] 때 반영한다.
// 표시한 행은 글자에 취소선을 긋고 사용 상태 칸에 「삭제 예정」을 글자로 둔다(색만으로 말하지 않는다 — DESIGN.md). [되돌리기](되돌림 아이콘)로 푼다.

/**
 * 행 끝 칸의 [삭제](휴지통) · [되돌리기](되돌림 화살표) 아이콘 버튼. 아이콘 묶음이 없어 인라인 SVG 로 그린다(검색칸 · 점포 고르기와 같다).
 * 테두리는 처음부터 깔고 호버에서 색만 바꾼다 — 삭제는 위험 색(빨강), 되돌리기는 브랜드 색(DESIGN.md). 글자 대신 말풍선 · 읽기 문구로 뜻을 준다.
 */
export function DeleteToggle({ deleted, name, onToggle }: { deleted: boolean; name: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={deleted}
      aria-label={deleted ? `${name} 삭제 되돌리기` : `${name} 삭제`}
      title={deleted ? "삭제 되돌리기" : "삭제"}
      className={`inline-grid size-[28px] place-items-center rounded-[2px] border border-erp-button-line bg-white text-erp-label transition-colors duration-150 ease-out ${
        deleted ? "hover:border-erp-brand hover:text-erp-brand" : "hover:border-erp-off hover:text-erp-off"
      }`}
    >
      {deleted ? (
        // 되돌림 화살표
        <svg viewBox="0 0 16 16" className="size-[14px]" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5.5 3.5 2.5 6.5l3 3" />
          <path d="M2.5 6.5h7a4 4 0 0 1 0 8H7" />
        </svg>
      ) : (
        // 휴지통
        <svg viewBox="0 0 16 16" className="size-[14px]" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M2.5 4h11" />
          <path d="M6 4V2.5h4V4" />
          <path d="M3.8 4l.7 9.5h7l.7-9.5" />
          <path d="M6.6 6.5v4.5M9.4 6.5v4.5" />
        </svg>
      )}
    </button>
  );
}

/** 지울 행의 값 — 취소선. */
export function Struck({ children }: { children: ReactNode }) {
  return <s className="text-erp-label">{children}</s>;
}

/** 지울 행의 사용 상태 칸. */
export function DeletePending() {
  return <span className="text-[14px] text-erp-label">삭제 예정</span>;
}
