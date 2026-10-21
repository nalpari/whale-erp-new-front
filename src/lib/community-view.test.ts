// node --test src/lib/community-view.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  faqBody,
  parseInquiryQuery,
  parseSupportInquiryQuery,
  parseSupportNoticeQuery,
  pickInquiryFiles,
  postIdOf,
  parsePostQuery,
  postFields,
  queryString,
  sizeLabel,
  validatePost,
  type PostForm,
} from "./community-view.ts";

const notice = (over: Partial<PostForm> = {}): PostForm => ({
  kind: "NOTICE",
  title: "9월 정기 점검 안내",
  body: "새벽 2시부터 5시까지",
  noticeType: "MAINTENANCE",
  isPinned: true,
  publishStartDate: "2026-09-05",
  publishEndDate: "2026-09-14",
  faqCategoryCode: "",
  audiences: ["GUEST", "MEMBER"],
  ...over,
});
const faq = (over: Partial<PostForm> = {}): PostForm => notice({ kind: "FAQ", noticeType: "", faqCategoryCode: "STAFF_LABOR", ...over });

test("parsePostQuery — 이상한 값은 기본값(1쪽 · 20건 · 전체)으로", () => {
  assert.deepEqual(parsePostQuery({}), { page: 1, pageSize: 20, status: "" });
  assert.deepEqual(parsePostQuery({ page: "3", pageSize: "50", status: "PRIVATE" }), { page: 3, pageSize: 50, status: "PRIVATE" });
  assert.deepEqual(parsePostQuery({ page: "0", pageSize: "30", status: "x" }), { page: 1, pageSize: 20, status: "" });
  assert.equal(parsePostQuery({ page: "10000001" }).page, 1);
});

test("parseInquiryQuery — 검색어는 다듬고 api 한도로 자른다", () => {
  const q = parseInquiryQuery({ title: "  주휴수당 ", sender: "가".repeat(150), answerStatus: "WAITING" });
  assert.equal(q.title, "주휴수당");
  assert.equal(q.sender.length, 100);
  assert.equal(q.answerStatus, "WAITING");
});

test("parseInquiryQuery — 주소의 NUL 은 뺀다(api 가 400 을 내 목록이 통째로 실패한다)", () => {
  assert.equal(parseInquiryQuery({ title: "주휴\u0000수당", sender: "\u0000" }).title, "주휴수당");
  assert.equal(parseInquiryQuery({ sender: "\u0000" }).sender, "");
});

test("postIdOf — 1..2147483647 정수만, 글자든 숫자든 같은 규칙", () => {
  for (const ok of ["1", "2147483647", 1, 2147483647]) assert.equal(postIdOf(ok), Number(ok), String(ok));
  // 경로에 붙는 값이라 경로 문자 · 공백 · 다른 꼴의 숫자는 모두 막는다.
  for (const bad of ["0", "01", "-1", "1e3", "1.0", "2147483648", "1/2", "1/../x", "1?x=", " 1", "", null, undefined, 0, 1.5, NaN, 2 ** 31, {}])
    assert.equal(postIdOf(bad), null, String(bad));
});

test("faqBody — FAQ JSON 에 공지사항 칸을 싣지 않는다", () => {
  assert.deepEqual(Object.keys(faqBody(faq(), "DRAFT")).sort(), ["audiences", "body", "faqCategoryCode", "status", "title"]);
});

test("validatePost — 제목 200자 · 본문 20,000자 경계", () => {
  assert.deepEqual(validatePost(notice({ title: "a".repeat(200), body: "a".repeat(20_000) }), "DRAFT", 0, []), []);
  assert.deepEqual(validatePost(notice({ body: "a".repeat(20_001) }), "DRAFT", 0, []), ["본문은 20,000자까지 쓸 수 있습니다"]);
});

test("queryString — 빈 값과 기본값은 싣지 않는다", () => {
  assert.equal(queryString({ page: 1, pageSize: 20, status: "" }), "");
  assert.equal(queryString({ page: 2, pageSize: 50, answerStatus: "ANSWERED", title: "a b" }), "?page=2&pageSize=50&answerStatus=ANSWERED&title=a+b");
});

test("validatePost — 맞으면 빈 목록", () => {
  assert.deepEqual(validatePost(notice(), "PUBLISHED", 0, []), []);
  assert.deepEqual(validatePost(faq(), "PUBLISHED", 0, []), []);
});

test("validatePost — 게시만 노출 대상이 있어야 한다", () => {
  assert.deepEqual(validatePost(notice({ audiences: [] }), "PUBLISHED", 0, []), ["게시하려면 노출 대상을 하나 이상 골라 주세요"]);
  assert.deepEqual(validatePost(notice({ audiences: [] }), "DRAFT", 0, []), []);
});

test("validatePost — 공지는 유형, FAQ 는 카테고리가 필수", () => {
  assert.deepEqual(validatePost(notice({ noticeType: "" }), "DRAFT", 0, []), ["공지사항 유형을 골라 주세요"]);
  assert.deepEqual(validatePost(faq({ faqCategoryCode: "" }), "DRAFT", 0, []), ["FAQ 카테고리를 골라 주세요"]);
});

test("validatePost — 제목 · 본문 공백과 길이", () => {
  assert.deepEqual(validatePost(notice({ title: " ", body: "\n" }), "DRAFT", 0, []), ["제목을 입력해 주세요", "본문을 입력해 주세요"]);
  assert.equal(validatePost(notice({ title: "a".repeat(201) }), "DRAFT", 0, []).length, 1);
});

test("validatePost — 게시 종료일이 시작일보다 앞서면 막는다(FAQ 는 기간을 보지 않는다)", () => {
  const swapped = { publishStartDate: "2026-09-14", publishEndDate: "2026-09-05" };
  assert.deepEqual(validatePost(notice(swapped), "DRAFT", 0, []), ["게시 종료일이 시작일보다 앞설 수 없습니다"]);
  assert.deepEqual(validatePost(faq(swapped), "DRAFT", 0, []), []);
});

test("validatePost — 첨부는 남는 것 + 더하는 것 5개, 종류 · 크기", () => {
  const ok = { name: "a.PDF", size: 1024 };
  assert.deepEqual(validatePost(notice(), "DRAFT", 4, [ok]), []);
  assert.equal(validatePost(notice(), "DRAFT", 4, [ok, ok]).length, 1);
  assert.deepEqual(validatePost(notice(), "DRAFT", 0, [{ name: "a.gif", size: 1 }]), ["a.gif: JPG · PNG · PDF 만 올릴 수 있습니다"]);
  assert.deepEqual(validatePost(notice(), "DRAFT", 0, [{ name: "a.jpg", size: 10 * 1024 * 1024 + 1 }]), ["a.jpg: 파일 하나는 10MB 까지 올릴 수 있습니다"]);
});

test("postFields — 공지 칸은 공지에만, 노출 대상은 이름을 되풀이", () => {
  assert.deepEqual(postFields(notice(), "PUBLISHED"), [
    ["title", "9월 정기 점검 안내"],
    ["body", "새벽 2시부터 5시까지"],
    ["status", "PUBLISHED"],
    ["audiences", "GUEST"],
    ["audiences", "MEMBER"],
    ["noticeType", "MAINTENANCE"],
    ["isPinned", "true"],
    ["publishStartDate", "2026-09-05"],
    ["publishEndDate", "2026-09-14"],
  ]);
  const fields = postFields(faq({ audiences: [] }), "DRAFT");
  assert.deepEqual(fields.at(-1), ["faqCategoryCode", "STAFF_LABOR"]);
  assert.ok(!fields.some(([k]) => k === "isPinned" || k === "audiences"));
});

test("sizeLabel", () => {
  assert.equal(sizeLabel(10), "1KB");
  assert.equal(sizeLabel(2048), "2KB");
  assert.equal(sizeLabel(3.5 * 1024 * 1024), "3.5MB");
});

test("고객지원 쿼리 — 모르는 구분 · 상태는 전체로, 검색어는 api 한도로 자른다", () => {
  assert.deepEqual(parseSupportNoticeQuery({ noticeType: "ADDON", keyword: ` ${"가".repeat(150)} ` }), { page: 1, pageSize: 20, keyword: "가".repeat(100), noticeType: "" });
  assert.deepEqual(parseSupportInquiryQuery({ status: "IN_PROGRESS", title: "주휴", page: "2" }), { page: 2, pageSize: 20, title: "주휴", status: "IN_PROGRESS" });
  assert.equal(parseSupportInquiryQuery({ status: "WAITING" }).status, "");
});

test("pickInquiryFiles — 6번째 · 10MB 초과 · 다른 종류는 그 파일만 뺀다", () => {
  const MB = 1024 * 1024;
  const { accepted, rejected } = pickInquiryFiles(3, [
    { name: "a.png", size: MB },
    { name: "b.hwp", size: MB },
    { name: "c.pdf", size: 11 * MB },
    { name: "d.JPG", size: MB },
    { name: "e.pdf", size: MB },
  ]);
  assert.deepEqual(accepted.map((f) => f.name), ["a.png", "d.JPG"]);
  assert.equal(rejected.length, 3);
  assert.match(rejected[0], /^b\.hwp: /);
  assert.match(rejected[1], /^c\.pdf: .*10MB/);
  assert.match(rejected[2], /^e\.pdf: .*5개/);
});
