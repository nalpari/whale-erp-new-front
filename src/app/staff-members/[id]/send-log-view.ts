// 직원 상세 「발송 이력」 영역(WHALEERP-136, GET /staff-members/:id/summary/send-logs)의 줄 글자. 화면은 send-log-box.tsx 가 그린다.
// 테스트는 pnpm test 로 함께 돈다. 이 파일만: node --test "src/**/send-log-view.test.ts" — 경로의 [id] 를 node 가 glob 으로 읽어 그대로 적으면 찾지 못한다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { components } from "../../../lib/api-types.generated.ts";
import { formatDateTime } from "../../../lib/format.ts";
import type { Cell, CellStyle } from "../staff-row.ts";

export type SendLogItem = components["schemas"]["StaffMemberSendLogDto"];

export type SendLogLine = {
  key: number;
  contractId: number;
  sentAt: string;
  /** 종류 한글. 한글을 모르면(enum 을 못 받음 · 목록에 없는 새 값) null — 화면은 「-」이고 계약 링크를 걸지 않는다 */
  kind: string | null;
  /** 같은 계약으로 앞서 나갔을 수 있는 발송이 있었다 — 종류 뒤 「(재발송)」. 종류를 몰라도 보인다 */
  isResend: boolean;
  /** 결과 배지. 결과 한글을 받지 못했으면 null — 화면은 「-」 */
  result: Cell | null;
  retry: string;
  reason: string;
};

// 접수 여부 모름은 실패로 단정하지 않아 회색이다
const RESULT_STYLE: Record<SendLogItem["result"], CellStyle> = {
  SUCCEEDED: "badge-on",
  FAILED: "badge-off",
  UNCONFIRMED: "badge-neutral",
};

/**
 * 발송 이력 한 줄. 재시도는 그 발송 한 번의 판정이다 — 다시 보낼 수 있는 실패는 「가능」, 접수 여부 모름은 다시 보내면 두 번 갈 수 있어
 * 「확인 필요」, 다시 보낼 수 없는 실패는 「불가」, 성공은 「-」. 지금 재발송을 누를 수 있는지는 가입 상태 줄의 재발송 버튼이 정한다.
 * kindLabel · resultLabel 은 enum 한글을 찾는 함수다 — 받지 못했으면(null) · 목록에 없는 값이면(undefined) 그 칸은 「-」다. 영문 값을 보이지 않는다.
 */
export function sendLogLine(
  item: SendLogItem,
  kindLabel: ((value: string) => string | undefined) | null,
  resultLabel: ((value: string) => string | undefined) | null,
): SendLogLine {
  const resultText = resultLabel?.(item.result);
  return {
    key: item.sendLogId,
    contractId: item.contractId,
    sentAt: formatDateTime(item.sentAt) || "-",
    kind: kindLabel?.(item.kind) ?? null,
    isResend: item.isResend,
    // api 가 먼저 새 결과 값을 내도 배지가 빈칸이 되지 않게 회색으로 둔다
    result: resultText ? { text: resultText, style: RESULT_STYLE[item.result] ?? "badge-neutral" } : null,
    retry: retryText(item),
    reason: item.failureReason?.trim() || "-",
  };
}

function retryText({ result, retryable }: Pick<SendLogItem, "result" | "retryable">): string {
  if (retryable === null) return "-";
  if (retryable) return "가능";
  return result === "UNCONFIRMED" ? "확인 필요" : "불가";
}

/** 종류 칸 글자 — 한글(모르면 「-」)에 재발송이면 「(재발송)」 */
export const kindText = (line: Pick<SendLogLine, "kind" | "isResend">) => `${line.kind ?? "-"}${line.isResend ? " (재발송)" : ""}`;

/** enum 목록에서 한글만 찾는다 — labelOf 와 달리 목록에 없는 값은 undefined(영문 값을 돌려주지 않는다) */
export const labelIn = (values: { value: string; label: string }[]) => (value: string) => values.find((v) => v.value === value)?.label;
