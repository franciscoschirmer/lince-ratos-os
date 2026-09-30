# Templates de Slide — 10 layouts

Cada template é uma string HTML completa (`<!DOCTYPE>` incluído) pra entrar no array `slides` do `base.html`. Todos 1280×720.

Placeholders entre `{{ }}` devem ser substituídos. Comentários `<!-- opcional -->` marcam elementos removíveis.

Todos os templates usam **variáveis CSS** (`var(--color-accent)`, `var(--font-main)`, etc) que são injetadas pelo `base.html` e propagadas via `<style>` no `<head>` de cada slide. Ver `design-fallback.md` pra valores padrão.

## Bloco de variáveis pra injetar em CADA slide

Cada srcdoc de iframe precisa começar com este bloco `<style>` (substituindo `{{...}}` pelos valores do design system carregado):

```html
<style>
  :root {
    --color-bg: {{BG}};
    --color-surface: {{SURFACE}};
    --color-text: {{TEXT}};
    --color-text-soft: {{TEXT_SOFT}};
    --color-text-mute: {{TEXT_MUTE}};
    --color-border: {{BORDER}};
    --color-accent: {{ACCENT}};
    --color-accent-text: {{ACCENT_TEXT}};
    --color-accent-soft: {{ACCENT_SOFT}};
    --color-accent-border: {{ACCENT_BORDER}};
    --color-card-strong: {{CARD_STRONG}};
    --color-card-strong-text: {{CARD_STRONG_TEXT}};
    --color-card-soft: {{CARD_SOFT}};
    --color-card-dark: {{CARD_DARK}};
    --font-main: {{FONT_MAIN}};
    --font-accent: {{FONT_ACCENT}};
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: var(--font-main); background: var(--color-bg); overflow: hidden; color: var(--color-text); }
  .slide { width: 1280px; height: 720px; padding: 80px 100px; position: relative; display: flex; flex-direction: column; justify-content: center; }
  .slide-label { font-size: 11px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: var(--color-text-mute); margin-bottom: 24px; }
  .act-title { font-family: var(--font-accent); font-style: italic; font-weight: 400; color: var(--color-text-mute); }
</style>
```

E o `<link>` da fonte (substituir pelo Google Fonts ou local):

```html
<link href="{{FONT_IMPORT_URL}}" rel="stylesheet">
```

Pra simplificar, abaixo cada template mostra só a parte específica do `<style>` (depois do bloco base) e o `<body>`.

---

## TEMPLATE 1 — Capa bookend

**Uso:** abertura e fechamento. Três variantes (escolher conforme o cliente):

**A) Fundo limpo com logos:**

```html
<style>
  .slide { background: var(--color-bg); align-items: center; }
  .center { text-align: center; }
  .tag { font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: var(--color-text-mute); margin-bottom: 24px; font-weight: 500; }
  .title { font-size: 72px; font-weight: 800; color: var(--color-text); letter-spacing: -2px; line-height: 1; margin-bottom: 16px; }
  .subtitle { font-size: 28px; color: var(--color-text-soft); font-weight: 400; margin-bottom: 80px; }
  .logos { display: flex; align-items: center; gap: 32px; }
  .logos .plus { font-size: 32px; color: var(--color-text-mute); }
  .logo-text { font-size: 24px; font-weight: 700; color: var(--color-text); }
</style>
<div class="slide">
  <div class="center">
    <div class="tag">{{TAG}}</div>
    <div class="title">{{TITULO_PROGRAMA}}</div>
    <div class="subtitle">{{SUBTITULO}}</div>
    <div class="logos">
      <div class="logo-text">{{NOME_APRESENTADOR}}</div>
      <span class="plus">+</span>
      <div class="logo-text">{{NOME_CLIENTE}}</div>
    </div>
  </div>
</div>
```

**B) Com imagem de fundo + box pro logo do cliente:**

Se o usuário tiver uma imagem de capa pré-fabricada (estilo template), usar como `background-image` e posicionar o logo do cliente com `position: absolute` no espaço reservado da imagem. Coordenadas dependem da imagem específica do usuário.

**C) Minimalista com tipografia grande:**

```html
<style>
  .slide { background: var(--color-bg); align-items: flex-start; justify-content: flex-end; padding: 100px; }
  .meta { font-size: 14px; color: var(--color-text-mute); margin-bottom: 32px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 500; }
  .title { font-size: 120px; font-weight: 800; color: var(--color-text); letter-spacing: -4px; line-height: 0.95; max-width: 1000px; }
  .footer { position: absolute; bottom: 60px; right: 100px; font-size: 16px; color: var(--color-text-soft); font-weight: 500; }
</style>
<div class="slide">
  <div class="meta">{{TAG_OU_DATA}}</div>
  <div class="title">{{TITULO_GRANDE}}</div>
  <div class="footer">{{NOME_CLIENTE}}</div>
</div>
```

---

## TEMPLATE 2 — Stat dupla

**Uso:** dois números grandes lado a lado (dados da pesquisa do cliente).

```html
<style>
  body { background: var(--color-surface); }
  .slide { padding: 100px; }
  .act-title { font-size: 48px; text-align: center; margin-bottom: 80px; }
  .stats { display: flex; justify-content: center; gap: 120px; align-items: flex-start; }
  .stat { text-align: left; }
  .stat-number { font-size: 160px; font-weight: 800; line-height: 0.9; letter-spacing: -6px; color: var(--color-accent-text); }
  .stat-number.alt { color: var(--color-text); }
  .stat-desc { font-size: 28px; font-weight: 500; color: var(--color-text); line-height: 1.2; margin-top: 16px; max-width: 280px; }
</style>
<div class="slide">
  <div class="act-title">{{TITULO_ACT}}</div>
  <div class="stats">
    <div class="stat">
      <div class="stat-number">{{NUMERO_1}}</div>
      <div class="stat-desc">{{DESCRICAO_1}}</div>
    </div>
    <div class="stat">
      <div class="stat-number alt">{{NUMERO_2}}</div>
      <div class="stat-desc">{{DESCRICAO_2}}</div>
    </div>
  </div>
</div>
```

---

## TEMPLATE 3 — Pergunta em box

**Uso:** a pergunta do cliente, frase do chamado.

```html
<style>
  body { background: var(--color-surface); }
  .slide { padding: 100px; align-items: center; justify-content: center; }
  .box { border: 2px dashed var(--color-border); border-radius: 24px; padding: 80px 100px; background: var(--color-bg); max-width: 1000px; }
  .question { font-size: 42px; font-weight: 700; line-height: 1.35; color: var(--color-text); text-align: center; letter-spacing: -0.5px; }
  .highlight { color: var(--color-accent-text); }
</style>
<div class="slide">
  <div class="box">
    <div class="question">{{TEXTO_INICIO}} <span class="highlight">{{PALAVRA_DESTAQUE}}</span>{{TEXTO_FIM}}</div>
  </div>
</div>
```

---

## TEMPLATE 4 — Grid categórico (2 eixos)

**Uso:** setores × desafios, segmentos × dores.

```html
<style>
  body { background: var(--color-surface); }
  .slide { padding: 80px 100px; }
  h1 { font-size: 48px; font-weight: 800; color: var(--color-text); text-align: center; letter-spacing: -1.5px; margin-bottom: 60px; }
  .row { display: flex; align-items: center; gap: 24px; margin-bottom: 24px; }
  .row-label { font-size: 14px; color: var(--color-text-mute); font-weight: 500; writing-mode: vertical-rl; transform: rotate(180deg); min-width: 30px; text-align: center; letter-spacing: 2px; text-transform: uppercase; }
  .cards { display: flex; gap: 20px; flex: 1; justify-content: space-around; }
  .card { flex: 1; padding: 24px 32px; border-radius: 16px; text-align: center; font-size: 22px; font-weight: 700; color: var(--color-text); }
  .card.strong { background: var(--color-accent-soft); border: 1.5px dashed var(--color-accent-border); }
  .card.soft { background: transparent; border: 1.5px dashed var(--color-border); font-size: 20px; }
</style>
<div class="slide">
  <h1>{{TITULO_PUBLICO}}</h1>
  <div class="row">
    <div class="row-label">{{LABEL_EIXO_1}}</div>
    <div class="cards">
      <div class="card strong">{{ITEM_A1}}</div>
      <div class="card strong">{{ITEM_A2}}</div>
      <div class="card strong">{{ITEM_A3}}</div>
    </div>
  </div>
  <div class="row">
    <div class="row-label">{{LABEL_EIXO_2}}</div>
    <div class="cards">
      <div class="card soft">{{ITEM_B1}}</div>
      <div class="card soft">{{ITEM_B2}}</div>
      <div class="card soft">{{ITEM_B3}}</div>
      <div class="card soft">{{ITEM_B4}}</div>
    </div>
  </div>
</div>
```

---

## TEMPLATE 5 — Punchline solta

**Uso:** frase de virada, ponto de tensão. UMA frase isolada em destaque.

```html
<style>
  body { background: var(--color-surface); }
  .slide { padding: 100px; align-items: center; justify-content: center; }
  .box { border: 2px dashed var(--color-border); border-radius: 24px; padding: 70px 90px; background: var(--color-bg); max-width: 1000px; text-align: center; }
  .line1 { font-size: 42px; font-weight: 800; color: var(--color-text); line-height: 1.3; letter-spacing: -0.5px; margin-bottom: 16px; }
  .line2 { font-size: 42px; font-weight: 800; color: var(--color-accent-text); line-height: 1.3; letter-spacing: -0.5px; }
</style>
<div class="slide">
  <div class="box">
    <div class="line1">{{FRASE_SETUP}}</div>
    <div class="line2">{{FRASE_PUNCHLINE}}</div>
  </div>
</div>
```

---

## TEMPLATE 6 — Comparação 2 cards

**Uso:** hard + soft, antes + depois, dois produtos lado a lado.

```html
<style>
  .slide { padding: 80px 100px; align-items: center; justify-content: center; flex-direction: row; gap: 32px; }
  .card { flex: 1; border-radius: 24px; padding: 56px 48px; min-height: 460px; display: flex; flex-direction: column; }
  .card.strong { background: var(--color-card-strong); color: var(--color-card-strong-text); }
  .card.strong .pill { background: var(--color-card-strong-text); color: var(--color-card-strong); }
  .card.strong .card-title, .card.strong .card-desc { color: var(--color-card-strong-text); }
  .card.soft { background: var(--color-accent-soft); border: 1.5px dashed var(--color-accent-border); }
  .pill { display: inline-block; background: var(--color-text); color: var(--color-bg); font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; padding: 6px 14px; border-radius: 999px; margin-bottom: 24px; width: fit-content; }
  .card-title { font-size: 52px; font-weight: 800; color: var(--color-text); letter-spacing: -1.5px; line-height: 1; margin-bottom: 20px; }
  .card-desc { font-size: 22px; color: var(--color-text); line-height: 1.4; font-weight: 400; }
  .plus { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-size: 56px; font-weight: 800; color: var(--color-text); z-index: 10; }
</style>
<div class="slide">
  <div class="card strong">
    <span class="pill">{{PILL_1}}</span>
    <div class="card-title">{{TITULO_1}}</div>
    <div class="card-desc">{{DESCRICAO_1}}</div>
  </div>
  <div class="card soft">
    <span class="pill">{{PILL_2}}</span>
    <div class="card-title">{{TITULO_2}}</div>
    <div class="card-desc">{{DESCRICAO_2}}</div>
  </div>
  <div class="plus">+</div>
</div>
```

---

## TEMPLATE 7 — Título de ato (abertura/transição)

**Uso:** abertura de um ato narrativo. Tipografia grande, pouco texto.

```html
<style>
  body { background: var(--color-surface); }
  .slide { padding: 100px; align-items: center; justify-content: center; text-align: center; }
  .meta { font-family: var(--font-accent); font-style: italic; font-weight: 400; font-size: 32px; color: var(--color-text-mute); margin-bottom: 32px; }
  .big-title { font-size: 110px; font-weight: 800; line-height: 1; letter-spacing: -4px; color: var(--color-text); }
  .big-title .accent { color: var(--color-accent-text); }
</style>
<div class="slide">
  <div class="meta">{{LABEL_ATO}}</div>
  <div class="big-title">{{PARTE_1}}<br><span class="accent">{{PARTE_2}}</span></div>
</div>
```

---

## TEMPLATE 8 — Equação visual

**Uso:** "A + B + C = D" (componentes que formam o resultado).

```html
<style>
  body { background: var(--color-bg); }
  .slide { padding: 80px 100px; align-items: center; justify-content: center; }
  .equation { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; justify-content: center; max-width: 1100px; }
  .term { background: var(--color-accent-soft); border: 1.5px dashed var(--color-accent-border); border-radius: 14px; padding: 24px 32px; font-size: 24px; font-weight: 700; color: var(--color-text); }
  .op { font-size: 40px; font-weight: 800; color: var(--color-text-mute); }
  .result { background: var(--color-card-strong); color: var(--color-card-strong-text); border-radius: 14px; padding: 28px 36px; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
  .subtitle { text-align: center; font-size: 22px; color: var(--color-text-soft); margin-top: 60px; max-width: 800px; line-height: 1.4; }
</style>
<div class="slide">
  <div style="width: 100%;">
    <div class="equation">
      <div class="term">{{TERM_1}}</div>
      <div class="op">+</div>
      <div class="term">{{TERM_2}}</div>
      <div class="op">+</div>
      <div class="term">{{TERM_3}}</div>
      <div class="op">=</div>
      <div class="result">{{RESULTADO}}</div>
    </div>
    <div class="subtitle" style="margin-left: auto; margin-right: auto;">{{LEGENDA}}</div>
  </div>
</div>
```

---

## TEMPLATE 9 — Lista com cards (conteúdo programático)

**Uso:** objetivos, tópicos do programa, depoimentos, bônus, qualquer lista de itens com descrição.

**Variante A — 3 cards lado a lado (objetivos, etapas):**

```html
<style>
  .slide { padding: 80px 100px; }
  .act-title { font-size: 48px; margin-bottom: 8px; text-align: left; }
  h1 { font-size: 36px; font-weight: 700; color: var(--color-text); margin-bottom: 48px; letter-spacing: -0.5px; }
  .cards { display: flex; gap: 20px; }
  .card { flex: 1; border: 1.5px dashed var(--color-border); border-radius: 16px; padding: 32px 28px; background: var(--color-bg); }
  .card-number { font-family: var(--font-accent); font-style: italic; font-size: 32px; color: var(--color-accent-text); margin-bottom: 16px; font-weight: 400; }
  .card-title { font-size: 22px; font-weight: 700; color: var(--color-text); margin-bottom: 12px; letter-spacing: -0.3px; }
  .card-desc { font-size: 15px; color: var(--color-text-soft); line-height: 1.5; }
</style>
<div class="slide">
  <div class="act-title">{{ACT_TITLE}}</div>
  <h1>{{HEADLINE}}</h1>
  <div class="cards">
    <div class="card">
      <div class="card-number">01</div>
      <div class="card-title">{{TITULO_1}}</div>
      <div class="card-desc">{{DESC_1}}</div>
    </div>
    <div class="card">
      <div class="card-number">02</div>
      <div class="card-title">{{TITULO_2}}</div>
      <div class="card-desc">{{DESC_2}}</div>
    </div>
    <div class="card">
      <div class="card-number">03</div>
      <div class="card-title">{{TITULO_3}}</div>
      <div class="card-desc">{{DESC_3}}</div>
    </div>
  </div>
</div>
```

**Variante B — Lista de tópicos (6-10 itens, 2 colunas):**

```html
<style>
  .slide { padding: 80px 100px; }
  h1 { font-size: 44px; font-weight: 800; color: var(--color-text); margin-bottom: 40px; letter-spacing: -1px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 32px; }
  .item { border-left: 3px solid var(--color-accent); padding-left: 16px; }
  .item-title { font-size: 18px; font-weight: 700; color: var(--color-text); margin-bottom: 4px; }
  .item-desc { font-size: 14px; color: var(--color-text-soft); line-height: 1.4; }
</style>
<div class="slide">
  <h1>{{TITULO}}</h1>
  <div class="grid">
    <div class="item"><div class="item-title">{{T1}}</div><div class="item-desc">{{D1}}</div></div>
    <div class="item"><div class="item-title">{{T2}}</div><div class="item-desc">{{D2}}</div></div>
    <div class="item"><div class="item-title">{{T3}}</div><div class="item-desc">{{D3}}</div></div>
    <div class="item"><div class="item-title">{{T4}}</div><div class="item-desc">{{D4}}</div></div>
    <div class="item"><div class="item-title">{{T5}}</div><div class="item-desc">{{D5}}</div></div>
    <div class="item"><div class="item-title">{{T6}}</div><div class="item-desc">{{D6}}</div></div>
  </div>
</div>
```

**Variante C — Depoimentos (3-4 quotes com nome):**

```html
<style>
  body { background: var(--color-surface); }
  .slide { padding: 80px 100px; }
  h1 { font-size: 36px; font-weight: 800; color: var(--color-text); margin-bottom: 40px; letter-spacing: -0.5px; text-align: center; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .quote { background: var(--color-bg); border: 1.5px dashed var(--color-border); border-radius: 16px; padding: 24px 28px; }
  .quote-text { font-size: 16px; color: var(--color-text); line-height: 1.5; margin-bottom: 16px; font-style: italic; }
  .quote-author { font-size: 13px; color: var(--color-text-soft); font-weight: 600; }
  .quote-role { font-size: 12px; color: var(--color-text-mute); font-weight: 400; }
</style>
<div class="slide">
  <h1>{{TITULO}}</h1>
  <div class="grid">
    <div class="quote"><div class="quote-text">"{{QUOTE_1}}"</div><div class="quote-author">{{AUTOR_1}}</div><div class="quote-role">{{ROLE_1}}</div></div>
    <div class="quote"><div class="quote-text">"{{QUOTE_2}}"</div><div class="quote-author">{{AUTOR_2}}</div><div class="quote-role">{{ROLE_2}}</div></div>
    <div class="quote"><div class="quote-text">"{{QUOTE_3}}"</div><div class="quote-author">{{AUTOR_3}}</div><div class="quote-role">{{ROLE_3}}</div></div>
    <div class="quote"><div class="quote-text">"{{QUOTE_4}}"</div><div class="quote-author">{{AUTOR_4}}</div><div class="quote-role">{{ROLE_4}}</div></div>
  </div>
</div>
```

---

## TEMPLATE 10 — Preço / CTA / Fechamento

**Uso:** investimento, simulações, CTA final. Três variantes.

**A) Preço grande:**

```html
<style>
  body { background: var(--color-card-dark); color: var(--color-card-strong-text); }
  .slide { padding: 80px 100px; align-items: center; justify-content: center; text-align: center; }
  .act-title { font-size: 48px; margin-bottom: 40px; color: var(--color-text-mute); }
  .price { font-size: 160px; font-weight: 800; letter-spacing: -6px; line-height: 0.9; color: var(--color-bg); margin-bottom: 20px; }
  .price-meta { font-size: 20px; color: var(--color-text-mute); margin-bottom: 60px; }
  .includes { display: flex; gap: 48px; justify-content: center; max-width: 1000px; }
  .include-item { text-align: left; }
  .include-label { font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-text-mute); margin-bottom: 6px; font-weight: 500; }
  .include-value { font-size: 18px; color: var(--color-bg); font-weight: 600; }
</style>
<div class="slide">
  <div style="width: 100%;">
    <div class="act-title">investimento</div>
    <div class="price">{{PRECO}}</div>
    <div class="price-meta">{{CONDICAO_PAGAMENTO}}</div>
    <div class="includes">
      <div class="include-item">
        <div class="include-label">inclui</div>
        <div class="include-value">{{INCLUI_1}}</div>
      </div>
      <div class="include-item">
        <div class="include-label">duração</div>
        <div class="include-value">{{DURACAO}}</div>
      </div>
      <div class="include-item">
        <div class="include-label">validade</div>
        <div class="include-value">{{VALIDADE}}</div>
      </div>
    </div>
  </div>
</div>
```

**B) Simulação de cenários:**

```html
<style>
  .slide { padding: 80px 100px; }
  .act-title { font-size: 48px; margin-bottom: 48px; text-align: center; }
  .scenarios { display: flex; gap: 24px; }
  .scenario { flex: 1; border: 1.5px dashed var(--color-border); border-radius: 16px; padding: 32px 28px; text-align: center; }
  .scenario.featured { background: var(--color-accent-soft); border-color: var(--color-accent-border); }
  .scenario-label { font-size: 14px; color: var(--color-text-mute); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; font-weight: 500; }
  .scenario-price { font-size: 56px; font-weight: 800; color: var(--color-text); letter-spacing: -2px; line-height: 1; }
  .scenario-unit { font-size: 18px; color: var(--color-text-soft); margin-top: 8px; }
</style>
<div class="slide">
  <div class="act-title">simulação de cenários</div>
  <div class="scenarios">
    <div class="scenario">
      <div class="scenario-label">{{CENARIO_1}}</div>
      <div class="scenario-price">{{VALOR_1}}</div>
      <div class="scenario-unit">{{UNIDADE_1}}</div>
    </div>
    <div class="scenario featured">
      <div class="scenario-label">{{CENARIO_2}}</div>
      <div class="scenario-price">{{VALOR_2}}</div>
      <div class="scenario-unit">{{UNIDADE_2}}</div>
    </div>
    <div class="scenario">
      <div class="scenario-label">{{CENARIO_3}}</div>
      <div class="scenario-price">{{VALOR_3}}</div>
      <div class="scenario-unit">{{UNIDADE_3}}</div>
    </div>
  </div>
</div>
```

**C) CTA + próximos passos:**

```html
<style>
  .slide { padding: 100px; align-items: center; justify-content: center; text-align: center; }
  .question { font-size: 96px; font-weight: 800; color: var(--color-text); letter-spacing: -3px; line-height: 1; margin-bottom: 60px; }
  .question .accent { color: var(--color-accent-text); }
  .steps { display: flex; justify-content: center; gap: 32px; margin-bottom: 80px; }
  .step { font-size: 16px; color: var(--color-text-soft); font-weight: 500; }
  .step-number { display: inline-block; background: var(--color-accent); color: var(--color-card-strong-text); width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 700; margin-right: 10px; font-size: 14px; }
  .arrow { color: var(--color-text-mute); margin: 0 12px; }
  .contact { font-size: 16px; color: var(--color-text-soft); }
  .contact .strong { color: var(--color-text); font-weight: 600; }
</style>
<div class="slide">
  <div style="width: 100%;">
    <div class="question">vamos <span class="accent">começar?</span></div>
    <div class="steps">
      <div class="step"><span class="step-number">1</span>{{PASSO_1}}</div>
      <span class="arrow">→</span>
      <div class="step"><span class="step-number">2</span>{{PASSO_2}}</div>
      <span class="arrow">→</span>
      <div class="step"><span class="step-number">3</span>{{PASSO_3}}</div>
    </div>
    <div class="contact">
      <span class="strong">{{SITE}}</span> · {{HANDLE_OU_EMAIL}}
    </div>
  </div>
</div>
```

---

## Como usar no HTML final

No `base.html`, cada slide vai no array `slides[]` como string HTML completa. Exemplo de uso (pseudo-código):

```javascript
const slides = [
  `<!DOCTYPE html><html><head>...template 1 com placeholders preenchidos...</head><body>...</body></html>`,
  `<!DOCTYPE html><html><head>...template 3 com placeholders preenchidos...</head><body>...</body></html>`,
  // ... mais slides
];
```

Cada slide é independente. Pode misturar os templates livremente.

---

## Regras de escolha de template

| Beat do arco | Template recomendado |
|--------------|---------------------|
| Capa / bookend | 1 |
| Chamado (pergunta do cliente) | 3 |
| Descoberta (dados do cliente) | 2 |
| Contexto / perfil | 4 |
| Punchline (tensão) | 5 |
| Tese | 6 ou 7 |
| Objetivo | 9A (3 cards) |
| Framework / equação | 8 |
| Programa / conteúdo | 9B (2 colunas) |
| Prova social | 9C (depoimentos) |
| Investimento | 10A |
| Simulações | 10B |
| CTA / fechamento | 10C |

Um mesmo template pode aparecer várias vezes (ex: 3 slides 9B com tópicos diferentes). Beats sem template ideal podem ser construídos custom — usar o bloco de variáveis base e improvisar.

---

## Erros comuns a evitar

1. **Mais de 1 ideia por slide.** Quebrar em 2.
2. **Texto pequeno demais.** Tudo abaixo de 14px é ruim em projetor.
3. **Cor de destaque em todo lugar.** Usar com intenção — 1-2 pontos por slide max.
4. **Sem hierarquia visual.** Título grande, subtítulo médio, corpo pequeno. Sempre.
5. **Esticar uma ideia em 2 slides.** Juntar.
6. **Ignorar o `<meta viewport>`** no iframe — Safari mobile quebra.
7. **Esquecer de injetar as variáveis CSS** em cada slide — eles ficam com fallback do navegador.
