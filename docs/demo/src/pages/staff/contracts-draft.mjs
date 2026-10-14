// 근로계약 임시저장 이어 쓰기. 목록에서 임시저장 행(직원 이름)을 누르면 상세 없이 바로 온다(2026-10-13, 운영 정책 CTR-19).
// 작성 화면과 같은 틀(contracts-new.mjs)이고, 제목 줄의 「삭제」가 취소와 임시저장 사이에 선다. 확인을 받은 뒤 임시저장 행을 지운다.
import { contractForm } from "./contracts-new.mjs";

export default contractForm({ name: "한서윤", phone: "010-4471-2286" });
