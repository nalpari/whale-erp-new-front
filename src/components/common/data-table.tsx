import type { ComponentProps, Key, ReactNode } from "react";

export type Column<T> = {
  header: string;
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

/**
 * 열 이름 줄 모양. default = Figma 머리(옅은 회청 바탕 · 500 회색 글자), plain = 흰 바탕 · 600 먹색 글자(묶음 머리 칸 바로 아래에 두는 표,
 * 데모 staff/detail.mjs whiteHead, 2026-10-02 재영), none = 열 이름 줄을 보이지 않고 줄만(데모 detail.mjs TO-DO noHead — 위 테두리를 표가 긋는다).
 * none 도 열 이름은 화면 읽기 도구용으로 남긴다(sr-only thead).
 */
export type TableHeadVariant = "default" | "plain" | "none";

const HEAD_ROW: Record<Exclude<TableHeadVariant, "none">, string> = { default: "bg-erp-thead-bg", plain: "bg-white" };
const HEAD_CELL: Record<Exclude<TableHeadVariant, "none">, string> = { default: "font-medium text-erp-thead-text", plain: "font-semibold text-erp-ink" };

// Figma TABLE. 열 정의(columns)와 행(rows)을 받아 목록을 그린다.
// rowState 로 줄 바탕을, rowProps 로 줄 속성(끌기 이벤트 · aria 등)을 준다. 줄 모양(className · style)은 받지 않는다.
// headVariant 로 열 이름 줄 모양을 고른다(기본 default).
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowState,
  rowProps,
  empty = "데이터가 없습니다.",
  headVariant = "default",
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => Key;
  rowState?: (row: T) => RowState | undefined;
  rowProps?: (row: T) => Omit<ComponentProps<"tr">, "className" | "style" | "children">;
  empty?: ReactNode;
  headVariant?: TableHeadVariant;
}) {
  return (
    <table className={`w-full table-fixed border-collapse border-x border-erp-thead-line text-[14px] ${headVariant === "none" ? "border-t" : ""}`}>
      <colgroup>
        {columns.map((c, i) => (
          <col key={i} className={c.width} />
        ))}
      </colgroup>
      {headVariant === "none" ? (
        <thead className="sr-only">
          <tr>
            {columns.map((c, i) => (
              <th key={i} scope="col">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
      ) : (
        <thead>
          <tr className={`h-[42px] border-y border-erp-thead-line ${HEAD_ROW[headVariant]}`}>
            {columns.map((c, i) => (
              <th key={i} scope="col" className={`px-[10px] ${HEAD_CELL[headVariant]}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
      )}
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
