import Image from "next/image";
import type { ComponentProps, ReactNode } from "react";
import { FIELD, FIELD_BOX } from "./theme";

export function TextField(props: Omit<ComponentProps<"input">, "className" | "style">) {
  return <input {...props} className={FIELD} />;
}

// 여러 줄 입력. 높이는 rows 로 정한다 — 8줄 × (14 × 1.6) + 위아래 12 + 테두리 1 ≈ 205 로 Figma 점포 소개(204)와 맞는다.
export function Textarea({ rows = 8, ...props }: Omit<ComponentProps<"textarea">, "className" | "style">) {
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

// 네이티브 달력 버튼은 투명하게 남겨 클릭 영역으로만 쓰고, 보이는 아이콘은 Figma 원본이다.
export function DateField(props: Omit<ComponentProps<"input">, "type" | "className" | "style">) {
  return (
    <input
      {...props}
      type="date"
      className={`${FIELD} bg-[url(/icons/calendar.svg)] bg-[length:30px_30px] bg-[position:right_center] bg-no-repeat [&::-webkit-calendar-picker-indicator]:opacity-0`}
    />
  );
}

const MARK_MOTION =
  "pointer-events-none relative scale-75 opacity-0 transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] peer-checked:scale-100 peer-checked:opacity-100 motion-reduce:scale-100";

// Figma Form_check. 하루에도 여러 번 누르는 컨트롤이라 짧고 옅게만 움직인다:
// 칸 색은 150ms 로 짧게 바뀌고, 체크 표시는 살짝 커지며 나타난다.
export function Checkbox({ label, ...props }: { label: string } & Omit<ComponentProps<"input">, "type" | "className" | "style">) {
  return (
    <label className="flex items-center gap-[8px] text-[14px] text-erp-ink">
      <span className="relative grid size-[20px] shrink-0 place-items-center">
        <input
          {...props}
          type="checkbox"
          className="peer absolute inset-0 appearance-none rounded-[2px] border border-erp-field-line bg-white transition-[background-color,border-color] duration-150 ease-out checked:border-erp-brand checked:bg-erp-brand"
        />
        <Image src="/icons/check.svg" alt="" width={12} height={9} className={MARK_MOTION} />
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

// Figma Form. 라벨과 입력칸 한 쌍. 라벨을 감싸므로 라벨을 눌러도 입력칸이 잡힌다(입력칸이 하나일 때만 쓴다).
// width 로 고정폭(w-[120px] 등)을 주고, 없으면 한 줄에서 남는 폭을 나눠 가진다.
// 폭 말고 다른 클래스는 받지 않는다 — 여기로 색이나 여백이 새면 폼 줄마다 모양이 달라진다.
export function Field({ label, width, children }: { label: string; width?: `w-[${number}px]`; children: ReactNode }) {
  return (
    <label className={`flex flex-col justify-center gap-[8px] ${width ?? "min-w-px flex-1"}`}>
      <span className="truncate text-[14px] font-medium text-erp-label">{label}</span>
      {children}
    </label>
  );
}

// Field 를 한 줄에 나란히 둔다.
export function FormRow({ children }: { children: ReactNode }) {
  return <div className="flex w-full gap-[6px]">{children}</div>;
}

// Figma Row group. 제목과 그 아래 입력칸 카드.
export function FormGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex w-full flex-col gap-[10px]">
      <h3 className="text-[15px] font-semibold text-erp-ink">{title}</h3>
      <div className="flex flex-col gap-[18px] rounded-[2px] border border-erp-panel-line bg-white px-[16px] py-[20px]">{children}</div>
    </section>
  );
}
