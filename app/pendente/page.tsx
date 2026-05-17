import { ThemeToggle } from '@/components/ThemeToggle'

export default function PendentePage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-5">⏳</div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            Acesso pendente
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
            Seu cadastro está aguardando aprovação do administrador. Você receberá acesso em breve.
          </p>
          <a
            href="/login"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Voltar ao login
          </a>
        </div>
      </div>
    </div>
  )
}
