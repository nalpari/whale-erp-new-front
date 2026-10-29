import type { ReactNode } from "react";

export type DetailRow = {
  label: string;
  value: ReactNode;
  /** 값이 여러 줄인 줄(주소처럼). 높이를 46 최소로 두고 내용만큼 늘린다 — 이 줄만 고정 높이에서 잘리지 않는다. */
  multiline?: boolean;
};

// Figma 03.프레임_상세의 TABLE. 목록(DataTable)과 달리 한 건을 세로로 펼쳐 보여 준다.
// 왼쪽 라벨 칸은 110 고정(값 칸이 너무 좁다는 피드백으로 180 → 150 → 130 → 110 으로 줄임, 2026-10-20 — DESIGN.md 도
// 맞춰 고쳤다). truncate 가 있어 "미사용 전환일시"처럼 긴 라벨은 말줄임으로 잘릴 수 있다 — 더 줄이면 늘어난다.
// 오른쪽 값 칸이 남는 폭을 먹는다. 줄 높이는 46(multiline 줄만 46 을 최소로 내용만큼 늘어난다), 제목 줄은 42다.
// 라벨·값 사이에는 Figma 대로 세로선을 넣지 않는다. 그래서 테두리를 라벨은 왼쪽+아래, 값은 오른쪽+아래로 나눠
// 제목 줄의 사방 테두리와 겹치지 않게 한다. 마지막 줄만 아래 모서리를 둥글린다.
// action 은 제목 줄(42) 오른쪽 끝에 붙는 버튼(34) — 지금 쓰는 화면은 없다(처음 쓴 BP 마스터 [BP상태변경]은 표 줄로 옮겼다, 2026-10-28 · 작은 버튼은 너무 작았다, 1팀 동의 2026-10-28 · DESIGN.md Tables).
// title 을 주지 않으면 제목 줄 없이 표만 — 위 선 · 위 모서리를 표가 맡는다(권한 그룹 상세, 2026-10-26 사용자 지정 · 데모 role-side.mjs plainTable 과 같다).
export function DetailTable({ title, action, rows }: { title?: ReactNode; action?: ReactNode; rows: DetailRow[] }) {
  return (
    <div className="w-full">
      {title !== undefined && (
        <div className="flex h-[42px] items-center gap-[6px] rounded-t-[2px] border border-erp-thead-line bg-erp-thead-bg px-[10px]">
          <h3 className="flex min-w-0 flex-1 items-center text-[15px] font-semibold text-erp-ink">{title}</h3>
          {action}
        </div>
      )}
      <dl className={`flex w-full flex-col ${title === undefined ? "rounded-t-[2px] border-t border-erp-thead-line" : ""}`}>
        {rows.map(({ label, value, multiline }, i) => {
          const last = i === rows.length - 1;
          const height = multiline ? "min-h-[46px]" : "h-[46px]";
          return (
            <div key={i} className="flex w-full">
              <dt
                className={`flex ${height} w-[110px] shrink-0 items-center truncate border-b border-l border-erp-thead-line bg-white p-[12px] text-[14px] font-medium text-erp-label ${
                  last ? "rounded-bl-[2px]" : ""
                }`}
              >
                {label}
              </dt>
              <dd
                className={`flex ${height} min-w-px flex-1 items-center gap-[10px] overflow-hidden border-r border-b border-erp-thead-line bg-white p-[12px] text-[14px] text-erp-ink ${
                  last ? "rounded-br-[2px]" : ""
                } ${multiline ? "leading-[1.6] break-keep" : ""}`}
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
