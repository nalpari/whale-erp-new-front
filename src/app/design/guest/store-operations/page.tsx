import type { Metadata } from "next";
import { SAMPLE_ROUTES } from "../guest-routes";
import { StoreOperations } from "./store-operations";

export const metadata: Metadata = { title: "Whale ERP · 매장운영" };

export default function StoreOperationsPage() {
  return <StoreOperations routes={SAMPLE_ROUTES} />;
}
