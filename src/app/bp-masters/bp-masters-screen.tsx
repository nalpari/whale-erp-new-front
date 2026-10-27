"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, ListToolbar, Pagination, Select, useBackdropActive, useToast } from "@/components/common";
import { usePagePermission } from "@/components/site/session-gate";
import { BP_MASTER_PAGE_SIZES, type BpMasterPageSize } from "@/lib/bp-master-paging";
import type { BpMasterDetail, BpMasterList } from "@/lib/bp-masters";
import { StoreExcelButton, StoreExcelNotice, StoreExcelProvider } from "../stores/store-excel";
import { BpMasterDetailPanel, type CreatedNotice } from "./bp-master-detail-panel";
import { BpMasterFilter } from "./bp-master-filter";
import { BpMasterFormPanel } from "./bp-master-form-panel";
import { BpMasterTable } from "./bp-master-table";
import { bpMastersExcelHref, bpMastersHref, isEditOpen, type BpMastersQuery } from "./bp-masters-href";

/** 이 화면이 상세 위에 쌓은 수정 기록에 다는 history.state 꼬리표 — 값은 그 상세의 bpCodeId */
const EDIT_PUSHED_STATE = "bpMasterEditPushedFor";

// 목록 화면과 세 슬라이드 패널(등록 · 상세 · 수정)을 한데 쥔다. 수정은 상세 위에 겹쳐 연다(플랫폼 관리자 관리와 같다, BP-6).
// 상세를 열고 닫는 것은 주소(?bp=)로 한다 — 서버가 그 BP 를 불러 detail 로 넘긴다. 수정도 주소(?edit=1)로 열어
// 브라우저 뒤로 가기가 수정 → 상세 → 목록 순으로 하나씩 접힌다. 바탕 클릭은 겹친 패널을 모두 닫는다(platform-admins 와 같다, 2026-10-22).
export function BpMastersScreen({
  list,
  query,
  detail,
}: {
  list: BpMasterList;
  query: BpMastersQuery;
  detail: { bp: BpMasterDetail } | { failed: string } | null;
}) {
  const router = useRouter();
  const toast = useToast();
  // 이 화면(/bp-masters)의 메뉴 권한으로 버튼을 보이거나 숨긴다 — 막는 것은 api 다
  const can = usePagePermission();
  const [newOpen, setNewOpen] = useState(false);
  /**
   * 지금 수정 기록(?edit=1)이 이 화면이 상세 위에 쌓은 것인가 — 그렇다면 닫을 때 뒤로 가 그 기록을 걷는다(closeEdit).
   * 새로 고침 · 앞으로 가기로 다시 열린 수정은 history.state 꼬리표로 되살린다(admins-screen.tsx 와 같다).
   */
  const editPushed = useRef(false);
  /** 방금 등록한 BP — 그 상세 위쪽에 BP 코드와 메일 주소를 알리는 띠를 세운다(BP-3). 다른 BP 를 열면 사라진다 */
  const [created, setCreated] = useState<CreatedNotice | null>(null);
  const newTrigger = useRef<HTMLButtonElement>(null);
  const detailTrigger = useRef<HTMLElement | null>(null);
  const editTrigger = useRef<HTMLButtonElement | null>(null);

  // 상세를 닫아도 패널이 밀려 나가는 동안은 마지막 내용을 그대로 보인다.
  const [shown, setShown] = useState(detail);
  if (detail && detail !== shown) setShown(detail);

  // 수정 패널은 주소에 ?edit=1 이 있고 그 BP 의 상세가 지금 열려 있을 때만 선다(bp-masters-href.ts isEditOpen).
  // 고칠 수 있는지는 상세의 [수정] 버튼과 같은 판정이다 — 메뉴 수정 권한이 있고 탈퇴 BP 가 아니어야 한다.
  const canUpdateShown = can.update && !!shown && "bp" in shown && shown.bp.accountStatus !== "WITHDRAWN";
  const editOpen = isEditOpen(query, canUpdateShown, shown);

  // 지금 수정 · 상세가 열려 있는지를 최신 값으로 본다 — 저장 · 삭제 결과가 돌아온 때 그 사이 뒤로 가기로 이미 닫혔으면
  // 다시 뒤로 가거나 목록 주소를 쌓지 않는다(admins-screen.tsx 와 같다).
  const editOpenRef = useRef(editOpen);
  const detailOpenRef = useRef(Boolean(query.bp));
  useEffect(() => {
    editOpenRef.current = editOpen;
    if (!editOpen) {
      editPushed.current = false;
      return;
    }
    // 꼬리표는 여기서만 읽고 쓴다 — router.refresh · 서버 액션이 기록을 다시 써 지우므로 닫을 때 읽으면 늦다
    const state = window.history.state as Record<string, unknown> | null;
    if (editPushed.current) window.history.replaceState({ ...state, [EDIT_PUSHED_STATE]: query.bp }, "");
    else if (state?.[EDIT_PUSHED_STATE] === query.bp) editPushed.current = true;
  }, [editOpen, query.bp]);
  useEffect(() => {
    detailOpenRef.current = Boolean(query.bp);
  }, [query.bp]);

  const go = (next: Partial<BpMastersQuery>) => router.push(bpMastersHref({ ...query, ...next }), { scroll: false });

  const openDetail = (bpCodeId: number, from: HTMLElement) => {
    detailTrigger.current = from;
    go({ bp: bpCodeId });
  };
  const closeDetail = () => go({ bp: undefined, edit: undefined });

  const openEdit = (from: HTMLButtonElement) => {
    editTrigger.current = from;
    editPushed.current = true;
    go({ edit: true });
  };
  /**
   * 수정 패널의 취소 · Esc · 저장(바탕 클릭은 closeAll). 이 화면이 쌓은 기록이면 뒤로 가 걷고, 새로 고침 · 링크로 ?edit=1 에
   * 바로 들어왔으면 주소만 바꾼다(replace) — push 로 상세 주소를 다시 쌓으면 그 뒤 뒤로 가기가 닫은 수정을 다시 연다.
   */
  const closeEdit = () => {
    // 이미 닫혔거나(저장 중 뒤로 가기) 닫는 중이면(Esc 를 빠르게 두 번) 다시 이동하지 않는다
    if (!editOpenRef.current) return;
    editOpenRef.current = false;
    if (!editTrigger.current?.isConnected) editTrigger.current = document.querySelector<HTMLButtonElement>('[aria-controls="bp-master-edit-panel"]');
    if (editPushed.current) {
      editPushed.current = false;
      router.back();
    } else router.replace(bpMastersHref({ ...query, edit: undefined }), { scroll: false });
  };
  /** 상세 패널의 Esc · 닫기. 위에 수정 패널이나 확인창 · 이력창(<dialog>)이 떠 있으면 그쪽만 닫혀야 한다(admins-screen.tsx 와 같다). */
  const dismissDetail = () => {
    if (editOpen || document.querySelector("dialog[open]")) return;
    closeDetail();
  };
  /**
   * 바탕창 클릭 — 열린 패널(등록 · 상세 · 수정)을 모두 닫고 목록으로 간다. Esc · 취소 · 뒤로 가기는 한 단계씩이다(2026-10-22, platform-admins 와 같다).
   */
  const closeAll = () => {
    setNewOpen(false);
    editPushed.current = false;
    if (query.bp) closeDetail();
  };
  /** 등록 패널 위에 (앞으로 가기 등으로) 상세가 겹쳐 있으면 Esc 는 위의 상세만 닫는다 */
  const dismissNew = () => {
    if (query.bp) return;
    setNewOpen(false);
  };

  // 바탕창이 떠 있는 동안 목록 · 필터를 inert 로 뺀다 — 바탕창은 포커스를 가두지 않는다(admins-screen.tsx 참고)
  const backdropActive = useBackdropActive();
  const excelHref = bpMastersExcelHref(query);

  return (
    <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
      <div className="contents" inert={backdropActive}>
        <BpMasterFilter query={query} onApply={(next) => go({ ...next, page: 1, bp: undefined })} />
        <main className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px] [&>*]:shrink-0">
          <StoreExcelProvider fileName="BP목록.xlsx">
            <StoreExcelNotice href={excelHref} />
            <ListToolbar total={list.total}>
              <StoreExcelButton href={excelHref} empty={list.total === 0} emptyTitle="받을 BP 가 없습니다" />
              {can.create && (
                <Button ref={newTrigger} aria-controls="bp-master-new-panel" aria-expanded={newOpen} onClick={() => setNewOpen(true)}>
                  등록
                </Button>
              )}
              <div className="w-[80px] shrink-0">
                <Select
                  aria-label="페이지당 건수"
                  value={String(query.pageSize)}
                  onChange={(e) => go({ pageSize: Number(e.target.value) as BpMasterPageSize, page: 1, bp: undefined })}
                >
                  {BP_MASTER_PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </Select>
              </div>
            </ListToolbar>
          </StoreExcelProvider>
          <BpMasterTable rows={list.items} selected={query.bp} onOpen={openDetail} />
          <div className="pt-[14px]">
            <Pagination page={query.page} totalPages={Math.max(1, Math.ceil(list.total / query.pageSize))} onPageChange={(page) => go({ page, bp: undefined })} />
          </div>
          <p className="text-[13px] leading-[1.6] text-erp-label">
            사업자등록번호가 빈 줄이 사업자정보 미인증 BP 입니다. 탈퇴 BP 는 이름 · 연락처 · 이메일이 지워져 BP 코드 · 아이디 · 상호명 · 사업자등록번호로만 찾을 수
            있습니다. 엑셀에는 목록 항목과 BP 사업자정보 전체를 담고, 연락처와 대표자 연락처는 가운데자리를 가립니다.
          </p>
        </main>
      </div>

      {can.create && (
        <BpMasterFormPanel
          id="bp-master-new-panel"
          mode="create"
          open={newOpen}
          onClose={dismissNew}
          onBackdropClose={closeAll}
          trigger={newTrigger}
          onSaved={(result) => {
            setNewOpen(false);
            // 상세 띠는 상세를 불러와야 보이고 다른 줄을 누르면 사라진다 — 메일 실패를 놓치지 않게 토스트로도 알린다(platform-admins 와 같다)
            toast(result.isMailSent ? "saved" : "저장되었습니다. 초기 비밀번호 메일은 보내지 못했습니다 — 상세에서 비밀번호를 초기화해 주세요.");
            setCreated(result);
            detailTrigger.current = newTrigger.current;
            go({ bp: result.bpCodeId });
          }}
        />
      )}

      <BpMasterDetailPanel
        open={Boolean(query.bp)}
        detail={shown}
        created={created && shown && "bp" in shown && shown.bp.bpCodeId === created.bpCodeId ? created : null}
        onClose={dismissDetail}
        onBackdropClose={closeAll}
        trigger={detailTrigger}
        onEdit={openEdit}
        onDeleted={() => {
          toast("deleted");
          // 삭제를 기다리는 동안 뒤로 가기로 상세가 이미 닫혔으면 목록 주소를 다시 쌓지 않는다
          if (detailOpenRef.current) closeDetail();
        }}
      />

      {/* 상세보다 뒤에 둔다 — 상세의 Esc 처리(dismissDetail)가 수정의 것보다 먼저 달려야 editOpen 을 보고 거른다(admins-screen.tsx 참고) */}
      {canUpdateShown && shown && "bp" in shown && (
        <BpMasterFormPanel
          // 다른 BP 면 새로 그린다. 같은 BP 를 다시 열면 패널이 스스로 칸을 다시 채운다.
          key={shown.bp.bpCodeId}
          id="bp-master-edit-panel"
          mode="edit"
          bp={shown.bp}
          open={editOpen}
          onClose={closeEdit}
          onBackdropClose={closeAll}
          trigger={editTrigger}
          onSaved={() => {
            closeEdit();
            toast("updated");
          }}
        />
      )}
    </div>
  );
}
