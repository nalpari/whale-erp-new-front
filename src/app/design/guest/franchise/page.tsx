import type { Metadata } from "next";
import { SAMPLE_ROUTES } from "../guest-routes";
import { Franchise } from "./franchise";

export const metadata: Metadata = { title: "Whale ERP · 프랜차이즈" };

export default function FranchisePage() {
  return <Franchise routes={SAMPLE_ROUTES} />;
}
