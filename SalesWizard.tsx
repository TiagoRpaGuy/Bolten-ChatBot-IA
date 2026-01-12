import React, { useState } from 'react';
import {
  WizardAnswers, WIZARD_INITIAL_STATE, WIZARD_STEPS, WIZARD_QUESTIONS,
  mapWizardToCalculator, getWizardSummary, IntegrationLevel, CalculatorPreset,
} from './types';

// ========================================
// UTILITIES
// ========================================
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

// ========================================
// STEP INDICATOR
// ========================================
interface StepIndicatorProps {
  currentStep: number;
  isDark: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, isDark }) => (
  <div className="flex items-center justify-center gap-2 mb-8">
    {WIZARD_STEPS.map((step, i) => {
      const isActive = step.id === currentStep;
      const isCompleted = step.id < currentStep;
      
      return (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                  : isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isDark 
                      ? 'bg-slate-700 text-slate-400' 
                      : 'bg-gray-200 text-gray-500'
              }`}
            >
              {isCompleted ? (
                <span className="material-symbols-outlined text-lg">check</span>
              ) : (
                <span className="material-symbols-outlined text-lg">{step.icon}</span>
              )}
            </div>
            <span className={`text-[10px] mt-1 font-medium ${
              isActive ? 'text-blue-600' : isDark ? 'text-slate-500' : 'text-gray-500'
            }`}>
              {step.title}
            </span>
          </div>
          {i < WIZARD_STEPS.length - 1 && (
            <div className={`w-8 h-0.5 ${isCompleted ? 'bg-green-500' : isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ========================================
// QUESTION CARD
// ========================================
interface QuestionCardProps {
  question: string;
  hint?: string;
  children: React.ReactNode;
  isDark: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, hint, children, isDark }) => (
  <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} mb-4`}>
    <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      {question}
    </h3>
    {hint && (
      <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
        {hint}
      </p>
    )}
    {children}
  </div>
);

// ========================================
// OPTION BUTTON
// ========================================
interface OptionButtonProps {
  label: string;
  description?: string;
  icon?: string;
  isSelected: boolean;
  onClick: () => void;
  isDark: boolean;
  badge?: string;
}

const OptionButton: React.FC<OptionButtonProps> = ({ 
  label, description, icon, isSelected, onClick, isDark, badge 
}) => (
  <button
    onClick={onClick}
    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
      isSelected 
        ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-200' 
        : isDark 
          ? 'border-slate-600 bg-slate-700/50 hover:border-slate-500' 
          : 'border-gray-200 hover:border-gray-300 bg-gray-50'
    }`}
  >
    <div className="flex items-center gap-3">
      {icon && (
        <span className={`material-symbols-outlined text-2xl ${isSelected ? 'text-blue-500' : isDark ? 'text-slate-400' : 'text-gray-400'}`}>
          {icon}
        </span>
      )}
      <div className="flex-1">
        <p className={`font-semibold ${isSelected ? 'text-blue-600' : isDark ? 'text-slate-200' : 'text-gray-800'}`}>
          {label}
        </p>
        {description && (
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
            {description}
          </p>
        )}
      </div>
      {badge && (
        <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold">
          {badge}
        </span>
      )}
      {isSelected && (
        <span className="text-blue-500 material-symbols-outlined">check_circle</span>
      )}
    </div>
  </button>
);

// ========================================
// CHECKBOX OPTION
// ========================================
interface CheckboxOptionProps {
  label: string;
  description?: string;
  icon?: string;
  isSelected: boolean;
  onToggle: () => void;
  isDark: boolean;
  badge?: string;
}

const CheckboxOption: React.FC<CheckboxOptionProps> = ({ 
  label, description, icon, isSelected, onToggle, isDark, badge 
}) => (
  <button
    onClick={onToggle}
    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
      isSelected 
        ? 'border-blue-500 bg-blue-500/10' 
        : isDark 
          ? 'border-slate-600 bg-slate-700/50 hover:border-slate-500' 
          : 'border-gray-200 hover:border-gray-300'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
        isSelected ? 'bg-blue-500 border-blue-500' : isDark ? 'border-slate-500' : 'border-gray-300'
      }`}>
        {isSelected && <span className="material-symbols-outlined text-sm text-white">check</span>}
      </div>
      {icon && (
        <span className={`material-symbols-outlined text-xl ${isSelected ? 'text-blue-500' : isDark ? 'text-slate-400' : 'text-gray-400'}`}>
          {icon}
        </span>
      )}
      <div className="flex-1">
        <p className={`font-medium ${isSelected ? 'text-blue-600' : isDark ? 'text-slate-200' : 'text-gray-800'}`}>
          {label}
        </p>
        {description && (
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
            {description}
          </p>
        )}
      </div>
      {badge && (
        <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold">
          {badge}
        </span>
      )}
    </div>
  </button>
);

// ========================================
// STEP COMPONENTS
// ========================================

// Step 1: Dimensionamento
interface Step1Props {
  answers: WizardAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<WizardAnswers>>;
  isDark: boolean;
}

const Step1Dimensionamento: React.FC<Step1Props> = ({ answers, setAnswers, isDark }) => {
  const q = WIZARD_QUESTIONS.step1;
  
  return (
    <>
      {/* Team Size */}
      <QuestionCard question={q.teamSize.question} hint={q.teamSize.hint} isDark={isDark}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAnswers(a => ({ ...a, teamSize: Math.max(1, a.teamSize - 1) }))}
            className={`w-12 h-12 rounded-xl text-xl font-bold ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={100}
            value={answers.teamSize}
            onChange={e => setAnswers(a => ({ ...a, teamSize: Math.max(1, +e.target.value || 1) }))}
            className={`w-24 text-center text-3xl font-bold py-3 rounded-xl border ${
              isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'
            }`}
          />
          <button
            onClick={() => setAnswers(a => ({ ...a, teamSize: Math.min(100, a.teamSize + 1) }))}
            className={`w-12 h-12 rounded-xl text-xl font-bold ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            +
          </button>
          <span className={`text-lg ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            usuário{answers.teamSize > 1 ? 's' : ''}
          </span>
        </div>
        
        {/* Quick select */}
        <div className="flex gap-2 mt-4">
          {[1, 2, 5, 10, 20, 50].map(n => (
            <button
              key={n}
              onClick={() => setAnswers(a => ({ ...a, teamSize: n }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                answers.teamSize === n 
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
        
        {/* Tier indicator */}
        <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-blue-50'}`}>
          <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-blue-700'}`}>
            Plano sugerido: {' '}
            <span className="font-bold">
              {answers.teamSize < 5 ? 'Start' : answers.teamSize < 20 ? 'Pro' : 'Enterprise'}
            </span>
          </span>
        </div>
      </QuestionCard>
      
      {/* AI Toggle */}
      <QuestionCard question={q.wantsAI.question} hint={q.wantsAI.hint} isDark={isDark}>
        <div className="grid grid-cols-2 gap-3">
          <OptionButton
            label={q.wantsAI.optionYes}
            icon="smart_toy"
            isSelected={answers.wantsAI}
            onClick={() => setAnswers(a => ({ ...a, wantsAI: true }))}
            isDark={isDark}
          />
          <OptionButton
            label={q.wantsAI.optionNo}
            icon="person"
            isSelected={!answers.wantsAI}
            onClick={() => setAnswers(a => ({ ...a, wantsAI: false }))}
            isDark={isDark}
          />
        </div>
      </QuestionCard>
    </>
  );
};

// Step 2: Escopo Técnico
const Step2EscopoTecnico: React.FC<Step1Props> = ({ answers, setAnswers, isDark }) => {
  const q = WIZARD_QUESTIONS.step2;
  
  return (
    <>
      {/* Integration Level */}
      <QuestionCard question={q.integrationLevel.question} isDark={isDark}>
        <div className="space-y-3">
          {q.integrationLevel.options.map(opt => (
            <OptionButton
              key={opt.value}
              label={opt.label}
              description={opt.description}
              icon={opt.icon}
              isSelected={answers.integrationLevel === opt.value}
              onClick={() => setAnswers(a => ({ ...a, integrationLevel: opt.value as IntegrationLevel }))}
              isDark={isDark}
            />
          ))}
        </div>
      </QuestionCard>
      
      {/* Conversions */}
      <QuestionCard question={q.wantsConversions.question} hint={q.wantsConversions.hint} isDark={isDark}>
        <div className="grid grid-cols-2 gap-3">
          <OptionButton
            label="Sim, precisa"
            icon="analytics"
            isSelected={answers.wantsConversions}
            onClick={() => setAnswers(a => ({ ...a, wantsConversions: true }))}
            isDark={isDark}
          />
          <OptionButton
            label="Não precisa"
            icon="close"
            isSelected={!answers.wantsConversions}
            onClick={() => setAnswers(a => ({ ...a, wantsConversions: false }))}
            isDark={isDark}
          />
        </div>
      </QuestionCard>
    </>
  );
};

// Step 3: Serviços
const Step3Servicos: React.FC<Step1Props> = ({ answers, setAnswers, isDark }) => {
  const q = WIZARD_QUESTIONS.step3;
  
  return (
    <QuestionCard question={q.services.question} hint={q.services.hint} isDark={isDark}>
      <div className="space-y-3">
        <CheckboxOption
          label="Migração de Dados"
          description="Importar contatos e histórico antigos"
          icon="cloud_upload"
          isSelected={answers.servicesMigration}
          onToggle={() => setAnswers(a => ({ ...a, servicesMigration: !a.servicesMigration }))}
          isDark={isDark}
        />
        <CheckboxOption
          label="Treinamento da Equipe"
          description="Sessão de 2h ao vivo + gravação"
          icon="school"
          isSelected={answers.servicesTraining}
          onToggle={() => setAnswers(a => ({ ...a, servicesTraining: !a.servicesTraining }))}
          isDark={isDark}
        />
        <CheckboxOption
          label="Onboarding Assistido"
          description="Setup técnico acompanhado (obrigatório)"
          icon="support_agent"
          isSelected={answers.servicesOnboarding}
          onToggle={() => setAnswers(a => ({ ...a, servicesOnboarding: !a.servicesOnboarding }))}
          isDark={isDark}
        />
      </div>
    </QuestionCard>
  );
};

// Step 4: Fatores de Risco
const Step4Contrato: React.FC<Step1Props> = ({ answers, setAnswers, isDark }) => {
  const q = WIZARD_QUESTIONS.step4;
  
  return (
    <QuestionCard question={q.riskFactors.question} hint={q.riskFactors.hint} isDark={isDark}>
      <div className="space-y-3">
        {q.riskFactors.options.map(opt => (
          <CheckboxOption
            key={opt.id}
            label={opt.label}
            description={opt.description}
            icon={opt.icon}
            badge={`+${opt.percent}%`}
            isSelected={
              opt.id === 'urgency' ? answers.hasUrgency :
              opt.id === 'meetings' ? answers.hasMeetings :
              answers.hasPremiumSupport
            }
            onToggle={() => setAnswers(a => ({
              ...a,
              hasUrgency: opt.id === 'urgency' ? !a.hasUrgency : a.hasUrgency,
              hasMeetings: opt.id === 'meetings' ? !a.hasMeetings : a.hasMeetings,
              hasPremiumSupport: opt.id === 'support' ? !a.hasPremiumSupport : a.hasPremiumSupport,
            }))}
            isDark={isDark}
          />
        ))}
      </div>
    </QuestionCard>
  );
};

// ========================================
// SUMMARY PANEL
// ========================================
interface SummaryPanelProps {
  answers: WizardAnswers;
  isDark: boolean;
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({ answers, isDark }) => {
  const summary = getWizardSummary(answers);
  const preset = mapWizardToCalculator(answers);
  
  return (
    <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
      <h3 className={`font-bold text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        📋 Resumo da Configuração
      </h3>
      <div className="space-y-1.5">
        {summary.map((item, i) => (
          <p key={i} className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            {item}
          </p>
        ))}
      </div>
      <div className={`mt-3 pt-3 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
        <p className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
          Plano: <span className="text-blue-500 uppercase">{preset.plan}</span>
        </p>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Modelo: {preset.pricingModel === 'per_user' ? 'Por Usuário' : 'Pacote Fixo'}
        </p>
      </div>
    </div>
  );
};

// ========================================
// MAIN SALES WIZARD COMPONENT
// ========================================
export interface SalesWizardProps {
  onComplete: (preset: CalculatorPreset) => void;
  onCancel: () => void;
  isDark?: boolean;
}

const SalesWizard: React.FC<SalesWizardProps> = ({ onComplete, onCancel, isDark = false }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<WizardAnswers>(WIZARD_INITIAL_STATE);
  
  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(s => s + 1);
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(s => s - 1);
    }
  };
  
  const handleComplete = () => {
    const preset = mapWizardToCalculator(answers);
    onComplete(preset);
  };
  
  const bg = isDark ? 'bg-slate-900' : 'bg-gray-50';
  const text = isDark ? 'text-slate-300' : 'text-gray-700';
  
  return (
    <div className={`min-h-screen ${bg} ${text}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 ${isDark ? 'bg-slate-800' : 'bg-white'} border-b ${isDark ? 'border-slate-700' : 'border-gray-200'} px-4 py-3`}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white">
              <span className="material-symbols-outlined">auto_fix_high</span>
            </div>
            <div>
              <h1 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Sales Wizard
              </h1>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Diagnóstico Inicial
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </header>
      
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} isDark={isDark} />
        
        {/* Current Step Title */}
        <div className="text-center mb-6">
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {WIZARD_STEPS[currentStep - 1].title}
          </h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            {WIZARD_STEPS[currentStep - 1].subtitle}
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Questions */}
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <Step1Dimensionamento answers={answers} setAnswers={setAnswers} isDark={isDark} />
            )}
            {currentStep === 2 && (
              <Step2EscopoTecnico answers={answers} setAnswers={setAnswers} isDark={isDark} />
            )}
            {currentStep === 3 && (
              <Step3Servicos answers={answers} setAnswers={setAnswers} isDark={isDark} />
            )}
            {currentStep === 4 && (
              <Step4Contrato answers={answers} setAnswers={setAnswers} isDark={isDark} />
            )}
          </div>
          
          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <SummaryPanel answers={answers} isDark={isDark} />
          </div>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={currentStep === 1 ? onCancel : handleBack}
            className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 ${
              isDark 
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {currentStep === 1 ? 'close' : 'arrow_back'}
            </span>
            {currentStep === 1 ? 'Cancelar' : 'Voltar'}
          </button>
          
          {currentStep < WIZARD_STEPS.length ? (
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              Próximo
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
            >
              <span className="material-symbols-outlined text-lg">rocket_launch</span>
              Gerar Pré-Orçamento
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default SalesWizard;
