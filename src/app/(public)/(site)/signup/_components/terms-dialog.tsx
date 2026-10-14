"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { SUBMIT } from "@/app/design/guest/guest-form";
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

const CELL = "border border-[#ebebeb] px-[12px] py-[8px] text-left align-top";

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
        <table className="w-full border-collapse text-[14px]">
          <thead className="bg-guest-card text-guest-navy">
            <tr>
              {content.head.map((h) => (
                <th key={h} className={`${CELL} font-medium`}>
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

// 약관 전문 확인창. 네이티브 <dialog> 라 Esc 닫기와 바깥 포커스 막기는 브라우저가 맡는다. 1팀 비로그인
// 폼 규격을 쓴다 — 폭·모서리·글자색은 design/guest/sign-up 의 TermsDialog 와 같다(2026-10-14).
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
      aria-label={doc.title}
      onClose={onClose}
      onClick={(e) => {
        // dialog 자체(backdrop)를 눌렀을 때만 닫는다 — 안쪽 여백을 눌러도 e.target 이 dialog 가 되지 않게 한다.
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[860px] max-w-[calc(100vw-32px)] rounded-[6px] bg-white p-[32px] text-guest-ink backdrop:bg-black/40"
    >
      <h2 className="text-[22px] leading-[1.4] font-bold">{doc.title}</h2>
      <p className="mt-[4px] text-[14px] text-[#767676]">{doc.ver}</p>
      <div className="mt-[20px] flex max-h-[60dvh] flex-col gap-[16px] overflow-y-auto pr-[10px] text-[15px] leading-[1.6]">
        {doc.body.map((section, i) => (
          <TermsSectionBody key={i} section={section} />
        ))}
      </div>
      {/* 회원가입 form 안에 있어 method="dialog" form 을 겹칠 수 없다. 단추가 직접 닫는다. */}
      <div className="mt-[24px] flex justify-end">
        <button type="button" onClick={onClose} className={`w-[180px] ${SUBMIT}`}>
          확인
        </button>
      </div>
    </dialog>
  );
}
