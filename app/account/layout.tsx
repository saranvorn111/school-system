import { PortalLayout } from "@/components/portal-layout";
import { requireUser } from "@/lib/auth/authz";

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await requireUser();
  const portal = user.roles.includes("ADMIN") ? "admin" : user.roles.includes("TEACHER") ? "teacher" : "student";
  return <PortalLayout portal={portal}>{children}</PortalLayout>;
}
