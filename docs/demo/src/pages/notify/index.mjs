// 운영 알림함. 목업 docs/mockup/notify/index.html 의 BP 마스터 쪽만 그렸다(역할 전환 탭은 목업용이라 뺐다).
// 누르고 들어가면 읽음이다. 제목은 읽어도 먹색이고, 미확인만 굵게 + 제목 앞 빨간 점(앱 notification-list.tsx, 2026-11-06 사용자 지정 — 전엔 점 칸을 따로 두고 읽은 것은 흐린 글자).
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as p from "../../staff-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const L = (path) => link(R, path);
  // 「미확인」 글자를 화면 밖에 둬서 읽기 도구와 목록 거르기(확인 상태 필터)가 함께 읽는다.
  const dot = `<span data-unread class="inline-block size-[6px] rounded-full bg-erp-off" aria-hidden="true"></span><span class="sr-only">미확인</span>`;
  // [미확인?, 제목, 내용, 이동할 곳, 구분, 일시] — 메일 열은 뺐다(2026-10-02 재영). 관련 업무(근로계약 #30) 열은 내부 번호라 두지 않는다(2026-11-06 사용자 지정)
  // 알림 칸은 제목 · 내용 두 줄, 사이 3px · 위아래 7px 라 이 표의 줄은 55px 다(앱 notification-list.tsx, 2026-11-04 사용자 지적 — 46px 줄에 붙어 답답했다)
  // 맨 앞 체크로 골라 「선택 삭제」(2026-10-02 재영). 동작은 erp.js(data-pick-row · data-pick-all · data-remove-picked).
  const pick = (a) => ui.checkbox(A, "", false, a);
  const row = (unread, title, body, href, kind, at) => [
    pick({ "aria-label": `${title} 선택`, "data-pick-row": true }),
    `<a class="flex min-w-0 flex-col gap-[3px] py-[7px] hover:underline" href="${href ?? "#"}"><span class="flex min-w-0 items-center gap-[6px] leading-[20px] text-erp-ink ${unread ? "font-semibold" : "font-medium"}">${unread ? dot : ""}<span class="truncate">${title}</span></span><span class="truncate text-[14px] leading-[18px] text-erp-label">${body}</span></a>`,
    kind,
    // 일시는 연도까지, 표 기본 글자(14px 먹색) — 고객지원 공지사항 목록 게시일과 같다
    at,
  ];
  const CD = L("staff/contracts-detail.html");
  const rows = [
    row(true, "서지안 님이 근로계약서 서명을 거절했습니다", "근무지 · 모리커피 연남점", CD, p.tag("quiet", "근로계약 서명 거절"), "2026-09-06 09:12"),
    row(true, "문태경 님이 근로계약서에 서명했습니다", "온기식당 판교점 · 정직원", CD, p.tag("quiet", "근로계약 서명"), "2026-09-05 18:40"),
    row(true, "문의에 답변이 등록되었습니다", "직원 초대 문자가 발송되지 않습니다", L("support/inquiry-mine.html"), p.tag("quiet", "문의사항 답변"), "2026-09-02 11:05"),
    row(false, "오세라 님이 근로계약서에 서명했습니다", "모리커피 서초점 · 정직원", CD, p.tag("quiet", "근로계약 서명"), "2026-08-29 14:22"),
    row(false, "배정숙 님의 계약이 만료되었습니다", "서명 기한 30일 경과 · 재발송 가능", null, p.tag("quiet", "근로계약 만료"), "2026-08-24 00:05"),
  ];
  const unread = rows.filter((r) => r[1].includes("data-unread")).length;

  // 왼쪽 필터 없이 목록만(2026-10-02 재영)
  const body = ui.listBody(
    "",
    // 목록 칸은 남는 높이를 받는다 — 다 지워 비면 표(data-fill-empty)가 열 이름 줄을 두고 남는 높이를 채운다(앱 DataTable fillEmpty, 2026-11-05 사용자 지정)
    `<div class="flex flex-1 flex-col gap-[12px]">` +
      // 위 줄(앱 notification-list.tsx, 2026-11-04 사용자 지정): 왼쪽 「총 N 건 · 미확인 N 건」(미확인은 표의 점과 같은 빨강), 오른쪽 「전체 선택」 체크 · [모두 읽음] ·
      // [선택 삭제] · 한 쪽 건수. 한 줄 가운데에 맞춘다. 고른 알림이 없으면 [선택 삭제]는 막힌 버튼이고 이유를 말풍선으로 보인다(전엔 누른 뒤 「선택된 알림이 없습니다」 창)
      `<div class="flex items-center gap-[6px]"><p class="mr-auto text-[14px] text-erp-ink">총 <b class="font-semibold">${rows.length}</b> 건<span class="px-[6px] text-erp-muted">·</span><span class="text-erp-off">미확인 <b data-unread-count class="font-semibold">${unread}</b> 건</span></p>` +
      `<span class="mr-[6px] flex items-center">${ui.checkbox(A, "전체 선택", false, { "data-pick-all": "notify-list" })}</span>` +
      p.ask("모두 읽음", "off", "모든 알림을 읽음으로 바꾸시겠습니까?", "", "모두 읽음", { "data-read-all": "notify-list" }) +
      ui.blocked(
        p.ask("선택 삭제", "off", "선택한 알림을 삭제하시겠습니까?", "삭제한 알림은 되돌릴 수 없습니다.", "삭제", { "data-remove-picked": "notify-list" }).replace("<button ", '<button disabled data-need-pick="notify-list" '),
        "삭제할 알림을 먼저 선택해 주세요.",
      ) +
      `<div class="w-[80px] shrink-0">${ui.select(["20", "50", "100"], { value: "20", "aria-label": "페이지당 건수" })}</div></div>` +
      ui.dataTable(
        [
          { header: "선택", width: "w-[48px]" },
          { header: "알림", align: "left" },
          { header: "구분", width: "w-[140px]" },
          { header: "일시", width: "w-[160px]" },
        ],
        rows,
        "받은 알림이 없습니다.",
      ).replace("<table ", '<table id="notify-list" data-fill-empty data-empty="받은 알림이 없습니다." ') +
      `<div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div></div>`,
  );
  return {
    title: "운영 알림함",
    html: ui.erpFrame({ header: erpHeader(A, R), title: "운영 알림함", body }),
  };
};
