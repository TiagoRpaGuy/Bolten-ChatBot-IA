import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PlanLevel, ClientData, FeatureState, ServiceState, ComplexityState, TechnicalCustomization, ProposalData, ThemeMode, ActiveTab,
  ROIInputs, ROIOutputs, ValuePricingResult, JCurvePoint, USER_TIERS, UserTier, SERVICE_DETAILS, INTERNAL_PRICING,
  FEATURE_TOOLTIPS, SERVICE_TOOLTIPS, ROI_TOOLTIPS, PLAN_PRESETS, SYSTEM_CONFIG, COMPLEXITY_FACTORS, TUTORIAL_STEPS,
  FINANCIAL_RULES, DOMAIN_OPTIONS, BRANDING_OPTIONS,
  calculateInternalCost, calculateServicesTotal, calculateCustomizationCost, calculateComplexityMultiplier, calculateFinalPrice,
  calculateROI, calculateValuePricing, calculateJCurve, findPaybackMonth, generateProposalId,
} from './types';

const formatCurrency = (v: number): string => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const encodeToURL = (d: any): string => { try { return btoa(encodeURIComponent(JSON.stringify(d))); } catch { return ''; } };
const decodeFromURL = (b: string): any => { try { return JSON.parse(decodeURIComponent(atob(b))); } catch { return null; } };

// --- COMPONENTS ---
const Tooltip = ({ content, children }: { content: { title: string; description: string }; children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex items-center">
      {children}
      <button onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} className="ml-1 size-4 rounded-full bg-slate-600 text-slate-300 text-[10px] flex items-center justify-center hover:bg-blue-500 hover:text-white">?</button>
      {show && <div className="absolute z-50 bottom-full left-0 mb-2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl animate-fadeIn">
        <p className="text-xs font-bold text-white mb-1">{content.title}</p><p className="text-[11px] text-slate-400">{content.description}</p>
      </div>}
    </div>
  );
};

const ThemeSwitcher = ({ theme, setTheme }: { theme: ThemeMode; setTheme: (t: ThemeMode) => void }) => (
  <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition ${theme === 'dark' ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-gray-300 text-gray-700'}`}>
    <span className="material-symbols-outlined text-sm">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
  </button>
);

const TabButton = ({ active, onClick, icon, label, isDark }: any) => (
  <button onClick={onClick} className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition ${active ? 'bg-blue-600 text-white' : isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
    <span className="material-symbols-outlined text-sm">{icon}</span>{label}
  </button>
);

const TutorialModal = ({ isOpen, onClose, isDark }: { isOpen: boolean; onClose: () => void; isDark: boolean }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className={`w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="bg-blue-600 p-6 text-white"><h2 className="text-xl font-bold">Como Usar</h2></div>
        <div className="p-6 space-y-4">{TUTORIAL_STEPS.map((step, i) => (
          <div key={i} className={`flex gap-4 p-4 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
            <div className="size-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0"><span className="material-symbols-outlined">{step.icon}</span></div>
            <div><p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{i + 1}. {step.title}</p><p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{step.description}</p></div>
          </div>
        ))}</div>
        <div className={`p-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}><button onClick={onClose} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg">Entendi!</button></div>
      </div>
    </div>
  );
};

// J-CURVE CHART COMPONENT
const JCurveChart = ({ data, paybackMonth, isDark }: { data: JCurvePoint[]; paybackMonth: number | null; isDark: boolean }) => {
  const maxAbs = Math.max(...data.map(d => Math.abs(d.cumulativeValue))) || 1;
  const chartHeight = 140;
  const barWidth = 100 / data.length;
  
  return (
    <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`text-xs font-bold uppercase ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>ROI Timeline (J-Curve)</h3>
        {paybackMonth && <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full">Payback: Mês {paybackMonth}</span>}
      </div>
      <div className="relative" style={{ height: chartHeight }}>
        {/* Zero Line */}
        <div className={`absolute left-0 right-0 top-1/2 h-px ${isDark ? 'bg-slate-500' : 'bg-gray-300'}`}></div>
        {/* Bars */}
        <div className="absolute inset-0 flex items-center justify-around">
          {data.map((point, i) => {
            const heightPercent = (Math.abs(point.cumulativeValue) / maxAbs) * 50;
            const isPositive = point.cumulativeValue >= 0;
            return (
              <div key={i} className="flex flex-col items-center" style={{ width: `${barWidth}%` }}>
                <div className="relative flex items-center justify-center" style={{ height: chartHeight }}>
                  <div 
                    className={`j-curve-bar rounded-sm ${isPositive ? 'bg-gradient-to-t from-green-600 to-green-400' : 'bg-gradient-to-b from-red-600 to-red-400'}`}
                    style={{ 
                      width: '60%', 
                      height: `${heightPercent}%`,
                      position: 'absolute',
                      [isPositive ? 'bottom' : 'top']: '50%'
                    }}
                  ></div>
                </div>
                <span className={`text-[8px] mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{point.month}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-between mt-2 text-[10px]">
        <span className={isDark ? 'text-red-400' : 'text-red-600'}>← Investimento</span>
        <span className={isDark ? 'text-green-400' : 'text-green-600'}>Retorno →</span>
      </div>
    </div>
  );
};

const HighTicketAlert = ({ valuePricing, onApply, isDark }: { valuePricing: ValuePricingResult; onApply: () => void; isDark: boolean }) => {
  if (!valuePricing.isHighTicketOpportunity) return null;
  return (
    <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30' : 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200'}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">🚀</span>
        <div className="flex-1">
          <p className={`font-bold ${isDark ? 'text-white' : 'text-purple-900'}`}>Alto Ticket!</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-purple-700'}`}>ROI de <strong>{formatCurrency(valuePricing.valueSuggestedPrice * 10)}/mês</strong>. Sugerimos <strong>{formatCurrency(valuePricing.valueSuggestedPrice)}</strong>.</p>
          <button onClick={onApply} className="mt-2 px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">auto_fix_high</span>Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};

const ROIChart = ({ current, projected, isDark }: { current: number; projected: number; isDark: boolean }) => {
  const max = Math.max(current, projected) || 1;
  return (
    <div className="space-y-3">
      <div><div className="flex justify-between text-xs mb-1"><span className={isDark ? 'text-slate-400' : 'text-gray-500'}>ANTES</span><span className="font-mono font-bold">{formatCurrency(current)}</span></div>
        <div className={`h-5 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}><div className="h-full bg-gray-500 rounded" style={{ width: `${(current / max) * 100}%` }}></div></div></div>
      <div><div className="flex justify-between text-xs mb-1"><span className="text-green-500 font-bold">DEPOIS</span><span className="font-mono font-bold text-green-500">{formatCurrency(projected)}</span></div>
        <div className={`h-5 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}><div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded" style={{ width: `${(projected / max) * 100}%` }}></div></div></div>
    </div>
  );
};

const LivePreview = ({ client, plan, tier, features, finalPrice, setupTotal, roiOutputs, isDark, onPrint }: any) => (
  <div className="print-card">
    <div className="flex justify-between items-center mb-3 no-print"><h3 className={`text-xs font-bold uppercase ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Preview</h3>
      <button onClick={onPrint} className="text-xs flex items-center gap-1 text-blue-500"><span className="material-symbols-outlined text-sm">print</span>PDF</button></div>
    <div className="rounded-xl overflow-hidden bg-white text-gray-800 text-xs shadow-lg">
      <div className="h-12 bg-gradient-to-r from-blue-600 to-blue-800 flex items-end p-3"><span className="text-white font-bold text-sm truncate">{client.companyName || 'Proposta'}</span></div>
      <div className="p-3 space-y-2">
        <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-500">Plano</span><span className="font-bold capitalize">{plan}</span></div>
        <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-500">Usuários</span><span className="font-bold">{tier.label}</span></div>
        <div className="grid grid-cols-2 gap-1">{Object.entries(features).map(([k, v]: any) => (
          <div key={k} className="flex items-center gap-1"><span className={`size-1.5 rounded-full ${v ? 'bg-green-500' : 'bg-gray-300'}`}></span><span className="text-[9px]">{k.toUpperCase()}</span></div>
        ))}</div>
        {roiOutputs && roiOutputs.recoveredRevenue > 0 && (
          <div className="bg-green-50 border border-green-200 rounded p-2"><p className="text-[8px] text-green-600 font-bold">PROJEÇÃO</p><p className="text-green-700 font-bold">+{formatCurrency(roiOutputs.recoveredRevenue)}/mês</p></div>
        )}
        <div className="pt-2 border-t border-gray-200 space-y-1">
          <div className="flex justify-between"><span className="text-gray-500">Setup</span><span className="font-bold text-orange-600">{formatCurrency(setupTotal)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Mensal</span><span className="font-bold text-blue-600">{formatCurrency(finalPrice)}</span></div>
        </div>
      </div>
    </div>
  </div>
);

// ========================================
// MAIN APP
// ========================================
export default function App() {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [activeTab, setActiveTab] = useState<ActiveTab>('config');
  const [viewMode, setViewMode] = useState<'dashboard' | 'proposal' | 'client'>('dashboard');
  const [proposalData, setProposalData] = useState<ProposalData | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showROICallout, setShowROICallout] = useState(true);

  const [client, setClient] = useState<ClientData>({ companyName: '', contactName: '', email: '', phone: '', sector: '', origin: '' });
  const [plan, setPlan] = useState<PlanLevel>('pro');
  const [selectedTier, setSelectedTier] = useState<UserTier>(USER_TIERS[2]);
  const [features, setFeatures] = useState<FeatureState>({ crm: true, whatsapp: true, ai: false, conversions: true });
  const [services, setServices] = useState<ServiceState>({ onboarding: true, training: false, migration: false });
  const [complexity, setComplexity] = useState<ComplexityState>({ presencial: false, urgencia: false, suporte: false });
  const [technicalCustomization, setTechnicalCustomization] = useState<TechnicalCustomization>({ domain: 'default', branding: 'standard' });
  const [markupPercent, setMarkupPercent] = useState(100);
  const [manualPrice, setManualPrice] = useState<number | null>(null);
  const [stripeUrl, setStripeUrl] = useState('');
  const [roiInputs, setRoiInputs] = useState<ROIInputs>({ ticketMedio: 2000, leadsPerMonth: 100, currentConversionRate: 5, conversionImprovement: FINANCIAL_RULES.DEFAULT_CONVERSION_IMPROVEMENT });

  useEffect(() => { if (!features.whatsapp && features.ai) setFeatures(p => ({ ...p, ai: false })); }, [features.whatsapp, features.ai]);

  const baseCost = useMemo(() => calculateInternalCost(features, selectedTier.maxUsers), [features, selectedTier]);
  const customizationCost = useMemo(() => calculateCustomizationCost(technicalCustomization), [technicalCustomization]);
  const complexityMultiplier = useMemo(() => calculateComplexityMultiplier(complexity), [complexity]);
  const calculatedPrice = useMemo(() => calculateFinalPrice(baseCost, markupPercent, complexityMultiplier), [baseCost, markupPercent, complexityMultiplier]);
  const finalPrice = manualPrice !== null ? manualPrice : calculatedPrice;
  const setupTotal = useMemo(() => calculateServicesTotal(services) + customizationCost, [services, customizationCost]);
  const roiOutputs = useMemo(() => calculateROI(roiInputs), [roiInputs]);
  const valuePricing = useMemo(() => calculateValuePricing(calculatedPrice, roiOutputs.recoveredRevenue), [calculatedPrice, roiOutputs.recoveredRevenue]);
  const jCurveData = useMemo(() => calculateJCurve(setupTotal, finalPrice, roiOutputs.recoveredRevenue), [setupTotal, finalPrice, roiOutputs.recoveredRevenue]);
  const paybackMonth = useMemo(() => findPaybackMonth(jCurveData), [jCurveData]);

  const applyPlanPreset = useCallback((level: PlanLevel) => {
    const preset = PLAN_PRESETS[level];
    const tier = USER_TIERS.find(t => t.id === preset.tierId) || USER_TIERS[0];
    setPlan(level); setSelectedTier(tier); setFeatures(p => ({ ...p, ...preset.features })); setManualPrice(null);
  }, []);

  const handleTierSelect = useCallback((tier: UserTier) => { setSelectedTier(tier); setPlan(tier.linkedPlan); setManualPrice(null); }, []);
  const toggleFeature = useCallback((key: keyof FeatureState) => { if (key === 'ai' && !features.whatsapp) return; setFeatures(p => ({ ...p, [key]: !p[key] })); setManualPrice(null); }, [features.whatsapp]);
  const toggleService = useCallback((key: keyof ServiceState) => { if (key === 'onboarding' && services.onboarding) return; setServices(p => ({ ...p, [key]: !p[key] })); }, [services.onboarding]);
  const toggleComplexity = useCallback((key: keyof ComplexityState) => { setComplexity(p => ({ ...p, [key]: !p[key] })); setManualPrice(null); }, []);
  const applyValuePrice = useCallback(() => { setManualPrice(valuePricing.valueSuggestedPrice); }, [valuePricing.valueSuggestedPrice]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    if (data) {
      const d = decodeFromURL(data);
      if (d) {
        const tier = USER_TIERS.find(t => t.id === d.selectedTierId) || USER_TIERS[0];
        setProposalData({ proposalId: generateProposalId(), createdAt: new Date().toISOString(), validUntil: new Date(Date.now() + 15*24*60*60*1000).toISOString(),
          ...d, technicalCustomization: d.technicalCustomization || { domain: 'default', branding: 'standard' },
          calculations: { setupTotal: calculateServicesTotal(d.services), monthlyRecurring: d.pricing?.finalPrice, finalPrice: d.pricing?.finalPrice }
        });
        setViewMode(params.get('view') === 'client' ? 'client' : 'proposal');
      }
    }
  }, []);

  const handleGenerate = useCallback(() => {
    const pricing: any = { baseCost, markupPercentage: markupPercent, complexityFactors: complexity, manualOverride: manualPrice, finalPrice, stripeCheckoutUrl: stripeUrl };
    const payload = { client, plan, selectedTierId: selectedTier.id, userCount: selectedTier.maxUsers, features, services, technicalCustomization, pricing, roiInputs, roiOutputs, valuePricing };
    window.history.pushState({}, '', `?data=${encodeToURL(payload)}`);
    setProposalData({ proposalId: generateProposalId(), createdAt: new Date().toISOString(), validUntil: new Date(Date.now() + 15*24*60*60*1000).toISOString(),
      client, plan, selectedTierId: selectedTier.id, userCount: selectedTier.maxUsers, features, services, technicalCustomization, pricing, roiInputs, roiOutputs, valuePricing,
      calculations: { setupTotal, monthlyRecurring: finalPrice, finalPrice }
    });
    setViewMode('proposal');
  }, [client, plan, selectedTier, features, services, technicalCustomization, complexity, markupPercent, manualPrice, stripeUrl, baseCost, finalPrice, setupTotal, roiInputs, roiOutputs, valuePricing]);

  const handlePrint = () => window.print();
  const isDark = theme === 'dark';
  const bg = isDark ? 'bg-slate-900' : 'bg-gray-50';
  const text = isDark ? 'text-slate-300' : 'text-gray-700';
  const card = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';
  const input = isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  // CLIENT VIEW
  if (viewMode === 'client' && proposalData) {
    const { client: c, plan: p, features: f, services: s, calculations: calc, pricing, selectedTierId, roiOutputs: roi } = proposalData;
    const tier = USER_TIERS.find(t => t.id === selectedTierId) || USER_TIERS[0];
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-8 print:p-0 print:bg-white print-visible" data-print-container>
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none print-card">
          <div className="h-40 bg-gradient-to-r from-blue-600 to-blue-800 flex items-end p-8 print:h-28 print-card">
            <div className="text-white"><p className="text-xs uppercase tracking-widest opacity-75">Proposta Comercial</p><h1 className="text-3xl font-bold">{c.companyName || 'Sua Empresa'}</h1></div>
          </div>
          <div className="p-8 space-y-6 print:p-6">
            <div className="grid grid-cols-2 gap-6 print-card">
              <div><h3 className="text-sm text-gray-500 uppercase font-bold mb-2">Para</h3><p className="font-semibold">{c.contactName}</p><p className="text-sm text-gray-500">{c.email}</p></div>
              <div className="text-right"><h3 className="text-sm text-gray-500 uppercase font-bold mb-2">Validade</h3><p className="font-semibold">{new Date().toLocaleDateString('pt-BR')}</p></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-5 rounded-xl print-card">
                <h3 className="font-bold text-lg mb-3">Plano {p}</h3><p className="text-sm text-gray-500 mb-2">{tier.label}</p>
                <ul className="space-y-1">{Object.entries(f).map(([k, v]) => (
                  <li key={k} className="flex items-center gap-2 text-sm"><span className={`material-symbols-outlined text-base ${v ? 'text-green-500' : 'text-gray-300'}`}>check_circle</span>
                    {k === 'crm' ? 'CRM' : k === 'whatsapp' ? 'WhatsApp' : k === 'ai' ? 'IA' : 'Conversões'}</li>
                ))}</ul>
              </div>
              <div className="bg-gray-50 p-5 rounded-xl print-card">
                <h3 className="font-bold text-lg mb-3">Implementação</h3>
                {Object.entries(SERVICE_DETAILS).filter(([k]) => s[k as keyof ServiceState]).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm mb-1"><span>{v.label}</span><span className="font-mono">{formatCurrency(v.cost)}</span></div>
                ))}<div className="mt-2 pt-2 border-t flex justify-between font-bold"><span>Total</span><span>{formatCurrency(calc.setupTotal)}</span></div>
              </div>
            </div>
            {roi && roi.recoveredRevenue > 0 && (
              <div className="bg-green-50 border border-green-200 p-5 rounded-xl print-card">
                <h3 className="font-bold text-green-800 mb-2">Projeção de Resultados</h3>
                <ROIChart current={roi.currentRevenue} projected={roi.projectedRevenue} isDark={false} />
                <div className="mt-3 p-3 bg-green-100 rounded-lg text-center"><p className="text-xs text-green-600 uppercase font-bold">Receita Recuperada</p><p className="text-xl font-bold text-green-700">+{formatCurrency(roi.recoveredRevenue)}/mês</p></div>
              </div>
            )}
            <div className="bg-slate-900 text-white p-5 rounded-xl print-card print-break-inside-avoid" data-print-investment>
              <div className="grid sm:grid-cols-2 gap-4 text-center">
                <div className="bg-orange-500/20 p-4 rounded-lg"><p className="text-xs text-orange-300 uppercase font-bold mb-1">Pagar Hoje</p><p className="text-2xl font-bold text-orange-400">{formatCurrency(calc.setupTotal)}</p></div>
                <div className="bg-blue-500/20 p-4 rounded-lg"><p className="text-xs text-blue-300 uppercase font-bold mb-1">Mensal</p><p className="text-2xl font-bold text-blue-400">{formatCurrency(calc.finalPrice)}/mês</p></div>
              </div>
            </div>
            <div className="flex gap-4 no-print">
              <button onClick={handlePrint} className="px-6 py-3 border border-gray-300 rounded-lg flex items-center gap-2" data-print-btn><span className="material-symbols-outlined">print</span>PDF</button>
              <button onClick={() => pricing?.stripeCheckoutUrl ? window.location.href = pricing.stripeCheckoutUrl : alert('Link não configurado.')}
                className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"><span className="material-symbols-outlined">credit_card</span>Assinar</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PROPOSAL VIEW
  if (viewMode === 'proposal' && proposalData) {
    const clientUrl = `${window.location.origin}${window.location.pathname}?data=${new URLSearchParams(window.location.search).get('data')}&view=client`;
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-8 no-print">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold mb-4">✅ Proposta Gerada</h1>
          <div className="bg-gray-100 p-4 rounded-lg mb-6 break-all text-sm font-mono">{clientUrl}</div>
          <div className="flex gap-4">
            <button onClick={() => { window.history.pushState({}, '', window.location.pathname); setViewMode('dashboard'); }} className="px-6 py-3 border border-gray-300 rounded-lg">Voltar</button>
            <button onClick={() => { navigator.clipboard.writeText(clientUrl); alert('Copiado!'); }} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg">Copiar Link</button>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div className={`min-h-screen ${bg} ${text} transition-colors`} data-print-container>
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} isDark={isDark} />
      
      <nav className={`sticky top-0 z-40 ${isDark ? 'bg-slate-800/95' : 'bg-white/95'} backdrop-blur border-b ${isDark ? 'border-slate-700' : 'border-gray-200'} px-6 py-3 flex justify-between items-center no-print`}>
        <div className="flex items-center gap-3">
          <div className="size-8 bg-blue-600 rounded-lg flex items-center justify-center text-white"><span className="material-symbols-outlined text-lg">dashboard</span></div>
          <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{SYSTEM_CONFIG.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTutorial(true)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
            <span className="material-symbols-outlined text-sm">help</span>Tutorial
          </button>
          <ThemeSwitcher theme={theme} setTheme={setTheme} />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 grid lg:grid-cols-12 gap-6 no-print">
        {/* LEFT */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex gap-2">
            <TabButton active={activeTab === 'config'} onClick={() => setActiveTab('config')} icon="tune" label="Config" isDark={isDark} />
            <TabButton active={activeTab === 'roi'} onClick={() => setActiveTab('roi')} icon="insights" label="ROI" isDark={isDark} />
          </div>

          {activeTab === 'config' ? (
            <>
              <div className={`${card} border rounded-xl p-4`}>
                <h2 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Cliente</h2>
                <div className="space-y-2">
                  <input value={client.companyName} onChange={e => setClient({...client, companyName: e.target.value})} placeholder="Empresa" className={`w-full ${input} border rounded-lg px-3 py-2 text-sm`} />
                  <input value={client.contactName} onChange={e => setClient({...client, contactName: e.target.value})} placeholder="Contato" className={`w-full ${input} border rounded-lg px-3 py-2 text-sm`} />
                  <input value={client.email} onChange={e => setClient({...client, email: e.target.value})} placeholder="E-mail" className={`w-full ${input} border rounded-lg px-3 py-2 text-sm`} />
                </div>
              </div>
              <div className={`${card} border rounded-xl p-4`}>
                <h2 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Plano</h2>
                <div className="space-y-1.5 mb-3">
                  {(['start', 'pro', 'enterprise'] as PlanLevel[]).map(p => (
                    <button key={p} onClick={() => applyPlanPreset(p)} className={`w-full py-2 px-3 rounded-lg text-left flex justify-between items-center text-sm ${plan === p ? 'bg-blue-600 text-white' : isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
                      <span className="font-medium capitalize">{p}</span>{plan === p && <span className="material-symbols-outlined text-sm">check</span>}
                    </button>
                  ))}
                </div>
                <div className="space-y-1">
                  {USER_TIERS.map(t => (
                    <button key={t.id} onClick={() => handleTierSelect(t)} className={`w-full py-1.5 px-3 rounded text-xs text-left flex justify-between ${selectedTier.id === t.id ? 'bg-blue-600 text-white' : isDark ? 'bg-slate-700/50 text-slate-400' : 'bg-gray-50 text-gray-600'}`}>
                      <span>{t.label}</span><span className="font-mono opacity-75">{formatCurrency(INTERNAL_PRICING.CRM_PER_USER * Math.min(t.maxUsers, 100))}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* TECHNICAL CUSTOMIZATION */}
              <div className={`${card} border rounded-xl p-4`}>
                <h2 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Customização</h2>
                <div className="space-y-3">
                  <div>
                    <p className={`text-xs font-medium mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Domínio (URL)</p>
                    {DOMAIN_OPTIONS.map(opt => (
                      <label key={opt.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer mb-1 ${technicalCustomization.domain === opt.id ? (isDark ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-blue-50 border border-blue-200') : ''}`}>
                        <input type="radio" name="domain" checked={technicalCustomization.domain === opt.id as any} onChange={() => setTechnicalCustomization(p => ({ ...p, domain: opt.id as any }))} className="accent-blue-600" />
                        <div className="flex-1"><p className={`text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>{opt.label}</p><p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{opt.description}</p></div>
                        {opt.cost > 0 && <span className="text-[10px] text-orange-500 font-bold">+{formatCurrency(opt.cost)}</span>}
                      </label>
                    ))}
                  </div>
                  <div>
                    <p className={`text-xs font-medium mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Layout & Branding</p>
                    {BRANDING_OPTIONS.map(opt => (
                      <label key={opt.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer mb-1 ${technicalCustomization.branding === opt.id as any ? (isDark ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-blue-50 border border-blue-200') : ''}`}>
                        <input type="radio" name="branding" checked={technicalCustomization.branding === opt.id as any} onChange={() => setTechnicalCustomization(p => ({ ...p, branding: opt.id as any }))} className="accent-blue-600" />
                        <div className="flex-1"><p className={`text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>{opt.label}</p><p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{opt.description}</p></div>
                        {opt.cost > 0 && <span className="text-[10px] text-orange-500 font-bold">+{formatCurrency(opt.cost)}</span>}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={`${card} border rounded-xl p-4`}>
              <h2 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Calculadora ROI</h2>
              {showROICallout && (
                <div className={`p-2 rounded-lg mb-3 flex items-start gap-2 ${isDark ? 'bg-amber-500/20' : 'bg-amber-50'}`}>
                  <span>💡</span><p className={`text-[10px] flex-1 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>Alimenta gráficos na proposta.</p>
                  <button onClick={() => setShowROICallout(false)} className="text-[10px] opacity-60">✕</button>
                </div>
              )}
              <div className="space-y-3">
                <div><Tooltip content={ROI_TOOLTIPS.ticketMedio}><label className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Ticket Médio</label></Tooltip>
                  <input type="number" value={roiInputs.ticketMedio} onChange={e => setRoiInputs({...roiInputs, ticketMedio: +e.target.value})} className={`w-full mt-1 ${input} border rounded-lg px-3 py-1.5 text-sm`} /></div>
                <div><Tooltip content={ROI_TOOLTIPS.leadsPerMonth}><label className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Leads/mês</label></Tooltip>
                  <input type="number" value={roiInputs.leadsPerMonth} onChange={e => setRoiInputs({...roiInputs, leadsPerMonth: +e.target.value})} className={`w-full mt-1 ${input} border rounded-lg px-3 py-1.5 text-sm`} /></div>
                <div><Tooltip content={ROI_TOOLTIPS.currentConversionRate}><label className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Taxa Conversão (%)</label></Tooltip>
                  <input type="number" value={roiInputs.currentConversionRate} onChange={e => setRoiInputs({...roiInputs, currentConversionRate: +e.target.value})} className={`w-full mt-1 ${input} border rounded-lg px-3 py-1.5 text-sm`} /></div>
                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-blue-50'}`}>
                  <div className="flex justify-between items-center mb-1"><Tooltip content={ROI_TOOLTIPS.conversionImprovement}><label className={`text-[10px] ${isDark ? 'text-slate-300' : 'text-blue-700'}`}>Melhoria</label></Tooltip>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-blue-700'}`}>+{roiInputs.conversionImprovement}%</span></div>
                  <input type="range" min={5} max={50} step={5} value={roiInputs.conversionImprovement} onChange={e => setRoiInputs({...roiInputs, conversionImprovement: +e.target.value})} className="w-full accent-blue-600" />
                  <div className="grid grid-cols-2 gap-2 mt-2 text-[9px]">
                    <div className={`p-1.5 rounded ${isDark ? 'bg-slate-600' : 'bg-white'}`}><p className={isDark ? 'text-slate-400' : 'text-gray-500'}>Atual</p><p className="font-bold">{roiInputs.currentConversionRate}%</p></div>
                    <div className={`p-1.5 rounded ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}><p className="text-green-500">Otimizado</p><p className="font-bold text-green-600">{roiOutputs.newConversionRate.toFixed(1)}%</p></div>
                  </div>
                </div>
              </div>
              <div className={`p-3 rounded-lg mt-3 ${isDark ? 'bg-green-500/20' : 'bg-green-50'}`}>
                <p className="text-[9px] uppercase font-bold text-green-500 mb-1">Receita Recuperada</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-green-700'}`}>+{formatCurrency(roiOutputs.recoveredRevenue)}/mês</p>
              </div>
              <div className="mt-3"><ROIChart current={roiOutputs.currentRevenue} projected={roiOutputs.projectedRevenue} isDark={isDark} /></div>
            </div>
          )}
        </div>

        {/* MIDDLE */}
        <div className="lg:col-span-5 space-y-4">
          <div className={`${card} border rounded-xl p-4`}>
            <h2 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Funcionalidades</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {(['crm', 'whatsapp', 'ai', 'conversions'] as (keyof FeatureState)[]).map(k => {
                const disabled = k === 'ai' && !features.whatsapp;
                return (
                  <div key={k} onClick={() => !disabled && toggleFeature(k)} className={`p-2.5 rounded-lg border cursor-pointer ${disabled ? 'opacity-40' : ''} ${features[k] ? 'border-blue-500 bg-blue-500/10' : isDark ? 'border-slate-600' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2"><input type="checkbox" checked={features[k]} readOnly className="w-3.5 h-3.5 accent-blue-600" />
                      <Tooltip content={FEATURE_TOOLTIPS[k]}><span className={`text-sm font-medium ${features[k] ? 'text-blue-500' : ''}`}>{k.toUpperCase()}</span></Tooltip></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={`${card} border rounded-xl p-4`}>
            <div className="flex justify-between items-center mb-3"><h2 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Serviços</h2><span className="text-[9px] bg-orange-500/20 text-orange-500 px-1.5 py-0.5 rounded-full font-bold">TAXA ÚNICA</span></div>
            <div className="space-y-2">
              {Object.entries(SERVICE_DETAILS).map(([k, v]) => (
                <div key={k} className={`flex items-center justify-between p-2.5 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'} ${v.required ? 'border border-orange-500/30' : ''}`}>
                  <div className="flex items-center gap-2"><span className={`material-symbols-outlined text-base ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>{v.icon}</span>
                    <div><p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{v.label} {v.required && <span className="text-[8px] bg-orange-500 text-white px-1 rounded">OBR</span>}</p></div></div>
                  <div className="flex items-center gap-2"><span className="text-xs font-mono">{formatCurrency(v.cost)}</span><input type="checkbox" checked={services[k as keyof ServiceState]} disabled={v.required} onChange={() => toggleService(k as keyof ServiceState)} className="w-4 h-4 accent-blue-600" /></div>
                </div>
              ))}
            </div>
          </div>
          {/* J-CURVE CHART */}
          <JCurveChart data={jCurveData} paybackMonth={paybackMonth} isDark={isDark} />
          <div className={`${card} border rounded-xl p-4`}>
            <h2 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Stripe</h2>
            <input value={stripeUrl} onChange={e => setStripeUrl(e.target.value)} placeholder="https://checkout.stripe.com/..." className={`w-full ${input} border rounded-lg px-3 py-2 text-sm`} />
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-4 space-y-4">
          <HighTicketAlert valuePricing={valuePricing} onApply={applyValuePrice} isDark={isDark} />
          <div className={`${card} border rounded-xl p-4`}>
            <h2 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Preço</h2>
            <div className={`p-2.5 rounded-lg mb-3 ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
              <div className="flex justify-between text-sm mb-2"><span>Base</span><span className="font-mono">{formatCurrency(baseCost)}</span></div>
              <div className="flex justify-between items-center text-xs mb-1"><span>Margem</span><span className="font-bold text-blue-500">{markupPercent}%</span></div>
              <input type="range" min="50" max="300" step="10" value={markupPercent} onChange={e => { setMarkupPercent(+e.target.value); setManualPrice(null); }} className="w-full accent-blue-600" />
            </div>
            <div className="space-y-1.5 mb-3">
              {COMPLEXITY_FACTORS.map(f => (
                <label key={f.id} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                  <input type="checkbox" checked={complexity[f.id as keyof ComplexityState]} onChange={() => toggleComplexity(f.id as keyof ComplexityState)} className="w-3.5 h-3.5 accent-blue-600" />
                  <span className="flex-1">{f.label}</span><span className="text-green-500 font-bold">+{f.percentage}%</span>
                </label>
              ))}
            </div>
            <div className={`p-2.5 rounded-lg mb-3 ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
              <div className="flex justify-between items-center"><span className="text-sm">Final</span>
                <input type="number" value={manualPrice !== null ? manualPrice : calculatedPrice} onChange={e => setManualPrice(+e.target.value)} className={`w-24 text-right font-mono font-bold ${input} border rounded px-2 py-1`} /></div>
              {manualPrice !== null && <p className="text-[9px] text-orange-400 mt-1">⚠️ Manual</p>}
            </div>
            <div className="space-y-2">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-orange-500/20' : 'bg-orange-50'}`}><p className="text-[9px] uppercase font-bold text-orange-500 mb-0.5">Setup</p><p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-orange-700'}`}>{formatCurrency(setupTotal)}</p></div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}><p className="text-[9px] uppercase font-bold text-blue-500 mb-0.5">Mensal</p><p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-blue-700'}`}>{formatCurrency(finalPrice)}/mês</p></div>
            </div>
          </div>
          <div className={`${card} border rounded-xl p-4`}>
            <LivePreview client={client} plan={plan} tier={selectedTier} features={features} finalPrice={finalPrice} setupTotal={setupTotal} roiOutputs={roiOutputs} isDark={isDark} onPrint={handlePrint} />
            <button onClick={handleGenerate} className="w-full mt-3 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">link</span>Gerar Link
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}