// pnpm test 로 함께 돈다. 이 파일만: node --test "src/**/send-log-view.test.ts" — 경로의 [id] 를 node 가 glob 으로 읽어 그대로 적으면 찾지 못한다
import assert from "node:assert/strict";
import { test } from "node:test";
import { kindText, labelIn, sendLogLine, type SendLogItem } from "./send-log-view.ts";

const kindLabel = labelIn([
  { value: "SIGNUP_INVITE", label: "가입 초대" },
  { value: "AFFILIATION_REQUEST", label: "소속 추가 확인 요청" },
]);
const resultLabel = labelIn([
  { value: "SUCCEEDED", label: "성공" },
  { value: "FAILED", label: "실패" },
  { value: "UNCONFIRMED", label: "접수 여부 모름" },
]);

const item = (more: Partial<SendLogItem> = {}): SendLogItem => ({
  sendLogId: 1,
  contractId: 7,
  kind: "SIGNUP_INVITE",
  isResend: false,
  result: "SUCCEEDED",
  failureReason: null,
  retryable: null,
  sentAt: "2026-10-29T00:05:00.000Z",
  ...more,
});

test("성공 — 한국 시각, 종류, 초록 배지, 재시도 · 사유는 -", () => {
  assert.deepEqual(sendLogLine(item(), kindLabel, resultLabel), {
    key: "SIGNUP_INVITE-1",
    contractId: 7,
    sentAt: "2026-10-29 09:05",
    kind: "가입 초대",
    isResend: false,
    result: { text: "성공", style: "badge-on" },
    retry: "-",
    reason: "-",
  });
});

test("재발송이면 종류 뒤에 (재발송) — 종류를 몰라도 남는다", () => {
  assert.equal(kindText(sendLogLine(item({ kind: "AFFILIATION_REQUEST", isResend: true }), kindLabel, resultLabel)), "소속 추가 확인 요청 (재발송)");
  assert.equal(kindText(sendLogLine(item({ isResend: true }), null, resultLabel)), "- (재발송)");
});

test("다시 보낼 수 있는 실패는 빨간 배지 · 재시도 가능 · api 사유 그대로", () => {
  const line = sendLogLine(item({ result: "FAILED", retryable: true, failureReason: "비즈뿌리오가 받지 않았습니다(코드 3018)." }), kindLabel, resultLabel);
  assert.deepEqual([line.result, line.retry, line.reason], [{ text: "실패", style: "badge-off" }, "가능", "비즈뿌리오가 받지 않았습니다(코드 3018)."]);
});

test("접수 여부 모름은 회색 배지 · 재시도 확인 필요, 다시 보낼 수 없는 실패는 불가", () => {
  const unconfirmed = sendLogLine(item({ result: "UNCONFIRMED", retryable: false, failureReason: "접수됐는지 알 수 없습니다." }), kindLabel, resultLabel);
  assert.deepEqual([unconfirmed.result?.style, unconfirmed.retry], ["badge-neutral", "확인 필요"]);
  assert.equal(sendLogLine(item({ result: "FAILED", retryable: false }), kindLabel, resultLabel).retry, "불가");
});

test("빈 사유는 - 다", () => {
  assert.equal(sendLogLine(item({ result: "FAILED", retryable: true, failureReason: "  " }), kindLabel, resultLabel).reason, "-");
});

test("목록에 없는 값 · enum 을 못 받으면 종류 · 결과는 비운다 — 영문 값을 보이지 않는다", () => {
  const unknown = sendLogLine(item({ kind: "NEW_KIND" as SendLogItem["kind"], result: "QUEUED" as SendLogItem["result"] }), kindLabel, resultLabel);
  assert.deepEqual([unknown.kind, unknown.result], [null, null]);
  const none = sendLogLine(item(), null, null);
  assert.deepEqual([none.kind, none.result], [null, null]);
});

test("한글이 있는 새 결과 값은 회색 배지 — 빈칸이 되지 않는다", () => {
  const line = sendLogLine(item({ result: "QUEUED" as SendLogItem["result"] }), kindLabel, labelIn([{ value: "QUEUED", label: "대기" }]));
  assert.deepEqual(line.result, { text: "대기", style: "badge-neutral" });
});

test("비밀번호 초기화 메일 줄(WHALEERP-676) — contractId 가 null 이어도 줄이 만들어지고 재발송 · 재시도는 -", () => {
  const mail: Partial<SendLogItem> = { contractId: null, kind: "PASSWORD_RESET", isResend: false, result: "SUCCEEDED", retryable: null };
  const labels = labelIn([{ value: "PASSWORD_RESET", label: "비밀번호 초기화" }]);
  const line = sendLogLine(item(mail), labels, resultLabel);
  assert.deepEqual([line.contractId, line.kind, kindText(line), line.retry, line.result?.style], [null, "비밀번호 초기화", "비밀번호 초기화", "-", "badge-on"]);
});

test("sendLogId 가 같은 알림톡 줄과 메일 줄은 key 가 겹치지 않는다", () => {
  const labels = labelIn([{ value: "PASSWORD_RESET", label: "비밀번호 초기화" }]);
  const a = sendLogLine(item({ sendLogId: 5 }), kindLabel, resultLabel);
  const b = sendLogLine(item({ sendLogId: 5, kind: "PASSWORD_RESET", contractId: null }), labels, resultLabel);
  assert.notEqual(a.key, b.key);
});
