"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Badge, Button, DataTable, FilterPanel, FilterSection, ListToolbar, Pagination, Radio, SearchField, Select, Tag, type Column } from "@/components/common";
import { useCodeLabel } from "@/components/site/code-label";
import type { InquiryListItem, LeadListItem, PostListItem } from "@/lib/community";
import { INQUIRY_BASE, LEAD_BASE, POST_BASE, queryString, type InquiryQuery, type LeadQuery, type ListQuery, type PostKind, type PostQuery } from "@/lib/community-view";
import { labelOf, type EnumValue } from "@/lib/enums";
import { formatDateTime, formatPhone } from "@/lib/format";
import { formatAt } from "@/lib/notification-view";
import { PAGE_SIZES, type PageSize } from "@/lib/staff-members";

// 커뮤니티 관리 목록 넷(#275, 데모 src/community-sections.mjs). 헤더 커뮤니티관리 소메뉴마다 화면을 나눴다(2026-10-02 재영).
// 왼쪽 필터 + 목록. 조건 · 쪽 · 건수는 주소에만 둔다 — 새로 고쳐도, 링크를 나눠도 같은 화면이다.

type Query = ListQuery & Record<string, string | number>;

/** 조건을 바꾸면 주소만 바꾼다. 서버 화면이 그 주소로 다시 불러온다. */
function useGo<Q extends Query>(query: Q) {
  const router = useRouter();
  const path = usePathname();
  return (patch: Partial<Q>) => router.replace(`${path}${queryString({ ...query, page: 1, ...patch })}`, { scroll: false });
}

function Frame({
  query,
  total,
  filter,
  action,
  children,
}: {
  query: Query;
  total: number;
  filter: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  const go = useGo(query);
  return (
    <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
      {filter}
      <main className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px] [&>*]:shrink-0">
        <ListToolbar total={total}>
          {action}
          <div className="w-[80px] shrink-0">
            <Select aria-label="페이지당 건수" value={String(query.pageSize)} onChange={(e) => go({ pageSize: Number(e.target.value) as PageSize })}>
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </div>
        </ListToolbar>
        {children}
        <div className="pt-[14px]">
          <Pagination page={query.page} totalPages={Math.max(1, Math.ceil(total / query.pageSize))} onPageChange={(page) => go({ page })} />
        </div>
      </main>
    </div>
  );
}

/** 「전체」 + 값 하나씩 고르는 라디오 묶음. 고르는 즉시 건다. */
function Pick({ label, name, values, value, onPick, last }: { label: string; name: string; values: EnumValue[]; value: string; onPick: (v: string) => void; last?: boolean }) {
  return (
    <FilterSection label={label} last={last}>
      {[{ value: "", label: "전체" }, ...values].map((v) => (
        <Radio key={v.value} name={name} label={v.label} checked={value === v.value} onChange={() => onPick(v.value)} />
      ))}
    </FilterSection>
  );
}

const titleLink = (href: string, text: string) => (
  <Link href={href} className="truncate text-erp-link hover:underline">
    {text}
  </Link>
);

/** 최근 수정 — 「MM-DD HH:mm · 이름」(한국 시간). 수정자를 모르면 시각만. */
const updatedText = (at: string, name: string | null) => (name ? `${formatAt(at)} · ${name}` : formatAt(at));

/** 게시 상태 — 게시는 운영(on), 비공개는 미운영(off). 임시저장은 상태 색이 없어 꼬리표로 둔다(데모와 같다). */
function PostStatusCell({ status, statuses }: { status: PostListItem["status"]; statuses: EnumValue[] }) {
  const label = labelOf(statuses, status);
  if (status === "PUBLISHED") return <Badge tone="on">{label}</Badge>;
  if (status === "PRIVATE") return <Badge tone="off">{label}</Badge>;
  return <Tag>{label}</Tag>;
}

/** 답변 상태 — 답변 대기 = 접수 + 처리중(WHALEERP-332). */
function AnswerCell({ status, answers }: { status: InquiryListItem["status"]; answers: EnumValue[] }) {
  return status === "ANSWERED" ? <Badge tone="on">{labelOf(answers, "ANSWERED")}</Badge> : <Badge tone="off">{labelOf(answers, "WAITING")}</Badge>;
}

const STATE: Pick<Column<unknown>, "header" | "width"> = { header: "상태", width: "w-[110px]" };
const UPDATED: Pick<Column<unknown>, "header" | "width"> = { header: "최근 수정", width: "w-[200px]" };

/** 공지사항 · FAQ 목록. 최근 수정일 내림차순이고 고정 글을 위로 올리지 않는다 — 고정 글에는 「고정」 꼬리표만 붙인다(#275). */
export function PostList({
  kind,
  items,
  total,
  query,
  statuses,
  noticeTypes,
}: {
  kind: PostKind;
  items: PostListItem[];
  total: number;
  query: PostQuery;
  statuses: EnumValue[];
  noticeTypes: EnumValue[];
}) {
  const go = useGo(query);
  const faqLabel = useCodeLabel("FAQ_CATEGORY");
  const base = POST_BASE[kind];
  const notice = kind === "NOTICE";
  const columns: Column<PostListItem>[] = [
    {
      header: notice ? "제목" : "질문",
      align: "left",
      cell: (p) => (
        <span className="flex min-w-0 items-center gap-[6px]">
          {p.isPinned && <Tag>고정</Tag>}
          {titleLink(`${base}/${p.postId}`, p.title)}
        </span>
      ),
    },
    notice
      ? { header: "유형", width: "w-[120px]", cell: (p) => (p.noticeType ? labelOf(noticeTypes, p.noticeType) : "-") }
      : { header: "카테고리", width: "w-[160px]", cell: (p) => (p.faqCategoryCode ? faqLabel(p.faqCategoryCode) : "-") },
    { ...STATE, cell: (p) => <PostStatusCell status={p.status} statuses={statuses} /> },
    { ...UPDATED, cell: (p) => updatedText(p.updatedAt, p.updatedByName) },
  ];

  return (
    <Frame
      query={query}
      total={total}
      // api 는 게시 상태로만 거른다(WHALEERP-332).
      filter={
        <FilterPanel onReset={() => go({ status: "" })}>
          <Pick label="상태" name="post-status" values={statuses} value={query.status} onPick={(status) => go({ status: status as PostQuery["status"] })} last />
        </FilterPanel>
      }
      action={<Button href={`${base}/new`}>{notice ? "새 공지" : "새 FAQ"}</Button>}
    >
      <DataTable columns={columns} rows={items} rowKey={(p) => p.postId} empty={notice ? "공지사항이 없습니다." : "FAQ 가 없습니다."} />
    </Frame>
  );
}

/** 보낸 곳 — 「점포(점포 대상 문의가 아니면 BP) · 보낸 사람」 중 있는 것. */
const senderText = (i: InquiryListItem) => [i.storeName ?? i.bpName, i.senderName].filter(Boolean).join(" · ") || "-";

/** 문의사항 목록. 필터는 제목 · 보낸 곳(BP 이름 · 점포 이름 · 보낸 사람 이름) · 상태다(#275, 데모 front 5a0f586). */
export function InquiryList({ items, total, query, answers }: { items: InquiryListItem[]; total: number; query: InquiryQuery; answers: EnumValue[] }) {
  const go = useGo(query);
  const categoryLabel = useCodeLabel("INQUIRY_CATEGORY");
  const [title, setTitle] = useState(query.title);
  const [sender, setSender] = useState(query.sender);
  // 초기화 · 뒤로 가기로 주소의 검색어가 바뀌면 칸도 따라간다
  const [shown, setShown] = useState({ title: query.title, sender: query.sender });
  if (shown.title !== query.title || shown.sender !== query.sender) {
    setShown({ title: query.title, sender: query.sender });
    setTitle(query.title);
    setSender(query.sender);
  }

  const columns: Column<InquiryListItem>[] = [
    { header: "제목", align: "left", cell: (i) => titleLink(`${INQUIRY_BASE}/${i.inquiryId}`, i.title) },
    { header: "보낸 곳", width: "w-[220px]", cell: senderText },
    { header: "분류", width: "w-[140px]", cell: (i) => categoryLabel(i.inquiryCategoryCode) },
    { ...STATE, cell: (i) => <AnswerCell status={i.status} answers={answers} /> },
    { header: "접수", width: "w-[110px]", cell: (i) => formatDateTime(i.createdAt).slice(0, 10) },
  ];

  return (
    <Frame
      query={query}
      total={total}
      filter={
        <FilterPanel onReset={() => go({ title: "", sender: "", answerStatus: "" })}>
          <FilterSection label="제목" tight>
            <SearchField value={title} onValueChange={setTitle} onSearch={(v) => go({ title: v.trim() })} placeholder="제목으로 검색" aria-label="제목" maxLength={200} />
          </FilterSection>
          <FilterSection label="보낸 곳" tight>
            <SearchField value={sender} onValueChange={setSender} onSearch={(v) => go({ sender: v.trim() })} placeholder="BP·점포 또는 이름으로 검색" aria-label="보낸 곳" maxLength={100} />
          </FilterSection>
          <Pick label="상태" name="inquiry-status" values={answers} value={query.answerStatus} onPick={(v) => go({ answerStatus: v as InquiryQuery["answerStatus"] })} last />
        </FilterPanel>
      }
    >
      <DataTable columns={columns} rows={items} rowKey={(i) => i.inquiryId} empty="문의사항이 없습니다." />
    </Frame>
  );
}

/** 도입문의 목록. api 는 답변 상태로만 거른다(WHALEERP-332). 상호 · 운영 형태는 접수 때 받지 않는다(WHALEERP-288). */
export function LeadList({ items, total, query, answers, interests }: { items: LeadListItem[]; total: number; query: LeadQuery; answers: EnumValue[]; interests: EnumValue[] }) {
  const go = useGo(query);
  const industryLabel = useCodeLabel("INDUSTRY");
  const columns: Column<LeadListItem>[] = [
    { header: "문의자", align: "left", cell: (l) => titleLink(`${LEAD_BASE}/${l.leadId}`, `${l.contactName} · ${formatPhone(l.phone)}`) },
    // 업종이 기타면 직접 넣은 글자를 괄호로 붙인다.
    { header: "업종", width: "w-[160px]", cell: (l) => (l.industryDetail ? `${industryLabel(l.industryCode)} (${l.industryDetail})` : industryLabel(l.industryCode)) },
    { header: "관심 서비스", width: "w-[220px]", cell: (l) => l.interests.map((i) => labelOf(interests, i)).join(" · ") || "-" },
    { ...STATE, cell: (l) => <AnswerCell status={l.status} answers={answers} /> },
    { header: "접수", width: "w-[110px]", cell: (l) => formatDateTime(l.createdAt).slice(0, 10) },
  ];

  return (
    <Frame
      query={query}
      total={total}
      filter={
        <FilterPanel onReset={() => go({ answerStatus: "" })}>
          <Pick label="상태" name="lead-status" values={answers} value={query.answerStatus} onPick={(v) => go({ answerStatus: v as LeadQuery["answerStatus"] })} last />
        </FilterPanel>
      }
    >
      <DataTable columns={columns} rows={items} rowKey={(l) => l.leadId} empty="도입문의가 없습니다." />
    </Frame>
  );
}
