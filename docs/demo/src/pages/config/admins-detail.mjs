// BP 관리자 상세. 목업 docs/mockup/config/admins-detail.html 의 기본 상태(hghr 이서아 · BP 관리자 · 일부 점포)를 BP 마스터로 본 것.
// 목업 제목 줄 오른쪽의 실행 버튼은 화면 아래 버튼 줄로 내렸다(system 관리자 상세와 같다). 확인창의 목업 전용 결과 단계는 뺐다.
// 목록(config/admins.html)에서 슬라이드 패널로 연다(BP 마스터 계정 관리와 같다) — 전체 화면은 그대로 두고 직접 들어와도 쓸 수 있게 둔다.
// 수정은 전체 화면·패널 모두 수정 패널을 연다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";
import { adminEditPanel } from "./admins-edit.mjs";

const STORES = [
  ["모리커피 서초점", "ST000001"],
  ["모리커피 성수점", "ST000002"],
  ["온기식당 판교점", "ST000003"],
  ["온기식당 광화문점", "ST000004"],
];
// 이름 아랫줄에 「역할 | 권한그룹 | 상태 배지」 — 공통코드 상세 코드 머리 · 플랫폼 관리자 상세와 같은 모양(2026-10-27 사용자 지정 — 전엔 이름 옆 꼬리표)
const HEAD = c.adminHead("이서아", "BP 관리자", "인사 담당", ui.badge("on", "사용"));
// 전체 화면은 제목 줄에 이름만 두고, 「역할 | 권한그룹 | 상태 배지」 줄을 본문 맨 위에 둔다 — 제목 줄(59px)은 한 줄뿐이다(2026-10-27)
const HEAD_LINE = `<p class="text-[14px]">${c.headValues([["역할", "BP 관리자"], ["권한그룹", "인사 담당"], ["", ui.badge("on", "사용")]])}</p>`;

export function adminDetailBody(A, R, { panel = false } = {}) {
  const resetId = x.dialogId();
  const histId = x.dialogId();

  const left = [
    ui.detailTable("기본정보", [
      ["아이디", "hghr"],
      ["이름", "이서아"],
      ["휴대전화번호", "010-2290-5173"],
      ["이메일", "seoa.lee@hangang.co.kr"],
      // 미사용 계정이면 초기화 버튼 없이 빈칸(플랫폼 관리자와 같다, 2026-10-27 사용자 지정)
      ["비밀번호", x.dialogTrigger("초기화", resetId, "soft")],
      // 최근 로그인은 비밀번호 아래 줄(2026-10-27 사용자 지정)
      ["최근 로그인", "2026-09-20 17:55"],
    ]),
    // 등록 · 최종수정은 표 밖 테두리 없는 카드, 선 아래에 적용 대상(표 없이 제목 · 값만, 2026-10-27 사용자 지정)
    c.recordValues(["2025-04-01 09:12", "정하윤"], ["2026-02-03 15:10", "정하윤"], ui.formRow(ui.readonlyField("적용 대상", "일부 점포", true))),
  ].join("");

  const storeTable = ui.dataTable(
    [{ header: "점포명", align: "left" }, { header: "점포코드", width: "w-[110px]" }, { header: "점포 상태", width: "w-[90px]" }],
    STORES.map(([n, code]) => [n, code, ui.badge("on", "운영")]),
  );
  const right =
    `<div class="flex flex-col gap-[12px]">${ui.sectionHead(`대상 점포${c.sub("일부 · 4개점")}`)}${panel ? `<div class="overflow-x-auto">${storeTable}</div>` : storeTable}</div>`;

  const history = ui.dataTable(
    [
      { header: "일시", width: "w-[170px]" },
      { header: "처리자", width: "w-[130px]" },
      { header: "항목", width: "w-[160px]", align: "left" },
      { header: "변경 전", align: "left" },
      { header: "변경 후", align: "left" },
    ],
    [
      ["2026-06-18 17:25", "hangang01", "초기 비밀번호", "—", `초기화 메일 발송 완료 ${c.muted("· 값은 남기지 않음")}`],
      ["2026-02-03 15:10", "hangang01", "대상 점포", "일부 · ST000001~002", "일부 · ST000001~004"],
      ["2025-09-15 11:02", "hangang01", "권한 그룹", `정산 조회 ${c.muted("BA000005")}`, `인사 담당 ${c.muted("BA000004")}`],
      ["2025-04-01 09:12", "hangang01", "계정", "", `사용 · BP 관리자 · 정산 조회 ${c.muted("BA000005")}`],
    ],
  );

  const resetDialog = x.dialog(
    resetId,
    // 제목 · 문구는 플랫폼 관리자 관리의 초기화 확인창과 같다(2026-10-27 사용자 지정)
    "비밀번호를 초기화하시겠습니까?",
    `<div class="flex flex-col gap-[12px] break-keep">${c.kv([["아이디", "hghr"], ["이름", "이서아"]], 60)}<p>임시 비밀번호가 등록된 이메일로 발송되며, 기존 비밀번호는 즉시 무효화됩니다.<br>임시 비밀번호는 1시간 동안 유효하며, 로그인 시 비밀번호를 변경해야 합니다.<br>현재 로그인 중인 세션은 유지됩니다.</p></div>`,
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("초기화", { "data-close": true }),
    "w-[480px]",
  );
  const historyDialog = c.wide(
    x.dialog(
      histId,
      "변경 이력",
      `<div class="overflow-x-auto">${history}</div><div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div>`,
      ui.button("닫기", { variant: "off", "data-close": true }),
    ),
    "w-[640px] max-h-[calc(100dvh-48px)] overflow-y-auto",
  );

  const editBtn = ui.slideTrigger("수정", "admin-edit-panel");
  const histBtn = x.dialogTrigger("변경 이력", histId, "soft");
  // 패널: 이름은 맨 위에 혼자(닫기도 포함해 기능 버튼은 모두 맨 아래로, 2026-10-07 피드백). 전체 화면: 아래 버튼 줄.
  const head = panel ? HEAD : HEAD_LINE;
  const bottomButtons = panel
    ? `<div class="flex flex-wrap items-center gap-[6px]">${ui.button("닫기", { variant: "off", "data-close": true })}<span class="flex-1"></span>${editBtn}${histBtn}</div>`
    : "";
  const info = panel
    ? `<div class="flex flex-col gap-[24px]">${left}${right}</div>` // 제목 줄과 표 사이는 패널 칸 간격(16) — 플랫폼 관리자 상세와 같다(2026-10-27)
    : `<div class="grid grid-cols-2 items-start gap-[24px]"><div class="flex flex-col gap-[24px]">${left}</div><div class="flex flex-col gap-[24px]">${right}</div></div>`;
  const foot = panel ? "" : c.buttons(ui.button("목록", { variant: "off", href: link(R, "config/admins.html") }), editBtn, histBtn);

  return head + info + bottomButtons + foot + resetDialog + historyDialog;
}

export function adminDetailPanel(A, R) {
  return ui.slidePanel("admin-detail-panel", "관리자 상세", adminDetailBody(A, R, { panel: true }));
}

export default ({ A, R }) => {
  const body = ui.detailBody(adminDetailBody(A, R));
  return {
    title: "이서아",
    html: ui.erpFrame({ header: erpHeader(A, R), title: "이서아", body, panels: adminEditPanel(A, R) }),
  };
};
