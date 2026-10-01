import type { Metadata } from "next";
import { GradeApprovalsView } from "./view";

export const metadata: Metadata = { title: "Grade approvals" };

export default function Page() {
  return <GradeApprovalsView />;
}
