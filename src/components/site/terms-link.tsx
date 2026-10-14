"use client";

import { useRef, type ReactNode } from "react";
import { Button } from "@/components/common";
import { TERMS, type TermsBlock } from "@/lib/terms";

// 약관 전문 팝업. 로그인 화면 아래와 푸터가 같이 쓴다(폭 640px — 2026-10-06 피드백). 데모 public.mjs termsDialog 와 같은 모양.
// 네이티브 <dialog>: Esc·포커스 가두기·바깥 inert 를 브라우저가 맡는다.
const CELL = "border border-erp-thead-line px-[10px] py-[6px] text-left align-top";

function Block({ block: [head, v] }: { block: TermsBlock }) {
  return (
    <section className="flex flex-col gap-[6px]">
      {head && <h3 className="font-semibold">{head}</h3>}
      {Array.isArray(v) ? (
        <ol className="list-decimal pl-[18px]">{v.map((li, i) => <li key={i}>{li}</li>)}</ol>
      ) : typeof v === "string" ? (
        <p>{v}</p>
      ) : (
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>{v.head.map((h) => <th key={h} className={`${CELL} bg-erp-thead-bg font-medium text-erp-thead-text`}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {v.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={CELL}>{c}</td>)}</tr>)}
          </tbody>
        </table>
      )}
    </section>
  );
}

export function TermsLink({ kind, children }: { kind: "use" | "policy"; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const t = TERMS[kind];
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="transition-colors duration-150 ease-out hover:text-erp-ink">
        {children}
      </button>
      {/* #ebebeb 팝업 테두리·그림자는 DESIGN.md Popups 의 값 */}
      <dialog
        ref={ref}
        aria-label={t.title}
        className="m-auto w-[640px] max-w-[calc(100vw-32px)] rounded-[2px] border border-[#ebebeb] bg-white p-[23px] font-erp tracking-[-0.025em] text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40"
      >
        <h2 className="text-[18px] font-semibold">{t.title}</h2>
        <div className="mt-[12px] text-[14px] leading-[1.6]">
          <p className="text-[12px] text-erp-label">{t.ver}</p>
          <div className="mt-[12px] flex max-h-[60dvh] flex-col gap-[12px] overflow-y-auto pr-[10px]">
            {t.body.map((b, i) => <Block key={i} block={b} />)}
          </div>
        </div>
        <div className="mt-[24px] flex justify-end">
          <Button onClick={() => ref.current?.close()}>확인</Button>
        </div>
      </dialog>
    </>
  );
}
