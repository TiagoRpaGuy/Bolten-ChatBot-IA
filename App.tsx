import React, { useState, useMemo, useCallback } from 'react';
import {
  PlanLevel, ClientData, FeatureState, ThemeMode, PartnershipModel, ROIInputs, PaybackPoint,
  USER_TIERS, UserTier, SERVICES_LIST, ServiceItem, INTERNAL_PRICING, PLAN_PRESETS, SYSTEM_CONFIG,
  PARTNERSHIP_MODELS, FEATURE_TOOLTIPS, ROI_TOOLTIPS, PRICE_TOOLTIPS,
  calculateDynamicSetup, calculateInternalCost, calculateServicesTotal, calculateComplexityPercent,
  calculateFinalPrice, calculateROI, calculateProfit, calculateCumulativeProfit, findPaybackMonth, calculateYearlyProfit,
  // Sistema flexível
  PricingModel, PRICING_MODELS, USER_PRICE_RANGES, FIXED_TIERS, HYBRID_PRICING, FINANCIAL_RULES,
  getUserPriceRange, calculateFlexibleMonthlyPrice, calculateInternalCostFlexible, 
  calculateProfitFlexible, validateMinimumPrice, getSuggestedPrice, PRICING_MODEL_TOOLTIPS,
  // Onboarding e Explicações
  ONBOARDING_TIPS, generateROIExplanation, generateCostBreakdown,
  // Sales Wizard
  CalculatorPreset,
} from './types';
import SalesWizard from './SalesWizard';

// ========================================
// UTILITIES
// ========================================
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

// ========================================
// TOOLTIP COMPONENT (RETORNADO)
// ========================================
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center gap-1">
      {children}
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="size-4 rounded-full bg-slate-400 hover:bg-blue-500 text-white text-[9px] flex items-center justify-center transition-colors"
      >
        ?
      </button>
      {show && (
        <span className="absolute z-50 bottom-full left-0 mb-2 w-52 p-2.5 bg-slate-900 text-white text-[11px] rounded-lg shadow-xl leading-relaxed animate-fadeIn">
          {text}
        </span>
      )}
    </span>
  );
};

// ========================================
// ONBOARDING TIP COMPONENT
// ========================================
interface OnboardingTipProps {
  tipKey: 'config' | 'pricing' | 'roi';
  isVisible: boolean;
  onToggle: () => void;
  isDark: boolean;
}

const OnboardingTip: React.FC<OnboardingTipProps> = ({ tipKey, isVisible, onToggle, isDark }) => {
  const tip = ONBOARDING_TIPS[tipKey];
  
  return (
    <div className={`rounded-xl border transition-all ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-blue-50/50 border-blue-100'}`}>
      <button
        onClick={onToggle}
        className={`w-full px-3 py-2 flex items-center justify-between text-left ${isDark ? 'text-slate-300' : 'text-blue-700'}`}
      >
        <span className="font-semibold text-sm">{tip.title}</span>
        <span className="material-symbols-outlined text-sm transition-transform" style={{ transform: isVisible ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          expand_more
        </span>
      </button>
      {isVisible && (
        <div className="px-3 pb-3 animate-fadeIn">
          <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-blue-600'}`}>{tip.description}</p>
          <ul className="space-y-1">
            {tip.tips.map((t, i) => (
              <li key={i} className={`text-[10px] flex items-start gap-1.5 ${isDark ? 'text-slate-500' : 'text-blue-500'}`}>
                <span className="text-blue-400">•</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ========================================
// PRICE MODE TOGGLE (Auto/Manual)
// ========================================
interface PriceModeToggleProps {
  isAuto: boolean;
  onToggle: () => void;
  isDark: boolean;
}

const PriceModeToggle: React.FC<PriceModeToggleProps> = ({ isAuto, onToggle, isDark }) => (
  <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
    <div>
      <p className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
        Modo de Precificação
      </p>
      <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
        {isAuto ? 'Preços calculados automaticamente' : 'Você define os valores manualmente'}
      </p>
    </div>
    <button
      onClick={onToggle}
      className={`relative w-16 h-8 rounded-full transition-colors ${isAuto ? 'bg-blue-600' : 'bg-orange-500'}`}
    >
      <span
        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all flex items-center justify-center ${isAuto ? 'left-1' : 'right-1'}`}
      >
        <span className="material-symbols-outlined text-xs" style={{ color: isAuto ? '#2563eb' : '#f97316' }}>
          {isAuto ? 'auto_fix_high' : 'edit'}
        </span>
      </span>
    </button>
  </div>
);
// ========================================
// RICH SERVICE LIST ITEM
// ========================================
interface ServiceListItemProps {
  item: ServiceItem;
  isSelected: boolean;
  onToggle: () => void;
  isDark: boolean;
}

const ServiceListItem: React.FC<ServiceListItemProps> = ({ item, isSelected, onToggle, isDark }) => {
  const isPercent = item.costType === 'percent';
  
  return (
    <div
      onClick={item.required ? undefined : onToggle}
      className={`relative p-3 rounded-xl border transition-all ${
        item.required ? 'cursor-default' : 'cursor-pointer hover:shadow-md'
      } ${
        isSelected
          ? 'border-blue-500 bg-blue-500/10'
          : isDark
            ? 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="pt-0.5">
          <input
            type="checkbox"
            checked={isSelected}
            disabled={item.required}
            readOnly
            className="w-4 h-4 accent-blue-600 rounded"
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-semibold text-sm ${isSelected ? 'text-blue-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
              {item.label}
            </span>
            {item.required && (
              <span className="text-[8px] bg-orange-500 text-white px-1.5 py-0.5 rounded font-bold">
                OBRIGATÓRIO
              </span>
            )}
          </div>
          <p className={`text-[11px] mt-0.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            {item.description}
          </p>
        </div>
        
        {/* Price */}
        <div className="text-right flex-shrink-0">
          <span className={`font-bold font-mono text-sm ${isPercent ? 'text-green-500' : 'text-orange-500'}`}>
            {isPercent ? `+${item.cost}%` : fmt(item.cost)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ========================================
// CUMULATIVE PROFIT CHART (CSS NATIVO)
// ========================================
interface CumulativeProfitChartProps {
  data: PaybackPoint[];
  paybackMonth: number | null;
  yearlyProfit: number;
  isDark: boolean;
}

const CumulativeProfitChart: React.FC<CumulativeProfitChartProps> = ({ data, paybackMonth, yearlyProfit, isDark }) => {
  if (!data || data.length === 0 || data.every(p => p.balance === 0)) {
    return (
      <div className={`p-4 rounded-xl h-48 flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
        <p className={`text-sm text-center ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Preencha os dados de ROI<br/>para visualizar o gráfico
        </p>
      </div>
    );
  }
  
  const maxAbs = Math.max(...data.map(p => Math.abs(p.balance)), 1);
  
  return (
    <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
      {/* LEGENDA GRANDE */}
      <div className={`text-center p-3 mb-3 rounded-lg ${isDark ? 'bg-slate-600' : 'bg-white border border-gray-200'}`}>
        <p className={`text-[11px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Acumulação de Lucro (12 meses)
        </p>
        <p className={`text-sm mt-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          {paybackMonth !== null ? (
            <>
              Seu projeto <strong className="text-green-500">se paga no Mês {paybackMonth}</strong> e gera{' '}
              <strong className={yearlyProfit >= 0 ? 'text-green-500' : 'text-red-500'}>
                {fmt(yearlyProfit)}
              </strong>{' '}
              de {yearlyProfit >= 0 ? 'lucro' : 'prejuízo'} no primeiro ano.
            </>
          ) : (
            <>
              Com os valores atuais, o <strong className="text-red-500">projeto não se paga</strong> nos primeiros 12 meses.
            </>
          )}
        </p>
      </div>
      
      {/* Chart */}
      <div className="relative h-32">
        {/* Zero Line */}
        <div className={`absolute left-0 right-0 top-1/2 h-px ${isDark ? 'bg-slate-500' : 'bg-gray-300'}`}>
          <span className={`absolute left-0 -translate-y-1/2 text-[8px] ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
            R$ 0
          </span>
        </div>
        
        {/* Bars */}
        <div className="absolute inset-0 flex items-center justify-around px-6">
          {data.map((point, i) => {
            const heightPct = Math.max(8, (Math.abs(point.balance) / maxAbs) * 48);
            const isPayback = point.month === paybackMonth;
            return (
              <div key={i} className="flex flex-col items-center" style={{ flex: 1, maxWidth: 28 }}>
                <div className="relative h-full flex items-center justify-center" style={{ height: 120 }}>
                  <div
                    className={`rounded-sm transition-all ${
                      isPayback ? 'ring-2 ring-yellow-400 ring-offset-1' : ''
                    } ${
                      point.isPositive
                        ? 'bg-gradient-to-t from-green-600 to-green-400'
                        : 'bg-gradient-to-b from-red-500 to-red-400'
                    }`}
                    style={{
                      width: '80%',
                      height: `${heightPct}%`,
                      position: 'absolute',
                      [point.isPositive ? 'bottom' : 'top']: '50%',
                    }}
                    title={`Mês ${point.month}: ${fmt(point.balance)}`}
                  />
                </div>
                <span className={`text-[8px] ${isPayback ? 'font-bold text-yellow-500' : isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  {point.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex justify-between mt-2 text-[9px]">
        <span className="text-red-500">← Investimento</span>
        <span className="text-green-500">Lucro →</span>
      </div>
    </div>
  );
};

// ========================================
// A4 PROPOSAL PAGE (VERSÃO RICA)
// ========================================
interface A4ProposalProps {
  client: ClientData;
  plan: PlanLevel;
  tier: UserTier;
  features: FeatureState;
  selectedServices: string[];
  setupTotal: number;
  monthlyPrice: number;
  roiRecovered: number;
  paybackData: PaybackPoint[];
  paybackMonth: number | null;
  yearlyProfit: number;
  baseCost: number;
  onClose: () => void;
}

// Preços unitários das funcionalidades para exibição
const FEATURE_PRICES = {
  crm: { name: 'CRM & Pipeline de Vendas', description: 'Gestão completa de leads, funil e acompanhamento', monthly: null, perUser: 20 },
  whatsapp: { name: 'WhatsApp Business API', description: 'Mensagens automáticas e atendimento integrado', monthly: 0, perUser: null },
  ai: { name: 'Agente de IA 24/7', description: 'Qualificação automática e respostas inteligentes', monthly: 60, perUser: null },
  conversions: { name: 'Gestão de Conversões', description: 'Tracking avançado e attribution de vendas', monthly: 20, perUser: null },
};

// Chave PIX configurada
const PIX_KEY = '45358113000100';
const PIX_KEY_FORMATTED = '45.358.113/0001-00'; // CNPJ formatado para exibição

const A4Proposal: React.FC<A4ProposalProps> = ({
  client, plan, tier, features, selectedServices, setupTotal, monthlyPrice, 
  roiRecovered, paybackData, paybackMonth, yearlyProfit, baseCost, onClose
}) => {
  const handlePrint = () => window.print();
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  
  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3000);
    } catch (err) {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = PIX_KEY;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3000);
    }
  };
  
  // Calcular investimento total no primeiro ano
  const yearlyInvestment = setupTotal + (monthlyPrice * 12);
  const yearlyROI = roiRecovered * 12;
  const roiPercentage = yearlyInvestment > 0 ? Math.round((yearlyROI / yearlyInvestment) * 100) : 0;
  
  // Calcular preço de cada feature para exibição
  const getFeaturePrice = (key: string): string => {
    const fp = FEATURE_PRICES[key as keyof typeof FEATURE_PRICES];
    if (!fp) return '-';
    if (fp.perUser) return `R$ ${fp.perUser}/usuário`;
    if (fp.monthly) return fmt(fp.monthly);
    return 'Incluso';
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-gray-300 overflow-auto p-4">
      {/* Controls - Fora da área de impressão */}
      <div className="max-w-[210mm] mx-auto mb-4 flex justify-end gap-2 no-print-button">
        <button onClick={handlePrint} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg">
          <span className="material-symbols-outlined">print</span> Imprimir / Salvar PDF
        </button>
        <button onClick={onClose} className="px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium">
          Fechar
        </button>
      </div>
      
      {/* PÁGINA 1 - A4 */}
      <div className="a4-page shadow-2xl mb-8">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white p-8 -m-[15mm] mb-8 print-no-break">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] opacity-75 mb-2">Proposta Comercial</p>
              <h1 className="text-3xl font-bold">{client.companyName || 'Sua Empresa'}</h1>
              <p className="text-sm mt-2 opacity-90">Preparado para: {client.contactName || 'Cliente'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] opacity-75">Data de emissão</p>
              <p className="font-bold">{new Date().toLocaleDateString('pt-BR')}</p>
              <p className="text-[10px] mt-2 opacity-75">Validade</p>
              <p className="font-medium">15 dias</p>
            </div>
          </div>
        </div>
        
        {/* SEÇÃO: SOLUÇÃO PROPOSTA */}
        <div className="mb-6 print-no-break">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm">1</span>
            Solução Proposta
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Plano <strong className="text-blue-600">{plan.charAt(0).toUpperCase() + plan.slice(1)}</strong> com 
            capacidade para <strong>{tier.label}</strong>.
          </p>
          
          {/* TABELA DE FUNCIONALIDADES (SEM PREÇOS) */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-700 w-1/3">Funcionalidade</th>
                  <th className="text-left p-3 font-semibold text-gray-700">O que está incluso</th>
                  <th className="text-center p-3 font-semibold text-gray-700 w-24">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(features).map(([key, isActive], idx) => {
                  const fp = FEATURE_PRICES[key as keyof typeof FEATURE_PRICES];
                  return (
                    <tr key={key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-3 font-medium text-gray-900">{fp?.name || key}</td>
                      <td className="p-3 text-gray-600 text-sm">{fp?.description || '-'}</td>
                      <td className="p-3 text-center">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                            ✓ Incluso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-xs">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* SEÇÃO: IMPLEMENTAÇÃO E SERVIÇOS */}
        <div className="mb-6 print-no-break">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center text-sm">2</span>
            O que está incluso na Implementação
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            {SERVICES_LIST.filter(s => selectedServices.includes(s.id) && s.costType === 'fixed').map((svc) => (
              <div key={svc.id} className="bg-gray-50 p-4 rounded-lg flex items-start gap-3 border border-gray-100">
                <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✓</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{svc.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{svc.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* SEÇÃO: INVESTIMENTO */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 rounded-xl print-no-break">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">3</span>
            Resumo do Investimento
          </h2>
          
          <div className="grid grid-cols-3 gap-4">
            {/* Setup */}
            <div className="bg-orange-500/20 p-4 rounded-xl text-center">
              <p className="text-[10px] uppercase tracking-wider text-orange-300 font-bold mb-1">Taxa de Adesão</p>
              <p className="text-2xl font-bold text-orange-400">{fmt(setupTotal)}</p>
              <p className="text-[9px] text-orange-200 mt-1">pagamento único</p>
            </div>
            
            {/* Mensal */}
            <div className="bg-blue-500/20 p-4 rounded-xl text-center">
              <p className="text-[10px] uppercase tracking-wider text-blue-300 font-bold mb-1">Mensalidade</p>
              <p className="text-2xl font-bold text-blue-400">{fmt(monthlyPrice)}</p>
              <p className="text-[9px] text-blue-200 mt-1">por mês</p>
            </div>
            
            {/* Total Ano */}
            <div className="bg-green-500/20 p-4 rounded-xl text-center">
              <p className="text-[10px] uppercase tracking-wider text-green-300 font-bold mb-1">Total 1º Ano</p>
              <p className="text-2xl font-bold text-green-400">{fmt(yearlyInvestment)}</p>
              <p className="text-[9px] text-green-200 mt-1">investimento total</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* PÁGINA 2 - ROI E PROJEÇÃO */}
      <div className="a4-page shadow-2xl">
        {/* HEADER PÁGINA 2 */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 -m-[15mm] mb-8 print-no-break">
          <h2 className="text-2xl font-bold">Projeção de Retorno sobre Investimento</h2>
          <p className="text-sm opacity-90 mt-1">Análise financeira baseada nos dados informados</p>
        </div>
        
        {/* MÉTRICAS DE ROI */}
        <div className="grid grid-cols-4 gap-3 mb-6 print-no-break">
          <div className="bg-blue-50 p-4 rounded-xl text-center">
            <p className="text-[9px] uppercase text-blue-600 font-bold">Investimento 1º Ano</p>
            <p className="text-xl font-bold text-blue-700 mt-1">{fmt(yearlyInvestment)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl text-center">
            <p className="text-[9px] uppercase text-green-600 font-bold">Receita Recuperada/Ano</p>
            <p className="text-xl font-bold text-green-700 mt-1">{fmt(yearlyROI)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl text-center">
            <p className="text-[9px] uppercase text-purple-600 font-bold">ROI Estimado</p>
            <p className="text-xl font-bold text-purple-700 mt-1">{roiPercentage}%</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-xl text-center">
            <p className="text-[9px] uppercase text-orange-600 font-bold">Payback</p>
            <p className="text-xl font-bold text-orange-700 mt-1">
              {paybackMonth !== null ? `Mês ${paybackMonth}` : 'N/A'}
            </p>
          </div>
        </div>
        
        {/* GRÁFICO DE ROI - CSS NATIVO */}
        <div className="mb-6 print-no-break">
          <h3 className="text-base font-bold text-gray-900 mb-3">Evolução do Saldo (12 meses)</h3>
          
          {paybackData && paybackData.length > 0 ? (
            <div className="bg-gray-50 p-6 rounded-xl">
              {/* Legenda contextual */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 text-center">
                {paybackMonth !== null && yearlyProfit > 0 ? (
                  <p className="text-sm text-gray-700">
                    Seu projeto <strong className="text-green-600">se paga no Mês {paybackMonth}</strong> e gera 
                    <strong className="text-green-600"> {fmt(yearlyProfit)}</strong> de lucro líquido no primeiro ano.
                  </p>
                ) : (
                  <p className="text-sm text-gray-700">
                    {roiRecovered > monthlyPrice 
                      ? 'O retorno mensal supera a mensalidade, gerando lucro progressivo.'
                      : 'Ajuste os valores de ROI para visualizar a projeção de payback.'}
                  </p>
                )}
              </div>
              
              {/* Chart */}
              <div className="relative h-40 flex items-end justify-around gap-1 pt-8">
                {/* Zero line label */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 bg-gray-50 pr-2">R$ 0</div>
                
                {/* Zero line */}
                <div className="absolute left-8 right-0 top-1/2 h-px bg-gray-300" />
                
                {/* Bars */}
                {paybackData.map((point, idx) => {
                  const maxAbs = Math.max(...paybackData.map(p => Math.abs(p.balance)), 1);
                  const heightPct = Math.max(8, (Math.abs(point.balance) / maxAbs) * 45);
                  const isPayback = point.month === paybackMonth;
                  
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1">
                      <div className="relative h-32 flex items-center justify-center w-full">
                        <div
                          className={`absolute w-4/5 rounded-sm transition-all ${
                            isPayback ? 'ring-2 ring-yellow-400 ring-offset-1' : ''
                          } ${
                            point.isPositive 
                              ? 'bg-gradient-to-t from-green-600 to-green-400'
                              : 'bg-gradient-to-b from-red-500 to-red-400'
                          }`}
                          style={{
                            height: `${heightPct}%`,
                            [point.isPositive ? 'bottom' : 'top']: '50%',
                          }}
                        />
                      </div>
                      <span className={`text-[9px] font-medium ${isPayback ? 'text-yellow-600 font-bold' : 'text-gray-500'}`}>
                        M{point.month}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-between text-[9px] mt-2 text-gray-500">
                <span className="text-red-500">← Investimento</span>
                <span className="text-green-500">Lucro →</span>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 p-8 rounded-xl text-center text-gray-500">
              Configure os dados de ROI para visualizar o gráfico de projeção.
            </div>
          )}
        </div>
        
        {/* BENEFÍCIOS */}
        <div className="mb-6 print-no-break">
          <h3 className="text-base font-bold text-gray-900 mb-3">Por que escolher nossa solução?</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '⚡', title: 'Implementação Rápida', text: 'Sistema operacional em até 72h após aprovação' },
              { icon: '🔒', title: 'Dados Seguros', text: 'Infraestrutura em nuvem com backup automático' },
              { icon: '📈', title: 'Resultados Comprovados', text: 'Clientes reportam aumento médio de 30% em conversões' },
              { icon: '🎯', title: 'Suporte Dedicado', text: 'Equipe especializada para dúvidas e otimizações' },
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg flex gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{item.title}</p>
                  <p className="text-gray-500 text-xs">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* PRÓXIMOS PASSOS */}
        <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl print-no-break">
          <h3 className="font-bold text-blue-900 mb-3">Próximos Passos</h3>
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
              <span className="text-gray-700"><strong>Aprovação:</strong> Confirme esta proposta via e-mail ou assinatura digital</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
              <span className="text-gray-700"><strong>Kickoff:</strong> Reunião de alinhamento e coleta de informações</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
              <span className="text-gray-700"><strong>Go-live:</strong> Sistema configurado e equipe treinada em até 7 dias</span>
            </li>
          </ol>
        </div>
        
        {/* CTA - PAGAMENTO PIX */}
        <div className="mt-6 bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-xl text-center no-print-button print-no-break">
          <h3 className="text-white text-lg font-bold mb-2">Pronto para começar?</h3>
          <p className="text-green-100 text-sm mb-4">
            Clique abaixo para realizar o pagamento via PIX.
          </p>
          <button
            onClick={() => setShowPixModal(true)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-green-600 font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            {/* Ícone PIX */}
            <svg className="w-6 h-6" viewBox="0 0 512 512" fill="currentColor">
              <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 488.6C280.3 518.1 231.1 518.1 200.8 488.6L103.3 391.2H112.6C132.6 391.2 151.5 383.4 165.7 369.2L242.4 292.5zM262.5 218.9C257.1 224.4 247.9 224.5 242.4 218.9L165.7 142.2C151.5 128 132.6 120.2 112.6 120.2H103.3L200.7 22.76C231.1-7.586 280.3-7.586 310.6 22.76L407.8 119.9H392.6C372.6 119.9 353.7 127.7 339.5 141.9L262.5 218.9zM112.6 142.7C126.4 142.7 139.1 148.3 149.7 158.1L226.4 234.8C233.6 241.1 243 245.6 252.5 245.6C ## 245.6 271.2 241.1 278.4 234.8L201.8 311.4C## 349.2 139.1 368.2 126.4 368.2 112.6V112.6C368.2 112.6 368.2 112.6 368.2 112.6L464 112.6C476.7 112.6 489.1 117.8 498.2 127C507.4 136.1 512.6 148.5 512.6 161.3V161.3C512.6 174 507.4 186.5 498.2 195.6L399.1 294.8C399.1 294.8 399.1 294.8 399.1 294.8L399.1 294.8V294.8C386.4 294.8 374 289.6 364.8 280.4L288.2 203.8C278.1 194.6 265.7 189.4 252.5 189.4c-13.2 0-25.6 5.1-34.8 14.4L141 280.4C131.8 289.6 119.4 294.8 106.7 294.8v0l0 0H48C21.5 294.8 0 273.3 0 246.8v-85.6C0 134.7 21.5 113.2 48 113.2l64.6 0V142.7H112.6z"/>
            </svg>
            Contratar Agora - {fmt(setupTotal)}
          </button>
          <p className="text-green-200 text-[10px] mt-3">
            Pagamento instantâneo via PIX • Confirmação imediata
          </p>
        </div>
        
        {/* MODAL PIX */}
        {showPixModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn no-print-button">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-500 to-green-500 p-6 text-center">
                <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center mb-3">
                  <svg className="w-10 h-10 text-teal-500" viewBox="0 0 512 512" fill="currentColor">
                    <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 488.6C280.3 518.1 231.1 518.1 200.8 488.6L103.3 391.2H112.6C132.6 391.2 151.5 383.4 165.7 369.2L242.4 292.5zM262.5 218.9C257.1 224.4 247.9 224.5 242.4 218.9L165.7 142.2C151.5 128 132.6 120.2 112.6 120.2H103.3L200.7 22.76C231.1-7.586 280.3-7.586 310.6 22.76L407.8 119.9H392.6C372.6 119.9 353.7 127.7 339.5 141.9L262.5 218.9z"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">Pagamento via PIX</h3>
                <p className="text-green-100 text-sm mt-1">Copie a chave e realize o pagamento</p>
              </div>
              
              {/* Body */}
              <div className="p-6">
                {/* Valor */}
                <div className="text-center mb-6">
                  <p className="text-gray-500 text-sm">Valor total a pagar</p>
                  <p className="text-3xl font-bold text-gray-900">{fmt(setupTotal)}</p>
                  <p className="text-xs text-gray-400 mt-1">Taxa de adesão (Setup inicial)</p>
                </div>
                
                {/* Chave PIX */}
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 mb-4">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-2 text-center">Chave PIX (CNPJ)</p>
                  <p className="text-xl font-mono font-bold text-center text-gray-900 tracking-wide">
                    {PIX_KEY_FORMATTED}
                  </p>
                </div>
                
                {/* Botão Copiar */}
                <button
                  onClick={handleCopyPix}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                    pixCopied
                      ? 'bg-green-500 text-white'
                      : 'bg-teal-500 hover:bg-teal-600 text-white'
                  }`}
                >
                  {pixCopied ? (
                    <>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Chave Copiada!
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copiar Chave PIX
                    </>
                  )}
                </button>
                
                {/* Instruções */}
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-gray-500 text-center font-medium">Como pagar:</p>
                  <ol className="text-xs text-gray-500 space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">1</span>
                      Abra o app do seu banco
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">2</span>
                      Acesse a área PIX e escolha "Pagar com PIX"
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">3</span>
                      Cole a chave CNPJ copiada
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">4</span>
                      Digite o valor <strong className="text-gray-700">{fmt(setupTotal)}</strong> e confirme
                    </li>
                  </ol>
                </div>
                
                {/* Botão Fechar */}
                <button
                  onClick={() => setShowPixModal(false)}
                  className="w-full mt-4 py-3 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* FOOTER */}
        <div className="text-center text-xs text-gray-400 mt-8 pt-4 border-t border-gray-200">
          <p>Esta proposta foi gerada automaticamente em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="mt-1">Dúvidas? Entre em contato conosco.</p>
        </div>
      </div>
    </div>
  );
};

// ========================================
// MAIN APP
// ========================================
export default function App() {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [showPrint, setShowPrint] = useState(false);
  const [showWizard, setShowWizard] = useState(false); // Sales Wizard
  const [activeTab, setActiveTab] = useState<'config' | 'roi' | 'pricing'>('config');
  
  const [client, setClient] = useState<ClientData>({ companyName: '', contactName: '', email: '' });
  const [plan, setPlan] = useState<PlanLevel>('pro');
  const [tier, setTier] = useState<UserTier>(USER_TIERS[2]);
  const [features, setFeatures] = useState<FeatureState>({ crm: true, whatsapp: true, ai: true, conversions: false });
  const [services, setServices] = useState<string[]>(['onboarding']);
  const [partnership, setPartnership] = useState<PartnershipModel>('whitelabel');
  const [markup, setMarkup] = useState(100);
  
  // SISTEMA FLEXÍVEL DE PRECIFICAÇÃO
  const [pricingModel, setPricingModel] = useState<PricingModel>('per_user');
  const [userCount, setUserCount] = useState(1);  // Usuários individuais
  const [selectedFixedTier, setSelectedFixedTier] = useState<string>('tier_5');
  
  // MODO AUTOMÁTICO VS MANUAL
  const [isAutoPrice, setIsAutoPrice] = useState(true);  // true = automático, false = manual
  
  // UI STATES
  const [showOnboardingTips, setShowOnboardingTips] = useState(true);
  const [showROIExplanation, setShowROIExplanation] = useState(false);
  
  // INPUTS EDITÁVEIS SEPARADOS
  const [manualSetup, setManualSetup] = useState<number | null>(null);
  const [manualMonthly, setManualMonthly] = useState<number | null>(null);
  
  // PREÇOS EDITÁVEIS DE SERVIÇOS (valores iniciais sugeridos)
  const [servicePrices, setServicePrices] = useState<Record<string, number>>({
    onboarding: 500,
    training: 1500,
    migration: 1000,
  });
  
  // PRECOS EDITAVEIS DE FATORES DE COMPLEXIDADE (agora em R$, nao %)
  const [complexityPrices, setComplexityPrices] = useState<Record<string, number>>({
    urgencia: 500,
    presencial: 300,
    suporte: 800,
  });
  
  // MODULO N8N - INTEGRACOES AVANCADAS
  type IntegrationLevelType = 'none' | 'basic' | 'medium' | 'high' | 'custom';
  const [integrationLevel, setIntegrationLevel] = useState<IntegrationLevelType>('none');
  const [integrationCustomPrice, setIntegrationCustomPrice] = useState(5000);
  
  const INTEGRATION_OPTIONS: Record<IntegrationLevelType, { label: string; price: number; description: string }> = {
    none: { label: 'Nenhuma', price: 0, description: 'Sem integracoes externas' },
    basic: { label: 'Baixa - Webhooks', price: 1000, description: 'Webhooks simples e notificacoes' },
    medium: { label: 'Media - Google/Zapier', price: 3000, description: 'Planilhas, Make, Zapier' },
    high: { label: 'Alta - ERP/Banco de Dados', price: 8000, description: 'SAP, Oracle, PostgreSQL, APIs' },
    custom: { label: 'Personalizada', price: 0, description: 'Valor definido manualmente' },
  };
  
  const integrationPrice = useMemo(() => {
    if (integrationLevel === 'custom') return integrationCustomPrice;
    return INTEGRATION_OPTIONS[integrationLevel].price;
  }, [integrationLevel, integrationCustomPrice]);
  
  const [roi, setRoi] = useState<ROIInputs>({ ticketMedio: 2000, leadsPerMonth: 100, conversionRate: 5, improvementPercent: 20 });
  
  // CALCULATIONS (Sistema Legado - mantido para retrocompatibilidade)
  const dynamicSetup = useMemo(() => calculateDynamicSetup(features), [features]);
  
  // NOVO: Soma de serviços usando preços editáveis
  const editableServicesTotal = useMemo(() => {
    return services
      .filter(id => ['onboarding', 'training', 'migration'].includes(id))
      .reduce((sum, id) => sum + (servicePrices[id] || 0), 0);
  }, [services, servicePrices]);
  
  // NOVO: Soma de fatores de complexidade usando valores em R$ (não mais %)
  const editableComplexityTotal = useMemo(() => {
    return services
      .filter(id => ['urgencia', 'presencial', 'suporte'].includes(id))
      .reduce((sum, id) => sum + (complexityPrices[id] || 0), 0);
  }, [services, complexityPrices]);
  
  const servicesTotal = useMemo(() => calculateServicesTotal(services), [services]);
  const complexityPct = useMemo(() => calculateComplexityPercent(services), [services]);
  const baseCost = useMemo(() => calculateInternalCost(features, tier.maxUsers), [features, tier.maxUsers]);
  const calcMonthly = useMemo(() => calculateFinalPrice(baseCost, markup, complexityPct), [baseCost, markup, complexityPct]);
  const roiCalc = useMemo(() => calculateROI(roi), [roi]);
  
  // NOVO: Cálculos do Sistema Flexível
  const effectiveUserCount = useMemo(() => {
    if (pricingModel === 'fixed_tier') {
      const fixedTier = FIXED_TIERS.find(t => t.id === selectedFixedTier);
      return fixedTier?.maxUsers || 5;
    }
    return userCount;
  }, [pricingModel, selectedFixedTier, userCount]);
  
  const flexibleMonthlyPrice = useMemo(() => 
    calculateFlexibleMonthlyPrice(pricingModel, effectiveUserCount, features, selectedFixedTier),
    [pricingModel, effectiveUserCount, features, selectedFixedTier]
  );
  
  const flexibleInternalCost = useMemo(() => 
    calculateInternalCostFlexible(effectiveUserCount, features),
    [effectiveUserCount, features]
  );
  
  const flexibleProfit = useMemo(() => 
    calculateProfitFlexible(flexibleMonthlyPrice, effectiveUserCount, features),
    [flexibleMonthlyPrice, effectiveUserCount, features]
  );
  
  const priceValidation = useMemo(() => 
    validateMinimumPrice(flexibleMonthlyPrice),
    [flexibleMonthlyPrice]
  );
  
  const userPriceRange = useMemo(() => 
    getUserPriceRange(userCount),
    [userCount]
  );
  
  const suggestedPrice = useMemo(() => 
    getSuggestedPrice(pricingModel, effectiveUserCount, features, 50),
    [pricingModel, effectiveUserCount, features]
  );
  
  // VALORES FINAIS (calculado ou manual)
  // Setup agora usa precos editaveis de servicos + fatores de complexidade + integracoes
  const calcSetup = dynamicSetup + editableServicesTotal + editableComplexityTotal + integrationPrice;
  const finalSetup = manualSetup ?? calcSetup;
  // Usar preço flexível se modelo não for fixed_tier (legado)
  const finalMonthly = manualMonthly ?? (pricingModel === 'fixed_tier' ? calcMonthly : flexibleMonthlyPrice);
  
  const profit = useMemo(() => calculateProfit(partnership, finalMonthly, flexibleInternalCost), [partnership, finalMonthly, flexibleInternalCost]);
  
  // CUMULATIVE PROFIT CHART
  const profitData = useMemo(() => 
    calculateCumulativeProfit(finalSetup, finalMonthly, roiCalc.recoveredRevenue),
    [finalSetup, finalMonthly, roiCalc.recoveredRevenue]
  );
  const paybackMonth = useMemo(() => findPaybackMonth(profitData), [profitData]);
  const yearlyProfit = useMemo(() => calculateYearlyProfit(profitData), [profitData]);
  
  // EXPLICAÇÃO DETALHADA DO ROI
  const roiExplanation = useMemo(() => generateROIExplanation(roi), [roi]);
  
  // BREAKDOWN DE CUSTOS
  const costBreakdown = useMemo(() => 
    generateCostBreakdown(features, effectiveUserCount),
    [features, effectiveUserCount]
  );
  
  // HANDLERS
  const selectPlan = useCallback((p: PlanLevel) => {
    const preset = PLAN_PRESETS[p];
    const t = USER_TIERS.find(x => x.id === preset.tierId)!;
    setPlan(p);
    setTier(t);
    setFeatures(preset.features);
    setManualSetup(null);
    setManualMonthly(null);
  }, []);
  
  const toggleFeature = useCallback((k: keyof FeatureState) => {
    if (k === 'ai' && !features.whatsapp) return;
    setFeatures(f => ({ ...f, [k]: !f[k] }));
    setManualSetup(null);
    setManualMonthly(null);
  }, [features.whatsapp]);
  
  const toggleService = useCallback((id: string) => {
    // BUGFIX: Removida verificacao svc.required para permitir toggle livre
    setServices(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    setManualSetup(null);
    setManualMonthly(null);
  }, []);
  
  // WIZARD PRESET HANDLER
  const applyWizardPreset = useCallback((preset: CalculatorPreset) => {
    // Aplicar todas as configurações do wizard
    setUserCount(preset.userCount);
    setPricingModel(preset.pricingModel);
    setPlan(preset.plan);
    setFeatures(preset.features);
    setServices(preset.services);
    setMarkup(preset.markup);
    
    // Aplicar dados de ROI coletados no wizard
    setRoi(preset.roiInputs);
    
    // Atualizar tier baseado no plano
    const tierForPlan = USER_TIERS.find(t => t.linkedPlan === preset.plan);
    if (tierForPlan) setTier(tierForPlan);
    
    // Limpar valores manuais
    setManualSetup(null);
    setManualMonthly(null);
    setIsAutoPrice(true);
    
    // Fechar wizard
    setShowWizard(false);
  }, []);
  
  const isDark = theme === 'dark';
  const bg = isDark ? 'bg-slate-900' : 'bg-gray-50';
  const text = isDark ? 'text-slate-300' : 'text-gray-700';
  const card = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';
  const input = isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900';
  
  // WIZARD MODE
  if (showWizard) {
    return (
      <SalesWizard 
        onComplete={applyWizardPreset}
        onCancel={() => setShowWizard(false)}
        isDark={isDark}
      />
    );
  }
  
  // PRINT MODE
  if (showPrint) {
    return (
      <A4Proposal
        client={client}
        plan={plan}
        tier={tier}
        features={features}
        selectedServices={services}
        setupTotal={finalSetup}
        monthlyPrice={finalMonthly}
        roiRecovered={roiCalc.recoveredRevenue}
        paybackData={profitData}
        paybackMonth={paybackMonth}
        yearlyProfit={yearlyProfit}
        baseCost={baseCost}
        onClose={() => setShowPrint(false)}
      />
    );
  }
  
  // Separate services by category
  const fixedServices = SERVICES_LIST.filter(s => s.category === 'service');
  const complexityFactors = SERVICES_LIST.filter(s => s.category === 'complexity');
  
  return (
    <div className={`min-h-screen ${bg} ${text}`}>
      {/* Nav */}
      <nav className={`sticky top-0 z-40 ${isDark ? 'bg-slate-800' : 'bg-white'} border-b ${isDark ? 'border-slate-700' : 'border-gray-200'} px-4 py-2.5 flex justify-between items-center`}>
        <div className="flex items-center gap-2">
          <div className="size-7 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-base">dashboard</span>
          </div>
          <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{SYSTEM_CONFIG.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowWizard(true)} 
            className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:from-blue-600 hover:to-blue-800 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">auto_fix_high</span>
            Novo Diagnóstico
          </button>
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
            <span className="material-symbols-outlined text-sm">{isDark ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto p-4 grid lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN - 4 cols */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex gap-2">
            {(['config', 'pricing', 'roi'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 ${activeTab === t ? 'bg-blue-600 text-white' : isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                <span className="material-symbols-outlined text-sm">{t === 'config' ? 'tune' : t === 'pricing' ? 'payments' : 'insights'}</span>
                {t === 'config' ? 'Config' : t === 'pricing' ? 'Preço' : 'ROI'}
              </button>
            ))}
          </div>
          
          {/* Onboarding Tip */}
          <OnboardingTip 
            tipKey={activeTab} 
            isVisible={showOnboardingTips} 
            onToggle={() => setShowOnboardingTips(!showOnboardingTips)}
            isDark={isDark}
          />
          {activeTab === 'config' ? (
            <>
              {/* Client */}
              <div className={`${card} border rounded-xl p-3`}>
                <h2 className={`font-semibold text-sm mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Cliente</h2>
                <div className="space-y-2">
                  <input value={client.companyName} onChange={e => setClient(c => ({...c, companyName: e.target.value}))} placeholder="Empresa" className={`w-full ${input} border rounded-lg px-3 py-1.5 text-sm`} />
                  <input value={client.contactName} onChange={e => setClient(c => ({...c, contactName: e.target.value}))} placeholder="Contato" className={`w-full ${input} border rounded-lg px-3 py-1.5 text-sm`} />
                </div>
              </div>
              
              {/* Plan */}
              <div className={`${card} border rounded-xl p-3`}>
                <h2 className={`font-semibold text-sm mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Plano</h2>
                <div className="space-y-1 mb-2">
                  {(['start', 'pro', 'enterprise'] as PlanLevel[]).map(p => (
                    <button key={p} onClick={() => selectPlan(p)} className={`w-full py-1.5 px-2 rounded-lg text-left flex justify-between items-center text-sm ${plan === p ? 'bg-blue-600 text-white' : isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
                      <span className="font-medium capitalize">{p}</span>
                      {plan === p && <span className="material-symbols-outlined text-sm">check</span>}
                    </button>
                  ))}
                </div>
                <div className="space-y-0.5">
                  {USER_TIERS.map(t => (
                    <button key={t.id} onClick={() => { setTier(t); setPlan(t.linkedPlan); setManualSetup(null); setManualMonthly(null); }} className={`w-full py-1 px-2 rounded text-[11px] text-left flex justify-between ${tier.id === t.id ? 'bg-blue-600 text-white' : isDark ? 'bg-slate-700/50 text-slate-400' : 'bg-gray-50 text-gray-600'}`}>
                      <span>{t.label}</span>
                      <span className="font-mono opacity-75">{fmt(INTERNAL_PRICING.CRM_PER_USER * t.maxUsers)}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Card: Automacao & Integracoes N8N */}
              <div className={`${card} border rounded-xl p-3`}>
                <h2 className={`font-semibold text-sm mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Automacao & Integracoes
                </h2>
                <p className={`text-[10px] mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Selecione o nivel de complexidade das integracoes
                </p>
                <select 
                  value={integrationLevel === 'custom' ? 'custom' : INTEGRATION_OPTIONS[integrationLevel].price}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setIntegrationLevel('custom');
                    } else {
                      const level = (Object.keys(INTEGRATION_OPTIONS) as IntegrationLevelType[]).find(
                        k => INTEGRATION_OPTIONS[k].price.toString() === val
                      );
                      if (level) setIntegrationLevel(level);
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-slate-700 text-white border-slate-600' : 'bg-gray-50 text-gray-900 border-gray-200'} border`}
                >
                  {(Object.keys(INTEGRATION_OPTIONS) as IntegrationLevelType[]).map(level => (
                    <option key={level} value={level === 'custom' ? 'custom' : INTEGRATION_OPTIONS[level].price}>
                      {INTEGRATION_OPTIONS[level].label} {level !== 'none' && level !== 'custom' && `(+${fmt(INTEGRATION_OPTIONS[level].price)})`}
                    </option>
                  ))}
                </select>
                
                {integrationLevel === 'custom' && (
                  <div className="mt-2">
                    <label className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Valor Personalizado</label>
                    <input 
                      type="number" 
                      value={integrationCustomPrice}
                      onChange={e => setIntegrationCustomPrice(Math.max(0, +e.target.value || 0))}
                      className={`w-full mt-1 px-3 py-1.5 rounded-lg text-sm ${isDark ? 'bg-slate-600 text-white' : 'bg-white text-gray-900'} border ${isDark ? 'border-slate-500' : 'border-gray-200'}`}
                    />
                  </div>
                )}
                
                {integrationPrice > 0 && (
                  <div className={`mt-2 p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Custo Integracoes:</span>
                      <span className={`text-sm font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>+{fmt(integrationPrice)}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'pricing' ? (
            /* PRICING Tab - Sistema Flexível */
            <>
              {/* Modelo de Precificação */}
              <div className={`${card} border rounded-xl p-3`}>
                <h2 className={`font-semibold text-sm mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Modelo de Precificação
                </h2>
                
                {/* Toggle Auto/Manual */}
                <PriceModeToggle
                  isAuto={isAutoPrice}
                  onToggle={() => {
                    setIsAutoPrice(!isAutoPrice);
                    if (!isAutoPrice) {
                      setManualMonthly(null);
                      setManualSetup(null);
                    }
                  }}
                  isDark={isDark}
                />
                
                <div className="space-y-2 mt-3">
                  {(Object.keys(PRICING_MODELS) as PricingModel[]).map(model => {
                    const m = PRICING_MODELS[model];
                    return (
                      <button
                        key={model}
                        onClick={() => { setPricingModel(model); setManualMonthly(null); }}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          pricingModel === model
                            ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                            : isDark
                              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base">{m.icon}</span>
                          <span className="font-medium text-sm">{m.label}</span>
                        </div>
                        <p className={`text-[10px] mt-1 ${pricingModel === model ? 'text-blue-100' : isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          {m.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Configuração de Usuários */}
              <div className={`${card} border rounded-xl p-3`}>
                <h2 className={`font-semibold text-sm mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {pricingModel === 'fixed_tier' ? 'Pacote de Usuários' : 'Quantidade de Usuários'}
                </h2>
                
                {pricingModel === 'fixed_tier' ? (
                  /* Seleção de Tier Fixo */
                  <div className="space-y-1">
                    {FIXED_TIERS.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { setSelectedFixedTier(t.id); setManualMonthly(null); }}
                        className={`w-full py-2 px-3 rounded-lg text-left flex justify-between items-center ${
                          selectedFixedTier === t.id
                            ? 'bg-blue-600 text-white'
                            : isDark
                              ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-sm">{t.label}</span>
                        <span className="font-mono text-sm font-bold">{fmt(t.monthlyPrice)}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Seleção por Quantidade */
                  <div className="space-y-3">
                    {/* Contador */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setUserCount(Math.max(1, userCount - 1))}
                        disabled={userCount <= 1}
                        className={`w-10 h-10 rounded-lg text-lg font-bold transition-all ${
                          userCount <= 1
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : isDark
                              ? 'bg-slate-600 text-white hover:bg-slate-500'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={userCount}
                        onChange={e => setUserCount(Math.max(1, Math.min(100, +e.target.value || 1)))}
                        className={`flex-1 text-center text-2xl font-bold py-2 rounded-lg ${input} border`}
                      />
                      <button
                        onClick={() => setUserCount(Math.min(100, userCount + 1))}
                        disabled={userCount >= 100}
                        className={`w-10 h-10 rounded-lg text-lg font-bold transition-all ${
                          userCount >= 100
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : isDark
                              ? 'bg-slate-600 text-white hover:bg-slate-500'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        +
                      </button>
                    </div>
                    
                    {/* Atalhos */}
                    <div className="flex gap-1 flex-wrap">
                      {[1, 2, 3, 5, 10, 20].map(n => (
                        <button
                          key={n}
                          onClick={() => setUserCount(n)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                            userCount === n
                              ? 'bg-blue-600 text-white'
                              : isDark
                                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    
                    {/* Info do Range */}
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-blue-50'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-blue-700'}`}>
                          {userPriceRange.label}
                        </span>
                        {userPriceRange.discount > 0 && (
                          <span className="text-xs font-bold text-green-500">
                            -{userPriceRange.discount}% desconto
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-blue-600'}`}>
                        {fmt(userPriceRange.pricePerUser)}/usuário × {userCount} = <strong>{fmt(userPriceRange.pricePerUser * userCount)}</strong>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Breakdown de Custos */}
              <div className={`${card} border rounded-xl p-3`}>
                <h2 className={`font-semibold text-sm mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Composição do Custo
                </h2>
                <div className="space-y-2">
                  {costBreakdown.items.map((item, i) => (
                    <div 
                      key={i} 
                      className={`p-2 rounded-lg flex justify-between items-center ${
                        item.total > 0 
                          ? (isDark ? 'bg-slate-700/50' : 'bg-gray-50')
                          : (isDark ? 'bg-slate-800/30' : 'bg-gray-50/50')
                      }`}
                    >
                      <div className="flex-1">
                        <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                          {item.label}
                        </p>
                        <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                          {item.isPerUser && item.quantity 
                            ? `${fmt(item.unitPrice)}/usuário × ${item.quantity}` 
                            : item.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold font-mono ${
                          item.total > 0 
                            ? (isDark ? 'text-white' : 'text-gray-900')
                            : 'text-green-500'
                        }`}>
                          {item.total === 0 ? 'Incluso' : fmt(item.total)}
                        </p>
                        {item.isPerUser && item.total > 0 && (
                          <p className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                            /mês
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Total de Custo */}
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-orange-500/20' : 'bg-orange-50'} border-2 border-dashed ${isDark ? 'border-orange-500/30' : 'border-orange-200'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className={`text-xs font-bold ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>
                          Seu Custo Total
                        </p>
                        <p className={`text-[10px] ${isDark ? 'text-orange-500/70' : 'text-orange-600'}`}>
                          Custo mínimo: {fmt(FINANCIAL_RULES.MIN_MONTHLY_COST)}
                        </p>
                      </div>
                      <p className={`text-lg font-bold font-mono ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>
                        {fmt(costBreakdown.total)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumo do Preço */}
              <div className={`${card} border rounded-xl p-3`}>
                <h2 className={`font-semibold text-sm mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Resumo</h2>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Usuários</span>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{effectiveUserCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Custo interno</span>
                    <span className={`font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>{fmt(flexibleInternalCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Preço de venda</span>
                    <span className={`font-bold font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>{fmt(flexibleMonthlyPrice)}</span>
                  </div>
                  <hr className={isDark ? 'border-slate-600' : 'border-gray-200'} />
                  <div className={`p-2 rounded-lg ${flexibleProfit.profit >= 0 ? (isDark ? 'bg-green-500/20' : 'bg-green-50') : (isDark ? 'bg-red-500/20' : 'bg-red-50')}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-bold ${flexibleProfit.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        Seu Lucro Mensal
                      </span>
                      <span className={`text-lg font-bold ${flexibleProfit.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {fmt(flexibleProfit.profit)}
                      </span>
                    </div>
                    <p className={`text-[10px] mt-0.5 ${flexibleProfit.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Margem: {flexibleProfit.margin}%
                    </p>
                  </div>
                  
                  {/* Validação de Preço Mínimo */}
                  <div className={`p-2 rounded text-xs ${priceValidation.isValid ? (isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700') : (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700')}`}>
                    {priceValidation.message}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ROI Tab */
            <div className={`${card} border rounded-xl p-3`}>
              <h2 className={`font-semibold text-sm mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Calculadora ROI</h2>
              <div className="space-y-2">
                <div>
                  <Tooltip text={ROI_TOOLTIPS.ticketMedio}>
                    <label className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Ticket Médio</label>
                  </Tooltip>
                  <input type="number" value={roi.ticketMedio} onChange={e => setRoi(r => ({...r, ticketMedio: +e.target.value}))} className={`w-full mt-1 ${input} border rounded-lg px-3 py-1.5 text-sm`} />
                </div>
                <div>
                  <Tooltip text={ROI_TOOLTIPS.leadsPerMonth}>
                    <label className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Leads/mês</label>
                  </Tooltip>
                  <input type="number" value={roi.leadsPerMonth} onChange={e => setRoi(r => ({...r, leadsPerMonth: +e.target.value}))} className={`w-full mt-1 ${input} border rounded-lg px-3 py-1.5 text-sm`} />
                </div>
                <div>
                  <Tooltip text={ROI_TOOLTIPS.conversionRate}>
                    <label className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Taxa Conversão (%)</label>
                  </Tooltip>
                  <input type="number" value={roi.conversionRate} onChange={e => setRoi(r => ({...r, conversionRate: +e.target.value}))} className={`w-full mt-1 ${input} border rounded-lg px-3 py-1.5 text-sm`} />
                </div>
                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-blue-50'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <Tooltip text={ROI_TOOLTIPS.improvement}>
                      <label className={`text-[10px] ${isDark ? 'text-slate-300' : 'text-blue-700'}`}>Melhoria Esperada</label>
                    </Tooltip>
                    <input 
                      type="number" 
                      min={0} 
                      max={500} 
                      value={roi.improvementPercent} 
                      onChange={e => setRoi(r => ({...r, improvementPercent: Math.min(500, Math.max(0, +e.target.value || 0))}))} 
                      className={`w-16 text-right text-sm font-bold border rounded px-1 py-0.5 ${isDark ? 'bg-slate-600 text-white border-slate-500' : 'bg-white text-blue-700 border-blue-200'}`}
                    />
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-blue-700'}`}>%</span>
                  </div>
                  <input type="range" min={0} max={500} step={5} value={roi.improvementPercent} onChange={e => setRoi(r => ({...r, improvementPercent: +e.target.value}))} className="w-full accent-blue-600" />
                  <div className="flex justify-between text-[8px] text-slate-500 mt-0.5">
                    <span>0%</span>
                    <span>100%</span>
                    <span>250%</span>
                    <span>500%</span>
                  </div>
                </div>
              </div>
              
              {/* Receita Recuperada com Explicação Detalhada */}
              <div className={`rounded-lg mt-2 overflow-hidden ${isDark ? 'bg-green-500/20' : 'bg-green-50'}`}>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[9px] uppercase font-bold text-green-500">Receita Recuperada</p>
                    <button
                      onClick={() => setShowROIExplanation(!showROIExplanation)}
                      className="text-[10px] text-green-600 hover:underline flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-xs">
                        {showROIExplanation ? 'visibility_off' : 'calculate'}
                      </span>
                      {showROIExplanation ? 'Ocultar' : 'Ver cálculo'}
                    </button>
                  </div>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-green-700'}`}>+{fmt(roiCalc.recoveredRevenue)}/mês</p>
                </div>
                
                {/* Explicação Detalhada */}
                {showROIExplanation && (
                  <div className={`px-3 pb-3 space-y-2 animate-fadeIn ${isDark ? 'bg-slate-800/50' : 'bg-green-100/50'}`}>
                    <p className={`text-[10px] font-bold ${isDark ? 'text-slate-300' : 'text-green-800'}`}>
                      📊 Explicação do Cálculo:
                    </p>
                    <div className="space-y-1.5">
                      {roiExplanation.steps.map((step, i) => (
                        <div 
                          key={i} 
                          className={`p-2 rounded ${
                            i === roiExplanation.steps.length - 1 
                              ? (isDark ? 'bg-green-600/30' : 'bg-green-200') 
                              : (isDark ? 'bg-slate-700/50' : 'bg-white/70')
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className={`text-[10px] font-bold ${
                                i === roiExplanation.steps.length - 1 
                                  ? 'text-green-500' 
                                  : (isDark ? 'text-slate-300' : 'text-gray-700')
                              }`}>
                                {step.label}
                              </p>
                              <p className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                {step.formula}
                              </p>
                            </div>
                            <p className={`text-sm font-bold ${
                              i === roiExplanation.steps.length - 1 
                                ? 'text-green-500' 
                                : (isDark ? 'text-white' : 'text-gray-900')
                            }`}>
                              {step.value}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className={`text-[10px] ${isDark ? 'text-green-400' : 'text-green-700'} italic`}>
                      💡 {roiExplanation.finalMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* MIDDLE COLUMN - 4 cols */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Features with Tooltips */}
          <div className={`${card} border rounded-xl p-3`}>
            <h2 className={`font-semibold text-sm mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Funcionalidades</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {(['crm', 'whatsapp', 'ai', 'conversions'] as (keyof FeatureState)[]).map(k => {
                const disabled = k === 'ai' && !features.whatsapp;
                return (
                  <div key={k} onClick={() => !disabled && toggleFeature(k)} className={`p-2 rounded-lg border cursor-pointer ${disabled ? 'opacity-40' : ''} ${features[k] ? 'border-blue-500 bg-blue-500/10' : isDark ? 'border-slate-600' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={features[k]} readOnly className="w-3.5 h-3.5 accent-blue-600" />
                      <Tooltip text={FEATURE_TOOLTIPS[k]}>
                        <span className={`text-sm font-medium ${features[k] ? 'text-blue-500' : ''}`}>
                          {k === 'crm' ? 'CRM' : k === 'whatsapp' ? 'WhatsApp' : k === 'ai' ? 'IA' : 'Conversões'}
                        </span>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* RICH SERVICE LIST - COM PREÇOS EDITÁVEIS */}
          <div className={`${card} border rounded-xl p-3`}>
            <div className="flex justify-between items-center mb-3">
              <h2 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Menu de Serviços</h2>
              <span className="text-[8px] bg-orange-500/20 text-orange-500 px-2 py-1 rounded-full font-bold">TAXA ÚNICA</span>
            </div>
            <div className="space-y-2">
              {fixedServices.map(svc => {
                const isSelected = services.includes(svc.id);
                const price = servicePrices[svc.id] ?? svc.cost;
                return (
                  <div 
                    key={svc.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : isDark 
                          ? 'border-slate-600 hover:border-slate-500' 
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleService(svc.id)}
                        className="w-4 h-4 mt-0.5 accent-blue-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isSelected ? 'text-blue-600' : isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                          {svc.label}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                          {svc.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>R$</span>
                          <input
                            type="number"
                            value={price}
                            onChange={e => setServicePrices(p => ({ ...p, [svc.id]: +e.target.value }))}
                            className={`w-20 text-sm font-bold text-right py-1 px-2 rounded ${
                              isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'
                            } border`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Complexity Factors - COM VALORES EM R$ */}
            <div className={`mt-4 pt-3 border-t ${isDark ? 'border-slate-600' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Fatores de Complexidade</h3>
                <span className="text-[8px] bg-green-500/20 text-green-500 px-2 py-1 rounded-full font-bold">+ R$ NO SETUP</span>
              </div>
              <div className="space-y-2">
                {complexityFactors.map(svc => {
                  const isSelected = services.includes(svc.id);
                  const price = complexityPrices[svc.id] ?? 0;
                  return (
                    <div 
                      key={svc.id}
                      className={`p-3 rounded-lg border transition-all ${
                        isSelected 
                          ? 'border-green-500 bg-green-500/10' 
                          : isDark 
                            ? 'border-slate-600 hover:border-slate-500' 
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleService(svc.id)}
                          className="w-4 h-4 mt-0.5 accent-green-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isSelected ? 'text-green-600' : isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                            {svc.label}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                            {svc.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>+R$</span>
                            <input
                              type="number"
                              value={price}
                              onChange={e => setComplexityPrices(p => ({ ...p, [svc.id]: +e.target.value }))}
                              className={`w-20 text-sm font-bold text-right py-1 px-2 rounded ${
                                isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'
                              } border`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Total de Serviços + Complexidade */}
              {(editableServicesTotal > 0 || editableComplexityTotal > 0) && (
                <div className={`mt-3 p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <div className="flex justify-between text-xs">
                    <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Serviços:</span>
                    <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{fmt(editableServicesTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Complexidade:</span>
                    <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{fmt(editableComplexityTotal)}</span>
                  </div>
                  <div className={`flex justify-between text-sm font-bold mt-1 pt-1 border-t ${isDark ? 'border-slate-600' : 'border-gray-200'}`}>
                    <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>Total Serviços:</span>
                    <span className="text-orange-500">{fmt(editableServicesTotal + editableComplexityTotal)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Cumulative Profit Chart */}
          <CumulativeProfitChart
            data={profitData}
            paybackMonth={paybackMonth}
            yearlyProfit={yearlyProfit}
            isDark={isDark}
          />
        </div>
        
        {/* RIGHT COLUMN - 4 cols */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Partnership */}
          <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-blue-50 border border-blue-200'}`}>
            <p className={`text-[10px] font-bold uppercase mb-2 ${isDark ? 'text-slate-400' : 'text-blue-700'}`}>Modelo</p>
            <div className="flex gap-2">
              {(['whitelabel', 'partner'] as PartnershipModel[]).map(m => (
                <button key={m} onClick={() => setPartnership(m)} className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium ${partnership === m ? 'bg-blue-600 text-white' : isDark ? 'bg-slate-600 text-slate-300' : 'bg-white border border-gray-300 text-gray-600'}`}>
                  {PARTNERSHIP_MODELS[m].label}
                </button>
              ))}
            </div>
          </div>
          
          {/* PRICING CARD COM DOIS INPUTS GRANDES */}
          <div className={`${card} border rounded-xl p-3`}>
            <h2 className={`font-semibold text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Preço Final</h2>
            
            {/* Only show base cost for whitelabel */}
            {partnership === 'whitelabel' && (
              <div className={`p-2 rounded-lg mb-3 ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between text-sm mb-2">
                  <span>Custo Base</span>
                  <span className="font-mono">{fmt(baseCost)}</span>
                </div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span>Margem</span>
                  <span className="font-bold text-blue-500">{markup}%</span>
                </div>
                <input type="range" min="50" max="300" step="10" value={markup} onChange={e => { setMarkup(+e.target.value); setManualMonthly(null); }} className="w-full accent-blue-600" />
              </div>
            )}
            
            {/* SETUP INPUT (GRANDE) */}
            <div className={`p-4 rounded-xl mb-3 ${isDark ? 'bg-orange-500/20' : 'bg-orange-50 border border-orange-200'} ${isAutoPrice ? 'opacity-80' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <Tooltip text={PRICE_TOOLTIPS.setup}>
                  <p className="text-xs uppercase font-bold text-orange-500">Setup Total (Adesão)</p>
                </Tooltip>
                {isAutoPrice && (
                  <span className="text-[8px] bg-blue-500 text-white px-2 py-0.5 rounded-full">AUTO</span>
                )}
              </div>
              <div className="flex items-center gap-2 w-full overflow-hidden">
                <span className="text-orange-500 text-base flex-shrink-0">R$</span>
                <input
                  type="number"
                  value={manualSetup ?? calcSetup}
                  onChange={e => !isAutoPrice && setManualSetup(+e.target.value)}
                  readOnly={isAutoPrice}
                  className={`flex-1 min-w-0 text-xl font-bold ${input} border rounded-lg px-2 py-1.5 text-right ${isAutoPrice ? 'cursor-not-allowed opacity-70' : ''}`}
                />
              </div>
              {!isAutoPrice && manualSetup !== null && <p className="text-[9px] text-orange-400 mt-1">⚠️ Valor manual (automático: {fmt(calcSetup)})</p>}
            </div>
            
            {/* MONTHLY INPUT (GRANDE) */}
            <div className={`p-4 rounded-xl mb-3 ${isDark ? 'bg-blue-500/20' : 'bg-blue-50 border border-blue-200'} ${isAutoPrice ? 'opacity-80' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <Tooltip text={PRICE_TOOLTIPS.monthly}>
                  <p className="text-xs uppercase font-bold text-blue-500">Mensalidade (Recorrente)</p>
                </Tooltip>
                {isAutoPrice && (
                  <span className="text-[8px] bg-blue-500 text-white px-2 py-0.5 rounded-full">AUTO</span>
                )}
              </div>
              <div className="flex items-center gap-2 w-full overflow-hidden">
                <span className="text-blue-500 text-base flex-shrink-0">R$</span>
                <input
                  type="number"
                  value={manualMonthly ?? finalMonthly}
                  onChange={e => !isAutoPrice && setManualMonthly(+e.target.value)}
                  readOnly={isAutoPrice}
                  className={`flex-1 min-w-0 text-xl font-bold ${input} border rounded-lg px-2 py-1.5 text-right ${isAutoPrice ? 'cursor-not-allowed opacity-70' : ''}`}
                />
                <span className="text-blue-500 text-sm flex-shrink-0">/mês</span>
              </div>
              {!isAutoPrice && manualMonthly !== null && <p className="text-[9px] text-blue-400 mt-1">⚠️ Valor manual (automático: {fmt(flexibleMonthlyPrice)})</p>}
            </div>
            
            {/* Profit Display */}
            <div className={`p-3 rounded-xl ${partnership === 'partner' ? (isDark ? 'bg-green-500/20' : 'bg-green-50') : (isDark ? 'bg-slate-700' : 'bg-gray-50')}`}>
              {partnership === 'whitelabel' ? (
                <>
                  <p className={`text-[9px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'} mb-0.5`}>Seu Lucro Mensal</p>
                  <p className={`text-lg font-bold ${profit.yourProfit > 0 ? 'text-green-500' : 'text-red-500'}`}>{fmt(profit.yourProfit)}</p>
                </>
              ) : (
                <>
                  <p className="text-[9px] uppercase font-bold text-green-500 mb-0.5">Sua Comissão (70%)</p>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-green-700'}`}>{fmt(profit.yourProfit)}</p>
                  <p className="text-[9px] text-slate-500">Taxa Bolten: {fmt(profit.boltenFee)}</p>
                </>
              )}
            </div>
          </div>
          
          {/* Generate Button */}
          <button onClick={() => setShowPrint(true)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">print</span>
            Gerar PDF
          </button>
        </div>
      </main>
    </div>
  );
}