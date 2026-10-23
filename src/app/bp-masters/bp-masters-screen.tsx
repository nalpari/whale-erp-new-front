"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, ListToolbar, Pagination, Select, useBackdropActive, useToast } from "@/components/common";
import { usePagePermission } from "@/components/site/session-gate";
import { BP_MASTER_PAGE_SIZES, type BpMasterPageSize } from "@/lib/bp-master-paging";
import type { BpMasterDetail, BpMasterList } from "@/lib/bp-masters";
import { StoreExcelButton, StoreExcelNotice, StoreExcelProvider } from "../stores/store-excel";
import { BpMasterDetailPanel, type CreatedNotice } from "./bp-master-detail-panel";
import { BpMasterFilter } from "./bp-master-filter";
import { BpMasterFormPanel } from "./bp-master-form-panel";
import { BpMasterTable } from "./bp-master-table";
import { bpMastersExcelHref, bpMastersHref, type BpMastersQuery } from "./bp-masters-href";

// 목록 화면과 세 슬라이드 패널(등록 · 상세 · 수정)을 한데 쥔다. 수정은 상세 위에 겹쳐 연다(플랫폼 관리자 관리와 같다, BP-6).
// 상세를 열고 닫는 것은 주소(?bp=)로 한다 — 서버가 그 BP 를 불러 detail 로 넘긴다.
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
  /** 수정 중인 BP — 열림 · 닫힘이 아니라 어느 BP 인지를 쥐어, 주소 · 상세가 바뀌면 수정 패널이 저절로 닫힌 것이 된다 */
  const [editingId, setEditingId] = useState<number | null>(null);
  /** 방금 등록한 BP — 그 상세 위쪽에 BP 코드와 메일 주소를 알리는 띠를 세운다(BP-3). 다른 BP 를 열면 사라진다 */
  const [created, setCreated] = useState<CreatedNotice | null>(null);
  const newTrigger = useRef<HTMLButtonElement>(null);
  const detailTrigger = useRef<HTMLElement | null>(null);
  const editTrigger = useRef<HTMLButtonElement | null>(null);

  // 상세를 닫아도 패널이 밀려 나가는 동안은 마지막 내용을 그대로 보인다.
  const [shown, setShown] = useState(detail);
  if (detail && detail !== shown) setShown(detail);

  // 수정 패널은 그 BP 의 상세가 지금 열려 있을 때만 선다(뒤로 가기 · 필터 이동 · 그 사이 삭제로 상세가 바뀌면 수정도 접는다 — admins-screen.tsx 참고).
  const editOpen = editingId !== null && editingId === query.bp && !!shown && "bp" in shown && shown.bp.bpCodeId === editingId;
  if (editingId !== null && !editOpen && (editingId !== query.bp || (shown && !("bp" in shown)))) setEditingId(null);

  const go = (next: Partial<BpMastersQuery>) => router.push(bpMastersHref({ ...query, ...next }), { scroll: false });

  const openDetail = (bpCodeId: number, from: HTMLElement) => {
    detailTrigger.current = from;
    go({ bp: bpCodeId });
  };
  const closeDetail = () => {
    setEditingId(null);
    go({ bp: undefined });
  };
  /** 상세 패널의 Esc · 닫기. 위에 수정 패널이나 확인창 · 이력창(<dialog>)이 떠 있으면 그쪽만 닫혀야 한다(admins-screen.tsx 와 같다). */
  const dismissDetail = () => {
    if (editOpen || document.querySelector("dialog[open]")) return;
    closeDetail();
  };
  /** 등록 패널 위에 상세가 겹쳐 있으면 Esc 는 위의 상세만 닫는다 */
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
          trigger={newTrigger}
          onSaved={(result) => {
            setNewOpen(false);
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
        trigger={detailTrigger}
        onEdit={(from) => {
          editTrigger.current = from;
          if (shown && "bp" in shown) setEditingId(shown.bp.bpCodeId);
        }}
        onDeleted={() => {
          toast("deleted");
          closeDetail();
        }}
      />

      {can.update && shown && "bp" in shown && shown.bp.accountStatus !== "WITHDRAWN" && (
        <BpMasterFormPanel
          // 다른 BP 면 새로 그린다. 같은 BP 를 다시 열면 패널이 스스로 칸을 다시 채운다.
          key={shown.bp.bpCodeId}
          id="bp-master-edit-panel"
          mode="edit"
          bp={shown.bp}
          open={editOpen}
          onClose={() => setEditingId(null)}
          trigger={editTrigger}
          onSaved={() => {
            setEditingId(null);
            toast("updated");
          }}
        />
      )}
    </div>
  );
}
