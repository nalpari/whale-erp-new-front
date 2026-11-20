import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DetailTable, DetailValues, LoadGroup, LoadGroupArea, PageBar, SummaryStrip } from "@/components/common";
import { deniedMessageOf, getEnum, screenPath } from "@/lib/api";
import type { EnumValue } from "@/lib/enums";
import { hqSharingConsentText, kstToday, staffEmailText } from "@/lib/staff-members";
import { MENU_CODE } from "@/lib/menus";
import { getStaffMember, staffMemberIdOf } from "@/lib/staff-members-api";
import { detailListHrefOf } from "../staff-list-query";
import { ResendInvitationButton } from "../resend-invitation-button";
import { canResendInvitation, EMPLOYMENT_TYPE_LABELS, employmentStatusCells, formatPhone, invitationParts, joinCell } from "../staff-row";
import { CellView } from "../staff-table";
import { BirthDateEditButton } from "./birth-date-dialog";
import { ContractBox } from "./contract-box";
import { Box } from "./detail-box";
import { employmentHistoryLines, historySearch } from "./employment-history";
import { MenuManageLink } from "./manage-link";
import { SendLogBox } from "./send-log-box";
import { PasswordResetButton, StaffDetailActions } from "./staff-detail-actions";
import { AttendanceBox, PayslipBox, ScheduleBox, TodoBox } from "./summary-boxes";
import { attendanceManageHref, payslipManageHref, scheduleWeekOf, todoManageHref } from "./summary-view";
import { WeekNav } from "./week-nav";
import { StoreNameWithType } from "@/components/site/store-type-tag";

export const metadata: Metadata = {
  title: "직원 상세 · Whale ERP",
};

// 값이 없는 칸.
const PENDING = "-";
// 기다리는 동안의 빈 자리(영역 하나, 그리고 상세 본문 묶음) — 상세 진입 · 작은 영역에는 고래 로딩을 쓰지 않는다. 최소 높이만 잡아 영역이 들어올 때 상자 높이가 크게 출렁이지 않게 한다.
const AREA_PENDING = <div aria-hidden="true" className="min-h-[92px]" />;
// 바깥 LoadGroup(본문 전체) fallback 에만 스크린리더용 안내를 붙인다 — 영역 4곳까지 읽히면 「로딩중입니다.」가 여럿 겹친다
const BODY_PENDING = (
  <div role="status" className="min-h-[92px]">
    <span className="sr-only">로딩중입니다.</span>
  </div>
);

// 오른쪽 영역의 「관리」. TO-DO 는 화면(#116)과 메뉴 url(MN000026 /todos)이, 근무스케줄은 화면(#202)과 메뉴 url(MN000010 /work-schedules)이, 급여명세서는 화면과
// 메뉴 url(MN000009 /payslips)이, 출퇴근 현황은 화면과 메뉴 url(MN000025 /attendance-records)이 있어 걸었다 — 근무스케줄 · 출퇴근 현황은 그 직원의 근무지 · 칸이 보던 주로 연다.

// 가입 상태 한글(이메일 칸, WHALEERP-180). 받지 못해도 상세는 그린다 — 이메일 칸만 「-」가 되고 원인은 서버 로그에 남긴다.
async function loadJoinStateLabels(): Promise<EnumValue[]> {
  try {
    return await getEnum("StaffJoinState");
  } catch (error) {
    console.error("직원 상세: GET /enums/StaffJoinState 를 받지 못했습니다", error);
    return [];
  }
}

// 초대 유형 · 상태 한글(「초대」 줄, WHALEERP-138)과 본사 제공 동의 한글(WHALEERP-184). 받지 못해도 상세는 그린다 — 그 조각만 「-」가 되거나 빠지고 원인은 서버 로그에 남긴다.
async function loadEnumOrEmpty(name: string): Promise<EnumValue[]> {
  try {
    return await getEnum(name);
  } catch (error) {
    console.error(`직원 상세: GET /enums/${name} 를 받지 못했습니다`, error);
    return [];
  }
}

// 직원 상세(WHALEERP-184). 배치는 데모 docs/demo/staff/detail.html(원본 src/pages/staff/detail.mjs)과 같다 — 5:7 두 단,
// 왼쪽은 기본 정보 · 비밀번호 초기화 · 근로계약, 오른쪽은 근무스케줄 · 출퇴근 현황 · 급여명세서 · TO-DO. 두 단 아래에 발송 이력(WHALEERP-136, 데모에 없음).
// 기본 정보는 상세 api(GET /staff-members/:id, WHALEERP-599 · 183)로 받는다 — 목록 한 줄에 계정 이메일 · 직무 · 입사일 · 생년월일을 더한 모양이다.
// 근로계약 · 근무스케줄 · 급여명세서 · TO-DO 건수는 영역마다 상세 요약 api(GET /staff-members/:id/summary/…, WHALEERP-183)로 따로 받아
// 한 영역만 실패하거나 그 영역 메뉴 권한이 없어도 나머지는 그린다(summary-boxes.tsx). 가린 직원 · 없는 직원 · 이상한 id 는 404 다.
export default async function StaffMemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id: rawId } = await params;
  const search = await searchParams;
  const [staff, joinStateLabels, invitationTypeLabels, invitationStatusLabels, hqConsentLabels] = await Promise.all([
    // api 의 거절(BP 를 고르지 않은 플랫폼 계정 400 · 다른 BP 403 — deniedMessageOf)은 오류 화면이 아니라 그 문장으로 보인다. 404(없는 직원 · 업무 범위 밖 · 고른 BP 에 없음)는 getStaffMember 가 null 로 바꿔 notFound 다(근로계약 상세와 같다)
    getStaffMember(rawId).catch((e: unknown) => {
      const notice = deniedMessageOf(e);
      if (notice === null) throw e;
      return { notice };
    }),
    loadJoinStateLabels(),
    loadEnumOrEmpty("InvitationType"),
    loadEnumOrEmpty("InvitationStatus"),
    loadEnumOrEmpty("HqSharingConsentState"),
  ]);
  if (staff && "notice" in staff)
    return (
      <>
        <PageBar title="직원 정보 관리" />
        <p role="alert" className="p-[24px] text-[14px] text-erp-label">
          {staff.notice}
        </p>
      </>
    );
  const staffMemberId = staffMemberIdOf(rawId);
  if (!staff || staffMemberId === null) notFound();
  const employmentStatus = employmentStatusCells(staff);
  const hqConsent = hqSharingConsentText(staff, hqConsentLabels);
  // [목록] 주소 — 목록이 상세 링크에 ?back= 으로 실어 보낸 목록 주소(근로계약 · TO-DO 처럼 ?back= 을 쓰되, 받은 쿼리는 목록 규칙으로 다시
  // 만든다). ?back= 이 없는 예전 형식 주소는 상세 주소에 붙은 목록 조건으로 돌아간다(detailListHrefOf). 주 넘김(weekHref)은 둘 다 그대로 둔다.
  // 재직 이력 링크도 이 주소를 ?back= 으로 싣고 근무스케줄이 보던 주(week)를 이어 단다(historySearch)
  const listHref = detailListHrefOf(search);
  // 재직 이력 링크 · 근로계약 칸 작성 버튼(?entry=)이 함께 싣는 조건 — [목록] 주소와 보던 주
  const detailSearch = historySearch(listHref, search.week);
  const today = kstToday();
  // 근무스케줄 영역이 볼 주(월요일). 주소 week 가 없거나 날짜가 아니면 이번 주(데모 weekNav, 2026-10-22 노영주 — WHALEERP-185 기간 선택을 걷었다)
  const monday = scheduleWeekOf(search, today);
  // 서버가 그리는 링크(재직 이력)에 탭 BP 를 붙인다. 목록 주소 · ?back= 은 옛 경로 그대로다. 「관리」 링크(MenuManageLink)는 화면이 붙인다
  const at = await screenPath();

  // 기본 정보를 성격대로 나눈다(2026-11-19 사용자 지정 — 전엔 근무 · 인적 사항 · 앱 계정 값이 「기본 정보」 한 표에 섞여 있었다).
  // 맨 위 요약 띠: 성명(+ 재직 상태) · 고용형태 · 직무 · 근무지 · 입사일 · 가입 상태 — 근로계약 · 급여명세서 상세와 같은 모양
  const summaryCells = [
    {
      label: "성명",
      value: (
        <span className="inline-flex min-w-0 items-center gap-[8px] text-[15px] font-semibold text-erp-ink">
          <span className="truncate">{staff.name}</span>
          {employmentStatus.map((cell) => (
            <CellView key={cell.text} cell={cell} />
          ))}
        </span>
      ),
    },
    { label: "고용형태", value: <span className="text-[15px] font-semibold text-erp-ink">{staff.employmentType ? EMPLOYMENT_TYPE_LABELS[staff.employmentType] : PENDING}</span> },
    { label: "직무", value: <span className="text-[15px] font-semibold text-erp-ink">{staff.jobTitle || PENDING}</span> },
    // 근무지 이름 앞에 본사 · 직영 · 가맹 꼬리표 — 직원 목록 · 근로계약 상세와 같다
    {
      label: "근무지",
      value: (
        <span className="text-[15px] font-semibold text-erp-ink">
          <StoreNameWithType storeId={staff.store.storeId} name={staff.store.name} isHq={staff.store.isHq} />
        </span>
      ),
    },
    // 입사일은 나중에 시스템이 첫 체결 계약 시작일로 채운다(2026-10-21 재영)
    { label: "입사일", value: <span className="text-[15px] font-semibold text-erp-ink">{staff.hiredDate ?? PENDING}</span> },
    // 가입 상태 · 재발송은 목록과 같은 함수 · 버튼이다(staff-row.ts, WHALEERP-138)
    {
      label: "가입 상태",
      value: (
        <span className="inline-flex items-center gap-[6px]">
          <CellView cell={joinCell(staff, today)} />
          {staff.contract && canResendInvitation(staff) && <ResendInvitationButton contractId={staff.contract.contractId} name={staff.name} status={staff.contract.status} lastSentAt={staff.contract.lastSentAt} />}
        </span>
      ),
    },
  ];
  // 인적 사항 — 본인 확인용 값. 생년월일은 가입한 계정 값, 가입 전 · 탈퇴면 가장 최근 계약에 적은 값(api #183)
  const personalRows = [
    { label: "생년월일", value: staff.birthDate ?? PENDING },
    { label: "휴대전화번호", value: staff.phone ? formatPhone(staff.phone) : PENDING },
  ];
  // 재직 정보 — 있는 직원만: 퇴직일(퇴직 예정 · 퇴직), 재입사로 이은 다른 재직 기간(WHALEERP-615), 본사 제공 동의(가맹 점포 직원만, ATT-30)
  const workRows = [
    ...(staff.retiredDate ? [{ label: "퇴직일", value: staff.retiredDate }] : []),
    // 좁은 단에서 기간이 꺾여도 잘리지 않게 높이가 내용만큼 늘어나는 줄로 둔다
    ...employmentHistoryLines(staff, detailSearch).map((line) => ({
      label: line.label,
      multiline: true,
      value: (
        <span className="flex flex-col gap-[4px]">
          {line.links.map((link, i) => (
            <span key={`${i}-${link.href}`}>
              <Link href={at(link.href)} aria-label={`${line.label} ${link.text} 직원 상세`} className="text-erp-link hover:underline">
                {link.text}
              </Link>
              {line.note && <span className="text-erp-muted"> · {line.note}</span>}
            </span>
          ))}
        </span>
      ),
    })),
    ...(hqConsent === null ? [] : [{ label: "본사 제공 동의", value: hqConsent }]),
  ];
  // 직원 앱 계정 — 계정 이메일(회원 ID, ACC-17 · WHALEERP-180)과 초대(WHALEERP-138). 인적 사항과 한 표 「직원 정보」로 보인다
  const accountRows = [
    { label: "이메일", value: staffEmailText(staff, joinStateLabels) },
    {
      label: "초대",
      value: (() => {
        const parts = invitationParts(staff.invitation, invitationTypeLabels, invitationStatusLabels);
        return parts.length ? <DetailValues items={parts} /> : PENDING;
      })(),
    },
  ];

  return (
    <>
      <PageBar title="직원 정보 관리" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <div className="flex flex-1 flex-col gap-[12px]">
            <div className="flex items-center gap-[6px]">
              <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">직원 상세</h2>
              <StaffDetailActions staff={staff} today={today} listHref={listHref} />
            </div>
            {/* 요약 띠는 상세 응답만으로 그리므로 먼저 보인다. 그 아래 본문 전체(직원 정보 · 영역들)는 처음 들어올 때 LoadGroup 이 빈 자리로 덮고(상세 진입에는 고래를 쓰지 않는다), 영역이 모두(발송 이력 포함) 온 뒤 한 번에 보인다.
                  영역은 LoadGroupArea 가 각자 세기만 한다 */}
            <SummaryStrip cells={summaryCells} />
            <LoadGroup fallback={BODY_PENDING}>
              <div className="grid grid-cols-[5fr_7fr] items-start gap-[24px]">
                <div className="flex min-w-0 flex-col gap-[24px]">
                  {/* 인적 사항 · 직원 앱 계정을 한 표 「직원 정보」로 — 근로계약 상세 「직원 정보」와 같은 이름(2026-11-19 사용자 지정). [비밀번호 초기화]는 제목 줄 오른쪽 */}
                  <DetailTable title="직원 정보" action={
                      <span className="flex items-center gap-[6px]">
                        <BirthDateEditButton staff={staff} today={today} />
                        <PasswordResetButton staff={staff} />
                      </span>
                    } rows={[...personalRows, ...accountRows]} />
                  {workRows.length > 0 && <DetailTable title="재직 정보" rows={workRows} />}
                  {/* 가장 최근 계약 1건 — 근로계약 영역 요약(api #183). 계약이 없으면 그 칸이 작성으로 넘긴다 */}
                  <Box
                    title="근로계약"
                    manage={
                      <MenuManageLink
                        menuCode={MENU_CODE.contracts}
                        menuName="근로계약 관리"
                        href={staff.contract ? `/contracts/${staff.contract.contractId}` : "/contracts"}
                      />
                    }
                  >
                    <LoadGroupArea fallback={AREA_PENDING}>
                      <ContractBox staffMemberId={staffMemberId} detailSearch={detailSearch} />
                    </LoadGroupArea>
                  </Box>
                </div>
                {/* 영역마다 따로 받는다 — 한 영역이 실패해도 그 영역에만 안내 · 다시 하기를 그리고 나머지는 그대로다 */}
                <div className="flex min-w-0 flex-col gap-[24px]">
                  {/* 근무스케줄 · 출퇴근 현황은 같은 주를 본다 — 주 이동을 두 상자 위 한 줄로 올리고 두 상자를 12px 로 붙여 한 덩어리로 보인다
                      (2026-11-19 사용자 지정 — 전엔 근무스케줄 제목 줄에만 있어 출퇴근 현황이 따라 바뀌는 게 보이지 않았다) */}
                  <div className="flex flex-col gap-[12px]">
                  <div className="flex items-center gap-[8px]">
                    <span className="flex-1 text-[14px] font-medium text-erp-label">근무스케줄 · 출퇴근 현황 기간</span>
                    <WeekNav monday={monday} search={search} today={today} />
                  </div>
                  <Box
                    title="근무스케줄"
                    manage={
                      <MenuManageLink
                        menuCode={MENU_CODE.workSchedules}
                        menuName="근무스케줄 관리"
                        href={`/work-schedules?${new URLSearchParams({ store: String(staff.store.storeId), week: monday })}`}
                      />
                    }
                  >
                    {/* 주를 바꾸면 이 영역만 다시 기다린다 — key 가 바뀌면 영역의 Suspense 경계가 새로 서고, 묶음은 이미 풀려 있어 이 영역만 로딩을 보인다 */}
                    <LoadGroupArea key={monday} fallback={AREA_PENDING}>
                      <ScheduleBox staffMemberId={staffMemberId} weekStart={monday} />
                    </LoadGroupArea>
                  </Box>
                  {/* 출퇴근 현황은 근무스케줄과 같은 주를 따라간다 — 주 넘김이 monday 를 바꾸면 이 영역도 key 로 다시 기다린다 */}
                  <Box
                    title="출퇴근 현황"
                    manage={
                      <MenuManageLink
                        menuCode={MENU_CODE.attendanceRecords}
                        menuName="출·퇴근 현황 조회"
                        href={attendanceManageHref(staffMemberId, staff.store.storeId, monday, today)}
                      />
                    }
                  >
                    <LoadGroupArea key={monday} fallback={AREA_PENDING}>
                      <AttendanceBox staffMemberId={staffMemberId} weekStart={monday} />
                    </LoadGroupArea>
                  </Box>
                  </div>
                  <Box title="급여명세서" manage={<MenuManageLink menuCode={MENU_CODE.payslips} menuName="급여명세서 관리" href={payslipManageHref(staff.name, staff.store.storeId)} />}>
                    <LoadGroupArea fallback={AREA_PENDING}>
                      <PayslipBox staffMemberId={staffMemberId} />
                    </LoadGroupArea>
                  </Box>
                  <Box title="TO-DO" manage={<MenuManageLink menuCode={MENU_CODE.todos} menuName="TO-DO 리스트 관리" href={todoManageHref(staffMemberId, staff.store.storeId)} />}>
                    {/* TO-DO 관리 조회 권한이 없으면 목록까지 영역 전체를 막는다(summary-boxes.tsx TodoBox) */}
                    <LoadGroupArea fallback={AREA_PENDING}>
                      <TodoBox staffMemberId={staffMemberId} />
                    </LoadGroupArea>
                  </Box>
                </div>
              </div>
              {/* 발송 이력(WHALEERP-136) — 열이 많아 두 단 아래 전체 너비로 둔다. 따로 된 발송 이력 화면은 두지 않기로 해(2026-10-26 김민식)
                  「관리」 자리를 비운다 — 흐린 「관리」(준비 중)는 생길 화면이 있다는 뜻이라 쓰지 않는다 */}
              <div className="mt-[24px]">
                <Box title="발송 이력" manage={false}>
                  <LoadGroupArea fallback={AREA_PENDING}>
                    <SendLogBox staffMemberId={staffMemberId} />
                  </LoadGroupArea>
                </Box>
              </div>
            </LoadGroup>
          </div>
        </div>
      </div>
    </>
  );
}
