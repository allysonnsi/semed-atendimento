import { listProfiles } from "@/lib/db/store";
import { loginAsDemo } from "@/features/auth/actions";
import { ROLE_LABEL } from "@/lib/constants";

export default function LoginPage() {
  const profiles = listProfiles();

  const order = ["u-admin", "u-recep", "u-att-rh", "u-att-ped", "u-gestor"];
  const sorted = [...profiles].sort(
    (a, b) => order.indexOf(a.id) - order.indexOf(b.id)
  );

  const descriptions: Record<string, string> = {
    admin: "Usuários, setores, relatórios e configurações",
    receptionist: "Registrar chegadas e gerar senhas",
    attendant: "Chamar e atender senhas do setor",
    manager: "Indicadores e acompanhamento geral",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-dark to-[#0C2A1C] p-5">
      <div className="bg-white rounded-2xl p-9 w-full max-w-[440px] shadow-2xl">

        <div className="flex flex-col items-center text-center mb-6">
  <img
    src="/logo-semed.png"
    alt="SEMED São José de Ribamar"
    className="w-[280px] h-auto object-contain mb-4"
  />

  <h2 className="text-[17px] font-extrabold">
    SEMED São José de Ribamar
  </h2>

  <p className="text-[12.5px] text-ink-muted mt-1">
    Controle de Ordem de Chegada e Atendimento
  </p>
</div>

        <div className="flex flex-col gap-2">
          {sorted.map((p) => (
            <form action={loginAsDemo.bind(null, p.id)} key={p.id}>
              <button
                type="submit"
                className="w-full flex items-center justify-between gap-3 border border-border rounded-lg px-3.5 py-3 text-left bg-white hover:border-primary hover:bg-primary-light transition"
              >
                <div>
                  <b className="block text-[13.5px]">
                    {ROLE_LABEL[p.role_key]}
                    {p.sector_id
                      ? ` — ${p.full_name.split(" ")[0]}`
                      : ""}
                  </b>

                  <span className="block text-[11.5px] text-ink-muted mt-0.5">
                    {descriptions[p.role_key]}
                  </span>
                </div>
              </button>
            </form>
          ))}
        </div>

        <div className="text-center mt-4">
          <a
            href="/painel"
            className="text-[12px] text-ink-muted hover:text-primary"
          >
            Abrir painel público (TV) →
          </a>
        </div>

        <p className="text-[10.5px] text-ink-muted text-center mt-5 leading-relaxed">
          Login de demonstração — sem senha. Em produção, autenticação real via
          Supabase Auth (ver{" "}
          <code>lib/supabase/server.ts</code>).
        </p>

      </div>
    </div>
  );
}