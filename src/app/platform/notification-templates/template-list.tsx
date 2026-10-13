"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Badge, Button, DataTable, ListToolbar, Pagination, Select, Tag, type Column } from "@/components/common";
import { isTeam1Mail, recipientLabel, updatedLabel, type TemplateQuery } from "@/lib/notification-template-view";
import type { TemplateListItem } from "@/lib/notification-templates";
import { PAGE_SIZES } from "@/lib/staff-members";

const BASE = "/platform/notification-templates";

// 사용 안 함 줄은 흐리게(데모 templates.mjs 의 dim). 공통 표는 줄 모양을 받지 않아 칸 안을 흐린다.
const cellOf = (t: TemplateListItem, node: ReactNode) => (t.isActive ? node : <span className="opacity-50">{node}</span>);

// 알림 템플릿 목록 한 채널. 줄 이름을 누르면 수정 화면으로 간다. 알림톡 탭은 받는 사람 · 제목 대신 카카오 템플릿 코드 · 본문 요약.
export function TemplateList({ items, total, query, totalPages }: { items: TemplateListItem[]; total: number; query: TemplateQuery; totalPages: number }) {
  const router = useRouter();

  const go = (next: TemplateQuery) => {
    const params = new URLSearchParams({ channel: next.channel });
    if (next.page !== 1) params.set("page", String(next.page));
    if (next.pageSize !== 20) params.set("pageSize", String(next.pageSize));
    router.replace(`${BASE}?${params}`, { scroll: false });
  };

  const talk = query.channel === "ALIMTALK";
  const column = (header: string, width: Column<TemplateListItem>["width"], cell: (t: TemplateListItem) => ReactNode, align?: "left"): Column<TemplateListItem> => ({
    header,
    width,
    align,
    cell: (t) => cellOf(t, cell(t)),
  });
  const columns: Column<TemplateListItem>[] = [
    column("템플릿 이름", "w-[260px]", (t) => (
      <span className="flex items-center justify-center gap-[6px]">
        <Link href={`${BASE}/${t.id}`} className="truncate text-erp-link hover:underline">
          {t.templateName}
        </Link>
        {isTeam1Mail(t.templateCode) && <Tag>1팀</Tag>}
      </span>
    )),
    column("템플릿 코드", "w-[280px]", (t) => <span className="font-mono text-[13px]">{t.templateCode}</span>),
    ...(talk
      ? [
          column("카카오 템플릿 코드", "w-[220px]", (t) => <span className="font-mono text-[13px]">{t.kakaoTemplateCode ?? "-"}</span>),
          column("본문 요약", undefined, (t) => t.bodySummary, "left"),
        ]
      : [column("받는 사람", "w-[220px]", (t) => recipientLabel(t.channel)), column("제목", undefined, (t) => t.title ?? "-", "left")]),
    column("최근 수정", "w-[170px]", (t) => <span className={t.updatedByName === null ? "text-erp-muted" : ""}>{updatedLabel(t.updatedByName, t.updatedAt)}</span>),
    // 사용 여부는 흐리게 하지 않는다 — 배지 색이 이미 말한다.
    { header: "사용 여부", width: "w-[100px]", cell: (t) => (t.isActive ? <Badge tone="on">사용</Badge> : <Badge tone="off">사용 안 함</Badge>) },
  ];

  return (
    <>
      <ListToolbar total={total}>
        <Button href={`${BASE}/new`}>등록</Button>
        <div className="w-[80px] shrink-0">
          <Select
            aria-label="페이지당 건수"
            value={String(query.pageSize)}
            onChange={(e) => go({ ...query, page: 1, pageSize: Number(e.target.value) as TemplateQuery["pageSize"] })}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </div>
      </ListToolbar>
      <DataTable columns={columns} rows={items} rowKey={(t) => t.id} empty="이 채널의 템플릿이 없습니다." />
      <div className="pt-[14px]">
        <Pagination page={query.page} totalPages={totalPages} onPageChange={(page) => go({ ...query, page })} />
      </div>
    </>
  );
}
