# 🧠 Aprender (Ratos de IA)

Uma skill de Claude Code que estuda um tema por você a partir de **muitas fontes ao mesmo tempo**.

Em vez de assistir 8 vídeos e ler 4 artigos, você manda os links. Ela transcreve tudo, cruza as fontes pra achar o que elas ensinam em comum, onde discordam e o que só uma trouxe. Aí te mostra esse mapa pra **você decidir** o que vira doutrina e o que sai fora.

No fim, ela oferece transformar o que foi aprendido numa skill nova sobre o assunto.

## A ideia por trás

**Uma fonte sozinha mente por omissão.**

Cada criador tem um viés, um framework favorito, um caso que deu certo pra ele. O valor não está em nenhuma fonte isolada, está no cruzamento:

- o que aparece em **todo mundo** provavelmente é fundamento
- onde eles **discordam** é onde mora a nuance, e a decisão é sua
- o que só **um** trouxe pode ser ouro, mas está menos validado

A skill torna esse cruzamento visível e rastreável. Todo ponto diz qual fonte o sustenta, pra você poder conferir a origem.

## O que ela faz

- **Descobre as fontes** se você só deu o tema (e te mostra a lista pra aprovar antes de gastar tempo transcrevendo)
- **Transcreve YouTube** pela legenda, sem baixar o vídeo (rápido e leve)
- **Captura artigo, doc e post do X/Twitter** também, não só vídeo
- **Roda em paralelo**: várias fontes sendo capturadas ao mesmo tempo
- **Preserva a transcrição bruta** de cada vídeo, que fica sua pra reusar depois (cortes, citações, outro estudo)
- **Escreve o que o modelo já sabe do tema ANTES de ler as fontes**, pra ter uma raia independente de comparação
- **Cruza tudo** em consenso / divergências / insights únicos / lacunas
- **Te coloca como juiz**: você corta, mantém, reescreve, adiciona a sua visão
- **Entrega em dois formatos**: `aprendizado.md` pra editar e `aprendizado.html` pra ler, com as citações clicáveis
- **Oferece virar skill** no fim

## Como fica organizado

Tudo é salvo numa pasta `Aprendizados/<tema>/` na raiz onde você abriu o Claude Code:

```
Aprendizados/<tema>/
├── transcricoes/      # transcrição BRUTA de cada vídeo (texto cru, seu pra reusar)
├── fontes/            # ficha de análise de cada fonte
├── fontes.md          # índice (link, tipo, se capturou ou falhou)
├── agregado.md        # o cruzamento (consenso / divergências / insights)
├── aprendizado.md     # o resumão final, curado por você  ← a entrega
└── aprendizado.html   # o mesmo, pronto pra ler
```

O HTML sai junto, sem você pedir. É o mesmo conteúdo, mas legível: **"(fontes 1, 3, 4)" vira chip clicável** que leva pra fonte com título e link, as fontes ficam no fim do próprio documento, tem índice lateral, e cada bloco tem peso visual pelo grau de confiança (consenso não se parece com aposta de fonte única).

Arquivo único, sem link externo: abre offline e sobrevive a mandar por WhatsApp. O markdown continua sendo a fonte de verdade, então edite lá e gere de novo.

## Instalação

1. Baixe o zip na plataforma da Ratos de IA
2. Descompacte dentro de `~/.claude/skills/`
3. Abra o Claude Code e chame a skill

O zip já vem com a pasta no nome certo.

## Primeira vez: um setup de 2 minutos

Na primeira execução ela faz um setup conversacional. Não é pra destravar a skill (ela já funciona), é pra te mostrar o teto dela.

Ela checa o que você já tem, avisa se falta o `yt-dlp`, e te oferece três upgrades opcionais de uma vez:

| Upgrade | O que destrava | Custo |
|---|---|---|
| skill `transcribe` (baixa o zip na plataforma, do lado desta) | vídeo **sem legenda**, e TikTok / Instagram / X | grátis |
| **DataForSEO** | quando você dá só o tema, ela busca no **YouTube de verdade**, ordenado por views, em vez de busca comum na web | API paga, tem crédito de teste, cada busca custa centavos |
| `skill-creator` (plugin oficial da Anthropic) | monta a skill nova da Fase 4 com rigor | grátis |

Você diz quais quer. Se pedir o DataForSEO, ela te guia pra criar a conta, pega o login e a senha de API, salva num `.env` com permissão `600` e **valida a chave antes de dizer que deu certo**.

Se você disser "nenhum", ela grava isso, segue pelo caminho de fallback e **não pergunta de novo**. Dá pra ligar depois a qualquer momento, é só pedir.

### A única dependência de verdade

**`yt-dlp`**, pra puxar legenda do YouTube:

```bash
brew install yt-dlp     # Mac
pip install yt-dlp      # qualquer sistema
```

Sem ele a skill ainda estuda artigo, doc e post do X. Ela avisa e segue.

## Uso

É só conversar:

> "Aprende sobre copy de landing page de infoproduto pra mim"

> "Estuda esses 8 vídeos e me diz o que eles ensinam em comum: [cola os links]"

> "Destila esses artigos sobre precificação de SaaS"

> "Quero aprender sobre nutrição esportiva sem assistir tudo isso aqui"

Se você não mandar links, ela busca as fontes e te mostra os candidatos antes de transcrever qualquer coisa. Fonte ruim contamina o estudo inteiro, então quem aprova é você.

## O que ela NÃO faz

- **Não decide por você.** A curadoria é uma fase obrigatória do fluxo. Ela agrega e organiza; você corta.
- **Não inventa consenso.** Se só 2 de 8 fontes falam de algo, ela não promove a "fundamento". Diz que são 2.
- **Não esconde contradição.** Onde as fontes brigam, ela mostra os dois lados e quem defende cada um.

---

## Feito com Claude Code, nos cursos da Ratos de IA

Essa skill nasceu dentro do universo da **[Ratos de IA](https://ratosdeia.com.br)**, a escola de IA aplicada da DobraLabs. Se você quer aprender a construir skills e automações assim (do zero, mesmo sem ser programador), é lá:

- **Claude Code OS** — monte seu sistema operacional de trabalho com IA no Claude Code
- **Generalista de IA** — do "usar" ao "construir" com IA
- **Comunidade Ratos de IA** — todos os cursos + fórum + suporte

👉 **[ratosdeia.com.br](https://ratosdeia.com.br)**

Feito pela [DobraLabs](https://dobralabs.com.br). 🐀
