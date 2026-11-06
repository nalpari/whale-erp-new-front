import assert from "node:assert/strict";
import { test } from "node:test";
import { jumpPose, planJump } from "./whale-loader-math.ts";

test("planJump — random 0 이면 최소 거리, 왼쪽 6% 에서 시작", () => {
  const p = planJump(400, [0.3, 0.5], () => 0)!;
  assert.equal(p.x0, 24);
  assert.equal(p.x1, 24 + 120);
});

test("planJump — 폭이 0 이하면 계획을 세우지 않는다(null)", () => {
  assert.equal(planJump(0, [0.3, 0.5], () => 0.5), null);
  assert.equal(planJump(-1, [0.3, 0.5], () => 0.5), null);
});

test("planJump — random 1 에 가까워도 도착은 파도 줄 안(94% 이내)", () => {
  const p = planJump(400, [0.3, 0.5], () => 0.999999)!;
  assert.ok(p.x0 >= 24);
  assert.ok(p.x1 <= 400 * 0.94 + 0.01);
});

test("jumpPose — 시작 · 끝은 under 만큼 잠기고 가운데에서 height 만큼 오른다", () => {
  const plan = { x0: 100, x1: 200 };
  assert.equal(jumpPose(0, plan, 31, 50).y, 31);
  assert.equal(jumpPose(1, plan, 31, 50).y, 31);
  const mid = jumpPose(0.5, plan, 31, 50);
  assert.equal(mid.y, -50);
  assert.equal(mid.x, 150);
  assert.ok(Math.abs(mid.angle) < 1e-9);
});

test("jumpPose — 오르는 동안은 위(음수 각), 내려올 때는 아래(양수 각)로 기운다", () => {
  const plan = { x0: 0, x1: 100 };
  assert.ok(jumpPose(0.2, plan, 31, 50).angle < 0);
  assert.ok(jumpPose(0.8, plan, 31, 50).angle > 0);
});
