"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Button, DataTable, LoadGroup, LoadingNotice, PageBar, Tag, type Column } from "@/components/common";
import { CodeLabel } from "@/components/site/code-label";
import { useAccount, useCurrentBp, useMenus, useScope, useService, useStores } from "@/components/site/session-gate";
import { bff } from "@/lib/bff";
import { bpPath } from "@/lib/bp-path";
import type { SupportPostList } from "@/lib/community";
import { labelOf, type EnumValue } from "@/lib/enums";
import { HOME, menuOfPath } from "@/lib/menus";
import { formatAt } from "@/lib/notification-view";
import { kstToday } from "@/lib/staff-members";
import { withScope } from "@/lib/store-scope";
import { isPlatformRole } from "@/lib/auth-routes";
import { useApi, useLoad } from "@/lib/use-load";
import { DEFAULT_TODO_LIST_QUERY, toTodoListSearch } from "../todos/todo-list-query";
import { homeSearchOf, latestNotices, NOTICES_PATH, pendingLineOf, type HomePending, type HomeSummary } from "./home-view";

const CARD = "rounded-[4px] border border-erp-panel-line bg-white";

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
  // 「안녕하세요,」는 회색(erp-label) 400, 「OOO님」은 제목 그대로 먹색 600 — 인사보다 이름에 무게(2026-11-04 사용자 지정, 이름만 파랑은 어색했다)
  const greeting: ReactNode = account.name ? (
    <>
      <span className="font-normal text-erp-label">안녕하세요,</span> {account.name}님
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
  // 공지 띠 — 공지사항 조회 권한이 있을 때만. 플랫폼 탭 · 쓸 수 없는 범위에서는 부르지 않는다
  const showsNotices = (many || noStores) && canOpen("/support-notices");
  const notices = useLoad(showsNotices ? () => Promise.all([bff<SupportPostList>(NOTICES_PATH), enumOf("NoticeType")]) : null, key, "공지사항");

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
  } else if (!stores.length) {
    // 점포가 없는 BP — 안내는 메뉴 줄 아래 띠(NoStoreBand, 모든 화면)가 맡고, 홈은 평소 화면을 값 0 으로 그린다(2026-11-04 사용자 지정 —
    // 전엔 이 자리에 「등록된 점포가 없습니다」 상자와 [점포 등록]을 두었다, HOME-4). 점포 쪽 카드는 0 으로 채우고(그 메뉴의 조회 권한이 없으면 숨긴다),
    // 내 문의 카드와 확인 필요는 점포 없이 받은 실제 값을 쓴다(위 noStores).
    body = (
      <>
        {showsNotices && <NoticeBand section={notices} bp={bp} />}
        <Cards cards={{ ...emptyCardsOf(canOpen), myInquiries: s?.cards?.myInquiries ?? null }} scopeHref={(href) => withScope(href, scope)} canOpen={canOpen} bp={bp} />
        <div className="grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-start gap-[12px]">
          <StoreTable table={{ total: 0, items: [] }} staffHref={canOpen("/staff-members") ? bpPath(bp, withScope("/staff-members", scope)) : null} />
          {!pending ? <Notice text="확인 필요를 불러오는 중입니다." /> : "error" in pending ? <Notice text={`확인 필요를 불러오지 못했습니다. ${pending.error}`} /> : <Pending data={pending.data} bp={bp} />}
        </div>
      </>
    );
  } else if (search === null) {
    // 범위에 드는 점포가 이 탭에 없다(다른 BP 탭에서 복사한 범위 등) — 쿼리를 빼면 BP 전체가 보이므로 부르지 않는다
    body = <Notice text="상단 범위에 해당하는 점포가 이 탭에 없습니다. 상단에서 범위를 다시 선택하세요." />;
  } else {
    const failed = (what: string, error: string) => <Notice text={`${what} 불러오지 못했습니다. ${error}`} />;
    body = (
      <>
        {showsNotices && <NoticeBand section={notices} bp={bp} />}
        {s?.cards && <Cards cards={s.cards} scopeHref={(href) => withScope(href, scope)} canOpen={canOpen} bp={bp} />}
        <div className="grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-start gap-[12px]">
          {!summary ? <Notice text="현황을 불러오는 중입니다." /> : "error" in summary ? failed("현황을", summary.error) : <StoreTable table={summary.data.storeTable} staffHref={canOpen("/staff-members") ? bpPath(bp, withScope("/staff-members", scope)) : null} />}
          {!pending ? <Notice text="확인 필요를 불러오는 중입니다." /> : "error" in pending ? failed("확인 필요를", pending.error) : <Pending data={pending.data} bp={bp} />}
        </div>
      </>
    );
  }

  return (
    <>
      <PageBar title={greeting} titleSize="sentence">
        <div className="flex items-center gap-[10px]">
          {asOf && <span className="text-[13px] text-erp-label">{formatAt(asOf)} 기준</span>}
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
      <div className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto p-[24px]">{body}</div>
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
      <Button variant="soft" href={bpPath(bp, "/support-notices")}>
        공지 목록
      </Button>
    </section>
  );
}

// 수치 카드 — 라벨 · 숫자 · 아랫줄(데모 figure). 갈 화면에 조회 권한이 있으면 카드 전체가 링크다
function Figure({ href, label, value, unit, sub }: { href: string | null; label: string; value: ReactNode; unit: string; sub: ReactNode }) {
  const inner = (
    <>
      <span className="flex items-center gap-[6px] text-[14px] font-medium text-erp-label">
        {label}
        {href && <Image src="/icons/chevron-small.svg" alt="" width={5} height={8} className="rotate-180" />}
      </span>
      <span className="text-[22px] font-semibold">
        {value}
        <span className="ml-[2px] text-[14px] font-medium">{unit}</span>
      </span>
      <span className="text-[14px] text-erp-label">{sub}</span>
    </>
  );
  const box = `${CARD} flex flex-col gap-[10px] p-[24px]`;
  return href ? (
    <Link href={href} className={`${box} transition-[border-color] duration-150 ease-out hover:border-erp-brand`}>
      {inner}
    </Link>
  ) : (
    <div className={box}>{inner}</div>
  );
}

const warn = (text: string) => <span className="text-erp-off">{text}</span>;
/** 표의 숫자 — 0 과 권한 없는 칸(null)은 「—」 */
const num = (n: number | null) => (n ? n : <span className="text-erp-muted">—</span>);

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

// 수치 카드 다섯 — 운영 점포 · 재직 직원 · 오늘 출근 · 내 문의 · 오늘 TO-DO(HOM-10). api 가 null 을 준 카드(그 메뉴의 조회 권한 없음)는 숨기고
// 남은 카드가 칸을 나눠 채운다(HOM-09). 미체결 계약 수는 카드에 두지 않고 점포별 현황 표에만 둔다(WHALEERP-620 A안, 2026-10-28 재영).
// 본사 역할의 ATT-30 안내 문구는 두지 않는다 — 세는 기준은 api 그대로다(2026-11-11 재영)
function Cards({ cards, scopeHref, canOpen, bp }: { cards: CardsData; scopeHref: (href: string) => string; canOpen: (path: string) => boolean; bp: number }) {
  const { staff, stores, todayAttendance: today, myInquiries: inquiries, todayTodo: todo } = cards;
  const day = kstToday();
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-[12px]">
      <Figure
        href={canOpen("/stores") ? bpPath(bp, scopeHref("/stores")) : null}
        label="운영 점포"
        value={stores.total}
        unit="개점"
        sub={`직영 ${stores.direct} · 가맹 ${stores.franchise}${stores.notOperating ? ` · 미운영 ${stores.notOperating}` : ""}`}
      />
      {staff && (
        <Figure
          href={canOpen("/staff-members") ? bpPath(bp, scopeHref("/staff-members")) : null}
          label="재직 직원"
          value={staff.total}
          unit="명"
          sub={`정직원 ${staff.fullTime} · 파트 ${staff.partTime}`}
        />
      )}
      {today && (
        <Figure
          href={canOpen("/attendance-records") ? bpPath(bp, scopeHref("/attendance-records")) : null}
          label="오늘 출근"
          value={today.checkedIn}
          unit="명"
          sub={
            <>
              {`근무 예정 ${today.scheduled}`}
              {today.notCheckedIn ? <> · {warn(`미출근 ${today.notCheckedIn}`)}</> : null}
            </>
          }
        />
      )}
      {inquiries && (
        <Figure
          href={canOpen("/support-inquiries") ? bpPath(bp, "/support-inquiries") : null}
          label="내 문의"
          value={inquiries.waiting + inquiries.answered}
          unit="건"
          sub={`답변 대기 ${inquiries.waiting} · 답변완료 ${inquiries.answered}`}
        />
      )}
      {todo && (
        // 「완료 / 전체건 완료」 — 여러 직원에게 나눈 TO-DO 는 묶음 1건, 모두 끝내야 완료다. 누르면 TO-DO 목록의 오늘
        <Figure
          href={canOpen("/todos") ? bpPath(bp, scopeHref(`/todos${toTodoListSearch({ ...DEFAULT_TODO_LIST_QUERY, dueDateFrom: day, dueDateTo: day })}`)) : null}
          label="오늘 TO-DO"
          value={
            <>
              {todo.done}
              <span className="ml-[4px] text-[14px] font-medium">/ {todo.total}</span>
            </>
          }
          unit="건 완료"
          sub={`대기·진행 중 ${todo.total - todo.done}건`}
        />
      )}
    </div>
  );
}

type StoreRow = HomeSummary["storeTable"]["items"][number];
/** 권한이 없으면 api 가 null 을 주는 칸 */
type NullableCount = "staffCount" | "unsignedContractCount" | "checkedInCount" | "notCheckedInCount" | "todayTodo";
/** 표 영역 높이 — 넘치면 표 안에서 스크롤한다(HOM-06). 확인 필요와 같은 높이로 나란히 둔다 */
const TABLE_BOX = "flex h-[352px] flex-col";

// 점포별 현황 표 — 운영 점포 모두, 확인 필요 많은 순(api 순서, HOM-06). 목업의 전체 · 직영 · 가맹 탭과 상태 열 · 필터는 두지 않는다 — 업무 범위는
// 헤더 한 곳에서 고른다(운영 정책 SCP-01). 그 메뉴의 조회 권한이 없어 api 가 모든 줄에 null 을 준 열은 숨긴다(HOM-09)
function StoreTable({ table, staffHref }: { table: HomeSummary["storeTable"]; staffHref: string | null }) {
  const shown = (key: NullableCount) => table.items.some((r) => r[key] !== null);
  return (
    <section className={`${CARD} flex flex-col gap-[12px] p-[24px]`}>
      <div className="flex items-end gap-[6px]">
        <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">점포별 현황</h2>
        <span className="text-[14px] text-erp-label">{table.total > 0 ? `${table.total}개점 · 확인 필요 많은 순` : "0개점"}</span>
      </div>
      <div className={TABLE_BOX}>
        <DataTable<StoreRow>
          scroll
          columns={(
            [
              { header: "점포명", align: "left", cell: (r) => <span className="truncate">{r.storeName}</span> },
              { header: "유형", width: "w-[72px]", cell: (r) => <CodeLabel group="STORE_TYPE" value={r.storeTypeCode} /> },
              shown("staffCount") && { header: "재직 직원", width: "w-[78px]", cell: (r) => num(r.staffCount) },
              shown("unsignedContractCount") && { header: "미체결 계약", width: "w-[88px]", cell: (r) => num(r.unsignedContractCount) },
              // 출근 / 근무 예정. 근무 예정이 없으면 「—」
              shown("checkedInCount") && {
                header: "오늘 출근",
                width: "w-[78px]",
                cell: (r) => (r.checkedInCount !== null && r.scheduledCount ? `${r.checkedInCount} / ${r.scheduledCount}` : num(r.checkedInCount)),
              },
              shown("notCheckedInCount") && { header: "미출근", width: "w-[64px]", cell: (r) => (r.notCheckedInCount ? warn(String(r.notCheckedInCount)) : num(r.notCheckedInCount)) },
              // 완료 / 전체. 오늘 TO-DO 가 없으면 「—」
              shown("todayTodo") && { header: "오늘 TO-DO", width: "w-[104px]", cell: (r) => (r.todayTodo?.total ? `${r.todayTodo.done} / ${r.todayTodo.total}` : num(null)) },
              { header: "확인 필요", width: "w-[72px]", cell: (r) => (r.pendingActionCount ? warn(String(r.pendingActionCount)) : num(0)) },
            ] satisfies (Column<StoreRow> | false)[]
          ).filter((c) => c !== false)}
          rows={table.items}
          rowKey={(r) => r.storeId}
        />
      </div>
      <div className="flex items-center text-[14px]">
        {/* 미운영 점포의 확인 필요 건은 오른쪽 확인 필요에는 세므로 표와 합이 다를 수 있다 — 그 사실을 적는다(HOM-06) */}
        <p className="flex-1 text-erp-label">운영 중인 점포만 보입니다. 미운영 점포의 건은 확인 필요에만 셉니다.</p>
        {staffHref && (
          <Link href={staffHref} className="text-erp-link hover:underline">
            직원 목록
          </Link>
        )}
      </div>
    </section>
  );
}

// 확인 필요 — api 순서 그대로(갱신 예정 → 계약 → 직원 → 문의 → TO-DO), 0건 유형은 api 가 뺀다. 운영 알림은 나열하지 않는다(HOM-08).
// 출퇴근 기록 꼬리표 「확인 필요」(ATT-19)와 다른 뜻이다(HOM-07). 계약 갱신 예정은 경고 밴드 대신 줄 끝에 「종료 D-N」, 7일 이내면 빨간색(HOM-04)
function Pending({ data, bp }: { data: HomePending; bp: number }) {
  // 이 화면이 모르는 유형(api 가 새로 더한 것)은 건너뛴다 — 홈 전체가 오류 화면이 되지 않게
  const lines = data.items.flatMap((item) => {
    const line = pendingLineOf(item, bp);
    return line ? [{ type: item.type, count: item.count, ...line }] : [];
  });
  const total = lines.reduce((sum, l) => sum + l.count, 0);
  return (
    <section className={`${CARD} flex flex-col gap-[12px] p-[24px]`}>
      <div className="flex items-end gap-[6px]">
        <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">확인 필요</h2>
        <p className="text-[14px]">
          총 <b className="font-semibold">{total}</b> 건
        </p>
      </div>
      <div className={TABLE_BOX}>
        <DataTable
          scroll
          columns={[
            { header: "구분", width: "w-[70px]", cell: (l) => l.kind },
            {
              header: "항목",
              align: "left",
              width: "w-[200px]",
              cell: (l) => (
                <Link href={l.href} className="truncate text-erp-link hover:underline">
                  {l.title}
                </Link>
              ),
            },
            {
              header: "내용",
              align: "left",
              cell: (l) => (
                <span className="truncate text-erp-label">
                  {l.desc}
                  {l.due && <> · {l.due.urgent ? <b className="font-semibold text-erp-off">{l.due.text}</b> : l.due.text}</>}
                </span>
              ),
            },
          ]}
          rows={lines}
          rowKey={(l) => l.type}
          empty="확인할 일이 없습니다."
        />
      </div>
    </section>
  );
}
