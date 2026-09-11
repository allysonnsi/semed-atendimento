"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/features/auth/actions";
import { ROLE_LABEL } from "@/lib/constants";
import type { Profile, RoleKey } from "@/types/database";
import {
  LayoutDashboard, UserPlus, Users2, Building2, History,
  BarChart3, Settings, Tv, LogOut, Bell,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: RoleKey[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager"] },
  { href: "/recepcao/novo-atendimento", label: "Novo atendimento", icon: UserPlus, roles: ["admin", "receptionist"] },
  { href: "/recepcao/filas", label: "Filas (recepção)", icon: Users2, roles: ["admin", "receptionist", "manager"] },
  { href: "/atendimento", label: "Meu atendimento", icon: Bell, roles: ["attendant"] },
  { href: "/historico", label: "Histórico", icon: History, roles: ["admin", "manager", "receptionist"] },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3, roles: ["admin", "manager"] },
  { href: "/setores", label: "Setores", icon: Building2, roles: ["admin"] },
  { href: "/usuarios", label: "Usuários", icon: Users2, roles: ["admin"] },
  { href: "/configuracoes", label: "Configurações", icon: Settings, roles: ["admin"] },
];

export function Sidebar({ user }: { user: Profile }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => i.roles.includes(user.role_key));
  const initials = user.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("");

  return (
    <aside className="w-[232px] shrink-0 bg-primary-dark text-white flex flex-col p-3.5">
      <div className="flex items-center gap-2.5 px-2 pb-5">
        <div className="w-9 h-9 rounded-lg bg-white text-primary-dark flex items-center justify-center font-extrabold text-sm">
          SJR
        </div>
        <div className="leading-tight">
          <b className="block text-sm">SEMED</b>
          <span className="block text-[11px] text-[#BFE0CD]">São José de Ribamar</span>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-[13.5px] font-medium transition ${
                active ? "bg-white text-primary-dark" : "text-[#D7ECE0] hover:bg-white/10"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
        <div className="text-[10.5px] uppercase tracking-wide text-[#7FAF97] px-2.5 pt-3.5 pb-1">Painel</div>
        <Link href="/painel" target="_blank" className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-[13.5px] font-medium text-[#D7ECE0] hover:bg-white/10">
          <Tv size={16} /> Painel público (TV)
        </Link>
      </nav>

      <div className="pt-3 border-t border-white/10 mt-2">
        <div className="flex items-center gap-2.5 p-2 rounded-lg">
          <div className="w-[30px] h-[30px] rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs shrink-0">
            {initials}
          </div>
          <div className="leading-tight flex-1 min-w-0">
            <b className="block text-[12.5px] font-semibold truncate">{user.full_name}</b>
            <span className="text-[11px] text-[#9FCBB1]">{ROLE_LABEL[user.role_key]}</span>
          </div>
        </div>
        <form action={logout}>
          <button type="submit" className="flex items-center gap-1.5 text-[12px] text-[#9FCBB1] hover:text-white px-2 py-1.5 rounded-md mt-1 w-full text-left">
            <LogOut size={13} /> Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
