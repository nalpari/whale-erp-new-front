// 직원 자료 일괄 저장. 목업 docs/mockup/staff/export.html 의 기본 상태(만드는 중 1건)를 BP 마스터로 본 것.
import * as ui from "../../ui.mjs";
import * as p from "../../staff-parts.mjs";
import { BP, erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const L = (path) => link(R, path);
  const head = ui.sectionHead("직원 자료 일괄 저장", ui.button("목록", { href: L("staff/index.html") }));
  const warn = p.band("BP 가 탈퇴하면 관리자 계정이 모두 미사용이 되어 자료를 볼 수 없습니다", {
    desc: "탈퇴한 뒤에는 이 화면도 열리지 않습니다. 보존 기간이 남아 있어도 마찬가지입니다. 필요한 자료는 탈퇴 전에 받아 두세요. 탈퇴와 상관없이 평소에도 받을 수 있습니다.",
  });

  const contents = p.section(
    "담기는 자료",
    p.tag("quiet", "네 가지") + `<span class="pl-[6px] text-[14px] text-erp-label">ZIP 한 개</span>`,
    ui.dataTable(
      [{ header: "자료", width: "w-[130px]" }, { header: "담기는 것", align: "left" }, { header: "형식", width: "w-[110px]" }],
      [
        ["근로계약서", "체결 완료본과 종이 계약 날인본, 그리고 전체 목록", "PDF · CSV"],
        ["출퇴근 기록", "기록 시각과 보정·대신 등록 이력", "CSV"],
        ["급여명세서", "발송 완료된 명세서와 전체 목록", "PDF · CSV"],
        ["근무스케줄", "확정된 근무스케줄", "CSV"],
      ],
    ),
  );
  const requests = p.section(
    "지난 요청",
    p.tag("quiet", "3건"),
    ui.dataTable(
      [
        { header: "요청 일시", width: "w-[120px]" },
        { header: "요청자" },
        { header: "대상", width: "w-[80px]" },
        { header: "상태", align: "left" },
        { header: "", width: "w-[140px]" },
      ],
      [
        ["09-29 14:12", "정하윤", "71명", p.tag("warn", "만드는 중"), p.sub("다 되면 알림")],
        ["09-26 09:40", "정하윤", "70명", `${p.tag("ok", "받을 수 있음")} ${p.sub("10-03 까지")}`, p.ask("내려받기", "off", "일괄 저장 파일을 내려받으시겠습니까?", "2026-09-26 요청 · 70명")],
        ["08-04 17:26", "김서준", "68명", p.tag("quiet", "기한 지남"), "-"],
      ],
    ),
  );
  const request = p.section(
    "새로 요청",
    "",
    ui.detailTable("요청 범위", [
      ["업무 범위", `${BP.name} · 점포 4곳 전체`],
      ["대상 직원", `<b class="font-semibold">71명</b> ${p.sub("재직 63 · 보존 기간 안 퇴직 8")}`],
      ["파일 형식", "ZIP 한 개"],
    ]),
    p.bar("", p.ask("일괄 저장 요청", "primary", "일괄 저장을 요청하시겠습니까?", "업무 범위 안 직원의 근로계약서·출퇴근 기록·급여명세서·근무스케줄을 한 번에 내려받을 수 있게 묶습니다.", "요청")),
  );
  const making = p.section(
    "만드는 중",
    p.tag("warn", "09-29 14:12 요청"),
    p.steps([
      ["done", "요청 접수", "09-29 14:12 · 정하윤"],
      ["now", "자료 모으는 중", "71명 가운데 44명"],
      ["wait", "운영 알림과 내려받기", ""],
    ]),
  );
  const after = p.section(
    "받은 뒤",
    "",
    p.band("내려받은 파일의 보관 책임은 BP 에 있습니다", {
      desc: "직원의 이름·휴대전화번호·급여가 담긴 파일입니다. 잠긴 곳에 두고, 쓸 일이 끝나면 지우세요. 플랫폼은 기한이 지난 파일을 지우지만 내려받은 사본까지는 어쩌지 못합니다.",
    }),
  );

  const body = ui.detailBody(`<div class="flex flex-col gap-[12px]">${head}${warn}</div>${p.cols(contents + requests, request + making + after)}`);
  return { title: "직원 자료 일괄 저장", html: ui.erpFrame({ header: erpHeader(A, R), title: "직원 자료 일괄 저장", body }) };
};
