import type { Metadata } from "next";
import { OrganizationView } from "./view";

export const metadata: Metadata = { title: "Departments & programs" };

export default function Page() {
  return <OrganizationView />;
}
