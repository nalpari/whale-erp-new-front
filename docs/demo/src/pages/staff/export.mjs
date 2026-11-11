// 직원 자료 일괄 저장. 목업 docs/mockup/staff/export.html 의 기본 상태(만드는 중 1건)를 BP 마스터로 본 것.
import * as ui from "../../ui.mjs";
import * as p from "../../staff-parts.mjs";
import { BP, erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const L = (path) => link(R, path);
  const head = ui.sectionHead("직원 자료 일괄 저장", ui.button("목록", { href: L("staff/index.html") }));
  const warn = p.band("회원 탈퇴 시 모든 관리자 계정이 미사용 처리되어 자료에 접근할 수 없습니다.", {
    desc: "탈퇴 후에는 보존 기간이 남아 있더라도 이 화면을 열람할 수 없습니다. 필요한 자료는 탈퇴 전에 미리 저장해 주세요. 탈퇴 전까지는 언제든지 이 화면에서 자료를 다운로드할 수 있습니다.",
  });

  const contents = p.section(
    "저장되는 자료",
    p.tag("quiet", "네 가지") + `<span class="pl-[6px] text-[14px] text-erp-label">ZIP 파일 1개</span>`,
    ui.dataTable(
      [{ header: "구분", width: "w-[130px]" }, { header: "포함 내용", align: "left" }, { header: "파일 형식", width: "w-[110px]" }],
      [
        ["근로계약서", "서명 완료본과 종이 계약 서명본, 전체 목록", "PDF · CSV"],
        ["출퇴근 기록", "기록 시각과 보정 · 대신 등록 이력", "CSV"],
        ["급여명세서", "발송 완료된 급여명세서와 전체 목록", "PDF · CSV"],
        ["근무스케줄", "등록된 근무스케줄 전체", "CSV"],
      ],
    ),
  );
  const requests = p.section(
    "요청 내역",
    p.tag("quiet", "3건"),
    ui.dataTable(
      [
        { header: "요청 일시", width: "w-[120px]" },
        { header: "요청자" },
        { header: "대상 직원", width: "w-[80px]" },
        { header: "상태", align: "left" },
        { header: "파일", width: "w-[140px]" },
      ],
      [
        ["09-29 14:12", "정하윤", "71명", p.tag("warn", "파일 생성 중"), "-"],
        ["09-26 09:40", "정하윤", "70명", `${p.tag("ok", "다운로드 가능")} ${p.sub("10-03까지")}`, p.ask("다운로드", "off", "일괄 저장 파일을 다운로드하시겠습니까?", "2026-09-26 요청 · 70명")],
        ["08-04 17:26", "김서준", "68명", p.tag("quiet", "기간 만료"), "-"],
      ],
    ),
  );
  const request = p.section(
    "새 요청",
    "",
    ui.detailTable("요청 범위", [
      ["대상 점포", `${BP.name} · 전체 점포 (4곳)`],
      ["대상 직원", `<b class="font-semibold">71명</b> ${p.sub("(재직 63명 · 보존 기간 내 퇴직 8명)")}`],
      ["파일 형식", `ZIP 파일 1개 ${p.sub("직원별 폴더로 구분됩니다")}`],
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
    p.band("다운로드한 파일의 보관 책임은 사업자에게 있습니다.", {
      desc: "직원의 이름 · 휴대전화번호 · 급여 정보가 포함된 파일입니다. 안전한 곳에 보관하고, 사용이 끝나면 삭제해 주세요.",
    }),
  );

  const body = ui.detailBody(`<div class="flex flex-col gap-[12px]">${head}${warn}</div>${p.cols(contents + requests, request + making + after)}`);
  return { title: "직원 자료 일괄 저장", html: ui.erpFrame({ header: erpHeader(A, R), title: "직원 자료 일괄 저장", body }) };
};
