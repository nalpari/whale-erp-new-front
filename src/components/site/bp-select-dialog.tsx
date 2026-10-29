"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog, DataTable, Pagination, Radio, SearchField, Select, type Column } from "@/components/common";
import { bff, BffError } from "@/lib/bff";
import { bpSwitchUrl } from "@/lib/menus";
import type { BpOption } from "@/lib/session";
import { useCodeLabel } from "./code-label";
import { useCurrentBp } from "./session-gate";

// 한 쪽 건수 — 목록 화면과 같은 20 · 50 · 100, 처음은 20(2026-10-29 사용자 지정 — 전엔 10 고정)
const PAGE_SIZES = [20, 50, 100] as const;

/**
 * 웨일ERP 바로가기의 BP 선택 팝업(플랫폼 계정). 상호 · BP코드로 찾아 한 줄을 고르고 [이동]하면 새 탭으로 BP 이동 화면(/bp-switch)을
 * 연다 — 고른 BP 의 id 와 코드를 주소에 싣고, 그 탭이 서버에서 그 BP 를 확인해 점포 · 공통코드로 준비한 뒤 웨일ERP 홈으로 간다. 지금 탭은 그대로다.
 */
export function BpSelectDialog({ onClose }: { onClose: () => void }) {
  const currentBp = useCurrentBp();
  const statusLabel = useCodeLabel("ACCOUNT_STATUS");
  const [query, setQuery] = useState({ keyword: "", page: 1, pageSize: 20 as number });
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState<{ items: BpOption[]; total: number } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [picked, setPicked] = useState<BpOption | null>(null);

  useEffect(() => {
    let cancelled = false;
    // withMaster — BP 마스터 계정이 있는 BP 만(BP 마스터 계정 목록과 같은 건수, 2026-10-29). 탭 BP 찾기 · 상태 확인은 이 조건 없이 부른다
    const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize), withMaster: "true" });
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
    // noopener — 새 탭이 이 탭의 sessionStorage(서비스 · BP)를 물려받지 않고 BP 이동 화면에서 새로 준비한다.
    window.open(bpSwitchUrl(picked.bpCodeId, picked.bpCode), "_blank", "noopener");
    onClose();
  };

  // 미사용 · 탈퇴 BP 는 BP코드 · 상호명 · 계정상태를 회색으로(2026-10-29 사용자 지정). 사용 BP 상호명은 굵게(아래)
  const muted = (r: BpOption) => (r.accountStatusCode === "ACTIVE" ? undefined : "text-erp-muted");
  const columns: Column<BpOption>[] = [
    { header: "BP코드", width: "w-[110px]", cell: (r) => <span className={muted(r)}>{r.bpCode}</span> },
    // 줄을 눌러도 고르지만, 키보드로도 고를 수 있게 상호 칸을 라디오로 둔다.
    {
      header: "상호명",
      align: "left",
      // 사용 BP 상호명은 굵게, 미사용 · 탈퇴는 보통 굵기 · 회색(2026-10-29 사용자 지정). Radio 는 className 을 받지 않아 감싸는 칸에서
      // 굵기를 물려주고, 글자색은 Radio 라벨이 먹색으로 고정이라 감싸는 칸에서 라벨을 골라 덮는다
      cell: (r) => (
        <div className={r.accountStatusCode === "ACTIVE" ? "font-semibold" : "[&_label]:text-erp-muted"}>
          <Radio
            name="bp"
            label={r.bpCodeId === currentBp.bpCodeId ? `${r.tradeName} (현재)` : r.tradeName}
            checked={r.bpCodeId === picked?.bpCodeId}
            onChange={() => setPicked(r)}
          />
        </div>
      ),
    },
    { header: "계정상태", width: "w-[80px]", cell: (r) => <span className={muted(r)}>{statusLabel(r.accountStatusCode)}</span> },
  ];
  const totalPages = result ? Math.ceil(result.total / query.pageSize) : 0;

  return (
    <ConfirmDialog open wide title="BP 선택" confirmLabel="이동" confirmDisabled={!picked} onConfirm={handleMove} onCancel={onClose}>
      <div className="flex flex-col gap-[12px]">
        <p>BP를 선택하면 웨일ERP가 새 탭으로 열립니다.</p>
        {/* 「총 N 건」 · 찾기 칸 · 한 쪽 건수를 한 줄에(2026-10-29 사용자 지정). 건수를 바꾸면 1쪽부터, 고른 줄은 비운다(검색과 같다) */}
        <div className="flex items-center gap-[6px]">
          <p className="mr-[6px] shrink-0 text-[14px] text-erp-ink">
            총 <b className="font-semibold">{result ? result.total.toLocaleString("ko-KR") : "–"}</b> 건
          </p>
          <div className="min-w-0 flex-1">
            <SearchField
              value={keyword}
              onValueChange={setKeyword}
              onSearch={(v) => {
                setPicked(null);
                setQuery((q) => ({ ...q, keyword: v.trim(), page: 1 }));
              }}
              // X 로 지우면 바로 전체 목록으로 다시 찾는다(2026-10-29 사용자 지정)
              onClear={() => {
                setPicked(null);
                setQuery((q) => ({ ...q, keyword: "", page: 1 }));
              }}
              placeholder="상호명 또는 BP코드"
              aria-label="BP 찾기"
              maxLength={50}
            />
          </div>
          <div className="w-[80px] shrink-0">
            <Select
              aria-label="페이지당 건수"
              value={String(query.pageSize)}
              onChange={(e) => {
                setPicked(null);
                setQuery((q) => ({ ...q, pageSize: Number(e.target.value), page: 1 }));
              }}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {/* 결과 자리는 높이를 고정한다 — 불러오는 동안 · 받은 뒤 · 건수가 적을 때 팝업 크기가 바뀌지 않게(2026-10-29 사용자 지적, 작았다가 커졌다) */}
        {failure ? (
          <>
            <p role="alert" className="flex h-[506px] items-center justify-center text-erp-off">
              {failure}
            </p>
            <div aria-hidden className="h-[34px]" />
          </>
        ) : !result ? (
          <>
            <p className="flex h-[506px] items-center justify-center text-erp-muted">불러오는 중입니다.</p>
            {/* 쪽 번호 줄 자리도 미리 비워 둔다 */}
            <div aria-hidden className="h-[34px]" />
          </>
        ) : (
          <>
            {/* 열 이름 줄은 고정하고 그 아래 줄만 스크롤(DataTable scroll, 2026-10-29 사용자 지정) */}
            <div className="flex h-[506px] flex-col">
              <DataTable
                columns={columns}
                rows={result.items}
                rowKey={(r) => r.bpCodeId}
                rowState={(r) => (r.bpCodeId === picked?.bpCodeId ? "selected" : undefined)}
                rowProps={(r) => ({ onClick: () => setPicked(r) })}
                scroll
              />
            </div>
            <Pagination page={query.page} totalPages={totalPages} maxPages={5} onPageChange={(page) => {
                // 고른 줄이 보이지 않는 쪽에서 [이동]하지 않게, 검색할 때처럼 고른 것을 비운다.
                setPicked(null);
                setQuery({ ...query, page });
              }}
            />
          </>
        )}
      </div>
    </ConfirmDialog>
  );
}
