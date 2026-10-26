"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Button, Checkbox, ConfirmDialog, Tag, useToast } from "@/components/common";
import { CodeLabel } from "@/components/site/code-label";
import { ServiceTabs } from "@/components/site/service-tabs";
import { usePagePermission } from "@/components/site/session-gate";
import { labelOf, type EnumValue } from "@/lib/enums";
import type { RevocationPreview, RoleGroupMenuCells, RoleGroupMenuNode, RoleGroupMenuTree } from "@/lib/platform-role-groups";
import type { ActionResult } from "@/lib/role-group-actions";
import { aggregate, blockedReasonsOf, changedMenus, editableOf, hasRevocation, initialValues, OPS, toggle, toggleAll, type Op, type Values } from "@/lib/role-menu-grid";
import { FailedBand, InfoBand, reasonLabel, unknownResult } from "./role-parts";

// 팝업이 트리에서 읽는 칸만 — 플랫폼 · BP 트리 모두 이 모양을 갖는다(권한 유형은 role 에서 받는다).
type MenuTree = Pick<RoleGroupMenuTree, "isSavable" | "updatedAt" | "services">;

// 권한 메뉴 등록(플랫폼 S-EFQREM · BP S-KUDELB · 데모 system/roles 메뉴등록 팝업). 880px 확인창에 서비스 탭 · 메뉴 표(조회 · 등록 · 수정 · 삭제)를 둔다.
// 칸마다 바꿀 수 있는지와 막힌 이유는 api 메뉴 트리가 준다(본인 범위 밖 · BP 쪽 고정 권한의 플랫폼 메뉴 등, 한글은 GET /enums/PlatformRoleMenuBlockReason).
// 플랫폼 마스터 · 본인이 연결된 권한 · 수정 권한이 없으면 칸을 모두 막고 [닫기]만 둔다.
// 켜져 있던 칸을 끄면 저장 전에 회수 범위를 미리 본다 — BP · 가맹 마스터는 아래 BP 관리자 · 가맹 관리자 그룹에서도 함께 꺼지므로 확인을 받는다.
// 조회 · 미리보기 · 저장은 화면마다 다른 api 라 actions 로 받는다. save 가 없으면 볼 수만 있다(가맹마스터 보기).
// 공통 확인창은 420 · 480 뿐이고 공통 표는 머리칸에 글자만 받아(전체 선택 체크박스) 이 팝업 전용으로 그린다 — 모양은 같은 토큰을 쓴다.

const OP_LABEL: Record<Op, string> = { read: "조회", create: "등록", update: "수정", delete: "삭제" };

/** 팝업 위쪽에 보이는 권한 — 플랫폼 · BP 목록 항목이 다 이 모양을 갖는다 */
export type MenuDialogRole = { roleGroupId: number; roleCode: string; roleTypeCode: string; name: string };
/** 저장(save)은 회수 미리보기(preview)와 함께만 준다 — 끈 칸이 함께 빠지는 하위 그룹 · 사용자를 확인받지 않고는 저장하지 않으므로, 미리보기 없이 저장만 주면 저장이 멈춘다. */
export type MenuDialogActions = { load: (id: number) => Promise<ActionResult<MenuTree>> } & (
  | { preview?: never; save?: never }
  | {
      preview: (id: number, menus: RoleGroupMenuCells[]) => Promise<ActionResult<RevocationPreview>>;
      save: (id: number, menus: RoleGroupMenuCells[], updatedAt: string) => Promise<ActionResult<{ updatedAt: string }>>;
    }
);
type BodyProps = { role: MenuDialogRole; reasons: EnumValue[]; actions: MenuDialogActions; note?: string | null; onClose: () => void };

/** note 를 주면 잠긴 팝업의 안내를 그 문구로 바꾸고, null 이면 안내를 두지 않는다. */
export function RoleMenuDialog({
  role,
  title = "권한별 메뉴설정", // 목록 [메뉴설정] 버튼으로 연다(2026-10-26 사용자 지정, 전엔 「권한 메뉴 등록」)
  titleTag,
  ...body
}: Omit<BodyProps, "role"> & {
  role: MenuDialogRole | null;
  title?: string;
  /** 제목 옆 회색 띠지 — 가맹 마스터 고정 권한을 볼 때 「가맹 마스터 권한용」(2026-10-26 사용자 지정) */
  titleTag?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const open = role !== null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        // 안쪽 회수 확인창의 Esc(cancel)도 React 이벤트로 여기까지 올라온다 — 이 팝업 자신의 Esc 일 때만 닫는다
        if (e.target === e.currentTarget) body.onClose();
      }}
      // #ebebeb 팝업 테두리는 Figma 에 한 번만 나오는 색이라 토큰이 없다(DESIGN.md Popups).
      className="m-auto max-h-[calc(100dvh-48px)] w-[880px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-[2px] border border-[#ebebeb] bg-white p-[23px] text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40"
    >
      <h2 id={titleId} className="flex items-center gap-[10px] text-[18px] font-semibold">
        {title}
        {titleTag && <Tag>{titleTag}</Tag>}
      </h2>
      {/* 다른 권한을 열면 값 · 탭을 새로 시작한다 */}
      {role && <MenuBody key={role.roleGroupId} role={role} {...body} />}
    </dialog>
  );
}

function MenuBody({ role, reasons, actions, note, onClose }: BodyProps) {
  const router = useRouter();
  const toast = useToast();
  const can = usePagePermission();
  const [tree, setTree] = useState<MenuTree | null>(null);
  const [initial, setInitial] = useState<Values>({});
  const [values, setValues] = useState<Values>({});
  const [tab, setTab] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ message: string; detail?: string } | null>(null);
  const [preview, setPreview] = useState<RevocationPreview | null>(null);
  const [busy, startBusy] = useTransition();
  const tabsId = useId();

  /**
   * 메뉴 트리를 받아 칸을 채운다. after 는 저장 실패 뒤 다시 받는 경우의 실패 문구 — 다시 받으면 「다시 채웠다」를 덧붙이고,
   * 다시 받기도 실패하면 원래 문구(왜 저장이 안 됐는지)를 지우지 않고 함께 보인다.
   */
  const load = (after?: string) =>
    startBusy(async () => {
      const result = await actions.load(role.roleGroupId).catch(unknownResult("메뉴 권한 조회", false));
      if (!result.ok) return setFailure(after ? { message: after, detail: result.message } : { message: result.message });
      if (after) setFailure({ message: after, detail: "최신 메뉴 권한으로 칸을 다시 채웠습니다. 확인한 뒤 다시 저장해 주세요." });
      const all = result.services.flatMap((s) => s.menus);
      const v = initialValues(all);
      setTree(result);
      setInitial(v);
      setValues(v);
      // 처음엔 그 권한의 기본 서비스 탭 — 플랫폼 권한(PM · PA)은 플랫폼 관리, 그 밖(BP 쪽)은 ERP 쪽
      const bpSide = role.roleTypeCode !== "PM" && role.roleTypeCode !== "PA";
      setTab((cur) => cur ?? (result.services.find((s) => (s.serviceCode === "PLATFORM") !== bpSide) ?? result.services[0])?.serviceCode ?? null);
    });

  // 열릴 때 한 번 받는다(이 컴포넌트는 권한마다 새로 마운트된다)
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    load();
  });

  const { preview: previewMenus, save } = actions;
  const savable = Boolean(tree?.isSavable) && can.update && Boolean(save);
  // 잠긴 팝업의 이유 — 칸마다 툴팁 · 작은 글자로 흩어진 이유를 위에 한 줄로 모은다(키보드 · 화면 낭독기도 읽는다)
  const lockedText =
    note !== undefined
      ? note
      : !can.update
        ? "권한 관리 수정 권한이 없어 메뉴 권한을 볼 수만 있습니다."
        : (() => {
            const first = tree?.services.flatMap((sv) => sv.menus.flatMap((m) => blockedReasonsOf(m)))[0];
            return first ? `${reasonLabel(reasons, first, "고칠 수 없는 권한")} — 메뉴 권한을 볼 수만 있습니다.` : "이 권한의 메뉴 권한은 볼 수만 있습니다.";
          })();
  const service = tree?.services.find((s) => s.serviceCode === tab);
  const changed = changedMenus(initial, values);

  const handleConfirmSave = () =>
    startBusy(async () => {
      if (!tree || !save) return;
      const result = await save(role.roleGroupId, changed, tree.updatedAt).catch(unknownResult("메뉴 권한 저장"));
      setPreview(null);
      if (!result.ok) {
        // 그 사이 다른 사람이 고쳤으면(409) · 응답을 못 받아 결과를 모르면 최신 트리를 다시 받는다. 5xx 는 반영되지 않았으니 고친 칸을 둔다
        if (result.status === undefined || result.status === 409) return load(result.message);
        setFailure({ message: result.message });
        // 그 사이 권한이 지워졌으면(404) 목록도 새로 받는다
        if (result.status === 404) router.refresh();
        return;
      }
      toast("saved");
      router.refresh();
      onClose();
    });

  const handleSave = () => {
    if (!changed.length) return onClose();
    setFailure(null);
    if (!hasRevocation(initial, values)) return handleConfirmSave();
    // 저장은 미리보기와 함께만 온다(MenuDialogActions). 없으면 확인 없이 저장하지 않고 멈춘다.
    if (!previewMenus) return;
    startBusy(async () => {
      const result = await previewMenus(role.roleGroupId, changed).catch(unknownResult("회수 범위 확인", false));
      if (!result.ok) {
        setFailure({ message: result.message });
        if (result.status === 404) router.refresh();
        return;
      }
      // 함께 빠지는 그룹 · 사용자가 없으면 묻지 않고 저장한다
      if (result.affectedRoleGroupCount === 0 && result.affectedAdminCount === 0) return handleConfirmSave();
      setPreview(result);
    });
  };

  return (
    <div className="mt-[12px] flex flex-col gap-[12px]" aria-busy={busy}>
      {/* 권한유형 → 권한코드 → 권한명을 한 줄로(2026-10-26 사용자 지정, 전엔 세 줄). 구분선은 상세 표 값 구분선(11px #d9d9d9)과 같다 */}
      <dl className="flex h-[42px] items-center gap-[10px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[12px] text-[14px]">
        <div className="flex shrink-0 items-center gap-[6px]">
          <dt className="text-erp-label">권한유형</dt>
          <dd className="font-semibold">
            <CodeLabel group="ROLE_TYPE" value={role.roleTypeCode} />
          </dd>
        </div>
        <span aria-hidden="true" className="h-[11px] w-px shrink-0 bg-[#d9d9d9]" />
        <div className="flex shrink-0 items-center gap-[6px]">
          <dt className="text-erp-label">권한코드</dt>
          <dd>{role.roleCode}</dd>
        </div>
        <span aria-hidden="true" className="h-[11px] w-px shrink-0 bg-[#d9d9d9]" />
        <div className="flex min-w-0 items-center gap-[6px]">
          <dt className="shrink-0 text-erp-label">권한명</dt>
          <dd className="truncate font-semibold">{role.name}</dd>
        </div>
      </dl>
      {failure && <FailedBand message={failure.message} detail={failure.detail} />}
      {tree && !savable && lockedText && <InfoBand>{lockedText}</InfoBand>}

      {tree && (
        <>
          <ServiceTabs services={tree.services} selected={tab} idPrefix={tabsId} onSelect={setTab} />
          <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={service ? `${tabsId}-${service.serviceCode}` : undefined} className="h-[420px]">
            {/* 통째로 잠긴 팝업은 위 띠가 이유를 한 번 말한다 — 줄마다 같은 이유를 되풀이하지 않는다 */}
            <MenuTable nodes={service?.menus ?? []} values={values} reasons={savable ? reasons : []} locked={!savable || busy} onChange={setValues} />
          </div>
        </>
      )}
      {!tree && !failure && <p className="grid h-[92px] place-items-center text-[14px] text-erp-muted">불러오는 중입니다.</p>}

      <div className="mt-[12px] flex justify-end gap-[6px]">
        {savable ? (
          <>
            <Button variant="off" onClick={onClose} disabled={busy}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={busy}>
              저장
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>닫기</Button>
        )}
      </div>

      <ConfirmDialog
        open={preview !== null}
        title="메뉴 권한 회수"
        confirmLabel="저장"
        wide
        busy={busy}
        onConfirm={handleConfirmSave}
        onCancel={() => setPreview(null)}
      >
        {preview && (
          <div className="flex flex-col gap-[12px] break-keep">
            <p>
              끈 칸 <b className="font-semibold">{preview.revokedCells.toLocaleString("ko-KR")}개</b>가 이 권한에서 빠집니다.
            </p>
            {preview.affectedRoleGroupCount > 0 && (
              <p>
                이 권한 아래 <b className="font-semibold">권한 그룹 {preview.affectedRoleGroupCount.toLocaleString("ko-KR")}개</b>에서도 같은 칸이 함께 꺼지고 되돌리지 않습니다.
              </p>
            )}
            <p>
              영향을 받는 사용자는 <b className="font-semibold">{preview.affectedAdminCount.toLocaleString("ko-KR")}명</b>이고, 로그인 중이어도 다음 요청부터 새 권한으로
              판정됩니다.
            </p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}

/** 서비스 하나의 메뉴 표. 묶음 메뉴 칸은 아래 잎의 바꿀 수 있는 칸으로 보이고, 누르면 그 칸들을 한꺼번에 바꾼다. */
function MenuTable({
  nodes,
  values,
  reasons,
  locked,
  onChange,
}: {
  nodes: RoleGroupMenuNode[];
  values: Values;
  reasons: EnumValue[];
  locked: boolean;
  onChange: (v: Values) => void;
}) {
  const rows: RoleGroupMenuNode[] = [];
  const walk = (list: RoleGroupMenuNode[]) => list.forEach((n) => (rows.push(n), walk(n.children)));
  walk(nodes);

  // 일부만 켜진 묶음 줄은 –(mixed)로 보이고, 누르면 모두 켠다(머리칸은 – 없이 해제로 — 위 OPS 머리 참고)
  const box = (label: string, state: { checked: boolean; mixed?: boolean; disabled: boolean }, onToggle: (on: boolean) => void) => (
    <span className={`inline-flex ${state.disabled ? "opacity-40" : ""}`}>
      <Checkbox
        label=""
        aria-label={label}
        checked={state.checked}
        indeterminate={Boolean(state.mixed)}
        disabled={locked || state.disabled}
        onChange={(e) => onToggle(e.target.checked)}
      />
    </span>
  );

  // 두 표(머리 · 본문)가 같은 열 폭을 쓴다
  const cols = (
    <colgroup>
      <col />
      {/* 메뉴단계는 좁히고 조회 · 등록 · 수정 · 삭제 칸을 넓힌다 — 90px 에선 머리칸 「체크박스 + 글자」가 두 줄로 꺾였다(2026-10-26 사용자 지정) */}
      <col className="w-[80px]" />
      {OPS.map((op) => (
        <col key={op} className="w-[100px]" />
      ))}
    </colgroup>
  );

  // 머리 표는 고정하고 그 아래 본문 표만 스크롤한다 — 스크롤바도 머리 아래에서 시작한다(2026-10-26 사용자 지정, 전엔 sticky 머리라
  // 스크롤바가 머리 옆까지 올라왔다). 두 칸 모두 스크롤바 자리를 비워(scrollbar-gutter: stable) 머리 · 본문 열이 어긋나지 않는다.
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 overflow-hidden [scrollbar-gutter:stable]">
        <table className="w-full table-fixed border-collapse border-x border-t border-erp-thead-line text-[14px]">
          {cols}
          <thead>
            {/* 머리는 600 먹색 글자에 erp-subtle(#f0f1f3) 바탕 — 1단계 줄(#f8f9fb)보다 살짝 어둡게 해 둘이 갈리게 한다(2026-10-26 사용자 지정).
                두 바탕 규칙 밖이라 기존 토큰(Off 버튼 바탕)을 빌렸다 — 1팀과 맞출 것. 칸 안쪽 여백은 4px 로 좁혀 100px 칸에 「체크박스 + 글자」가 한 줄로 든다 */}
            <tr className="h-[42px] border-b border-erp-thead-line bg-erp-subtle">
              <th scope="col" className="px-[4px] font-semibold text-erp-ink">
                메뉴명
              </th>
              <th scope="col" className="px-[4px] font-semibold text-erp-ink">
                메뉴단계
              </th>
              {OPS.map((op) => {
                // 머리칸은 하나라도 꺼져 있으면 – 없이 그냥 해제로 보인다(2026-10-26 사용자 지정). 누르면 모두 켠다. 묶음 줄의 – 는 그대로다
                const state = { ...aggregate(values, nodes, op), mixed: false };
                return (
                  <th key={op} scope="col" className="px-[4px] font-semibold text-erp-ink">
                    {/* 체크박스를 칸 가운데(본문 체크박스와 같은 세로줄)에 두고 글자는 그 오른쪽에 — 전엔 글자까지 묶어 가운데 맞춰
                        체크박스가 왼쪽으로 밀려 본문과 들쭉날쭉했다(2026-10-26 사용자 지정) */}
                    <span className="grid grid-cols-[1fr_auto_1fr] items-center gap-[6px]">
                      <span />
                      {box(`${OP_LABEL[op]} 전체 선택`, state, (on) => onChange(toggleAll(values, nodes, op, on)))}
                      <span className="justify-self-start whitespace-nowrap">{OP_LABEL[op]}</span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
        </table>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
        <table className="w-full table-fixed border-collapse border-x border-erp-thead-line text-[14px]">
          {cols}
          <tbody className="text-erp-ink">
            {rows.length === 0 ? (
              <tr className="h-[92px] border-b border-erp-thead-line">
                <td colSpan={2 + OPS.length} className="text-center text-erp-muted">
                  이 서비스에 등록된 메뉴가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((n) => {
                // enum 을 못 받았으면 영문 값 대신 쓰지 않는다(이유는 띠 · 흐린 칸으로 알 수 있다)
                const why = blockedReasonsOf(n).flatMap((r) => (reasons.some((l) => l.value === r) ? [labelOf(reasons, r)] : []));
                return (
                  // 1단계 줄에만 회청 바탕을 깔아 2단계와 가른다. 줄 높이는 한 화면에 더 들어가게 42px(2026-10-26 사용자 지정)
                  <tr key={n.menuId} className={`h-[42px] border-b border-erp-thead-line ${n.depth === 1 ? "bg-erp-thead-bg" : ""}`}>
                    <td className="truncate px-[10px] text-left" title={why.join(" · ") || undefined}>
                      <span style={{ paddingLeft: (n.depth - 1) * 18 }}>
                        {n.depth > 1 && <span className="text-erp-label">└ </span>}
                        {n.depth === 1 ? <b className="font-semibold">{n.name}</b> : n.name}
                      </span>
                      {why.map((r) => (
                        <span key={r} className="text-[13px] text-erp-label">
                          {" "}
                          · {r}
                        </span>
                      ))}
                    </td>
                    <td className="px-[10px] text-center text-erp-label">{n.depth}단계</td>
                    {OPS.map((op) => (
                      <td key={op} className="px-[10px] text-center">
                        {box(
                          `${n.name} ${OP_LABEL[op]}`,
                          n.isGroup ? aggregate(values, n.children, op, n[op].value) : { checked: Boolean(values[n.menuId]?.[op]), disabled: !editableOf(n, op) },
                          (on) => onChange(toggle(values, n, op, on)),
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
