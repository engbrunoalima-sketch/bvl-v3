import type { DiagramType, Operadora } from './types'

type LayerMap = Record<string, string>

const LAYER_CONFIGS: Record<string, LayerMap> = {
  claro_ipran: {
    nos_rede:    'IPRAN_CORE',
    enlaces:     'IPRAN_EDGE',
    fibra:       'FIBRA_ROTA',
    equipamento: 'EQUIPAMENTOS',
    rack:        'RACK',
    cabos:       'CABOS',
    emenda:      'EMENDAS',
    terminal:    'TERMINAIS',
    dimensoes:   'DIMENSOES',
    labels:      'LABELS',
    default:     'GERAL',
  },
  claro_dwdm: {
    nos_rede:    'DWDM_NODE',
    enlaces:     'DWDM_LINK',
    fibra:       'FIBRA_ROTA',
    equipamento: 'EQUIPAMENTOS',
    rack:        'RACK',
    cabos:       'CABOS',
    dimensoes:   'DIMENSOES',
    labels:      'LABELS',
    default:     'GERAL',
  },
  vivo: {
    fibra:       'FTTH_ROTA',
    emenda:      'CEO',
    terminal:    'CTO',
    nos_rede:    'NOS_REDE',
    equipamento: 'EQUIPAMENTOS',
    rack:        'RACK',
    cabos:       'CABOS',
    labels:      'LABELS',
    default:     'GERAL',
  },
  tim: {
    nos_rede:    'RAN_TRANSPORT',
    fibra:       'FIBRA_ACESSO',
    equipamento: 'EQUIPAMENTOS',
    enlaces:     'ENLACES',
    rack:        'RACK',
    labels:      'LABELS',
    default:     'GERAL',
  },
  generico: {
    nos_rede:    'NOS_REDE',
    enlaces:     'ENLACES',
    fibra:       'FIBRA',
    emenda:      'EMENDAS',
    terminal:    'TERMINAIS',
    equipamento: 'EQUIPAMENTOS',
    rack:        'RACK',
    cabos:       'CABOS',
    dimensoes:   'DIMENSOES',
    labels:      'LABELS',
    default:     'GERAL',
  },
}

export function getLayerMap(operadora: Operadora, diagramType: DiagramType): LayerMap {
  if (operadora === 'claro') {
    if (diagramType === 'ipran' || diagramType === 'das') return LAYER_CONFIGS.claro_ipran
    if (diagramType === 'fibra') return LAYER_CONFIGS.claro_dwdm
    return LAYER_CONFIGS.claro_ipran
  }
  if (operadora === 'vivo') return LAYER_CONFIGS.vivo
  if (operadora === 'tim')  return LAYER_CONFIGS.tim
  return LAYER_CONFIGS.generico
}

export function resolveLayer(semanticLayer: string, layerMap: LayerMap): string {
  return layerMap[semanticLayer] ?? layerMap.default ?? semanticLayer.toUpperCase()
}

export function getAllLayers(layerMap: LayerMap): string[] {
  return [...new Set(Object.values(layerMap))]
}
