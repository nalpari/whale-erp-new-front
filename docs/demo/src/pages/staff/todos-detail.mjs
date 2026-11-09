// TO-DO 상세 — 앱 src/app/todos/[id]/page.tsx · todo-detail-actions.tsx 와 같은 배치(2026-11-09 사용자 지정, 3팀 확인 필요).
// 맨 위: TO-DO 제목(20px 600) + 아래 줄 「수행예정 [꼬리표] | [❗긴급 건]」, 오른쪽 [삭제] [수정] [목록].
// 왼쪽(7): 「TO-DO」 표(상태 · 완료 일시 · 내용 · 근무지 · 배정대상 · 직원 · 등록 — 그룹이면 상태 · 직원 줄 없음) → 그룹이면 「직원별 상태」(줄마다 상태 바꾸기).
// 오른쪽(5): 「상태 변경이력」 표(변경일시 · 변경자 · 상태, 10건씩 쪽 나눔). 관리자는 상태와 상관없이 수정할 수 있고, 직원 대신 상태를 바꾼다(T-1, 그룹이면 이 행만).
// 데모는 근무지 전체 · 각자 수행 그룹의 서지안 행 하나를 보인다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as p from "../../staff-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const list = link(R, "staff/todos.html");

  // 삭제 확인창 — 기본 버튼 · 「TO-DO를 삭제하시겠습니까?」(앱 DeleteTodoDialog, 2026-11-06 사용자 지정). 그룹이면 대기 행만 지운다고 미리 알린다
  const delId = x.dialogId();
  const delDialog = x.dialog(
    delId,
    "TO-DO를 삭제하시겠습니까?",
    // 일부만 대기(이 데모 — 대기 1 · 진행 중 · 완료 3). 앱은 한 명 · 모두 대기 · 일부만 대기로 문장을 나눈다(todo-detail-actions.tsx, 2026-11-09 사용자 지정)
    "직원에게 배정된 TO-DO 중 대기 1건만 삭제되며, 직원 근무 앱에서도 확인할 수 없습니다.<br>진행 중 · 완료 3건은 삭제되지 않습니다.",
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("삭제", { href: list }),
  );

  // 버튼 순서는 [삭제] [수정] [목록](앱 todo-detail-actions.tsx, 2026-11-09 사용자 지정, 3팀 확인 필요)
  const actions =
    ui.button("삭제", { variant: "soft", "data-dialog": delId }) +
    ui.button("수정", { variant: "soft", href: link(R, "staff/todos-edit.html") }) +
    ui.button("목록", { href: list });

  // 상태 바꾸기 — 선택칸 하나(지금 상태가 골라진 채) + [상태 변경](같은 상태면 막힘). 배지는 따로 두지 않는다
  const control = (value, name) =>
    `<span class="inline-flex items-center gap-[6px]"><span class="w-[120px]">${ui.select(["대기", "진행 중", "완료"], { value, "aria-label": `${name} 바꿀 상태` })}</span>${ui.button("상태 변경", { variant: "soft", disabled: true })}</span>`;
  // 「TO-DO」 한 표 — 근무지 전체 · 각자 수행(이 데모)이면 상태 · 직원 줄을 두지 않고 아래 직원별 상태 표에서 줄마다 바꾼다(개인 배정 · 한 명 수행은 「상태」 · 「직원」 줄이 있다)
  const todoRows = [
    ["내용", "냉장고 안 식재료를 유통기한 순으로 정리하고, 문 안쪽 패킹을 닦아 주세요.<br>정리한 뒤 사진을 찍어 두세요.", true],
    ["근무지", "모리커피 서초점"],
    ["배정대상", "근무지 전체 · 각자 수행"],
    // 등록 「시각 · 사람」. 최종수정 줄은 api 에 고친 사람이 없어 일단 뺐다
    ["등록", `2026-09-01 10:20<span class="text-erp-label"> · 김지영</span>`],
  ];

  // 회색 제목 줄 상자(상세 표 제목과 같은 42px · 15px 600) + 흰 열 이름 줄 표
  // meta 는 제목 뒤 세로선 다음 「이름 [꼬리표]」(앱 TitledBox meta — 문의 상세 「분류 [꼬리표]」와 같은 모양)
  const titled = (title, inner, meta = "") =>
    `<section class="min-w-0"><div class="flex h-[42px] items-center gap-[10px] rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px]"><h3 class="text-[15px] font-semibold text-erp-ink">${title}</h3>${meta ? `<span aria-hidden="true" class="h-[11px] w-px bg-[#d9d9d9]"></span><span class="flex min-w-0 items-center gap-[6px] text-[14px] font-medium text-erp-label">${meta}</span>` : ""}</div>${inner}</section>`;
  const plainHead = (html) => html.replace(/<thead>\s*<tr class="h-\[42px\] border-y border-erp-thead-line bg-erp-thead-bg">/, '<thead><tr class="h-[42px] border-y border-erp-thead-line bg-white">');

  // 직원별 상태 — 줄마다 상태를 바로 바꾼다. 직원 이름을 누르면 그 직원의 상세로 가고 오른쪽 이력이 그 직원 것이 된다 — 지금 보는 직원(서지안)은 링크 없이 굵게(앱 page.tsx, 2026-11-09 사용자 지정)
  const staffLink = (name) => `<a class="text-erp-link hover:underline" href="${link(R, "staff/todos-detail.html")}">${name}</a>`;
  // 표는 기본 회색 열 이름 줄(제목이 표 밖 글자 제목이라 회색이 두 겹이 되지 않는다)
  const groupTable = (
    ui.dataTable(
      [{ header: "직원" }, { header: "상태" }, { header: "완료 일시" }],
      [
        ['<span class="font-semibold">서지안</span>', control("진행 중", "서지안"), "-"],
        [staffLink("오세라"), control("완료", "오세라"), "2026-09-02 17:40"],
        [staffLink("문태경"), control("완료", "문태경"), "2026-09-02 18:05"],
        // 가린 직원 · 퇴직으로 배정이 풀린 줄도 상태를 바꾼다(링크 없음)
        ['<span class="text-erp-muted">본사에 정보제공 미동의</span>', control("대기", "본사에 정보제공 미동의"), "-"],
      ],
    )
  );

  // 지금 보는 직원(서지안) 줄은 공통 「고른 줄」(DataTable current — 옅은 회색 바탕 + 왼쪽 회청 3px 선, 2026-11-09 사용자 지정)
  const currentRow = (html) => html.replace(/<tr class="([^"]*)">(\s*<td[^>]*>\s*<span class="font-semibold">서지안)/, '<tr class="$1 bg-erp-subtle [&>td:first-child]:shadow-[inset_3px_0_0_var(--color-erp-brand)]">$2');

  // 상태 변경이력 — 변경일시 · 변경자 · 상태, 10건씩 쪽 나눔(데모는 한 쪽)
  const historyTable = plainHead(
    ui.dataTable(
      [{ header: "변경일시", width: "w-[150px]" }, { header: "변경자", width: "w-[110px]" }, { header: "상태", align: "left" }],
      [
        ["2026-09-02 18:05", "문태경", "진행 중 → 완료"],
        ["2026-09-02 17:40", "오세라", "진행 중 → 완료"],
        ["2026-09-02 09:12", "서지안", "대기 → 진행 중"],
        ["2026-09-01 10:20", "김지영", "등록 · 대기"],
      ],
      "이력이 없습니다.",
    ),
  );

  const sep = `<span aria-hidden="true" class="h-[11px] w-px bg-[#d9d9d9]"></span>`;
  // 긴급 — 빨간 배지 앞 빨간 느낌표(앱 공통 GuideIcon risk)
  const urgent = `<span class="inline-block rounded-[2px] bg-erp-off-bg px-[4px] py-[2px] text-[14px] font-medium text-erp-off"><span class="inline-flex items-center gap-[4px]"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" class="shrink-0 text-erp-off"><circle cx="8" cy="8" r="8" fill="currentColor"/><rect x="7.3" y="3.6" width="1.4" height="5.6" rx="0.7" fill="#fff"/><circle cx="8" cy="11.6" r="0.95" fill="#fff"/></svg>긴급</span></span>`;
  const headBlock =
    `<div class="flex items-start gap-[18px]"><div class="flex min-w-0 flex-1 flex-col gap-[8px] py-[6px]">` +
    `<h2 class="min-w-0 text-[20px] font-semibold break-all text-erp-ink">본사 위생점검 대비 냉장고 정리</h2>` +
    `<div class="flex flex-wrap items-center gap-[10px] text-[14px] font-medium text-erp-label"><span class="flex items-center gap-[6px]">수행예정 ${p.tag("quiet", "2026-09-03")}</span>${sep}<span class="flex items-center gap-[6px]">상태 ${p.tag("ok", "진행 중")}<span class="font-normal text-erp-ink tabular-nums">2 / 4명</span></span>${sep}${urgent}</div>` +
    `</div><div class="flex shrink-0 items-center gap-[6px]">${actions}</div></div>`;

  const body = ui.detailBody(
    headBlock +
      `<div class="grid grid-cols-[7fr_5fr] items-start gap-[24px]"><div class="flex min-w-0 flex-col gap-[24px]">` +
      ui.detailTable("TO-DO", todoRows) +
      // 「직원별 상태」는 회색 제목 바 없이 표 위 글자 제목 + 느낌표 안내, 표는 기본 회색 열 이름 줄(앱 page.tsx, 2026-11-09 사용자 지정)
      `<section class="flex min-w-0 flex-col gap-[10px]"><div class="flex flex-wrap items-center gap-x-[12px] gap-y-[6px]"><h3 class="text-[15px] font-semibold text-erp-ink">직원별 상태</h3><span class="inline-flex items-center gap-[6px] text-[13px] leading-[1.6] font-medium text-erp-ink"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" class="shrink-0 text-erp-brand"><circle cx="8" cy="8" r="8" fill="currentColor"/><rect x="7.3" y="3.6" width="1.4" height="5.6" rx="0.7" fill="#fff"/><circle cx="8" cy="11.6" r="0.95" fill="#fff"/></svg><span>직원을 선택하면 해당 직원의 상태 변경이력을 확인할 수 있습니다.</span></span></div>${currentRow(groupTable)}</section>` +
      `</div><div class="flex min-w-0 flex-col gap-[24px]">` +
      // 여러 명에게 나눈 TO-DO 는 지금 보는 직원 한 명의 이력이라 제목에 이름을 적는다(앱 todo-history.tsx who, 2026-11-09 사용자 지정)
      titled("상태 변경이력", historyTable, `직원 <span class="inline-block rounded-[2px] border border-erp-thead-line bg-erp-off-bg px-[4px] py-px text-[14px] font-semibold whitespace-nowrap text-erp-ink">서지안</span>`) +
      `</div></div>`,
  );
  return { title: "TO-DO 상세", html: ui.erpFrame({ header: erpHeader(A, R), title: "TO-DO 리스트 관리", body, panels: delDialog }) };
};
