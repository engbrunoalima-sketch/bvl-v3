'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { ThemeToggle } from '@/components/ThemeToggle'

function mapError(msg: string): string {
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Muitas tentativas. Aguarde alguns minutos.'
  if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) return 'Email ou senha incorretos.'
  if (msg.includes('Email not confirmed')) return 'Email não confirmado. Verifique sua caixa de entrada.'
  return msg
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) setError(decodeURIComponent(urlError))
  }, [searchParams])

  async function handleGoogle() {
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setLoading(false)
    if (error) { setError(mapError(error.message)); return }
    router.push('/dashboard')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 8, color: 'var(--text)', fontSize: 14,
    padding: '12px 14px', fontFamily: 'inherit', transition: 'border-color .2s',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '16px',
      background: 'radial-gradient(ellipse 90% 50% at 50% -10%, rgba(59,130,246,0.15) 0%, transparent 60%), var(--bg)'
    }}>
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <ThemeToggle />
      </div>

      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <Image src="/logo-dark.png" alt="BVL System" width={140} height={44}
            style={{ height: 44, width: 'auto' }} priority className="dark:block hidden" />
          <Image src="/logo-light.png" alt="BVL System" width={140} height={44}
            style={{ height: 44, width: 'auto' }} priority className="dark:hidden block" />
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '32px 24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
        }}>

          <form onSubmit={handleEmail}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 7 }}>
                Email
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email" autoFocus placeholder="seu@email.com"
                style={inputStyle} />
            </div>

            {/* Senha */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 7 }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input type={showSenha ? 'text' : 'password'} value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required autoComplete="current-password" placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 40 }} />
                <button type="button" onClick={() => setShowSenha(s => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 2, lineHeight: 0 }}>
                  {showSenha ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <a href="/forgot-password" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
                Esqueci minha senha
              </a>
            </div>

            {error && (
              <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--red)', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || googleLoading}
              style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: (loading || googleLoading) ? 0.6 : 1,
                transition: 'all .2s', fontFamily: 'inherit',
              }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>ou</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Google */}
          <button onClick={handleGoogle} disabled={googleLoading || loading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '12px', background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--text)', fontSize: 14, fontWeight: 600,
              cursor: (googleLoading || loading) ? 'not-allowed' : 'pointer',
              opacity: (googleLoading || loading) ? 0.6 : 1,
              transition: 'all .2s', fontFamily: 'inherit',
            }}>
            {googleLoading ? 'Redirecionando...' : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Entrar com Google
              </>
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 20 }}>
            Não tem conta?{' '}
            <a href="/signup" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              Criar conta
            </a>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 24 }}>BVL System V3</p>
      </div>
    </div>
  )
}
