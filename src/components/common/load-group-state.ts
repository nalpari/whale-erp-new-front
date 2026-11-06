// LoadGroup 가 「처음 모두 받았는지」를 가르는 순수 로직. 화면(load-group.tsx)은 이 reducer 를 쓰고,
// 테스트는 load-group-state.test.ts 에서 이것만 본다.

export type LoadGroupState = {
  /** 아직 받는 중인 로더 · 영역 수 */
  pending: number;
  /** 묶음 안쪽이 모두 마운트됐다(그룹 자신의 몫이 끝났다) */
  ready: boolean;
  /** 한 번 풀리면 끝 — 그 뒤 다시 받는 것은 묶지 않는다 */
  released: boolean;
};

export type LoadGroupAction = "begin" | "end" | "ready" | "release";

export const INITIAL_LOAD_GROUP: LoadGroupState = { pending: 0, ready: false, released: false };

export function reduceLoadGroup(state: LoadGroupState, action: LoadGroupAction): LoadGroupState {
  if (state.released) return state;
  switch (action) {
    case "begin":
      return { ...state, pending: state.pending + 1 };
    case "end":
      return { ...state, pending: Math.max(0, state.pending - 1) };
    case "ready":
      return state.ready ? state : { ...state, ready: true };
    case "release":
      return { ...state, released: true };
  }
}

/** 모두 끝났나(성공 · 실패 모두). 풀기는 이 값을 본 effect 가 "release" 로 한다 — 개발 모드 effect 두 번 실행에도 중간 0 에서 풀리지 않게 */
export function isSettled(state: LoadGroupState): boolean {
  return !state.released && state.ready && state.pending === 0;
}
