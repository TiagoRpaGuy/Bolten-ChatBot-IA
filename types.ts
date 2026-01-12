/**
 * PROPOSAL CONFIGURATOR - TYPES v5.0
 * SISTEMA FLEXÍVEL - Suporta múltiplos modelos de precificação
 * - Venda por usuário individual
 * - Preços progressivos por volume
 * - Modelos: Por Usuário, Por Plano, Híbrido
 * - Custo base mínimo garantido: R$ 160
 * - Setup mínimo fixo: R$ 500
 */

// ========================================
// SYSTEM CONFIG
// ========================================
export const SYSTEM_CONFIG = {
  name: "CRM Partner",
  tagline: "Plataforma de Vendas Inteligente",
} as const;

// ========================================
// FINANCIAL RULES - REGRAS DE NEGÓCIO
// ========================================
export const FINANCIAL_RULES = {
  // Setup
  MIN_SETUP: 500,
  SETUP_BASE_WA_AI: 500,
  SETUP_ADDON_PER_FEATURE: 150,
  
  // Custo Base (seu custo mínimo)
  MIN_MONTHLY_COST: 160,  // Abaixo disso = prejuízo
  
  // Preço base por usuário (custo interno)
  BASE_COST_PER_USER: 20,
  
  // Custos fixos de módulos
  AI_AGENT_COST: 60,
  CONVERSIONS_COST: 20,
  WHATSAPP_COST: 0, // Incluso na IA
} as const;

// ========================================
// PRICING MODELS - MODELOS DE PRECIFICAÇÃO
// ========================================
export type PricingModel = "per_user" | "fixed_tier" | "hybrid";

export const PRICING_MODELS = {
  per_user: { 
    id: "per_user",
    label: "Por Usuário", 
    description: "Preço unitário por usuário com desconto progressivo",
    icon: "person"
  },
  fixed_tier: { 
    id: "fixed_tier",
    label: "Pacote Fixo", 
    description: "Pacotes pré-definidos com quantidade fixa de usuários",
    icon: "package_2"
  },
  hybrid: { 
    id: "hybrid",
    label: "Híbrido", 
    description: "Base fixa + usuários adicionais",
    icon: "tune"
  },
} as const;

// ========================================
// PREÇO POR USUÁRIO - ESCADA PROGRESSIVA
// ========================================
export interface UserPriceRange {
  minUsers: number;
  maxUsers: number;
  pricePerUser: number;
  discount: number; // Percentual de desconto sobre preço base
  label: string;
}

// Preço base: R$ 80 por usuário
// Desconto progressivo conforme quantidade
export const USER_PRICE_RANGES: UserPriceRange[] = [
  { minUsers: 1, maxUsers: 1, pricePerUser: 100, discount: 0, label: "Solo" },
  { minUsers: 2, maxUsers: 2, pricePerUser: 90, discount: 10, label: "Duo" },
  { minUsers: 3, maxUsers: 5, pricePerUser: 80, discount: 20, label: "Equipe" },
  { minUsers: 6, maxUsers: 10, pricePerUser: 70, discount: 30, label: "Business" },
  { minUsers: 11, maxUsers: 20, pricePerUser: 60, discount: 40, label: "Empresa" },
  { minUsers: 21, maxUsers: 50, pricePerUser: 50, discount: 50, label: "Corporativo" },
  { minUsers: 51, maxUsers: 100, pricePerUser: 40, discount: 60, label: "Enterprise" },
];

// ========================================
// PACOTES FIXOS (modelo legado compatível)
// ========================================
export interface FixedTier {
  id: string;
  label: string;
  maxUsers: number;
  monthlyPrice: number;
  linkedPlan: PlanLevel;
}

export const FIXED_TIERS: FixedTier[] = [
  { id: "tier_5", label: "Até 5 usuários", maxUsers: 5, monthlyPrice: 400, linkedPlan: "start" },
  { id: "tier_10", label: "Até 10 usuários", maxUsers: 10, monthlyPrice: 700, linkedPlan: "start" },
  { id: "tier_20", label: "Até 20 usuários", maxUsers: 20, monthlyPrice: 1200, linkedPlan: "pro" },
  { id: "tier_30", label: "Até 30 usuários", maxUsers: 30, monthlyPrice: 1600, linkedPlan: "pro" },
  { id: "tier_50", label: "Até 50 usuários", maxUsers: 50, monthlyPrice: 2500, linkedPlan: "enterprise" },
  { id: "tier_100", label: "Até 100 usuários", maxUsers: 100, monthlyPrice: 4000, linkedPlan: "enterprise" },
];

// ========================================
// MODELO HÍBRIDO
// ========================================
export const HYBRID_PRICING = {
  basePrice: 160,       // Preço base mensal (cobre seu custo mínimo)
  baseUsers: 1,         // Usuários inclusos no preço base
  additionalUserPrice: 60, // Preço por usuário adicional
} as const;

// ========================================
// PARTNERSHIP MODELS
// ========================================
export type PartnershipModel = "whitelabel" | "partner";

export const PARTNERSHIP_MODELS = {
  whitelabel: { label: "White Label", commission: 1.0 },
  partner: { label: "Parceiro 70%", commission: 0.70, boltenFee: 0.30 },
} as const;

// ========================================
// BASIC TYPES
// ========================================
export type PlanLevel = "start" | "pro" | "enterprise";
export type ThemeMode = "light" | "dark";

// Retrocompatibilidade
export interface UserTier {
  id: string;
  label: string;
  maxUsers: number;
  linkedPlan: PlanLevel;
}

export const USER_TIERS: UserTier[] = FIXED_TIERS.map(t => ({
  id: t.id,
  label: t.label,
  maxUsers: t.maxUsers,
  linkedPlan: t.linkedPlan
}));

export const PLAN_PRESETS: Record<PlanLevel, { tierId: string; features: FeatureState }> = {
  start: { tierId: "tier_5", features: { crm: true, whatsapp: true, ai: false, conversions: false } },
  pro: { tierId: "tier_20", features: { crm: true, whatsapp: true, ai: false, conversions: true } },
  enterprise: { tierId: "tier_50", features: { crm: true, whatsapp: true, ai: true, conversions: true } },
};

// ========================================
// TOOLTIPS (AJUDA VISUAL)
// ========================================
export const FEATURE_TOOLTIPS = {
  crm: "Gestão de leads, pipeline e funil de vendas completo.",
  whatsapp: "API oficial do WhatsApp para mensagens automáticas.",
  ai: "Agente de IA 24h para qualificar e responder leads. Requer WhatsApp.",
  conversions: "Tracking avançado de conversões e attribution.",
} as const;

export const ROI_TOOLTIPS = {
  ticketMedio: "Valor médio de cada venda fechada pelo cliente.",
  leadsPerMonth: "Quantidade de oportunidades que entram no funil por mês.",
  conversionRate: "Porcentagem atual de leads que viram clientes.",
  improvement: "Melhoria esperada na taxa de conversão com a ferramenta.",
} as const;

export const PRICE_TOOLTIPS = {
  setup: "Taxa única de adesão (implementação + treinamento + setup técnico).",
  monthly: "Valor mensal recorrente da assinatura do software.",
} as const;

export const PRICING_MODEL_TOOLTIPS = {
  per_user: "Ideal para clientes que querem começar pequeno e escalar gradualmente.",
  fixed_tier: "Melhor custo-benefício para quem já sabe quantos usuários precisa.",
  hybrid: "Combina preço base fixo + usuários adicionais. Bom para equipes variáveis.",
} as const;

// ========================================
// INTERNAL PRICING (Retrocompatibilidade)
// ========================================
export const INTERNAL_PRICING = {
  CRM_PER_USER: FINANCIAL_RULES.BASE_COST_PER_USER,
  AI_AGENT: FINANCIAL_RULES.AI_AGENT_COST,
  CONVERSIONS: FINANCIAL_RULES.CONVERSIONS_COST,
} as const;

// ========================================
// SERVICES + COMPLEXITY (RICH LIST ITEMS)
// ========================================
export interface ServiceItem {
  id: string;
  label: string;
  description: string;
  cost: number;
  costType: "fixed" | "percent";
  required: boolean;
  category: "service" | "complexity";
}

export const SERVICES_LIST: ServiceItem[] = [
  // Serviços de Implementação
  { id: "onboarding", label: "Setup Técnico", description: "Instalação, configuração e integração com sistemas existentes.", cost: 500, costType: "fixed", required: true, category: "service" },
  { id: "training", label: "Treinamento", description: "Sessão de 2h ao vivo + gravação + material de apoio.", cost: 1500, costType: "fixed", required: false, category: "service" },
  { id: "migration", label: "Migração de Dados", description: "Importação de leads, clientes e histórico do CRM anterior.", cost: 1000, costType: "fixed", required: false, category: "service" },
  
  // Fatores de Complexidade
  { id: "urgencia", label: "Urgência na Entrega", description: "Prioridade máxima na fila, entrega em até 48h.", cost: 15, costType: "percent", required: false, category: "complexity" },
  { id: "presencial", label: "Reuniões Presenciais", description: "Atendimento in-loco para kickoff e treinamento.", cost: 10, costType: "percent", required: false, category: "complexity" },
  { id: "suporte", label: "Suporte Premium", description: "SLA de 2h para resposta, canal direto no WhatsApp.", cost: 20, costType: "percent", required: false, category: "complexity" },
];

// ========================================
// STATE INTERFACES
// ========================================
export interface ClientData {
  companyName: string;
  contactName: string;
  email: string;
}

export interface FeatureState {
  crm: boolean;
  whatsapp: boolean;
  ai: boolean;
  conversions: boolean;
}

export interface ROIInputs {
  ticketMedio: number;
  leadsPerMonth: number;
  conversionRate: number;
  improvementPercent: number;
}

export interface PaybackPoint {
  month: number;
  balance: number;
  isPositive: boolean;
}

// ========================================
// PRICING STATE - Estado para modelo flexível
// ========================================
export interface FlexiblePricingState {
  model: PricingModel;
  userCount: number;
  selectedTierId: string | null; // Para modelo fixed_tier
}

// ========================================
// NOVAS FUNÇÕES DE CÁLCULO - MODELO FLEXÍVEL
// ========================================

/**
 * Retorna o range de preço aplicável para a quantidade de usuários
 */
export function getUserPriceRange(userCount: number): UserPriceRange {
  const range = USER_PRICE_RANGES.find(r => userCount >= r.minUsers && userCount <= r.maxUsers);
  return range || USER_PRICE_RANGES[USER_PRICE_RANGES.length - 1];
}

/**
 * Calcula preço mensal baseado no modelo escolhido
 */
export function calculateFlexibleMonthlyPrice(
  model: PricingModel,
  userCount: number,
  features: FeatureState,
  selectedTierId?: string
): number {
  let basePrice = 0;
  
  switch (model) {
    case "per_user": {
      // Preço por usuário com desconto progressivo
      const range = getUserPriceRange(userCount);
      basePrice = range.pricePerUser * userCount;
      break;
    }
    
    case "fixed_tier": {
      // Pacote fixo
      const tier = FIXED_TIERS.find(t => t.id === selectedTierId);
      basePrice = tier?.monthlyPrice || 400;
      break;
    }
    
    case "hybrid": {
      // Base fixa + usuários adicionais
      const additionalUsers = Math.max(0, userCount - HYBRID_PRICING.baseUsers);
      basePrice = HYBRID_PRICING.basePrice + (additionalUsers * HYBRID_PRICING.additionalUserPrice);
      break;
    }
  }
  
  // Adicionar custos de módulos extras
  if (features.ai) basePrice += FINANCIAL_RULES.AI_AGENT_COST;
  if (features.conversions) basePrice += FINANCIAL_RULES.CONVERSIONS_COST;
  
  // Garantir custo mínimo
  return Math.max(basePrice, FINANCIAL_RULES.MIN_MONTHLY_COST);
}

/**
 * Calcula custo interno (seu custo real)
 */
export function calculateInternalCostFlexible(userCount: number, features: FeatureState): number {
  let cost = 0;
  
  // Custo base por usuário (CRM incluso)
  if (features.crm) {
    cost += FINANCIAL_RULES.BASE_COST_PER_USER * userCount;
  }
  
  // Módulos adicionais
  if (features.ai) cost += FINANCIAL_RULES.AI_AGENT_COST;
  if (features.conversions) cost += FINANCIAL_RULES.CONVERSIONS_COST;
  
  return cost;
}

/**
 * Calcula lucro previsto
 */
export function calculateProfitFlexible(
  monthlyPrice: number,
  userCount: number,
  features: FeatureState
): { internalCost: number; profit: number; margin: number } {
  const internalCost = calculateInternalCostFlexible(userCount, features);
  const profit = monthlyPrice - internalCost;
  const margin = monthlyPrice > 0 ? Math.round((profit / monthlyPrice) * 100) : 0;
  
  return { internalCost, profit, margin };
}

/**
 * Valida se o preço cobre o custo mínimo
 */
export function validateMinimumPrice(monthlyPrice: number): { 
  isValid: boolean; 
  deficit: number; 
  message: string;
} {
  const minCost = FINANCIAL_RULES.MIN_MONTHLY_COST;
  const deficit = minCost - monthlyPrice;
  
  if (monthlyPrice >= minCost) {
    return { isValid: true, deficit: 0, message: "✅ Preço sustentável" };
  }
  
  return {
    isValid: false,
    deficit,
    message: `⚠️ Prejuízo de ${formatCurrency(deficit)}/mês - mínimo: ${formatCurrency(minCost)}`
  };
}

/**
 * Formata moeda
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

/**
 * Gera sugestão de preço ideal baseado no modelo
 */
export function getSuggestedPrice(
  model: PricingModel,
  userCount: number,
  features: FeatureState,
  targetMargin: number = 50 // margem alvo em %
): number {
  const internalCost = calculateInternalCostFlexible(userCount, features);
  const minPrice = FINANCIAL_RULES.MIN_MONTHLY_COST;
  const idealPrice = internalCost / (1 - targetMargin / 100);
  
  return Math.max(minPrice, Math.ceil(idealPrice / 10) * 10);
}

// ========================================
// FUNÇÕES LEGADAS (Retrocompatibilidade)
// ========================================

export function calculateDynamicSetup(features: FeatureState): number {
  let setup = FINANCIAL_RULES.MIN_SETUP;
  if (features.whatsapp && features.ai) {
    setup = FINANCIAL_RULES.SETUP_BASE_WA_AI;
  }
  if (features.crm) setup += FINANCIAL_RULES.SETUP_ADDON_PER_FEATURE;
  if (features.conversions) setup += FINANCIAL_RULES.SETUP_ADDON_PER_FEATURE;
  return Math.max(setup, FINANCIAL_RULES.MIN_SETUP);
}

export function calculateInternalCost(features: FeatureState, maxUsers: number): number {
  return calculateInternalCostFlexible(maxUsers, features);
}

export function calculateServicesTotal(selectedIds: string[]): number {
  if (!Array.isArray(selectedIds)) return 0;
  let total = 0;
  for (const id of selectedIds) {
    const svc = SERVICES_LIST.find(s => s.id === id && s.costType === 'fixed');
    if (svc) total += svc.cost;
  }
  return total;
}

export function calculateComplexityPercent(selectedIds: string[]): number {
  if (!Array.isArray(selectedIds)) return 0;
  let pct = 0;
  for (const id of selectedIds) {
    const svc = SERVICES_LIST.find(s => s.id === id && s.costType === 'percent');
    if (svc) pct += svc.cost;
  }
  return pct;
}

export function calculateFinalPrice(base: number, markupPct: number, complexityPct: number): number {
  const withMarkup = base * (1 + markupPct / 100);
  const withComplexity = withMarkup * (1 + complexityPct / 100);
  const finalPrice = Math.ceil(withComplexity / 10) * 10;
  
  // Garantir custo mínimo
  return Math.max(finalPrice, FINANCIAL_RULES.MIN_MONTHLY_COST);
}

export function calculateROI(inputs: ROIInputs) {
  const ticket = Math.max(0, inputs.ticketMedio || 0);
  const leads = Math.max(0, inputs.leadsPerMonth || 0);
  const rate = Math.max(0, Math.min(100, inputs.conversionRate || 0));
  const improvement = Math.max(0, inputs.improvementPercent || 0);
  
  const currentSales = leads * (rate / 100);
  const currentRevenue = currentSales * ticket;
  
  const newRate = rate * (1 + improvement / 100);
  const newSales = leads * (newRate / 100);
  const newRevenue = newSales * ticket;
  
  return {
    currentRevenue: Math.round(currentRevenue),
    newRevenue: Math.round(newRevenue),
    recoveredRevenue: Math.round(newRevenue - currentRevenue),
    newConversionRate: Math.round(newRate * 10) / 10,
  };
}

export function calculateProfit(model: PartnershipModel, salePrice: number, internalCost: number) {
  if (model === "whitelabel") {
    return { yourProfit: salePrice - internalCost, boltenFee: 0 };
  }
  return { yourProfit: salePrice * 0.70, boltenFee: salePrice * 0.30 };
}

export function calculateCumulativeProfit(
  setupCost: number,
  monthlyPrice: number,
  monthlyROI: number
): PaybackPoint[] {
  const setup = Math.max(FINANCIAL_RULES.MIN_SETUP, setupCost || FINANCIAL_RULES.MIN_SETUP);
  const price = Math.max(0, monthlyPrice || 0);
  const roi = Math.max(0, monthlyROI || 0);
  
  const points: PaybackPoint[] = [];
  let balance = -setup;
  
  for (let month = 0; month <= 12; month++) {
    if (month > 0) {
      balance += (roi - price);
    }
    points.push({
      month,
      balance: Math.round(balance),
      isPositive: balance >= 0,
    });
  }
  
  return points;
}

export function findPaybackMonth(points: PaybackPoint[]): number | null {
  const found = points.find(p => p.month > 0 && p.isPositive);
  return found?.month ?? null;
}

export function calculateYearlyProfit(points: PaybackPoint[]): number {
  if (!points || points.length === 0) return 0;
  return points[points.length - 1]?.balance || 0;
}
