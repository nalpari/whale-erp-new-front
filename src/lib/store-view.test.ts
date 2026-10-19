// node --test src/lib/store-view.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { closeBlockText, finalEuro, finalJosa, floorLabel, formatBizNumber, hasStoreCoordinates, nextStatuses } from "./store-view.ts";

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

test("좌표 둘 다 있어야 있다고 본다 — formOfStore · 상세 화면이 같은 규칙을 쓴다", () => {
  assert.equal(hasStoreCoordinates(37.5, 127.0), true);
  assert.equal(hasStoreCoordinates(null, 127.0), false);
  assert.equal(hasStoreCoordinates(37.5, null), false);
  assert.equal(hasStoreCoordinates(null, null), false);
});

test("층 표기 — 층 구분 한글은 부르는 쪽이 준다", () => {
  const label = (t: string) => ({ GROUND: "지상", BASEMENT: "지하" })[t] ?? t;
  assert.equal(floorLabel({ floorTypeCode: "BASEMENT", floorNumber: 2 }, label), "지하 2층");
  assert.equal(floorLabel({ floorTypeCode: "GROUND", floorNumber: null }, label), "지상");
  assert.equal(floorLabel({ floorTypeCode: null, floorNumber: null }, label), "-");
});

test("이 · 가 — 받침 있으면 이, 없으면 가. 괄호로 끝나도 그 앞 한글을 본다. 한글이 없으면 이(가) 그대로", () => {
  assert.equal(finalJosa("사업자정보 인증"), "이");
  assert.equal(finalJosa("위치정보(위도 · 경도)"), "가");
  assert.equal(finalJosa("BP_INACTIVE"), "이(가)");
});

test("으로 · 로 — 받침 없거나 ㄹ받침이면 로, 그 밖의 받침이면 으로. 한글이 없으면 (으)로 그대로", () => {
  // 점포상태(미운영 · 운영 · 폐점)는 셋 다 ㅇ · ㅁ받침이라 지금은 으로만 나온다
  assert.equal(finalEuro("미운영"), "으로");
  assert.equal(finalEuro("운영"), "으로");
  assert.equal(finalEuro("폐점"), "으로");
  // 받침 없음 · ㄹ받침은 예외로 로를 쓴다(이/가와 다른 규칙)
  assert.equal(finalEuro("학교"), "로");
  assert.equal(finalEuro("서울"), "로");
  assert.equal(finalEuro("BP_INACTIVE"), "(으)로");
});

test("폐점 조건 문구", () => {
  assert.equal(closeBlockText({ inProgressContractCount: 0 }), null);
  assert.equal(closeBlockText({ inProgressContractCount: 1200 }), "진행 중인 근로계약이 1,200건 있습니다.");
});
