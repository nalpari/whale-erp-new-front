"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";
import { Badge, Button, DataTable, DetailTable, FailedBand, NoticeBand, Pagination, useAction, useToast, type Column } from "@/components/common";
import { PendingNotice } from "@/components/site/code-editor/code-panel";
import { useAccount, useCurrentBp, useScope, useStores } from "@/components/site/session-gate";
import { loginPathOf } from "@/lib/auth-routes";
import { bff, BffError } from "@/lib/bff";
import { formatDateTime } from "@/lib/format";
import { getBulkExportLink, requestBulkExport } from "./actions";
import {
  bulkExportViewOf,
  canBulkExport,
  hasMaking,
  isScopeMaking,
  previewPathOf,
  requestBlockOf,
  scopeTextOf,
  storeIdsOfScope,
  type BulkExport,
  type BulkExportList,
  type BulkExportPreview,
} from "./bulk-export-model";

// 직원 자료 일괄 저장 화면 본문(WHALEERP-337). 배치는 목업 7:5 — 왼쪽 담기는 자료 · 지난 요청, 오른쪽 새로 요청 · 보관 책임.
// 업무 범위는 헤더 범위(useScope)를 점포 id 로 바꿔 쓰고(storeIdsOfScope), 바뀌면 대상 직원 수를 다시 읽는다.
// 만드는 중인 요청이 있으면 10초마다 지난 요청과 미리 보기를 다시 읽는다 — 다 만들어도 운영 알림은 보내지 않는다(운영 정책 NTF-01).

const PAGE_SIZE = 20;
const POLL_MS = 10_000;

// version 은 그 값을 부른 때의 다시 읽기 횟수 — 요청 직후 앞 값으로 버튼이 잠깐 다시 켜지지 않게 가른다
type Loaded<T> = { key: string; version: number; data: T } | { key: string; version: number; error: string };

export function ExportScreen() {
  const { roleTypeCode } = useAccount();
  if (!canBulkExport(roleTypeCode))
    return (
      <div className="p-[24px]">
        <NoticeBand tone="info" title="일괄 저장은 BP 마스터와 가맹마스터만 쓸 수 있습니다." />
      </div>
    );
  return <ExportBody />;
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[12px] rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
      <h2 className="text-[18px] font-semibold text-erp-ink">{title}</h2>
      {children}
    </section>
  );
}

const Note = ({ children }: { children: ReactNode }) => <p className="text-[13px] leading-[1.6] text-erp-label">{children}</p>;

const CONTENTS = [
  { name: "근로계약서", what: "체결 완료본과 종이 계약 날인본, 전체 목록", format: "PDF · CSV" },
  { name: "출퇴근 기록", what: "기록 시각과 보정 · 대신 등록 이력", format: "CSV" },
  { name: "급여명세서", what: "발송 완료된 급여명세서와 전체 목록", format: "PDF · CSV" },
  { name: "근무스케줄", what: "등록된 근무스케줄 전체", format: "CSV" },
];
const CONTENT_COLUMNS: Column<(typeof CONTENTS)[number]>[] = [
  { header: "자료", width: "w-[120px]", cell: (r) => r.name },
  { header: "담기는 것", align: "left", cell: (r) => r.what },
  { header: "형식", width: "w-[110px]", cell: (r) => r.format },
];

function ExportBody() {
  const router = useRouter();
  const toast = useToast();
  const bp = useCurrentBp();
  const stores = useStores();
  const [scope] = useScope();
  const storeIds = storeIdsOfScope(scope, stores);
  const previewPath = previewPathOf(storeIds);
  const [page, setPage] = useState(1);
  const listPath = `/staff-members/bulk-exports?page=${page}&pageSize=${PAGE_SIZE}`;
  // 요청 · 내려받기 뒤와 만드는 중 폴링마다 늘려 미리 보기 · 지난 요청을 다시 읽는다. 다시 읽는 동안은 앞 값을 그대로 보인다
  const [version, setVersion] = useState(0);
  // 요청을 기다리는 동안 폴링이 version 을 올릴 수 있어, 요청 뒤 기준은 누른 때가 아니라 지금 값으로 잡는다
  const versionRef = useRef(0);
  useEffect(() => {
    versionRef.current = version;
  }, [version]);
  const reload = () => setVersion((v) => v + 1);
  const [preview, setPreview] = useState<Loaded<BulkExportPreview> | null>(null);
  const [list, setList] = useState<Loaded<BulkExportList> | null>(null);
  const [error, setError] = useState("");
  // 요청이 만들어졌을 수 있으면(성공 · 결과 모름) 이 횟수 이후에 받은 미리 보기 · 지난 요청으로만 요청 버튼을 다시 켠다
  const [freshFrom, setFreshFrom] = useState(0);
  const request = useAction(requestBulkExport, { text: "요청중입니다." });
  const fetchLink = useAction(getBulkExportLink, { text: "파일을 준비하는 중입니다." });

  const toLogin = () => router.replace(loginPathOf(location.pathname));
  // 세션이 끝났으면 로그인한 뒤 이 화면으로 돌아오게 한다. 그 밖에는 영역 안에 보일 문장
  const loadFailed = useEffectEvent((e: unknown, what: string): string | null => {
    if (e instanceof BffError && e.status === 401) {
      toLogin();
      return null;
    }
    console.error(`직원 자료 일괄 저장 ${what} 조회 실패`, e);
    return e instanceof BffError ? e.message : "잠시 뒤 다시 불러와 주세요.";
  });

  useEffect(() => {
    let cancelled = false;
    bff<BulkExportPreview>(previewPath).then(
      (data) => !cancelled && setPreview({ key: previewPath, version, data }),
      (e: unknown) => {
        const message = cancelled ? null : loadFailed(e, "미리 보기");
        if (message !== null) setPreview({ key: previewPath, version, error: message });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [previewPath, version]);

  useEffect(() => {
    let cancelled = false;
    bff<BulkExportList>(listPath).then(
      (data) => !cancelled && setList({ key: listPath, version, data }),
      (e: unknown) => {
        const message = cancelled ? null : loadFailed(e, "지난 요청");
        if (message !== null) setList({ key: listPath, version, error: message });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [listPath, version]);

  // 범위 · 쪽을 바꾼 직후에는 앞 범위 · 쪽의 값을 보이지 않는다
  const shownPreview = preview?.key === previewPath ? preview : null;
  const shownList = list?.key === listPath ? list : null;
  const items = shownList !== null && "data" in shownList ? shownList.data.items : [];
  const previewData = shownPreview !== null && "data" in shownPreview ? shownPreview.data : null;
  const making = hasMaking(items) || previewData?.inProgress === true;

  // 받을 때마다 다음 10초를 다시 건다 — 앞 응답 전에 겹쳐 부르지 않는다
  useEffect(() => {
    if (!making) return;
    const timer = setTimeout(() => setVersion((v) => v + 1), POLL_MS);
    return () => clearTimeout(timer);
  }, [making, list, preview]);

  const block = previewData ? requestBlockOf(previewData) : null;
  const canRequest = previewData !== null && shownPreview !== null && shownPreview.version >= freshFrom && block === null;
  // 줄의 [다시 요청]은 지금 범위의 미리 보기와 상관없이, 같은 범위를 만드는 중인 줄이 없을 때 켠다(막는 것은 api 409)
  const listFresh = shownList !== null && shownList.version >= freshFrom;

  const handleRequest = async (scopeIds: number[]) => {
    setError("");
    const result = await request(scopeIds).catch((e: unknown) => {
      // 서버 액션 호출 자체가 끊겼다 — api 는 이미 받았을 수 있어 지난 요청을 다시 읽어 보인다
      console.error("직원 자료 일괄 저장 요청 호출이 끊김", e);
      return { ok: false as const, status: undefined, message: "요청 결과를 확인하지 못했습니다. 지난 요청 표에서 확인해 주세요." };
    });
    if (!result.ok && result.status === 401) return toLogin();
    if (result.ok || result.status === undefined) setFreshFrom(versionRef.current + 1);
    if (result.ok) toast("일괄 저장을 요청했습니다.");
    else setError(result.message);
    setPage(1);
    reload();
  };

  const handleDownload = async (bulkExportId: number) => {
    setError("");
    const result = await fetchLink(bulkExportId).catch((e: unknown) => {
      console.error("직원 자료 일괄 저장 내려받기 호출이 끊김", bulkExportId, e);
      return { ok: false as const, status: undefined, message: "파일 주소를 받지 못했습니다. 잠시 뒤 다시 눌러 주세요." };
    });
    if (result.ok) return location.assign(result.link.url);
    if (result.status === 401) return toLogin();
    setError(result.message);
    // 기한이 지났거나 지워졌을 수 있다 — 표를 새로 읽어 지금 상태를 보인다
    reload();
  };

  const columns: Column<BulkExport>[] = [
    { header: "요청 일시", width: "w-[150px]", cell: (r) => formatDateTime(r.requestedAt) },
    { header: "요청자", cell: (r) => r.requesterName },
    { header: "대상 직원 수", width: "w-[110px]", cell: (r) => `${r.staffCount.toLocaleString("ko-KR")}명` },
    { header: "상태", align: "left", cell: (r) => <StatusCell item={r} /> },
    {
      header: "동작",
      width: "w-[124px]",
      cell: (r) => {
        const view = bulkExportViewOf(r);
        if (view.kind === "ready")
          return (
            <Button variant="soft" onClick={() => handleDownload(r.bulkExportId)}>
              내려받기
            </Button>
          );
        if (view.kind === "failed")
          return (
            <Button variant="soft" onClick={() => handleRequest(r.storeIds)} disabled={!listFresh || isScopeMaking(items, r.storeIds)}>
              다시 요청
            </Button>
          );
        return <span className="text-erp-muted">-</span>;
      },
    },
  ];

  const total = shownList && "data" in shownList ? shownList.data.total : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto p-[24px]">
      <PendingNotice message="BP 가 탈퇴하면 관리자 계정이 모두 미사용이 되어 자료를 볼 수 없습니다. 탈퇴한 뒤에는 보존 기간이 남아 있어도 이 화면이 열리지 않으니, 필요한 자료는 탈퇴 전에 받아 두세요. 평소에도 언제든 받을 수 있습니다." />
      {error && <FailedBand message={error} />}
      <div className="grid grid-cols-[7fr_5fr] items-start gap-[18px]">
        <div className="flex min-w-0 flex-col gap-[18px]">
          <Card title="담기는 자료">
            <DataTable columns={CONTENT_COLUMNS} rows={CONTENTS} rowKey={(r) => r.name} />
            <Note>주민등록번호 · 신고 정보 · 확인자료 · 동의 기록은 담지 않습니다.</Note>
          </Card>
          <Card title="지난 요청">
            {shownList && "error" in shownList ? (
              <div className="flex flex-col items-start gap-[12px]">
                <FailedBand message={shownList.error} />
                <Button variant="soft" onClick={reload}>
                  다시 시도
                </Button>
              </div>
            ) : (
              <DataTable
                columns={columns}
                rows={items}
                rowKey={(r) => r.bulkExportId}
                empty={shownList ? "지난 요청이 없습니다." : "불러오는 중입니다."}
              />
            )}
            {total > PAGE_SIZE && (
              <div className="pt-[2px]">
                <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} />
              </div>
            )}
            <Note>기한이 지나면 파일을 지우므로 다시 요청해야 합니다.</Note>
          </Card>
        </div>
        <div className="flex min-w-0 flex-col gap-[18px]">
          <Card title="새로 요청">
            <DetailTable
              rows={[
                {
                  label: "업무 범위",
                  value: (
                    <span className="min-w-0 truncate">
                      {`${bp.tradeName} · ${scopeTextOf(scope, stores)}${previewData ? ` · 점포 ${previewData.storeCount}곳` : ""}`}
                    </span>
                  ),
                },
                { label: "대상 직원", value: <TargetCount preview={shownPreview} onRetry={reload} /> },
                {
                  label: "파일 형식",
                  value: (
                    <>
                      ZIP 한 개<span className="text-erp-label">직원별 폴더로 나뉩니다</span>
                    </>
                  ),
                },
              ]}
            />
            <div className="flex items-center justify-end gap-[12px]">
              {block && (
                <p role="status" className="min-w-0 flex-1 text-[13px] leading-[1.5] text-erp-label">
                  {block}
                </p>
              )}
              <Button onClick={() => handleRequest(storeIds)} disabled={!canRequest}>
                일괄 저장 요청
              </Button>
            </div>
            <Note>
              사람 수에 따라 몇 분에서 몇십 분 걸리고, 화면을 닫아도 계속 만듭니다. 퇴직한 직원은 보존 기간이 남은 사람만 담깁니다.
            </Note>
          </Card>
          <NoticeBand
            tone="info"
            title="내려받은 파일의 보관 책임은 BP 에 있습니다."
            detail="직원의 이름 · 휴대전화번호 · 급여가 담긴 파일입니다. 잠긴 곳에 두고, 쓸 일이 끝나면 지워 주세요."
          />
        </div>
      </div>
    </div>
  );
}

function TargetCount({ preview, onRetry }: { preview: Loaded<BulkExportPreview> | null; onRetry: () => void }) {
  if (preview === null) return <span className="text-erp-muted">불러오는 중입니다.</span>;
  if ("error" in preview)
    return (
      <>
        <span className="min-w-0 truncate text-erp-off">{preview.error}</span>
        <Button variant="soft" onClick={onRetry}>
          다시 시도
        </Button>
      </>
    );
  const { staffCount, employedCount, retiredCount } = preview.data;
  return (
    <>
      <b className="font-semibold">{staffCount.toLocaleString("ko-KR")}명</b>
      <span className="text-erp-label">
        재직 {employedCount.toLocaleString("ko-KR")} · 보존 기간 안 퇴직 {retiredCount.toLocaleString("ko-KR")}
      </span>
    </>
  );
}

function StatusCell({ item }: { item: BulkExport }) {
  const view = bulkExportViewOf(item);
  switch (view.kind) {
    case "making":
      return <Badge tone="closed">만드는 중</Badge>;
    case "ready":
      return (
        <span className="flex items-center gap-[6px]">
          <Badge tone="on">받을 수 있음</Badge>
          <span className="text-erp-label">{view.until} 까지</span>
        </span>
      );
    case "expired":
      return <Badge tone="closed">기한 지남</Badge>;
    case "failed":
      return (
        <span className="flex min-w-0 items-center gap-[6px]" title={item.failureReason ?? undefined}>
          <Badge tone="off">실패</Badge>
          {item.failureReason && <span className="min-w-0 truncate text-erp-label">{item.failureReason}</span>}
        </span>
      );
  }
}
