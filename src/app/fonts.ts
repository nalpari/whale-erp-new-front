import localFont from "next/font/local";

// Figma 가 쓰는 Pretendard. 굵기는 ERP 화면의 네 가지(400·500·600·800)에 비로그인 화면이 쓰는 700 을 더했다.
// CDN 대신 저장소에 넣어 두어 사내망에서 막히거나 CDN 이 죽어도 글꼴이 바뀌지 않는다.
// 변수는 html 에 단다. globals.css 의 --font-erp 가 :root 에서 이 변수를 읽으므로 더 아래에서 달면 값이 비어 버린다.
export const pretendard = localFont({
  src: [
    { path: "./fonts/Pretendard-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Pretendard-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Pretendard-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Pretendard-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/Pretendard-ExtraBold.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-pretendard",
  display: "swap",
  // 굵기마다 800KB 라 preload 하면 ERP 를 쓰지 않는 화면(로그인 등)까지 3MB 를 먼저 받는다.
  // 끄면 화면에 실제로 쓰인 굵기만 받는다. 더 줄이려면 Pretendard 부분집합(subset) 파일로 바꾼다.
  preload: false,
});
