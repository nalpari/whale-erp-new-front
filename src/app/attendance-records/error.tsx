"use client";

import { Button } from "@/components/common";
import { useCurrentBp } from "@/components/site/session-gate";
import { bpPath } from "@/lib/bp-path";

// 출·퇴근 현황 조회가 받지 못한 오류 — api 가 꺼짐 · 토큰 만료 401 · 권한 없음 403 등. 업무 범위 밖 점포(404)는 화면이 먼저 받는다(notFound).
// 운영 빌드에서는 서버 오류 문구가 가려져 오므로 개발 서버에서만 원인을 함께 보이고, 서버 로그와 맞춰 볼 오류 번호를 남긴다.
export default function AttendanceRecordsError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const bp = useCurrentBp().bpCodeId;
  return (
    <div role="alert" className="flex min-h-[100dvh] flex-col items-center justify-center gap-[12px] bg-erp-thead-bg p-[24px] text-center text-[14px]">
      <p className="text-[16px] font-semibold text-erp-ink">출·퇴근 현황을 불러오지 못했습니다.</p>
      <p className="text-erp-label">잠시 뒤 다시 시도해 주세요. 계속되면 관리자에게 알려 주세요.</p>
      {process.env.NODE_ENV === "development" ? (
        <p className="text-erp-muted">{error.message}</p>
      ) : (
        error.digest && <p className="text-erp-muted">오류 번호 {error.digest}</p>
      )}
      <div className="flex gap-[6px]">
        <Button variant="soft" onClick={retry}>
          다시 시도
        </Button>
        <Button variant="off" href={bpPath(bp, "/attendance-records")}>
          처음으로
        </Button>
      </div>
    </div>
  );
}
