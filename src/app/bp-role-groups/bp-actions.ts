"use client";

import { useMemo } from "react";
import type { DeleteDialogActions } from "@/components/role-groups/role-delete-dialog";
import type { RoleFormActions } from "@/components/role-groups/role-form";
import type { MenuDialogActions } from "@/components/role-groups/role-menu-dialog";
import { useCurrentBp } from "@/components/site/session-gate";
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

export const PATH = "/bp-role-groups";

/** 오른쪽 칸의 상세 — 고르지 않음(null) · 불러옴 · 실패 */
export type BpRoleDetailState = { role: BpRoleGroupDetail } | { failed: string } | null;

/** 공용 양식 · 팝업에 넘길 action 을 이 탭의 BP 에 묶는다. 화면은 주소의 BP 를 탭의 BP 와 맞춘 뒤에만 그린다(roles-screen). */
export function useBpActions() {
  const bp = useCurrentBp().bpCodeId;
  return useMemo(
    () => ({
      form: {
        create: (body) => createBpRoleGroupAction(bp, body),
        update: (id, body) => updateBpRoleGroupAction(bp, id, body),
      } satisfies RoleFormActions,
      remove: {
        candidates: (id) => getBpDeletionCandidatesAction(bp, id),
        remove: (id, input) => deleteBpRoleGroupAction(bp, id, input),
      } satisfies DeleteDialogActions,
      menus: {
        load: (id) => getBpRoleGroupMenusAction(bp, id),
        preview: (id, menus) => previewBpRoleGroupMenusAction(bp, id, menus),
        save: (id, menus, updatedAt) => saveBpRoleGroupMenusAction(bp, id, menus, updatedAt),
      } satisfies MenuDialogActions,
      // 가맹마스터 보기 — save 가 없어 팝업은 볼 수만 있다
      franchiseMaster: { load: () => getFranchiseMasterMenusAction(bp) } satisfies MenuDialogActions,
    }),
    [bp],
  );
}
