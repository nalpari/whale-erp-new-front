"use client";

import { Button, PageBar } from "@/components/common";
import { useCurrentBp } from "@/components/site/session-gate";
import { bpPath } from "@/lib/bp-path";

// 점포 화면(목록 · 상세 · 등록 · 수정)이 받지 못한 오류 — api 가 꺼짐 · 토큰 만료 401 · 검증 실패 400(주소 · 계약 결함) · 라우트 없는 404 등.
// api 의 거절(BP 를 고르지 않음 400 · 403 · 없는 BP 404)과 점포 404 는 각 화면이 먼저 받는다(StoreDenied · notFound).
// 헤더는 공통 틀(AdminFrame)이 그대로 두므로 여기는 제목 줄과 본문만 그린다 — 100dvh 를 다시 잡지 않는다(DESIGN.md 「한 화면 규칙」).
// 운영 빌드에서는 서버 오류 문구가 가려져 오므로 개발 서버에서만 원인을 함께 보이고, 서버 로그와 맞춰 볼 오류 번호를 남긴다.
export default function StoresError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const bp = useCurrentBp().bpCodeId;
  return (
    <>
      <PageBar title="점포 정보 관리" />
      <div className="flex min-h-0 flex-1 p-[24px]">
        <section
          role="alert"
          className="flex flex-1 flex-col items-center justify-center gap-[12px] rounded-[4px] border border-erp-panel-line bg-white p-[25px] text-center text-[14px]"
        >
          <p className="text-[16px] font-semibold text-erp-ink">점포 정보를 불러오지 못했습니다</p>
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
            <Button variant="off" href={bpPath(bp, "/stores")}>
              목록으로
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
