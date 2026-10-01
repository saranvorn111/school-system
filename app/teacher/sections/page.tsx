import type { Metadata } from "next";
import { TeacherSectionsView } from "./view";

export const metadata: Metadata = { title: "My classes" };

export default function Page() {
  return <TeacherSectionsView />;
}
