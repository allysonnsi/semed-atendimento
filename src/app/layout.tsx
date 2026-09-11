import type { Metadata } from "next";
import "./globals.css";

// Nota: as fontes são carregadas via <link> (Google Fonts CDN) em vez de
// `next/font/google`, porque o ambiente de build usado para gerar este
// pacote não tem acesso à rede externa durante `next build`. Em um ambiente
// normal (Vercel, sua máquina, CI com internet liberada), sinta-se à vontade
// para trocar por `next/font/google` — é só uma questão de performance de
// carregamento, o visual não muda.
export const metadata: Metadata = {
  title: "SEMED São José de Ribamar — Atendimento",
  description: "Controle de Ordem de Chegada e Atendimento",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
