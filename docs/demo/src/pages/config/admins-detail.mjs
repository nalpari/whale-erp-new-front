// BP 관리자 상세. 목업 docs/mockup/config/admins-detail.html 의 기본 상태(hghr 이서아 · BP 관리자 · 일부 점포)를 BP 마스터로 본 것.
// 목업 제목 줄 오른쪽의 실행 버튼은 화면 아래 버튼 줄로 내렸다(system 관리자 상세와 같다). 확인창의 목업 전용 결과 단계는 뺐다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

const STORES = [
  ["모리커피 서초점", "ST000001"],
  ["모리커피 성수점", "ST000002"],
  ["온기식당 판교점", "ST000003"],
  ["온기식당 광화문점", "ST000004"],
];

export default ({ A, R }) => {
  const resetId = x.dialogId();
  const roles = link(R, "config/roles.html");

  const left = [
    ui.detailTable("기본정보", [
      ["아이디", "hghr"],
      ["이름", "이서아"],
      ["휴대전화번호", "010-2290-5173"],
      ["이메일", "seoa.lee@hangang.co.kr"],
      ["등록일시", "2025-04-01 09:12"],
      ["최근 로그인", "2026-09-20 17:55"],
    ]),
    ui.detailTable("계정 상태", [
      ["계정 상태", ui.badge("on", "사용")],
      ["강제 비밀번호 변경", "대상 아님"],
    ]),
    ui.detailTable("권한 그룹", [
      ["계정 역할", "BP 관리자"],
      ["권한 그룹", `${ui.link("인사 담당", roles)} ${c.muted("BA000004")}`],
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
    ]) + `<div class="flex flex-col gap-[12px]">${ui.sectionHead(`점포 매핑${c.sub("일부 · 4개점")}`)}${storeTable}</div>`;

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
    `<div class="flex flex-col gap-[12px] break-keep">${c.kv([["아이디", "hghr"], ["이름", "이서아"]], 60)}<p>시스템이 12자 무작위 초기 비밀번호를 새로 발급해 이 계정의 이메일로만 보냅니다. 처리하는 사람도 그 값을 볼 수 없습니다. 초기 비밀번호는 1시간 안에 로그인해야 하며, 지나면 로그인 화면의 비밀번호 찾기로 임시 비밀번호를 다시 받습니다.</p><p><b class="font-semibold">지금 비밀번호는 곧바로 못 쓰게 되고, 열려 있는 세션도 모두 닫힙니다</b></p></div>`,
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("초기화", { "data-close": true }),
  );

  const body = ui.detailBody(
    `<div class="grid grid-cols-2 items-start gap-[24px]"><div class="flex flex-col gap-[24px]">${left}</div><div class="flex flex-col gap-[24px]">${right}</div></div>` +
      `<div class="flex flex-col gap-[12px]">${ui.sectionHead(`변경 이력${c.sub("생성 · 정보 · 권한 그룹 · 점포 · 상태 · 비밀번호 초기화 · 최신순")}`)}${history}</div>` +
      c.buttons(
        ui.button("목록", { variant: "off", href: link(R, "config/admins.html") }),
        x.dialogTrigger("비밀번호 초기화", resetId, "soft"),
        ui.button("수정", { href: link(R, "config/admins-edit.html") }),
      ) +
      resetDialog,
  );

  return {
    title: "이서아",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: `이서아 <span class="ml-[6px] inline-flex gap-[6px] align-middle">${ui.badge("on", "사용")}${c.tag("BP 관리자")}</span>`,
      body,
    }),
  };
};
