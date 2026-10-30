import type { ReactNode } from "react";

// 왼쪽 목록 + 오른쪽 고정 칸으로 된 플랫폼 관리 화면(권한 관리 · 메뉴 관리)이 같이 쓰는 작은 조각. 공통 컴포넌트에 없는 것만 둔다 —
// 공통(components/common)으로 올리려면 1팀과 먼저 맞춘다.

/** 2단 카드 껍데기 — 카드 안에서만 세로로 스크롤한다(DESIGN.md 한 화면 규칙) */
export const CARD = "flex min-h-0 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px] [&>*]:shrink-0";

/** 실패 띠 — 칸 맨 위에 하나만 선다 */
export function FailedBand({ message, detail }: { message: string; detail?: string }) {
  return (
    <div role="alert" className="rounded-[2px] border border-erp-off bg-erp-off-bg px-[16px] py-[12px] text-[14px] leading-[1.6] text-erp-off">
      <p className="font-medium">{message}</p>
      {detail && <p className="text-erp-ink">{detail}</p>}
    </div>
  );
}

/** 안내 띠 — 상태 색 없이 표 머리 바탕 · 선만(두 바탕 규칙) */
export function InfoBand({ children }: { children: ReactNode }) {
  return <div className="rounded-[2px] border border-erp-panel-line bg-erp-thead-bg px-[16px] py-[12px] text-[14px] font-medium text-erp-ink">{children}</div>;
}

/**
 * 막힌 이유 안내 — 플랫폼 메뉴 관리의 「미사용으로 변경하면 …」 안내와 같은 빨간 테두리 · 연한 빨간 바탕 상자(2026-10-27 사용자 지정).
 * 권한 그룹 상세에서 고칠 수 없는 이유(권한 없음 등) · 삭제 확인창의 대체 후보 없음에 쓴다. 글로 이유를 함께 말한다(DESIGN.md 색은 상태다 예외).
 */
export function WarnBand({ children }: { children: ReactNode }) {
  return <div className="rounded-[2px] border border-erp-off bg-erp-off-bg px-[16px] py-[12px] text-[14px] whitespace-pre-line text-erp-off">{children}</div>;
}

/** 하늘색 안내 상자 — WarnBand 와 같은 모양에 상태 파랑(erp-on). 잘 된 일을 알리고 다음 할 일을 덧붙일 때(BP 마스터 상세 초기 비밀번호 발송, 2026-10-28 사용자 지정). */
export function SuccessBand({ children }: { children: ReactNode }) {
  return <div className="rounded-[2px] border border-erp-on bg-erp-on-bg px-[16px] py-[12px] text-[14px] whitespace-pre-line text-erp-on">{children}</div>;
}

/** 칸 오류 문구 — 입력칸 바로 아래 한 줄. 문구가 없으면 그리지 않는다. */
export function FieldMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-[13px] leading-[1.5] text-erp-off">
      {message}
    </p>
  );
}
