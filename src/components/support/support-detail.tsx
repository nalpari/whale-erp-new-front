"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { Button, DataTable, DetailTable, DetailValues, PageBar, type Column } from "@/components/common";
import { useCodeLabel } from "@/components/site/code-label";
import { bff, BffError } from "@/lib/bff";
import type { SupportInquiry, SupportNotice } from "@/lib/community";
import { SESSION_EXPIRED, sizeLabel, SUPPORT_INQUIRY_BASE, SUPPORT_NOTICE_BASE, type InquiryStatus } from "@/lib/community-view";
import { labelOf, type EnumValue } from "@/lib/enums";
import { formatDateTime } from "@/lib/format";
import { InquiryStatusBadge } from "./support-lists";

// 고객지원 상세 둘 — 공지사항(#282, 데모 support/notice-detail)과 내 문의(#284, 데모 support/inquiry-mine).
// 노출 대상 · 이력 · 내부 메모 · 이전 답변 · 운영자는 api 가 싣지 않는다(CNT-17). 첨부는 누를 때마다 5분짜리 서명 주소를 새로 받는다.

const Prose = ({ children }: { children: ReactNode }) => <p className="text-[14px] leading-[1.7] whitespace-pre-wrap break-keep text-erp-ink">{children}</p>;
const Meta = ({ children }: { children: ReactNode }) => <span className="text-[13px] text-erp-label">{children}</span>;
const Sub = ({ children }: { children: ReactNode }) => <span className="text-erp-muted">{children}</span>;

// 제목 줄이 있는 카드(데모 staff-parts.mjs 의 box). 표만 든 상자는 flush 로 여백 없이.
function Box({ title, hint, flush, children }: { title: ReactNode; hint?: ReactNode; flush?: boolean; children: ReactNode }) {
  return (
    <section className="min-w-0">
      <h3 className="flex h-[42px] items-center gap-[6px] rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px] text-[16px] font-medium text-erp-ink">
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {hint && <Meta>{hint}</Meta>}
      </h3>
      {flush ? children : <div className="flex flex-col gap-[18px] rounded-b-[2px] border border-erp-thead-line bg-white p-[16px]">{children}</div>}
    </section>
  );
}

/** 본문 첫 줄 「○○ 상세」 + 목록 버튼, 아래 내용. 첨부 내려받기 실패는 띠로 보인다. */
function Frame({ menu, title, listHref, error, children }: { menu: string; title: string; listHref: string; error: string; children: ReactNode }) {
  return (
    <>
      <PageBar title={menu} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <div className="flex items-center gap-[6px]">
            <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">{title}</h2>
            <Button variant="off" href={listHref}>
              목록
            </Button>
          </div>
          {error && (
            <p role="alert" className="rounded-[2px] border border-erp-off-bg bg-erp-off-bg px-[16px] py-[12px] text-[14px] text-erp-off">
              {error}
            </p>
          )}
          {children}
        </div>
      </div>
    </>
  );
}

/** 첨부 내려받기 — 서명 주소를 받아 그리로 간다. 받으면 원래 파일 이름으로 저장된다. */
function useDownload() {
  const [error, setError] = useState("");
  const [busy, startTransition] = useTransition();
  const download = (path: string) =>
    startTransition(async () => {
      try {
        const { url } = await bff<{ url: string }>(path);
        setError("");
        window.location.assign(url);
      } catch (e) {
        setError(e instanceof BffError ? (e.status === 401 ? SESSION_EXPIRED : e.message) : "첨부파일을 받지 못했습니다.");
      }
    });
  return { error, busy, download };
}

export function SupportNoticeView({ notice: n, noticeTypes }: { notice: SupportNotice; noticeTypes: EnumValue[] }) {
  const { error, busy, download } = useDownload();
  const neighbor = (p: SupportNotice["prev"], none: string) =>
    p ? (
      <DetailValues
        items={[
          <Link key="t" href={`${SUPPORT_NOTICE_BASE}/${p.postId}`} className="truncate text-erp-link hover:underline">
            {p.title}
          </Link>,
          <Meta key="d">{p.postedDate}</Meta>,
        ]}
      />
    ) : (
      <Sub>{none}</Sub>
    );
  return (
    <Frame menu="공지사항" title="공지사항 상세" listHref={SUPPORT_NOTICE_BASE} error={error}>
      <Box title={n.title} hint={[n.noticeType && labelOf(noticeTypes, n.noticeType), n.postedDate].filter(Boolean).join(" · ")}>
        {/* 본문은 평문이다 — HTML 로 그리지 않는다. */}
        <Prose>{n.body}</Prose>
      </Box>
      {n.attachments.length > 0 && (
        <DetailTable
          title="첨부파일"
          rows={n.attachments.map((a) => ({
            label: "파일",
            value: (
              <DetailValues
                items={[
                  <button key="n" type="button" disabled={busy} onClick={() => download(`${SUPPORT_NOTICE_BASE}/${n.postId}/attachments/${a.postAttachmentId}/download-url`)} className="truncate text-left text-erp-link hover:underline">
                    {a.fileName}
                  </button>,
                  <Meta key="s">{sizeLabel(a.sizeBytes)}</Meta>,
                ]}
              />
            ),
          }))}
        />
      )}
      {/* 이전은 목록에서 바로 아래 글, 다음은 바로 위 글이다(api SupportPostResponseDto). 상단 고정 글이 먼저 서므로 맨 위 · 맨 아래가 가장 최근 · 오래된 글과 다를 수 있다. */}
      <DetailTable
        title="이전 · 다음"
        rows={[
          { label: "이전", value: neighbor(n.prev, "목록의 맨 아래 공지입니다") },
          { label: "다음", value: neighbor(n.next, "목록의 맨 위 공지입니다") },
        ]}
      />
    </Frame>
  );
}

/** 진행 한 줄 — [일시, 상태]. */
type Step = [string, InquiryStatus];

export function MyInquiryView({ inquiry: d, statuses }: { inquiry: SupportInquiry; statuses: EnumValue[] }) {
  const categoryLabel = useCodeLabel("INQUIRY_CATEGORY");
  const { error, busy, download } = useDownload();
  // 진행 — 최근 것부터. 처리중을 거치지 않고 답했으면 그 줄이 없다.
  const steps: Step[] = [
    ...(d.reply ? [[formatDateTime(d.reply.repliedAt), "ANSWERED"] as Step] : []),
    ...(d.processingStartedAt ? [[formatDateTime(d.processingStartedAt), "IN_PROGRESS"] as Step] : []),
    [formatDateTime(d.createdAt), "RECEIVED"],
  ];
  const stepColumns: Column<Step>[] = [
    { header: "일시", cell: (s) => s[0] },
    { header: "상태", cell: (s) => <InquiryStatusBadge status={s[1]} statuses={statuses} /> },
  ];

  return (
    <Frame menu="문의하기" title="문의사항 상세" listHref={SUPPORT_INQUIRY_BASE} error={error}>
      <div className="grid grid-cols-[7fr_5fr] items-start gap-[24px]">
        <div className="flex min-w-0 flex-col gap-[24px]">
          <Box title={d.title} hint={`${formatDateTime(d.createdAt)} · ${categoryLabel(d.inquiryCategoryCode)}`}>
            <Prose>{d.body}</Prose>
          </Box>
          {/* 첨부(CNT-18): 이미지는 작은 미리보기, PDF 는 이름 + 크기. 누르면 내려받는다. */}
          {d.attachments.length > 0 && (
            <DetailTable
              title="첨부파일"
              rows={d.attachments.map((a) => ({
                label: a.fileType === "PDF" ? "PDF" : "이미지",
                multiline: !!a.thumbnailUrl,
                value: (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => download(`${SUPPORT_INQUIRY_BASE}/${d.inquiryId}/attachments/${a.inquiryAttachmentId}/download-url`)}
                    title={`${a.fileName} 내려받기`}
                    className="flex min-w-0 items-center gap-[10px] text-left"
                  >
                    {a.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- 5분짜리 서명 주소라 이미지 최적화 캐시에 둘 수 없다
                      <img src={a.thumbnailUrl} alt="" className="size-[64px] shrink-0 rounded-[2px] border border-erp-panel-line object-cover" />
                    )}
                    <span className="truncate text-erp-link hover:underline">{a.fileName}</span>
                    <Sub>{sizeLabel(a.sizeBytes)}</Sub>
                  </button>
                ),
              }))}
            />
          )}
          {/* 마지막 답변 하나만, 고친 답변이면 수정 시각만 붙인다(CNT-17). */}
          <Box title="답변">
            {d.reply ? (
              <>
                <Meta>
                  {formatDateTime(d.reply.repliedAt)} · WHALE ERP 운영팀{d.reply.editedAt && ` · 수정됨 ${formatDateTime(d.reply.editedAt)}`}
                </Meta>
                <Prose>{d.reply.body}</Prose>
              </>
            ) : (
              <Sub>아직 답변이 없습니다. 답변이 달리면 알림함으로 알려 드립니다.</Sub>
            )}
          </Box>
        </div>
        <Box title="진행" flush>
          <DataTable columns={stepColumns} rows={steps} rowKey={(s) => s[1]} />
        </Box>
      </div>
    </Frame>
  );
}
