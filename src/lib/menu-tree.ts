// 플랫폼 메뉴 관리의 트리 계산 — 표로 펼치기, 놓을 자리, 옮기기 판정, 새 메뉴 자리. 화면 없이 node --test 로 바로 돌린다
// (상대 경로 + .ts, next/* 를 import 하지 않는다). 판정 규칙은 api platform-menu-rules.ts 의 planMove 와 같다 — 화면은 끄는 동안
// 놓을 수 없는 자리를 미리 알리고, 실제로 막는 것은 api 다(놓으면 바로 저장된다).

/** 메뉴는 서비스 단위로 최대 3단계(F-CWWQUR · DB CHECK menus_depth_range) */
export const MAX_MENU_DEPTH = 3;

/** 이 계산이 보는 칸만 — api 트리 노드(PlatformMenuNodeResponseDto)가 이 모양을 갖는다 */
export type TreeNode = { menuId: number; name: string; depth: number; children: TreeNode[] };

/** 표 한 줄 — 노드와 그 상위 · 형제 안의 자리(0부터) */
export type FlatRow<N extends TreeNode> = { node: N; parent: N | null; index: number };

/** 트리를 위에서부터 펼친다 — 표는 이 순서로 그리고, 들여쓰기는 node.depth 로 한다 */
export function flatten<N extends TreeNode>(nodes: N[]): FlatRow<N>[] {
  const rows: FlatRow<N>[] = [];
  const walk = (list: N[], parent: N | null) =>
    list.forEach((node, index) => {
      rows.push({ node, parent, index });
      walk(node.children as N[], node);
    });
  walk(nodes, null);
  return rows;
}

export function findRow<N extends TreeNode>(nodes: N[], menuId: number): FlatRow<N> | undefined {
  return flatten(nodes).find((r) => r.node.menuId === menuId);
}

/** 자신부터 가장 깊은 하위까지의 단계 수 — 잎은 1 */
export const heightOf = (node: TreeNode): number => 1 + Math.max(0, ...node.children.map(heightOf));

/** 함께 움직이는 하위 메뉴 수 */
export const descendantCountOf = (node: TreeNode): number => node.children.reduce((n, c) => n + 1 + descendantCountOf(c), 0);

const contains = (node: TreeNode, menuId: number): boolean => node.menuId === menuId || node.children.some((c) => contains(c, menuId));

/** 놓을 자리 — 새 상위(null 이면 최상위) 아래 index 번째. index 는 옮기기 전 형제 목록 기준이다(옮기는 메뉴도 센다). */
export type Spot = { parentMenuId: number | null; index: number };

/** 줄 높이 안에서 놓은 위치 — 위 30% 는 그 앞, 아래 30% 는 그 뒤(하위가 있으면 그 안 맨 앞), 가운데는 그 안 맨 끝(목업 targetAt) */
export type Zone = "before" | "inside" | "after";
export const zoneAt = (ratio: number): Zone => (ratio < 0.3 ? "before" : ratio > 0.7 ? "after" : "inside");

export function spotOf<N extends TreeNode>(nodes: N[], targetId: number, zone: Zone): Spot | null {
  const row = findRow(nodes, targetId);
  if (!row) return null;
  const parentMenuId = row.parent?.menuId ?? null;
  if (zone === "before") return { parentMenuId, index: row.index };
  if (zone === "inside") return { parentMenuId: targetId, index: row.node.children.length };
  return row.node.children.length ? { parentMenuId: targetId, index: 0 } : { parentMenuId, index: row.index + 1 };
}

/** 표 맨 아래 칸 — 최상위 맨 끝 */
export const endSpot = (nodes: TreeNode[]): Spot => ({ parentMenuId: null, index: nodes.length });

/**
 * 옮기면 어떻게 되는가. noop 은 제자리, cycle 은 자기 자신이나 하위 아래, depth 는 3단계 초과(하위 높이 포함) — 셋은 저장하지 않는다.
 * ok 의 index 는 api 에 보낼 자리(옮기는 메뉴를 뺀 형제 기준), level 은 옮긴 메뉴의 새 단계, deep 은 그 하위까지의 가장 깊은 단계.
 */
export type Verdict =
  | { kind: "noop" }
  | { kind: "cycle" }
  | { kind: "depth"; level: number; deep: number }
  | { kind: "ok"; level: number; deep: number; index: number };

export function judgeMove<N extends TreeNode>(nodes: N[], menuId: number, spot: Spot): Verdict {
  const moving = findRow(nodes, menuId);
  if (!moving) return { kind: "noop" };
  if (spot.parentMenuId !== null && contains(moving.node, spot.parentMenuId)) return { kind: "cycle" };
  const sameParent = spot.parentMenuId === (moving.parent?.menuId ?? null);
  if (sameParent && (spot.index === moving.index || spot.index === moving.index + 1)) return { kind: "noop" };
  const parent = spot.parentMenuId === null ? null : findRow(nodes, spot.parentMenuId)?.node;
  const level = (parent ? parent.depth : 0) + 1;
  const deep = level + heightOf(moving.node) - 1;
  if (deep > MAX_MENU_DEPTH) return { kind: "depth", level, deep };
  return { kind: "ok", level, deep, index: sameParent && spot.index > moving.index ? spot.index - 1 : spot.index };
}

/**
 * 키보드로 한 칸 — 위로(앞 형제 앞) · 아래로(뒤 형제 뒤) · 상위로 올리기(상위 바로 뒤) · 위 메뉴 안으로 넣기(앞 형제 안 맨 끝).
 * 갈 곳이 없으면 null. 끌어 놓기와 같은 judgeMove 로 판정한다(목업 steps).
 */
export type Step = "up" | "down" | "out" | "into";
export function stepSpot<N extends TreeNode>(nodes: N[], menuId: number, step: Step): Spot | null {
  const rows = flatten(nodes);
  const row = rows.find((r) => r.node.menuId === menuId);
  if (!row) return null;
  const siblings = row.parent ? row.parent.children : nodes;
  const parentMenuId = row.parent?.menuId ?? null;
  const prev = siblings[row.index - 1];
  if (step === "up") return prev ? { parentMenuId, index: row.index - 1 } : null;
  if (step === "down") return row.index + 1 < siblings.length ? { parentMenuId, index: row.index + 2 } : null;
  if (step === "into") return prev ? { parentMenuId: prev.menuId, index: prev.children.length } : null;
  if (!row.parent) return null;
  const up = rows.find((r) => r.node.menuId === parentMenuId)!;
  return { parentMenuId: up.parent?.menuId ?? null, index: up.index + 1 };
}

/**
 * 새 메뉴 자리(목업 · SYSTEM-7) — 고른 것이 없으면 최상위 맨 끝, 1 · 2단계를 고르면 그 안 맨 끝, 3단계를 고르면 그 상위 안 맨 끝.
 * order 는 새 상위 아래의 순서(1부터), afterId 는 표에서 「작성 중」 줄을 그 뒤에 둘 줄(새 상위의 마지막 자손 — 없으면 상위 자신).
 */
export function createPlacement<N extends TreeNode>(nodes: N[], selectedId: number | null): { parent: N | null; depth: number; order: number; afterId: number | null } {
  const row = selectedId === null ? undefined : findRow(nodes, selectedId);
  const parent = !row ? null : row.node.depth < MAX_MENU_DEPTH ? row.node : row.parent;
  const siblings = (parent ? parent.children : nodes) as N[];
  let last: TreeNode | null = parent;
  for (let list = siblings as TreeNode[]; list.length; list = last!.children) last = list[list.length - 1];
  return { parent, depth: parent ? parent.depth + 1 : 1, order: siblings.length + 1, afterId: last?.menuId ?? null };
}

/** 최상위부터 그 메뉴까지의 노출 메뉴명 — 상위 메뉴 칸의 「점포관리 › 근로계약 관리」 */
export function pathNamesOf(nodes: TreeNode[], menuId: number): string[] {
  const walk = (list: TreeNode[], trail: string[]): string[] | null => {
    for (const n of list) {
      const here = [...trail, n.name];
      if (n.menuId === menuId) return here;
      const found = walk(n.children, here);
      if (found) return found;
    }
    return null;
  };
  return walk(nodes, []) ?? [];
}

/** 자리 이름 — 「‘시스템관리’ 아래 3번째」 · 「최상위 3번째」(position 은 1부터) */
export function placeLabel(nodes: TreeNode[], parentMenuId: number | null, position: number): string {
  const parent = parentMenuId === null ? undefined : findRow(nodes, parentMenuId)?.node;
  return `${parent ? `‘${parent.name}’ 아래` : "최상위"} ${position}번째`;
}
