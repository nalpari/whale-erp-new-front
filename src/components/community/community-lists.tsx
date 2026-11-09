"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Badge, Button, Checkbox, DataTable, FilterPanel, FilterSection, ListToolbar, Pagination, SearchField, Select, Tag, type Column } from "@/components/common";
import { useCodeLabel } from "@/components/site/code-label";
import { usePagePermission } from "@/components/site/session-gate";
import { WithIcon } from "@/app/platform-admins/admin-table";
import type { InquiryListItem, LeadListItem, PostListItem } from "@/lib/community";
import { INQUIRY_BASE, LEAD_BASE, POST_BASE, queryString, type InquiryQuery, type LeadQuery, type ListQuery, type PostKind, type PostQuery } from "@/lib/community-view";
import { labelOf, type EnumValue } from "@/lib/enums";
import { formatDateTime, formatPhone } from "@/lib/format";
import { PAGE_SIZES, type PageSize } from "@/lib/staff-members";

// 커뮤니티 관리 목록 넷(#275, 데모 src/community-sections.mjs). 헤더 커뮤니티관리 소메뉴마다 화면을 나눴다(2026-10-02 재영).
// 왼쪽 필터 + 목록. 조건 · 쪽 · 건수는 주소에만 둔다 — 새로 고쳐도, 링크를 나눠도 같은 화면이다.

type Query = ListQuery & Record<string, string | number | boolean | readonly string[]>;

/** 조건을 바꾸면 주소만 바꾼다. 서버 화면이 그 주소로 다시 불러온다. */
export function useGo<Q extends Query>(query: Q) {
  const router = useRouter();
  const path = usePathname();
  return (patch: Partial<Q>) => router.replace(`${path}${queryString({ ...query, page: 1, ...patch })}`, { scroll: false });
}

export function Frame({
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

/** 여러 값을 함께 고르는 체크박스 묶음. 고르는 즉시 건다. 아무것도 고르지 않으면 전체다(다른 목록과 같다, 2026-10-22 재영). */
/**
 * allWhenEmpty — 조건이 비었으면(= 전체) 모든 칸을 체크된 채 보인다(커뮤니티 관리 네 목록의 상태, 2026-11-06 사용자 지정). 다 체크하면 조건을 비우고(주소도 같다),
 * 다 풀 수도 있다 — 그때는 onPick(빈 배열, true)로 「아무것도 고르지 않음」을 알린다(none). 화면은 목록을 부르지 않고 0건으로 보인다.
 */
export function Checks<T extends string>({
  label,
  values,
  value,
  onPick,
  last,
  allWhenEmpty,
  none = false,
}: {
  label: string;
  values: EnumValue[];
  value: readonly T[];
  onPick: (next: T[], none?: boolean) => void;
  last?: boolean;
  allWhenEmpty?: boolean;
  none?: boolean;
}) {
  // 주소에는 있는데 목록에 없는 값(사용 중지한 FAQ 카테고리 · 옛 즐겨찾기)도 체크된 칸으로 보인다 — 숨은 조건으로 목록이 비지 않게.
  const shown = [...values, ...value.filter((v) => !values.some((x) => x.value === v)).map((v) => ({ value: v, label: `${v} (사용 중지)` }))];
  // 고른 순서가 아니라 보이는 순서로 둔다 — 같은 조건이면 주소도 같다.
  const all = shown.map((x) => x.value as T);
  const checked = none ? [] : allWhenEmpty && value.length === 0 ? all : value;
  const toggle = (v: string, on: boolean) => {
    const next = all.filter((x) => (x === v ? on : checked.includes(x)));
    if (!allWhenEmpty) return onPick(next);
    if (next.length === 0) return onPick([], true);
    onPick(next.length === all.length ? [] : next, false);
  };
  return (
    <FilterSection label={label} last={last}>
      {shown.map((v) => (
        <Checkbox key={v.value} label={v.label} checked={checked.includes(v.value as T)} onChange={(e) => toggle(v.value, e.target.checked)} />
      ))}
    </FilterSection>
  );
}

/**
 * 상단 고정 글 표시 — 「고정」 꼬리표 대신 회청 동그라미 안 압정 아이콘(20px). 제목과는 10px 띄운다.
 * 화면 읽기 도구에는 「고정」으로 읽힌다(2026-11-06 사용자 지정).
 * 관리자 커뮤니티 관리 · 고객지원 공지사항 목록이 같이 쓴다.
 */
export function PinIcon() {
  return (
    <svg role="img" aria-label="고정" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-erp-brand">
      <title>고정</title>
      <circle cx="12" cy="12" r="10.5" />
      <path d="M13.6 6.6 17.4 10.4 15.4 11.4 13.4 14.2 13.9 16.2 7.8 10.1 9.8 10.6 12.6 8.6Z" fill="currentColor" fillOpacity="0.15" />
      <path d="M10.4 13.6 7 17" />
    </svg>
  );
}

const titleLink = (href: string, text: string) => (
  <Link href={href} className="truncate text-erp-link hover:underline">
    {text}
  </Link>
);

/** 최종수정 — 「YYYY-MM-DD HH:mm · 이름」(한국 시간, 2026-11-06 사용자 지정 — 전엔 연도 없이 「MM-DD HH:mm」). 수정자를 모르면 시각만. */
const updatedText = (at: string, name: string | null) => (name ? `${formatDateTime(at)} · ${name}` : formatDateTime(at));

/**
 * 게시 상태 — 사용자에게 보이는 게시만 파랑 배지, 보이지 않는 임시저장 · 비공개는 회색 꼬리표(글자로 가른다).
 * 커뮤니티 관리에서 빨강은 할 일(답변대기) 하나만 뜻하게 둔다(2026-11-06 사용자 지정 — 전엔 비공개가 빨강 배지).
 */
function PostStatusCell({ status, statuses }: { status: PostListItem["status"]; statuses: EnumValue[] }) {
  const label = labelOf(statuses, status);
  return status === "PUBLISHED" ? <Badge tone="on">{label}</Badge> : <Tag>{label}</Tag>;
}

/**
 * 답변 상태 — 답변 대기 = 접수 + 처리중(WHALEERP-332). 답변완료는 끝난 일이라 회색 꼬리표(Tag), 처리할 답변대기만 빨간 배지로 눈에 띄게 둔다
 * (2026-11-06 사용자 지정 — 전엔 답변완료가 파란 배지).
 */
function AnswerCell({ status, answers }: { status: InquiryListItem["status"]; answers: EnumValue[] }) {
  return status === "ANSWERED" ? <Tag>{labelOf(answers, "ANSWERED")}</Tag> : <Badge tone="off">{labelOf(answers, "WAITING")}</Badge>;
}

const STATE: Pick<Column<unknown>, "header" | "width"> = { header: "상태", width: "w-[110px]" };
const UPDATED: Pick<Column<unknown>, "header" | "width"> = { header: "최종수정", width: "w-[240px]" };

/**
 * 화면명 줄(PageBar) 오른쪽 끝 등록 버튼 — 「공지사항 등록」 · 「FAQ 등록」(2026-11-06 사용자 지정 — 전엔 목록 위 도구 줄의 [새 공지] · [새 FAQ]).
 * 등록 권한이 없으면 두지 않는다 — 막는 것은 api(create)다.
 */
export function PostCreateButton({ kind }: { kind: PostKind }) {
  const can = usePagePermission();
  if (!can.create) return null;
  return <Button href={`${POST_BASE[kind]}/new`}>{kind === "NOTICE" ? "공지사항 등록" : "FAQ 등록"}</Button>;
}

/** 공지사항 · FAQ 목록. 최종수정일 내림차순이고 고정 글을 위로 올리지 않는다 — 고정 글에는 「고정」 꼬리표만 붙인다(#275). */
export function PostList({
  kind,
  items,
  total,
  query,
  statuses,
  noticeTypes,
  emptyAll = false,
}: {
  kind: PostKind;
  items: PostListItem[];
  total: number;
  query: PostQuery;
  statuses: EnumValue[];
  noticeTypes: EnumValue[];
  /** 0건일 때 아예 없음(「등록된 …」)인가 — 아니면 「조건에 맞는 …」 */
  emptyAll?: boolean;
}) {
  const go = useGo(query);
  const faqLabel = useCodeLabel("FAQ_CATEGORY");
  const base = POST_BASE[kind];
  const notice = kind === "NOTICE";
  const titleColumn: Column<PostListItem> = {
    header: notice ? "제목" : "질문",
    align: "left",
    cell: (p) => (
      <span className="flex min-w-0 items-center gap-[10px]">
        {p.isPinned && <PinIcon />}
        {titleLink(`${base}/${p.postId}`, p.title)}
      </span>
    ),
  };
  const kindColumn: Column<PostListItem> = notice
    ? { header: "유형", width: "w-[120px]", cell: (p) => (p.noticeType ? labelOf(noticeTypes, p.noticeType) : "-") }
    : { header: "카테고리", width: "w-[160px]", cell: (p) => (p.faqCategoryCode ? faqLabel(p.faqCategoryCode) : "-") };
  // 공지사항은 상태 · 유형 · 제목, FAQ 는 상태 · 카테고리 · 질문 순 — 분류가 제목 앞(2026-11-06 사용자 지정 — 전엔 제목/질문 · 유형/카테고리 · 상태)
  const columns: Column<PostListItem>[] = [
    // 상태를 맨 앞에 — 문의사항 · 도입문의 목록과 같다(2026-11-06 사용자 지정)
    { ...STATE, cell: (p) => <PostStatusCell status={p.status} statuses={statuses} /> },
    kindColumn,
    titleColumn,
    { ...UPDATED, cell: (p) => updatedText(p.updatedAt, p.updatedByName) },
  ];

  return (
    <Frame
      query={query}
      total={total}
      // api 는 게시 상태로만 거른다(WHALEERP-332).
      filter={
        <FilterPanel onReset={() => go({ status: [], none: false })}>
          <Checks label="상태" values={statuses} value={query.status} none={query.none} onPick={(status, none = false) => go({ status, none })} last allWhenEmpty />
        </FilterPanel>
      }
    >
      <DataTable columns={columns} rows={items} rowKey={(p) => p.postId} empty={`${emptyAll ? "등록된" : "조건에 맞는"} ${notice ? "공지사항이" : "FAQ가"} 없습니다.`} fillEmpty />
    </Frame>
  );
}

/** 문의자(2026-11-05 사용자 지정 — 전엔 「보낸 곳」) — 「점포(점포 대상 문의가 아니면 BP) · 보낸 사람」 중 있는 것. */
/** 문의사항 목록. 필터는 제목 · 보낸 곳(BP 이름 · 점포 이름 · 보낸 사람 이름) · 상태다(#275, 데모 front 5a0f586). */
export function InquiryList({ items, total, query, answers, emptyAll = false }: { items: InquiryListItem[]; total: number; query: InquiryQuery; answers: EnumValue[]; emptyAll?: boolean }) {
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
    // 열 순서는 상태 · 분류 · 제목 · 문의자 · BP상호명 · 접수(2026-11-06 사용자 지정 — 도입문의 목록처럼 상태를 맨 앞으로. 전엔 분류 · 제목 · 문의자 · 상태 · 접수)
    { ...STATE, cell: (i) => <AnswerCell status={i.status} answers={answers} /> },
    { header: "분류", width: "w-[160px]", cell: (i) => categoryLabel(i.inquiryCategoryCode) },
    // 제목은 넓지 않게 정한 폭(400), 문의자는 이름 · BP상호명 두 열로 나눈다(2026-11-06 사용자 지정 — 전엔 제목이 남는 폭, 문의자 한 열 「점포 또는 BP · 이름」 300).
    // 모든 열이 정한 폭이라 남는 폭은 같은 비율로 나눠 늘어난다
    { header: "제목", width: "w-[400px]", align: "left", cell: (i) => titleLink(`${INQUIRY_BASE}/${i.inquiryId}`, i.title) },
    // 이름이 비었으면 탈퇴한 회원(탈퇴가 이름 · 연락처를 비운다) — 「-」 대신 회색으로 알린다(2026-11-06 사용자 지정)
    { header: "문의자", width: "w-[160px]", cell: (i) => i.senderName || <span className="text-erp-muted">탈퇴한 회원</span> },
    { header: "BP상호명", width: "w-[240px]", cell: (i) => i.bpName ?? "-" },
    { header: "접수", width: "w-[110px]", cell: (i) => formatDateTime(i.createdAt).slice(0, 10) },
  ];

  return (
    <Frame
      query={query}
      total={total}
      filter={
        <FilterPanel onReset={() => go({ title: "", sender: "", answerStatus: [], none: false })}>
          <FilterSection label="제목" tight>
            <SearchField value={title} onValueChange={setTitle} onSearch={(v) => go({ title: v.trim() })} placeholder="제목으로 검색" aria-label="제목" maxLength={200} />
          </FilterSection>
          <FilterSection label="문의자" tight>
            <SearchField value={sender} onValueChange={setSender} onSearch={(v) => go({ sender: v.trim() })} placeholder="BP·점포 또는 이름으로 검색" aria-label="문의자" maxLength={100} />
          </FilterSection>
          <Checks label="상태" values={answers} value={query.answerStatus} none={query.none} onPick={(answerStatus, none = false) => go({ answerStatus, none })} last allWhenEmpty />
        </FilterPanel>
      }
    >
      <DataTable columns={columns} rows={items} rowKey={(i) => i.inquiryId} empty={`${emptyAll ? "등록된" : "조건에 맞는"} 문의사항이 없습니다.`} fillEmpty />
    </Frame>
  );
}

/** 도입문의 목록. api 는 답변 상태로만 거른다(WHALEERP-332). 상호 · 운영 형태는 접수 때 받지 않는다(WHALEERP-288). */
export function LeadList({ items, total, query, answers, interests, emptyAll = false }: { items: LeadListItem[]; total: number; query: LeadQuery; answers: EnumValue[]; interests: EnumValue[]; emptyAll?: boolean }) {
  const go = useGo(query);
  const industryLabel = useCodeLabel("INDUSTRY");
  // 상태를 맨 앞에, 문의자(이름, 상세 링크) · 연락처(전화기 동그라미 아이콘, 직원 목록 휴대전화번호와 같은 모양) 두 열로 나눈다(2026-11-06 사용자 지정 — 전엔 「이름 · 번호」 한 열, 상태는 끝에서 둘째)
  const columns: Column<LeadListItem>[] = [
    { ...STATE, cell: (l) => <AnswerCell status={l.status} answers={answers} /> },
    { header: "문의자", width: "w-[200px]", cell: (l) => titleLink(`${LEAD_BASE}/${l.leadId}`, l.contactName) },
    { header: "연락처", width: "w-[220px]", cell: (l) => <WithIcon icon="phone">{formatPhone(l.phone)}</WithIcon> },
    // 업종이 기타면 직접 넣은 글자를 괄호로 붙인다.
    { header: "업종", width: "w-[220px]", cell: (l) => (l.industryDetail ? `${industryLabel(l.industryCode)} (${l.industryDetail})` : industryLabel(l.industryCode)) },
    // 문의자 · 연락처 · 업종 · 관심 서비스는 비슷한 폭(200 · 220 · 220 · 220) — 모두 정한 폭이라 남는 폭은 열마다 같은 비율로 나눠 늘어난다(2026-11-06 사용자 지정)
    { header: "관심 서비스", width: "w-[220px]", cell: (l) => l.interests.map((i) => labelOf(interests, i)).join(" · ") || "-" },
    { header: "접수", width: "w-[110px]", cell: (l) => formatDateTime(l.createdAt).slice(0, 10) },
  ];

  return (
    <Frame
      query={query}
      total={total}
      filter={
        <FilterPanel onReset={() => go({ answerStatus: [], none: false })}>
          <Checks label="상태" values={answers} value={query.answerStatus} none={query.none} onPick={(answerStatus, none = false) => go({ answerStatus, none })} last allWhenEmpty />
        </FilterPanel>
      }
    >
      <DataTable columns={columns} rows={items} rowKey={(l) => l.leadId} empty={`${emptyAll ? "등록된" : "조건에 맞는"} 도입문의가 없습니다.`} fillEmpty />
    </Frame>
  );
}
