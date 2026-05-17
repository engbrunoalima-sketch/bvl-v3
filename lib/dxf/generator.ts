import type { GeometryData, GeometryElement } from './types'
import { resolveLayer, getAllLayers } from './layers'

export function generateDxf(geometry: GeometryData, layerMap: Record<string, string>): string {
  const layers = getAllLayers(layerMap)
  return dxfHeader(layers) + dxfEntities(geometry.elements, layerMap) + dxfFooter()
}

function dxfHeader(layers: string[]): string {
  const layerDefs = layers.map(name => `  0
LAYER
  2
${name}
 70
0
 62
7
  6
CONTINUOUS
`).join('')

  return `  0
SECTION
  2
HEADER
  9
$ACADVER
  1
AC1021
  0
ENDSEC
  0
SECTION
  2
TABLES
  0
TABLE
  2
LAYER
 70
${layers.length + 1}
  0
LAYER
  2
0
 70
0
 62
7
  6
CONTINUOUS
${layerDefs}  0
ENDTAB
  0
ENDSEC
  0
SECTION
  2
BLOCKS
  0
ENDSEC
  0
SECTION
  2
ENTITIES
`
}

function dxfEntities(elements: GeometryElement[], layerMap: Record<string, string>): string {
  return elements.map(el => {
    const layer = resolveLayer(el.layer ?? 'default', layerMap)
    switch (el.type) {
      case 'rect':     return dxfRect(el, layer)
      case 'line':     return dxfLine(el, layer)
      case 'text':     return dxfText(el, layer)
      case 'circle':   return dxfCircle(el, layer)
      case 'polyline': return dxfPolyline(el, layer)
      default:         return ''
    }
  }).join('')
}

function dxfRect(el: GeometryElement, layer: string): string {
  const x = el.x ?? 0, y = el.y ?? 0, w = el.w ?? 1, h = el.h ?? 1
  return `  0
LWPOLYLINE
  8
${layer}
 90
4
 70
1
 10
${x}
 20
${y}
 10
${x + w}
 20
${y}
 10
${x + w}
 20
${y + h}
 10
${x}
 20
${y + h}
`
}

function dxfLine(el: GeometryElement, layer: string): string {
  const [x1 = 0, y1 = 0] = el.start ?? []
  const [x2 = 1, y2 = 1] = el.end ?? []
  return `  0
LINE
  8
${layer}
 10
${x1}
 20
${y1}
 11
${x2}
 21
${y2}
`
}

function dxfText(el: GeometryElement, layer: string): string {
  const content = (el.content ?? el.label ?? '').replace(/\n/g, ' ').slice(0, 255)
  return `  0
TEXT
  8
${layer}
 10
${el.x ?? 0}
 20
${el.y ?? 0}
 40
0.25
  1
${content}
 50
${el.rotation ?? 0}
`
}

function dxfCircle(el: GeometryElement, layer: string): string {
  return `  0
CIRCLE
  8
${layer}
 10
${el.x ?? 0}
 20
${el.y ?? 0}
 40
${el.r ?? 0.5}
`
}

function dxfPolyline(el: GeometryElement, layer: string): string {
  const pts = el.points ?? []
  const count = Math.floor(pts.length / 2)
  if (count < 2) return ''
  const vertices = Array.from({ length: count }, (_, i) => ` 10\n${pts[i * 2]}\n 20\n${pts[i * 2 + 1]}\n`).join('')
  return `  0
LWPOLYLINE
  8
${layer}
 90
${count}
 70
0
${vertices}`
}

function dxfFooter(): string {
  return `  0
ENDSEC
  0
EOF
`
}
