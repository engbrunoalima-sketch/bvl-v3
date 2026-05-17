export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateDxf(content: string): ValidationResult {
  if (!content || content.length < 200) {
    return { valid: false, error: 'DXF muito pequeno — conversão incompleta' }
  }
  if (!content.includes('SECTION') || !content.includes('ENTITIES') || !content.includes('ENDSEC')) {
    return { valid: false, error: 'Estrutura DXF inválida — seções obrigatórias ausentes' }
  }
  const trimmed = content.trim()
  if (!trimmed.endsWith('EOF') && !trimmed.endsWith('EOF\n')) {
    return { valid: false, error: 'DXF incompleto — marcador EOF ausente' }
  }
  return { valid: true }
}
