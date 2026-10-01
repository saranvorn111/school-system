import type { Metadata } from "next";
import { StudentAttendanceView } from "./view";

export const metadata: Metadata = { title: "My attendance" };

export default function Page() {
  return <StudentAttendanceView />;
}
