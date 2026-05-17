'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function ApproveButtons({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function update(status: 'aprovado' | 'rejeitado') {
    setLoading(true)
    await supabase.from('profiles').update({ status }).eq('id', userId)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => update('aprovado')}
        disabled={loading}
        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Aprovar
      </button>
      <button
        onClick={() => update('rejeitado')}
        disabled={loading}
        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Rejeitar
      </button>
    </div>
  )
}
