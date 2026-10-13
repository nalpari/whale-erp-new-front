"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/common";
import type { TermsDoc, TermsSection } from "./terms";

// [ ] 로 감싼 자리는 회사가 아직 정하지 못한 값이다 — 약관 문구 안에서만 빨갛게 눈에 띄게 한다(docs/mockup/assets/auth.js 의 markTBD 와 같다).
function markTbd(text: string): ReactNode {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, i) =>
    part.startsWith("[") && part.endsWith("]") ? (
      <span key={i} className="text-[#e93737]">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

const CELL = "border border-erp-thead-line px-[10px] py-[6px] text-left align-top";

function TermsSectionBody({ section }: { section: TermsSection }) {
  const [heading, content] = section;
  return (
    <section className="flex flex-col gap-[6px]">
      {heading ? <h3 className="font-semibold">{heading}</h3> : null}
      {Array.isArray(content) ? (
        <ol className="list-decimal pl-[18px]">
          {content.map((li, i) => (
            <li key={i}>{markTbd(li)}</li>
          ))}
        </ol>
      ) : typeof content === "object" ? (
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {content.head.map((h) => (
                <th key={h} className={`${CELL} bg-erp-thead-bg font-medium text-erp-thead-text`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {content.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className={CELL}>
                    {markTbd(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>{markTbd(content)}</p>
      )}
    </section>
  );
}

// 약관 전문 확인창. docs/demo/src/public.mjs 의 termsDialog 와 같다 — 네이티브 <dialog>, 폭은 카드(860px)에 맞춘다.
export function TermsDialog({ open, onClose, doc }: { open: boolean; onClose: () => void; doc: TermsDoc }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // dialog 자체(backdrop)를 눌렀을 때만 닫는다 — dialog 는 p-0 이고 여백은 안쪽 div 가 갖게 해서,
        // 안쪽 여백을 눌러도 e.target 이 dialog 가 되지 않게 한다(2026-10-12 코드리뷰 — 패딩 안쪽을 눌러도 닫히던 버그).
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[860px] max-w-[calc(100vw-32px)] rounded-[2px] border border-[#ebebeb] bg-white p-0 font-erp tracking-[-0.025em] text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40"
    >
      <div className="p-[23px]">
        <h2 className="text-[18px] font-semibold">{doc.title}</h2>
        <p className="text-[12px] text-erp-label">{doc.ver}</p>
        <div className="mt-[12px] flex max-h-[60dvh] flex-col gap-[12px] overflow-y-auto pr-[10px]">
          {doc.body.map((section, i) => (
            <TermsSectionBody key={i} section={section} />
          ))}
        </div>
        <div className="mt-[24px] flex justify-end gap-[6px]">
          <Button onClick={onClose}>확인</Button>
        </div>
      </div>
    </dialog>
  );
}
