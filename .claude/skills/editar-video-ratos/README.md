# Editar Video Ratos

> Skill de Claude Code feita pela [**Ratos de IA**](https://ratosdeia.com.br), parte do curso [**Claude Code OS**](https://ratosdeia.com.br/claudeos/).

Limpa a gravacao bruta de um video e devolve um corte pronto pra publicar: erros
fora, pausa aparada, troca de camera montada.

Funciona pra qualquer tipo de video falado (aula, review, tutorial, video ensaio) e
com dois editores: **Palmier Pro** (Mac, com GUI) ou **video-use** (ffmpeg,
headless, qualquer OS).

## A ideia

Editar video e chato porque tu grava, erra, e depois tem que **caçar o erro** numa
timeline de 30 minutos.

Essa skill vira o problema do avesso: **tu marca o erro falando, na hora.** Errou,
fala o marcador, respira, refaz a frase. Nao para a gravacao, nao anota timecode,
nao pensa em edicao enquanto grava. Depois a skill acha os marcadores na
transcricao, descobre onde cada corte comeca e termina, e aplica.

O marcador e teu. O default do exemplo e "pato amarelo", que funciona por um motivo
concreto: e absurdo o suficiente pra tu nunca falar por acaso no meio do conteudo, e
tem duas silabas fortes que qualquer transcricao pega. "corta" ou "erro" seriam
ruins, tu ia falar sem querer e perder pedaco de video bom.

Da pra ter dois niveis: um que volta pouco (uma frase) e outro que volta muito (as
vezes o bloco inteiro). Na primeira execucao a skill te ajuda a escolher.

## O que ela faz

1. **Marcadores** — acha os erros que tu marcou falando e resolve as fronteiras de
   cada corte, cortando em fronteira de frase. O match e fuzzy de proposito: todo
   ASR erra o marcador ("pato amarelo" ja saiu como "praato amarel"), e marcador
   perdido e erro que vaza pro video final.
2. **Silencio** — apara pausa e dead-air medindo o **audio de verdade** com
   `ffmpeg silencedetect`, nunca a transcricao (o ASR infla a duracao das palavras e
   esconde o silencio real).
3. **Multicam** — se tu gravou tela e rosto ao mesmo tempo, monta a troca de camera.
   Nao e picture-in-picture: e troca de fonte, o que so funciona se as gravacoes
   forem o mesmo take. A skill confere isso antes.
4. **Redundancia** — pulada por padrao, sob demanda quando tu pedir.
5. **Verificacao** — re-transcreve o resultado e confirma que nao sobrou marcador.
   Nao e paranoia: o som do marcador comeca antes do timestamp que o ASR reporta,
   entao pedaco de marcador vaza mesmo cortando no tempo certo. So a verificacao pega.

## Instalacao

```bash
# 1. Clonar o repo
git clone `editar-video-ratos`

# 2. Copiar a skill para a pasta do Claude Code
cp -r editar-video-ratos ~/.claude/skills/editar-video-ratos

# 3. Precisa de ffmpeg
brew install ffmpeg     # mac
# sudo apt install ffmpeg   # linux

# 4. Abre o Claude Code e diz "edita esse video aqui"
```

Na primeira execucao a skill faz um **setup conversacional**: qual e o teu marcador,
quantos niveis, nivel de silencio, backend. Fica gravado no `config.json` e ela nao
pergunta de novo.

### Escolher o backend

Precisa de **um** dos dois:

**video-use** (recomendado se tu nao tem Mac ou nao quer app pago):
```bash
git clone https://github.com/browser-use/video-use ~/.claude/skills/video-use
cd ~/.claude/skills/video-use && pip install -e .
```

**Palmier Pro** (Mac): instala o app e conecta o MCP `palmier-pro`. Vale se tu quer
revisar o corte com o olho antes de exportar e ficar com um projeto editavel.

### Transcricao

Funciona **sem chave nenhuma**, com Whisper local:
```bash
pip install openai-whisper
```

Sem GPU o Whisper demora mais ou menos a duracao do video, e os timestamps por
palavra dele derrapam mais que os de API paga. Nenhum dos dois e impeditivo aqui:
o silencio vem do ffmpeg e nao da transcricao, os cortes levam margem, e tem passe
de verificacao no fim. Mas se tu edita video toda semana, uma chave paga
(AssemblyAI, ~US$0.12/hora) sai mais rapido e mais preciso. Poe no `.env` e a skill
usa sozinha.

## Skills relacionadas

- **`cortes-video-ratos`** — pega o
  video longo e transforma em cortes curtos com hook pra TikTok/Reels.
- **`transcribe`** — transcreve video de
  YouTube, Instagram, TikTok e 1000+ sites.

## Creditos

O backend headless usa a skill [**video-use**](https://github.com/browser-use/video-use)
da [Browser Use](https://browser-use.com), MIT. Essa skill dirige ela, nao a
substitui: as regras de correctness dela (subtitle por ultimo, fade na emenda,
extract por segmento) valem e sao muito boas. Se tu edita video por IA, le o
`SKILL.md` dela tambem.

## Licenca

CC BY 4.0. Usa, adapta, vende o que tu fizer com ela. So credita a origem.
