import { ApiError, authHeaders, deniedMessageOf, getEnum, request } from "@/lib/api";
import type { ContractFormLabels } from "./contract-form";
import type { MinimumWage } from "./contract-form-model";

export type StoreOption = { storeId: number; name: string };

/**
 * 작성 · 이어 쓰기 화면이 같이 쓰는 선택지. 근무지 · 최저임금은 관리자 토큰으로만 받는다 — 근무지는 탭 BP 의 점포다
 * (GET /contracts/store-options, WHALEERP-638. authHeaders 가 X-Bp-Code-Id 를 싣는다).
 * 세션이 없거나 만료(401)면 빈 목록과 signedIn=false 로 그리고 저장을 막는다. api 의 거절(BP 를 고르지 않은 플랫폼 계정 400 ·
 * 작성 · 수정 권한 없음 403 · 없는 BP 404)은 오류 화면 대신 그 문장(denied)을 화면이 폼 자리에 보인다. 이어 쓰기 · 재계약은
 * 같은 탭 BP 로 계약을 먼저 읽어, 없는 BP 면 그 404 로 찾을 수 없음 화면이 된다.
 * 지금 최저임금(공통코드 하나, WHALEERP-595)은 시급 칸 도움말 · 수습 중 시급 확인에만 쓴다 — 받지 못하면(권한 없음 403 · 그 밖의
 * 실패) null 로 화면을 그대로 그리고, 저장하면 api 가 같은 값으로 다시 본다. 401 은 근무지와 함께 로그인 필요로 처리한다.
 */
export async function loadFormData(): Promise<{
  stores: StoreOption[];
  labels: ContractFormLabels;
  signedIn: boolean;
  denied: string | null;
  minimumWage: MinimumWage | null;
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
  if (!headers.Authorization) return { stores: [], labels, signedIn: false, denied: null, minimumWage: null };
  try {
    const [{ items }, minimumWage] = await Promise.all([
      request<{ items: StoreOption[] }>("/contracts/store-options?pageSize=200", { headers }),
      request<MinimumWage>("/contracts/minimum-wage", { headers }).then(
        (r) => r,
        (e: unknown) => {
          if (e instanceof ApiError && e.status === 401) return Promise.reject(e);
          // 권한 없음(403)은 화면이 권한 안내만 그린다. 그 밖의 실패는 검사 · 도움말이 조용히 빠지므로 남긴다
          if (!(e instanceof ApiError && e.status === 403)) console.error("[contracts] 최저임금 조회 실패", e);
          return null;
        },
      ),
    ]);
    return { stores: items, labels, signedIn: true, denied: null, minimumWage };
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return { stores: [], labels, signedIn: false, denied: null, minimumWage: null };
    const denied = deniedMessageOf(e);
    if (denied !== null) return { stores: [], labels, signedIn: true, denied, minimumWage: null };
    throw e;
  }
}
