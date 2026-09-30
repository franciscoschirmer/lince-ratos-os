---
name: proposta-comercial-ratos
description: Gera proposta comercial completa em HTML de página única (scroll), com a marca do usuário, a partir da transcrição de uma reunião ou de um briefing. Faz um setup guiado na primeira execução pra descobrir marca, cor, fonte e tom (aproveitando o que já existir no RatosOS, design.md ou CLAUDE.md do projeto). Use sempre que o usuário pedir pra montar uma proposta, orçamento, escopo comercial, proposta de projeto, proposta de consultoria, mentoria, workshop ou recorrência, quando disser "faz a proposta pro cliente X", "monta o orçamento", "transforma essa reunião em proposta", "proposta comercial", "manda a proposta", ou quando quiser editar/atualizar uma proposta já gerada. Também dispara em "/proposta-comercial-ratos". Pra deck navegável de apresentar ao vivo, usar a skill apresentacao-comercial.
---

# Proposta Comercial

Gera uma proposta comercial em **HTML de página única (scroll)**, auto-contida, com a marca
do usuário. O cliente abre o arquivo (ou o link) e lê sozinho, no ritmo dele.

O insumo principal é a **transcrição da reunião**. A proposta boa devolve o cliente pra ele
mesmo: repete a dor com as palavras que ele usou, antes de falar de escopo e preço.

## Quando usar

- "faz a proposta pro [cliente]"
- "transforma essa reunião em proposta"
- "monta o orçamento desse projeto"
- "preciso mandar a proposta até amanhã"
- editar, atualizar ou versionar proposta já gerada por esta skill

## Quando NÃO usar

- Deck navegável pra apresentar ao vivo → skill `apresentacao-comercial`
- Contrato, procuração, documento jurídico → não é isso aqui
- Slide avulso, carrossel, post → outra skill

---

## Fase 0 — Setup (só na primeira execução)

**Verificar primeiro se já está configurado.** Se existir `./proposta-comercial.config.json`
(ou em `~/.config/proposta-comercial-ratos/config.json`), pular direto pra Fase 1 sem
comentar nada.

Se não existir, rodar o setup guiado. O procedimento completo, com as perguntas exatas, a
ordem de busca de contexto e o formato dos arquivos, está em **`references/setup.md`**. Ler
esse arquivo antes de começar a perguntar.

Resumo do que acontece lá:

1. **Saudação de marca** — dizer de onde a skill veio, uma vez só.
2. **Varrer a marca do projeto** — a pasta de marca (`marca/`, `brand/`, `identidade/`) lida
   de verdade com `ls`, os arquivos soltos de design, e o contexto (`_contexto/empresa.md`,
   `CLAUDE.md`). Não parar no primeiro arquivo: cor, tom e logo costumam morar em lugares
   diferentes. Se o `CLAUDE.md` apontar pra um guia, seguir o ponteiro.
3. **Achar o logo, não perguntar o caminho** — e **abrir o arquivo pra olhar** antes de usar.
   Logo pra fundo escuro (`-branco`, `-negativo`, `-invertido`) some na proposta, que é de
   fundo claro, e isso não gera erro nenhum: só some.
4. **Mostrar o que deduziu, com a origem de cada campo**, e pedir confirmação. Achou parte e
   faltou parte é o caso comum: perguntar só o que faltou.
5. **Salvar em dois lugares** — visual e tom no `design.md` (compartilhado com a
   `apresentacao-comercial`), operacional no `proposta-comercial.config.json`.

Nunca escrever arquivo sem pedir permissão.

---

## Fase 1 — Insumos

Perguntar o que o usuário tem em mãos. A ordem de preferência:

1. **Transcrição da reunião** (o melhor caso): arquivo `.txt`/`.md`/`.vtt`, ou texto colado
2. **Áudio ou vídeo da reunião**: ver "Transcrição" logo abaixo
3. **Briefing escrito** (e-mail do cliente, mensagem de WhatsApp, anotação)
4. **Nada disso**: a skill vai por entrevista, fazendo as perguntas da Fase 3 direto

Também aceitar material de apoio: site do cliente, PDF que ele mandou, planilha de números.
Se o usuário citar o site do cliente, ler antes de escrever.

### Transcrição de áudio e vídeo

Esta skill não transcreve. Ela delega, se houver pra quem:

- Checar se existe `~/.claude/skills/transcribe/` (vídeo de URL: YouTube, Drive, etc)
- Checar se existe `~/.claude/skills/transcrever-audio/` (arquivo local de áudio/vídeo)
- Achou → usar, e seguir com o texto que voltar
- Não achou → dizer isso em uma linha, dar o caminho (a skill `transcribe`, que sai na
  plataforma, ou qualquer transcritor que ele já use) e **seguir mesmo assim** por
  entrevista. Nunca travar o fluxo por falta de transcrição.

---

## Fase 2 — Entendimento (o passo que faz a diferença)

Ler a transcrição/briefing e devolver ao usuário um resumo estruturado, em texto, pra ele
corrigir antes de qualquer coisa:

```
Cliente:            quem é, o que faz, tamanho
Quem decide:        quem estava na call, quem assina
Dor (palavras dele): as 2-3 frases que ele mesmo usou pra descrever o problema
O que ele pediu:    o escopo explícito
O que ele não pediu mas precisa: o escopo implícito (marcar como opcional na proposta)
Prazo:              o que apareceu de urgência ou data
Orçamento:          qualquer sinal de faixa de valor
Objeções:           medo, experiência ruim anterior, comparação com concorrente
Critério de sucesso: como ele vai saber que deu certo
```

Campo sem informação fica **vazio e explícito**, nunca preenchido por dedução silenciosa.

Mostrar isso e perguntar: "confere? o que tá errado ou faltando?". Esperar resposta.

As frases da coluna "dor (palavras dele)" são ouro: vão quase literais pra seção de
entendimento da proposta. É o que faz o cliente sentir que foi ouvido.

---

## Fase 3 — O que falta

Perguntar **de uma vez só**, numa mensagem, o que a transcrição não resolveu:

1. Investimento (valor único, ou cenários? qual o valor de cada um?)
2. Forma de pagamento (à vista, parcelado, entrada + parcelas, mensal)
3. Prazo de entrega (e a partir de quando conta: assinatura? primeira reunião?)
4. O que está incluso e, principalmente, **o que NÃO está** (a lista que evita briga depois)
5. Validade da proposta (default sugerido: 15 dias)
6. Próximo passo (o que o cliente faz pra aceitar)

**Regra dura: não inventar nada.** Valor, prazo e escopo saem da boca do usuário. O que ficar
em aberto entra no HTML como `[a confirmar]` visível, num tom neutro. Uma proposta com um
campo a confirmar é honesta. Uma proposta com número chutado é um problema.

---

## Fase 4 — Esqueleto em texto (aprovar antes de gerar)

Antes de escrever uma linha de HTML, mostrar a proposta em bullets: cada seção, o título dela
e a frase central. Assim:

```
1. Capa            "Automação do atendimento" · Cliente X · válida até 08/09
2. Entendimento    o time perde 3h por dia respondendo a mesma pergunta no WhatsApp
3. Objetivo        derrubar o tempo de primeira resposta pra menos de 1 minuto
4. Escopo          3 fases: mapeamento, construção, acompanhamento de 30 dias
5. Incluso/não     inclui treinamento do time; não inclui custo de API
6. Investimento    R$ 12.000, 50% na assinatura e 50% na entrega, 6 semanas
7. Próximo passo   responder este e-mail confirmando, agenda de kickoff na semana seguinte
```

Iterar até o usuário aprovar. **Só então gerar HTML.** Esse passo economiza retrabalho: mudar
uma linha de bullet é barato, mudar uma seção de HTML pronto não é.

Qual estrutura usar em cada tipo de venda (projeto fechado, consultoria, recorrência,
workshop, escopo por fases): ver `references/estrutura-proposta.md`.

---

## Fase 5 — Gerar o HTML

Ler **`references/design-system.md`** antes de escrever CSS. Nunca inventar componente que já
existe lá.

Regras de arquitetura:

- **Arquivo único**, CSS e JS inline. A única exceção é o logo, que pode ser arquivo externo.
- Todas as cores e fontes vêm das **variáveis CSS** carregadas do `design.md` do usuário. Se
  não houver `design.md`, usar o fallback neutro do design system. Nunca hardcodar cor.
- Base do scaffold em `templates/proposta.html`.
- Salvar em `{output_path}/proposta-{cliente}-{AAAA-MM-DD}.html` (o `output_path` vem do
  config, default `./propostas/`).
- Se o logo for arquivo de imagem, copiar pra `{output_path}/assets/` e referenciar
  relativo. Avisar o usuário que a pasta `assets/` viaja junto quando publicar.

Voz do texto: ler **`references/tom-e-antipadroes.md`** e passar a proposta inteira por ele
antes de entregar. Copy de proposta com cara de IA queima a venda.

---

## Fase 6 — Verificar antes de entregar

1. **Quebras de linha.** Rodar o detector de viúvas:
   ```bash
   node scripts/check-quebras.js /caminho/da/proposta.html
   ```
   Viúva é bloco de 2+ linhas cuja última linha é muito mais curta que as outras, deixando
   buraco branco. Corrigir com `<br>` em ponto natural (depois de vírgula que separa ideias,
   antes de conector, no fim de uma oração) e rodar de novo até dar `0 viúva(s)`. Cada
   correção muda o fluxo do texto, então repetir até zerar.

   Se o script não achar o Chrome, ele avisa e sai sem erro. Nesse caso, revisar no olho:
   abrir no navegador e procurar linha final curta demais.

2. **Checklist final:**
   - [ ] Todas as seções aprovadas na Fase 4 estão no HTML
   - [ ] Nenhum dado inventado (todo número veio do usuário; o resto está `[a confirmar]`)
   - [ ] A seção de entendimento usa as palavras do cliente, não as tuas
   - [ ] Lista do que NÃO está incluso existe e é específica
   - [ ] Validade da proposta aparece na capa
   - [ ] Próximo passo é uma ação concreta, não "estamos à disposição"
   - [ ] Logo e rodapé são do usuário
   - [ ] **O logo aparece de verdade.** Abrir o HTML e olhar. Logo claro em fundo claro não
     dá erro, some. Se sumiu, trocar pela versão escura ou usar o nome em texto
   - [ ] A pasta `assets/` está junto do HTML, se houver logo em arquivo
   - [ ] Abre bem no celular (grids colapsam pra 1 coluna)
   - [ ] Passou pelos antipadrões de escrita
   - [ ] Nome do arquivo não tem espaço nem acento

3. **Abrir no navegador** pro usuário revisar. Lembrar que `Cmd+P` (ou `Ctrl+P`) salva como
   PDF, se ele preferir mandar anexo.

---

## Fase 7 — Publicar (opcional, sempre perguntando)

**Nunca publicar sem confirmação explícita.** Proposta tem preço dentro e é documento de um
cliente só.

Perguntar: "quer só o arquivo, ou quer um link pra mandar?"

**Só o arquivo** (default): fim. Ele manda por e-mail ou WhatsApp, ou exporta PDF.

**Quer link:** checar se existe `~/.claude/skills/cloudflare-ratos/`.

- **Existe** → delegar o fluxo inteiro pra ela. Recomendação: um único projeto Cloudflare
  Pages chamado `propostas`, conectado ao GitHub, com uma pasta por cliente
  (`/cliente-x/index.html`). Assim cada proposta tem histórico de versão e o link é estável.
- **Não existe** → explicar em duas linhas que existe uma skill da casa que faz isso
  (`cloudflare-ratos`, publica de graça no Cloudflare Pages conectado ao GitHub) e oferecer o
  caminho manual: `npx wrangler pages deploy` num projeto avulso, avisando que upload direto
  não tem histórico nem publicação automática.

**Senha: nunca no HTML.** Gate de senha em JavaScript se burla em 10 segundos no DevTools.
Se o usuário quiser proteger de verdade, é gate server-side (Cloudflare Function + secret),
e aí a `cloudflare-ratos` cobre. Sem isso, dizer com todas as letras: link não divulgado
**não é** link protegido. Quem tiver a URL, abre.

---

## Regras

1. **Nunca inventar dado.** Valor, prazo, escopo e nome saem do usuário ou da transcrição.
   O que faltar vira `[a confirmar]` visível.
2. **Aprovar o esqueleto antes do HTML.** Não tem atalho.
3. **O cliente é o protagonista.** A proposta abre com o problema dele, não com a tua
   apresentação. "quem somos" vai no fim, se for.
4. **Construir valor antes do preço.** O investimento nunca é a primeira seção.
5. **A lista do que não está incluso é obrigatória.** É ela que evita a briga de escopo.
6. **Uma proposta, um cliente.** Nada de template com nome trocado. Se duas propostas ficam
   iguais, a Fase 2 foi mal feita.
7. **Tudo por variável CSS.** Nenhuma cor ou fonte hardcodada no HTML gerado.
8. **Sem gate de senha no HTML.**

---

## Atualizar a skill

Quando sair versão nova:

1. Ler o `VERSION` local pra saber de onde parte
2. Ler o `CHANGELOG.md` e aplicar as versões maiores **em ordem**
3. **Nunca tocar** em `design.md`, `proposta-comercial.config.json` nem nas propostas já
   geradas na pasta de saída
4. Fazer backup `.bak` de todo arquivo antes de editar
5. Se o bloco local divergir do "ANTES" do changelog, é customização do usuário: perguntar
   antes de sobrescrever

---

## Referências

- `references/setup.md` — setup guiado completo (busca de contexto, perguntas, config)
- `references/design-system.md` — variáveis, componentes e fallback neutro
- `references/estrutura-proposta.md` — seções por tipo de venda, o que perguntar em cada
- `references/tom-e-antipadroes.md` — voz da proposta e trava anti-slop
- `templates/proposta.html` — scaffold auto-contido
- `scripts/check-quebras.js` — detector de viúvas
