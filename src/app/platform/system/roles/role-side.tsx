"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, DetailTable, DetailValues, Field, Tag, Textarea, TextField, useToast, type DetailRow } from "@/components/common";
import { CodeLabel, useCodeLabel } from "@/components/site/code-label";
import { useMenuPermission } from "@/components/site/session-gate";
import type { EnumValue } from "@/lib/enums";
import {
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
import { formatDateTime } from "@/lib/format";
import { MENU_CODE } from "@/lib/menus";
import type { RoleGroupDetail } from "@/lib/platform-role-groups";
import { createRoleGroupAction, updateRoleGroupAction } from "./actions";
import { RoleDeleteDialog } from "./role-delete-dialog";
import { actorOf, CARD, FailedBand, FieldMessage, InfoBand, reasonLabel, unknownResult, type RoleDetailState } from "./role-parts";

// 오른쪽 고정 칸(데모 role-side) — 고른 권한 없음 · 수정 · 상세(고칠 수 없는 권한) · 등록 네 상태.
// 권한유형 · 권한코드는 읽기 전용이고 권한명 · 설명만 고친다. 고칠 수 있는지 · 지울 수 있는지와 막힌 이유는 api 상세가 준다
// (한글은 GET /enums/PlatformRoleGroupLockReason) — 수정은 권한 없음 · 본인 연결이 막고, 삭제는 여기에 고정 권한까지 막는다.
// 등록은 플랫폼 관리자(PA) 권한만 만든다.

type Form = RoleFormValues;

export function RoleSide({
  creating,
  detail,
  lockReasons,
  onCancelCreate,
  onCreated,
  onDeleted,
}: {
  creating: boolean;
  detail: RoleDetailState;
  lockReasons: EnumValue[];
  onCancelCreate: () => void;
  onCreated: (id: number) => void;
  onDeleted: () => void;
}) {
  const role = !creating && detail && "role" in detail ? detail.role : null;
  return (
    <section className={`${CARD} w-[464px] shrink-0`} aria-label={creating ? "권한 등록" : "권한 수정"}>
      {creating ? (
        <RoleForm mode="create" onCancel={onCancelCreate} onDone={onCreated} />
      ) : role ? (
        <RoleView role={role} lockReasons={lockReasons} onDeleted={onDeleted} />
      ) : (
        <>
          <h2 className="text-[18px] font-semibold text-erp-ink">권한 수정</h2>
          {detail && "failed" in detail ? (
            <FailedBand message={detail.failed} />
          ) : (
            // 처음 진입 · 고른 권한 없음 — 메뉴 관리의 빈 상세와 같은 안내(데모 2026-10-08)
            <div className="flex flex-col items-center gap-[6px] rounded-[2px] border border-erp-thead-line px-[18px] py-[36px] text-center text-[14px] text-erp-muted">
              <p>왼쪽 목록에서 권한을 고르면 수정 화면이 여기에 섭니다.</p>
              <p className="text-[13px]">아무것도 고르지 않고 등록을 누르면</p>
              <p className="text-[13px]">플랫폼 관리자 유형의 새 권한을 등록합니다.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function RoleView({ role, lockReasons, onDeleted }: { role: RoleGroupDetail; lockReasons: EnumValue[]; onDeleted: () => void }) {
  const can = useMenuPermission(MENU_CODE.platformRoles);
  const editable = can.update && role.isEditable;
  const muted = (text: string) => <span className="text-erp-muted">{text}</span>;
  const rows: DetailRow[] = [
    ...(editable
      ? []
      : [
          { label: "권한명", value: role.name },
          { label: "설명", value: role.description ?? muted("—"), multiline: Boolean(role.description) },
        ]),
    { label: "등록일시", value: <DetailValues items={[formatDateTime(role.createdAt), actorOf(role.createdBy)]} /> },
    { label: "최종수정일시", value: <DetailValues items={[formatDateTime(role.updatedAt), actorOf(role.updatedBy)]} /> },
  ];
  const heading = (
    <h2 className="flex flex-wrap items-center gap-[6px] text-[18px] font-semibold text-erp-ink">
      <span className="mr-[4px]">{editable ? "권한 수정" : "권한 상세"}</span>
      <span className="text-[14px] font-normal text-erp-label">{role.roleCode}</span>
      <Tag>
        <CodeLabel group="ROLE_TYPE" value={role.roleTypeCode} />
      </Tag>
    </h2>
  );
  const deleteButton =
    can.delete && !role.isMaster ? (
      <RoleDeleteDialog role={role} blockedReason={role.deleteBlockedReason && reasonLabel(lockReasons, role.deleteBlockedReason, "지울 수 없는 권한입니다")} onDeleted={onDeleted} />
    ) : null;

  if (!editable)
    return (
      <>
        {heading}
        {/* 조회 권한만 있으면 이유 띠 없이 상세로만 보인다 */}
        {can.update && role.editBlockedReason && <InfoBand>{reasonLabel(lockReasons, role.editBlockedReason, "고칠 수 없는 권한입니다")}</InfoBand>}
        <DetailTable title="기본 정보" rows={rows} />
        {deleteButton && <div className="flex gap-[6px]">{deleteButton}</div>}
      </>
    );
  return (
    <>
      {heading}
      <RoleForm mode="edit" role={role} extra={<DetailTable title="기본 정보" rows={rows} />} deleteButton={deleteButton} />
    </>
  );
}

function RoleForm(
  props:
    | { mode: "create"; onCancel: () => void; onDone: (id: number) => void; role?: never; extra?: never; deleteButton?: never }
    | { mode: "edit"; role: RoleGroupDetail; extra: React.ReactNode; deleteButton: React.ReactNode; onCancel?: never; onDone?: never },
) {
  const router = useRouter();
  const toast = useToast();
  const roleTypeLabel = useCodeLabel("ROLE_TYPE");
  // 기준값 — 마지막으로 맞춘 서버 값과 그때의 updatedAt. 저장은 이 updatedAt 으로 보내, 그 사이 다른 사람이 고쳤으면 api 가 409 로 알린다.
  // 같은 권한의 최신 정보가 와도 칸은 다시 그리지 않고(roles-screen 의 key) syncRoleForm 규칙으로 기준값 · 칸을 맞춘다 — 메뉴만 바뀌면
  // updatedAt 만 올리고, 칸을 손대지 않았으면 새 값으로 채우고, 고치던 중이면 기준을 그대로 둔다. 409 뒤에 온 최신 값은 칸에 다시 채운다.
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
        const created = await createRoleGroupAction(body).catch(unknownResult("등록"));
        if (created.ok) {
          setFailure(null);
          toast(`등록했습니다. 권한 코드 ${created.roleCode} — [메뉴등록]으로 메뉴 권한을 정해 주세요.`);
          return props.onDone(created.roleGroupId);
        }
        return fail(created);
      }
      const result = await updateRoleGroupAction(props.role.roleGroupId, { ...body, updatedAt: base.updatedAt }).catch(unknownResult("수정"));
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
    if (reload) setReloadOnRefresh(true);
    // 그 사이 바뀌었거나(409 동시 수정) 지워졌거나(404) 결과를 모르면 최신 정보를 받는다
    if (result.status === undefined || result.status === 404 || result.status === 409) router.refresh();
  };

  const describe = (key: keyof Form) => (errors[key] ? `${id}-${key}-error` : undefined);
  return (
    <>
      {props.mode === "create" && <h2 className="text-[18px] font-semibold text-erp-ink">권한 등록</h2>}
      {failure && <FailedBand message={failure.message} detail={failure.detail} />}
      <div className="flex flex-col gap-[18px]">
        {props.mode === "create" && (
          // 고정 권한 셋(PM000001 · BM000001 · FM000001)은 마이그레이션이 넣어 화면에서는 플랫폼 관리자(PA) 권한만 만든다.
          // 유형 이름은 공통코드 ROLE_TYPE 에서 읽는다(네이밍 규칙 화면 문구)
          <Field label="권한유형" required>
            <TextField value={roleTypeLabel("PA")} readOnly aria-readonly />
          </Field>
        )}
        <div className="flex flex-col gap-[8px]">
          <Field label="권한명" required>
            <TextField
              value={form.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              maxLength={ROLE_NAME_MAX}
              placeholder={props.mode === "create" ? "예: 프로모션 담당" : undefined}
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
            <Textarea
              rows={4}
              value={form.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              maxLength={ROLE_DESCRIPTION_MAX}
              placeholder={props.mode === "create" ? "이 권한으로 맡길 업무를 적습니다" : undefined}
              aria-invalid={errors.description ? true : undefined}
              aria-describedby={describe("description")}
            />
          </Field>
          <FieldMessage id={`${id}-description-error`} message={errors.description} />
        </div>
      </div>
      {props.extra}
      <div className="flex gap-[6px]">
        {props.mode === "create" ? (
          <>
            <span className="flex-1" />
            <Button variant="off" onClick={props.onCancel} disabled={saving}>
              취소
            </Button>
          </>
        ) : (
          <>
            {props.deleteButton}
            <span className="flex-1" />
          </>
        )}
        <Button onClick={handleSave} disabled={saving || !dirty}>
          저장
        </Button>
      </div>
    </>
  );
}
