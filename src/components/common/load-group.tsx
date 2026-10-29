"use client";

import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { WHALE_LOADER_BACKGROUND, WHALE_LOADER_TEXT_COLOR, WhaleLoader } from "./whale-loader";
import { INITIAL_LOAD_GROUP, isSettled, reduceLoadGroup } from "./load-group-state";

// 영역이 여럿인 화면의 「처음 들어올 때 모두 받은 뒤 한 번에」 묶음.
// - 안쪽 로더(useLoad, lib/use-load.ts)와 서버 영역(LoadGroupArea)이 받는 중인 수를 센다. 모두 끝나면(성공 · 실패 모두) 한 번 풀린다.
// - 풀린 뒤의 key 변경 · 다시 받기는 묶지 않는다(그 영역만 다시 받는다). 묶음 밖에서 로더를 쓰면 묶음이 없는 것과 같다.
// - timeoutMs(기본 15초)가 지나면 남은 로더가 있어도 푼다 — 늦는 영역은 원래대로 영역 안 로딩을 보인다.
// - 묶여 있는 동안 children 은 마운트해 두되 숨기고(hidden · inert · aria-busy) 그 자리에 fallback 을 보인다.

type Ctx = { begin: () => void; end: () => void };
const LoadGroupContext = createContext<Ctx | null>(null);

/**
 * 공통 로딩 — 놓인 자리(부모의 남는 영역 전체)를 흰색 → 연한 하늘색 원형 그라데이션으로 채우고 가운데에 네모 파도 위로 뛰는 고래(WhaleLoader)와 문구를 둔다.
 * 큰 자리(화면 · 묶음 전체 · 처리중 덮개)에만 쓴다 — 작은 영역에는 고래 로딩을 쓰지 않는다. 그림은 aria-hidden, 문구가 role="status" 로 읽힌다.
 * 받으면 바로 걷는다(최소 표시 시간 없음). 움직임을 줄인 설정이면 고래는 점프 없이 떠 있고 파도만 천천히 움직인다.
 */
export function LoadingNotice({ text = "로딩중입니다" }: { text?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{ background: WHALE_LOADER_BACKGROUND, color: WHALE_LOADER_TEXT_COLOR }}
      className="flex min-h-[120px] flex-1 flex-col items-center justify-center gap-[26px] px-[16px] text-[17px] font-bold tracking-[-0.02em] max-[480px]:text-[15px]"
    >
      <WhaleLoader />
      {text}
    </div>
  );
}

/** 안쪽 마운트가 끝난 뒤(이 컴포넌트의 effect 는 앞선 형제들의 effect 뒤에 돈다) 한 번 알린다 */
function Probe({ onMount }: { onMount: () => void }) {
  useEffect(onMount, [onMount]);
  return null;
}

/**
 * @param fallback 묶여 있는 동안 children 자리에 보일 것. 기본은 LoadingNotice(고래 파도 그림 + 「로딩중입니다」, 스켈레톤은 아직 없다)
 * @param timeoutMs 이 시간이 지나면 남은 로더가 있어도 푼다
 */
export function LoadGroup({
  children,
  fallback = <LoadingNotice />,
  timeoutMs = 15000,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  timeoutMs?: number;
}) {
  const [state, dispatch] = useReducer(reduceLoadGroup, INITIAL_LOAD_GROUP);
  const settled = isSettled(state);
  // 타이머가 부를 때의 남은 수 — 타이머 effect 가 pending 이 바뀔 때마다 다시 서지 않게 ref 로 읽는다
  const pendingRef = useRef(state.pending);
  useEffect(() => {
    pendingRef.current = state.pending;
  });
  useEffect(() => {
    if (settled) dispatch("release");
  }, [settled]);
  useEffect(() => {
    if (state.released) return;
    const timer = setTimeout(() => {
      // 안전장치로 풀렸다 — 응답이 늦은 로더가 남아 있다는 뜻이라 한 줄 남긴다
      console.warn(`LoadGroup: ${timeoutMs}ms 안에 모두 받지 못해 풀었습니다 (남은 ${pendingRef.current}건)`);
      dispatch("release");
    }, timeoutMs);
    return () => clearTimeout(timer);
  }, [state.released, timeoutMs]);

  const held = !state.released;
  // begin · end · ready 는 바뀌지 않는다(로더 effect 가 값이 바뀔 때마다 다시 돌지 않게)
  const begin = useCallback(() => dispatch("begin"), []);
  const end = useCallback(() => dispatch("end"), []);
  const ready = useCallback(() => dispatch("ready"), []);
  const value = useMemo<Ctx>(() => ({ begin, end }), [begin, end]);
  return (
    <LoadGroupContext.Provider value={value}>
      {held && fallback}
      {held ? (
        <div hidden inert aria-busy="true">
          {children}
          <Probe onMount={ready} />
        </div>
      ) : (
        // 풀린 뒤에는 레이아웃에 끼지 않는 묶음 — children 이 부모의 직접 자식처럼 선다
        <div className="contents">
          {children}
          <Probe onMount={ready} />
        </div>
      )}
    </LoadGroupContext.Provider>
  );
}

/**
 * LoadGroup 안에서 서버 컴포넌트(async) 영역 하나를 맡는다 — 자기 Suspense 경계를 두고, 경계가 풀릴 때까지 묶음을 붙잡는다.
 * 묶음이 가리는 동안은 숨기지 않고 세기만 한다(숨기는 일은 LoadGroup 이 한다). timeoutMs 로 풀린 뒤에도 서버 영역이 오지 않았으면 그 자리의 fallback 이
 * 영역 안 로딩이 된다. 묶음 밖에서 쓰면 그냥 Suspense 다.
 */
export function LoadGroupArea({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  // 경계 안(Probe)이 마운트되면 도착한 것이다. 자식 effect 가 부모 effect 보다 먼저 돌아도(이미 스트리밍으로 와서 경계가 풀려 있을 때)
  // 등록 · 해제가 「active 일 때 begin, cleanup 에서 end」 한 effect 의 짝이라 순서와 상관없이 맞는다
  const [arrived, setArrived] = useState(false);
  const markArrived = useCallback(() => setArrived(true), []);
  useLoadGroupHold(!arrived);
  return (
    <Suspense fallback={fallback}>
      {children}
      <Probe onMount={markArrived} />
    </Suspense>
  );
}

/**
 * 로더가 받는 중인 동안 가장 가까운 LoadGroup 에 알린다. active 가 false(부르지 않음 · 이미 받음)면 붙잡지 않는다. 묶음 밖이면 아무것도 하지 않는다.
 * 훅(useLoad)이 쓴다 — 화면은 직접 부르지 않는다.
 */
export function useLoadGroupHold(active: boolean) {
  const group = useContext(LoadGroupContext);
  const begin = group?.begin;
  const end = group?.end;
  useEffect(() => {
    if (!active || !begin || !end) return;
    begin();
    return end;
  }, [active, begin, end]);
}
