import { PortalLayout } from "@/components/portal-layout";

export default function TeacherLayout({ children }: LayoutProps<"/teacher">) {
  return <PortalLayout portal="teacher">{children}</PortalLayout>;
}
