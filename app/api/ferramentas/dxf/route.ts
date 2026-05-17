import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { analyzeImageWithGemini } from '@/lib/dxf/vision'
import { generateDxf } from '@/lib/dxf/generator'
import { validateDxf } from '@/lib/dxf/validator'
import { getLayerMap } from '@/lib/dxf/layers'
import type { DiagramType, Operadora } from '@/lib/dxf/types'

const CREDIT_COST = 10

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'aprovado') {
    return NextResponse.json({ error: 'Conta aguardando aprovação do administrador' }, { status: 403 })
  }

  let imageBase64: string, mimeType: string, diagramType: DiagramType, operadora: Operadora
  try {
    const body = await request.json()
    imageBase64 = body.imageBase64
    mimeType = body.mimeType ?? 'image/jpeg'
    diagramType = (body.diagramType as DiagramType) ?? 'generico'
    operadora = (body.operadora as Operadora) ?? 'generico'

    if (!imageBase64) throw new Error('Imagem obrigatória')
    if (imageBase64.length > 14_000_000) {
      return NextResponse.json({ error: 'Imagem muito grande. Máximo: 10MB' }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Dados inválidos' }, { status: 400 })
  }

  const { data: tokens, error: tokenError } = await supabase
    .from('tokens_usuarios')
    .select('saldo, licenca_pro')
    .eq('user_id', user.id)
    .single()

  if (tokenError || !tokens) {
    return NextResponse.json({ error: 'Erro ao verificar créditos' }, { status: 500 })
  }

  if (!tokens.licenca_pro && tokens.saldo < CREDIT_COST) {
    return NextResponse.json({
      error: `Créditos insuficientes. Saldo: ${tokens.saldo} / Necessário: ${CREDIT_COST}`,
    }, { status: 402 })
  }

  const saldoOriginal = tokens.saldo

  if (!tokens.licenca_pro) {
    const { error: deductError } = await supabase
      .from('tokens_usuarios')
      .update({ saldo: tokens.saldo - CREDIT_COST })
      .eq('user_id', user.id)
      .eq('saldo', tokens.saldo) // optimistic lock — previne race condition

    if (deductError) {
      return NextResponse.json({ error: 'Erro ao debitar créditos. Tente novamente.' }, { status: 500 })
    }
  }

  const t0 = Date.now()

  try {
    const geometry = await analyzeImageWithGemini(imageBase64, mimeType, diagramType)
    const layerMap = getLayerMap(operadora, diagramType)
    const dxfContent = generateDxf(geometry, layerMap)

    const validation = validateDxf(dxfContent)
    if (!validation.valid) throw new Error(validation.error)

    await supabase.from('tokens_historico').insert({
      user_id: user.id,
      quantidade: tokens.licenca_pro ? 0 : CREDIT_COST,
      tipo: 'consumo',
      descricao: `Conversão DXF — ${diagramType} / ${operadora}`,
    })

    const dxfBase64 = Buffer.from(dxfContent, 'utf-8').toString('base64')
    const filename = `planta_${diagramType}_${operadora}_${Date.now()}.dxf`

    return NextResponse.json({
      success: true,
      dxf: dxfBase64,
      filename,
      elementsCount: geometry.elements.length,
      processingMs: Date.now() - t0,
      creditsConsumed: tokens.licenca_pro ? 0 : CREDIT_COST,
    })

  } catch (err: any) {
    // Refund on failure
    if (!tokens.licenca_pro) {
      await supabase
        .from('tokens_usuarios')
        .update({ saldo: saldoOriginal })
        .eq('user_id', user.id)
    }

    return NextResponse.json({
      success: false,
      error: err.message ?? 'Erro na conversão',
      creditsRefunded: !tokens.licenca_pro,
    }, { status: 500 })
  }
}
