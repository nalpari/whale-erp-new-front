// 점포 대표 이미지 고르기 검사 · 파일 선택 창의 accept · 실패 문구. 서버(api)가 내용으로 다시 판정하지만 고르는 순간 먼저 알린다.
// 허용 형식은 GET /enums/StoreImageFileType 의 값(JPG · PNG)을 받아 쓴다 — 받는 곳(stores.ts)에서 storeImageTypesOf 로 한 번 좁히고,
// 여기의 나머지 함수는 좁힌 목록만 받는다. 이 파일에는 형식별 MIME · 확장자만 둔다.
// node --test 가 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import { STORE_IMAGE_MAX_BYTES, type StoreImageFileType } from "./store-types.ts";

/** 형식별 MIME · 확장자. 이 둘은 표시 문구가 아니라 브라우저 파일 선택 창 규칙이라 코드에 둔다 */
const FORMAT: Record<StoreImageFileType, { mime: string; extensions: string[] }> = {
  JPG: { mime: "image/jpeg", extensions: [".jpg", ".jpeg"] },
  PNG: { mime: "image/png", extensions: [".png"] },
};

/** enum 조회 값에서 화면이 아는 형식만 남긴다(모르는 값 · prototype 키는 뺀다) */
export function storeImageTypesOf(values: readonly string[]): StoreImageFileType[] {
  return values.filter((v): v is StoreImageFileType => Object.hasOwn(FORMAT, v));
}

/** 파일 선택 창의 accept — "image/jpeg,.jpg,.jpeg,image/png,.png" */
export function storeImageAccept(types: readonly StoreImageFileType[]): string {
  return types.flatMap((t) => [FORMAT[t].mime, ...FORMAT[t].extensions]).join(",");
}

/** 안내 문구의 형식 — "JPG · PNG" */
export function storeImageTypesText(types: readonly StoreImageFileType[]): string {
  return types.join(" · ");
}

/** 고른 파일이 올릴 수 있는 것인지. 문제가 없으면 null */
export function storeImageFileError(file: { name: string; type: string; size: number }, types: readonly StoreImageFileType[]): string | null {
  const name = file.name.toLowerCase();
  const matches = types.some((t) => file.type === FORMAT[t].mime || FORMAT[t].extensions.some((e) => name.endsWith(e)));
  if (!matches) return `${storeImageTypesText(types)} 파일만 올릴 수 있습니다.`;
  if (file.size === 0) return "빈 파일입니다. 다른 파일을 골라 주세요.";
  if (file.size > STORE_IMAGE_MAX_BYTES) return `파일은 ${STORE_IMAGE_MAX_BYTES / 1024 / 1024}MB까지 올릴 수 있습니다.`;
  return null;
}

/**
 * 점포는 저장했는데 대표 이미지만 실패했을 때 상세에 띄울 문구. 등록 뒤 상세로 넘어가며 주소에 HTTP 상태(`?imageFailed=503`)나,
 * 결과를 모르면 `error` 를 싣는다 — api 문구를 주소에 담지 않으려고 상태별 고정 문구로 바꾼다.
 */
export function storeImageFailureText(status: string | string[] | undefined): string | null {
  if (typeof status !== "string" || !status) return null;
  if (status === "503") return "이미지 저장소를 지금 쓸 수 없어 대표 이미지를 저장하지 못했습니다. 잠시 뒤 수정에서 다시 올려 주세요.";
  if (status === "400") return "대표 이미지 파일을 받을 수 없었습니다(형식 · 크기). 수정에서 다른 파일로 올려 주세요.";
  if (status === "error") return "대표 이미지 저장 결과를 확인하지 못했습니다. 이 화면에 이미지가 없으면 수정에서 다시 올려 주세요.";
  return "대표 이미지를 저장하지 못했습니다. 수정에서 다시 올려 주세요.";
}
