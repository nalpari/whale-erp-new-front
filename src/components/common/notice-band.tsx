import type { ReactNode } from "react";

// 화면 위 안내 띠. 점포 화면(store-parts.tsx)이 처음 만들었고, 엑셀 받기(excel-download.tsx)와 엑셀 내려받기 화면이
// 같은 모양을 써서 공통 컴포넌트로 올렸다(2026-10-29, 1팀).
// risk 는 실패 · 막힘(빨간 테두리 · 연한 빨간 바탕), info 는 할 일을 알리는 안내(표 머리 바탕 · 패널 선)다.

/** 실패 · 막힘 안내 띠 — 화면 위에 하나만 선다 */
export function NoticeBand({ tone = "risk", title, detail }: { tone?: "risk" | "info"; title: ReactNode; detail?: ReactNode }) {
  const color = tone === "risk" ? "border-erp-off bg-erp-off-bg text-erp-off" : "border-erp-panel-line bg-erp-thead-bg text-erp-ink";
  return (
    <div role={tone === "risk" ? "alert" : "status"} className={`rounded-[2px] border px-[16px] py-[12px] text-[14px] leading-[1.6] ${color}`}>
      <p className="font-medium">{title}</p>
      {detail && <div className="text-erp-ink">{detail}</div>}
    </div>
  );
}
