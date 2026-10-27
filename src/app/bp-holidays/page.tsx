import { PageBar } from "@/components/common";
import { CARD, FailedBand } from "@/components/site/side-parts";
import { ApiError, deniedMessageOf } from "@/lib/api";
import { outsideHoliday, parseBpHolidayQuery } from "@/lib/bp-holiday-view";
import { getBpHoliday, getBpHolidays, type BpHolidayDetail } from "@/lib/bp-holidays";
import { kstToday } from "@/lib/staff-members";
import { HolidaysScreen } from "./holidays-screen";

// BP 휴일 관리(MN000015 · S-YAFRYZ · 등록 S-UCPMYB · 상세 S-MQELTV · 수정 S-BXEAEZ). 데모 docs/demo/config/holidays*.html 을 공통 컴포넌트로 옮겼다.
// 한 달씩 캘린더 · 목록으로 보고, 등록 · 상세 · 수정은 목록 위로 밀려 나오는 슬라이드 패널이다(데모와 같다).
// 휴일은 규칙 한 건이고 날짜는 api 가 볼 때 계산한다. 변경은 「BP 휴일 변경 · 종료 정책」(1팀, 2026-10-26)을 따른다 — 지난 날짜는 바뀌지 않고,
// 진행 중 휴일은 휴일명 · 설명 · 점포만, 끝난 휴일은 고칠 수 없고, 지난 날짜가 있으면 삭제 대신 강제 종료(어제로 끝냄)다.
// 화면 주소는 /bp/{탭 BP}/bp-holidays 다 — proxy 가 이 폴더로 rewrite 하며 탭 BP 를 헤더에 싣는다. 화면 상태는 주소에 둔다(bp-holiday-view.ts).
export default async function BpHolidaysPage({ searchParams }: PageProps<"/bp-holidays">) {
  const today = kstToday();
  const query = parseBpHolidayQuery(await searchParams, today);
  const [list, detail] = await Promise.all([getBpHolidays(query.year, query.month).catch(listDenied), query.holiday ? loadDetail(query.holiday, query.at) : null]);
  if ("denied" in list)
    return (
      <>
        <PageBar title="BP 휴일 관리" />
        <div className="flex min-h-0 flex-1 p-[24px]">
          <section className={`${CARD} flex-1`}>
            <FailedBand message={list.denied} />
          </section>
        </div>
      </>
    );
  // 제목 줄(PageBar)은 HolidaysScreen 이 그린다 — [등록]이 등록 패널을 여는 상태와 같은 곳에 있어야 해서다
  return <HolidaysScreen query={query} today={today} list={list} detail={detail} />;
}

/**
 * 목록을 api 가 거절했으면(400 플랫폼 계정의 BP 미선택 · 403 권한 · 404) 오류 화면 대신 그 문장을 보인다. 401 은 고정 문구로.
 * 거절이 아닌 것은 그대로 던져 error.tsx 가 받는다.
 */
const listDenied = (error: unknown): { denied: string } => {
  if (error instanceof ApiError && error.status === 401) return { denied: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
  const denied = deniedMessageOf(error);
  if (denied === null) throw error;
  console.warn("BP 휴일 목록 거절", error instanceof ApiError ? error.status : undefined, denied);
  return { denied };
};

/** 상세를 못 불러오면 패널은 열되 실패 띠로 알린다 — 404(지웠거나 볼 수 없는 휴일)는 그 사실을, 그 밖은 일반 문구를. */
async function loadDetail(id: number, at: string | null): Promise<{ holiday: BpHolidayDetail } | { failed: string }> {
  try {
    const holiday = await getBpHoliday(id, at);
    // 「적용 점포」는 고른 날짜 기준이다. 그 날짜가 휴일 기간 밖이면(등록 직후 · 시작일을 옮긴 수정 뒤 · 오래된 주소) 0곳이 되므로
    // 시작일 기준으로 다시 받는다(브라우저 시험으로 찾음, 2026-10-27)
    return { holiday: at && outsideHoliday(holiday, at) ? await getBpHoliday(id, holiday.startDate) : holiday };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { failed: "삭제되었거나 볼 수 없는 휴일입니다." };
    if (error instanceof ApiError && [400, 403].includes(error.status)) return { failed: error.message };
    console.error("BP 휴일 상세 조회 실패", id, error);
    return { failed: "상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}
