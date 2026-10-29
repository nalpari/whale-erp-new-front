"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, DetailTable } from "@/components/common";
import type { components } from "@/lib/api-types.generated";
import { loginPathOf } from "@/lib/auth-routes";
import { bff, BffError } from "@/lib/bff";
import { formatDateTime } from "@/lib/format";
import { NoticeBand } from "../../stores/store-parts";
import { type Failure, failureOf, remainingOf } from "../excel-download-model";

type ExcelDownloadLink = components["schemas"]["ExcelDownloadLinkResponseDto"];
type View =
  | { kind: "loading" }
  | { kind: "ready"; fileName: string; expiresAt: string }
  | ({ kind: "failed" } & Failure);

/**
 * S3 주소를 숨은 iframe 에서 연다. S3 가 첨부(Content-Disposition attachment)로 주면 파일만 받고, 오류(서명 만료 · 객체 없음)면
 * XML 오류 페이지가 보이지 않는 iframe 안에 갇힌다 — 탭을 S3 로 옮기면(location.assign) 이 화면과 [다시 받기]가 사라졌다.
 * 받기마다 iframe 을 새로 둔다(앞의 것은 지운다).
 */
function fetchInFrame(url: string) {
  document.querySelectorAll("iframe[data-excel-download]").forEach((frame) => frame.remove());
  const frame = document.createElement("iframe");
  frame.hidden = true;
  frame.dataset.excelDownload = "";
  frame.src = url;
  document.body.append(frame);
}

/**
 * 들어오면 바로 내려받고, [다시 받기]로 또 받는다. 받을 때마다 api(BFF /api/excel-downloads/{id})에서 새 주소를 받는다 —
 * 주소는 5분짜리 S3 서명 주소라 저장해 두면 다시 받을 때 끊긴다. 파일 이름 · 기한은 마지막으로 받은 응답의 것이다.
 */
export function ExcelDownloadView({ id }: { id: number | null }) {
  const [view, setView] = useState<View>(id === null ? { kind: "failed", ...failureOf(404, "") } : { kind: "loading" });
  const router = useRouter();
  const [pending, setPending] = useState(false);
  // 남은 기한을 1분마다 다시 그린다
  const [now, setNow] = useState(() => Date.now());
  // 개발 모드(StrictMode)는 effect 를 두 번 돌린다 — 들어올 때 두 번 받지 않게 한다
  const started = useRef(false);

  const download = async () => {
    if (id === null) return;
    setPending(true);
    try {
      const link = await bff<ExcelDownloadLink>(`/excel-downloads/${id}`);
      setView({ kind: "ready", fileName: link.fileName, expiresAt: link.expiresAt });
      setNow(Date.now());
      fetchInFrame(link.url);
    } catch (error) {
      const status = error instanceof BffError ? error.status : 0;
      // 세션이 끝났다 — 로그인한 뒤 이 화면으로 돌아오게 한다
      if (status === 401) return router.replace(loginPathOf(`/excel-downloads/${id}`));
      if (!(error instanceof BffError)) console.error("엑셀 내려받기 주소 받기 실패", error);
      setView({ kind: "failed", ...failureOf(status, error instanceof Error ? error.message : "") });
    } finally {
      setPending(false);
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // 들어오자마자 한 번 받는다(메일 링크의 할 일)
    void download();
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  if (view.kind === "loading") return <p className="py-[80px] text-center text-[14px] text-erp-muted">파일을 준비하는 중입니다.</p>;

  if (view.kind === "failed") {
    return (
      <div className="flex flex-col items-center gap-[18px] py-[80px]">
        <NoticeBand tone={view.tone} title={view.title} detail={view.detail} />
        {view.retry && (
          <Button onClick={download} disabled={pending}>
            {pending ? "받는 중" : "다시 받기"}
          </Button>
        )}
      </div>
    );
  }

  const remaining = remainingOf(view.expiresAt, now);
  return (
    <div className="flex max-w-[640px] flex-col gap-[18px]">
      <p className="text-[14px] leading-[1.6] text-erp-ink">내려받기가 시작되지 않으면 [다시 받기]를 눌러 주세요.</p>
      <DetailTable
        title="엑셀 파일"
        rows={[
          { label: "파일 이름", value: view.fileName },
          {
            label: "내려받기 기한",
            value: (
              <>
                {formatDateTime(view.expiresAt)}
                <span className="text-erp-label"> · {remaining ?? "기한이 지났습니다."}</span>
              </>
            ),
          },
        ]}
      />
      <p className="text-[13px] leading-[1.6] text-erp-label">기한이 지나면 받을 수 없습니다. 목록에서 다시 요청해 주세요.</p>
      <div className="flex justify-end">
        <Button onClick={download} disabled={pending}>
          {pending ? "받는 중" : "다시 받기"}
        </Button>
      </div>
    </div>
  );
}
