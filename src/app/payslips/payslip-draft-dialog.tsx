"use client";

import Link from "next/link";
import { unstable_rethrow, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Button, ConfirmDialog, DataTable, Field, FormRow, SearchField, Select, useToast, type Column } from "@/components/common";
import { labelOf, type EnumValue } from "@/lib/enums";
import { monthLabel, type PayslipCandidate } from "@/lib/payslips";
import { CellView } from "../staff-members/staff-table";
import { bulkCreatePayslips, createPayslip, getPayslipCandidatesAction, type DraftFailure } from "./actions";
import { bulkSummary, canDraft, candidateStores, contractCell, filterCandidates, payslipCell } from "./payslip-draft";

// 「급여명세서 작성」 버튼과 그 팝업(데모 staff-sections.mjs pickId, 720px). 미리 고른 직원은 없다 — 점포 · 이름으로 좁혀 한 명을
// 고르고 「작성」하면 초안을 만들어 그 검토 화면으로 간다(WHALEERP-226). 근로계약이 없거나 이 달 명세서가 있는 직원은 고를 수 없다.
// 「이 달 일괄 작성」은 확인창을 거쳐 만들고 결과 한 줄을 띄운 뒤 목록을 다시 받는다. 확인창(ConfirmDialog)과 같은 네이티브
// <dialog> 다. 확인창은 이 <dialog> 밖에 둔다 — 안에 두면 확인창의 Esc(cancel)가 React 트리를 따라 이 팝업까지 닫는다.
// 작성 대상은 열 때마다 새로 받고(GET /payslips/candidates), 닫으면 고른 직원 · 좁히기 · 오류를 지운다.
export function PayslipDraftButton({ month, employmentTypeLabels }: { month: string; employmentTypeLabels: EnumValue[] }) {
  const router = useRouter();
  const toast = useToast();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PayslipCandidate[] | null>(null);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const [failure, setFailure] = useState<DraftFailure | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [loading, startLoading] = useTransition();
  const [busy, startBusy] = useTransition();
  // 닫았다 다시 열면 늦게 온 앞 요청이 새 목록을 덮지 않게 마지막 요청 번호만 받는다
  const requestNumber = useRef(0);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const show = () => {
    setOpen(true);
    const mine = ++requestNumber.current;
    startLoading(async () => {
      let result: Awaited<ReturnType<typeof getPayslipCandidatesAction>>;
      try {
        result = await getPayslipCandidatesAction(month);
      } catch (error) {
        unstable_rethrow(error); // redirect 같은 Next 제어 흐름은 그대로 넘긴다
        console.error("급여명세서 action 호출이 끊겼습니다", error);
        // 호출 자체가 끊겼다 — 조회라 결과 모름은 없고, 목록 전체를 오류 화면으로 덮지 않는다
        result = { ok: false, message: "작성 대상을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." };
      }
      if (mine !== requestNumber.current) return;
      if (!result.ok) return setFailure(result);
      setItems(result.data.items);
    });
  };
  const close = () => {
    if (busy) return;
    requestNumber.current++;
    setOpen(false);
    setItems(null);
    setStoreId(null);
    setName("");
    setPicked(null);
    setFailure(null);
  };

  const shown = filterCandidates(items ?? [], storeId, name);
  // 좁히기로 고른 줄이 사라지면 고른 것도 지운다(데모와 같다)
  const pickedShown = shown.some((c) => c.staffMemberId === picked) ? picked : null;
  const creatable = (items ?? []).filter(canDraft).length;

  const create = () => {
    if (pickedShown === null) return;
    setFailure(null);
    startBusy(async () => {
      // 성공하면 action 이 검토 화면으로 보낸다(redirect). 돌아온 것은 실패뿐이다.
      // 결과를 모르면(호출 자체가 끊긴 경우도) 이미 만들었을 수 있어 목록을 다시 받는다.
      try {
        const result = await createPayslip(pickedShown, month);
        setFailure(result);
        if (result.unknown) router.refresh();
      } catch (error) {
        unstable_rethrow(error); // redirect 같은 Next 제어 흐름은 그대로 넘긴다
        console.error("급여명세서 action 호출이 끊겼습니다", error);
        setFailure({ ok: false, unknown: true, message: "작성 결과를 확인하지 못했습니다. 목록을 새로 불러와 확인해 주세요." });
        router.refresh();
      }
    });
  };
  const createAll = () =>
    startBusy(async () => {
      let result: Awaited<ReturnType<typeof bulkCreatePayslips>>;
      try {
        result = await bulkCreatePayslips(month);
      } catch (error) {
        unstable_rethrow(error); // redirect 같은 Next 제어 흐름은 그대로 넘긴다
        console.error("급여명세서 action 호출이 끊겼습니다", error);
        result = { ok: false, unknown: true, message: "일괄 작성 결과를 확인하지 못했습니다. 목록을 새로 불러와 확인해 주세요." };
      }
      setConfirming(false);
      if (!result.ok) {
        setFailure(result);
        if (result.unknown) router.refresh();
        return;
      }
      toast(bulkSummary(result.result));
      close();
      router.refresh();
    });

  const columns: Column<PayslipCandidate>[] = [
    {
      header: "선택",
      width: "w-[60px]",
      cell: (c) => (
        <input
          type="radio"
          name={`${titleId}-staff`}
          aria-label={`${c.staffName} 선택`}
          disabled={!canDraft(c) || busy}
          checked={pickedShown === c.staffMemberId}
          onChange={() => setPicked(c.staffMemberId)}
          className="size-[18px] align-middle accent-erp-brand disabled:opacity-30"
        />
      ),
    },
    {
      header: "직원",
      cell: (c) => (
        <>
          {c.staffName}
          {canDraft(c) && !c.hasAttendance && <span className="ml-[4px] text-[13px] text-erp-off">출퇴근 누락</span>}
        </>
      ),
    },
    { header: "점포", cell: (c) => c.storeName },
    { header: "계약 유형", width: "w-[100px]", cell: (c) => labelOf(employmentTypeLabels, c.employmentType) },
    { header: "근로계약", width: "w-[100px]", cell: (c) => <CellView cell={contractCell(c)} /> },
    { header: "명세서", width: "w-[90px]", cell: (c) => <CellView cell={payslipCell(c)} /> },
  ];

  return (
    <>
      <Button onClick={show}>급여명세서 작성</Button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        // #ebebeb 팝업 테두리는 Figma 에 한 번만 나오는 색이라 토큰이 없다(DESIGN.md Popups).
        className="m-auto max-h-[calc(100dvh-48px)] w-[720px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-[2px] border border-[#ebebeb] bg-white p-[23px] text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40"
      >
        <h2 id={titleId} className="text-[18px] font-semibold">
          급여명세서 작성 <span className="text-[14px] font-normal text-erp-label">{monthLabel(month)}</span>
        </h2>
        <div className="mt-[12px] flex flex-col gap-[12px] text-[14px]" aria-busy={loading}>
          <p className="text-erp-label">근로계약이 있고 이 달 명세서가 없는 직원만 고를 수 있습니다.</p>
          <FormRow>
            <Field label="점포" width="w-[220px]">
              <Select
                aria-label="점포"
                value={storeId ?? ""}
                onChange={(e) => setStoreId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">전체 점포</option>
                {candidateStores(items ?? []).map((s) => (
                  <option key={s.storeId} value={s.storeId}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="직원">
              <SearchField value={name} onValueChange={setName} placeholder="이름" aria-label="직원" maxLength={50} />
            </Field>
          </FormRow>
          {failure && (
            <p role="alert" className="rounded-[2px] border border-erp-off-bg bg-erp-off-bg px-[16px] py-[12px] font-semibold text-erp-off">
              {failure.message}
              {failure.payslipId !== undefined && (
                <Link href={`/payslips/${failure.payslipId}`} className="ml-[8px] font-normal text-erp-link hover:underline">
                  작성된 명세서 보기
                </Link>
              )}
            </p>
          )}
          <div className="max-h-[322px] overflow-y-auto">
            <DataTable
              columns={columns}
              rows={shown}
              rowKey={(c) => c.staffMemberId}
              rowState={(c) => (c.staffMemberId === pickedShown ? "selected" : undefined)}
              empty={items === null ? (loading ? "불러오는 중입니다." : "작성 대상을 불러오지 못했습니다.") : "조건에 맞는 직원이 없습니다."}
            />
          </div>
        </div>
        <div className="mt-[24px] flex items-center gap-[6px]">
          <Button variant="soft" disabled={busy || creatable === 0} onClick={() => setConfirming(true)}>
            이 달 일괄 작성
          </Button>
          <span className="flex-1" />
          <Button variant="off" disabled={busy} onClick={close}>
            취소
          </Button>
          <Button disabled={busy || pickedShown === null} onClick={create}>
            작성
          </Button>
        </div>
      </dialog>
      <ConfirmDialog
        open={confirming}
        title={`${monthLabel(month)} 급여명세서 ${creatable}건을 작성하시겠습니까?`}
        confirmLabel="일괄 작성"
        busy={busy}
        onConfirm={createAll}
        onCancel={() => setConfirming(false)}
      >
        근로계약이 유효하고 아직 명세서가 없는 직원의 초안을 만듭니다. 이미 작성된 직원과 계약이 없는 직원은 건너뜁니다.
      </ConfirmDialog>
    </>
  );
}
