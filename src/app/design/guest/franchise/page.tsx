import type { Metadata } from "next";
import { Franchise } from "./franchise";

export const metadata: Metadata = { title: "Whale ERP · 프랜차이즈" };

export default function FranchisePage() {
  return <Franchise />;
}
