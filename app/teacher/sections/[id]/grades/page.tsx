import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GradesView } from "./view";

export const metadata: Metadata = { title: "Grades" };

export default async function Page({ params }: PageProps<"/teacher/sections/[id]/grades">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <GradesView id={id} />;
}
