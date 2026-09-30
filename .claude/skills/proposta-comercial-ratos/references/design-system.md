# Design System — Proposta Comercial

Sistema visual da proposta. **Tudo por variável CSS**: nenhuma cor ou fonte entra hardcodada
no HTML gerado. Assim a mesma estrutura serve qualquer marca, e trocar a cor da empresa é
mudar uma linha.

Se o usuário não tiver `design.md`, o fallback neutro abaixo funciona sozinho e fica sóbrio.

---

## 1. Variáveis

Bloco que vai no `:root` de toda proposta. Os valores abaixo são o **fallback neutro**.

```css
:root {
  /* superfícies */
  --bg: #FFFFFF;
  --surface: #F7F7F7;
  --surface-2: #F2F2F2;

  /* bordas */
  --border: #DDDDDD;
  --border-strong: #BBBBBB;
  --card-border-style: solid;   /* solid | dashed */

  /* texto */
  --text: #111111;
  --text-dim: #555555;
  --text-muted: #999999;

  /* marca */
  --accent: #111111;            /* cor principal da marca */
  --accent-text: #111111;       /* versão com contraste pra texto sobre branco */
  --accent-soft: #F2F2F2;       /* fundo suave derivado */
  --accent-border: #CCCCCC;     /* borda derivada */
  --accent-contrast: #FFFFFF;   /* texto legível SOBRE o accent */

  /* semânticas (não são a marca, não mudam por cliente) */
  --ok: #00875A;                /* preços, itens inclusos, confirmações */
  --ok-soft: rgba(0, 135, 90, 0.08);
  --ok-border: rgba(0, 135, 90, 0.25);
  --no: #C0392B;                /* itens não inclusos */
  --info: #2B6CB0;              /* blocos de contexto neutro */
  --info-soft: rgba(43, 108, 176, 0.06);
  --info-border: rgba(43, 108, 176, 0.18);

  /* tipografia */
  --font-main: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace;

  /* pesos */
  --w-bold: 800;
  --w-semi: 600;
  --w-regular: 400;
}
```

### Como preencher a partir do `design.md`

| Campo do `design.md` | Vira |
|---|---|
| Cor de destaque principal | `--accent` |
| Cor de destaque suave | `--accent-soft` |
| Fonte principal | `--font-main` + `<link>` do Google Fonts no `<head>` |
| Fonte de destaque | usar em títulos, se existir |

### Derivar as variantes

Quando o usuário só der a cor principal, gerar o resto:

- **`--accent-text`**: a própria cor, se o contraste com branco for `>= 4.5:1`. Se for menor
  (amarelo, lima, ciano claro), escurecer até passar. Ex: `#FFCC00` vira `#8A6D00`.
- **`--accent-soft`**: mesma matiz com luminosidade ~94%. Ex: `#1E5F74` vira `#E4EFF2`.
- **`--accent-border`**: mesma matiz com luminosidade ~80%.
- **`--accent-contrast`**: branco se a cor for escura, `#111111` se for clara. É o texto que
  vai **em cima** do accent (botão, pill preenchida).

Nunca usar o accent como cor de texto corrido. Ele é ponto de atenção, não parágrafo.

### Regra de contraste

Se a marca tiver mais de uma cor, escolher pro `--accent-text` a que tiver **melhor contraste
com fundo claro**. Marca com verde-claro e verde-escuro usa o escuro no texto e o claro no
fundo de card.

---

## 2. Base

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: var(--font-main);
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 56px 32px 80px;
}
```

900px é a largura certa pra leitura em scroll. Mais que isso a linha fica longa demais.

---

## 3. Tipografia

```css
h1 {
  font-size: clamp(28px, 4.5vw, 40px);
  font-weight: var(--w-bold);
  letter-spacing: -1.5px;
  line-height: 1.15;
  color: var(--text);
}

h1 .accent {
  color: var(--accent-contrast);
  background: var(--accent);
  padding: 0 8px;
  border-radius: 4px;
}

.section-title {
  font-size: clamp(22px, 3.5vw, 30px);
  font-weight: 700;
  letter-spacing: -1px;
  margin-bottom: 16px;
  color: var(--text);
}

p, .body-text {
  font-size: 15px;
  color: var(--text-dim);
  line-height: 1.75;
}

.highlight {
  background: var(--accent-soft);
  padding: 0 6px;
  border-radius: 4px;
  color: var(--accent-text);
  font-weight: var(--w-semi);
}
```

`.highlight` usa o fundo suave, não o accent cheio. Highlight com cor forte em texto corrido
cansa a leitura.

---

## 4. Componentes

### Badge (topo da página ou de seção)

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  background: var(--accent-soft);
  border: 1px solid var(--accent-border);
  border-radius: 100px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--accent-text);
}
```

### Section Label

```css
.section-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 20px;
}

.section { margin-top: 56px; }
```

### Cards

```css
.card {
  border: 1.5px var(--card-border-style) var(--border-strong);
  border-radius: 14px;
  padding: 28px 32px;
  background: var(--bg);
}

.card-filled {
  background: var(--accent-soft);
  border: 1.5px var(--card-border-style) var(--accent-border);
  border-radius: 14px;
  padding: 28px 32px;
}

.card-ok {
  background: var(--ok-soft);
  border: 1.5px solid var(--ok-border);
  border-radius: 14px;
  padding: 28px 32px;
}

.card-info {
  background: var(--info-soft);
  border: 1.5px solid var(--info-border);
  border-radius: 14px;
  padding: 28px 32px;
}
```

`--card-border-style` é escolha de gosto do usuário (`solid` ou `dashed`), vem do config.
Tracejado é mais informal, sólido é mais sóbrio.

### Pill / Tag

```css
.pill {
  display: inline-block;
  background: var(--text);
  color: var(--bg);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 999px;
  padding: 5px 14px;
  font-family: var(--font-mono);
}

.pill-accent  { background: var(--accent); color: var(--accent-contrast); }
.pill-ok      { background: var(--ok); color: #FFFFFF; }
.pill-outline { background: transparent; color: var(--text-dim); border: 1.5px solid var(--border); }
```

### Quote Block (a fala do cliente)

Componente mais importante da seção de entendimento. É onde a frase que o cliente disse na
reunião volta pra ele.

```css
.quote-block {
  border-left: 3px solid var(--accent);
  padding: 20px 28px;
  background: var(--surface);
  border-radius: 0 14px 14px 0;
  margin: 24px 0;
}

.quote-block p {
  font-size: 15px;
  font-style: italic;
  color: var(--text-dim);
  line-height: 1.7;
}

.quote-block .quote-author {
  font-style: normal;
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 8px;
  font-weight: 500;
}
```

### Feature List

```css
.feature-list { list-style: none; margin-top: 16px; }

.feature-list li {
  font-size: 14px;
  color: var(--text-dim);
  line-height: 1.6;
  padding: 6px 0 6px 20px;
  position: relative;
}

.feature-list li::before {
  content: '';
  position: absolute;
  left: 0; top: 13px;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--accent);
}
```

### Grids

```css
.grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
```

### Briefing Grid (dados do projeto na capa)

```css
.briefing-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 20px;
}

.briefing-item { padding: 20px 24px; }

.briefing-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.briefing-value {
  font-size: 15px;
  font-weight: 500;
  color: var(--text);
  line-height: 1.5;
}
```

### Bloco de entrega (fase, módulo, ativação)

```css
.entrega { margin-top: 24px; }

.entrega-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.entrega-num {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--accent-contrast);
  background: var(--accent);
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.entrega-title { font-size: 20px; font-weight: 700; color: var(--text); }
.entrega-subtitle { font-size: 13px; color: var(--text-muted); font-weight: 400; }
```

Numeração em círculo em vez de emoji. Funciona em qualquer tom, inclusive formal.

### Compare Table (comparar cenários ou pacotes)

```css
.compare-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 32px;
  font-size: 14px;
}

.compare-table thead th {
  text-align: left;
  padding: 14px 20px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
  border-bottom: 1.5px solid var(--border);
}

.compare-table thead th:not(:first-child) { text-align: center; }

.compare-table tbody td {
  padding: 14px 20px;
  border-bottom: 1px solid var(--surface-2);
  color: var(--text-dim);
}

.compare-table tbody td:not(:first-child) { text-align: center; font-size: 16px; }
.compare-table tbody tr:last-child td { border-bottom: none; }

.check { color: var(--ok); font-weight: 700; }
.cross { color: #CCCCCC; }
```

---

## 5. Seção de investimento

### Preço único

```css
.price-card {
  padding: 32px;
  text-align: center;
}

.price-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.price-value {
  font-size: 36px;
  font-weight: var(--w-bold);
  color: var(--ok);
  margin-bottom: 4px;
}

.price-desc { font-size: 13px; color: var(--text-dim); }
```

O preço usa `--ok` (verde sóbrio), não o accent. Verde em preço lê como "valor", accent em
preço briga com o resto da página.

### Cenários (quando há mais de uma opção)

```css
.scenario-section { margin-top: 40px; }

.scenario-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.scenario-title { font-size: 24px; font-weight: var(--w-bold); color: var(--text); }

.scenario-price {
  font-size: 28px;
  font-weight: var(--w-bold);
  color: var(--ok);
  font-family: var(--font-mono);
}

.scenario-desc {
  font-size: 14px;
  color: var(--text-dim);
  line-height: 1.7;
  margin-bottom: 24px;
}

.diff-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.5px;
  color: var(--ok);
  background: var(--ok-soft);
  border: 1px solid var(--ok-border);
  padding: 3px 10px;
  border-radius: 100px;
  text-transform: uppercase;
}
```

`.diff-tag` marca o que o cenário maior tem a mais que o anterior. Evita repetir a lista
inteira em cada cenário.

### Forma de pagamento

```css
.payment-item {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 14px 0;
}

.payment-item:not(:last-child) { border-bottom: 1px solid var(--surface-2); }

.payment-label {
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  min-width: 110px;
  flex-shrink: 0;
}

.payment-text { font-size: 14px; color: var(--text-dim); line-height: 1.6; }
.payment-text strong { color: var(--text); font-weight: var(--w-semi); }
```

### Incluso / não incluso

```css
.includes-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 24px;
}

.include-list { list-style: none; }

.include-list li {
  font-size: 14px;
  color: var(--text-dim);
  padding: 8px 0 8px 24px;
  position: relative;
  line-height: 1.5;
}

.include-list.yes li::before {
  content: '\2713';
  position: absolute; left: 0;
  color: var(--ok);
  font-weight: 700; font-size: 14px;
}

.include-list.no li::before {
  content: '\2717';
  position: absolute; left: 0;
  color: var(--no);
  font-weight: 700; font-size: 14px;
}
```

### Cronograma

```css
.timeline { margin-top: 24px; }

.timeline-item {
  display: flex;
  gap: 20px;
  padding: 20px 0;
  align-items: flex-start;
}

.timeline-item:not(:last-child) { border-bottom: 1px solid var(--surface-2); }

.timeline-date {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: var(--w-semi);
  color: var(--text);
  min-width: 120px;
  flex-shrink: 0;
}

.timeline-content { font-size: 14px; color: var(--text-dim); line-height: 1.6; }
.timeline-content strong { color: var(--text); font-weight: var(--w-semi); }
```

### Prova social numérica (opcional)

```css
.authority-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 24px;
}

.authority-item { text-align: center; padding: 24px 16px; }
.authority-number { font-size: 32px; font-weight: var(--w-bold); color: var(--text); margin-bottom: 4px; }
.authority-label { font-size: 12px; color: var(--text-muted); line-height: 1.4; }
```

Só usar com número **real**. Prova social inventada é o jeito mais rápido de perder a venda
quando o cliente pede o case.

---

## 6. Próximo passo (CTA)

```css
.cta {
  margin-top: 56px;
  padding: 36px 32px;
  background: var(--accent-soft);
  border: 1.5px var(--card-border-style) var(--accent-border);
  border-radius: 14px;
  text-align: center;
}

.cta-title { font-size: 22px; font-weight: 700; color: var(--text); margin-bottom: 10px; }
.cta-text { font-size: 15px; color: var(--text-dim); line-height: 1.7; }

.cta-action {
  display: inline-block;
  margin-top: 20px;
  padding: 13px 28px;
  background: var(--accent);
  color: var(--accent-contrast);
  border-radius: 999px;
  font-weight: var(--w-semi);
  font-size: 15px;
  text-decoration: none;
}
```

---

## 7. Rodapé

```html
<footer class="footer">
  <!-- com logo -->
  <div class="footer-logo"><img src="./assets/logo.svg" alt="{{empresa}}"></div>
  <!-- sem logo: wordmark em texto -->
  <div class="footer-wordmark">{{empresa}}</div>

  <div class="footer-sub">{{rodape}}</div>
  <div class="footer-contact">{{contato}}</div>
</footer>
```

```css
.footer {
  margin-top: 56px;
  text-align: center;
  padding-top: 28px;
  border-top: 1px solid var(--border);
}

.footer-logo img { height: 24px; width: auto; display: inline-block; margin-bottom: 8px; }

.footer-wordmark {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--text);
  margin-bottom: 8px;
}

.footer-sub { font-size: 12px; color: var(--text-muted); }
.footer-contact { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
```

---

## 8. Responsividade

Breakpoint principal 768px. Em mobile:

```css
@media (max-width: 768px) {
  .container { padding: 36px 16px 56px; }
  .grid-2, .grid-3, .grid-4,
  .briefing-grid, .includes-grid,
  .authority-grid { grid-template-columns: 1fr; }
  .card, .card-filled, .card-ok, .card-info { padding: 22px 20px; }
  .scenario-header { flex-direction: column; align-items: flex-start; }
  .timeline-item { flex-direction: column; gap: 6px; }
  .payment-item { flex-direction: column; align-items: flex-start; gap: 4px; }
  .compare-table { font-size: 13px; }
  .compare-table thead th, .compare-table tbody td { padding: 10px 12px; }
}
```

Tabela larga em celular: envolver num `<div style="overflow-x:auto">`.

---

## 9. Impressão / PDF

O cliente vai apertar `Cmd+P` mais cedo ou mais tarde. Deixar pronto:

```css
@media print {
  body { background: #FFFFFF; }
  .container { max-width: 100%; padding: 0 24px; }
  .section { break-inside: avoid; margin-top: 32px; }
  .card, .card-filled, .price-card, .cta { break-inside: avoid; }
  .cta-action { border: 1.5px solid var(--text); }
  a { text-decoration: none; color: var(--text); }
}
```

---

## 10. Princípios

1. **Tema claro.** Fundo branco, texto escuro. Proposta em dark theme não imprime.
2. **Uma cor de marca.** O accent é ponto de atenção. Dois ou três destaques por página, não
   mais. Página inteira colorida não destaca nada.
3. **Verde é preço, accent é marca.** Não misturar os dois papéis.
4. **Espaçamento generoso.** Preferir mais respiro do que menos. Proposta apertada parece
   barata.
5. **Hierarquia por tamanho, peso e cor**, nessa ordem. Caixa alta só em label.
6. **Emoji como ícone é opcional** e vem do config (`usar_emoji_icones`). Tom formal, nunca.
7. **Arquivo único.** CSS e JS inline. Só o logo pode ser externo.
8. **Nada hardcodado.** Toda cor e fonte vem de variável.
