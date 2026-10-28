// 고래 로딩(whale-loader.tsx)의 점프 계산. 화면 없이 확인할 수 있게 순수 함수로 뗐다.
// node --test src/components/common/whale-loader-math.test.ts

export type JumpPlan = { x0: number; x1: number };

/** 한 번 점프의 출발 · 도착 x. random 은 0 이상 1 미만 값을 돌려주는 함수(테스트에서 고정값을 넣는다) */
export function planJump(width: number, span: readonly [number, number], random: () => number): JumpPlan {
  const dist = width * (span[0] + random() * (span[1] - span[0]));
  const x0 = width * 0.06 + random() * (width * 0.88 - dist);
  return { x0, x1: x0 + dist };
}

export type JumpPose = { x: number; y: number; angle: number };

/**
 * 점프 진행도 s(0~1)의 고래 위치와 기울기.
 * y 는 수면(0) 기준 아래로 양수 — 시작 · 끝에 under 만큼 잠겨 있다가 s=0.5 에서 -height 까지 오르는 포물선이다. angle 은 접선 방향(도).
 */
export function jumpPose(s: number, plan: JumpPlan, under: number, height: number): JumpPose {
  const x = plan.x0 + (plan.x1 - plan.x0) * s;
  const y = under - 4 * (under + height) * s * (1 - s);
  const angle = (Math.atan2(-4 * (under + height) * (1 - 2 * s), plan.x1 - plan.x0) * 180) / Math.PI;
  return { x, y, angle };
}
