import type { GeometryData, DiagramType } from './types'

const DIAGRAM_CONTEXT: Record<DiagramType, string> = {
  rack:     'rack de telecomunicações com bastidores, equipamentos (roteadores, switches, ODF, DIO), patch panels e cabos. Identifique cada equipamento por posição de U-slot.',
  fibra:    'rota de fibra óptica com dutos, cabos de fibra (quantidade de FOs), caixas de emenda óptica (CEO), caixas de terminação óptica (CTO), postes e emendas fusão/mecânica.',
  ipran:    'topologia IPRAN/MPLS com nós de rede (ERB, BSC, RNC, CORE, EDGE), enlaces (rádio, fibra, E1), interfaces (E1, STM-1, GE, 10GE) e suas capacidades.',
  das:      'sistema DAS (Distributed Antenna System) com antenas, cabos coaxiais, combinadores, head-end, mastros e zonas de cobertura RF.',
  bandeja:  'bandeja de cabos ou eletrocalha com trajetória de cabeamento, fixações, suportes e identificação de circuitos.',
  generico: 'diagrama de rede de telecomunicações. Identifique todos os elementos visíveis.',
}

const LAYER_HINTS = `
Classifique cada elemento com um destes valores exatos de "layer":
- "fibra"       → cabos de fibra óptica, rotas, dutos
- "nos_rede"    → nós de rede, equipamentos ativos principais (roteador, switch, OLT, ONU)
- "enlaces"     → conexões, links, ligações entre nós
- "equipamento" → equipamentos de suporte (DIO, ODF, amplificador, splitter, combiner)
- "rack"        → bastidores, frames físicos, gabinetes
- "cabos"       → cabos de dados, coaxial, metálico (não fibra)
- "emenda"      → emendas ópticas, splice closures, conectores SC/LC
- "terminal"    → caixas de terminação (CTO, NAP, roseta)
- "dimensoes"   → cotas, medidas, flechas de dimensionamento
- "labels"      → textos, etiquetas, IDs de circuito, legendas
- "default"     → qualquer elemento não classificado acima`

const GEOMETRY_SCHEMA = {
  type: 'object',
  properties: {
    canvas_size: {
      type: 'object',
      properties: {
        width:  { type: 'number' },
        height: { type: 'number' },
      },
      required: ['width', 'height'],
    },
    elements: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type:     { type: 'string', enum: ['line', 'rect', 'text', 'circle', 'polyline'] },
          layer:    { type: 'string' },
          x:        { type: 'number' },
          y:        { type: 'number' },
          w:        { type: 'number' },
          h:        { type: 'number' },
          r:        { type: 'number' },
          start:    { type: 'array', items: { type: 'number' } },
          end:      { type: 'array', items: { type: 'number' } },
          points:   { type: 'array', items: { type: 'number' } },
          content:  { type: 'string' },
          rotation: { type: 'number' },
          label:    { type: 'string' },
        },
        required: ['type', 'layer'],
      },
    },
  },
  required: ['canvas_size', 'elements'],
}

export async function analyzeImageWithGemini(
  imageBase64: string,
  mimeType: string,
  diagramType: DiagramType
): Promise<GeometryData> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada. Adicione ao .env.local para ativar este módulo.')
  }

  const prompt = `Você é especialista em CAD e redes de telecomunicações brasileiras.
Analise esta imagem de ${DIAGRAM_CONTEXT[diagramType]}

Extraia TODOS os elementos geométricos visíveis com coordenadas precisas.
${LAYER_HINTS}

Use escala consistente baseada em anotações de dimensão visíveis na imagem (se houver).
Coordenadas devem ser números. Canvas em unidades relativas (ex: 0–100).`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(50_000),
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
          ],
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: GEOMETRY_SCHEMA,
          temperature: 0.1,
        },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${err.slice(0, 300)}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!content) throw new Error('Resposta vazia da API Gemini')

  const geometry: GeometryData = JSON.parse(content)
  if (!geometry.canvas_size || !Array.isArray(geometry.elements)) {
    throw new Error('Estrutura de geometria inválida retornada pela IA')
  }

  return geometry
}
