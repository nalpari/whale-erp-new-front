"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge, Button, ConfirmDialog, DetailTable, Field, FormRow, Radio, TextField, useToast, type DetailRow } from "@/components/common";
import { usePagePermission } from "@/components/site/session-gate";
import { CARD, FailedBand, FieldMessage } from "@/components/site/side-parts";
import {
  afterConflict,
  bodyOf,
  isChangedMeanwhile,
  isDirty,
  MENU_NAME_MAX,
  MENU_URL_MAX,
  menuFieldOf,
  syncMenuForm,
  validateMenuForm,
  type MenuFormBase,
  type MenuFormErrors,
  type MenuFormValues,
  type MenuStatus,
} from "@/lib/menu-form";
import { findRow, pathNamesOf, type createPlacement } from "@/lib/menu-tree";
import { MENU_CODE } from "@/lib/menus";
import type { MenuDetail, MenuNode } from "@/lib/platform-menus";
import { createMenuAction, updateMenuAction } from "./actions";
import { statusText, unknownResult, type MenuDetailState } from "./menu-parts";

// 오른쪽 고정 칸(데모 system/menus) — 고른 메뉴 없음 · 수정 · 상세(조회 권한만) · 등록 네 상태.
// 서비스 코드 · 상위 메뉴 · 메뉴 코드 · 메뉴 순서는 읽기 전용이고 메뉴명 · 메뉴 URL · 사용 상태만 고친다(S-GXMZOU).
// 상위 메뉴와 순서는 트리에서 끌어 바꾼다. 메뉴 삭제는 없다 — 안 쓰는 메뉴는 미사용으로 돌린다.

type Placement = ReturnType<typeof createPlacement<MenuNode>>;
const ROOT_PARENT = "없음 · 최상위(1단계) 메뉴";
// 이 화면의 메뉴 코드 — 끄면 메뉴 권한 판정이 이 화면까지 막아 화면으로는 되돌릴 수 없다(api 는 막지 않는다 · 2026-10-16 결정)
const SELF_MENU_CODE = MENU_CODE.platformMenus;
/** 이 화면을 막는 저장 — 미사용으로 돌리기 · 이 화면 메뉴의 URL 바꾸기 */
type SelfLock = "inactive" | "url";

export function MenuSide({
  serviceCode,
  nodes,
  placement,
  detail,
  onDraftNameChange,
  onCancelCreate,
  onCreated,
  onCreateUnknown,
}: {
  serviceCode: string;
  nodes: MenuNode[];
  placement: Placement | null;
  detail: MenuDetailState;
  onDraftNameChange: (name: string) => void;
  onCancelCreate: () => void;
  onCreated: (id: number) => void;
  /** 등록 응답을 못 받았다(등록됐을 수도 있다) — 양식을 닫고 트리를 다시 받는다 */
  onCreateUnknown: (message: string) => void;
}) {
  const can = usePagePermission();
  const menu = !placement && detail && "menu" in detail ? detail.menu : null;
  return (
    <section className={`${CARD} w-[464px] shrink-0`} aria-label={placement ? "메뉴 등록" : can.update ? "메뉴 수정" : "메뉴 상세"}>
      {placement ? (
        <MenuForm
          mode="create"
          serviceCode={serviceCode}
          nodes={nodes}
          placement={placement}
          onDraftNameChange={onDraftNameChange}
          onCancel={onCancelCreate}
          onDone={onCreated}
          onUnknown={onCreateUnknown}
        />
      ) : menu ? (
        can.update ? (
          <MenuForm mode="edit" menu={menu} nodes={nodes} />
        ) : (
          <MenuView menu={menu} />
        )
      ) : (
        <>
          <h2 className="text-[18px] font-semibold text-erp-ink">{can.update ? "메뉴 수정" : "메뉴 상세"}</h2>
          {detail && "failed" in detail ? (
            <FailedBand message={detail.failed} />
          ) : (
            // 처음 진입 · 고른 메뉴 없음 — 문구는 사용자 지정(2026-10-26). 등록 안내는 [등록] 버튼이 보일 때(등록 권한)만
            <div className="flex flex-col items-center gap-[6px] rounded-[2px] border border-erp-thead-line px-[18px] py-[36px] text-center text-[14px] text-erp-muted">
              <p>왼쪽 메뉴 트리에서 [메뉴명]을 클릭하면 상세 정보가 표시됩니다.</p>
              {can.create && (
                <div className="mt-[12px]">
                  <p>신규 메뉴는 [등록] 버튼을 클릭하여 추가할 수 있습니다.</p>
                  <p>메뉴를 선택하지 않고 [등록]하면 최상위(1단계) 메뉴로 등록됩니다.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

/** 상위 메뉴 칸 — 「MN000212 · 시스템관리」(코드 · 최상위부터의 경로) */
const parentLabelOf = (menu: MenuDetail) => (menu.parent ? `${menu.parent.menuCode} · ${menu.path.slice(0, -1).join(" › ")}` : ROOT_PARENT);

const heading = (title: string, depth: number) => (
  <h2 className="text-[18px] font-semibold text-erp-ink">
    {title} <span className="ml-[4px] text-[14px] font-normal text-erp-label">{depth}단계</span>
  </h2>
);

/** 조회 권한만 — 같은 일곱 항목을 읽기만 한다(목업 조회만) */
function MenuView({ menu }: { menu: MenuDetail }) {
  const rows: DetailRow[] = [
    { label: "서비스 코드", value: menu.serviceCode },
    { label: "상위 메뉴", value: parentLabelOf(menu) },
    { label: "메뉴 코드", value: menu.menuCode },
    { label: "메뉴 순서", value: menu.sortOrder },
    { label: "메뉴명", value: menu.name },
    { label: "메뉴 URL", value: menu.url ?? <span className="text-erp-muted">—</span> },
    { label: "사용여부", value: <Badge tone={menu.status === "ACTIVE" ? "on" : "off"}>{statusText(menu.status)}</Badge> },
  ];
  return (
    <>
      {heading("메뉴 상세", menu.depth)}
      <DetailTable title="기본 정보" rows={rows} />
    </>
  );
}

const readOnly = (value: string | number, placeholder?: string) => <TextField value={value} placeholder={placeholder} readOnly aria-readonly />;

function MenuForm(
  props:
    | {
        mode: "create";
        serviceCode: string;
        nodes: MenuNode[];
        placement: Placement;
        onDraftNameChange: (name: string) => void;
        onCancel: () => void;
        onDone: (id: number) => void;
        onUnknown: (message: string) => void;
        menu?: never;
      }
    | { mode: "edit"; menu: MenuDetail; nodes: MenuNode[]; serviceCode?: never; placement?: never; onDraftNameChange?: never; onCancel?: never; onDone?: never; onUnknown?: never },
) {
  const router = useRouter();
  const toast = useToast();
  // 기준값 — 마지막으로 맞춘 서버 값과 그때의 updatedAt. 저장은 이 updatedAt 으로 보내, 그 사이 다른 사람이 고쳤으면 api 가 409 로 알린다.
  // 같은 메뉴의 최신 정보가 와도 칸은 다시 그리지 않고(menus-screen 의 key) syncMenuForm 규칙으로 맞춘다 — 옮기기처럼 updatedAt 만 바뀌면
  // 기준만 올리고, 손대지 않았으면 새 값으로 채우고, 고치던 중이면 기준을 그대로 둔다. 동시 수정 409 를 받으면 받아 둔 최신 값으로 다시 채운다.
  const server: MenuFormBase | null =
    props.mode === "edit" ? { name: props.menu.name, url: props.menu.url ?? "", status: props.menu.status as MenuStatus, updatedAt: props.menu.updatedAt } : null;
  const [base, setBase] = useState<MenuFormBase>(() => server ?? { name: "", url: "", status: "ACTIVE", updatedAt: "" });
  const [form, setForm] = useState<MenuFormValues>(() => ({ name: base.name, url: base.url, status: base.status }));
  const [errors, setErrors] = useState<MenuFormErrors>({});
  const [failure, setFailure] = useState<{ message: string; detail: string } | null>(null);
  const [confirmSelfLock, setConfirmSelfLock] = useState<SelfLock | null>(null);
  const [saving, startSaving] = useTransition();
  const id = props.mode === "edit" ? `menu-${props.menu.menuId}` : "menu-new";
  const [seenUpdatedAt, setSeenUpdatedAt] = useState(server?.updatedAt ?? "");
  const [reloadOnRefresh, setReloadOnRefresh] = useState(false);
  if (server && server.updatedAt !== seenUpdatedAt) {
    setSeenUpdatedAt(server.updatedAt);
    const next = syncMenuForm(base, form, server, reloadOnRefresh);
    if (reloadOnRefresh) {
      setReloadOnRefresh(false);
      setErrors({});
    }
    setBase(next.base);
    if (next.form !== form) setForm(next.form);
  }
  // 고친 것이 없으면 [저장]을 막는다 — 바뀐 것 없는 저장이 남의 변경을 덮어쓸 여지를 없앤다
  const dirty = props.mode === "create" || isDirty(base, form);

  const handleFieldChange = <K extends keyof MenuFormValues>(key: K, value: MenuFormValues[K]) => {
    // 다시 채우기를 기다리는 동안 손으로 고치기 시작하면 그 입력을 우선한다
    setReloadOnRefresh(false);
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "name" && props.mode === "create") props.onDraftNameChange(value as string);
    if (key !== "status" && errors[key as "name" | "url"]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  /**
   * 이 저장이 이 화면(MN000215)을 막는가 — 화면으로는 되돌릴 수 없다.
   * inactive: 이 메뉴나 그 아래에 이 화면이 있는데 미사용으로 돌린다. url: 이 화면 메뉴의 URL 을 바꾼다 — 메뉴 URL 이 실제 화면 주소와
   * 어긋나면 다음 로그인부터 URL 막기(isAllowed)가 이 화면을 연다고 보지 않는다(이 화면의 라우트는 /platform-menus 다).
   */
  const selfLockOf = (): SelfLock | null => {
    if (props.mode !== "edit") return null;
    if (props.menu.menuCode === SELF_MENU_CODE && form.url.trim() !== base.url.trim()) return "url";
    if (base.status !== "ACTIVE" || form.status !== "INACTIVE") return null;
    const has = (n: MenuNode): boolean => n.menuCode === SELF_MENU_CODE || n.children.some(has);
    const row = findRow(props.nodes, props.menu.menuId);
    return row && has(row.node) ? "inactive" : null;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (saving || !dirty) return;
    // 수정은 그대로 둔 URL 의 1뎁스 검사를 건너뛴다 — 아직 여러 구간인 메뉴(사용중지 메뉴)도 이름 · 상태를 고친다
    const found = validateMenuForm(form, props.mode === "edit" ? base.url : undefined);
    setErrors(found);
    if (Object.keys(found).length) return;
    const lock = selfLockOf();
    if (lock) return setConfirmSelfLock(lock);
    save();
  };

  const save = () => {
    setConfirmSelfLock(null);
    const body = bodyOf(form);
    startSaving(async () => {
      if (props.mode === "create") {
        const created = await createMenuAction({ ...body, serviceCode: props.serviceCode, parentMenuId: props.placement.parent?.menuId ?? null }).catch(unknownResult("등록"));
        // 응답을 못 받았으면 등록됐을 수도 있다 — 양식을 닫는다(같은 입력으로 다시 저장하면 메뉴가 둘 생기고, 메뉴 삭제는 없다)
        if (!created.ok && created.status === undefined) return props.onUnknown(created.message);
        if (!created.ok) return fail(created);
        setFailure(null);
        toast(`등록했습니다. 메뉴 코드 ${created.menuCode} — 권한은 플랫폼 권한 관리 목록의 메뉴설정 [설정]에서 줍니다.`);
        return props.onDone(created.menuId);
      }
      const result = await updateMenuAction(props.menu.menuId, { ...body, updatedAt: base.updatedAt }).catch(unknownResult("저장"));
      if (!result.ok) return fail(result);
      // 저장한 값이 새 기준이다 — 곧 올 최신 정보는 값이 같아 updatedAt 만 올린다(syncMenuForm)
      const saved = { name: body.name, url: body.url ?? "", status: body.status };
      setBase((b) => ({ ...b, ...saved }));
      setForm(saved);
      setFailure(null);
      // 미사용 안내는 토스트가 아니라 라디오 바로 아래 빨간 박스로 고르는 즉시 보인다(위 fieldset) — 저장 토스트는
      // 다른 저장과 같게 짧게 "수정되었습니다."만(사용자 지정, 2026-10-26).
      toast("updated");
    });
  };

  /** api 가 칸 하나의 것이라고 말하면(형식 · URL 겹침) 그 칸 아래, 그 밖은 띠로 */
  const fail = (result: { status?: number; message: string }) => {
    const field = menuFieldOf(result.message);
    if (field && (result.status === 400 || result.status === 409)) return setErrors({ [field]: result.message });
    // 동시 수정 409 만 최신 값으로 칸을 다시 채운다. 그 밖은 입력을 그대로 둔다
    const reload = result.status === 409 && props.mode === "edit" && isChangedMeanwhile(result.message);
    setFailure({ message: result.message, detail: reload ? "최신 정보로 칸을 다시 채웠습니다. 확인한 뒤 다시 저장해 주세요." : "입력한 값은 그대로 두었습니다." });
    if (reload && server) {
      const next = afterConflict(base, form, server);
      setBase(next.base);
      setForm(next.form);
      setErrors({});
      setReloadOnRefresh(next.waitForRefresh);
    }
    // 그 사이 바뀌었거나(409) 지워졌거나(404 — 상위가 지워진 등록 포함) 결과를 모르면 최신 정보를 받는다
    if (result.status === undefined || result.status === 404 || result.status === 409) router.refresh();
  };

  const describe = (key: "name" | "url") => (errors[key] ? `${id}-${key}-error` : undefined);
  const depth = props.mode === "edit" ? props.menu.depth : props.placement.depth;
  const parentLabel =
    props.mode === "edit"
      ? parentLabelOf(props.menu)
      : props.placement.parent
        ? `${props.placement.parent.menuCode} · ${pathNamesOf(props.nodes, props.placement.parent.menuId).join(" › ")}`
        : ROOT_PARENT;
  return (
    <form
      onSubmit={handleSubmit}
      // Esc 는 작성 중인 새 메뉴를 버린다(목업). 확인창이 열려 있으면 확인창이 먼저 닫힌다
      onKeyDown={(e) => {
        if (e.key === "Escape" && props.mode === "create" && !saving && !confirmSelfLock) props.onCancel();
      }}
      className="flex flex-col gap-[18px]"
    >
      {heading(props.mode === "create" ? "메뉴 등록" : "메뉴 수정", depth)}
      {failure && <FailedBand message={failure.message} detail={failure.detail} />}
      <Field label="서비스 코드">{readOnly(props.mode === "edit" ? props.menu.serviceCode : props.serviceCode)}</Field>
      <Field label="상위 메뉴">{readOnly(parentLabel)}</Field>
      <FormRow>
        <Field label="메뉴 코드">{props.mode === "edit" ? readOnly(props.menu.menuCode) : readOnly("", "저장 시 자동채번")}</Field>
        <Field label="메뉴 순서">{readOnly(props.mode === "edit" ? props.menu.sortOrder : props.placement.order)}</Field>
      </FormRow>
      <div className="flex flex-col gap-[8px]">
        <Field label="메뉴명" required>
          <TextField
            value={form.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            maxLength={MENU_NAME_MAX}
            placeholder={props.mode === "create" ? "예: 플랫폼 배치 관리" : undefined}
            aria-required
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describe("name")}
            autoFocus={props.mode === "create"}
          />
        </Field>
        <FieldMessage id={`${id}-name-error`} message={errors.name} />
      </div>
      <div className="flex flex-col gap-[8px]">
        <Field label="메뉴 URL (선택)">
          <TextField
            value={form.url}
            onChange={(e) => handleFieldChange("url", e.target.value)}
            maxLength={MENU_URL_MAX}
            placeholder="예: /staff-content"
            aria-invalid={errors.url ? true : undefined}
            aria-describedby={describe("url")}
          />
        </Field>
        <FieldMessage id={`${id}-url-error`} message={errors.url} />
      </div>
      <fieldset className="flex flex-col gap-[8px]">
        <legend className="mb-[8px] text-[14px] font-medium text-erp-label">사용여부</legend>
        <div className="flex h-[34px] items-center gap-[18px]">
          {(["ACTIVE", "INACTIVE"] as const).map((status) => (
            <Radio key={status} label={statusText(status)} name={`${id}-status`} checked={form.status === status} onChange={() => handleFieldChange("status", status)} />
          ))}
        </div>
        {/* 미사용을 고르면 저장 전에도 바로 보인다 — 저장 뒤 토스트(빠르게 사라짐)로만 알리면 놓치기 쉽다(사용자 지적, 2026-10-26). */}
        {form.status === "INACTIVE" && (
          <div className="rounded-[2px] border border-erp-off bg-erp-off-bg px-[16px] py-[12px] text-[14px] text-erp-off">
            {"미사용으로 변경하면 사용자 화면과 [권한관리 > 메뉴 설정]에 표시되지 않습니다."}
            <br />
            {`다시 '사용'으로 변경하면 기존 설정값이 그대로 적용됩니다.`}
          </div>
        )}
      </fieldset>
      <div className="flex justify-end gap-[6px]">
        {props.mode === "create" && (
          <Button variant="off" onClick={props.onCancel} disabled={saving}>
            취소
          </Button>
        )}
        <Button type="submit" disabled={saving || !dirty}>
          저장
        </Button>
      </div>
      <ConfirmDialog
        open={confirmSelfLock !== null}
        title="이 화면이 닫힙니다"
        confirmLabel={confirmSelfLock === "url" ? "URL 바꿔 저장" : "미사용으로 저장"}
        busy={saving}
        onConfirm={save}
        onCancel={() => setConfirmSelfLock(null)}
      >
        <p className="text-[14px] leading-[1.6]">
          {confirmSelfLock === "url"
            ? `플랫폼 메뉴 관리(${SELF_MENU_CODE})의 URL 을 바꾸면 실제 화면 주소와 어긋나, 다음 로그인부터 이 화면에 들어올 수 없습니다. 계속할까요?`
            : `이 메뉴를 미사용으로 돌리면 플랫폼 메뉴 관리(${SELF_MENU_CODE})도 사용자 화면과 메뉴 권한에서 빠져, 이 화면으로는 다시 켤 수 없습니다. 계속할까요?`}
        </p>
      </ConfirmDialog>
    </form>
  );
}

