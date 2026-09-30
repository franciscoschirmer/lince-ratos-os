# Sistema Visual — Fallback Neutro + Configuração Custom

A skill usa um **sistema de variáveis CSS** que se ajustam ao design do usuário (ou caem num neutro preto/branco quando não há configuração).

## Variáveis CSS padrão (fallback neutro)

Quando o usuário não tem `design.md`/`design-guide.md`, esses são os valores padrão usados em todos os templates:

```css
:root {
  /* Cores base */
  --color-bg: #FFFFFF;          /* fundo principal dos slides */
  --color-surface: #F7F7F7;     /* fundo alternativo (slides de stat, contexto) */
  --color-text: #111111;        /* texto principal */
  --color-text-soft: #555555;   /* texto secundário, descrições */
  --color-text-mute: #999999;   /* labels, assinaturas, textos auxiliares */
  --color-border: #BBBBBB;      /* borda padrão (tracejada) */

  /* Cor de destaque (marca) */
  --color-accent: #111111;          /* cor principal — preenchimento de cards strong */
  --color-accent-text: #333333;     /* texto em destaque sobre fundo claro */
  --color-accent-soft: #F2F2F2;     /* versão suave do accent */
  --color-accent-border: #999999;   /* borda em cards do accent suave */

  /* Cards */
  --color-card-strong: #111111;     /* card de destaque máximo (fundo) */
  --color-card-strong-text: #FFFFFF;/* texto sobre card-strong */
  --color-card-soft: #F2F2F2;       /* card neutro */
  --color-card-dark: #111111;       /* card escuro/contraste */

  /* Tipografia */
  --font-main: 'Inter', system-ui, -apple-system, sans-serif;
  --font-accent: 'Inter', serif;    /* fonte serifada de destaque (opcional) */

  /* Pesos */
  --weight-bold: 800;
  --weight-semi: 600;
  --weight-regular: 400;
}
```

## Template de `design.md` pro usuário configurar

Quando o usuário escolher fazer o setup rápido (cenário B opção 1 no SKILL.md), gerar um arquivo `design.md` na raiz do projeto com este template:

```markdown
# Design System

Marca/empresa: {{NOME}}

## Cores

Cor de destaque principal: {{HEX}} <!-- usada em texto em destaque, cards de ênfase -->
Cor de destaque suave: {{HEX_SOFT}} <!-- versão clara da cor principal, pra fundo de cards macios -->
Cor de fundo: #FFFFFF <!-- fundo principal dos slides, geralmente branco -->
Cor de texto: #111111 <!-- texto principal, geralmente preto suave -->

## Tipografia

Fonte principal: {{NOME_DA_FONTE}} <!-- ex: Inter, Bricolage Grotesque, Roboto -->
Import (CSS): {{URL_GOOGLE_FONTS}} <!-- url do <link> do Google Fonts -->
Fonte de destaque (opcional): {{NOME}} <!-- pra títulos serifados, transições -->

## Tom de comunicação

{{FORMAL | DIRETO | CASUAL | TÉCNICO}}

Notas adicionais: {{...}}

## Exemplos de referência

{{LINK_SITE_OU_PDF}}
```

## Como carregar o design

Quando a skill encontrar (em ordem de prioridade):

1. `./marca/design-guide.md` (formato RatosOS)
2. `./design.md` (raiz do projeto)
3. `./design-guide.md` (raiz)
4. `./.claude/design.md`
5. `~/.claude/design.md` (global)

Ler o arquivo e extrair:
- Cor de destaque principal → `--color-accent`, `--color-accent-text`
- Cor suave → `--color-accent-soft`
- Fonte principal → `--font-main` + URL do Google Fonts
- Fonte de destaque → `--font-accent`

Injetar no `<head>` do `base.html` e em CADA iframe srcdoc dos slides (porque iframes não herdam CSS do pai).

## Como aplicar nas variáveis

Exemplo: usuário definiu cor de destaque `#006B3F` (verde) e fonte `Bricolage Grotesque`. As variáveis viram:

```css
:root {
  --color-bg: #FFFFFF;
  --color-surface: #F7F7F7;
  --color-text: #111111;
  --color-text-soft: #555555;
  --color-text-mute: #999999;
  --color-border: #BBBBBB;

  --color-accent: #006B3F;
  --color-accent-text: #006B3F;
  --color-accent-soft: #E0F2E8;     /* gerado automaticamente: accent + transparência ou versão clara */
  --color-accent-border: #B5D9C8;

  --color-card-strong: #006B3F;
  --color-card-strong-text: #FFFFFF;
  --color-card-soft: #F2F2F2;
  --color-card-dark: #111111;

  --font-main: 'Bricolage Grotesque', sans-serif;
  --font-accent: 'Bricolage Grotesque', serif;
}
```

## Gerando cores derivadas

Quando o usuário só passar a **cor principal**, gerar as variantes automaticamente:

- **Accent text:** mesma cor se contraste >= 4.5:1 contra branco; senão escurece (ex: `#FFD600` → `#B89500`)
- **Accent soft:** mesma cor com luminosidade ~92% (versão muito clara pra fundo)
- **Accent border:** versão ~70% da soft

Se o usuário quiser controlar, ele edita o `design.md` manualmente.

## Regra de contraste

Quando a marca tiver mais de uma cor, sempre priorizar a que tiver **melhor contraste com fundo claro** (branco/cinza claro). Exemplo: marca tem verde claro e verde escuro — usar o escuro pra texto.

Pra fundo amarelo claro (`#FFD600`), preto continua legível. Pra fundo amarelo claro como TEXTO sobre branco, usar versão mostarda (`#B89500`).

## Caixa de texto — minúsculas (opcional, recomendado pro Ratos)

Padrão do tom DobraLabs/Ratos é texto em minúscula, exceto nomes próprios e marcas. Mas isso é **opcional pro aluno**.

Se o `design.md` ou `_contexto/preferencias.md` mencionar "minúsculas" / "lowercase" / "tom casual", aplicar a regra:
- Todo texto em minúscula, mesmo em início de frase
- Exceção: nomes de marca e nomes próprios

Se não mencionar, usar capitalização normal (primeira letra de cada frase em maiúscula).

## Dimensões e respiro (não custom, é fixo)

- Slide base: 1280×720 (16:9)
- Padding interno: 70-100px lateral, 60-80px vertical
- Gap entre cards: 16-24px
- Border-radius padrão: 14px (cards), 999px (pills), 4-5px (highlights)

Esses valores não mudam por `design.md` — são parte do "DNA" do template.

## Checklist de slide bem-feito

- [ ] Máximo 1 ideia central por slide
- [ ] Respiro generoso (não lotar)
- [ ] Hierarquia clara (título > subtítulo > corpo)
- [ ] Cor de destaque usada com intenção (1-2 pontos de atenção, nunca mais)
- [ ] Sem emojis decorativos (admite ícones funcionais raros)
- [ ] Texto bem quebrado (sem linhas órfãs/viúvas)
- [ ] Capa e bookend coerentes entre si
