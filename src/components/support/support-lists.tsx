"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Badge, Button, DataTable, FilterPanel, FilterSection, SearchField, Tag, type Column } from "@/components/common";
import { Frame, Pick, useGo } from "@/components/community/community-lists";
import { useCodeLabel } from "@/components/site/code-label";
import { useCodes, useCurrentBp, usePagePermission } from "@/components/site/session-gate";
import { bpPath } from "@/lib/bp-path";
import type { SupportInquiryListItem, SupportPost } from "@/lib/community";
import {
  SUPPORT_INQUIRY_BASE,
  SUPPORT_NOTICE_BASE,
  type InquiryStatus,
  type SupportFaqQuery,
  type SupportInquiryQuery,
  type SupportNoticeQuery,
} from "@/lib/community-view";
import { labelOf, type EnumValue } from "@/lib/enums";
import { formatDateTime } from "@/lib/format";
import { InquiryFormPanel } from "./inquiry-form";

// 고객지원 목록 셋(#282 · 283 · 284, 데모 src/support-sections.mjs). 메뉴 셋 · 화면 셋이고 화면이 곧 전체 목록이다(SUPPORT-4).
// 왼쪽 필터 + 목록은 커뮤니티 관리 목록과 같은 틀이다. 조건 · 쪽 · 건수는 주소에만 둔다.
// ERP 메뉴라 화면 주소에 탭 BP 를 싣는다(/bp/{bpCodeId}/…, front #82) — 상세로 가는 링크도 bpPath 로 만든다.

/** 검색칸 하나. 초기화 · 뒤로 가기로 주소의 검색어가 바뀌면 칸도 따라간다. */
function Search({ label, placeholder, value, maxLength, onSearch }: { label: string; placeholder: string; value: string; maxLength: number; onSearch: (v: string) => void }) {
  const [text, setText] = useState(value);
  const [shown, setShown] = useState(value);
  if (shown !== value) {
    setShown(value);
    setText(value);
  }
  return (
    <FilterSection label={label} tight>
      <SearchField value={text} onValueChange={setText} onSearch={(v) => onSearch(v.trim())} placeholder={placeholder} aria-label={label} maxLength={maxLength} />
    </FilterSection>
  );
}

/** 공지사항 — 상단 고정 먼저, 나머지는 게시일 내림차순(api 순서 그대로). 제목 검색 · 구분 필터(#282). */
export function SupportNoticeList({ items, total, query, noticeTypes }: { items: SupportPost[]; total: number; query: SupportNoticeQuery; noticeTypes: EnumValue[] }) {
  const go = useGo(query);
  const bp = useCurrentBp().bpCodeId;
  const columns: Column<SupportPost>[] = [
    {
      header: "제목",
      align: "left",
      cell: (p) => (
        <span className="flex min-w-0 items-center gap-[6px]">
          {p.isPinned && <Tag>고정</Tag>}
          <Link href={bpPath(bp, `${SUPPORT_NOTICE_BASE}/${p.postId}`)} className="truncate text-erp-link hover:underline">
            {p.title}
          </Link>
        </span>
      ),
    },
    { header: "구분", width: "w-[120px]", cell: (p) => (p.noticeType ? labelOf(noticeTypes, p.noticeType) : "-") },
    { header: "게시일", width: "w-[140px]", cell: (p) => p.postedDate },
  ];
  return (
    <Frame
      query={query}
      total={total}
      filter={
        <FilterPanel onReset={() => go({ keyword: "", noticeType: "" })}>
          <Search label="제목" placeholder="제목으로 검색" value={query.keyword} maxLength={100} onSearch={(keyword) => go({ keyword })} />
          <Pick label="구분" name="notice-type" values={noticeTypes} value={query.noticeType} onPick={(v) => go({ noticeType: v as SupportNoticeQuery["noticeType"] })} last />
        </FilterPanel>
      }
    >
      <DataTable columns={columns} rows={items} rowKey={(p) => p.postId} empty="공지사항이 없습니다." />
    </Frame>
  );
}

/** FAQ — 카테고리 · 질문을 보이고 답변은 그 자리에서 펼친다(#283). 상세 화면은 없다. 본문은 평문이라 글자 그대로 보인다. */
export function SupportFaqList({ items, total, query }: { items: SupportPost[]; total: number; query: SupportFaqQuery }) {
  const go = useGo(query);
  const categories = useCodes("FAQ_CATEGORY");
  const categoryLabel = useCodeLabel("FAQ_CATEGORY");
  return (
    <Frame
      query={query}
      total={total}
      filter={
        <FilterPanel onReset={() => go({ keyword: "", faqCategoryCode: "" })}>
          <Search label="질문" placeholder="질문으로 검색" value={query.keyword} maxLength={100} onSearch={(keyword) => go({ keyword })} />
          <Pick label="카테고리" name="faq-category" values={categories} value={query.faqCategoryCode} onPick={(faqCategoryCode) => go({ faqCategoryCode })} last />
        </FilterPanel>
      }
    >
      {items.length === 0 ? (
        // DataTable 의 빈 줄과 같은 92px 한 줄(DESIGN.md 빈 상태).
        <p className="flex h-[92px] items-center justify-center border-y border-erp-thead-line text-[14px] text-erp-muted">{query.keyword || query.faqCategoryCode ? "찾는 FAQ 가 없습니다." : "FAQ 가 없습니다."}</p>
      ) : (
        <div className="border-t border-erp-thead-line">
          {items.map((f) => (
            <details key={f.postId} className="group border-b border-erp-thead-line">
              <summary className="flex h-[46px] cursor-pointer list-none items-center gap-[10px] px-[10px] text-[14px] text-erp-ink [&::-webkit-details-marker]:hidden">
                <span className="font-semibold text-erp-brand">Q</span>
                <span className="w-[96px] shrink-0 truncate text-erp-label">{f.faqCategoryCode ? categoryLabel(f.faqCategoryCode) : "-"}</span>
                <span className="flex-1 truncate">{f.title}</span>
                {/* chevron-small.svg 는 왼쪽을 본다 — 닫히면 아래, 펼치면 위(데모와 같다). */}
                <Image src="/icons/chevron-small.svg" alt="" width={5} height={8} className="-rotate-90 transition-transform duration-150 group-open:rotate-90 motion-reduce:transition-none" />
              </summary>
              <div className="flex gap-[10px] bg-erp-thead-bg px-[10px] py-[12px] text-[14px] leading-[1.6] text-erp-ink">
                <span className="font-semibold text-erp-label">A</span>
                <p className="flex-1 whitespace-pre-wrap break-keep">{f.body}</p>
              </div>
            </details>
          ))}
        </div>
      )}
    </Frame>
  );
}

/** 문의 상태 — 접수(off) · 처리중(꼬리표) · 답변완료(on). 고객지원은 답변 대기를 접수 하나로 본다(api ListSupportInquiriesDto). */
export function InquiryStatusBadge({ status, statuses }: { status: InquiryStatus; statuses: EnumValue[] }) {
  const label = labelOf(statuses, status);
  if (status === "ANSWERED") return <Badge tone="on">{label}</Badge>;
  if (status === "RECEIVED") return <Badge tone="off">{label}</Badge>;
  return <Tag>{label}</Tag>;
}

const day = (iso: string | null) => (iso ? formatDateTime(iso).slice(0, 10) : "-");

/** 문의하기 — 내가 올린 문의 목록과 등록 폼(오른쪽 패널)을 한 화면에(#284). 등록 버튼은 등록 권한이 있을 때만 — 막는 것은 api 다. */
export function MyInquiryList({ items, total, query, statuses }: { items: SupportInquiryListItem[]; total: number; query: SupportInquiryQuery; statuses: EnumValue[] }) {
  const go = useGo(query);
  const bp = useCurrentBp().bpCodeId;
  const can = usePagePermission();
  const categoryLabel = useCodeLabel("INQUIRY_CATEGORY");
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const columns: Column<SupportInquiryListItem>[] = [
    {
      header: "제목",
      align: "left",
      cell: (i) => (
        <Link href={bpPath(bp, `${SUPPORT_INQUIRY_BASE}/${i.inquiryId}`)} className="truncate text-erp-link hover:underline">
          {i.title}
        </Link>
      ),
    },
    { header: "분류", width: "w-[140px]", cell: (i) => categoryLabel(i.inquiryCategoryCode) },
    { header: "상태", width: "w-[110px]", cell: (i) => <InquiryStatusBadge status={i.status} statuses={statuses} /> },
    { header: "등록일", width: "w-[110px]", cell: (i) => day(i.createdAt) },
    { header: "답변일", width: "w-[110px]", cell: (i) => day(i.repliedAt) },
  ];
  return (
    <>
      <Frame
          query={query}
          total={total}
          filter={
            <FilterPanel onReset={() => go({ title: "", status: "" })}>
              <Search label="제목" placeholder="제목으로 검색" value={query.title} maxLength={200} onSearch={(title) => go({ title })} />
              <Pick label="상태" name="inquiry-status" values={statuses} value={query.status} onPick={(v) => go({ status: v as SupportInquiryQuery["status"] })} last />
            </FilterPanel>
          }
          action={
            can.create && (
              <Button ref={trigger} aria-controls="support-inquiry-new-panel" aria-expanded={open} onClick={() => setOpen(true)}>
                문의하기
              </Button>
            )
          }
        >
          <DataTable columns={columns} rows={items} rowKey={(i) => i.inquiryId} empty={query.title || query.status ? "찾는 문의가 없습니다." : "등록한 문의사항이 없습니다."} />
      </Frame>
      {can.create && <InquiryFormPanel id="support-inquiry-new-panel" open={open} onClose={() => setOpen(false)} trigger={trigger} />}
    </>
  );
}
