import assert from "node:assert/strict";
import { test } from "node:test";
import { BP_PATH_SCREENS } from "./bp-path.ts";
import {
  GUIDE_STEPS,
  type GuideTrack,
  guideDetailOf,
  guideParam,
  nextArrival,
  parseGuide,
  partOnScreen,
  stepNumberOf,
  withRo,
} from "./start-guide.ts";

const TRACKS: GuideTrack[] = ["STORE", "HQ", "FRANCHISEE"];

test("주 단계마다 설명이 있고, 하위 단계마다 같은 번호의 칸이 있다(#part-2-1 로 내려온다)", () => {
  for (const track of TRACKS) {
    for (const step of GUIDE_STEPS[track]) {
      const detail = guideDetailOf(track, stepNumberOf(step));
      assert.ok(detail, `${track} ${step.label} 설명 없음`);
      if (step.sub) assert.ok(detail.parts.some((p) => p.label === step.label), `${track} ${step.label} 칸 없음`);
    }
  }
});

test("칸의 화면 주소는 탭 BP 화면이다([OOO로 가기]가 /bp/{id} 를 붙인다)", () => {
  for (const track of TRACKS)
    for (const step of GUIDE_STEPS[track].filter((s) => !s.sub))
      for (const part of guideDetailOf(track, stepNumberOf(step)).parts)
        if (part.path) assert.ok(BP_PATH_SCREENS.some((p) => part.path === p || part.path!.startsWith(`${p}/`)), `${part.title} ${part.path}`);
});

test("parseGuide 는 아는 갈래 · 있는 주 단계만 받는다", () => {
  assert.deepEqual(parseGuide("STORE-1"), { track: "STORE", step: "1" });
  assert.deepEqual(parseGuide("HQ-3"), { track: "HQ", step: "3" });
  assert.equal(parseGuide("STORE-9"), null);
  assert.equal(parseGuide("ETC-1"), null);
  assert.equal(parseGuide("store-1"), null);
  assert.equal(parseGuide(null), null);
  assert.equal(parseGuide(undefined), null);
});

test("partOnScreen 은 [가기] 화면과 이어 넘어가는 화면(/ 로 끝나면 그 아래)을 본다", () => {
  const part = { title: "t", actions: [], mock: "payslip-review" as const, path: "/payslips", nextPaths: ["/payslips/", "/contracts/new"] };
  assert.equal(partOnScreen(part, "/payslips"), true);
  assert.equal(partOnScreen(part, "/payslips/42"), true);
  assert.equal(partOnScreen(part, "/contracts/new"), true);
  assert.equal(partOnScreen(part, "/contracts"), false);
  assert.equal(partOnScreen(part, "/payslipsx"), false);
});

test("nextArrival — 넘어오면 뜨고, 같은 단계의 화면에선 남고, 다른 화면에선 지운다", () => {
  const empty = { guide: null, seen: null };
  // 가이드에서 점포 등록으로 넘어옴
  const a = nextArrival(empty, "STORE-1", "/stores/new");
  assert.deepEqual(a, { guide: "STORE-1", seen: "STORE-1|/stores/new" });
  // 같은 화면에서 주소의 guide 가 빠져도 남는다(그대로 같은 값)
  assert.equal(nextArrival(a, null, "/stores/new"), a);
  // 그 단계와 상관없는 화면으로 가면 지운다 — 그래야 메뉴로 다시 와도 뜨지 않는다
  const b = nextArrival(a, null, "/staff-members");
  assert.deepEqual(b, empty);
  assert.deepEqual(nextArrival(b, null, "/stores/new"), empty);
});

test("nextArrival — 닫은 뒤 같은 화면에선 다시 열리지 않고, 가이드에서 다시 오면 열린다", () => {
  const shown = nextArrival({ guide: null, seen: null }, "STORE-1", "/stores/new");
  const closed = { ...shown, guide: null };
  // 주소에 guide 가 남아 있어도 같은 도착이라 그대로 닫혀 있다
  assert.equal(nextArrival(closed, "STORE-1", "/stores/new"), closed);
  // 가이드 화면으로 돌아가면 기억이 지워지고, [가기]로 다시 오면 다시 뜬다
  const back = nextArrival(closed, null, "/start-guide");
  assert.deepEqual(back, { guide: null, seen: null });
  assert.equal(nextArrival(back, "STORE-1", "/stores/new").guide, "STORE-1");
});

test("nextArrival — 이어 넘어가는 화면(근로계약 작성)에서도 남는다", () => {
  const a = nextArrival({ guide: null, seen: null }, "STORE-3", "/staff-members");
  assert.equal(a.guide, "STORE-3");
  assert.equal(nextArrival(a, null, "/contracts/new"), a);
});

test("nextArrival — 그 화면에 칸이 없는 guide 는 받지 않는다", () => {
  assert.deepEqual(nextArrival({ guide: null, seen: null }, "STORE-1", "/payslips"), { guide: null, seen: null });
});

test("nextArrival — 바뀐 것이 없으면 같은 객체를 돌려준다(렌더 중 setState 가 끝없이 돌지 않게)", () => {
  const empty = { guide: null, seen: null };
  assert.equal(nextArrival(empty, null, "/home"), empty);
  assert.equal(nextArrival(empty, "STORE-9", "/stores/new"), empty);
  assert.equal(nextArrival(empty, "garbage", "/home"), empty);
  const cleared = nextArrival(nextArrival(empty, "STORE-1", "/stores/new"), null, "/home");
  assert.equal(nextArrival(cleared, null, "/home"), cleared);
});

test("nextArrival — 본사 갈래: 같은 화면에 다른 단계로 다시 오면 그 단계로, 같은 단계의 다른 화면에선 남는다", () => {
  const hq2 = nextArrival({ guide: null, seen: null }, "HQ-2", "/bp-admins");
  assert.equal(hq2.guide, "HQ-2");
  const closed = { ...hq2, guide: null };
  assert.deepEqual(nextArrival(closed, "HQ-3", "/bp-admins"), { guide: "HQ-3", seen: "HQ-3|/bp-admins" });
  assert.equal(nextArrival(hq2, null, "/bp-role-groups"), hq2);
});

test("nextArrival — 떠 있는 카드는 잘못된 guide · 이 화면에 칸이 없는 guide 로 지워지지 않는다", () => {
  const shown = nextArrival({ guide: null, seen: null }, "STORE-3", "/staff-members");
  assert.equal(nextArrival(shown, "STORE-9", "/staff-members"), shown);
  assert.equal(nextArrival(shown, "STORE-1", "/staff-members"), shown);
});

test("guideParam 과 parseGuide 는 짝이다", () => {
  assert.deepEqual(parseGuide(guideParam("HQ", "3")), { track: "HQ", step: "3" });
  assert.deepEqual(parseGuide(guideParam("STORE", "1")), { track: "STORE", step: "1" });
});

test("withRo — 받침 없음 · ㄹ 받침은 「로」, 그 밖의 받침은 「으로」, 한글이 아니면 「로」", () => {
  assert.equal(withRo("점포 정보 관리"), "점포 정보 관리로");
  assert.equal(withRo("근무스케줄"), "근무스케줄로");
  assert.equal(withRo("출퇴근 현황"), "출퇴근 현황으로");
  assert.equal(withRo("TO-DO"), "TO-DO로");
  assert.equal(withRo(""), "로");
});

test("순서 문구의 <u> 는 짝이 맞고, 한 단계 안 칸 제목은 겹치지 않는다(key)", () => {
  for (const track of TRACKS)
    for (const step of GUIDE_STEPS[track].filter((s) => !s.sub)) {
      const parts = guideDetailOf(track, stepNumberOf(step)).parts;
      assert.equal(new Set(parts.map((p) => p.title)).size, parts.length, `${track} ${step.label} 칸 제목 겹침`);
      for (const a of parts.flatMap((p) => p.actions)) assert.ok(!/<\/?u>/.test(a.replace(/<u>(.*?)<\/u>/g, "$1")), a);
    }
});
