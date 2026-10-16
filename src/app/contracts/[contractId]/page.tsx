import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  Button,
  DataTable,
  DetailTable,
  DetailValues,
  GlobalHeader,
  PageBar,
  ServiceLinks,
  StoreSelect,
  UserPop,
} from "@/components/common";
import { NotificationBellSlot } from "@/components/notifications/notification-bell-slot";
import { ApiError, getEnum, getSession, request } from "@/lib/api";
import { labelOf } from "@/lib/enums";
import { MENUS, STORES, USER_ITEMS } from "../../design/sample";
import { StatusBadge } from "../columns";
import { formatPhone, type ContractDetail } from "../new/contract-form-model";
import { documentNoticeOf } from "./document-notice";
import { insuranceText, kstDateTime, payDayText, probationText, weeklyHoursOf, workDayLines } from "./detail-format";

type Status = Parameters<typeof StatusBadge>[0]["status"];

// 상태마다 위쪽에 서는 버튼. 재발송 · 새 계약은 아직 API 가 없어 비활성으로 둔다. 거부 · 종료는 버튼이 없다.
const PENDING: Partial<Record<Status, string>> = {
  PENDING_SEND: "초대 재발송",
  PENDING_SIGNATURE: "재발송",
  EXPIRED: "재발송",
  SIGNED: "새 계약",
};

// 근로계약 상세. 데모 docs/demo/staff/contracts-detail 의 틀(제목 줄 + 계약 내용 + 상태 변경 이력).
// 주휴일 · 급여 지급 방식 · 수습(정직원)도 보인다(데모 확인 2026-10-15).
export default async function ContractDetailPage({ params, searchParams }: PageProps<"/contracts/[contractId]">) {
  const { contractId: raw } = await params;
  const documentNotice = documentNoticeOf((await searchParams).document);
  const contractId = Number(raw);
  if (!Number.isInteger(contractId) || contractId < 1) notFound();

  const [statuses, draftActions, employmentTypes, weekdays, payMonths, payMethods, contractMethods, documentKinds, actors, session] = await Promise.all([
    getEnum("ContractStatus"),
    getEnum("ContractDraftAction"),
    getEnum("EmploymentType"),
    getEnum("Weekday"),
    getEnum("PayMonth"),
    getEnum("PayMethod"),
    getEnum("ContractMethod"),
    getEnum("ContractDocumentKind"),
    getEnum("StatusChangeActor"),
    getSession(),
  ]);

  let c: ContractDetail | null = null;
  if (session) {
    try {
      c = await request<ContractDetail>(`/contracts/${contractId}`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) notFound();
      if (!(e instanceof ApiError && e.status === 401)) throw e;
    }
  }

  const status = (c?.status ?? null) as Status | null;
  const statusCell = (s: string | null): ReactNode => (s ? <StatusBadge status={s as Status} label={labelOf(statuses, s)} /> : "-");
  const buttons: ReactNode =
    // 임시저장 삭제는 이어 쓰기 화면에만 둔다 — 삭제는 임시저장일 때만 할 수 있다.
    status === "DRAFT" ? (
      <Button variant="soft" href={`/contracts/${contractId}/edit`}>
        이어 쓰기
      </Button>
    ) : status && PENDING[status] ? (
      <Button variant="soft" disabled title="준비 중">
        {PENDING[status]}
      </Button>
    ) : null;

  const rows = c
    ? [
        { label: "직원", value: <DetailValues items={[c.name, formatPhone(c.phone)]} /> },
        { label: "직무", value: c.jobTitle },
        { label: "근무지", value: c.storeName ?? "-" },
        { label: "고용 형태", value: labelOf(employmentTypes, c.employmentType) },
        {
          label: "상태",
          value: (
            <DetailValues
              items={[statusCell(c.status), ...(c.status === "PENDING_SEND" && c.draftAction ? [labelOf(draftActions, c.draftAction)] : [])]}
            />
          ),
        },
        { label: "계약 기간", value: c.startDate ? `${c.startDate} ~ ${c.endDate ?? "무기한"}` : "-" },
        { label: "시급", value: c.wageAmount === null ? "-" : c.wageAmount.toLocaleString("ko-KR") },
        {
          label: "소정근로시간",
          value: c.workDays.length ? (
            <DetailValues items={[`주 ${weeklyHoursOf(c.workDays).toFixed(1)}시간`, ...workDayLines(c.workDays, (d) => labelOf(weekdays, d))]} />
          ) : (
            "-"
          ),
        },
        { label: "주휴일", value: c.weeklyHoliday ? `${labelOf(weekdays, c.weeklyHoliday)}요일` : "-" },
        { label: "임금지급일", value: payDayText(c.payMonth ? labelOf(payMonths, c.payMonth) : null, c.payDay) },
        { label: "급여 지급 방식", value: c.payMethod ? labelOf(payMethods, c.payMethod) : "-" },
        ...(c.employmentType === "FULL_TIME" ? [{ label: "수습", value: probationText(c.probationMonths, c.probationWageReductionRate, c.wageAmount) }] : []),
        { label: "4대보험", value: insuranceText(c.isHealthPensionInsured, c.isEmploymentInjuryInsured) },
        { label: "근무 장소", value: c.workLocation ?? "-" },
        { label: "계약 방식", value: c.contractMethod ? labelOf(contractMethods, c.contractMethod) : "-" },
        // 종이 계약 날인본(CTR-23). 누르면 라우트 핸들러가 300초짜리 주소를 받아 원래 파일 이름으로 내려받게 한다
        // documents 는 api #49 부터 온다 — 그 전 api 와 함께 떠도 상세가 깨지지 않게 없으면 빈 것으로 본다.
        ...(c.documents?.length
          ? [
              {
                label: "날인본",
                value: (
                  <DetailValues
                    items={c.documents.map((d) => (
                      <a key={d.contractDocumentId} href={`/contracts/${c.contractId}/documents/${d.contractDocumentId}`} className="text-erp-link hover:underline">
                        {labelOf(documentKinds, d.kind)} · {d.fileName}
                      </a>
                    ))}
                  />
                ),
              },
            ]
          : []),
      ]
    : [];
  const histories = c?.histories ?? [];

  return (
    <div className="h-[100dvh] overflow-x-auto overflow-y-hidden bg-erp-thead-bg">
      <div className="flex h-full min-w-[1720px] flex-col">
        <GlobalHeader
          menus={MENUS}
          right={
            <>
              <StoreSelect options={STORES} />
              <ServiceLinks />
              <NotificationBellSlot />
              <UserPop name="김지영 (admin)" items={USER_ITEMS} />
            </>
          }
        />
        <PageBar title="근로계약 관리" />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
          <div className="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
            <div className="flex flex-col gap-[12px]">
              <div className="flex items-center gap-[6px]">
                <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">근로계약 상세</h2>
                {buttons}
                <Button href="/contracts">목록</Button>
              </div>
              {documentNotice && (
                <p role="alert" className="rounded-[2px] border border-erp-off-bg bg-erp-off-bg px-[16px] py-[12px] text-[14px] font-semibold text-erp-off">
                  {documentNotice}
                </p>
              )}
              {c ? (
                <DetailTable title="계약 내용" rows={rows} />
              ) : (
                <p className="text-[14px] font-semibold text-erp-ink">로그인이 필요합니다</p>
              )}
            </div>
            {c && (
              <div className="flex flex-col gap-[12px]">
                <h3 className="text-[15px] font-semibold text-erp-ink">상태 변경 이력</h3>
                <DataTable
                  columns={[
                    { header: "일시", width: "w-[160px]", cell: (h) => kstDateTime(h.changedAt) },
                    { header: "변경 전", width: "w-[140px]", cell: (h) => statusCell(h.fromStatus) },
                    { header: "변경 후", width: "w-[140px]", cell: (h) => statusCell(h.toStatus) },
                    { header: "처리 주체", cell: (h) => labelOf(actors, h.actor) },
                  ]}
                  rows={histories}
                  rowKey={(h) => `${h.changedAt}-${h.toStatus}`}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
