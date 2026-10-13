import type { ComponentProps, Key, ReactNode } from "react";

export type Column<T> = {
  /** 보통은 글자. 전체 선택 체크박스처럼 요소를 둘 수도 있다. */
  header: ReactNode;
  /** Tailwind 너비 클래스(w-[60px] 등). 없으면 남는 폭을 나눠 갖는다. */
  width?: `w-[${number}px]`;
  /** 본문 정렬. 헤더는 항상 가운데다. */
  align?: "left" | "center";
  cell: (row: T) => ReactNode;
};

/** 줄 상태. selected = 고른 줄, added = 저장 전 추가한 입력 줄. 둘 다 표 머리 바탕을 깐다(두 바탕 규칙). */
export type RowState = "selected" | "added";

const ROW_STATE: Record<RowState, string> = {
  selected: "bg-erp-thead-bg",
  added: "bg-erp-thead-bg",
};

// Figma TABLE. 열 정의(columns)와 행(rows)을 받아 목록을 그린다.
// rowState 로 줄 바탕을, rowProps 로 줄 속성(끌기 이벤트 · aria 등)을 준다. 줄 모양(className · style)은 받지 않는다.
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowState,
  rowProps,
  empty = "데이터가 없습니다.",
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => Key;
  rowState?: (row: T) => RowState | undefined;
  rowProps?: (row: T) => Omit<ComponentProps<"tr">, "className" | "style" | "children">;
  empty?: ReactNode;
}) {
  return (
    <table className="w-full table-fixed border-collapse border-x border-erp-thead-line text-[14px]">
      <colgroup>
        {columns.map((c, i) => (
          <col key={i} className={c.width} />
        ))}
      </colgroup>
      <thead>
        <tr className="h-[42px] border-y border-erp-thead-line bg-erp-thead-bg">
          {columns.map((c, i) => (
            <th key={i} scope="col" className="px-[10px] font-medium text-erp-thead-text">
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="text-erp-ink">
        {rows.length === 0 ? (
          <tr className="h-[92px] border-b border-erp-thead-line">
            <td colSpan={columns.length} className="text-center text-erp-muted">
              {empty}
            </td>
          </tr>
        ) : (
          rows.map((row) => {
            const state = rowState?.(row);
            return (
              <tr
                key={rowKey(row)}
                {...rowProps?.(row)}
                className={`h-[46px] border-b border-erp-thead-line ${state ? ROW_STATE[state] : ""}`}
              >
                {columns.map((c, i) => (
                  <td key={i} className={`truncate px-[10px] ${c.align === "left" ? "text-left" : "text-center"}`}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
