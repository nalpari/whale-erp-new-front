import type { ReactNode } from "react";

// 화면 위 안내 띠. 점포 화면(store-parts.tsx)이 처음 만들었고, 엑셀 받기(excel-download.tsx)와 엑셀 내려받기 화면이
// 같은 모양을 써서 공통 컴포넌트로 올렸다(2026-10-29, 1팀).
// risk 는 실패 · 막힘(빨간 테두리 · 연한 빨간 바탕), info 는 막히지는 않았지만 알아야 할 안내(표 머리 바탕 · 패널 선)다.

/** 화면 위 안내 띠 — risk(기본)는 실패 · 막힘, info 는 알아야 할 안내. detail 은 아랫줄 먹색 설명. 한 화면에 여럿이 설 수 있다 */
export function NoticeBand({ tone = "risk", title, detail }: { tone?: "risk" | "info"; title: ReactNode; detail?: ReactNode }) {
  const color = tone === "risk" ? "border-erp-off bg-erp-off-bg text-erp-off" : "border-erp-panel-line bg-erp-thead-bg text-erp-ink";
  return (
    <div role={tone === "risk" ? "alert" : "status"} className={`rounded-[2px] border px-[16px] py-[12px] text-[14px] leading-[1.6] ${color}`}>
      <p className="font-medium">{title}</p>
      {detail && <div className="text-erp-ink">{detail}</div>}
    </div>
  );
}

/**
 * 패널 아래 정책 안내 — info 띠 안에 느낌표 아이콘 + 제목, 아래로 문장마다 가운뎃점 줄. 두 줄로 넘어가면 둘째 줄은 글자 시작선에 맞춘다.
 * 출퇴근 대신 등록 · 기록 보정 패널에서 만들었고 근무스케줄 등록 패널이 같이 쓰게 되어 올렸다(2026-11-05 사용자 지정, 3팀 확인 필요).
 */
/** lines 는 문장마다 하나 — 강조할 말에 밑줄(<u>)을 넣을 수 있게 ReactNode 다. 순서가 바뀌지 않아 열쇠는 자리 번호 */
export function GuideBand({ title, lines }: { title: string; lines: ReactNode[] }) {
  return (
    <NoticeBand
      tone="info"
      title={
        <span className="flex items-center gap-[6px]">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="shrink-0 text-erp-sub">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 4.6v4.2" strokeLinecap="round" />
            <circle cx="8" cy="11" r="0.4" fill="currentColor" />
          </svg>
          {title}
        </span>
      }
      detail={
        <ul className="mt-[6px] flex flex-col text-erp-label">
          {lines.map((line, i) => (
            <li key={i} className="flex gap-[6px] [&_u]:underline-offset-[3px]">
              <span aria-hidden="true">·</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      }
    />
  );
}
