// 고객지원(BP 사용자 쪽) 화면들이 같이 쓰는 내용. 목업 docs/mockup/support/index.html 의 기본 상태를 BP 마스터로 본 것.
// 목업은 탭 셋(공지사항·FAQ·문의하기)이었는데, 데모에서는 헤더 고객지원 메뉴의 소메뉴마다 화면을 나눴다(2026-10-02 재영).
// 화면마다 왼쪽 필터 + 목록(목록 화면 기본 틀), 문의 등록 폼은 슬라이드 패널.
import * as ui from "./ui.mjs";
import * as p from "./staff-parts.mjs";
import { link } from "./site.mjs";

export function supportSections({ A, R }) {
  const L = (path) => link(R, path);
  const pageNav = (n) => `<div class="pt-[14px]">${ui.pagination(A, 1, n)}</div>`;
  const ND = L("support/notice-detail.html");
  // 라디오는 필터 안에 세로로 둔다.
  const radioGroup = (name, items) => items.map((t, i) => ui.radio(t, name, i === 0)).join("");
  const IM = L("support/inquiry-mine.html");

  const notice = (title, kind, date, pinned) => [`${pinned ? `${p.tag("quiet", "고정")} ` : ""}${ui.link(title, ND)}`, kind, date];
  const notices =
    ui.listToolbar(9, "") +
    ui.dataTable(
      [{ header: "제목", align: "left" }, { header: "구분", width: "w-[120px]" }, { header: "게시일", width: "w-[140px]" }],
      [
        notice("9월 정기 점검 안내 (09-14 02:00~05:00)", "점검", "2026-09-05", true),
        notice("근로계약 전자날인 기능이 열렸습니다", "기능", "2026-09-01"),
        notice("KIOSK 9월 업데이트 — 결제 화면이 바뀝니다", "KIOSK", "2026-08-28"),
        notice("개인정보처리방침 개정 안내", "약관", "2026-08-25"),
        notice("급여명세서 발송 시간이 오전 9시로 바뀝니다", "기능", "2026-08-22"),
        notice("WHALE ERP 1차 오픈 일정 안내", "안내", "2026-08-19"),
        notice("8월 정기 점검 안내 (08-10 02:00~04:00)", "점검", "2026-08-03"),
        notice("직원 초대 문자 발신번호 변경 안내", "안내", "2026-07-29"),
        notice("이용약관 개정 안내 (07-15 시행)", "약관", "2026-07-01"),
      ],
      "등록된 공지사항이 없습니다.",
    ) +
    pageNav(1);

  // FAQ: 답을 그 자리에서 펼친다(네이티브 details). 1팀 컴포넌트에 없는 접는 목록.
  const qa = (q, a) =>
    `<details class="group border-b border-erp-thead-line"><summary class="flex h-[46px] cursor-pointer list-none items-center gap-[10px] px-[10px] text-[14px] text-erp-ink [&::-webkit-details-marker]:hidden"><span class="font-semibold text-erp-brand">Q</span><span class="flex-1 truncate">${q}</span>${ui.img(A, "chevron-small.svg", 5, 8, "-rotate-90 transition-transform duration-150 group-open:rotate-90")}</summary><div class="flex gap-[10px] bg-erp-thead-bg px-[10px] py-[12px] text-[14px] leading-[1.6] text-erp-ink"><span class="font-semibold text-erp-label">A</span><p class="flex-1">${a}</p></div></details>`;
  const faq =
    ui.listToolbar(11, "") +
    `<div data-filter-items class="border-t border-erp-thead-line">${[
      qa("근로계약서를 보냈는데 직원이 못 받았다고 합니다", "계약 상세에서 <b>발송 이력</b>을 먼저 확인하세요. 직원이 아직 가입하지 않았다면 상태가 <b>발송 대기</b>로 남고, 가입이 끝나는 순간 자동으로 발송됩니다."),
      qa("퇴사한 직원의 급여명세서는 어떻게 보나요", "급여명세서 목록에서 재직 상태 필터를 <b>전체</b>로 바꾸면 보입니다. 인사 기록은 법정 보존 기간인 3년 이상 보관합니다."),
      qa("직원이 계약서를 거부하면 어떻게 되나요", "계약은 <b>거부</b> 상태로 남고 알림이 옵니다. 사유를 보고 내용을 고쳐 재발송하면 새 서명 요청이 나갑니다."),
      qa("점포를 더 늘리려면 어떻게 하나요", "요금 PLAN 의 점포 수를 넘으면 등록이 막힙니다. 좌측 아래 <b>PLAN 사용량</b>에서 남은 수를 확인하고, 부족하면 점포수 추가 부가서비스를 구독하세요."),
      qa("관리자를 한 명 더 두려면 어떻게 하나요", "환경설정의 <b>사용자·권한 관리</b>에서 초대합니다. 점포 단위 관리자는 그 점포의 직원만 봅니다."),
      qa(
        "비밀번호를 잊은 직원은 어떻게 하나요",
        "직원이 앱의 비밀번호 찾기에서 이메일 핀으로 직접 재설정할 수 있습니다. 그래도 안 되면 직원 상세에서 <b>비밀번호 초기화</b>를 누르세요. 재설정 링크가 직원 이메일로 가고 직원이 열어 새 비밀번호를 정합니다. 링크는 24시간 유효하고 한 번만 쓸 수 있습니다. 새 비밀번호를 정하면 그 링크는 무효가 되고, 초기화를 다시 누르면 앞서 보낸 링크도 바로 무효가 됩니다. 관리자는 그 값을 보지 못합니다.",
      ),
    ].join("")}</div>` +
    pageNav(2);

  const askPanel = "inquiry-form";
  const inq = (title, cat, state, reg, ans) => [ui.link(title, IM), cat, state, reg, ans];
  const inquiries =
    ui.listToolbar(7, ui.slideTrigger("문의하기", askPanel)) +
    ui.dataTable(
      [
        { header: "제목", align: "left" },
        { header: "분류", width: "w-[120px]" },
        { header: "상태", width: "w-[120px]" },
        { header: "등록일", width: "w-[100px]" },
        { header: "답변일", width: "w-[100px]" },
      ],
      [
        inq("파트타이머 주휴수당이 계산되지 않습니다", "직원·근로", p.tag("warn", "접수"), "09-04", "-"),
        inq("급여명세서 PDF 가 한글이 깨져 보입니다", "직원·근로", p.tag("quiet", "처리중"), "09-02", "09-03"),
        inq("가맹점 초대 메일이 반송됩니다", "점포·설비", p.tag("ok", "답변완료"), "08-30", "09-02"),
        inq("요금 PLAN 을 바꾸면 언제부터 적용되나요", "요금·구독", p.tag("ok", "답변완료"), "08-21", "08-22"),
        inq("근무스케줄 복사가 지난주 것을 가져오지 않습니다", "직원·근로", p.tag("ok", "답변완료"), "08-12", "08-13"),
        inq("KIOSK 결제 내역이 매출조회에 안 잡힙니다", "점포·설비", p.tag("ok", "답변완료"), "07-30", "08-01"),
        inq("관리자 계정을 다른 사람에게 넘길 수 있나요", "기타", p.tag("ok", "답변완료"), "07-18", "07-18"),
      ],
      "등록한 문의사항이 없습니다.",
    ) +
    pageNav(1);

  // 첨부파일(운영 정책 CNT-18, 2026-10-08 재영): 이미지·PDF, 5개까지, 파일당 10MB. 등록할 때만 붙인다.
  // 거절(6번째·10MB 초과·다른 종류)은 그 파일만 막고 쓴 내용과 올린 파일은 둔다 — 데모는 안내 문구로만 보인다.
  const fileRow = (name, size) =>
    `<li class="flex h-[34px] items-center gap-[10px] border-b border-erp-divider text-[14px]"><span class="flex-1 truncate">${name}</span><span class="text-erp-label">${size}</span><button type="button" class="text-erp-link hover:underline">빼기</button></li>`;
  const attachField = `<div class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">첨부파일</span><div class="flex gap-[6px]"><input readonly placeholder="이미지·PDF, 5개까지, 파일당 10MB" aria-label="첨부파일" class="${ui.FIELD}">${ui.button("파일 선택", { variant: "soft" })}</div><ul aria-label="올린 파일">${fileRow("주휴수당_0원_화면.png", "412 KB")}${fileRow("9월_급여명세서_배정숙.pdf", "1.2 MB")}</ul><p class="text-[13px] leading-[1.6] text-erp-label">6번째 파일, 10MB 가 넘는 파일, 이미지·PDF 가 아닌 파일은 그 파일만 올리지 않고 알려 줍니다. 쓴 내용과 올린 파일은 그대로 둡니다.</p></div>`;

  const askForm = ui.slidePanel(
    askPanel,
    "문의하기",
    `<h2 class="text-[18px] font-semibold text-erp-ink">문의하기</h2>` +
      ui.formGroup(
        "문의 내용",
        ui.field("분류", ui.select(["직원·근로", "요금·구독", "점포·설비", "기타"])),
        ui.field("제목", ui.textField({ placeholder: "한 줄로 적어 주세요" })),
        ui.field("내용", ui.textarea({ rows: 8, placeholder: "어떤 화면에서 무엇을 하려다 막혔는지 적어 주시면 빨리 답할 수 있습니다." })),
        attachField,
      ) +
      ui.panelButtons("취소", "문의 등록"),
  );

  const radioFilter = (search, name, items) =>
    ui.filterPanel(A, [ui.filterSection(search[0], ui.searchField(A, { placeholder: search[1] }), { tight: true }), ui.filterSection(search[2], radioGroup(name, items), { last: true })]);
  const noticeFilter = radioFilter(["제목", "제목으로 검색", "구분"], "notice-kind", ["전체", "점검", "기능", "약관", "안내"]);
  const faqFilter = radioFilter(["질문", "질문으로 검색", "분류"], "faq-kind", ["전체", "직원·근로", "계정·권한", "요금·구독"]);
  const inquiryFilter = radioFilter(["제목", "제목으로 검색", "상태"], "inquiry-state", ["전체 7", "접수 1", "처리중 1", "답변완료 5"]);
  return { notices, faq, inquiries, askForm, noticeFilter, faqFilter, inquiryFilter };
}
