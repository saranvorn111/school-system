import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionDetailView } from "./view";

export const metadata: Metadata = { title: "Section" };

export default async function Page({ params }: PageProps<"/admin/sections/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <SectionDetailView id={id} />;
}
