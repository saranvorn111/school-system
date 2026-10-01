import { PortalLayout } from "@/components/portal-layout";

export default function StudentLayout({ children }: LayoutProps<"/student">) {
  return <PortalLayout portal="student">{children}</PortalLayout>;
}
