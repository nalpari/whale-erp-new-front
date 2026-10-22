import type { RoleGroupDetail } from "@/lib/platform-role-groups";

// 플랫폼 권한 관리 화면들이 같이 쓰는 조각. BP 권한 그룹 관리와 같이 쓰는 것은 components/role-groups 에 있다.

export { actorOf, CARD, FailedBand, FieldMessage, InfoBand, reasonLabel, unknownResult, WhenWho } from "@/components/role-groups/role-parts";

export const PATH = "/platform-role-groups";

/** 오른쪽 칸의 상세 — 고르지 않음(null) · 불러옴 · 실패. page · roles-screen · role-side 가 같이 쓴다 */
export type RoleDetailState = { role: RoleGroupDetail } | { failed: string } | null;
