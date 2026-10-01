import { TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireUser } from "@/lib/auth/authz";
import { getT } from "@/lib/i18n/server";
import { me } from "@/lib/services/auth";
import { AppSidebar, type Portal } from "./app-sidebar";
import { PortalHeader } from "./portal-header";

/**
 * Server layout for every portal: only checks that someone is logged in and
 * draws the shell. Data is loaded by the page from /api, where permissions are enforced.
 */
export async function PortalLayout({ portal, children }: { portal: Portal; children: ReactNode }) {
  const user = await requireUser();
  const profile = me(user);
  const t = await getT();

  return (
    <SidebarProvider>
      <AppSidebar me={profile} portal={portal} />
      <SidebarInset className="min-w-0 bg-background">
        <PortalHeader me={profile} />
        <div className="w-full min-w-0 flex-1 px-4 py-6 md:px-6 lg:px-8">
          {profile.mustChangePassword && (
            <Alert className="mb-6 border-amber-500/40 bg-amber-500/5">
              <TriangleAlertIcon />
              <AlertDescription>
                <span>
                  {t("banner.tempPassword")}{" "}
                  <Link href="/account?changePassword=1" className="font-medium underline">
                    {t("banner.changeNow")}
                  </Link>
                </span>
              </AlertDescription>
            </Alert>
          )}
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
