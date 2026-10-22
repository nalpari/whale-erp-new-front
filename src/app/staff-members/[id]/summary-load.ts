import { unstable_rethrow } from "next/navigation";
import { ApiError, getEnum } from "@/lib/api";
import type { EnumValue } from "@/lib/enums";
import { labelsOrNull } from "./contract-summary";
import { areaFailureOf, type AreaResult } from "./summary-view";

// 직원 상세 영역(WHALEERP-184)이 데이터를 받는 곳. 화면 조각(contract-box.tsx · summary-boxes.tsx)이 함께 쓴다.

/**
 * 영역 하나를 받는다. 영역 메뉴 조회 권한이 없는 403(「조회 권한이 없습니다.」)은 정상이라 로그를 남기지 않는다 — 직원 정보 관리
 * 권한만 켠 그룹이 있다. 나머지 실패는 원인을 서버 로그에 남긴다.
 */
export async function loadArea<T>(what: string, load: () => Promise<T>): Promise<AreaResult<T>> {
  try {
    return { kind: "ok", data: await load() };
  } catch (error) {
    unstable_rethrow(error);
    const status = error instanceof ApiError ? error.status : null;
    const kind = areaFailureOf(status, error instanceof ApiError ? error.message : null);
    if (kind === "error") console.error(`직원 상세 ${what}: 받지 못했습니다 (status ${status ?? "연결 실패"})`, error);
    return { kind };
  }
}

/**
 * enum 한글. 받지 못했거나 응답에 그 enum 이 빠져 비었어도 영역은 그린다 — 그 값만 「-」가 되고(영문 값을 보이지 않는다) 원인은
 * 서버 로그에 남긴다(빈 목록은 getEnum 이 남긴다). 이메일 칸의 가입 상태와 같다.
 */
export async function loadLabels(name: string): Promise<EnumValue[] | null> {
  try {
    return labelsOrNull(await getEnum(name));
  } catch (error) {
    unstable_rethrow(error);
    console.error(`직원 상세: GET /enums/${name} 를 받지 못했습니다`, error);
    return null;
  }
}
