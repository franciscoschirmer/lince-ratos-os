# proposta-comercial-ratos

Skill do Claude Code que transforma a **transcrição de uma reunião** numa **proposta comercial
em HTML**, com a tua marca, pronta pra mandar pro cliente.

Faz parte do kit da **Ratos de IA** (curso [Claude Code OS](https://ratosdeia.com.br/claudeos/)).

## O que ela faz

- Lê a transcrição da reunião e devolve o **entendimento estruturado** pra tu conferir: a dor
  do cliente nas palavras dele, o escopo pedido, o que apareceu de prazo e orçamento
- Pergunta só o que faltou (valor, pagamento, prazo, incluso, validade), numa mensagem só
- Mostra o **esqueleto da proposta em texto** pra tu aprovar antes de gerar HTML
- Gera uma página única em scroll, auto-contida, adaptada à tua marca por variáveis CSS
- Verifica as quebras de linha no Chrome headless (proposta com linha órfã parece descuidada)
- Publica, se tu quiser, delegando pra skill `cloudflare-ratos`

O que ela **não** faz: inventar número. Valor, prazo e escopo saem da tua boca ou da
transcrição. O que ficar em aberto aparece como `[a confirmar]` no documento.

## Instalação

Baixa o zip `proposta-comercial-ratos.zip` na plataforma do curso e descompacta dentro da
pasta de skills do Claude Code:

```bash
unzip ~/Downloads/proposta-comercial-ratos.zip -d ~/.claude/skills/
```

Se a pasta `~/.claude/skills/` não existir, cria antes (`mkdir -p ~/.claude/skills`).

Ou mais fácil: abre o Claude Code, arrasta o zip pra conversa e pede pra ele instalar.

Pronto. Em qualquer projeto é só pedir: "faz a proposta pro cliente X", "transforma essa
reunião em proposta", ou chamar `/proposta-comercial-ratos`.

## Primeira vez

Na primeira execução ela roda um setup de uns 3 minutos:

1. **Varre a marca do teu projeto.** Abre a pasta de marca (`marca/`, `brand/`,
   `identidade/`) e lê o que tiver lá, procura os arquivos soltos de design e o contexto
   (`_contexto/empresa.md`, `CLAUDE.md`). Acha o logo sozinha, e confere se ele serve em
   fundo claro antes de usar. Mostra o que deduziu, com a origem de cada campo, e pede
   confirmação. Não assume nada calada.
2. **Se não achar**, te dá 3 saídas: setup rápido de 7 perguntas, visual neutro pra começar
   já, ou tu passa um site/PDF de referência e ela lê a marca de lá.
3. **Salva** o visual e o tom em `design.md` (o mesmo arquivo que a skill
   `apresentacao-comercial` lê) e o operacional em `proposta-comercial.config.json`.

Depois disso ela nunca mais pergunta. Pra mudar algo, é só falar: "troca a cor da proposta",
"muda o logo".

## Como usar

```
tu:    faz a proposta pro Cliente X, a transcrição tá em ./reunioes/cliente-x.txt
skill: [lê a transcrição]
       Entendi assim: [entendimento estruturado] — confere?
tu:    confere, mas o prazo é 6 semanas e não 4
skill: [pergunta valor, pagamento, incluso, validade]
tu:    [responde]
skill: [mostra o esqueleto em bullets]
tu:    aprovado
skill: [gera ./propostas/proposta-cliente-x-2026-08-24.html]
```

Sem transcrição também funciona: ela vai por entrevista.

Áudio ou vídeo da reunião: se tu tiver as skills `transcribe` ou `transcrever-audio`
instaladas, ela usa. Se não tiver, ela te diz e segue mesmo assim.

## Tipos de proposta que ela cobre

Projeto fechado · consultoria e mentoria · recorrência (retainer, tráfego, suporte) ·
workshop e treinamento · escopo por fases com decisão no meio.

Cada tipo muda quais seções entram e o que precisa ficar explícito. Detalhes em
`references/estrutura-proposta.md`.

## Publicar

Por padrão ela só gera o arquivo. Tu manda por e-mail, ou aperta `Cmd+P` e vira PDF.

Se quiser um link, ela delega pra skill `cloudflare-ratos`
(publica de graça no Cloudflare Pages conectado ao GitHub). A recomendação é um projeto só,
chamado `propostas`, com uma pasta por cliente: link estável e histórico de versão.

**Sobre senha:** ela nunca coloca gate de senha em JavaScript, porque isso se burla em 10
segundos no DevTools. Proteção de verdade é server-side, e aí a `cloudflare-ratos` cobre.

## Estrutura do repo

```
proposta-comercial-ratos/
├── SKILL.md                       # entrada (lida pelo Claude)
├── references/
│   ├── setup.md                   # setup guiado, busca de contexto, config
│   ├── design-system.md           # variáveis, componentes, fallback neutro
│   ├── estrutura-proposta.md      # seções por tipo de venda
│   └── tom-e-antipadroes.md       # voz da proposta e trava anti-slop
├── templates/
│   └── proposta.html              # scaffold auto-contido
└── scripts/
    └── check-quebras.js           # detector de linha órfã (Chrome headless)
```

## Pré-requisitos

- Claude Code
- Node, só pro `check-quebras.js` (e ele pula sozinho se não achar o Chrome)
- Nenhuma API key. Nenhum `npm install`.

## Combina com

- `apresentacao-comercial` — a mesma proposta virando deck navegável pra apresentar ao
  vivo. As duas leem o mesmo `design.md`.
- `cloudflare-ratos` — publicar a proposta.
- `transcribe` — transcrever a reunião.

## Licença

CC BY 4.0. Usa, modifica, vende serviço com ela. Só mantém o crédito.
