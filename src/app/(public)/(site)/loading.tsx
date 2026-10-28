// 로그인 전 화면은 상단 메뉴 + 본문 + 푸터 틀(layout.tsx)이 늘 서 있고 공통 틀의 본문 높이 구조가 없어, 공통 로딩(딤 + 스피너)을 쓰면 어색하다.
// 틀은 그대로 두고 본문만 비운다 — 공통 로딩(app/loading.tsx)이 이 아래로 내려오지 않게 막는 자리이기도 하다.
export default function Loading() {
  return null;
}
