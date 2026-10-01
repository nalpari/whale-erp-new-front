import type { ReactNode } from "react";

export type DetailRow = { label: string; value: ReactNode };

// Figma 03.프레임_상세의 TABLE. 목록(DataTable)과 달리 한 건을 세로로 펼쳐 보여 준다.
// 왼쪽 라벨 칸은 180 고정, 오른쪽 값 칸이 남는 폭을 먹는다. 줄 높이는 46, 제목 줄은 42다.
// 라벨·값 사이에는 Figma 대로 세로선을 넣지 않는다. 그래서 테두리를 라벨은 왼쪽+아래, 값은 오른쪽+아래로 나눠
// 제목 줄의 사방 테두리와 겹치지 않게 한다. 마지막 줄만 아래 모서리를 둥글린다.
export function DetailTable({ title, rows }: { title: string; rows: DetailRow[] }) {
  return (
    <div className="w-full">
      <h3 className="flex h-[42px] items-center rounded-t-[2px] border border-erp-thead-line bg-erp-thead-bg px-[10px] text-[16px] font-medium text-erp-ink">
        {title}
      </h3>
      <dl className="flex w-full flex-col">
        {rows.map(({ label, value }, i) => {
          const last = i === rows.length - 1;
          return (
            <div key={i} className="flex w-full">
              <dt
                className={`flex h-[46px] w-[180px] shrink-0 items-center truncate border-b border-l border-erp-thead-line bg-white p-[12px] text-[14px] font-medium text-erp-label ${
                  last ? "rounded-bl-[2px]" : ""
                }`}
              >
                {label}
              </dt>
              <dd
                className={`flex h-[46px] min-w-px flex-1 items-center gap-[10px] overflow-hidden border-r border-b border-erp-thead-line bg-white p-[12px] text-[14px] text-erp-ink ${
                  last ? "rounded-br-[2px]" : ""
                }`}
              >
                {value}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

// 한 칸에 값을 여러 개 늘어놓을 때 쓴다. 사이에 Figma 의 11px 세로선을 넣는다.
// 값이 하나면 선이 생기지 않으므로 그대로 써도 된다.
// 선 색 #d9d9d9 는 Figma 에서 여기에만 나온다. erp-divider(#eeeeee)로 바꾸면 값 사이가 거의 안 보인다.
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
