"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PageHeader, QueryView } from "@/components/page";
import { GradeStatusBadge } from "@/components/status-badges";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApiQuery } from "@/hooks/use-api";
import type { ApiData } from "@/lib/api/client";
import { formatSchedule } from "@/lib/format";
import type { getSection } from "@/lib/services/sections";

export type SectionData = ApiData<typeof getSection>;

/** Header + Students / Attendance / Grades tabs shared by the three class pages. */
export function SectionShell({ id, children }: { id: number; children: (data: SectionData) => ReactNode }) {
  const query = useApiQuery<SectionData>(`/api/sections/${id}`);
  const pathname = usePathname();
  const base = `/teacher/sections/${id}`;
  const tab = pathname.endsWith("/attendance") ? "attendance" : pathname.endsWith("/grades") ? "grades" : "students";

  return (
    <QueryView query={query}>
      {(data) => (
        <>
          <PageHeader
            title={`${data.section.courseCode}-${data.section.sectionCode} · ${data.section.courseTitle}`}
            back={{ href: "/teacher/sections", label: "My classes" }}
            description={
              <span className="flex flex-wrap items-center gap-2">
                {data.section.yearName} {data.section.termName} · {formatSchedule(data.section)} · Room {data.section.room ?? "—"}
                <GradeStatusBadge status={data.section.gradeStatus} />
              </span>
            }
          />
          <Tabs value={tab} className="mb-6">
            <TabsList>
              <TabsTrigger value="students" asChild>
                <Link href={base}>Students</Link>
              </TabsTrigger>
              <TabsTrigger value="attendance" asChild>
                <Link href={`${base}/attendance`}>Attendance</Link>
              </TabsTrigger>
              <TabsTrigger value="grades" asChild>
                <Link href={`${base}/grades`}>Grades</Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {children(data)}
        </>
      )}
    </QueryView>
  );
}
