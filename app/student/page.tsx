import type { Metadata } from "next";
import { StudentDashboardView } from "./view";

export const metadata: Metadata = { title: "Student dashboard" };

export default function Page() {
  return <StudentDashboardView />;
}
