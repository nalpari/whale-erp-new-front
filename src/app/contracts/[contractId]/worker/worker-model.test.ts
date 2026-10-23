// node --test "src/app/contracts/[contractId]/worker/worker-model.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import { isWorkerEditable, workerBody, workerOf, workerProblems, workerSaveNote } from "./worker-model.ts";

const filled = { name: " 남도현 ", phone: "010-9014-5563", birthDate: "1998-07-12", gender: "MALE" as const, isForeigner: false };

test("발송 대기 · 서명 대기 · 수정 요청만 근로자 정보를 고친다", () => {
  for (const s of ["PENDING_SEND", "PENDING_SIGNATURE", "CORRECTION_REQUESTED"]) assert.equal(isWorkerEditable(s), true, s);
  for (const s of ["DRAFT", "SIGNED", "REJECTED", "EXPIRED", "ENDED", null, undefined]) assert.equal(isWorkerEditable(s), false, String(s));
});

test("상세 값으로 폼을 채운다 — 번호는 하이픈, 비어 있는 값은 빈칸", () => {
  assert.deepEqual(workerOf({ name: "남도현", phone: "01090145563", birthDate: null, gender: null, isForeigner: true }), {
    name: "남도현",
    phone: "010-9014-5563",
    birthDate: "",
    gender: "",
    isForeigner: true,
  });
});

test("다섯 칸 모두 필수 — 성별 · 생년월일이 없으면 막는다", () => {
  assert.deepEqual(workerProblems(filled), []);
  assert.deepEqual(workerProblems({ ...filled, name: " ", phone: "010", birthDate: "", gender: "" }), [
    "이름을 입력하세요",
    "휴대전화번호는 숫자 10~11자리입니다",
    "생년월일을 입력하세요",
    "성별을 고르세요",
  ]);
});

test("본문 — 이름은 앞뒤 공백을 지우고 번호는 숫자만, 대체 확인이면 id 를 싣는다", () => {
  assert.deepEqual(workerBody(filled), { name: "남도현", phone: "01090145563", birthDate: "1998-07-12", gender: "MALE", isForeigner: false });
  assert.deepEqual(workerBody(filled, [5]).replaceContractIds, [5]);
});

test("저장 뒤 상태 안내 — 서명 기한 30일 · 가입 초대 대상이면 곧바로 다시 보냄", () => {
  // 가입 초대 대상이면 알림톡, 가입한 직원은 앱 알림(api #259), 계정만 있는 번호는 보내지 않는다(front #58 리뷰)
  for (const s of ["PENDING_SEND", "PENDING_SIGNATURE", "CORRECTION_REQUESTED"]) {
    assert.match(workerSaveNote(s), /서명 기한은 새로 30일/, s);
    assert.match(workerSaveNote(s), /가입 초대 대상이면 곧바로 다시 보내고/, s);
  }
  assert.match(workerSaveNote("CORRECTION_REQUESTED"), /서명 대기로/);
  assert.match(workerSaveNote("PENDING_SEND"), /계정이 있는 번호로 고치면 보내지 않고/);
});
