// 운영 알림함. 목업 docs/mockup/notify/index.html 의 BP 마스터 쪽만 그렸다(역할 전환 탭은 목업용이라 뺐다).
// 누르고 들어가면 읽음이다. 미확인은 점과 굵은 글자, 읽은 것은 흐린 글자.
import * as ui from "../../ui.mjs";
import * as p from "../../staff-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const L = (path) => link(R, path);
  // 「미확인」 글자를 화면 밖에 둬서 읽기 도구와 목록 거르기(확인 상태 필터)가 함께 읽는다.
  const dot = `<span class="inline-block size-[6px] rounded-full bg-erp-off" aria-hidden="true"></span><span class="sr-only">미확인</span>`;
  // [미확인?, 제목, 이동할 곳, 덧붙임, 메일 결과, 구분 배지, 일시]
  // 맨 앞 체크로 골라 「선택 삭제」(2026-10-02 재영). 동작은 erp.js(data-pick-row · data-remove-picked).
  const pick = (a) => ui.checkbox(A, "", false, a);
  const row = (unread, title, href, detail, mail, kind, at) => [
    pick({ "aria-label": "알림 선택", "data-pick-row": true }),
    unread ? dot : "",
    href ? `<a class="${unread ? "font-semibold text-erp-ink" : "text-erp-muted"} hover:underline" href="${href}">${title}</a>` : p.sub(title),
    p.sub(detail),
    mail,
    kind,
    unread ? at : p.sub(at),
  ];
  const CD = L("staff/contracts-detail.html");
  const rows = [
    row(true, "서지안 님이 근로계약서를 거부했습니다", CD, "사유 · 근무 시작일이 협의한 날과 다릅니다", `${p.tag("risk", "메일 실패")} ${p.sub("09-06 09:12 · 09:17 두 번 반송")}`, p.tag("risk", "계약 거부"), "09-06 09:12"),
    row(true, "문태경 님이 근로계약서에 날인했습니다", CD, "온기식당 판교점 · 정직원", "-", p.tag("ok", "계약 날인"), "09-05 18:40"),
    row(true, "문의에 답변이 등록되었습니다", L("support/inquiry-mine.html"), "직원 초대 문자가 발송되지 않습니다", "-", p.tag("info", "문의 답변"), "09-02 11:05"),
    row(false, "오세라 님이 근로계약서에 날인했습니다", CD, "모리커피 서초점 · 정직원", "-", p.tag("quiet", "계약 날인"), "08-29 14:22"),
    row(false, "배정숙 님의 계약이 만료되었습니다", null, "날인 기한 30일 경과 · 재발송 가능", "-", p.tag("quiet", "계약 만료"), "08-24 00:05"),
  ];

  // 왼쪽 필터 없이 목록만(2026-10-02 재영)
  const body = ui.listBody(
    "",
    `<div class="flex flex-col gap-[12px]">` +
      ui.listToolbar(
        rows.length,
        ui.button("모두 읽음으로", { variant: "off" }) +
          p.ask("선택 삭제", "off", "선택한 알림을 삭제하시겠습니까?", "삭제한 알림은 되돌릴 수 없습니다.", "삭제", { "data-remove-picked": "notify-list" }),
      ) +
      ui.dataTable(
        [
          { header: pick({ "aria-label": "전체 선택", "data-pick-all": true }), width: "w-[48px]" },
          { header: "", width: "w-[40px]" },
          { header: "알림", align: "left" },
          { header: "내용", align: "left" },
          { header: "메일", width: "w-[300px]", align: "left" },
          { header: "구분", width: "w-[120px]" },
          { header: "일시", width: "w-[130px]" },
        ],
        rows,
        "받은 알림이 없습니다.",
      ).replace("<table ", '<table id="notify-list" data-empty="받은 알림이 없습니다." ') +
      `<div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div></div>`,
  );
  return {
    title: "운영 알림함",
    html: ui.erpFrame({ header: erpHeader(A, R), title: "운영 알림함", titleRight: p.tag("risk", "미확인 3"), body }),
  };
};
