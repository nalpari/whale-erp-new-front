"use client";

// 근로계약 작성 · 근로자 정보 수정 화면의 칸 아래 유효성 오류(WHALEERP-631, 2026-10-29 재영 공지 1번) — 두 화면이 같이 쓴다.
import { useEffect, type RefObject } from "react";
import { FieldMessage } from "@/components/common";

/**
 * 칸 바로 아래 오류. 문장마다 공통 FieldMessage(다른 화면의 칸 아래 오류와 같은 모양 · role="alert")이고, 묶음 id 를 입력의
 * aria-describedby 로 잇는다.
 */
export function FieldErrors({ id, errors }: { id: string; errors?: readonly string[] }) {
  if (!errors?.length) return null;
  return (
    <div id={id} className="flex flex-col">
      {errors.map((m, i) => (
        <FieldMessage key={m} id={`${id}-${i}`} message={m} />
      ))}
    </div>
  );
}

const CONTROLS = "input:not([type=file]):not([type=hidden]), select, textarea";

/**
 * 오류가 있는 칸의 입력에 aria-invalid(빨간 테두리) · aria-describedby 를 단다. 칸 안 입력은 공통 컴포넌트라(DateField 처럼 aria 속성을
 * 받지 않는 것도 있다) 상자 안에서 찾아 단다 — all 이면 묶음(라디오 · 시각 고르기) 안 입력 모두, 아니면 첫 입력. 칸 안 입력이 다시
 * 만들어져도 다시 달도록 렌더마다 본다. 지울 때는 이 훅이 단 것(describedby 가 errorId)만 지운다 — 다른 컴포넌트가 단 값은 둔다.
 */
export function useInvalid(box: RefObject<HTMLElement | null>, errorId: string, invalid: boolean, all = false) {
  useEffect(() => {
    const root = box.current;
    if (!root) return;
    const controls = all ? Array.from(root.querySelectorAll<HTMLElement>(CONTROLS)) : [root.querySelector<HTMLElement>(CONTROLS)];
    for (const control of controls) {
      if (!control) continue;
      if (invalid) {
        control.setAttribute("aria-invalid", "true");
        control.setAttribute("aria-describedby", errorId);
      } else if (control.getAttribute("aria-describedby") === errorId) {
        control.removeAttribute("aria-invalid");
        control.removeAttribute("aria-describedby");
      }
    }
  });
}
