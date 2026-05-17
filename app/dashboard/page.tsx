import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/Header'

const ACCENT_COLORS = [
  { border: 'rgba(59,130,246,0.25)',  borderHover: 'rgba(59,130,246,0.5)',  shadow: 'rgba(59,130,246,0.15)',  icon: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', name: '#93c5fd' },
  { border: 'rgba(34,197,94,0.25)',   borderHover: 'rgba(34,197,94,0.5)',   shadow: 'rgba(34,197,94,0.15)',   icon: 'linear-gradient(135deg,#16a34a,#15803d)', name: '#86efac' },
  { border: 'rgba(251,146,60,0.25)',  borderHover: 'rgba(251,146,60,0.5)',  shadow: 'rgba(251,146,60,0.15)',  icon: 'linear-gradient(135deg,#ea580c,#c2410c)', name: '#fdba74' },
  { border: 'rgba(168,85,247,0.25)',  borderHover: 'rgba(168,85,247,0.5)',  shadow: 'rgba(168,85,247,0.15)',  icon: 'linear-gradient(135deg,#9333ea,#7c3aed)', name: '#d8b4fe' },
  { border: 'rgba(20,184,166,0.25)',  borderHover: 'rgba(20,184,166,0.5)',  shadow: 'rgba(20,184,166,0.15)',  icon: 'linear-gradient(135deg,#0d9488,#0f766e)', name: '#5eead4' },
  { border: 'rgba(244,63,94,0.25)',   borderHover: 'rgba(244,63,94,0.5)',   shadow: 'rgba(244,63,94,0.15)',   icon: 'linear-gradient(135deg,#e11d48,#be123c)', name: '#fda4af' },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, status')
    .eq('id', user.id)
    .single()

  const isPendente = !profile || profile.status !== 'aprovado'

  const { data: projetos } = await supabase
    .from('projetos_v3')
    .select('id, nome, descricao, icone, plano_minimo, modulos(id)')
    .eq('ativo', true)
    .order('nome')

  let { data: tokens } = await supabase
    .from('tokens_usuarios')
    .select('saldo, plano, licenca_pro')
    .eq('user_id', user.id)
    .single()

  if (!tokens) {
    const { data: novo } = await supabase
      .from('tokens_usuarios')
      .insert({ user_id: user.id, saldo: 0, plano: 'free', licenca_pro: false })
      .select('saldo, plano, licenca_pro')
      .single()
    tokens = novo
  }

  const nome = profile?.nome ?? user.email?.split('@')[0] ?? 'Usuário'

  return (
    <div className="min-h-screen" style={{
      background: 'radial-gradient(ellipse 90% 50% at 50% -10%, rgba(59,130,246,0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 30% at 85% 85%, rgba(34,197,94,0.05) 0%, transparent 50%), #09090b'
    }}>
      <Header saldo={tokens?.saldo ?? 0} plano={tokens?.plano ?? 'free'} nome={nome} />

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 60px' }}>

        {/* Saudação */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 30, padding: '5px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#93c5fd', marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, background: '#22c55e', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            BVL System V3
          </div>
          <p style={{ fontSize: 14, color: '#71717a', marginTop: 4 }}>
            Olá, <span style={{ color: '#e4e4e7', fontWeight: 600 }}>{nome}</span> — selecione um módulo para começar.
          </p>
        </div>

        {/* Banner pendente */}
        {isPendente && (
          <div style={{ marginBottom: 28, padding: '14px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 20, marginTop: 1 }}>⏳</span>
            <div>
              <p style={{ fontWeight: 700, color: '#fcd34d', fontSize: 13, margin: 0 }}>Conta aguardando aprovação</p>
              <p style={{ color: '#a16207', fontSize: 12, marginTop: 4, margin: 0 }}>
                Seu cadastro está sendo analisado pelo administrador. Você terá acesso às ferramentas em breve.
              </p>
            </div>
          </div>
        )}

        {/* Label */}
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#52525b', marginBottom: 16 }}>
          Módulos disponíveis
        </p>

        {/* Grid de cards */}
        {(!projetos || projetos.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#52525b', fontSize: 13 }}>
            Nenhum módulo disponível. Contate o administrador.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {projetos.map((projeto: any, i: number) => {
              const ac = ACCENT_COLORS[i % ACCENT_COLORS.length]
              const temModulos = projeto.modulos?.length > 0
              const clicavel = !isPendente && temModulos

              const card = (
                <div style={{
                  background: '#18181b',
                  border: `1px solid ${ac.border}`,
                  borderRadius: 18,
                  padding: '26px 18px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 13,
                  position: 'relative', overflow: 'hidden',
                  opacity: clicavel ? 1 : 0.55,
                  cursor: clicavel ? 'pointer' : 'default',
                  transition: 'transform .22s ease, box-shadow .22s ease, border-color .22s ease',
                }}>
                  {/* Ícone */}
                  <div style={{
                    width: 58, height: 58, borderRadius: 16,
                    background: ac.icon,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, flexShrink: 0
                  }}>
                    {projeto.icone}
                  </div>

                  {/* Nome */}
                  <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.3px', textAlign: 'center', color: clicavel ? ac.name : '#52525b', margin: 0 }}>
                    {projeto.nome}
                  </p>

                  {projeto.descricao && (
                    <p style={{ fontSize: 11, color: '#71717a', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
                      {projeto.descricao}
                    </p>
                  )}

                  {/* Badge */}
                  <div style={{ marginTop: 4, fontSize: 9, fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase' as const }}>
                    {isPendente ? (
                      <span style={{ color: '#52525b' }}>🔒 Acesso pendente</span>
                    ) : !temModulos ? (
                      <span style={{ background: 'rgba(100,116,139,.15)', color: '#94a3b8', border: '1px solid rgba(100,116,139,.3)', padding: '2px 8px', borderRadius: 20 }}>Em breve</span>
                    ) : projeto.plano_minimo !== 'free' ? (
                      <span style={{ background: 'rgba(59,130,246,.1)', color: '#93c5fd', border: '1px solid rgba(59,130,246,.3)', padding: '2px 8px', borderRadius: 20 }}>Plano {projeto.plano_minimo}</span>
                    ) : (
                      <span style={{ background: 'rgba(59,130,246,.1)', color: '#93c5fd', border: '1px solid rgba(59,130,246,.3)', padding: '2px 8px', borderRadius: 20 }}>Disponível</span>
                    )}
                  </div>
                </div>
              )

              return clicavel ? (
                <a key={projeto.id} href={`/projeto/${projeto.id}`}
                  style={{ textDecoration: 'none' }}
                  onMouseEnter={e => {
                    const el = e.currentTarget.firstChild as HTMLElement
                    if (el) { el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 10px 40px ${ac.shadow}`; el.style.borderColor = ac.borderHover }
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget.firstChild as HTMLElement
                    if (el) { el.style.transform = ''; el.style.boxShadow = ''; el.style.borderColor = ac.border }
                  }}>
                  {card}
                </a>
              ) : (
                <div key={projeto.id}>{card}</div>
              )
            })}
          </div>
        )}

        {/* Ferramentas IA */}
        <div style={{ marginTop: 40 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#52525b', marginBottom: 16 }}>
            Ferramentas IA
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {[
              { href: '/ferramentas/dxf', icone: '📐', nome: 'Planta para DXF', desc: 'Converte foto de planta em arquivo DXF editável', cor: ACCENT_COLORS[0] },
            ].map(f => (
              <a key={f.href} href={f.href} style={{ textDecoration: 'none' }}
                onMouseEnter={e => {
                  const el = e.currentTarget.firstChild as HTMLElement
                  if (el) { el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 10px 40px ${f.cor.shadow}`; el.style.borderColor = f.cor.borderHover }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget.firstChild as HTMLElement
                  if (el) { el.style.transform = ''; el.style.boxShadow = ''; el.style.borderColor = f.cor.border }
                }}>
                <div style={{
                  background: '#18181b', border: `1px solid ${f.cor.border}`, borderRadius: 18,
                  padding: '26px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 13,
                  cursor: 'pointer', transition: 'transform .22s ease, box-shadow .22s ease, border-color .22s ease'
                }}>
                  <div style={{ width: 58, height: 58, borderRadius: 16, background: f.cor.icon, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                    {f.icone}
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.3px', textAlign: 'center', color: f.cor.name, margin: 0 }}>{f.nome}</p>
                  <p style={{ fontSize: 11, color: '#71717a', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase' as const, background: 'rgba(59,130,246,.1)', color: '#93c5fd', border: '1px solid rgba(59,130,246,.3)', padding: '2px 8px', borderRadius: 20 }}>
                    10 créditos
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>

      </main>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
      `}</style>
    </div>
  )
}
