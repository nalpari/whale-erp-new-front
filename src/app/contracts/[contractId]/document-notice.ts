// 계약서 파일 내려받기가 실패해 상세 화면으로 돌아왔을 때(?document=) 띄우는 안내. 쿼리에는 정해진 이름만 싣고 문장은 여기서 고른다.
export const DOCUMENT_NOTICES = {
  missing: "파일을 찾을 수 없습니다.",
  unavailable: "파일 저장소에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
  failed: "파일을 받지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
} as const;

export type DocumentNotice = keyof typeof DOCUMENT_NOTICES;

export const documentNoticeOf = (raw: unknown): string | null =>
  typeof raw === "string" && Object.hasOwn(DOCUMENT_NOTICES, raw) ? DOCUMENT_NOTICES[raw as DocumentNotice] : null;
