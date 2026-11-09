import type { ComponentProps, Key, ReactNode } from "react";
import { HelpTip } from "./help-tip";
import { ScrollHeadSync } from "./scroll-head-sync";

export type Column<T> = {
  header: string;
  /**
   * 열 이름 옆 i 도움말 문구 — 마우스를 올리면 뜬다(BP 공통코드 관리주체, 2026-10-27). 화면 낭독기는 고정 머리 표(scroll · none)에서는
   * 본문 표의 sr-only 열 이름에 붙여, 그 밖에는 i 버튼의 설명(aria-describedby)으로 읽는다.
   */
  help?: ReactNode;
  /** Tailwind 너비 클래스(w-[60px] 등). 없으면 남는 폭을 나눠 갖는다. */
  width?: `w-[${number}px]`;
  /** 본문 정렬. 헤더는 항상 가운데다. */
  align?: "left" | "center";
  cell: (row: T) => ReactNode;
};

/** 줄 상태. selected = 고른 줄, added = 저장 전 추가한 입력 줄, group = 트리의 1단계(묶음) 줄 — 셋 다 표 머리 바탕을 깐다(두 바탕 규칙).
 * group 은 플랫폼 메뉴 관리 트리가 권한별 메뉴설정 팝업과 같게 1단계를 가르려고 더했다(2026-10-26 사용자 지정).
 * current = 고른 줄을 더 또렷이 — group 줄이 있는 표(메뉴 트리)와 공통코드 그룹 목록이 쓴다(2026-10-27). group 줄이 있는 표에서는 바탕(#f8f9fb)만으로는 1단계 줄과 갈리지 않아 한 단계 어두운 erp-subtle 에 왼쪽 브랜드색 3px 선을
 * 더한다(그림자가 아니라 안쪽 선, 2026-10-26 사용자 지정 · 1팀 동의 2026-10-27). */
export type RowState = "selected" | "added" | "group" | "current";

const ROW_STATE: Record<RowState, string> = {
  selected: "bg-erp-thead-bg",
  added: "bg-erp-thead-bg",
  group: "bg-erp-thead-bg",
  current: "bg-erp-subtle [&>td:first-child]:shadow-[inset_3px_0_0_var(--color-erp-brand)]",
};

/**
 * 열 이름 줄 모양. default = Figma 머리(옅은 회청 바탕 · 500 회색 글자), plain = 흰 바탕 · 600 먹색 글자(묶음 머리 칸 바로 아래에 두는 표,
 * 데모 staff/detail.mjs whiteHead, 2026-10-02 재영), none = 열 이름 줄을 보이지 않고 줄만(데모 detail.mjs TO-DO noHead — 위 테두리를 표가 긋는다).
 * none 도 열 이름은 화면 읽기 도구용으로 남긴다(sr-only thead).
 * subtle = erp-subtle(#f0f1f3) 바탕 · 600 먹색 — 1단계 줄에 #f8f9fb 를 까는 트리 표에서 머리를 그보다 살짝 어둡게 가른다(권한별 메뉴설정 팝업과 같다,
 * DESIGN.md Tables 예외 · 1팀 동의 2026-10-27).
 */
export type TableHeadVariant = "default" | "plain" | "subtle" | "none";

const HEAD_ROW: Record<Exclude<TableHeadVariant, "none">, string> = { default: "bg-erp-thead-bg", plain: "bg-white", subtle: "bg-erp-subtle" };
const HEAD_CELL: Record<Exclude<TableHeadVariant, "none">, string> = {
  default: "font-medium text-erp-thead-text",
  plain: "font-semibold text-erp-ink",
  subtle: "font-semibold text-erp-ink",
};

// Figma TABLE. 열 정의(columns)와 행(rows)을 받아 목록을 그린다.
// rowState 로 줄 바탕을, rowProps 로 줄 속성(끌기 이벤트 · aria 등)을 준다. 줄 모양(className · style)은 받지 않는다.
// headVariant 로 열 이름 줄 모양을 고른다(기본 default).
// scroll 을 켜면 열 이름 줄을 고정하고 그 아래 줄만 스크롤한다 — 부모가 정한 높이를 채우며(flex-1), 스크롤바도 열 이름 줄 아래에서
// 시작한다(공통코드 관리, 2026-10-26 사용자 지정). 머리 · 본문을 두 표로 나누고 둘 다 스크롤바 자리를 비워(scrollbar-gutter) 열이 어긋나지 않는다.
// 부모는 flex 세로 묶음이어야 한다. headVariant none 에는 쓰지 않는다(고정할 머리가 없다).
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowState,
  rowProps,
  empty = "데이터가 없습니다.",
  headVariant = "default",
  scroll = false,
  fillEmpty = false,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => Key;
  rowState?: (row: T) => RowState | undefined;
  rowProps?: (row: T) => Omit<ComponentProps<"tr">, "className" | "style" | "children">;
  empty?: ReactNode;
  headVariant?: TableHeadVariant;
  scroll?: boolean;
  /**
   * 비었을 때 열 이름 줄은 그대로 두고, 그 아래 빈 안내 칸이 감싸는 flex 세로 영역의 남는 높이를 채워 문구를 가운데에 둔다(점포 목록 표 보기, 2026-11-04 사용자 지정).
   * 감싸는 쪽이 flex 세로여야 한다. 고정 머리 표(scroll)와 함께 써도 된다(공통코드 관리, 2026-11-05)
   */
  fillEmpty?: boolean;
}) {
  const table = `w-full table-fixed border-collapse border-x border-erp-thead-line text-[14px] ${headVariant === "none" ? "border-t" : ""}`;
  const cols = (
    <colgroup>
      {columns.map((c, i) => (
        <col key={i} className={c.width} />
      ))}
    </colgroup>
  );
  const head =
    headVariant === "none" ? (
      <thead className="sr-only">
        <tr>
          {columns.map((c, i) => (
            <th key={i} scope="col">
              {srLabel(c)}
            </th>
          ))}
        </tr>
      </thead>
    ) : (
      <thead>
        <tr className={`h-[42px] border-y border-erp-thead-line ${HEAD_ROW[headVariant]}`}>
          {/* 열 이름은 늘 가운데 — 팝업(dialog)처럼 글자 정렬을 물려주는 곳에서는 브라우저 기본 가운데가 풀려 왼쪽으로 붙었다(변경이력 팝업, 2026-11-09 사용자 지정) */}
          {columns.map((c, i) => (
            <th key={i} scope="col" className={`px-[10px] text-center ${HEAD_CELL[headVariant]}`}>
              {headLabel(c, !scroll)}
            </th>
          ))}
        </tr>
      </thead>
    );
  const body = (
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
  );

  // 화면 읽기 도구는 본문 표 하나만 읽는다 — 보이는 머리 표(글자뿐)는 숨기고, 본문 표에 같은 열 이름을 sr-only 로 둬 칸과 열 이름이 이어진다.
  // 최소 높이는 머리 42 + 줄 둘(46 × 2) — 패널이 낮아 모자라면 표가 0 으로 줄어 머리가 아래 형제와 겹치는 대신 바깥 카드가 스크롤한다.
  // 고정 머리 표도 fillEmpty 로 비었으면 아래 빈 칸 모양으로 그린다 — 스크롤할 줄이 없다(공통코드 관리, 2026-11-05 사용자 지정)
  const emptyFill = fillEmpty && rows.length === 0;
  if (scroll && headVariant !== "none" && !emptyFill)
    return (
      <div data-table-scroll className="flex min-h-[134px] flex-1 flex-col">
        {/* 본문을 가로로 밀면 머리도 따라간다(ScrollHeadSync) */}
        <ScrollHeadSync
          head={
            <table className={table}>
              {cols}
              {head}
            </table>
          }
          body={
            <table className={table}>
              {cols}
              <thead className="sr-only">
                <tr>
                  {columns.map((c, i) => (
                    <th key={i} scope="col">
                      {srLabel(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              {body}
            </table>
          }
        />
      </div>
    );
  if (emptyFill)
    return (
      // 남는 높이가 모자라도 머리(42) + 빈 칸(92)은 지킨다 — min-h-0 이면 상자가 0 까지 줄어 아래 쪽 이동과 겹쳤다(리뷰 반영).
      // scroll 표면 data-table-scroll 을 그대로 달아 감싸는 패널(CodePanel)이 이 상자를 줄이지 않는 대상(shrink-0)에서 뺀다
      <div data-table-scroll={scroll || undefined} className="flex min-h-[134px] flex-1 flex-col">
        <table className={table}>
          {cols}
          {head}
        </table>
        <p className="flex min-h-[92px] flex-1 items-center justify-center border-x border-b border-erp-thead-line text-[14px] text-erp-muted">{empty}</p>
      </div>
    );
  return (
    <table className={table}>
      {cols}
      {head}
      {body}
    </table>
  );
}

/**
 * 보이는 열 이름 — 도움말이 있으면 옆에 i. 고정 머리 표(scroll)의 머리 상자가 overflow 를 숨기고 표 칸도 넘치면 잘려 늘 최상위 레이어에 띄운다(floating).
 * 고정 머리 표의 머리는 화면 낭독기에서 숨긴 표라 탭 순서에서도 빼고, 문구는 본문 표의 sr-only 열 이름(srLabel)으로 읽힌다.
 */
function headLabel<T>(c: Column<T>, readable: boolean): ReactNode {
  if (!c.help) return c.header;
  return (
    <span className="inline-flex items-center gap-[4px]">
      {c.header}
      <HelpTip text={c.help} label={`${c.header} 도움말`} floating focusable={readable} />
    </span>
  );
}

/** 화면 낭독기용 열 이름 — 도움말이 있으면 뒤에 붙여 읽힌다. */
const srLabel = <T,>(c: Column<T>): ReactNode =>
  c.help ? (
    <>
      {c.header} ({c.help})
    </>
  ) : (
    c.header
  );
