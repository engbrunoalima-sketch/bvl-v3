import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    const msg = encodeURIComponent(errorDescription ?? error)
    return NextResponse.redirect(`${origin}/login?error=${msg}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=link_invalido`)
  }

  const supabase = await createClient()
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=login_expirado`)
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', data.user.id)
    .single()

  if (!existing) {
    const meta = data.user.user_metadata ?? {}
    const nome =
      meta.full_name ??
      meta.name ??
      meta.nome ??
      data.user.email?.split('@')[0] ??
      'Usuário'

    await supabase.from('profiles').insert({
      id: data.user.id,
      email: data.user.email!,
      nome,
      avatar_url: meta.avatar_url ?? meta.picture ?? null,
    })
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
