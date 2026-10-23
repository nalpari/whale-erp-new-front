"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { Button } from "@/components/common";
import { downloadPercent, errorMessageOf, fileNameOfDisposition, XLSX_CONTENT_TYPE } from "@/lib/download";
import { NoticeBand } from "./store-parts";

// 점포 목록 엑셀 바로 받기(S-BAYAJS). 버튼은 툴바에, 안내 띠는 목록 위에 서므로 둘이 상태를 나눠 쓴다(목업 docs/mockup/stores 의
// 「엑셀 생성 중 · 1분 제한 · 1만 건 이상 · 실패」). 받는 동안 버튼이 「파일 만드는 중 · N%」로 바뀌고 잠긴다 — api 가 파일을 다 만든
// 뒤에야 보내기 시작하므로, 만드는 동안은 비율 없이 「파일 만드는 중」이고 받기 시작하면 받은 비율이 붙는다.
// 파일은 front 중계 경로(/stores/excel)가 토큰을 붙여 api 에서 받아 흘려준다. 1만 건 이상의 예약 생성(이메일 링크)은 api 에 아직 없다.

type Notice = { tone: "risk" | "info"; title: string; detail?: string };
/** 받기 단계 — 쉬는 중 · 만드는 중(api 가 아직 보내기 전이라 비율을 모름) · 받는 중(받은 비율, 크기를 모르면 null) */
type Phase = { kind: "idle" } | { kind: "preparing" } | { kind: "receiving"; percent: number | null };
type ExcelState = {
  phase: Phase;
  notice: Notice | null;
  /** 안내를 띄운 조건의 주소 — 조건이 바뀌면 지난 안내는 감춘다 */
  noticeFor: string;
  download: (href: string) => void;
};

const ExcelContext = createContext<ExcelState | null>(null);

const FAILED = "엑셀 파일을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.";

/**
 * 목록 영역을 감싼다. 안의 StoreExcelNotice · StoreExcelButton 이 같은 상태를 본다.
 * BP 마스터 계정 목록도 같은 방식이라 파일 이름만 바꿔 쓴다(fileName — 응답에 이름이 없을 때).
 */
export function StoreExcelProvider({ children, fileName = "점포목록.xlsx" }: { children: ReactNode; fileName?: string }) {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [noticeFor, setNoticeFor] = useState("");

  const download = async (href: string) => {
    setNotice(null);
    setNoticeFor(href);
    setPhase({ kind: "preparing" });
    try {
      const response = await fetch(href, { cache: "no-store" });
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        // 429 1분 제한 · 400 1만 건 이상 · 조건 없음은 할 일을 알려 주는 안내. 그 밖의 4xx(401 로그인 만료 · 403 권한 · 404)는
        // 다시 해도 소용없으니 api 문구를 그대로, 5xx 만 「잠시 후 다시」로 바꾼다
        if (response.status === 429 || response.status === 400) setNotice({ tone: "info", title: errorMessageOf(body, FAILED) });
        else setNotice({ tone: "risk", title: response.status < 500 ? errorMessageOf(body, FAILED) : FAILED, detail: "목록 조회 결과는 그대로 둡니다." });
        return;
      }
      // 로그인 페이지로 돌려보내진 HTML 같은 것을 「점포목록.xlsx」로 저장하지 않는다
      const contentType = response.headers.get("Content-Type") ?? "";
      if (!contentType.includes(XLSX_CONTENT_TYPE)) {
        console.error("점포 엑셀 응답 형식이 xlsx 가 아닙니다", contentType);
        setNotice({ tone: "risk", title: FAILED, detail: "목록 조회 결과는 그대로 둡니다." });
        return;
      }
      setPhase({ kind: "receiving", percent: null });
      const total = Number(response.headers.get("Content-Length"));
      const chunks: Uint8Array<ArrayBuffer>[] = [];
      let received = 0;
      const reader = response.body?.getReader();
      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value as Uint8Array<ArrayBuffer>);
          received += value.length;
          setPhase({ kind: "receiving", percent: downloadPercent(received, total) });
        }
      } else {
        const whole = new Uint8Array(await response.arrayBuffer());
        chunks.push(whole);
        received = whole.length;
      }
      // 크기를 알려 줬는데 덜 왔으면 잘린 파일이다 — 「점포목록.xlsx」로 저장하면 열어 보기 전까지 모른다
      if (Number.isFinite(total) && total > 0 && received !== total) {
        console.error("점포 엑셀 받기 크기 불일치", { received, total });
        setNotice({ tone: "risk", title: FAILED, detail: "파일이 끝까지 오지 않았습니다. 다시 받아 주세요." });
        return;
      }
      const blob = new Blob(chunks, { type: contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileNameOfDisposition(response.headers.get("Content-Disposition"), fileName);
      document.body.append(link);
      link.click();
      link.remove();
      // 저장 창이 주소를 읽기 전에 놓으면 받기가 끊기므로 조금 뒤에 놓는다
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (error) {
      console.error("점포 엑셀 받기 실패", error);
      setNotice({ tone: "risk", title: FAILED, detail: "목록 조회 결과는 그대로 둡니다." });
    } finally {
      setPhase({ kind: "idle" });
    }
  };

  return <ExcelContext value={{ phase, notice, noticeFor, download }}>{children}</ExcelContext>;
}

function useExcel(): ExcelState {
  const state = use(ExcelContext);
  if (!state) throw new Error("StoreExcelProvider 안에서 써야 합니다");
  return state;
}

/** 목록 위 안내 띠 — 지금 조건으로 받으려다 생긴 것만 보인다 */
export function StoreExcelNotice({ href }: { href: string }) {
  const { notice, noticeFor } = useExcel();
  if (!notice || noticeFor !== href) return null;
  return <NoticeBand tone={notice.tone} title={notice.title} detail={notice.detail} />;
}

/** [엑셀 다운로드] — 받는 동안 「파일 만드는 중 · N%」로 바뀌고 잠긴다. 0건이면 막는다 */
export function StoreExcelButton({ href, empty, emptyTitle = "받을 점포가 없습니다" }: { href: string; empty: boolean; emptyTitle?: string }) {
  const { phase, download } = useExcel();
  const busy = phase.kind !== "idle";
  const label =
    phase.kind === "idle"
      ? "엑셀 다운로드"
      : phase.kind === "receiving" && phase.percent !== null
        ? `파일 만드는 중 · ${phase.percent}%`
        : "파일 만드는 중";
  return (
    <Button variant="soft" onClick={() => download(href)} disabled={busy || empty} aria-busy={busy || undefined} title={empty ? emptyTitle : undefined}>
      {label}
    </Button>
  );
}
