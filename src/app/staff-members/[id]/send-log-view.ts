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
  kind: string;
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
 * 발송 이력 한 줄. 종류 뒤에 재발송이면 「(재발송)」을 붙인다. 재시도는 그 발송 한 번의 판정이다 — 확실히 나가지 않은 실패는 「가능」,
 * 접수 여부 모름은 다시 보내면 두 번 갈 수 있어 「확인 필요」, 성공은 「-」. 지금 재발송을 누를 수 있는지는 가입 상태 줄의 재발송 버튼이 정한다.
 * kindLabel · resultLabel 은 enum 한글이다. 받지 못했으면 null 이고 그 칸은 「-」다 — 영문 값을 보이지 않는다.
 */
export function sendLogLine(
  item: SendLogItem,
  kindLabel: ((value: string) => string) | null,
  resultLabel: ((value: string) => string) | null,
): SendLogLine {
  return {
    key: item.sendLogId,
    contractId: item.contractId,
    sentAt: formatDateTime(item.sentAt) || "-",
    kind: kindLabel ? `${kindLabel(item.kind)}${item.isResend ? " (재발송)" : ""}` : "-",
    // api 가 먼저 새 결과 값을 내도 배지가 빈칸이 되지 않게 회색으로 둔다
    result: resultLabel ? { text: resultLabel(item.result), style: RESULT_STYLE[item.result] ?? "badge-neutral" } : null,
    retry: item.retryable === null ? "-" : item.retryable ? "가능" : "확인 필요",
    reason: item.failureReason ?? "-",
  };
}
