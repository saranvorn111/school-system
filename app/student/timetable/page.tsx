import type { Metadata } from "next";
import { TimetableView } from "./view";

export const metadata: Metadata = { title: "My timetable" };

export default function Page() {
  return <TimetableView />;
}
