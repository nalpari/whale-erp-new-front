"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Button, Checkbox, ConfirmDialog, useToast } from "@/components/common";
import { CodeLabel } from "@/components/site/code-label";
import { useMenuPermission } from "@/components/site/session-gate";
import { labelOf, type EnumValue } from "@/lib/enums";
import { MENU_CODE } from "@/lib/menus";
import type { RevocationPreview, RoleGroup, RoleGroupMenuNode, RoleGroupMenuTree } from "@/lib/platform-role-groups";
import { aggregate, blockedReasonsOf, changedMenus, editableOf, hasRevocation, initialValues, OPS, toggle, toggleAll, type Op, type Values } from "@/lib/role-menu-grid";
import { getRoleGroupMenusAction, previewRoleGroupMenusAction, saveRoleGroupMenusAction } from "./actions";
import { FailedBand, InfoBand, reasonLabel, unknownResult } from "./role-parts";

// 권한 메뉴 등록(S-EFQREM · 데모 system/roles 메뉴등록 팝업). 880px 확인창에 서비스 탭 · 메뉴 표(조회 · 등록 · 수정 · 삭제)를 둔다.
// 칸마다 바꿀 수 있는지와 막힌 이유는 api 메뉴 트리가 준다(본인 범위 밖 · BP 쪽 고정 권한의 플랫폼 메뉴 등, 한글은 GET /enums/PlatformRoleMenuBlockReason).
// 플랫폼 마스터 · 본인이 연결된 권한 · 수정 권한이 없으면 칸을 모두 막고 [닫기]만 둔다.
// 켜져 있던 칸을 끄면 저장 전에 회수 범위를 미리 본다 — BP · 가맹 마스터는 아래 BP 관리자 · 가맹 관리자 그룹에서도 함께 꺼지므로 확인을 받는다.
// 공통 확인창은 420 · 480 뿐이고 공통 표는 머리칸에 글자만 받아(전체 선택 체크박스) 이 팝업 전용으로 그린다 — 모양은 같은 토큰을 쓴다.

const OP_LABEL: Record<Op, string> = { read: "조회", create: "등록", update: "수정", delete: "삭제" };

export function RoleMenuDialog({ role, reasons, onClose }: { role: RoleGroup | null; reasons: EnumValue[]; onClose: () => void }) {
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
        if (e.target === e.currentTarget) onClose();
      }}
      // #ebebeb 팝업 테두리는 Figma 에 한 번만 나오는 색이라 토큰이 없다(DESIGN.md Popups).
      className="m-auto max-h-[calc(100dvh-48px)] w-[880px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-[2px] border border-[#ebebeb] bg-white p-[23px] text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40"
    >
      <h2 id={titleId} className="text-[18px] font-semibold">
        권한 메뉴 등록
      </h2>
      {/* 다른 권한을 열면 값 · 탭을 새로 시작한다 */}
      {role && <MenuBody key={role.roleGroupId} role={role} reasons={reasons} onClose={onClose} />}
    </dialog>
  );
}

function MenuBody({ role, reasons, onClose }: { role: RoleGroup; reasons: EnumValue[]; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const can = useMenuPermission(MENU_CODE.platformRoles);
  const [tree, setTree] = useState<RoleGroupMenuTree | null>(null);
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
      const result = await getRoleGroupMenusAction(role.roleGroupId).catch(unknownResult("메뉴 권한 조회", false));
      if (!result.ok) return setFailure(after ? { message: after, detail: result.message } : { message: result.message });
      if (after) setFailure({ message: after, detail: "최신 메뉴 권한으로 칸을 다시 채웠습니다. 확인한 뒤 다시 저장해 주세요." });
      const all = result.services.flatMap((s) => s.menus);
      const v = initialValues(all);
      setTree(result);
      setInitial(v);
      setValues(v);
      // 처음엔 그 권한의 기본 서비스 탭 — BP · 가맹 마스터는 ERP 쪽, 그 밖은 플랫폼 관리
      const bpSide = role.roleTypeCode === "BM" || role.roleTypeCode === "FM";
      setTab((cur) => cur ?? (result.services.find((s) => (s.serviceCode === "PLATFORM") !== bpSide) ?? result.services[0])?.serviceCode ?? null);
    });

  // 열릴 때 한 번 받는다(이 컴포넌트는 권한마다 새로 마운트된다)
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    load();
  });

  const savable = Boolean(tree?.isSavable) && can.update;
  // 잠긴 팝업의 이유 — 칸마다 툴팁 · 작은 글자로 흩어진 이유를 위에 한 줄로 모은다(키보드 · 화면 낭독기도 읽는다)
  const lockedText = !can.update
    ? "권한 관리 수정 권한이 없어 메뉴 권한을 볼 수만 있습니다."
    : (() => {
        const first = tree?.services.flatMap((sv) => sv.menus.flatMap((m) => blockedReasonsOf(m)))[0];
        return first ? `${reasonLabel(reasons, first, "고칠 수 없는 권한")} — 메뉴 권한을 볼 수만 있습니다.` : "이 권한의 메뉴 권한은 볼 수만 있습니다.";
      })();
  const service = tree?.services.find((s) => s.serviceCode === tab);
  const changed = changedMenus(initial, values);

  const handleConfirmSave = () =>
    startBusy(async () => {
      if (!tree) return;
      const result = await saveRoleGroupMenusAction(role.roleGroupId, changed, tree.updatedAt).catch(unknownResult("메뉴 권한 저장"));
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
    startBusy(async () => {
      const result = await previewRoleGroupMenusAction(role.roleGroupId, changed).catch(unknownResult("회수 범위 확인", false));
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
      <dl className="grid grid-cols-[84px_1fr] gap-y-[6px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg p-[12px] text-[14px]">
        <dt className="text-erp-label">권한 코드</dt>
        <dd>{role.roleCode}</dd>
        <dt className="text-erp-label">권한 유형</dt>
        <dd>
          <CodeLabel group="ROLE_TYPE" value={role.roleTypeCode} />
        </dd>
        <dt className="text-erp-label">권한명</dt>
        <dd>{role.name}</dd>
      </dl>
      {failure && <FailedBand message={failure.message} detail={failure.detail} />}
      {tree && !savable && <InfoBand>{lockedText}</InfoBand>}

      {tree && (
        <>
          <ServiceTabs services={tree.services} selected={tab} idPrefix={tabsId} onSelect={setTab} />
          <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={service ? `${tabsId}-${service.serviceCode}` : undefined} className="h-[420px] overflow-y-auto">
            <MenuTable nodes={service?.menus ?? []} values={values} reasons={reasons} locked={!savable || busy} onChange={setValues} />
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

// 끝이 가려진 쪽만 흐리게 — 색을 더하지 않고 마스크로 글자를 지운다(두 바탕 규칙)
const EDGE_MASK = {
  none: "",
  left: "[mask-image:linear-gradient(to_right,transparent,black_32px)]",
  right: "[mask-image:linear-gradient(to_left,transparent,black_32px)]",
  both: "[mask-image:linear-gradient(to_right,transparent,black_32px,black_calc(100%-32px),transparent)]",
} as const;

/**
 * 서비스 탭 — 사용 중 서비스(공통코드 SERVICE)가 많아도 한 줄을 지키고 가로로 스크롤해 고른다.
 * 스크롤바는 잘라내 보이지 않게 하고, 넘치는 쪽만 끝을 흐리게 한 뒤 ‹ › 버튼을 둔다(넘칠 때만). 세로 휠도 가로로 넘긴다. 고른 탭은 보이는 자리로 끌어온다.
 */
function ServiceTabs({
  services,
  selected,
  idPrefix,
  onSelect,
}: {
  services: { serviceCode: string; name: string }[];
  selected: string | null;
  idPrefix: string;
  onSelect: (code: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ left: false, right: false });

  const measure = () => {
    const el = ref.current;
    if (!el) return;
    const left = el.scrollLeft > 1;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setEdge((e) => (e.left === left && e.right === right ? e : { left, right }));
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [services.length]);

  // 가로 휠이 없는 마우스도 넘길 수 있게 세로 휠을 가로로 바꾼다. 줄이 실제로 가로로 넘칠 때만 기본 동작을 막는다 —
  // 막지 않으면 팝업이 세로로 넘치는 작은 화면에서 팝업까지 함께 내려간다. React 의 onWheel 은 passive 라 막을 수 없어 직접 단다.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      // 그 방향으로 더 갈 수 있을 때만 막는다 — 끝까지 갔으면 휠이 팝업을 세로로 내리게 둔다
      const canMove = e.deltaY > 0 ? el.scrollLeft + el.clientWidth < el.scrollWidth - 1 : el.scrollLeft > 1;
      if (!canMove) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    ref.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [selected]);

  const scrollBy = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.6, behavior: reduce ? "auto" : "smooth" });
  };
  const arrow = (dir: -1 | 1) => (
    <button
      type="button"
      tabIndex={-1}
      aria-label={dir < 0 ? "앞 서비스 보기" : "다음 서비스 보기"}
      onClick={() => scrollBy(dir)}
      className="grid h-[42px] w-[28px] shrink-0 place-items-center text-[18px] text-erp-label transition-colors duration-150 ease-out hover:text-erp-ink"
    >
      {dir < 0 ? "‹" : "›"}
    </button>
  );
  // 탭 목록 키보드 — 좌우 화살표 · Home · End 로 옮겨 고르고 그 탭에 포커스를 둔다. Tab 키로는 고른 탭 하나에만 선다(roving tabindex).
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const at = Math.max(
      0,
      services.findIndex((s) => s.serviceCode === selected),
    );
    const next =
      e.key === "ArrowRight" ? (at + 1) % services.length : e.key === "ArrowLeft" ? (at - 1 + services.length) % services.length : e.key === "Home" ? 0 : e.key === "End" ? services.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    onSelect(services[next].serviceCode);
    requestAnimationFrame(() => document.getElementById(`${idPrefix}-${services[next].serviceCode}`)?.focus());
  };
  const mask = EDGE_MASK[edge.left && edge.right ? "both" : edge.left ? "left" : edge.right ? "right" : "none"];

  return (
    <div className="flex items-stretch border-b border-erp-thead-line">
      {edge.left && arrow(-1)}
      {/* 스크롤바는 보이지 않게 잘라낸다 — 공통 틀(ErpRoot)이 모든 요소에 scrollbar-width: thin 을 !important 로 걸어 none 이 먹지 않는다.
          안쪽 줄을 42 + 24 높이로 두고(스크롤바는 그 아래 여백에 생긴다) 바깥 42 상자가 넘친 아래를 가린다. 이동은 ‹ › · 휠 · 탭 고르기로 한다. */}
      <div className="h-[42px] min-w-0 flex-1 overflow-hidden">
        <div
          ref={ref}
          role="tablist"
          aria-label="서비스"
          onScroll={measure}
          onKeyDown={handleKeyDown}
          className={`box-content flex h-[42px] gap-[6px] overflow-x-auto overflow-y-hidden overscroll-x-contain pb-[24px] [-ms-overflow-style:none] [scrollbar-width:none]! [&::-webkit-scrollbar]:hidden ${mask}`}
        >
          {services.map((s, i) => {
            const on = s.serviceCode === selected;
            // 고른 탭이 없거나 다시 받은 목록에서 사라졌으면 첫 탭이 Tab 키를 받는다
            const focusable = on || (i === 0 && !services.some((x) => x.serviceCode === selected));
            return (
              <button
                key={s.serviceCode}
                type="button"
                role="tab"
                id={`${idPrefix}-${s.serviceCode}`}
                aria-selected={on}
                aria-controls={`${idPrefix}-panel`}
                tabIndex={focusable ? 0 : -1}
                onClick={() => onSelect(s.serviceCode)}
                className={`h-[42px] shrink-0 border-b-2 px-[12px] text-[14px] font-medium whitespace-nowrap transition-colors duration-150 ease-out ${
                  on ? "border-erp-brand text-erp-ink" : "border-transparent text-erp-label hover:text-erp-ink"
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>
      {edge.right && arrow(1)}
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

  const box = (label: string, state: { checked: boolean; disabled: boolean }, onToggle: (on: boolean) => void) => (
    <span className={`inline-flex ${state.disabled ? "opacity-40" : ""}`}>
      <Checkbox label="" aria-label={label} checked={state.checked} disabled={locked || state.disabled} onChange={(e) => onToggle(e.target.checked)} />
    </span>
  );

  return (
    <table className="w-full table-fixed border-collapse border-x border-erp-thead-line text-[14px]">
      <colgroup>
        <col />
        <col className="w-[90px]" />
        {OPS.map((op) => (
          <col key={op} className="w-[90px]" />
        ))}
      </colgroup>
      <thead className="sticky top-0 z-[1]">
        <tr className="h-[42px] border-y border-erp-thead-line bg-erp-thead-bg">
          <th scope="col" className="px-[10px] font-medium text-erp-thead-text">
            메뉴명
          </th>
          <th scope="col" className="px-[10px] font-medium text-erp-thead-text">
            메뉴 계층
          </th>
          {OPS.map((op) => {
            const state = aggregate(values, nodes, op);
            return (
              <th key={op} scope="col" className="px-[10px] font-medium text-erp-thead-text">
                <span className="inline-flex items-center justify-center gap-[6px]">
                  {box(`${OP_LABEL[op]} 전체 선택`, state, (on) => onChange(toggleAll(values, nodes, op, on)))}
                  {OP_LABEL[op]}
                </span>
              </th>
            );
          })}
        </tr>
      </thead>
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
              <tr key={n.menuId} className="h-[46px] border-b border-erp-thead-line">
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
  );
}
