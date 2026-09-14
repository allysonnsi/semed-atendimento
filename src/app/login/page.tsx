import { login } from "@/features/auth/actions";

type LoginPageProps = {
  searchParams: {
    error?: string;
  };
};

export default function LoginPage({
  searchParams,
}: LoginPageProps) {
  const error = searchParams.error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-dark to-[#0C2A1C] p-5">
      <div className="bg-white rounded-2xl p-9 w-full max-w-[440px] shadow-2xl">

        {/* LOGO */}
        <div className="flex flex-col items-center text-center mb-8">
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

        {/* TÍTULO */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-ink">
            Entrar no sistema
          </h1>

          <p className="text-sm text-ink-muted mt-1">
            Informe suas credenciais para acessar o sistema.
          </p>
        </div>

        {/* ERRO */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              {decodeURIComponent(error)}
            </p>
          </div>
        )}

        {/* FORMULÁRIO */}
        <form action={login} className="flex flex-col gap-4">

          {/* E-MAIL */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold mb-1.5"
            >
              E-mail
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              required
              className="w-full border border-border rounded-lg px-3.5 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
            />
          </div>

          {/* SENHA */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold mb-1.5"
            >
              Senha
            </label>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
              className="w-full border border-border rounded-lg px-3.5 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
            />
          </div>

          {/* BOTÃO */}
          <button
            type="submit"
            className="w-full bg-primary text-white rounded-lg px-4 py-3 font-semibold text-sm hover:opacity-90 transition mt-2"
          >
            Entrar no sistema
          </button>
        </form>

        {/* PAINEL PÚBLICO */}
        <div className="text-center mt-5">
          <a
            href="/painel"
            className="text-[12px] text-ink-muted hover:text-primary"
          >
            Abrir painel público (TV) →
          </a>
        </div>

        <p className="text-[10.5px] text-ink-muted text-center mt-5 leading-relaxed">
          Acesso protegido por autenticação do Supabase.
        </p>

      </div>
    </div>
  );
}