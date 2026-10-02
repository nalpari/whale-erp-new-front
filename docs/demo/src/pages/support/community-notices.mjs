// 커뮤니티관리 › 공지사항 — 플랫폼 헤더 메뉴 커뮤니티관리 › 공지사항.
import * as ui from "../../ui.mjs";
import { communitySections } from "../../community-sections.mjs";
import { platformHeader } from "../../site.mjs";

export default ({ A, R }) => {
  const { filter, content } = communitySections({ A, R }).notices;
  return { title: "공지사항", html: ui.erpFrame({ header: platformHeader(A, R), title: "공지사항", body: ui.listBody(filter, content) }) };
};
