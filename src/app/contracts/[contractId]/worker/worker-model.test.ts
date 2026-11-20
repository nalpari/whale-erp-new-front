// node --test "src/app/contracts/[contractId]/worker/worker-model.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import { isWorkerEditable, WORKER_UNCHANGED, workerBody, workerOf, workerProblemsByField, workerSaveNote, workerUnchanged, type WorkerForm } from "./worker-model.ts";

/** 문장만, 화면 위에서 아래 순서로 */
const workerProblems = (f: WorkerForm) => Object.values(workerProblemsByField(f));

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
    "이름을 입력하세요.",
    "휴대전화번호는 숫자 10~11자리입니다.",
    "생년월일을 입력하세요.",
    "성별을 선택하세요.",
  ]);
});

test("본문 — 이름은 앞뒤 공백을 지우고 번호는 숫자만, 대체 확인이면 id 를 싣는다", () => {
  assert.deepEqual(workerBody(filled), { name: "남도현", phone: "01090145563", birthDate: "1998-07-12", gender: "MALE", isForeigner: false });
  assert.deepEqual(workerBody(filled, [5]).replaceContractIds, [5]);
});

test("저장 뒤 상태 안내 — 늘 다시 보내고 서명 기한 30일, 받는 것은 실제로 보내는 것만(WHALEERP-746)", () => {
  // 서명 요청 전: 계정이 없는 번호는 가입 초대, 계정이 있는 번호는 소속 추가 확인 요청(api 가 번호로 다시 판별)
  const pending = workerSaveNote("PENDING_SEND").join(" ");
  assert.match(pending, /서명 기한은 오늘부터 30일로/);
  assert.match(pending, /이전에 보낸 초대는 더 이상 사용할 수 없습니다/);
  assert.match(pending, /가입 초대를, 이미 앱 계정이 있는 번호면 소속 추가 확인 요청을 다시 보냅니다/);
  assert.doesNotMatch(pending, /바로 서명/);
  // 서명 대기 · 수정 요청: 가입한 직원이라 앱으로 다시 서명 요청 — 가입 초대 이야기는 없다
  for (const s of ["PENDING_SIGNATURE", "CORRECTION_REQUESTED"]) {
    const note = workerSaveNote(s).join(" ");
    assert.match(note, /앱으로 다시 서명을 요청하고, 서명 기한은 오늘부터 30일로/, s);
    assert.doesNotMatch(note, /가입 초대/, s);
  }
  // 문장마다 「~니다.」로 끝난다(~다 체가 섞이지 않게)
  for (const s of ["PENDING_SEND", "PENDING_SIGNATURE"])
    for (const line of workerSaveNote(s)) assert.match(line, /니다\.$/, line);
});

test("오류는 칸마다 — 화면이 그 칸 아래에 보인다(WHALEERP-631)", () => {
  assert.deepEqual(workerProblemsByField(filled), {});
  assert.deepEqual(workerProblemsByField({ ...filled, phone: "010", gender: "" }), {
    phone: "휴대전화번호는 숫자 10~11자리입니다.",
    gender: "성별을 선택하세요.",
  });
});

test("바뀐 것이 없으면 저장하지 않는다 — 비교는 보낼 값(이름 앞뒤 공백 · 번호 하이픈 뺀 값)으로(WHALEERP-681)", () => {
  const initial: WorkerForm = { name: "남도현", phone: "010-9014-5563", birthDate: "1998-07-12", gender: "MALE", isForeigner: false };
  assert.equal(workerUnchanged({ ...initial }, initial), true);
  assert.equal(workerUnchanged({ ...initial, name: " 남도현 ", phone: "01090145563" }, initial), true);
  for (const changed of [
    { name: "남도형" },
    { phone: "010-9014-5564" },
    { birthDate: "1998-07-13" },
    { gender: "FEMALE" as const },
    { isForeigner: true },
  ]) assert.equal(workerUnchanged({ ...initial, ...changed }, initial), false, JSON.stringify(changed));
});

test("바뀐 것 없이 저장하면 상세의 [재발송]으로 안내한다(WHALEERP-681)", () => {
  assert.match(WORKER_UNCHANGED, /변경된 내용이 없습니다\. .*\[재발송\]/);
});
