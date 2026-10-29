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
  if (!f.name.trim()) out.push("이름을 입력하세요.");
  if (!/^[0-9]{10,11}$/.test(digits(f.phone))) out.push("휴대전화번호는 숫자 10~11자리입니다.");
  if (!f.birthDate) out.push("생년월일을 입력하세요.");
  if (!f.gender) out.push("성별을 고르세요.");
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

/**
 * 저장하면 어떻게 되는지(2026-10-19 재영). 서명 기한은 새로 30일이다. 가입 초대 대상(가입하지 않았고 계정이 없는 번호)이면
 * 알림톡을 곧바로 다시 보내고 앞서 보낸 초대 코드가 무효가 된다. 이 점포에 가입한 직원은 앱 알림이 나간다(api #259). 계정만 있는
 * 번호(소속 추가 확인)는 보내지 않는다(front #58 리뷰). 화면은 그 번호에 계정이 있는지 모르므로 조건을 문구에 둔다.
 */
export const workerSaveNote = (status: string | null | undefined) =>
  status === "PENDING_SEND"
    ? "저장하면 서명 기한은 새로 30일이다. 고친 번호가 가입 초대 대상이면 곧바로 다시 보내고 앞서 보낸 초대 코드는 쓸 수 없다 — 계정이 있는 번호로 고치면 보내지 않고 서명 대기가 된다."
    : "저장하면 서명 기한은 새로 30일이다(수정 요청이면 서명 대기로). 가입 초대 대상이면 곧바로 다시 보내고 앞서 보낸 초대 코드는 쓸 수 없다.";
