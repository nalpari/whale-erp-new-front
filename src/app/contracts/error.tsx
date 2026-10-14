"use client";

import { Button } from "@/components/common";

// 근로계약 화면(목록 · 상세 · 작성 · 이어 쓰기)이 받지 못한 오류. api 가 400 · 500 이거나 닿지 않으면 Next 기본
// 오류 화면 대신 여기를 보인다. 401 · 403 · 404 는 각 화면이 먼저 받아 안내를 그린다.
export default function ContractsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="flex min-h-[100dvh] flex-col items-center justify-center gap-[12px] bg-erp-thead-bg p-[24px] text-center">
      <p className="text-[16px] font-semibold text-erp-ink">근로계약 정보를 불러오지 못했습니다</p>
      <p className="text-[14px] text-erp-label">잠시 뒤 다시 시도해 주세요. 계속되면 관리자에게 알려 주세요.</p>
      <div className="flex gap-[6px]">
        <Button variant="soft" onClick={reset}>
          다시 시도
        </Button>
        <Button variant="off" href="/contracts">
          목록으로
        </Button>
      </div>
    </div>
  );
}
