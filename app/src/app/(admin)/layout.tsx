import type { Metadata } from "next";
import { headers } from "next/headers";
import { AuthProvider } from "@/components/providers/auth-provider";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { Toaster } from "sonner";

// Prevent all admin pages from being indexed
export const metadata: Metadata = {
  title: {
    default: "Admin | Dr. Mohsen Mamdouh",
    template: "%s | Dr. Mohsen Admin",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

// The dashboard is authenticated and reads live data on every request.
export const dynamic = "force-dynamic";

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The proxy can only tell that *a* session cookie exists, so this is where
  // the dashboard is actually gated: a database read, on every request, before
  // any admin page renders. The sign-in page is the one route that has to stay
  // reachable to someone who is not yet an admin.
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isLoginPage = pathname === "/admin/login";

  const user = isLoginPage ? await getCurrentUser() : await requireAdmin();

  return (
    <div dir="ltr" lang="en" className="min-h-screen bg-white text-ink antialiased">
      <AuthProvider user={user}>
        {children}
        <Toaster position="bottom-right" richColors />
      </AuthProvider>
    </div>
  );
}
