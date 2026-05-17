export type Plano = 'free' | 'pro' | 'top'
export type Role = 'admin' | 'coord' | 'projetista' | 'tec' | 'user'

export interface Profile {
  id: string
  email: string
  nome: string
  role: Role
  plano: Plano
  licenca_pro: boolean
  cliente_id: string | null
  created_at: string
}

export interface Modulo {
  id: string
  nome: string
  icone: string
  descricao: string
  custo_tokens: number
  template_id: string | null
  modelo_excel_url: string | null
  ia_features: string[]
  plano_minimo: Plano
  ativo: boolean
}

export interface TokensUsuario {
  id: string
  user_id: string
  saldo: number
  licenca_pro: boolean
  plano: Plano
}

export interface Pacote {
  id: string
  nome: string
  quantidade: number
  bonus: number
  preco: number
  ativo: boolean
}
