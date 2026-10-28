"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Badge, Button, ConfirmDialog, DataTable, PageBar, Tag, useToast, type Column } from "@/components/common";
import { ServiceTabs } from "@/components/site/service-tabs";
import { usePagePermission } from "@/components/site/session-gate";
import { CARD, FailedBand } from "@/components/site/side-parts";
import { createPlacement, findRow, flatten, type FlatRow, type Spot, type Verdict } from "@/lib/menu-tree";
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
  const [moveFailure, setMoveFailure] = useState<{ message: string; detail?: string } | null>(null);
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
    // 한 줄로 — 「옮기지 않았습니다 …」는 같은 말을 되풀이해 뺐다. 단계와 상관없이 자기 · 자기 하위 아래에 놓을 때라 「상위」라고 쓰지 않는다(2026-10-28 사용자 지정)
    if (verdict.kind === "cycle") return setMoveFailure({ message: "메뉴를 자기 하위 메뉴 아래로 옮길 수 없습니다." });
    // 단계 초과도 한 줄로 — 어디에 놓으면 몇 단계가 되는지 · 「옮기지 않았습니다」는 길어 안 읽혀 뺐다(2026-10-28 사용자 지정)
    if (verdict.kind === "depth") return setMoveFailure({ message: "메뉴는 최대 3단계까지만 만들 수 있습니다." });
    // 이 화면(MN000215)을 미사용 상위 아래로 옮기면 다음 로그인부터 메뉴 트리에서 빠져 화면으로는 되돌릴 수 없다 — 미사용으로 저장할 때처럼 확인받는다
    if (locksSelfByMove(nodes, moved, spot.parentMenuId)) return setPendingMove({ menuId, spot, verdict, via });
    saveMove(menuId, spot, verdict, via);
  };

  const saveMove = (menuId: number, spot: Spot, verdict: Extract<Verdict, { kind: "ok" }>, via: "drag" | "key") => {
    setPendingMove(null);
    const moved = findRow(nodes, menuId)?.node;
    if (!moved) return;
    startMoving(async () => {
      const result = await moveMenuAction(menuId, { parentMenuId: spot.parentMenuId, index: verdict.index }).catch(unknownResult("메뉴 이동 저장"));
      if (!result.ok) {
        // 화면이 cycle · depth 를 미리 막으므로 api 의 400 · 409 는 이 트리가 낡았다는 뜻이다(남이 옮기거나 하위를 더함).
        // 그 사이 지워졌거나(404) 결과를 모를 때와 함께 최신 트리를 받는다 — 안 받으면 같은 이동이 새로고침 전까지 계속 거절된다
        const stale = result.status === undefined || result.status === 400 || result.status === 404 || result.status === 409;
        // 그 사이 남이 트리를 바꿨으면(400 · 404 · 409) api 문장 대신 쉬운 말로(2026-10-28 사용자 지정 문구). 응답을 못 받으면 옮겨졌는지 모른다는 문구, 그 밖의 거절은 받은 문장 그대로
        setMoveFailure(
          result.status !== undefined && stale
            ? { message: "다른 관리자가 메뉴 구성을 변경하여 저장하지 못했습니다.", detail: "변경된 내용을 확인한 후 다시 시도해 주세요." }
            : result.status === undefined
              ? // 응답을 못 받았다 — 옮겨졌는지 모른다(2026-10-28 사용자 지정 문구)
                { message: "메뉴 이동 결과를 확인하지 못했습니다.", detail: "메뉴가 이동되었는지 확인한 후, 다시 시도해 주세요." }
              : { message: result.message, detail: `‘${moved.name}’ 메뉴는 옮기기 전 자리 그대로입니다.` },
        );
        if (stale) router.refresh();
        return;
      }
      setMoveFailure(null);
      // 결과는 트리에서 바로 보이고 옮긴 메뉴가 골라진 채 남아 자리 설명은 두지 않는다 — 문구가 길어 안 읽혔다(2026-10-28 사용자 지정)
      toast("메뉴를 이동했습니다.");
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
  // 위 단계가 미사용이라 사용자 화면 · 메뉴 설정에서 함께 숨는 메뉴 — 자기 사용여부는 그대로 둔다(상위를 다시 사용으로 바꾸면 그대로 보이게, 2026-10-27 사용자 지정)
  const hiddenByParent = new Set<number>();
  const markHidden = (list: MenuNode[], parentOff: boolean) =>
    list.forEach((n) => {
      if (parentOff) hiddenByParent.add(n.menuId);
      markHidden(n.children, parentOff || n.status !== "ACTIVE");
    });
  markHidden(nodes, false);
  const rows: Row[] = flat.map((row) => ({ kind: "menu", row }));
  if (placement) {
    const at = placement.afterId === null ? rows.length : rows.findIndex((r) => r.kind === "menu" && r.row.node.menuId === placement.afterId) + 1;
    rows.splice(at, 0, { kind: "draft" });
  }

  const muted = (node: MenuNode, text: React.ReactNode) => (node.status === "ACTIVE" ? text : <span className="text-erp-muted">{text}</span>);
  const columns: Column<Row>[] = [
    ...(editable ? [{ header: "이동", width: "w-[56px]", cell: (r: Row) => (r.kind === "menu" ? drag.handle(r.row.node) : null) } satisfies Column<Row>] : []),
    {
      header: "메뉴명", // 「노출 메뉴명」에서 줄임(2026-10-26 사용자 지정)
      align: "left",
      width: "w-[250px]", // 폭을 안 주면 표 전체 남는 칸을 다 먹어 메뉴코드 칸과 간격이 벌어진다(사용자 지적, 2026-10-26 — 220px는 너무 붙어 250px로 조정)
      cell: (r) => {
        const depth = r.kind === "menu" ? r.row.node.depth : placement!.depth;
        const name = r.kind === "menu" ? r.row.node.name : draftName.trim() || "새 메뉴";
        return (
          <span style={{ paddingLeft: (depth - 1) * 18 }} className={r.kind === "menu" && r.row.node.status !== "ACTIVE" ? "text-erp-muted" : undefined}>
            {/* 2단계부터 회색 「└ 」 — 권한별 메뉴설정 팝업과 같은 모양(2026-10-28 사용자 지정) */}
            {depth > 1 && <span className="text-erp-label">└ </span>}
            {r.kind === "menu" ? (
              // 줄 누르기와 같은 고르기를 키보드로도 — 눌림은 줄(tr)의 onClick 으로 올라간다
              <button type="button" aria-pressed={r.row.node.menuId === picked && !creating} className="max-w-full truncate text-left">
                {depth === 1 ? <b className="font-semibold">{name}</b> : name}
              </button>
            ) : (
              <b className="font-semibold">{name}</b>
            )}
            {/* 하위가 있는 메뉴의 「묶음」 글자는 두지 않는다 — 들여쓰기 · 굵은 글씨로 이미 보인다(2026-10-28 사용자 지정) */}
            {r.kind === "draft" && <span className="text-[13px] text-erp-label"> 작성 중</span>}
          </span>
        );
      },
    },
    { header: "메뉴 코드", width: "w-[110px]", cell: (r) => (r.kind === "menu" ? muted(r.row.node, r.row.node.menuCode) : <span className="text-erp-label">자동 채번</span>) },
    {
      header: "메뉴단계", // 권한별 메뉴설정 팝업과 같은 이름(2026-10-26 사용자 지정)
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
      header: "사용여부",
      // 「사용 + 상위 미사용」 꼬리표가 한 줄에 들게 넓힌다(2026-10-27)
      width: "w-[180px]",
      cell: (r) =>
        r.kind === "menu" ? (
          // 상위가 미사용이면 자기 값(사용 · 미사용)은 그대로 보이고, 숨는 이유를 회색 꼬리표로 덧붙인다(2026-10-27 사용자 지정 — 안 A)
          // 배지는 늘 같은 자리(166px 묶음을 칸 가운데에 두고 트리 들여쓰기 한 칸(18px) 더 민 뒤, 그 왼쪽 56px 칸 가운데)에 두고 꼬리표는 그 오른쪽 — 꼬리표 유무로 배지가 좌우로 흔들려 읽기 어려웠다(2026-10-28 사용자 지정)
          <span className="mx-auto grid w-[166px] grid-cols-[56px_1fr] pl-[18px] items-center gap-[6px]">
            <span className="justify-self-center">
              <Badge tone={r.row.node.status === "ACTIVE" ? "on" : "off"}>{statusText(r.row.node.status)}</Badge>
            </span>
            <span className="justify-self-start">{hiddenByParent.has(r.row.node.menuId) && <Tag>상위 미사용</Tag>}</span>
          </span>
        ) : (
          <span className="text-erp-muted">—</span>
        ),
    },
  ];

  const tabId = "platform-menus-tabs";
  return (
    <>
      {/* [등록]은 제목 줄 오른쪽 — 3팀 목록과 같은 자리(2026-10-23). 새 메뉴 자리는 createPlacement 가 정한다(고른 메뉴 안 · 3단계면 그 상위 안 · 고른 것이 없으면 최상위 맨 끝) */}
      <PageBar title="플랫폼 메뉴 관리">
        {can.create && (
          <Button onClick={handleCreate} disabled={creating || moving || !tree}>
            등록
          </Button>
        )}
      </PageBar>
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
            </div>
            {moveFailure && <FailedBand message={moveFailure.message} detail={moveFailure.detail} />}
            {/* 머리 줄까지 고정하고 아래만 스크롤(DataTable scroll) — 칸이 남는 높이를 채우게 flex 묶음으로 둔다. CARD 의 [&>*]:shrink-0 를 이 칸만 푼다.
                머리 색은 권한별 메뉴설정 팝업과 같다(2026-10-26 사용자 지정). 1단계 줄 바탕은 두지 않고 굵은 글씨로만 가른다 — 고른 줄(current)
                회색과 거의 같아 헷갈렸다(2026-10-28 사용자 지정 — 전엔 erp-thead-bg) */}
            {/* 1단계 묶음 사이에 1px 진한 선(2px 는 무거웠다) — 묶음이 한눈에 갈라지게(2026-10-28 사용자 지정, 비교 페이지 3번). 공통 DataTable 은 줄 모양을 받지 않아
                줄에 data-top 을 달고(rowProps) 감싸는 칸에서 칠한다. #c9d1de — 표 선(#e9edf5)보다 한 단계 진한 선, 이 표에만 쓰여 토큰이 없다 */}
            <div
              {...drag.wrapProps}
              className="relative flex min-h-0 flex-1 shrink! flex-col [&_tbody_tr[data-top]:not(:first-child)>td]:border-t [&_tbody_tr[data-top]:not(:first-child)>td]:border-t-[#c9d1de]"
            >
              <DataTable
                columns={columns}
                rows={rows}
                rowKey={(r) => (r.kind === "menu" ? r.row.node.menuId : "draft")}
                rowState={(r) =>
                  r.kind === "draft" ? "added" : !creating && r.row.node.menuId === picked ? "current" : undefined
                }
                headVariant="subtle"
                scroll
                rowProps={(r) =>
                  r.kind === "menu"
                    ? {
                        ...(editable ? drag.rowProps(r.row.node) : {}),
                        onClick: () => handleRowClick(r.row.node.menuId),
                        "data-top": r.row.node.depth === 1 ? "" : undefined,
                      }
                    : { "data-top": placement?.depth === 1 ? "" : undefined } // 새 1단계 메뉴 줄도 위에 묶음 선
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
            // 문구 · 버튼 이름은 사용자 지정(2026-10-28) — 메뉴 이름 · 코드는 넣지 않는다(바뀌면 문구도 고쳐야 해서)
            title="미사용 메뉴 아래로 이동하시겠습니까?"
            confirmLabel="이동 후 저장"
            busy={moving}
            onConfirm={() => pendingMove && saveMove(pendingMove.menuId, pendingMove.spot, pendingMove.verdict, pendingMove.via)}
            onCancel={() => setPendingMove(null)}
          >
            {/* 「다.」만 다음 줄로 넘어가지 않게 「접근할 수 없습니다.」 앞에서 줄을 바꾼다(2026-10-28 사용자 지정) */}
            <p className="text-[14px] leading-[1.6]">
              이동 후에는 현재 화면이 사용자 메뉴에서 제외되어
              <br />
              접근할 수 없습니다.
            </p>
          </ConfirmDialog>
        </div>
      </div>
    </>
  );
}
