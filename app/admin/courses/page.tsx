import type { Metadata } from "next";
import { CoursesView } from "./view";

export const metadata: Metadata = { title: "Courses" };

export default function Page() {
  return <CoursesView />;
}
