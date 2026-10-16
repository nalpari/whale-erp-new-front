// 권한 메뉴 등록 팝업의 칸 계산. 화면 없이 node --test 로 바로 돌린다(상대 경로 + .ts, next/* 를 import 하지 않는다).
// 값은 「하위가 없는 메뉴」(잎)마다 네 칸으로 쥔다. 묶음 메뉴(isGroup)의 칸은 서버가 하위에서 다시 정하므로 보내지 않고,
// 화면에서는 아래 잎의 바꿀 수 있는 칸이 모두 켜졌는지로 보인다 — 누르면 그 칸들을 한꺼번에 켜고 끈다.
// 조회 없는 등록 · 수정 · 삭제는 api 가 400 으로 막는다 — 조회를 끄면 나머지를 끄고, 나머지를 켜면 조회를 켠다.

/** api 메뉴 노드에서 이 계산이 보는 칸만 */
export type CellState = { value: boolean; editable: boolean; blockedReason: string | null };
export type MenuNode = {
  menuId: number;
  isGroup: boolean;
  read: CellState;
  create: CellState;
  update: CellState;
  delete: CellState;
  children: MenuNode[];
};
export type Op = "read" | "create" | "update" | "delete";
export const OPS: readonly Op[] = ["read", "create", "update", "delete"];
export type Cells = Record<Op, boolean>;
/** 잎 메뉴 id → 네 칸 */
export type Values = Record<number, Cells>;

/** 묶음이 아닌 메뉴(잎) 모두 — 단계와 상관없이 트리 순서대로 */
export function leavesOf(nodes: MenuNode[]): MenuNode[] {
  return nodes.flatMap((n) => (n.isGroup ? leavesOf(n.children) : [n]));
}

export function initialValues(nodes: MenuNode[]): Values {
  return Object.fromEntries(leavesOf(nodes).map((n) => [n.menuId, { read: n.read.value, create: n.create.value, update: n.update.value, delete: n.delete.value }]));
}

/**
 * 이 칸을 바꿀 수 있는가. api 가 준 editable 에 더해, 바꿀 수 없는 등록 · 수정 · 삭제 칸이 켜진 줄은 조회도 막는다 —
 * 조회만 끄면 「조회 없는 등록 · 수정 · 삭제」, 그 칸까지 끄면 「범위 밖」으로 api 가 어느 쪽이든 400 을 준다.
 */
export function editableOf(leaf: MenuNode, op: Op): boolean {
  if (!leaf[op].editable) return false;
  // 조회가 꺼진 채 바꿀 수 없으면 등록 · 수정 · 삭제도 켤 수 없다 — 켜면 「조회 없는 등록」으로 api 가 400 을 준다
  if (op !== "read") return leaf.read.editable || leaf.read.value;
  return !OPS.some((o) => o !== "read" && leaf[o].value && !leaf[o].editable);
}

/** 잎 하나의 칸을 바꾼다. 바꿀 수 없는 칸은 그대로 둔다. 조회와 나머지 칸의 관계를 함께 맞춘다. */
function setLeaf(values: Values, leaf: MenuNode, op: Op, on: boolean): Values {
  if (!editableOf(leaf, op)) return values;
  // 값은 initialValues 가 트리의 잎마다 만든다. 혹시 비어 있으면 서버 값에서 시작한다(칸 하나만 있는 값이 api 로 나가지 않게)
  const cur = values[leaf.menuId] ?? { read: leaf.read.value, create: leaf.create.value, update: leaf.update.value, delete: leaf.delete.value };
  const next: Cells = { ...cur, [op]: on };
  if (op === "read" && !on) for (const o of OPS) if (o !== "read" && leaf[o].editable) next[o] = false;
  if (op !== "read" && on && leaf.read.editable) next.read = true;
  return { ...values, [leaf.menuId]: next };
}

/** 칸 하나 누름. 묶음이면 아래 잎의 바꿀 수 있는 칸을 모두 같은 값으로. */
export function toggle(values: Values, node: MenuNode, op: Op, on: boolean): Values {
  return (node.isGroup ? leavesOf(node.children) : [node]).reduce((v, leaf) => setLeaf(v, leaf, op, on), values);
}

/** 여러 메뉴(서비스 탭 하나)의 한 칸을 모두 — 머리칸 전체 선택 */
export function toggleAll(values: Values, nodes: MenuNode[], op: Op, on: boolean): Values {
  return leavesOf(nodes).reduce((v, leaf) => setLeaf(v, leaf, op, on), values);
}

/**
 * 묶음 칸 · 머리칸이 보일 상태. 아래 잎의 바꿀 수 있는 칸이 모두 켜졌으면 켜짐.
 * 바꿀 수 있는 칸이 없으면 흐리게(disabled) — 값은 잎이 모두 켜졌는지로 보인다. 아래 잎이 하나도 없을 때만 fallback(묶음이 서버에서 받은 값)을 쓴다.
 */
export function aggregate(values: Values, nodes: MenuNode[], op: Op, fallback = false): { checked: boolean; disabled: boolean } {
  const leaves = leavesOf(nodes);
  const open = leaves.filter((l) => editableOf(l, op));
  if (open.length) return { checked: open.every((l) => values[l.menuId]?.[op]), disabled: false };
  return { checked: leaves.length ? leaves.every((l) => values[l.menuId]?.[op]) : fallback, disabled: true };
}

/** 처음과 달라진 잎만 — api 는 보내지 않은 메뉴를 그대로 둔다 */
export function changedMenus(initial: Values, values: Values): ({ menuId: number } & Cells)[] {
  return Object.entries(values)
    .filter(([id, v]) => OPS.some((o) => initial[Number(id)]?.[o] !== v[o]))
    .map(([id, v]) => ({ menuId: Number(id), ...v }));
}

/** 켜져 있던 칸을 끈 것이 있는가 — 있으면 저장 전에 회수 범위를 미리 본다 */
export function hasRevocation(initial: Values, values: Values): boolean {
  return Object.entries(values).some(([id, v]) => OPS.some((o) => initial[Number(id)]?.[o] && !v[o]));
}

/** 한 줄의 막힌 이유(중복 없이) — 묶음은 아래 잎의 이유까지 모은다 */
export function blockedReasonsOf(node: MenuNode): string[] {
  const nodes = node.isGroup ? [node, ...leavesOf(node.children)] : [node];
  return [...new Set(nodes.flatMap((n) => OPS.map((o) => n[o].blockedReason).filter((r): r is string => !!r)))];
}
