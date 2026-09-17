import Image from "next/image";
import type { ComponentProps } from "react";
import { FIELD } from "./theme";

export function Select(props: Omit<ComponentProps<"select">, "className">) {
  return (
    <select
      {...props}
      className={`${FIELD} appearance-none bg-[url(/icons/select-arrow.svg)] bg-[length:30px_30px] bg-[position:right_center] bg-no-repeat pr-[30px]`}
    />
  );
}

// 네이티브 달력 버튼은 투명하게 남겨 클릭 영역으로만 쓰고, 보이는 아이콘은 Figma 원본이다.
export function DateField(props: Omit<ComponentProps<"input">, "type" | "className">) {
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
export function Checkbox({ label, ...props }: { label: string } & Omit<ComponentProps<"input">, "type" | "className">) {
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
export function Radio({ label, ...props }: { label: string } & Omit<ComponentProps<"input">, "type" | "className">) {
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
