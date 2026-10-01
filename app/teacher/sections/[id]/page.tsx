import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TeacherSectionView } from "./view";

export const metadata: Metadata = { title: "Class" };

export default async function Page({ params }: PageProps<"/teacher/sections/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <TeacherSectionView id={id} />;
}
