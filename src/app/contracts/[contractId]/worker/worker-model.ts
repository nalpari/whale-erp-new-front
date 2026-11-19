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

export type WorkerField = "name" | "phone" | "birthDate" | "gender";

/**
 * 저장 전에 화면이 막는 것을 칸마다 — 화면은 그 칸 아래에 보인다(WHALEERP-631). 다섯 칸 모두 필수(외국인 여부는 체크라 늘 값이
 * 있다). api 가 같은 것을 다시 본다
 */
export function workerProblemsByField(f: WorkerForm): Partial<Record<WorkerField, string>> {
  const out: Partial<Record<WorkerField, string>> = {};
  if (!f.name.trim()) out.name = "이름을 입력하세요.";
  if (!/^[0-9]{10,11}$/.test(digits(f.phone))) out.phone = "휴대전화번호는 숫자 10~11자리입니다.";
  if (!f.birthDate) out.birthDate = "생년월일을 입력하세요.";
  if (!f.gender) out.gender = "성별을 선택하세요.";
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
 * 처음 값(상세에서 읽은 값)에서 바뀐 것이 없는가 — 저장하면 다시 보내므로(서명 기한 새로 30일 · 앞서 나간 링크 무효) 바뀐 것이 없으면
 * 저장하지 않는다(WHALEERP-681, 2026-11-16 김민식). 비교는 api 에 보낼 값(이름 앞뒤 공백 · 번호 하이픈을 뺀 값)으로 한다.
 */
export function workerUnchanged(f: WorkerForm, initial: WorkerForm): boolean {
  const a = workerBody(f);
  const b = workerBody(initial);
  return a.name === b.name && a.phone === b.phone && a.birthDate === b.birthDate && a.gender === b.gender && a.isForeigner === b.isForeigner;
}

/**
 * 바뀐 것 없이 [저장]을 눌렀을 때 — 같은 값 저장은 상세에 [재발송]이 보일 때만 막고(canShowResend) 그리로 안내한다. [재발송]이 없으면
 * (수정 요청 · api canResend 거짓) 같은 값 저장이 다시 보내는 유일한 길이라 막지 않는다
 */
export const WORKER_UNCHANGED = "변경된 내용이 없습니다. 동일한 내용으로 다시 보내려면 상세 화면에서 [재발송]을 눌러 주세요.";

/**
 * 저장이 끝났을 때의 토스트(WHALEERP-681 — 전에는 말없이 상세로 갔다). 다시 보냈는지는 번호(가입 초대 · 소속 추가 확인 · 가입한 직원)에
 * 따라 달라 저장만 말한다 — 보내기가 실패했으면 이 토스트 없이 상세의 실패 안내로 간다
 */
export const WORKER_SAVED = "근로자 정보를 저장했습니다.";

/**
 * 저장하면 어떻게 되는지(2026-10-19 재영). 서명 기한은 새로 30일이다. 가입 초대 대상(가입하지 않았고 계정이 없는 번호)이면
 * 알림톡을 곧바로 다시 보내고 앞서 보낸 초대 코드가 무효가 된다. 이 점포에 가입한 직원은 앱 알림이 나간다(api #259). 계정만 있는
 * 번호(소속 추가 확인)는 보내지 않는다(front #58 리뷰). 화면은 그 번호에 계정이 있는지 모르므로 조건을 문구에 둔다.
 */
// 화면에는 한 문장씩 줄을 나눠 보인다. 사장님이 읽기 쉬운 말로 — 상태 이름 대신 무슨 일이 일어나는지, 「초대 코드」 대신 「전에 보낸 초대」(2026-11-19 사용자 지정)
export const workerSaveNote = (status: string | null | undefined): string[] =>
  status === "PENDING_SEND"
    ? [
        "수정한 내용을 저장하면 서명 기한이 오늘부터 30일로 다시 설정됩니다.",
        "휴대전화번호를 변경한 경우, 저장 후 새 번호로 가입 초대를 다시 보내며 이전에 보낸 초대는 더 이상 사용할 수 없습니다.",
        "변경한 번호로 이미 가입한 직원이 있으면 가입 초대 없이 해당 직원에게 바로 서명을 요청합니다.",
      ]
    : [
        "수정한 내용을 저장하면 서명 기한이 오늘부터 30일로 다시 설정됩니다.",
        "직원이 수정을 요청한 계약은 저장 후 직원에게 다시 서명을 요청합니다.",
        "아직 앱에 가입하지 않은 직원에게는 저장 후 가입 초대를 다시 보내며, 이전에 보낸 초대는 더 이상 사용할 수 없습니다.",
      ];
