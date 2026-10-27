"use client";

import type { DeleteDialogActions } from "@/components/role-groups/role-delete-dialog";
import type { RoleFormActions } from "@/components/role-groups/role-form";
import type { MenuDialogActions } from "@/components/role-groups/role-menu-dialog";
import type { BpRoleGroupDetail } from "@/lib/bp-role-groups";
import {
  createBpRoleGroupAction,
  deleteBpRoleGroupAction,
  getBpDeletionCandidatesAction,
  getBpRoleGroupMenusAction,
  getFranchiseMasterMenusAction,
  previewBpRoleGroupMenusAction,
  saveBpRoleGroupMenusAction,
  updateBpRoleGroupAction,
} from "./actions";

/** 옛 경로(폴더) — revalidatePath 는 rewrite 의 목적지 경로를 받는다. 화면 주소는 bpPath(탭 BP, PATH). */
export const PATH = "/bp-role-groups";

/** 오른쪽 칸의 상세 — 고르지 않음(null) · 불러옴 · 실패 */
export type BpRoleDetailState = { role: BpRoleGroupDetail } | { failed: string } | null;

/** 공용 양식 · 팝업에 넘길 action. 탭 BP 는 액션이 화면 주소로 POST 되어 proxy 가 헤더로 싣는다. */
const ACTIONS = {
  form: { create: createBpRoleGroupAction, update: updateBpRoleGroupAction } satisfies RoleFormActions,
  remove: { candidates: getBpDeletionCandidatesAction, remove: deleteBpRoleGroupAction } satisfies DeleteDialogActions,
  menus: { load: getBpRoleGroupMenusAction, preview: previewBpRoleGroupMenusAction, save: saveBpRoleGroupMenusAction } satisfies MenuDialogActions,
  // 가맹마스터 메뉴설정 보기 — save 가 없어 팝업은 볼 수만 있다
  franchiseMaster: { load: () => getFranchiseMasterMenusAction() } satisfies MenuDialogActions,
};

export const useBpActions = () => ACTIONS;
