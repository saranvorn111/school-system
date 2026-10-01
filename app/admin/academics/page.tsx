import type { Metadata } from "next";
import { AcademicsView } from "./view";

export const metadata: Metadata = { title: "Years & terms" };

export default function Page() {
  return <AcademicsView />;
}
