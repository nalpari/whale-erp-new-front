// 알림 템플릿 등록. 목업 docs/mockup/notify/templates-new.html. 수정 화면과 같은 틀(src/template-edit.mjs)을 쓴다.
// 채널과 알림 유형·발송 용도를 고르면 템플릿 코드 기본값(채널 접두 + 코드)이 채워지고 바꿀 수 있다(NOTIFY-10, 2026-10-07 재영).
import { templateEdit } from "../../template-edit.mjs";

export default templateEdit({
  mode: "new",
  kind: "ops",
  vars: [{}],
  notice: "카카오 검수를 받은 문구와 한 글자라도 다르면 발송되지 않습니다. 검수를 받은 뒤 고쳐 주세요.",
});
