import React, { useState, useMemo, useCallback } from 'react';
import {
  PlanLevel, ClientData, FeatureState, ThemeMode, PartnershipModel, ROIInputs, PaybackPoint,
  USER_TIERS, UserTier, SERVICES_LIST, ServiceItem, INTERNAL_PRICING, PLAN_PRESETS, SYSTEM_CONFIG,
  PARTNERSHIP_MODELS, FEATURE_TOOLTIPS, ROI_TOOLTIPS, PRICE_TOOLTIPS,
  calculateDynamicSetup, calculateInternalCost, calculateServicesTotal, calculateComplexityPercent,
  calculateFinalPrice, calculateROI, calculateProfit, calculateCumulativeProfit, findPaybackMonth, calculateYearlyProfit,
} from './types';

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

const A4Proposal: React.FC<A4ProposalProps> = ({
  client, plan, tier, features, selectedServices, setupTotal, monthlyPrice, 
  roiRecovered, paybackData, paybackMonth, yearlyProfit, baseCost, onClose
}) => {
  const handlePrint = () => window.print();
  
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
          
          {/* TABELA DE FUNCIONALIDADES COM PREÇOS */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-700">Funcionalidade</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Descrição</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Valor</th>
                  <th className="text-center p-3 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(features).map(([key, isActive], idx) => {
                  const fp = FEATURE_PRICES[key as keyof typeof FEATURE_PRICES];
                  return (
                    <tr key={key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-3 font-medium text-gray-900">{fp?.name || key}</td>
                      <td className="p-3 text-gray-500 text-xs">{fp?.description || '-'}</td>
                      <td className="p-3 text-right font-mono text-gray-700">{getFeaturePrice(key)}</td>
                      <td className="p-3 text-center">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                            ✓ Incluso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                            Não incluso
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
            Implementação & Serviços
          </h2>
          
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-700">Serviço</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Descrição</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Investimento</th>
                </tr>
              </thead>
              <tbody>
                {SERVICES_LIST.filter(s => selectedServices.includes(s.id) && s.costType === 'fixed').map((svc, idx) => (
                  <tr key={svc.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3 font-medium text-gray-900">{svc.label}</td>
                    <td className="p-3 text-gray-500 text-xs">{svc.description}</td>
                    <td className="p-3 text-right font-mono font-bold text-orange-600">{fmt(svc.cost)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-orange-50 border-t-2 border-orange-200">
                <tr>
                  <td colSpan={2} className="p-3 font-bold text-gray-900">Total Implementação</td>
                  <td className="p-3 text-right font-mono font-bold text-orange-600 text-lg">{fmt(setupTotal)}</td>
                </tr>
              </tfoot>
            </table>
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
  const [activeTab, setActiveTab] = useState<'config' | 'roi'>('config');
  
  const [client, setClient] = useState<ClientData>({ companyName: '', contactName: '', email: '' });
  const [plan, setPlan] = useState<PlanLevel>('pro');
  const [tier, setTier] = useState<UserTier>(USER_TIERS[2]);
  const [features, setFeatures] = useState<FeatureState>({ crm: false, whatsapp: true, ai: true, conversions: false });
  const [services, setServices] = useState<string[]>(['onboarding']);
  const [partnership, setPartnership] = useState<PartnershipModel>('whitelabel');
  const [markup, setMarkup] = useState(100);
  
  // INPUTS EDITÁVEIS SEPARADOS
  const [manualSetup, setManualSetup] = useState<number | null>(null);
  const [manualMonthly, setManualMonthly] = useState<number | null>(null);
  
  const [roi, setRoi] = useState<ROIInputs>({ ticketMedio: 2000, leadsPerMonth: 100, conversionRate: 5, improvementPercent: 20 });
  
  // CALCULATIONS
  const dynamicSetup = useMemo(() => calculateDynamicSetup(features), [features]);
  const servicesTotal = useMemo(() => calculateServicesTotal(services), [services]);
  const complexityPct = useMemo(() => calculateComplexityPercent(services), [services]);
  const baseCost = useMemo(() => calculateInternalCost(features, tier.maxUsers), [features, tier.maxUsers]);
  const calcMonthly = useMemo(() => calculateFinalPrice(baseCost, markup, complexityPct), [baseCost, markup, complexityPct]);
  const roiCalc = useMemo(() => calculateROI(roi), [roi]);
  
  // VALORES FINAIS (calculado ou manual)
  const calcSetup = dynamicSetup + servicesTotal;
  const finalSetup = manualSetup ?? calcSetup;
  const finalMonthly = manualMonthly ?? calcMonthly;
  
  const profit = useMemo(() => calculateProfit(partnership, finalMonthly, baseCost), [partnership, finalMonthly, baseCost]);
  
  // CUMULATIVE PROFIT CHART
  const profitData = useMemo(() => 
    calculateCumulativeProfit(finalSetup, finalMonthly, roiCalc.recoveredRevenue),
    [finalSetup, finalMonthly, roiCalc.recoveredRevenue]
  );
  const paybackMonth = useMemo(() => findPaybackMonth(profitData), [profitData]);
  const yearlyProfit = useMemo(() => calculateYearlyProfit(profitData), [profitData]);
  
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
    const svc = SERVICES_LIST.find(s => s.id === id);
    if (!svc || svc.required) return;
    setServices(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    setManualSetup(null);
    setManualMonthly(null);
  }, []);
  
  const isDark = theme === 'dark';
  const bg = isDark ? 'bg-slate-900' : 'bg-gray-50';
  const text = isDark ? 'text-slate-300' : 'text-gray-700';
  const card = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';
  const input = isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900';
  
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
        <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
          <span className="material-symbols-outlined text-sm">{isDark ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </nav>
      
      <main className="max-w-7xl mx-auto p-4 grid lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN - 4 cols */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex gap-2">
            {(['config', 'roi'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 ${activeTab === t ? 'bg-blue-600 text-white' : isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                <span className="material-symbols-outlined text-sm">{t === 'config' ? 'tune' : 'insights'}</span>
                {t === 'config' ? 'Config' : 'ROI'}
              </button>
            ))}
          </div>
          
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
                      <label className={`text-[10px] ${isDark ? 'text-slate-300' : 'text-blue-700'}`}>Melhoria</label>
                    </Tooltip>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-blue-700'}`}>+{roi.improvementPercent}%</span>
                  </div>
                  <input type="range" min={5} max={50} step={5} value={roi.improvementPercent} onChange={e => setRoi(r => ({...r, improvementPercent: +e.target.value}))} className="w-full accent-blue-600" />
                </div>
              </div>
              <div className={`p-3 rounded-lg mt-2 ${isDark ? 'bg-green-500/20' : 'bg-green-50'}`}>
                <p className="text-[9px] uppercase font-bold text-green-500 mb-0.5">Receita Recuperada</p>
                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-green-700'}`}>+{fmt(roiCalc.recoveredRevenue)}/mês</p>
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
          
          {/* RICH SERVICE LIST */}
          <div className={`${card} border rounded-xl p-3`}>
            <div className="flex justify-between items-center mb-3">
              <h2 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Menu de Serviços</h2>
              <span className="text-[8px] bg-orange-500/20 text-orange-500 px-2 py-1 rounded-full font-bold">TAXA ÚNICA</span>
            </div>
            <div className="space-y-2">
              {fixedServices.map(svc => (
                <ServiceListItem
                  key={svc.id}
                  item={svc}
                  isSelected={services.includes(svc.id)}
                  onToggle={() => toggleService(svc.id)}
                  isDark={isDark}
                />
              ))}
            </div>
            
            {/* Complexity Factors */}
            <div className={`mt-4 pt-3 border-t ${isDark ? 'border-slate-600' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Fatores de Complexidade</h3>
                <span className="text-[8px] bg-green-500/20 text-green-500 px-2 py-1 rounded-full font-bold">% SOBRE MENSAL</span>
              </div>
              <div className="space-y-2">
                {complexityFactors.map(svc => (
                  <ServiceListItem
                    key={svc.id}
                    item={svc}
                    isSelected={services.includes(svc.id)}
                    onToggle={() => toggleService(svc.id)}
                    isDark={isDark}
                  />
                ))}
              </div>
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
            <div className={`p-4 rounded-xl mb-3 ${isDark ? 'bg-orange-500/20' : 'bg-orange-50 border border-orange-200'}`}>
              <Tooltip text={PRICE_TOOLTIPS.setup}>
                <p className="text-xs uppercase font-bold text-orange-500 mb-2">Setup Total (Adesão)</p>
              </Tooltip>
              <div className="flex items-center gap-2 w-full overflow-hidden">
                <span className="text-orange-500 text-base flex-shrink-0">R$</span>
                <input
                  type="number"
                  value={manualSetup ?? calcSetup}
                  onChange={e => setManualSetup(+e.target.value)}
                  className={`flex-1 min-w-0 text-xl font-bold ${input} border rounded-lg px-2 py-1.5 text-right`}
                />
              </div>
              {manualSetup !== null && <p className="text-[9px] text-orange-400 mt-1">⚠️ Valor manual (automático: {fmt(calcSetup)})</p>}
            </div>
            
            {/* MONTHLY INPUT (GRANDE) */}
            <div className={`p-4 rounded-xl mb-3 ${isDark ? 'bg-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
              <Tooltip text={PRICE_TOOLTIPS.monthly}>
                <p className="text-xs uppercase font-bold text-blue-500 mb-2">Mensalidade (Recorrente)</p>
              </Tooltip>
              <div className="flex items-center gap-2 w-full overflow-hidden">
                <span className="text-blue-500 text-base flex-shrink-0">R$</span>
                <input
                  type="number"
                  value={manualMonthly ?? calcMonthly}
                  onChange={e => setManualMonthly(+e.target.value)}
                  className={`flex-1 min-w-0 text-xl font-bold ${input} border rounded-lg px-2 py-1.5 text-right`}
                />
                <span className="text-blue-500 text-sm flex-shrink-0">/mês</span>
              </div>
              {manualMonthly !== null && <p className="text-[9px] text-blue-400 mt-1">⚠️ Valor manual (automático: {fmt(calcMonthly)})</p>}
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