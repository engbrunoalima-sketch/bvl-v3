'use client'

import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { LogoutButton } from './LogoutButton'

interface HeaderProps {
  saldo?: number
  plano?: string
  nome?: string
  backHref?: string
  backLabel?: string
  title?: string
}

export function Header({ saldo, plano, nome, backHref, backLabel, title }: HeaderProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {mounted && (
          <Image
            src={resolvedTheme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
            alt="BVL System"
            width={100}
            height={32}
            style={{ height: 32, width: 'auto' }}
            priority
          />
        )}
        {backHref && (
          <>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <a href={backHref} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
              {backLabel}
            </a>
          </>
        )}
        {title && (
          <>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {saldo !== undefined && (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-medium text-zinc-900 dark:text-white">{saldo}</span> créditos
          </span>
        )}
        {plano && (
          <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs text-zinc-600 dark:text-zinc-300 uppercase font-medium">
            {plano}
          </span>
        )}
        {nome && (
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
              {nome.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 hidden sm:block">{nome}</span>
          </div>
        )}
        <ThemeToggle />
        <LogoutButton />
      </div>
    </header>
  )
}
