import type { Metadata } from "next";
import { AdminDashboardView } from "./view";

export const metadata: Metadata = { title: "Admin dashboard" };

export default function Page() {
  return <AdminDashboardView />;
}
