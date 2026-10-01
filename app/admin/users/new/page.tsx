import type { Metadata } from "next";
import { NewUserView } from "./view";

export const metadata: Metadata = { title: "New user" };

export default function Page() {
  return <NewUserView />;
}
