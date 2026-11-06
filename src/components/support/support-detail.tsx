"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { Button, DetailTable, DetailValues, PageBar, Tag } from "@/components/common";
import { useCodeLabel } from "@/components/site/code-label";
import { useCurrentBp } from "@/components/site/session-gate";
import { bff, BffError } from "@/lib/bff";
import { bpPath } from "@/lib/bp-path";
import type { SupportInquiry, SupportNotice } from "@/lib/community";
import { SESSION_EXPIRED, sizeLabel, SUPPORT_INQUIRY_BASE, SUPPORT_NOTICE_BASE, type InquiryStatus } from "@/lib/community-view";
import { labelOf, type EnumValue } from "@/lib/enums";
import { formatDateTime } from "@/lib/format";
import { InquiryStatusBadge } from "./support-lists";

// 고객지원 상세 둘 — 공지사항(#282, 데모 support/notice-detail)과 내 문의(#284, 데모 support/inquiry-mine).
// 노출 대상 · 이력 · 내부 메모 · 이전 답변 · 운영자는 api 가 싣지 않는다(CNT-17). 첨부는 누를 때마다 5분짜리 서명 주소를 새로 받는다.
// 화면 안 링크(목록 · 이전 · 다음)는 탭 BP 를 붙인다(bpPath, front #82). 첨부 주소는 api 경로라 bff() 가 BP 를 싣는다.

const Prose = ({ children }: { children: ReactNode }) => <p className="text-[14px] leading-[1.7] whitespace-pre-wrap break-keep text-erp-ink">{children}</p>;
// 보조 글자는 점포 정보 관리 상세와 같은 14px(2026-11-05 사용자 지정 — 전엔 13px)
const Meta = ({ children }: { children: ReactNode }) => <span className="text-[14px] text-erp-label">{children}</span>;
const Sub = ({ children }: { children: ReactNode }) => <span className="text-erp-muted">{children}</span>;

// 제목 줄이 있는 카드(데모 staff-parts.mjs 의 box). 표만 든 상자는 flush 로 여백 없이.
/** hintLeft 면 보조 글자를 제목 바로 옆(왼쪽)에 붙인다 — 답변 일시 · 답변자(2026-11-05 사용자 지정). 기본은 오른쪽 끝. */
function Box({ title, hint, hintLeft, flush, children }: { title: ReactNode; hint?: ReactNode; hintLeft?: boolean; flush?: boolean; children: ReactNode }) {
  return (
    <section className="min-w-0">
      {/* 제목 바 글자는 DetailTable 제목과 같은 15px 600(2026-11-05 사용자 지정 — 전엔 16px 500) */}
      <h3 className={`flex h-[42px] items-center ${hintLeft ? "gap-[10px]" : "gap-[6px]"} rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px] text-[15px] font-semibold text-erp-ink`}>
        <span className={`min-w-0 truncate ${hintLeft ? "shrink-0" : "flex-1"}`}>{title}</span>
        {hint &&
          (hintLeft ? (
            <>
              {/* #d9d9d9 — DESIGN.md 의 값 구분선 */}
              <span aria-hidden="true" className="h-[11px] w-px shrink-0 bg-[#d9d9d9]" />
              <span className="min-w-0 truncate text-[14px] font-normal text-erp-label">{hint}</span>
            </>
          ) : (
            <Meta>{hint}</Meta>
          ))}
      </h3>
      {flush ? children : <div className="flex flex-col gap-[18px] rounded-b-[2px] border border-erp-thead-line bg-white p-[16px]">{children}</div>}
    </section>
  );
}

/**
 * 본문 첫 줄 「○○ 상세」 + 목록 버튼, 아래 내용. 첨부 내려받기 실패는 띠로 보인다.
 * title 에 글자 대신 머리 줄(점포 정보 관리 상세의 점포명 줄 모양)을 넘길 수 있다 — 문의상세.
 */
function Frame({ menu, title, listHref, error, children }: { menu: string; title: ReactNode; listHref: string; error: string; children: ReactNode }) {
  return (
    <>
      <PageBar title={menu} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <div className="flex items-center gap-[18px]">
            {typeof title === "string" ? <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">{title}</h2> : <div className="min-w-0 flex-1">{title}</div>}
            <Button href={listHref}>
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
  const bp = useCurrentBp().bpCodeId;
  const neighbor = (p: SupportNotice["prev"], none: string) =>
    p ? (
      <DetailValues
        items={[
          <Link key="t" href={bpPath(bp, `${SUPPORT_NOTICE_BASE}/${p.postId}`)} className="truncate text-erp-link hover:underline">
            {p.title}
          </Link>,
          <Meta key="d">{p.postedDate}</Meta>,
        ]}
      />
    ) : (
      <Sub>{none}</Sub>
    );
  return (
    <Frame menu="공지사항" title="공지사항 상세" listHref={bpPath(bp, SUPPORT_NOTICE_BASE)} error={error}>
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
          { label: "이전", value: neighbor(n.prev, "목록의 맨 아래 공지입니다.") },
          { label: "다음", value: neighbor(n.next, "목록의 맨 위 공지입니다.") },
        ]}
      />
    </Frame>
  );
}

/**
 * 처리현황 단계 아이콘(16px, 선) — 접수는 받은 문서, 처리중은 시계, 답변완료는 동그라미 체크(2026-11-05 사용자 지정 — 전엔 점).
 * 색은 감싸는 쪽 글자색(currentColor)을 따른다 — 지난 단계는 회청, 아직 안 된 단계는 회색.
 */
function StepIcon({ status }: { status: InquiryStatus }) {
  const common = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (status === "RECEIVED")
    return (
      <svg {...common}>
        <path d="M4 1.75h5.5L12.5 4.75v9.5H4z" />
        <path d="M9.5 1.75v3h3M6 8h4.5M6 10.75h4.5" />
      </svg>
    );
  if (status === "IN_PROGRESS")
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="6.25" />
        <path d="M8 4.5V8l2.5 1.5" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="8" cy="8" r="6.25" />
      <path d="M5.25 8.25 7.1 10l3.65-3.75" />
    </svg>
  );
}

/** 처리현황 한 줄 — [일시(아직 안 된 단계면 null), 상태]. */
type Step = [string | null, InquiryStatus];

export function MyInquiryView({ inquiry: d, statuses }: { inquiry: SupportInquiry; statuses: EnumValue[] }) {
  const categoryLabel = useCodeLabel("INQUIRY_CATEGORY");
  const { error, busy, download } = useDownload();
  const bp = useCurrentBp().bpCodeId;
  // 처리현황 — 세 단계를 늘 진행 순서(접수 → 처리중 → 답변완료)로 둔다. 지난 단계는 진하게(회청 동그라미 · 상태 배지 · 일시),
  // 아직 안 된 단계는 흐리게(회색 아이콘 · 회색 글자 · 「-」) — 2026-11-05 사용자 지정, 전엔 지난 단계만 최근 것부터.
  // 처리 시작 없이 답했으면 처리중은 일시 없이 흐리게 남는다.
  const steps: Step[] = [
    [formatDateTime(d.createdAt), "RECEIVED"],
    [d.processingStartedAt ? formatDateTime(d.processingStartedAt) : null, "IN_PROGRESS"],
    [d.reply ? formatDateTime(d.reply.repliedAt) : null, "ANSWERED"],
  ];

  return (
    <Frame
      menu="문의하기"
      title={
        // 점포 정보 관리 상세의 점포명 줄과 같은 모양 — 제목 20px, 아래 줄에 「등록일 …」 | 「분류」 + 분류 꼬리표(2026-11-05 사용자 지정 — 전엔 회색 제목 바에 제목 · 등록일시 · 분류를 한 줄로)
        <div className="flex flex-col gap-[6px] py-[6px]">
          {/* 제목은 자르지 않고 모두 보인다(200자까지, 넘치면 줄바꿈 — 2026-11-05 사용자 지정) */}
          <h2 className="break-all text-[20px] font-semibold text-erp-ink">{d.title}</h2>
          <div className="flex items-center gap-[10px] text-[14px] font-medium text-erp-label">
            <span>등록일 {formatDateTime(d.createdAt)}</span>
            {/* #d9d9d9 — DESIGN.md 의 값 구분선, Figma 전용 색이라 토큰이 없다 */}
            <span className="h-[11px] w-px bg-[#d9d9d9]" />
            <span className="flex items-center gap-[6px]">
              분류 <Tag>{categoryLabel(d.inquiryCategoryCode)}</Tag>
            </span>
          </div>
        </div>
      }
      listHref={bpPath(bp, SUPPORT_INQUIRY_BASE)}
      error={error}
    >
      <div className="grid grid-cols-[7fr_5fr] items-start gap-[24px]">
        <div className="flex min-w-0 flex-col gap-[24px]">
          <Box title="문의내용">
            <Prose>{d.body}</Prose>
          </Box>
          {/* 첨부(CNT-18): 이미지는 작은 미리보기, PDF 는 이름 + 크기. 누르면 내려받는다.
              문의자 쪽은 종류 칸(이미지 · PDF) 없이 줄만 둔다 — 미리보기와 파일 이름으로 알 수 있다(2026-11-05 사용자 지정). 커뮤니티 관리(운영자) 쪽은 종류 칸을 둔다 */}
          {d.attachments.length > 0 && (
            <Box title="첨부파일" flush>
              <ul className="rounded-b-[2px] border border-erp-thead-line bg-white">
                {d.attachments.map((a) => (
                  <li key={a.inquiryAttachmentId} className={`flex items-center border-b border-erp-thead-line px-[12px] last:border-b-0 ${a.thumbnailUrl ? "py-[12px]" : "h-[46px]"}`}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => download(`${SUPPORT_INQUIRY_BASE}/${d.inquiryId}/attachments/${a.inquiryAttachmentId}/download-url`)}
                    title={`${a.fileName} 내려받기`}
                    className="flex min-w-0 items-center gap-[10px] text-left"
                  >
                    {a.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- 5분짜리 서명 주소라 이미지 최적화 캐시에 둘 수 없다
                      <img src={a.thumbnailUrl} alt="" className="size-[64px] shrink-0 rounded-[8px] border border-erp-panel-line object-cover" />
                    )}
                    <span className="truncate text-erp-link hover:underline">{a.fileName}</span>
                    <Sub>{sizeLabel(a.sizeBytes)}</Sub>
                  </button>
                  </li>
                ))}
              </ul>
            </Box>
          )}
          {/* 마지막 답변 하나만, 고친 답변이면 수정 시각만 붙인다(CNT-17). */}
          {/* 「답변 | WHALE ERP 운영팀 · 등록 일시 (수정됨 일시)」 — 제목 바로 옆 왼쪽에 구분선과 함께(2026-11-05 사용자 지정 — 전엔 본문 위 「일시 · WHALE ERP 운영팀 · 수정됨 …」 한 줄) */}
          <Box
            title="답변"
            hintLeft
            hint={d.reply && `WHALE ERP 운영팀 · 등록 ${formatDateTime(d.reply.repliedAt)}${d.reply.editedAt ? ` (수정됨 ${formatDateTime(d.reply.editedAt)})` : ""}`}
          >
            {d.reply ? (
              <Prose>{d.reply.body}</Prose>
            ) : (
              <Sub>등록된 답변이 없습니다. 답변이 등록되면 알림함에서 확인할 수 있습니다.</Sub>
            )}
          </Box>
        </div>
        {/* 표 대신 줄 목록 — 열 이름 줄 · 줄 사이 선 없이 상태(아이콘 + 배지) 140px, 일시를 왼쪽 정렬로(2026-11-05 사용자 지정) */}
        <Box title="처리현황">
          <ul className="flex flex-col gap-[14px] text-[14px]">
            {steps.map(([at, status]) => (
              <li key={status} className="flex items-center">
                <span className="inline-flex w-[140px] shrink-0 items-center gap-[8px]">
                  <span className={`flex shrink-0 ${at ? "text-erp-brand" : "text-erp-muted"}`}>
                    <StepIcon status={status} />
                  </span>
                  {at ? <InquiryStatusBadge status={status} statuses={statuses} /> : <span className="text-erp-muted">{labelOf(statuses, status)}</span>}
                </span>
                <span className={at ? "text-erp-ink" : "text-erp-muted"}>{at ?? "-"}</span>
              </li>
            ))}
          </ul>
        </Box>
      </div>
    </Frame>
  );
}
