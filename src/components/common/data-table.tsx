import type { Key, ReactNode } from "react";

export type Column<T> = {
  header: string;
  /** Tailwind 너비 클래스(w-[60px] 등). 없으면 남는 폭을 나눠 갖는다. */
  width?: string;
  /** 본문 정렬. 헤더는 항상 가운데다. */
  align?: "left" | "center";
  cell: (row: T) => ReactNode;
};

// Figma TABLE. 열 정의(columns)와 행(rows)을 받아 목록을 그린다.
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty = "데이터가 없습니다.",
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => Key;
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
          rows.map((row) => (
            <tr key={rowKey(row)} className="h-[46px] border-b border-erp-thead-line">
              {columns.map((c, i) => (
                <td key={i} className={`truncate px-[10px] ${c.align === "left" ? "text-left" : "text-center"}`}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
