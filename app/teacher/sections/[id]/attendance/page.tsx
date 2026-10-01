import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AttendanceView } from "./view";

export const metadata: Metadata = { title: "Attendance" };

export default async function Page({ params }: PageProps<"/teacher/sections/[id]/attendance">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <AttendanceView id={id} />;
}
