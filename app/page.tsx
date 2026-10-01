import { redirect } from "next/navigation";
import { homePathFor, requireUser } from "@/lib/auth/authz";

export default async function Home() {
  const user = await requireUser();
  redirect(homePathFor(user));
}
