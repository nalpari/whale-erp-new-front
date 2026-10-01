import type { ReactNode } from "react";

// Figma 03.프레임_상세의 TABLE. 목록(DataTable)과 달리 한 건을 세로로 펼쳐 보여 준다.
// 왼쪽 라벨 칸은 180 고정, 오른쪽 값 칸이 남는 폭을 먹는다. 줄 높이는 46, 제목 줄은 42다.
export function DetailTable({ title, rows }: { title: string; rows: { label: string; value: ReactNode }[] }) {
  return (
    <div className="w-full">
      <p className="flex h-[42px] items-center rounded-t-[2px] border border-erp-thead-line bg-erp-thead-bg px-[10px] text-[16px] font-medium text-erp-ink">
        {title}
      </p>
      <dl className="flex w-full flex-col">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex w-full">
            <dt className="flex h-[46px] w-[180px] shrink-0 items-center border-b border-l border-erp-thead-line bg-white p-[12px] text-[14px] font-medium text-erp-label">
              {label}
            </dt>
            <dd className="flex h-[46px] min-w-px flex-1 items-center gap-[10px] overflow-hidden border-r border-b border-erp-thead-line bg-white p-[12px] text-[14px] text-erp-ink">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// 한 칸에 값을 여러 개 늘어놓을 때 쓴다. 사이에 Figma 의 11px 세로선을 넣는다.
// 값이 하나면 선이 생기지 않으므로 그대로 써도 된다.
export function DetailValues({ items }: { items: ReactNode[] }) {
  return (
    <>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-[10px] whitespace-nowrap">
          {i > 0 && <span className="h-[11px] w-px bg-[#d9d9d9]" />}
          {item}
        </span>
      ))}
    </>
  );
}
