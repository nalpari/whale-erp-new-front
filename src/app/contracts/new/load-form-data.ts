import { ApiError, authHeaders, getEnum, request } from "@/lib/api";
import type { ContractFormLabels } from "./contract-form";
import type { MinimumWage } from "./contract-form-model";

export type StoreOption = { storeId: number; name: string };

/**
 * 작성 · 이어 쓰기 화면이 같이 쓰는 선택지. 근무지 · 최저임금은 관리자 토큰으로만 받는다.
 * 세션이 없거나 만료(401)면 빈 목록과 signedIn=false 로 그리고 저장을 막는다.
 * 최저임금(공통코드, WHALEERP-595)은 시급 칸 도움말 · 수습 중 시급 확인에 쓴다. 작성 · 수정 권한이 없어 받지 못하면(403) 빈
 * 목록이다 — 그 화면은 권한 안내만 그리고, 저장하면 api 가 같은 값으로 다시 본다.
 */
export async function loadFormData(): Promise<{
  stores: StoreOption[];
  labels: ContractFormLabels;
  signedIn: boolean;
  minimumWages: MinimumWage[];
}> {
  const [employmentType, weekday, payMonth, payMethod, contractStatus, contractMethod, attachmentFileType, gender, headers] = await Promise.all([
    getEnum("EmploymentType"),
    getEnum("Weekday"),
    getEnum("PayMonth"),
    getEnum("PayMethod"),
    getEnum("ContractStatus"),
    getEnum("ContractMethod"),
    getEnum("AttachmentFileType"),
    getEnum("Gender"),
    authHeaders(),
  ]);
  const labels = { employmentType, weekday, payMonth, payMethod, contractStatus, contractMethod, attachmentFileType, gender };
  if (!headers.Authorization) return { stores: [], labels, signedIn: false, minimumWages: [] };
  try {
    const [{ items }, minimumWages] = await Promise.all([
      request<{ items: StoreOption[] }>("/stores/options?pageSize=200", { headers }),
      request<{ items: MinimumWage[] }>("/contracts/minimum-wages", { headers }).then(
        (r) => r.items,
        (e: unknown) => (e instanceof ApiError && e.status === 403 ? [] : Promise.reject(e)),
      ),
    ]);
    return { stores: items, labels, signedIn: true, minimumWages };
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return { stores: [], labels, signedIn: false, minimumWages: [] };
    throw e;
  }
}
