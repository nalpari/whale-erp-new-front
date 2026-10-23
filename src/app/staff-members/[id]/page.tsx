import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DetailTable, PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
import type { EnumValue } from "@/lib/enums";
import { hqSharingConsentText, kstToday, staffEmailText } from "@/lib/staff-members";
import { MENU_CODE } from "@/lib/menus";
import { getStaffMember, staffMemberIdOf } from "@/lib/staff-members-api";
import { detailListHrefOf } from "../staff-list-query";
import { ResendInvitationButton } from "../resend-invitation-button";
import { canResendInvitation, EMPLOYMENT_TYPE_LABELS, employmentStatusCells, formatPhone, invitationText, joinCell } from "../staff-row";
import { CellView } from "../staff-table";
import { ContractBox } from "./contract-box";
import { AreaLoading, Box, BoxMessage } from "./detail-box";
import { employmentHistoryLines, historySearch } from "./employment-history";
import { MenuManageLink } from "./manage-link";
import { PasswordResetButton, StaffDetailActions } from "./staff-detail-actions";
import { PayslipBox, ScheduleBox, TodoBox } from "./summary-boxes";
import { scheduleWeekOf } from "./summary-view";
import { WeekNav } from "./week-nav";

export const metadata: Metadata = {
  title: "직원 상세 · Whale ERP",
};

// 값이 없는 칸.
const PENDING = "-";

function NotReady() {
  return <BoxMessage>준비 중입니다.</BoxMessage>;
}

// 오른쪽 영역의 「관리」. 출퇴근 현황은 아직 링크를 걸지 않는다 — 화면이 없다(메뉴 url #592 결정 /attendance-records).
// TO-DO 는 화면(#116)과 메뉴 url(MN000026 /todos)이, 근무스케줄은 화면(#202)과 메뉴 url(MN000010 /work-schedules)이, 급여명세서는 화면과
// 메뉴 url(MN000009 /payslips)이 있어 걸었다 — 근무스케줄은 그 직원의 근무지 · 칸이 보던 주로 연다.

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
// 왼쪽은 기본 정보 · 비밀번호 초기화 · 근로계약, 오른쪽은 근무스케줄 · 출퇴근 현황 · 급여명세서 · TO-DO.
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
    getStaffMember(rawId),
    loadJoinStateLabels(),
    loadEnumOrEmpty("InvitationType"),
    loadEnumOrEmpty("InvitationStatus"),
    loadEnumOrEmpty("HqSharingConsentState"),
  ]);
  const staffMemberId = staffMemberIdOf(rawId);
  if (!staff || staffMemberId === null) notFound();
  const employmentStatus = employmentStatusCells(staff);
  const hqConsent = hqSharingConsentText(staff, hqConsentLabels);
  // [목록] 주소 — 목록이 상세 링크에 ?back= 으로 실어 보낸 목록 주소(근로계약 · TO-DO 처럼 ?back= 을 쓰되, 받은 쿼리는 목록 규칙으로 다시
  // 만든다). ?back= 이 없는 예전 형식 주소는 상세 주소에 붙은 목록 조건으로 돌아간다(detailListHrefOf). 주 넘김(weekHref)은 둘 다 그대로 둔다.
  // 재직 이력 링크도 이 주소를 ?back= 으로 싣고 근무스케줄이 보던 주(week)를 이어 단다(historySearch)
  const listHref = detailListHrefOf(search);
  const today = kstToday();
  // 근무스케줄 영역이 볼 주(월요일). 주소 week 가 없거나 날짜가 아니면 이번 주(데모 weekNav, 2026-10-22 노영주 — WHALEERP-185 기간 선택을 걷었다)
  const monday = scheduleWeekOf(search, today);

  const basicRows = [
    // 재직 상태는 이름 옆 칩이다(184 완료 조건 2 「이름 아래」 — 줄 높이 46 이 고정이라 옆에 둔다). 본인인증은 1차 범위 밖이라(WHALEERP-612 → 2차)
    // 줄도 칩도 두지 않는다(2026-10-21 재영).
    {
      label: "이름",
      value: (
        <span className="inline-flex min-w-0 items-center gap-[10px]">
          <span className="truncate">{staff.name}</span>
          {employmentStatus.map((cell) => (
            <CellView key={cell.text} cell={cell} />
          ))}
        </span>
      ),
    },
    { label: "직무", value: staff.jobTitle || PENDING },
    { label: "고용 형태", value: staff.employmentType ? EMPLOYMENT_TYPE_LABELS[staff.employmentType] : PENDING },
    { label: "소속 근무지", value: staff.store.name },
    // 입사일은 나중에 시스템이 첫 체결 계약 시작일로 채운다. 지금은 늘 null 이라 「-」다(2026-10-21 재영)
    { label: "입사일", value: staff.hiredDate ?? PENDING },
    // 퇴직 예정 · 퇴직이면 퇴직일을 보인다(목업 detail.html)
    ...(staff.retiredDate ? [{ label: "퇴직일", value: staff.retiredDate }] : []),
    // 재입사로 이은 다른 재직 기간(WHALEERP-615, 목업 detail.html) — 누르면 그 기간의 상세. 이은 레코드가 없으면 줄이 없다.
    // 좁은 단에서 기간이 꺾여도 잘리지 않게 높이가 내용만큼 늘어나는 줄로 둔다
    ...employmentHistoryLines(staff, historySearch(listHref, search.week)).map((line) => ({
      label: line.label,
      multiline: true,
      value: (
        <span className="flex flex-col gap-[4px]">
          {line.links.map((link, i) => (
            <span key={`${i}-${link.href}`}>
              <Link href={link.href} aria-label={`${line.label} ${link.text} 직원 상세`} className="text-erp-link hover:underline">
                {link.text}
              </Link>
              {line.note && <span className="text-erp-muted"> · {line.note}</span>}
            </span>
          ))}
        </span>
      ),
    })),
    // 가입한 계정 값, 가입 전 · 탈퇴면 가장 최근 계약에 적은 값(api #183). api 가 주는 대로 보이고 화면에서 따로 가리지 않는다(2026-10-21 재영)
    { label: "생년월일", value: staff.birthDate ?? PENDING },
    { label: "휴대전화번호", value: staff.phone ? formatPhone(staff.phone) : PENDING },
    // 가입 상태 · 초대는 목록과 같은 함수다(staff-row.ts). 재발송도 목록과 같은 판정 · 버튼이다(WHALEERP-138)
    {
      label: "가입 상태",
      value: (
        <span className="inline-flex items-center gap-[6px]">
          <CellView cell={joinCell(staff, today)} />
          {staff.contract && canResendInvitation(staff) && <ResendInvitationButton contractId={staff.contract.contractId} name={staff.name} />}
        </span>
      ),
    },
    { label: "초대", value: invitationText(staff.invitation, invitationTypeLabels, invitationStatusLabels) },
    // 계정 이메일(회원 ID) — 상세를 볼 수 있으면 보이고, 고치지 못한다(ACC-17, WHALEERP-180). 없을 때의 표시는 staffEmailText.
    { label: "이메일", value: staffEmailText(staff, joinStateLabels) },
    // 가맹 점포 직원만 동의 · 미동의 한 줄, 직영 점포 직원은 줄이 없다(184 완료 조건 8, ATT-30)
    ...(hqConsent === null ? [] : [{ label: "본사 제공 동의", value: hqConsent }]),
  ];

  return (
    <>
      <PageBar title="직원 정보 관리" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <div className="flex flex-col gap-[12px]">
            <div className="flex items-center gap-[6px]">
              <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">직원 상세</h2>
              <StaffDetailActions staff={staff} today={today} listHref={listHref} />
            </div>
            <div className="grid grid-cols-[5fr_7fr] items-start gap-[24px]">
              <div className="flex min-w-0 flex-col gap-[24px]">
                <DetailTable title="기본 정보" rows={basicRows} />
                <PasswordResetButton staff={staff} />
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
                  <Suspense fallback={<AreaLoading />}>
                    <ContractBox staffMemberId={staffMemberId} />
                  </Suspense>
                </Box>
              </div>
              {/* 영역마다 따로 받는다 — 한 영역이 실패해도 그 영역에만 안내 · 다시 하기를 그리고 나머지는 그대로다 */}
              <div className="flex min-w-0 flex-col gap-[24px]">
                <Box
                  title="근무스케줄"
                  tools={<WeekNav monday={monday} search={search} today={today} />}
                  manage={
                    <MenuManageLink
                      menuCode={MENU_CODE.workSchedules}
                      menuName="근무스케줄 관리"
                      href={`/work-schedules?${new URLSearchParams({ store: String(staff.store.storeId), week: monday })}`}
                    />
                  }
                >
                  {/* 주를 바꾸면 이 영역만 다시 기다린다 */}
                  <Suspense key={monday} fallback={<AreaLoading />}>
                    <ScheduleBox staffMemberId={staffMemberId} weekStart={monday} />
                  </Suspense>
                </Box>
                {/* 출퇴근 현황 api 는 아직 없다(api #183 「하지 않은 것」) */}
                <Box title="출퇴근 현황">
                  <NotReady />
                </Box>
                <Box title="급여명세서" manage={<MenuManageLink menuCode={MENU_CODE.payslips} menuName="급여명세서 관리" href="/payslips" />}>
                  <Suspense fallback={<AreaLoading />}>
                    <PayslipBox staffMemberId={staffMemberId} />
                  </Suspense>
                </Box>
                <Box title="TO-DO" manage={<MenuManageLink menuCode={MENU_CODE.todos} menuName="TO-DO 리스트 관리" href="/todos" />}>
                  {/* TO-DO 관리 조회 권한이 없으면 목록까지 영역 전체를 막는다(summary-boxes.tsx TodoBox) */}
                  <Suspense fallback={<AreaLoading />}>
                    <TodoBox staffMemberId={staffMemberId} />
                  </Suspense>
                </Box>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
