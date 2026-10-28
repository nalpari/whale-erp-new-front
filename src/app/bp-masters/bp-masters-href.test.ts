// node --test src/app/bp-masters/bp-masters-href.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { bpMastersExcelHref, bpMastersHref, isEditOpen, parseBpMastersQuery, type BpMastersQuery } from "./bp-masters-href.ts";

test("주소 값이 틀리면 기본값으로 — api 에 400 · 500 을 일으키지 않는다", () => {
  assert.deepEqual(parseBpMastersQuery({ page: "0", pageSize: "30", searchType: "NAME", status: "active,X", verification: "yes", bp: "1.5", keyword: "  " }), {
    page: 1,
    pageSize: 20,
    searchType: "BP_CODE",
    keyword: undefined,
    statuses: [],
    verification: undefined,
    bp: undefined,
    edit: undefined,
    statusNone: undefined,
  });
  // 9자리까지만 받는다 — api 의 int4 상한을 넘는 값이 가지 않게
  assert.equal(parseBpMastersQuery({ bp: "1234567890" }).bp, undefined);
  assert.equal(parseBpMastersQuery({ bp: "017" }).bp, 17);
  // 같은 이름이 여럿이면(배열) 무시한다
  assert.equal(parseBpMastersQuery({ page: ["2", "3"] }).page, 1);
  // api 쪽 번호 상한(1,000만)을 넘는 주소는 1쪽으로 — 그대로 보내면 목록 조회가 400 이다
  assert.equal(parseBpMastersQuery({ page: "10000000" }).page, 10_000_000);
  assert.equal(parseBpMastersQuery({ page: "10000001" }).page, 1);
});

test("상태는 정해진 순서로, 셋 다 고르면 전체(빈 목록)와 같다", () => {
  assert.deepEqual(parseBpMastersQuery({ status: "WITHDRAWN,ACTIVE,ACTIVE" }).statuses, ["ACTIVE", "WITHDRAWN"]);
  assert.deepEqual(parseBpMastersQuery({ status: "ACTIVE,INACTIVE,WITHDRAWN" }).statuses, []);
  assert.equal(bpMastersHref({ statuses: ["ACTIVE", "INACTIVE", "WITHDRAWN"] }), "/bp-masters");
});

test("상태를 셋 다 끄면 status=NONE — 다시 읽어도 결과 없음으로 남는다", () => {
  assert.equal(bpMastersHref({ statuses: [], statusNone: true }), "/bp-masters?status=NONE");
  assert.equal(parseBpMastersQuery({ status: "NONE" }).statusNone, true);
  assert.deepEqual(parseBpMastersQuery({ status: "NONE" }).statuses, []);
  assert.equal(parseBpMastersQuery({ status: "ACTIVE" }).statusNone, undefined);
});

test("검색어는 앞뒤 공백을 빼고 50자까지, 검색 기준은 검색어가 있을 때만 주소에 남는다", () => {
  assert.equal(parseBpMastersQuery({ keyword: "  한강  " }).keyword, "한강");
  assert.equal(parseBpMastersQuery({ keyword: "a".repeat(60) }).keyword, "a".repeat(50));
  assert.equal(bpMastersHref({ searchType: "TRADE_NAME" }), "/bp-masters");
  assert.equal(bpMastersHref({ searchType: "TRADE_NAME", keyword: "a&b c" }), "/bp-masters?searchType=TRADE_NAME&keyword=a%26b+c");
});

test("만든 주소를 다시 읽으면 같은 조건 — 새로 고침 · 링크 공유에서 조건이 사라지지 않는다", () => {
  const query: BpMastersQuery = {
    page: 3,
    pageSize: 50,
    searchType: "LOGIN_ID_NAME",
    keyword: "정하윤",
    statuses: ["INACTIVE", "WITHDRAWN"],
    verification: "UNVERIFIED",
    bp: 17,
    edit: true,
    statusNone: undefined,
  };
  const read = parseBpMastersQuery(Object.fromEntries(new URL(bpMastersHref(query), "http://x").searchParams));
  assert.deepEqual(read, query);
});

test("엑셀 주소는 같은 조건에서 쪽 · 건수 · 상세를 뺀다", () => {
  const query = parseBpMastersQuery({ keyword: "BP0000", status: "ACTIVE", page: "4", pageSize: "100", bp: "9", edit: "1" });
  assert.equal(bpMastersExcelHref(query), "/bp-masters/excel?keyword=BP0000&status=ACTIVE");
});

test("수정(?edit=1)은 상세(?bp=)가 있을 때만 — 상세 없이 수정만 남지 않는다", () => {
  assert.equal(parseBpMastersQuery({ bp: "7", edit: "1" }).edit, true);
  assert.equal(parseBpMastersQuery({ edit: "1" }).edit, undefined);
  assert.equal(parseBpMastersQuery({ bp: "7", edit: "true" }).edit, undefined);
  assert.equal(parseBpMastersQuery({ bp: "0", edit: "1" }).edit, undefined);
  assert.equal(bpMastersHref({ edit: true }), "/bp-masters");
  assert.equal(bpMastersHref({ bp: 7, edit: true }), "/bp-masters?bp=7&edit=1");
});

test("수정 패널은 주소 · 권한 · 화면에 남은 상세가 모두 같은 BP 일 때만 선다", () => {
  const query = { bp: 7, edit: true };
  const shown = { bp: { bpCodeId: 7 } };
  assert.equal(isEditOpen(query, true, shown), true);
  // 다른 BP 로 옮기는 중 — 앞 BP 상세가 남아 있어도 그 수정 폼을 새 주소 위에 열지 않는다
  assert.equal(isEditOpen({ bp: 8, edit: true }, true, shown), false);
  assert.equal(isEditOpen(query, true, { failed: "삭제되었거나 없는 BP 입니다." }), false);
  assert.equal(isEditOpen(query, false, shown), false);
  assert.equal(isEditOpen(query, true, null), false);
  assert.equal(isEditOpen({ bp: 7 }, true, shown), false);
});
