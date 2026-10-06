// 내 정보. 목업 docs/mockup/mypage/profile.html 의 기본 상태(기본정보 탭)를 BP 마스터로 본 것. 사업자정보 탭은 BP 마스터에게만 보인다.
// 입력칸 내용은 site.mjs 의 mypageBody 로 옮겨 GNB 슬라이드 패널(site.mjs mypagePanel)과 함께 쓴다 — 전체 화면은 회원 탈퇴의
// "취소"가 돌아갈 곳으로 남겨 두고, 평소 GNB 에서는 패널로 연다(2026-10-06 피드백: 입력칸 몇 개로 전체 페이지 전환은 불편하다).
import * as ui from "../../ui.mjs";
import { erpHeader, mypageBody } from "../../site.mjs";

export default ({ A, R }) => {
  const body = ui.detailBody(mypageBody(A, { idPrefix: "pb" }));
  return { title: "내 정보", html: ui.erpFrame({ header: erpHeader(A, R), title: "내 정보", body }) };
};
