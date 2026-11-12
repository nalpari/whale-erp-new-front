"use client";

import { useRef, useState, type ReactNode } from "react";
import { Badge, Blocked, Button, DataTable, NoticeBand, fileSizeLabel, type Column } from "@/components/common";
import { BP_HEADER, bpOfPath } from "@/lib/bp-path";
import { BULK_ACCEPT, bulkFileError, errorFileNameOf, isBulkPreview, type BulkAction, type BulkPreview, type BulkResource } from "@/lib/bulk-upload";
import { errorMessageOf, fileNameOfDisposition, XLSX_CONTENT_TYPE } from "@/lib/download";
import { HistoryScroll, WideDialog } from "./wide-dialog";

const SERVER_DOWN = "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.";
const HAS_ERRORS = "오류를 고친 파일을 다시 올려 주세요.";
const UNCERTAIN = "등록 결과를 확인하지 못했습니다. 다시 올리기 전에 목록에서 등록되었는지 먼저 확인해 주세요.";

/** 중계 경로(/api/bulk/{자원}/{동작}) 부르기 — 탭 BP 는 브라우저 주소(/bp/{id})에서 읽어 싣는다(bff() 와 같다) */
async function call(resource: BulkResource, action: BulkAction, file?: File): Promise<Response> {
  const bp = bpOfPath(location.pathname);
  const init: RequestInit = { cache: "no-store", headers: bp === null ? undefined : { [BP_HEADER]: String(bp) } };
  if (file) {
    const body = new FormData();
    body.append("file", file, file.name);
    Object.assign(init, { method: "POST", body });
  }
  return fetch(`/api/bulk/${resource}/${action}`, init);
}

/** 실패 응답의 문구 */
const failureOf = async (response: Response) => errorMessageOf(await response.json().catch(() => null), `요청이 실패했습니다 (HTTP ${response.status})`);

/** 받은 xlsx 를 파일로 저장한다 — 형식이 다르면(로그인 페이지 등) 저장하지 않고 문구를 돌려준다 */
async function save(response: Response, fallbackName: string): Promise<string | null> {
  if (!response.ok) return failureOf(response);
  if (!response.headers.get("Content-Type")?.startsWith(XLSX_CONTENT_TYPE)) return "엑셀 파일을 받지 못했습니다. 잠시 뒤 다시 시도해 주세요.";
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = fileNameOfDisposition(response.headers.get("Content-Disposition"), fallbackName);
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return null;
}

type Row = BulkPreview["rows"][number];

/**
 * 엑셀 일괄 등록 공통 팝업(데모 facility-bulk.mjs · 정책서 PL-7). 목록 제목 줄의 [일괄 등록]이 연다. 폭은 변경이력 팝업과 같은 1000.
 * ① 양식 내려받기 · 파일 선택 → [올리기]  ② 같은 팝업에서 미리보기(엑셀 행 번호 · 결과 · 주요 칸 · 오류 사유) → [등록] 또는 [다시 올리기].
 * 오류가 한 줄이라도 있으면 [등록]을 막고(막힌 버튼 말풍선) [오류 내용 내려받기]로 사유를 붙인 파일을 받는다. 미리보기에서는 값을 고칠 수 없다.
 * 등록은 모두 정상일 때 한 번에 저장하고(api 가 다시 검사), 실패하면 미리보기를 다시 받아 보인다. 성공하면 onDone(건수) — 토스트 · 목록 갱신은 부르는 쪽.
 * 자원마다 다른 것은 api 가 정한다(양식 · 미리보기 열 · 문구). 화면은 자원 이름(resource)과 안내 문구만 넘긴다.
 */
export function BulkUploadDialog({
  resource,
  title,
  open,
  onClose,
  onDone,
  onUncertain,
  templateGuide,
  uploadGuide,
  templateFileName,
}: {
  resource: BulkResource;
  /** 팝업 제목 — 미리보기 단계는 「 · 미리보기」를 붙인다 */
  title: string;
  open: boolean;
  onClose: () => void;
  /** 등록을 마쳤다 — 건수를 읽지 못했으면 null */
  onDone: (createdCount: number | null) => void;
  /** 등록 결과를 모른다(5xx · 연결 끊김) — 부르는 쪽이 목록을 다시 받는다 */
  onUncertain?: () => void;
  /** 「1. 양식 내려받기」 안내 — 양식에서 고르는 칸 · 두 번째 시트 · 양식에 없는 칸 */
  templateGuide: ReactNode;
  /** 「2. 파일 올리기」 안내 — 한 번에 올릴 수 있는 줄 수 등 */
  uploadGuide: ReactNode;
  /** api 가 파일 이름을 주지 않을 때의 양식 파일 이름 */
  templateFileName: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<BulkPreview | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "template" | "validate" | "error-file" | "register">(null);

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setFailure(null);
  };
  const handleClose = () => {
    if (busy === "register") return; // 저장 중엔 닫지 않는다
    handleReset();
    onClose();
  };
  const run = async (kind: NonNullable<typeof busy>, work: () => Promise<void>) => {
    setBusy(kind);
    setFailure(null);
    try {
      await work();
    } catch (error) {
      // 등록 중 끊김은 저장 여부를 모른다 — error 로 남긴다
      (kind === "register" ? console.error : console.warn)("일괄 등록 연결 실패", resource, kind, error);
      // 등록 중 끊겼으면 저장됐을 수도 있다 — 같은 파일을 다시 등록하지 않게 목록에서 확인하게 한다
      setFailure(kind === "register" ? UNCERTAIN : SERVER_DOWN);
      if (kind === "register") onUncertain?.();
    } finally {
      setBusy(null);
    }
  };

  const handleTemplateDownload = () => run("template", async () => setFailure(await save(await call(resource, "template"), templateFileName)));
  const validate = (target: File) =>
    run("validate", async () => {
      const response = await call(resource, "validations", target);
      if (!response.ok) return setFailure(await failureOf(response));
      const body: unknown = await response.json().catch(() => null);
      if (!isBulkPreview(body)) {
        console.error("일괄 등록 미리보기 모양이 다릅니다", resource, body);
        return setFailure("미리보기를 읽지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
      }
      setPreview(body);
    });
  const handleErrorFileDownload = () => file && run("error-file", async () => setFailure(await save(await call(resource, "error-file", file), errorFileNameOf(file.name))));
  const handleRegister = () =>
    file &&
    run("register", async () => {
      const response = await call(resource, "register", file);
      if (response.ok) {
        // 건수를 읽지 못했으면 지어내지 않고 null — 부르는 쪽이 건수 없이 알린다(리뷰 반영, 전엔 미리보기 건수로 대신 셌다)
        const body = (await response.json().catch(() => null)) as { createdCount?: unknown } | null;
        if (typeof body?.createdCount !== "number") console.error("일괄 등록 응답에 건수가 없습니다", resource, body);
        handleReset();
        onDone(typeof body?.createdCount === "number" ? body.createdCount : null);
        return;
      }
      // 5xx · 연결 끊김은 api 가 저장을 마쳤을 수도 있다 — 다시 올리면 두 번 등록되므로 목록에서 확인하게 한다(리뷰 반영)
      if (response.status >= 500) {
        setFailure(UNCERTAIN);
        onUncertain?.();
        return;
      }
      // 미리보기와 등록 사이에 바뀐 것(공통코드 · 점포 상태)이 있으면 api 가 다시 검사해 막는다 — 미리보기를 다시 받아 지금 오류를 보인다
      const message = await failureOf(response);
      if (response.status === 400) {
        // 다시 받다 끊겨도 확정 실패(400)는 그대로 알린다 — run 의 catch 로 넘기면 「결과 모름」으로 바뀐다(리뷰 반영)
        const again = await call(resource, "validations", file).catch((e: unknown) => {
          console.warn("일괄 등록 미리보기 다시 받기 실패", resource, e);
          return null;
        });
        const body: unknown = again?.ok ? await again.json().catch(() => null) : null;
        if (isBulkPreview(body)) setPreview(body);
      }
      setFailure(message);
    });

  const handlePick = (picked: File | undefined) => {
    if (!picked) return;
    const reason = bulkFileError(picked);
    setFailure(reason);
    setFile(reason ? null : picked);
  };

  const columns: Column<Row>[] = preview
    ? [
        { header: "행", width: "w-[50px]", cell: (r) => r.rowNumber },
        { header: "결과", width: "w-[70px]", cell: (r) => (r.isValid ? <Badge tone="on">정상</Badge> : <Badge tone="off">오류</Badge>) },
        // api 가 정한 열은 폭을 고정하고(넘치면 말줄임) 남는 폭은 「오류 사유」가 쓴다 — 나눠 가지면 사유가 글자 단위로 꺾였다
        ...preview.columns.map(
          (c): Column<Row> => ({ header: c.label, width: "w-[110px]", align: "left", cell: (r) => r.values[c.key] || <span className="text-erp-muted">-</span> }),
        ),
        {
          header: "오류 사유",
          align: "left",
          cell: (r) =>
            r.errors.length ? (
              // 사유는 「칸: 사유」를 줄마다 빨간 글자로 모두 — 칸 말줄임을 풀어 줄을 바꾼다
              <span className="block leading-[1.5] whitespace-normal text-erp-off">
                {r.errors.map((e, i) => (
                  <span key={i} className="block">
                    {e}
                  </span>
                ))}
              </span>
            ) : (
              <span className="text-erp-muted">-</span>
            ),
        },
      ]
    : [];

  const step = preview ? "preview" : "pick";
  return (
    <WideDialog
      open={open}
      title={step === "preview" ? `${title} · 미리보기` : title}
      onClose={handleClose}
      footer={
        step === "pick" ? (
          <>
            <Button variant="off" onClick={handleClose}>
              취소
            </Button>
            <Button disabled={!file || busy !== null} onClick={() => file && validate(file)}>
              {busy === "validate" ? "확인 중…" : "올리기"}
            </Button>
          </>
        ) : (
          <>
            <Button variant="off" disabled={busy !== null} onClick={handleReset}>
              다시 올리기
            </Button>
            {preview && preview.errorCount > 0 ? (
              <Blocked reason={HAS_ERRORS}>
                <Button disabled>등록</Button>
              </Blocked>
            ) : (
              <Button disabled={busy !== null} onClick={handleRegister}>
                {busy === "register" ? "등록 중…" : `${preview?.totalCount.toLocaleString("ko-KR") ?? 0}건 등록`}
              </Button>
            )}
          </>
        )
      }
    >
      {step === "pick" ? (
        <div className="flex flex-col gap-[18px]">
          {failure && <NoticeBand title={failure} />}
          <Box title="1. 양식 내려받기">
            <Help>{templateGuide}</Help>
            <div>
              <Button variant="soft" disabled={busy !== null} onClick={handleTemplateDownload}>
                {busy === "template" ? "내려받는 중…" : "양식 내려받기"}
              </Button>
            </div>
          </Box>
          <Box title="2. 파일 올리기">
            <Help>{uploadGuide}</Help>
            <div className="flex items-center gap-[10px]">
              <input
                ref={input}
                type="file"
                accept={BULK_ACCEPT}
                hidden
                onChange={(e) => {
                  handlePick(e.target.files?.[0]);
                  // 같은 파일을 고쳐 다시 고를 수 있게 비운다
                  e.target.value = "";
                }}
              />
              <Button variant="soft" disabled={busy !== null} onClick={() => input.current?.click()}>
                파일 선택
              </Button>
              {file && (
                <span className="min-w-0 truncate text-[14px] text-erp-ink">
                  {file.name} <span className="text-erp-label">· {fileSizeLabel(file.size)}</span>
                </span>
              )}
            </div>
          </Box>
        </div>
      ) : (
        preview && (
          <>
            <div className="flex shrink-0 items-center gap-[10px] text-[14px]">
              <span className="min-w-0 flex-1 truncate text-erp-label">{preview.fileName || file?.name}</span>
              <span>
                전체 <b className="font-semibold">{preview.totalCount.toLocaleString("ko-KR")}</b>건
              </span>
              <span className="h-[11px] w-px bg-[#d9d9d9]" aria-hidden="true" />
              <span>
                정상 <b className="font-semibold">{preview.validCount.toLocaleString("ko-KR")}</b>건
              </span>
              <span className="h-[11px] w-px bg-[#d9d9d9]" aria-hidden="true" />
              <span className={preview.errorCount ? "text-erp-off" : undefined}>
                오류 <b className="font-semibold">{preview.errorCount.toLocaleString("ko-KR")}</b>건
              </span>
              {preview.errorCount > 0 && (
                <Button variant="soft" disabled={busy !== null} onClick={handleErrorFileDownload}>
                  {busy === "error-file" ? "내려받는 중…" : "오류 내용 내려받기"}
                </Button>
              )}
            </div>
            {failure ? (
              <NoticeBand title={failure} />
            ) : (
              preview.errorCount > 0 && <NoticeBand title={HAS_ERRORS} detail="오류가 한 줄이라도 있으면 등록할 수 없습니다. 미리보기에서는 값을 고칠 수 없습니다." />
            )}
            <HistoryScroll>
              <DataTable columns={columns} rows={preview.rows} rowKey={(r) => r.rowNumber} empty="등록할 줄이 없습니다." />
            </HistoryScroll>
          </>
        )
      )}
    </WideDialog>
  );
}

function Box({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[10px] rounded-[2px] border border-erp-panel-line bg-white p-[16px]">
      <h3 className="text-[15px] font-semibold text-erp-ink">{title}</h3>
      {children}
    </section>
  );
}

function Help({ children }: { children: ReactNode }) {
  return <div className="text-[14px] leading-[1.6] break-keep text-erp-label">{children}</div>;
}
