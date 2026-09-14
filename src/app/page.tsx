import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";


const HOME_BY_ROLE: Record<string, string> = {
  admin: "/dashboard",
  manager: "/dashboard",
  receptionist: "/recepcao/novo-atendimento",
  attendant: "/atendimento",
};

export default async function RootPage() {
  const user = await getSession();
  redirect(user ? HOME_BY_ROLE[user.role_key] ?? "/dashboard" : "/login");
}
