import type { Metadata } from "next";
import { StudentGradesView } from "./view";

export const metadata: Metadata = { title: "My grades" };

export default function Page() {
  return <StudentGradesView />;
}
