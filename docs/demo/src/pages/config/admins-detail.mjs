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
// 권한 그룹은 계정 역할 옆에 방패 아이콘을 단 꼬리표로 보인다(본문의 계정 상태·권한 그룹 영역은 없앴다 · 2026-10-07). 아이콘 모양은 목업 app.js 의 shield.
const SHIELD = `<svg viewBox="0 0 24 24" class="mr-[4px] inline-block size-[12px] align-[-1px]" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.1 20 6v6.1c0 4.5-3.4 7.9-8 8.9-4.6-1-8-4.4-8-8.9V6z"/><path d="m8.9 12.1 2.1 2.1 4.1-4.2"/></svg>`;
const NAME_BADGES = `이서아 <span class="ml-[6px] inline-flex gap-[6px] align-middle">${ui.badge("on", "사용")}${c.tag("BP 관리자")}<span title="권한 그룹">${c.tag(`${SHIELD}인사 담당`)}</span></span>`;

export function adminDetailBody(A, R, { panel = false } = {}) {
  const resetId = x.dialogId();

  const left = [
    ui.detailTable("기본정보", [
      ["아이디", "hghr"],
      ["이름", "이서아"],
      ["휴대전화번호", "010-2290-5173"],
      ["이메일", "seoa.lee@hangang.co.kr"],
      ["등록일시", ui.detailValues(["2025-04-01 09:12", "정하윤"])],
      ["최종 수정일시", ui.detailValues(["2026-02-03 15:10", "정하윤"])],
      ["최근 로그인", "2026-09-20 17:55"],
    ]),
  ].join("");

  const storeTable = ui.dataTable(
    [{ header: "점포명", align: "left" }, { header: "점포코드", width: "w-[110px]" }, { header: "점포 유형", width: "w-[100px]" }, { header: "점포 상태", width: "w-[90px]" }],
    STORES.map(([n, code]) => [n, code, "직영점포", ui.badge("on", "운영")]),
  );
  const right =
    ui.detailTable("소속 BP정보", [
      ["BP코드", "BP000017"],
      ["BP상호명", "㈜한강상회"],
    ]) + `<div class="flex flex-col gap-[12px]">${ui.sectionHead(`점포 매핑${c.sub("일부 · 4개점")}`)}${panel ? `<div class="overflow-x-auto">${storeTable}</div>` : storeTable}</div>`;

  const history = ui.dataTable(
    [
      { header: "일시", width: "w-[170px]" },
      { header: "처리자", width: "w-[130px]" },
      { header: "항목", width: "w-[160px]" },
      { header: "변경 전", align: "left" },
      { header: "변경 후", align: "left" },
    ],
    [
      ["2026-06-18 17:25", "hangang01", "초기 비밀번호", "—", `초기화 메일 발송 완료 ${c.muted("· 값은 남기지 않음")}`],
      ["2026-02-03 15:10", "hangang01", "점포 매핑", "일부 · ST000001~002", "일부 · ST000001~004"],
      ["2025-09-15 11:02", "hangang01", "권한 그룹", `정산 조회 ${c.muted("BA000005")}`, `인사 담당 ${c.muted("BA000004")}`],
      ["2025-04-01 09:12", "hangang01", "계정", "", `사용 · BP 관리자 · 정산 조회 ${c.muted("BA000005")}`],
    ],
  );

  const resetDialog = x.dialog(
    resetId,
    "비밀번호 초기화",
    `<div class="flex flex-col gap-[12px] break-keep">${c.kv([["아이디", "hghr"], ["이름", "이서아"]], 60)}<p>시스템이 12자 무작위 초기 비밀번호를 새로 발급해 이 계정의 이메일로만 보냅니다. 처리하는 사람도 그 값을 볼 수 없습니다. 초기 비밀번호는 1시간 안에 로그인해야 하며, 지나면 로그인 화면의 비밀번호 찾기로 임시 비밀번호를 다시 받습니다.</p><p><b class="font-semibold">지금 비밀번호는 곧바로 못 쓰게 되지만, 열려 있는 세션은 닫지 않습니다</b></p></div>`,
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("초기화", { "data-close": true }),
  );

  const resetBtn = x.dialogTrigger("비밀번호 초기화", resetId, "soft");
  const editBtn = ui.slideTrigger("수정", "admin-edit-panel");
  // 패널: 이름 줄 아래에 [비밀번호 초기화][수정][닫기] — 464px 패널에서는 이름 옆에 세 버튼이 다 들어가지 않는다 / 전체 화면: 아래 버튼 줄
  const head = panel
    ? `<div class="flex flex-col gap-[12px]">${ui.sectionHead(NAME_BADGES)}<div class="flex justify-end gap-[6px]">${resetBtn}${editBtn}${ui.button("닫기", { variant: "off", "data-close": true })}</div></div>`
    : "";
  const info = panel
    ? `<div class="flex flex-col gap-[24px]">${left}${right}</div>`
    : `<div class="grid grid-cols-2 items-start gap-[24px]"><div class="flex flex-col gap-[24px]">${left}</div><div class="flex flex-col gap-[24px]">${right}</div></div>`;
  const historyBlock = panel ? `<div class="overflow-x-auto">${history}</div>` : history;
  const foot = panel ? "" : c.buttons(ui.button("목록", { variant: "off", href: link(R, "config/admins.html") }), resetBtn, editBtn);

  return (
    head +
    info +
    `<div class="flex flex-col gap-[12px]">${ui.sectionHead(`변경 이력${c.sub("생성 · 정보 · 권한 그룹 · 점포 · 상태 · 비밀번호 초기화 · 최신순")}`)}${historyBlock}</div>` +
    foot +
    resetDialog
  );
}

export function adminDetailPanel(A, R) {
  return ui.slidePanel("admin-detail-panel", "관리자 상세", adminDetailBody(A, R, { panel: true }));
}

export default ({ A, R }) => {
  const body = ui.detailBody(adminDetailBody(A, R));
  return {
    title: "이서아",
    html: ui.erpFrame({ header: erpHeader(A, R), title: NAME_BADGES, body, panels: adminEditPanel(A, R) }),
  };
};
