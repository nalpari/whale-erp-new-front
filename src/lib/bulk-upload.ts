// 엑셀 일괄 등록 공통 — 자원마다 api 의 같은 네 경로(/{자원}/bulk-template · bulk-validations · bulk-error-file · bulk)를 쓴다.
// api 요청 문서: claude.ai 「일괄 등록 공통 API 요청 (시설물·장비 첫 적용)」(2026-11-12). 첫 적용은 시설물·장비(정책서 PL-7).
// 화면은 중계 경로 /api/bulk/{자원}/{동작}(src/app/api/bulk/...)을 부르고, 공통 팝업은 BulkUploadDialog(src/components/site)다.
// 다른 화면에 붙일 때는 BULK_RESOURCES 에 자원을 더하고 api 가 같은 네 경로를 열면 된다.
// next/* 를 import 하지 않는다 — 중계 경로 · 팝업 · node --test 가 함께 쓴다.
import type { components } from "./api-types.generated.ts";

/** 일괄 등록을 여는 자원 — 중계 경로가 이 목록 밖은 404 로 막는다(api 의 다른 경로로 새지 않게) */
export const BULK_RESOURCES = ["facilities"] as const;
export type BulkResource = (typeof BULK_RESOURCES)[number];
export const isBulkResource = (v: string): v is BulkResource => (BULK_RESOURCES as readonly string[]).includes(v);

/** 중계 경로의 동작 → api 경로 · 메서드 */
export const BULK_ACTIONS = {
  template: { method: "GET", path: "bulk-template" },
  validations: { method: "POST", path: "bulk-validations" },
  "error-file": { method: "POST", path: "bulk-error-file" },
  register: { method: "POST", path: "bulk" },
} as const;
export type BulkAction = keyof typeof BULK_ACTIONS;
export const isBulkAction = (v: string): v is BulkAction => Object.hasOwn(BULK_ACTIONS, v);

/** 미리보기(POST /{자원}/bulk-validations 200) — api 의 공통 응답(BulkPreviewResponseDto). 표의 열은 api 가 columns 로 정한다 — 자원마다 다르다 */
export type BulkPreview = components["schemas"]["BulkPreviewResponseDto"];

/** 올릴 수 있는 파일 — 양식으로 만든 .xlsx 하나. 내용(양식 · 줄 수)은 api 가 본다 */
export const BULK_ACCEPT = ".xlsx";
/** 화면에서 먼저 거르는 크기 — 500줄 양식은 1MB 안이라 넉넉히 5MB. 넘으면 api 에 보내지 않는다 */
export const BULK_MAX_BYTES = 5 * 1024 * 1024;
export const BULK_TEMPLATE_ONLY = "내려받은 양식으로 작성한 파일만 올릴 수 있습니다.";

/** 고른 파일의 까닭 — 맞으면 null. 문구는 정책서 PL-7 의 파일 검사 문구 */
export function bulkFileError(file: { name: string; size: number }): string | null {
  if (!/\.xlsx$/i.test(file.name) || file.size === 0) return BULK_TEMPLATE_ONLY;
  if (file.size > BULK_MAX_BYTES) return "파일이 너무 큽니다. 한 번에 500건까지 등록할 수 있으니 파일을 나눠 올려 주세요.";
  return null;
}

/** 미리보기 응답이 모양을 갖췄는가 — api 가 바뀌어 다른 모양이 오면 표를 그리지 않고 실패로 보인다 */
export function isBulkPreview(v: unknown): v is BulkPreview {
  const p = v as BulkPreview | null;
  return (
    !!p &&
    typeof p.totalCount === "number" &&
    typeof p.validCount === "number" &&
    typeof p.errorCount === "number" &&
    Array.isArray(p.columns) &&
    Array.isArray(p.rows) &&
    p.rows.every((r) => typeof r.rowNumber === "number" && typeof r.isValid === "boolean" && Array.isArray(r.errors))
  );
}

/** 오류 파일 이름 — 「올린파일이름_오류.xlsx」(api 가 Content-Disposition 을 주지 않을 때) */
export const errorFileNameOf = (fileName: string) => `${fileName.replace(/\.xlsx$/i, "")}_오류.xlsx`;

/** api 가 파일을 읽기 전에 「요청이 몰려 있습니다」로 돌려보낸 503 의 표식 — 저장하지 않았다(api facility-bulk-reader.ts BULK_BUSY_CODE) */
export const BULK_BUSY_CODE = "BULK_BUSY";
/**
 * 503 + BULK_BUSY 인가 — 이것만 「저장 안 됨」으로 확정한다. code 없는 503 은 앞단(게이트웨이 · 로드밸런서)이 저장 뒤에 냈을 수 있어
 * 다른 5xx 처럼 「결과 모름」으로 둔다(임시 비밀번호의 503 + code 와 같은 기준, find-failure.ts).
 */
export const isBulkBusy = (status: number, body: unknown) => status === 503 && (body as { code?: unknown } | null)?.code === BULK_BUSY_CODE;
