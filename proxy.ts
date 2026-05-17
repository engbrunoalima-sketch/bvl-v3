import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password', '/pendente', '/auth']
// Sempre públicos: magic link callback, reset de senha, pendente
const ALWAYS_PUBLIC = ['/reset-password', '/pendente', '/auth/callback']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isAlwaysPublic = ALWAYS_PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/'))

  // Não autenticado → login
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Rotas sempre públicas (reset-password, pendente) — não redireciona
  if (isAlwaysPublic) {
    return supabaseResponse
  }

  // Autenticado em rota pública (login, signup, forgot) → sempre vai para dashboard
  // Aprovados veem tudo, pendentes veem banner de aguardando aprovação
  if (user && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Autenticado em rota protegida → verifica aprovação
  if (user && !isPublic) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status, role')
      .eq('id', user.id)
      .single()

    const isAprovado = profile?.status === 'aprovado'

    // Pendente ou sem perfil: bloqueia /projeto/* e /modulo/*; permite o resto (ex: /dashboard)
    if (!isAprovado) {
      const bloqueadoParaPendente = ['/projeto', '/modulo', '/ferramentas', '/admin']
      if (bloqueadoParaPendente.some(p => pathname.startsWith(p))) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return supabaseResponse
    }

    // Rotas /admin/* → apenas admin
    if (pathname.startsWith('/admin') && profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
