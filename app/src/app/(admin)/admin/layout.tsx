"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarCheck,
  Building2,
  Stethoscope,
  Layers,
  Settings,
  Menu,
  X,
  LogOut,
  MessageSquare,
  Mail,
  FileText,
  ImageIcon,
  HelpCircle,
  UserCircle,
} from "lucide-react";

const navigation: {
  label?: string;
  items: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
}[] = [
  {
    items: [{ name: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Clinical",
    items: [
      { name: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
      { name: "Team Requests", href: "/admin/team-requests", icon: Building2 },
      { name: "Doctors", href: "/admin/doctors", icon: Stethoscope },
      { name: "Specialties", href: "/admin/specialties", icon: Layers },
      { name: "FAQs", href: "/admin/faqs", icon: HelpCircle },
    ],
  },
  {
    label: "Content",
    items: [
      { name: "Media Library", href: "/admin/media", icon: ImageIcon },
      { name: "Blog", href: "/admin/blog/posts", icon: FileText },
      { name: "Messages", href: "/admin/messages", icon: MessageSquare },
      { name: "Newsletter", href: "/admin/newsletter", icon: Mail },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Settings", href: "/admin/settings", icon: Settings },
      { name: "Profile", href: "/admin/profile", icon: UserCircle },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const user = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Skip layout for login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-blue-ink text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="/brand/logo-white.png"
              alt="Dr. Mohsen Mamdouh"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
            <span className="text-sm text-white/60">Admin</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 scrollbar-dark">
          {navigation.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-6" : ""}>
              {group.label && (
                <p className="px-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname?.startsWith(item.href));

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm transition-colors rounded-lg",
                        isActive
                          ? "bg-teal font-semibold text-white"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="flex-shrink-0 p-4 border-t border-white/10 space-y-1">
          <Link
            href="/admin/profile"
            className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <UserCircle className="w-5 h-5" />
            <span className="truncate">{user?.name ?? user?.email ?? "Account"}</span>
          </Link>
          <button
            onClick={async () => {
              await signOut("/admin/login");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 h-16 bg-blue-ink text-white flex items-center justify-between px-4">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu className="w-6 h-6" />
          </button>
          <Image src="/brand/logo-white.png" alt="Dr. Mohsen Mamdouh" width={100} height={32} className="h-7 w-auto" />
          <div className="w-6" />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
