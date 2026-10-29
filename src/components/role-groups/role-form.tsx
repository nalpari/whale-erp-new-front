"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Button, Field, Textarea, TextField, useToast } from "@/components/common";
import { useCodeLabel } from "@/components/site/code-label";
import type { ActionResult } from "@/lib/role-group-actions";
import {
  afterConflict,
  isChangedMeanwhile,
  isDirty,
  ROLE_DESCRIPTION_MAX,
  ROLE_NAME_MAX,
  roleFieldOf,
  syncRoleForm,
  validateRoleForm,
  type RoleFormBase,
  type RoleFormErrors,
  type RoleFormValues,
} from "@/lib/role-form-sync";
import { FailedBand, FieldMessage, unknownResult } from "./role-parts";

// 권한 등록 · 수정 양식(권한명 · 설명). 플랫폼 권한 관리와 BP 권한 그룹 관리가 같이 쓴다 — 저장은 화면마다 다른 api 라 actions 로 받는다.
// 등록은 유형을 고르지 않는다 — 만들 유형(createTypeCode)은 화면이 정하고 읽기 전용으로 보인다.

type Form = RoleFormValues;
type Body = { name: string; description: string | null };

export type RoleFormActions = {
  create: (body: Body) => Promise<ActionResult<{ roleGroupId: number; roleCode: string }>>;
  update: (id: number, body: Body & { updatedAt: string }) => Promise<ActionResult>;
};
type EditedRole = { roleGroupId: number; name: string; description: string | null; updatedAt: string };

export function RoleForm(
  props: { actions: RoleFormActions } & (
    | { mode: "create"; createTypeCode: string; onCancel: () => void; onDone: (id: number) => void; role?: never; extra?: never; deleteButton?: never }
    | { mode: "edit"; role: EditedRole; extra: ReactNode; deleteButton: ReactNode; createTypeCode?: never; onCancel?: never; onDone?: never }
  ),
) {
  const router = useRouter();
  const toast = useToast();
  const roleTypeLabel = useCodeLabel("ROLE_TYPE");
  // 기준값 — 마지막으로 맞춘 서버 값과 그때의 updatedAt. 저장은 이 updatedAt 으로 보내, 그 사이 다른 사람이 고쳤으면 api 가 409 로 알린다.
  // 같은 권한의 최신 정보가 와도 칸은 다시 그리지 않고(roles-screen 의 key) syncRoleForm 규칙으로 기준값 · 칸을 맞춘다 — 메뉴만 바뀌면
  // updatedAt 만 올리고, 칸을 손대지 않았으면 새 값으로 채우고, 고치던 중이면 기준을 그대로 둔다. 동시 수정 409 를 받으면 받아 둔 최신 값으로
  // 바로 다시 채우고(afterConflict), 아직 못 받았으면 refresh 로 올 값으로 맞춘다.
  const server: RoleFormBase | null =
    props.mode === "edit" ? { name: props.role.name, description: props.role.description ?? "", updatedAt: props.role.updatedAt } : null;
  const [base, setBase] = useState<RoleFormBase>(() => server ?? { name: "", description: "", updatedAt: "" });
  const [form, setForm] = useState<Form>(() => ({ name: base.name, description: base.description }));
  const [errors, setErrors] = useState<RoleFormErrors>({});
  const [failure, setFailure] = useState<{ message: string; detail: string } | null>(null);
  const [saving, startSaving] = useTransition();
  const id = props.mode === "edit" ? `role-${props.role.roleGroupId}` : "role-new";
  const [seenUpdatedAt, setSeenUpdatedAt] = useState(server?.updatedAt ?? "");
  const [reloadOnRefresh, setReloadOnRefresh] = useState(false);
  if (server && server.updatedAt !== seenUpdatedAt) {
    setSeenUpdatedAt(server.updatedAt);
    const next = syncRoleForm(base, form, server, reloadOnRefresh);
    if (reloadOnRefresh) {
      setReloadOnRefresh(false);
      setErrors({});
    }
    setBase(next.base);
    if (next.form !== form) setForm(next.form);
  }
  // 고친 것이 없으면 [저장]을 막는다 — 바뀐 것 없는 저장이 남의 변경을 덮어쓸 여지를 없앤다
  const dirty = props.mode === "create" || isDirty(base, form);

  const handleFieldChange = (key: keyof Form, value: string) => {
    // 다시 채우기를 기다리는 동안 손으로 고치기 시작하면 그 입력을 우선한다
    setReloadOnRefresh(false);
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSave = () => {
    const found = validateRoleForm(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    const body = { name: form.name.trim(), description: form.description.trim() || null };
    startSaving(async () => {
      if (props.mode === "create") {
        const created = await props.actions.create(body).catch(unknownResult("등록"));
        if (created.ok) {
          setFailure(null);
          toast(`등록했습니다. 권한 코드 ${created.roleCode} — 목록의 메뉴설정 [설정]으로 메뉴 권한을 정해 주세요.`);
          return props.onDone(created.roleGroupId);
        }
        return fail(created);
      }
      const result = await props.actions.update(props.role.roleGroupId, { ...body, updatedAt: base.updatedAt }).catch(unknownResult("수정"));
      if (!result.ok) return fail(result);
      // 저장한 값이 새 기준이다 — 곧 올 최신 정보는 값이 같아 updatedAt 만 올린다(syncRoleForm)
      const saved = { name: body.name, description: body.description ?? "" };
      setBase((b) => ({ ...b, ...saved }));
      setForm(saved);
      setFailure(null);
      toast("updated");
    });
  };

  /** api 가 칸 하나의 것이라고 말하면(형식 · 이름 중복) 그 칸 아래, 그 밖은 띠로 */
  const fail = (result: { status?: number; message: string }) => {
    const field = roleFieldOf(result.message);
    if (field && (result.status === 400 || result.status === 409)) return setErrors({ [field]: result.message });
    // 동시 수정 409 만 최신 값으로 칸을 다시 채운다 — 고정 권한 같은 다른 409 는 updatedAt 이 그대로라 다시 채우기 표시가 남아,
    // 나중에 메뉴 저장으로 updatedAt 이 바뀔 때 고치던 칸을 덮어쓴다. 그 밖은 입력을 그대로 둔다
    const reload = result.status === 409 && props.mode === "edit" && isChangedMeanwhile(result.message);
    setFailure({ message: result.message, detail: reload ? "최신 정보로 칸을 다시 채웠습니다. 확인한 뒤 다시 저장해 주세요." : "입력한 값은 그대로 두었습니다." });
    if (reload && server) {
      // 받아 둔 최신 값으로 바로 다시 채운다 — 아직 못 받았으면 refresh 로 올 값으로 맞춘다(afterConflict)
      const next = afterConflict(base, form, server);
      setBase(next.base);
      setForm(next.form);
      setErrors({});
      setReloadOnRefresh(next.waitForRefresh);
    }
    // 그 사이 바뀌었거나(409 동시 수정) 지워졌거나(404) 결과를 모르면 최신 정보를 받는다
    if (result.status === undefined || result.status === 404 || result.status === 409) router.refresh();
  };

  const describe = (key: keyof Form) => (errors[key] ? `${id}-${key}-error` : undefined);
  return (
    <>
      {props.mode === "create" && <h2 className="flex min-h-[34px] items-end text-[18px] font-semibold text-erp-ink">권한 등록</h2>}
      {failure && <FailedBand message={failure.message} detail={failure.detail} />}
      <div className="flex flex-col gap-[18px]">
        {props.mode === "create" && (
          // 유형 이름은 공통코드 ROLE_TYPE 에서 읽는다(네이밍 규칙 화면 문구)
          <Field label="권한유형" required>
            <TextField value={roleTypeLabel(props.createTypeCode)} readOnly aria-readonly />
          </Field>
        )}
        <div className="flex flex-col gap-[8px]">
          <Field label="권한명" required>
            <TextField
              value={form.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              maxLength={ROLE_NAME_MAX}
              placeholder="권한명을 입력해 주세요. (예: 프로모션 담당자)"
              aria-required
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={describe("name")}
              autoFocus={props.mode === "create"}
            />
          </Field>
          <FieldMessage id={`${id}-name-error`} message={errors.name} />
        </div>
        <div className="flex flex-col gap-[8px]">
          <Field label="설명">
            {/* 두 줄 정도만 쓰는 칸이라 높이를 줄였다(2026-10-26 사용자 지정, 전엔 4줄) */}
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              maxLength={ROLE_DESCRIPTION_MAX}
              placeholder="해당 권한에 대한 역할과 담당 업무를 입력해 주세요."
              aria-invalid={errors.description ? true : undefined}
              aria-describedby={describe("description")}
            />
          </Field>
          <FieldMessage id={`${id}-description-error`} message={errors.description} />
        </div>
      </div>
      {props.extra}
      {/* 버튼 줄은 가운데 — 마이페이지 패널(my-page-panel.tsx)과 같다(2026-10-26 사용자 지정, 전엔 양 끝 · 오른쪽 정렬) */}
      {/* 위 내용(최종수정)과의 간격을 입력칸 사이(18)와 같게 — 칸 간격 12 + 6(2026-10-26 사용자 지정) */}
      <div className="mt-[6px] flex justify-center gap-[6px]">
        {props.mode === "create" ? (
          <Button variant="off" onClick={props.onCancel} disabled={saving}>
            취소
          </Button>
        ) : (
          props.deleteButton
        )}
        <Button onClick={handleSave} disabled={saving || !dirty}>
          저장
        </Button>
      </div>
    </>
  );
}
