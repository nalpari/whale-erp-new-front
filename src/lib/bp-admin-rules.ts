// BP 관리자 화면에서 어느 버튼을 보이고 어느 칸을 막을지. 화면 없이 node --test 로 바로 돌린다(next/* 를 import 하지 않는다).
// 누가 누구를 고칠 수 있는지는 api 가 상세의 actions 로 계산해 준다 — 여기서는 그 값과 메뉴 권한을 합칠 뿐 규칙을 다시 짜지 않는다.
// 막는 것은 api 다. 화면은 미리 숨기거나 막기만 한다.
import type { BpAdminActions, BpAdminRoleType } from "./bp-admins";

export type BpAdminViewer = { roleTypeCode: string };
export type BpAdminPermission = { create: boolean; update: boolean };

/** 목록 [등록] — 등록 권한이 있고 가맹 관리자가 아닐 때(가맹 관리자는 어느 역할도 등록하지 않는다). */
export const canCreateBpAdmin = (viewer: BpAdminViewer, can: BpAdminPermission) => can.create && viewer.roleTypeCode !== "FA";

/** 등록할 수 있는 계정 역할 — 가맹 마스터는 가맹 관리자만, 그 밖(BP 마스터 · BP 관리자 · 플랫폼 사용자)은 BP 관리자 · 가맹 마스터. */
export const creatableRolesOf = (viewer: BpAdminViewer): BpAdminRoleType[] => (viewer.roleTypeCode === "FM" ? ["FA"] : ["BA", "FM"]);

/** 「전체 점포」를 고를 수 있는 역할 — BP 관리자뿐이다. 가맹 마스터 · 가맹 관리자는 늘 일부 점포다. */
export const allowsAllStores = (roleTypeCode: BpAdminRoleType | "") => roleTypeCode === "BA";

/**
 * 상세의 버튼.
 * - 수정은 메뉴 수정 권한과 api 의 canUpdate 가 모두 참일 때.
 * - 비밀번호 초기화는 미사용 계정에도 보인다(목업 기준). 본인 계정은 api 가 수정을 허락할 때만 버튼을 보이되 막는다 — 내 정보에서 바꾼다.
 */
export function detailButtonsOf(actions: BpAdminActions, can: Pick<BpAdminPermission, "update">) {
  const canUpdate = can.update && actions.canUpdate;
  return {
    canUpdate,
    showReset: can.update && (actions.canResetPassword || (actions.isSelf && actions.canUpdate)),
    resetBlocked: actions.isSelf || !actions.canResetPassword,
  };
}

/**
 * 수정 패널에서 막을 칸.
 * - 본인 계정은 기본정보(이름 · 휴대전화 · 이메일)만 고친다 — 권한 그룹 · 상태 · 범위 · 점포는 막는다.
 * - 권한 그룹 · 범위는 api 가 바꿀 수 없다고 한 때도 막는다(대상이 전체 점포인데 수정자가 일부 점포 담당 등 — 저장해도 그대로 남는다).
 * - 범위는 BP 관리자만 고른다(가맹 마스터 · 가맹 관리자는 늘 일부 점포).
 */
export function editLocksOf(target: { roleTypeCode: BpAdminRoleType; actions: BpAdminActions }) {
  const { isSelf, canChangeScope, canChangeRoleGroup } = target.actions;
  return {
    roleGroup: isSelf || !canChangeRoleGroup,
    status: isSelf,
    scope: isSelf || !canChangeScope || !allowsAllStores(target.roleTypeCode),
    stores: isSelf,
  };
}
