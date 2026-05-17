import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Header } from '@/components/Header'
import type { Modulo } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ModuloPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: modulo } = await supabase
    .from('modulos')
    .select('*, projetos_v3(id, nome)')
    .eq('id', id)
    .eq('ativo', true)
    .single()

  if (!modulo) notFound()

  const { data: tokens } = await supabase
    .from('tokens_usuarios')
    .select('saldo, licenca_pro, plano')
    .eq('user_id', user.id)
    .single()

  const m = modulo as Modulo & { projetos_v3: { id: string; nome: string } | null }
  const semCredito = !tokens?.licenca_pro && (tokens?.saldo ?? 0) < m.custo_tokens
  const backHref = m.projetos_v3 ? `/projeto/${m.projetos_v3.id}` : '/dashboard'
  const backLabel = m.projetos_v3 ? m.projetos_v3.nome : 'Dashboard'

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header
        saldo={tokens?.saldo ?? 0}
        plano={tokens?.plano ?? 'free'}
        backHref={backHref}
        backLabel={backLabel}
        title={m.nome}
      />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-start gap-4 mb-8">
          <span className="text-5xl">{m.icone}</span>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{m.nome}</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">{m.descricao}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-zinc-400">
                {m.custo_tokens > 0 ? `Custo: ${m.custo_tokens} créditos` : 'Grátis'}
              </span>
              {m.ia_features?.length > 0 && (
                <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">
                  IA ativo
                </span>
              )}
            </div>
          </div>
        </div>

        {semCredito && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-sm">
            Créditos insuficientes. Saldo: {tokens?.saldo ?? 0} / Necessário: {m.custo_tokens}
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <p className="text-zinc-400 text-sm text-center py-8">
            Formulário <strong className="text-zinc-700 dark:text-zinc-300">{m.nome}</strong> em construção.
            <br />
            <span className="text-xs mt-2 block">Os campos dinâmicos serão carregados aqui.</span>
          </p>
        </div>
      </main>
    </div>
  )
}
