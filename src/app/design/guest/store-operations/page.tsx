import type { Metadata } from "next";
import { StoreOperations } from "./store-operations";

export const metadata: Metadata = { title: "Whale ERP · 매장운영" };

export default function StoreOperationsPage() {
  return <StoreOperations />;
}
