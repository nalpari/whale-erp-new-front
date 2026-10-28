"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button, DetailTable, Tag } from "@/components/common";
import type { BpMasterDetail } from "@/lib/bp-masters";
import { formatDateTime } from "@/lib/format";

// 탈퇴 사유 팝업(WHALEERP-626). 탈퇴 BP 는 변경 이력을 보이지 않으므로(예전 개인정보가 이력에 남는다, api 409) 탈퇴 사유는 여기서 본다.
// 상세 응답의 withdrawal 로 그린다 — 따로 조회하지 않는다. 변경 이력 팝업(history-dialog.tsx)과 같은 네이티브 <dialog> 다.
// 머리는 상호명 + BP 코드 꼬리표, 아이디 · 탈퇴 일시 · 사유는 상세와 같은 DetailTable, 직접 입력한 긴 글은 표 밖 읽기 전용 상자에 둔다.

type Withdrawal = NonNullable<BpMasterDetail["withdrawal"]>;

/** 상세 상태 줄의 [사유 보기] 버튼과 그 팝업 */
export function WithdrawalButton({
  bp,
  withdrawal,
  panelOpen,
}: {
  bp: Pick<BpMasterDetail, "tradeName" | "bpCode" | "loginId">;
  withdrawal: Withdrawal;
  /** 감싼 상세 패널이 열려 있는가 — 닫히면 팝업도 닫는다 */
  panelOpen: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  // <dialog> 는 최상위 레이어라 패널이 클릭 아닌 길로 닫혀도 혼자 남는다 — 함께 닫는다(HistoryButton 과 같다)
  if (!panelOpen && open) setOpen(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const onClose = () => setOpen(false);

  return (
    <>
      <Button variant="soft" onClick={() => setOpen(true)}>
        사유 보기
      </Button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onCancel={(e) => {
          e.preventDefault();
          onClose();
        }}
        // #ebebeb 팝업 테두리는 Figma 에 한 번만 나오는 색이라 토큰이 없다(DESIGN.md Popups).
        className="m-auto w-[520px] max-w-[calc(100vw-32px)] rounded-[2px] border border-[#ebebeb] bg-white p-[23px] text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40"
      >
        <h2 id={titleId} className="text-[18px] font-semibold">
          탈퇴 사유
        </h2>
        <p className="mt-[18px] flex flex-wrap items-center gap-[6px] text-[15px] font-semibold">
          <span>{bp.tradeName}</span>
          <Tag>{bp.bpCode}</Tag>
        </p>
        <div className="mt-[18px]">
          <DetailTable
            rows={[
              { label: "아이디", value: bp.loginId },
              { label: "탈퇴 일시", value: formatDateTime(withdrawal.withdrawnAt) || "-" },
              { label: "탈퇴 사유", value: withdrawal.reasonLabel ?? "-" },
            ]}
          />
        </div>
        {withdrawal.reasonDetail && (
          <div className="mt-[18px] flex flex-col gap-[6px]">
            <p className="text-[14px] font-medium">직접 입력한 사유</p>
            {/* 최대 500자 — 줄바꿈을 살리고 길면 상자 안에서만 스크롤한다 */}
            <p
              className="max-h-[200px] overflow-y-auto rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[16px] py-[12px] text-[14px] leading-[1.6] break-words whitespace-pre-wrap"
            >
              {withdrawal.reasonDetail}
            </p>
          </div>
        )}
        <div className="mt-[24px] flex justify-end">
          <Button variant="off" onClick={onClose}>
            닫기
          </Button>
        </div>
      </dialog>
    </>
  );
}
