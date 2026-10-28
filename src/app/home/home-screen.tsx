"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Badge, Button, DataTable, PageBar, type Column } from "@/components/common";
import { CodeLabel } from "@/components/site/code-label";
import { useAccount, useCurrentBp, useMenuRole, useMenus, useScope, useService, useStores } from "@/components/site/session-gate";
import { bpPath } from "@/lib/bp-path";
import { HOME, MENU_CODE, menuOfPath } from "@/lib/menus";
import { formatAt } from "@/lib/notification-view";
import { withScope } from "@/lib/store-scope";
import { isPlatformRole } from "@/lib/auth-routes";
import { OneStoreScreen } from "./one-store-screen";
import { oneStoreIdOf } from "./one-store-view";
import { useHomeApi } from "./use-home-api";
import { homeSearchOf, pendingLineOf, renewalNamesOf, type HomePending, type HomeSummary } from "./home-view";

const CARD = "rounded-[4px] border border-erp-panel-line bg-white";

// 로그인 후 홈 — 여러 점포 화면(WHALEERP-307~310, 목업 home/signed-in.html 「BP 마스터 화면」 · 데모 home/signed-in).
// 업무 범위는 헤더 범위 선택기다. 홈은 메뉴가 아니라 헤더가 이동시키지 않으므로 이 화면이 범위를 보고 다시 부른다.
// 업무 범위가 점포 하나면 점포 하나 화면(one-store-screen.tsx, HOME-6)이다.
export function HomeScreen() {
  const account = useAccount();
  const bp = useCurrentBp().bpCodeId;
  const stores = useStores();
  const [scope] = useScope();
  const [reloads, setReloads] = useState(0);
  const search = homeSearchOf(scope, stores);
  const key = `${search}#${reloads}`;
  // 점포 하나면 점포 하나 화면(HOME-6) — 홈 집계(summary · pending)는 부르지 않는다. 플랫폼 계정 · 쓸 수 없는 범위는 아래에서 먼저 가른다
  const oneStore = search === null || isPlatformRole(account.roleTypeCode) ? null : oneStoreIdOf(scope, account.roleTypeCode, stores);
  const many = search !== null && oneStore === null;
  const summary = useHomeApi<HomeSummary>(many ? `/home/summary${search}` : null, key, "현황");
  const pending = useHomeApi<HomePending>(many ? `/home/pending${search}` : null, key, "처리 대기");

  const menus = useMenus();
  const service = useService();
  const canOpen = (path: string) => menuOfPath(menus, path, service) !== null;
  const canCreateStore = !!menuOfPath(menus, "/stores", service)?.permission.create;

  const s = summary && "data" in summary ? summary.data : null;
  const p = pending && "data" in pending ? pending.data : null;
  const asOf = s?.asOf ?? p?.asOf;
  // 플랫폼 계정은 로그인 정보의 역할로 먼저 가른다 — 빈 범위면 api 를 부르지 않아 응답의 platform 을 받지 못한다
  const platform = isPlatformRole(account.roleTypeCode) || s?.platform || p?.platform;
  // 본사 역할에게는 본사 제공 동의가 없는 가맹 직원이 고용 형태 · 출근 수에서 빠진다(운영 정책 ATT-30) — 카드에 그 사실을 적는다
  const hq = account.roleTypeCode === "BM" || account.roleTypeCode === "BA";

  let body: ReactNode;
  if (platform) {
    // 플랫폼 계정은 현황 없이 안내만(2026-10-27 재영 · HOME-8). Platform 콘솔은 헤더 바로가기처럼 새 탭으로 연다
    body = (
      <Notice text="플랫폼 계정은 홈 현황을 보지 않습니다. BP 의 업무는 각 메뉴에서, 플랫폼 운영은 Platform 콘솔에서 합니다.">
        <Button href={HOME.PLATFORM} target="_blank" rel="noopener">
          Platform 콘솔
        </Button>
      </Notice>
    );
  } else if (!stores.length) {
    // 점포가 없는 BP — 빈 현황 대신 등록으로 안내한다(HOME-4)
    body = (
      <Notice text="등록된 점포가 없습니다. 점포를 먼저 등록하세요.">
        {canCreateStore && <Button href={bpPath(bp, "/stores/new")}>점포 등록</Button>}
      </Notice>
    );
  } else if (search === null) {
    // 범위에 드는 점포가 이 탭에 없다(다른 BP 탭에서 복사한 범위 등) — 쿼리를 빼면 BP 전체가 보이므로 부르지 않는다
    body = <Notice text="상단 범위에 해당하는 점포가 이 탭에 없습니다. 상단에서 범위를 다시 고르세요." />;
  } else if (oneStore !== null) {
    body = <OneStoreScreen storeId={oneStore} reloadKey={String(reloads)} />;
  } else {
    const renewalItem = p?.items.find((i) => i.type === "CONTRACT_RENEWAL");
    const failed = (what: string, error: string) => <Notice text={`${what} 불러오지 못했습니다. ${error}`} />;
    body = (
      <>
        {p?.renewals?.length ? <RenewalBand renewals={p.renewals} href={renewalItem ? (pendingLineOf(renewalItem, bp)?.href ?? "/contracts") : "/contracts"} /> : null}
        {s?.cards && <Cards cards={s.cards} hq={hq && s.cards.stores.franchise > 0} scopeHref={(href) => withScope(href, scope)} canOpen={canOpen} bp={bp} />}
        <div className="grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-start gap-[12px]">
          {!summary ? <Notice text="현황을 불러오는 중입니다." /> : "error" in summary ? failed("현황을", summary.error) : <StoreTable table={summary.data.storeTable} hq={hq && !!s?.cards?.stores.franchise} staffHref={canOpen("/staff-members") ? withScope("/staff-members", scope) : null} />}
          {!pending ? <Notice text="처리 대기를 불러오는 중입니다." /> : "error" in pending ? failed("처리 대기를", pending.error) : <Pending data={pending.data} bp={bp} />}
        </div>
      </>
    );
  }

  return (
    <>
      <PageBar title={account.name ? `안녕하세요, ${account.name}님` : "안녕하세요"}>
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

// 경고 밴드 — 갱신 예정 계약 중 종료일이 7일 안인 것이 있을 때만(HOM-04). 가려진 직원은 이름 없이 점포만 적는다
function RenewalBand({ renewals, href }: { renewals: NonNullable<HomePending["renewals"]>; href: string }) {
  const canCreate = useMenuRole(MENU_CODE.contracts, "create");
  return (
    <div className={`${CARD} flex items-center gap-[12px] px-[24px] py-[12px]`}>
      <Badge tone="off">갱신 예정</Badge>
      <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
        <p className="text-[15px] font-semibold">계약 갱신 예정 {renewals.length}건이 7일 안에 끝납니다</p>
        <p className="truncate text-[14px] text-erp-label">
          {renewalNamesOf(renewals)} 에 계약이 종료됩니다. 새 근로계약서 초안을 저장하면 재직 중이라 즉시 발송됩니다.
        </p>
      </div>
      <div className="flex gap-[6px]">
        <Button variant="soft" href={href}>
          계약 보기
        </Button>
        {canCreate && <Button href="/contracts/new">새 계약 작성</Button>}
      </div>
    </div>
  );
}

// 수치 카드 — 라벨 · 숫자 · 아랫줄(데모 figure). 갈 화면에 조회 권한이 있으면 카드 전체가 링크다
function Figure({ href, label, value, unit, sub, note }: { href: string | null; label: string; value: number; unit: string; sub: ReactNode; note?: string }) {
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
      {note && <span className="text-[12px] text-erp-muted">{note}</span>}
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

// 수치 카드 넷 — api 가 null 을 준 카드(그 메뉴의 조회 권한 없음)는 숨긴다. 「준비 중」 자리를 남기지 않고 남은 카드가 칸을 나눠 채운다(HOME-5).
// 미체결 계약 수는 카드에 두지 않는다 — 직원 정보 관리 권한이 없으면 재직 직원 카드와 함께 사라졌다. 점포별 현황 표에만 둔다(WHALEERP-620 A안, 2026-10-28 재영)
function Cards({ cards, hq, scopeHref, canOpen, bp }: { cards: CardsData; hq: boolean; scopeHref: (href: string) => string; canOpen: (path: string) => boolean; bp: number }) {
  const { staff, stores, todayAttendance: today, myInquiries: inquiries } = cards;
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-[12px]">
      {staff && (
        <Figure
          href={canOpen("/staff-members") ? scopeHref("/staff-members") : null}
          label="재직 직원"
          note={hq ? "동의하지 않은 가맹 직원은 고용 형태에 세지 않습니다" : undefined}
          value={staff.total}
          unit="명"
          sub={`정직원 ${staff.fullTime} · 파트 ${staff.partTime}`}
        />
      )}
      <Figure href={canOpen("/stores") ? bpPath(bp, scopeHref("/stores")) : null} label="운영 점포" value={stores.total} unit="개점" sub={`직영 ${stores.direct} · 가맹 ${stores.franchise}`} />
      {today && (
        <Figure
          href={canOpen("/attendance-records") ? scopeHref("/attendance-records") : null}
          label="오늘 출근"
          note={hq ? "동의하지 않은 가맹 직원은 출근 · 미출근에 세지 않습니다" : undefined}
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
    </div>
  );
}

type StoreRow = HomeSummary["storeTable"]["items"][number];
/** 권한이 없으면 api 가 null 을 주는 칸 */
type NullableCount = "staffCount" | "unsignedContractCount" | "checkedInCount";

// 점포별 현황 표 — api 가 준 미조치 많은 순 일곱 곳. 목업의 전체 · 직영 · 가맹 탭은 두지 않는다 — 업무 범위는 헤더 한 곳에서 고른다(운영 정책 SCP-01).
// 그 메뉴의 조회 권한이 없어 api 가 모든 줄에 null 을 준 열은 숨긴다 — 「—」가 0건과 권한 없음을 같이 뜻하지 않게(WHALEERP-620, 2026-10-28 재영)
function StoreTable({ table, hq, staffHref }: { table: HomeSummary["storeTable"]; hq: boolean; staffHref: string | null }) {
  const shown = (key: NullableCount) => table.items.some((r) => r[key] !== null);
  const hqNote = hq
    ? [shown("unsignedContractCount") && "미체결 계약", shown("checkedInCount") && "오늘 출근"].filter(Boolean).join(" · ")
    : "";
  return (
    <section className={`${CARD} flex flex-col gap-[12px] p-[24px]`}>
      <div className="flex items-end gap-[6px]">
        <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">점포별 현황</h2>
        <span className="text-[14px] text-erp-label">전체 {table.total}개점</span>
      </div>
      <DataTable<StoreRow>
        columns={(
          [
            { header: "점포", align: "left", cell: (r) => <span className="truncate">{r.storeName}</span> },
            { header: "유형", width: "w-[70px]", cell: (r) => <CodeLabel group="STORE_TYPE" value={r.storeTypeCode} /> },
            shown("staffCount") && { header: "재직 직원", width: "w-[86px]", cell: (r) => num(r.staffCount) },
            shown("unsignedContractCount") && { header: "미체결 계약", width: "w-[96px]", cell: (r) => num(r.unsignedContractCount) },
            // 출근 / 근무 예정. 근무 예정이 없으면 「—」
            shown("checkedInCount") && {
              header: "오늘 출근",
              width: "w-[86px]",
              cell: (r) => (r.checkedInCount !== null && r.scheduledCount ? `${r.checkedInCount} / ${r.scheduledCount}` : num(r.checkedInCount)),
            },
            { header: "미조치", width: "w-[70px]", cell: (r) => num(r.pendingActionCount) },
          ] satisfies (Column<StoreRow> | false)[]
        ).filter((c) => c !== false)}
        rows={table.items}
        rowKey={(r) => r.storeId}
      />
      <div className="flex items-center text-[14px]">
        <p className="flex-1 text-erp-label">
          {table.total}개점 중 상위 {table.items.length}개 · 미조치 많은 순
          {/* 출근 수만 가린 값이라 「1 / 5」처럼 보일 수 있다 — 수치 카드와 같은 안내(운영 정책 ATT-30). 보이는 열만 적는다 */}
          {hqNote && <span className="ml-[8px] text-[12px] text-erp-muted">동의하지 않은 가맹 직원은 {hqNote}에 세지 않습니다</span>}
        </p>
        {staffHref && (
          <Link href={staffHref} className="text-erp-link hover:underline">
            직원 목록
          </Link>
        )}
      </div>
    </section>
  );
}

// 처리 대기 — api 순서 그대로(갱신 예정 → 계약 → 직원 → 문의 → TO-DO), 0건 유형은 api 가 뺀다. 운영 알림은 나열하지 않는다(HOM-08)
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
        <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">처리 대기</h2>
        <p className="text-[14px]">
          총 <b className="font-semibold">{total}</b> 건
        </p>
      </div>
      <DataTable
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
          { header: "내용", align: "left", cell: (l) => <span className="truncate text-erp-label">{l.desc}</span> },
        ]}
        rows={lines}
        rowKey={(l) => l.type}
        empty="처리할 일이 없습니다."
      />
    </section>
  );
}
