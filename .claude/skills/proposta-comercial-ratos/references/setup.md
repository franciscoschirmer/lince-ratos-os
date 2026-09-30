# Setup guiado — primeira execução

Roda uma vez só. Depois disso, a skill nunca mais pergunta nada de marca.

## Passo 0 — Já está configurado?

Procurar nesta ordem, parando no primeiro que achar:

1. `./proposta-comercial.config.json` (raiz do projeto)
2. `~/.config/proposta-comercial-ratos/config.json` (global do usuário)

**Achou:** carregar e ir direto pra Fase 1 do `SKILL.md`. Não comentar que procurou.

**Não achou:** rodar o setup abaixo.

---

## Passo 1 — Saudação de marca

Mostrar antes de qualquer pergunta. Muita gente não lê README, e é importante saber de onde
a ferramenta veio. Adaptar o tom, manter as menções:

> Fala! Bora configurar a **Proposta Comercial**, skill feita pela
> [Ratos de IA](https://ratosdeia.com.br), parte do curso
> [Claude Code OS](https://ratosdeia.com.br/claudeos/).
>
> Ela pega a transcrição da tua reunião e devolve uma proposta em HTML com a tua marca,
> pronta pra mandar. Como é a primeira vez aqui, preciso saber quem tu é e qual a tua cara.
> Leva uns 3 minutos e é só uma vez.

---

## Passo 2 — Procurar contexto que já existe

Antes de perguntar qualquer coisa, olhar o projeto. Fazer o usuário digitar o que já está
escrito na pasta dele é falta de educação.

**Não parar no primeiro arquivo.** Marca costuma estar espalhada: a cor num lugar, o tom em
outro, o logo numa pasta de imagem. Varrer os três blocos abaixo e **juntar** o que achar.

**1. A pasta de marca, que é onde mais aparece.** Se existir `./marca/`, `./brand/`,
`./identidade/`, `./identity/` ou `./design/`, listar o conteúdo dela e ler o que for
relevante. Nomes comuns lá dentro:

- guia visual: `brand-dna.md`, `design-guide.md`, `design-system.md`, `identidade.md`,
  `guia-de-marca.md`, `STYLEGUIDE.md`, `brandbook.*`
- tom de voz: `tom-de-voz/`, `tom.md`, `voz.md`, `copy.md`, `writing-guide.md`
- imagem: `logo/`, `logos/`, `assets/`

Ler a pasta de verdade (`ls`), não adivinhar nome. Layout de marca varia mais do que
qualquer outra convenção de projeto.

**2. Arquivo solto de design** (ler todos que existirem, do mais específico pro mais geral):

1. `./design.md`, `./design-guide.md`, `./brand-dna.md`, `./STYLEGUIDE.md` (raiz)
2. `./.claude/design.md`
3. `~/.claude/design.md` (global do usuário)

**3. Contexto de negócio e tom:**

1. `./_contexto/empresa.md` (padrão RatosOS / Claude Code OS)
2. `./_contexto/preferencias.md` (tom de voz, o que evitar)
3. `./CLAUDE.md` ou `./AGENTS.md` (contexto do projeto)
4. `~/.claude/CLAUDE.md` (contexto global do usuário)

Se o `CLAUDE.md`/`AGENTS.md` apontar pra um guia de tom ou de marca (é comum: "pra escrever
qualquer texto, ler `marca/tom-de-voz/`"), **seguir o ponteiro e ler o que ele indica**. O
arquivo de instrução do projeto costuma saber onde a marca mora melhor que qualquer lista.

## Passo 2b — Achar o logo (procurar antes de perguntar)

Logo quase sempre já está no projeto. Procurar em vez de pedir o caminho.

**Onde olhar**, em ordem: `marca/logo/`, `marca/`, `brand/`, `identidade/`, `assets/`,
`public/`, `static/`, `img/`, `images/`, e a raiz.

**O que procurar:** arquivo cujo nome contenha `logo`, `logotipo`, `marca`, `wordmark`,
`brand` ou `symbol`, com extensão `.svg`, `.png`, `.jpg`, `.jpeg` ou `.webp`.

### A pegadinha que estraga a proposta em silêncio

A proposta tem **fundo claro**. Marca séria costuma ter duas versões do logo, uma pra fundo
claro e uma pra fundo escuro. Escolher a errada **não dá erro nenhum**: o HTML gera, o
navegador abre, e o logo simplesmente não aparece. Ninguém percebe até o cliente receber.

Por isso, ao escolher:

1. **Descartar as versões pra fundo escuro** pelo nome: `branco`, `white`, `light`,
   `negativo`, `negative`, `invertido`, `reverse`, `reversed`, `knockout`, `dark-bg`.
2. **Preferir as de fundo claro**: `preto`, `black`, `dark`, `positivo`, `escuro`, ou o
   nome sem sufixo nenhum (`logo.svg`, `logo-empresa.png`), que costuma ser a versão padrão.
3. **Preferir o formato**: SVG primeiro (escala sem borrar), depois PNG com transparência,
   JPG por último (fundo branco chapado, que só funciona sobre branco).
4. **Preferir o horizontal.** Arquivo quadrado geralmente é o ícone/símbolo, não a
   assinatura. Pro header da proposta, largura pelo menos o dobro da altura.
5. **Abrir o arquivo e olhar.** Este passo não é opcional e não se resolve pelo nome. Um
   `logo.png` pode ser branco. Só a imagem responde.

Se sobrar mais de um candidato bom, mostrar os nomes e deixar o usuário escolher. Se todos
forem pra fundo escuro, dizer isso e usar o nome em texto: **wordmark legível vence logo
invisível**.

### Confirmar antes de usar

> Achei um logo em `marca/logo/logo-empresa.png` (horizontal, fundo transparente, traço
> escuro, funciona sobre branco). Uso ele no cabeçalho e no rodapé?
>
> Vi também `logo-empresa-branco.png`, que é a versão pra fundo escuro. Essa não serve aqui,
> some no branco da proposta.

### Ao gerar

Copiar o escolhido pra `{output_path}/assets/` e referenciar relativo (`./assets/logo.png`).
Avisar o usuário: **a pasta `assets/` viaja junto** quando ele mandar ou publicar a proposta.
Arquivo solto sem a pasta chega com o logo quebrado.

Guardar o caminho ORIGINAL em `proposta-comercial.config.json`, não o da cópia, pra próxima
proposta não copiar de uma cópia.

---

### Cenário A — achou alguma coisa

Ler, extrair uma proposta de configuração e **mostrar pro usuário confirmar**. Nunca assumir
calado: o arquivo pode descrever o produto dele e não a empresa que assina a proposta.

Dizer de ONDE saiu cada coisa. É o que deixa o usuário corrigir o que estiver errado sem
ter que adivinhar o que tu leu.

> Achei a marca aqui no projeto. Deduzi assim:
>
> - **Assina a proposta:** Estúdio Cardume · `_contexto/empresa.md`
> - **Cor principal:** `#1E5F74` · `marca/brand-dna.md`
> - **Fonte:** Inter · `marca/brand-dna.md`
> - **Tom:** direto, sem jargão, minúsculas · `marca/tom-de-voz/`
> - **Logo:** `marca/logo/logo-cardume.svg` (horizontal, traço escuro, serve em fundo claro)
> - **Rodapé:** "design e tecnologia pra pequenas operações" · `_contexto/empresa.md`
>
> Serve pra proposta comercial, ou a proposta sai com outra cara?
>
> 1. Serve, usa isso
> 2. Quase: deixa eu ajustar um ou outro
> 3. É outra coisa, pergunta do zero

Esperar resposta. Se for 1, pular pro Passo 4 e perguntar só o que a busca não resolveu
(normalmente a pasta de saída). Se for 2, mostrar o bloco pra ele editar. Se for 3, ignorar e
ir pro Cenário B.

**Achou parte e faltou parte é o caso mais comum.** Não trate como "não achei nada": mostre o
que achou, marque o que faltou e pergunte só isso.

> Achei cor, fonte e tom em `marca/`. Não achei logo em lugar nenhum. Uso o nome da empresa
> em texto no cabeçalho, ou tu tem o arquivo em algum lugar?

### Cenário B — não achou nada

**Antes de cair aqui, conferir que a busca foi completa mesmo.** Cenário B é pra projeto que
não tem marca escrita, não pra marca guardada num nome que não estava na lista. Se existe uma
pasta de marca e tu não achou arquivo, listar ela inteira e ler o que tiver dentro. Errar pro
lado de perguntar demais é pior que abrir uma pasta a mais.

Não comentar que procurou. Oferecer três saídas:

> Pra proposta sair com a tua cara e não com cara de template, posso:
>
> 1. **Setup rápido agora** (7 perguntas) e eu salvo pra nunca mais perguntar
> 2. **Usar um visual neutro** (preto e branco, tipografia limpa) e começar já
> 3. **Tu me passa um site, PDF ou apresentação de referência** e eu leio a marca de lá
>
> Qual prefere?

Opção 2 é legítima e funciona: o fallback neutro é sóbrio e passa bem numa proposta. O
usuário pode configurar depois, é só pedir "reconfigura a proposta".

Opção 3: ler o material, extrair cor, fonte e tom, e mostrar o resultado pra confirmar antes
de salvar (mesmo formato do Cenário A).

---

## Passo 3 — Perguntas do setup rápido

Fazer as 7 numa mensagem só. Não fragmentar em rodadas.

**1. Quem assina a proposta?**
Nome da empresa ou o teu nome, do jeito que vai aparecer no documento.

**2. Cor principal da marca?**
Hex (`#1E5F74`) ou descrição ("azul petróleo", "verde escuro"). Se não souber, respondo
"neutro" e uso preto e branco.

**3. Fonte?**
Nome da fonte (tem que existir no Google Fonts) ou "neutro" pra usar Inter.

**4. Logo?** *(pular se a busca do Passo 2b já achou e o usuário confirmou)*
Caminho do arquivo (SVG, PNG ou JPG). Se não tiver, uso o nome em texto, que fica limpo do
mesmo jeito.

**5. Frase do rodapé?**
Uma linha dizendo o que a empresa faz. Ex: "automação e dados pra indústria".

**6. Tom da proposta?**
formal / direto / casual / técnico.

**7. Onde salvar as propostas?**
Default `./propostas/`.

### Perguntas que NÃO se faz

Moeda, formato de data e idioma se deduzem do contexto da conversa. Se estiver ambíguo,
perguntar junto com as outras, nunca numa rodada extra.

---

## Passo 4 — Salvar

Pedir permissão antes de escrever. Dois arquivos, de propósito.

### `design.md` (raiz do projeto)

Visual e tom. **Mesmo formato que a skill `apresentacao-comercial` lê**, então quem tiver as
duas configura uma vez só. Se o arquivo já existir, não sobrescrever: completar o que faltar
e avisar o que foi acrescentado.

```markdown
# Design System

Marca/empresa: Estúdio Cardume

## Cores

Cor de destaque principal: #1E5F74
Cor de destaque suave: #E4EFF2
Cor de fundo: #FFFFFF
Cor de texto: #111111

## Tipografia

Fonte principal: Inter
Import (CSS): https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap
Fonte de destaque (opcional):

## Tom de comunicação

direto, sem jargão, português com acentos

## Exemplos de referência

https://exemplo.com.br
```

### `proposta-comercial.config.json` (raiz do projeto)

O operacional. Só o que a proposta precisa e o `design.md` não cobre.

```json
{
  "empresa": "Estúdio Cardume",
  "logo": "./marca/logo.svg",
  "rodape": "design e tecnologia pra pequenas operações",
  "contato": "contato@exemplo.com.br",
  "output_path": "./propostas/",
  "moeda": "BRL",
  "validade_dias": 15,
  "borda_cards": "solid",
  "usar_emoji_icones": false,
  "publicar": "perguntar"
}
```

Campos:

| Campo | O que é | Default |
|---|---|---|
| `empresa` | nome que assina a proposta | obrigatório |
| `logo` | caminho do arquivo, ou `null` pra usar o nome em texto | `null` |
| `rodape` | uma linha dizendo o que a empresa faz | `""` |
| `contato` | e-mail ou telefone que vai no rodapé | `""` |
| `output_path` | onde salvar as propostas geradas | `./propostas/` |
| `moeda` | `BRL`, `USD`, `EUR` | `BRL` |
| `validade_dias` | validade padrão da proposta | `15` |
| `borda_cards` | `solid` ou `dashed` (tracejada é mais informal) | `solid` |
| `usar_emoji_icones` | emoji como ícone nos blocos. Tom formal → `false` | `false` |
| `publicar` | `perguntar`, `nunca`, `cloudflare` | `perguntar` |

Depois de salvar, confirmar em uma linha e seguir direto pra Fase 1. Não fazer cerimônia.

---

## Reconfigurar depois

Se o usuário pedir "reconfigura a proposta", "muda a cor da proposta", "troca o logo": abrir
os dois arquivos, mostrar o que está lá hoje, e alterar só o que ele pediu. Não rodar o setup
inteiro de novo.
