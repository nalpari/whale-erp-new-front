import { ApiError, getEnum, getSession, request } from "@/lib/api";
import type { ContractFormLabels } from "./contract-form";

export type StoreOption = { storeId: number; name: string };

/**
 * 작성 · 이어 쓰기 화면이 같이 쓰는 선택지. 근무지는 관리자 토큰으로만 받는다.
 * 세션이 없거나 만료(401)면 빈 목록과 signedIn=false 로 그리고 저장을 막는다.
 */
export async function loadFormData(): Promise<{
  stores: StoreOption[];
  labels: ContractFormLabels;
  signedIn: boolean;
  token: string | null;
}> {
  const [employmentType, weekday, payMonth, payMethod, contractStatus, contractMethod, attachmentFileType, gender, session] = await Promise.all([
    getEnum("EmploymentType"),
    getEnum("Weekday"),
    getEnum("PayMonth"),
    getEnum("PayMethod"),
    getEnum("ContractStatus"),
    getEnum("ContractMethod"),
    getEnum("AttachmentFileType"),
    getEnum("Gender"),
    getSession(),
  ]);
  const labels = { employmentType, weekday, payMonth, payMethod, contractStatus, contractMethod, attachmentFileType, gender };
  if (!session) return { stores: [], labels, signedIn: false, token: null };
  try {
    const { items } = await request<{ items: StoreOption[] }>("/stores/options?pageSize=200", {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    return { stores: items, labels, signedIn: true, token: session.accessToken };
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return { stores: [], labels, signedIn: false, token: null };
    throw e;
  }
}
