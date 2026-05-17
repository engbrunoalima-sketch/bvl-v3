export type DiagramType = 'rack' | 'fibra' | 'ipran' | 'das' | 'bandeja' | 'generico'
export type Operadora = 'claro' | 'vivo' | 'tim' | 'generico'

export interface GeometryElement {
  type: 'line' | 'rect' | 'text' | 'circle' | 'polyline'
  layer: string
  x?: number
  y?: number
  w?: number
  h?: number
  r?: number
  start?: [number, number]
  end?: [number, number]
  points?: number[]
  content?: string
  rotation?: number
  label?: string
}

export interface GeometryData {
  canvas_size: { width: number; height: number }
  elements: GeometryElement[]
}

export interface DxfConversionResult {
  success: boolean
  dxf?: string
  filename?: string
  elementsCount?: number
  processingMs?: number
  creditsConsumed?: number
  error?: string
  creditsRefunded?: boolean
}
