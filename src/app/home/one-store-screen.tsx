"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { Badge, Button, DataTable, LoadGroupArea, Tag } from "@/components/common";
import { CodeLabel } from "@/components/site/code-label";
import { useAccount, useCurrentBp, useMenuRole, useMenus, useService, useStores } from "@/components/site/session-gate";
import { InquiryStatusBadge } from "@/components/support/support-lists";
import { bff } from "@/lib/bff";
import { bpPath } from "@/lib/bp-path";
import type { SupportInquiryList, SupportPostList } from "@/lib/community";
import { labelOf, type EnumValue } from "@/lib/enums";
import { MENU_CODE, menuOfPath } from "@/lib/menus";
import { formatAt } from "@/lib/notification-view";
import { kstToday, type StaffMemberListItem } from "@/lib/staff-members";
import type { PayslipSummary } from "@/lib/payslips";
import type { StoreDetail } from "@/lib/store-types";
import type { TodoListResponse as TodoList } from "@/lib/todos-api";
import type { WorkScheduleList } from "@/lib/work-schedules-api";
import { listHrefOf } from "../contracts/contract-list";
import { DEFAULT_STAFF_LIST_QUERY, staffListHrefOf } from "../staff-members/staff-list-query";
import { CellView } from "../staff-members/staff-table";
import { contractCell, EMPLOYMENT_TYPE_LABELS } from "../staff-members/staff-row";
import { weekLabel } from "../staff-members/[id]/summary-view";
import { DEFAULT_TODO_LIST_QUERY, toTodoListSearch } from "../todos/todo-list-query";
import { assigneeText, dueText, MASKED_STAFF } from "../todos/todo-row";
import { ScheduleMonth } from "../work-schedules/schedule-month";
import { ScheduleWeek } from "../work-schedules/schedule-week";
import { addDays, mondayOf, moved, parseScheduleQuery, scheduleApiSearch, toScheduleSearch, type ScheduleQuery } from "../work-schedules/work-schedule-query";
import { latestNotices, payAmounts, oneStorePaths, staffRowsOf, oneStoreStatusCells, STAFF_LIMIT, staffCountsOf, todoSummaryOf, workDaysText, workTimeText } from "./one-store-view";
import { useLoad, type Loaded } from "@/lib/use-load";

// 로그인 후 홈 — 점포 하나 화면(WHALEERP-342, HOME-6 · HOME-9, 목업 home/signed-in.html 「점포 하나 화면」 · 데모 oneStore).
// 업무 범위가 점포 하나일 때다. 처리 대기 · 점포별 현황 표는 없다. api 는 새로 만들지 않고 영역마다 기존 목록을 따로 부른다(2026-10-27 재영) —
// 한 영역이 실패하면 그 영역만 오류와 [다시 시도]다. 메뉴 조회 권한이 없는 영역은 숨긴다.

const CARD = "rounded-[4px] border border-erp-panel-line bg-white";
const HOME = "/home";

type Section<T> = { got: Loaded<T> | null; retry: () => void };

/** 영역의 데이터 칸 — 불러오는 중 · 오류(다시 시도) · 그리기 */
function Body<T>({ section, what, children }: { section: Section<T>; what: string; children: (data: T) => ReactNode }) {
  const { got, retry } = section;
  if (!got) return <p className="text-[14px] text-erp-muted">불러오는 중입니다.</p>;
  if ("error" in got)
    return (
      <div className="flex items-center gap-[12px]">
        <p className="min-w-0 flex-1 text-[14px] text-erp-muted">
          {what} 불러오지 못했습니다. {got.error}
        </p>
        <Button variant="off" onClick={retry}>
          다시 시도
        </Button>
      </div>
    );
  return <>{children(got.data)}</>;
}

function Card({ title, actions, children, className = "" }: { title: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`${CARD} flex min-w-0 flex-col gap-[12px] p-[24px] ${className}`}>
      <div className="flex items-center gap-[6px]">
        <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

const soft = (label: string, href: string) => (
  <Button variant="soft" href={href}>
    {label}
  </Button>
);
const sub = (text: string) => <span className="shrink-0 text-[13px] text-erp-muted">{text}</span>;
const LIST = "flex flex-col border-t border-erp-thead-line text-[14px]";
const ROW = "flex items-center gap-[8px] border-b border-erp-thead-line py-[8px]";
/** 목록 api 의 enum 한글 — 받지 못하면 값을 그대로 보인다(그 영역을 막지 않는다) */
const enumOf = (name: string) => bff<{ enums: Record<string, EnumValue[]> }>(`/enums/${name}`).then((r) => r.enums[name] ?? [], () => []);

export function OneStoreScreen({ storeId, reloadKey }: { storeId: number; reloadKey: string }) {
  const bp = useCurrentBp().bpCodeId;
  const menus = useMenus();
  const service = useService();
  const canOpen = (path: string) => menuOfPath(menus, path, service) !== null;
  const canCreateContract = useMenuRole(MENU_CODE.contracts, "create");
  // 본사 역할이 가맹 점포를 보면 본사 제공 동의가 없는 직원이 급여 합계에서 빠진다(운영 정책 ATT-30) — 카드에 그 사실을 늘 적는다(HOME-10)
  const { roleTypeCode } = useAccount();
  const stores = useStores();
  const hqFranchise = (roleTypeCode === "BM" || roleTypeCode === "BA") && stores.find((s) => s.storeId === storeId)?.storeTypeCode === "FRANCHISE";
  const today = kstToday();
  const paths = oneStorePaths(storeId, today);
  const key = `${storeId}|${reloadKey}`;
  const at = (path: string) => bpPath(bp, path);

  const notices = useLoad(canOpen("/support-notices") ? () => Promise.all([bff<SupportPostList>(paths.notices), enumOf("NoticeType")]) : null, key, "공지사항");
  const store = useLoad(canOpen("/stores") ? () => bff<StoreDetail>(paths.store) : null, key, "점포 정보");
  const todos = useLoad(
    canOpen("/todos") ? () => Promise.all([bff<TodoList>(paths.todoToday), bff<TodoList>(paths.todoUrgent)]) : null,
    `${key}|${today}`,
    "TO-DO",
  );
  const inquiries = useLoad(
    canOpen("/support-inquiries") ? () => Promise.all([bff<SupportInquiryList>(paths.inquiries), bff<SupportInquiryList>(paths.inquiriesWaiting), enumOf("InquiryStatus")]) : null,
    key,
    "내 문의",
  );
  const pay = useLoad(canOpen("/payslips") ? () => bff<PayslipSummary>(paths.payslipSummary) : null, `${key}|${today.slice(0, 7)}`, "직원 급여");
  const staff = useLoad(canOpen("/staff-members") ? () => bff<{ items: StaffMemberListItem[]; total: number }>(paths.staff) : null, key, "직원 정보");

  const cards = [
    canOpen("/stores") && (
      <Card key="store" title="운영 점포 정보" actions={soft("점포 정보 관리", at(`/stores/${storeId}`))}>
        <Body section={store} what="점포 정보를">
          {(s) => (
            // 1팀 점포 데이터에 있는 값만 — 점장 · 영업시간은 없어 뺐다(HOME-9)
            <dl className="grid grid-cols-[84px_minmax(0,1fr)] gap-x-[12px] gap-y-[8px] text-[14px]">
              <dt className="text-erp-label">점포</dt>
              <dd className="truncate">{s.name}</dd>
              <dt className="text-erp-label">유형</dt>
              <dd>
                <CodeLabel group="STORE_TYPE" value={s.storeTypeCode} />
              </dd>
              <dt className="text-erp-label">전화번호</dt>
              <dd>{s.phone ?? "-"}</dd>
              <dt className="text-erp-label">개점일</dt>
              <dd>{s.business.openDate ?? "-"}</dd>
            </dl>
          )}
        </Body>
      </Card>
    ),
    canOpen("/payslips") && (
      // 이번 달 급여명세서 합계(WHALEERP-621) — 네 상태 모두, 본사 역할은 본사 제공 동의한 가맹 직원만(api 가 센다, ATT-30)
      <Card key="pay" title="직원 급여" actions={soft("급여명세서", at(`/payslips?${new URLSearchParams({ month: today.slice(0, 7), storeIds: String(storeId) })}`))}>
        <Body section={pay} what="직원 급여를">
          {(s) => {
            const won = payAmounts(s.fullTime.grossPayAmount, s.partTime.grossPayAmount);
            return (
              <>
                <span className="text-[14px] text-erp-label">{Number(s.month.slice(5))}월 급여 지급 예정</span>
                <span className="text-[22px] font-semibold">{won.total}</span>
                <span className="text-[13px] text-erp-label">직원 {s.total.count}명 · 급여명세서 합계</span>
                <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-[12px] gap-y-[8px] text-[14px]">
                  <dt className="text-erp-label">정직원 {s.fullTime.count}명</dt>
                  <dd>{won.fullTime}</dd>
                  <dt className="text-erp-label">파트타이머 {s.partTime.count}명</dt>
                  <dd>{won.partTime}</dd>
                </dl>
                {hqFranchise && <span className="text-[12px] text-erp-muted">동의하지 않은 가맹 직원은 급여 합계에 세지 않습니다.</span>}
              </>
            );
          }}
        </Body>
      </Card>
    ),
    canOpen("/todos") && (
      <Card key="todo" title="TO-DO" actions={soft("TO-DO 리스트", `/todos${toTodoListSearch({ ...DEFAULT_TODO_LIST_QUERY, storeIds: [storeId] })}`)}>
        <Body section={todos} what="TO-DO 를">
          {([todayList, urgentList]) => {
            const n = todoSummaryOf(todayList, urgentList.total);
            return (
              <>
                <div className="flex items-end justify-between">
                  <span className="text-[14px] text-erp-label">오늘 완료</span>
                  <span className="text-[22px] font-semibold">
                    {n.done}
                    <span className="ml-[2px] text-[14px] font-medium">/ {n.today}건</span>
                    {n.partial && <span className="ml-[6px] text-[13px] font-normal text-erp-label">(앞 {todayList.items.length}건 기준)</span>}
                  </span>
                </div>
                <div className="h-[6px] overflow-hidden rounded-[2px] bg-erp-subtle" role="progressbar" aria-label="오늘 완료" aria-valuenow={n.percent} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full bg-erp-brand" style={{ width: `${n.percent}%` }} />
                </div>
                <span className="text-[13px] text-erp-label">
                  대기·진행 중 {n.open}건{n.urgent ? <> · <span className="text-erp-off">긴급 {n.urgent}</span></> : null}
                </span>
                {todayList.items.length > 0 && (
                  <ul className={LIST}>
                    {todayList.items.slice(0, 2).map((t) => (
                      <li key={t.todoId} className={ROW}>
                        {t.isUrgent && <Badge tone="off">긴급</Badge>}
                        <Link href={`/todos/${t.todoId}`} className="min-w-0 flex-1 truncate hover:underline">
                          {t.title}
                        </Link>
                        {sub(`${dueText(t.dueDate, t.dueTime, today)} · ${assigneeText(t)}`)}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            );
          }}
        </Body>
      </Card>
    ),
    canOpen("/support-inquiries") && (
      // 문의하기 버튼은 두지 않는다 — 문의 내역에서 쓴다
      <Card key="inquiry" title="내 문의" actions={soft("문의 내역", at("/support-inquiries"))}>
        <Body section={inquiries} what="내 문의를">
          {([recent, waiting, statuses]) => (
            <>
              <span className="text-[13px] text-erp-label">
                답변 대기 <b className={waiting.total ? "text-erp-off" : ""}>{waiting.total}</b>건 · 전체 {recent.total}건
              </span>
              {recent.items.length > 0 && (
                <ul className={LIST}>
                  {recent.items.map((i) => (
                    <li key={i.inquiryId} className={ROW}>
                      <InquiryStatusBadge status={i.status} statuses={statuses} />
                      <Link href={at(`/support-inquiries/${i.inquiryId}`)} className="min-w-0 flex-1 truncate hover:underline">
                        {i.title}
                      </Link>
                      {sub(formatAt(i.createdAt).slice(0, 5))}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Body>
      </Card>
    ),
  ].filter(Boolean);

  return (
    <>
      {canOpen("/support-notices") && (
        <section className={`${CARD} flex items-center gap-[18px] p-[24px]`}>
          <h2 className="shrink-0 text-[18px] font-semibold text-erp-ink">공지사항</h2>
          <div className="flex min-w-0 flex-1 gap-[24px] overflow-hidden text-[14px]">
            <Body section={notices} what="공지사항을">
              {([list, types]) =>
                list.items.length ? (
                  latestNotices(list.items).map((p) => (
                    <Link key={p.postId} href={at(`/support-notices/${p.postId}`)} className="flex min-w-0 items-center gap-[6px] hover:underline">
                      {p.noticeType && <Tag>{labelOf(types, p.noticeType)}</Tag>}
                      <span className="truncate">{p.title}</span>
                      {sub(p.postedDate.slice(5, 10))}
                    </Link>
                  ))
                ) : (
                  <span className="text-erp-muted">공지사항이 없습니다.</span>
                )
              }
            </Body>
          </div>
          {soft("공지 목록", at("/support-notices"))}
        </section>
      )}
      {cards.length > 0 && <div className="grid auto-cols-fr grid-flow-col items-start gap-[12px]">{cards}</div>}
      {canOpen("/work-schedules") && (
        // 보기 상태는 홈 주소의 쿼리(useSearchParams)라 Suspense 가 필요하다 — LoadGroupArea 는 Suspense 경계이면서, 경계가 풀리기 전(안쪽 로더가 아직
        // 마운트되지 않은 때)에도 묶음을 붙잡아 다른 로더만 끝났다고 일찍 풀리지 않게 한다
        <LoadGroupArea fallback={<Card title="근무스케줄">{null}</Card>}>
          <ScheduleCard storeId={storeId} reloadKey={key} today={today} />
        </LoadGroupArea>
      )}
      {canOpen("/staff-members") && (
        <StaffCard storeId={storeId} section={staff} canContracts={canOpen("/contracts")} canCreateContract={canCreateContract} today={today} at={at} />
      )}
    </>
  );
}

// 데모 segment — 근무스케줄 관리 화면과 같은 모양
const segment = (active: boolean) =>
  `flex h-[32px] items-center px-[12px] text-[14px] transition-colors duration-150 ease-out ${active ? "bg-erp-subtle font-semibold text-erp-ink" : "bg-white text-erp-label hover:text-erp-ink"}`;
const ICON_BUTTON =
  "grid size-[34px] shrink-0 place-items-center rounded-[2px] border border-erp-button-line bg-white transition-[border-color] duration-150 ease-out hover:border-erp-brand";

// 근무스케줄 — 근무스케줄 관리의 ScheduleWeek · ScheduleMonth 를 읽기 전용으로(hrefBase=/home · readOnly). 공백 안내 · 휴무 직원 행 · 등록은 관리에만 있다(HOME-7)
function ScheduleCard({ storeId, reloadKey, today }: { storeId: number; reloadKey: string; today: string }) {
  const params = useSearchParams();
  // 점포는 헤더 범위가 정한다 — 주소의 store · scope 는 읽지 않고 링크에도 싣지 않는다
  const query: ScheduleQuery = { ...parseScheduleQuery(Object.fromEntries(params), today), storeId: null };
  const search = scheduleApiSearch({ ...query, storeId });
  const section = useLoad(() => bff<WorkScheduleList>(`/work-schedules?${search}`), `${reloadKey}|${search}`, "근무스케줄");
  const href = (next: Parameters<typeof moved>[1]) => `${HOME}${toScheduleSearch(moved(query, next), today)}`;
  return (
    <Card
      title="근무스케줄"
      actions={
        <>
          <nav aria-label="보기" className="flex shrink-0 overflow-hidden rounded-[2px] border border-erp-button-line">
            <Link href={href({ view: "week", week: mondayOf(query.day), day: query.day })} aria-current={query.view === "week" ? "page" : undefined} className={segment(query.view === "week")} scroll={false}>
              주간 보기
            </Link>
            <Link href={href({ view: "month", month: query.day.slice(0, 7), day: query.day })} aria-current={query.view === "month" ? "page" : undefined} className={segment(query.view === "month")} scroll={false}>
              월간 보기
            </Link>
          </nav>
          {soft("근무스케줄 관리", `/work-schedules?store=${storeId}`)}
        </>
      }
    >
      {query.view === "week" && (
        <div className="flex items-center gap-[6px]">
          <Link href={href({ week: addDays(query.week, -7), day: addDays(query.day, -7) })} aria-label="이전 주" scroll={false} className={ICON_BUTTON}>
            <Image src="/icons/prev.svg" alt="" width={16} height={16} />
          </Link>
          <span className="grid h-[34px] min-w-[190px] place-items-center rounded-[2px] border border-erp-button-line bg-white px-[12px] text-[14px] font-semibold text-erp-ink">{weekLabel(query.week)}</span>
          <Link href={href({ week: addDays(query.week, 7), day: addDays(query.day, 7) })} aria-label="다음 주" scroll={false} className={ICON_BUTTON}>
            <Image src="/icons/next.svg" alt="" width={16} height={16} />
          </Link>
        </div>
      )}
      <Body section={section} what="근무스케줄을">
        {(data) =>
          query.view === "week" ? (
            <ScheduleWeek data={data} query={query} today={today} hrefBase={HOME} readOnly />
          ) : (
            <ScheduleMonth data={data} query={query} today={today} hrefBase={HOME} readOnly />
          )
        }
      </Body>
    </Card>
  );
}

type StaffRow = { no: number; item: StaffMemberListItem };
const DASH = "—";

// 직원 정보 — 그 점포의 재직 직원(퇴직 예정 포함). 직원 초대 버튼 · 직원 수 상한은 없다.
// 근무 시간 · 근무요일은 근로계약 조항(api #622). 근로계약 관리 조회 권한이 없으면 api 가 workDays 를 null 로 줘 「—」로 비운다(api #172)
function StaffCard({
  storeId,
  section,
  canContracts,
  canCreateContract,
  today,
  at,
}: {
  storeId: number;
  section: Section<{ items: StaffMemberListItem[]; total: number }>;
  canContracts: boolean;
  canCreateContract: boolean;
  today: string;
  /** 탭 BP 주소로 옮긴 화면(근로계약)의 링크에 탭 BP 를 붙인다 */
  at: (path: string) => string;
}) {
  const create = canCreateContract && <Button href={at("/contracts/new")}>계약서 작성</Button>;
  const counts = section.got && "data" in section.got ? staffCountsOf(section.got.data) : null;
  const masked = (render: (item: StaffMemberListItem) => ReactNode) => (r: StaffRow) => (r.item.isMasked ? DASH : render(r.item));
  return (
    <Card
      title={
        <>
          직원 정보
          {counts && (
            <span className="ml-[6px] text-[14px] font-normal text-erp-label">
              재직 {counts.employed} · 가입 대기 {counts.waiting}
              {counts.underAge ? ` · 가입 불가 ${counts.underAge}` : ""}
              {counts.masked ? ` · 가려진 직원 ${counts.masked}` : ""}
              {counts.partial ? ` (앞 ${STAFF_LIMIT}명 기준)` : ""}
            </span>
          )}
        </>
      }
      actions={
        <>
          {canContracts && soft("근로계약 관리", at(listHrefOf({ page: 1, pageSize: 20, staffMemberName: "", status: [], storeIds: [storeId], storesCleared: false, scope: null })))}
          {soft("직원 관리", staffListHrefOf({ ...DEFAULT_STAFF_LIST_QUERY, storeIds: [storeId] }))}
          {create}
        </>
      }
    >
      <Body section={section} what="직원 정보를">
        {({ items, total }) => (
          <>
            <DataTable<StaffRow>
              columns={[
                {
                  header: "직원",
                  width: "w-[200px]",
                  cell: ({ item }) =>
                    item.isMasked ? (
                      // 칸이 좁아 할 일 · 급여명세서와 같은 짧은 문구다
                      <span className="text-erp-muted">{MASKED_STAFF}</span>
                    ) : item.staffMemberId !== null && item.joinState === "JOINED" ? (
                      <Link href={`/staff-members/${item.staffMemberId}`} className="text-erp-link hover:underline">
                        {item.name}
                      </Link>
                    ) : (
                      item.name
                    ),
                },
                { header: "구분", width: "w-[110px]", cell: masked((item) => (item.employmentType ? EMPLOYMENT_TYPE_LABELS[item.employmentType] : DASH)) },
                { header: "근무 시간", width: "w-[150px]", cell: masked((item) => (item.contract?.workDays ? workTimeText(item.contract.workDays) : DASH)) },
                { header: "근무요일", width: "w-[130px]", cell: masked((item) => (item.contract?.workDays ? workDaysText(item.contract.workDays) : DASH)) },
                {
                  header: "근로계약",
                  cell: masked((item) => {
                    const cell = contractCell(item, today);
                    return cell ? <CellView cell={cell} /> : DASH;
                  }),
                },
                {
                  header: "상태",
                  width: "w-[180px]",
                  cell: masked((item) => (
                    <span className="inline-flex flex-wrap items-center justify-center gap-[4px]">
                      {oneStoreStatusCells(item).map((cell) => (
                        <CellView key={cell.text} cell={cell} />
                      ))}
                    </span>
                  )),
                },
              ]}
              rows={staffRowsOf(items).map((item, i) => ({ no: i, item }))}
              // 가린 행은 api 가 staffMemberId 를 null 로 준다 — 순번으로 가른다
              rowKey={(r) => r.item.staffMemberId ?? `masked-${r.no}`}
              empty={
                <span className="flex items-center justify-center gap-[12px]">
                  재직 중인 직원이 없습니다.
                  {create}
                </span>
              }
            />
            {total > STAFF_LIMIT && <p className="text-[13px] text-erp-label">앞 {STAFF_LIMIT}명만 보입니다. 전체는 직원 관리에서 봅니다.</p>}
          </>
        )}
      </Body>
    </Card>
  );
}
