import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Header } from '@/components/Header'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProjetoPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projeto } = await supabase
    .from('projetos_v3')
    .select('id, nome, descricao, icone, modulos(id, nome, icone, descricao, custo_tokens, ia_features)')
    .eq('id', id)
    .eq('ativo', true)
    .single()

  if (!projeto) notFound()

  const { data: tokens } = await supabase
    .from('tokens_usuarios')
    .select('saldo, licenca_pro, plano')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header
        saldo={tokens?.saldo ?? 0}
        plano={tokens?.plano ?? 'free'}
        backHref="/dashboard"
        backLabel="Dashboard"
        title={`${projeto.icone} ${projeto.nome}`}
      />

      <main className="max-w-4xl mx-auto px-6 py-10">
        {projeto.descricao && (
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">{projeto.descricao}</p>
        )}

        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Selecione o relatório
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(projeto.modulos as any[])?.map(modulo => {
            const semCredito = !tokens?.licenca_pro && (tokens?.saldo ?? 0) < modulo.custo_tokens
            return (
              <a
                key={modulo.id}
                href={semCredito ? '/comprar' : `/modulo/${modulo.id}`}
                className={`group p-5 rounded-xl border transition-colors ${
                  semCredito
                    ? 'border-zinc-200 dark:border-zinc-800 opacity-60 bg-white dark:bg-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-500 dark:hover:border-blue-500'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{modulo.icone}</span>
                  <h3 className="font-medium text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {modulo.nome}
                  </h3>
                </div>
                {modulo.descricao && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{modulo.descricao}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {semCredito
                      ? `Créditos insuficientes — comprar`
                      : modulo.custo_tokens > 0 ? `${modulo.custo_tokens} créditos` : 'Grátis'}
                  </span>
                  {modulo.ia_features?.length > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">IA</span>
                  )}
                </div>
              </a>
            )
          })}
        </div>
      </main>
    </div>
  )
}
