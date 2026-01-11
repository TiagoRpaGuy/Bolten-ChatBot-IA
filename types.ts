/**
 * PROPOSAL CONFIGURATOR - TYPES v4.0
 * UX Refinement: Rich List Items + Tooltips
 */

// ========================================
// SYSTEM CONFIG
// ========================================
export const SYSTEM_CONFIG = {
  name: "CRM Partner",
  tagline: "Plataforma de Vendas Inteligente",
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
// FINANCIAL RULES
// ========================================
export const FINANCIAL_RULES = {
  SETUP_BASE_WA_AI: 500,
  SETUP_ADDON_PER_FEATURE: 150,
  MIN_SETUP: 500,
} as const;

// ========================================
// INTERNAL PRICING
// ========================================
export const INTERNAL_PRICING = {
  CRM_PER_USER: 20,
  AI_AGENT: 60,
  CONVERSIONS: 20,
} as const;

// ========================================
// BASIC TYPES
// ========================================
export type PlanLevel = "start" | "pro" | "enterprise";
export type ThemeMode = "light" | "dark";

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

// ========================================
// USER TIERS
// ========================================
export interface UserTier {
  id: string;
  label: string;
  maxUsers: number;
  linkedPlan: PlanLevel;
}

export const USER_TIERS: UserTier[] = [
  { id: "tier_5", label: "Até 5 usuários", maxUsers: 5, linkedPlan: "start" },
  { id: "tier_10", label: "Até 10 usuários", maxUsers: 10, linkedPlan: "start" },
  { id: "tier_20", label: "Até 20 usuários", maxUsers: 20, linkedPlan: "pro" },
  { id: "tier_30", label: "Até 30 usuários", maxUsers: 30, linkedPlan: "pro" },
  { id: "tier_50", label: "Até 50 usuários", maxUsers: 50, linkedPlan: "enterprise" },
  { id: "tier_100", label: "Até 100 usuários", maxUsers: 100, linkedPlan: "enterprise" },
];

export const PLAN_PRESETS: Record<PlanLevel, { tierId: string; features: FeatureState }> = {
  start: { tierId: "tier_5", features: { crm: true, whatsapp: true, ai: false, conversions: false } },
  pro: { tierId: "tier_20", features: { crm: true, whatsapp: true, ai: false, conversions: true } },
  enterprise: { tierId: "tier_50", features: { crm: true, whatsapp: true, ai: true, conversions: true } },
};

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
// PURE CALCULATION FUNCTIONS
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
  let cost = 0;
  if (features.crm) cost += INTERNAL_PRICING.CRM_PER_USER * maxUsers;
  if (features.ai) cost += INTERNAL_PRICING.AI_AGENT;
  if (features.conversions) cost += INTERNAL_PRICING.CONVERSIONS;
  return cost;
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
  return Math.ceil(withComplexity / 10) * 10;
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

/**
 * Gráfico de LUCRO ACUMULADO (Saldo do Cliente)
 * Mês 0: -Setup
 * Mês N: Anterior + (ROI Mensal - Mensalidade)
 */
export function calculateCumulativeProfit(
  setupCost: number,
  monthlyPrice: number,
  monthlyROI: number
): PaybackPoint[] {
  const setup = Math.max(500, setupCost || 500);
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
