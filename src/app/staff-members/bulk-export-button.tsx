"use client";

import { Button } from "@/components/common";
import { useAccount } from "@/components/site/session-gate";
import { canBulkExport } from "./export/bulk-export-model";

// 직원 목록 도구 줄의 [일괄 저장](WHALEERP-337). BP 마스터 · 가맹마스터에게만 보인다 — 막는 것은 api 다(403).
export function BulkExportButton() {
  if (!canBulkExport(useAccount().roleTypeCode)) return null;
  return (
    <Button variant="soft" href="/staff-members/export">
      일괄 저장
    </Button>
  );
}
