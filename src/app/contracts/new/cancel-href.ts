// 근로계약서 작성 화면 [취소]의 목적지. 서버 화면(new/page.tsx)만 쓴다 — 직원 화면 모듈을 가져오므로 클라이언트 컴포넌트가 읽는
// contract-list.ts 에 두지 않는다(근로계약 화면 번들에 직원 상세 요약 모듈이 딸려 가지 않게).
// node --test 가 이 파일을 직접 읽으므로 값 import 는 상대 경로 + .ts 로 쓴다.
import { staffEntryHrefOf } from "../../staff-members/[id]/employment-history.ts";
import { backHrefOf, withBack } from "../contract-list.ts";

/**
 * [취소]가 돌아갈 옛 경로 — 들어온 화면이다(WHALEERP-683). 재계약(?from=)은 그 계약 상세(돌아갈 목록 ?back= 은 이어 싣는다), 직원 정보
 * 관리 목록 · 직원 상세의 직원 초대 · 작성(?entry=)은 그 화면(staffEntryHrefOf — 직원 화면 규칙으로 다시 만든다), 그 밖에는 돌아갈
 * 목록(?back=)이다. 직원 화면 주소가 아닌 entry 는 버린다. 저장 · 임시저장 뒤 이동은 이것과 따로다(listAfterSave).
 */
export function cancelHrefOf(from: number | undefined, entry: string | string[] | undefined, back: string | string[] | undefined): string {
  if (from !== undefined) return withBack(`/contracts/${from}`, back);
  return staffEntryHrefOf(entry) ?? backHrefOf(back);
}
