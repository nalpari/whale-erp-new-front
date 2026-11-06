import type { ReactNode } from "react";

// 느낌표 안내 — 회청 동그라미에 흰 느낌표(14px) + 먹색 13px 500 글자. 입력칸 플레이스홀더(회색)와 갈리게 둔다.
// 문의사항 · 도입문의 상세의 저장 옆 안내에서 만들었고(2026-11-05 사용자 지정), 공지 · FAQ 등록에서도 쓰려고
// 공통으로 올렸다 — 화면마다 따로 그리면 모양이 어긋난다(2026-11-06 사용자 지정).

/** 느낌표 아이콘. risk 면 빨강(erp-off) */
export function GuideIcon({ risk = false, offset = false }: { risk?: boolean; offset?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" className={`shrink-0 ${risk ? "text-erp-off" : "text-erp-brand"} ${offset ? "mt-[3px]" : ""}`}>
      <circle cx="8" cy="8" r="8" fill="currentColor" />
      <rect x="7.3" y="3.6" width="1.4" height="5.6" rx="0.7" fill="#fff" />
      <circle cx="8" cy="11.6" r="0.95" fill="#fff" />
    </svg>
  );
}

/**
 * 느낌표 안내 한 줄(여러 줄이면 둘째 줄은 글자 시작선에 맞춘다). risk — 놓치면 안 되는 안내(탈퇴한 회원의 문의)는 아이콘 · 글자를 빨강으로.
 * inline — 라벨 옆처럼 다른 글자와 한 줄에 붙일 때.
 */
export function GuideNote({ children, risk = false, inline = false }: { children: ReactNode; risk?: boolean; inline?: boolean }) {
  const color = risk ? "text-erp-off" : "text-erp-ink";
  if (inline)
    return (
      <span className={`inline-flex items-center gap-[6px] text-[13px] leading-[1.6] font-medium ${color}`}>
        <GuideIcon risk={risk} />
        <span>{children}</span>
      </span>
    );
  return (
    <p className={`flex items-start gap-[6px] text-[13px] leading-[1.6] font-medium ${color}`}>
      <GuideIcon risk={risk} offset />
      <span>{children}</span>
    </p>
  );
}
