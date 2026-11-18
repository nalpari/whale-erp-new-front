"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Button, LoadGroup, LoadingNotice, PageBar, Tag } from "@/components/common";
import { useAccount, useCurrentBp, useMenus, useScope, useService, useStores } from "@/components/site/session-gate";
import { bff } from "@/lib/bff";
import { bpPath } from "@/lib/bp-path";
import type { SupportPostList } from "@/lib/community";
import { labelOf, type EnumValue } from "@/lib/enums";
import { HOME, menuOfPath } from "@/lib/menus";
import { kstToday } from "@/lib/staff-members";
import { storeOptionLabel, withScope } from "@/lib/store-scope";
import { isPlatformRole } from "@/lib/auth-routes";
import { useApi, useLoad } from "@/lib/use-load";
import { DEFAULT_TODO_LIST_QUERY, toTodoListSearch } from "../todos/todo-list-query";
import type { DailyAttendance } from "@/lib/attendance-records-api";
import type { TodoListResponse } from "@/lib/todos-api";
import { homeSearchOf, latestNotices, NOTICES_PATH, pendingLineOf, storeCountsOf, type HomePending, type HomeSummary } from "./home-view";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** 홈 「기준」 시각 — 한국 시간 2026-11-12(목) 13:07. 연도 · 요일까지 보인다(2026-11-12 사용자 지정, 전엔 알림과 같은 11-12 13:07) */
function formatAsOf(iso: string): string {
  const kst = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  const at = kst.toISOString();
  return `${at.slice(0, 10)}(${WEEKDAYS[kst.getUTCDay()]}) ${at.slice(11, 16)}`;
}

const CARD = "rounded-[4px] border border-erp-panel-line bg-white";
/**
 * 홈의 이동 버튼(공지 목록 · 점포 목록 · 직원 목록 · 출퇴근 현황 · TO-DO 목록 · 문의하기) — 모두 이 한 모양이다. 글자 없이 꺾쇠 아이콘만 두고, 26px 칸은 처음부터 회색 바탕
 * (전엔 호버 때만 — 그 모양이 더 나아 처음부터 쓴다, 2026-11-18 사용자 지정). 호버하면 흰 바탕 · 회청 테두리(Outline 버튼과 같은 방식). 
 * 숫자가 많은 화면이라 글자 버튼 여섯 개가 정신없었다(2026-11-18 사용자 지정). 툴팁도 두지 않는다 — 어디로 가는지는 카드 제목이 말하고, 화면 읽기 도구는 aria-label 로 읽는다
 */
function MoveLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={label} className="grid size-[26px] shrink-0 place-items-center rounded-[2px] border border-erp-subtle bg-erp-subtle transition-colors duration-150 ease-out hover:border-erp-brand hover:bg-white">
      <Image src="/icons/chevron-small.svg" alt="" width={5} height={8} className="rotate-180" />
    </Link>
  );
}

/** 카드 전체가 링크일 때의 꺾쇠 표시 — 이동 버튼과 같은 모양이고, 카드에 마우스를 올리면 함께 흰 바탕 · 회청 테두리로 바뀐다 */
const Chevron = () => (
  <span
    aria-hidden
    className="grid size-[26px] shrink-0 place-items-center rounded-[2px] border border-erp-subtle bg-erp-subtle transition-colors duration-150 ease-out group-hover:border-erp-brand group-hover:bg-white"
  >
    <Image src="/icons/chevron-small.svg" alt="" width={5} height={8} className="rotate-180" />
  </span>
);
/** 링크 카드 — 누르면 이동, 마우스를 올리면 테두리가 회청(예전 홈 수치 카드와 같다, 2026-11-18 사용자 지정) */
const LINK_CARD = "group transition-[border-color] duration-150 ease-out hover:border-erp-brand";

// 로그인 후 홈(WHALEERP-307~310 · 665, 운영 정책 HOM-03~10). 업무 범위와 역할에 상관없이 한 틀이다 — 점포를 하나 고르거나 가맹마스터 ·
// 가맹관리자여도 같은 틀에 그 점포 값만 남는다(예전 「점포 하나 화면」은 없앴다, HOM-05). 위에서부터 공지 띠, 수치 카드, 점포별 현황과 확인 필요.
// 업무 범위는 헤더 범위 선택기다. 홈은 메뉴가 아니라 헤더가 이동시키지 않으므로 이 화면이 범위를 보고 다시 부른다.
// 영역(공지 · 현황 · 확인 필요)은 LoadGroup 으로 묶어 처음 들어올 때와 업무 범위 · 탭 BP 를 바꿀 때 모두 받은 뒤 한 번에 보인다
// (범위가 바뀌면 화면 전체가 다른 데이터라서 key 로 묶음을 다시 건다). 새로고침 · 영역 다시 하기는 묶지 않는다(그 영역만).
export function HomeScreen() {
  const account = useAccount();
  const currentBp = useCurrentBp();
  const bp = currentBp.bpCodeId;
  const service = useService();
  const [scope] = useScope();
  // 「안녕하세요, OOO님」 — 모든 계정 「님」(2026-11-04 사용자 지정, 「OOO 대표님, 오늘의 현황입니다」를 거쳐 되돌렸다). 문장 제목이라 18px(PageBar sentence)
  // 「안녕하세요,」는 먹색 400, 「OOO님」은 먹색 600 — 글자색은 같게 두고 굵기로만 이름에 무게를 준다(2026-11-13 사용자 지정, 전엔 「안녕하세요,」가 회색 erp-label 이라 흐려 보였다)
  const greeting: ReactNode = account.name ? (
    <>
      <span className="font-normal">안녕하세요,</span> {account.name}님
      {/* 플랫폼 계정이 BP 를 골라 웨일ERP 탭에 들어왔으면 어느 BP 의 화면인지 인사 옆 회색 한 줄로 알린다(2026-11-05 사용자 지정) */}
      {isPlatformRole(account.roleTypeCode) && service === "WHALE_ERP" && (
        // BP 는 회색 꼬리표(Tag) — BP 마스터 수정 패널 제목의 「BP 코드 · …」 꼬리표와 같은 모양(2026-11-05 사용자 지정)
        <span className="ml-[12px] inline-flex items-center gap-[6px] align-middle text-[14px] font-normal text-erp-label">
          <Tag>
            {currentBp.tradeName} · {currentBp.bpCode}
          </Tag>
          의 홈화면을 보고 있습니다.
        </span>
      )}
    </>
  ) : (
    "안녕하세요"
  );
  return (
    <LoadGroup
      key={`${bp}|${JSON.stringify(scope)}`}
      fallback={
        <>
          <PageBar title={greeting} titleSize="sentence" />
          <div className="flex min-h-0 flex-1 flex-col">
            <LoadingNotice />
          </div>
        </>
      }
    >
      <HomeBody greeting={greeting} />
    </LoadGroup>
  );
}

function HomeBody({ greeting }: { greeting: ReactNode }) {
  const account = useAccount();
  const bp = useCurrentBp().bpCodeId;
  // 플랫폼 계정은 BP 를 골라 웨일ERP 탭에 오면 BP 마스터와 같은 홈이고(WHALEERP-667, 운영 정책 HOM-07 v280), 플랫폼 탭이면 안내만 본다
  const service = useService();
  const platformTab = isPlatformRole(account.roleTypeCode) && service !== "WHALE_ERP";
  const stores = useStores();
  const [scope] = useScope();
  const [reloads, setReloads] = useState(0);
  const search = homeSearchOf(scope, stores);
  const key = `${search}#${reloads}`;
  // 점포가 없는 BP 계정 — 범위가 「전체」라 search 가 "" 여도 여러 점포 화면이 아니라 값 0 화면(아래 !stores.length 분기)이다.
  // 그래도 현황 · 처리 대기는 점포 없이 부른다 — 내 문의 · 문의 답변 완료처럼 점포와 상관없는 값이 있다. api 는 관리 점포(없음) 안에서만 세서
  // 점포 쪽 값은 0, 문의 쪽은 그대로 온다(api home.service contextOf, 리뷰 반영)
  const noStores = !platformTab && stores.length === 0;
  const many = search !== null && !noStores && !platformTab;
  // 홈은 /bp/{id} 주소가 아니라 탭 BP 를 직접 싣는다 — 플랫폼 계정은 api 가 이 BP 의 점포 전체로 센다(BP · 가맹 계정은 api 가 보지 않는다)
  const summary = useApi<HomeSummary>(many ? `/home/summary${search}` : noStores ? "/home/summary" : null, key, "현황", bp);
  const pending = useApi<HomePending>(many ? `/home/pending${search}` : noStores ? "/home/pending" : null, key, "확인 필요", bp);

  const menus = useMenus();
  const canOpen = (path: string) => menuOfPath(menus, path, service) !== null;
  // 공지 띠 — 공지사항 조회 권한이 있을 때만. 플랫폼 탭 · 쓸 수 없는 범위에서는 부르지 않는다. 탭 BP 를 실어 플랫폼 계정은 그 BP 의 BP 마스터와 같은 공지를 본다(HOM-07 v281)
  const showsNotices = (many || noStores) && canOpen("/support-notices");
  const notices = useLoad(showsNotices ? () => Promise.all([bff<SupportPostList>(NOTICES_PATH, bp), enumOf("NoticeType")]) : null, key, "공지사항");

  // 오늘 출근 칸의 정상 · 지각 · 미출근 · 출근 전 — 출퇴근 현황 일별 api 를 그대로 부른다(api 수정 없음). 출퇴근 현황 조회 권한이 있을 때만
  const showsDaily = (many || noStores) && canOpen("/attendance-records");
  const daily = useLoad(
    showsDaily && many ? () => bff<DailyAttendance>(`/attendance-records/daily${search}${search ? "&" : "?"}date=${kstToday()}`, bp) : null,
    key,
    "오늘 근무자",
  );

  // 오늘 TO-DO 의 대기 · 진행 중 · 완료 — 현황 api 는 완료 / 전체만 주므로 TO-DO 목록 api(오늘 수행예정, 묶음은 한 줄 · 묶음 상태)로 센다(api 수정 없음, 2026-11-18 사용자 지정)
  const todayTodos = useApi<TodoListResponse>(
    many && canOpen("/todos") ? `/todos?page=1&pageSize=${TODO_COUNT_MAX}&dueDateFrom=${kstToday()}&dueDateTo=${kstToday()}${search ? `&${search.slice(1)}` : ""}` : null,
    key,
    "오늘 TO-DO",
    bp,
  );

  const s = summary && "data" in summary ? summary.data : null;
  const p = pending && "data" in pending ? pending.data : null;
  const asOf = s?.asOf ?? p?.asOf;
  // 플랫폼 탭은 로그인 정보의 역할 · 탭 서비스로 먼저 가른다 — api 를 부르지 않아 응답의 platform 을 받지 못한다
  const platform = platformTab || s?.platform || p?.platform;

  let body: ReactNode;
  if (platform) {
    // BP 를 고르지 않은 플랫폼 계정(플랫폼 탭)은 현황 없이 안내만(2026-10-27 재영 · HOME-8). Platform 콘솔은 헤더 바로가기처럼 새 탭으로 연다
    body = (
      <Notice text="플랫폼 계정은 홈 현황을 보지 않습니다. BP 의 업무는 각 메뉴에서, 플랫폼 운영은 Platform 콘솔에서 합니다.">
        <Button href={HOME.PLATFORM} target="_blank" rel="noopener">
          Platform 콘솔
        </Button>
      </Notice>
    );
  } else if (search === null && !noStores) {
    // 범위에 드는 점포가 이 탭에 없다(다른 BP 탭에서 복사한 범위 등) — 쿼리를 빼면 BP 전체가 보이므로 부르지 않는다
    body = <Notice text="상단 범위에 해당하는 점포가 이 탭에 없습니다. 상단에서 범위를 다시 선택하세요." />;
  } else {
    // 점포가 없는 BP 도 같은 틀이다 — 안내는 메뉴 줄 아래 띠(NoStoreBand)가 맡고, 점포 쪽 카드는 0 으로 채운다(그 메뉴의 조회 권한이 없으면 숨긴다).
    // 내 문의와 확인 필요는 점포 없이 받은 실제 값을 쓴다(위 noStores, HOME-4)
    const failed = (what: string, error: string) => <Notice text={`${what} 불러오지 못했습니다. ${error}`} />;
    const cards = noStores ? { ...emptyCardsOf(canOpen), myInquiries: s?.cards?.myInquiries ?? null } : s?.cards;
    body = (
      <>
        {showsNotices && <NoticeBand section={notices} bp={bp} />}
        {cards && <Cards cards={cards} storeCounts={storeCountsOf(scope, stores)} daily={daily} todos={todayTodos && "data" in todayTodos ? todayTodos.data : null} scopeHref={(href) => withScope(href, scope)} canOpen={canOpen} bp={bp} />}
        {/* 아래 두 칸 — 왼쪽 운영 점포별 현황, 오른쪽 확인 필요 · 내 문의(2026-11-18 사용자 지정 — 오늘 근무자 표를 두었다가 점포별 현황으로 되돌렸다).
            창 1600 이상은 7:5, 좁으면 2:1. 두 칸 높이는 늘 같다(items-stretch) */}
        <div className="grid min-h-[440px] flex-1 grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-stretch gap-[12px] min-[1600px]:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          {noStores ? (
            <StoreTable table={{ total: 0, items: [] }} />
          ) : !summary ? (
            <Notice text="현황을 불러오는 중입니다." />
          ) : "error" in summary ? (
            failed("현황을", summary.error)
          ) : (
            <StoreTable table={summary.data.storeTable} />
          )}
          <div className="flex min-h-0 flex-col gap-[12px]">
            {!pending ? <Notice text="확인 필요를 불러오는 중입니다." /> : "error" in pending ? failed("확인 필요를", pending.error) : <Pending data={pending.data} bp={bp} />}
            {cards?.myInquiries && <MyInquiries inquiries={cards.myInquiries} href={canOpen("/support-inquiries") ? bpPath(bp, "/support-inquiries") : null} />}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageBar title={greeting} titleSize="sentence">
        <div className="flex items-center gap-[10px]">
          {asOf && <span className="text-[13px] text-erp-label">{formatAsOf(asOf)} 기준</span>}
          <button
            type="button"
            aria-label="다시 불러오기"
            disabled={many && (!summary || !pending)}
            onClick={() => setReloads((n) => n + 1)}
            className="grid h-[34px] w-[34px] place-items-center rounded-[2px] border border-erp-button-line bg-white transition-[border-color] duration-150 ease-out hover:border-erp-brand disabled:opacity-40"
          >
            <Image src="/icons/reset.svg" alt="" width={14} height={14} />
          </button>
        </div>
      </PageBar>
      {/* 공지 · 카드 · 아래 두 칸 사이와 화면 여백을 모두 12px 로 — 상자 사이 간격(12)과 여백이 달라 보였다(2026-11-18 사용자 지정, 홈만 화면 여백 24 의 예외) */}
      <div className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto p-[12px]">{body}</div>
    </>
  );
}

function Notice({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <div className={`${CARD} flex items-center gap-[12px] px-[24px] py-[18px]`}>
      <p className="flex-1 text-[14px] text-erp-muted">{text}</p>
      {children}
    </div>
  );
}

/** 목록 api 의 enum 한글 — 받지 못하면 값을 그대로 보인다(공지 띠를 막지 않는다) */
const enumOf = (name: string) => bff<{ enums: Record<string, EnumValue[]> }>(`/enums/${name}`).then((r) => r.enums[name] ?? [], () => []);

// 공지 띠 — 게시일 최신 3건(HOM-05, 예전 점포 하나 화면의 공지 영역을 옮겼다). 실패하면 그 띠만 오류와 [다시 시도]다
function NoticeBand({ section, bp }: { section: ReturnType<typeof useLoad<[SupportPostList, EnumValue[]]>>; bp: number }) {
  const { got, retry } = section;
  return (
    <section className={`${CARD} flex items-center gap-[18px] px-[24px] py-[16px]`}>
      <h2 className="shrink-0 text-[18px] font-semibold text-erp-ink">공지사항</h2>
      <div className="flex min-w-0 flex-1 items-center gap-[24px] overflow-hidden text-[14px]">
        {!got ? (
          <span className="text-erp-muted">불러오는 중입니다.</span>
        ) : "error" in got ? (
          <>
            <span className="min-w-0 flex-1 truncate text-erp-muted">공지사항을 불러오지 못했습니다. {got.error}</span>
            <Button variant="off" onClick={retry}>
              다시 시도
            </Button>
          </>
        ) : got.data[0].items.length ? (
          latestNotices(got.data[0].items).map((p) => (
            <Link key={p.postId} href={bpPath(bp, `/support-notices/${p.postId}`)} className="flex min-w-0 items-center gap-[6px] hover:underline">
              {p.noticeType && <Tag>{labelOf(got.data[1], p.noticeType)}</Tag>}
              <span className="truncate">{p.title}</span>
              <span className="shrink-0 text-[13px] text-erp-muted">{p.postedDate.slice(5, 10)}</span>
            </Link>
          ))
        ) : (
          <span className="text-erp-muted">공지사항이 없습니다.</span>
        )}
      </div>
      <MoveLink href={bpPath(bp, "/support-notices")} label="공지 목록" />
    </section>
  );
}

/**
 * 수치 카드 한 칸 — 상 · 중 · 하 세 자리가 카드마다 같다(2026-11-18 사용자 지정 — 값이 카드마다 다른 높이에 떠 있어 칸을 잘 쓰지 못했다).
 * 상: 제목(15px 600 먹색, 버튼 줄 26px) · 꺾쇠. 중: 큰 숫자 — 제목 아래 18px 에 고정. 하: 보조 줄 — 카드 맨 아래에 붙여 카드마다 같은 높이에 선다.
 */
function Figure({ label, link, value, foot }: { label: string; link: { href: string; text: string } | null; value: ReactNode; foot: ReactNode }) {
  const box = `${CARD} flex min-w-0 flex-col gap-[18px] p-[24px]`;
  const inner = (
    <>
      <div className="flex h-[26px] items-center gap-[6px]">
        <h2 className="flex-1 text-[15px] font-semibold text-erp-ink">{label}</h2>
        {link && <Chevron />}
      </div>
      <div>{value}</div>
      <div className="mt-auto flex flex-col gap-[8px]">{foot}</div>
    </>
  );
  // 갈 화면에 조회 권한이 있으면 카드 전체가 링크다(그 화면 이름은 화면 읽기 도구용 이름으로 붙인다)
  return link ? (
    <Link href={link.href} aria-label={`${label} — ${link.text}`} className={`${box} ${LINK_CARD}`}>
      {inner}
    </Link>
  ) : (
    <section aria-label={label} className={box}>
      {inner}
    </section>
  );
}

function Big({ value, unit }: { value: ReactNode; unit: string }) {
  return (
    <span className="text-[20px] leading-[1.2] font-medium text-erp-ink">
      {value}
      <span className="ml-[4px] text-[14px] font-medium">{unit}</span>
    </span>
  );
}

const Sub = ({ children }: { children: ReactNode }) => <span className="text-[13px] break-keep text-erp-label">{children}</span>;

const warn = (text: string) => <span className="text-erp-off">{text}</span>;
/** 표의 숫자 — 0 과 권한 없는 칸(null)은 짧은 「-」(다른 표의 빈 칸과 같다 — 긴 줄표는 길어 보였다, 2026-11-16 사용자 지정) */
const num = (n: number | null) => (n ? n : <span className="text-erp-muted">-</span>);

type CardsData = NonNullable<HomeSummary["cards"]>;

/**
 * 점포가 없을 때의 카드 — 모두 0. 조회 권한이 없는 메뉴의 카드는 api 처럼 null 로 숨긴다(오늘 출근은 출퇴근 · 근무스케줄 둘 다 볼 때만, api showsAttendance).
 * 내 문의는 점포와 상관없이 내가 쓴 문의를 세므로 0 으로 지어낼 수 없다 — 여기서는 비워 두고, 점포 없이 받은 현황의 값으로 채운다(리뷰 반영)
 */
function emptyCardsOf(canOpen: (path: string) => boolean): CardsData {
  return {
    staff: canOpen("/staff-members") ? { total: 0, fullTime: 0, partTime: 0 } : null,
    unsignedContractCount: null,
    stores: { total: 0, direct: 0, franchise: 0, notOperating: 0 },
    todayAttendance: canOpen("/attendance-records") && canOpen("/work-schedules") ? { scheduled: 0, checkedIn: 0, notCheckedIn: 0 } : null,
    myInquiries: null,
    todayTodo: canOpen("/todos") ? { done: 0, total: 0 } : null,
  };
}

type Daily = ReturnType<typeof useLoad<DailyAttendance>>;
/** 오늘 TO-DO 를 상태별로 셀 때 한 번에 받는 줄 수 — api 상한(200). 그보다 많으면 상태별로 나누지 않고 완료만 보인다 */
const TODO_COUNT_MAX = 200;
/** 지각 막대 · 글자 — 토큰이 없어 쓰는 자리에 적는다(DESIGN.md 범례 색 칸 · 근태 요약과 같은 #e8a33d, 글자는 흰 바탕에서 읽히게 한 단계 진한 #b2741a) */
const LATE_BAR = "bg-[#e8a33d]";
const LATE_TEXT = "text-[#b2741a]";

// 수치 카드 넷 — 점포 · 재직 직원 · 오늘 출근 · 오늘 TO-DO(2026-11-18 사용자 지정 홈 D안 — 내 문의는 아래 오른쪽 칸으로 옮겼다). api 가 null 을 준 카드
// (그 메뉴의 조회 권한 없음)는 숨기고 남은 카드가 칸을 나눠 채운다(HOM-09)
function Cards({
  cards,
  storeCounts,
  daily,
  todos,
  scopeHref,
  canOpen,
  bp,
}: {
  cards: CardsData;
  storeCounts: ReturnType<typeof storeCountsOf>;
  daily: Daily;
  todos: TodoListResponse | null;
  scopeHref: (href: string) => string;
  canOpen: (path: string) => boolean;
  bp: number;
}) {
  const { staff, todayAttendance: today, todayTodo: todo } = cards;
  const day = kstToday();
  const linkTo = (path: string, href: string, text: string) => (canOpen(path) ? { href: bpPath(bp, scopeHref(href)), text } : null);
  const d = daily.got && "data" in daily.got ? daily.got.data : null;
  // 출근 전 — 근무스케줄이 있고 아직 시작 전(상태 null)인 직원
  const before = d ? d.items.filter((r) => r.status === null && r.schedules.length > 0).length : 0;
  const counts = d?.counts ?? {};
  const { operating: on, notOperating: off } = storeCounts;
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-[12px]">
      {/* 점포 — 운영 · 미운영 두 칸. 칸마다 이름 · 큰 숫자(중) · 직영 · 가맹(하)이라 내역이 그 숫자 바로 아래 선다(2026-11-18 사용자 지정 B안 —
          직영 · 가맹 표는 운영 · 미운영보다 눈에 걸렸고, 큰 숫자 둘과 내역 두 줄을 떼어 두면 어느 숫자의 내역인지 안 읽혔다). 미운영 이름은 회색 —
          빨강은 할 일처럼 도드라졌는데 미운영은 급한 일이 아니다(2026-11-18 사용자 지정).
          로그인 정보의 점포를 상단 범위로 센다(본사 · 폐점 제외) */}
      <Figure
        label="점포"
        link={linkTo("/stores", "/stores", "점포 목록")}
        value={
          <div className="grid grid-cols-2 gap-[18px]">
            {(
              [
                ["운영", "text-erp-on", on],
                ["미운영", "text-erp-label", off],
              ] as const
            ).map(([name, tone, row]) => (
              <span key={name} className="flex flex-col gap-[4px]">
                <span className={`text-[13px] font-medium ${tone}`}>{name}</span>
                <Big value={row.direct + row.franchise} unit="개" />
              </span>
            ))}
          </div>
        }
        foot={
          <div className="grid grid-cols-2 gap-[18px]">
            {[on, off].map((row, i) => (
              <Sub key={i}>
                직영 {row.direct} · 가맹 {row.franchise}
              </Sub>
            ))}
          </div>
        }
      />
      {staff && (
        <Figure
          label="재직 직원"
          link={linkTo("/staff-members", "/staff-members", "직원 목록")}
          value={<Big value={staff.total} unit="명" />}
          // 고용형태는 개인 정보라 본사에 정보제공을 동의하지 않은 가맹점포 직원은 정직원 · 파트타이머에 들지 않는다(api HomeStaffCardDto, ATT-30) — 빠진 수를 밝힌다
          foot={
            <Sub>
              정직원 {staff.fullTime} · 파트타이머 {staff.partTime}
              {staff.total - staff.fullTime - staff.partTime > 0 && <span className="block">정보 미동의 {staff.total - staff.fullTime - staff.partTime}</span>}
            </Sub>
          }
        />
      )}
      {today && (
        <Figure
          label="오늘 출근"
          link={linkTo("/attendance-records", "/attendance-records", "출퇴근 현황")}
          value={<Big value={<>{today.checkedIn}<span className="ml-[4px] text-[14px] font-medium">/ {today.scheduled}</span></>} unit="명" />}
          foot={
            d ? (
              <>
                {/* 근무 예정 중 정상 · 지각 · 미출근 막대 — 출근 전은 빈 칸. 색만으로 말하지 않게 아래 글자를 함께 둔다 */}
                <div
                  role="img"
                  aria-label={`근무 예정 ${today.scheduled}명 중 정상 ${counts.NORMAL ?? 0}, 지각 ${counts.LATE ?? 0}, 미출근 ${counts.ABSENT ?? 0}, 출근 전 ${before}`}
                  className="flex h-[8px] overflow-hidden rounded-[2px] bg-erp-subtle"
                >
                  {(
                    [
                      [counts.NORMAL ?? 0, "bg-erp-on"],
                      [counts.LATE ?? 0, LATE_BAR],
                      [counts.ABSENT ?? 0, "bg-erp-off"],
                    ] as const
                  ).map(([n, tone]) =>
                    n > 0 && today.scheduled > 0 ? <span key={tone} className={tone} style={{ width: `${Math.min(100, (n / today.scheduled) * 100)}%` }} /> : null,
                  )}
                </div>
                <Sub>
                  <span className="text-erp-ink">정상 {counts.NORMAL ?? 0}</span> · <span className={LATE_TEXT}>지각 {counts.LATE ?? 0}</span> · {warn(`미출근 ${counts.ABSENT ?? 0}`)} · 출근 전 {before}
                </Sub>
              </>
            ) : (
              <Sub>
                근무 예정 {today.scheduled}
                {today.notCheckedIn ? <> · {warn(`미출근 ${today.notCheckedIn}`)}</> : null}
              </Sub>
            )
          }
        />
      )}
      {todo && (
        // 여러 직원에게 나눈 TO-DO 는 묶음 1건, 모두 끝내야 완료다. 링크는 TO-DO 목록의 오늘
        <Figure
          label="오늘 TO-DO"
          link={linkTo("/todos", `/todos${toTodoListSearch({ ...DEFAULT_TODO_LIST_QUERY, dueDateFrom: day, dueDateTo: day })}`, "TO-DO 목록")}
          value={<Big value={todo.total} unit="건" />}
          // TO-DO 상태 세 가지(대기 · 진행 중 · 완료)를 따로 — 「대기 · 진행 중 N」으로 묶으면 상태 이름처럼 읽히지 않았다(2026-11-18 사용자 지정)
          foot={
            <Sub>
              {todos && todos.items.length === todos.total ? (
                <>
                  대기 {todos.items.filter((t) => t.status === "PENDING").length} · 진행 중 {todos.items.filter((t) => t.status === "IN_PROGRESS").length} · 완료{" "}
                  {todos.items.filter((t) => t.status === "DONE").length}
                </>
              ) : (
                <>완료 {todo.done}</>
              )}
            </Sub>
          }
        />
      )}
    </div>
  );
}

/** 권한이 없으면 api 가 null 을 주는 칸 */
type NullableCount = "staffCount" | "unsignedContractCount" | "checkedInCount" | "notCheckedInCount" | "todayTodo";
/** 목록 영역 — 남는 높이를 채우고 넘치면 안에서 스크롤한다(HOM-06). 바깥 상자 높이는 줄 수와 상관없이 옆 칸에 맞춘다 */
const LIST_FILL = "relative min-h-[200px] flex-1";
/** 떠 있는 줄 하나 — 1px 패널 선 · 4px 모서리. 확인할 것이 있는 줄은 왼쪽에 빨간 3px 안쪽 선(그림자가 아니다, 2026-11-18 사용자 지정 홈 표 T2) */
const ROW_BOX = "rounded-[4px] border border-erp-panel-line bg-white";
const URGENT_EDGE = "shadow-[inset_3px_0_0_var(--color-erp-off)]";

/** 진행 막대 + 「3/5」 — 오늘 출근 · 오늘 TO-DO. 할 일이 없으면 옅은 「-」 */
function Progress({ done, total, tone, extra }: { done: number; total: number; tone: string; extra?: ReactNode }) {
  if (!total) return <span className="text-erp-muted">-</span>;
  return (
    <span className="flex items-center gap-[8px]">
      <span role="img" aria-label={`${total} 중 ${done}`} className="h-[6px] flex-1 overflow-hidden rounded-[3px] bg-erp-subtle">
        <span className={`block h-full ${tone}`} style={{ width: `${Math.min(100, (done / total) * 100)}%` }} />
      </span>
      <span className="w-[40px] shrink-0 text-right text-[13px] tabular-nums">
        {done}/{total}
      </span>
      {extra}
    </span>
  );
}

/** 확인 필요 건수 — 빨간 알약. 없으면 옅은 「-」 */
const CountPill = ({ n }: { n: number }) =>
  n ? (
    <span className="inline-block min-w-[24px] rounded-full bg-erp-off-bg px-[7px] py-[1px] text-center text-[13px] font-semibold text-erp-off tabular-nums">{n}</span>
  ) : (
    <span className="text-erp-muted">-</span>
  );

// 운영 점포별 현황 — 운영 점포 모두, 확인 필요 많은 순(api 순서, HOM-06). 업무 범위는 헤더 한 곳에서 고른다(SCP-01).
// 업무 표가 아니라 현황판처럼 읽히게 줄마다 떠 있는 상자 · 진행 막대 · 빨간 알약으로 그린다 — 회색 머리 띠 · 46px 줄의 표는 너무 정적이었다
// (2026-11-18 사용자 지정 홈 표 T2). 유형 · 미체결 계약은 점포명 아래 한 줄. 그 메뉴의 조회 권한이 없어 api 가 모든 줄에 null 을 준 칸은 숨긴다(HOM-09)
function StoreTable({ table }: { table: HomeSummary["storeTable"] }) {
  const shown = (key: NullableCount) => table.items.some((r) => r[key] !== null);
  const head = "px-[10px] pb-[2px] text-[12px] font-medium text-erp-thead-text";
  const mid = "border-y border-erp-panel-line px-[10px]";
  return (
    <section className={`${CARD} flex min-h-0 flex-col gap-[12px] p-[24px]`}>
      <div className="flex items-end gap-[6px]">
        <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">운영 점포별 현황</h2>
        <span className="text-[14px] text-erp-label">{table.total > 0 ? `${table.total}개점 · 확인 필요 건수 순` : "0개점"}</span>
      </div>
      <div className={LIST_FILL}>
        <div className="absolute inset-0 overflow-y-auto">
          {table.items.length === 0 ? (
            <p className="grid h-full place-items-center text-[14px] text-erp-muted">운영 중인 점포가 없습니다.</p>
          ) : (
            <table className="w-full table-fixed border-separate border-spacing-y-[6px] text-[14px] text-erp-ink">
              <thead className="sticky top-0 z-[1] bg-white">
                <tr>
                  <th className={`${head} text-left`}>점포</th>
                  {shown("staffCount") && <th className={`${head} w-[64px] text-center`}>재직 직원</th>}
                  {shown("checkedInCount") && <th className={`${head} w-[24%] text-left`}>오늘 출근</th>}
                  {shown("todayTodo") && <th className={`${head} w-[24%] text-left`}>오늘 TO-DO</th>}
                  <th className={`${head} w-[76px] text-center`}>확인 필요</th>
                </tr>
              </thead>
              <tbody>
                {table.items.map((r) => (
                  <tr key={r.storeId}>
                    <td className={`${ROW_BOX} rounded-r-none border-r-0 px-[12px] py-[9px] ${r.pendingActionCount ? URGENT_EDGE : ""}`}>
                      {/* 본사 점포(직영으로 저장)는 「[본사] 상호」로 매장과 가른다(본사 점포 설계, 2026-11-17) */}
                      {/* 유형은 점포명 앞 꼬리표(점포명 길이와 상관없이 줄마다 같은 자리, 2026-11-18 사용자 지정) — 직영은 연한 파랑 바탕, 가맹은 회색. 글자 · 테두리는 같고 바탕만 가른다(공통코드 관리주체 꼬리표와 같은 방식,
                          2026-11-18 사용자 지정 — 아래 회색 줄의 「직영점포」는 훑어볼 때 구별되지 않았다). 본사 점포는 이름의 「[본사]」로 충분해 꼬리표를 두지 않는다 */}
                      {/* 꼬리표 | 점포명 · 미체결 계약 — 미체결 계약 줄이 점포명과 같은 자리에서 시작하게 꼬리표를 왼쪽 칸으로 뺀다(2026-11-18 사용자 지정) */}
                      <span className="flex min-w-0 items-start gap-[6px]">
                        {!r.isHq && (
                          // 두 글자로 짧게(2026-11-18 사용자 지정). 파랑 글자 · 테두리는 너무 세서 바탕만 가르는 모양을 그대로 쓴다
                          <span
                            className={`mt-[1px] shrink-0 rounded-[2px] border px-[4px] text-[12px] font-medium border-erp-thead-line text-erp-thead-text ${r.storeTypeCode === "DIRECT" ? "bg-erp-on-bg" : "bg-erp-thead-bg"}`}
                          >
                            {r.storeTypeCode === "DIRECT" ? "직영" : "가맹"}
                          </span>
                        )}
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate font-medium">{storeOptionLabel({ name: r.storeName, isHq: r.isHq })}</span>
                          {r.unsignedContractCount !== null && <span className="mt-[2px] truncate text-[12px] text-erp-thead-text">미체결 계약 {r.unsignedContractCount}</span>}
                        </span>
                      </span>
                    </td>
                    {shown("staffCount") && <td className={`${mid} text-center tabular-nums`}>{num(r.staffCount)}</td>}
                    {shown("checkedInCount") && (
                      <td className={mid}>
                        <Progress
                          done={r.checkedInCount ?? 0}
                          total={r.scheduledCount ?? 0}
                          tone="bg-erp-on"
                          // 미출근은 있을 때만 빨간 글자로 — 막대의 빈 칸에는 미출근과 출근 시간 전 직원이 섞여 있어 따로 밝힌다(2026-11-18 사용자 지정, 전엔 「미출근」 열)
                          extra={r.notCheckedInCount ? <span className="shrink-0 text-[13px] text-erp-off">미출근 {r.notCheckedInCount}</span> : null}
                        />
                      </td>
                    )}
                    {shown("todayTodo") && (
                      <td className={mid}>
                        <Progress done={r.todayTodo?.done ?? 0} total={r.todayTodo?.total ?? 0} tone="bg-erp-brand-soft" />
                      </td>
                    )}
                    <td className={`${ROW_BOX} rounded-l-none border-l-0 px-[10px] text-center`}>
                      <CountPill n={r.pendingActionCount} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}

// 확인 필요 — api 순서 그대로(갱신 예정 → 계약 → 직원 → 문의 → TO-DO), 0건 유형은 api 가 뺀다. 운영 알림은 나열하지 않는다(HOM-08).
// 출퇴근 기록 꼬리표 「확인 필요」(ATT-19)와 다른 뜻이다(HOM-07). 줄마다 떠 있는 상자 하나가 그 목록으로 가는 링크다 — 구분 칩 · 항목(굵게) · 대표 · 경과.
// 계약 갱신 예정은 오른쪽에 「종료 D-N」, 7일 이내면 빨간 글자 + 왼쪽 빨간 선(HOM-04, 2026-11-18 사용자 지정 홈 표 T2)
function Pending({ data, bp }: { data: HomePending; bp: number }) {
  // 이 화면이 모르는 유형(api 가 새로 더한 것)은 건너뛴다 — 홈 전체가 오류 화면이 되지 않게
  const lines = data.items.flatMap((item) => {
    const line = pendingLineOf(item, bp);
    return line ? [{ type: item.type, count: item.count, ...line }] : [];
  });
  const total = lines.reduce((sum, l) => sum + l.count, 0);
  return (
    <section className={`${CARD} flex min-h-0 flex-1 flex-col gap-[12px] p-[24px]`}>
      <div className="flex items-end gap-[6px]">
        <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">확인 필요</h2>
        <span className="text-[14px] text-erp-label">총 {total}건</span>
      </div>
      <div className={LIST_FILL}>
        <div className="absolute inset-0 flex flex-col gap-[6px] overflow-y-auto">
          {lines.length === 0 ? (
            <p className="grid h-full place-items-center text-[14px] text-erp-muted">확인할 일이 없습니다.</p>
          ) : (
            lines.map((l) => (
              <Link
                key={l.type}
                href={l.href}
                className={`${ROW_BOX} grid shrink-0 grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-[12px] px-[12px] py-[11px] text-[14px] text-erp-ink transition-[border-color] duration-150 ease-out hover:border-erp-brand ${l.due?.urgent ? URGENT_EDGE : ""}`}
              >
                {/* 구분 칩 — 분류일 뿐 상태가 아니라 회색(색은 상태다 규칙) */}
                <span className="rounded-full bg-erp-subtle py-[2px] text-center text-[12px] font-medium text-erp-thead-text">{l.kind}</span>
                <span className="truncate">
                  <b className="font-semibold">{l.title}</b>
                  <span className="text-erp-label"> · {l.due ? l.desc : l.who}</span>
                </span>
                {l.due ? (
                  <span className={`text-[13px] ${l.due.urgent ? "font-semibold text-erp-off" : "text-erp-label"}`}>{l.due.text}</span>
                ) : (
                  <span className="text-[13px] text-erp-label">{l.elapsed ?? ""}</span>
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

// 내 문의 — 로그인한 관리자가 쓴 문의(api /home/summary myInquiries). 답변 대기는 접수 · 처리중, 기간 제한 없음(2026-11-18 사용자 지정 홈 D안 — 위 카드에서 옮겼다)
function MyInquiries({ inquiries, href }: { inquiries: NonNullable<CardsData["myInquiries"]>; href: string | null }) {
  const box = `${CARD} flex items-center gap-[12px] px-[24px] py-[16px]`;
  const inner = (
    <>
      <h2 className="shrink-0 text-[16px] font-semibold text-erp-ink">내 문의</h2>
      <p className="min-w-0 flex-1 truncate text-[14px]">
        답변 대기 <span className={inquiries.waiting ? "text-erp-off" : undefined}>{inquiries.waiting}</span>
        <span className="text-erp-label"> · </span>답변완료 {inquiries.answered}
      </p>
      {href && <Chevron />}
    </>
  );
  return href ? (
    <Link href={href} aria-label="내 문의 — 문의하기" className={`${box} ${LINK_CARD}`}>
      {inner}
    </Link>
  ) : (
    <section aria-label="내 문의" className={box}>
      {inner}
    </section>
  );
}
