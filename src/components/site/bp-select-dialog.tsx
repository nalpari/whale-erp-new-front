"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog, DataTable, Pagination, Radio, SearchField, type Column } from "@/components/common";
import { bff, BffError } from "@/lib/bff";
import { writeSelectedBp } from "@/lib/browser-storage";
import { BP_SWITCH_PATH } from "@/lib/menus";
import { useCodeLabel } from "./code-label";
import { useCurrentBp, useLoginKey } from "./session-gate";

/** GET /bp-codes 의 items — 플랫폼 계정이 고를 고객 BP(사용 · 미사용 · 탈퇴, 삭제 · 플랫폼 BP 제외). */
interface BpOption {
  bpCodeId: number;
  bpCode: string;
  tradeName: string;
  accountStatusCode: string;
}

const PAGE_SIZE = 10;

/**
 * 웨일ERP 바로가기의 BP 선택 팝업(플랫폼 계정). 상호 · BP코드로 찾아 한 줄을 고르고 [이동]하면, 마지막으로 고른 BP(selected-bp)에 적고
 * 새 탭으로 BP 이동 화면(/bp-switch)을 연다 — 그 탭이 고른 BP 의 점포 · 공통코드로 준비된 뒤 웨일ERP 홈으로 간다. 지금 탭은 그대로다.
 */
export function BpSelectDialog({ onClose }: { onClose: () => void }) {
  const loginKey = useLoginKey();
  const currentBp = useCurrentBp();
  const statusLabel = useCodeLabel("ACCOUNT_STATUS");
  const [query, setQuery] = useState({ keyword: "", page: 1 });
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState<{ items: BpOption[]; total: number } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [picked, setPicked] = useState<BpOption | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(query.page), pageSize: String(PAGE_SIZE) });
    if (query.keyword) params.set("keyword", query.keyword);
    bff<{ items: BpOption[]; total: number }>(`/bp-codes?${params}`).then(
      (r) => {
        if (cancelled) return;
        setResult(r);
        setFailure(null);
      },
      (e: unknown) => {
        if (cancelled) return;
        console.error("BP 목록 조회 실패", e);
        setResult(null);
        setFailure(e instanceof BffError ? e.message : "BP 목록을 불러오지 못했습니다");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [query]);

  const handleMove = () => {
    if (!picked) return;
    writeSelectedBp(loginKey, picked);
    // noopener — 새 탭이 이 탭의 sessionStorage(서비스 · BP)를 물려받지 않고 BP 이동 화면에서 새로 준비한다.
    window.open(`${BP_SWITCH_PATH}?bp=${picked.bpCodeId}`, "_blank", "noopener");
    onClose();
  };

  const columns: Column<BpOption>[] = [
    { header: "BP코드", width: "w-[110px]", cell: (r) => r.bpCode },
    // 줄을 눌러도 고르지만, 키보드로도 고를 수 있게 상호 칸을 라디오로 둔다.
    {
      header: "상호",
      align: "left",
      cell: (r) => (
        <Radio
          name="bp"
          label={r.bpCodeId === currentBp.bpCodeId ? `${r.tradeName} (현재)` : r.tradeName}
          checked={r.bpCodeId === picked?.bpCodeId}
          onChange={() => setPicked(r)}
        />
      ),
    },
    { header: "상태", width: "w-[80px]", cell: (r) => statusLabel(r.accountStatusCode) },
  ];
  const totalPages = result ? Math.ceil(result.total / PAGE_SIZE) : 0;

  return (
    <ConfirmDialog open wide title="BP 선택" confirmLabel="이동" confirmDisabled={!picked} onConfirm={handleMove} onCancel={onClose}>
      <div className="flex flex-col gap-[12px]">
        <p>고른 BP 의 웨일ERP 가 새 탭으로 열립니다.</p>
        <SearchField
          value={keyword}
          onValueChange={setKeyword}
          onSearch={(v) => {
            setPicked(null);
            setQuery({ keyword: v.trim(), page: 1 });
          }}
          placeholder="상호 또는 BP코드"
          aria-label="BP 찾기"
          maxLength={50}
        />
        {failure ? (
          <p role="alert" className="text-erp-off">
            {failure}
          </p>
        ) : !result ? (
          <p className="text-erp-muted">불러오는 중입니다.</p>
        ) : (
          <>
            <div className="max-h-[506px] overflow-y-auto">
              <DataTable
                columns={columns}
                rows={result.items}
                rowKey={(r) => r.bpCodeId}
                rowState={(r) => (r.bpCodeId === picked?.bpCodeId ? "selected" : undefined)}
                rowProps={(r) => ({ onClick: () => setPicked(r) })}
              />
            </div>
            <Pagination page={query.page} totalPages={totalPages} maxPages={5} onPageChange={(page) => setQuery({ ...query, page })} />
          </>
        )}
      </div>
    </ConfirmDialog>
  );
}
