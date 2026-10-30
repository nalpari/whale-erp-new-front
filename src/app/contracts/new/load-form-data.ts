import { ApiError, authHeaders, deniedMessageOf, getEnum, request } from "@/lib/api";
import type { ContractFormLabels } from "./contract-form";

export type StoreOption = { storeId: number; name: string };

/**
 * 작성 · 이어 쓰기 화면이 같이 쓰는 선택지. 근무지는 관리자 토큰으로만 받는다 — 탭 BP 의 점포다(GET /contracts/store-options,
 * WHALEERP-638. authHeaders 가 X-Bp-Code-Id 를 싣는다).
 * 세션이 없거나 만료(401)면 빈 목록과 signedIn=false 로 그리고 저장을 막는다. api 의 거절(BP 를 고르지 않은 플랫폼 계정 400 ·
 * 작성 · 수정 권한 없음 403 · 없는 BP 404)은 오류 화면 대신 그 문장(denied)을 화면이 폼 자리에 보인다.
 */
export async function loadFormData(): Promise<{
  stores: StoreOption[];
  labels: ContractFormLabels;
  signedIn: boolean;
  denied: string | null;
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
  if (!headers.Authorization) return { stores: [], labels, signedIn: false, denied: null };
  try {
    const { items } = await request<{ items: StoreOption[] }>("/contracts/store-options?pageSize=200", {
      headers,
    });
    return { stores: items, labels, signedIn: true, denied: null };
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return { stores: [], labels, signedIn: false, denied: null };
    const denied = deniedMessageOf(e);
    if (denied !== null) return { stores: [], labels, signedIn: true, denied };
    throw e;
  }
}
