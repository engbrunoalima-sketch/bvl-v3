'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-11 h-6" />

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title="Alternar tema"
      style={{
        position: 'relative',
        width: 44,
        height: 24,
        borderRadius: 12,
        border: '1px solid',
        borderColor: isDark ? '#334155' : '#cbd5e1',
        background: isDark ? '#1e293b' : '#f1f5f9',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
        transition: 'border-color .2s, background .2s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: 3,
          top: 3,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: isDark ? '#94a3b8' : '#f59e0b',
          transform: isDark ? 'translateX(0)' : 'translateX(20px)',
          transition: 'transform .25s ease, background .25s',
          display: 'block',
        }}
      />
    </button>
  )
}
