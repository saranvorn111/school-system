import { PortalLayout } from "@/components/portal-layout";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <PortalLayout portal="admin">{children}</PortalLayout>;
}
