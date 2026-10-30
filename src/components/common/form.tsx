import Image from "next/image";
import type { ComponentProps, ReactNode } from "react";
import { FIELD, FIELD_BOX } from "./theme";

export function TextField(props: Omit<ComponentProps<"input">, "className" | "style">) {
  return <input {...props} className={FIELD} />;
}

// 여러 줄 입력. 높이는 rows 로 정한다 — 8줄 × (14 × 1.6) + 위아래 12 + 테두리 1 ≈ 205 로 Figma 점포 소개(204)와 맞는다.
// grow 를 주면 한 줄 입력칸(TextField)과 같은 34px 에서 시작해 Enter 로 줄을 더한 만큼 늘어난다(최대 grow 줄, 넘으면 칸 안에서 스크롤) —
// 여백 · 줄 높이를 한 줄 칸에 맞춘다: 22 + 위아래 5 + 테두리 1 = 34(BP 휴일 설명, 2026-10-30 사용자 지정)
export function Textarea({ rows = 8, grow, ...props }: Omit<ComponentProps<"textarea">, "className" | "style"> & { grow?: number }) {
  if (grow) {
    const lines = Math.min(Math.max(String(props.value ?? "").split("\n").length, 1), grow);
    return <textarea {...props} rows={lines} className={`${FIELD_BOX} resize-none px-[10px] py-[5px] leading-[22px]`} />;
  }
  return <textarea {...props} rows={rows} className={`${FIELD_BOX} resize-none px-[16px] py-[12px] leading-[1.6]`} />;
}

export function Select(props: Omit<ComponentProps<"select">, "className" | "style">) {
  return (
    <select
      {...props}
      className={`${FIELD} appearance-none bg-[url(/icons/select-arrow.svg)] bg-[length:30px_30px] bg-[position:right_center] bg-no-repeat pr-[30px]`}
    />
  );
}

const MARK_MOTION =
  "pointer-events-none relative scale-75 opacity-0 transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] peer-checked:scale-100 peer-checked:opacity-100 motion-reduce:scale-100";

const DASH_MOTION =
  "pointer-events-none scale-75 opacity-0 transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] peer-indeterminate:scale-100 peer-indeterminate:opacity-100 motion-reduce:scale-100";

// Figma Form_check. 하루에도 여러 번 누르는 컨트롤이라 짧고 옅게만 움직인다:
// 칸 색은 150ms 로 짧게 바뀌고, 체크 표시는 살짝 커지며 나타난다.
// indeterminate 는 「일부만 선택」(–) — HTML 속성이 아니라 DOM 값이라 ref 로 단다. 화면 읽기는 「혼합」으로 읽는다.
export function Checkbox({
  label,
  indeterminate = false,
  ...props
}: { label: string; indeterminate?: boolean } & Omit<ComponentProps<"input">, "type" | "className" | "style" | "ref">) {
  return (
    <label className="flex items-center gap-[8px] text-[14px] text-erp-ink">
      <span className="relative grid size-[20px] shrink-0 place-items-center">
        <input
          {...props}
          ref={(el) => {
            if (el) el.indeterminate = indeterminate;
          }}
          type="checkbox"
          className="peer absolute inset-0 appearance-none rounded-[2px] border border-erp-field-line bg-white transition-[background-color,border-color] duration-150 ease-out checked:border-erp-brand checked:bg-erp-brand indeterminate:border-erp-brand indeterminate:bg-erp-brand"
        />
        <Image src="/icons/check.svg" alt="" width={12} height={9} className={`${MARK_MOTION} peer-indeterminate:hidden`} />
        <span className={`absolute h-[2px] w-[10px] rounded-[1px] bg-white ${DASH_MOTION}`} />
      </span>
      {label}
    </label>
  );
}

// Figma Form_radio. 체크박스와 같은 방식으로, 선택되면 가운데 점이 살짝 커지며 나타난다.
export function Radio({ label, ...props }: { label: string } & Omit<ComponentProps<"input">, "type" | "className" | "style">) {
  return (
    <label className="flex items-center gap-[8px] text-[14px] text-erp-ink">
      <span className="relative grid size-[20px] shrink-0 place-items-center">
        <input
          {...props}
          type="radio"
          className="peer absolute inset-0 appearance-none rounded-full border border-erp-field-line bg-white transition-[border-color] duration-150 ease-out checked:border-erp-brand"
        />
        <span className={`size-[8px] rounded-full bg-erp-brand ${MARK_MOTION}`} />
      </span>
      {label}
    </label>
  );
}

// 필수 표시 *. #e93737 은 DESIGN.md 의 위험 글자색으로 토큰이 없어 직접 적는다(데모 등록 · 수정 패널과 같다).
// 화면 읽기는 별표를 읽지 않고, 입력칸의 required · aria-required 로 필수를 안다.
export function RequiredMark() {
  return (
    <span aria-hidden className="ml-[2px] text-[#e93737]">
      *
    </span>
  );
}

// Figma Form. 라벨과 입력칸 한 쌍. 라벨을 감싸므로 라벨을 눌러도 입력칸이 잡힌다(입력칸이 하나일 때만 쓴다).
// width 로 고정폭(w-[120px] 등)을 주고, 없으면 한 줄에서 남는 폭을 나눠 가진다. required 면 라벨 뒤에 붉은 * 를 붙인다 — 별표만 붙이므로, 화면 낭독기가 알도록 입력칸에 required 나 aria-required 를 따로 단다.
// 폭 말고 다른 클래스는 받지 않는다 — 여기로 색이나 여백이 새면 폼 줄마다 모양이 달라진다.
export function Field({
  label,
  width,
  required,
  children,
}: {
  label: string;
  width?: `w-[${number}px]`;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={`flex flex-col justify-center gap-[8px] ${width ?? "min-w-px flex-1"}`}>
      <span className="truncate text-[14px] font-medium text-erp-label">
        {label}
        {required && <RequiredMark />}
      </span>
      {children}
    </label>
  );
}

// Field 를 한 줄에 나란히 둔다.
export function FormRow({ children }: { children: ReactNode }) {
  return <div className="flex w-full gap-[6px]">{children}</div>;
}

// Figma Row group. 제목과 그 아래 입력칸 카드. title 은 보통 글자 하나지만, 필수 표시 같은 꾸민 안내문구가
// 섞일 수 있어 ReactNode 로 받는다(2026-10-12 코드리뷰 — 화면 변화 없는 타입 변경).
export function FormGroup({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="flex w-full flex-col gap-[10px]">
      <h3 className="text-[15px] font-semibold text-erp-ink">{title}</h3>
      {/* flex-1 로 둬 나란한 두 묶음이 그리드에서 같은 선에 맞춰 늘어나게 둔다(부모가 stretch 일 때만 뜻이 있다) */}
      <div className="flex flex-1 flex-col gap-[18px] rounded-[2px] border border-erp-panel-line bg-white px-[16px] py-[20px]">{children}</div>
    </section>
  );
}
