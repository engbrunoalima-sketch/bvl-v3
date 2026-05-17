'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { ThemeToggle } from '@/components/ThemeToggle'

function mapError(message: string): string {
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Muitas tentativas. Aguarde alguns minutos.'
  }
  if (message.includes('already registered')) {
    return 'Email já cadastrado. Use o login.'
  }
  return message
}

export default function SignupPage() {
  const [step, setStep] = useState<'form' | 'sent'>('form')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()
  const supabase = createClient()

  useEffect(() => setMounted(true), [])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { nome }, // stored in user_metadata — used by /auth/callback to create profile
      },
    })

    setLoading(false)

    if (error) {
      setError(mapError(error.message))
      return
    }

    setStep('sent')
  }

  async function handleResend() {
    setLoading(true)
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { nome },
      },
    })
    setLoading(false)
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

            {step === 'form' && (
              <>
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-white text-center mb-1">
                  Criar conta
                </h1>
                <p className="text-sm text-zinc-400 text-center mb-6">
                  Enviaremos um link para confirmar seu email
                </p>

                <form onSubmit={handleSend} className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      required
                      autoFocus
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Seu nome"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
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
                    {loading ? 'Enviando...' : 'Enviar link de confirmação'}
                  </button>
                </form>

                <p className="text-center text-sm text-zinc-400 mt-4">
                  Já tem conta?{' '}
                  <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">Entrar</a>
                </p>
              </>
            )}

            {step === 'sent' && (
              <>
                <div className="text-center mb-6">
                  <div className="text-5xl mb-4">📬</div>
                  <h1 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                    Confirme seu email
                  </h1>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Enviamos um link para{' '}
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{email}</span>
                  </p>
                  <p className="text-sm text-zinc-400 mt-2">
                    Clique no link para ativar sua conta. Após isso, aguarde aprovação do administrador para acessar as ferramentas.
                  </p>
                </div>

                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="w-full py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  {loading ? 'Reenviando...' : 'Reenviar link'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('form'); setError('') }}
                  className="w-full mt-2 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors py-1"
                >
                  ← Corrigir dados
                </button>
              </>
            )}
          </div>

          <p className="text-center text-xs text-zinc-400 mt-6">BVL System V3</p>
        </div>
      </div>
    </div>
  )
}
