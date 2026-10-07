// 알림 템플릿 등록. 목업 docs/mockup/notify/templates-new.html. 수정 화면과 같은 틀(src/template-edit.mjs)을 쓴다.
// 템플릿 이름은 직접 넣고, 채널을 고르면 템플릿 코드에 채널 접두만 채워진다(NOTIFY-10·11, 2026-10-07 재영).
import { templateEdit } from "../../template-edit.mjs";

export default templateEdit({
  mode: "new",
  kind: "ops",
  vars: [{}],
  notice: "카카오 검수를 받은 문구와 한 글자라도 다르면 발송되지 않습니다. 검수를 받은 뒤 고쳐 주세요.",
});
