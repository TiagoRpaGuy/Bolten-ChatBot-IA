# 🚀 Bolten - Configurador de Propostas Comerciais

Sistema avançado de configuração de propostas comerciais para parceiros de agência, com precificação dinâmica, análise de ROI e geração de PDF.

---

## ✨ Funcionalidades Principais

### 📊 **Sales Wizard - Diagnóstico Guiado**

- Wizard de 5 etapas para diagnóstico completo do cliente
- **Etapa 1:** Dimensionamento (quantidade de usuários, plano)
- **Etapa 2:** Discovery Financeiro (ticket médio, leads/mês, taxa de conversão)
- **Etapa 3:** Escopo Técnico (features necessárias)
- **Etapa 4:** Serviços de Implementação
- **Etapa 5:** Contrato e Markup
- Resumo visual em tempo real durante o wizard
- Mapeamento automático para a calculadora principal

### 💰 **Precificação Flexível**

- **3 Modelos de Precificação:**
  - Por Usuário (Volume Discount)
  - Tier Fixo (Starter, Pro, Enterprise)
  - Híbrido
- Preços editáveis para serviços e fatores de complexidade
- Margem de lucro ajustável (1.5x a 4.0x)
- Toggle Auto/Manual para controle total

### 🔌 **Módulo de Automação & Integrações (N8N)**

- Card dedicado para configuração de integrações
- **Níveis de Complexidade:**
  - Nenhuma (R$ 0)
  - Baixa - Webhooks (+R$ 1.000)
  - Média - Google/Zapier (+R$ 3.000)
  - Alta - ERP/Banco de Dados (+R$ 8.000)
  - Personalizada (valor manual)
- Custo somado automaticamente ao Setup Total

### 📈 **Calculadora de ROI Avançada**

- Inputs: Ticket Médio, Leads/Mês, Taxa de Conversão
- **Melhoria Esperada:** Slider híbrido de 0% a 500%
- Cálculo automático de Receita Recuperada
- Explicação detalhada do cálculo (expandível)
- Tooltips explicativos em cada campo

### 📉 **Gráfico J-Curve**

- Visualização do ROI em 12 meses
- Identificação automática do mês de payback
- Cálculo de lucro acumulado no ano
- Cores dinâmicas (vermelho para prejuízo, verde para lucro)

### 🛠️ **Serviços de Implementação**

- Setup Técnico, Treinamento, Migração de Dados
- Preços editáveis pelo vendedor
- Toggle livre para qualquer serviço (bug fix aplicado)

### ⚡ **Fatores de Complexidade**

- Urgência na Entrega (+R$ 500)
- Reuniões Presenciais (+R$ 300)
- Suporte Premium (+R$ 800)
- Valores editáveis em tempo real

### 🖨️ **Geração de PDF**

- Layout otimizado para impressão
- Proposta comercial completa
- Gráfico J-Curve incluído
- Detalhamento de custos e ROI

### 🎨 **Interface Moderna**

- Design responsivo (desktop e mobile)
- Tema claro/escuro
- Animações suaves
- Tooltips e ajuda contextual

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/TiagoRpaGuy/Bolten-ChatBot-IA.git

# 2. Entre na pasta do projeto
cd Bolten-ChatBot-IA

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente (opcional)
cp .env.example .env.local
# Edite .env.local com sua chave Stripe

# 5. Execute o servidor de desenvolvimento
npm run dev
```

O projeto estará disponível em: **http://localhost:3000**

---

## 📁 Estrutura do Projeto

```
bolten-proposal-configurator/
├── App.tsx              # Componente principal
├── SalesWizard.tsx      # Wizard de diagnóstico
├── types.ts             # Tipos TypeScript e constantes
├── index.html           # HTML base
├── index.tsx            # Entry point React
├── index.css            # Estilos Tailwind
├── vite.config.ts       # Configuração Vite
├── package.json         # Dependências
└── README.md            # Documentação
```

---

## 🔧 Tecnologias

- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (estilização)
- **Material Symbols** (ícones)
- **Stripe** (integração de pagamentos)

---

## 📝 Uso

### Fluxo Básico

1. **Novo Diagnóstico:** Clique em "Novo Diagnóstico" para iniciar o Sales Wizard
2. **Configure o Cliente:** Preencha os dados na aba Config
3. **Defina Integrações:** Selecione o nível de automação N8N
4. **Ajuste Preços:** Use a aba Preço para personalizar valores
5. **Analise ROI:** Veja o impacto financeiro na aba ROI
6. **Gere PDF:** Clique em "Gerar PDF" para a proposta final

### Dicas

- Use o toggle Auto/Manual para controle total de preços
- O slider de ROI vai até 500% para cenários de alta automação
- Todos os serviços podem ser marcados/desmarcados livremente
- Os preços de serviços e complexidade são editáveis

---

## 🌐 Deploy

O projeto está configurado para deploy automático no **Vercel**.

**URL de Produção:** https://bolten-chatbot-ia.vercel.app

---

## 📋 Changelog (v2.0)

### Novas Funcionalidades

- ✅ Sales Wizard com 5 etapas de diagnóstico
- ✅ Módulo N8N para integrações avançadas
- ✅ Slider de ROI estendido (0% a 500%)
- ✅ Preços editáveis para serviços e complexidade
- ✅ Discovery Financeiro no Wizard

### Correções

- 🐛 Bug fix: Checkbox "Setup Técnico" agora pode ser desmarcado
- 🐛 Correção de encoding UTF-8 para caracteres especiais

### Melhorias

- 🎨 Tooltips explicativos em todos os campos de ROI
- 🎨 Input numérico + slider híbrido para melhoria esperada
- 🎨 Indicadores visuais de faixas no slider (0%, 100%, 250%, 500%)

---

## 📄 Licença

MIT License - Uso livre para fins comerciais e pessoais.

---

## 👨‍💻 Autor

Desenvolvido para **Bolten** - Plataforma de Automação Comercial
