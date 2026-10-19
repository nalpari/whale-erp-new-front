// 플랫폼 관리자 상세에서 어느 버튼을 보일지. 화면 없이 node --test 로 바로 돌린다(next/* 를 import 하지 않는다).
// 화면은 미리 숨기거나 흐리게만 한다 — 막는 것은 api 다(메뉴 권한 · 마스터 보호 · 본인 보호).

export type AdminActionViewer = { adminAccountId: number; roleTypeCode: string };
export type AdminActionTarget = { adminAccountId: number; roleTypeCode: string };
export type AdminActionPermission = { update: boolean; delete: boolean };

/**
 * - 수정 · 비밀번호 초기화는 메뉴 수정 권한, 삭제는 삭제 권한이 있을 때.
 * - 플랫폼 관리자(PA)가 플랫폼 마스터(PM) 계정을 보면 셋 다 숨긴다 — 플랫폼 마스터 계정은 플랫폼 마스터만 고친다(F-RVDLOW).
 * - 본인 계정이면 삭제 · 초기화는 흐리게 둔다(isSelf) — 버튼은 보이되 누를 수 없다(SYSTEM-1).
 */
export function adminActionsOf(me: AdminActionViewer, target: AdminActionTarget, can: AdminActionPermission) {
  const guarded = me.roleTypeCode === "PA" && target.roleTypeCode === "PM";
  return { canUpdate: can.update && !guarded, canDelete: can.delete && !guarded, isSelf: me.adminAccountId === target.adminAccountId };
}
