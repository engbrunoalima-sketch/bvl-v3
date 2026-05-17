'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()
  const supabase = createClient()

  useEffect(() => setMounted(true), [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">Email enviado!</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
            Verifique sua caixa de entrada e clique no link para redefinir sua senha.
          </p>
          <a href="/login" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Voltar ao login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            {mounted ? (
              <Image
                src={resolvedTheme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
                alt="BVL System"
                width={140}
                height={44}
                style={{ height: 44, width: 'auto' }}
                priority
              />
            ) : <div style={{ height: 44 }} />}
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm dark:shadow-none">
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white text-center mb-1">
              Esqueceu a senha?
            </h1>
            <p className="text-sm text-zinc-400 text-center mb-6">
              Informe seu email e enviaremos um link de redefinição
            </p>

            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="seu@email.com"
                />
              </div>

              {error && (
                <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors mt-1"
              >
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>

            <p className="text-center text-sm text-zinc-400 mt-4">
              <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">Voltar ao login</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
