// node --test src/lib/store-view.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { closeBlockText, floorLabel, formatBizNumber, missingForOperationText, nextStatuses } from "./store-view.ts";

test("상태는 한 방향 — 미운영→운영 · 폐점, 운영→폐점, 폐점은 그대로", () => {
  assert.deepEqual(nextStatuses("NOT_OPERATING"), ["NOT_OPERATING", "OPERATING", "CLOSED"]);
  assert.deepEqual(nextStatuses("OPERATING"), ["OPERATING", "CLOSED"]);
  assert.deepEqual(nextStatuses("CLOSED"), ["CLOSED"]);
});

test("사업자등록번호 표기 — 10자리만 하이픈", () => {
  assert.equal(formatBizNumber("1234567890"), "123-45-67890");
  assert.equal(formatBizNumber("123-45-67890"), "123-45-67890");
  assert.equal(formatBizNumber("12345"), "12345");
  assert.equal(formatBizNumber(null), "");
});

test("층 표기 — 층 구분 한글은 부르는 쪽이 준다", () => {
  const label = (t: string) => ({ GROUND: "지상", BASEMENT: "지하" })[t] ?? t;
  assert.equal(floorLabel({ floorTypeCode: "BASEMENT", floorNumber: 2 }, label), "지하 2층");
  assert.equal(floorLabel({ floorTypeCode: "GROUND", floorNumber: null }, label), "지상");
  assert.equal(floorLabel({ floorTypeCode: null, floorNumber: null }, label), "-");
});

test("운영 · 폐점 조건 문구", () => {
  // 한글은 GET /enums/StoreOperationRequirement 의 label 을 쓴다 — 받지 못했거나 모르는 값이면 값을 그대로
  const labels = [
    { value: "BUSINESS_VERIFICATION", label: "사업자정보 인증", order: 1 },
    { value: "COORDINATES", label: "좌표(위도 · 경도)", order: 2 },
  ];
  assert.equal(missingForOperationText([], labels), null);
  assert.equal(missingForOperationText(["BUSINESS_VERIFICATION", "COORDINATES"], labels), "운영으로 바꾸려면 사업자정보 인증 · 좌표(위도 · 경도)이(가) 필요합니다.");
  assert.equal(missingForOperationText(["BP_INACTIVE"], []), "운영으로 바꾸려면 BP_INACTIVE이(가) 필요합니다.");
  assert.equal(closeBlockText({ inProgressContractCount: 0 }), null);
  assert.equal(closeBlockText({ inProgressContractCount: 1200 }), "진행 중인 근로계약이 1,200건 있습니다.");
});
