import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/page";
import { UsersView } from "./view";

export const metadata: Metadata = { title: "Users" };

// UsersView reads the URL's search params, which needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <UsersView />
    </Suspense>
  );
}
