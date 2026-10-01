import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UserDetailView } from "./view";

export const metadata: Metadata = { title: "User" };

export default async function Page({ params }: PageProps<"/admin/users/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <UserDetailView id={id} />;
}
