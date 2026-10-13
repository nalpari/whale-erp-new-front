import { Inter, Inter_Tight, REM } from "next/font/google";

// 비로그인 화면의 영문 표기 글꼴. 한글은 루트의 Pretendard 를 그대로 쓴다.
// 변수는 비로그인 화면 바깥 요소에만 달아, ERP 화면은 이 글꼴을 받지 않는다.
export const rem = REM({ subsets: ["latin"], weight: ["500", "800", "900"], variable: "--font-rem" });
export const interTight = Inter_Tight({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-inter-tight" });
export const inter = Inter({ subsets: ["latin"], weight: ["700"], variable: "--font-inter" });

export const GUEST_FONTS = `${rem.variable} ${interTight.variable} ${inter.variable}`;
