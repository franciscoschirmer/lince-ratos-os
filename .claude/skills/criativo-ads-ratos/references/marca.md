# Fase 0 — a marca (brand.yaml)

O que separa um anúncio bonito de um anúncio **da marca do cliente** é este arquivo. Nenhum layout
tem cor ou fonte escrita dentro. Tudo vem daqui, vira `theme.css` e desce por CSS var.

Roda uma vez por marca. Nas próximas vezes é só reusar o `brand.yaml`.

## 1. Procurar antes de perguntar

Varre o diretório atual (recursivo, ignorando `node_modules`, `.git`, `dist`, `venv`), nesta ordem:

| Onde | O que costuma ter |
|---|---|
| `brand.yaml` | já pronto, de um lote anterior. Achou? usa e pula pro passo 4 |
| `marca/brand-dna.md`, `brand-dna.md`, `BRAND.md` | paleta, fontes, direção de foto |
| `marca/tom-de-voz/`, `tom-de-voz.md`, `voz.md` | pronome, registro, o que evitar |
| `design-guide.md`, `design.md`, `identidade*.md` | o design system |
| `_contexto/empresa.md` e `_contexto/preferencias.md` | negócio e tom de voz. É a convenção do **Claude Code OS**: se a pasta tem `_contexto/`, olha aí primeiro |
| `CLAUDE.md` / `AGENTS.md` do projeto | quase sempre tem a seção de marca |
| `tailwind.config.*`, `theme.css`, `_variables.scss` | a paleta real, em hex, sem interpretação |
| `src/**/globals.css`, `:root{--...}` | idem |

Achou 1: lê e monta. Achou 2+: lista e pergunta qual manda. Achou nada: passo 2.

## 2. Não achou nada — 3 saídas (perguntar, não escolher sozinho)

1. **"tenho o arquivo, tá em outro lugar"** → pede o caminho.
2. **"pesquisa pra mim"** → passo 3.
3. **"não tenho"** → Q&A curto (6 perguntas, passo 3b).

## 3. Pesquisar a marca

Fontes, nessa ordem de confiança:

1. **O site oficial.** WebFetch na home. As cores e as fontes estão no CSS, não no texto. Puxa o
   `:root{}` e o `font-family` reais. Isso vale mais que qualquer descrição.
2. **A Biblioteca de Anúncios da Meta.** Vê o que a marca já roda. Se tem a skill `espiar-ads-ratos`
   instalada, usa ela: já deduplica por conceito e resume padrão de copy e criativo.
3. **Instagram/LinkedIn da marca.** Confere se a cara do feed bate com a do site.
4. **Manual de marca público**, se existir (`/imprensa`, `/press`, `/brand`).

Anota a fonte de cada dado. Cor chutada é o erro mais caro dessa fase.

### 3b. Q&A quando não tem nada

Seis perguntas, uma de cada vez, sem enrolar:
1. nome da marca, o @ e o site
2. o que vende, em uma frase
3. duas cores: a de fundo e a de destaque (aceita "não sei" → proponho a partir do logo)
4. tem logo em PNG transparente? qual o caminho
5. o cliente fala **tu** ou **você**?
6. tem alguma coisa que a marca não faz (palavra proibida, promessa que não pode)

## 4. Escrever o brand.yaml

Copia `assets/brand.example.yaml`, preenche, roda `node assets/theme.mjs`.

### As decisões que importam

**accent** é a cor de destaque: badge, CTA, palavra grifada, preço, número. É a cor que a pessoa
lembra. Costuma ser a cor primária da marca. Se a primária for muito escura ou muito clara, ela
some no fundo do mesmo tom — por isso existe `accent_dark`, a versão clareada usada quando o fundo
é escuro.

**Contraste é regra, não gosto.** Texto sobre fundo abaixo de ~4.5:1 morre no feed comprimido do
Instagram. Na dúvida, escurece o fundo ou clareia o texto. `accent_fg` é o texto que vai *em cima*
da cor de destaque (botão) — quase sempre branco ou o preto da marca, nunca um terceiro tom.

**Fontes.** Duas, no máximo: uma `display` (títulos com personalidade, preço, número grande) e uma
`body` (headline, corpo, CTA). Se a marca usa fonte proprietária, `fontes.local: true` e declara os
`@font-face` num `assets/fontes.css` linkado antes do `theme.css`. Se a marca não tem fonte
definida, não inventa três: pega uma boa `body` do Google Fonts e usa ela nos dois papéis.

**Logo.** PNG com fundo transparente. Se só existe a versão escura, guarda em `logo.arquivo` e usa
`class="logo invert"` nas peças de fundo escuro. Se não tem logo nenhum, usa `<span class="marca-txt">`
(o nome em caixa alta, na cor de destaque) — funciona melhor que um logo esticado.

**tom.** Vai pro `marca.json` e é o que rege a copy na Fase 2. `pronome: tu | você` não é detalhe:
errar isso é o jeito mais rápido de o anúncio não parecer da marca.

## 5. Conferir antes de seguir

Roda `node assets/theme.mjs` e renderiza **uma peça de teste** em cada tema (`t-dark`, `t-light`,
`t-accent`). Olha o PNG. Três coisas:

- o texto lê em todos os três?
- a cor de destaque aparece, ou sumiu no fundo?
- a fonte carregou mesmo, ou caiu no fallback do sistema?

Se passou, a marca tá travada. Daí em diante ninguém mexe em cor dentro de peça.
