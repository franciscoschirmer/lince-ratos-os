# /ads-ratos relatorio

Gera um dashboard HTML completo e autocontido com dados reais de performance
de tráfego pago. Design moderno, dark mode, gráficos interativos e classificação
automática vs benchmarks brasileiros.

## REGRA CRÍTICA

**NUNCA usar MCPs (fb-ads-mcp-server, adloop, etc) neste fluxo.**
Toda execução DEVE ser via scripts Python da skill meta-ads-ratos:
```bash
python3 ~/.claude/skills/meta-ads-ratos/scripts/<script>.py <comando>
```

## O que este comando faz

1. Identifica cliente e período
2. Puxa dados reais das APIs (Meta e/ou Google) via scripts Python
3. Calcula KPIs com deltas vs período anterior
4. Classifica cada métrica vs benchmarks BR do nicho
5. Gera dashboard HTML único autocontido com gráficos Chart.js
6. Salva em `reports/` e abre no navegador

## Instruções para execução

### PASSO 0 — Identificar cliente, plataforma e período

**OBRIGATÓRIO: SEMPRE perguntar antes de rodar. Nunca assumir.**

1. Ler `contas.yaml` da skill ads-ratos para identificar o cliente
2. Se houver mais de um cliente, perguntar qual
3. **SEMPRE perguntar a plataforma**: "Qual plataforma? **Meta Ads**, **Google Ads**, **GA4**, ou **todas**?"
4. Perguntar o período (padrão: últimos 7 dias)
5. Identificar o nicho do cliente (do contas.yaml ou perguntar)
6. Ler `references/benchmarks-br.md` para ter os benchmarks do nicho
7. **Design system (opcional)**: verificar se existe `marca/design-guide.md` no workspace
   (CC-OS RATOS). Se existir, ler e usar as cores, fontes e logo do cliente nas
   variáveis CSS do dashboard. Se não existir, usar o tema padrão Ads Ratos.

### PASSO 1 — Verificar skills de execução

```bash
# Meta Ads
ls ~/.claude/skills/meta-ads-ratos/SKILL.md 2>/dev/null && echo "META_OK"

# Google Ads
ls ~/.claude/skills/google-ads-ratos/SKILL.md 2>/dev/null && echo "GOOGLE_OK"
```

Se a skill necessária não estiver instalada, orientar o usuário a instalar antes de prosseguir.

### PASSO 2 — Coletar dados Meta Ads (se disponível)

```bash
# Insights da conta — período atual
python3 ~/.claude/skills/meta-ads-ratos/scripts/insights.py account \
  --id act_XXX --date-preset last_7d

# Insights por campanha
python3 ~/.claude/skills/meta-ads-ratos/scripts/insights.py account \
  --id act_XXX --date-preset last_7d --level campaign

# Insights por conjunto de anúncios
python3 ~/.claude/skills/meta-ads-ratos/scripts/insights.py account \
  --id act_XXX --date-preset last_7d --level adset

# Insights por anúncio
python3 ~/.claude/skills/meta-ads-ratos/scripts/insights.py account \
  --id act_XXX --date-preset last_7d --level ad

# Evolução diária (para gráfico)
python3 ~/.claude/skills/meta-ads-ratos/scripts/insights.py account \
  --id act_XXX --date-preset last_7d --time-increment 1

# Insights do período anterior (para deltas)
python3 ~/.claude/skills/meta-ads-ratos/scripts/insights.py account \
  --id act_XXX --time-range '{"since":"DATA_INICIO_ANT","until":"DATA_FIM_ANT"}'

# Campanhas ativas (nomes, status, orçamento)
python3 ~/.claude/skills/meta-ads-ratos/scripts/read.py campaigns \
  --account act_XXX --status ACTIVE

# Anúncios com criativos
python3 ~/.claude/skills/meta-ads-ratos/scripts/read.py ads \
  --account act_XXX --status ACTIVE
```

### PASSO 3 — Coletar dados Google Ads (se disponível)

Usar a skill `google-ads-ratos`:

```bash
# KPIs da conta
python3 ~/.claude/skills/google-ads-ratos/scripts/insights.py account \
  --customer-id XXX --date-range LAST_7_DAYS

# Campanhas
python3 ~/.claude/skills/google-ads-ratos/scripts/insights.py campaign \
  --customer-id XXX --date-range LAST_7_DAYS

# Evolução diária
python3 ~/.claude/skills/google-ads-ratos/scripts/insights.py daily \
  --customer-id XXX --date-range LAST_7_DAYS
```

### PASSO 3B — Coletar dados GA4 (se disponível)

Usar a skill `ga4-ratos` para dados pós-clique:

```bash
# Landing pages com bounce rate
python3 ~/.claude/skills/ga4-ratos/scripts/reports.py landing-pages \
  --property XXX --start-date 7daysAgo --end-date today

# Fontes de tráfego
python3 ~/.claude/skills/ga4-ratos/scripts/reports.py traffic-sources \
  --property XXX --start-date 7daysAgo --end-date today
```

### PASSO 4 — Calcular KPIs

Para cada plataforma, calcular:

```
Gasto total     = sum(spend)
Conversões      = sum(actions[lead/purchase/etc])
CPL             = gasto / conversões
CTR             = cliques / impressões × 100
CPC             = gasto / cliques
CPM             = gasto / impressões × 1000
ROAS            = receita / gasto (se disponível)
Taxa Conv       = conversões / cliques × 100
Frequência      = impressões / alcance (Meta)
```

Calcular os mesmos KPIs para o período anterior e gerar deltas:
```
Delta = ((valor_atual - valor_anterior) / valor_anterior) × 100
```

### PASSO 5 — Classificar vs benchmarks BR

Ler `references/benchmarks-br.md` e para cada métrica:

1. Identificar o nicho do cliente
2. Comparar com a tabela do nicho
3. Atribuir classificação e cor:

| Nível | Cor hex | Badge |
|---|---|---|
| EXCELENTE | #10b981 (verde) | Acima do benchmark superior |
| BOM | #3b82f6 (azul) | Dentro do esperado |
| ATENÇÃO | #f59e0b (amarelo) | Abaixo do esperado |
| CRÍTICO | #ef4444 (vermelho) | Muito abaixo, ação urgente |

4. Considerar sazonalidade (mês atual vs tabela de sazonalidade)

### PASSO 6 — Gerar alertas e recomendações

Analisar os dados e gerar:

| Prioridade | Tipos de alerta |
|---|---|
| URGENTE (vermelho) | Zero conversões com gasto, CPL > 3x benchmark, campanha travada |
| ATENÇÃO (amarelo) | CPL acima da meta, CTR abaixo do benchmark, frequência alta |
| SUGESTÃO (azul) | Oportunidade de escalar, criativo pra testar, público pra expandir |

Cada alerta DEVE ter:
- Descrição com números específicos ("CPL de R$85 está 112% acima do benchmark de R$40")
- Impacto estimado ("economia potencial de R$X/mês")
- Ação recomendada ("pausar campanha X e redistribuir orçamento")

Ordenar recomendações por impacto financeiro (maior economia primeiro).

### PASSO 7 — Gerar o dashboard HTML

Gerar um arquivo HTML ÚNICO e autocontido com todas as seções abaixo.
O HTML é GERADO pelo Claude com os dados reais embarcados — não é um template estático.

#### Estrutura do HTML

```
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório — {CLIENTE} — {PERÍODO}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
  <!-- CSS inline completo -->
</head>
<body>
  <!-- Seções do dashboard -->
  <script>
    // Dados JSON embarcados
    const DADOS = { ... };
    // Lógica de gráficos e interações
  </script>
</body>
</html>
```

#### Design — Identidade Visual DobraLabs

O relatório usa a identidade visual oficial da DobraLabs: tema claro, Bricolage Grotesque,
amarelo de destaque, cards com borda tracejada. **SEM dark mode** — tema único claro.

**Fontes obrigatórias (Google Fonts):**
```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

- **Bricolage Grotesque** — títulos, corpo, textos gerais
- **JetBrains Mono** — labels de seção, badges, pills, valores de KPI

**Variáveis CSS obrigatórias:**

```css
:root {
  /* Cores base DobraLabs */
  --bg: #FFFFFF;
  --surface: #F7F7F7;
  --surface-2: #F2F2F2;
  --border: #DDDDDD;
  --border-dash: #BBBBBB;
  --yellow: #FFD600;
  --yellow-soft: #FFF8D6;
  --yellow-border: #E0C800;
  --black: #111111;
  --green: #00A67D;
  --green-soft: rgba(0, 166, 125, 0.08);
  --green-border: rgba(0, 166, 125, 0.25);
  --blue: #2B6CB0;
  --blue-soft: rgba(43, 108, 176, 0.06);
  --blue-border: rgba(43, 108, 176, 0.18);
  --text: #111111;
  --text-dim: #555555;
  --text-muted: #999999;

  /* Classificação de performance */
  --cor-excelente: #00A67D;
  --cor-bom: #2B6CB0;
  --cor-atencao: #E0A800;
  --cor-critico: #CC4444;

  /* Deltas */
  --delta-positivo: #00A67D;
  --delta-negativo: #CC4444;

  /* Layout */
  --max-width: 1000px;
  --radius: 14px;
  --shadow: none;
}
```

**Regras de estilo obrigatórias:**

1. **Fundo branco (#FFFFFF)**, sem dark mode
2. **Cards com borda tracejada** (`1.5px dashed var(--border-dash)`) — assinatura visual DobraLabs
3. **Amarelo (#FFD600) como destaque** — highlights, badges de seção, títulos com fundo
4. **Verde (#00A67D) para positivo** — valores bons, métricas excelentes, deltas positivos
5. **JetBrains Mono para labels** — seções, badges, pills, valores numéricos de KPI
6. **Bricolage Grotesque para tudo mais** — títulos, corpo, descrições
7. **Section labels** em uppercase, letter-spacing: 2px, font-size: 10px, JetBrains Mono
8. **Badges** com pill style: border-radius 100px, padding 5px 14px, uppercase
9. **Emojis nativos** como ícones — sem SVGs ou font-awesome
10. **Espaçamento generoso** — preferir mais whitespace

**Cards de KPI:**
```css
.kpi-card {
  border: 1.5px dashed var(--border-dash);
  border-radius: 14px;
  padding: 24px 28px;
  background: var(--bg);
}
```

**Cards de alerta:**
```css
/* Urgente */
.alert-urgente {
  background: rgba(204, 68, 68, 0.05);
  border: 1.5px solid rgba(204, 68, 68, 0.2);
}
/* Atenção */
.alert-atencao {
  background: var(--yellow-soft);
  border: 1.5px dashed var(--yellow-border);
}
/* Sugestão */
.alert-sugestao {
  background: var(--blue-soft);
  border: 1.5px solid var(--blue-border);
}
```

**Tabela:**
```css
table { border: 1.5px dashed var(--border-dash); border-radius: 14px; overflow: hidden; }
th { background: var(--surface); font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; }
td { border-top: 1px solid var(--border); }
```

#### Seção 1 — Header

- Nome do cliente (grande, bold)
- Período do relatório
- Plataforma(s) analisada(s)
- Data de geração
- Badge pill no topo: "RELATÓRIO DE PERFORMANCE" (JetBrains Mono, uppercase, fundo amarelo)
- Branding sutil: "Gerado por ads-ratos | DobraLabs"

#### Seção 2 — KPIs consolidados

Grid de cards (3 colunas desktop, 1 coluna mobile) com:

Para cada KPI (gasto, conversões, CPL, CTR, CPC, CPM, ROAS):
- Valor atual formatado em BRL (R$ XX.XXX,XX) ou percentual (X,XX%)
- Delta vs período anterior com seta (verde ou vermelho, invertido para métricas de custo)
- Badge de classificação (EXCELENTE/BOM/ATENÇÃO/CRÍTICO) com cor correspondente
- Referência do benchmark do nicho em texto pequeno

Regra de inversão de cor dos deltas:
- Métricas onde MAIS é melhor (conversões, CTR, ROAS): subida verde, descida vermelho
- Métricas onde MENOS é melhor (CPL, CPC, CPM, gasto): subida vermelho, descida verde

#### Seção 3 — Tabela de campanhas ativas

Tabela responsiva com colunas:
- Nome da campanha
- Status (badge colorido)
- Gasto no período (R$)
- Conversões
- CPL (R$)
- CTR (%)
- CPC (R$)
- Classificação geral (badge)

Ordenar por gasto (maior primeiro). Destacar a campanha com melhor CPL com badge "MELHOR".
Destacar campanhas com zero conversões com badge "SEM DADOS".

#### Seção 4 — Gráfico de evolução diária

Gráfico de linhas (Chart.js) com:
- Eixo X: datas do período
- Linha 1: gasto diário (R$) — azul
- Linha 2: conversões diárias — verde
- Tooltip com valores formatados em BRL
- Grid sutil, responsivo
- Legenda no topo

Dados embarcados como JSON no HTML:
```javascript
const DAILY_DATA = {
  labels: ["01/04", "02/04", ...],
  gasto: [150.00, 200.00, ...],
  conversoes: [3, 5, ...]
};
```

#### Seção 5 — Alertas e recomendações

Cards de alerta com ícone, cor e texto:

- Urgente: fundo vermelho sutil, ícone de exclamação
- Atenção: fundo amarelo sutil, ícone de alerta
- Sugestão: fundo azul sutil, ícone de lâmpada

Cada card contém:
- Título do alerta (bold)
- Descrição com números específicos
- Impacto estimado
- Ação recomendada

Ordenar: urgentes primeiro, depois atenção, depois sugestões.

#### Seção 6 — Recomendações priorizadas

Lista numerada de ações ordenadas por impacto financeiro:
1. Ação com economia/ganho estimado: R$ XX/mês
2. Ação com economia/ganho estimado: R$ XX/mês
3. Ação com ganho estimado: +XX% conversões

#### Seção 7 — Footer

- Data e hora de geração
- Branding: "Relatório gerado por ads-ratos | DobraLabs"
- Período analisado
- Nota: "Dados extraídos da API oficial. Benchmarks baseados no mercado brasileiro."

#### JavaScript obrigatório

```javascript
// Formatadores
function fmtBRL(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtPct(v) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}

// Inicialização dos gráficos Chart.js
// (gerar com os dados reais embarcados)
// Chart.js: usar cores DobraLabs (azul #2B6CB0, verde #00A67D, amarelo #FFD600)
// Grid color: #DDDDDD, tick color: #999999
```

#### Regras de responsividade

- max-width: 1200px com margin auto
- Grid de KPIs: 3 colunas em desktop, 2 em tablet (768px), 1 em mobile (480px)
- Tabela de campanhas: scroll horizontal em mobile
- Gráficos: redimensionam automaticamente (Chart.js responsive: true)
- Font sizes: body 14px, h1 28px, h2 22px, KPI value 28px

### PASSO 8 — Salvar e abrir

1. Criar diretório `reports/` na pasta do workspace se não existir
2. Salvar o HTML com nome: `relatorio-{CLIENTE}-{DATA}.html`
   - Exemplo: `relatorio-dobralabs-2026-04-03.html`
3. Abrir no navegador:

```bash
open reports/relatorio-{CLIENTE}-{DATA}.html
```

4. Informar o caminho completo do arquivo ao usuário

## Regras importantes

- **NUNCA usar MCPs** — toda execução via scripts Python das skills Ratos
- **Acentuação correta em PT-BR** — sempre verificar acentos em todo o HTML
- **Terminologia em português** — usar tabela de terminologia do SKILL.md
- **Dados JSON embarcados** — nenhuma dependência externa além do Chart.js CDN
- **Design DobraLabs** — tema claro, Bricolage Grotesque + JetBrains Mono, amarelo/verde, cards tracejados
- **Números específicos** — alertas e recomendações SEMPRE com números concretos
- **Comparativo** — sempre comparar com período anterior (deltas com setas)
- **Priorizar** — ordenar alertas e recomendações por impacto financeiro
- **Sazonalidade** — considerar mês atual antes de alarmar sobre custos altos
- **HTML autocontido** — um único arquivo .html que funciona offline (exceto Chart.js CDN)
- **O HTML é gerado pelo Claude** — não é um template estático, é construído com dados reais
