// 비밀번호 변경. 목업 docs/mockup/mypage/password.html 의 기본 상태(입력)를 BP 마스터로 본 것.
// 입력칸 내용은 site.mjs 의 passwordBody 로 옮겨 GNB 슬라이드 패널(site.mjs passwordPanel)과 함께 쓴다(2026-10-06 피드백).
import * as ui from "../../ui.mjs";
import { erpHeader, passwordBody } from "../../site.mjs";

export default ({ A, R }) => {
  const body = ui.detailBody(`<div class="w-[560px]">${passwordBody()}</div>`);
  return { title: "비밀번호 변경", html: ui.erpFrame({ header: erpHeader(A, R), title: "비밀번호 변경", body }) };
};
