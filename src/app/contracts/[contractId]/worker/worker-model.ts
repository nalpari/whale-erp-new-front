// 날인 전 근로자 정보 수정(WHALEERP-125 「본인 대조」 · 126)의 순수 로직 — 상세 값 → 폼, 폼 → 막는 이유 · 본문.
// 테스트: node --test "src/app/contracts/[contractId]/worker/worker-model.test.ts"

import type { components } from "../../../../lib/api-types.generated";
import { digits, formatPhone, type ContractDetail, type Gender } from "../../new/contract-form-model.ts";

export type WorkerBody = components["schemas"]["UpdateWorkerDto"];

/** 고칠 수 있는 상태 — 발송한 뒤 날인 전. 임시저장은 이어 쓰기에서 고친다 */
export const WORKER_EDITABLE = ["PENDING_SEND", "PENDING_SIGNATURE", "CORRECTION_REQUESTED"] as const;
export const isWorkerEditable = (status: string | null | undefined) =>
  (WORKER_EDITABLE as readonly string[]).includes(status ?? "");

export interface WorkerForm {
  name: string;
  phone: string;
  birthDate: string;
  gender: Gender | "";
  isForeigner: boolean;
}

export const workerOf = (d: Pick<ContractDetail, "name" | "phone" | "birthDate" | "gender" | "isForeigner">): WorkerForm => ({
  name: d.name,
  phone: formatPhone(d.phone),
  birthDate: d.birthDate ?? "",
  gender: d.gender ?? "",
  isForeigner: d.isForeigner,
});

/** 저장 전에 화면이 막는 것. 다섯 칸 모두 필수(외국인 여부는 체크라 늘 값이 있다). api 가 같은 것을 다시 본다 */
export function workerProblems(f: WorkerForm): string[] {
  const out: string[] = [];
  if (!f.name.trim()) out.push("이름을 입력하세요");
  if (!/^[0-9]{10,11}$/.test(digits(f.phone))) out.push("휴대전화번호는 숫자 10~11자리입니다");
  if (!f.birthDate) out.push("생년월일을 입력하세요");
  if (!f.gender) out.push("성별을 고르세요");
  return out;
}

export function workerBody(f: WorkerForm, replaceContractIds?: number[]): WorkerBody {
  return {
    name: f.name.trim(),
    phone: digits(f.phone),
    birthDate: f.birthDate,
    gender: f.gender as Gender,
    isForeigner: f.isForeigner,
    ...(replaceContractIds ? { replaceContractIds } : {}),
  };
}

/** 저장하면 상태가 어떻게 되는지 — 서명 대기 · 수정 요청은 발송 대기로 돌아가 다시 보낸다 */
export const workerSaveNote = (status: string | null | undefined) =>
  status === "PENDING_SEND"
    ? "저장해도 발송 대기 그대로이고, 발송하면 고친 번호로 보낸다."
    : "저장하면 발송 대기로 돌아가고, 다시 발송하면 새 서명 기한으로 보낸다.";
