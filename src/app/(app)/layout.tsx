import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = getSession();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
