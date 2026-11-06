"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "./button";

// 첨부파일 칸 공통 — [파일 선택] · 안내 · 올린 파일 목록 · 올리지 않은 파일과 까닭을 한 모양으로 그린다.
// 공지사항 등록 · 수정과 고객지원 문의하기 패널이 같은 칸이라 공통으로 올렸다(2026-11-06 사용자 지정).
// - 줄은 34px · 아래 구분선 · 이름 · 크기 · 글자 버튼 [빼기]. 그림(JPG · PNG)은 이름 앞에 64px 둥근(8px) 썸네일을 둔다.
// - 형식 · 크기 · 개수가 맞지 않는 파일은 목록에 넣지 않고, 목록 아래에 파일명(먹색)과 그 아래 「└ 까닭」(빨간 글자)을 보인다.
// 칸 이름(첨부파일 n / 5)과 어떤 파일을 받을지는 화면이 정한다.

/** 목록 한 줄. preview 는 썸네일 주소, onOpen 이 있으면 이름이 내려받기 링크다. onRemove 가 없으면 [빼기]를 두지 않는다 */
export type AttachmentRow = { key: string | number; name: string; size: number; preview?: string; onOpen?: () => void; onRemove?: () => void };
export type RejectedFile = { name: string; reason: string };

const isImage = (name: string) => /\.(jpe?g|png)$/i.test(name);

/** 파일 크기 글자 — 1MB 넘으면 MB, 아니면 KB(올림). */
export const fileSizeLabel = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.ceil(bytes / 1024))}KB`);

/**
 * 새로 고른 그림 파일의 브라우저 안 미리보기 주소(blob:). 만들기와 거두기를 한 effect 에서 한다 — render(useMemo)에서 만들면
 * 개발 모드의 effect 두 번 실행이 주소를 거둔 뒤 다시 만들지 않아 썸네일이 깨지고, 버려진 render 의 주소가 남는다(리뷰 반영).
 */
export function useFilePreviews<K>(files: readonly { key: K; file: File }[]) {
  const [previews, setPreviews] = useState<Map<K, string>>(() => new Map());
  useEffect(() => {
    const made = new Map(files.filter(({ file }) => isImage(file.name)).map(({ key, file }) => [key, URL.createObjectURL(file)]));
    // 브라우저 밖 자원(blob 주소)을 만든 결과를 담는 것이라 effect 안에서 상태를 바꾼다 — 거두기도 같은 effect 가 한다
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviews(made);
    return () => made.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);
  return previews;
}

export function AttachmentField({
  rows,
  rejected = [],
  onPick,
  canPick = true,
  editable = true,
  busy = false,
  accept,
  note,
}: {
  rows: AttachmentRow[];
  rejected?: RejectedFile[];
  onPick: (files: File[]) => void;
  /** 더 고를 수 있는지 — 개수가 다 찼으면 false */
  canPick?: boolean;
  /** false 면 [파일 선택] · 안내 · [빼기] 없이 목록만(읽기 전용) */
  editable?: boolean;
  busy?: boolean;
  accept?: string;
  note?: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      {editable && (
        <>
          <div>
            <input
              ref={input}
              type="file"
              multiple
              accept={accept}
              hidden
              onChange={(e) => {
                // 먼저 배열로 옮긴다 — FileList 는 입력칸을 따라가는 살아 있는 목록이라 입력칸을 비우면 같이 빈다
                onPick(Array.from(e.target.files ?? []));
                // 같은 파일을 빼고 다시 고를 수 있게 비운다
                e.target.value = "";
              }}
            />
            <Button variant="soft" disabled={busy || !canPick} onClick={() => input.current?.click()}>
              파일 선택
            </Button>
          </div>
          {/* 안내는 낱말 중간에서 끊지 않는다 */}
          {note && <p className="break-keep text-[14px] leading-[1.6] text-erp-label">{note}</p>}
        </>
      )}
      {rows.length > 0 && (
        <ul aria-label="첨부파일" className="text-[14px]">
          {rows.map((row) => (
            <li key={row.key} className={`flex items-center gap-[10px] border-b border-erp-divider ${row.preview ? "py-[12px]" : "h-[34px]"}`}>
              {row.onOpen ? (
                <button type="button" disabled={busy} onClick={row.onOpen} className="flex min-w-0 flex-1 items-center gap-[10px] text-left">
                  <Thumb src={row.preview} />
                  <span className="truncate text-erp-link hover:underline">{row.name}</span>
                </button>
              ) : (
                <span className="flex min-w-0 flex-1 items-center gap-[10px]">
                  <Thumb src={row.preview} />
                  <span className="truncate">{row.name}</span>
                </span>
              )}
              <span className="text-erp-label">{fileSizeLabel(row.size)}</span>
              {editable && row.onRemove && (
                <button type="button" disabled={busy} onClick={row.onRemove} className="text-erp-link hover:underline">
                  빼기
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {rejected.length > 0 && (
        // 올리지 않은 파일 — 올린 파일 목록 바로 아래 같은 줄 모양으로. 목록 하나에 상태 알림을 둬 화면 읽기가 묶어 읽는다(리뷰 반영)
        <ul role="status" aria-label="올리지 않은 파일" className="text-[14px]">
          {rejected.map(({ name, reason }, i) => (
            // 파일명(먹색) 아래 들여 쓴 「└ 까닭」(빨간 글자). 꺾은선은 플랫폼 메뉴 트리의 2단계 표시처럼 회색
            <li key={`rejected-${i}`} className="flex flex-col justify-center gap-[2px] border-b border-erp-divider py-[6px] leading-[1.6] break-keep">
              <p className="break-all text-erp-ink">{name}</p>
              <p className="flex gap-[4px] pl-[6px] text-erp-off">
                <span aria-hidden="true" className="text-erp-muted">
                  └
                </span>
                <span>{reason}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Thumb({ src }: { src?: string }) {
  if (!src) return null;
  // 주소를 받았어도 그림을 못 불러오면(서명 주소 만료 등) 빈 상자를 남기지 않고 숨긴다 — 이름 · 크기는 그대로 보인다(리뷰 반영)
  // eslint-disable-next-line @next/next/no-img-element -- 브라우저 안 주소(blob:)나 5분짜리 서명 주소라 이미지 최적화를 거칠 수 없다
  return <img src={src} alt="" className="size-[64px] shrink-0 rounded-[8px] border border-erp-panel-line object-cover" onError={(e) => (e.currentTarget.hidden = true)} />;
}
