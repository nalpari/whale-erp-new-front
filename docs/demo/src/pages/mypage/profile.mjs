// 내 정보. 목업 docs/mockup/mypage/profile.html 의 기본 상태(기본정보 탭)를 BP 마스터로 본 것. 사업자정보 탭은 BP 마스터에게만 보인다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as f from "../../biz-form.mjs";
import { erpHeader } from "../../site.mjs";

export default ({ A, R }) => {
  const save = `<div class="flex justify-end">${ui.button("저장")}</div>`;

  const basic =
    ui.formGroup(
      "계정 정보",
      ui.formRow(ui.field("아이디", ui.textField({ value: "hangang01", readonly: true })), ui.field("사용자 권한", ui.textField({ value: "BP 마스터", readonly: true }))),
      ui.formRow(ui.field("가입일", ui.textField({ value: "2026-03-04", readonly: true })), ui.field("최근 로그인 일시", ui.textField({ value: "2026-09-22 09:12", readonly: true }))),
    ) +
    ui.formGroup(
      "기본정보",
      ui.formRow(
        ui.field(f.req("이름"), ui.textField({ value: "정하윤", maxlength: 20 }) + f.help("한글 또는 영문 2~20자")),
        f.group(f.req("연락처"), f.tel("010", "4821", "7730") + f.help("휴대전화 · 숫자 10~11자리")),
      ),
      ui.field(
        f.req("이메일"),
        ui.textField({ type: "email", value: "hayoon@hangang.co.kr", maxlength: 100 }) +
          f.help("바꾸면 칸을 벗어날 때 형식과 중복을 확인합니다 · 소유 인증 없이 바로 저장되고, 바꿨다는 메일은 보내지 않습니다"),
      ),
      save,
    );

  const biz = ui.formGroup(
    f.titleBadge("사업자정보", "on", "인증 완료"),
    f.help("국세청 API 로 사업자등록번호·대표자명·개업일자의 진위만 확인합니다. 세 값은 인증 결과로만 바뀌고, 상호명은 인증으로 채워지지 않습니다."),
    f.bizAuth(A, "pb", { start: "done", values: ["211-87-01234", "남도현", "2021-03-15"], doneBadge: "인증 완료 · 2026-03-04" }),
    ui.field(f.req("상호명"), ui.textField({ value: "㈜한강상회", maxlength: 50 }) + f.help("1~50자 · 인증 결과로 채우지 않고 직접 적습니다")),
    ui.formRow(f.group("대표자 연락처", f.tel("010", "5530", "1182")), ui.field("대표자 이메일", ui.textField({ type: "email", value: "ceo@hangang.co.kr", maxlength: 100 }))),
    f.address(A, "사업장 주소", { zip: "04007", base: "서울 마포구 망원로 42", detail: "3층" }),
    ui.formRow(ui.field("업태", ui.textField({ value: "도소매업", maxlength: 50 })), ui.field("종목", ui.textField({ value: "식자재 유통", maxlength: 50 }))),
    f.help("점포에 등록한 사업자등록번호는 여기서 바뀌지 않습니다. 점포 수정 화면에서 관리합니다."),
    save,
  );

  const body = ui.detailBody(
    x.tabs([
      { id: "basic", label: "기본정보", html: basic },
      { id: "biz", label: "사업자정보", html: biz },
    ]) + f.SWAP_SCRIPT,
  );

  return { title: "내 정보", html: ui.erpFrame({ header: erpHeader(A, R), title: "내 정보", body }) };
};
