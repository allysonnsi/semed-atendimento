import { PageHeader } from "@/components/layout/PageHeader";
import { requireRole } from "@/lib/auth/session";
import { listSectors } from "@/lib/db/store";
import { SectorsTable } from "@/features/sectors/components/SectorsTable";

export default async function SetoresPage() {
  await requireRole("admin");

  const sectors = listSectors();

  return (
    <>
      <PageHeader
        title="Setores"
        subtitle="Gerenciar setores de atendimento"
      />

      <div className="p-6">
        <SectorsTable sectors={sectors} />
      </div>
    </>
  );
}