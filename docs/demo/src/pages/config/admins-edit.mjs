// BP 관리자 수정. 목업 docs/mockup/config/admins-edit.html 의 기본 상태(hghr 이서아 · 일반)를 BP 마스터로 본 것.
// 제목 줄의 [취소][저장]은 폼 아래 버튼 줄로 내렸다. 가맹 마스터 미사용 확인창은 기본 상태가 아니라 뺐다.
// 목록·상세에서 슬라이드 패널로 연다(BP 마스터 계정 관리와 같다) — 전체 화면은 그대로 두고 직접 들어와도 쓸 수 있게 둔다.
import * as ui from "../../ui.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link, STORES } from "../../site.mjs";

// 고칠 수 없는 아이디를 제목 줄 띠지로 — 플랫폼 관리자 수정과 같다(앱 bp-admins admin-form-panel, 2026-10-27 사용자 지정)
const TITLE = `관리자 수정<span class="ml-[6px] inline-flex">${c.tag('아이디 · <b class="font-semibold">hghr</b>')}</span>`;

export function adminEditBody(A, R, { panel = false } = {}) {
  const detail = link(R, "config/admins-detail.html");
  // 패널(464px)에서는 두 칸 줄을 한 칸씩 세로로 쌓는다
  const row = panel ? (...cells) => cells.filter((x) => x !== c.blank).join("") : c.row;

  const basic = ui.formGroup(
    "기본정보",
    // 아이디 칸은 제목 줄 띠지로 옮겼다. 등록일시 · 최근 로그인은 상세에서 본다(2026-10-27 사용자 지정)
    row(ui.field(c.req("이름"), ui.textField({ value: "이서아", maxlength: 20 })), c.blank),
    row(ui.field(c.req("연락처"), c.tel("010", "2290", "5173")), ui.field(c.req("이메일"), ui.textField({ value: "seoa.lee@hangang.co.kr", maxlength: 100 }))),
    row(ui.field(c.req("계정상태"), ui.select(["사용", "미사용"])), c.blank),
  );

  // 계정 역할 · 권한 그룹은 패널에서도 한 줄에 나란히(2026-10-27 사용자 지정 — 전엔 패널에서 두 줄)
  // 계정 역할 · 권한명은 기본정보 안 맨 아래 — 「계정 역할」 묶음 제목은 없앴다(앱과 같다, 2026-10-27 사용자 지정)
  const roleRow = [
    c.row(
      // 계정 역할은 130px 고정, 권한 그룹이 남는 폭(앱 admin-form-panel, 2026-10-27)
      ui.field("계정 역할", ui.textField({ value: "BP 관리자", readonly: true }), "w-[130px] shrink-0"),
      ui.field(
        "권한명",
        ui.select(["운영 총괄 · BA000003", "인사 담당 · BA000004", "정산 조회 · BA000005", "고객응대 · BA000006", "점포 조회 전용 · BA000007"], { value: "인사 담당 · BA000004" }),
      ),
    ),
  ][0];

  const stores = ui.formGroup(
    "대상점포",
    row(ui.field("범위", ui.select(["전체 점포", "일부 점포"], { value: "일부 점포", "data-spick-scope": true })), c.blank),
    c.storePicker(A, {
      clearLabel: "전체 제거",
      // 폐점 점포는 새로 매핑할 수 없다 — 일괄 검색 왼쪽에 흐리게 「폐점」으로 두고 옮기지 못한다(2026-10-23)
      bulk: [...[...STORES].sort((a, b) => a[0].localeCompare(b[0])).map(([code, name, type]) => [name, code, type]), ["모리커피 합정점", "ST000012", "가맹점포", "폐점"]],
      picked: [
        ["모리커피 서초점", "ST000001", "직영점포"],
        ["모리커피 성수점", "ST000002", "직영점포"],
        ["온기식당 판교점", "ST000003", "직영점포"],
        ["온기식당 광화문점", "ST000004", "직영점포"],
      ],
    }),
  );


  const cancel = panel ? ui.button("취소", { variant: "off", "data-close": true }) : ui.button("취소", { variant: "off", href: detail });
  // 저장하면 상세 화면이 아니라 상세 슬라이드로 간다 — 패널은 수정 패널을 닫아 아래 상세 패널을 보이고(erp.js data-save-panel),
  // 전체 화면은 목록으로 가서 상세 패널을 연다(?panel=).
  const save = panel
    ? ui.button("저장", { "data-save-panel": "admin-detail-panel" })
    : ui.button("저장", { href: `${link(R, "config/admins.html")}?panel=admin-detail-panel` });
  return basic.replace("</div></section>", `${roleRow}</div></section>`) + stores + c.buttons(cancel, save);
}

export function adminEditPanel(A, R) {
  return ui.slidePanel("admin-edit-panel", "관리자 수정", ui.sectionHead(TITLE) + adminEditBody(A, R, { panel: true }));
}

export default ({ A, R }) => {
  const body = ui.detailBody(ui.sectionHead(TITLE) + adminEditBody(A, R));
  return { title: "관리자 수정", html: ui.erpFrame({ header: erpHeader(A, R), title: "BP 관리자 관리", body }) };
};
