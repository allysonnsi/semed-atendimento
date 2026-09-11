import { PageHeader } from "@/components/layout/PageHeader";
import { requireRole } from "@/lib/auth/session";
import { listProfiles, listSectors } from "@/lib/db/store";
import { UsersTable } from "@/features/users/components/UsersTable";

export default function UsuariosPage() {
  requireRole("admin");
  const users = listProfiles();
  const sectors = listSectors();
  return (
    <>
      <PageHeader title="Usuários" subtitle="Gerenciar usuários e permissões" />
      <div className="p-6">
        <UsersTable users={users} sectors={sectors} />
      </div>
    </>
  );
}
