import { requireUser } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}