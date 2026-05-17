'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/Header'
import type { DiagramType, Operadora } from '@/lib/dxf/types'

const CREDIT_COST = 10

const DIAGRAM_TYPES: { value: DiagramType; label: string; icon: string }[] = [
  { value: 'rack',     label: 'Rack / Bastidor',     icon: '🖥️' },
  { value: 'fibra',    label: 'Rota de Fibra',        icon: '🔵' },
  { value: 'ipran',    label: 'Topologia IPRAN/MPLS', icon: '🌐' },
  { value: 'das',      label: 'Sistema DAS',          icon: '📡' },
  { value: 'bandeja',  label: 'Bandeja / Eletrocalha',icon: '📋' },
  { value: 'generico', label: 'Genérico',             icon: '📄' },
]

const OPERADORAS: { value: Operadora; label: string }[] = [
  { value: 'generico', label: 'Genérico (sem padrão)' },
  { value: 'claro',    label: 'Claro' },
  { value: 'vivo',     label: 'Vivo' },
  { value: 'tim',      label: 'TIM' },
]

const STEPS = ['Analisando imagem...', 'Identificando elementos...', 'Gerando DXF...', 'Validando arquivo...']

type Stage = 'upload' | 'config' | 'processing' | 'done' | 'error'

interface PageProps {
  saldo?: number
  plano?: string
}

export default function DxfPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const [stage, setStage] = useState<Stage>('upload')
  const [imageBase64, setImageBase64] = useState('')
  const [mimeType, setMimeType] = useState('image/jpeg')
  const [previewUrl, setPreviewUrl] = useState('')
  const [diagramType, setDiagramType] = useState<DiagramType>('generico')
  const [operadora, setOperadora] = useState<Operadora>('generico')
  const [processingStep, setProcessingStep] = useState(0)
  const [result, setResult] = useState<{ dxf: string; filename: string; elementsCount: number; processingMs: number } | null>(null)
  const [error, setError] = useState('')
  const [creditsRefunded, setCreditsRefunded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [saldo, setSaldo] = useState(0)
  const [plano, setPlano] = useState('free')

  // Fetch credits on mount
  useState(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase.from('tokens_usuarios').select('saldo, plano').eq('user_id', user.id).single()
        .then(({ data }) => { if (data) { setSaldo(data.saldo ?? 0); setPlano(data.plano ?? 'free') } })
    })
  })

  function readFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Formato inválido. Use PNG, JPG ou WebP.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Imagem muito grande. Máximo: 10MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const base64 = dataUrl.split(',')[1]
      setImageBase64(base64)
      setMimeType(file.type)
      setPreviewUrl(dataUrl)
      setError('')
      setStage('config')
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) readFile(file)
  }, [])

  async function handleConvert() {
    setStage('processing')
    setProcessingStep(0)

    const stepInterval = setInterval(() => {
      setProcessingStep(s => Math.min(s + 1, STEPS.length - 1))
    }, 4000)

    try {
      const res = await fetch('/api/ferramentas/dxf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType, diagramType, operadora }),
      })

      clearInterval(stepInterval)
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Erro na conversão')
        setCreditsRefunded(data.creditsRefunded ?? false)
        setStage('error')
        return
      }

      setResult({
        dxf: data.dxf,
        filename: data.filename,
        elementsCount: data.elementsCount,
        processingMs: data.processingMs,
      })
      setSaldo(s => s - (data.creditsConsumed ?? 0))
      setStage('done')

    } catch {
      clearInterval(stepInterval)
      setError('Erro de conexão. Verifique sua internet.')
      setCreditsRefunded(false)
      setStage('error')
    }
  }

  function handleDownload() {
    if (!result) return
    const bytes = Uint8Array.from(atob(result.dxf), c => c.charCodeAt(0))
    const blob = new Blob([bytes], { type: 'application/dxf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleWhatsApp() {
    if (!result) return
    const text = encodeURIComponent(`DXF gerado pelo BVL System: ${result.filename}\n${result.elementsCount} elementos detectados`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  function reset() {
    setStage('upload')
    setImageBase64('')
    setPreviewUrl('')
    setResult(null)
    setError('')
    setProcessingStep(0)
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header saldo={saldo} plano={plano} backHref="/dashboard" backLabel="Dashboard" title="Planta para DXF" />

      <main className="max-w-2xl mx-auto px-6 py-10">

        {/* Header info */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-4xl">📐</span>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Converter Planta para DXF</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Fotografe um diagrama de rede e receba um arquivo DXF editável no AutoCAD
            </p>
          </div>
          <span className="ml-auto text-xs font-medium px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full whitespace-nowrap">
            {CREDIT_COST} créditos
          </span>
        </div>

        {/* STAGE: UPLOAD */}
        {stage === 'upload' && (
          <div
            ref={dropRef}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                : 'border-zinc-300 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-zinc-900'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f) }}
            />
            <div className="text-5xl mb-4">📷</div>
            <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Arraste a imagem ou clique para selecionar
            </p>
            <p className="text-sm text-zinc-400">PNG, JPG, WebP — máximo 10MB</p>
            {error && (
              <p className="mt-4 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>
        )}

        {/* STAGE: CONFIG */}
        {stage === 'config' && (
          <div className="space-y-6">
            {/* Preview */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <img src={previewUrl} alt="Prévia" className="w-full max-h-64 object-contain p-2" />
            </div>

            {/* Diagram type */}
            <div>
              <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2 block">Tipo de diagrama</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DIAGRAM_TYPES.map(dt => (
                  <button
                    key={dt.value}
                    onClick={() => setDiagramType(dt.value)}
                    className={`p-3 rounded-lg border text-sm font-medium text-left transition-colors ${
                      diagramType === dt.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300'
                        : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <span className="mr-1.5">{dt.icon}</span>{dt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Operadora */}
            <div>
              <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2 block">
                Operadora <span className="font-normal text-zinc-400">(define padrão de layers no DXF)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {OPERADORAS.map(op => (
                  <button
                    key={op.value}
                    onClick={() => setOperadora(op.value)}
                    className={`p-3 rounded-lg border text-sm font-medium text-left transition-colors ${
                      operadora === op.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300'
                        : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Credit check + actions */}
            {saldo < CREDIT_COST && (
              <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-400">
                Créditos insuficientes. Saldo: {saldo} / Necessário: {CREDIT_COST}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
              >
                ← Trocar imagem
              </button>
              <button
                onClick={handleConvert}
                disabled={saldo < CREDIT_COST}
                className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
              >
                Converter — {CREDIT_COST} créditos
              </button>
            </div>
          </div>
        )}

        {/* STAGE: PROCESSING */}
        {stage === 'processing' && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center">
            <div className="text-5xl mb-6 animate-pulse">⚙️</div>
            <p className="font-semibold text-zinc-900 dark:text-white mb-2">Convertendo planta...</p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-6">{STEPS[processingStep]}</p>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 mb-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((processingStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>
            <p className="text-xs text-zinc-400 mt-4">Plantas complexas podem levar até 30 segundos</p>
          </div>
        )}

        {/* STAGE: DONE */}
        {stage === 'done' && result && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">DXF gerado com sucesso!</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{result.filename}</p>

              <div className="flex justify-center gap-6 mt-4 text-sm text-zinc-400">
                <span>{result.elementsCount} elementos</span>
                <span>{(result.processingMs / 1000).toFixed(1)}s</span>
                <span>{CREDIT_COST} créditos</span>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              ⬇️ Baixar DXF (AutoCAD)
            </button>

            <button
              onClick={handleWhatsApp}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              💬 Compartilhar via WhatsApp
            </button>

            <button
              onClick={reset}
              className="w-full py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
            >
              Nova conversão
            </button>
          </div>
        )}

        {/* STAGE: ERROR */}
        {stage === 'error' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-500/30 rounded-xl p-6 text-center">
              <div className="text-5xl mb-4">❌</div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Conversão não concluída</h2>
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">
                {error}
              </p>
              {creditsRefunded && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-3">
                  ✓ Seus {CREDIT_COST} créditos foram preservados.
                </p>
              )}
            </div>
            <button
              onClick={() => setStage('config')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
            >
              Tentar novamente
            </button>
            <button
              onClick={reset}
              className="w-full py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm"
            >
              Trocar imagem
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
