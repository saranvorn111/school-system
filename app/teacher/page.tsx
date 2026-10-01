import type { Metadata } from "next";
import { TeacherDashboardView } from "./view";

export const metadata: Metadata = { title: "Teacher dashboard" };

export default function Page() {
  return <TeacherDashboardView />;
}
