// pnpm test 로 함께 돈다. 이 파일만: node --test "src/**/send-log-view.test.ts" — 경로의 [id] 를 node 가 glob 으로 읽어 그대로 적으면 찾지 못한다
import assert from "node:assert/strict";
import { test } from "node:test";
import { sendLogLine, type SendLogItem } from "./send-log-view.ts";

const KINDS: Record<string, string> = { SIGNUP_INVITE: "가입 초대", AFFILIATION_REQUEST: "소속 추가 확인 요청" };
const RESULTS: Record<string, string> = { SUCCEEDED: "성공", FAILED: "실패", UNCONFIRMED: "접수 여부 모름" };
const kindLabel = (v: string) => KINDS[v];
const resultLabel = (v: string) => RESULTS[v];

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
    key: 1,
    sentAt: "2026-10-29 09:05",
    kind: "가입 초대",
    result: { text: "성공", style: "badge-on" },
    retry: "-",
    reason: "-",
  });
});

test("재발송이면 종류 뒤에 (재발송)", () => {
  assert.equal(sendLogLine(item({ kind: "AFFILIATION_REQUEST", isResend: true }), kindLabel, resultLabel).kind, "소속 추가 확인 요청 (재발송)");
});

test("확실히 나가지 않은 실패는 빨간 배지 · 재시도 가능 · api 사유 그대로", () => {
  const line = sendLogLine(item({ result: "FAILED", retryable: true, failureReason: "비즈뿌리오가 받지 않았습니다(코드 3018)." }), kindLabel, resultLabel);
  assert.deepEqual([line.result, line.retry, line.reason], [{ text: "실패", style: "badge-off" }, "가능", "비즈뿌리오가 받지 않았습니다(코드 3018)."]);
});

test("접수 여부 모름은 회색 배지 · 재시도 확인 필요", () => {
  const line = sendLogLine(item({ result: "UNCONFIRMED", retryable: false, failureReason: "접수됐는지 알 수 없습니다." }), kindLabel, resultLabel);
  assert.deepEqual([line.result?.style, line.retry], ["badge-neutral", "확인 필요"]);
});

test("enum 한글을 받지 못했으면 종류 · 결과는 - 다 — 영문 값을 보이지 않는다", () => {
  const line = sendLogLine(item({ isResend: true }), null, null);
  assert.deepEqual([line.kind, line.result], ["-", null]);
});
