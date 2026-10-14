import type { ReactNode } from "react";

// Field(src/components/common/form.tsx)와 같은 생김새이지만, 라벨에 필수 표시(빨간 *)를 넣고
// 칸 아래 오류 문구(빨간 글씨)를 보여주려고 따로 둔다. Field 의 label 은 string 만 받아 JSX 를 못 넣는다 —
// 공통 컴포넌트는 고치지 않고(DESIGN.md 변경은 1팀과 맞춰야 함) 여기서 조합한다.
// 입력창 아래에는 오류 문구만 보인다 — 안내 placeholder 는 칸 안에 있어 따로 두지 않는다.
export function RequiredField({ label, width, error, children }: { label: string; width?: `w-[${number}px]`; error?: string; children: ReactNode }) {
  return (
    <label className={`flex flex-col justify-center gap-[8px] ${width ?? "min-w-px flex-1"}`}>
      <span className="truncate text-[14px] font-medium text-erp-label">
        {label}
        <span aria-hidden className="text-[#e93737]">
          {" "}
          *
        </span>
        <span className="sr-only">(필수)</span>
      </span>
      {children}
      {error ? (
        <span role="alert" className="text-[13px] text-[#e93737]">
          {error}
        </span>
      ) : null}
    </label>
  );
}
