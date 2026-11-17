// node --test src/lib/bp-hq-form.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { hqFormOf, toHqInput, validateHqForm, type HqForm } from "./bp-hq-form.ts";

const filled: HqForm = { supported: true, latitude: "37.556312", longitude: "126.901845", isLocationApplied: true, isHqStaffEnabled: true };

test("hqFormOf — 좌표는 글자로, 옛 api(칸 없음)면 supported 가 false 이고 다 비운다", () => {
  assert.deepEqual(hqFormOf({ latitude: 37.556312, longitude: 126.901845, isLocationApplied: true, isHqStaffEnabled: true }), filled);
  assert.deepEqual(hqFormOf({}), { supported: false, latitude: "", longitude: "", isLocationApplied: false, isHqStaffEnabled: false });
});

test("hqFormOf — 좌표가 없으면 위치 적용은 꺼서 보인다(점포 formOfStore 와 같은 규칙)", () => {
  assert.equal(hqFormOf({ latitude: null, longitude: null, isLocationApplied: true, isHqStaffEnabled: false }).isLocationApplied, false);
});

test("toHqInput — 좌표는 숫자 · 빈 칸은 null, 좌표가 없으면 위치 적용 false. 옛 api 면 아무것도 싣지 않는다", () => {
  assert.deepEqual(toHqInput(filled), { latitude: 37.556312, longitude: 126.901845, isLocationApplied: true, isHqStaffEnabled: true });
  assert.deepEqual(toHqInput({ ...filled, latitude: "", longitude: "", isHqStaffEnabled: false }), {
    latitude: null,
    longitude: null,
    isLocationApplied: false,
    isHqStaffEnabled: false,
  });
  assert.deepEqual(toHqInput({ ...filled, supported: false }), {});
});

test("validateHqForm — 좌표 형식 · 함께 입력", () => {
  assert.deepEqual(validateHqForm(filled, true), {});
  assert.equal(validateHqForm({ ...filled, latitude: "91" }, true).latitude, "위도는 -90~90, 소수 6자리까지입니다.");
  assert.equal(validateHqForm({ ...filled, longitude: "1.1234567" }, true).longitude, "경도는 -180~180, 소수 6자리까지입니다.");
  assert.equal(validateHqForm({ ...filled, longitude: "", isHqStaffEnabled: false, isLocationApplied: false }, true).longitude, "위도와 경도는 함께 입력해 주세요.");
});

test("validateHqForm — 본사 직원 관리는 사업자정보 인증과 좌표가 있어야 켠다", () => {
  assert.equal(validateHqForm(filled, false).isHqStaffEnabled, "사업자정보를 인증해야 본사 직원 관리를 사용할 수 있습니다.");
  assert.equal(
    validateHqForm({ ...filled, latitude: "", longitude: "", isLocationApplied: false }, true).isHqStaffEnabled,
    "위도 · 경도를 입력해야 본사 직원 관리를 사용할 수 있습니다.",
  );
  assert.deepEqual(validateHqForm({ ...filled, isHqStaffEnabled: false }, false), {});
});
