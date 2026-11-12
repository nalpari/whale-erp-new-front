import type { Metadata } from "next";
import { SAMPLE_ROUTES } from "../guest-routes";
import { AddOnServices } from "./add-on-services";

export const metadata: Metadata = { title: "Whale ERP · 부가서비스" };

export default function AddOnServicesPage() {
  return <AddOnServices routes={SAMPLE_ROUTES} />;
}
