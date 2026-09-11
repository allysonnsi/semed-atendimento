import { NextRequest, NextResponse } from "next/server";

// Middleware roda no Edge e só enxerga o cookie — a validação completa do
// usuário (perfil ativo, papel) acontece de novo no servidor via
// lib/auth/session.ts (requireUser/requireRole), que é a fonte da verdade.
// O middleware aqui é a primeira barreira, redirecionando cedo quem não
// tem sessão nenhuma, para uma navegação mais rápida.

const PUBLIC_PATHS = ["/login", "/painel"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const session = request.cookies.get("semed_session");
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
