// 공지사항 수정. 목업 docs/mockup/support/notice-edit.html 의 기본 상태(게시된 공지 · 상단 고정)를 플랫폼 관리자로 본 것.
// 목업은 공지·FAQ 를 한 화면에서 종류로 바꿨는데, 데모에서는 FAQ 를 faq-edit 로 나눴다(2026-10-02 재영).
import * as ui from "../../ui.mjs";
import * as p from "../../staff-parts.mjs";
import * as x from "../../extra.mjs";
import { platformHeader, link } from "../../site.mjs";

// 아래 부품은 1팀 공통 컴포넌트에 없어 토큰으로 그렸다.
// 상세 화면 틀(staff-parts): 머리 칸 상자. 글·입력이 든 상자는 안쪽 여백, 표만 든 상자(이력)는 여백 없이.
const box = (title, right, body) => p.box(title, right, `<div class="flex flex-col gap-[18px]">${body}</div>`, { pad: true });
const hint = (text) => `<span class="text-[14px] font-normal text-erp-label">${text}</span>`;
const note = (html) => `<p class="text-[14px] leading-[1.6] text-erp-label">${html}</p>`;
// 경고 띠(목업 band--warn). 제목 한 줄만 둔다.
const band = (text) => `<p class="rounded-[2px] border border-erp-off-bg bg-erp-off-bg px-[16px] py-[12px] text-[14px] font-medium text-erp-off">${text}</p>`;
// 첨부파일 칸: 읽기 전용 입력칸 + [파일 선택]
const fileField = `<div class="flex gap-[6px]"><input readonly placeholder="선택된 파일 없음" aria-label="첨부파일" class="${ui.FIELD}">${ui.button("파일 선택", { variant: "soft" })}</div>`;

export default ({ A, R }) => {
  const content = box("내용", "",
    // 공지사항 유형(api noticeType, 공지면 필수) — 사용자 쪽 목록의 「구분」이 이것이다.
    ui.field("유형", ui.select(["점검", "기능", "약관", "안내"], { value: "점검" })) +
      ui.field("제목", ui.textField({ value: "9월 정기 점검 안내 (09-14 02:00~05:00)" })) +
      ui.field(
        "본문",
        ui.textarea({
          rows: 12,
          value:
            "9월 14일(일) 새벽 2시부터 5시까지 정기 점검이 있습니다.\n점검 시간에는 관리자 웹과 직원 전용 앱을 모두 사용할 수 없습니다.\n직원 근무 앱의 출퇴근 등록은 점검 중에도 기기에 기록되고 점검이 끝나면 자동으로 반영됩니다.\n점검이 일찍 끝나면 공지 없이 서비스를 재개합니다.",
        }),
      ) +
      `<div class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">첨부파일</span>${fileField}${note("이미지(JPG · PNG)와 PDF 를 올릴 수 있습니다. 5개까지, 파일당 10MB.")}</div>`,
  );

  // 게시 기간(api publishStartDate · publishEndDate)은 공지에만. 사용자 쪽에는 이 기간에만 보이고, 시작일이 없으면 등록 일시부터 보이며 게시일도 등록 일시다(WHALEERP-273).
  const period = `<div class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">게시 기간</span><div class="flex items-center gap-[6px]"><div class="flex-1">${ui.dateField(A, { label: "게시 시작일", value: "2026-09-05" })}</div><span class="text-erp-label">~</span><div class="flex-1">${ui.dateField(A, { label: "게시 종료일", value: "2026-09-14" })}</div></div>${note("비우면 등록한 때부터 기한 없이 보입니다. 종료일은 시작일보다 앞설 수 없고, 그날까지 보입니다. 사용자 쪽 게시일은 시작일입니다.")}</div>`;
  const pin = box("게시 설정", "",
    x.toggle("상단 고정", true) + note("켜면 사용자 쪽 공지 목록 맨 위에 고정 표시와 함께 섭니다. 여러 개면 그 안에서 게시일 내림차순입니다.") + period,
  );

  const target = (label, desc, on) => ui.checkbox(A, desc ? `${label} ${hint(`— ${desc}`)}` : label, on);
  // 부가서비스 대상(상품별)은 1차에 없다(2026-10-12 재영).
  const targets = box("노출 대상", "",
    `<div class="flex flex-col gap-[12px]">${target("비회원", "", true)}${target("회원", "로그인한 모든 사용자", true)}${target("BP", "사업자 관리자", true)}${target("점포", "점포 단위 관리자", false)}</div>` +
      band("비회원이 포함되어 로그인 전 홈에 공개됩니다"),
  );

  // 변경 이력 표는 두지 않는다 — 마지막 수정자 · 수정 시각만 남긴다(updated_by · updated_at, WHALEERP-272 2026-10-12 재영 승인).
  const history = box("최근 수정", "",
    `<p class="text-[14px] text-erp-ink">2026-09-05 14:20 · 이서준</p>` +
      note("둘이 동시에 고치면 나중 저장이 막히고(409) 최신 내용을 다시 불러옵니다. 덮어쓰지 않습니다."),
  );
  // 저장에 성공하면 토스트로 알리고 이 화면에 머문다(#276).
  // 게시 상태는 임시저장 · 게시 · 비공개 어느 쪽으로든 바꾼다. 게시로 저장할 때만 노출 대상이 하나 이상 있어야 한다(WHALEERP-272).
  // 삭제는 지움 표시라 사용자에게서만 감추고 보관한다. 이미 지운 글을 또 지우면 이미 지웠다고 알린다.
  const right = `<div class="flex items-center gap-[6px]">${ui.button("목록", { variant: "off", href: link(R, "support/community-notices.html") })}${ui.button("삭제", { variant: "soft" })}${ui.button("비공개", { variant: "soft", "data-toast": "비공개로 저장했습니다." })}${ui.button("임시저장", { variant: "soft", "data-toast": "임시저장했습니다." })}${ui.button("게시", { "data-toast": "게시했습니다." })}</div>`;

  return {
    title: "공지사항 수정",
    // 직원 상세와 같은 틀: 화면 제목은 메뉴 이름, 첫 줄 「공지사항 수정」 + 버튼, 묶음은 머리 칸 상자(2026-10-02 재영)
    html: ui.erpFrame({ header: platformHeader(A, R), title: "공지사항", body: ui.detailBody(p.detailHead("공지사항 수정", right) + p.cols(content, pin + targets + history)) }),
  };
};
