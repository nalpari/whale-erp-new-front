// 점포 폐점 확인 · 결과의 표기. 상세의 상태 변경 · 수정 화면의 폐점이 같이 쓴다(나중에 회원 탈퇴도 같은 모양을 받는다).
// 서버 · 클라이언트가 함께 쓰고 node --test 가 직접 읽는다(상대 경로 + .ts).
// api: GET /stores/:id/transition-check 의 closing(막힘 + 폐점하면 처리될 것), PUT /stores/:id 폐점 응답의 closing(처리한 수).
import { formatDateTime } from "./format.ts";
import type { components } from "./api-types.generated.ts";

type Schemas = components["schemas"];

/** 폐점 확인 — 점포별(stores)과 합계(total). 점포 하나면 stores[0] 과 total 이 같다 */
export type StoreClosingCheck = Schemas["StoreClosingCheckResponseDto"];
export type StoreClosingCounts = Schemas["StoreClosingCountsDto"];
/** 폐점 저장 결과 — 점포별(stores, storeName · storeCode)과 합계(total) */
export type StoreClosingResult = Schemas["StoreClosingResultResponseDto"];
export type StoreClosingRetirement = Schemas["StoreClosingRetirementDto"];

/**
 * 폐점을 막는 퇴근하지 않은 출근 — 건수는 가려진 직원 것까지 더한다(api isBlocked 와 같은 기준: count + hiddenCount > 0).
 * first 는 이름을 보일 수 있는 것 중 가장 이른 건이고, recordedAt 은 이미 화면 표기(한국 시간)로 바꾼 글자다
 */
export type ClosingBlock = {
  count: number;
  first: { name: string; recordedAt: string } | null;
  /** 할 일 — 다음 날이 지나 직원 앱으로 퇴근할 수 없으면 보정, 아니면 퇴근을 기다린다 */
  guide: string;
};

/** 폐점 확인에서 막힘을 꺼낸다. 막히지 않았으면 null */
export function closingBlockOf(counts: Pick<StoreClosingCounts, "openCheckIns">): ClosingBlock | null {
  const { count, hiddenCount, first } = counts.openCheckIns;
  const total = count + hiddenCount;
  if (total <= 0) return null;
  return {
    count: total,
    first: first ? { name: first.name, recordedAt: formatDateTime(first.recordedAt) } : null,
    // 가려진 건만 있으면 본사는 출퇴근 현황에서도 그 줄을 볼 수 없다(ATT-30) — 가맹점이 퇴근 등록 · 보정하게 한다
    guide: first
      ? first.isCheckOutExpired
        ? "출퇴근 현황에서 보정으로 닫아 주세요."
        : "퇴근이 등록된 뒤 다시 해 주세요."
      : "본사에서 볼 수 없는 직원의 출근입니다. 가맹점에서 퇴근 등록 · 보정한 뒤 다시 해 주세요.",
  };
}

/** 확인 팝업의 한 줄 — 수가 0 인 줄은 뺀다 */
export type ClosingLine = { key: string; text: string; note?: string };

const n = (value: number) => value.toLocaleString("ko-KR");

/** 폐점하면 함께 처리될 것(확인 팝업). 급여명세서는 처리하지 않으므로 여기 넣지 않는다 — closingPayslipText */
export function closingCheckLines(counts: StoreClosingCounts): ClosingLine[] {
  const lines: (ClosingLine | false)[] = [
    counts.retiringStaff > 0 && { key: "staff", text: `근무 중인 직원 ${n(counts.retiringStaff)}명 퇴직(퇴직일 오늘)` },
    counts.draftContracts > 0 && { key: "draft", text: `임시저장 근로계약 ${n(counts.draftContracts)}건 종료` },
    counts.pendingSendContracts > 0 && { key: "send", text: `발송 대기 근로계약 ${n(counts.pendingSendContracts)}건 종료 · 초대 무효` },
    counts.pendingSignatureContracts > 0 && {
      key: "sign",
      text: `서명 대기 · 수정 요청 근로계약 ${n(counts.pendingSignatureContracts)}건 종료`,
    },
  ];
  return lines.filter((line): line is ClosingLine => Boolean(line));
}

/** 확정하지 않은 급여명세서 안내 — 폐점이 처리하지 않고 알리기만 한다. 없으면 null */
export function closingPayslipText(counts: Pick<StoreClosingCounts, "unconfirmedPayslips">): string | null {
  return counts.unconfirmedPayslips > 0 ? `확정하지 않은 급여명세서 ${n(counts.unconfirmedPayslips)}건은 폐점 뒤에도 처리할 수 있습니다.` : null;
}

/** 폐점 저장 뒤 처리한 것(결과 안내). 처리한 것이 없으면 빈 목록 */
export function closingResultLines(total: StoreClosingRetirement): ClosingLine[] {
  const contracts = total.draftContracts + total.pendingSendContracts + total.pendingSignatureContracts;
  const contractParts = [
    total.draftContracts > 0 && `임시저장 ${n(total.draftContracts)}건`,
    total.pendingSendContracts > 0 && `발송 대기 ${n(total.pendingSendContracts)}건`,
    total.pendingSignatureContracts > 0 && `서명 대기 · 수정 요청 ${n(total.pendingSignatureContracts)}건`,
  ].filter(Boolean);
  const lines: (ClosingLine | false)[] = [
    total.retiringStaff > 0 && {
      key: "staff",
      text: `직원 ${n(total.retiringStaff)}명 퇴직 처리`,
      note: total.pulledForwardStaff > 0 ? `퇴직일을 오늘로 앞당긴 ${n(total.pulledForwardStaff)}명 포함` : undefined,
    },
    contracts > 0 && { key: "contracts", text: `근로계약 ${n(contracts)}건 종료`, note: contractParts.join(", ") },
    total.expiredInvitations > 0 && { key: "invitations", text: `초대 ${n(total.expiredInvitations)}건 만료` },
  ];
  return lines.filter((line): line is ClosingLine => Boolean(line));
}

/** 확인 값(closing)을 받지 못했을 때 확인 창에 대신 보이는 안내 — 되돌릴 수 없는 결과를 모른 채 폐점하지 않게 무엇이 처리되는지는 말한다 */
export const CLOSING_COUNTS_UNKNOWN =
  "함께 처리될 직원 · 근로계약 수를 확인하지 못했습니다. 폐점하면 근무 중인 직원은 오늘 날짜로 퇴직되고, 대기 중인 근로계약은 종료됩니다.";

/** 폐점 저장 결과를 모를 때(5xx · 연결 끊김) 덧붙이는 안내 — 폐점됐다면 퇴직 · 계약 종료도 이미 끝났다 */
export const CLOSING_UNKNOWN_RESULT_NOTE = "폐점됐다면 근무 중인 직원 퇴직 · 대기 근로계약 종료도 함께 처리됐습니다. 직원 목록에서 확인해 주세요.";

/** 폐점 저장이 확인과 저장 사이에 생긴 출근으로 막혔다(409) — api 오류 본문의 code */
export const OPEN_CHECK_IN = "OPEN_CHECK_IN";
