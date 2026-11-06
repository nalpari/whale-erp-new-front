// 공통 토스트의 차례 판정(toast.tsx). 타이머 · 화면은 Provider 가 쥐고, 무엇을 띄우고 무엇을 기다리게 할지만 여기서 정한다 — node --test 로 본다.

/** current: 떠 있는(또는 곧 뜰) 문구, queue: 그 뒤에 기다리는 문구 */
export type ToastQueue = { current: string | null; queue: string[] };

export const EMPTY_TOAST_QUEUE: ToastQueue = { current: null, queue: [] };

/**
 * 새 문구가 왔다. present 면 지금 띄우고 3초를 처음부터 센다.
 * - 떠 있는 것이 없으면 바로 띄운다.
 * - 떠 있는 것과 같은 문구면, 뒤에 기다리는 것이 없을 때만 다시 센다(기다리는 것이 있으면 버린다 — 순서를 거슬러 다시 띄우지 않는다).
 * - 다른 문구면 뒤에 세운다. 이미 기다리는 문구는 또 쌓지 않는다.
 */
export function onToastShow(s: ToastQueue, text: string): { state: ToastQueue; present: boolean } {
  if (s.current === null || (text === s.current && !s.queue.length)) return { state: { current: text, queue: s.queue }, present: true };
  if (text !== s.current && !s.queue.includes(text)) return { state: { ...s, queue: [...s.queue, text] }, present: false };
  return { state: s, present: false };
}

/** 떠 있던 것이 3초를 다 채웠다. next 가 있으면 잠깐 닫은 뒤 그것을 띄우고, 없으면 비운다 */
export function onToastExpire(s: ToastQueue): { state: ToastQueue; next: string | null } {
  const [next = null, ...rest] = s.queue;
  return { state: { current: next, queue: rest }, next };
}
