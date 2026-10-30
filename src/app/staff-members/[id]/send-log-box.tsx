import { DataTable } from "@/components/common";
import { MENU_CODE } from "@/lib/menus";
import { getStaffMemberSendLogs } from "@/lib/staff-members-api";
import { CellView } from "../staff-table";
import { AreaFailure } from "./detail-box";
import { MenuTextLink } from "./manage-link";
import { kindText, labelIn, sendLogLine, type SendLogLine } from "./send-log-view";
import { loadArea, loadLabels } from "./summary-load";

/**
 * 직원 상세의 「발송 이력」 칸(WHALEERP-136). 이 직원 레코드의 근로계약이 보낸 가입 초대 · 소속 추가 확인 요청(재발송 포함)을 최근 순으로
 * 모두 보인다(GET /staff-members/:id/summary/send-logs). 발송 이력은 이 화면에만 둔다 — 계약 상세 · 따로 된 화면에는 없다(2026-10-26 김민식).
 * 이 경로는 근로계약 관리 조회 권한을 보므로, 그 권한이 없으면 이 칸만 권한 안내다(근로계약 칸과 같다). 계약이 여럿(재계약 등)이면 어느 계약의
 * 발송인지 가를 수 있게 종류를 그 계약 상세 링크로 둔다(종류를 모르면 「-」 글자만). 건수 상한은 두지 않는다 — 직원 레코드 하나의 초대
 * 발송은 몇 건이고, api 도 재발송 판정에 전체 이력을 읽는다.
 */
export async function SendLogBox({ staffMemberId }: { staffMemberId: number }) {
  const [result, kinds, results] = await Promise.all([
    loadArea("발송 이력 칸", () => getStaffMemberSendLogs(staffMemberId)),
    loadLabels("StaffSendKind"),
    loadLabels("StaffSendResult"),
  ]);
  if (result.kind !== "ok") return <AreaFailure kind={result.kind} subject="발송 이력을" />;
  const lines = result.data.items.map((item) =>
    sendLogLine(item, kinds && labelIn(kinds), results && labelIn(results)),
  );
  return (
    <DataTable<SendLogLine>
      headVariant="plain"
      columns={[
        { header: "발송 일시", width: "w-[160px]", cell: (r) => r.sentAt },
        {
          header: "종류",
          width: "w-[220px]",
          cell: (r) =>
            r.kind === null ? (
              kindText(r)
            ) : (
              <MenuTextLink menuCode={MENU_CODE.contracts} href={`/contracts/${r.contractId}`}>
                {kindText(r)}
              </MenuTextLink>
            ),
        },
        { header: "결과", width: "w-[130px]", cell: (r) => (r.result ? <CellView cell={r.result} /> : "-") },
        { header: "재시도", width: "w-[100px]", cell: (r) => r.retry },
        // 사유는 길 수 있어 한 줄로 자르고 전체는 title 로 보인다
        {
          header: "실패 사유",
          align: "left",
          cell: (r) => (
            <span className="block truncate" title={r.reason === "-" ? undefined : r.reason}>
              {r.reason}
            </span>
          ),
        },
      ]}
      rows={lines}
      rowKey={(r) => r.key}
      empty="보낸 초대가 없습니다."
    />
  );
}
