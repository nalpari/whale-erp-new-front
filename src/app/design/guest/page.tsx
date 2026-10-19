import type { Metadata } from "next";
import { GuestHome } from "./guest-home";
import { SAMPLE_ROUTES } from "./guest-routes";

export const metadata: Metadata = { title: "Whale ERP · 비로그인 메인" };

export default function GuestMainPage() {
  return <GuestHome routes={SAMPLE_ROUTES} />;
}
