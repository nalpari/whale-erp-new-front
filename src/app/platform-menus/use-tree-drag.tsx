"use client";

import { useState, type DragEvent, type KeyboardEvent } from "react";
import { endSpot, judgeMove, placeLabel, spotOf, stepSpot, zoneAt, type Spot, type Step, type Verdict, type Zone } from "@/lib/menu-tree";
import type { MenuNode } from "@/lib/platform-menus";

// 메뉴 트리 끌어 옮기기(목업 system/menus). 손잡이(≡)를 눌러 끌 때만 줄이 끌린다 — 줄을 늘 끌 수 있게 두면 줄 고르기와 겹친다.
// 놓는 자리는 줄 높이 위 30% = 그 앞, 아래 30% = 그 뒤(하위가 있으면 그 안 맨 앞), 가운데 = 그 안 맨 끝, 표 아래 칸 = 최상위 맨 끝.
// 끄는 동안 자리 표시(선 · 상자)와 자리 이름을 보이고, 3단계 초과 · 자기 하위는 놓을 수 없음으로 그린다. 놓으면 onDrop 이 바로 저장한다.
// 손잡이에 포커스를 두고 ↑ · ↓(앞 · 뒤로) · ←(상위로 올리기) · →(위 메뉴 안으로 넣기)로도 같은 규칙으로 옮긴다.
// 공통 표(DataTable)는 줄 모양을 받지 않아, 자리 표시는 표를 감싼 relative 상자(wrapProps 를 단 것) 위에 겹쳐 그린다.

const STEP_KEYS: Partial<Record<string, Step>> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "out", ArrowRight: "into" };

/** 끄는 중 놓을 자리 — 표시 위치(감싼 상자 기준 top · height)와 판정 */
type Over = { target: number | "end"; zone: Zone; spot: Spot; verdict: Verdict; top: number; height: number };

export function useTreeDrag({
  nodes,
  enabled,
  onDrop,
}: {
  nodes: MenuNode[];
  /** 수정 권한 · 작성 중 아님 · 저장 중 아님일 때만 */
  enabled: boolean;
  /** via 는 끌어 놓았는지(drag) 손잡이에서 화살표로 옮겼는지(key) — 키보드면 옮긴 뒤 손잡이로 포커스를 돌려준다 */
  onDrop: (menuId: number, spot: Spot, verdict: Verdict, via: "drag" | "key") => void;
}) {
  const [armed, setArmed] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<Over | null>(null);

  const end = () => {
    setDragging(null);
    setArmed(null);
    setOver(null);
  };

  const place = (target: number | "end", zone: Zone, el: HTMLElement) => {
    const wrap = el.closest("[data-tree-wrap]");
    if (dragging === null || !wrap) return null;
    const spot = target === "end" ? endSpot(nodes) : spotOf(nodes, target, zone);
    if (!spot) return null;
    const verdict = judgeMove(nodes, dragging, spot);
    const box = wrap.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const next: Over = { target, zone, spot, verdict, top: rect.top - box.top, height: rect.height };
    setOver((o) => (o && o.target === next.target && o.zone === next.zone && o.top === next.top ? o : next));
    return next;
  };

  const handleDragOver = (target: number | "end") => (e: DragEvent<HTMLElement>) => {
    if (dragging === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const next = place(target, target === "end" ? "inside" : zoneAt((e.clientY - rect.top) / rect.height), e.currentTarget);
    // 제자리 · 놓을 수 없는 자리도 놓기는 받는다 — 놓으면 거절 문구를 띄운다(목업). 제자리는 아무 일도 하지 않는다.
    if (!next || next.verdict.kind === "noop") return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (target: number | "end") => (e: DragEvent<HTMLElement>) => {
    if (dragging === null) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const zone = target === "end" ? "inside" : zoneAt((e.clientY - rect.top) / rect.height);
    const spot = target === "end" ? endSpot(nodes) : spotOf(nodes, target, zone);
    const menuId = dragging;
    end();
    if (spot) onDrop(menuId, spot, judgeMove(nodes, menuId, spot), "drag");
  };

  const handleKeyDown = (node: MenuNode) => (e: KeyboardEvent) => {
    const step = STEP_KEYS[e.key];
    if (!step || !enabled) return;
    e.preventDefault();
    const spot = stepSpot(nodes, node.menuId, step);
    if (spot) onDrop(node.menuId, spot, judgeMove(nodes, node.menuId, spot), "key");
  };

  /** 손잡이 칸 */
  const handle = (node: MenuNode) => (
    <button
      type="button"
      data-menu-handle={node.menuId}
      title="끌어서 옮기기"
      aria-label={`${node.name} 옮기기 — 위 · 아래 화살표로 앞 · 뒤로, 왼쪽은 상위로 올리기, 오른쪽은 위 메뉴 안으로`}
      aria-disabled={enabled ? undefined : true}
      onPointerDown={() => enabled && setArmed(node.menuId)}
      onPointerUp={() => setArmed(null)}
      // 손잡이를 눌러도 줄이 골라지지 않게 한다(줄 누르기 = 고르기)
      onClick={(e) => e.stopPropagation()}
      onKeyDown={handleKeyDown(node)}
      className={`px-[6px] text-[16px] text-erp-label transition-colors duration-150 ease-out ${enabled ? "cursor-grab hover:text-erp-ink active:cursor-grabbing" : "cursor-not-allowed opacity-40"}`}
    >
      ≡
    </button>
  );

  /** 줄 속성 — 끌기 시작 · 놓을 자리 */
  const rowProps = (node: MenuNode) => ({
    draggable: enabled && armed === node.menuId,
    onDragStart: (e: DragEvent<HTMLTableRowElement>) => {
      setDragging(node.menuId);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(node.menuId));
    },
    onDragOver: handleDragOver(node.menuId),
    onDrop: handleDrop(node.menuId),
    onDragEnd: end,
    "aria-grabbed": dragging === node.menuId ? true : undefined,
  });

  /** 감싼 상자를 벗어나면 자리 표시를 지운다 */
  const wrapProps = {
    "data-tree-wrap": true,
    onDragLeave: (e: DragEvent<HTMLDivElement>) => {
      if (dragging !== null && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(null);
    },
  };

  /** 표 아래 「최상위 맨 끝」 칸 속성 — 끄는 동안만 보인다 */
  const endProps = { onDragOver: handleDragOver("end"), onDrop: handleDrop("end") };

  const label = over ? overLabel(nodes, over) : null;
  /** 자리 표시 — 감싼 상자 안에 겹쳐 그린다. 놓을 수 있으면 상태 파랑, 없으면 상태 빨강(목업과 같은 뜻) */
  const indicator =
    over && label && over.verdict.kind !== "noop" ? (
      <div aria-hidden className="pointer-events-none absolute inset-x-0" style={{ top: over.zone === "inside" ? over.top : over.zone === "before" ? over.top - 1 : over.top + over.height - 1, height: over.zone === "inside" ? over.height : 2 }}>
        {over.zone === "inside" ? (
          <span className={`absolute inset-[2px] rounded-[2px] border ${label.ok ? "border-erp-on bg-erp-on-bg/60" : "border-dashed border-erp-off bg-erp-off-bg/60"}`} />
        ) : (
          <span className={`absolute inset-0 ${label.ok ? "bg-erp-on" : "bg-[repeating-linear-gradient(90deg,var(--color-erp-off)_0_6px,transparent_6px_10px)]"}`} />
        )}
        <span
          className={`absolute right-[8px] rounded-[2px] px-[6px] py-[1px] text-[12px] font-medium whitespace-nowrap text-white ${label.ok ? "bg-erp-on" : "bg-erp-off"} ${
            over.zone === "inside" ? "top-1/2 -translate-y-1/2" : "-top-[10px]"
          }`}
        >
          {label.text}
        </span>
      </div>
    ) : null;

  return { wrapProps, dragging, hint: dragging === null ? null : (label?.hint ?? "놓을 자리를 고르세요 — 줄 위 · 아래 끝은 앞 · 뒤로, 가운데는 그 안으로"), handle, rowProps, endProps, indicator };
}

/** 자리 이름 — 놓을 수 있으면 「‘시스템관리’ 아래 3번째 · 2단계」, 없으면 이유 */
function overLabel(nodes: MenuNode[], over: Over): { ok: boolean; text: string; hint: string } | null {
  const v = over.verdict;
  if (v.kind === "noop") return null;
  if (v.kind === "cycle") return { ok: false, text: "놓을 수 없음 · 자기 하위", hint: "메뉴를 자기 하위 메뉴 아래로 옮길 수 없습니다." };
  if (v.kind === "depth") return { ok: false, text: `놓을 수 없음 · ${v.deep}단계가 됨`, hint: "메뉴는 최대 3단계까지만 만들 수 있습니다." };
  const where = `${placeLabel(nodes, over.spot.parentMenuId, v.index + 1)} · ${v.level}단계`;
  return { ok: true, text: where, hint: `놓으면 ${where}` };
}
