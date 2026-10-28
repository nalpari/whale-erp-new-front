// 「처리중」 덮개의 겹친 요청 세기. 요청이 겹치면 마지막 것이 끝날 때 내리고, 떠 있는 동안 문구는 가장 나중에 시작한 요청의 것이다.

export type BusyEntry = { id: number; text: string };
export type ActionKind = "create" | "update" | "delete";
export type ActionOptions = { kind: ActionKind; text?: never } | { text: string; kind?: never };

export const BUSY_TEXT = { create: "등록중입니다", update: "수정중입니다", delete: "삭제중입니다" } as const;
export const BUSY_DEFAULT = "처리중입니다";

/** kind 면 정해진 문구, text 면 그 문구, 둘 다 없으면 「처리중입니다」 */
export function busyTextOf(options?: { kind?: ActionKind; text?: string }): string {
  if (options?.text) return options.text;
  return options?.kind ? BUSY_TEXT[options.kind] : BUSY_DEFAULT;
}

export const pushBusy = (stack: readonly BusyEntry[], entry: BusyEntry): BusyEntry[] => [...stack, entry];
export const removeBusy = (stack: readonly BusyEntry[], id: number): BusyEntry[] => stack.filter((e) => e.id !== id);
/** 덮개에 보일 문구. 비어 있으면 null(내려간 상태) */
export const currentBusyText = (stack: readonly BusyEntry[]): string | null => stack.at(-1)?.text ?? null;

/**
 * 덮개 상태를 담는 작은 외부 저장소. React state 가 아니라 이것을 쓰는 이유: 화면이 useTransition 의 async 콜백 안에서 요청을 부르므로 state 로 두면
 * 그 갱신이 transition 에 묶여 요청이 끝난 뒤에야 그려진다 — useSyncExternalStore 로 읽는 외부 저장소의 갱신은 바로 그려진다.
 * id 는 다시 쓰지 않아, clear 뒤에 옛 요청의 end 가 늦게 와도 새 요청의 덮개를 지우지 못한다.
 */
export function createBusyStore() {
  let stack: BusyEntry[] = [];
  let nextId = 0;
  const listeners = new Set<() => void>();
  const set = (next: BusyEntry[]) => {
    stack = next;
    listeners.forEach((l) => l());
  };
  return {
    /** 덮개를 올리고, 그 요청의 end 를 돌려준다. end 는 여러 번 불러도 같은 요청만 지운다 */
    begin(text: string): () => void {
      const id = nextId++;
      set(pushBusy(stack, { id, text }));
      return () => {
        if (stack.some((e) => e.id === id)) set(removeBusy(stack, id));
      };
    },
    /** 모두 내린다(화면 경로가 바뀔 때) */
    clear() {
      if (stack.length) set([]);
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    text: (): string | null => currentBusyText(stack),
  };
}

/** 요청 하나를 덮개로 감싼다 — begin 이 없으면(덮개 밖) 그대로 부른다. 성공 · 실패 모두 end 를 부르고 오류는 그대로 다시 던진다 */
export function wrapAction<A extends unknown[], R>(
  begin: ((text: string) => () => void) | null | undefined,
  text: string,
  action: (...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
  return async (...args) => {
    const end = begin?.(text);
    try {
      return await action(...args);
    } finally {
      end?.();
    }
  };
}
