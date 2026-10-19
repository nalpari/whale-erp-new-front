"use client";

import { Button, PageBar } from "@/components/common";

// 목록을 불러오지 못했을 때(api 가 꺼짐 · 토큰 만료 401 · 권한 없음 403 등). 헤더는 layout 이 그대로 둔다.
// 운영 빌드에서는 서버 오류 문구가 가려져 오므로 개발 서버에서만 원인을 함께 보이고, 서버 로그와 맞춰 볼 오류 번호를 남긴다.
export default function PlatformAdminsError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <>
      <PageBar title="플랫폼 관리자 관리" />
      <div className="flex min-h-0 flex-1 p-[24px]">
        <section className="flex flex-1 flex-col items-center justify-center gap-[12px] rounded-[4px] border border-erp-panel-line bg-white p-[25px] text-[14px]">
          <p className="font-medium text-erp-ink">플랫폼 관리자 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
          {process.env.NODE_ENV === "development" ? (
            <p className="text-erp-muted">{error.message}</p>
          ) : (
            error.digest && <p className="text-erp-muted">오류 번호 {error.digest}</p>
          )}
          <Button variant="off" onClick={retry}>
            다시 시도
          </Button>
        </section>
      </div>
    </>
  );
}
