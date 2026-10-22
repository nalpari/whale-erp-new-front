import Link from "next/link";
import type { ReactNode } from "react";
import type { components } from "@/lib/api-types.generated";
import { pageWindow, sizeLabel } from "@/lib/community-view";
import { GuestButton, GuestPage } from "../guest-ui";
import { HOVER } from "../theme";
import { NoticesBoard } from "./notices-board";

// 공지사항 · FAQ(비로그인, #293 · #294)의 그리기. 디자인 샘플(design/guest/notices)과 실제 화면((public)/(site)/notices)이
// 같은 구현을 쓰고 글 · 링크만 다르게 넘긴다(guest-routes.ts 와 같은 방식). 모양은 데모 docs/demo/src/pages/home/notices.mjs · notice-detail.mjs.

type Schemas = components["schemas"];
type NoticeType = Schemas["NoticeType"];
type Post = Schemas["PublishedPostResponseDto"];
type Attachment = Schemas["PostAttachmentDto"];

// 구분 배지 색은 메인 「새로운 소식」과 같다. 고정 글은 남색 배지를 앞에 단다. 글자는 api enum(NoticeType)의 한글이다.
const BADGE_TONE: Record<NoticeType | "PINNED", string> = {
  PINNED: "bg-guest-navy text-white",
  GENERAL: "bg-[#f2f6ff] text-[#366fe3]",
  MAINTENANCE: "bg-[#e7f7f1] text-[#11b076]",
  FEATURE: "bg-guest-card text-guest-navy",
  TERMS: "bg-[#f5f5f5] text-guest-sub",
};

function Badge({ tone, children }: { tone: keyof typeof BADGE_TONE; children: ReactNode }) {
  return <span className={`flex h-[30px] shrink-0 items-center rounded-[3px] px-[10px] text-[15px] leading-[1.4] font-semibold ${BADGE_TONE[tone]}`}>{children}</span>;
}

function Badges({ post, typeLabel }: { post: Pick<Post, "isPinned" | "noticeType">; typeLabel: (type: NoticeType) => string }) {
  return (
    <>
      {post.isPinned && <Badge tone="PINNED">고정</Badge>}
      {post.noticeType && <Badge tone={post.noticeType}>{typeLabel(post.noticeType)}</Badge>}
    </>
  );
}

/** api 게시일(2026-09-05)을 시안 표기(2026.09.05)로. */
const dotDate = (date: string) => date.replaceAll("-", ".");

/** 빈 상태 · 불러오지 못함 — 목록 자리에 문장 하나와 버튼. */
export function GuestNote({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-[20px] border-b border-guest-list-line py-[80px] text-[17px] leading-[1.5] text-guest-sub">
      <p>{children}</p>
      {action}
    </div>
  );
}

/** 화면 틀 — 제목 줄 + 공지사항 · FAQ 탭. */
export function NoticesScreen({ inquiryHref, notices, faq }: { inquiryHref: string; notices: ReactNode; faq: ReactNode }) {
  return (
    <GuestPage>
      <section className="mx-auto flex w-[1200px] flex-col gap-[40px] pt-[80px] text-guest-ink">
        <div className="flex items-end justify-between gap-[24px]">
          <div className="flex flex-col gap-[8px]">
            <h1 className="text-[28px] leading-[1.2] font-bold">공지사항 · FAQ</h1>
            <p className="text-[16px] leading-[1.5]">로그인하지 않아도 볼 수 있는 글만 모았습니다.</p>
          </div>
          <GuestButton tone="outline" href={inquiryHref} arrow>
            도입문의
          </GuestButton>
        </div>
        <NoticesBoard notices={notices} faq={faq} />
      </section>
    </GuestPage>
  );
}

/** 공지사항 목록 — api 순서 그대로(상단 고정 먼저, 나머지는 게시일 내림차순). */
export function NoticeRows({ items, typeLabel, hrefOf }: { items: Post[]; typeLabel: (type: NoticeType) => string; hrefOf: (postId: number) => string }) {
  return (
    <ul className="text-[17px] leading-[1.5]">
      {items.map((n) => (
        <li key={n.postId} className="flex items-center gap-[12px] border-b border-guest-list-line px-[10px] py-[22px]">
          <Badges post={n} typeLabel={typeLabel} />
          <Link href={hrefOf(n.postId)} className={`flex-1 truncate text-guest-ink hover:text-guest-navy ${HOVER}`}>
            {n.title}
          </Link>
          <span className="text-guest-sub">{dotDate(n.postedDate)}</span>
        </li>
      ))}
    </ul>
  );
}

/** 페이지 번호 — 10개씩 묶고 앞 · 뒤 묶음으로 넘긴다. */
export function Pager({ page, total, pageSize, hrefOf }: { page: number; total: number; pageSize: number; hrefOf: (page: number) => string }) {
  const { pages, prev, next } = pageWindow(page, total, pageSize);
  const cell = `flex h-[36px] min-w-[36px] items-center justify-center rounded-[3px] px-[8px]`;
  const off = `${cell} text-guest-sub hover:text-guest-ink ${HOVER}`;
  return (
    <nav aria-label="페이지" className="flex justify-center gap-[6px] pt-[40px] text-[16px]">
      {prev && (
        <Link href={hrefOf(prev)} className={off}>
          이전
        </Link>
      )}
      {pages.map((n) => (
        <Link key={n} href={hrefOf(n)} aria-current={n === page ? "page" : undefined} className={n === page ? `${cell} bg-guest-navy font-semibold text-white` : off}>
          {n}
        </Link>
      ))}
      {next && (
        <Link href={hrefOf(next)} className={off}>
          다음
        </Link>
      )}
    </nav>
  );
}

/** 공지사항 상세. 비로그인 상세에는 이전 · 다음 글이 없다(api public-notices). 첨부는 누르면 내려받는다. */
export function NoticeDetail({
  notice: n,
  typeLabel,
  fileHref,
  listHref,
  alert,
}: {
  notice: Pick<Post, "isPinned" | "noticeType" | "title" | "postedDate" | "body"> & { attachments: Attachment[] };
  typeLabel: (type: NoticeType) => string;
  fileHref: (postAttachmentId: number) => string;
  listHref: string;
  alert?: string;
}) {
  return (
    <GuestPage>
      <section className="mx-auto flex w-[1200px] flex-col gap-[32px] pt-[80px] text-guest-ink">
        <div className="flex flex-col gap-[16px] border-b-2 border-guest-ink pb-[24px]">
          {(n.isPinned || n.noticeType) && (
            <div className="flex items-center gap-[8px]">
              <Badges post={n} typeLabel={typeLabel} />
            </div>
          )}
          <h1 className="text-[28px] leading-[1.4] font-bold">{n.title}</h1>
          <span className="text-[16px] text-guest-sub">{dotDate(n.postedDate)}</span>
        </div>
        {alert && (
          <p role="alert" className="text-[15px] text-[#e93737]">
            {alert}
          </p>
        )}
        {/* 본문은 평문이다 — HTML 로 그리지 않고 줄바꿈만 살린다. */}
        <p className="text-[17px] leading-[1.8] whitespace-pre-line break-keep">{n.body}</p>
        {n.attachments.length > 0 && (
          <ul aria-label="첨부파일" className="flex flex-col gap-[8px] rounded-[6px] bg-guest-card px-[24px] py-[18px] text-[16px] leading-[1.5]">
            {n.attachments.map((a) => (
              <li key={a.postAttachmentId} className="flex items-center gap-[10px]">
                {/* 서버가 누를 때마다 새 서명 주소를 받아 그리로 보낸다 — 받으면 원래 파일 이름으로 저장된다. */}
                <a href={fileHref(a.postAttachmentId)} className={`text-guest-navy underline underline-offset-[3px] hover:text-guest-ink ${HOVER}`}>
                  {a.fileName}
                </a>
                <span className="text-guest-sub">{sizeLabel(a.sizeBytes)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-center border-t border-[#ebebeb] pt-[40px]">
          <GuestButton tone="outline" href={listHref}>
            목록
          </GuestButton>
        </div>
      </section>
    </GuestPage>
  );
}
