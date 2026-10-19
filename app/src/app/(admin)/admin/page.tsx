import Link from "next/link";
import { CalendarCheck, Building2, MessageSquare, Mail, Stethoscope, Layers } from "lucide-react";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Counts everything the practice cares about, straight from the database. */
export default async function AdminOverviewPage() {
  const [newBookings, confirmedBookings, newTeamRequests, newMessages, subscribers, doctors, specialties, settings] =
    await Promise.all([
      prisma.booking.count({ where: { status: "NEW" } }),
      prisma.booking.count({ where: { status: "CONFIRMED" } }),
      prisma.teamRequest.count({ where: { status: "NEW" } }),
      prisma.contactMessage.count({ where: { status: "NEW" } }),
      prisma.newsletterSubscriber.count(),
      prisma.doctor.count({ where: { active: true } }),
      prisma.specialty.count({ where: { active: true } }),
      prisma.settings.findFirst({ select: { whatsappNumber: true, contactPhone: true } }),
    ]);

  const recentBookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      number: true,
      name: true,
      phone: true,
      status: true,
      createdAt: true,
      _count: { select: { uploads: true } },
    },
  });

  const cards = [
    { label: "New bookings", value: newBookings, icon: CalendarCheck, href: "/admin/bookings?status=NEW" },
    { label: "Confirmed bookings", value: confirmedBookings, icon: CalendarCheck, href: "/admin/bookings?status=CONFIRMED" },
    { label: "New team requests", value: newTeamRequests, icon: Building2, href: "/admin/team-requests?status=NEW" },
    { label: "New messages", value: newMessages, icon: MessageSquare, href: "/admin/messages" },
    { label: "Newsletter subscribers", value: subscribers, icon: Mail, href: "/admin/newsletter" },
    { label: "Active doctors", value: doctors, icon: Stethoscope, href: "/admin/doctors" },
    { label: "Active specialties", value: specialties, icon: Layers, href: "/admin/specialties" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted mt-1">
          {newBookings + newTeamRequests + newMessages > 0
            ? "There is work waiting in the queues below."
            : "Everything is caught up."}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white border border-line rounded-xl p-4 hover:border-teal transition-colors"
          >
            <card.icon className="w-5 h-5 text-teal mb-3" />
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="text-xs text-muted mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center justify-between">
          <h2 className="font-semibold text-sm">Recent bookings</h2>
          <Link href="/admin/bookings" className="text-xs text-teal hover:underline">
            View all
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody className="divide-y divide-line">
                {recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 text-sm">
                      <Link href="/admin/bookings" className="font-medium hover:text-teal">
                        {b.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">{b.phone}</td>
                    <td className="px-4 py-3 text-xs text-muted font-mono">{b.number}</td>
                    <td className="px-4 py-3">
                      {b._count.uploads > 0 && (
                        <span className="text-xs text-teal">{b._count.uploads} file(s)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          b.status === "NEW"
                            ? "bg-blue-100 text-blue-800"
                            : b.status === "CONFIRMED"
                              ? "bg-green-100 text-green-800"
                              : b.status === "DONE"
                                ? "bg-teal-15 text-teal-ink"
                                : "bg-red-100 text-red-700"
                        }`}
                      >
                        {b.status[0] + b.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted text-right whitespace-nowrap">
                      {new Date(b.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-muted mt-4">
        Contact phone on file: {settings?.contactPhone ?? "—"} · WhatsApp: {settings?.whatsappNumber ?? "—"}
      </p>
    </div>
  );
}
