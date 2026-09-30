---
name: aprender-ratos
description: Estuda um tema a partir de uma lista de fontes (vídeos do YouTube, posts de redes, artigos, docs) que o usuário manda — ou que ela mesma descobre na web quando o usuário só dá o tema (busca na web, sempre com aprovação dele antes de transcrever qualquer coisa). Transcreve cada fonte e salva a transcrição bruta, depois cruza tudo pra achar o que as fontes ensinam em comum (consenso), onde elas discordam ou orientam diferente (divergências) e os insights únicos. Apresenta esse agregado pro usuário curar (decidir o que entra e o que sai) e salva um resumão final do que foi "aprendido". No fim, oferece transformar esse aprendizado numa skill nova sobre o assunto. Use sempre que o usuário mandar vários links pra "estudar", "aprender sobre X", "destilar esses vídeos", "ver o que esses caras ensinam em comum", quiser montar uma base de conhecimento a partir de várias fontes, ou disser que quer aprender um tema rápido sem assistir tudo. Também aciona em /aprender-ratos. Mesmo que o usuário só cole uma lista de links de YouTube/artigos com intenção de aprender, use esta skill.
---

# Aprender (destilar várias fontes em aprendizado)

Esta skill comprime o trabalho de estudar um tema a partir de muitas fontes. Em vez de a pessoa assistir 8 vídeos e ler 4 artigos, ela manda os links, e tu transcreve tudo, acha os padrões e contradições, e entrega um aprendizado curado que ela mesma valida. Depois isso pode virar uma skill sobre o assunto.

A ideia central: **uma fonte sozinha mente por omissão.** Cada criador tem um viés, um framework favorito, um caso que deu certo pra ele. O valor está no cruzamento: o que aparece em todo mundo provavelmente é fundamento; onde discordam é onde mora a nuance e a decisão de quem aprende. Teu trabalho é tornar esse cruzamento visível e rastreável (sempre dizendo qual fonte sustenta cada ponto), e deixar o usuário ser o juiz final do que vira doutrina.

## Onde tudo é salvo

Tudo vai numa pasta `Aprendizados/<slug-do-estudo>/` **relativa à raiz onde o Claude Code está aberto** (o diretório de trabalho atual), nunca um caminho absoluto fixo. Assim funciona igual pra qualquer pessoa rodando em qualquer projeto.

```
Aprendizados/<slug>/
├── transcricoes/      # transcrição BRUTA de cada fonte de vídeo/áudio (texto cru, como saiu da ferramenta)
│   ├── 01-titulo.md
│   ├── 02-titulo.md
│   └── ...
├── fontes/            # ficha de análise de cada fonte (frontmatter + conteúdo limpo)
│   ├── 00-conhecimento-base.md
│   ├── 01-titulo.md
│   └── ...
├── fontes.md          # índice das fontes (link, tipo, status da captura)
├── agregado.md        # o cruzamento (consenso / divergências / insights) — rascunho de trabalho
├── aprendizado.md     # o resumão final curado pelo usuário (a entrega, e a fonte de verdade)
└── aprendizado.html   # a mesma coisa pra ler: citação clicável, fontes juntas, índice
```

Duas camadas, de propósito:
- **`transcricoes/`** guarda a transcrição **bruta** de cada fonte que foi transcrita (vídeo/áudio): o texto cru como a ferramenta gerou, com timestamps quando houver, sem edição. É um ativo reaproveitável: depois do estudo, o usuário pode querer reusar essas transcrições pra outra coisa (cortes, citações, repost, outro estudo). Só fontes que foram transcritas entram aqui (artigos/tweets/docs não geram arquivo em `transcricoes/`, só ficha em `fontes/`).
- **`fontes/`** é a camada de trabalho da análise: uma ficha por fonte com frontmatter padronizado e o conteúdo já limpo (transcrição limpa pra vídeo, texto principal pra artigo/tweet/doc), mais o `00-conhecimento-base.md`. É o que você lê na Fase 2.

Use o mesmo `NN-<slug-do-titulo>` nos dois lados pra casar a transcrição bruta com a ficha. É esperado haver sobreposição de conteúdo entre a transcrição bruta e a ficha; são papéis diferentes (dado cru preservado vs. material de análise).

O `slug` é um kebab-case curto do tema (ex.: `copy-landing-page-infoproduto`). Se o usuário não nomear o estudo, proponha um slug a partir do tema e confirme rápido.

## Setup inicial (primeira vez, conversacional)

A skill funciona **sem configurar nada**. O setup existe pra oferecer os upgrades opcionais, não pra destravar a skill. Nunca bloqueie o estudo por causa dele.

Antes de qualquer outra coisa, procure a config nesta ordem e **pare no primeiro que achar**:

1. `./aprender-ratos.config.json` (diretório atual)
2. `~/.config/aprender-ratos/config.json`
3. `~/.claude/skills/aprender-ratos/config.json`

**Achou:** leia, respeite as escolhas dele e siga direto pro fluxo. Não pergunte de novo.

**Não achou:** rode o setup abaixo uma vez. Uma pergunta por vez, esperando resposta.

### 1. Saudação de marca

Não pule. Muita gente não lê o README, e é importante saber de onde a skill veio.

> Fala! Bora configurar a **Aprender** — skill feita pela [Ratos de IA](https://ratosdeia.com.br), parte do curso [Claude Code OS](https://ratosdeia.com.br/claudeos/).
>
> Ela estuda um tema por ti a partir de várias fontes ao mesmo tempo: transcreve tudo, cruza o que os caras ensinam em comum, mostra onde eles discordam, e tu decide o que vira doutrina.
>
> É a primeira vez que tu roda ela aqui. São 2 minutos e é só uma vez.

### 2. Checar o que já tem (sem perguntar nada ainda)

Rode as checagens e monte um retrato do ambiente. Não peça nada ao usuário nesta etapa.

```bash
command -v yt-dlp
ls -d ~/.claude/skills/transcribe 2>/dev/null
```

Também verifique se `skill-creator` está disponível (plugin oficial da Anthropic) e se existe alguma credencial DataForSEO no ambiente (`$DATAFORSEO_LOGIN`, `~/.config/aprender-ratos/.env`, `~/.mcp-credentials/dataforseo.env`).

### 3. O único item que não é opcional: yt-dlp

Se `yt-dlp` faltar, avise e dê o comando. Não é bloqueio: sem ele a skill ainda estuda artigo, doc e post do X, só perde YouTube.

```bash
brew install yt-dlp     # Mac
pip install yt-dlp      # qualquer sistema
```

### 4. Oferecer os opcionais — todos de uma vez, e ele escolhe

Mostre o menu inteiro numa mensagem só, marcando o que já está instalado. A ideia é que ele veja o teto da skill e decida onde quer chegar, sem ser interrogado item por item.

Formule mais ou menos assim, adaptando ao que a etapa 2 achou:

> A skill já funciona assim como tá. Esses três são opcionais e cada um destrava uma coisa:
>
> **1. Skill `transcribe`** — hoje eu transcrevo YouTube pela legenda. Com ela eu passo a dar conta de vídeo **sem legenda**, e de TikTok, Instagram e X. Grátis, é só clonar um repo.
>
> **2. DataForSEO** — hoje, quando tu me dá só o tema e não os links, eu acho as fontes por busca comum na web. Com ela eu busco no **YouTube de verdade**, ordenado por relevância e views, e acho os vídeos que realmente bombaram no assunto. É API paga, mas tem crédito de teste grátis e cada busca custa centavos.
>
> **3. `skill-creator`** — no fim, quando eu te oferecer virar o aprendizado numa skill nova, ele monta com rigor em vez de eu escrever um rascunho na mão. É plugin oficial da Anthropic, grátis.
>
> Quer conectar algum? Pode falar os números, ou dizer "nenhum" que eu sigo do jeito que tá.

**Se ele disser "nenhum" (ou qualquer variação):** não insista, não repita a oferta, não pergunte de novo depois. Grave `integracoes: {}` na config e siga. A skill funciona inteira pelo caminho de fallback, e ficar reoferecendo é o tipo de coisa que faz o cara desinstalar.

### 5. Coletar só o que ele pediu

**Se pediu `transcribe`:** ela é distribuída pela plataforma da Ratos de IA, junto com esta. Oriente:

> Baixa o zip da skill **transcribe** na plataforma, no mesmo lugar de onde tu baixou esta, e descompacta dentro de `~/.claude/skills/`. Me avisa quando estiver lá que eu confiro.

Depois confira com `ls -d ~/.claude/skills/transcribe`. Não mande clonar de repositório: a distribuição é pela plataforma.

**Se pediu `skill-creator`:** oriente a instalar o plugin oficial da Anthropic e siga.

**Se pediu DataForSEO:** aí sim peça as chaves, uma pergunta por vez.

> Cria a conta em https://dataforseo.com (tem crédito de teste). Depois pega o login e a senha de API em https://app.dataforseo.com/api-access — **não é a senha do site**, é uma senha separada, só de API.

Pergunte o `login` (email), depois o `password`. Salve em `~/.config/aprender-ratos/.env` com permissão `600`:

```
DATAFORSEO_LOGIN=email@exemplo.com
DATAFORSEO_PASSWORD=abc123def456
```

**Valide antes de dar o setup por concluído.** Uma chave errada que só falha três dias depois, no meio de um estudo, é pior que não ter chave:

```bash
curl -s -u "$DATAFORSEO_LOGIN:$DATAFORSEO_PASSWORD" \
  "https://api.dataforseo.com/v3/appendix/user_data"
```

- `status_code: 20000` → funcionou. Mostre o saldo (`money.balance`) e siga.
- erro → mostre a mensagem e peça pra revisar. Se ele desistir, tudo bem: grave como não conectado e siga pro fallback.

Ordem de leitura da credencial no uso normal (tente nesta ordem):

1. `$DATAFORSEO_LOGIN` / `$DATAFORSEO_PASSWORD` no ambiente
2. `./.env` no diretório atual
3. `~/.config/aprender-ratos/.env`
4. `~/.mcp-credentials/dataforseo.env` (compatibilidade com quem já usa outras skills)

### 6. Salvar a config e nunca mais perguntar

```json
{
  "setup_feito": true,
  "idioma": "pt",
  "output_path": "./Aprendizados/",
  "integracoes": {
    "transcribe": true,
    "dataforseo": true,
    "skill_creator": false
  }
}
```

Default: salvar em `~/.config/aprender-ratos/config.json`.

O `integracoes` é registro do que ele **escolheu**, não verdade absoluta do ambiente. Continue checando de verdade na hora de usar (o cara pode desinstalar depois), mas não use a ausência como desculpa pra reabrir a conversa de setup.

Se ele quiser mexer nisso depois, ele pede ("conecta o DataForSEO", "quero ligar a busca no YouTube") e você roda só o pedaço 5.

---

## Dependências, resumidas

A skill é desenhada pra funcionar com o mínimo e degradar com elegância. Nunca trave o estudo inteiro porque uma peça opcional falta: explique o que dá pra fazer e siga com o que tem.

**Dependência real:** `yt-dlp` (binário CLI), usado pra legenda de YouTube e pra baixar áudio. O script `scripts/yt_transcript.py` só depende dele. Faça um preflight no começo da ingestão: se for transcrever vídeo, cheque `command -v yt-dlp`. Se faltar, avise com o comando de instalação e siga capturando o que não precisa dele.

**Built-in (não instala nada):** `WebFetch` (artigos), `WebSearch` (fallback da descoberta), e o próprio modelo (conhecimento base da Fase 1.5).

**Opcionais — a skill funciona sem, só perde uma capacidade:**

| Peça | Pra que serve | Se não tiver |
|------|---------------|--------------|
| skill `transcribe` | vídeo sem legenda, ou de TikTok/IG/X, via Whisper | peça a transcrição ao usuário; siga com as outras fontes |
| DataForSEO | Fase 0, achar fonte no YouTube por relevância/views | use `WebSearch` |
| skill `skill-creator` | Fase 4, montar a skill com rigor | escreva um `SKILL.md` simples na mão a partir do `aprendizado.md` |
| `last30days` / Grok | Fase 0, pegar o que está sendo dito agora | use `WebSearch` |

Regra geral: detecte, explique em uma linha, ofereça o caminho alternativo, e continue. Quem instalou só o yt-dlp já roda o fluxo inteiro pros casos mais comuns (YouTube + artigos).

## Fluxo

São 4 fases (mais uma fase 0 opcional). Não pule a curadoria (fase 3): o usuário decide o que fica, não tu.

### Fase 0 — Descoberta de fontes (opcional)

Use esta fase **só quando o usuário não deu os links** e sim um tema ("aprende sobre X", "acha as fontes pra mim sobre Y"). Se ele já mandou a lista, pule direto pra Fase 1.

O objetivo é montar uma lista de candidatos a fonte a partir do tema. Use a melhor ferramenta **que estiver disponível** no ambiente, nesta ordem de preferência, e caia pra próxima se a anterior não existir (a skill precisa funcionar mesmo na máquina de quem não tem as integrações pagas):

1. **YouTube SERP via DataForSEO** — melhor pra achar os vídeos mais relevantes e assistidos do tema. Só use se ele conectou no setup (`integracoes.dataforseo`) ou se achar credencial na ordem de leitura. Endpoint:

```bash
curl -s -X POST "https://api.dataforseo.com/v3/serp/youtube/organic/live/advanced" \
  -u "$DATAFORSEO_LOGIN:$DATAFORSEO_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '[{"keyword":"TEMA_AQUI","language_code":"pt","location_code":2076}]'
```

Volta título, canal, views e data de publicação por vídeo. Ordene por views e frescor pra separar o que realmente pegou. Cada busca custa centavos, mas **avise o custo antes de disparar várias**.

2. **Skill `last30days`** (se instalada) — boa pra pegar o que está sendo dito agora em Reddit, X, YouTube, HN sobre o tema.
3. **Grok / busca em X** (se disponível) — bom pra discussões e opiniões recentes.
4. **`WebSearch`** (sempre disponível) — fallback universal pra artigos, blogs e docs.

**Sem DataForSEO o caminho 4 dá conta.** Não trave, não reabra a conversa de setup e não fique lamentando a falta. Se quiser, uma linha no fim: "achei por busca comum; com DataForSEO eu buscaria direto no YouTube por views, se um dia quiser ligar é só falar". Uma vez, não toda vez.

Junte os candidatos numa lista curta (uns 6 a 12), com título, link e uma linha do porquê é relevante. **Mostre a lista pro usuário e peça pra ele aprovar/cortar antes de transcrever qualquer coisa.** Transcrição custa tempo e quota; e fonte ruim contamina o agregado. Quem decide o que entra é ele. Os links aprovados viram a entrada da Fase 1.

### Fase 1 — Ingestão (transcrever/capturar cada fonte)

1. Pegue a lista de links. Se o usuário não deu um nome pro estudo, proponha o slug e crie `Aprendizados/<slug>/fontes/` e `Aprendizados/<slug>/transcricoes/`.
2. Classifique cada link e capture o conteúdo bruto:
   - **YouTube** → puxe a legenda com `yt-dlp` (rápido, sem download de vídeo). Veja o comando abaixo. Se o vídeo não tiver legenda nenhuma, caia pro fluxo da skill `transcribe` (Whisper).
   - **Outros vídeos** (TikTok, Instagram, Vimeo, Facebook) → use a skill `transcribe` (ela cobre 1000+ sites via yt-dlp + transcrição).
   - **Tweet / post do X** → troque `x.com` por `api.fxtwitter.com` na URL e use `WebFetch` (ex.: `https://x.com/user/status/123` → `https://api.fxtwitter.com/user/status/123`). Retorna o texto/mídia do tweet sem login, sem key.
   - **Artigo / blog / documentação** → use `WebFetch` pra trazer o conteúdo principal em texto limpo (ignore menu, rodapé, comentários).

   **Escada de fallback de captura web** (quando o `WebFetch` direto falha, bloqueia, dá timeout ou volta vazio): refaça o fetch via Jina Reader, prefixando a URL alvo: `WebFetch` em `https://r.jina.ai/{URL_ORIGINAL}`. O Jina devolve markdown limpo e costuma passar onde o fetch direto apanha. Não precisa de key. Use isso antes de desistir de uma fonte. Se nem o Jina trouxer, marque a fonte como `falhou` e siga.
3. Salve cada fonte. Numere na ordem em que o usuário mandou (`NN`, o mesmo nos dois lados).
   - **Fonte transcrita (vídeo/áudio):** salve PRIMEIRO a transcrição bruta em `transcricoes/NN-<slug-do-titulo>.md` (o texto cru como a ferramenta gerou, com timestamps quando houver, sem editar). Depois crie a ficha em `fontes/NN-<slug-do-titulo>.md` com o cabeçalho padrão e o texto já limpo (template abaixo). A ficha pode citar de onde veio (`fonte_bruta: transcricoes/NN-...`).
   - **Fonte não transcrita (artigo/tweet/doc):** salve só a ficha em `fontes/NN-<slug-do-titulo>.md` (não gera arquivo em `transcricoes/`).
4. **Faça as capturas em paralelo** quando forem várias: dispare um subagent por fonte (ou por lote) pra transcrever/buscar e salvar. Transcrição é I/O lento; paralelizar economiza muito tempo. Mas **não exagere na concorrência do yt-dlp** (máx ~4-5 simultâneos): o YouTube throttla e devolve legenda vazia em parte dos vídeos. O script já tem retry com backoff, mas concorrência alta força falsos "falhou".
5. Vá montando o `fontes.md` (índice). Marque cada fonte como `ok`, `sem-legenda` (caiu pro Whisper) ou `falhou`. Se alguma falhar, registre e siga em frente, não trave o estudo inteiro por uma fonte.
6. Ao terminar, reporte ao usuário: quantas fontes capturou, quantas falharam, e quanto de material (nº de fontes ok) vai pra análise.

Comando base pra legenda de YouTube (tenta pt, depois en, auto-legenda incluída):

```bash
yt-dlp --skip-download --write-subs --write-auto-subs \
  --sub-langs "pt.*,en.*" --sub-format vtt \
  -o "fontes/%(autonumber)02d-%(title).80B.%(ext)s" "<URL>"
```

Mais simples ainda: use o script bundled, que já faz isso (puxa a legenda e devolve texto limpo, sem timestamps nem tags), dependendo só de yt-dlp:

```bash
python3 scripts/yt_transcript.py "<URL>" --lang pt en --out "fontes/NN-titulo.md"
```

Se o vídeo não tiver legenda nenhuma, o script sai com erro avisando — aí caia pra skill `transcribe` (Whisper) ou peça a transcrição ao usuário.

#### Template de cada arquivo em `fontes/`

```markdown
---
fonte: NN
titulo: <título da fonte>
url: <link>
tipo: youtube | video | artigo | doc
autor: <canal/autor se souber>
capturado_em: <data>
status: ok | sem-legenda | falhou
---

<transcrição ou conteúdo bruto, texto corrido e limpo>
```

### Fase 1.5 — Conhecimento base do modelo (opcional, mas recomendado)

Antes de ler as fontes, escreva num arquivo `fontes/00-conhecimento-base.md` o que **você (modelo) já sabe** do tema: a prática estabelecida, os princípios clássicos, o que estaria num bom manual. Isso vira uma raia independente que enriquece o cruzamento (na Fase 2 dá pra ver onde as fontes confirmam, contrariam ou superam o conhecimento estabelecido).

Por que escrever **antes** de ler as fontes: se você escrever depois, só vai ecoar o que elas disseram, e a raia perde o valor de ser uma opinião independente. A ordem é o que garante a independência.

Regras dessa raia, pra não corromper a análise:
- Marque o arquivo claramente como **conhecimento do modelo**, não fonte externa. Ele tem data de corte e pode estar desatualizado ou errado.
- **Nunca conte essa raia no consenso das fontes externas.** Ela é contraste, não voto. "4 das 8 fontes dizem X" não inclui o modelo.
- Calibre o peso pelo tema: evergreen (princípios de copy, persuasão, fundamentos) → confiável; tema que muda rápido (ferramentas, features novas, dados recentes) → trate como fraco e diga isso explicitamente.
- É opcional e o usuário pode descartar na curadoria. Se ele preferir um estudo 100% baseado nas fontes que mandou, pule esta fase.

### Fase 2 — Análise (cruzar as fontes)

Agora leia o material e ache os padrões. Se forem muitas fontes ou muito longas, **não tente segurar tudo no contexto de uma vez**: dispare um subagent por fonte pra extrair uma "ficha" estruturada (principais ensinamentos + a postura daquela fonte em cada um), e só então agregue as fichas. Isso escala e mantém a rastreabilidade.

Monte o `agregado.md` organizado nestes blocos. **Todo ponto cita quais fontes o sustentam** (pelos números NN) — isso é o que dá confiança e deixa o usuário checar a origem:

- **Consenso** — o que (quase) todas as fontes ensinam igual. Provável fundamento do tema. Cite as fontes (ex.: "fontes 1, 3, 4, 6").
- **Divergências** — onde as fontes discordam ou orientam diferente. Mostre os dois (ou mais) lados e quem defende cada um. Não esconda a contradição nem escolha um lado sozinho; é aqui que o usuário decide.
- **Insights únicos** — pontos valiosos que só uma fonte trouxe. Marque que é de fonte única (menos validado, mas pode ser ouro).
- **Confronto com o conhecimento base** (se você fez a Fase 1.5) — onde as fontes **confirmam** a prática estabelecida, onde **contrariam** o senso comum (hot takes que merecem atenção) e o que é **genuinamente novo** que não estava na base. Deixe claro que o lado "base" é conhecimento do modelo, não fonte externa.
- **Lacunas / dúvidas** (opcional) — o que ficou sem resposta ou contraditório demais pra concluir. Inclua aqui o que as fontes **esqueceram** que, pela base, importaria.

Numere os pontos dentro de cada bloco, pra o usuário poder dizer "tira o 3, mantém o 5, junta o 7 com o 8".

Apresente esse agregado pro usuário **no chat**, de forma escaneável. Não despeje o arquivo inteiro cru; resuma os pontos de forma que ele consiga curar rápido.

### Fase 3 — Curadoria (o usuário decide)

O usuário manda o que fica, o que sai, o que reescrever, e adiciona a visão dele se quiser. Esta fase é dele, não tua: tu organiza e questiona, mas quem corta é ele.

Itere até ele estar satisfeito. Então consolide a versão final em `aprendizado.md` — **o resumão do que foi aprendido**, não a discussão. É um documento limpo, em tom didático e direto, que serve de base pra aplicar o conhecimento depois (ou virar skill). Estrutura sugerida:

```markdown
# Aprendizado: <tema>

> Destilado de N fontes em <data>. Fontes em `fontes.md`.

## Em uma frase
<a tese central do que se aprendeu>

## Princípios (o que é consenso e dá pra confiar)
1. <princípio> — <por que importa>
2. ...

## Decisões em aberto (onde as fontes discordam e você escolhe)
- <tema da divergência>: opção A (fontes X) vs opção B (fontes Y). Quando usar cada uma.

## Ouro de fonte única (menos validado, vale testar)
- <insight> (fonte N)

## Como aplicar
<passos práticos / checklist pra usar isso na prática>
```

#### Gerar o HTML (faça sempre, não pergunte)

Markdown é bom pra editar e ruim pra ler de ponta a ponta. Assim que o `aprendizado.md`
estiver fechado, gere a versão de leitura:

```bash
python3 scripts/montar_html.py Aprendizados/<slug>/aprendizado.md
```

Sai um `aprendizado.html` do lado, arquivo único e sem link externo: abre offline e
sobrevive a mandar por email ou WhatsApp. O que ele acrescenta:

- **Citação vira link.** "(fontes 1, 3, 4)" no md é texto morto. No HTML vira chip que
  leva pra fonte, com título e URL. É a rastreabilidade da skill ficando utilizável.
- **As fontes entram no documento**, lidas do frontmatter de `fontes/`. Fonte que falhou
  aparece marcada, pra ninguém achar que o estudo cobriu o que não cobriu.
- **Índice lateral** e blocos com peso visual por grau de confiança (consenso, divergência
  e aposta de fonte única não são a mesma coisa).

Depois de gerar, ofereça abrir: `open <caminho>` no Mac, `xdg-open` no Linux.

**O markdown continua sendo a fonte de verdade.** Mudou algo? Edite o `.md` e rode o
script de novo. Nunca edite o HTML à mão: a próxima geração sobrescreve.

Se o script falhar por qualquer motivo, entregue o markdown e siga. Não trave o estudo
por causa do HTML.

### Fase 4 — Oferecer virar skill

Quando o `aprendizado.md` estiver pronto, **ofereça** transformar em skill: "Quer que eu vire isso numa skill `/<nome>` pra você usar quando for [aplicar o tema]?". Não force; pergunte.

Se o usuário topar:
- Use a skill `skill-creator` pra montar direito, passando o `aprendizado.md` como base de conhecimento da nova skill.
- Pergunte o nome e o escopo (genérica, sem marca, pra compartilhar; ou específica do uso dele). Defina o `description` puxando os gatilhos reais (ex.: "quando for escrever uma landing page de infoproduto...").
- A nova skill encapsula o *como fazer* destilado das fontes — vira uma ferramenta reutilizável, não só um documento.

## Princípios ao longo do processo

- **Rastreabilidade acima de tudo.** Toda afirmação no agregado e no aprendizado aponta pra fonte. Se tu não consegue dizer de onde veio, não é aprendizado validado — é chute.
- **Não invente consenso.** Se só 2 de 8 fontes falam de algo, não promova a "fundamento". Seja honesto sobre o quão sustentado cada ponto está.
- **Preserve as palavras das fontes onde importa.** Em divergências, vale citar como cada criador formula a posição dele, não só tua paráfrase.
- **O usuário é o juiz.** Tu agrega e organiza; ele decide a doutrina. Nunca pule a curadoria.
- **Falha de uma fonte não derruba o estudo.** Registra e segue.

## Tom

Neutro e direto, sem marca de cliente/empresa (a skill é pra ser compartilhável). Sem travessões na escrita. Português do Brasil com acentos.
