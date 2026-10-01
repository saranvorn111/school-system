import type { Metadata } from "next";
import { SectionsView } from "./view";

export const metadata: Metadata = { title: "Sections & enrollment" };

export default function Page() {
  return <SectionsView />;
}
