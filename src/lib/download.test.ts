// node --test src/lib/download.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { downloadPercent, errorMessageOf, EXCEL_FAILED, EXCEL_SCHEDULED, fileNameOfDisposition, relayExcelResponse, XLSX_CONTENT_TYPE } from "./download.ts";

const fileHeaders = { "Content-Type": XLSX_CONTENT_TYPE, "Content-Disposition": "attachment; filename=\"stores.xlsx\"", "Content-Length": "4" };

test("엑셀 중계 — 200 파일은 본문 · 이름 · 크기를 그대로, 캐시하지 않는다", async () => {
  const relayed = await relayExcelResponse(new Response("xlsx", { status: 200, headers: fileHeaders }), "점포 엑셀");
  assert.equal(relayed.status, 200);
  assert.equal(relayed.headers.get("Content-Type"), XLSX_CONTENT_TYPE);
  assert.equal(relayed.headers.get("Content-Disposition"), 'attachment; filename="stores.xlsx"');
  assert.equal(relayed.headers.get("Content-Length"), "4");
  assert.equal(relayed.headers.get("Cache-Control"), "no-store");
  assert.equal(await relayed.text(), "xlsx");
});

test("엑셀 중계 — 압축 응답이면 Content-Length 를 넘기지 않는다(압축된 크기라 받은 크기와 맞지 않는다)", async () => {
  const relayed = await relayExcelResponse(new Response("xlsx", { status: 200, headers: { ...fileHeaders, "Content-Encoding": "gzip" } }), "점포 엑셀");
  assert.equal(relayed.headers.get("Content-Length"), null);
  assert.equal(relayed.headers.get("Content-Type"), XLSX_CONTENT_TYPE);
});

test("엑셀 중계 — 202 예약 접수는 상태와 본문을 그대로, 본문이 없으면 기본 안내", async () => {
  const body = { excelDownloadId: 41, rowCount: 12000, message: "1만 건 이상이라 파일을 만든 뒤 알려 드립니다." };
  const relayed = await relayExcelResponse(Response.json(body, { status: 202 }), "점포 엑셀");
  assert.equal(relayed.status, 202);
  assert.deepEqual(await relayed.json(), body);
  const empty = await relayExcelResponse(new Response("", { status: 202 }), "점포 엑셀");
  assert.deepEqual(await empty.json(), { message: EXCEL_SCHEDULED });
});

test("엑셀 중계 — 실패는 api 상태와 문구를, 문구가 없으면 공통 실패 문구", async () => {
  const conflict = await relayExcelResponse(Response.json({ statusCode: 409, message: "엑셀 파일을 만드는 중입니다" }, { status: 409 }), "점포 엑셀");
  assert.equal(conflict.status, 409);
  assert.deepEqual(await conflict.json(), { message: "엑셀 파일을 만드는 중입니다" });
  const original = console.error;
  console.error = () => {};
  try {
    const broken = await relayExcelResponse(new Response("<html>", { status: 502 }), "점포 엑셀");
    assert.equal(broken.status, 502);
    assert.deepEqual(await broken.json(), { message: EXCEL_FAILED });
  } finally {
    console.error = original;
  }
});

test("실패 문구 — 문자열 · 문장 배열(이어 붙임) · 없으면 기본값", () => {
  assert.equal(errorMessageOf({ message: "엑셀은 1분에 한 번" }, "기본"), "엑셀은 1분에 한 번");
  assert.equal(errorMessageOf({ message: ["statuses 형식", "storeTypes 형식"] }, "기본"), "statuses 형식, storeTypes 형식");
  assert.equal(errorMessageOf({ message: "  " }, "기본"), "기본");
  assert.equal(errorMessageOf(null, "기본"), "기본");
});

test("파일 이름 — UTF-8 한글 이름 · 따옴표 이름 · 없으면 기본값", () => {
  assert.equal(fileNameOfDisposition("attachment; filename*=UTF-8''%EC%A0%90%ED%8F%AC%EB%AA%A9%EB%A1%9D_20261014.xlsx", "x.xlsx"), "점포목록_20261014.xlsx");
  assert.equal(fileNameOfDisposition('attachment; filename="stores.xlsx"', "x.xlsx"), "stores.xlsx");
  assert.equal(fileNameOfDisposition("attachment; filename*=UTF-8''%E0%A4", "x.xlsx"), "x.xlsx");
  assert.equal(fileNameOfDisposition(null, "x.xlsx"), "x.xlsx");
});

test("받은 비율 — 전체 크기를 모르면 null, 100 을 넘지 않는다", () => {
  assert.equal(downloadPercent(62, 100), 62);
  assert.equal(downloadPercent(150, 100), 100);
  assert.equal(downloadPercent(10, 0), null);
  assert.equal(downloadPercent(10, Number.NaN), null);
});
