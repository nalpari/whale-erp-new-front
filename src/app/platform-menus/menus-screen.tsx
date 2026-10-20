"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Badge, Button, ConfirmDialog, DataTable, useToast, type Column } from "@/components/common";
import { ServiceTabs } from "@/components/site/service-tabs";
import { usePagePermission } from "@/components/site/session-gate";
import { CARD, FailedBand } from "@/components/site/side-parts";
import { createPlacement, descendantCountOf, findRow, flatten, placeLabel, type FlatRow, type Spot, type Verdict } from "@/lib/menu-tree";
import { MENU_CODE } from "@/lib/menus";
import type { MenuNode, MenuService, MenuTree } from "@/lib/platform-menus";
import { moveMenuAction } from "./actions";
import { MenuSide } from "./menu-side";
import { hrefOf, statusText, unknownResult, type MenuDetailState } from "./menu-parts";
import { useTreeDrag } from "./use-tree-drag";

// 서비스 탭 + 왼쪽 메뉴 트리 + 오른쪽 고정 칸(데모 system/menus). 오른쪽 칸은 슬라이드 패널이 아니라 늘 서 있다.
// 줄을 누르면 오른쪽에 그 메뉴의 수정(수정 권한이 없으면 상세)이, 같은 줄을 다시 누르면 고른 것을 푼다. [등록]을 누르면 같은 칸이 등록 양식이 되고
// 트리의 새 자리(고른 메뉴 안 맨 끝, 3단계를 고르면 그 상위 안 맨 끝, 고른 것이 없으면 최상위 맨 끝)에 「작성 중」 줄이 선다.
// 손잡이로 끌어 옮기면 바로 저장된다(목업). 버튼은 지금 주소(/platform-menus)의 메뉴 권한(usePagePermission)으로 보인다 — 등록 create, 저장 · 옮기기 update. 막는 것은 api 다.
// MN000215(SELF_MENU_CODE)는 권한이 아니라 자기 잠금 확인(이 화면이 닫히는 저장 · 옮기기)에만 쓴다.

type Row = { kind: "menu"; row: FlatRow<MenuNode> } | { kind: "draft" };

const SELF_MENU_CODE = MENU_CODE.platformMenus;

/**
 * 옮기면 이 화면이 닫히는가 — 옮기는 메뉴(하위 포함)에 이 화면이 있고, 새 상위나 그 위가 미사용이다.
 * login-info 의 메뉴 트리는 사용 중 메뉴만 이어, 미사용 상위 아래의 메뉴는 함께 빠진다(api buildMenuTree).
 */
function locksSelfByMove(nodes: MenuNode[], moved: MenuNode, parentMenuId: number | null): boolean {
  const has = (n: MenuNode): boolean => n.menuCode === SELF_MENU_CODE || n.children.some(has);
  if (!has(moved)) return false;
  for (let id = parentMenuId; id !== null; ) {
    const row = findRow(nodes, id);
    if (!row) return false;
    if (row.node.status !== "ACTIVE") return true;
    id = row.parent?.menuId ?? null;
  }
  return false;
}

export function MenusScreen({ services, tree, selected, detail }: { services: MenuService[]; tree: MenuTree | null; selected?: number; detail: MenuDetailState }) {
  const router = useRouter();
  const toast = useToast();
  const can = usePagePermission();
  const nodes = tree?.items ?? [];
  const serviceCode = tree?.service.serviceCode ?? "";
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [moveFailure, setMoveFailure] = useState<{ message: string; detail: string } | null>(null);
  const [moving, startMoving] = useTransition();
  // 이 화면이 닫히는 옮기기 — 확인을 받는 동안 쥐고 있다
  const [pendingMove, setPendingMove] = useState<{ menuId: number; spot: Spot; verdict: Extract<Verdict, { kind: "ok" }>; via: "drag" | "key" } | null>(null);
  // 옮긴 뒤 손잡이로 포커스를 돌려줄 메뉴 — 그리기와 상관없어 ref 로 둔다
  const focusAfterMove = useRef<number | null>(null);
  // 고른 줄이 트리에 없으면(지웠거나 다른 서비스) 고르지 않은 것으로 본다
  const picked = selected !== undefined && findRow(nodes, selected) ? selected : null;
  const placement = creating ? createPlacement(nodes, picked) : null;

  const handleSelect = (id?: number) => {
    setCreating(false);
    setMoveFailure(null);
    router.push(hrefOf(serviceCode, id), { scroll: false });
  };
  const handleRowClick = (id: number) => handleSelect(id === picked && !creating ? undefined : id);
  const handleServiceSelect = (code: string) => {
    setCreating(false);
    setMoveFailure(null);
    router.push(hrefOf(code), { scroll: false });
  };
  const handleCreate = () => {
    setDraftName("");
    setMoveFailure(null);
    setCreating(true);
  };

  /** 놓은 자리 판정대로 — 제자리는 그대로, 거절은 띠로, 옮길 수 있으면 바로 저장한다 */
  const handleDrop = (menuId: number, spot: Spot, verdict: Verdict, via: "drag" | "key") => {
    const moved = findRow(nodes, menuId)?.node;
    if (!moved || verdict.kind === "noop") return;
    if (verdict.kind === "cycle") return setMoveFailure({ message: "메뉴를 자기 자신이나 하위 메뉴 아래로 옮길 수 없습니다", detail: "옮기지 않았습니다 — 트리는 그대로입니다." });
    if (verdict.kind === "depth") {
      const parent = spot.parentMenuId === null ? null : findRow(nodes, spot.parentMenuId)?.node;
      return setMoveFailure({
        message: "메뉴는 최대 3단계까지만 둘 수 있습니다",
        detail: `‘${moved.name}’ 메뉴를 ${parent ? `‘${parent.name}’ 아래` : "최상위"}에 놓으면 ${verdict.level}단계${verdict.deep > verdict.level ? `, 그 하위 메뉴가 ${verdict.deep}단계` : ""}가 됩니다. 옮기지 않았습니다.`,
      });
    }
    // 이 화면(MN000215)을 미사용 상위 아래로 옮기면 다음 로그인부터 메뉴 트리에서 빠져 화면으로는 되돌릴 수 없다 — 미사용으로 저장할 때처럼 확인받는다
    if (locksSelfByMove(nodes, moved, spot.parentMenuId)) return setPendingMove({ menuId, spot, verdict, via });
    saveMove(menuId, spot, verdict, via);
  };

  const saveMove = (menuId: number, spot: Spot, verdict: Extract<Verdict, { kind: "ok" }>, via: "drag" | "key") => {
    setPendingMove(null);
    const moved = findRow(nodes, menuId)?.node;
    if (!moved) return;
    const where = `${placeLabel(nodes, spot.parentMenuId, verdict.index + 1)}(${verdict.level}단계)`;
    const carried = descendantCountOf(moved);
    startMoving(async () => {
      const result = await moveMenuAction(menuId, { parentMenuId: spot.parentMenuId, index: verdict.index }).catch(unknownResult("메뉴 이동 저장"));
      if (!result.ok) {
        // 화면이 cycle · depth 를 미리 막으므로 api 의 400 · 409 는 이 트리가 낡았다는 뜻이다(남이 옮기거나 하위를 더함).
        // 그 사이 지워졌거나(404) 결과를 모를 때와 함께 최신 트리를 받는다 — 안 받으면 같은 이동이 새로고침 전까지 계속 거절된다
        const stale = result.status === undefined || result.status === 400 || result.status === 404 || result.status === 409;
        setMoveFailure({
          message: result.message,
          detail:
            result.status === undefined
              ? `최신 트리를 다시 받았습니다. ‘${moved.name}’ 메뉴가 옮겨졌는지 확인해 주세요.`
              : `‘${moved.name}’ 메뉴는 옮기기 전 자리 그대로입니다.${stale ? " 최신 트리를 다시 받았습니다." : ""}`,
        });
        if (stale) router.refresh();
        return;
      }
      setMoveFailure(null);
      toast(`이동했습니다 — ${where}로 옮기고 순서를 다시 매겼습니다.${carried ? ` 하위 메뉴 ${carried}개가 함께 움직였습니다.` : ""}`);
      if (via === "key") focusAfterMove.current = menuId;
      // 옮긴 메뉴를 고른다(목업)
      if (menuId !== picked) router.push(hrefOf(serviceCode, menuId), { scroll: false });
    });
  };

  const editable = can.update;
  const drag = useTreeDrag({ nodes, enabled: editable && !creating && !moving, onDrop: handleDrop });

  // 키보드로 옮긴 뒤 새 트리가 그려지면 옮긴 메뉴의 손잡이로 포커스를 돌려준다 — 이어서 화살표로 옮길 수 있게
  useEffect(() => {
    const id = focusAfterMove.current;
    if (id === null || moving) return;
    focusAfterMove.current = null;
    document.querySelector<HTMLElement>(`[data-menu-handle="${id}"]`)?.focus();
  }, [moving, tree]);

  const flat = flatten(nodes);
  const rows: Row[] = flat.map((row) => ({ kind: "menu", row }));
  if (placement) {
    const at = placement.afterId === null ? rows.length : rows.findIndex((r) => r.kind === "menu" && r.row.node.menuId === placement.afterId) + 1;
    rows.splice(at, 0, { kind: "draft" });
  }

  const muted = (node: MenuNode, text: React.ReactNode) => (node.status === "ACTIVE" ? text : <span className="text-erp-muted">{text}</span>);
  const columns: Column<Row>[] = [
    ...(editable ? [{ header: "이동", width: "w-[56px]", cell: (r: Row) => (r.kind === "menu" ? drag.handle(r.row.node) : null) } satisfies Column<Row>] : []),
    {
      header: "노출 메뉴명",
      align: "left",
      cell: (r) => {
        const depth = r.kind === "menu" ? r.row.node.depth : placement!.depth;
        const name = r.kind === "menu" ? r.row.node.name : draftName.trim() || "새 메뉴";
        return (
          <span style={{ paddingLeft: (depth - 1) * 18 }} className={r.kind === "menu" && r.row.node.status !== "ACTIVE" ? "text-erp-muted" : undefined}>
            {r.kind === "menu" ? (
              // 줄 누르기와 같은 고르기를 키보드로도 — 눌림은 줄(tr)의 onClick 으로 올라간다
              <button type="button" aria-pressed={r.row.node.menuId === picked && !creating} className="max-w-full truncate text-left">
                {depth === 1 ? <b className="font-semibold">{name}</b> : name}
              </button>
            ) : (
              <b className="font-semibold">{name}</b>
            )}
            {r.kind === "menu" && r.row.node.isGroup && <span className="text-[13px] text-erp-label"> 묶음</span>}
            {r.kind === "draft" && <span className="text-[13px] text-erp-label"> 작성 중</span>}
          </span>
        );
      },
    },
    { header: "메뉴 코드", width: "w-[110px]", cell: (r) => (r.kind === "menu" ? muted(r.row.node, r.row.node.menuCode) : <span className="text-erp-label">자동 채번</span>) },
    {
      header: "메뉴 계층",
      width: "w-[90px]",
      cell: (r) => <span className="text-erp-label">{r.kind === "menu" ? r.row.node.depth : placement!.depth}단계</span>,
    },
    {
      header: "메뉴 URL",
      align: "left",
      width: "w-[240px]",
      cell: (r) => (r.kind === "menu" && r.row.node.url ? muted(r.row.node, r.row.node.url) : <span className="text-erp-muted">—</span>),
    },
    { header: "순서", width: "w-[60px]", cell: (r) => (r.kind === "menu" ? muted(r.row.node, r.row.node.sortOrder) : placement!.order) },
    {
      header: "사용 상태",
      width: "w-[100px]",
      cell: (r) =>
        r.kind === "menu" ? <Badge tone={r.row.node.status === "ACTIVE" ? "on" : "off"}>{statusText(r.row.node.status)}</Badge> : <span className="text-erp-muted">—</span>,
    },
  ];

  const tabId = "platform-menus-tabs";
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[12px] p-[24px]">
      <ServiceTabs
        services={services.map((s) => ({
          serviceCode: s.serviceCode,
          name: s.name,
          suffix: (
            <>
              <span className="ml-[6px] text-erp-label">{s.menuCount.toLocaleString("ko-KR")}</span>
              {s.status !== "ACTIVE" && (
                <span className="ml-[6px]">
                  <Badge tone="off">미사용</Badge>
                </span>
              )}
            </>
          ),
        }))}
        selected={serviceCode || null}
        idPrefix={tabId}
        onSelect={handleServiceSelect}
      />
      <div id={`${tabId}-panel`} role="tabpanel" aria-labelledby={serviceCode ? `${tabId}-${serviceCode}` : undefined} className="flex min-h-0 flex-1 gap-[12px]">
        <section className={`${CARD} min-w-0 flex-1`} aria-label="메뉴 트리">
          <div className="flex items-end gap-[6px]">
            <h2 className="text-[18px] font-semibold text-erp-ink">
              메뉴 트리 <span className="ml-[6px] text-[14px] font-normal text-erp-label">{(tree?.total ?? 0).toLocaleString("ko-KR")}개</span>
            </h2>
            {/* 끄는 동안 놓을 자리를, 옮기는 동안 진행을 알린다 — 화면 읽기 프로그램에도 */}
            <p aria-live="polite" className="min-w-0 flex-1 truncate text-[13px] text-erp-label">
              {moving ? "옮기는 중입니다…" : drag.hint}
            </p>
            {can.create && (
              <Button onClick={handleCreate} disabled={creating || moving || !tree}>
                등록
              </Button>
            )}
          </div>
          {moveFailure && <FailedBand message={moveFailure.message} detail={moveFailure.detail} />}
          <div {...drag.wrapProps} className="relative">
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(r) => (r.kind === "menu" ? r.row.node.menuId : "draft")}
              rowState={(r) => (r.kind === "draft" ? "added" : !creating && r.row.node.menuId === picked ? "selected" : undefined)}
              rowProps={(r) =>
                r.kind === "menu"
                  ? {
                      ...(editable ? drag.rowProps(r.row.node) : {}),
                      onClick: () => handleRowClick(r.row.node.menuId),
                    }
                  : {}
              }
              empty="이 서비스에 등록된 메뉴가 없습니다."
            />
            {drag.dragging !== null && (
              <div {...drag.endProps} className="flex h-[46px] items-center justify-center border border-t-0 border-dashed border-erp-thead-line text-[13px] text-erp-label">
                여기에 놓으면 최상위 맨 끝으로 옮깁니다
              </div>
            )}
            {drag.indicator}
          </div>
        </section>

        <MenuSide
          // 다른 메뉴를 고르면 칸을 새로 그린다. 같은 메뉴의 최신 정보(updatedAt)로는 다시 그리지 않는다 — 다시 그리면 409 실패 문구 · 고치던 입력이
          // 함께 사라진다. 최신 값으로 칸을 다시 채우는 것은 폼이 맞춘다(menu-form.ts).
          key={creating ? `new-${placement?.parent?.menuId ?? "root"}` : detail && "menu" in detail ? String(detail.menu.menuId) : String(picked ?? "empty")}
          serviceCode={serviceCode}
          nodes={nodes}
          placement={placement}
          detail={picked === null ? (detail && "failed" in detail ? detail : null) : detail}
          onDraftNameChange={setDraftName}
          onCancelCreate={() => setCreating(false)}
          onCreated={(id) => handleSelect(id)}
          onCreateUnknown={(message) => {
            // 등록됐는지 모른다 — 양식을 닫아 같은 입력으로 다시 저장해 메뉴가 둘 생기지 않게 하고(삭제가 없다) 최신 트리를 받는다
            setCreating(false);
            setMoveFailure({ message, detail: "최신 트리를 다시 받았습니다. 새 메뉴가 생겼는지 트리에서 확인한 뒤, 없으면 다시 등록해 주세요." });
            router.refresh();
          }}
        />
        <ConfirmDialog
          open={pendingMove !== null}
          title="이 화면이 닫힙니다"
          confirmLabel="옮겨 저장"
          busy={moving}
          onConfirm={() => pendingMove && saveMove(pendingMove.menuId, pendingMove.spot, pendingMove.verdict, pendingMove.via)}
          onCancel={() => setPendingMove(null)}
        >
          <p className="text-[14px] leading-[1.6]">
            미사용 메뉴 아래로 옮기면 플랫폼 메뉴 관리({SELF_MENU_CODE})도 사용자 화면과 메뉴 권한에서 빠져, 다음 로그인부터 이 화면으로는 되돌릴 수 없습니다. 계속할까요?
          </p>
        </ConfirmDialog>
      </div>
    </div>
  );
}
