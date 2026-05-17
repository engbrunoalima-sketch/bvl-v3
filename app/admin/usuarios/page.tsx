import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/Header'
import { ApproveButtons } from './ApproveButtons'

export default async function AdminUsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: pendentes } = await supabase
    .from('profiles')
    .select('id, nome, email, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const { data: todos } = await supabase
    .from('profiles')
    .select('id, nome, email, role, status, created_at')
    .neq('status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header backHref="/admin" backLabel="Admin" title="Usuários" />

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* Pendentes */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Aguardando aprovação</h2>
            {pendentes && pendentes.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs rounded-full font-medium">
                {pendentes.length}
              </span>
            )}
          </div>

          {!pendentes?.length ? (
            <p className="text-zinc-400 text-sm">Nenhum cadastro pendente.</p>
          ) : (
            <div className="space-y-2">
              {pendentes.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">{u.nome}</p>
                    <p className="text-sm text-zinc-400">{u.email}</p>
                  </div>
                  <ApproveButtons userId={u.id} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Todos os usuários */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Usuários ativos</h2>
          <div className="space-y-2">
            {todos?.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">{u.nome}</p>
                  <p className="text-sm text-zinc-400">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded">{u.role}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    u.status === 'active'
                      ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-500/10 text-red-500 dark:text-red-400'
                  }`}>
                    {u.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
