/**
 * PROPOSAL CONFIGURATOR - TYPES
 * White Label + Value-Based Pricing + Technical Customization
 */

// ========================================
// WHITE LABEL CONFIGURATION
// ========================================
export const SYSTEM_CONFIG = {
  name: "CRM Partner",
  tagline: "Plataforma de Vendas Inteligente",
  primaryColor: "#2563eb",
} as const;

// ========================================
// FINANCIAL GUARDRAILS
// ========================================
export const FINANCIAL_RULES = {
  MIN_SETUP_VALUE: 500,
  VALUE_SHARE_PERCENTAGE: 10,
  HIGH_TICKET_THRESHOLD: 30,
  DEFAULT_CONVERSION_IMPROVEMENT: 20,
  MIN_CONVERSION_IMPROVEMENT: 5,
  MAX_CONVERSION_IMPROVEMENT: 50,
} as const;

// ========================================
// ENUMS & BASIC TYPES
// ========================================
export type PlanLevel = "start" | "pro" | "enterprise";
export type ThemeMode = "light" | "dark";
export type ActiveTab = "config" | "roi";
export type DomainOption = "default" | "custom";
export type BrandingOption = "standard" | "whitelabel";

// ========================================
// TECHNICAL CUSTOMIZATION OPTIONS
// ========================================
export interface TechnicalCustomization {
  domain: DomainOption;
  branding: BrandingOption;
}

export const DOMAIN_OPTIONS = [
  { id: "default", label: "Domínio Padrão da Agência", description: "Sem custo extra", cost: 0 },
  { id: "custom", label: "Domínio Personalizado", description: "URL exclusiva do cliente", cost: 200 },
];

export const BRANDING_OPTIONS = [
  { id: "standard", label: "Layout Padrão", description: "Interface padrão do sistema", cost: 0 },
  { id: "whitelabel", label: "White Label Completo", description: "Cores e logo do cliente", cost: 500 },
];

// ========================================
// USER TIERS
// ========================================
export interface UserTier {
  id: string;
  label: string;
  minUsers: number;
  maxUsers: number;
  linkedPlan: PlanLevel;
}

export const USER_TIERS: UserTier[] = [
  { id: "tier_5", label: "Até 5 usuários", minUsers: 1, maxUsers: 5, linkedPlan: "start" },
  { id: "tier_10", label: "Até 10 usuários", minUsers: 6, maxUsers: 10, linkedPlan: "start" },
  { id: "tier_20", label: "Até 20 usuários", minUsers: 11, maxUsers: 20, linkedPlan: "pro" },
  { id: "tier_30", label: "Até 30 usuários", minUsers: 21, maxUsers: 30, linkedPlan: "pro" },
  { id: "tier_50", label: "Até 50 usuários", minUsers: 31, maxUsers: 50, linkedPlan: "enterprise" },
  { id: "tier_unlimited", label: "Ilimitado", minUsers: 51, maxUsers: 999, linkedPlan: "enterprise" },
];

// ========================================
// PLAN PRESETS
// ========================================
export interface PlanPreset {
  tierId: string;
  features: Partial<FeatureState>;
  description: string;
}

export const PLAN_PRESETS: Record<PlanLevel, PlanPreset> = {
  start: { tierId: "tier_5", features: { crm: true, whatsapp: true, ai: false, conversions: false }, description: "Pequenas equipes" },
  pro: { tierId: "tier_20", features: { crm: true, whatsapp: true, ai: false, conversions: true }, description: "Times em crescimento" },
  enterprise: { tierId: "tier_50", features: { crm: true, whatsapp: true, ai: true, conversions: true }, description: "Solução completa" },
};

// ========================================
// PRICING
// ========================================
export const INTERNAL_PRICING = {
  CRM_PER_USER: 20.0,
  AI_AGENT: 60.0,
  CONVERSIONS: 20.0,
  WHATSAPP: 0.0,
} as const;

// ========================================
// COMPLEXITY FACTORS
// ========================================
export interface ComplexityFactor {
  id: string;
  label: string;
  percentage: number;
  description: string;
}

export const COMPLEXITY_FACTORS: ComplexityFactor[] = [
  { id: "presencial", label: "Reuniões Presenciais", percentage: 10, description: "Atendimento presencial" },
  { id: "urgencia", label: "Urgência na Entrega", percentage: 15, description: "Prazo reduzido" },
  { id: "suporte", label: "Suporte Estendido", percentage: 20, description: "SLA premium 24h" },
];

// ========================================
// SERVICES
// ========================================
export interface ServiceInfo {
  cost: number;
  label: string;
  description: string;
  icon: string;
  required?: boolean;
}

export const SERVICE_DETAILS: Record<string, ServiceInfo> = {
  onboarding: { cost: 500, label: "Setup Técnico", description: "Configuração inicial obrigatória", icon: "rocket_launch", required: true },
  training: { cost: 1500, label: "Treinamento", description: "2h de call + materiais", icon: "school" },
  migration: { cost: 1000, label: "Migração de Dados", description: "Importação completa", icon: "database" },
};

export const SERVICE_COSTS = {
  onboarding: SERVICE_DETAILS.onboarding.cost,
  training: SERVICE_DETAILS.training.cost,
  migration: SERVICE_DETAILS.migration.cost,
} as const;

// ========================================
// TOOLTIPS
// ========================================
export const FEATURE_TOOLTIPS: Record<string, { title: string; description: string }> = {
  crm: { title: "CRM & Pipeline", description: "Gestão completa de leads e oportunidades." },
  whatsapp: { title: "WhatsApp Oficial", description: "API oficial do WhatsApp Business." },
  ai: { title: "Agente de IA", description: "Assistente virtual 24/7. Requer WhatsApp." },
  conversions: { title: "Conversões", description: "Rastreamento e attribution." },
};

export const SERVICE_TOOLTIPS: Record<string, { title: string; description: string }> = {
  onboarding: { title: "Setup Técnico", description: "Configuração obrigatória do ambiente." },
  training: { title: "Treinamento", description: "Sessão de 2h com gravação." },
  migration: { title: "Migração", description: "Importação dos dados atuais." },
};

export const ROI_TOOLTIPS: Record<string, { title: string; description: string }> = {
  ticketMedio: { title: "Ticket Médio", description: "Valor médio de cada venda." },
  leadsPerMonth: { title: "Leads/Mês", description: "Oportunidades mensais." },
  currentConversionRate: { title: "Taxa Atual", description: "% de leads que viram clientes." },
  conversionImprovement: { title: "Melhoria Estimada", description: "Aumento esperado na conversão." },
};

// ========================================
// TUTORIAL
// ========================================
export const TUTORIAL_STEPS = [
  { icon: "tune", title: "Configure a Infraestrutura", description: "Selecione plano e funcionalidades." },
  { icon: "insights", title: "Prove o Valor com ROI", description: "Use a calculadora de retorno." },
  { icon: "calculate", title: "Ajuste a Margem", description: "Configure margem e complexidade." },
  { icon: "picture_as_pdf", title: "Exporte o PDF", description: "Gere o link e exporte." },
];

// ========================================
// STATE INTERFACES
// ========================================
export interface ClientData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  sector: string;
  origin: string;
}

export interface FeatureState {
  crm: boolean;
  whatsapp: boolean;
  ai: boolean;
  conversions: boolean;
}

export interface ServiceState {
  onboarding: boolean;
  training: boolean;
  migration: boolean;
}

export interface ComplexityState {
  presencial: boolean;
  urgencia: boolean;
  suporte: boolean;
}

export interface PricingConfig {
  baseCost: number;
  markupPercentage: number;
  complexityFactors: ComplexityState;
  manualOverride: number | null;
  stripeCheckoutUrl?: string;
}

export interface ROIInputs {
  ticketMedio: number;
  leadsPerMonth: number;
  currentConversionRate: number;
  conversionImprovement: number;
}

export interface ROIOutputs {
  currentRevenue: number;
  projectedRevenue: number;
  recoveredRevenue: number;
  conversionLift: number;
  newConversionRate: number;
}

export interface ValuePricingResult {
  costPlusPrice: number;
  valueSuggestedPrice: number;
  isHighTicketOpportunity: boolean;
  priceDifferencePercent: number;
}

// J-Curve Timeline Data
export interface JCurvePoint {
  month: number;
  label: string;
  cumulativeValue: number;
  isPositive: boolean;
}

export interface ProposalData {
  proposalId: string;
  createdAt: string;
  validUntil: string;
  client: ClientData;
  plan: PlanLevel;
  selectedTierId: string;
  userCount: number;
  features: FeatureState;
  services: ServiceState;
  technicalCustomization: TechnicalCustomization;
  pricing: PricingConfig;
  roiInputs?: ROIInputs;
  roiOutputs?: ROIOutputs;
  valuePricing?: ValuePricingResult;
  calculations: {
    setupTotal: number;
    monthlyRecurring: number;
    finalPrice: number;
  };
}

// ========================================
// HELPER FUNCTIONS
// ========================================
export const calculateInternalCost = (features: FeatureState, tierMaxUsers: number): number => {
  let cost = 0;
  if (features.crm) cost += INTERNAL_PRICING.CRM_PER_USER * Math.min(tierMaxUsers, 100);
  if (features.ai && features.whatsapp) cost += INTERNAL_PRICING.AI_AGENT;
  if (features.conversions) cost += INTERNAL_PRICING.CONVERSIONS;
  return cost;
};

export const calculateServicesTotal = (services: ServiceState): number => {
  let total = 0;
  if (services.onboarding) total += SERVICE_COSTS.onboarding;
  if (services.training) total += SERVICE_COSTS.training;
  if (services.migration) total += SERVICE_COSTS.migration;
  return Math.max(total, FINANCIAL_RULES.MIN_SETUP_VALUE);
};

export const calculateCustomizationCost = (customization: TechnicalCustomization): number => {
  let cost = 0;
  const domain = DOMAIN_OPTIONS.find(d => d.id === customization.domain);
  const branding = BRANDING_OPTIONS.find(b => b.id === customization.branding);
  if (domain) cost += domain.cost;
  if (branding) cost += branding.cost;
  return cost;
};

export const calculateComplexityMultiplier = (factors: ComplexityState): number => {
  let multiplier = 0;
  COMPLEXITY_FACTORS.forEach(f => {
    if (factors[f.id as keyof ComplexityState]) multiplier += f.percentage;
  });
  return multiplier;
};

export const calculateFinalPrice = (baseCost: number, markupPercent: number, complexityMultiplier: number): number => {
  const withMarkup = baseCost * (1 + markupPercent / 100);
  const withComplexity = withMarkup * (1 + complexityMultiplier / 100);
  return Math.ceil(withComplexity / 10) * 10;
};

export const calculateROI = (inputs: ROIInputs): ROIOutputs => {
  const { ticketMedio, leadsPerMonth, currentConversionRate, conversionImprovement } = inputs;
  const currentSales = leadsPerMonth * (currentConversionRate / 100);
  const currentRevenue = currentSales * ticketMedio;
  const newConversionRate = currentConversionRate * (1 + conversionImprovement / 100);
  const projectedSales = leadsPerMonth * (newConversionRate / 100);
  const projectedRevenue = projectedSales * ticketMedio;
  return { currentRevenue, projectedRevenue, recoveredRevenue: projectedRevenue - currentRevenue, conversionLift: conversionImprovement, newConversionRate };
};

export const calculateValuePricing = (costPlusPrice: number, recoveredRevenue: number): ValuePricingResult => {
  const valueSuggestedPrice = Math.ceil((recoveredRevenue * FINANCIAL_RULES.VALUE_SHARE_PERCENTAGE / 100) / 10) * 10;
  const priceDifferencePercent = costPlusPrice > 0 ? Math.round(((valueSuggestedPrice - costPlusPrice) / costPlusPrice) * 100) : 0;
  return { costPlusPrice, valueSuggestedPrice, isHighTicketOpportunity: priceDifferencePercent > FINANCIAL_RULES.HIGH_TICKET_THRESHOLD, priceDifferencePercent };
};

// J-Curve Calculator: ROI Timeline over 12 months
export const calculateJCurve = (setupCost: number, monthlySoftwareCost: number, monthlyRecoveredRevenue: number): JCurvePoint[] => {
  const points: JCurvePoint[] = [];
  let cumulative = -setupCost; // Mês 0: Apenas o custo de setup (negativo)
  
  for (let month = 0; month <= 12; month++) {
    if (month === 0) {
      points.push({ month, label: 'Mês 0', cumulativeValue: cumulative, isPositive: cumulative >= 0 });
    } else {
      // Cada mês: adiciona receita recuperada e subtrai custo do software
      const netMonthly = monthlyRecoveredRevenue - monthlySoftwareCost;
      cumulative += netMonthly;
      points.push({ month, label: `Mês ${month}`, cumulativeValue: cumulative, isPositive: cumulative >= 0 });
    }
  }
  return points;
};

export const findPaybackMonth = (jCurveData: JCurvePoint[]): number | null => {
  const paybackPoint = jCurveData.find((point, index) => index > 0 && point.isPositive);
  return paybackPoint ? paybackPoint.month : null;
};

export const generateProposalId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `PROP-${timestamp}-${random}`.toUpperCase();
};
