// 끌어서 순서 바꾸기. 표시 순서는 직접 입력하지 않고, 옮긴 뒤 1부터(쪽이 나뉘면 그 쪽의 시작 번호부터) 다시 매긴다
// — 그래서 겹칠 일이 없다(okf/system.md 「플랫폼 공통코드 관리」).

/** from 자리의 행을 to 자리로 옮기고 표시 순서를 base + 1 부터 다시 매긴다. 옮길 수 없으면 받은 배열을 그대로 돌려준다. */
export function moveRow<T extends { sortOrder: number }>(rows: T[], from: number, to: number, base = 0): T[] {
  if (from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) return rows;
  const next = [...rows];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((row, i) => (row.sortOrder === base + i + 1 ? row : { ...row, sortOrder: base + i + 1 }));
}
