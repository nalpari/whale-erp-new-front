import { Fragment } from "react";
import { MASKED_STAFF, staffNameText } from "./todo-row";

// 직원 이름 글자. 가린 직원(본사 제공 동의 없음)은 직원 목록(staff-table)처럼 흐린 글자로(글자는 MASKED_STAFF 로 짧다) 그린다. 훅이 없어 서버 · 클라이언트 화면이 같이 쓴다.

/** 이름 여럿을 「, 」로 잇는다. 없으면 「-」 */
export function StaffNames({ staff }: { staff: { staffMemberName: string | null; isMasked: boolean }[] }) {
  if (staff.length === 0) return "-";
  return staff.map((s, i) => (
    <Fragment key={i}>
      {i > 0 && ", "}
      {s.isMasked ? <span className="text-erp-muted">{MASKED_STAFF}</span> : staffNameText(s)}
    </Fragment>
  ));
}

/** 이름 하나. masked 면 흐린 글자 */
export function StaffName({ text, masked }: { text: string; masked: boolean }) {
  return masked ? <span className="text-erp-muted">{text}</span> : text;
}
