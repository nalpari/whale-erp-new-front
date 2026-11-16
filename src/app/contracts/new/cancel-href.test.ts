// node --test src/app/contracts/new/cancel-href.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { cancelHrefOf } from "./cancel-href.ts";

test("cancelHrefOf: 작성 화면 [취소]는 들어온 화면으로 간다(WHALEERP-683)", () => {
  // 재계약은 원래 계약 상세 — 돌아갈 목록은 이어 싣는다
  assert.equal(cancelHrefOf(7, undefined, undefined), "/contracts/7");
  assert.equal(cancelHrefOf(7, undefined, "/contracts?page=2"), "/contracts/7?back=%2Fcontracts%3Fpage%3D2");
  // 직원 정보 관리 목록 · 직원 상세에서 들어왔으면 그 화면
  assert.equal(cancelHrefOf(undefined, "/staff-members", undefined), "/staff-members");
  assert.equal(cancelHrefOf(undefined, "/staff-members?storeIds=3&page=2", undefined), "/staff-members?storeIds=3&page=2");
  assert.equal(cancelHrefOf(undefined, "/staff-members/12", undefined), "/staff-members/12");
  // 직원 상세는 그 상세의 [목록] 주소 · 보던 주를 남기고 나머지는 버린다
  assert.equal(
    cancelHrefOf(undefined, "/staff-members/12?back=%2Fstaff-members%3Fpage%3D2&week=2026-11-12&foo=1", undefined),
    "/staff-members/12?back=%2Fstaff-members%3Fpage%3D2&week=2026-11-09",
  );
  assert.equal(cancelHrefOf(undefined, "/staff-members/12?back=https%3A%2F%2Fevil.example&week=x", undefined), "/staff-members/12");
  assert.equal(cancelHrefOf(undefined, "/staff-members/2147483647", undefined), "/staff-members/2147483647");
  // 예전 형식(목록 조건을 상세 주소에 그대로 붙인 것)도 [목록] 주소로 바꿔 남긴다(detailListHrefOf)
  assert.equal(cancelHrefOf(undefined, "/staff-members/12?page=3&foo=1", undefined), "/staff-members/12?back=%2Fstaff-members%3Fpage%3D3");
  // 직원 목록 쿼리는 목록 규칙으로 다시 만든다(모르는 이름은 버린다)
  assert.equal(cancelHrefOf(undefined, "/staff-members?page=2&foo=1", undefined), "/staff-members?page=2");
  // 근로계약 목록에서 들어왔으면 그 목록, 아무것도 없으면 기본 목록
  assert.equal(cancelHrefOf(undefined, undefined, "/contracts?page=2"), "/contracts?page=2");
  assert.equal(cancelHrefOf(undefined, undefined, undefined), "/contracts");
  // 재계약이면 entry 보다 원래 계약 상세가 먼저다
  assert.equal(cancelHrefOf(7, "/staff-members/12", undefined), "/contracts/7");
  // 직원 정보 관리 주소가 아니거나 여러 값이면 버린다
  assert.equal(cancelHrefOf(undefined, ["/staff-members", "/staff-members/1"], undefined), "/contracts");
  for (const bad of ["https://evil.example", "//evil.example", "/stores/1", "/staff-members/1/../../stores", "/staff-members-x", "/staff-members/abc", "/staff-members\\evil", "/staff-members/1\\..\\..\\stores", "/bp/8/staff-members", "/staff-members/0", "/staff-members/2147483648"])
    assert.equal(cancelHrefOf(undefined, bad, undefined), "/contracts", bad);
});
