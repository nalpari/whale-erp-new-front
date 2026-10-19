"use client";

import { useState, type DragEvent, type KeyboardEvent } from "react";
import { moveRow } from "@/lib/reorder";

type Row = { sortOrder: number; added: boolean };

// 표의 줄을 끌어서 옮긴다. 손잡이(≡)를 눌러 끌 때만 줄이 끌린다 — 줄 전체를 늘 끌 수 있게 두면 입력칸 글자를 고를 수 없다.
// 끄는 동안 지나가는 줄 자리로 바로 옮겨 보여 주고, 손잡이에 포커스를 두고 ↑ · ↓ 로도 옮긴다(화면 읽기 프로그램에 알린다).
// 저장 전 추가한 줄은 옮기지 않고 맨 끝에 둔다. 바뀐 순서는 패널 [저장] 때 함께 반영된다.
export function useRowReorder<T extends Row>({
  rows,
  setRows,
  keyOf,
  labelOf,
  base = 0,
}: {
  rows: T[];
  setRows: (rows: T[]) => void;
  keyOf: (row: T) => string;
  labelOf: (row: T) => string;
  /** 쪽이 나뉜 목록이면 이 쪽 앞의 건수. 표시 순서를 base + 1 부터 매긴다. */
  base?: number;
}) {
  const [armed, setArmed] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  /**
   * key 줄을 target 자리(숫자면 저장된 줄 가운데 위치, 문자열이면 그 줄의 자리)로 옮긴다.
   * 옮겼으면 새 위치를, 못 옮겼으면(맨 위 · 맨 아래 · 제자리) -1 을 돌려준다.
   */
  const move = (key: string, target: number | string): number => {
    const saved = rows.filter((r) => !r.added);
    const from = saved.findIndex((r) => keyOf(r) === key);
    const to = typeof target === "number" ? target : saved.findIndex((r) => keyOf(r) === target);
    const next = moveRow(saved, from, to, base);
    if (next === saved) return -1;
    setRows([...next, ...rows.filter((r) => r.added)]);
    return to;
  };

  const handleKeyDown = (row: T) => (e: KeyboardEvent) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const index = rows.filter((r) => !r.added).findIndex((r) => keyOf(r) === keyOf(row));
    const to = move(keyOf(row), index + (e.key === "ArrowUp" ? -1 : 1));
    if (to >= 0) setAnnouncement(`${labelOf(row)}을(를) ${to + 1}번째로 옮겼습니다. 저장해야 반영됩니다.`);
  };

  /** 손잡이 칸. 저장 전 추가한 줄에는 없다. */
  const handle = (row: T) =>
    row.added ? null : (
      <button
        type="button"
        title="끌어서 순서 바꾸기"
        aria-label={`${labelOf(row)} 순서 옮기기, 위 · 아래 화살표`}
        onPointerDown={() => setArmed(keyOf(row))}
        onPointerUp={() => setArmed(null)}
        onKeyDown={handleKeyDown(row)}
        className="cursor-grab px-[6px] text-[16px] text-erp-label transition-colors duration-150 ease-out hover:text-erp-ink active:cursor-grabbing"
      >
        ≡
      </button>
    );

  const rowProps = (row: T) => {
    if (row.added) return {};
    const key = keyOf(row);
    return {
      draggable: armed === key,
      onDragStart: (e: DragEvent) => {
        setDragging(key);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", key);
      },
      onDragOver: (e: DragEvent) => {
        if (!dragging) return;
        e.preventDefault();
        if (dragging !== key) move(dragging, key);
      },
      onDrop: (e: DragEvent) => e.preventDefault(),
      onDragEnd: () => {
        setDragging(null);
        setArmed(null);
      },
    };
  };

  const liveRegion = (
    <p aria-live="polite" className="sr-only">
      {announcement}
    </p>
  );

  return { handle, rowProps, dragging, liveRegion };
}
